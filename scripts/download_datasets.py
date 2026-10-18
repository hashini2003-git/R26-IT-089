#!/usr/bin/env python3
"""
Unified dataset downloader for AI Speech & Voice Analysis project.
Downloads all freely available datasets and prints instructions for gated ones.
"""

import os
import sys
import json
import shutil
import zipfile
import tarfile
import hashlib
import subprocess
from pathlib import Path
from urllib.request import urlretrieve, urlopen
from urllib.error import URLError, HTTPError

try:
    import requests
    from tqdm import tqdm
except ImportError:
    print("Installing required packages...")
    subprocess.check_call([sys.executable, "-m", "pip", "install", "requests", "tqdm", "--break-system-packages"])
    import requests
    from tqdm import tqdm

# ─── Paths ────────────────────────────────────────────────────────────────────
BASE = Path(__file__).resolve().parent.parent
RAW  = BASE / "raw"

# ─── Download helpers ─────────────────────────────────────────────────────────

def download_file(url: str, dest: Path, desc: str = "") -> bool:
    """Download a file with progress bar. Returns True on success."""
    dest.parent.mkdir(parents=True, exist_ok=True)
    if dest.exists():
        print(f"  [SKIP] Already exists: {dest.name}")
        return True
    try:
        resp = requests.get(url, stream=True, timeout=60,
                            headers={"User-Agent": "Mozilla/5.0"})
        resp.raise_for_status()
        total = int(resp.headers.get("content-length", 0))
        with open(dest, "wb") as f, tqdm(
            desc=desc or dest.name,
            total=total, unit="B", unit_scale=True, unit_divisor=1024
        ) as bar:
            for chunk in resp.iter_content(chunk_size=8192):
                f.write(chunk)
                bar.update(len(chunk))
        return True
    except Exception as e:
        print(f"  [ERROR] {desc}: {e}")
        if dest.exists():
            dest.unlink()
        return False


def wget_download(url: str, dest_dir: Path, extra_args: list = None) -> bool:
    """Use system wget for downloads that need it (e.g. recursive FTP)."""
    dest_dir.mkdir(parents=True, exist_ok=True)
    cmd = ["wget", "-q", "--show-progress", "-P", str(dest_dir)] + (extra_args or []) + [url]
    try:
        subprocess.run(cmd, check=True)
        return True
    except subprocess.CalledProcessError as e:
        print(f"  [ERROR] wget failed: {e}")
        return False


def extract_zip(zip_path: Path, dest_dir: Path) -> bool:
    print(f"  Extracting {zip_path.name} ...")
    try:
        with zipfile.ZipFile(zip_path, "r") as z:
            z.extractall(dest_dir)
        zip_path.unlink()
        print(f"  Extracted to {dest_dir}")
        return True
    except zipfile.BadZipFile:
        print(f"  [ERROR] Not a valid zip file: {zip_path.name} — removing")
        zip_path.unlink()
        return False


def extract_tar(tar_path: Path, dest_dir: Path):
    print(f"  Extracting {tar_path.name} ...")
    with tarfile.open(tar_path) as t:
        t.extractall(dest_dir)
    tar_path.unlink()
    print(f"  Extracted to {dest_dir}")


def clone_repo(url: str, dest: Path) -> bool:
    if dest.exists() and any(dest.iterdir()):
        print(f"  [SKIP] Repo already cloned: {dest}")
        return True
    print(f"  Cloning {url} ...")
    try:
        subprocess.run(["git", "clone", "--depth=1", url, str(dest)], check=True)
        return True
    except subprocess.CalledProcessError as e:
        print(f"  [ERROR] git clone failed: {e}")
        return False


def hf_download(repo_id: str, dest: Path, repo_type: str = "dataset") -> bool:
    """Download a Hugging Face dataset."""
    if dest.exists() and any(dest.iterdir()):
        print(f"  [SKIP] HF dataset already downloaded: {dest}")
        return True
    try:
        from huggingface_hub import snapshot_download
        print(f"  Downloading HF dataset {repo_id} ...")
        snapshot_download(
            repo_id=repo_id,
            repo_type=repo_type,
            local_dir=str(dest),
            ignore_patterns=["*.bin", "*.safetensors"],  # skip model weights
        )
        return True
    except Exception as e:
        print(f"  [ERROR] HF download failed for {repo_id}: {e}")
        return False


def section(title: str):
    print(f"\n{'='*60}")
    print(f"  {title}")
    print(f"{'='*60}")


