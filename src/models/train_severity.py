"""
train_severity.py — Ordinal severity regressor.

Severity mapping: none=0, mild=1, moderate=2, severe=3
Model: GradientBoostingRegressor → outputs continuous score 0–3
"""

import argparse
import json
import logging
import sys
from pathlib import Path

import joblib
import numpy as np
import pandas as pd
from sklearn.ensemble import GradientBoostingRegressor, RandomForestRegressor
from sklearn.impute import SimpleImputer
from sklearn.metrics import mean_absolute_error, r2_score
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler


SEVERITY_MAP = {"none": 0, "mild": 1, "moderate": 2, "severe": 3}

FEATURE_COLS = [
    "f0_mean","f0_std","f0_min","f0_max","f0_range",
    "jitter_local","jitter_abs","jitter_rap","jitter_ppq5",
    "shimmer_local","shimmer_local_db","shimmer_apq3","shimmer_apq5","shimmer_apq11",
    "hnr",
    *[f"mfcc_{i+1:02d}_mean" for i in range(13)],
    *[f"mfcc_{i+1:02d}_std"  for i in range(13)],
    *[f"delta_mfcc_{i+1:02d}_mean" for i in range(13)],
    "zcr_mean","zcr_std","rms_mean","rms_std",
    "spectral_centroid_mean","spectral_centroid_std","spectral_rolloff_mean",
]


def setup_logging(log_path: str) -> logging.Logger:
    Path(log_path).parent.mkdir(parents=True, exist_ok=True)
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s  %(levelname)-7s  %(message)s",
        handlers=[logging.StreamHandler(sys.stdout), logging.FileHandler(log_path)],
    )
    return logging.getLogger(__name__)


def load_split(splits_dir, split, feat_df):
    ids = pd.read_csv(splits_dir / f"{split}.csv")["file_id"]
    df  = feat_df[feat_df["file_id"].isin(ids)].copy()
    df  = df[df["severity"].isin(SEVERITY_MAP)].copy()
    df["severity_num"] = df["severity"].map(SEVERITY_MAP)
    cols = [c for c in FEATURE_COLS if c in df.columns]
    return df[cols].values, df["severity_num"].values.astype(float)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--splits",   required=True)
    parser.add_argument("--features", required=True)
    parser.add_argument("--output",   required=True)
    parser.add_argument("--log",      default="logs/train_severity.log")
    args = parser.parse_args()

    logger  = setup_logging(args.log)
    out_dir = Path(args.output)
    out_dir.mkdir(parents=True, exist_ok=True)
    splits  = Path(args.splits)

    feat_df = pd.read_parquet(args.features)

    X_train, y_train = load_split(splits, "train", feat_df)
    X_val,   y_val   = load_split(splits, "val",   feat_df)
    logger.info(f"Train: {X_train.shape}  severity_dist={np.unique(y_train, return_counts=True)}")

    gb = GradientBoostingRegressor(n_estimators=200, learning_rate=0.05,
                                    max_depth=4, random_state=42)
    pipe = Pipeline([
        ("impute", SimpleImputer(strategy="median")),
        ("scale",  StandardScaler()),
        ("reg",    gb),
    ])

    logger.info("Training severity regressor …")
    pipe.fit(X_train, y_train)

    y_pred = pipe.predict(X_val)
    mae = mean_absolute_error(y_val, y_pred)
    r2  = r2_score(y_val, y_pred)
    logger.info(f"Val MAE: {mae:.4f}  R²: {r2:.4f}")

    model_path = out_dir / "severity_model.pkl"
    joblib.dump(pipe, str(model_path))
    logger.info(f"Model saved → {model_path}")

    metrics = {
        "model": "severity",
        "val_mae": round(mae, 4),
        "val_r2":  round(r2, 4),
        "severity_map": SEVERITY_MAP,
        "train_n": int(len(y_train)),
        "val_n":   int(len(y_val)),
    }
    (out_dir / "metrics.json").write_text(json.dumps(metrics, indent=2))


if __name__ == "__main__":
    main()
