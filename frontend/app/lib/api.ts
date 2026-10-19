import type {
  AnalysisResult,
  LoginResponse,
  Patient,
  PredictionRecord,
  ProgressPoint,
  RegisterResponse,
  RiskFactors,
  RiskResult,
  SentimentResult,
  Session,
  VoiceResult,
} from "./types";

const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8001";

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

export type CarePlan = {
  diagnosis_status: "awaiting_confirmation" | "confirmed";
  diagnosis: string; stage: string; treatment_type: string;
  treatment_status: string; next_appointment: string; instructions: string;
  tasks: { task_id?: string; title: string; detail?: string; category?: string; completed?: boolean; completed_at?: string | null }[];
  movement_ids?: ("jaw-open" | "jaw-side" | "neck-turn")[];
  updated_at?: string; doctor_name?: string;
};
export type CareNotification = { id: string; title: string; message: string; created_at: string; read: boolean };
export type LesionRecord = { record_id: string; patient_id: string; filename: string; created_at: string; image_base64: string; result: import("../Component1/_lib/ipe-ui").IpeResult };
async function careRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}/care/${path}`, { ...init, headers: { ...authHeaders(), ...(init?.headers ?? {}) } });
  return handleResponse<T>(res);
}
export const createCareShareCode = () => careRequest<{ code: string; expires_at: string }>("share-code", { method: "POST" });
export const connectCarePatient = (code: string) => careRequest<{ patient_id: string; patient_name: string }>("connect", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ code }) });
export const fetchCarePatients = () => careRequest<{ patient_id: string; patient_name: string; plan: CarePlan | null; updated_at?: string; acknowledged_at?: string | null }[]>("patients");
export const fetchCarePatientRecords = (patientId: string) => careRequest<{ records: LesionRecord[] }>(`patients/${encodeURIComponent(patientId)}/records`);
export const fetchMyLesionRecords = () => careRequest<{ records: LesionRecord[] }>("records");
export type PhotoReminder = { reminder_date: string | null; last_upload_at: string | null; doctor_connected: boolean; doctor_name: string | null };
export const fetchPhotoReminder = () => careRequest<PhotoReminder>("photo-reminder");
export const savePhotoReminder = (reminder_date: string | null) => careRequest<{ reminder_date: string | null }>("photo-reminder", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ reminder_date }) });
export const fetchMyCarePlan = () => careRequest<{ connected: boolean; doctor_name: string | null; plan: CarePlan | null; acknowledged_at: string | null; notifications: CareNotification[] }>("plan");
export const saveCarePlan = (patientId: string, plan: CarePlan) => careRequest<CarePlan>(`plan/${encodeURIComponent(patientId)}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(plan) });
export const acknowledgeCarePlan = () => careRequest<{ acknowledged_at: string }>("acknowledge", { method: "POST" });
export const updateCareTaskCompletion = (taskId: string, completed: boolean) => careRequest<CarePlan>(`tasks/${encodeURIComponent(taskId)}/completion`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ completed }) });
export const disconnectCareTeam = () => careRequest<{ disconnected: boolean }>("disconnect", { method: "POST" });
export const markCareNotificationsRead = () => careRequest<{ success: boolean }>("notifications/read", { method: "POST" });

// ── Auth ──────────────────────────────────────────────────────────────────────

export async function register(
  firstName:    string,
  lastName:     string,
  mobileNumber: string,
  password:     string,
  therapyStage: string,
  role: "patient" | "doctor" = "patient",
): Promise<RegisterResponse> {
  const res = await fetch(`${BASE}/auth/register`, {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify({
      first_name:    firstName,
      last_name:     lastName,
      mobile_number: mobileNumber,
      password,
      role,
      therapy_stage: role === "patient" ? therapyStage : null,
    }),
  });
  return handleResponse<RegisterResponse>(res);
}

export async function login(mobileNumber: string, password: string, role: "patient" | "doctor" = "patient"): Promise<LoginResponse> {
  const res = await fetch(`${BASE}/auth/login`, {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify({ mobile_number: mobileNumber, password, role }),
  });
  return handleResponse<LoginResponse>(res);
}

export async function fetchMe(): Promise<Patient> {
  const res = await fetch(`${BASE}/me`, { headers: authHeaders() });
  return handleResponse<Patient>(res);
}

// Component 4: speech and vocal-therapy APIs
export async function analyzeVoice(file: File): Promise<AnalysisResult> {
  const body = new FormData();
  body.append("file", file);
  const res = await fetch(`${BASE}/analyze`, {
    method: "POST",
    headers: authHeaders(),
    body,
  });
  return handleResponse<AnalysisResult>(res);
}

export async function fetchSessions(): Promise<Session[]> {
  const res = await fetch(`${BASE}/sessions`, { headers: authHeaders() });
  return handleResponse<Session[]>(res);
}

export async function fetchProgress(): Promise<ProgressPoint[]> {
  const res = await fetch(`${BASE}/progress`, { headers: authHeaders() });
  return handleResponse<ProgressPoint[]>(res);
}

export async function analyzeSentiment(
  text: string,
  model = "ensemble",
): Promise<SentimentResult> {
  const res = await fetch(`${BASE}/sentiment`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text, model }),
  });
  return handleResponse<SentimentResult>(res);
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
