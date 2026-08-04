# src/api/progress_routes.py
# Progress tracking using existing SQLite database

import logging
from datetime import datetime
from fastapi  import APIRouter, HTTPException
from pydantic import BaseModel
from src.api.db import get_db

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/progress", tags=["progress"])


# ── Schema init ───────────────────────────────────────────────
def init_visits_table():
    """Add visits table to existing SQLite DB."""
    conn = get_db()
    conn.executescript("""
        CREATE TABLE IF NOT EXISTS ipe_visits (
            id           INTEGER PRIMARY KEY AUTOINCREMENT,
            patient_id   TEXT    NOT NULL,
            visit_label  TEXT    NOT NULL DEFAULT 'Visit',
            visit_date   TEXT    NOT NULL,
            class_name   TEXT    NOT NULL,
            confidence   REAL    NOT NULL DEFAULT 0,
            ppi          REAL    NOT NULL DEFAULT 0,
            ppi_label    TEXT    NOT NULL DEFAULT '',
            fis_speech   REAL    NOT NULL DEFAULT 0,
            fis_swallow  REAL    NOT NULL DEFAULT 0,
            fis_mouth    REAL    NOT NULL DEFAULT 0,
            erythema     REAL    NOT NULL DEFAULT 0,
            ulceration   REAL    NOT NULL DEFAULT 0,
            texture      REAL    NOT NULL DEFAULT 0,
            physio       REAL    NOT NULL DEFAULT 0,
            urgency      TEXT    NOT NULL DEFAULT '',
            created_at   TEXT    NOT NULL,
            FOREIGN KEY (patient_id)
                REFERENCES patients(patient_id)
        );

        CREATE INDEX IF NOT EXISTS idx_visits_patient
            ON ipe_visits(patient_id, created_at);
    """)
    conn.commit()
    conn.close()
    logger.info("✅ ipe_visits table ready")


# ── Models ────────────────────────────────────────────────────
class VisitIn(BaseModel):
    patient_id  : str
    visit_label : str  = "Visit"
    class_name  : str
    confidence  : float
    ppi         : float
    ppi_label   : str
    fis_speech  : float
    fis_swallow : float
    fis_mouth   : float
    erythema    : float
    ulceration  : float
    texture     : float
    physio      : float
    urgency     : str  = ""


# ── Routes ────────────────────────────────────────────────────
@router.post("/save")
def save_visit(data: VisitIn):
    """Save one IPE visit to SQLite."""
    conn = get_db()
    try:
        conn.execute("""
            INSERT INTO ipe_visits
                (patient_id, visit_label, visit_date,
                 class_name, confidence, ppi, ppi_label,
                 fis_speech, fis_swallow, fis_mouth,
                 erythema, ulceration, texture, physio,
                 urgency, created_at)
            VALUES
                (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
        """, (
            data.patient_id,
            data.visit_label,
            datetime.utcnow().strftime("%Y-%m-%d"),
            data.class_name,
            data.confidence,
            data.ppi,
            data.ppi_label,
            data.fis_speech,
            data.fis_swallow,
            data.fis_mouth,
            data.erythema,
            data.ulceration,
            data.texture,
            data.physio,
            data.urgency,
            datetime.utcnow().isoformat(),
        ))
        conn.commit()
        vid = conn.execute("SELECT last_insert_rowid()").fetchone()[0]
        return {"success": True, "id": vid}
    except Exception as e:
        logger.error(f"save_visit error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()


@router.get("/history/{patient_id}")
def get_history(patient_id: str):
    """Get all visits for a patient ordered by date."""
    conn = get_db()
    try:
        rows = conn.execute("""
            SELECT * FROM ipe_visits
            WHERE patient_id = ?
            ORDER BY created_at ASC
        """, (patient_id,)).fetchall()
        visits = [dict(r) for r in rows]
        return {"success": True, "visits": visits, "count": len(visits)}
    except Exception as e:
        logger.error(f"get_history error: {e}")
        return {"success": False, "visits": [], "error": str(e)}
    finally:
        conn.close()


@router.delete("/visit/{visit_id}")
def delete_visit(visit_id: int):
    """Delete a visit by ID."""
    conn = get_db()
    try:
        conn.execute(
            "DELETE FROM ipe_visits WHERE id = ?",
            (visit_id,)
        )
        conn.commit()
        return {"success": True}
    except Exception as e:
        return {"success": False, "error": str(e)}
    finally:
        conn.close()


@router.delete("/history/{patient_id}")
def clear_history(patient_id: str):
    """Delete all visits for a patient."""
    conn = get_db()
    try:
        conn.execute(
            "DELETE FROM ipe_visits WHERE patient_id = ?",
            (patient_id,)
        )
        conn.commit()
        return {"success": True}
    except Exception as e:
        return {"success": False, "error": str(e)}
    finally:
        conn.close()


@router.get("/summary/{patient_id}")
def get_summary(patient_id: str):
    """Get progress summary stats for a patient."""
    conn = get_db()
    try:
        rows = conn.execute("""
            SELECT ppi, fis_speech, fis_swallow,
                   fis_mouth, erythema, ulceration,
                   texture, class_name, visit_date
            FROM ipe_visits
            WHERE patient_id = ?
            ORDER BY created_at ASC
        """, (patient_id,)).fetchall()

        if not rows:
            return {"success": True, "has_data": False}

        visits = [dict(r) for r in rows]
        first  = visits[0]
        last   = visits[-1]

        ppi_change  = first["ppi"] - last["ppi"]
        frs_first   = 1 - (first["fis_speech"] + first["fis_swallow"] + first["fis_mouth"]) / 3
        frs_last    = 1 - (last["fis_speech"]  + last["fis_swallow"]  + last["fis_mouth"])  / 3

        return {
            "success"      : True,
            "has_data"     : True,
            "total_visits" : len(visits),
            "first_visit"  : first["visit_date"],
            "last_visit"   : last["visit_date"],
            "first_ppi"    : round(first["ppi"], 2),
            "latest_ppi"   : round(last["ppi"],  2),
            "ppi_change"   : round(ppi_change,   2),
            "improving"    : ppi_change > 0,
            "frs_first"    : round(frs_first * 100, 1),
            "frs_latest"   : round(frs_last  * 100, 1),
            "ppi_series"   : [round(v["ppi"], 2) for v in visits],
            "erythema_series": [round(v["erythema"], 3) for v in visits],
            "ulcer_series" : [round(v["ulceration"], 3) for v in visits],
        }
    except Exception as e:
        logger.error(f"get_summary error: {e}")
        return {"success": False, "error": str(e)}
    finally:
        conn.close()