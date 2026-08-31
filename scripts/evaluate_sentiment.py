"""
evaluate_sentiment.py
─────────────────────
Comprehensive evaluation of all 7 sentiment models on the held-out test set.

Outputs
───────
  Console  : formatted classification reports + metrics table
  Figures  : saved to  notebooks/figures/
               cm_raw.png          – raw-count confusion matrices (2×4 grid)
               cm_norm.png         – row-normalised confusion matrices (2×4 grid)
               roc_curves.png      – OvR ROC curves per model (2×4 grid)
               pr_curves.png       – precision-recall curves per model (2×4 grid)
               metrics_summary.png – grouped bar: Acc / Macro-F1 / MCC / Kappa
               perclass_f1.png     – per-class F1 across all models
  JSON     : models/sentiment/evaluation_report_full.json

Run from project root:
    python scripts/evaluate_sentiment.py
"""

from __future__ import annotations

import json
import warnings
from pathlib import Path

import joblib
import matplotlib.pyplot as plt
import matplotlib.gridspec as gridspec
import numpy as np
import pandas as pd
import torch
import torch.nn as nn
from sklearn.metrics import (
    ConfusionMatrixDisplay,
    accuracy_score,
    average_precision_score,
    classification_report,
    cohen_kappa_score,
    confusion_matrix,
    f1_score,
    matthews_corrcoef,
    precision_recall_curve,
    roc_auc_score,
    roc_curve,
)
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import label_binarize
from transformers import AutoModel, AutoTokenizer

warnings.filterwarnings("ignore")

# ── Paths ─────────────────────────────────────────────────────────────────────

ROOT       = Path(__file__).resolve().parent.parent
DATA_PATH  = ROOT / "data" / "reviews.csv"
SENT_DIR   = ROOT / "models" / "sentiment"
FIG_DIR    = ROOT / "notebooks" / "figures"
FIG_DIR.mkdir(parents=True, exist_ok=True)

LABEL_ORDER = ["negative", "neutral", "positive"]
LABEL2IDX   = {l: i for i, l in enumerate(LABEL_ORDER)}
IDX2LABEL   = {i: l for l, i in LABEL2IDX.items()}

# Colour palette
CLS_COLORS  = {"negative": "#DC2626", "neutral": "#D97706", "positive": "#059669"}
MODEL_PAL   = ["#6366F1", "#0891B2", "#D97706", "#7C3AED", "#059669", "#E11D48"]

plt.rcParams.update({"figure.dpi": 130, "font.size": 10, "axes.spines.top": False,
                      "axes.spines.right": False})


# ══════════════════════════════════════════════════════════════════════════════
# 1. Data
# ══════════════════════════════════════════════════════════════════════════════

def load_test_set():
    df = pd.read_csv(DATA_PATH)
    df = df.dropna(subset=["review_text", "sentiment"])
    df["review_text"] = df["review_text"].astype(str).str.strip()
    df = df[df["review_text"].str.len() > 5]
    X = df["review_text"].tolist()
    y = df["sentiment"].tolist()
    _, X_test, _, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )
    print(f"Test set  : {len(X_test):,} samples")
    for lbl in LABEL_ORDER:
        n = y_test.count(lbl)
        print(f"  {lbl:>10}: {n:>4} ({n/len(y_test)*100:.1f}%)")
    return X_test, y_test


# ══════════════════════════════════════════════════════════════════════════════
# 2. Model definitions
# ══════════════════════════════════════════════════════════════════════════════

class _ScratchBiLSTM(nn.Module):
    """BiLSTM trained from scratch on this dataset."""
    def __init__(self, vocab_size, embed_dim, hidden_dim, n_layers, n_classes, dropout=0.4):
        super().__init__()
        self.embedding = nn.Embedding(vocab_size, embed_dim, padding_idx=0)
        self.dropout   = nn.Dropout(dropout)
        self.lstm = nn.LSTM(
            embed_dim, hidden_dim, n_layers,
            batch_first=True,
            dropout=dropout if n_layers > 1 else 0.0,
            bidirectional=True,
        )
        self.fc = nn.Linear(hidden_dim * 2, n_classes)

    def forward(self, x):
        emb = self.dropout(self.embedding(x))
        _, (h, _) = self.lstm(emb)
        return self.fc(self.dropout(torch.cat([h[-2], h[-1]], dim=1)))


