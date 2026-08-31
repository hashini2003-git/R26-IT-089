"""
make_splits.py — Stratified train/val/test split.

Writes three CSVs to --output-dir:
    train.csv   val.csv   test.csv

Stratifies by disorder to preserve class balance.
Speaker-level splitting: all recordings from one speaker go to the same split.
"""

import argparse
import logging
import sys
from pathlib import Path

import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split


def setup_logging(log_path: str) -> logging.Logger:
    Path(log_path).parent.mkdir(parents=True, exist_ok=True)
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s  %(levelname)-7s  %(message)s",
        handlers=[logging.StreamHandler(sys.stdout), logging.FileHandler(log_path)],
    )
    return logging.getLogger(__name__)


def speaker_level_split(df: pd.DataFrame, train_r: float, val_r: float,
                        test_r: float, seed: int) -> tuple:
    """
    Try speaker-level split first (no speaker leaks across sets).
    Falls back to file-level stratified split if any disorder class
    has fewer than 2 unique speakers.
    """
    speakers = df[["speaker_id", "disorder"]].drop_duplicates()
    min_class_count = speakers["disorder"].value_counts().min()

    if min_class_count >= 2:
        # Speaker-level split
        train_spk, tmp_spk = train_test_split(
            speakers,
            test_size=(val_r + test_r),
            stratify=speakers["disorder"],
            random_state=seed,
        )
        val_ratio_of_tmp = val_r / (val_r + test_r)
        val_spk, test_spk = train_test_split(
            tmp_spk,
            test_size=(1 - val_ratio_of_tmp),
            stratify=tmp_spk["disorder"],
            random_state=seed,
        )
        train_ids = set(train_spk["speaker_id"])
        val_ids   = set(val_spk["speaker_id"])
        test_ids  = set(test_spk["speaker_id"])
        train_df = df[df["speaker_id"].isin(train_ids)].copy()
        val_df   = df[df["speaker_id"].isin(val_ids)].copy()
        test_df  = df[df["speaker_id"].isin(test_ids)].copy()
    else:
        # File-level stratified split (some datasets have 1 file per speaker)
        import logging
        logging.getLogger(__name__).warning(
            "Some disorder classes have <2 unique speakers — "
            "falling back to file-level stratified split."
        )
        train_df, tmp_df = train_test_split(
            df,
            test_size=(val_r + test_r),
            stratify=df["disorder"],
            random_state=seed,
        )
        val_ratio_of_tmp = val_r / (val_r + test_r)
        val_df, test_df = train_test_split(
            tmp_df,
            test_size=(1 - val_ratio_of_tmp),
            stratify=tmp_df["disorder"],
            random_state=seed,
        )

    return train_df, val_df, test_df


def main():
    parser = argparse.ArgumentParser(description="Stratified train/val/test split")
    parser.add_argument("--catalogue",    required=True)
    parser.add_argument("--features",     required=True,
                        help="Acoustic features parquet (used to align file_ids)")
    parser.add_argument("--output-dir",   required=True)
    parser.add_argument("--train",        type=float, default=0.70)
    parser.add_argument("--val",          type=float, default=0.15)
    parser.add_argument("--test",         type=float, default=0.15)
    parser.add_argument("--stratify-by",  nargs="+",
                        default=["disorder", "severity", "speaker_id"])
    parser.add_argument("--seed",         type=int, default=42)
    parser.add_argument("--log",          default="logs/split.log")
    args = parser.parse_args()

    logger = setup_logging(args.log)
    out_dir = Path(args.output_dir)
    out_dir.mkdir(parents=True, exist_ok=True)

    cat = pd.read_csv(args.catalogue)

    # Only keep files that have features computed
    feat_df = pd.read_parquet(args.features)
    valid_ids = set(feat_df["file_id"])
    cat = cat[cat["file_id"].isin(valid_ids)].copy()
    logger.info(f"Catalogue after feature alignment: {len(cat)} rows")

    # Filter out unknown labels
    cat = cat[cat["disorder"] != "unknown"].copy()

    # Speaker-level stratified split
    train_df, val_df, test_df = speaker_level_split(
        cat, args.train, args.val, args.test, args.seed
    )

    for name, df in [("train", train_df), ("val", val_df), ("test", test_df)]:
        path = out_dir / f"{name}.csv"
        df.to_csv(str(path), index=False)
        logger.info(
            f"{name:5s}: {len(df):4d} files | "
            f"disorders: {df['disorder'].value_counts().to_dict()}"
        )

    # Write splits back into catalogue (cast to str first for pandas 3.x)
    cat["split"] = cat["split"].astype(str)
    cat.loc[cat["file_id"].isin(set(train_df["file_id"])), "split"] = "train"
    cat.loc[cat["file_id"].isin(set(val_df["file_id"])),   "split"] = "val"
    cat.loc[cat["file_id"].isin(set(test_df["file_id"])),  "split"] = "test"
    cat.to_csv(str(Path(args.catalogue)), index=False)
    logger.info(f"Split column written back to {args.catalogue}")


if __name__ == "__main__":
    main()
