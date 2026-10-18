"""
build_catalogue.py — Build a unified metadata CSV from all processed audio.

Output columns:
    file_id, file_path, dataset, speaker_id, disorder, severity,
    label_voice_quality, label_stuttering, label_dysarthria,
    duration_s, sample_rate, split (empty until make_splits runs)
"""

import argparse
import hashlib
import logging
import sys
from pathlib import Path

import librosa
import pandas as pd
from tqdm import tqdm


def setup_logging(log_path: str) -> logging.Logger:
    Path(log_path).parent.mkdir(parents=True, exist_ok=True)
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s  %(levelname)-7s  %(message)s",
        handlers=[logging.StreamHandler(sys.stdout), logging.FileHandler(log_path)],
    )
    return logging.getLogger(__name__)


# ── Dataset-specific metadata parsers ────────────────────────────────────────

def parse_mdvr_kcl(fname: str) -> dict:
    """MDVR-KCL: Parkinson's read/spontaneous speech."""
    return {
        "dataset": "mdvr_kcl",
        "disorder": "parkinsons",
        "severity": "moderate",
        "label_voice_quality": 1,
        "label_stuttering": 0,
        "label_dysarthria": 0,
        "speaker_id": f"mdvr_{fname[:6]}",
    }


def parse_dysarthria_hf(fname: str) -> dict:
    """dysarthria_hf: dysarthric vs normal speech."""
    is_dys = "dysarthria" in fname.lower()
    return {
        "dataset": "dysarthria_hf",
        "disorder": "dysarthria" if is_dys else "healthy",
        "severity": "moderate" if is_dys else "none",
        "label_voice_quality": 0,
        "label_stuttering": 0,
        "label_dysarthria": 1 if is_dys else 0,
        "speaker_id": f"dys_{fname[:8]}",
    }


def parse_italian_parkinsons(fname: str, fpath: Path) -> dict:
    """Italian Parkinson's: folder name encodes group."""
    parts = str(fpath).lower()
    if "parkinson" in parts:
        disorder, severity, vq = "parkinsons", "moderate", 1
    elif "elderly" in parts:
        disorder, severity, vq = "healthy_elderly", "none", 0
    else:
        disorder, severity, vq = "healthy_young", "none", 0
    return {
        "dataset": "italian_parkinsons",
        "disorder": disorder,
        "severity": severity,
        "label_voice_quality": vq,
        "label_stuttering": 0,
        "label_dysarthria": 0,
        "speaker_id": f"it_{fpath.stem[:10]}",
    }


def parse_fluencybank(fname: str) -> dict:
    """FluencyBank: stuttering dataset."""
    return {
        "dataset": "fluencybank",
        "disorder": "stuttering",
        "severity": "mild",
        "label_voice_quality": 0,
        "label_stuttering": 1,
        "label_dysarthria": 0,
        "speaker_id": f"fb_{fname[3:8]}",
    }


def parse_torgo(fname: str) -> dict:
    """TORGO: dysarthric speakers."""
    return {
        "dataset": "torgo",
        "disorder": "dysarthria",
        "severity": "moderate",
        "label_voice_quality": 0,
        "label_stuttering": 0,
        "label_dysarthria": 1,
        "speaker_id": f"torgo_{fname[6:12]}",
    }


def parse_voiced(fname: str) -> dict:
    """VOICED: dysphonic vs healthy voices."""
    return {
        "dataset": "voiced",
        "disorder": "dysphonia",
        "severity": "mild",
        "label_voice_quality": 1,
        "label_stuttering": 0,
        "label_dysarthria": 0,
        "speaker_id": f"voiced_{fname[:8]}",
    }


def infer_metadata(wav_path: Path) -> dict:
    """Route to the correct parser based on filename content/path."""
    fname = wav_path.name.lower()

    # Match by dataset prefix embedded in standardize output: <dataset>__<stem>__<hash>.wav
    if fname.startswith("mdvr_kcl__") or "__26-29" in fname or "readtext" in fname or "spontaneous" in fname:
        return parse_mdvr_kcl(fname)
    if fname.startswith("dysarthria_hf__"):
        return parse_dysarthria_hf(fname)
    if fname.startswith("italian_parkinsons__"):
        return parse_italian_parkinsons(fname, wav_path)
    # FluencyBank: stored in raw/fluencybank/wav/ → standardize tag is "wav", stem starts with fb_
    if "__fb_" in fname or fname.startswith("fb_"):
        return parse_fluencybank(fname)
    # TORGO: stored in raw/torgo/wav/ → standardize tag is "wav", stem starts with torgo_
    if "__torgo_" in fname or fname.startswith("torgo_"):
        return parse_torgo(fname)
    if fname.startswith("voiced__") or fname.startswith("voiced_") or "__voice" in fname:
        return parse_voiced(fname)

    # Fallback — unknown
    return {
        "dataset": "unknown",
        "disorder": "unknown",
        "severity": "unknown",
        "label_voice_quality": -1,
        "label_stuttering": -1,
        "label_dysarthria": -1,
        "speaker_id": wav_path.stem[:16],
    }


def get_duration(wav_path: Path) -> float:
    try:
        return librosa.get_duration(path=str(wav_path))
    except Exception:
        return 0.0


def main():
    parser = argparse.ArgumentParser(description="Build unified metadata catalogue")
    parser.add_argument("--audio-dir", required=True)
    parser.add_argument("--raw-dir",   default="raw")
    parser.add_argument("--output",    required=True)
    parser.add_argument("--log",       default="logs/ingest.log")
    parser.add_argument("--min-duration", type=float, default=0.5,
                        help="Skip files shorter than this (seconds)")
    args = parser.parse_args()

    logger = setup_logging(args.log)
    audio_dir = Path(args.audio_dir)
    out_path  = Path(args.output)
    out_path.parent.mkdir(parents=True, exist_ok=True)

    wav_files = sorted(audio_dir.glob("*.wav"))
    logger.info(f"Found {len(wav_files)} WAV files in {audio_dir}")

    rows = []
    for wav in tqdm(wav_files, desc="Building catalogue", unit="file"):
        dur = get_duration(wav)
        if dur < args.min_duration:
            logger.debug(f"SKIP (too short {dur:.2f}s): {wav.name}")
            continue

        meta = infer_metadata(wav)
        fid  = hashlib.md5(wav.name.encode()).hexdigest()[:10]

        rows.append({
            "file_id":            fid,
            "file_path":          str(wav),
            "filename":           wav.name,
            "dataset":            meta["dataset"],
            "speaker_id":         meta["speaker_id"],
            "disorder":           meta["disorder"],
            "severity":           meta["severity"],
            "label_voice_quality":meta["label_voice_quality"],
            "label_stuttering":   meta["label_stuttering"],
            "label_dysarthria":   meta["label_dysarthria"],
            "duration_s":         round(dur, 3),
            "sample_rate":        16000,
            "split":              "",
        })

    df = pd.DataFrame(rows)
    df.to_csv(str(out_path), index=False)

    logger.info(f"Catalogue saved → {out_path}  ({len(df)} rows)")
    logger.info(f"\nDataset breakdown:\n{df['dataset'].value_counts().to_string()}")
    logger.info(f"\nDisorder breakdown:\n{df['disorder'].value_counts().to_string()}")


if __name__ == "__main__":
    main()