# ══════════════════════════════════════════════════════════════════════════════
# 3. Model loading
# ══════════════════════════════════════════════════════════════════════════════

def _tokenise_batch(texts: list[str], vocab: dict, max_len: int) -> torch.Tensor:
    unk, pad = vocab.get("<UNK>", 1), vocab.get("<PAD>", 0)
    rows = []
    for t in texts:
        ids = [vocab.get(w, unk) for w in str(t).lower().split()][:max_len]
        ids += [pad] * (max_len - len(ids))
        rows.append(ids)
    return torch.tensor(rows, dtype=torch.long)


def load_all_models(X_test: list[str], y_test: list[str]) -> dict:
    """Load every model; return a dict of {name: (predict_fn, proba_fn)}."""
    models: dict = {}

    # ── 1. Naive Bayes (TF-IDF) ──────────────────────────────────────────────
    path = SENT_DIR / "naivebayes_sentiment.pkl"
    if path.exists():
        pipe = joblib.load(str(path))
        classes = list(pipe.classes_)
        def _nb_pred(texts, _p=pipe): return _p.predict(texts).tolist()
        def _nb_prob(texts, _p=pipe, _c=classes):
            raw = _p.predict_proba(texts)
            return np.column_stack([raw[:, _c.index(l)] for l in LABEL_ORDER])
        models["Naive Bayes"] = (_nb_pred, _nb_prob)
        print("✓  Naive Bayes loaded")

    # ── 2. Logistic Regression (TF-IDF) ──────────────────────────────────────
    path = SENT_DIR / "logreg_sentiment.pkl"
    if path.exists():
        pipe = joblib.load(str(path))
        classes = list(pipe.classes_)
        def _lr_pred(texts, _p=pipe): return _p.predict(texts).tolist()
        def _lr_prob(texts, _p=pipe, _c=classes):
            raw = _p.predict_proba(texts)
            return np.column_stack([raw[:, _c.index(l)] for l in LABEL_ORDER])
        models["Logistic Regression"] = (_lr_pred, _lr_prob)
        print("✓  Logistic Regression loaded")

    # ── 3. LinearSVC (TF-IDF + Platt) ────────────────────────────────────────
    path = SENT_DIR / "svm_sentiment.pkl"
    if path.exists():
        pipe = joblib.load(str(path))
        classes = list(pipe.classes_)
        def _svm_pred(texts, _p=pipe): return _p.predict(texts).tolist()
        def _svm_prob(texts, _p=pipe, _c=classes):
            raw = _p.predict_proba(texts)
            return np.column_stack([raw[:, _c.index(l)] for l in LABEL_ORDER])
        models["LinearSVC"] = (_svm_pred, _svm_prob)
        print("✓  LinearSVC loaded")

    # ── 4. TF-IDF + XGBoost ──────────────────────────────────────────────────
    path = SENT_DIR / "xgboost_sentiment.pkl"
    if path.exists():
        bundle = joblib.load(str(path))
        tfidf, clf = bundle["tfidf"], bundle["clf"]
        def _xgb_pred(texts, _t=tfidf, _c=clf):
            enc = _c.predict(_t.transform(texts))
            return [IDX2LABEL[e] for e in enc]
        def _xgb_prob(texts, _t=tfidf, _c=clf):
            return _c.predict_proba(_t.transform(texts))  # already in LABEL_ORDER
        models["XGBoost"] = (_xgb_pred, _xgb_prob)
        print("✓  XGBoost loaded")

    # ── 5. LSTM from scratch ──────────────────────────────────────────────────
    meta_p  = SENT_DIR / "lstm_scratch_meta.json"
    model_p = SENT_DIR / "lstm_scratch_sentiment.pt"
    if meta_p.exists() and model_p.exists():
        meta = json.loads(meta_p.read_text())
        lstm_s = _ScratchBiLSTM(
            meta["vocab_size"], meta["embed_dim"],
            meta["hidden_dim"], meta["n_layers"], 3,
        )
        lstm_s.load_state_dict(
            torch.load(str(model_p), map_location="cpu", weights_only=True)
        )
        lstm_s.eval()
        _vocab_s, _ml_s = meta["vocab"], meta["max_len"]

        def _lstm_s_pred(texts, _m=lstm_s, _v=_vocab_s, _l=_ml_s):
            with torch.no_grad():
                return [IDX2LABEL[i]
                        for i in _m(_tokenise_batch(texts, _v, _l)).argmax(1).tolist()]

        def _lstm_s_prob(texts, _m=lstm_s, _v=_vocab_s, _l=_ml_s):
            with torch.no_grad():
                return torch.softmax(
                    _m(_tokenise_batch(texts, _v, _l)), dim=-1
                ).numpy()

        models["LSTM (scratch)"] = (_lstm_s_pred, _lstm_s_prob)
        print("✓  LSTM (scratch) loaded")

    # ── 6. BERT (DistilBERT CLS + LogReg) ────────────────────────────────────
    path = SENT_DIR / "bert_sentiment.pkl"
    if path.exists():
        bundle = joblib.load(str(path))
        clf_b, bert_name = bundle["clf"], bundle.get("bert_model", "distilbert-base-uncased")
        max_len_b, classes_b = bundle.get("max_len", 128), bundle["classes"]
        print(f"  Loading {bert_name}…", end="", flush=True)
        tokenizer_b = AutoTokenizer.from_pretrained(bert_name)
        bert_enc    = AutoModel.from_pretrained(bert_name)
        bert_enc.eval()
        print(" done")

        def _bert_embed(texts, _tok=tokenizer_b, _enc=bert_enc, _ml=max_len_b):
            embs = []
            for i in range(0, len(texts), 32):
                batch = texts[i: i + 32]
                enc = _tok(batch, padding=True, truncation=True,
                           max_length=_ml, return_tensors="pt")
                with torch.no_grad():
                    out = _enc(**enc)
                embs.append(out.last_hidden_state[:, 0, :].numpy())
            return np.vstack(embs)

        def _bert_pred(texts, _e=_bert_embed, _c=clf_b):
            return _c.predict(_e(texts)).tolist()

        def _bert_prob(texts, _e=_bert_embed, _c=clf_b, _cls=classes_b):
            raw = _c.predict_proba(_e(texts))
            return np.column_stack([raw[:, _cls.index(l)] for l in LABEL_ORDER])

        models["BERT (DistilBERT)"] = (_bert_pred, _bert_prob)
        print("✓  BERT loaded")

    return models


