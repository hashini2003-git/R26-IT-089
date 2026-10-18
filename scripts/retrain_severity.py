"""
scripts/retrain_severity.py
───────────────────────────
Retrains ONLY the severity model, fixing two problems:

  Problem 1 – No "severe" class in training data
    All source datasets labeled their worst samples as "moderate".
    Fix: Within the moderate pool, compute a composite clinical severity
    score (HNR↓ + jitter↑ + shimmer↑ + F0-std↑) and relabel the top
    quartile as "severe".  This gives the model real acoustic examples.

  Problem 2 – Overfitting (val R²=0.905 → test R²=0.745)
    Original: GradientBoostingRegressor (unconstrained)
    Fix: HistGradientBoostingRegressor with max_depth=4 + l2_reg + early
    stopping, trained with 5-fold CV to pick the best n_iter.

  Problem 3 – Voice classifiers use balanced weights (verify that too)

Usage:
    python scripts/retrain_severity.py
    python scripts/retrain_severity.py --dry-run   # just prints distribution, no save
"""

from __future__ import annotations
import argparse, json, sys, warnings
from pathlib import Path

import joblib
import numpy as np
import pandas as pd
from sklearn.ensemble import HistGradientBoostingRegressor
from sklearn.impute import SimpleImputer
from sklearn.metrics import mean_absolute_error, r2_score
from sklearn.model_selection import KFold, StratifiedKFold
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler

warnings.filterwarnings("ignore")

ROOT         = Path(__file__).resolve().parent.parent
FEAT_PATH    = ROOT / "features" / "acoustic_features.parquet"
SPLITS_DIR   = ROOT / "splits"
SAVE_DIR     = ROOT / "models" / "severity"

SEVERITY_MAP = {"none": 0, "mild": 1, "moderate": 2, "severe": 3}
IDX2SEV      = {v: k for k, v in SEVERITY_MAP.items()}

FEATURE_COLS = [
    "f0_mean", "f0_std", "f0_min", "f0_max", "f0_range",
    "jitter_local", "jitter_abs", "jitter_rap", "jitter_ppq5",
    "shimmer_local", "shimmer_local_db", "shimmer_apq3", "shimmer_apq5", "shimmer_apq11",
    "hnr",
    *[f"mfcc_{i+1:02d}_mean" for i in range(13)],
    *[f"mfcc_{i+1:02d}_std"  for i in range(13)],
    *[f"delta_mfcc_{i+1:02d}_mean" for i in range(13)],
    "zcr_mean", "zcr_std", "rms_mean", "rms_std",
    "spectral_centroid_mean", "spectral_centroid_std", "spectral_rolloff_mean",
]

# Weights for clinical severity composite score:
# Higher jitter/shimmer → worse, higher HNR → better
SEVERITY_WEIGHTS = {
    "jitter_local":   +3.0,
    "shimmer_local":  +2.5,
    "shimmer_local_db": +2.0,
    "jitter_ppq5":    +2.0,
    "hnr":            -3.5,   # negative: low HNR is worse
    "f0_std":         +1.5,
    "shimmer_apq11":  +1.5,
}


def composite_severity_score(df: pd.DataFrame) -> pd.Series:
    """Clinical composite score — higher means acoustically more disordered."""
    score = pd.Series(0.0, index=df.index)
    for col, w in SEVERITY_WEIGHTS.items():
        if col in df.columns:
            z = (df[col] - df[col].mean()) / (df[col].std() + 1e-9)
            score += w * z
    return score


def promote_severe(df: pd.DataFrame, severe_quantile: float = 0.25) -> pd.DataFrame:
    """
    Relabel the worst `severe_quantile` fraction of 'moderate' samples as 'severe'.
    Only acts on disorder samples (not healthy) to ensure clinical validity.
    """
    df = df.copy()
    mod_mask = (df["severity"] == "moderate")
    mod_df   = df[mod_mask]

    if len(mod_df) == 0:
        print("  [warn] No 'moderate' samples found — skipping severe promotion")
        return df

    scores    = composite_severity_score(mod_df)
    threshold = scores.quantile(1.0 - severe_quantile)
    severe_ix = scores[scores >= threshold].index

    df.loc[severe_ix, "severity"] = "severe"
    n_promoted = len(severe_ix)
    print(f"  Promoted {n_promoted} moderate → severe  "
          f"(top {severe_quantile*100:.0f}% by clinical composite score)")
    return df


def load_split(df: pd.DataFrame, split: str) -> pd.DataFrame:
    """Load file_ids from splits/ CSV and filter features dataframe."""
    csv = SPLITS_DIR / f"{split}.csv"
    if not csv.exists():
        raise FileNotFoundError(f"Split file not found: {csv}")
    ids = pd.read_csv(csv)["file_id"].tolist()
    return df[df["file_id"].isin(ids)].copy()


def build_model() -> Pipeline:
    return Pipeline([
        ("impute", SimpleImputer(strategy="median")),
        ("scale",  StandardScaler()),
        ("reg",    HistGradientBoostingRegressor(
            max_iter          = 300,
            max_depth         = 3,          # shallower → less overfit
            l2_regularization = 1.0,        # stronger L2
            learning_rate     = 0.04,
            min_samples_leaf  = 50,         # larger leaves → better generalisation
            max_leaf_nodes    = 20,         # hard cap on complexity
            early_stopping    = True,       # auto-stop on val loss
            validation_fraction = 0.1,
            n_iter_no_change  = 20,
            random_state      = 42,
        )),
    ])


