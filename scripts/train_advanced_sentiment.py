"""
train_advanced_sentiment.py
───────────────────────────
Trains and evaluates three sentiment analysis models:

  1. TF-IDF + XGBoost
  2. LSTM (from scratch, trained on this dataset)
  3. BERT (DistilBERT feature-extraction + logistic head)

Saves to models/sentiment/.
Run:
  python scripts/train_advanced_sentiment.py
"""

from __future__ import annotations
import json, time, warnings
from pathlib import Path

import joblib
import numpy as np
import pandas as pd
import torch
import torch.nn as nn
from torch.utils.data import DataLoader, Dataset
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import (
    accuracy_score, classification_report,
    confusion_matrix, f1_score, roc_auc_score,
)
from sklearn.model_selection import StratifiedKFold, cross_val_score, train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import label_binarize
from transformers import AutoTokenizer, AutoModel
from xgboost import XGBClassifier

warnings.filterwarnings("ignore")

ROOT         = Path(__file__).resolve().parent.parent
DATA_PATH    = ROOT / "data" / "reviews.csv"
SAVE_DIR     = ROOT / "models" / "sentiment"
SAVE_DIR.mkdir(parents=True, exist_ok=True)

LABEL_ORDER  = ["negative", "neutral", "positive"]
LABEL2IDX    = {l: i for i, l in enumerate(LABEL_ORDER)}
IDX2LABEL    = {i: l for l, i in LABEL2IDX.items()}
DEVICE       = torch.device("cuda" if torch.cuda.is_available() else "cpu")


# ── helpers ───────────────────────────────────────────────────────────────────

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


def evaluate_model(predict_fn, predict_proba_fn, X_test, y_test, name: str) -> dict:
    y_pred  = predict_fn(X_test)
    y_proba = predict_proba_fn(X_test)   # (N, 3) in LABEL_ORDER

    acc   = accuracy_score(y_test, y_pred)
    macro = f1_score(y_test, y_pred, average="macro",    zero_division=0)
    wt    = f1_score(y_test, y_pred, average="weighted", zero_division=0)
    cm    = confusion_matrix(y_test, y_pred, labels=LABEL_ORDER)
    rep   = classification_report(y_test, y_pred, labels=LABEL_ORDER,
                                   output_dict=True, zero_division=0)
    y_bin = label_binarize(y_test, classes=LABEL_ORDER)
    try:
        auc = roc_auc_score(y_bin, y_proba, multi_class="ovr", average="macro")
    except Exception:
        auc = None

    per_class = {
        lbl: {
            "precision": round(rep[lbl]["precision"], 4),
            "recall":    round(rep[lbl]["recall"],    4),
            "f1":        round(rep[lbl]["f1-score"],  4),
            "support":   int(rep[lbl]["support"]),
        }
        for lbl in LABEL_ORDER
    }

    print(f"\n  {name}")
    auc_str = f"{auc:.4f}" if auc is not None else "N/A"
    print(f"  Accuracy: {acc:.4f}  Macro-F1: {macro:.4f}  ROC-AUC: {auc_str}")
    print(classification_report(y_test, y_pred, labels=LABEL_ORDER, zero_division=0))

    return {
        "model":       name,
        "accuracy":    round(acc,   4),
        "macro_f1":    round(macro, 4),
        "weighted_f1": round(wt,    4),
        "roc_auc":     round(auc, 4) if auc else None,
        "per_class":   per_class,
        "confusion_matrix": {"labels": LABEL_ORDER, "matrix": cm.tolist()},
    }


# ══════════════════════════════════════════════════════════════════════════════
# 1. TF-IDF + XGBoost
# ══════════════════════════════════════════════════════════════════════════════

