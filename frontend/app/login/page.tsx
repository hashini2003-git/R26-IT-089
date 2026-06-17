"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { login } from "../lib/api";
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

export default function LoginPage() {
  const router = useRouter();

  const [mobile,   setMobile]   = useState("");
  const [password, setPassword] = useState("");
  const [keepIn,   setKeepIn]   = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState<string | null>(null);

  const canSubmit = !loading && mobile.trim().length > 0 && password.length > 0;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setLoading(true);
    setError(null);
    try {
      const res = await login(mobile.trim(), password);
      saveAuth(res.token, {
        patient_id:   res.patient_id,
        name:         res.name,
        surgery_date: res.surgery_date,
        day_number:   res.day_number,
      });
      router.push("/home");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Sign in failed. Check your details and try again.");
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
                     margin: "0 0 6px", color: D.text }}>Welcome back</h1>
        <div style={{ fontSize: 13.5, color: D.textMuted }}>
          Sign in to continue.
        </div>
      </div>

      <div style={{
        background: D.surface, border: `1px solid ${D.border}`,
        borderRadius: 14, padding: "28px 28px",
        boxShadow: D.shadowLg, width: "100%", maxWidth: 420,
      }}>
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 18 }}>

          {/* Mobile */}
          <div>
            <label style={{ display: "block", fontSize: 12.5, fontWeight: 600,
                            color: D.text, marginBottom: 6 }}>
              Mobile number
            </label>
            <input
              type="tel" value={mobile}
              onChange={e => setMobile(e.target.value)}
              placeholder="Your phone number" inputMode="tel"
              autoFocus style={inputStyle}
            />
          </div>

          {/* Password */}
          <div>
            <label style={{ display: "block", fontSize: 12.5, fontWeight: 600,
                            color: D.text, marginBottom: 6 }}>
              Password
            </label>
            <input
              type="password" value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••" style={inputStyle}
            />
          </div>

          {/* Keep signed in + Forgot password */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <label style={{
              display: "flex", alignItems: "center", gap: 8,
              fontSize: 13, color: D.textMuted, cursor: "pointer",
            }}>
              <span style={{
                width: 16, height: 16, borderRadius: 4, flexShrink: 0,
                border: `1.5px solid ${keepIn ? D.accent : D.borderStrong}`,
                background: keepIn ? D.accent : D.surface,
                display: "inline-flex", alignItems: "center", justifyContent: "center",
                transition: "all .15s", cursor: "pointer",
              }}
                onClick={() => setKeepIn(v => !v)}
              >
                {keepIn && (
                  <svg width="10" height="10" viewBox="0 0 10 10">
                    <path d="M2 5 L4 7 L8 3" stroke="#fff" strokeWidth="1.6" fill="none"
                      strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </span>
              Keep me signed in
            </label>

            <a href="#" style={{
              fontSize: 13, color: D.accentInk, fontWeight: 500, textDecoration: "none",
            }}
              onClick={e => { e.preventDefault(); }}
            >
              Forgot password?
            </a>
          </div>

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
                Signing in…
              </>
            ) : "Sign in"}
          </button>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </form>
      </div>

      <div style={{ marginTop: 20, fontSize: 13, color: D.textMuted, textAlign: "center" }}>
        New to ProjectTopic?{" "}
        <Link href="/register" style={{ color: D.accentInk, fontWeight: 600, textDecoration: "none" }}>
          Create an account
        </Link>
      </div>
    </div>
  );
}