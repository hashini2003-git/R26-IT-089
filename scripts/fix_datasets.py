"""
fix_datasets.py — Post-download dataset fixup pipeline.

Steps:
  1. Italian Parkinson's — extract nested ZIP if not already done
  2. VOICED             — convert PhysioNet .dat → WAV (skips if HTML stub files)
  3. FluencyBank        — extract embedded audio bytes from parquet → WAV
  4. TORGO              — extract embedded audio bytes from parquet → WAV
"""

import io
import sys
import zipfile
from pathlib import Path

import numpy as np
import soundfile as sf

ROOT = Path(__file__).resolve().parent.parent
RAW  = ROOT / "raw"


# ── helpers ──────────────────────────────────────────────────────────────────

def is_html(path: Path) -> bool:
    """Return True if the file is an HTML stub (bad wget download)."""
    try:
        snippet = path.read_bytes()[:20].lower()
        return b"<!doc" in snippet or b"<html" in snippet
    except Exception:
        return False


def count_wavs(directory: Path) -> int:
    if not directory.exists():
        return 0
    return sum(1 for _ in directory.rglob("*.wav"))


# ── Step 1: Italian Parkinson's ZIP ──────────────────────────────────────────

def fix_italian_parkinsons():
    print("\n  [1/3] Italian Parkinson's extraction")
    base = RAW / "italian_parkinsons"
    existing = list(base.rglob("*.wav"))

    if len(existing) >= 800:
        print(f"        [SKIP] Already extracted — {len(existing)} WAV files found")
        return

    zip_path = base / "italian_parkinson" / "Italian Parkinson's Voice and speech.zip"
    if not zip_path.exists():
        print("        [WARN] No WAV files and no ZIP found — skipping")
        return

    out = base / "audio"
    out.mkdir(parents=True, exist_ok=True)
    print(f"        Extracting {zip_path.name} …")
    with zipfile.ZipFile(zip_path) as z:
        z.extractall(out)
    extracted = list(out.rglob("*.wav"))
    print(f"        [OK] {len(extracted)} WAV files → raw/italian_parkinsons/audio/")


# ── Step 2: VOICED PhysioNet .dat → WAV ──────────────────────────────────────

def fix_voiced():
    print("\n  [2/3] VOICED PhysioNet conversion")
    voiced_dir = RAW / "voiced" / "physionet.org" / "content" / "voiced" / "1.0.0"
    wav_out    = RAW / "voiced" / "wav"

    already = list(wav_out.glob("*.wav")) if wav_out.exists() else []
    if len(already) >= 60:
        print(f"        [SKIP] Already converted — {len(already)} WAV files")
        return

    dats = list(voiced_dir.glob("*.dat")) if voiced_dir.exists() else []
    if not dats:
        print("        [SKIP] VOICED not downloaded yet")
        return

    # Check if wget grabbed HTML stubs instead of real data
    if is_html(dats[0]):
        print("        [WARN] VOICED .dat files are HTML stubs (wget got web pages, not audio)")
        print("               Register free at https://physionet.org/register/ then run:")
        print()
        print("               wget -r -N -c -np \\")
        print("                    --user=YOUR_USER --password=YOUR_PASS \\")
        print("                    https://physionet.org/files/voiced/1.0.0/ \\")
        print("                    -P raw/voiced/")
        print()
        print("               Then re-run: make fix-datasets")
        return

    try:
        import wfdb
    except ImportError:
        print("        [ERROR] wfdb not installed — run: pip install wfdb")
        return

    wav_out.mkdir(parents=True, exist_ok=True)
    count = 0
    for dat in dats:
        wav_path = wav_out / (dat.stem + ".wav")
        if wav_path.exists():
            continue
        try:
            rec = wfdb.rdrecord(str(dat.with_suffix("")))
            sf.write(str(wav_path), rec.p_signal.astype(np.float32), rec.fs)
            count += 1
        except Exception as e:
            print(f"        [WARN] Skipping {dat.name}: {e}")

    print(f"        [OK] Converted {count} files → raw/voiced/wav/")


# ── Step 3: FluencyBank parquet → WAV ────────────────────────────────────────