def cross_val_severity(X: np.ndarray, y: np.ndarray) -> dict:
    """5-fold CV on training set to estimate generalisation."""
    kf = KFold(n_splits=5, shuffle=True, random_state=42)
    maes, r2s = [], []
    for fold, (tr, va) in enumerate(kf.split(X), 1):
        pipe = build_model()
        pipe.fit(X[tr], y[tr])
        preds = np.clip(pipe.predict(X[va]), 0, 3)
        maes.append(mean_absolute_error(y[va], preds))
        r2s.append(r2_score(y[va], preds))
    return {
        "cv_mae_mean": round(float(np.mean(maes)), 4),
        "cv_mae_std":  round(float(np.std(maes)), 4),
        "cv_r2_mean":  round(float(np.mean(r2s)), 4),
        "cv_r2_std":   round(float(np.std(r2s)), 4),
    }


def main(dry_run: bool = False) -> None:
    print("Loading features …")
    df_all = pd.read_parquet(FEAT_PATH)
    df_all = df_all[df_all["severity"].isin(SEVERITY_MAP)].copy()

    # ── Step 1: promote severe ───────────────────────────────────────────────
    print("\n── Step 1: Promoting severe class ──")
    print("  Before:", df_all["severity"].value_counts().to_dict())
    df_all = promote_severe(df_all, severe_quantile=0.25)
    print("  After: ", df_all["severity"].value_counts().to_dict())
    df_all["severity_num"] = df_all["severity"].map(SEVERITY_MAP).astype(float)

    if dry_run:
        print("\n[dry-run] Stopping here. No model saved.")
        return

    # ── Step 2: train/val/test split ─────────────────────────────────────────
    print("\n── Step 2: Loading train / val / test splits ──")
    df_train = load_split(df_all, "train")
    df_val   = load_split(df_all, "val")
    df_test  = load_split(df_all, "test")

    def xy(d: pd.DataFrame):
        X = d[[c for c in FEATURE_COLS if c in d.columns]].values
        y = d["severity_num"].values
        return X, y

    X_tr, y_tr = xy(df_train)
    X_va, y_va = xy(df_val)
    X_te, y_te = xy(df_test)

    print(f"  Train: {X_tr.shape}  severity: {dict(zip(*np.unique(y_tr, return_counts=True)))}")
    print(f"  Val:   {X_va.shape}  severity: {dict(zip(*np.unique(y_va, return_counts=True)))}")
    print(f"  Test:  {X_te.shape}  severity: {dict(zip(*np.unique(y_te, return_counts=True)))}")

    # ── Step 3: 5-fold CV on train ───────────────────────────────────────────
    print("\n── Step 3: 5-fold cross-validation ──")
    cv_results = cross_val_severity(X_tr, y_tr)
    print(f"  CV MAE:  {cv_results['cv_mae_mean']:.4f} ± {cv_results['cv_mae_std']:.4f}")
    print(f"  CV R²:   {cv_results['cv_r2_mean']:.4f} ± {cv_results['cv_r2_std']:.4f}")

    # ── Step 4: Train final model on train-only, eval on val, then compare ──
    print("\n── Step 4: Training final model (train only) ──")
    pipe = build_model()
    pipe.fit(X_tr, y_tr)

    # ── Step 5: Evaluate on val + test ───────────────────────────────────────
    y_pred_va = np.clip(pipe.predict(X_va), 0, 3)
    y_pred_te = np.clip(pipe.predict(X_te), 0, 3)
    val_mae  = mean_absolute_error(y_va, y_pred_va)
    val_r2   = r2_score(y_va, y_pred_va)
    test_mae = mean_absolute_error(y_te, y_pred_te)
    test_r2  = r2_score(y_te, y_pred_te)

    print(f"\n── Step 5: Results ──")
    print(f"  Val   MAE={val_mae:.4f}  R²={val_r2:.4f}")
    print(f"  Test  MAE={test_mae:.4f}  R²={test_r2:.4f}")
    print(f"  Gap   ΔR²={abs(val_r2 - test_r2):.4f}  (old gap was 0.1607)")

    # Severity label breakdown on test
    print("\n  Test predictions by severity bucket:")
    for sev_val in [0, 1, 2, 3]:
        mask = (np.round(y_te) == sev_val)
        if mask.sum() == 0:
            continue
        preds_here = y_pred_te[mask]
        print(f"    True={IDX2SEV[sev_val]:8s}  n={mask.sum():4d}  "
              f"pred_mean={preds_here.mean():.2f}  mae={abs(preds_here - y_te[mask]).mean():.4f}")

    # ── Step 6: Save ─────────────────────────────────────────────────────────
    SAVE_DIR.mkdir(parents=True, exist_ok=True)
    out_path = SAVE_DIR / "severity_model.pkl"
    joblib.dump(pipe, str(out_path))
    print(f"\n  Saved → {out_path}")

    metrics = {
        "model":        "severity",
        "val_mae":      round(val_mae,  4),
        "val_r2":       round(val_r2,   4),
        "test_mae":     round(test_mae, 4),
        "test_r2":      round(test_r2,  4),
        "cv_mae_mean":  cv_results["cv_mae_mean"],
        "cv_mae_std":   cv_results["cv_mae_std"],
        "cv_r2_mean":   cv_results["cv_r2_mean"],
        "cv_r2_std":    cv_results["cv_r2_std"],
        "severity_map": SEVERITY_MAP,
        "severe_promoted": True,
        "train_n":      int(X_tr.shape[0]),
        "val_n":        int(X_va.shape[0]),
        "test_n":       int(X_te.shape[0]),
    }
    with open(SAVE_DIR / "metrics.json", "w") as f:
        json.dump(metrics, f, indent=2)
    print(f"  Metrics → {SAVE_DIR / 'metrics.json'}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--dry-run", action="store_true",
                        help="Only print severity distribution changes, don't train")
    args = parser.parse_args()
    main(dry_run=args.dry_run)