# ══════════════════════════════════════════════════════════════════════════════
# 4. Evaluation
# ══════════════════════════════════════════════════════════════════════════════

def _safe_auc(y_bin, proba):
    try:
        return float(roc_auc_score(y_bin, proba, multi_class="ovr", average="macro"))
    except Exception:
        return None


def run_evaluation(
    models: dict,
    X_test: list[str],
    y_test: list[str],
) -> dict:
    y_bin = label_binarize(y_test, classes=LABEL_ORDER)
    results = {}

    print("\n" + "=" * 68)
    print("  EVALUATION RESULTS")
    print("=" * 68)

    for name, (pred_fn, proba_fn) in models.items():
        print(f"\n  [{name}]")
        y_pred  = pred_fn(X_test)
        y_proba = proba_fn(X_test)

        acc   = accuracy_score(y_test, y_pred)
        macro = f1_score(y_test, y_pred, average="macro",    zero_division=0)
        wt    = f1_score(y_test, y_pred, average="weighted", zero_division=0)
        mcc   = matthews_corrcoef(y_test, y_pred)
        kappa = cohen_kappa_score(y_test, y_pred)
        auc   = _safe_auc(y_bin, y_proba)
        cm    = confusion_matrix(y_test, y_pred, labels=LABEL_ORDER)
        rep   = classification_report(
            y_test, y_pred, labels=LABEL_ORDER,
            output_dict=True, zero_division=0,
        )

        results[name] = dict(
            accuracy=acc, macro_f1=macro, weighted_f1=wt,
            mcc=mcc, kappa=kappa, roc_auc=auc,
            cm=cm, report=rep, y_pred=y_pred, y_proba=y_proba,
        )

        auc_str = f"{auc:.4f}" if auc is not None else "N/A"
        print(f"  Accuracy : {acc:.4f}   Macro-F1 : {macro:.4f}")
        print(f"  MCC      : {mcc:.4f}   Kappa    : {kappa:.4f}   ROC-AUC : {auc_str}")

    return results


