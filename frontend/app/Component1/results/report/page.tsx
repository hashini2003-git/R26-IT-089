"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { C, FONT, Glass, Icon, Screen, TabBar, TopBar, loadResult, type IpeResult } from "../../_lib/ipe-ui";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export default function ReportPage() {
  const router = useRouter();
  const [result, setResult] = useState<IpeResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const r = loadResult();
    if (!r) { router.replace("/Component1"); return; }
    setResult(r);
  }, [router]);

  if (!result) return null;

  async function downloadReport() {
    if (!result) return;
    setLoading(true);
    setError(null);
    try {
      // Step 1: small JSON-only POST — generates the PDF server-side and
      // returns just an id. No binary passes through fetch() here, which
      // is specifically what download-manager extensions like IDM hook.
      const res = await fetch(`${API}/report/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patient_name: "Patient",
          class_name: result.classification.name,
          confidence: result.classification.confidence,
          ppi: result.ppi.score,
          pain_label: result.ppi.label,
          fis_speech: result.fis.speech,
          fis_swallow: result.fis.swallowing,
          fis_mouth: result.fis.mouth,
          erythema: result.visual_features.erythema,
          ulceration: result.visual_features.ulceration,
          texture: result.visual_features.texture,
          physio: result.visual_features.physio,
          urgency: result.urgency.timeframe,
          visits: (() => {
            try {
              const raw = localStorage.getItem("ipe_visits");
              return raw ? JSON.parse(raw) : [];
            } catch { return []; }
          })(),
        }),
      });
      if (!res.ok) {
        const err = await res.text();
        throw new Error(`Server error ${res.status}: ${err}`);
      }
      const data = await res.json();

      // Store the PDF bytes locally (already have them from this response —
      // no second network request needed at all). The viewer page reads
      // this and renders it as a data: URI iframe.
      sessionStorage.setItem("ipe_report_pdf_base64", data.pdf_base64);

      router.push(`/Component1/results/report/view`);
      setDone(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not generate report.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Screen>
      <TopBar title="Clinical Report" subtitle="Download & share with your doctor" />

      <Glass style={{ marginBottom: 14, textAlign: "center", padding: "30px 20px" }}>
        <div style={{
          width: 72, height: 72, borderRadius: 20, margin: "0 auto 16px",
          background: `linear-gradient(140deg, ${C.teal}, ${C.lavender})`,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <Icon name="document" size={30} color="#fff" strokeWidth={1.6} />
        </div>
        <div style={{ fontSize: 16, fontWeight: 700, color: C.ink, marginBottom: 4 }}>
          One-page clinical summary
        </div>
        <div style={{ fontSize: 12.5, color: C.inkMuted, marginBottom: 20, lineHeight: 1.6 }}>
          Includes diagnosis, pain &amp; function scores, urgency, and your visit history —
          with a QR code your doctor can scan for the full analysis.
        </div>
        <button
          onClick={downloadReport}
          disabled={loading}
          style={{
            width: "100%", padding: "15px", border: "none", borderRadius: 16,
            fontSize: 14.5, fontWeight: 700, color: "#fff", fontFamily: FONT,
            background: loading ? "#B9C6C7" : `linear-gradient(135deg, ${C.teal}, #0E8478)`,
            cursor: loading ? "not-allowed" : "pointer",
            boxShadow: loading ? "none" : `0 10px 26px ${C.teal}45`,
          }}
        >
          {loading ? "Generating…" : done ? "Opened — Open again" : "Open PDF report"}
        </button>
      </Glass>

      {error && (
        <Glass style={{ marginBottom: 14 }}>
          <div style={{ color: "#E8483A", fontSize: 13, fontWeight: 600 }}>{error}</div>
        </Glass>
      )}

      <Glass style={{ marginBottom: 90 }}>
        <div style={{ fontSize: 12.5, color: C.inkMuted, lineHeight: 1.6 }}>
          Bring this report to your appointment, or share the PDF directly — the QR code inside
          links to your full analysis so your doctor doesn't need to log in.
        </div>
      </Glass>

      <TabBar active="results" />
    </Screen>
  );
}