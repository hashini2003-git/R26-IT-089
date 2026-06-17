import type { LoginResponse, Patient, RegisterResponse } from "./types";

const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

function authHeaders(): Record<string, string> {
  if (typeof window === "undefined") return {};
  const token = localStorage.getItem("oc_token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { detail?: string }).detail ?? `Request failed (${res.status})`);
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