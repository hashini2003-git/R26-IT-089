"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { fetchMe, fetchProgress, fetchSessions } from "../../lib/api";
import { getPatient, isLoggedIn, saveAuth } from "../../lib/auth";
import type { ProgressPoint, Session } from "../../lib/types";

// ── Design tokens - Updated to match NavBar/SideBar green color scheme ──
const D = {
  bg:         "oklch(0.985 0.004 150)",
  surface:    "#ffffff",
  border:     "oklch(0.92 0.01 145)",
  text:       "oklch(0.22 0.015 150)",
  textMuted:  "oklch(0.50 0.015 150)",
  textDim:    "oklch(0.62 0.012 150)",
  accent:     "oklch(0.62 0.14 150)",
  accentSoft: "oklch(0.96 0.03 150)",
  accentInk:  "oklch(0.38 0.08 150)",
  low:        "oklch(0.62 0.13 160)",
  lowSoft:    "oklch(0.95 0.04 160)",
  lowInk:     "oklch(0.40 0.10 160)",
  mid:        "oklch(0.72 0.13 80)",
  midSoft:    "oklch(0.96 0.05 85)",
  midInk:     "oklch(0.42 0.10 70)",
  high:       "oklch(0.62 0.16 25)",
  highSoft:   "oklch(0.95 0.04 25)",
  highInk:    "oklch(0.42 0.13 25)",
  shadow:     "0 1px 3px rgba(15,32,60,0.06), 0 1px 0 rgba(15,32,60,0.02)",
  fontMono:   "'JetBrains Mono', ui-monospace, monospace",
  breakpoints: { mobile: 640, tablet: 768, desktop: 960 },
};

// ── Icons ─────────────────────────────────────────────────────────────────────
const Icons = {
  Check: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  ),
  Alert: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  ),
  Warning: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  ),
  Mic: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
      <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
      <line x1="12" y1="19" x2="12" y2="23" />
      <line x1="8" y1="23" x2="16" y2="23" />
    </svg>
  ),
  Clock: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  ),
  Calendar: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  ),
  Download: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  ),
  ArrowRight: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="12 5 19 12 12 19" />
    </svg>
  ),
  ArrowLeft: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="19" y1="12" x2="5" y2="12" />
      <polyline points="12 19 5 12 12 5" />
    </svg>
  ),
  ArrowUp: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="18 15 12 9 6 15" />
    </svg>
  ),
  ArrowDown: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="6 9 12 15 18 9" />
    </svg>
  ),
  TrendingUp: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
      <polyline points="17 6 23 6 23 12" />
    </svg>
  ),
  TrendingDown: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 18 13.5 8.5 8.5 13.5 1 6" />
      <polyline points="17 18 23 18 23 12" />
    </svg>
  ),
  Minus: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  ),
  Target: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="6" />
      <circle cx="12" cy="12" r="2" />
    </svg>
  ),
  Brain: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 3a2 2 0 0 1 6 0v1a2 2 0 0 1-2 2h-2a2 2 0 0 1-2-2V3z" />
      <path d="M12 6v2" />
      <path d="M9 8v6a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2V8" />
      <path d="M15 14a5 5 0 0 1-6 0" />
    </svg>
  ),
  Chat: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  ),
  Close: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  ),
  Article: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 4h16v16H4z" />
      <line x1="8" y1="8" x2="16" y2="8" />
      <line x1="8" y1="12" x2="16" y2="12" />
      <line x1="8" y1="16" x2="12" y2="16" />
    </svg>
  ),
  Exercise: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 5a3 3 0 0 1 0 6H6a3 3 0 0 1 0-6h12z" />
      <path d="M6 11v6a3 3 0 0 0 3 3h6a3 3 0 0 0 3-3v-6" />
    </svg>
  ),
  Phone: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.362 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.574 2.81.7A2 2 0 0 1 22 16.92z" />
    </svg>
  ),
  User: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  ),
  Send: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="22" y1="2" x2="11" y2="13" />
      <polygon points="22 2 15 22 11 13 2 9 22 2" />
    </svg>
  ),
};

const METRIC_COLORS = [
  "oklch(0.62 0.13 160)",
  "oklch(0.55 0.10 180)",
  "oklch(0.62 0.14 150)",
];

const LOCAL_METRIC_COLORS = ["#4ECDC4", "#FFD93D", "#FF6B6B"];

const METRICS = [
  { key: "vocal_clarity" as const, probKey: "vocal_clarity_prob" as const, label: "Vocal Clarity",  color: LOCAL_METRIC_COLORS[0] },
  { key: "fluency"       as const, probKey: "fluency_prob"       as const, label: "Speech Fluency", color: LOCAL_METRIC_COLORS[1] },
  { key: "articulation"  as const, probKey: "articulation_prob"  as const, label: "Articulation",   color: LOCAL_METRIC_COLORS[2] },
];

function toScore(prob: number) { return Math.round((1 - prob) * 100); }
function band(s: number) { return s >= 70 ? "low" : s >= 40 ? "mid" : "high"; }
function bandColor(s: number) { return D[band(s) as keyof typeof D] as string; }

// ── AI Recommendation Engine ──────────────────────────────────────────────────
interface AIRecommendation {
  id: string;
  type: "article" | "exercise" | "contact" | "general";
  title: string;
  description: string;
  priority: "high" | "medium" | "low";
  actionLink?: string;
  contactInfo?: {
    specialty: string;
    name: string;
    phone?: string;
    email?: string;
    urgency: "immediate" | "soon" | "routine";
  };
}

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

function generateAIRecommendations(
  sessions: Session[],
  latestScores: { vocal_clarity: number; fluency: number; articulation: number } | null,
  overallScore: number | null,
  trend: number | null
): AIRecommendation[] {
  const recommendations: AIRecommendation[] = [];
  
  if (!latestScores || sessions.length === 0) {
    recommendations.push({
      id: "welcome",
      type: "general",
      title: "Welcome to Vocal Therapy",
      description: "Record your first session to receive personalized recommendations based on your speech patterns.",
      priority: "medium",
    });
    return recommendations;
  }

  const metricsAnalysis = [
    { name: "Vocal Clarity", score: latestScores.vocal_clarity, key: "vocal" },
    { name: "Speech Fluency", score: latestScores.fluency, key: "fluency" },
    { name: "Articulation", score: latestScores.articulation, key: "articulation" },
  ];

  for (const metric of metricsAnalysis) {
    if (metric.score < 40) {
      recommendations.push({
        id: `critical_${metric.key}`,
        type: "contact",
        title: `Immediate Attention Needed: ${metric.name}`,
        description: `Your ${metric.name.toLowerCase()} score (${metric.score}) indicates significant concern. Please consult a speech therapist promptly.`,
        priority: "high",
        contactInfo: {
          specialty: "Speech-Language Pathologist",
          name: "MS BUDDHIMA SAMARAWEERA",
          phone: "",
          email: "",
          urgency: "immediate",
        },
      });
      recommendations.push({
        id: `exercise_${metric.key}_critical`,
        type: "exercise",
        title: `Emergency Exercises for ${metric.name}`,
        description: "Gentle vocal warm-ups and breathing exercises while waiting for clinical consultation.",
        priority: "high",
        actionLink: "#exercises",
      });
    } else if (metric.score < 60) {
      recommendations.push({
        id: `moderate_${metric.key}`,
        type: "article",
        title: `Improving Your ${metric.name}`,
        description: `Your current score (${metric.score}) shows room for improvement. Read our guide on targeted exercises.`,
        priority: "medium",
        actionLink: "https://www.asha.org/public/speech/disorders/",
      });
    }
  }

  if (trend !== null) {
    if (trend < -10) {
      recommendations.push({
        id: "declining_trend",
        type: "contact",
        title: "Declining Trend Detected",
        description: `Your scores have decreased by ${Math.abs(trend)} points. Schedule a check-up with your therapist.`,
        priority: "high",
        contactInfo: {
          specialty: "Clinical Speech Pathologist",
          name: "MS BUDDHIMA SAMARAWEERA",
          phone: "",
          email: "",
          urgency: "soon",
        },
      });
    } else if (trend > 15) {
      recommendations.push({
        id: "improving_trend",
        type: "general",
        title: "Excellent Progress!",
        description: `You've improved by ${trend} points! Keep up the great work with your daily exercises.`,
        priority: "low",
        actionLink: "#exercises",
      });
    }
  }

  if (sessions.length >= 5) {
    recommendations.push({
      id: "wellness_article",
      type: "article",
      title: "Maintaining Vocal Health Long-term",
      description: "Expert tips on preserving your speech recovery and preventing relapse.",
      priority: "medium",
      actionLink: "https://www.nidcd.nih.gov/health/taking-care-your-voice",
    });
  }

  recommendations.push({
    id: "education_1",
    type: "article",
    title: "Understanding Speech Recovery After Surgery",
    description: "Learn about the science behind voice rehabilitation and what to expect.",
    priority: "low",
    actionLink: "https://www.enthealth.org/conditions/voice-disorders/",
  });

  return recommendations.slice(0, 6);
}

// ── Responsive hook ──────────────────────────────────────────────────────────
function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);
  useEffect(() => {
    const media = window.matchMedia(query);
    if (media.matches !== matches) setMatches(media.matches);
    const listener = (e: MediaQueryListEvent) => setMatches(e.matches);
    media.addEventListener("change", listener);
    return () => media.removeEventListener("change", listener);
  }, [matches, query]);
  return matches;
}

// ── Card ──────────────────────────────────────────────────────────────────────
function Card({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{
      background: D.surface, borderRadius: 12, padding: "clamp(0.875rem, 4vw, 1.25rem)",
      border: `1px solid ${D.border}`, boxShadow: D.shadow, ...style,
    }}>
      {children}
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontWeight: 600, fontSize: "clamp(0.65rem, 3vw, 0.7rem)", color: D.textMuted,
                  textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "clamp(0.5rem, 3vw, 0.85rem)" }}>
      {children}
    </div>
  );
}

// ── Arc gauge ───────────────────────────────────────────────────────────────
function Gauge({ score, size = 180 }: { score: number; size?: number }) {
  const isMobile = useMediaQuery(`(max-width: ${D.breakpoints.mobile}px)`);
  const responsiveSize = isMobile ? Math.min(size * 0.7, 140) : size;
  const thickness = Math.max(8, responsiveSize * 0.07);
  const r = responsiveSize / 2 - thickness;
  const cx = responsiveSize / 2, cy = responsiveSize / 2;
  const startA = Math.PI * 0.75, sweep = Math.PI * 1.5;
  const valA = startA + Math.max(0, Math.min(1, score / 100)) * sweep;
  const b = band(score);
  const color = D[b as keyof typeof D] as string;
  const inkColor = D[`${b}Ink` as keyof typeof D] as string;
  const softColor = D[`${b}Soft` as keyof typeof D] as string;

  function arc(a0: number, a1: number, c: string, w = thickness) {
    const x0 = cx + r * Math.cos(a0), y0 = cy + r * Math.sin(a0);
    const x1 = cx + r * Math.cos(a1), y1 = cy + r * Math.sin(a1);
    const large = a1 - a0 > Math.PI ? 1 : 0;
    return <path d={`M ${x0} ${y0} A ${r} ${r} 0 ${large} 1 ${x1} ${y1}`}
      stroke={c} strokeWidth={w} strokeLinecap="round" fill="none" />;
  }

  return (
    <div style={{ position: "relative", width: responsiveSize, height: responsiveSize }}>
      <svg width={responsiveSize} height={responsiveSize}>
        {arc(startA, startA + sweep, D.border)}
        {arc(startA, valA, color)}
        <circle cx={cx + r * Math.cos(valA)} cy={cy + r * Math.sin(valA)}
          r={thickness / 2 + 2} fill="#fff" stroke={color} strokeWidth="2.5" />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column",
                    alignItems: "center", justifyContent: "center", gap: 2 }}>
        <div style={{ fontFamily: D.fontMono, fontSize: responsiveSize * 0.26, fontWeight: 600,
                      color: D.text, letterSpacing: "-0.02em", lineHeight: 1 }}>{score}</div>
        <div style={{ fontSize: "clamp(8px, 3vw, 10px)", color: D.textMuted, textTransform: "uppercase",
                      letterSpacing: "0.08em", marginTop: 4 }}>Therapy index</div>
        <div style={{ fontSize: "clamp(9px, 3vw, 11px)", fontWeight: 600, color: inkColor, marginTop: 5,
                      padding: "2px 10px", background: softColor, borderRadius: 999 }}>
          {b === "low" ? "Low risk" : b === "mid" ? "Moderate" : "High risk"}
        </div>
      </div>
    </div>
  );
}