def skip_section(title: str, reason: str, instructions: str):
    print(f"\n{'─'*60}")
    print(f"  [MANUAL REQUIRED] {title}")
    print(f"  Reason : {reason}")
    print(f"  Steps  : {instructions}")
    print(f"{'─'*60}")


# ─────────────────────────────────────────────────────────────────────────────
# DATASET DOWNLOADERS
# ─────────────────────────────────────────────────────────────────────────────

def download_uci_parkinson_speech():
    """UCI Parkinson's Speech Dataset (Max Little) — voice features + labels."""
    section("UCI Parkinson's Speech Dataset (UCI ML Repo #174)")
    dest = RAW / "uci_parkinson_speech"

    # Features-only CSV (195 recordings, 23 features)
    url_data = "https://archive.ics.uci.edu/static/public/174/parkinsons.zip"
    zip_path = dest / "parkinsons.zip"
    if download_file(url_data, zip_path, "UCI Parkinson's Speech"):
        extract_zip(zip_path, dest)

    # Multiple recording types version — correct URL
    url_multi = "https://archive.ics.uci.edu/static/public/301/parkinson_speech_dataset_with_multiple_types_of_audio_recordings.zip"
    zip_path2 = dest / "parkinson_multi.zip"
    ok = download_file(url_multi, zip_path2, "UCI Parkinson's Multi-Recording")
    if not ok:
        # Try alternate UCI URL format
        url_multi2 = "https://archive.ics.uci.edu/ml/machine-learning-databases/parkinsons/parkinsons.data"
        csv_path = dest / "parkinsons_multi.data"
        download_file(url_multi2, csv_path, "UCI Parkinson's data file")
    else:
        extract_zip(zip_path2, dest)

    print("  [OK] UCI Parkinson's Speech downloaded.")


def download_uci_parkinson_telemonitoring():
    """UCI Parkinson's Telemonitoring — longitudinal UPDRS severity scores."""
    section("UCI Parkinson's Telemonitoring Dataset (UCI ML Repo #189)")
    dest = RAW / "uci_parkinson_telemonitoring"

    url = "https://archive.ics.uci.edu/static/public/189/parkinsons+telemonitoring.zip"
    zip_path = dest / "parkinson_telemonitoring.zip"
    if download_file(url, zip_path, "UCI Parkinson's Telemonitoring"):
        extract_zip(zip_path, dest)

    print("  [OK] UCI Parkinson's Telemonitoring downloaded.")


def download_mdvr_kcl():
    """MDVR-KCL — Mobile device Parkinson's recordings with Hoehn & Yahr scores."""
    section("MDVR-KCL (Zenodo #2867215)")
    dest = RAW / "mdvr_kcl"
    dest.mkdir(parents=True, exist_ok=True)

    # Use Zenodo REST API to get actual file download links
    print("  Fetching file list from Zenodo API...")
    try:
        api_url = "https://zenodo.org/api/records/2867215"
        resp = requests.get(api_url, timeout=30)
        resp.raise_for_status()
        record = resp.json()
        files = record.get("files", [])
        if not files:
            # newer Zenodo API format
            files = record.get("metadata", {}).get("relations", {})
        print(f"  Found {len(files)} files in Zenodo record")
        for f in files:
            fname = f.get("key") or f.get("filename")
            furl  = f.get("links", {}).get("self") or f.get("links", {}).get("download")
            if fname and furl:
                fpath = dest / fname
                if download_file(furl, fpath, f"MDVR-KCL {fname}"):
                    if fname.endswith(".zip"):
                        extract_zip(fpath, dest)
                    elif fname.endswith((".tar.gz", ".tar.bz2")):
                        extract_tar(fpath, dest)
        print("  [OK] MDVR-KCL downloaded.")
    except Exception as e:
        print(f"  [ERROR] Zenodo API failed: {e}")
        # Fallback: try Kaggle mirror
        print("  Trying Kaggle mirror...")
        try:
            result = subprocess.run(
                ["kaggle", "datasets", "download", "-d", "nutansingh/mdvr-kcl-dataset",
                 "-p", str(dest), "--unzip"],
                check=True, capture_output=True, text=True
            )
            print("  [OK] MDVR-KCL downloaded via Kaggle.")
        except Exception as e2:
            print(f"  [INFO] Kaggle also failed: {e2}")
            print(f"         Manual download: https://zenodo.org/record/2867215")
            print(f"         Or Kaggle: https://www.kaggle.com/datasets/nutansingh/mdvr-kcl-dataset")
            print(f"         Place files in: {dest}")


