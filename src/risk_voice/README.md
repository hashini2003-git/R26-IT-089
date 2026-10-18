# Member 2 — Risk and Voice Monitoring

This package contains the structured preventive-risk model, WAV-compatible voice
analysis, gender-aware pitch reference, multimodal 70/30 fusion, and patient-scoped
MongoDB history for Component 2.

It is mounted by `src.api.main` at `/risk-voice`. All `/api/*` routes require the
existing patient JWT as a Bearer token.

## Routes

- `POST /risk-voice/api/predict/risk-factors`
- `POST /risk-voice/api/predict/voice`
- `POST /risk-voice/api/predict/multimodal`
- `GET /risk-voice/api/history`
- `GET /risk-voice/api/predictions`

The voice and multimodal routes accept multipart audio under `file`. Supported
extensions are WAV, M4A, MP4, AAC, and 3GP. The optional `gender` field is used
only for supportive pitch interpretation and does not change the ML probability.

The corresponding Next.js UI is under `frontend/app/component2`.

## Run

From the repository root:

```powershell
.venv\Scripts\python.exe -m uvicorn src.api.main:app --reload --port 8000
```

From `frontend/`:

```powershell
npm run dev
```

Open `http://localhost:3000/component2` after signing in.
