"""
train_sentiment_models.py
─────────────────────────
Trains and evaluates 3 classical sentiment classifiers on the reviews dataset.
Saves trained pipelines to models/sentiment/.

Models:
  1. Multinomial Naive Bayes  + TF-IDF
  2. Logistic Regression      + TF-IDF
  3. Linear SVC               + TF-IDF
  (BiLSTM is loaded separately for evaluation comparison)

Run:
  python scripts/train_sentiment_models.py
"""

from __future__ import annotations

import json
import os
import sys
from pathlib import Path

import joblib
import numpy as np
import pandas as pd
import torch
import torch.nn as nn
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import (
    classification_report,
    confusion_matrix,
    roc_auc_score,
    accuracy_score,
    f1_score,
)
from sklearn.model_selection import StratifiedKFold, cross_val_score, train_test_split
from sklearn.naive_bayes import MultinomialNB
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import label_binarize
from sklearn.svm import LinearSVC
from sklearn.calibration import CalibratedClassifierCV

ROOT = Path(__file__).resolve().parent.parent
DATA_PATH    = ROOT / "data" / "reviews.csv"
SAVE_DIR     = ROOT / "models" / "sentiment"
LSTM_DIR     = ROOT / "models" / "recommendation"
REPORT_PATH  = ROOT / "models" / "sentiment" / "evaluation_report.json"

LABEL_ORDER = ["negative", "neutral", "positive"]


# ── 1. Load & split ────────────────────────────────────────────────────────────

def load_data():
    df = pd.read_csv(DATA_PATH)
    df = df.dropna(subset=["review_text", "sentiment"])
    df["review_text"] = df["review_text"].astype(str).str.strip()
    df = df[df["review_text"].str.len() > 5]
    return df


def split(df):
    X = df["review_text"].tolist()
    y = df["sentiment"].tolist()
    return train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)


# ── 2. Common TF-IDF settings ─────────────────────────────────────────────────

TFIDF_PARAMS = dict(
    max_features=20_000,
    ngram_range=(1, 2),
    sublinear_tf=True,
    min_df=2,
    strip_accents="unicode",
    analyzer="word",
)


# ── 3. Model definitions ──────────────────────────────────────────────────────

def make_nb():
    return Pipeline([
        ("tfidf", TfidfVectorizer(**TFIDF_PARAMS)),
        ("clf",   MultinomialNB(alpha=0.5)),
    ])


def make_logreg():
    return Pipeline([
        ("tfidf", TfidfVectorizer(**TFIDF_PARAMS)),
        ("clf",   LogisticRegression(
            C=5.0, max_iter=1000, solver="lbfgs",
            class_weight="balanced",
            random_state=42,
        )),
    ])


def make_svm():
    # LinearSVC doesn't support predict_proba natively → wrap in Platt scaling
    return Pipeline([
        ("tfidf", TfidfVectorizer(**TFIDF_PARAMS)),
        ("clf",   CalibratedClassifierCV(
            LinearSVC(C=1.0, max_iter=2000, class_weight="balanced", random_state=42),
            cv=3,
        )),
    ])


MODELS = {
    "naivebayes": ("Naive Bayes (TF-IDF)",       make_nb),
    "logreg":     ("Logistic Regression (TF-IDF)", make_logreg),
    "svm":        ("LinearSVC (TF-IDF + Platt)",  make_svm),
}


# ── 4. Evaluation helpers ─────────────────────────────────────────────────────

