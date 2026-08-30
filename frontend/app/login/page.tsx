"use client";

import { useState, FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { login } from "../lib/api";
import { saveAuth } from "../lib/auth";

const LogoMark = () => (
  <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
    <path d="M11 1.5C7 1.5 4 4.5 4 8C4 12 7.5 14.8 11 19C14.5 14.8 18 12 18 8C18 4.5 15 1.5 11 1.5Z" fill="white" fillOpacity="0.92" />
    <circle cx="11" cy="8.5" r="2.8" fill="white" />
  </svg>
);

/* Animated left panel visual — exact from design, no data dependency */
function AnimatedPanel() {
  return (
    <div className="relative w-full h-full flex flex-col justify-between p-12 overflow-hidden" style={{ background: "linear-gradient(160deg, #091929 0%, #0B1F38 55%, #0D2B4E 100%)" }}>
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute rounded-full" style={{ width: 480, height: 480, top: "-120px", right: "-100px", background: "radial-gradient(ellipse, rgba(13,148,136,0.22) 0%, transparent 68%)", filter: "blur(45px)", animation: "oc-orb-drift-1 16s ease-in-out infinite" }} />
        <div className="absolute rounded-full" style={{ width: 400, height: 400, bottom: "-80px", left: "-80px", background: "radial-gradient(ellipse, rgba(21,101,192,0.20) 0%, transparent 68%)", filter: "blur(40px)", animation: "oc-orb-drift-2 20s ease-in-out infinite" }} />
        <div className="absolute rounded-full" style={{ width: 260, height: 260, top: "42%", left: "20%", background: "radial-gradient(ellipse, rgba(139,127,209,0.12) 0%, transparent 70%)", filter: "blur(30px)", animation: "oc-orb-drift-1 12s ease-in-out infinite reverse" }} />
      </div>

      <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.045) 1px, transparent 1px)", backgroundSize: "32px 32px" }} />

      <div className="relative z-10 flex items-center gap-2.5">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-md" style={{ background: "linear-gradient(135deg, #1565C0, #0D9488)" }}>
          <LogoMark />
        </div>
        <div>
          <span className="text-white font-semibold text-sm block">OralCare AI</span>
          <span className="text-[9px] tracking-[0.14em] oc-font-mono" style={{ color: "#14B8A6" }}>CLINICAL PLATFORM</span>
        </div>
      </div>

      <div className="relative z-10 flex flex-col items-center justify-center flex-1 py-10">
        <div className="relative flex items-center justify-center" style={{ width: 220, height: 220 }}>
          {[1, 2, 3].map((i) => (
            <div key={i} className="absolute rounded-full border" style={{ width: 80 + i * 46, height: 80 + i * 46, borderColor: `rgba(13,148,136,${0.18 - i * 0.05})`, animation: `oc-pulse-ring ${2.4 + i * 0.6}s ease-out infinite`, animationDelay: `${i * 0.5}s` }} />
          ))}
          <div className="absolute rounded-full" style={{ width: 180, height: 180, border: "1.5px dashed rgba(20,184,166,0.18)", animation: "oc-float-slow 10s linear infinite" }} />
          <div className="absolute rounded-full" style={{ width: 140, height: 140, border: "1px solid rgba(21,101,192,0.20)", animation: "oc-float-slow 7s linear infinite reverse" }} />

          <div className="relative z-10 w-20 h-20 rounded-full flex items-center justify-center shadow-2xl" style={{ background: "linear-gradient(135deg, #1565C0, #0D9488)", boxShadow: "0 0 40px rgba(13,148,136,0.35), 0 0 80px rgba(21,101,192,0.20)" }}>
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
              <path d="M16 3C10.5 3 6 7.5 6 12.5C6 18 11 22 16 28C21 22 26 18 26 12.5C26 7.5 21.5 3 16 3Z" fill="white" fillOpacity="0.92" />
              <circle cx="16" cy="13" r="4" fill="white" />
            </svg>
          </div>
        </div>

        <div className="mt-10 flex gap-6">
          {[
            { val: "4", label: "AI Modules", color: "#14B8A6" },
            { val: "98%", label: "Accuracy", color: "#1976D2" },
            { val: "5k+", label: "Images", color: "#14B8A6" },
          ].map((m) => (
            <div key={m.label} className="text-center">
              <div className="oc-font-serif text-2xl leading-none mb-1" style={{ color: m.color }}>{m.val}</div>
              <div className="text-white/35 text-[10px] oc-font-mono">{m.label}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="relative z-10">
        <div className="p-5 rounded-2xl" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
          <blockquote className="text-white/50 text-sm leading-relaxed italic oc-font-serif mb-3">
            &ldquo;Early detection through AI-assisted clinical intelligence can significantly improve oral cancer patient outcomes.&rdquo;
          </blockquote>
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-[#14B8A6] animate-pulse" />
            <span className="text-white/25 text-[10px] oc-font-mono">OralCare AI Clinical Platform</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  const router = useRouter();

  // Design used "email" — real backend has no email field, only mobile_number.
  const [mobile, setMobile] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    if (!mobile.trim() || !password) {
      setError("Please enter your mobile number and password.");
      return;
    }
    setLoading(true);
    try {
      const res = await login(mobile.trim(), password);
      saveAuth(res.token, {
        patient_id: res.patient_id,
        name: res.name,
        surgery_date: res.surgery_date,
        day_number: res.day_number,
      });
      router.push("/home");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Sign in failed. Check your details and try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex" style={{ background: "#F4F8FD" }}>
      {/* Left animated panel */}
      <div className="hidden lg:block lg:w-[45%]">
        <AnimatedPanel />
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 sm:px-8 py-12">
        {/* Mobile logo */}
        <div className="lg:hidden flex items-center gap-2.5 mb-10">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, #1565C0, #0D9488)" }}>
            <LogoMark />
          </div>
          <div>
            <span className="text-[#0F2137] font-semibold text-sm block">OralCare AI</span>
            <span className="text-[9px] tracking-[0.14em] oc-font-mono text-[#14B8A6]">CLINICAL PLATFORM</span>
          </div>
        </div>

        <div className="w-full max-w-[380px]">
          <div className="mb-8">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] oc-font-mono mb-4" style={{ background: "#E0F5F3", border: "1px solid rgba(13,148,136,0.18)", color: "#0D9488" }}>
              <span className="w-1.5 h-1.5 rounded-full bg-[#0D9488] animate-pulse" />
              Secure Clinical Access
            </div>
            <h1 className="oc-font-serif text-[#0F2137] text-3xl leading-tight mb-2">Welcome back</h1>
            <p className="text-[#4A6070] text-sm">Sign in to your OralCare AI account</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[#0F2137] text-sm font-medium mb-1.5">Mobile number</label>
              <input
                type="tel"
                inputMode="tel"
                className="oc-input-clinical"
                placeholder="+94 77 123 4567"
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
                autoComplete="tel"
                autoFocus
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[#0F2137] text-sm font-medium">Password</label>
                <button type="button" className="text-[#1565C0] text-xs hover:underline">Forgot password?</button>
              </div>
              <div className="relative">
                <input
                  type={showPw ? "text" : "password"}
                  className="oc-input-clinical pr-10"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                />
                <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9BAABA] hover:text-[#4A6070] transition-colors">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6">
                    <path d="M2 8s2.5-4 6-4 6 4 6 4-2.5 4-6 4-6-4-6-4z" />
                    <circle cx="8" cy="8" r="1.5" />
                    {!showPw && <path d="M2 2l12 12" />}
                  </svg>
                </button>
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm" style={{ background: "#FFF5F5", border: "1px solid rgba(232,72,58,0.20)", color: "#E8483A" }}>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="7" cy="7" r="6" /><path d="M7 4v3M7 10v.5" /></svg>
                {error}
              </div>
            )}

            <button type="submit" disabled={loading} className="oc-btn-primary w-full justify-center py-3 mt-2 disabled:opacity-60 disabled:cursor-not-allowed">
              {loading ? (
                <>
                  <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4" />
                  </svg>
                  Signing in…
                </>
              ) : (
                <>
                  Sign In
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 8h10M9 4l4 4-4 4" /></svg>
                </>
              )}
            </button>
          </form>

          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px" style={{ background: "rgba(21,101,192,0.10)" }} />
            <span className="text-[#9BAABA] text-xs oc-font-mono">OR</span>
            <div className="flex-1 h-px" style={{ background: "rgba(21,101,192,0.10)" }} />
          </div>

          <p className="text-center text-sm text-[#4A6070]">
            {"Don't have an account? "}
            <Link href="/register" className="text-[#1565C0] font-semibold hover:underline">Register now</Link>
          </p>

          <div className="mt-8 text-center">
            <Link href="/" className="inline-flex items-center gap-1.5 text-xs text-[#9BAABA] hover:text-[#4A6070] transition-colors">
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M8 2L4 6l4 4" /></svg>
              Back to welcome
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
