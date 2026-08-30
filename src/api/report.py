"""
src/api/report.py
Clinical Report Generator — builds a one-page PDF summary of an IPE analysis,
with a QR code linking back to the app, for the patient to bring to a doctor.

IMPORTANT: split into two endpoints (generate + fetch-by-id) instead of
returning the PDF bytes directly from the POST. This is specifically to
dodge download-manager software (e.g. IDM) that hooks the browser's
fetch()/XHR to intercept binary responses — the POST here only ever
returns small JSON, and the actual PDF bytes are retrieved via a plain
browser navigation (GET, opened via window.open), which those hooks
don't intercept the same way.
"""

import base64
import io
import logging
import time
import uuid
from datetime import datetime

import qrcode
from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import Response
from pydantic import BaseModel
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image as RLImage,
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER

logger = logging.getLogger(__name__)
router = APIRouter()

# ── In-memory store: report_id -> (pdf_bytes, created_at) ────────────────
# Fine for a student project / single-server setup. Entries expire after
# 1 hour so this doesn't grow forever during long dev sessions.
_REPORTS: dict[str, tuple[bytes, float]] = {}
_TTL_SECONDS = 60 * 60


def _cleanup_expired():
    now = time.time()
    expired = [k for k, (_, ts) in _REPORTS.items() if now - ts > _TTL_SECONDS]
    for k in expired:
        _REPORTS.pop(k, None)


class ReportRequest(BaseModel):
    patient_name: str = "Patient"
    class_name: str
    confidence: float
    ppi: float
    pain_label: str
    fis_speech: float
    fis_swallow: float
    fis_mouth: float
    erythema: float
    ulceration: float
    texture: float
    physio: float
    urgency: str
    treatment: dict = {}          # kept for backward compatibility, no longer shown
    visits: list[dict] = []       # optional visit history for the Progress Summary section


def _severity_color(name: str) -> colors.Color:
    mapping = {
        "Normal": colors.HexColor("#2ECC91"),
        "Variation from Normal": colors.HexColor("#F5C242"),
        "OPMD": colors.HexColor("#FF9F43"),
        "Oral Cancer": colors.HexColor("#E8483A"),
    }
    return mapping.get(name, colors.HexColor("#159E92"))


def _make_qr_image(data: str) -> RLImage:
    qr = qrcode.QRCode(box_size=6, border=2)
    qr.add_data(data)
    qr.make(fit=True)
    img = qr.make_image(fill_color="#153238", back_color="white")
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    buf.seek(0)
    return RLImage(buf, width=28 * mm, height=28 * mm)