def train_xgboost(X_train, y_train, X_test, y_test) -> dict:
    print("\n" + "=" * 60)
    print("  MODEL 1: TF-IDF + XGBoost")
    print("=" * 60)

    tfidf = TfidfVectorizer(
        max_features=20_000, ngram_range=(1, 2),
        sublinear_tf=True, min_df=2, strip_accents="unicode",
    )
    X_tr_tfidf = tfidf.fit_transform(X_train)
    X_te_tfidf = tfidf.transform(X_test)

    y_tr_enc = np.array([LABEL2IDX[l] for l in y_train])

    clf = XGBClassifier(
        n_estimators      = 400,
        max_depth         = 6,
        learning_rate     = 0.1,
        subsample         = 0.8,
        colsample_bytree  = 0.8,
        eval_metric       = "mlogloss",
        use_label_encoder = False,
        random_state      = 42,
        n_jobs            = -1,
    )

    t0 = time.time()
    clf.fit(X_tr_tfidf, y_tr_enc)
    print(f"  Training time: {time.time()-t0:.1f}s")

    # 5-fold CV
    pipe = Pipeline([("tfidf", tfidf), ("xgb", clf)])
    y_enc_full = np.array([LABEL2IDX[l] for l in y_train + y_test])
    X_full = X_train + X_test

    tfidf2 = TfidfVectorizer(max_features=20_000, ngram_range=(1,2),
                              sublinear_tf=True, min_df=2, strip_accents="unicode")
    clf2   = XGBClassifier(n_estimators=400, max_depth=6, learning_rate=0.1,
                            eval_metric="mlogloss", use_label_encoder=False,
                            random_state=42, n_jobs=-1)
    pipe2  = Pipeline([("tfidf", tfidf2), ("xgb", clf2)])

    skf    = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
    y_all  = [LABEL2IDX[l] for l in y_train + y_test]
    scores = cross_val_score(pipe2, X_full, y_all, cv=skf, scoring="f1_macro", n_jobs=1)
    print(f"  5-Fold CV Macro-F1: {scores.mean():.4f} ± {scores.std():.4f}")

    # Predict helpers
    def predict(texts):
        X = tfidf.transform(texts)
        enc = clf.predict(X)
        return [IDX2LABEL[e] for e in enc]

    def predict_proba(texts):
        X = tfidf.transform(texts)
        return clf.predict_proba(X)   # shape (N, 3) — class order matches LABEL2IDX

    result = evaluate_model(predict, predict_proba, X_test, y_test,
                             "TF-IDF + XGBoost")
    result["cv_macro_f1_mean"] = round(float(scores.mean()), 4)
    result["cv_macro_f1_std"]  = round(float(scores.std()),  4)

    # Save
    bundle = {"tfidf": tfidf, "clf": clf, "label2idx": LABEL2IDX, "label_order": LABEL_ORDER}
    path   = SAVE_DIR / "xgboost_sentiment.pkl"
    joblib.dump(bundle, str(path))
    print(f"  Saved → {path.relative_to(ROOT)}")
    return result


# ══════════════════════════════════════════════════════════════════════════════
# 2. LSTM from scratch
# ══════════════════════════════════════════════════════════════════════════════

class _LSTMNet(nn.Module):
    def __init__(self, vocab_size, embed_dim, hidden_dim, n_layers, n_classes, dropout=0.4):
        super().__init__()
        self.embedding = nn.Embedding(vocab_size, embed_dim, padding_idx=0)
        self.dropout   = nn.Dropout(dropout)
        self.lstm = nn.LSTM(embed_dim, hidden_dim, n_layers,
                            batch_first=True, dropout=dropout if n_layers > 1 else 0.0,
                            bidirectional=True)
        self.fc   = nn.Linear(hidden_dim * 2, n_classes)

    def forward(self, x):
        emb = self.dropout(self.embedding(x))
        _, (h, _) = self.lstm(emb)
        out = torch.cat([h[-2], h[-1]], dim=1)
        return self.fc(self.dropout(out))


