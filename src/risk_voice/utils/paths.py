from pathlib import Path


PROJECT_ROOT = Path(__file__).resolve().parents[3]
DATASET_DIR = PROJECT_ROOT / "data_sets" / "arranged_dataset"
DATASET_SCRIPTS_DIR = DATASET_DIR / "scripts"
MODEL_DIR = DATASET_DIR / "04_model_ready_outputs" / "models"

PREVENTIVE_MODEL_PATH = MODEL_DIR / "preventive_risk_level_model.joblib"
VOICE_MODEL_PATH = MODEL_DIR / "voice_abnormality_model.joblib"
PREVENTIVE_ENGINE_PATH = DATASET_SCRIPTS_DIR / "preventive_risk_engine.py"
VOICE_FEATURE_SCRIPT_PATH = DATASET_SCRIPTS_DIR / "extract_voice_features.py"
