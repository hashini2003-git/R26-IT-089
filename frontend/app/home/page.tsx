"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { isLoggedIn, getPatient, clearAuth } from "../lib/auth";

const modules = [
  {
    id: "01", route: "/Component1", label: "Lesion Analysis",
    title: "Oral Lesion Analysis", subtitle: "IPE Framework — Integrated Patient Experience",
    desc: "Upload oral cavity images for Vision Transformer-based tissue classification. Produces Predicted Pain Intensity (PPI) scores and Functional Impairment Scores across three clinical domains.",
    accent: "#0D9488", chip: "oc-chip-mint", status: "Active", statusColor: "#2ECC91",
    icon: (
      <svg width="26" height="26" viewBox="0 0 26 26" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="8.5" /><path d="M22 22l-4-4" /><path d="M9 12h6M12 9v6" />
      </svg>
    ),
    highlights: ["ViT-B/16 Classification", "PPI Score (0–10)", "FIS — 3 Domains"],
  },
  {
    id: "02", route: "/component2", label: "Risk Monitor",
    title: "Risk & Voice Monitor", subtitle: "Multimodal Risk Assessment & Progression",
    desc: "Lifestyle and demographic risk scoring combined with weekly voice biomarker tracking — pitch, jitter, shimmer, MFCC — to generate continuously updated oral cancer risk trends.",
    accent: "#1565C0", chip: "oc-chip-blue", status: "Recording due", statusColor: "#F5C242",
    icon: (
      <svg width="26" height="26" viewBox="0 0 26 26" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M13 2.5a3.5 3.5 0 013.5 3.5v7a3.5 3.5 0 01-7 0V6A3.5 3.5 0 0113 2.5z" />
        <path d="M20.5 11v2a7.5 7.5 0 01-15 0v-2" />
        <path d="M13 20v3.5M9.5 23.5h7" />
      </svg>
    ),
    highlights: ["Lifestyle Risk Score", "Voice Biomarkers", "Weekly Trend Alerts"],
  },
  {
    id: "03", route: "/component3", label: "Meditation",
    title: "AI Meditation Environment", subtitle: "Personalized Wellness for Cancer Patients",
    desc: "Adaptive immersive meditation environments — forest, beach, rain, night sky — with ML-optimized session duration, age-adaptive interactions, and guided breathing for therapeutic comfort.",
    accent: "#8B7FD1", chip: "oc-chip-lavender", status: "Ready", statusColor: "#8B7FD1",
    icon: (
      <svg width="26" height="26" viewBox="0 0 26 26" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="13" cy="13" r="10.5" />
        <path d="M9 13c0-2.2 1.8-4 4-4s4 1.8 4 4" />
        <path d="M13 13v3" />
        <circle cx="13" cy="17" r="0.8" fill="currentColor" stroke="none" />
      </svg>
    ),
    highlights: ["4 Environments", "ML Personalization", "Guided Breathing"],
  },
  {
    id: "04", route: "/vocal_therapy", label: "Speech Therapy",
    title: "Speech Therapy Monitor", subtitle: "Voice Analysis & Personalized Care Planning",
    desc: "AI signal processing detects articulation issues and voice quality changes. Three-tier severity classification triggers specialist matching and personalized therapy care plan generation.",
    accent: "#0D9488", chip: "oc-chip-mint", status: "Session ready", statusColor: "#2ECC91",
    icon: (
      <svg width="26" height="26" viewBox="0 0 26 26" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 17a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h15a2 2 0 012 2z" />
        <path d="M9 11h8M9 15h5" />
      </svg>
    ),
    highlights: ["Signal AI Analysis", "3-Tier Severity", "Therapy Care Plan"],
  },
];

// NOTE: no backend endpoint currently supplies activity-feed or wellness-score
// data (main.py has no such route). Kept as the design's placeholder content
// until those endpoints exist — flagging this rather than inventing fake data.
const recentActivity = [
  { label: "Oral lesion analysis completed", time: "2 hours ago", color: "#0D9488" },
  { label: "Voice biomarker sample recorded", time: "Yesterday", color: "#1565C0" },
  { label: "Risk trend update available", time: "2 days ago", color: "#F5C242" },
  { label: "Meditation session completed (18 min)", time: "3 days ago", color: "#8B7FD1" },
  { label: "Clinical care plan generated", time: "1 week ago", color: "#0D9488" },
];

const kpis = [
  { label: "Overall Risk Score", value: "Low", sub: "Based on current data", color: "#2ECC91", icon: (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M3 9l4 4 8-8" /></svg>
  )},
  { label: "Voice Sessions", value: "12", sub: "Weeks monitored", color: "#1565C0", icon: (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><rect x="2" y="3" width="14" height="12" rx="2" /><path d="M6 7h6M6 11h4" /></svg>
  )},
  { label: "Analyses Completed", value: "8", sub: "This month", color: "#0D9488", icon: (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><circle cx="9" cy="9" r="7" /><path d="M9 5.5v4l2.5 1.5" /></svg>
  )},
  { label: "Wellness Score", value: "7.4", sub: "Out of 10", color: "#8B7FD1", icon: (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M9 2C5.5 2 3 4.5 3 7.5C3 11 6 13.5 9 17C12 13.5 15 11 15 7.5C15 4.5 12.5 2 9 2Z" /></svg>
  )},
];

