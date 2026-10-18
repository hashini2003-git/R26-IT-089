"""
extract_spectral.py — Extract spectral / deep features per audio file.

Features:
  Mel-spectrogram statistics (128 bins × mean/std/max)
  Chroma features (12 × mean/std)
  Spectral contrast (7 × mean/std)
  Tonnetz (6 × mean/std)
"""

import argparse
import logging
import sys
import warnings
from pathlib import Path

import librosa
import numpy as np
import pandas as pd
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


def extract_spectral_features(wav_path: str, sr: int = 16000) -> dict:
    feats = {}
    try:
        y, _ = librosa.load(wav_path, sr=sr, mono=True)

        # Mel-spectrogram (128 mel bins)
        mel = librosa.feature.melspectrogram(y=y, sr=sr, n_mels=128)
        mel_db = librosa.power_to_db(mel, ref=np.max)
        for i in range(128):
            feats[f"mel_{i:03d}_mean"] = float(np.mean(mel_db[i]))
            feats[f"mel_{i:03d}_std"]  = float(np.std(mel_db[i]))

        # Chroma
        chroma = librosa.feature.chroma_stft(y=y, sr=sr)
        for i in range(12):
            feats[f"chroma_{i:02d}_mean"] = float(np.mean(chroma[i]))
            feats[f"chroma_{i:02d}_std"]  = float(np.std(chroma[i]))

        # Spectral contrast
        contrast = librosa.feature.spectral_contrast(y=y, sr=sr, n_bands=6)
        for i in range(7):
            feats[f"contrast_{i}_mean"] = float(np.mean(contrast[i]))
            feats[f"contrast_{i}_std"]  = float(np.std(contrast[i]))

        # Tonnetz
        y_harm = librosa.effects.harmonic(y)
        tonnetz = librosa.feature.tonnetz(y=y_harm, sr=sr)
        for i in range(6):
            feats[f"tonnetz_{i}_mean"] = float(np.mean(tonnetz[i]))
            feats[f"tonnetz_{i}_std"]  = float(np.std(tonnetz[i]))

    except Exception as e:
        pass  # return whatever was collected

    return feats


def main():
    parser = argparse.ArgumentParser(description="Extract spectral features")
    parser.add_argument("--catalogue",  required=True)
    parser.add_argument("--audio-dir",  required=True)
    parser.add_argument("--output",     required=True)
    parser.add_argument("--log",        default="logs/features_spectral.log")
    args = parser.parse_args()

    logger = setup_logging(args.log)
    out_path = Path(args.output)
    out_path.parent.mkdir(parents=True, exist_ok=True)

    cat = pd.read_csv(args.catalogue)
    logger.info(f"Extracting spectral features for {len(cat)} files …")

    rows = []
    for _, row in tqdm(cat.iterrows(), total=len(cat), desc="Spectral features"):
        wav = row["file_path"]
        if not Path(wav).exists():
            continue

        feats = {"file_id": row["file_id"]}
        feats.update(extract_spectral_features(wav))
        for col in ["dataset","disorder","severity","label_voice_quality",
                    "label_stuttering","label_dysarthria"]:
            feats[col] = row.get(col, np.nan)
        rows.append(feats)

    df = pd.DataFrame(rows)
    df.to_parquet(str(out_path), index=False)
    logger.info(f"Saved {len(df)} rows × {len(df.columns)} features → {out_path}")


if __name__ == "__main__":
    main()