class _TextDataset(Dataset):
    def __init__(self, texts, labels, vocab, max_len):
        self.data = []
        unk, pad = vocab.get("<UNK>", 1), vocab.get("<PAD>", 0)
        for txt, lbl in zip(texts, labels):
            ids = [vocab.get(w, unk) for w in txt.lower().split()][:max_len]
            ids += [pad] * (max_len - len(ids))
            self.data.append((torch.tensor(ids, dtype=torch.long),
                              torch.tensor(LABEL2IDX[lbl], dtype=torch.long)))

    def __len__(self):  return len(self.data)
    def __getitem__(self, i): return self.data[i]


def build_vocab(texts: list[str], max_vocab: int = 12_000):
    from collections import Counter
    counter = Counter()
    for t in texts:
        counter.update(t.lower().split())
    vocab = {"<PAD>": 0, "<UNK>": 1}
    for w, _ in counter.most_common(max_vocab - 2):
        vocab[w] = len(vocab)
    return vocab


def train_lstm(X_train, y_train, X_test, y_test) -> dict:
    print("\n" + "=" * 60)
    print("  MODEL 2: LSTM (trained from scratch)")
    print("=" * 60)

    MAX_LEN   = 100
    VOCAB_SIZE = 12_000
    EMBED_DIM  = 128
    HIDDEN_DIM = 256
    N_LAYERS   = 2
    BATCH_SIZE = 64
    EPOCHS     = 8
    LR         = 3e-3

    vocab = build_vocab(X_train, VOCAB_SIZE)
    print(f"  Vocab size: {len(vocab)}")

    train_ds = _TextDataset(X_train, y_train, vocab, MAX_LEN)
    test_ds  = _TextDataset(X_test,  y_test,  vocab, MAX_LEN)
    train_dl = DataLoader(train_ds, batch_size=BATCH_SIZE, shuffle=True)
    test_dl  = DataLoader(test_ds,  batch_size=256, shuffle=False)

    model     = _LSTMNet(len(vocab), EMBED_DIM, HIDDEN_DIM, N_LAYERS, 3).to(DEVICE)
    optimizer = torch.optim.AdamW(model.parameters(), lr=LR, weight_decay=1e-4)
    scheduler = torch.optim.lr_scheduler.CosineAnnealingLR(optimizer, T_max=EPOCHS)

    # Class weights for imbalance
    counts  = np.array([y_train.count(l) for l in LABEL_ORDER], dtype=float)
    weights = torch.tensor(1.0 / counts / (1.0 / counts).sum() * 3,
                           dtype=torch.float).to(DEVICE)
    criterion = nn.CrossEntropyLoss(weight=weights)

    history = {"train_loss": [], "train_acc": [], "val_acc": [], "val_f1": []}

    t0 = time.time()
    for epoch in range(1, EPOCHS + 1):
        model.train()
        tot_loss, tot_correct, tot_n = 0.0, 0, 0
        for xb, yb in train_dl:
            xb, yb = xb.to(DEVICE), yb.to(DEVICE)
            optimizer.zero_grad()
            logits = model(xb)
            loss   = criterion(logits, yb)
            loss.backward()
            torch.nn.utils.clip_grad_norm_(model.parameters(), 1.0)
            optimizer.step()
            tot_loss    += loss.item() * len(yb)
            tot_correct += (logits.argmax(1) == yb).sum().item()
            tot_n       += len(yb)
        scheduler.step()

        # Validation
        model.eval()
        all_preds, all_labs = [], []
        with torch.no_grad():
            for xb, yb in test_dl:
                preds = model(xb.to(DEVICE)).argmax(1).cpu().tolist()
                all_preds.extend(preds)
                all_labs.extend(yb.tolist())

        val_acc = accuracy_score(all_labs, all_preds)
        val_f1  = f1_score(all_labs, all_preds, average="macro", zero_division=0)
        tr_loss = tot_loss / tot_n
        tr_acc  = tot_correct / tot_n

        history["train_loss"].append(round(tr_loss, 4))
        history["train_acc"].append(round(tr_acc, 4))
        history["val_acc"].append(round(val_acc, 4))
        history["val_f1"].append(round(val_f1, 4))

        print(f"  Epoch {epoch:02d}/{EPOCHS}  loss={tr_loss:.4f}  "
              f"train_acc={tr_acc:.4f}  val_acc={val_acc:.4f}  val_f1={val_f1:.4f}")

    print(f"  Training time: {time.time()-t0:.1f}s")

    # Final evaluation
    model.eval()
    all_preds, all_proba = [], []
    with torch.no_grad():
        for xb, _ in test_dl:
            logits = model(xb.to(DEVICE))
            probs  = torch.softmax(logits, dim=-1).cpu().numpy()
            preds  = logits.argmax(1).cpu().tolist()
            all_preds.extend(preds)
            all_proba.append(probs)

    y_pred_str = [IDX2LABEL[p] for p in all_preds]
    y_proba_arr = np.vstack(all_proba)

    result = evaluate_model(
        lambda _: y_pred_str,
        lambda _: y_proba_arr,
        X_test, y_test,
        "LSTM (from scratch)",
    )
    result["training_history"] = history
    result["cv_macro_f1_mean"] = None
    result["cv_macro_f1_std"]  = None

    # Save model + vocab + meta
    torch.save(model.state_dict(), str(SAVE_DIR / "lstm_scratch_sentiment.pt"))
    meta = {
        "vocab":      vocab,
        "vocab_size": len(vocab),
        "max_len":    MAX_LEN,
        "embed_dim":  EMBED_DIM,
        "hidden_dim": HIDDEN_DIM,
        "n_layers":   N_LAYERS,
        "label_order": LABEL_ORDER,
        "label2idx":   LABEL2IDX,
    }
    (SAVE_DIR / "lstm_scratch_meta.json").write_text(json.dumps(meta, indent=2))
    print(f"  Saved → models/sentiment/lstm_scratch_sentiment.pt + lstm_scratch_meta.json")
    return result


