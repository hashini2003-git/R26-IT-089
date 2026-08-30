import type { LoginResponse, Patient, PredictionRecord, RegisterResponse, RiskFactors, RiskResult, VoiceResult } from "./types";

const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

function authHeaders(): Record<string, string> {
  if (typeof window === "undefined") return {};
  const token = localStorage.getItem("oc_token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    const detail = (err as { detail?: unknown }).detail;
    let message = `Request failed (${res.status})`;
    if (typeof detail === "string") message = detail;
    else if (Array.isArray(detail)) message = detail.map(item => typeof item === "object" && item && "msg" in item ? String(item.msg) : "Invalid value").join(" ");
    else if (detail && typeof detail === "object" && "errors" in detail && Array.isArray(detail.errors)) message = detail.errors.join(" ");
    throw new Error(message);
  }
  return res.json() as Promise<T>;
}

// ── Auth ──────────────────────────────────────────────────────────────────────

export async function register(
  firstName:    string,
  lastName:     string,
  mobileNumber: string,
  password:     string,
  therapyStage: string,
): Promise<RegisterResponse> {
  const res = await fetch(`${BASE}/auth/register`, {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify({
      first_name:    firstName,
      last_name:     lastName,
      mobile_number: mobileNumber,
      password,
      therapy_stage: therapyStage,
    }),
  });
  return handleResponse<RegisterResponse>(res);
}

export async function login(mobileNumber: string, password: string): Promise<LoginResponse> {
  const res = await fetch(`${BASE}/auth/login`, {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify({ mobile_number: mobileNumber, password }),
  });
  return handleResponse<LoginResponse>(res);
}

export async function fetchMe(): Promise<Patient> {
  const res = await fetch(`${BASE}/me`, { headers: authHeaders() });
  return handleResponse<Patient>(res);
}

// ── Component 2: authenticated risk and voice APIs ──
const RISK_VOICE_BASE = `${BASE}/risk-voice`;

export async function submitRiskFactors(payload: RiskFactors): Promise<RiskResult> {
  const res = await fetch(`${RISK_VOICE_BASE}/api/predict/risk-factors`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify(payload),
  });
  return handleResponse<RiskResult>(res);
}

export async function submitVoice(file: File, gender: string): Promise<VoiceResult> {
  const body = new FormData();
  body.append("file", file);
  body.append("gender", gender);
  const res = await fetch(`${RISK_VOICE_BASE}/api/predict/voice`, {
    method: "POST",
    headers: authHeaders(),
    body,
  });
  return handleResponse<VoiceResult>(res);
}

export async function submitMultimodal(riskFactors: RiskFactors, file: File, gender: string): Promise<RiskResult> {
  const body = new FormData();
  body.append("riskFactors", JSON.stringify(riskFactors));
  body.append("file", file);
  body.append("gender", gender);
  const res = await fetch(`${RISK_VOICE_BASE}/api/predict/multimodal`, {
    method: "POST",
    headers: authHeaders(),
    body,
  });
  return handleResponse<RiskResult>(res);
}

export async function fetchRiskVoicePredictions(limit = 50): Promise<PredictionRecord[]> {
  const res = await fetch(`${RISK_VOICE_BASE}/api/predictions?limit=${limit}`, { headers: authHeaders() });
  return handleResponse<PredictionRecord[]>(res);
}