def fix_fluencybank():
    print("\n  [3/4] FluencyBank parquet → WAV")
    src     = RAW / "fluencybank" / "hf_fluencybank" / "data"
    wav_out = RAW / "fluencybank" / "wav"

    already = list(wav_out.glob("*.wav")) if wav_out.exists() else []
    parquets = list(src.glob("*.parquet")) if src.exists() else []

    if not parquets:
        print("        [SKIP] No parquet files found")
        return

    if len(already) >= 800:
        print(f"        [SKIP] Already extracted — {len(already)} WAV files")
        return

    try:
        import pandas as pd
    except ImportError:
        print("        [ERROR] pandas not installed")
        return

    wav_out.mkdir(parents=True, exist_ok=True)
    count = 0
    for pq in parquets:
        df = pd.read_parquet(str(pq))
        for i, row in df.iterrows():
            wp = wav_out / f"fb_{i:05d}.wav"
            if wp.exists():
                continue
            audio = row.get("audio") if isinstance(row.get("audio"), dict) else None
            raw_bytes = audio.get("bytes") if audio else None
            if not raw_bytes:
                continue
            try:
                data, sr = sf.read(io.BytesIO(raw_bytes))
                sf.write(str(wp), data, sr)
                count += 1
            except Exception as e:
                print(f"        [WARN] Skipping row {i}: {e}")

    print(f"        [OK] Extracted {count} WAV files → raw/fluencybank/wav/")


# ── Step 4: TORGO parquet → WAV ──────────────────────────────────────────────

def fix_torgo():
    print("\n  [4/4] TORGO parquet → WAV")
    src     = RAW / "torgo" / "hf_torgo" / "data"
    wav_out = RAW / "torgo" / "wav"

    already = list(wav_out.glob("*.wav")) if wav_out.exists() else []
    parquets = list(src.glob("*.parquet")) if src.exists() else []

    if not parquets:
        print("        [SKIP] No parquet files found")
        return

    if len(already) >= 700:
        print(f"        [SKIP] Already extracted — {len(already)} WAV files")
        return

    try:
        import pandas as pd
    except ImportError:
        print("        [ERROR] pandas not installed")
        return

    wav_out.mkdir(parents=True, exist_ok=True)
    count = 0
    for pq in parquets:
        split = pq.stem.split("-")[0]  # train / test
        df = pd.read_parquet(str(pq))
        for i, row in df.iterrows():
            wp = wav_out / f"torgo_{split}_{i:05d}.wav"
            if wp.exists():
                continue
            audio = row.get("audio") if isinstance(row.get("audio"), dict) else None
            raw_bytes = audio.get("bytes") if audio else None
            if not raw_bytes:
                continue
            try:
                data, sr = sf.read(io.BytesIO(raw_bytes))
                sf.write(str(wp), data, sr)
                count += 1
            except Exception as e:
                print(f"        [WARN] Skipping row {i}: {e}")

    print(f"        [OK] Extracted {count} WAV files → raw/torgo/wav/")


# ── Summary ───────────────────────────────────────────────────────────────────

def summary():
    print("\n  ── Dataset summary ──────────────────────────────────────────")
    datasets = {
        "MDVR-KCL":            RAW / "mdvr_kcl",
        "Dysarthria HF":       RAW / "dysarthria_hf",
        "Italian Parkinson's": RAW / "italian_parkinsons",
        "VOICED (wav)":        RAW / "voiced" / "wav",
        "FluencyBank (wav)":   RAW / "fluencybank" / "wav",
        "TORGO (wav)":         RAW / "torgo" / "wav",
        "SEP-28k labels":      RAW / "sep28k",
        "UCI Parkinson":       RAW / "uci_parkinson_speech",
        "UCI Telemonitoring":  RAW / "uci_parkinson_telemonitoring",
    }
    total_wav = 0
    for name, path in datasets.items():
        if path.exists():
            n = count_wavs(path)
            total_wav += n
            status = "OK  " if n > 0 else "WARN"
            print(f"  [{status}] {name:<26} {n:>4} WAV files")
        else:
            print(f"  [    ] {name:<26}  not downloaded")
    print(f"\n  Total ready WAV files: {total_wav}")


# ── Main ─────────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    print("── Fixing datasets ─────────────────────────────────────────────")
    fix_italian_parkinsons()
    fix_voiced()
    fix_fluencybank()
    fix_torgo()
    summary()
    print("\n[OK] All dataset fixes complete.")
