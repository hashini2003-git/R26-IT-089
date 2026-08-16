"""
extract_acoustic.py — Extract acoustic biomarkers per audio file.

Features extracted (per file):
  Pitch/F0:     mean, std, min, max, range
  Jitter:       local, absolute, RAP, PPQ5
  Shimmer:      local, local_dB, APQ3, APQ5, APQ11
  HNR:          harmonics-to-noise ratio
  MFCCs:        13 coefficients × (mean, std) = 26 features
  Delta-MFCCs:  13 coefficients × mean         = 13 features
  ZCR:          zero-crossing rate mean/std
  RMS energy:   mean/std
"""

import argparse
import logging
import sys
import warnings
from pathlib import Path

import librosa
import numpy as np
import pandas as pd
import parselmouth
from parselmouth.praat import call
from tqdm import tqdm

warnings.filterwarnings("ignore")


def setup_logging(log_path: str) -> logging.Logger:
    Path(log_path).parent.mkdir(parents=True, exist_ok=True)
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s  %(levelname)-7s  %(message)s",
        handlers=[logging.StreamHandler(sys.stdout), logging.FileHandler(log_path)],
    )
    return logging.getLogger(__name__)


# ── Praat-based features ──────────────────────────────────────────────────────

def extract_praat_features(wav_path: str) -> dict:
    """Extract jitter, shimmer, HNR, and F0 stats via Parselmouth/Praat."""
    feats = {}
    try:
        sound = parselmouth.Sound(wav_path)

        # Pitch
        pitch = call(sound, "To Pitch", 0.0, 75, 600)
        f0_values = pitch.selected_array["frequency"]
        f0_values = f0_values[f0_values > 0]  # voiced frames only
        if len(f0_values) > 0:
            feats["f0_mean"]   = float(np.mean(f0_values))
            feats["f0_std"]    = float(np.std(f0_values))
            feats["f0_min"]    = float(np.min(f0_values))
            feats["f0_max"]    = float(np.max(f0_values))
            feats["f0_range"]  = feats["f0_max"] - feats["f0_min"]
        else:
            for k in ["f0_mean", "f0_std", "f0_min", "f0_max", "f0_range"]:
                feats[k] = 0.0

        # Point process for jitter/shimmer
        point_process = call(sound, "To PointProcess (periodic, cc)", 75, 600)

        # Jitter
        feats["jitter_local"]  = call(point_process, "Get jitter (local)",        0, 0, 0.0001, 0.02, 1.3)
        feats["jitter_abs"]    = call(point_process, "Get jitter (local, absolute)", 0, 0, 0.0001, 0.02, 1.3)
        feats["jitter_rap"]    = call(point_process, "Get jitter (rap)",            0, 0, 0.0001, 0.02, 1.3)
        feats["jitter_ppq5"]   = call(point_process, "Get jitter (ppq5)",           0, 0, 0.0001, 0.02, 1.3)

        # Shimmer
        feats["shimmer_local"]    = call([sound, point_process], "Get shimmer (local)",        0, 0, 0.0001, 0.02, 1.3, 1.6)
        feats["shimmer_local_db"] = call([sound, point_process], "Get shimmer (local_dB)",     0, 0, 0.0001, 0.02, 1.3, 1.6)
        feats["shimmer_apq3"]     = call([sound, point_process], "Get shimmer (apq3)",         0, 0, 0.0001, 0.02, 1.3, 1.6)
        feats["shimmer_apq5"]     = call([sound, point_process], "Get shimmer (apq5)",         0, 0, 0.0001, 0.02, 1.3, 1.6)
        feats["shimmer_apq11"]    = call([sound, point_process], "Get shimmer (apq11)",        0, 0, 0.0001, 0.02, 1.3, 1.6)

        # HNR
        harmonicity = call(sound, "To Harmonicity (cc)", 0.01, 75, 0.1, 1.0)
        feats["hnr"] = call(harmonicity, "Get mean", 0, 0)

    except Exception as e:
        for k in ["f0_mean","f0_std","f0_min","f0_max","f0_range",
                  "jitter_local","jitter_abs","jitter_rap","jitter_ppq5",
                  "shimmer_local","shimmer_local_db","shimmer_apq3","shimmer_apq5","shimmer_apq11",
                  "hnr"]:
            feats.setdefault(k, np.nan)

    return feats


# ── Librosa-based features ────────────────────────────────────────────────────

def extract_librosa_features(wav_path: str, sr: int = 16000) -> dict:
    feats = {}
    try:
        y, _ = librosa.load(wav_path, sr=sr, mono=True)

        # MFCCs
        mfcc = librosa.feature.mfcc(y=y, sr=sr, n_mfcc=13)
        for i in range(13):
            feats[f"mfcc_{i+1:02d}_mean"] = float(np.mean(mfcc[i]))
            feats[f"mfcc_{i+1:02d}_std"]  = float(np.std(mfcc[i]))

        # Delta-MFCCs
        delta = librosa.feature.delta(mfcc)
        for i in range(13):
            feats[f"delta_mfcc_{i+1:02d}_mean"] = float(np.mean(delta[i]))

        # ZCR
        zcr = librosa.feature.zero_crossing_rate(y)
        feats["zcr_mean"] = float(np.mean(zcr))
        feats["zcr_std"]  = float(np.std(zcr))

        # RMS energy
        rms = librosa.feature.rms(y=y)
        feats["rms_mean"] = float(np.mean(rms))
        feats["rms_std"]  = float(np.std(rms))

        # Spectral centroid
        centroid = librosa.feature.spectral_centroid(y=y, sr=sr)
        feats["spectral_centroid_mean"] = float(np.mean(centroid))
        feats["spectral_centroid_std"]  = float(np.std(centroid))

        # Spectral rolloff
        rolloff = librosa.feature.spectral_rolloff(y=y, sr=sr)
        feats["spectral_rolloff_mean"] = float(np.mean(rolloff))

    except Exception:
        pass

    return feats


# ── Main ─────────────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(description="Extract acoustic features")
    parser.add_argument("--catalogue",  required=True)
    parser.add_argument("--audio-dir",  required=True)
    parser.add_argument("--output",     required=True)
    parser.add_argument("--log",        default="logs/features_acoustic.log")
    args = parser.parse_args()

    logger = setup_logging(args.log)
    out_path = Path(args.output)
    out_path.parent.mkdir(parents=True, exist_ok=True)

    cat = pd.read_csv(args.catalogue)
    logger.info(f"Extracting acoustic features for {len(cat)} files …")

    rows = []
    for _, row in tqdm(cat.iterrows(), total=len(cat), desc="Acoustic features"):
        wav = row["file_path"]
        if not Path(wav).exists():
            logger.warning(f"Missing: {wav}")
            continue

        feats = {"file_id": row["file_id"]}
        feats.update(extract_praat_features(wav))
        feats.update(extract_librosa_features(wav))

        # Copy over labels
        for col in ["dataset","disorder","severity","speaker_id",
                    "label_voice_quality","label_stuttering","label_dysarthria",
                    "duration_s"]:
            feats[col] = row.get(col, np.nan)

        rows.append(feats)

    df = pd.DataFrame(rows)
    df.to_parquet(str(out_path), index=False)
    logger.info(f"Saved {len(df)} rows × {len(df.columns)} features → {out_path}")


if __name__ == "__main__":
    main()