def download_als_mendeley():
    """ALS Voice Dataset (Mendeley Data) — sustained vowels, ALS + healthy."""
    section("ALS Voice Dataset (Mendeley Data)")
    dest = RAW / "als_mendeley"
    dest.mkdir(parents=True, exist_ok=True)

    # Use Mendeley Data API to get file download links
    print("  Fetching file list from Mendeley Data API...")
    try:
        api_url = "https://data.mendeley.com/api/datasets/fbhc38zzm9/2/files"
        headers = {"Accept": "application/json"}
        resp = requests.get(api_url, headers=headers, timeout=30)
        resp.raise_for_status()
        files = resp.json()
        print(f"  Found {len(files)} files in Mendeley dataset")
        for f in files:
            fname = f.get("filename") or f.get("name")
            furl  = f.get("content_details", {}).get("download_url") or f.get("download_url")
            size  = f.get("size", 0)
            if fname and furl:
                fpath = dest / fname
                print(f"  Downloading {fname} ({size/1024/1024:.1f} MB)")
                if download_file(furl, fpath, fname):
                    if fname.endswith(".zip"):
                        extract_zip(fpath, dest)
                    elif fname.endswith((".tar.gz", ".tar.bz2")):
                        extract_tar(fpath, dest)
        print("  [OK] ALS Mendeley downloaded.")
    except Exception as e:
        print(f"  [ERROR] Mendeley API: {e}")
        print(f"  [INFO] Manual download: https://data.mendeley.com/datasets/fbhc38zzm9/2")
        print(f"         Click 'Download All (ZIP)' and place in: {dest}")


def download_sep28k():
    """SEP-28k Apple Stuttering Dataset — 28k clips, 5 stutter event types."""
    section("SEP-28k Stuttering Events Dataset (Apple / GitHub)")
    dest = RAW / "sep28k"

    # Clone the label repo (does not include audio — audio comes from podcast URLs)
    repo_url = "https://github.com/apple/ml-stuttering-events-dataset.git"
    if clone_repo(repo_url, dest / "labels_repo"):
        print("  [OK] SEP-28k labels cloned.")

    # The audio clips must be downloaded from podcast URLs listed in the CSV
    # We provide a downloader script for that
    audio_script = dest / "download_audio.py"
    audio_script.write_text("""#!/usr/bin/env python3
\"\"\"
Downloads SEP-28k audio clips from podcast URLs.
Run AFTER cloning the labels repo.
Reads: labels_repo/SEP-28k-clips.csv
Output: audio/ directory with 3-second WAV clips
\"\"\"
import csv, os, subprocess
from pathlib import Path

LABELS_CSV = Path(__file__).parent / "labels_repo" / "SEP-28k-clips.csv"
AUDIO_DIR  = Path(__file__).parent / "audio"
AUDIO_DIR.mkdir(exist_ok=True)

if not LABELS_CSV.exists():
    print(f"Labels CSV not found: {LABELS_CSV}")
    exit(1)

with open(LABELS_CSV) as f:
    rows = list(csv.DictReader(f))

print(f"Downloading {len(rows)} clips...")
for i, row in enumerate(rows):
    out_file = AUDIO_DIR / f"{row['EpId']}_{row['ClipId']}.wav"
    if out_file.exists():
        continue
    try:
        url = row["URL"]
        start = float(row["Start"])
        # Use ffmpeg to extract 3-second clip from stream URL
        cmd = [
            "ffmpeg", "-ss", str(start), "-i", url,
            "-t", "3", "-ar", "16000", "-ac", "1",
            "-loglevel", "error", str(out_file)
        ]
        subprocess.run(cmd, timeout=30, check=True)
        if i % 500 == 0:
            print(f"  {i}/{len(rows)} clips downloaded")
    except Exception as e:
        pass  # Some podcast URLs may be expired

print("Done. Run this script again to retry failed downloads.")
""")
    print(f"  [INFO] Audio downloader script written to: {audio_script}")
    print("         Run it with: python3 download_audio.py")
    print("         Requires: ffmpeg installed (brew install ffmpeg)")


def download_italian_parkinsons_hf():
    """Italian Parkinson's Voice and Speech dataset from Hugging Face."""
    section("Italian Parkinson's Voice & Speech (Hugging Face)")
    dest = RAW / "italian_parkinsons"
    hf_download("birgermoell/Italian_Parkinsons_Voice_and_Speech", dest)
    print("  [OK] Italian Parkinson's downloaded.")