# ══════════════════════════════════════════════════════════════════════════════
# 5. Classification Reports (console)
# ══════════════════════════════════════════════════════════════════════════════

def print_classification_reports(results: dict, y_test: list[str]) -> None:
    print("\n" + "=" * 68)
    print("  CLASSIFICATION REPORTS")
    print("=" * 68)
    for name, m in results.items():
        print(f"\n{'─'*68}")
        print(f"  {name}")
        print(f"{'─'*68}")
        print(classification_report(
            y_test, m["y_pred"],
            labels=LABEL_ORDER,
            target_names=LABEL_ORDER,
            zero_division=0,
        ))


# ══════════════════════════════════════════════════════════════════════════════
# 6. Figures
# ══════════════════════════════════════════════════════════════════════════════

def _model_grid(n, ncols=4):
    nrows = (n + ncols - 1) // ncols
    return nrows, ncols


def fig_confusion_matrices_raw(results: dict) -> None:
    """Raw-count confusion matrices in a 2×4 grid."""
    names  = list(results.keys())
    nrows, ncols = _model_grid(len(names))
    fig, axes = plt.subplots(nrows, ncols, figsize=(ncols * 5, nrows * 4.5))
    axes_flat = axes.flatten() if hasattr(axes, "flatten") else [axes]

    for ax, (name, m) in zip(axes_flat, results.items()):
        disp = ConfusionMatrixDisplay(m["cm"], display_labels=LABEL_ORDER)
        disp.plot(ax=ax, colorbar=False, cmap="Blues", values_format="d")
        ax.set_title(f"{name}\nAcc = {m['accuracy']:.4f}", fontweight="bold", fontsize=9)
        ax.set_xlabel("Predicted Label", fontsize=8)
        ax.set_ylabel("True Label",      fontsize=8)
        ax.tick_params(labelsize=8)

    # hide unused axes
    for ax in axes_flat[len(results):]:
        ax.set_visible(False)

    fig.suptitle("Confusion Matrices — Raw Counts", fontsize=14, fontweight="bold", y=1.01)
    plt.tight_layout()
    out = FIG_DIR / "cm_raw.png"
    plt.savefig(out, bbox_inches="tight")
    plt.show()
    print(f"  Saved → {out.relative_to(ROOT)}")


def fig_confusion_matrices_norm(results: dict) -> None:
    """Row-normalised confusion matrices (recall view)."""
    names  = list(results.keys())
    nrows, ncols = _model_grid(len(names))
    fig, axes = plt.subplots(nrows, ncols, figsize=(ncols * 5, nrows * 4.5))
    axes_flat = axes.flatten() if hasattr(axes, "flatten") else [axes]

    for ax, (name, m) in zip(axes_flat, results.items()):
        cm_norm = m["cm"].astype(float)
        row_sum = cm_norm.sum(axis=1, keepdims=True)
        cm_norm = np.divide(cm_norm, row_sum, where=row_sum != 0)

        disp = ConfusionMatrixDisplay(cm_norm, display_labels=LABEL_ORDER)
        disp.plot(ax=ax, colorbar=False, cmap="Greens", values_format=".2f")
        ax.set_title(f"{name}\nMacro-F1 = {m['macro_f1']:.4f}",
                     fontweight="bold", fontsize=9)
        ax.set_xlabel("Predicted Label", fontsize=8)
        ax.set_ylabel("True Label",      fontsize=8)
        ax.tick_params(labelsize=8)

    for ax in axes_flat[len(results):]:
        ax.set_visible(False)

    fig.suptitle("Confusion Matrices — Row-Normalised (Recall View)",
                 fontsize=14, fontweight="bold", y=1.01)
    plt.tight_layout()
    out = FIG_DIR / "cm_norm.png"
    plt.savefig(out, bbox_inches="tight")
    plt.show()
    print(f"  Saved → {out.relative_to(ROOT)}")