# ══════════════════════════════════════════════════════════════════════════════
# 3. BERT (DistilBERT feature extraction + logistic head)
# ══════════════════════════════════════════════════════════════════════════════

BERT_MODEL_NAME = "distilbert-base-uncased"
BERT_BATCH      = 32
BERT_MAX_LEN    = 128


def _bert_embed(texts: list[str], tokenizer, model, device) -> np.ndarray:
    """Extract CLS embeddings in mini-batches."""
    all_embs = []
    model.eval()
    for i in range(0, len(texts), BERT_BATCH):
        batch = texts[i : i + BERT_BATCH]
        enc   = tokenizer(
            batch, padding=True, truncation=True,
            max_length=BERT_MAX_LEN, return_tensors="pt",
        ).to(device)
        with torch.no_grad():
            out = model(**enc)
        # CLS token = first token of last hidden state
        cls_emb = out.last_hidden_state[:, 0, :].cpu().numpy()
        all_embs.append(cls_emb)
        if (i // BERT_BATCH) % 10 == 0:
            print(f"    embedded {min(i+BERT_BATCH, len(texts))}/{len(texts)}…", end="\r")
    print()
    return np.vstack(all_embs)


def train_bert(X_train, y_train, X_test, y_test) -> dict:
    print("\n" + "=" * 60)
    print("  MODEL 3: BERT (DistilBERT feature extraction + LogReg)")
    print("=" * 60)

    device    = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"  Device: {device}")
    print(f"  Loading {BERT_MODEL_NAME}…")

    tokenizer = AutoTokenizer.from_pretrained(BERT_MODEL_NAME)
    bert      = AutoModel.from_pretrained(BERT_MODEL_NAME).to(device)
    bert.eval()
    print("  Model loaded.")

    print("  Extracting train embeddings…")
    t0        = time.time()
    X_tr_emb  = _bert_embed(X_train, tokenizer, bert, device)
    print(f"    Train: {X_tr_emb.shape}  ({time.time()-t0:.1f}s)")

    print("  Extracting test embeddings…")
    t1        = time.time()
    X_te_emb  = _bert_embed(X_test, tokenizer, bert, device)
    print(f"    Test : {X_te_emb.shape}  ({time.time()-t1:.1f}s)")

    print("  Training logistic head…")
    clf = LogisticRegression(
        C=10.0, max_iter=1000, solver="lbfgs",
        class_weight="balanced", random_state=42, n_jobs=-1,
    )
    clf.fit(X_tr_emb, y_train)
    print(f"  Total time: {time.time()-t0:.1f}s")

    def predict(texts):
        emb = _bert_embed(texts, tokenizer, bert, device)
        return clf.predict(emb).tolist()

    def predict_proba(texts):
        emb = _bert_embed(texts, tokenizer, bert, device)
        probs = clf.predict_proba(emb)
        classes = list(clf.classes_)
        # reorder to LABEL_ORDER
        return np.column_stack([probs[:, classes.index(l)] for l in LABEL_ORDER])

    result = evaluate_model(predict, predict_proba, X_test, y_test,
                             "BERT (DistilBERT + LogReg head)")
    result["cv_macro_f1_mean"] = None
    result["cv_macro_f1_std"]  = None

    # Save: classifier + BERT model name (embeddings are computed at inference time)
    bundle = {
        "clf":          clf,
        "bert_model":   BERT_MODEL_NAME,
        "max_len":      BERT_MAX_LEN,
        "label_order":  LABEL_ORDER,
        "classes":      list(clf.classes_),
    }
    path = SAVE_DIR / "bert_sentiment.pkl"
    joblib.dump(bundle, str(path))
    print(f"  Saved → {path.relative_to(ROOT)}")
    return result