def download_dysarthria_hf():
    """TORGO-derived dysarthria dataset from Hugging Face."""
    section("Dysarthria Dataset (Hugging Face — birgermoell/dysarthria)")
    dest = RAW / "dysarthria_hf"
    hf_download("birgermoell/dysarthria", dest)
    print("  [OK] Dysarthria HF downloaded.")


def download_sep28k_fluencybank_hf():
    """FluencyBank stuttering clips via Hugging Face."""
    section("FluencyBank Stuttering Dataset (Hugging Face)")
    dest = RAW / "fluencybank"
    hf_download("Retraumatize/fluencybank-stuttering", dest)
    print("  [OK/PARTIAL] FluencyBank HF attempted.")


def download_svd():
    """Saarbrucken Voice Database — requires query form, provide wget bulk script."""
    section("Saarbrucken Voice Database (SVD)")
    dest = RAW / "svd"
    dest.mkdir(parents=True, exist_ok=True)

    # SVD provides a direct bulk download via wget with authentication cookie
    # The database is publicly accessible without login
    print("  Attempting SVD bulk download via wget recursive...")

    # Try the direct data access URL pattern
    svd_base = "https://stimmdb.coli.uni-saarland.de/download/"
    script_path = dest / "download_svd.sh"
    script_path.write_text("""#!/bin/bash
# SVD Bulk Download Script
# The Saarbrücken Voice Database (SVD) supports bulk download
# Visit: https://stimmdb.coli.uni-saarland.de/
# Use the "Download" section to select all pathologies and download

# Alternative: use the API endpoint for bulk access
# The database provides .tar.gz archives for different pathology groups

BASE_URL="https://stimmdb.coli.uni-saarland.de"
DEST="$(dirname "$0")"

echo "SVD requires selecting recordings via the web interface."
echo "Visit: https://stimmdb.coli.uni-saarland.de/"
echo "1. Click 'Query' -> Select all speakers and pathologies"
echo "2. Download the resulting archive"
echo "3. Place the downloaded files in: $DEST"
echo ""
echo "Alternatively, contact: stimmdb@coli.uni-saarland.de for bulk access"
""")
    os.chmod(script_path, 0o755)

    # Try direct wget approach for SVD open data
    try:
        result = subprocess.run(
            ["wget", "-q", "--spider",
             "https://stimmdb.coli.uni-saarland.de/"],
            capture_output=True, timeout=10
        )
        if result.returncode == 0:
            print("  [INFO] SVD website reachable.")
        print(f"  [MANUAL] SVD requires web interface selection.")
        print(f"           Script written to: {script_path}")
        print(f"           Visit: https://stimmdb.coli.uni-saarland.de/")
    except Exception:
        print(f"  [INFO] SVD download script written to: {script_path}")


def download_voiced_physionet():
    """VOICED dataset from PhysioNet — open access, no credential needed."""
    section("VOICED Database (PhysioNet)")
    dest = RAW / "voiced"
    dest.mkdir(parents=True, exist_ok=True)

    base_url = "https://physionet.org/content/voiced/1.0.0/"

    # PhysioNet open datasets support wget recursive
    print("  Downloading VOICED via wget recursive...")
    try:
        cmd = [
            "wget", "-r", "-N", "-c", "-np",
            "--no-check-certificate",
            "-P", str(dest),
            "-q", "--show-progress",
            base_url
        ]
        subprocess.run(cmd, check=True, timeout=300)
        print("  [OK] VOICED downloaded.")
    except subprocess.CalledProcessError:
        print("  [FALLBACK] Trying individual file download...")
        # Fallback: download manifest and then files
        files_url = base_url + "SHA256SUMS.txt"
        manifest_path = dest / "SHA256SUMS.txt"
        if download_file(files_url, manifest_path, "VOICED manifest"):
            print(f"  [INFO] Manifest saved to {manifest_path}")
            print(f"         Full download: wget -r -N -c -np {base_url} -P {dest}")
    except subprocess.TimeoutExpired:
        print("  [TIMEOUT] VOICED download timed out — run manually:")
        print(f"  wget -r -N -c -np {base_url} -P {dest}")


