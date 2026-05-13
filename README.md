# Oral-Health-Care-AI-Research
EARLY DETECTION AND PREVENTION OF ORAL CANCER USING DATA ANALYSIS AND INTELLIGENT TECHNOLOGIES TO SUPPORT BETTER HEALTHCARE DECISIONS

---

## 1) Repository Structure

```
Oral-Health-Care-AI-Research/
│
├── components/
│   ├── member-1_oral-lesion-analysis/        # IPE Framework – Visual lesion classification & pain scoring
│   ├── member-2_risk-and-voice-monitoring/   # Risk assessment & voice-based progression tracking
│   ├── member-3_speech-therapy-support/      # Speech/voice analysis, severity classification & care planning
│   └── member-4_meditation-environment/      # AI-powered personalized meditation for cancer patients
│
├── shared/
│   ├── utils/                                # Common utility functions (preprocessing, scoring helpers)
│   ├── datasets/                             # Dataset download links/scripts (no raw patient data)
│   └── configs/                              # Shared configuration files
│
├── docs/                                     # Research documentation and references
├── requirements.txt                          # Python dependencies
└── README.md                                 # Project documentation
```

**Why this structure?**
- Keeps each member's work modular and independently testable.
- Reduces merge conflicts by isolating code and using shared utilities.
- Supports gradual integration into a single end-to-end system.

---

## 2) Component Descriptions

### IT22171924 — Oral Lesion Analysis & Integrated Patient Experience (IPE) Framework
This component implements the **Integrated Patient Experience (IPE) Framework**, a novel contribution designed to move beyond conventional diagnostic classification. While existing AI-based oral cancer detection systems primarily focus on binary or multi-class pathological classification, the IPE Framework addresses a clinically significant gap: the objective, image-based quantification of a patient's subjective experience of pain and functional impairment arising from oral mucosal disease.

The framework operates through a **two-phase scoring architecture**:
- **Phase 1:** A class-based baseline pain score is assigned based on tissue category — Normal, Variation from Normal (VfN), Oral Potentially Malignant Disorder (OPMD), or Oral Cancer.
- **Phase 2:** Three visual morphological features — erythema intensity, ulceration area, and texture roughness — modulate the baseline score to produce a final **Predicted Pain Intensity (PPI)** score on a standardized 0–10 scale.

A **Physiological Filter (v2.0)** prevents false-positive pain scoring from normal anatomical variations (e.g., circumvallate papillae, high vascularity areas) that visually resemble pathological features.

The framework also produces a **Functional Impairment Score (FIS)** across three domains: speech, swallowing, and mouth opening — derived from lesion site and severity class.

**Model:** Multi-head Vision Transformer (ViT-B/16) with five specialized prediction heads, trained on 5,461 images from the SMART-OM dataset (University of Moratuwa) and the Peradeniya Oral Lesion Dataset (University of Peradeniya).

**Deployment:** Interactive clinical interface via Gradio with real-time image upload, oral cavity guard, pain gauge, functional impairment radar, and clinical recommendations.

---

### IT22276278 — Multimodal Risk Assessment & Voice-Based Progression Monitoring
This component collects the user's **demographic and lifestyle information** (age, smoking, betel chewing, alcohol use, nutrition, oral hygiene) to calculate a **baseline oral cancer risk** using machine learning. Oral health indicators (ulcers, pain, gum disease, trauma, swallowing difficulty) further refine this into a **personalized extended risk score**.

The key novelty is the use of **weekly voice recordings as a digital biomarker** for oral cancer progression. During initial use, the user records a baseline voice sample. The same sentence is recorded weekly thereafter. Acoustic features — pitch, jitter, shimmer, MFCC, and hoarseness — are extracted and compared against baseline and previous recordings to detect progressive voice changes.

A **voice-based progression score** is generated to indicate improvement, stability, or deterioration. This score is combined with core and extended risk values to produce a **continuously updated oral cancer risk trend**, with alerts when high-risk changes are detected.

> Unlike existing oral cancer apps that perform only one-time image-based detection or questionnaire-based screening, this approach provides **continuous, non-invasive, and personalized monitoring** — a multimodal, time-aware AI framework that supports early detection and timely medical intervention.

---

### IT22285706 — Speech & Voice Analysis for Therapy Monitoring & Care Planning
This component analyzes patient **speech and voice recordings** using signal processing and AI techniques to detect abnormalities related to oral cancer — including changes in voice quality, articulation issues, and speech irregularities.

Based on the analysis, the system classifies oral cancer risk using **severity levels**. When a high-risk (red level) condition is detected, the system:
- Alerts the patient
- Recommends immediate medical consultation
- Displays available specialists for further evaluation
- Generates a **personalized care and monitoring plan** aligned with the detected condition

> This component uniquely integrates voice and speech signal analysis, severity-level classification using measurable speech features, automated clinician/speech-language therapist recommendations, and condition-specific personalized therapy care planning within a **single end-to-end workflow** — an integrated approach not commonly addressed together in existing digital health systems.

---

### IT22543882 — AI-Powered Personalized Meditation Environment
This component is an **AI-powered personalized meditation environment** designed specifically for oral cancer patients. It creates a calm and therapeutic mobile meditation experience by adapting the environment based on user preferences and interaction styles.