def fig_roc_curves(results: dict, y_test: list[str]) -> None:
    """OvR ROC curves per model, 2×4 grid."""
    y_bin  = label_binarize(y_test, classes=LABEL_ORDER)
    names  = list(results.keys())
    nrows, ncols = _model_grid(len(names))
    lc = [CLS_COLORS[l] for l in LABEL_ORDER]

    fig, axes = plt.subplots(nrows, ncols, figsize=(ncols * 5, nrows * 4.5))
    axes_flat = axes.flatten() if hasattr(axes, "flatten") else [axes]

    for ax, (name, m) in zip(axes_flat, results.items()):
        for i, lbl in enumerate(LABEL_ORDER):
            fpr, tpr, _ = roc_curve(y_bin[:, i], m["y_proba"][:, i])
            auc_val = roc_auc_score(y_bin[:, i], m["y_proba"][:, i])
            ax.plot(fpr, tpr, color=lc[i], lw=2,
                    label=f"{lbl} (AUC={auc_val:.3f})")
        ax.plot([0, 1], [0, 1], "k--", alpha=0.3, lw=1)
        macro_auc = m["roc_auc"]
        auc_label = f"{macro_auc:.4f}" if macro_auc else "N/A"
        ax.set_title(f"{name}\nMacro AUC = {auc_label}", fontweight="bold", fontsize=9)
        ax.set_xlabel("False Positive Rate", fontsize=8)
        ax.set_ylabel("True Positive Rate",  fontsize=8)
        ax.legend(fontsize=7, loc="lower right")
        ax.set_xlim([-0.02, 1.02]); ax.set_ylim([-0.02, 1.05])

    for ax in axes_flat[len(results):]:
        ax.set_visible(False)

    fig.suptitle("ROC Curves — One-vs-Rest per Model",
                 fontsize=14, fontweight="bold", y=1.01)
    plt.tight_layout()
    out = FIG_DIR / "roc_curves.png"
    plt.savefig(out, bbox_inches="tight")
    plt.show()
    print(f"  Saved → {out.relative_to(ROOT)}")


def fig_pr_curves(results: dict, y_test: list[str]) -> None:
    """Precision-Recall curves per model (2×4 grid)."""
    y_bin  = label_binarize(y_test, classes=LABEL_ORDER)
    names  = list(results.keys())
    nrows, ncols = _model_grid(len(names))
    lc = [CLS_COLORS[l] for l in LABEL_ORDER]

    fig, axes = plt.subplots(nrows, ncols, figsize=(ncols * 5, nrows * 4.5))
    axes_flat = axes.flatten() if hasattr(axes, "flatten") else [axes]

    for ax, (name, m) in zip(axes_flat, results.items()):
        for i, lbl in enumerate(LABEL_ORDER):
            prec, rec, _ = precision_recall_curve(y_bin[:, i], m["y_proba"][:, i])
            ap = average_precision_score(y_bin[:, i], m["y_proba"][:, i])
            ax.plot(rec, prec, color=lc[i], lw=2, label=f"{lbl} (AP={ap:.3f})")
        ax.set_title(f"{name}", fontweight="bold", fontsize=9)
        ax.set_xlabel("Recall",    fontsize=8)
        ax.set_ylabel("Precision", fontsize=8)
        ax.legend(fontsize=7, loc="lower left")
        ax.set_xlim([-0.02, 1.02]); ax.set_ylim([-0.02, 1.05])

    for ax in axes_flat[len(results):]:
        ax.set_visible(False)

    fig.suptitle("Precision-Recall Curves — One-vs-Rest per Model",
                 fontsize=14, fontweight="bold", y=1.01)
    plt.tight_layout()
    out = FIG_DIR / "pr_curves.png"
    plt.savefig(out, bbox_inches="tight")
    plt.show()
    print(f"  Saved → {out.relative_to(ROOT)}")