def download_torgo():
    """TORGO Database — dysarthric speech from UofT."""
    section("TORGO Database (University of Toronto)")
    dest = RAW / "torgo"
    dest.mkdir(parents=True, exist_ok=True)

    # TORGO data is available via HTTP from UofT
    # The files are organized by speaker
    speakers = ["F01", "F03", "F04", "M01", "M02", "M03", "M04", "M05",
                "FC1", "FC2", "FC3", "MC1", "MC2", "MC3", "MC4"]

    torgo_base = "http://www.cs.toronto.edu/~complingweb/data/TORGO/"

    print(f"  Attempting TORGO download for {len(speakers)} speakers...")

    # First check if accessible
    try:
        resp = requests.head(torgo_base, timeout=10)
        if resp.status_code == 200:
            print("  [INFO] TORGO server reachable, starting download...")
            for spk in speakers:
                zip_url = f"{torgo_base}{spk}.tar.bz2"
                zip_path = dest / f"{spk}.tar.bz2"
                if download_file(zip_url, zip_path, f"TORGO {spk}"):
                    print(f"    Extracting {spk}...")
                    try:
                        with tarfile.open(zip_path, "r:bz2") as t:
                            t.extractall(dest)
                        zip_path.unlink()
                    except Exception as e:
                        print(f"    [WARN] Could not extract {spk}: {e}")
        else:
            raise Exception(f"HTTP {resp.status_code}")
    except Exception as e:
        print(f"  [INFO] TORGO direct download unavailable ({e})")
        print(f"         Visit: http://www.cs.toronto.edu/~complingweb/data/TORGO/torgo.html")
        print(f"         Or via Hugging Face: huggingface.co/datasets/birgermoell/dysarthria")

        # Try Hugging Face TORGO mirror
        print("  Trying TORGO via Hugging Face mirror...")
        hf_download("speech-recognition-community-v2/torgo", dest / "hf_mirror")


def download_voc_als():
    """VOC-ALS (Synapse) — requires free registration + DUA."""
    skip_section(
        "VOC-ALS 2024 (Synapse syn53009474)",
        "Requires Synapse account + Data Use Agreement (free but credentialed)",
        "\n".join([
            "1. Register at: https://www.synapse.org/register",
            "2. Visit: https://www.synapse.org/Synapse:syn53009474",
            "3. Accept the Data Use Agreement",
            "4. Download using Synapse client:",
            "   pip install synapseclient",
            "   synapse get -r syn53009474 --downloadLocation raw/voc_als/",
        ])
    )


def download_uaspeech():
    """UASpeech — dysarthric speech, requires email request."""
    skip_section(
        "UASpeech (University of Illinois)",
        "Free but requires email request for access",
        "\n".join([
            "1. Email: uaspeech-requests@lists.illinois.edu",
            "2. Subject: 'UASpeech Dataset Request'",
            "3. Mention: research purpose, institution, IRB if applicable",
            "4. After approval, download and place in: raw/uaspeech/",
            "5. Also available on IEEE DataPort: https://ieee-dataport.org/documents/uaspeech",
        ])
    )


def download_easycall():
    """EasyCall Corpus — Italian dysarthric speech, FTP request."""
    skip_section(
        "EasyCall Corpus (University of Ferrara)",
        "Requires FTP access request from research group",
        "\n".join([
            "1. Visit: http://neurolab.unife.it/easycallcorpus/",
            "2. Fill the data access request form on the website",
            "3. After receiving FTP credentials:",
            "   wget -r ftp://<user>:<pass>@<ftp_host>/ -P raw/easycall/",
        ])
    )


def download_avfad():
    """AVFAD — Portuguese voice pathology, contact authors."""
    skip_section(
        "AVFAD — Advanced Voice Function Assessment Database",
        "Contact authors at University of Aveiro (Prof. Luis Jesus)",
        "\n".join([
            "1. Email: lmjesus@ua.pt (Prof. Luis Jesus, University of Aveiro)",
            "2. Reference the IntechOpen chapter:",
            "   https://www.intechopen.com/chapters/55960",
            "3. After receiving data, place in: raw/avfad/",
        ])
    )


def download_bridge2ai():
    """Bridge2AI Voice (PhysioNet) — multi-disorder, credentialed DUA."""
    skip_section(
        "Bridge2AI-Voice (PhysioNet b2ai-voice v3.0.0)",
        "Requires PhysioNet credentialed account + Data Use Agreement",
        "\n".join([
            "1. Create PhysioNet account: https://physionet.org/register/",
            "2. Complete CITI training (human subjects)",
            "3. Visit: https://physionet.org/content/b2ai-voice/3.0.0/",
            "4. Sign the DUA and wait for approval",
            "5. Download with:",
            "   wget -r -N -c -np --user=<user> --ask-password \\",
            "     https://physionet.org/files/b2ai-voice/3.0.0/ -P raw/bridge2ai/",
        ])
    )