Users provide simple inputs: age group, preferred environment, sound preference, interaction style, preferred meditation duration, and preferred meditation time. The system personalizes the session accordingly to reduce interaction complexity and improve comfort.

The application features multiple **immersive meditation environments** (forests, beaches, rain scenes, night skies) combined with relaxing sounds and guided interactions. Controls are simplified through tap, hold, swipe, or guided breathing interactions — especially for older users.

**Machine learning** analyzes user preferences and recommends the most suitable meditation settings (environment type, session duration, sound experience). The objective is to create a lightweight, calming, and emotionally supportive digital experience that enhances relaxation and therapeutic comfort.

---

## 3) Workflow (Branching, Reviews, and Merges)

We follow a simple Git workflow to keep work organized and traceable.

### Branching Strategy
- `main` : Stable, reviewed code only (integration-ready)
- `dev`  : Ongoing integration branch (combined work)
- Feature branches:
  - `feature/<component>/<member-name>`
  - Examples:
    - `feature/oral-lesion-analysis/member-1`
    - `feature/risk-voice-monitoring/member-2`
    - `feature/speech-therapy/member-3`
    - `feature/meditation-env/member-4`

### Contribution Process
1. Create a feature branch from `dev`
2. Implement changes with clear commits (small + meaningful)
3. Open a Pull Request (PR) to `dev`
4. At least one team member reviews before merging
5. Weekly (or milestone-based) merge from `dev` → `main`

### Commit Message Format
Use short, consistent messages:
- `feat(oral-lesion): add ViT-B/16 multi-head classification model`
- `feat(risk-voice): add MFCC feature extraction for voice baseline`
- `feat(speech-therapy): add severity-level classification pipeline`
- `feat(meditation): add environment personalization recommendation model`
- `fix(shared): handle missing values in risk scoring pipeline`

---

## 4) Merge Records (Dates + Evidence)

All merges are recorded in **two places**:
1. **Git history (source of truth)**
2. A human-readable record below (for assessment convenience)

> Tip: You can generate Git evidence using:
> `git log --merges --date=short --pretty=format:"%ad | %h | %s"`

### Merge Log (Maintain This Table)

| Date (YYYY-MM-DD) | From Branch → To Branch | PR/Commit Ref | Summary | Merged By |
|---|---|---|---|---|
| 2026-03-10 | feature/oral-lesion-analysis/member-1 → dev | (commit-hash/PR#) | Added ViT model, IPE scoring framework | (hashini-nv) |
| 2026-03-11 | feature/risk-voice-monitoring/member-2 → dev | (commit-hash/PR#) | Added lifestyle risk scoring and MFCC voice baseline pipeline | (tharaka-nv) |
| 2026-03-11 | feature/speech-therapy/member-3 → dev | (commit-hash/PR#) | Added voice severity classifier and personalized care plan generator | (supipi-nv) |
| 2026-03-10 | feature/meditation-env/member-4 → dev | (commit-hash/PR#) | Added ML-based meditation personalization and immersive UI | (praveen-nv) |
| 2026-03-20 | dev → main | (commit-hash/PR#) | PP1 milestone merge: stable preprocessing and baseline models integrated | (hashini-nv) |

**Rules**
- No direct commits to `main`
- All merges must reference a PR or merge commit hash
- Each merge entry must include a short summary of what changed

---

## 5) Data & Ethics Note

- Only publicly available datasets are used:
  - SMART-OM Dataset (University of Moratuwa) — oral mucosal images
  - Peradeniya Oral Lesion Dataset (University of Peradeniya) — oral lesion images
  - Any additional public datasets (Kaggle, UCI Repository, PhysioNet, etc.)
- No raw patient-identifying data is committed into this repository.
- Voice recordings used for testing are anonymized and not stored in the repository.
- If dataset files are required locally, they should be downloaded via documented links/scripts.
- All data usage complies with ethical guidelines for healthcare AI research.

---

## 6) How to Run (High-Level)

Each component has its own scripts or notebooks inside its folder. Refer to the component-level README for detailed setup.

General steps:
1. Install dependencies (Python 3.8+):
   ```bash
   pip install -r requirements.txt
   ```
2. Configure environment variables if needed.
3. Run scripts or notebooks per component:
   ```bash
   # Member 1(IT22171924) – Oral Lesion Analysis
   python components/member-1_oral-lesion-analysis/app.py

   # Member 2(IT22276278) – Risk & Voice Monitoring
   python components/member-2_risk-and-voice-monitoring/main.py

   # Member 3(IT22285706 – Speech Therapy Support
   python components/member-3_speech-therapy-support/main.py

   # Member 4(IT22543882) – Meditation Environment
   # Refer to components/member-4_meditation-environment/README.md
   ```

---

## 7) Ownership / Component Mapping

| Member | Student ID | Component | Key Technologies |
|---|---|---|---|
| Member 1 | IT22171924 | Oral Lesion Analysis & IPE Framework | ViT-B/16, Gradio, PyTorch |
| Member 2 | IT22276278| Risk Assessment & Voice Progression Monitoring | Scikit-learn, Librosa, MFCC |
| Member 3 | IT22285706| Speech & Voice Therapy Monitoring & Care Planning | Signal Processing, NLP, AI Classification |
| Member 4 | IT22543882 | AI-Powered Personalized Meditation Environment | ML Recommendation, Mobile UI |
