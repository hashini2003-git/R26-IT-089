# ipe_constants.py
# IPE Framework v2.0 — All Constants
# Auto-exported from Colab Notebook

CLASS_NAMES = [
    "Normal",
    "Variation from Normal",
    "OPMD",
    "Oral Cancer"
]

SITE_NAMES = [
    "Dorsal Tongue", "Ventral Tongue",
    "Left Buccal",   "Right Buccal",
    "Upper Lip",     "Lower Lip",
    "Upper Arch",    "Lower Arch"
]

SITE_CODE_MAP = {
    "DT": 0, "VT": 1,
    "LB": 2, "RB": 3,
    "UL": 4, "LL": 5,
    "UA": 6, "LA": 7,
}

UNKNOWN_SITE = -1

CLASS_PAIN_BASE = {
    0: 0.0,
    1: 0.5,
    2: 3.5,
    3: 6.0,
}

ERYTHEMA_WEIGHT   = 2.5
ULCERATION_WEIGHT = 4.0
TEXTURE_WEIGHT    = 2.0

SITE_PAIN_BONUS = {
    0: 0.08, 1: 0.10,
    2: 0.05, 3: 0.05,
    4: 0.06, 5: 0.06,
    6: 0.03, 7: 0.03,
   -1: 0.05,
}

PROXY_PHYSIO_SCORE = {
    (0,0):0.90,(0,1):0.88,
    (0,2):0.82,(0,3):0.82,
    (0,4):0.78,(0,5):0.78,
    (0,6):0.75,(0,7):0.75,
    (1,0):0.50,(1,1):0.40,
    (1,2):0.35,(1,3):0.35,
    (1,4):0.42,(1,5):0.42,
    (1,6):0.30,(1,7):0.30,
    (2,0):0.10,(2,1):0.08,
    (2,2):0.08,(2,3):0.08,
    (2,4):0.10,(2,5):0.10,
    (2,6):0.08,(2,7):0.08,
    (3,0):0.05,(3,1):0.05,
    (3,2):0.05,(3,3):0.05,
    (3,4):0.05,(3,5):0.05,
    (3,6):0.05,(3,7):0.05,
}

SITE_FIS_WEIGHT = {
     0: [0.80, 0.60, 0.30],
     1: [0.85, 0.75, 0.25],
     2: [0.45, 0.40, 0.65],
     3: [0.45, 0.40, 0.65],
     4: [0.65, 0.30, 0.20],
     5: [0.65, 0.30, 0.20],
     6: [0.20, 0.50, 0.45],
     7: [0.20, 0.50, 0.45],
    -1: [0.45, 0.45, 0.40],
}

CLASS_FIS_MULTIPLIER = {
    0: 0.00,
    1: 0.20,
    2: 0.55,
    3: 0.92,
}

PERADENIYA_CLASS_MAP = {
    "Healthy" : 0,
    "Benign"  : 1,
    "OPMD"    : 2,
    "OCA"     : 3,
}
