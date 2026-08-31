"""
standardize.py — Resample all raw audio to 16 kHz mono WAV.

Usage (via Makefile):
    python src/audio/standardize.py \
        --input-dirs raw/mdvr_kcl raw/dysarthria_hf ... \
        --output-dir processed/audio \
        --sample-rate 16000 \
        --mono \
        --log logs/standardize.log
"""

import argparse
import hashlib
import logging
import shutil
import sys
from pathlib import Path

import librosa
import numpy as np
import soundfile as sf
from tqdm import tqdm

SUPPORTED_EXTENSIONS = {".wav", ".mp3", ".flac", ".ogg", ".m4a", ".aac", ".opus"}


def setup_logging(log_path: str) -> logging.Logger:
    log_file = Path(log_path)
    log_file.parent.mkdir(parents=True, exist_ok=True)
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s  %(levelname)-7s  %(message)s",
        handlers=[
            logging.StreamHandler(sys.stdout),
            logging.FileHandler(log_file),
        ],
    )
    return logging.getLogger(__name__)


def stable_output_name(src_path: Path, input_roots: list[Path]) -> str:
    """
    Build a collision-safe output filename:
      <dataset_tag>__<relative_stem>__<short_hash>.wav
    """
    # Find which input root this file belongs to
    for root in input_roots:
        try:
            rel = src_path.relative_to(root)
            tag = root.name
            stem = str(rel.with_suffix("")).replace("/", "_").replace(" ", "_")
            h = hashlib.md5(str(src_path).encode()).hexdigest()[:6]
            return f"{tag}__{stem}__{h}.wav"
        except ValueError:
            continue
    # Fallback
    h = hashlib.md5(str(src_path).encode()).hexdigest()[:6]
    return f"{src_path.stem}__{h}.wav"


def collect_audio_files(input_dirs: list[Path]) -> list[Path]:
    files = []
    for d in input_dirs:
        if not d.exists():
            continue
        for ext in SUPPORTED_EXTENSIONS:
            files.extend(d.rglob(f"*{ext}"))
    return sorted(set(files))


def standardize_file(
    src: Path,
    dst: Path,
    target_sr: int,
    mono: bool,
    logger: logging.Logger,
) -> bool:
    """Load, resample, convert to mono, write 16-bit WAV. Returns True on success."""
    try:
        audio, sr = librosa.load(str(src), sr=target_sr, mono=mono)
        # librosa returns float32 in [-1, 1]; write as 16-bit PCM
        if audio.ndim == 1:
            audio_out = audio
        else:
            audio_out = audio.T  # soundfile expects (samples, channels)
        sf.write(str(dst), audio_out, target_sr, subtype="PCM_16")
        return True
    except Exception as e:
        logger.warning(f"SKIP {src.name}: {e}")
        return False


def main():
    parser = argparse.ArgumentParser(description="Standardize audio to 16kHz mono WAV")
    parser.add_argument("--input-dirs", nargs="+", required=True)
    parser.add_argument("--output-dir", required=True)
    parser.add_argument("--sample-rate", type=int, default=16000)
    parser.add_argument("--mono", action="store_true", default=True)
    parser.add_argument("--log", default="logs/standardize.log")
    args = parser.parse_args()

    logger = setup_logging(args.log)
    out_dir = Path(args.output_dir)
    out_dir.mkdir(parents=True, exist_ok=True)

    input_roots = [Path(d) for d in args.input_dirs]
    files = collect_audio_files(input_roots)

    logger.info(f"Found {len(files)} audio files across {len(input_roots)} input dirs")
    logger.info(f"Output → {out_dir}  |  SR={args.sample_rate}  mono={args.mono}")

    ok = skipped = failed = 0
    for src in tqdm(files, desc="Standardizing", unit="file"):
        out_name = stable_output_name(src, input_roots)
        dst = out_dir / out_name
        if dst.exists():
            skipped += 1
            continue
        if standardize_file(src, dst, args.sample_rate, args.mono, logger):
            ok += 1
        else:
            failed += 1

    logger.info(
        f"Done — converted={ok}  skipped(already exist)={skipped}  failed={failed}"
    )
    logger.info(f"Total WAV files in {out_dir}: {len(list(out_dir.glob('*.wav')))}")

    if failed > 0:
        sys.exit(1)


if __name__ == "__main__":
    main()
