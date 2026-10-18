"""
evaluate.py — Evaluate all models on the held-out test set.

Writes models/evaluation_report.json with full metrics per model.
"""

import argparse
import json
import logging
import sys
from pathlib import Path

import joblib
import numpy as np
import pandas as pd
from sklearn.metrics import (
    classification_report, roc_auc_score,
    mean_absolute_error, r2_score,
)


FEATURE_COLS_CLF = [
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

SEVERITY_MAP = {"none": 0, "mild": 1, "moderate": 2, "severe": 3}


def setup_logging(log_path: str) -> logging.Logger:
    Path(log_path).parent.mkdir(parents=True, exist_ok=True)
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s  %(levelname)-7s  %(message)s",
        handlers=[logging.StreamHandler(sys.stdout), logging.FileHandler(log_path)],
    )
    return logging.getLogger(__name__)


def load_test(splits_dir, feat_df, label_col=None, is_regression=False):
    ids = pd.read_csv(splits_dir / "test.csv")["file_id"]
    df  = feat_df[feat_df["file_id"].isin(ids)].copy()
    cols = [c for c in FEATURE_COLS_CLF if c in df.columns]

    if is_regression:
        df = df[df["severity"].isin(SEVERITY_MAP)].copy()
        df["severity_num"] = df["severity"].map(SEVERITY_MAP)
        return df[cols].values, df["severity_num"].values.astype(float)

    df = df[df[label_col].isin([0, 1])].copy()
    return df[cols].values, df[label_col].values.astype(int)


def evaluate_classifier(model_path, X_test, y_test, model_name, logger):
    if not model_path.exists():
        logger.warning(f"Model not found: {model_path}")
        return {"error": "model not found"}
    pipe = joblib.load(str(model_path))
    y_pred = pipe.predict(X_test)
    y_prob = pipe.predict_proba(X_test)[:, 1]
    auc    = roc_auc_score(y_test, y_prob) if len(np.unique(y_test)) > 1 else float("nan")
    report = classification_report(y_test, y_pred, output_dict=True)
    logger.info(f"\n── {model_name} ──")
    logger.info(classification_report(y_test, y_pred))
    logger.info(f"AUC: {auc:.4f}")
    return {"auc": round(auc, 4), "classification_report": report, "n_test": int(len(y_test))}


def evaluate_regressor(model_path, X_test, y_test, model_name, logger):
    if not model_path.exists():
        logger.warning(f"Model not found: {model_path}")
        return {"error": "model not found"}
    pipe  = joblib.load(str(model_path))
    y_pred = pipe.predict(X_test)
    mae = mean_absolute_error(y_test, y_pred)
    r2  = r2_score(y_test, y_pred)
    logger.info(f"\n── {model_name} ── MAE={mae:.4f}  R²={r2:.4f}")
    return {"mae": round(mae, 4), "r2": round(r2, 4), "n_test": int(len(y_test))}


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--models-dir", required=True)
    parser.add_argument("--splits",     required=True)
    parser.add_argument("--features",   required=True)
    parser.add_argument("--output",     required=True)
    parser.add_argument("--log",        default="logs/evaluate.log")
    args = parser.parse_args()

    logger    = setup_logging(args.log)
    models    = Path(args.models_dir)
    splits    = Path(args.splits)
    feat_df   = pd.read_parquet(args.features)
    out_path  = Path(args.output)
    out_path.parent.mkdir(parents=True, exist_ok=True)

    report = {}

    # Voice quality
    X, y = load_test(splits, feat_df, "label_voice_quality")
    report["voice_quality"] = evaluate_classifier(
        models / "voice_quality" / "voice_quality_model.pkl", X, y, "Voice Quality", logger)

    # Stuttering
    X, y = load_test(splits, feat_df, "label_stuttering")
    report["stuttering"] = evaluate_classifier(
        models / "stuttering" / "stuttering_model.pkl", X, y, "Stuttering", logger)

    # Dysarthria
    X, y = load_test(splits, feat_df, "label_dysarthria")
    report["dysarthria"] = evaluate_classifier(
        models / "dysarthria" / "dysarthria_model.pkl", X, y, "Dysarthria", logger)

    # Severity
    X, y = load_test(splits, feat_df, is_regression=True)
    report["severity"] = evaluate_regressor(
        models / "severity" / "severity_model.pkl", X, y, "Severity", logger)

    out_path.write_text(json.dumps(report, indent=2))
    logger.info(f"\nEvaluation report → {out_path}")


if __name__ == "__main__":
    main()
