"""
train_dysarthria.py — Binary classifier: dysarthric vs healthy articulation.

Labels: label_dysarthria  (1 = dysarthria, 0 = healthy)
Datasets: dysarthria_hf, torgo (dysarthria=1)
"""

import argparse
import json
import logging
import sys
from pathlib import Path

import joblib
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier, VotingClassifier
from sklearn.impute import SimpleImputer
from sklearn.metrics import classification_report, roc_auc_score
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler


def setup_logging(log_path: str) -> logging.Logger:
    Path(log_path).parent.mkdir(parents=True, exist_ok=True)
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s  %(levelname)-7s  %(message)s",
        handlers=[logging.StreamHandler(sys.stdout), logging.FileHandler(log_path)],
    )
    return logging.getLogger(__name__)


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


def load_split(splits_dir, split, feat_df, label_col):
    ids = pd.read_csv(splits_dir / f"{split}.csv")["file_id"]
    df  = feat_df[feat_df["file_id"].isin(ids)].copy()
    df  = df[df[label_col].isin([0, 1])].copy()
    cols = [c for c in FEATURE_COLS if c in df.columns]
    return df[cols].values, df[label_col].values.astype(int)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--splits",   required=True)
    parser.add_argument("--features", required=True)
    parser.add_argument("--output",   required=True)
    parser.add_argument("--log",      default="logs/train_dysarthria.log")
    args = parser.parse_args()

    logger  = setup_logging(args.log)
    out_dir = Path(args.output)
    out_dir.mkdir(parents=True, exist_ok=True)
    splits  = Path(args.splits)

    feat_df = pd.read_parquet(args.features)

    X_train, y_train = load_split(splits, "train", feat_df, "label_dysarthria")
    X_val,   y_val   = load_split(splits, "val",   feat_df, "label_dysarthria")
    logger.info(f"Train: {X_train.shape}  dysarthria={y_train.sum()}  healthy={(y_train==0).sum()}")

    rf  = RandomForestClassifier(n_estimators=200, class_weight="balanced",
                                  random_state=42, n_jobs=-1)
    gb  = GradientBoostingClassifier(n_estimators=150, learning_rate=0.05,
                                      max_depth=4, random_state=42)
    clf = VotingClassifier([("rf", rf), ("gb", gb)], voting="soft")

    pipe = Pipeline([
        ("impute", SimpleImputer(strategy="median")),
        ("scale",  StandardScaler()),
        ("clf",    clf),
    ])

    logger.info("Training dysarthria classifier …")
    pipe.fit(X_train, y_train)

    y_pred = pipe.predict(X_val)
    y_prob = pipe.predict_proba(X_val)[:, 1]
    auc    = roc_auc_score(y_val, y_prob) if len(np.unique(y_val)) > 1 else float("nan")
    logger.info(f"\n{classification_report(y_val, y_pred, target_names=['healthy','dysarthria'])}")
    logger.info(f"Val AUC: {auc:.4f}")

    model_path = out_dir / "dysarthria_model.pkl"
    joblib.dump(pipe, str(model_path))
    logger.info(f"Model saved → {model_path}")

    metrics = {
        "model": "dysarthria",
        "val_auc": round(auc, 4),
        "val_report": classification_report(y_val, y_pred, output_dict=True),
        "train_n": int(len(y_train)),
        "val_n":   int(len(y_val)),
    }
    (out_dir / "metrics.json").write_text(json.dumps(metrics, indent=2))


if __name__ == "__main__":
    main()
