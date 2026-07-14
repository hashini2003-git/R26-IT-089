import type { Patient } from "./types";

const TOKEN_KEY   = "oc_token";
const PATIENT_KEY = "oc_patient";

// Auth listeners for components to subscribe to auth changes
let authListeners: (() => void)[] = [];

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function isLoggedIn(): boolean {
  return !!getToken();
}

export function saveAuth(token: string, patient: Patient): void {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(PATIENT_KEY, JSON.stringify(patient));
  // Notify all subscribed listeners
  notifyListeners();
}

export function getPatient(): Patient | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(PATIENT_KEY);
  if (!raw) return null;
  try { return JSON.parse(raw) as Patient; } catch { return null; }
}

export function clearAuth(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(PATIENT_KEY);
  // Notify all subscribed listeners
  notifyListeners();
}

// Subscribe to auth changes - returns an unsubscribe function
export function subscribeToAuthChanges(listener: () => void): () => void {
  authListeners.push(listener);
  return () => {
    authListeners = authListeners.filter(l => l !== listener);
  };
}

// Notify all listeners
function notifyListeners(): void {
  authListeners.forEach(listener => {
    try {
      listener();
    } catch (error) {
      console.error("Error in auth listener:", error);
    }
  });
}