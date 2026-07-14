"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { register } from "../lib/api";
import { saveAuth } from "../lib/auth";

// Updated to match navbar color scheme (green/healthcare theme)
const D = {
  bg:          "oklch(0.985 0.004 150)",
  surface:     "#ffffff",
  border:      "oklch(0.92 0.008 145)",
  borderStrong:"oklch(0.86 0.012 145)",
  text:        "oklch(0.22 0.015 150)",
  textMuted:   "oklch(0.48 0.015 150)",
  textDim:     "oklch(0.62 0.012 150)",
  accent:      "oklch(0.62 0.14 150)",
  accentSoft:  "oklch(0.96 0.025 150)",
  accentInk:   "oklch(0.38 0.08 150)",
  high:        "oklch(0.62 0.16 25)",
  highSoft:    "oklch(0.95 0.04 25)",
  shadowLg:    "0 12px 40px rgba(15,32,60,0.10)",
};

const inputStyle: React.CSSProperties = {
  width: "100%", padding: "11px 14px", borderRadius: 8,
  border: `1px solid ${D.borderStrong}`,
  background: D.surface, fontSize: 14, color: D.text,
  fontFamily: "inherit", outline: "none", boxSizing: "border-box",
};

function Field({
  label, hint, children,
}: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label style={{ display: "block", fontSize: 12.5, fontWeight: 600,
                      color: D.text, marginBottom: 6 }}>{label}</label>
      {children}
      {hint && (
        <div style={{ fontSize: 11.5, color: D.textDim, marginTop: 5 }}>{hint}</div>
      )}
    </div>
  );
}

const STAGES = [
  { value: "pre",  label: "Pre-surgery" },
  { value: "in",   label: "In therapy"  },
  { value: "post", label: "Post-surgery" },
];

export default function RegisterPage() {
  const router = useRouter();

  const [firstName,     setFirstName]     = useState("");
  const [lastName,      setLastName]      = useState("");
  const [mobile,        setMobile]        = useState("");
  const [password,      setPassword]      = useState("");
  const [therapyStage,  setTherapyStage]  = useState("in");
  const [loading,       setLoading]       = useState(false);
  const [error,         setError]         = useState<string | null>(null);

  const pwOk      = password.length >= 8;
  const canSubmit = firstName.trim() && lastName.trim() && mobile.trim() &&
                    pwOk && !loading;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setLoading(true);
    setError(null);
    try {
      const res = await register(
        firstName.trim(), lastName.trim(),
        mobile.trim(), password, therapyStage,
      );
      saveAuth(res.token, {
        patient_id:    res.patient_id,
        name:          res.name,
        surgery_date:  res.surgery_date,
        day_number:    res.day_number,
        therapy_stage: res.therapy_stage,
      });
      router.push("/home");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{
      minHeight: "100vh", background: D.bg,
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center", padding: "40px 20px",
    }}>
      <div style={{ marginBottom: 28, textAlign: "center" }}>
        <h1 style={{ fontSize: 26, fontWeight: 700, letterSpacing: "-0.02em",
                     margin: "0 0 6px", color: D.text }}>Create your account</h1>
        <div style={{ fontSize: 13.5, color: D.textMuted }}>
          Set up your plan.
        </div>
      </div>

      <div style={{
        background: D.surface, border: `1px solid ${D.border}`,
        borderRadius: 14, padding: "28px 28px",
        boxShadow: D.shadowLg, width: "100%", maxWidth: 480,
      }}>
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 18 }}>

          {/* Name row */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Field label="First name">
              <input
                type="text" value={firstName}
                onChange={e => setFirstName(e.target.value)}
                placeholder="e.g. Sarah" autoFocus style={inputStyle}
              />
            </Field>
            <Field label="Last name">
              <input
                type="text" value={lastName}
                onChange={e => setLastName(e.target.value)}
                placeholder="e.g. Johnson" style={inputStyle}
              />
            </Field>
          </div>

          {/* Mobile */}
          <Field label="Mobile number" hint="Used to sign in — we never share your number.">
            <input
              type="tel" value={mobile}
              onChange={e => setMobile(e.target.value)}
              placeholder="+44 7700 000000" inputMode="tel" style={inputStyle}
            />
          </Field>

          {/* Password */}
          <Field
            label="Password"
            hint={password.length > 0 && !pwOk ? "Minimum 8 characters" : "Minimum 8 characters"}
          >
            <input
              type="password" value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              style={{
                ...inputStyle,
                borderColor: password.length > 0 && !pwOk
                  ? D.high : D.borderStrong,
              }}
            />
          </Field>

          <div>
            <div style={{ fontSize: 12.5, fontWeight: 600, color: D.text, marginBottom: 8 }}>
              Therapy stage
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              {STAGES.map(s => {
                const active = therapyStage === s.value;
                return (
                  <button
                    key={s.value} type="button"
                    onClick={() => setTherapyStage(s.value)}
                    style={{
                      flex: 1, padding: "9px 0", borderRadius: 8,
                      border: `1.5px solid ${active ? D.accent : D.border}`,
                      background: active ? D.accentSoft : D.surface,
                      color: active ? D.accentInk : D.textMuted,
                      fontSize: 13, fontWeight: active ? 700 : 500,
                      cursor: "pointer", fontFamily: "inherit",
                      transition: "all .15s",
                    }}
                  >
                    {s.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Disclaimer */}
          <label style={{
            display: "flex", alignItems: "flex-start", gap: 10,
            fontSize: 12.5, color: D.textMuted, lineHeight: 1.5, cursor: "default",
          }}>
            <span style={{
              width: 16, height: 16, borderRadius: 4, flexShrink: 0, marginTop: 1,
              border: `1.5px solid ${D.accent}`, background: D.accent,
              display: "inline-flex", alignItems: "center", justifyContent: "center",
            }}>
              <svg width="10" height="10" viewBox="0 0 10 10">
                <path d="M2 5 L4 7 L8 3" stroke="#fff" strokeWidth="1.6" fill="none"
                  strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
            I understand this system supports monitoring only and does not provide a medical diagnosis.
          </label>

          {/* Error */}
          {error && (
            <div style={{
              padding: "10px 14px",
              background: D.highSoft, border: `1px solid oklch(0.85 0.06 25)`,
              borderRadius: 8, color: D.high, fontSize: 13,
            }}>
              {error}
            </div>
          )}

          {/* Submit */}
          <button
            type="submit" disabled={!canSubmit}
            style={{
              width: "100%", padding: "13px 16px", borderRadius: 8, border: "none",
              background: canSubmit ? D.accent : "oklch(0.82 0.005 150)",
              color: "#fff", fontSize: 14.5, fontWeight: 700,
              cursor: canSubmit ? "pointer" : "not-allowed", fontFamily: "inherit",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              transition: "background .15s",
            }}
          >
            {loading ? (
              <>
                <span style={{
                  width: 16, height: 16, border: "2px solid rgba(255,255,255,.4)",
                  borderTopColor: "#fff", borderRadius: "50%",
                  animation: "spin 0.8s linear infinite", display: "inline-block",
                }} />
                Creating account…
              </>
            ) : "Create account"}
          </button>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </form>
      </div>

      <div style={{ marginTop: 20, fontSize: 13, color: D.textMuted, textAlign: "center" }}>
        Already registered?{" "}
        <Link href="/login" style={{ color: D.accentInk, fontWeight: 600, textDecoration: "none" }}>
          Sign in
        </Link>
      </div>
    </div>
  );
}