def build_pdf(req: ReportRequest, report_url: str) -> bytes:
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer, pagesize=A4,
        topMargin=18 * mm, bottomMargin=18 * mm,
        leftMargin=18 * mm, rightMargin=18 * mm,
    )

    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        "TitleTeal", parent=styles["Title"],
        textColor=colors.HexColor("#0E5C54"), fontSize=20, spaceAfter=2,
    )
    label_style = ParagraphStyle(
        "LabelSmall", parent=styles["Normal"],
        fontSize=8.5, textColor=colors.HexColor("#5B7A80"), spaceAfter=2,
    )
    value_style = ParagraphStyle(
        "ValueBig", parent=styles["Normal"],
        fontSize=13, textColor=colors.HexColor("#153238"), spaceAfter=8,
    )
    section_style = ParagraphStyle(
        "Section", parent=styles["Heading2"],
        fontSize=12, textColor=colors.HexColor("#0E5C54"), spaceBefore=10, spaceAfter=6,
    )
    bullet_style = ParagraphStyle(
        "Bullet", parent=styles["Normal"], fontSize=9.5,
        textColor=colors.HexColor("#153238"), leftIndent=10, spaceAfter=3,
    )
    footer_style = ParagraphStyle(
        "Footer", parent=styles["Normal"], fontSize=8,
        textColor=colors.HexColor("#93ACAF"), alignment=TA_CENTER,
    )

    label_center_style = ParagraphStyle(
        "LabelCenter", parent=label_style, alignment=TA_CENTER, fontSize=7,
    )
    elements = []
    header_table = Table(
        [
            [Paragraph("IPE Framework — Clinical Report", title_style), _make_qr_image(report_url)],
            ["", Paragraph("Scan to view on any device<br/>(valid 1 hour)", label_center_style)],
        ],
        colWidths=[130 * mm, 30 * mm],
    )
    header_table.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("ALIGN", (1, 0), (1, 0), "RIGHT"),
    ]))
    elements.append(header_table)
    elements.append(Paragraph(
        f"Generated {datetime.now().strftime('%d %b %Y, %H:%M')} &nbsp;·&nbsp; Patient: {req.patient_name}",
        label_style,
    ))
    elements.append(Spacer(1, 10))

    sev_color = _severity_color(req.class_name)
    diag_table = Table(
        [[
            Paragraph(f"<b>{req.class_name}</b><br/>{req.confidence}% confidence", value_style),
            Paragraph(f"<b>Urgency</b><br/>{req.urgency}", value_style),
        ]],
        colWidths=[95 * mm, 65 * mm],
    )
    diag_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#F1EEFB")),
        ("BOX", (0, 0), (-1, -1), 0.75, sev_color),
        ("LEFTPADDING", (0, 0), (-1, -1), 10),
        ("TOPPADDING", (0, 0), (-1, -1), 8),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
    ]))
    elements.append(diag_table)
    elements.append(Spacer(1, 12))

    elements.append(Paragraph("Pain Assessment (PPI)", section_style))
    elements.append(Paragraph(f"<b>{req.ppi:.1f} / 10</b> — {req.pain_label}", value_style))
    pain_rows = [
        ["Erythema (redness)", f"{req.erythema * 100:.0f}%"],
        ["Ulceration (sores)", f"{req.ulceration * 100:.0f}%"],
        ["Texture (stiffness)", f"{req.texture * 100:.0f}%"],
        ["Pathological signal", f"{(1 - req.physio) * 100:.0f}%"],
    ]
    pain_table = Table(pain_rows, colWidths=[100 * mm, 30 * mm])
    pain_table.setStyle(TableStyle([
        ("FONTSIZE", (0, 0), (-1, -1), 9.5),
        ("TEXTCOLOR", (0, 0), (-1, -1), colors.HexColor("#153238")),
        ("LINEBELOW", (0, 0), (-1, -2), 0.4, colors.HexColor("#EAF6F3")),
        ("TOPPADDING", (0, 0), (-1, -1), 4),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
    ]))
    elements.append(pain_table)

    elements.append(Paragraph("Functional Impact (FIS)", section_style))
    fis_rows = [
        ["Speech", f"{req.fis_speech * 100:.0f}%"],
        ["Swallowing", f"{req.fis_swallow * 100:.0f}%"],
        ["Mouth opening", f"{req.fis_mouth * 100:.0f}%"],
    ]
    fis_table = Table(fis_rows, colWidths=[100 * mm, 30 * mm])
    fis_table.setStyle(TableStyle([
        ("FONTSIZE", (0, 0), (-1, -1), 9.5),
        ("TEXTCOLOR", (0, 0), (-1, -1), colors.HexColor("#153238")),
        ("LINEBELOW", (0, 0), (-1, -2), 0.4, colors.HexColor("#EAF6F3")),
        ("TOPPADDING", (0, 0), (-1, -1), 4),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
    ]))
    elements.append(fis_table)

    elements.append(Paragraph("Progress Summary", section_style))
    if req.visits and len(req.visits) >= 2:
        rows = [["Date", "Diagnosis", "PPI", "Trend"]]
        prev_ppi = None
        for v in req.visits:
            ppi_val = float(v.get("ppi", 0))
            if prev_ppi is None:
                trend = "—"
            else:
                diff = ppi_val - prev_ppi
                trend = "↓ improving" if diff < 0 else ("↑ worsening" if diff > 0 else "→ stable")
            rows.append([
                str(v.get("date", "")),
                str(v.get("classification", "")),
                f"{ppi_val:.1f}",
                trend,
            ])
            prev_ppi = ppi_val
        visits_table = Table(rows, colWidths=[35 * mm, 55 * mm, 20 * mm, 30 * mm])
        visits_table.setStyle(TableStyle([
            ("FONTSIZE", (0, 0), (-1, -1), 9),
            ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
            ("TEXTCOLOR", (0, 0), (-1, -1), colors.HexColor("#153238")),
            ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#EAF6F3")),
            ("LINEBELOW", (0, 0), (-1, 0), 0.75, colors.HexColor("#159E92")),
            ("LINEBELOW", (0, 1), (-1, -2), 0.4, colors.HexColor("#EAF6F3")),
            ("TOPPADDING", (0, 0), (-1, -1), 5),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
        ]))
        elements.append(visits_table)
    elif req.visits and len(req.visits) == 1:
        elements.append(Paragraph(
            "One prior visit recorded. A trend will appear here once a second visit is logged.",
            bullet_style,
        ))
    else:
        elements.append(Paragraph(
            "This is the first recorded visit for this patient. Progress will be tracked "
            "here across future visits.",
            bullet_style,
        ))

    elements.append(Spacer(1, 14))
    elements.append(Paragraph(
        "This AI-generated report is intended to assist clinicians and does not "
        "replace a professional diagnosis. Please confirm findings with a doctor.",
        footer_style,
    ))

    doc.build(elements)
    buffer.seek(0)
    return buffer.read()


@router.post("/report/generate")
async def generate_report(req: ReportRequest, request: Request):
    """Builds the PDF and returns it as base64 directly inside the JSON
    response, alongside a stored id (kept as a fallback route). Embedding
    the bytes in the first response means there's no second application/pdf
    network request at all — nothing shaped like a "download" for a
    network-level interceptor (e.g. IDM) to catch, since IDM's detection
    keys off response Content-Type/Content-Disposition/extension, none of
    which apply to a JSON response with a base64 string field."""
    _cleanup_expired()
    report_id = uuid.uuid4().hex
    # Built from the incoming request's own host, so this works whether the
    # API is reached at localhost during dev or a real LAN/public address —
    # a doctor's phone scanning the QR needs a URL it can actually reach.
    report_url = str(request.base_url).rstrip("/") + f"/report/{report_id}"
    pdf_bytes = build_pdf(req, report_url)
    _REPORTS[report_id] = (pdf_bytes, time.time())
    return {
        "report_id": report_id,
        "pdf_base64": base64.b64encode(pdf_bytes).decode("ascii"),
    }


@router.get("/report/{report_id}")
async def fetch_report(report_id: str):
    """Serves the actual PDF. Meant to be opened via a plain browser
    navigation (window.open(url), not fetch()), and with `inline` disposition
    so the browser shows it in a tab rather than triggering a file download —
    both of which avoid the IDM-style download-interceptor hook."""
    entry = _REPORTS.get(report_id)
    if not entry:
        raise HTTPException(status_code=404, detail="Report not found or expired.")
    pdf_bytes, _ = entry
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f'inline; filename="IPE_Report_{datetime.now().strftime("%Y%m%d")}.pdf"'},
    )