def fig_metrics_summary(results: dict) -> None:
    """Grouped bar: Accuracy / Macro-F1 / MCC / Kappa / ROC-AUC for all models."""
    names      = list(results.keys())
    metric_keys = ["accuracy", "macro_f1", "mcc", "kappa", "roc_auc"]
    metric_lbls = ["Accuracy", "Macro F1", "MCC", "Cohen κ", "ROC-AUC"]
    n_metrics   = len(metric_keys)
    x           = np.arange(len(names))
    width       = 0.15

    fig, ax = plt.subplots(figsize=(max(14, len(names) * 2), 6))

    for j, (key, lbl) in enumerate(zip(metric_keys, metric_lbls)):
        vals = [
            m[key] if m[key] is not None else 0.0
            for m in results.values()
        ]
        offset = (j - n_metrics / 2 + 0.5) * width
        bars = ax.bar(x + offset, vals, width, label=lbl,
                      alpha=0.85, edgecolor="white", linewidth=0.8)
        for bar, v in zip(bars, vals):
            ax.text(
                bar.get_x() + bar.get_width() / 2,
                bar.get_height() + 0.002,
                f"{v:.3f}",
                ha="center", va="bottom", fontsize=6.5, rotation=90,
            )

    ax.set_xticks(x)
    ax.set_xticklabels(names, rotation=20, ha="right", fontsize=9)
    ax.set_ylim(0.85, 1.05)
    ax.set_ylabel("Score")
    ax.set_title("Model Comparison — All Metrics", fontweight="bold", fontsize=13)
    ax.axhline(1.0, color="gray", linestyle="--", alpha=0.3)
    ax.legend(loc="lower right", fontsize=9)
    plt.tight_layout()
    out = FIG_DIR / "metrics_summary.png"
    plt.savefig(out, bbox_inches="tight")
    plt.show()
    print(f"  Saved → {out.relative_to(ROOT)}")


def fig_perclass_f1(results: dict) -> None:
    """Per-class F1 grouped bar across all models."""
    names  = list(results.keys())
    x      = np.arange(len(names))
    width  = 0.25
    lc     = [CLS_COLORS[l] for l in LABEL_ORDER]

    fig, ax = plt.subplots(figsize=(max(14, len(names) * 2), 6))

    for j, lbl in enumerate(LABEL_ORDER):
        vals   = [m["report"][lbl]["f1-score"] for m in results.values()]
        offset = (j - 1) * width
        bars   = ax.bar(x + offset, vals, width, label=lbl,
                        color=lc[j], alpha=0.85, edgecolor="white")
        for bar, v in zip(bars, vals):
            ax.text(
                bar.get_x() + bar.get_width() / 2,
                bar.get_height() + 0.003,
                f"{v:.3f}",
                ha="center", va="bottom", fontsize=7.5,
            )

    ax.set_xticks(x)
    ax.set_xticklabels(names, rotation=20, ha="right", fontsize=9)
    ax.set_ylim(0.80, 1.06)
    ax.set_ylabel("F1 Score")
    ax.set_title("Per-Class F1 — All Models", fontweight="bold", fontsize=13)
    ax.axhline(1.0, color="gray", linestyle="--", alpha=0.3)
    ax.legend(title="Sentiment Class", fontsize=9)
    plt.tight_layout()
    out = FIG_DIR / "perclass_f1.png"
    plt.savefig(out, bbox_inches="tight")
    plt.show()
    print(f"  Saved → {out.relative_to(ROOT)}")


# ══════════════════════════════════════════════════════════════════════════════
# 7. Summary table + JSON export
# ══════════════════════════════════════════════════════════════════════════════

def print_summary_table(results: dict) -> None:
    rows = []
    for name, m in results.items():
        auc_s = f"{m['roc_auc']:.4f}" if m["roc_auc"] else "N/A"
        rows.append({
            "Model":       name,
            "Accuracy":    f"{m['accuracy']:.4f}",
            "Macro F1":    f"{m['macro_f1']:.4f}",
            "Weighted F1": f"{m['weighted_f1']:.4f}",
            "MCC":         f"{m['mcc']:.4f}",
            "Kappa":       f"{m['kappa']:.4f}",
            "ROC-AUC":     auc_s,
            "Neg F1":      f"{m['report']['negative']['f1-score']:.4f}",
            "Neu F1":      f"{m['report']['neutral']['f1-score']:.4f}",
            "Pos F1":      f"{m['report']['positive']['f1-score']:.4f}",
        })
    df = pd.DataFrame(rows).set_index("Model")
    print("\n" + "=" * 100)
    print("  METRICS SUMMARY")
    print("=" * 100)
    pd.set_option("display.width", 160)
    print(df.to_string())


