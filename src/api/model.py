# src/api/model.py
# ═══════════════════════════════════════════════════════════════
# IPE Model Loader
# Loads ViT-B/16 model once at startup
# Used by all prediction routes
# ═══════════════════════════════════════════════════════════════

import torch
import torch.nn as nn
import torchvision.models as models
import os
from pathlib import Path
import logging

logger = logging.getLogger(__name__)

# ── Model path ────────────────────────────────────────────────
MODEL_PATH = Path(
    os.getenv(
        "IPE_MODEL_PATH",
        str(Path(__file__).parent / "models" / "ipe_best_model_v2.pth"),
    )
).expanduser().resolve()

# ── Device ────────────────────────────────────────────────────
DEVICE = torch.device("cuda" if torch.cuda.is_available()
                      else "cpu")


# ── Model Architecture (same as Colab Cell 17) ───────────────
class IPEModel(nn.Module):
    def __init__(self, num_classes=4, dropout=0.5):
        super(IPEModel, self).__init__()

        vit = models.vit_b_16(weights=None)
        self.backbone    = vit
        self.feature_dim = 768
        self.backbone.heads = nn.Identity()

        self.projector = nn.Sequential(
            nn.Linear(self.feature_dim, 512),
            nn.LayerNorm(512),
            nn.GELU(),
            nn.Dropout(dropout),
        )
        self.class_head = nn.Sequential(
            nn.Linear(512, 128),
            nn.GELU(),
            nn.Dropout(dropout),
            nn.Linear(128, num_classes),
        )
        self.erythema_head = nn.Sequential(
            nn.Linear(512, 64),
            nn.GELU(),
            nn.Dropout(dropout),
            nn.Linear(64, 1),
            nn.Sigmoid(),
        )
        self.ulcer_head = nn.Sequential(
            nn.Linear(512, 64),
            nn.GELU(),
            nn.Dropout(dropout),
            nn.Linear(64, 1),
            nn.Sigmoid(),
        )
        self.texture_head = nn.Sequential(
            nn.Linear(512, 64),
            nn.GELU(),
            nn.Dropout(dropout),
            nn.Linear(64, 1),
            nn.Sigmoid(),
        )
        self.physio_head = nn.Sequential(
            nn.Linear(512, 64),
            nn.GELU(),
            nn.Dropout(dropout),
            nn.Linear(64, 1),
            nn.Sigmoid(),
        )

    def forward(self, x):
        features     = self.backbone(x)
        proj         = self.projector(features)
        class_logits = self.class_head(proj)
        erythema     = self.erythema_head(proj).squeeze(1)
        ulceration   = self.ulcer_head(proj).squeeze(1)
        texture      = self.texture_head(proj).squeeze(1)
        physio_score = self.physio_head(proj).squeeze(1)

        return {
            "class_logits": class_logits,
            "erythema"    : erythema,
            "ulceration"  : ulceration,
            "texture"     : texture,
            "physio_score": physio_score,
        }


# ── Global model instance ─────────────────────────────────────
_model = None


def load_model():
    """Load model once at startup."""
    global _model
    if _model is not None:
        return _model

    logger.info(f"Loading IPE model from {MODEL_PATH}")
    logger.info(f"Device: {DEVICE}")

    if not MODEL_PATH.exists():
        raise FileNotFoundError(
            f"Model not found: {MODEL_PATH}"
        )

    _model = IPEModel(num_classes=4, dropout=0.5)
    _model.to(DEVICE)

    checkpoint = torch.load(
        MODEL_PATH,
        map_location=DEVICE,
        weights_only=False,
    )
    _model.load_state_dict(checkpoint["model_state"])
    _model.eval()

    logger.info("IPE Model loaded successfully!")
    return _model


def get_model():
    """Get loaded model instance."""
    global _model
    if _model is None:
        load_model()
    return _model