// ── Unified 4-level severity system ──────────────────────────────────────────
const SEV_RANK: Record<string, number> = { none: 0, mild: 1, moderate: 2, severe: 3 };
const SEV_LABEL: Record<string, string> = {
  none:     "No concern",
  mild:     "Mild",
  moderate: "Moderate",
  severe:   "Needs attention",
};
const SEV_COLOR: Record<string, string> = {
  none:     D.low,
  mild:     D.mid,
  moderate: "oklch(0.62 0.15 42)",
  severe:   D.high,
};

// ── 30-day calendar heatmap ────────────────────────────────────────────────
function CalendarHeatmap({ sessions, dayNumber }: { sessions: Session[]; dayNumber: number }) {
  const byDay: Record<number, string> = {};
  sessions.forEach(s => {
    const lbl = s.severity_label in SEV_RANK ? s.severity_label : "none";
    const prev = byDay[s.day_number];
    if (prev === undefined || SEV_RANK[lbl] < SEV_RANK[prev]) {
      byDay[s.day_number] = lbl;
    }
  });

  const LEGEND: [string, string][] = [
    ["No concern",     SEV_COLOR.none],
    ["Mild",           SEV_COLOR.mild],
    ["Moderate",       SEV_COLOR.moderate],
    ["Needs attention",SEV_COLOR.severe],
    ["Missed",         D.border],
  ];

  return (
    <div>
      <div style={{ display: "flex", gap: "clamp(8px, 3vw, 12px)", fontSize: "clamp(8px, 2.5vw, 10px)", color: D.textDim, marginBottom: 10, flexWrap: "wrap" as const }}>
        {LEGEND.map(([l, c]) => (
          <span key={l} style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <span style={{ width: "clamp(8px, 3vw, 10px)", height: "clamp(8px, 3vw, 10px)", borderRadius: 3, background: c, display: "inline-block" }} />
            {l}
          </span>
        ))}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(10, 1fr)", gap: "clamp(3px, 1.5vw, 5px)" }}>
        {Array.from({ length: 30 }, (_, i) => {
          const day = i + 1;
          const sev = byDay[day];
          const future = day > dayNumber;
          const missed = !future && sev === undefined;
          const bg = future
            ? "oklch(0.96 0.003 150)"
            : missed
            ? D.border
            : SEV_COLOR[sev!];
          const isToday = day === dayNumber;
          const tipLabel = sev ? SEV_LABEL[sev] : future ? "upcoming" : "missed";
          return (
            <div key={i} title={`Day ${day} · ${tipLabel}`}
              style={{
                aspectRatio: "1", borderRadius: 5, background: bg,
                border: isToday ? `2px solid ${D.text}` : "none",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "clamp(7px, 2.5vw, 9px)", fontFamily: D.fontMono, fontWeight: 600,
                color: future || missed ? D.textDim : "#fff",
                opacity: future ? 0.45 : 1,
              }}>
              {day}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Trend chart ──────────────────────────────────────────────────────
function TrendChart({ data }: { data: ProgressPoint[] }) {
  const isMobile = useMediaQuery(`(max-width: ${D.breakpoints.mobile}px)`);
  const W = isMobile ? 340 : 620;
  const H = isMobile ? 160 : 200;
  const PAD = { top: isMobile ? 12 : 16, right: isMobile ? 20 : 28, bottom: isMobile ? 32 : 40, left: isMobile ? 36 : 44 };
  const cW = W - PAD.left - PAD.right, cH = H - PAD.top - PAD.bottom;
  const xMax = 30;
  function xPx(day: number) { return ((day - 1) / (xMax - 1)) * cW; }
  function yPx(s: number)   { return cH - (s / 100) * cH; }

  function linePath(key: "vocal_clarity" | "fluency" | "articulation") {
    return data.map((d, i) =>
      `${i === 0 ? "M" : "L"} ${xPx(d.day_number).toFixed(1)} ${yPx(toScore(d[key])).toFixed(1)}`
    ).join(" ");
  }
  function areaPath(key: "vocal_clarity" | "fluency" | "articulation") {
    if (data.length === 0) return "";
    const line = linePath(key);
    const last = data[data.length - 1], first = data[0];
    return `${line} L ${xPx(last.day_number).toFixed(1)} ${cH} L ${xPx(first.day_number).toFixed(1)} ${cH} Z`;
  }

  const xTicks = isMobile ? [1, 10, 20, 30] : [1, 5, 10, 15, 20, 25, 30];
  const yTicks = [0, 25, 50, 75, 100];

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", display: "block" }}>
      <defs>
        {METRICS.map(m => (
          <linearGradient key={m.key} id={`grad_${m.key}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={m.color} stopOpacity="0.16" />
            <stop offset="100%" stopColor={m.color} stopOpacity="0" />
          </linearGradient>
        ))}
      </defs>
      <g transform={`translate(${PAD.left},${PAD.top})`}>
        {yTicks.map(v => (
          <g key={v}>
            <line x1={0} y1={yPx(v)} x2={cW} y2={yPx(v)}
              stroke={v === 50 ? "oklch(0.82 0.008 150)" : D.border}
              strokeWidth={v === 50 ? 1.5 : 1} strokeDasharray={v === 50 ? "4 3" : "0"} />
            <text x={-8} y={yPx(v) + 4} textAnchor="end" fontSize={isMobile ? 8 : 10} fill={D.textDim}
              fontFamily={D.fontMono}>{v}%</text>
          </g>
        ))}
        {xTicks.map(d => (
          <text key={d} x={xPx(d)} y={cH + (isMobile ? 14 : 18)} textAnchor="middle" fontSize={isMobile ? 8 : 10}
            fill={D.textDim} fontFamily={D.fontMono}>D{d}</text>
        ))}
        {data.length > 0 && (
          <>
            <line x1={xPx(data[data.length - 1].day_number)} y1={0}
                  x2={xPx(data[data.length - 1].day_number)} y2={cH}
                  stroke="oklch(0.82 0.008 150)" strokeWidth={1.5} strokeDasharray="3 2" />
            <text x={xPx(data[data.length - 1].day_number)} y={-4}
                  textAnchor="middle" fontSize={isMobile ? 7 : 9} fill={D.textDim}>today</text>
          </>
        )}
        {data.length >= 2 && METRICS.map(m => (
          <path key={m.key} d={areaPath(m.key)} fill={`url(#grad_${m.key})`} />
        ))}
        {data.length >= 2 && METRICS.map(m => (
          <path key={m.key} d={linePath(m.key)} fill="none"
            stroke={m.color} strokeWidth={isMobile ? 2 : 2.5} strokeLinecap="round" strokeLinejoin="round" />
        ))}
        {data.length >= 1 && METRICS.map(m =>
          data.map(d => (
            <circle key={`${m.key}_${d.day_number}`}
              cx={xPx(d.day_number)} cy={yPx(toScore(d[m.key]))}
              r={isMobile ? 2 : (data.length > 15 ? 2.5 : 4)}
              fill={m.color} stroke="#fff" strokeWidth={1.5} />
          ))
        )}
      </g>
    </svg>
  );
}

// ── Weekly bar chart ────────────────────────────────────────────
function WeeklyChart({ data }: { data: ProgressPoint[] }) {
  const isMobile = useMediaQuery(`(max-width: ${D.breakpoints.mobile}px)`);
  if (data.length === 0) return (
    <div style={{ textAlign: "center", padding: "1.5rem", color: D.textDim, fontSize: "0.82rem" }}>
      Record sessions to see weekly averages
    </div>
  );
  const weeks = [
    { label: isMobile ? "W1" : "W1 (D1–7)",   points: data.filter(d => d.day_number <= 7)  },
    { label: isMobile ? "W2" : "W2 (D8–14)",  points: data.filter(d => d.day_number >= 8  && d.day_number <= 14) },
    { label: isMobile ? "W3" : "W3 (D15–21)", points: data.filter(d => d.day_number >= 15 && d.day_number <= 21) },
    { label: isMobile ? "W4" : "W4 (D22–30)", points: data.filter(d => d.day_number >= 22) },
  ];
  function avg(pts: ProgressPoint[], key: "vocal_clarity" | "fluency" | "articulation") {
    if (pts.length === 0) return null;
    return Math.round(pts.reduce((s, d) => s + toScore(d[key]), 0) / pts.length);
  }
  const W = isMobile ? 340 : 500;
  const H = isMobile ? 150 : 180;
  const PAD = { top: 12, right: isMobile ? 8 : 16, bottom: isMobile ? 40 : 48, left: isMobile ? 32 : 40 };
  const cW = W - PAD.left - PAD.right, cH = H - PAD.top - PAD.bottom;
  const groupW = cW / 4, barW = Math.max(4, (groupW - (isMobile ? 6 : 12)) / 3);
  function yPx(s: number) { return cH - (s / 100) * cH; }

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", display: "block" }}>
      <g transform={`translate(${PAD.left},${PAD.top})`}>
        {[0, 50, 100].map(v => (
          <g key={v}>
            <line x1={0} y1={yPx(v)} x2={cW} y2={yPx(v)} stroke={D.border} strokeWidth={1} />
            <text x={-6} y={yPx(v) + 4} textAnchor="end" fontSize={isMobile ? 7 : 9} fill={D.textDim}
              fontFamily={D.fontMono}>{v}%</text>
          </g>
        ))}
        {weeks.map((wk, wi) => {
          const gx = wi * groupW + (isMobile ? 2 : 6);
          return (
            <g key={wi}>
              {METRICS.map((m, mi) => {
                const score = avg(wk.points, m.key);
                if (score === null) return (
                  <rect key={m.key} x={gx + mi * (barW + (isMobile ? 1 : 2))} y={yPx(20)} width={barW}
                    height={20} fill={D.border} rx={3} opacity={0.5} />
                );
                const barH = (score / 100) * cH;
                return (
                  <g key={m.key}>
                    <rect x={gx + mi * (barW + (isMobile ? 1 : 2))} y={yPx(score)} width={barW}
                      height={barH} fill={m.color} rx={3} opacity={0.85} />
                    {!isMobile && (
                      <text x={gx + mi * (barW + 2) + barW / 2} y={yPx(score) - 3}
                        textAnchor="middle" fontSize={8} fill={m.color} fontWeight={700}>{score}</text>
                    )}
                  </g>
                );
              })}
              <text x={gx + (groupW - (isMobile ? 6 : 12)) / 2} y={cH + (isMobile ? 12 : 16)} textAnchor="middle" fontSize={isMobile ? 7 : 9}
                fill={D.textMuted}>{wk.label}</text>
              {wk.points.length === 0 && (
                <text x={gx + (groupW - (isMobile ? 6 : 12)) / 2} y={cH - 8} textAnchor="middle" fontSize={7}
                  fill={D.border}>—</text>
              )}
            </g>
          );
        })}
      </g>
    </svg>
  );
}

// ── Per-metric sparkline card ───────────────────────────────────
function SparkCard({ metric, data, latestProb, firstProb }: {
  metric: typeof METRICS[number];
  data: ProgressPoint[];
  latestProb: number | null;
  firstProb:  number | null;
}) {
  const isMobile = useMediaQuery(`(max-width: ${D.breakpoints.mobile}px)`);
  const W = isMobile ? 180 : 240;
  const H = 56;
  const latest = latestProb !== null ? toScore(latestProb) : null;
  const first  = firstProb  !== null ? toScore(firstProb)  : null;
  const improvement = (latest !== null && first !== null) ? latest - first : null;

  function sparkPath() {
    if (data.length < 2) return "";
    const n = data.length;
    return data.map((d, i) => {
      const x = (i / (n - 1)) * W;
      const y = H - (toScore(d[metric.key]) / 100) * H;
      return `${i === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`;
    }).join(" ");
  }
  function sparkArea() {
    if (data.length < 2) return "";
    const n = data.length;
    const line = data.map((d, i) => {
      const x = (i / (n - 1)) * W;
      const y = H - (toScore(d[metric.key]) / 100) * H;
      return `${i === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`;
    }).join(" ");
    return `${line} L ${W} ${H} L 0 ${H} Z`;
  }

  const b = latest !== null ? band(latest) : null;
  const col = b ? (D[b as keyof typeof D] as string) : D.textDim;

  return (
    <Card>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.7rem", flexWrap: "wrap", gap: "0.5rem" }}>
        <div>
          <div style={{ fontSize: "clamp(0.6rem, 3vw, 0.7rem)", fontWeight: 700, color: D.textMuted,
                        textTransform: "uppercase", letterSpacing: "0.07em" }}>{metric.label}</div>
          {latest !== null ? (
            <div style={{ fontSize: "clamp(1.5rem, 6vw, 1.9rem)", fontWeight: 700, color: metric.color,
                          lineHeight: 1.1, marginTop: 2, fontFamily: D.fontMono }}>{latest}</div>
          ) : (
            <div style={{ fontSize: "1.1rem", color: D.border, marginTop: 4 }}>—</div>
          )}
        </div>
        {improvement !== null && (
          <div style={{
            background: improvement >= 0 ? D.lowSoft : D.highSoft,
            color: improvement >= 0 ? D.lowInk : D.highInk,
            borderRadius: 7, padding: "3px 9px",
            fontSize: "clamp(0.65rem, 2.5vw, 0.75rem)", fontWeight: 700,
            display: "flex", alignItems: "center", gap: "0.2rem",
          }}>
            {improvement >= 0 ? <Icons.TrendingUp /> : <Icons.TrendingDown />}
            {improvement >= 0 ? "+" : ""}{improvement}pts
          </div>
        )}
      </div>
      <div style={{ overflow: "hidden", borderRadius: 6, background: D.bg, height: 56 }}>
        {data.length >= 2 ? (
          <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: "100%", display: "block" }}
               preserveAspectRatio="none">
            <defs>
              <linearGradient id={`spark_${metric.key}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={metric.color} stopOpacity="0.2" />
                <stop offset="100%" stopColor={metric.color} stopOpacity="0" />
              </linearGradient>
            </defs>
            <path d={sparkArea()} fill={`url(#spark_${metric.key})`} />
            <path d={sparkPath()} fill="none" stroke={metric.color} strokeWidth={2}
                  strokeLinecap="round" strokeLinejoin="round" />
            {data.length > 0 && (() => {
              const last = data[data.length - 1], n = data.length;
              return <circle cx={((n - 1) / (n - 1)) * W}
                cy={H - (toScore(last[metric.key]) / 100) * H}
                r={3.5} fill={metric.color} stroke="#fff" strokeWidth={1.5} />;
            })()}
          </svg>
        ) : (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center",
                        height: "100%", fontSize: "0.75rem", color: D.border }}>
            Record 2+ sessions
          </div>
        )}
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: "0.5rem", flexWrap: "wrap", gap: "0.25rem" }}>
        <span style={{ fontSize: "clamp(0.6rem, 2.5vw, 0.7rem)", color: D.textDim }}>
          {first !== null ? `Day 1: ${first}` : "—"}
        </span>
        <span style={{ fontSize: "clamp(0.6rem, 2.5vw, 0.7rem)", color: col, fontWeight: 700, fontFamily: D.fontMono }}>
          {latest !== null ? `Latest: ${latest}` : "—"}
        </span>
      </div>
    </Card>
  );
}

// ── Stage bars ──────────────────────────────────────────────────
function StageBars({ sessions }: { sessions: Session[] }) {
  const STAGES = ["none", "mild", "moderate", "severe"] as const;
  const LABELS = SEV_LABEL as Record<string, string>;
  const COLORS = SEV_COLOR as Record<string, string>;

  const counts: Record<string, number> = { none: 0, mild: 0, moderate: 0, severe: 0 };
  sessions.forEach(s => { if (s.severity_label in counts) counts[s.severity_label]++; });
  const total = sessions.length || 1;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
      {STAGES.map(stage => {
        const pct = Math.round((counts[stage] / total) * 100);
        const col = COLORS[stage];
        return (
          <div key={stage}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4, flexWrap: "wrap", gap: "0.25rem" }}>
              <span style={{ fontSize: "clamp(0.75rem, 3vw, 0.82rem)", fontWeight: 600, color: D.text }}>{LABELS[stage]}</span>
              <span style={{ fontSize: "clamp(0.75rem, 3vw, 0.82rem)", fontWeight: 700, color: col, fontFamily: D.fontMono }}>
                {counts[stage]} ({pct}%)
              </span>
            </div>
            <div style={{ height: 8, background: D.border, borderRadius: 5, overflow: "hidden" }}>
              <div style={{ width: `${pct}%`, height: "100%", background: col,
                            borderRadius: 5, transition: "width 1s cubic-bezier(.4,0,.2,1)" }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── KPI stat card ───────────────────────────────────────────────
function KpiCard({ label, value, delta, color, sparkData, sparkColor }: {
  label: string; value: string; delta?: string; color: string;
  sparkData?: number[]; sparkColor?: string;
}) {
  const isMobile = useMediaQuery(`(max-width: ${D.breakpoints.mobile}px)`);
  const W = isMobile ? 140 : 240;
  const H = 36;
  const min = sparkData ? Math.min(...sparkData) : 0;
  const max = sparkData ? Math.max(...sparkData) : 1;
  const range = (max - min) || 1;
  const pts = sparkData?.map((v, i) => [
    (i / (sparkData.length - 1)) * W,
    H - ((v - min) / range) * H,
  ]);
  const path = pts?.map((p, i) => `${i ? "L" : "M"}${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(" ");

  return (
    <Card>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.25rem" }}>
        <div style={{ fontSize: "clamp(0.6rem, 2.5vw, 0.68rem)", fontWeight: 700, color: D.textMuted,
                      textTransform: "uppercase", letterSpacing: "0.08em" }}>{label}</div>
        {delta && (
          <div style={{ fontSize: "clamp(0.6rem, 2.5vw, 0.7rem)", padding: "2px 7px", borderRadius: 5,
                        background: D.lowSoft, color: D.lowInk,
                        fontFamily: D.fontMono, fontWeight: 700, display: "flex", alignItems: "center", gap: "0.2rem" }}>
            <Icons.TrendingUp /> {delta}
          </div>
        )}
      </div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 3, marginTop: 6 }}>
        <span style={{ fontFamily: D.fontMono, fontSize: "clamp(20px, 6vw, 26px)", fontWeight: 600,
                        letterSpacing: "-0.02em", color }}>{value}</span>
      </div>
      {sparkData && sparkData.length >= 2 && (
        <div style={{ marginTop: 6 }}>
          <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: H, display: "block" }}>
            <path d={path!} stroke={sparkColor ?? D.accent} strokeWidth="1.75" fill="none"
              strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      )}
    </Card>
  );
}

// ── Session row ─────────────────────────────────────────────────
function parseISO(s: string): Date {
  if (s.endsWith("Z") || /[+-]\d{2}:\d{2}$/.test(s)) return new Date(s);
  return new Date(s + "Z");
}

function SessionRow({ s }: { s: Session }) {
  const isMobile = useMediaQuery(`(max-width: ${D.breakpoints.mobile}px)`);
  const dt   = parseISO(s.recorded_at);
  const date = dt.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
  const time = dt.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
  const overall = Math.round(
    ((1 - s.vocal_clarity_prob) + (1 - s.fluency_prob) + (1 - s.articulation_prob)) / 3 * 100
  );
  const col = bandColor(overall);
  const SEV_LABELS: Record<string, string> = {
    none: "No concern", mild: "Mild", moderate: "Moderate", severe: "Needs attention",
  };

  if (isMobile) {
    return (
      <div style={{
        display: "flex", flexDirection: "column", gap: "0.5rem",
        padding: "0.8rem 1rem", borderBottom: `1px solid ${D.border}`,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <div style={{
            width: 36, height: 36, borderRadius: "50%",
            background: `${col}18`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "1rem",
          }}>
            {s.is_healthy ? <Icons.Check /> : <Icons.Warning />}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 600, fontSize: "0.85rem", color: D.text }}>
              Day {s.day_number} — {date}
            </div>
            <div style={{ fontSize: "0.72rem", color: D.textMuted, marginTop: 2, display: "flex", alignItems: "center", gap: "0.3rem" }}>
              <Icons.Clock /> {time} · {s.duration_s.toFixed(1)}s
            </div>
          </div>
          <div style={{ fontWeight: 700, fontSize: "1.1rem", color: col,
                        fontFamily: D.fontMono }}>
            {overall}
          </div>
        </div>
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" as const, paddingLeft: "44px" }}>
          {[
            { label: "VC", score: toScore(s.vocal_clarity_prob), color: METRIC_COLORS[0] },
            { label: "SF", score: toScore(s.fluency_prob),       color: METRIC_COLORS[1] },
            { label: "AR", score: toScore(s.articulation_prob),  color: METRIC_COLORS[2] },
          ].map(({ label, score, color }) => (
            <span key={label} style={{
              background: `${color}18`, color, borderRadius: 5,
              padding: "2px 7px", fontSize: "0.7rem", fontWeight: 700, fontFamily: D.fontMono,
            }}>{label} {score}</span>
          ))}
          <span style={{
            background: `${col}18`, color: col, borderRadius: 5,
            padding: "2px 7px", fontSize: "0.7rem", fontWeight: 700,
          }}>
            {SEV_LABELS[s.severity_label] ?? s.severity_label}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      display: "grid", gridTemplateColumns: "36px 1fr auto auto",
      alignItems: "center", gap: "0.75rem",
      padding: "0.8rem 1.25rem", borderBottom: `1px solid ${D.border}`,
    }}>
      <div style={{
        width: 36, height: 36, borderRadius: "50%",
        background: `${col}18`,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: "1rem",
      }}>
        {s.is_healthy ? <Icons.Check /> : <Icons.Warning />}
      </div>
      <div>
        <div style={{ fontWeight: 600, fontSize: "0.85rem", color: D.text }}>
          Day {s.day_number} — {date} {time}
        </div>
        <div style={{ fontSize: "0.72rem", color: D.textMuted, marginTop: 2, fontFamily: D.fontMono, display: "flex", alignItems: "center", gap: "0.3rem" }}>
          {s.duration_s.toFixed(1)}s · {SEV_LABELS[s.severity_label] ?? s.severity_label}
        </div>
      </div>
      <div style={{ display: "flex", gap: "0.3rem", flexWrap: "wrap" as const }}>
        {[
          { label: "VC", score: toScore(s.vocal_clarity_prob), color: METRIC_COLORS[0] },
          { label: "SF", score: toScore(s.fluency_prob),       color: METRIC_COLORS[1] },
          { label: "AR", score: toScore(s.articulation_prob),  color: METRIC_COLORS[2] },
        ].map(({ label, score, color }) => (
          <span key={label} style={{
            background: `${color}18`, color, borderRadius: 5,
            padding: "2px 7px", fontSize: "0.7rem", fontWeight: 700, fontFamily: D.fontMono,
          }}>{label} {score}</span>
        ))}
      </div>
      <div style={{ fontWeight: 700, fontSize: "1rem", color: col,
                    fontFamily: D.fontMono, minWidth: 40, textAlign: "right" }}>
        {overall}
      </div>
    </div>
  );
}

// ── AI Recommendations Panel ─────────────────────────────────────
function AIRecommendationsPanel({ recommendations }: { recommendations: AIRecommendation[] }) {
  const [expanded, setExpanded] = useState<string | null>(null);

  const priorityOrder = { high: 0, medium: 1, low: 2 };
  const sorted = [...recommendations].sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

  return (
    <Card style={{ background: "linear-gradient(135deg, #667eea15 0%, #764ba215 100%)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem" }}>
        <SectionLabel>Recommendations</SectionLabel>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
        {sorted.map(rec => (
          <div
            key={rec.id}
            style={{
              background: "#fff",
              borderRadius: 10,
              border: `1px solid ${rec.priority === "high" ? D.high : rec.priority === "medium" ? D.mid : D.border}`,
              overflow: "hidden",
            }}
          >
            <div
              onClick={() => setExpanded(expanded === rec.id ? null : rec.id)}
              style={{
                padding: "0.85rem 1rem",
                cursor: "pointer",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: "0.5rem",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flex: 1 }}>
                <span style={{ fontSize: "1.2rem" }}>
                  {rec.type === "article" && <Icons.Article />}
                  {rec.type === "exercise" && <Icons.Exercise />}
                  {rec.type === "contact" && <Icons.Phone />}
                  {rec.type === "general" && <Icons.Target />}
                </span>
                <div>
                  <div style={{ fontWeight: 700, fontSize: "0.85rem", color: D.text }}>{rec.title}</div>
                  <div style={{ fontSize: "0.72rem", color: D.textMuted, marginTop: 2 }}>{rec.description}</div>
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                {rec.priority === "high" && (
                  <span style={{
                    background: D.highSoft,
                    color: D.highInk,
                    padding: "2px 8px",
                    borderRadius: 12,
                    fontSize: "0.6rem",
                    fontWeight: 700,
                  }}>URGENT</span>
                )}
                <span style={{ fontSize: "0.8rem", color: D.textMuted }}>
                  {expanded === rec.id ? <Icons.ArrowUp /> : <Icons.ArrowDown />}
                </span>
              </div>
            </div>
            {expanded === rec.id && (
              <div style={{ padding: "0.85rem 1rem", borderTop: `1px solid ${D.border}`, background: D.bg }}>
                {rec.contactInfo && (
                  <div>
                    <div style={{ fontWeight: 700, fontSize: "0.75rem", marginBottom: "0.5rem", color: D.text }}>
                      Contact Information:
                    </div>
                    <div style={{ fontSize: "0.7rem", color: D.textMuted }}>
                      <div><strong>Specialist:</strong> {rec.contactInfo.name} ({rec.contactInfo.specialty})</div>
                      {rec.contactInfo.phone && <div><strong>Phone:</strong> {rec.contactInfo.phone}</div>}
                      {rec.contactInfo.email && <div><strong>Email:</strong> {rec.contactInfo.email}</div>}
                      <div style={{ marginTop: "0.5rem" }}>
                        <span style={{
                          background: rec.contactInfo.urgency === "immediate" ? D.highSoft : D.midSoft,
                          color: rec.contactInfo.urgency === "immediate" ? D.highInk : D.midInk,
                          padding: "2px 6px",
                          borderRadius: 4,
                          fontSize: "0.65rem",
                          fontWeight: 700,
                        }}>
                          {rec.contactInfo.urgency === "immediate" ? "Contact immediately" : 
                           rec.contactInfo.urgency === "soon" ? "Contact within 48 hours" : "Schedule routine appointment"}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                <div style={{ 
                  marginTop: rec.contactInfo ? "0.75rem" : "0", 
                  paddingTop: rec.contactInfo ? "0.5rem" : "0", 
                  borderTop: rec.contactInfo ? `1px solid ${D.border}` : "none" 
                }}>
                  <Link 
                    href="/vocal_therapy/exercises" 
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "0.4rem",
                      color: D.accent,
                      textDecoration: "none",
                      fontWeight: 600,
                      fontSize: "0.7rem",
                      transition: "all 0.2s ease",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = D.accentInk;
                      e.currentTarget.style.transform = "translateX(4px)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = D.accent;
                      e.currentTarget.style.transform = "translateX(0)";
                    }}
                  >
                    View recommended exercises
                    <Icons.ArrowRight />
                  </Link>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </Card>
  );
}

// ── AI Chatbot Component ─────────────────────────────────────────
function AIChatbot({ sessions, latestScore, trend }: { 
  sessions: Session[]; 
  latestScore: number | null;
  trend: number | null;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      content: "Hello! I'm your FREE Vocal Therapy AI assistant. I can help with speech exercises, progress tracking, therapist referrals, and recovery tips. What would you like to know today?",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isTyping) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content: input,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMessage]);
    const userInput = input;
    setInput("");
    setIsTyping(true);
    setError(null);

    const sessionCount = sessions.length;
    const overallScore = latestScore;
    
    let primaryConcerns = [];
    const recentSessions = sessions.slice(0, 3);
    if (recentSessions.length > 0) {
      const avgVocal = recentSessions.reduce((sum, s) => sum + (1 - s.vocal_clarity_prob) * 100, 0) / recentSessions.length;
      const avgFluency = recentSessions.reduce((sum, s) => sum + (1 - s.fluency_prob) * 100, 0) / recentSessions.length;
      const avgArticulation = recentSessions.reduce((sum, s) => sum + (1 - s.articulation_prob) * 100, 0) / recentSessions.length;
      
      if (avgVocal < 60) primaryConcerns.push("vocal clarity");
      if (avgFluency < 60) primaryConcerns.push("speech fluency");
      if (avgArticulation < 60) primaryConcerns.push("articulation");
    }

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userInput,
          context: {
            sessionCount: sessionCount,
            latestScore: overallScore,
            trend: trend,
            primaryConcerns: primaryConcerns.join(", "),
          },
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get response');
      }

      const data = await response.json();
      
      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.reply,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, assistantMessage]);
    } catch (err) {
      console.error('Chat error:', err);
      setError('Connection issue. Using offline responses - still here to help!');
      
      const fallbackResponse = getFallbackResponse(userInput, {
        latestScore: overallScore,
        sessionCount: sessionCount,
      });
      
      const fallbackMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: fallbackResponse,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, fallbackMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const suggestedQuestions = [
    "What exercises help with vocal clarity?",
    "How can I track my progress better?",
    "When should I see a specialist?",
    "Give me daily speech tips",
    "Help with speaking anxiety",
  ];

  const isMobile = useMediaQuery(`(max-width: ${D.breakpoints.mobile}px)`);

  return (
    <>
      {/* Chat Button */}
      <button
        onClick={() => setIsOpen(true)}
        style={{
          position: "fixed",
          bottom: "5rem",
          right: "2rem",
          width: "60px",
          height: "60px",
          borderRadius: "30px",
          background: `linear-gradient(135deg, ${D.accent}, ${D.accentInk})`,
          border: "none",
          cursor: "pointer",
          boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#fff",
          zIndex: 1000,
          transition: "transform 0.2s, box-shadow 0.2s",
        }}
        onMouseEnter={(e) => { 
          e.currentTarget.style.transform = "scale(1.05)";
          e.currentTarget.style.boxShadow = "0 6px 16px rgba(255, 255, 255, 0.2)";
        }}
        onMouseLeave={(e) => { 
          e.currentTarget.style.transform = "scale(1)";
          e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.15)";
        }}
      >
        <Icons.Chat />
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div style={{
          position: "fixed",
          bottom: "5rem",
          right: "1rem",
          width: isMobile ? "calc(100vw - 2rem)" : "400px",
          height: "510px",
          background: D.surface,
          borderRadius: "20px",
          boxShadow: "0 20px 40px rgba(0,0,0,0.2)",
          display: "flex",
          flexDirection: "column",
          zIndex: 1001,
          overflow: "hidden",
          animation: "slideUp 0.3s ease-out",
        }}>
          {/* Header */}
          <div style={{
            padding: "1rem 1.25rem",
            background: `linear-gradient(135deg, oklch(0.22 0.14 160) 0%, ${D.accent} 100%)`,
            color: "#fff",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
              
              <div>
                <div style={{ fontWeight: 700, fontSize: "0.95rem" }}>Vocal Therapy AI</div>
                <div style={{ fontSize: "0.65rem", opacity: 0.9, display: "flex", alignItems: "center", gap: "4px" }}>
                  <span style={{ 
                    display: "inline-block", 
                    width: "8px", 
                    height: "8px", 
                    borderRadius: "50%", 
                    background: "#4ade80",
                    marginRight: "4px"
                  }}></span>
                  Free • Always Available
                </div>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              style={{
                background: "rgba(255,255,255,0.1)",
                border: "none",
                color: "#fff",
                cursor: "pointer",
                padding: "6px 10px",
                borderRadius: "8px",
                transition: "background 0.2s",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.2)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.1)"; }}
            >
              <Icons.Close />
            </button>
          </div>

          {/* Messages */}
          <div style={{
            flex: 1,
            overflowY: "auto",
            padding: "1rem",
            display: "flex",
            flexDirection: "column",
            gap: "0.75rem",
            background: D.bg,
          }}>
            {messages.map((msg, idx) => (
              <div
                key={msg.id}
                style={{
                  display: "flex",
                  justifyContent: msg.role === "user" ? "flex-end" : "flex-start",
                  animation: "slideIn 0.3s ease-out",
                }}
              >
                <div style={{
                  maxWidth: "85%",
                  padding: "0.7rem 1rem",
                  borderRadius: msg.role === "user" ? "18px 4px 18px 18px" : "4px 18px 18px 18px",
                  background: msg.role === "user" ? D.accent : D.surface,
                  color: msg.role === "user" ? "#fff" : D.text,
                  fontSize: "0.85rem",
                  lineHeight: 1.5,
                  whiteSpace: "pre-wrap",
                  boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
                  border: msg.role === "assistant" ? `1px solid ${D.border}` : "none",
                }}>
                  {msg.content}
                </div>
              </div>
            ))}
            {isTyping && (
              <div style={{ display: "flex", justifyContent: "flex-start" }}>
                <div style={{
                  padding: "0.7rem 1rem",
                  borderRadius: "4px 18px 18px 18px",
                  background: D.surface,
                  border: `1px solid ${D.border}`,
                  display: "flex",
                  gap: "6px",
                }}>
                  <span style={{ 
                    animation: "pulse 1.5s infinite", 
                    display: "inline-block", 
                    width: "8px", 
                    height: "8px", 
                    background: D.accent, 
                    borderRadius: "50%" 
                  }}></span>
                  <span style={{ 
                    animation: "pulse 1.5s infinite 0.2s", 
                    display: "inline-block", 
                    width: "8px", 
                    height: "8px", 
                    background: D.accent, 
                    borderRadius: "50%" 
                  }}></span>
                  <span style={{ 
                    animation: "pulse 1.5s infinite 0.4s", 
                    display: "inline-block", 
                    width: "8px", 
                    height: "8px", 
                    background: D.accent, 
                    borderRadius: "50%" 
                  }}></span>
                </div>
              </div>
            )}
            {error && (
              <div style={{
                background: "#fef3c7",
                color: "#92400e",
                padding: "0.5rem 0.75rem",
                borderRadius: "8px",
                fontSize: "0.7rem",
                textAlign: "center",
                border: "1px solid #fde68a",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.5rem",
              }}>
                <Icons.Alert /> {error}
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Suggested Questions */}
          {messages.length < 4 && (
            <div style={{
              padding: "0.75rem 1rem",
              borderTop: `1px solid ${D.border}`,
              background: D.surface,
            }}>
              <div style={{ fontSize: "0.65rem", color: D.textMuted, marginBottom: "0.5rem", fontWeight: 600, display: "flex", alignItems: "center", gap: "0.3rem" }}>
                <Icons.Target /> Try asking:
              </div>
              <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                {suggestedQuestions.map((q, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      setInput(q);
                      setTimeout(() => handleSend(), 100);
                    }}
                    style={{
                      background: D.bg,
                      border: `1px solid ${D.border}`,
                      borderRadius: "20px",
                      padding: "0.35rem 0.85rem",
                      fontSize: "0.7rem",
                      color: D.text,
                      cursor: "pointer",
                      transition: "all 0.2s",
                      fontFamily: "inherit",
                    }}
                    onMouseEnter={(e) => { 
                      e.currentTarget.style.background = D.accentSoft;
                      e.currentTarget.style.borderColor = D.accent;
                    }}
                    onMouseLeave={(e) => { 
                      e.currentTarget.style.background = D.bg;
                      e.currentTarget.style.borderColor = D.border;
                    }}
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input Area */}
          <div style={{
            padding: "1rem",
            borderTop: `1px solid ${D.border}`,
            background: D.surface,
            display: "flex",
            gap: "0.5rem",
            alignItems: "flex-end",
          }}>
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your message..."
              style={{
                flex: 1,
                padding: "0.6rem 0.85rem",
                border: `1px solid ${D.border}`,
                borderRadius: "12px",
                fontSize: "0.85rem",
                fontFamily: "inherit",
                resize: "none",
                minHeight: "42px",
                maxHeight: "90px",
                background: D.bg,
                transition: "border-color 0.2s",
              }}
              rows={1}
              onFocus={(e) => { e.currentTarget.style.borderColor = D.accent; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = D.border; }}
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || isTyping}
              style={{
                padding: "0.6rem 1.2rem",
                background: input.trim() && !isTyping ? D.accent : D.border,
                color: "#fff",
                border: "none",
                borderRadius: "12px",
                cursor: input.trim() && !isTyping ? "pointer" : "not-allowed",
                fontSize: "0.85rem",
                fontWeight: 600,
                transition: "all 0.2s",
                whiteSpace: "nowrap",
                display: "flex",
                alignItems: "center",
                gap: "0.3rem",
              }}
            >
              <Icons.Send /> Send
            </button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.3; transform: scale(0.8); }
          50% { opacity: 1; transform: scale(1); }
        }
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </>
  );
}

// Fallback helper function
function getFallbackResponse(message: string, context: any): string {
  const msg = message.toLowerCase();
  const score = context.latestScore;
  
  if (msg.includes('score') || msg.includes('progress')) {
    if (score !== null) {
      if (score < 40) return `Your score is ${score}/100. This indicates significant concern. Please schedule an appointment with a speech therapist immediately. I can help you find resources - just ask for "therapist contacts".`;
      if (score < 60) return `Your score is ${score}/100. You're making progress! Try increasing daily exercises to 15 minutes. Lip trills and humming scales work great for improvement.`;
      return `Excellent! Your score is ${score}/100. Keep up the great work with your daily exercises! Would you like some advanced techniques?`;
    }
    return "You haven't recorded any sessions yet. Click 'Record today' to start tracking your progress!";
  }
  
  if (msg.includes('exercise')) {
    return " **Recommended Exercises**:\n\n1. **Lip Trills** (2 min): Make 'brrr' sound with lips\n2. **Humming** (3 min): Hum scales up and down\n3. **Tongue Twisters** (2 min): 'Red lorry, yellow lorry'\n\nStart with 5 minutes daily and increase gradually!";
  }
  
  if (msg.includes('therapist') || msg.includes('contact')) {
    return " **Find a Speech Therapist**:\n\n• ASHA ProFind: asha.org/profind\n• Local university clinics (often low-cost)\n• Call 1-800-638-8255 for referrals\n\nWould you like tips for your first appointment?";
  }
  
  if (msg.includes('resource') || msg.includes('article')) {
    return " **Trusted Resources**:\n\n• ASHA: asha.org/public/speech/disorders\n• NIH: nidcd.nih.gov/health/voice\n• FREE exercises on our YouTube channel\n\nAll resources are clinically reviewed and free to access!";
  }
  
  if (msg.includes('anxiety')) {
    return " **Manage Speaking Anxiety**:\n\n• Deep breathing (4-7-8 technique)\n• Gentle neck stretches before speaking\n• Start with short practice sessions\n• Record yourself to track progress\n\nYou've got this! Every small step counts.";
  }
  
  return "I'm here to help! Ask me about:\n• Exercises & practice routines\n• Progress tracking\n• Finding therapists\n• Anxiety management\n• Daily speech tips\n\nWhat would you like to know? 💙";
}

// ── Report generator ─────────────────────────────────────────────
function generateReportHTML(
  name: string,
  surgeryDate: string,
  dayNumber: number,
  sessions: Session[],
  progress: ProgressPoint[],
): string {
  function sc(p: number) { return Math.round((1 - p) * 100); }

  const SEV_RANK: Record<string, number> = { none: 0, mild: 1, moderate: 2, severe: 3 };
  const SEV_META: Record<string, { label: string; bg: string; color: string; bar: string; desc: string }> = {
    none:     { label: "No concern",     bg: "#dcfce7", color: "#15803d", bar: "#16a34a", desc: "Speech is within the normal recovery range. Excellent progress." },
    mild:     { label: "Mild",           bg: "#fef3c7", color: "#92400e", bar: "#d97706", desc: "Mild vocal concern remains. Continue therapy exercises as advised." },
    moderate: { label: "Moderate",       bg: "#fed7aa", color: "#9a3412", bar: "#ea580c", desc: "Moderate speech concern. Continued clinical monitoring is recommended." },
    severe:   { label: "Needs attention",bg: "#fee2e2", color: "#991b1b", bar: "#dc2626", desc: "Significant vocal concern. Urgent clinical review is recommended." },
  };

  function dominantSev(subset: Session[]): string {
    if (subset.length === 0) return "none";
    const counts: Record<string, number> = { none: 0, mild: 0, moderate: 0, severe: 0 };
    subset.forEach(s => { if (s.severity_label in counts) counts[s.severity_label]++; });
    return Object.entries(counts).reduce((a, b) => b[1] > a[1] ? b : a)[0];
  }
  const recentSessions  = sessions.slice(0, Math.min(7, sessions.length));
  const earlierSessions = sessions.slice(-Math.min(7, sessions.length));
  const currentSevKey   = dominantSev(recentSessions);
  const startingSevKey  = dominantSev(earlierSessions);
  const currentMeta     = SEV_META[currentSevKey];
  const startingMeta    = SEV_META[startingSevKey];
  const rankDiff        = SEV_RANK[startingSevKey] - SEV_RANK[currentSevKey];
  const trendText       = rankDiff > 1  ? "Significant improvement"
                        : rankDiff === 1 ? "Moderate improvement"
                        : rankDiff === 0 ? "Stable — no change"
                        : "Regression noted — clinical review advised";
  const trendColor      = rankDiff > 0 ? "#15803d" : rankDiff === 0 ? "#64748b" : "#dc2626";

  const totalSessions = sessions.length;
  const healthyCount  = sessions.filter(s => s.is_healthy).length;
  const allOverall    = sessions.map(s => Math.round((sc(s.vocal_clarity_prob) + sc(s.fluency_prob) + sc(s.articulation_prob)) / 3));
  const overallLatest = allOverall[0] ?? null;
  const overallFirst  = allOverall[allOverall.length - 1] ?? null;
  const improvement   = overallLatest !== null && overallFirst !== null && sessions.length > 1 ? overallLatest - overallFirst : null;
  const bestScore     = allOverall.length > 0 ? Math.max(...allOverall) : null;
  const now           = new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });

  const weeks = [
    { label: "Week 1",  short: "W1 (D1–7)",   filter: (d: ProgressPoint) => d.day_number <= 7 },
    { label: "Week 2",  short: "W2 (D8–14)",  filter: (d: ProgressPoint) => d.day_number >= 8  && d.day_number <= 14 },
    { label: "Week 3",  short: "W3 (D15–21)", filter: (d: ProgressPoint) => d.day_number >= 15 && d.day_number <= 21 },
    { label: "Week 4",  short: "W4 (D22–30)", filter: (d: ProgressPoint) => d.day_number >= 22 },
  ].map(w => {
    const pts = progress.filter(w.filter);
    if (pts.length === 0) return { ...w, vc: null as number|null, sf: null as number|null, ar: null as number|null, avg: null as number|null, sevKey: "none" as string };
    const vc  = Math.round(pts.reduce((s, d) => s + sc(d.vocal_clarity), 0) / pts.length);
    const sf  = Math.round(pts.reduce((s, d) => s + sc(d.fluency),       0) / pts.length);
    const ar  = Math.round(pts.reduce((s, d) => s + sc(d.articulation),  0) / pts.length);
    const avg = Math.round((vc + sf + ar) / 3);
    const sevKey = avg >= 70 ? "none" : avg >= 55 ? "mild" : avg >= 40 ? "moderate" : "severe";
    return { ...w, vc, sf, ar, avg, sevKey };
  });

  const sevCounts: Record<string, number> = { none: 0, mild: 0, moderate: 0, severe: 0 };
  sessions.forEach(s => { if (s.severity_label in sevCounts) sevCounts[s.severity_label]++; });

  const weekTableRows = weeks.map(w => {
    if (w.avg === null) return `<tr><td style="font-weight:600">${w.short}</td><td colspan="5" style="color:#94a3b8">No data recorded</td></tr>`;
    const colFn = (v: number) => v >= 70 ? "#16a34a" : v >= 40 ? "#d97706" : "#dc2626";
    const sev   = SEV_META[w.sevKey];
    return `<tr>
      <td style="font-weight:600">${w.short}</td>
      <td style="font-family:monospace;font-weight:700;color:${colFn(w.vc!)}">${w.vc}</td>
      <td style="font-family:monospace;font-weight:700;color:${colFn(w.sf!)}">${w.sf}</td>
      <td style="font-family:monospace;font-weight:700;color:${colFn(w.ar!)}">${w.ar}</td>
      <td style="font-family:monospace;font-weight:800;color:${colFn(w.avg)}">${w.avg}</td>
      <td><span style="background:${sev.bg};color:${sev.color};padding:2px 8px;border-radius:999px;font-size:10px;font-weight:700">${sev.label}</span></td>
    </tr>`;
  }).join("");

  const progressBars = weeks.map((w, i) => {
    if (w.avg === null) return `
      <div style="display:flex;align-items:center;gap:14px;margin-bottom:14px">
        <div style="width:60px;font-size:11px;font-weight:700;color:#94a3b8">${w.label}</div>
        <div style="flex:1;background:#f1f5f9;border-radius:6px;height:32px;display:flex;align-items:center;padding-left:12px">
          <span style="font-size:11px;color:#cbd5e1">No data</span>
        </div>
      </div>`;
    const sev      = SEV_META[w.sevKey];
    const arrow    = i > 0 && weeks[i-1].avg !== null
      ? (w.avg > weeks[i-1].avg! ? " ↑" : w.avg < weeks[i-1].avg! ? " ↓" : " →")
      : "";
    const arrowCol = arrow === " ↑" ? "#16a34a" : arrow === " ↓" ? "#dc2626" : "#64748b";
    return `
      <div style="display:flex;align-items:center;gap:14px;margin-bottom:14px">
        <div style="width:60px;font-size:11px;font-weight:700;color:#475569">${w.label}</div>
        <div style="flex:1;background:#f1f5f9;border-radius:6px;height:32px;overflow:hidden;position:relative">
          <div style="height:100%;width:${w.avg}%;background:${sev.bar};border-radius:6px;display:flex;align-items:center;padding:0 12px;min-width:48px">
            <span style="font-size:12px;font-weight:800;color:#fff;font-family:monospace">${w.avg}</span>
          </div>
        </div>
        <div style="width:110px;display:flex;align-items:center;gap:6px">
          <span style="background:${sev.bg};color:${sev.color};padding:2px 8px;border-radius:999px;font-size:10px;font-weight:700">${sev.label}</span>
          <span style="font-size:12px;font-weight:700;color:${arrowCol}">${arrow}</span>
        </div>
      </div>`;
  }).join("");

  const sevRows = Object.entries(SEV_META).map(([key, { label, bg, color, bar }]) => {
    const count = sevCounts[key] || 0;
    const pct   = totalSessions > 0 ? Math.round((count / totalSessions) * 100) : 0;
    return `<tr>
      <td><span style="background:${bg};color:${color};padding:2px 8px;border-radius:999px;font-size:10px;font-weight:700">${label}</span></td>
      <td style="font-family:monospace;font-weight:700">${count}</td>
      <td style="font-family:monospace">${pct}%</td>
      <td><div style="background:#e2e8f0;border-radius:4px;height:8px;width:180px;overflow:hidden"><div style="height:100%;border-radius:4px;background:${bar};width:${pct}%"></div></div></td>
    </tr>`;
  }).join("");

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Vocal Therapy — 30-Day Recovery Report — ${name}</title>
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#1a2340;background:#fff;font-size:13px;line-height:1.5}
  .page{max-width:820px;margin:0 auto;padding:44px}
  h2{font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:#64748b;margin:0 0 12px;padding-bottom:6px;border-bottom:1px solid #e2e8f0}
  .section{margin-bottom:28px}
  table{width:100%;border-collapse:collapse;font-size:12px}
  th{text-align:left;padding:7px 10px;background:#f1f5f9;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:#64748b}
  td{padding:6px 10px;border-bottom:1px solid #f1f5f9}
  tr:last-child td{border-bottom:none}
  @media (max-width: 640px) {
    .page{padding:20px}
    table{font-size:10px}
    th,td{padding:4px 6px}
    .progress-bar-container{flex-direction:column;align-items:flex-start}
  }
  @media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact}.page{padding:24px}}
</style>
</head>
<body>
<div class="page">

  <!-- Header -->
  <div style="display:flex;justify-content:space-between;align-items:flex-start;border-bottom:2px solid #1a2340;padding-bottom:18px;margin-bottom:24px;flex-wrap:wrap;gap:12px">
    <div>
      <div style="font-size:22px;font-weight:800;color:#1a2340;letter-spacing:-.02em">Vocal<span style="color:#16a34a">Therapy</span></div>
      <div style="font-size:11px;color:#64748b;margin-top:3px">AI Speech Recovery Platform</div>
    </div>
    <div style="text-align:right;font-size:11px;color:#64748b">
      <div style="font-weight:700;font-size:13px;color:#1a2340">30-Day Recovery Report</div>
      <div>Generated: ${now}</div>
      <div>Confidential — Clinical use only</div>
    </div>
  </div>

  <!-- Patient banner -->
  <div style="background:linear-gradient(135deg,#1e293b 0%,#16a34a 100%);color:#fff;border-radius:12px;padding:20px 24px;margin-bottom:20px">
    <div style="font-size:21px;font-weight:700;margin-bottom:5px">${name}</div>
    <div style="opacity:.75;font-size:12px;display:flex;gap:22px;flex-wrap:wrap">
      <span> Surgery: ${surgeryDate || "—"}</span>
      <span> Day ${dayNumber} of 30</span>
      <span> ${totalSessions} sessions recorded</span>
      <span> ${healthyCount} healthy sessions</span>
    </div>
  </div>

  <!-- ★ OVERALL CLINICAL VERDICT ★ -->
  <div style="background:${currentMeta.bg};border:2px solid ${currentMeta.color};border-radius:12px;padding:20px 24px;margin-bottom:20px">
    <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.1em;color:${currentMeta.color};margin-bottom:6px">
      Overall Clinical Assessment
    </div>
    <div style="font-size:24px;font-weight:800;color:${currentMeta.color};margin-bottom:4px">
      ${currentMeta.label}
    </div>
    <div style="font-size:13px;color:#475569;margin-bottom:14px">${currentMeta.desc}</div>
    <div style="display:flex;gap:28px;font-size:12px;padding-top:12px;border-top:1px solid ${currentMeta.color}22;flex-wrap:wrap">
      <div>
        <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:#94a3b8;margin-bottom:2px">Starting stage</div>
        <span style="background:${startingMeta.bg};color:${startingMeta.color};padding:3px 10px;border-radius:999px;font-size:11px;font-weight:700">${startingMeta.label}</span>
      </div>
      <div>
        <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:#94a3b8;margin-bottom:2px">Current stage</div>
        <span style="background:${currentMeta.bg};color:${currentMeta.color};padding:3px 10px;border-radius:999px;font-size:11px;font-weight:700">${currentMeta.label}</span>
      </div>
      <div>
        <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:#94a3b8;margin-bottom:2px">Trend</div>
        <span style="font-weight:700;color:${trendColor};font-size:12px">${trendText}</span>
      </div>
    </div>
  </div>

  <!-- KPIs -->
  <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:12px;margin-bottom:24px">
    ${[
      { label: "Latest Score",  value: String(overallLatest ?? "—"), sub: "out of 100",   color: overallLatest !== null ? (overallLatest >= 70 ? "#16a34a" : overallLatest >= 40 ? "#d97706" : "#dc2626") : "#1a2340" },
      { label: "Sessions",      value: String(totalSessions),        sub: "recorded",      color: "#1a2340" },
      { label: "Best Session",  value: String(bestScore ?? "—"),     sub: "highest score", color: "#16a34a" },
      { label: "Improvement",   value: improvement !== null ? `${improvement >= 0 ? "+" : ""}${improvement}` : "—", sub: "pts since day 1", color: improvement !== null ? (improvement >= 0 ? "#16a34a" : "#dc2626") : "#1a2340" },
    ].map(k => `<div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:13px 15px">
      <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:#94a3b8;margin-bottom:3px">${k.label}</div>
      <div style="font-size:25px;font-weight:700;font-family:monospace;color:${k.color}">${k.value}</div>
      <div style="font-size:11px;color:#64748b;margin-top:2px">${k.sub}</div>
    </div>`).join("")}
  </div>

  <!-- ★ PROGRESS CHART ★ -->
  <div class="section">
    <h2>30-Day Recovery Progress — Week by Week</h2>
    <div style="padding:8px 0 4px">
      <div style="display:flex;gap:14px;margin-bottom:16px;font-size:10px;color:#94a3b8;align-items:center;flex-wrap:wrap">
        <span>Score scale: 0 ──────────────────────────────── 100</span>
        <span style="color:#16a34a;font-weight:700">■ No concern (≥70)</span>
        <span style="color:#d97706;font-weight:700">■ Mild (55–69)</span>
        <span style="color:#ea580c;font-weight:700">■ Moderate (40–54)</span>
        <span style="color:#dc2626;font-weight:700">■ Needs attn (&lt;40)</span>
      </div>
      ${progressBars}
    </div>
  </div>

  <!-- Weekly averages table -->
  <div class="section">
    <h2>Weekly Performance Breakdown</h2>
    <div style="overflow-x:auto">
      <table>
        <thead><tr><th>Period</th><th>Vocal Clarity</th><th>Speech Fluency</th><th>Articulation</th><th>Average</th><th>Stage</th></tr></thead>
        <tbody>${weekTableRows}</tbody>
      </table>
    </div>
  </div>

  <!-- Severity distribution -->
  <div class="section">
    <h2>Recovery Stage Distribution — All ${totalSessions} Sessions</h2>
    <div style="overflow-x:auto">
      <table>
        <thead><tr><th>Stage</th><th>Sessions</th><th>Percentage</th><th>Distribution</th></tr></thead>
        <tbody>${sevRows}</tbody>
      </table>
    </div>
  </div>

  <!-- Footer -->
  <div style="margin-top:28px;padding-top:14px;border-top:1px solid #e2e8f0;font-size:10px;color:#94a3b8;text-align:center">
    <p><strong>Clinical Disclaimer:</strong> Scores are AI-generated screening indicators only and must not replace professional medical advice. Always discuss results with your speech therapist or clinical team.</p>
    <p style="margin-top:5px">Vocal Therapy AI Speech Recovery Platform · Generated ${now} · Confidential</p>
  </div>

</div>
</body>
</html>`;
}

// ── Page ──────────────────────────────────────────────────────
export default function DashboardPage() {
  const router = useRouter();
  const cached = getPatient();
  const isMobile = useMediaQuery(`(max-width: ${D.breakpoints.mobile}px)`);

  const [patient,  setPatient]  = useState(cached);
  const [progress, setProgress] = useState<ProgressPoint[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState<string | null>(null);
  const [recommendations, setRecommendations] = useState<AIRecommendation[]>([]);

  function handleDownloadReport() {
    const name        = patient?.name ?? "Patient";
    const surgDate    = patient?.surgery_date ?? "";
    const dayNum      = patient?.day_number ?? dayNumber;
    const html        = generateReportHTML(name, surgDate, dayNum, sessions, progress);
    const win         = window.open("", "_blank", "width=920,height=720");
    if (!win) { alert("Please allow pop-ups for this site to download the report."); return; }
    win.document.write(html);
    win.document.close();
    setTimeout(() => win.print(), 600);
  }

  useEffect(() => {
    if (!isLoggedIn()) { router.replace("/login"); return; }
    Promise.all([fetchMe(), fetchProgress(), fetchSessions()])
      .then(([me, prog, sess]) => {
        setPatient(me);
        if (cached) saveAuth(localStorage.getItem("oc_token") ?? "", me);
        setProgress(prog);
        setSessions(sess);
        
        const latestSession = sess[0];
        const latestScores = latestSession ? {
          vocal_clarity: toScore(latestSession.vocal_clarity_prob),
          fluency: toScore(latestSession.fluency_prob),
          articulation: toScore(latestSession.articulation_prob),
        } : null;
        
        const overallLatest = latestScores
          ? Math.round((latestScores.vocal_clarity + latestScores.fluency + latestScores.articulation) / 3)
          : null;
        
        const firstSession = sess[sess.length - 1];
        const firstOverall = firstSession
          ? Math.round(((1 - firstSession.vocal_clarity_prob) + (1 - firstSession.fluency_prob) + (1 - firstSession.articulation_prob)) / 3 * 100)
          : null;
        
        const trend = (overallLatest !== null && firstOverall !== null && sess.length > 1)
          ? overallLatest - firstOverall
          : null;
        
        const aiRecs = generateAIRecommendations(sess, latestScores, overallLatest, trend);
        setRecommendations(aiRecs);
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [router]);

  if (loading) return (
    <div style={{ textAlign: "center", padding: "4rem", color: D.textMuted,
                  fontFamily: D.fontMono, fontSize: "0.85rem" }}>
      Loading your progress…
    </div>
  );
  if (error) return (
    <div style={{ textAlign: "center", padding: "4rem", color: D.high, display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem" }}>
      <Icons.Alert /> {error}
    </div>
  );

  const dayNumber   = patient?.day_number ?? cached?.day_number ?? 1;
  const name        = patient?.name ?? "Patient";
  const surgeryDate = patient?.surgery_date
    ? new Date(patient.surgery_date + "T12:00:00").toLocaleDateString("en-GB",
        { day: "numeric", month: "long", year: "numeric" })
    : "—";

  const latest      = sessions[0] ?? null;
  const previous    = sessions[1] ?? null;
  const firstSession = sessions.length > 0 ? sessions[sessions.length - 1] : null;

  const latestScores = latest ? {
    vocal_clarity: toScore(latest.vocal_clarity_prob),
    fluency:       toScore(latest.fluency_prob),
    articulation:  toScore(latest.articulation_prob),
  } : null;

  const overallLatest = latestScores
    ? Math.round((latestScores.vocal_clarity + latestScores.fluency + latestScores.articulation) / 3)
    : null;

  const firstOverall = firstSession
    ? Math.round(((1 - firstSession.vocal_clarity_prob) + (1 - firstSession.fluency_prob) + (1 - firstSession.articulation_prob)) / 3 * 100)
    : null;
  const totalImprovement = (overallLatest !== null && firstOverall !== null && sessions.length > 1)
    ? overallLatest - firstOverall : null;

  const bestScore = sessions.length > 0 ? Math.max(...sessions.map(s =>
    Math.round(((1 - s.vocal_clarity_prob) + (1 - s.fluency_prob) + (1 - s.articulation_prob)) / 3 * 100)
  )) : null;

  const progressPct = Math.min(100, Math.round((dayNumber / 30) * 100));

  const delta = (key: "vocal_clarity_prob" | "fluency_prob" | "articulation_prob") =>
    latest && previous ? toScore(latest[key]) - toScore(previous[key]) : null;

  const sparkVC = progress.map(d => toScore(d.vocal_clarity));
  const sparkSF = progress.map(d => toScore(d.fluency));
  const sparkAR = progress.map(d => toScore(d.articulation));

  function dominantSevLabel(subset: Session[]): string {
    if (subset.length === 0) return "none";
    const counts: Record<string, number> = { none: 0, mild: 0, moderate: 0, severe: 0 };
    subset.forEach(s => { if (s.severity_label in counts) counts[s.severity_label]++; });
    return Object.entries(counts).reduce((a, b) => b[1] > a[1] ? b : a)[0];
  }
  const recentSlice   = sessions.slice(0, Math.min(7, sessions.length));
  const earlierSlice  = sessions.slice(-Math.min(7, sessions.length));
  const currentSevKey = dominantSevLabel(recentSlice);
  const startSevKey   = dominantSevLabel(earlierSlice);
  const _weekBuckets = [
    progress.filter(d => d.day_number >= 1  && d.day_number <= 7),
    progress.filter(d => d.day_number >= 8  && d.day_number <= 14),
    progress.filter(d => d.day_number >= 15 && d.day_number <= 21),
    progress.filter(d => d.day_number >= 22 && d.day_number <= 30),
  ];
  const _weekAvgs = _weekBuckets
    .map(pts => pts.length === 0 ? null : Math.round(
      pts.reduce((s, d) => s + Math.round((toScore(d.vocal_clarity) + toScore(d.fluency) + toScore(d.articulation)) / 3), 0) / pts.length
    ))
    .filter((v): v is number => v !== null);
  const avgScore = _weekAvgs.length > 0
    ? Math.round(_weekAvgs.reduce((s, v) => s + v, 0) / _weekAvgs.length)
    : null;
  const verdictRankDiff = SEV_RANK[startSevKey] - SEV_RANK[currentSevKey];
  const verdictTrend    = verdictRankDiff > 1  ? "Significant improvement ↑"
                        : verdictRankDiff === 1 ? "Moderate improvement ↑"
                        : verdictRankDiff === 0 ? "Stable →"
                        : "Regression noted ↓";
  const verdictTrendColor = verdictRankDiff > 0 ? D.low : verdictRankDiff === 0 ? D.textMuted : D.high;

  const VERDICT_SOFT: Record<string, string> = {
    none:     D.lowSoft, mild: D.midSoft,
    moderate: "oklch(0.96 0.04 42)", severe: D.highSoft,
  };
  const VERDICT_INK: Record<string, string> = {
    none: D.lowInk, mild: D.midInk,
    moderate: "oklch(0.42 0.12 42)", severe: D.highInk,
  };
  const VERDICT_BORDER: Record<string, string> = {
    none: "oklch(0.85 0.08 160)", mild: "oklch(0.85 0.08 80)",
    moderate: "oklch(0.82 0.10 42)", severe: "oklch(0.85 0.08 25)",
  };
  const VERDICT_DESC: Record<string, string> = {
    none:     "Speech is within the normal recovery range. Excellent progress.",
    mild:     "Mild vocal concern remains. Continue therapy exercises as advised.",
    moderate: "Moderate speech concern. Continued clinical monitoring is recommended.",
    severe:   "Significant vocal concern. Please discuss with your clinical team urgently.",
  };

  const trendForChat = totalImprovement;

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <div style={{ 
        flex: 1, 
        overflow: "auto",
        padding: "clamp(1rem, 4vw, 2rem) clamp(0.75rem, 3vw, 1.25rem)",
        maxWidth: D.breakpoints.desktop,
        margin: "0 auto",
        width: "100%"
      }}>
        {/* Header */}
        <div style={{
          background: `linear-gradient(135deg, oklch(0.22 0.14 160) 0%, ${D.accent} 100%)`,
          borderRadius: 14, padding: "clamp(1rem, 4vw, 1.5rem) clamp(1rem, 4vw, 1.75rem)", color: "#fff",
          marginBottom: "1.5rem",
          display: "flex", justifyContent: "space-between", alignItems: "center",
          flexWrap: "wrap", gap: "1rem",
        }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: "clamp(10px, 3vw, 11px)", fontFamily: D.fontMono, textTransform: "uppercase",
                          letterSpacing: "0.1em", color: "rgba(255,255,255,.5)", marginBottom: 4 }}>
              30-day progress · Day {dayNumber} of 30
            </div>
            <div style={{ fontWeight: 700, fontSize: "clamp(1.2rem, 5vw, 1.5rem)", display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <Icons.User /> {name}
            </div>
            <div style={{ opacity: 0.7, fontSize: "clamp(0.7rem, 3vw, 0.82rem)", marginTop: "0.15rem", display: "flex", alignItems: "center", gap: "0.3rem" }}>
              <Icons.Calendar /> Surgery: {surgeryDate}
            </div>
            <div style={{ marginTop: "0.75rem", maxWidth: isMobile ? "100%" : 260 }}>
              <div style={{ display: "flex", justifyContent: "space-between",
                            fontSize: "clamp(0.6rem, 2.5vw, 0.68rem)", opacity: 0.6, marginBottom: 4 }}>
                <span>Programme progress</span><span>{progressPct}%</span>
              </div>
              <div style={{ height: 6, background: "rgba(255,255,255,.2)", borderRadius: 3 }}>
                <div style={{ width: `${progressPct}%`, height: "100%", background: "#fff",
                              borderRadius: 3, transition: "width 1s" }} />
              </div>
              <div style={{ display: "flex", justifyContent: "space-between",
                            fontSize: "clamp(0.55rem, 2vw, 0.65rem)", opacity: 0.45, marginTop: 3 }}>
                <span>Day 1</span><span>Day 30</span>
              </div>
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: isMobile ? "row" : "column", gap: "0.5rem", alignItems: "center", flexWrap: "wrap" }}>
            <Link href="/vocal_therapy/analyze" style={{
              background: "#fff", color: D.accentInk,
              borderRadius: 10, padding: "clamp(8px, 3vw, 10px) clamp(16px, 4vw, 20px)",
              fontWeight: 700, fontSize: "clamp(0.75rem, 3vw, 0.85rem)",
              textDecoration: "none", whiteSpace: "nowrap" as const,
              display: "flex", alignItems: "center", gap: "0.3rem",
            }}>
              <Icons.Mic /> Voice Check-in
            </Link>
            <button
              onClick={handleDownloadReport}
              disabled={sessions.length === 0}
              style={{
                background: sessions.length > 0 ? "rgba(255,255,255,.15)" : "rgba(255,255,255,.07)",
                color: sessions.length > 0 ? "#fff" : "rgba(255,255,255,.4)",
                border: "1px solid rgba(255,255,255,.25)",
                borderRadius: 10, padding: "clamp(8px, 3vw, 10px) clamp(16px, 4vw, 20px)",
                fontWeight: 600, fontSize: "clamp(0.7rem, 3vw, 0.82rem)",
                cursor: sessions.length > 0 ? "pointer" : "not-allowed",
                fontFamily: "inherit", whiteSpace: "nowrap" as const,
                display: "flex", alignItems: "center", gap: "0.3rem",
              }}
            >
              <Icons.Download /> Download Report
            </button>
          </div>
        </div>

        {/* AI Recommendations Panel */}
        {recommendations.length > 0 && (
          <div style={{ marginBottom: "1.5rem" }}>
            <AIRecommendationsPanel recommendations={recommendations} />
          </div>
        )}

        {/* KPI strip */}
        <div style={{ display: "grid", gridTemplateColumns: `repeat(auto-fit, minmax(${isMobile ? "140px" : "180px"}, 1fr))`, gap: "0.9rem", marginBottom: "1.5rem" }}>
          <KpiCard label="Programme Average (weekly)"
            value={avgScore !== null ? String(avgScore) : "—"}
            color={avgScore !== null ? bandColor(avgScore) : D.textDim}
            sparkData={progress.map(d => Math.round((toScore(d.vocal_clarity) + toScore(d.fluency) + toScore(d.articulation)) / 3))}
            sparkColor={D.accent} />
          <KpiCard label="Sessions Recorded"
            value={String(sessions.length)}
            color={D.accent} />
          <KpiCard label="Best Session"
            value={bestScore !== null ? String(bestScore) : "—"}
            color={D.low} />
          <KpiCard label="Total Improvement"
            value={totalImprovement !== null ? `${totalImprovement >= 0 ? "+" : ""}${totalImprovement}` : "—"}
            color={totalImprovement !== null ? (totalImprovement >= 0 ? D.low : D.high) : D.textDim} />
        </div>

        {/* ── OVERALL PROGRAMME VERDICT ── */}
        {sessions.length > 0 && (
          <div style={{
            background: VERDICT_SOFT[currentSevKey],
            border: `2px solid ${VERDICT_BORDER[currentSevKey]}`,
            borderRadius: 14, padding: "clamp(1rem, 4vw, 1.4rem) clamp(1rem, 4vw, 1.75rem)",
            marginBottom: "1.5rem",
          }}>
            <div style={{ fontSize: "clamp(0.6rem, 2.5vw, 0.68rem)", fontWeight: 700, textTransform: "uppercase",
                          letterSpacing: "0.1em", color: VERDICT_INK[currentSevKey],
                          opacity: 0.7, marginBottom: "0.4rem" }}>
              {dayNumber >= 30 ? "30-Day Programme — Final Assessment" : `Programme Assessment · Day ${dayNumber} of 30`}
            </div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between",
                          flexWrap: "wrap" as const, gap: "1rem" }}>
              <div>
                <div style={{ fontSize: "clamp(1.5rem, 6vw, 1.9rem)", fontWeight: 800, color: VERDICT_INK[currentSevKey],
                              letterSpacing: "-0.02em", lineHeight: 1.1 }}>
                  {SEV_LABEL[currentSevKey]}
                </div>
                <div style={{ fontSize: "clamp(0.75rem, 3vw, 0.85rem)", color: VERDICT_INK[currentSevKey],
                              opacity: 0.8, marginTop: "0.3rem", maxWidth: 420 }}>
                  {VERDICT_DESC[currentSevKey]}
                </div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "0.5rem" }}>
                {avgScore !== null && (
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: "clamp(0.55rem, 2.5vw, 0.65rem)", fontWeight: 700, textTransform: "uppercase",
                                  letterSpacing: "0.08em", color: VERDICT_INK[currentSevKey], opacity: 0.6 }}>
                      Weekly avg (balanced)
                    </div>
                    <div style={{ fontSize: "clamp(1.8rem, 7vw, 2.4rem)", fontWeight: 800, fontFamily: D.fontMono,
                                  color: VERDICT_INK[currentSevKey], lineHeight: 1 }}>
                      {avgScore}<span style={{ fontSize: "clamp(0.8rem, 3vw, 1rem)", fontWeight: 500, opacity: 0.6 }}>%</span>
                    </div>
                  </div>
                )}
                <div style={{ fontSize: "clamp(0.7rem, 3vw, 0.82rem)", fontWeight: 700, color: verdictTrendColor, display: "flex", alignItems: "center", gap: "0.3rem" }}>
                  {verdictRankDiff > 0 ? <Icons.TrendingUp /> : verdictRankDiff === 0 ? <Icons.Minus /> : <Icons.TrendingDown />}
                  {verdictTrend}
                </div>
              </div>
            </div>
            <div style={{ display: "flex", gap: "1.5rem", marginTop: "1rem",
                          paddingTop: "0.9rem", borderTop: `1px solid ${VERDICT_BORDER[currentSevKey]}`,
                          flexWrap: "wrap" as const, alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", gap: "1.5rem", flexWrap: "wrap" as const, alignItems: "center" }}>
                <div>
                  <div style={{ fontSize: "clamp(0.55rem, 2.5vw, 0.63rem)", fontWeight: 700, textTransform: "uppercase",
                                letterSpacing: "0.08em", color: VERDICT_INK[currentSevKey],
                                opacity: 0.55, marginBottom: 4 }}>
                    Starting stage (Days 1–7)
                  </div>
                  <span style={{
                    background: SEV_COLOR[startSevKey], color: "#fff",
                    borderRadius: 20, padding: "3px 12px", fontSize: "clamp(0.7rem, 2.5vw, 0.78rem)", fontWeight: 700,
                  }}>
                    {SEV_LABEL[startSevKey]}
                  </span>
                </div>
                <div style={{ display: "flex", alignItems: "center", color: VERDICT_INK[currentSevKey],
                              opacity: 0.4, fontSize: "1.2rem" }}>
                  <Icons.ArrowRight />
                </div>
                <div>
                  <div style={{ fontSize: "clamp(0.55rem, 2.5vw, 0.63rem)", fontWeight: 700, textTransform: "uppercase",
                                letterSpacing: "0.08em", color: VERDICT_INK[currentSevKey],
                                opacity: 0.55, marginBottom: 4 }}>
                    Current stage (Last 7 days)
                  </div>
                  <span style={{
                    background: SEV_COLOR[currentSevKey], color: "#fff",
                    borderRadius: 20, padding: "3px 12px", fontSize: "clamp(0.7rem, 2.5vw, 0.78rem)", fontWeight: 700,
                  }}>
                    {SEV_LABEL[currentSevKey]}
                  </span>
                </div>
              </div>
              
              <Link href="/vocal_therapy/exercises" style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.5rem",
                background: "#ffffff",
                color: VERDICT_INK[currentSevKey],
                border: `1px solid ${VERDICT_BORDER[currentSevKey]}`,
                borderRadius: 40,
                padding: "0.5rem 1.25rem",
                fontWeight: 600,
                fontSize: "clamp(0.75rem, 2.5vw, 0.85rem)",
                textDecoration: "none",
                transition: "all 0.2s ease",
                whiteSpace: "nowrap" as const,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "scale(1.02)";
                e.currentTarget.style.background = VERDICT_SOFT[currentSevKey];
                e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.1)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "scale(1)";
                e.currentTarget.style.background = "#ffffff";
                e.currentTarget.style.boxShadow = "none";
              }}>
                <Icons.Exercise />
                Vocal Exercises
                <Icons.ArrowRight />
              </Link>
            </div>
          </div>
        )}

        {/* Today's session scores */}
        {latestScores ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.9rem", marginBottom: "1.5rem" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between",
                          flexWrap: "wrap" as const, gap: "0.5rem" }}>
              <SectionLabel>Latest session scores</SectionLabel>
              <div style={{ display: "flex", gap: "clamp(0.75rem, 4vw, 1.5rem)", fontSize: "clamp(0.65rem, 2.5vw, 0.72rem)",
                            color: D.textDim, fontFamily: D.fontMono, flexWrap: "wrap" as const }}>
                {[
                  ["Recorded", latest!.recorded_at.slice(0, 10)],
                  ["Duration", `${latest!.duration_s.toFixed(1)}s`],
                ].map(([k, v]) => (
                  <span key={k} style={{ display: "flex", alignItems: "center", gap: "0.2rem" }}>
                    <span style={{ color: D.textMuted }}>{k}: </span>
                    <Icons.Clock /> {v}
                  </span>
                ))}
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: `repeat(auto-fit, minmax(${isMobile ? "120px" : "160px"}, 1fr))`, gap: "0.9rem" }}>
              {METRICS.map(m => {
                const score = latestScores[m.key];
                const d = delta(m.probKey);
                const tColor = d === null ? D.textDim : d > 0 ? D.low : d < 0 ? D.high : D.textDim;
                return (
                  <Card key={m.key} style={{ textAlign: "center" }}>
                    <div style={{ fontSize: "clamp(0.6rem, 2.5vw, 0.68rem)", fontWeight: 700, color: D.textMuted,
                                  textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 4 }}>
                      {m.label}
                    </div>
                    <div style={{ fontSize: "clamp(1.5rem, 6vw, 2rem)", fontWeight: 700, color: m.color,
                                  fontFamily: D.fontMono }}>{score}</div>
                    {d !== null && (
                      <div style={{ fontSize: "clamp(0.65rem, 2.5vw, 0.75rem)", color: tColor, fontWeight: 700, marginTop: 3, display: "flex", alignItems: "center", justifyContent: "center", gap: "0.2rem" }}>
                        {d > 0 ? <Icons.TrendingUp /> : d < 0 ? <Icons.TrendingDown /> : <Icons.Minus />} {Math.abs(d)}pts
                      </div>
                    )}
                    <div style={{ marginTop: 6, height: 5, background: D.border, borderRadius: 3 }}>
                      <div style={{ width: `${score}%`, height: "100%", background: m.color, borderRadius: 3 }} />
                    </div>
                  </Card>
                );
              })}
            </div>

            {/* 30-day calendar */}
            <Card>
              <SectionLabel>30-day check-ins</SectionLabel>
              <CalendarHeatmap sessions={sessions} dayNumber={dayNumber} />
            </Card>
          </div>
        ) : (
          <div style={{
            background: D.accentSoft, borderRadius: 12, padding: "2rem",
            textAlign: "center", marginBottom: "1.5rem",
            border: `1px solid oklch(0.88 0.05 145)`,
          }}>
            <div style={{ fontSize: "2rem", marginBottom: "0.4rem" }}>
              <Icons.Mic />
            </div>
            <div style={{ fontWeight: 700, color: D.accentInk }}>No sessions yet</div>
            <div style={{ fontSize: "clamp(0.75rem, 3vw, 0.85rem)", marginTop: "0.25rem", color: D.textMuted }}>
              Record your first check-in to start tracking your recovery.
            </div>
          </div>
        )}

        {/* 30-day trend chart */}
        <Card style={{ marginBottom: "1.5rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start",
                        flexWrap: "wrap", gap: "0.5rem", marginBottom: "0.25rem" }}>
            <div>
              <SectionLabel>30-day trend — Vocal clarity, fluency, and articulation</SectionLabel>
            </div>
            <div style={{ display: "flex", gap: "clamp(0.5rem, 3vw, 1rem)", flexWrap: "wrap" as const }}>
              {METRICS.map(m => (
                <div key={m.key} style={{ display: "flex", alignItems: "center", gap: 5 }}>
                  <div style={{ width: 14, height: 3, borderRadius: 2, background: m.color }} />
                  <span style={{ fontSize: "clamp(0.65rem, 2.5vw, 0.72rem)", color: D.textMuted }}>{isMobile ? m.label.split(" ")[0] : m.label}</span>
                </div>
              ))}
            </div>
          </div>
          {progress.length >= 1 ? (
            <TrendChart data={progress} />
          ) : (
            <div style={{ textAlign: "center", padding: "2.5rem", color: D.textDim, fontSize: "0.85rem" }}>
              Record at least 1 session to see your trend
            </div>
          )}
        </Card>

        {/* Weekly + stage breakdown */}
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: "1.25rem", marginBottom: "1.5rem" }}>
          <Card>
            <SectionLabel>Weekly averages</SectionLabel>
            <div style={{ display: "flex", gap: "0.65rem", flexWrap: "wrap" as const, marginBottom: "0.75rem" }}>
              {METRICS.map(m => (
                <div key={m.key} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  <div style={{ width: 9, height: 9, borderRadius: 2, background: m.color }} />
                  <span style={{ fontSize: "clamp(0.6rem, 2.5vw, 0.7rem)", color: D.textMuted }}>{isMobile ? m.label.split(" ")[0] : m.label}</span>
                </div>
              ))}
            </div>
            <WeeklyChart data={progress} />
          </Card>
          <Card>
            <SectionLabel>Recovery stage breakdown</SectionLabel>
            {sessions.length > 0 ? (
              <StageBars sessions={sessions} />
            ) : (
              <div style={{ textAlign: "center", padding: "1.5rem", color: D.textDim, fontSize: "0.82rem" }}>
                No sessions recorded yet
              </div>
            )}
          </Card>
        </div>

        {/* Per-metric sparklines */}
        <div style={{ display: "grid", gridTemplateColumns: `repeat(auto-fit, minmax(${isMobile ? "160px" : "220px"}, 1fr))`, gap: "1rem", marginBottom: "1.5rem" }}>
          {METRICS.map(m => (
            <SparkCard key={m.key} metric={m} data={progress}
              latestProb={latest ? latest[m.probKey] : null}
              firstProb={firstSession ? firstSession[m.probKey] : null} />
          ))}
        </div>

        {/* Session history */}
        <Card style={{ padding: 0, overflow: "hidden", marginBottom: "1.5rem" }}>
          <div style={{ padding: "1.1rem 1.25rem", borderBottom: `1px solid ${D.border}`,
                        display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.5rem" }}>
            <div>
              <div style={{ fontWeight: 600, fontSize: "0.85rem", color: D.text, display: "flex", alignItems: "center", gap: "0.3rem" }}>
                <Icons.Clock /> Session history
              </div>
              <div style={{ fontSize: "0.72rem", color: D.textMuted, marginTop: 2 }}>
                {sessions.length} recording{sessions.length !== 1 ? "s" : ""} total
              </div>
            </div>
            {!isMobile && (
              <div style={{ display: "flex", gap: "3rem", fontSize: "0.68rem", fontWeight: 700,
                            color: D.textDim, textTransform: "uppercase", letterSpacing: "0.07em" }}>
                <span>VC / SF / AR</span>
                <span>Overall</span>
              </div>
            )}
          </div>
          {sessions.length === 0 ? (
            <div style={{ padding: "2.5rem", textAlign: "center", color: D.textDim }}>
              No recordings yet. Tap "Record today" to begin.
            </div>
          ) : (
            sessions.slice(0, 30).map(s => <SessionRow key={s.session_id} s={s} />)
          )}
        </Card>

        {/* Disclaimer */}
        <div style={{
          padding: "10px 14px", background: D.bg, borderRadius: 8,
          border: `1px solid ${D.border}`, fontSize: "clamp(0.65rem, 2.5vw, 0.72rem)", color: D.textDim, lineHeight: 1.5,
          display: "flex", alignItems: "center", gap: "0.5rem",
        }}>
          <Icons.Alert /> <strong>Clinical disclaimer:</strong> Scores are AI-generated screening indicators only.
          Always discuss results with your speech therapist or clinical team.
        </div>

        {/* AI Chatbot */}
        <AIChatbot sessions={sessions} latestScore={overallLatest} trend={trendForChat} />
      </div>
    </div>
  );
}