def evaluate(model, X_test, y_test, model_name: str) -> dict:
    y_pred  = model.predict(X_test)
    y_proba = model.predict_proba(X_test)   # shape (n, 3)

    acc   = accuracy_score(y_test, y_pred)
    macro = f1_score(y_test, y_pred, average="macro")
    wt    = f1_score(y_test, y_pred, average="weighted")

    # Per-class report
    report = classification_report(
        y_test, y_pred,
        labels=LABEL_ORDER, output_dict=True, zero_division=0,
    )

    # ROC-AUC (macro OvR)
    y_bin = label_binarize(y_test, classes=LABEL_ORDER)
    try:
        auc = roc_auc_score(y_bin, y_proba, multi_class="ovr", average="macro")
    except Exception:
        auc = None

    # Confusion matrix
    cm = confusion_matrix(y_test, y_pred, labels=LABEL_ORDER).tolist()

    per_class = {
        lbl: {
            "precision": round(report[lbl]["precision"], 4),
            "recall":    round(report[lbl]["recall"],    4),
            "f1":        round(report[lbl]["f1-score"],  4),
            "support":   int(report[lbl]["support"]),
        }
        for lbl in LABEL_ORDER
    }

    result = {
        "model":          model_name,
        "accuracy":       round(acc,   4),
        "macro_f1":       round(macro, 4),
        "weighted_f1":    round(wt,    4),
        "roc_auc_macro":  round(auc, 4) if auc else None,
        "per_class":      per_class,
        "confusion_matrix": {
            "labels": LABEL_ORDER,
            "matrix": cm,
        },
    }
    return result


# ── 5. BiLSTM wrapper for evaluation ─────────────────────────────────────────

class _BiLSTM(nn.Module):
    def __init__(self, vs, ed, hd, nl, nc):
        super().__init__()
        self.embedding = nn.Embedding(vs, ed, padding_idx=0)
        self.lstm = nn.LSTM(ed, hd, nl, batch_first=True,
                            dropout=0.3 if nl > 1 else 0.0, bidirectional=True)
        self.fc = nn.Linear(hd * 2, nc)
    def forward(self, x):
        emb = self.embedding(x)
        _, (h, _) = self.lstm(emb)
        return self.fc(torch.cat([h[-2], h[-1]], dim=1))


class LSTMClassifier:
    """sklearn-compatible wrapper around the BiLSTM."""
    def __init__(self):
        meta  = json.loads((LSTM_DIR / "lstm_meta.json").read_text())
        model = _BiLSTM(meta["vocab_size"], meta["embed_dim"],
                        meta["hidden_dim"], meta["n_layers"],
                        len(meta["label_map"]))
        model.load_state_dict(
            torch.load(str(LSTM_DIR / "lstm_sentiment.pt"),
                       map_location="cpu", weights_only=True)
        )
        model.eval()
        self._model    = model
        self._vocab    = meta["vocab"]
        self._max_len  = meta["max_len"]
        self._label_map = meta["label_map"]   # {"negative":0,"neutral":1,"positive":2}
        self.classes_  = LABEL_ORDER

    def _tokenize(self, texts: list[str]) -> torch.Tensor:
        unk = self._vocab.get("<UNK>", 1)
        pad = self._vocab.get("<PAD>", 0)
        ml  = self._max_len
        rows = []
        for t in texts:
            ids = [self._vocab.get(w, unk) for w in t.lower().split()][:ml]
            ids += [pad] * (ml - len(ids))
            rows.append(ids)
        return torch.tensor(rows, dtype=torch.long)

    def predict_proba(self, texts: list[str]) -> np.ndarray:
        batch_size = 256
        all_probs  = []
        for i in range(0, len(texts), batch_size):
            batch = texts[i : i + batch_size]
            with torch.no_grad():
                logits = self._model(self._tokenize(batch))
                probs  = torch.softmax(logits, dim=-1).numpy()
            all_probs.append(probs)
        return np.vstack(all_probs)   # shape (N, 3) — order: neg, neu, pos

    def predict(self, texts: list[str]) -> list[str]:
        probs = self.predict_proba(texts)
        idx_to_label = {v: k for k, v in self._label_map.items()}
        return [idx_to_label[int(np.argmax(p))] for p in probs]


# ── 6. Cross-validation ───────────────────────────────────────────────────────

def cross_validate(make_fn, X, y, n_splits=5) -> dict:
    skf    = StratifiedKFold(n_splits=n_splits, shuffle=True, random_state=42)
    scores = cross_val_score(make_fn(), X, y, cv=skf,
                             scoring="f1_macro", n_jobs=-1)
    return {
        "cv_macro_f1_mean": round(float(scores.mean()), 4),
        "cv_macro_f1_std":  round(float(scores.std()),  4),
        "cv_folds":         n_splits,
    }


# ── 6. Main ───────────────────────────────────────────────────────────────────

