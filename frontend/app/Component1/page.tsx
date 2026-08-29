"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Heart, Camera, Activity, ArrowRight, ChevronDown,
  ScanSearch, ClipboardCheck, Lock, Droplet, AlertCircle,
  Layers, ShieldCheck, Stethoscope, Languages, Accessibility,
  Sparkles, Play,
} from "lucide-react";

/* ── Palette ─────────────────────────────────────────────────────── */
const BLUE      = "#1565C0";
const BLUE_TINT = "#E3EEF9";
const MINT      = "#2E9E8A";
const MINT_TINT = "#E0F2EE";
const NAVY      = "#0B1F38";
const NAVY2     = "#091929";
const BG        = "#F3F8FD";
const BG_MINT   = "#EDF6F4";
const BORDER    = "rgba(21,101,192,0.12)";

const FEATURES = [
  { icon: Droplet,     label: "Redness",    body: "Degree of tissue inflammation visible in the oral cavity.", value: 82 },
  { icon: AlertCircle, label: "Open Sores", body: "Presence of ulcerations that may cause pain when eating or drinking.", value: 64 },
  { icon: Layers,      label: "Texture",    body: "Surface roughness or stiffness that may limit normal oral movement.", value: 71 },
  { icon: ShieldCheck, label: "Confidence", body: "Model certainty that the finding is a real pathological signal.", value: 95 },
];
const FEATURE_COLORS = [
  { tint: BLUE_TINT, ink: BLUE },
  { tint: MINT_TINT, ink: MINT },
  { tint: BLUE_TINT, ink: BLUE },
  { tint: MINT_TINT, ink: MINT },
];

const STEPS = [
  { icon: Camera, title: "Add a photo", body: "Take a clear photo of the affected area, or upload one you already have." },
  { icon: ScanSearch, title: "AI analysis", body: "The model checks for signs of pathology in under a minute." },
  { icon: ClipboardCheck, title: "Plain-language result", body: "A clinical score with clear next steps you can act on immediately." },
  { icon: Lock, title: "Stays private", body: "Only you and your care team can ever access the image or result." },
];

const TRUST = [
  { icon: Stethoscope, label: "Clinician reviewed" },
  { icon: Languages, label: "Plain language, no jargon" },
  { icon: Accessibility, label: "Built for every patient" },
  { icon: ShieldCheck, label: "Reviewed against clinical patterns" },
  { icon: Lock, label: "End-to-end encrypted" },
];

function Reveal({ delay = 0, className = "", style, children }: { delay?: number; className?: string; style?: React.CSSProperties; children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setTimeout(() => setShown(true), delay); obs.disconnect(); } },
      { threshold: 0.12 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [delay]);
  return (
    <div ref={ref} className={`transition-all duration-700 ease-out ${shown ? "translate-y-0 opacity-100" : "translate-y-5 opacity-0"} ${className}`} style={style}>
      {children}
    </div>
  );
}

function CountUp({ to, duration = 1400, suffix = "", prefix = "" }: { to: number; duration?: number; suffix?: string; prefix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [val, setVal] = useState(0);
  const started = useRef(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started.current) {
          started.current = true;
          const start = performance.now();
          const tick = (now: number) => {
            const p = Math.min(1, (now - start) / duration);
            const eased = 1 - Math.pow(1 - p, 3);
            setVal(Math.round(to * eased));
            if (p < 1) requestAnimationFrame(tick);
          };
          requestAnimationFrame(tick);
          obs.disconnect();
        }
      },
      { threshold: 0.4 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [to, duration]);
  return <span ref={ref} style={{ fontFamily: "'DM Mono', monospace" }}>{prefix}{val.toLocaleString()}{suffix}</span>;
}

function WatermarkRing() {
  const [drawn, setDrawn] = useState(false);
  useEffect(() => { const t = setTimeout(() => setDrawn(true), 500); return () => clearTimeout(t); }, []);
  const r = 130;
  const c = 2 * Math.PI * r;
  return (
    <svg viewBox="0 0 320 320" className="pointer-events-none absolute -right-20 -top-12 h-95 w-95 opacity-[0.12]">
      <circle cx="160" cy="160" r={r} fill="none" stroke="white" strokeWidth="1" />
      <circle
        cx="160" cy="160" r={r} fill="none" stroke="#5FBFA3" strokeWidth="12" strokeLinecap="round"
        strokeDasharray={c} strokeDashoffset={drawn ? c * 0.24 : c}
        transform="rotate(-90 160 160)"
        style={{ transition: "stroke-dashoffset 1.8s cubic-bezier(0.22,1,0.36,1)" }}
      />
    </svg>
  );
}