# ══════════════════════════════════════════════════════════════════════════════
# main
# ══════════════════════════════════════════════════════════════════════════════

def main():
    print("=" * 60)
    print("  Advanced Sentiment Model Training")
    print("=" * 60)

    df = load_data()
    print(f"\nDataset: {len(df):,} samples")
    for lbl in LABEL_ORDER:
        n = (df["sentiment"] == lbl).sum()
        print(f"  {lbl:>10}: {n:>5} ({n/len(df)*100:.1f}%)")

    X_train, X_test, y_train, y_test = split(df)
    print(f"\nTrain: {len(X_train):,}  |  Test: {len(X_test):,}")

    results = []
    results.append(train_xgboost(X_train, y_train, X_test, y_test))
    results.append(train_lstm(X_train, y_train, X_test, y_test))
    results.append(train_bert(X_train, y_train, X_test, y_test))

    # Merge with existing report
    report_path = SAVE_DIR / "evaluation_report.json"
    if report_path.exists():
        existing = json.loads(report_path.read_text())
        old_models = {m["model"]: m for m in existing.get("models", [])}
    else:
        existing = {}
        old_models = {}

    for r in results:
        old_models[r["model"]] = r

    existing["models"] = list(old_models.values())
    existing["dataset"] = {
        "total": len(df),
        "train": len(X_train),
        "test":  len(X_test),
        "class_distribution": {lbl: int((df["sentiment"] == lbl).sum()) for lbl in LABEL_ORDER},
    }
    report_path.write_text(json.dumps(existing, indent=2))
    print(f"\nReport updated → {report_path.relative_to(ROOT)}")

    # Summary
    print(f"\n{'Model':<35} {'Acc':>6} {'MacroF1':>8} {'ROC-AUC':>8}")
    print("─" * 65)
    for r in results:
        auc = f"{r['roc_auc']:.4f}" if r.get("roc_auc") else "  N/A"
        print(f"  {r['model']:<33} {r['accuracy']:>6.4f} {r['macro_f1']:>8.4f} {auc:>8}")
    print("\nDone.")


if __name__ == "__main__":
    main()
