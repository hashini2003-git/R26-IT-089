"use client";

import { useState, FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { register } from "../lib/api";
import { saveAuth } from "../lib/auth";

const LogoMark = () => (
  <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
    <path d="M11 1.5C7 1.5 4 4.5 4 8C4 12 7.5 14.8 11 19C14.5 14.8 18 12 18 8C18 4.5 15 1.5 11 1.5Z" fill="white" fillOpacity="0.92" />
    <circle cx="11" cy="8.5" r="2.8" fill="white" />
  </svg>
);

type Stage = "pre" | "in" | "post";

export default function RegisterPage() {
  const router = useRouter();

  const [step, setStep] = useState(1);
  // Design's role selector (patient/clinician/researcher) has no backend field.
  // Swapped 1:1 for the same visual — 3-button grid — using the real therapy_stage field.
  const [therapyStage, setTherapyStage] = useState<Stage>("in");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [mobile, setMobile] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const stages: { value: Stage; label: string; desc: string; icon: React.ReactNode }[] = [
    {
      value: "pre",
      label: "Pre-surgery",
      desc: "You haven't had surgery yet — track symptoms and prepare for your procedure.",
      icon: (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
          <circle cx="10" cy="6" r="3.5" />
          <path d="M3 18c0-3.9 3.1-7 7-7s7 3.1 7 7" />
        </svg>
      ),
    },
    {
      value: "in",
      label: "In therapy",
      desc: "You're currently in active recovery or therapy — monitor progress week to week.",
      icon: (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
          <path d="M10 2a4 4 0 014 4v1a4 4 0 01-8 0V6a4 4 0 014-4z" />
          <path d="M4 18a6 6 0 0112 0" />
          <path d="M10 13v3M8.5 14.5h3" />
        </svg>
      ),
    },
    {
      value: "post",
      label: "Post-surgery",
      desc: "You've completed surgery — track long-term recovery and wellness.",
      icon: (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
          <circle cx="9" cy="9" r="5.5" />
          <path d="M16 16l-2.5-2.5" />
          <path d="M9 6v3l2 1" />
        </svg>
      ),
    },
  ];

  const handleNext = (e: FormEvent) => {
    e.preventDefault();
    setError("");
    if (!firstName.trim() || !lastName.trim()) {
      setError("Please enter your full name.");
      return;
    }
    if (!mobile.trim()) {
      setError("Please enter your mobile number.");
      return;
    }
    setStep(2);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    if (!password || password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirmPw) {
      setError("Passwords do not match.");
      return;
    }
    if (!agreed) {
      setError("Please accept the terms to continue.");
      return;
    }
    setLoading(true);
    try {
      const res = await register(firstName.trim(), lastName.trim(), mobile.trim(), password, therapyStage);
      saveAuth(res.token, {
        patient_id: res.patient_id,
        name: res.name,
        surgery_date: res.surgery_date,
        day_number: res.day_number,
        therapy_stage: res.therapy_stage,
      });
      router.push("/home");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex" style={{ background: "#F4F8FD" }}>
      {/* Left animated panel */}
      <div className="hidden lg:block lg:w-[45%] relative overflow-hidden" style={{ background: "linear-gradient(160deg, #091929 0%, #0B1F38 55%, #0D2B4E 100%)" }}>
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute rounded-full" style={{ width: 440, height: 440, top: "-100px", left: "-80px", background: "radial-gradient(ellipse, rgba(21,101,192,0.22) 0%, transparent 68%)", filter: "blur(48px)", animation: "oc-orb-drift-2 18s ease-in-out infinite" }} />
          <div className="absolute rounded-full" style={{ width: 380, height: 380, bottom: "-60px", right: "-60px", background: "radial-gradient(ellipse, rgba(13,148,136,0.20) 0%, transparent 68%)", filter: "blur(42px)", animation: "oc-orb-drift-1 22s ease-in-out infinite" }} />
          <div className="absolute rounded-full" style={{ width: 200, height: 200, top: "55%", left: "30%", background: "radial-gradient(ellipse, rgba(139,127,209,0.14) 0%, transparent 70%)", filter: "blur(28px)", animation: "oc-orb-drift-1 10s ease-in-out infinite reverse" }} />
        </div>
        <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.045) 1px, transparent 1px)", backgroundSize: "32px 32px" }} />

        <div className="relative z-10 h-full flex flex-col justify-between p-12">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-md" style={{ background: "linear-gradient(135deg, #1565C0, #0D9488)" }}>
              <LogoMark />
            </div>
            <div>
              <span className="text-white font-semibold text-sm block">OralCare AI</span>
              <span className="text-[9px] tracking-[0.14em] oc-font-mono" style={{ color: "#14B8A6" }}>CLINICAL PLATFORM</span>
            </div>
          </div>

          <div className="flex flex-col items-center justify-center flex-1 py-6">
            <div className="relative w-full flex flex-col items-center gap-5">
              <div className="relative flex items-center justify-center" style={{ width: 200, height: 200 }}>
                <div className="absolute rounded-full border" style={{ width: 190, height: 190, borderColor: "rgba(21,101,192,0.12)", animation: "oc-float-slow 18s linear infinite" }} />
                <div className="absolute rounded-full border" style={{ width: 155, height: 155, borderColor: "rgba(13,148,136,0.16)", animation: "oc-float-slow 12s linear infinite reverse" }} />
                <div className="absolute rounded-full border border-dashed" style={{ width: 118, height: 118, borderColor: "rgba(139,127,209,0.18)", animation: "oc-float-slow 8s linear infinite" }} />

                <div className="absolute" style={{ width: 190, height: 190, animation: "oc-float-slow 6s linear infinite" }}>
                  <div className="absolute w-3 h-3 rounded-full top-0 left-1/2 -translate-x-1/2 -translate-y-1.5 shadow-lg" style={{ background: "#0D9488", boxShadow: "0 0 10px rgba(13,148,136,0.6)" }} />
                </div>
                <div className="absolute" style={{ width: 155, height: 155, animation: "oc-float-slow 9s linear infinite reverse" }}>
                  <div className="absolute w-2.5 h-2.5 rounded-full bottom-0 right-1 shadow-lg" style={{ background: "#1565C0", boxShadow: "0 0 10px rgba(21,101,192,0.6)" }} />
                </div>
                <div className="absolute" style={{ width: 118, height: 118, animation: "oc-float-slow 7s linear infinite" }}>
                  <div className="absolute w-2 h-2 rounded-full top-1 right-0 shadow-md" style={{ background: "#8B7FD1", boxShadow: "0 0 8px rgba(139,127,209,0.6)" }} />
                </div>

                {[1, 2].map((i) => (
                  <div key={i} className="absolute rounded-full border" style={{ width: 70 + i * 20, height: 70 + i * 20, borderColor: `rgba(13,148,136,${0.20 - i * 0.07})`, animation: `oc-pulse-ring ${2 + i * 0.7}s ease-out infinite`, animationDelay: `${i * 0.6}s` }} />
                ))}

                <div className="relative z-10 w-16 h-16 rounded-full flex items-center justify-center" style={{ background: "linear-gradient(135deg, #1565C0, #0D9488)", boxShadow: "0 0 32px rgba(13,148,136,0.40), 0 0 64px rgba(21,101,192,0.18)" }}>
                  <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                    <path d="M14 2.5C10 2.5 7 5.5 7 9C7 13 10.5 15.5 14 20C17.5 15.5 21 13 21 9C21 5.5 18 2.5 14 2.5Z" fill="white" fillOpacity="0.92" />
                    <circle cx="14" cy="9.5" r="3" fill="white" />
                  </svg>
                </div>
              </div>

              <div className="w-full px-4">
                <div className="flex items-center justify-center gap-1 h-8">
                  {[2, 4, 7, 10, 14, 10, 6, 12, 8, 5, 9, 13, 7, 4, 8, 11, 5, 3, 7, 9, 6, 4].map((h, i) => (
                    <div
                      key={i}
                      className="rounded-full flex-1"
                      style={{
                        height: `${h}px`,
                        background: i % 3 === 0 ? "#0D9488" : i % 3 === 1 ? "#1565C0" : "#8B7FD1",
                        opacity: 0.55 + (h / 28) * 0.45,
                        animation: `oc-float ${0.5 + (i % 5) * 0.2}s ease-in-out infinite alternate`,
                        animationDelay: `${i * 0.04}s`,
                      }}
                    />
                  ))}
                </div>
                <div className="text-center mt-3 oc-font-mono text-[9px] tracking-widest text-white/25">VOICE · IMAGING · THERAPY · WELLNESS</div>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-xl" style={{ background: "rgba(13,148,136,0.08)", border: "1px solid rgba(13,148,136,0.18)" }}>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#14B8A6] animate-pulse" />
              <span className="text-[#14B8A6] text-[10px] font-semibold oc-font-mono">Research Platform</span>
            </div>
            <p className="text-white/30 text-xs leading-relaxed">For clinical demonstration and research purposes. All AI analysis is presented as decision support.</p>
          </div>
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 sm:px-8 py-12">
        <div className="lg:hidden flex items-center gap-2.5 mb-10">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, #1565C0, #0D9488)" }}>
            <LogoMark />
          </div>
          <div>
            <span className="text-[#0F2137] font-semibold text-sm block">OralCare AI</span>
            <span className="text-[9px] tracking-[0.14em] oc-font-mono text-[#14B8A6]">CLINICAL PLATFORM</span>
          </div>
        </div>

        <div className="w-full max-w-[420px]">
          <div className="mb-7">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] oc-font-mono mb-4" style={{ background: "#E3EEF9", border: "1px solid rgba(21,101,192,0.18)", color: "#1565C0" }}>
              Step {step} of 2
            </div>
            <h1 className="oc-font-serif text-[#0F2137] text-3xl leading-tight mb-2">
              {step === 1 ? "Create your account" : "Secure your account"}
            </h1>
            <p className="text-[#4A6070] text-sm">
              {step === 1 ? "Set up your clinical profile to get started." : "Choose a strong password to protect your account."}
            </p>
          </div>

          <div className="flex items-center gap-2 mb-7">
            {[1, 2].map((s) => (
              <div key={s} className="h-1.5 rounded-full flex-1 transition-all duration-400" style={{ background: s <= step ? "linear-gradient(90deg, #1565C0, #0D9488)" : "rgba(21,101,192,0.12)" }} />
            ))}
          </div>

          {step === 1 && (
            <form onSubmit={handleNext} className="space-y-4">
              {/* Therapy stage selector */}
              <div>
                <label className="block text-[#0F2137] text-sm font-medium mb-2">Therapy stage</label>
                <div className="grid grid-cols-3 gap-2">
                  {stages.map((s) => (
                    <button
                      key={s.value}
                      type="button"
                      onClick={() => setTherapyStage(s.value)}
                      className="p-3 rounded-xl text-left transition-all"
                      style={{
                        background: therapyStage === s.value ? "#E3EEF9" : "white",
                        border: `1.5px solid ${therapyStage === s.value ? "#1565C0" : "rgba(21,101,192,0.12)"}`,
                        boxShadow: therapyStage === s.value ? "0 0 0 3px rgba(21,101,192,0.08)" : "none",
                      }}
                    >
                      <div className="mb-1.5" style={{ color: therapyStage === s.value ? "#1565C0" : "#9BAABA" }}>
                        {s.icon}
                      </div>
                      <div className="text-xs font-semibold" style={{ color: therapyStage === s.value ? "#1565C0" : "#0F2137" }}>
                        {s.label}
                      </div>
                    </button>
                  ))}
                </div>
                <p className="text-[#9BAABA] text-[11px] mt-2 leading-relaxed">
                  {stages.find((s) => s.value === therapyStage)?.desc}
                </p>
              </div>

              {/* Name */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#0F2137] text-sm font-medium mb-1.5">First name</label>
                  <input type="text" className="oc-input-clinical" placeholder="Amara" value={firstName} onChange={(e) => setFirstName(e.target.value)} autoComplete="given-name" autoFocus />
                </div>
                <div>
                  <label className="block text-[#0F2137] text-sm font-medium mb-1.5">Last name</label>
                  <input type="text" className="oc-input-clinical" placeholder="Silva" value={lastName} onChange={(e) => setLastName(e.target.value)} autoComplete="family-name" />
                </div>
              </div>

              {/* Mobile number */}
              <div>
                <label className="block text-[#0F2137] text-sm font-medium mb-1.5">Mobile number</label>
                <input type="tel" inputMode="tel" className="oc-input-clinical" placeholder="+94 77 123 4567" value={mobile} onChange={(e) => setMobile(e.target.value)} autoComplete="tel" />
              </div>

              {error && (
                <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm" style={{ background: "#FFF5F5", border: "1px solid rgba(232,72,58,0.20)", color: "#E8483A" }}>
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <circle cx="7" cy="7" r="6" /><path d="M7 4v3M7 10v.5" />
                  </svg>
                  {error}
                </div>
              )}

              <button type="submit" className="oc-btn-primary w-full justify-center py-3 mt-1">
                Continue
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 8h10M9 4l4 4-4 4" />
                </svg>
              </button>
            </form>
          )}

          {step === 2 && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-[#0F2137] text-sm font-medium mb-1.5">Password</label>
                <div className="relative">
                  <input
                    type={showPw ? "text" : "password"}
                    className="oc-input-clinical pr-10"
                    placeholder="Min. 8 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="new-password"
                  />
                  <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9BAABA] hover:text-[#4A6070] transition-colors">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6">
                      <path d="M2 8s2.5-4 6-4 6 4 6 4-2.5 4-6 4-6-4-6-4z" />
                      <circle cx="8" cy="8" r="1.5" />
                    </svg>
                  </button>
                </div>
                {password && (
                  <div className="mt-2 flex gap-1">
                    {[1, 2, 3, 4].map((i) => {
                      const strength = Math.min(4, Math.floor(password.length / 3));
                      return (
                        <div
                          key={i}
                          className="flex-1 h-1 rounded-full transition-all"
                          style={{
                            background:
                              i <= strength
                                ? strength <= 1
                                  ? "#FF6B5B"
                                  : strength <= 2
                                  ? "#FF9F43"
                                  : strength <= 3
                                  ? "#F5C242"
                                  : "#2ECC91"
                                : "rgba(21,101,192,0.10)",
                          }}
                        />
                      );
                    })}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-[#0F2137] text-sm font-medium mb-1.5">Confirm password</label>
                <input
                  type={showPw ? "text" : "password"}
                  className="oc-input-clinical"
                  placeholder="Repeat password"
                  value={confirmPw}
                  onChange={(e) => setConfirmPw(e.target.value)}
                  autoComplete="new-password"
                />
              </div>

              <label className="flex items-start gap-3 cursor-pointer">
                <div
                  className="w-4 h-4 rounded flex items-center justify-center shrink-0 mt-0.5 transition-all"
                  style={{ background: agreed ? "#1565C0" : "white", border: `1.5px solid ${agreed ? "#1565C0" : "rgba(21,101,192,0.20)"}` }}
                  onClick={() => setAgreed(!agreed)}
                >
                  {agreed && (
                    <svg width="9" height="9" viewBox="0 0 9 9" fill="none" stroke="white" strokeWidth="1.8">
                      <path d="M1 4.5l2.5 2.5 4.5-4.5" />
                    </svg>
                  )}
                </div>
                <span className="text-xs text-[#4A6070] leading-relaxed">
                  I agree to the{" "}
                  <span className="text-[#1565C0] hover:underline cursor-pointer">Terms of Use</span> and{" "}
                  <span className="text-[#1565C0] hover:underline cursor-pointer">Privacy Policy</span>. This platform is for research and clinical demonstration purposes.
                </span>
              </label>

              {error && (
                <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm" style={{ background: "#FFF5F5", border: "1px solid rgba(232,72,58,0.20)", color: "#E8483A" }}>
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <circle cx="7" cy="7" r="6" /><path d="M7 4v3M7 10v.5" />
                  </svg>
                  {error}
                </div>
              )}

              <div className="flex gap-2 mt-1">
                <button
                  type="button"
                  onClick={() => { setStep(1); setError(""); }}
                  className="px-4 py-3 text-sm rounded-xl border font-medium transition-colors"
                  style={{ border: "1.5px solid rgba(21,101,192,0.15)", color: "#4A6070" }}
                >
                  Back
                </button>
                <button type="submit" disabled={loading} className="oc-btn-primary flex-1 justify-center py-3 disabled:opacity-60 disabled:cursor-not-allowed">
                  {loading ? (
                    <>
                      <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4" />
                      </svg>
                      Creating account…
                    </>
                  ) : (
                    <>
                      Create Account
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M3 8h10M9 4l4 4-4 4" />
                      </svg>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          <p className="mt-6 text-center text-sm text-[#4A6070]">
            Already have an account?{" "}
            <Link href="/login" className="text-[#1565C0] font-semibold hover:underline">Sign in</Link>
          </p>

          <div className="mt-6 text-center">
            <Link href="/" className="inline-flex items-center gap-1.5 text-xs text-[#9BAABA] hover:text-[#4A6070] transition-colors">
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M8 2L4 6l4 4" />
              </svg>
              Back to welcome
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