function Stat({ el, l }: { el: React.ReactNode; l: string }) {
  return (
    <div>
      <div className="text-[13px] font-semibold text-white">{el}</div>
      <div className="mt-0.5 text-[9px]" style={{ color: "rgba(255,255,255,0.45)" }}>{l}</div>
    </div>
  );
}

function VideoPoint({ n, text }: { n: string; text: string }) {
  return (
    <div className="flex items-start gap-3.5">
      <span
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[13px] font-semibold"
        style={{ background: BLUE_TINT, color: BLUE, fontFamily: "'DM Mono', monospace" }}
      >
        {n}
      </span>
      <p className="text-[14px] leading-snug" style={{ color: "#4A6070" }}>{text}</p>
    </div>
  );
}

export default function Component1WelcomePage() {
  const router = useRouter();

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif", background: BG }}>
      <style>{`
        @keyframes shimmerSweep { 0%{transform:translateX(-130%)} 100%{transform:translateX(230%)} }
        @keyframes radarPing    { 0%{transform:scale(0.7);opacity:0.5} 100%{transform:scale(1.7);opacity:0} }
        @keyframes marquee      { from{transform:translateX(0)} to{transform:translateX(-50%)} }
        @keyframes barGrow      { from{width:0%} }
        @keyframes bounce       { 0%,100%{transform:translateY(0)} 50%{transform:translateY(5px)} }
        .anim-shimmer  { animation: shimmerSweep 2.6s ease-in-out infinite; }
        .anim-marquee  { animation: marquee 22s linear infinite; }
        .radar-ring    { animation: radarPing 2.6s ease-out infinite; }
        .radar-ring-sm { animation: radarPing 2.3s ease-out infinite; }
        .anim-bounce   { animation: bounce 1.8s ease-in-out infinite; }
      `}</style>

      {/* ── HERO ──────────────────────────────────────────────────── */}
      <div className="flex min-h-screen flex-col lg:flex-row">
        {/* Left — brand panel */}
        <div
          className="relative flex flex-col justify-center gap-7 overflow-hidden px-9 py-10 lg:w-[42%] lg:px-12 lg:py-12"
          style={{ background: `linear-gradient(160deg, ${NAVY} 0%, #0D2B4E 55%, ${NAVY2} 100%)` }}
        >
          <WatermarkRing />

          <Reveal delay={0} className="relative flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg" style={{ background: BLUE }}>
              <Heart size={16} className="text-white" />
            </div>
            <div>
              <p className="text-[14px] font-bold leading-none text-white">OralCare AI</p>
              <p className="mt-0.5 text-[9px] leading-none" style={{ color: "rgba(255,255,255,0.4)" }}>
                Clinical Patient Portal
              </p>
            </div>
          </Reveal>

          <div className="relative flex flex-col gap-4">
            <Reveal delay={80}>
              <h1 style={{ fontFamily: "'DM Serif Display', serif", color: "white", fontSize: "2rem", lineHeight: 1.25, fontWeight: 400 }}>
                Your oral health journey, guided with care.
              </h1>
            </Reveal>
            <Reveal delay={150}>
              <p className="max-w-72.5 text-[13.5px] leading-relaxed" style={{ color: "rgba(255,255,255,0.52)" }}>
                AI-powered oral health analysis reviewed against real clinical patterns — built with patients in mind.
              </p>
            </Reveal>
            <Reveal delay={210}>
              <div className="flex flex-wrap gap-2">
                {["AI-Powered", "Clinician Reviewed", "Patient First"].map((b) => (
                  <span
                    key={b}
                    className="text-[9.5px] font-semibold"
                    style={{ padding: "4px 9px", borderRadius: 5, background: "rgba(21,101,192,0.28)", color: "#90CAF9", letterSpacing: "0.04em" }}
                  >
                    {b}
                  </span>
                ))}
              </div>
            </Reveal>
          </div>

          <Reveal delay={270} className="relative flex items-center gap-7 border-t pt-5" style={{ borderColor: "rgba(255,255,255,0.1)" }}>
            <Stat el={<><CountUp to={2469} />+</>} l="Images trained" />
            <Stat el={<>&lt;<CountUp to={60} />s</>} l="Result time" />
            <Stat el={<><CountUp to={100} suffix="%" /></>} l="Encrypted" />
          </Reveal>

          <Reveal delay={320} className="relative">
            <div className="inline-flex items-center gap-2 rounded-lg px-3 py-2" style={{ background: "rgba(46,158,138,0.15)", border: "1px solid rgba(46,158,138,0.3)" }}>
              <ShieldCheck size={13} style={{ color: "#5FBFA3" }} />
              <span className="text-[11px]" style={{ color: "#5FBFA3" }}>
                Clinical-grade · HIPAA-aligned · Encrypted end-to-end
              </span>
            </div>
          </Reveal>
        </div>

        {/* Right — entry choice */}
        <div className="flex flex-1 flex-col items-center justify-center gap-7 px-8 py-10 lg:px-14" style={{ background: "#F8FBFF" }}>
          <div className="w-full" style={{ maxWidth: 400 }}>
            <Reveal delay={0}>
              <p className="mb-0.5 text-[10px] font-semibold uppercase tracking-widest" style={{ color: MINT }}>Welcome</p>
              <h2 className="mb-1.5" style={{ fontFamily: "'DM Serif Display', serif", color: NAVY, fontSize: "1.4rem", fontWeight: 400 }}>
                How are you joining us?
              </h2>
              <p className="mb-6 text-[13px]" style={{ color: "#4A6070" }}>Choose the option that best describes you.</p>
            </Reveal>

            <div className="flex flex-col gap-3">
              <Reveal delay={80}>
                <button
                  onClick={() => router.push("/Component1/upload")}
                  className="group relative w-full overflow-hidden rounded-xl border p-5 text-left transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(21,101,192,0.14)]"
                  style={{ background: "white", borderColor: "rgba(21,101,192,0.2)", boxShadow: "0 2px 8px rgba(15,33,55,0.05)" }}
                >
                  <span className="pointer-events-none absolute inset-y-0 left-0 w-1/3 blur-xl opacity-0 group-hover:opacity-100 anim-shimmer" style={{ background: `${BLUE}18` }} />
                  <div className="relative flex items-start gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg" style={{ background: BLUE_TINT }}>
                      <Camera size={17} style={{ color: BLUE }} />
                    </div>
                    <div className="flex-1">
                      <p className="text-[13px] font-semibold" style={{ color: NAVY }}>First Visit · Upload a Scan</p>
                      <p className="mt-1 text-[11.5px] leading-relaxed" style={{ color: "#4A6070" }}>
                        Upload your oral image for AI-powered clinical analysis in seconds.
                      </p>
                      <div className="mt-2 flex items-center gap-1 text-[11.5px] font-semibold" style={{ color: BLUE }}>
                        Begin with image upload <ArrowRight size={11} />
                      </div>
                    </div>
                  </div>
                </button>
              </Reveal>

              <Reveal delay={140}>
                <button
                  onClick={() => router.push("/Component1/dashboard")}
                  className="w-full rounded-xl border p-5 text-left transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(46,158,138,0.12)]"
                  style={{ background: "white", borderColor: "rgba(46,158,138,0.22)", boxShadow: "0 2px 8px rgba(15,33,55,0.05)" }}
                >
                  <div className="flex items-start gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg" style={{ background: MINT_TINT }}>
                      <Activity size={17} style={{ color: MINT }} />
                    </div>
                    <div className="flex-1">
                      <p className="text-[13px] font-semibold" style={{ color: NAVY }}>Returning Patient · Continue Journey</p>
                      <p className="mt-1 text-[11.5px] leading-relaxed" style={{ color: "#4A6070" }}>
                        Review your progress, care plan, and connect with your care team.
                      </p>
                      <div className="mt-2 flex items-center gap-1 text-[11.5px] font-semibold" style={{ color: MINT }}>
                        Go to my dashboard <ArrowRight size={11} />
                      </div>
                    </div>
                  </div>
                </button>
              </Reveal>
            </div>

            <Reveal delay={200}>
              <p className="mt-5 text-center text-[10px]" style={{ color: "#9AA3AE" }}>
                End-to-end encrypted · Clinician-reviewed results · OralCare AI v2.4
              </p>
            </Reveal>
          </div>

          <button
            onClick={() => document.getElementById("more-info")?.scrollIntoView({ behavior: "smooth" })}
            className="flex flex-col items-center gap-1 text-[10.5px] font-medium"
            style={{ color: "#9AA3AE" }}
          >
            Learn more
            <ChevronDown size={15} className="anim-bounce" />
          </button>
        </div>
      </div>

      {/* ── BELOW FOLD ────────────────────────────────────────────── */}
      <div id="more-info" style={{ background: BG_MINT }}>
        {/* What we check */}
        <section className="mx-auto max-w-6xl px-6 py-14 md:px-10 md:py-16">
          <Reveal>
            <div className="mb-8 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="h-px w-6 rounded-full" style={{ background: MINT }} />
                <h2 className="text-[22px] font-semibold" style={{ color: NAVY, fontFamily: "'DM Sans', sans-serif" }}>
                  What we check
                </h2>
              </div>
              <span className="text-[13.5px]" style={{ color: "#4A6070" }}>Four signals · one photo</span>
            </div>
          </Reveal>
          <div className="grid grid-cols-2 gap-5 md:grid-cols-4 md:gap-6">
            {FEATURES.map((f, i) => (
              <Reveal key={f.label} delay={i * 70}>
                <div className="group rounded-2xl border bg-white p-6 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_8px_20px_rgba(21,101,192,0.09)]" style={{ borderColor: BORDER }}>
                  <div className="mb-4 flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-lg transition-transform duration-300 group-hover:scale-110" style={{ background: FEATURE_COLORS[i].tint, color: FEATURE_COLORS[i].ink }}>
                      <f.icon size={20} strokeWidth={1.8} />
                    </div>
                    <p className="text-[16px] font-semibold" style={{ color: NAVY }}>{f.label}</p>
                  </div>
                  <p className="mb-5 text-[13.5px] leading-relaxed" style={{ color: "#4A6070" }}>{f.body}</p>
                  <div className="h-1.5 w-full overflow-hidden rounded-full" style={{ background: "rgba(21,101,192,0.08)" }}>
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${f.value}%`, background: FEATURE_COLORS[i].ink, animation: `barGrow 1.1s cubic-bezier(0.22,1,0.36,1) ${i * 0.1 + 0.15}s both` }}
                    />
                  </div>
                  <p className="mt-1.5 text-right text-[13px] font-medium" style={{ color: FEATURE_COLORS[i].ink, fontFamily: "'DM Mono', monospace" }}>
                    {f.value}%
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
        </section>

        {/* How it works + Watch, side by side */}
        <section className="mx-auto max-w-6xl px-6 py-14 md:px-10 md:py-16" style={{ borderTop: `1px solid ${BORDER}` }}>
          <div className="grid gap-12 md:grid-cols-2 md:gap-16">
            {/* How it works */}
            <div>
              <Reveal>
                <div className="mb-6 flex items-center gap-2.5">
                  <span className="h-px w-6 rounded-full" style={{ background: BLUE }} />
                  <h2 className="text-[22px] font-semibold" style={{ color: NAVY, fontFamily: "'DM Sans', sans-serif" }}>
                    How it works
                  </h2>
                </div>
              </Reveal>
              <div className="flex flex-col gap-5">
                {STEPS.map((s, i) => (
                  <Reveal key={s.title} delay={i * 80}>
                    <div className="flex items-start gap-4">
                      <div className="flex shrink-0 flex-col items-center">
                        <div className="flex h-11 w-11 items-center justify-center rounded-full text-white" style={{ background: `linear-gradient(135deg, ${BLUE}, ${MINT})` }}>
                          <s.icon size={19} strokeWidth={1.8} />
                        </div>
                        {i < STEPS.length - 1 && <div className="my-1 w-px" style={{ height: 22, background: "rgba(21,101,192,0.18)" }} />}
                      </div>
                      <div className="pb-1.5">
                        <p className="text-[15.5px] font-semibold" style={{ color: NAVY }}>{s.title}</p>
                        <p className="mt-1 text-[13px] leading-relaxed" style={{ color: "#4A6070" }}>{s.body}</p>
                      </div>
                    </div>
                  </Reveal>
                ))}
              </div>
            </div>

            {/* Watch */}
            <div>
              <Reveal>
                <div className="mb-6 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="h-px w-6 rounded-full" style={{ background: MINT }} />
                    <h2 className="text-[22px] font-semibold" style={{ color: NAVY, fontFamily: "'DM Sans', sans-serif" }}>
                      Watch: what to expect
                    </h2>
                  </div>
                  <span className="text-[13.5px]" style={{ color: "#4A6070" }}>90 sec</span>
                </div>
              </Reveal>
              <Reveal delay={60}>
                <div className="group relative mb-4 overflow-hidden rounded-xl" style={{ background: NAVY, boxShadow: "0 8px 24px rgba(11,31,56,0.18)" }}>
                  <button
                    className="relative flex aspect-video w-full items-center justify-center"
                    style={{ backgroundImage: `radial-gradient(circle at 30% 30%, ${BLUE}55, transparent 55%), radial-gradient(circle at 75% 70%, ${MINT}44, transparent 50%)` }}
                    aria-label="Play walkthrough video"
                  >
                    <div className="absolute h-14 w-14 rounded-full border border-white/20 radar-ring" />
                    <div className="absolute h-14 w-14 rounded-full border border-white/20 radar-ring-sm" style={{ animationDelay: "0.8s" }} />
                    <div className="relative flex h-14 w-14 items-center justify-center rounded-full bg-white/10 backdrop-blur-sm transition-transform duration-300 group-hover:scale-110">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white">
                        <Play size={15} className="ml-0.5" style={{ color: BLUE }} fill={BLUE} />
                      </div>
                    </div>
                    <span className="absolute bottom-2 right-2 rounded px-1.5 py-0.5 text-[9.5px] font-medium text-white backdrop-blur-sm" style={{ background: "rgba(0,0,0,0.45)" }}>
                      1:24
                    </span>
                  </button>
                </div>
                <div className="flex flex-col gap-4">
                  <VideoPoint n="1" text="How to take a clear oral photo" />
                  <VideoPoint n="2" text="Watch a real AI result get generated" />
                  <VideoPoint n="3" text="Understand what each clinical score means" />
                </div>
              </Reveal>
            </div>
          </div>
        </section>

        {/* Trust marquee */}
        <div className="overflow-hidden py-3" style={{ borderTop: `1px solid ${BORDER}`, borderBottom: `1px solid ${BORDER}`, background: "white" }}>
          <div className="flex w-max">
            <div className="anim-marquee flex items-center gap-8 pr-8">
              {[...TRUST, ...TRUST].map((t, i) => (
                <div key={i} className="flex shrink-0 items-center gap-2 whitespace-nowrap">
                  <div className="flex h-6 w-6 items-center justify-center rounded" style={{ background: BLUE_TINT, color: BLUE }}>
                    <t.icon size={12} strokeWidth={1.8} />
                  </div>
                  <span className="text-[11.5px]" style={{ color: NAVY }}>{t.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* CTA banner */}
        <section className="mx-auto max-w-6xl px-6 py-6 md:px-10 md:py-8">
          <Reveal>
            <div
              className="relative overflow-hidden flex flex-col items-center gap-4 rounded-xl px-7 py-7 text-center md:flex-row md:justify-between md:px-10 md:text-left"
              style={{ background: `linear-gradient(135deg, ${NAVY} 0%, #0D2B4E 60%, ${NAVY2} 100%)` }}
            >
              <div
                className="pointer-events-none absolute inset-0 opacity-20"
                style={{ backgroundImage: `radial-gradient(circle at 15% 50%, ${BLUE}80, transparent 40%), radial-gradient(circle at 85% 50%, ${MINT}60, transparent 40%)` }}
              />
              <div className="relative">
                <div className="mb-1.5 inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5" style={{ background: "rgba(255,255,255,0.1)" }}>
                  <Sparkles size={10} style={{ color: "#90CAF9" }} />
                  <span className="text-[10px] font-medium" style={{ color: "rgba(255,255,255,0.7)" }}>Ready in under a minute</span>
                </div>
                <p className="text-[18px] text-white md:text-[21px]" style={{ fontFamily: "'DM Serif Display', serif", fontWeight: 400 }}>
                  Ready when you are.
                </p>
                <p className="text-[11.5px]" style={{ color: "rgba(255,255,255,0.5)" }}>
                  You can pause and come back anytime.
                </p>
              </div>
              <div className="relative flex shrink-0 flex-col gap-2 sm:flex-row">
                <button
                  onClick={() => router.push("/Component1/upload")}
                  className="flex items-center justify-center gap-1.5 rounded-full bg-white px-5 py-2 text-[12.5px] font-semibold transition-transform hover:-translate-y-0.5"
                  style={{ color: BLUE }}
                >
                  First visit <ArrowRight size={13} />
                </button>
                <button
                  onClick={() => router.push("/Component1/dashboard")}
                  className="flex items-center justify-center gap-1.5 rounded-full border px-5 py-2 text-[12.5px] font-semibold text-white transition-transform hover:-translate-y-0.5"
                  style={{ borderColor: "rgba(255,255,255,0.2)" }}
                >
                  Returning patient
                </button>
              </div>
            </div>
          </Reveal>
        </section>

        {/* Footer */}
        <footer className="border-t py-4 text-center text-[10.5px]" style={{ borderColor: BORDER, color: "#4A6070" }}>
          © 2026 OralCare AI · Clinical Patient Portal · All rights reserved
        </footer>
      </div>
    </div>
  );
}