def download_fluencybank_talkbank():
    """FluencyBank (TalkBank) — open portion downloadable."""
    section("FluencyBank (TalkBank) — Open Portion")
    dest = RAW / "fluencybank" / "talkbank"
    dest.mkdir(parents=True, exist_ok=True)

    # TalkBank public access for teaching data
    print("  Downloading FluencyBank public/teaching portion...")
    urls = [
        "https://media.talkbank.org/fluency/",
    ]
    try:
        cmd = [
            "wget", "-r", "-N", "-c", "-np", "-l", "3",
            "--accept", "*.wav,*.mp3,*.cha,*.csv",
            "-P", str(dest),
            "-q", "--show-progress",
            "https://media.talkbank.org/fluency/"
        ]
        subprocess.run(cmd, check=True, timeout=600)
        print("  [OK] FluencyBank public portion downloaded.")
    except Exception as e:
        print(f"  [INFO] FluencyBank TalkBank direct download: {e}")
        print(f"         Visit: https://fluency.talkbank.org/access/")
        print(f"         Register for full access at: https://talkbank.org/share/")


def write_download_log(results: dict):
    """Write summary of what was downloaded vs manual."""
    log_path = RAW / "download_status.json"
    with open(log_path, "w") as f:
        json.dump(results, f, indent=2)
    print(f"\n  Download status saved to: {log_path}")


# ─────────────────────────────────────────────────────────────────────────────
# MAIN
# ─────────────────────────────────────────────────────────────────────────────

def main():
    print("\n" + "="*60)
    print("  AI Speech & Voice Analysis — Dataset Downloader")
    print("="*60)
    print(f"  Base directory: {BASE}")
    print(f"  Raw data directory: {RAW}\n")

    # ── Fully automated downloads ──────────────────────────────────────────
    print("\n[PHASE 1] Automated Downloads")
    download_uci_parkinson_speech()
    download_uci_parkinson_telemonitoring()
    download_mdvr_kcl()
    download_als_mendeley()
    download_sep28k()
    download_italian_parkinsons_hf()
    download_dysarthria_hf()
    download_sep28k_fluencybank_hf()
    download_voiced_physionet()
    download_torgo()
    download_svd()
    download_fluencybank_talkbank()

    # ── Gated downloads (manual steps required) ───────────────────────────
    print("\n\n[PHASE 2] Manual / Gated Downloads — Action Required")
    download_voc_als()
    download_uaspeech()
    download_easycall()
    download_avfad()
    download_bridge2ai()

    # ── Final summary ──────────────────────────────────────────────────────
    print("\n" + "="*60)
    print("  DOWNLOAD SUMMARY")
    print("="*60)

    auto_datasets = [
        "uci_parkinson_speech",
        "uci_parkinson_telemonitoring",
        "mdvr_kcl",
        "als_mendeley",
        "sep28k",
        "italian_parkinsons",
        "dysarthria_hf",
        "fluencybank",
        "voiced",
        "torgo",
        "svd",
    ]
    manual_datasets = [
        "voc_als        → synapse.org/Synapse:syn53009474",
        "uaspeech       → email uaspeech-requests@lists.illinois.edu",
        "easycall       → neurolab.unife.it/easycallcorpus/",
        "avfad          → email lmjesus@ua.pt",
        "bridge2ai      → physionet.org/content/b2ai-voice/3.0.0/",
    ]

    print("\n  Auto-downloaded (check raw/ directories):")
    for ds in auto_datasets:
        path = RAW / ds
        size = sum(f.stat().st_size for f in path.rglob("*") if f.is_file()) if path.exists() else 0
        size_mb = size / (1024 * 1024)
        status = f"{size_mb:.1f} MB" if size > 0 else "EMPTY — check logs above"
        print(f"    {'[OK]' if size > 0 else '[!!]'} {ds:<35} {status}")

    print("\n  Manual downloads still needed:")
    for ds in manual_datasets:
        print(f"    [MANUAL] {ds}")

    print("\n  SEP-28k audio clips:")
    print("    Run: python3 raw/sep28k/download_audio.py")
    print("    (requires ffmpeg: brew install ffmpeg)")
    print()


if __name__ == "__main__":
    main()