def save_report(results: dict, X_test, y_test) -> None:
    report = {
        "dataset": {
            "test_samples": len(X_test),
            "class_distribution": {
                lbl: y_test.count(lbl) for lbl in LABEL_ORDER
            },
        },
        "models": [],
    }

    for name, m in results.items():
        per_class = {}
        for lbl in LABEL_ORDER:
            r = m["report"][lbl]
            per_class[lbl] = {
                "precision": round(r["precision"], 4),
                "recall":    round(r["recall"],    4),
                "f1":        round(r["f1-score"],  4),
                "support":   int(r["support"]),
            }
        report["models"].append({
            "model":       name,
            "accuracy":    round(m["accuracy"],    4),
            "macro_f1":    round(m["macro_f1"],    4),
            "weighted_f1": round(m["weighted_f1"], 4),
            "mcc":         round(m["mcc"],         4),
            "kappa":       round(m["kappa"],       4),
            "roc_auc":     round(m["roc_auc"], 4) if m["roc_auc"] else None,
            "per_class":   per_class,
            "confusion_matrix": {
                "labels": LABEL_ORDER,
                "matrix": m["cm"].tolist(),
                "matrix_normalised": np.round(
                    m["cm"].astype(float) / m["cm"].sum(axis=1, keepdims=True).clip(1),
                    4,
                ).tolist(),
            },
        })

    out = SENT_DIR / "evaluation_report_full.json"
    out.write_text(json.dumps(report, indent=2))
    print(f"\n  Report saved → {out.relative_to(ROOT)}")


# ══════════════════════════════════════════════════════════════════════════════
# 8. Inference demo
# ══════════════════════════════════════════════════════════════════════════════

DEMO_CASES = [
    ("positive", "Excellent care from the specialist, the speech therapy improved my condition significantly"),
    ("positive", "Wonderful doctor, highly recommend, very compassionate and knowledgeable about my treatment"),
    ("positive", "Outstanding clinic, fantastic team, the consultation was thorough and the advice was brilliant"),
    ("negative", "Terrible experience, billing was incorrect, the doctor was cold and dismissive throughout"),
    ("negative", "Very disappointing, poor care, long wait and the consultation lasted only five minutes"),
    ("negative", "Doctor didn't listen, prescribed medication without understanding my medical history fully"),
    ("neutral",  "Decent visit, okay service, neither particularly good nor bad overall experience"),
    ("neutral",  "Fairly reasonable consultation, average care, satisfactory service but nothing outstanding"),
]


def inference_demo(models: dict) -> None:
    names = list(models.keys())
    header_width = 65

    print("\n" + "=" * (header_width + len(names) * 18))
    print("  INFERENCE DEMO")
    print("=" * (header_width + len(names) * 18))
    print(f"  {'Expected':>10}  {'Text':60}", end="")
    for n in names:
        print(f"  {n[:14]:>14}", end="")
    print()
    print("  " + "─" * (header_width + len(names) * 16))

    for expected, text in DEMO_CASES:
        print(f"  {expected:>10}  {text[:60]:<60}", end="")
        for name, (pred_fn, _) in models.items():
            pred = pred_fn([text])[0]
            tick = "✅" if pred == expected else "❌"
            print(f"  {tick} {pred[:12]:>12}", end="")
        print()


# ══════════════════════════════════════════════════════════════════════════════
# main
# ══════════════════════════════════════════════════════════════════════════════

def main():
    print("=" * 68)
    print("  Sentiment Model — Comprehensive Evaluation")
    print("=" * 68)

    print("\nLoading test set…")
    X_test, y_test = load_test_set()

    print("\nLoading models…")
    models = load_all_models(X_test, y_test)

    if not models:
        print("No models found. Run training scripts first.")
        return

    # Evaluation
    results = run_evaluation(models, X_test, y_test)

    # Classification reports
    print_classification_reports(results, y_test)

    # Summary table
    print_summary_table(results)

    # Figures
    print("\nGenerating figures…")
    fig_confusion_matrices_raw(results)
    fig_confusion_matrices_norm(results)
    fig_roc_curves(results, y_test)
    fig_pr_curves(results, y_test)
    fig_metrics_summary(results)
    fig_perclass_f1(results)

    # Inference demo
    inference_demo(models)

    # Save JSON report
    save_report(results, X_test, y_test)

    print("\nDone.")


if __name__ == "__main__":
    main()