function useRevealOnMount() {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 80);
    return () => clearTimeout(t);
  }, []);
  return visible;
}

function RevealSection({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { e.target.classList.add("oc-visible"); obs.unobserve(e.target); } },
      { threshold: 0.06 }
    );
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);
  return (
    <div ref={ref} className="oc-reveal" style={{ transitionDelay: `${delay}ms` }}>
      {children}
    </div>
  );
}

export default function HomePage() {
  const router = useRouter();
  const visible = useRevealOnMount();
  const [name, setName] = useState("Patient");
  const [patientId, setPatientId] = useState("");

  useEffect(() => {
    if (!isLoggedIn()) {
      router.push("/login");
      return;
    }
    const p = getPatient();
    setName(p?.name ?? "Patient");
    setPatientId(p?.patient_id ?? "");
  }, [router]);

  function handleLogout() {
    clearAuth();
  }

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const firstName = name.split(" ")[0];
  const initials = name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();

  return (
    <div className="min-h-screen" style={{ background: "#F4F8FD" }}>
      <Header variant="light" user={{ name, patientId }} onLogout={handleLogout} />

      {/* Page hero bar */}
      <div className="pt-[60px]" style={{ background: "linear-gradient(160deg, #091929 0%, #0B1F38 60%, #0D2B4E 100%)" }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 rounded-full pointer-events-none" style={{ background: "radial-gradient(ellipse, rgba(13,148,136,0.14) 0%, transparent 70%)", filter: "blur(40px)", transform: "translate(60px, -40px)" }} />
          <div className="absolute inset-0 pointer-events-none opacity-40" style={{ backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.05) 1px, transparent 1px)", backgroundSize: "32px 32px" }} />

          <div className="relative z-10 flex flex-col sm:flex-row sm:items-end justify-between gap-6">
            <div className={`transition-all duration-600 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] oc-font-mono mb-4" style={{ background: "rgba(13,148,136,0.12)", border: "1px solid rgba(13,148,136,0.22)", color: "#14B8A6" }}>
                <span className="w-1.5 h-1.5 rounded-full bg-[#14B8A6] animate-pulse" />
                Clinical Dashboard · Active Session
              </div>
              <h1 className="oc-font-serif text-white text-3xl sm:text-4xl leading-tight mb-2">
                {greeting},{" "}
                <span className="italic" style={{ background: "linear-gradient(135deg, #14B8A6, #7CB9E8)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
                  {firstName}.
                </span>
              </h1>
              <p className="text-white/45 text-sm">
                Your oral health dashboard · {new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
              </p>
            </div>

            {/* User card */}
            <div className={`flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-600 delay-200 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`} style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.09)" }}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-sm" style={{ background: "linear-gradient(135deg, #1565C0, #0D9488)" }}>
                {initials}
              </div>
              <div>
                <div className="text-white text-sm font-semibold leading-none mb-1">{name}</div>
                {/* Design showed email here — backend has no email field, so patient ID is shown instead */}
                <div className="text-white/40 text-xs oc-font-mono">{patientId ? `ID: ${patientId}` : ""}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* KPI row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
          {kpis.map((kpi, i) => (
            <RevealSection key={kpi.label} delay={i * 80}>
              <div className="oc-card p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: `${kpi.color}12`, color: kpi.color }}>
                    {kpi.icon}
                  </div>
                  <div className="w-2 h-2 rounded-full" style={{ background: kpi.color, boxShadow: `0 0 0 3px ${kpi.color}20` }} />
                </div>
                <div className="oc-font-serif text-3xl leading-none mb-1" style={{ color: kpi.color }}>{kpi.value}</div>
                <div className="text-[#0F2137] text-sm font-semibold mb-0.5">{kpi.label}</div>
                <div className="text-[#9BAABA] text-xs oc-font-mono">{kpi.sub}</div>
              </div>
            </RevealSection>
          ))}
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          {/* Module cards — main area */}
          <div className="xl:col-span-2">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-[#0F2137] font-semibold text-lg">Clinical AI Modules</h2>
              <span className="oc-chip-mint">4 Active</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {modules.map((mod, i) => (
                <RevealSection key={mod.id} delay={i * 100}>
                  <div className="oc-card p-6 group h-full flex flex-col">
                    <div className="flex items-start justify-between mb-5">
                      <div className="w-12 h-12 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-105" style={{ background: `${mod.accent}12`, color: mod.accent }}>
                        {mod.icon}
                      </div>
                      <div className="flex items-center gap-1.5 text-[10px] oc-font-mono" style={{ color: mod.statusColor }}>
                        <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: mod.statusColor }} />
                        {mod.status}
                      </div>
                    </div>

                    <div className={`${mod.chip} self-start mb-2`}>Module {mod.id} · {mod.label}</div>
                    <h3 className="text-[#0F2137] font-semibold text-base mb-1 leading-snug">{mod.title}</h3>
                    <p className="text-[#9BAABA] text-[10px] oc-font-mono mb-3">{mod.subtitle}</p>
                    <p className="text-[#4A6070] text-xs leading-relaxed mb-5 flex-1">{mod.desc}</p>

                    <div className="flex flex-wrap gap-1.5 mb-5">
                      {mod.highlights.map((h) => (
                        <span key={h} className="px-2.5 py-1 rounded-lg text-[10px] oc-font-mono" style={{ background: `${mod.accent}08`, color: mod.accent, border: `1px solid ${mod.accent}18` }}>
                          {h}
                        </span>
                      ))}
                    </div>

                    <Link
                      href={mod.route}
                      className="inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-semibold text-white transition-all"
                      style={{ background: `linear-gradient(135deg, ${mod.accent}, ${mod.accent}CC)`, boxShadow: `0 4px 14px ${mod.accent}25` }}
                    >
                      Launch Module
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M2.5 7h9M8 3l4 4-4 4" />
                      </svg>
                    </Link>
                  </div>
                </RevealSection>
              ))}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Recent activity */}
            <RevealSection>
              <div className="oc-card p-6">
                <h3 className="text-[#0F2137] font-semibold text-sm mb-5">Recent Activity</h3>
                <div className="space-y-4">
                  {recentActivity.map((a, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5" style={{ background: `${a.color}12` }}>
                        <div className="w-2 h-2 rounded-full" style={{ background: a.color }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[#0F2137] text-xs font-medium leading-snug mb-0.5">{a.label}</p>
                        <p className="text-[#9BAABA] text-[10px] oc-font-mono">{a.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </RevealSection>

            {/* Severity reference */}
            <RevealSection delay={100}>
              <div className="p-6 rounded-2xl relative overflow-hidden" style={{ background: "linear-gradient(160deg, #091929, #0B1F38, #0D2B4E)" }}>
                <div className="absolute top-0 right-0 w-40 h-40 rounded-full pointer-events-none" style={{ background: "radial-gradient(ellipse, rgba(13,148,136,0.18) 0%, transparent 70%)", filter: "blur(25px)", transform: "translate(30px, -30px)" }} />
                <div className="relative z-10">
                  <p className="text-[#14B8A6] text-[10px] oc-font-mono tracking-widest mb-4">SEVERITY REFERENCE</p>
                  <div className="space-y-2.5">
                    {[
                      { label: "Clear", score: "PPI 0–1", color: "#2ECC91" },
                      { label: "Mild Concern", score: "PPI 1–3", color: "#F5C242" },
                      { label: "Moderate", score: "PPI 3–6", color: "#FF9F43" },
                      { label: "High Concern", score: "PPI 6–8", color: "#FF6B5B" },
                      { label: "Critical", score: "PPI 8–10", color: "#E8483A" },
                    ].map((t) => (
                      <div key={t.label} className="flex items-center gap-2.5">
                        <div className="w-2 h-2 rounded-full shrink-0" style={{ background: t.color }} />
                        <span className="text-white/60 text-xs flex-1">{t.label}</span>
                        <span className="oc-font-mono text-[10px]" style={{ color: t.color }}>{t.score}</span>
                      </div>
                    ))}
                  </div>

                  <div className="mt-5 p-3 rounded-xl" style={{ background: "rgba(13,148,136,0.10)", border: "1px solid rgba(13,148,136,0.20)" }}>
                    <p className="text-[#14B8A6] text-[10px] font-semibold oc-font-mono mb-1">Current Status</p>
                    <p className="text-white/45 text-[11px] leading-relaxed">All monitoring systems active. Next voice recording due in 5 days.</p>
                  </div>
                </div>
              </div>
            </RevealSection>

            {/* Quick actions — wired to real routes */}
            <RevealSection delay={150}>
              <div className="oc-card p-6">
                <h3 className="text-[#0F2137] font-semibold text-sm mb-4">Quick Actions</h3>
                <div className="space-y-2">
                  {[
                    { label: "Upload oral image", color: "#0D9488", icon: "📷", href: "/Component1/upload" },
                    { label: "Record voice sample", color: "#1565C0", icon: "🎙", href: "/vocal_therapy/analyze" },
                    { label: "Start meditation session", color: "#8B7FD1", icon: "🌿", href: "/component3" },
                    { label: "View Risk score", color: "#0D9488", icon: "📋", href: "/Component2" },
                  ].map((action) => (
                    <Link
                      key={action.label}
                      href={action.href}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-left transition-all hover:translate-x-0.5"
                      style={{ background: `${action.color}06`, border: `1px solid ${action.color}12`, color: "#0F2137" }}
                    >
                      <span className="text-base">{action.icon}</span>
                      <span className="text-xs font-medium">{action.label}</span>
                      <svg className="ml-auto" width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="#9BAABA" strokeWidth="1.8">
                        <path d="M4 2l4 4-4 4" />
                      </svg>
                    </Link>
                  ))}
                </div>
              </div>
            </RevealSection>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