def main():
    print("=" * 60)
    print("  Sentiment Model Training & Evaluation")
    print("=" * 60)

    df = load_data()
    print(f"\nDataset: {len(df)} samples")
    for lbl in LABEL_ORDER:
        n = (df["sentiment"] == lbl).sum()
        print(f"  {lbl:>10}: {n:>5} ({n/len(df)*100:.1f}%)")

    X_train, X_test, y_train, y_test = split(df)
    print(f"\nTrain: {len(X_train)}  |  Test: {len(X_test)}")

    all_results = []

    for key, (name, make_fn) in MODELS.items():
        print(f"\n{'─'*50}")
        print(f"  Training: {name}")

        # Cross-validation first
        print("  Running 5-fold CV…", end=" ", flush=True)
        cv_result = cross_validate(make_fn, df["review_text"].tolist(), df["sentiment"].tolist())
        print(f"CV macro-F1 = {cv_result['cv_macro_f1_mean']:.4f} ± {cv_result['cv_macro_f1_std']:.4f}")

        # Train on full train set
        model = make_fn()
        model.fit(X_train, y_train)

        # Evaluate on held-out test
        result = evaluate(model, X_test, y_test, name)
        result.update(cv_result)
        all_results.append(result)

        print(f"  Accuracy  : {result['accuracy']:.4f}")
        print(f"  Macro F1  : {result['macro_f1']:.4f}")
        print(f"  ROC-AUC   : {result['roc_auc_macro']}")
        print("  Per-class F1:")
        for lbl in LABEL_ORDER:
            pc = result["per_class"][lbl]
            print(f"    {lbl:>10}: P={pc['precision']:.3f}  R={pc['recall']:.3f}  F1={pc['f1']:.3f}  n={pc['support']}")

        # Save model
        out = SAVE_DIR / f"{key}_sentiment.pkl"
        joblib.dump(model, str(out))
        print(f"  Saved → {out.relative_to(ROOT)}")

    # ── Evaluate BiLSTM on same test set ──────────────────────────────────────
    print(f"\n{'─'*50}")
    print("  Evaluating: BiLSTM (pre-trained)")
    try:
        lstm = LSTMClassifier()
        lstm_result = evaluate(lstm, X_test, y_test, "BiLSTM (Bidirectional)")
        lstm_result["cv_macro_f1_mean"] = None
        lstm_result["cv_macro_f1_std"]  = None
        lstm_result["cv_folds"]         = None
        all_results.append(lstm_result)
        print(f"  Accuracy  : {lstm_result['accuracy']:.4f}")
        print(f"  Macro F1  : {lstm_result['macro_f1']:.4f}")
        print(f"  ROC-AUC   : {lstm_result['roc_auc_macro']}")
        print("  Per-class F1:")
        for lbl in LABEL_ORDER:
            pc = lstm_result["per_class"][lbl]
            print(f"    {lbl:>10}: P={pc['precision']:.3f}  R={pc['recall']:.3f}  F1={pc['f1']:.3f}  n={pc['support']}")
    except Exception as e:
        print(f"  BiLSTM evaluation skipped: {e}")

    # Save report
    report = {
        "dataset": {
            "total": len(df),
            "train": len(X_train),
            "test":  len(X_test),
            "class_distribution": {
                lbl: int((df["sentiment"] == lbl).sum()) for lbl in LABEL_ORDER
            },
        },
        "models": all_results,
    }
    REPORT_PATH.write_text(json.dumps(report, indent=2))
    print(f"\n{'='*60}")
    print(f"  Evaluation report saved → {REPORT_PATH.relative_to(ROOT)}")

    # Summary table
    print(f"\n{'Model':<35} {'Acc':>6} {'MacroF1':>8} {'ROC-AUC':>8} {'CV-F1':>10}")
    print("─" * 75)
    for r in all_results:
        auc = f"{r['roc_auc_macro']:.4f}" if r['roc_auc_macro'] else "  N/A  "
        cv  = (f"{r['cv_macro_f1_mean']:.4f}±{r['cv_macro_f1_std']:.4f}"
               if r.get("cv_macro_f1_mean") is not None else "   N/A (pre-trained)")
        print(f"  {r['model']:<33} {r['accuracy']:>6.4f} {r['macro_f1']:>8.4f} {auc:>8} {cv:>22}")

    print("\nDone.")


if __name__ == "__main__":
    main()
