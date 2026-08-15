"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { fetchSessions, analyzeVoice, analyzeSentiment } from "../../lib/api";
import { getPatient, isLoggedIn } from "../../lib/auth";
import type { Session, AnalysisResult, ModelScore, SentimentResult } from "../../lib/types";

// Design tokens - Updated to match NavBar/SideBar green color scheme
const D = {
  bg:         "oklch(0.985 0.004 150)",
  surface:    "#ffffff",
  border:     "oklch(0.92 0.01 145)",
  borderStrong: "oklch(0.86 0.015 145)",
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
  shadowMd:   "0 4px 16px rgba(15,32,60,0.07)",
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
  Play: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="5 3 19 12 5 21 5 3" />
    </svg>
  ),
  Pause: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="6" y="4" width="4" height="16" />
      <rect x="14" y="4" width="4" height="16" />
    </svg>
  ),
  Clock: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  ),
  ArrowLeft: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="19" y1="12" x2="5" y2="12" />
      <polyline points="12 19 5 12 12 5" />
    </svg>
  ),
  ArrowRight: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="12 5 19 12 12 19" />
    </svg>
  ),
  ArrowDown: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="6 9 12 15 18 9" />
    </svg>
  ),
  ArrowUp: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="18 15 12 9 6 15" />
    </svg>
  ),
  Target: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="6" />
      <circle cx="12" cy="12" r="2" />
    </svg>
  ),
  Video: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="2" width="20" height="20" rx="2.18" />
      <line x1="8" y1="2" x2="8" y2="22" />
      <line x1="16" y1="2" x2="16" y2="22" />
      <line x1="2" y1="8" x2="22" y2="8" />
      <line x1="2" y1="16" x2="22" y2="16" />
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
  Record: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="6" fill="currentColor" />
    </svg>
  ),
  CheckCircle: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
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
  Stop: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
    </svg>
  ),
};

// ── Severity system ──────────────────────────────────────────────────────────
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

function dominantSevLabel(sessions: Session[]): string {
  if (sessions.length === 0) return "none";
  const counts: Record<string, number> = { none: 0, mild: 0, moderate: 0, severe: 0 };
  sessions.forEach(s => { if (s.severity_label in counts) counts[s.severity_label]++; });
  return Object.entries(counts).reduce((a, b) => b[1] > a[1] ? b : a)[0];
}

function band(score: number) { return score >= 70 ? "low" : score >= 40 ? "mid" : "high"; }

const PROB_BARS = [
  { label: "Positive", key: "positive" as const, color: D.low  },
  { label: "Neutral",  key: "neutral"  as const, color: D.textDim },
  { label: "Negative", key: "negative" as const, color: D.high },
];

const MOOD_CFG = {
  positive: { icon: "😊", label: "Feeling Positive",  bg: D.lowSoft,  color: D.lowInk,  border: "oklch(0.85 0.08 160)" },
  neutral:  { icon: "😐", label: "Feeling Neutral",   bg: D.bg,       color: D.textMuted, border: D.border },
  negative: { icon: "😔", label: "Feeling Down",      bg: D.highSoft, color: D.highInk, border: "oklch(0.85 0.08 25)" },
} as const;

function MoodModelBadge({ score }: { score: ModelScore }) {
  const cfg = MOOD_CFG[score.sentiment as keyof typeof MOOD_CFG];
  return (
    <div style={{
      background:D.bg, borderRadius:8, padding:"0.55rem 0.85rem",
      border:`1px solid ${D.border}`,
      display:"flex", alignItems:"center", justifyContent:"space-between", gap:"0.5rem",
    }}>
      <span style={{ fontSize:"0.76rem", fontWeight:700, color:D.textMuted }}>{score.model}</span>
      <span style={{
        background:cfg?.bg ?? D.bg, color:cfg?.color ?? D.textMuted,
        borderRadius:6, padding:"2px 8px", fontSize:"0.73rem", fontWeight:700,
      }}>{cfg?.icon} {score.sentiment}</span>
      <span style={{ fontSize:"0.7rem", color:D.textDim, fontFamily:D.fontMono }}>
        {Math.round(Math.max(score.positive, score.neutral, score.negative) * 100)}%
      </span>
    </div>
  );
}

// ── Score Dashboard Components ─────────────────────────────────────────────
function ClassifierBar({ label, score, isConcern, previousScore }: {
  label: string; score: number; isConcern: boolean; previousScore?: number | null;
}) {
  const b = band(score);
  const color = D[b as keyof typeof D] as string;
  const diff = previousScore !== undefined && previousScore !== null ? score - previousScore : null;
  
  return (
    <div>
      <div style={{ display:"flex", justifyContent:"space-between", marginBottom:5, alignItems:"center" }}>
        <span style={{ fontSize:"0.85rem", color:D.text, fontWeight:isConcern?700:500 }}>
          {label}
          {isConcern && <span style={{
            background:D.mid, color:"#fff", borderRadius:4,
            padding:"1px 7px", fontSize:"0.68rem", fontWeight:700, marginLeft:8,
          }}>CONCERN</span>}
          {diff !== null && diff !== 0 && (
            <span style={{
              marginLeft:8,
              fontSize:"0.7rem",
              fontWeight:600,
              color: diff > 0 ? D.low : D.high,
            }}>
              {diff > 0 ? <Icons.TrendingUp /> : <Icons.TrendingDown />} {Math.abs(diff)} pts
            </span>
          )}
        </span>
        <span style={{ fontWeight:800, fontSize:"0.85rem", color, fontFamily:D.fontMono }}>
          {score}
          {previousScore !== undefined && previousScore !== null && (
            <span style={{
              fontSize:"0.65rem",
              fontWeight:400,
              color:D.textDim,
              marginLeft:4,
            }}>
              (was {previousScore})
            </span>
          )}
        </span>
      </div>
      <div style={{ background:D.border, borderRadius:6, height:7, overflow:"hidden", position:"relative" }}>
        <div style={{
          width:`${Math.min(100,Math.max(0,score))}%`, height:"100%",
          background:color, borderRadius:6,
          transition:"width .7s cubic-bezier(.4,0,.2,1)",
        }} />
        {previousScore !== undefined && previousScore !== null && previousScore !== score && (
          <div style={{
            position:"absolute",
            top:0,
            left:`${Math.min(100,Math.max(0,previousScore))}%`,
            height:"100%",
            width:2,
            background:"rgba(255,255,255,0.8)",
            transform:"translateX(-50%)",
            borderRadius:1,
          }} />
        )}
      </div>
    </div>
  );
}

const SEVERITY_LABEL: Record<string, string> = {
  none: "No concern", mild: "Mild", moderate: "Moderate", severe: "Needs attention",
};

const DISORDER_LABEL: Record<string, string> = {
  healthy:    "Speech within normal range",
  parkinsons: "Vocal clarity concern",
  stuttering: "Speech fluency concern",
  dysarthria: "Articulation concern",
};

function ScoreDashboard({ 
  testResult,
  savedSession,
  onBack
}: { 
  testResult: AnalysisResult;
  savedSession: Session | null;
  onBack?: () => void;
}) {
  const [showDetails, setShowDetails] = useState(false);
  const isHealthy = testResult?.is_healthy ?? false;
  const primaryKey = testResult?.primary_disorder ?? "";
  
  const currentOverallScore = testResult
    ? Math.round(((1 - testResult.voice_quality_prob) + (1 - testResult.stuttering_prob) + (1 - testResult.dysarthria_prob)) / 3 * 100)
    : 0;
  
  const savedOverallScore = savedSession
    ? Math.round(((1 - savedSession.vocal_clarity_prob) + (1 - savedSession.fluency_prob) + (1 - savedSession.articulation_prob)) / 3 * 100)
    : null;

  const scoreDifference = savedOverallScore !== null ? currentOverallScore - savedOverallScore : null;
  const isImprovement = scoreDifference !== null && scoreDifference > 0;
  const isDecline = scoreDifference !== null && scoreDifference < 0;

  const CLASSIFIERS = testResult ? [
    { label:"Vocal Clarity",  score:Math.round((1 - testResult.voice_quality_prob) * 100), key:"parkinsons" },
    { label:"Speech Fluency", score:Math.round((1 - testResult.stuttering_prob) * 100),    key:"stuttering"  },
    { label:"Articulation",   score:Math.round((1 - testResult.dysarthria_prob) * 100),    key:"dysarthria"  },
  ] : [];

  const savedClassifiers = savedSession ? [
    { label:"Vocal Clarity",  score:Math.round((1 - savedSession.vocal_clarity_prob) * 100), key:"parkinsons" },
    { label:"Speech Fluency", score:Math.round((1 - savedSession.fluency_prob) * 100),    key:"stuttering"  },
    { label:"Articulation",   score:Math.round((1 - savedSession.articulation_prob) * 100),    key:"dysarthria"  },
  ] : [];

  const sevKey = testResult.severity_label || "none";

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:"1.1rem" }}>
      <div style={{
        background: VERDICT_SOFT[sevKey],
        border: `2px solid ${VERDICT_BORDER[sevKey]}`,
        borderRadius: 14, padding: "clamp(1rem, 4vw, 1.4rem) clamp(1rem, 4vw, 1.75rem)",
      }}>
        <div style={{ fontSize: "clamp(0.6rem, 2.5vw, 0.68rem)", fontWeight: 700, textTransform: "uppercase",
                      letterSpacing: "0.1em", color: VERDICT_INK[sevKey],
                      opacity: 0.7, marginBottom: "0.4rem" }}>
          Test Assessment · Practice Session
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between",
                      flexWrap: "wrap" as const, gap: "1rem" }}>
          <div>
            <div style={{ fontSize: "clamp(1.5rem, 6vw, 1.9rem)", fontWeight: 800, color: VERDICT_INK[sevKey],
                          letterSpacing: "-0.02em", lineHeight: 1.1 }}>
              {isHealthy ? <Icons.Check /> : SEV_LABEL[sevKey]}
            </div>
            <div style={{ fontSize: "clamp(0.75rem, 3vw, 0.85rem)", color: VERDICT_INK[sevKey],
                          opacity: 0.8, marginTop: "0.3rem", maxWidth: 420 }}>
              {isHealthy
                ? "Your speech is within the normal recovery range. Keep it up!"
                : VERDICT_DESC[sevKey]}
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "0.5rem" }}>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: "clamp(0.55rem, 2.5vw, 0.65rem)", fontWeight: 700, textTransform: "uppercase",
                            letterSpacing: "0.08em", color: VERDICT_INK[sevKey], opacity: 0.6 }}>
                Test Score
              </div>
              <div style={{ fontSize: "clamp(1.8rem, 7vw, 2.4rem)", fontWeight: 800, fontFamily: D.fontMono,
                            color: VERDICT_INK[sevKey], lineHeight: 1 }}>
                {currentOverallScore}<span style={{ fontSize: "clamp(0.8rem, 3vw, 1rem)", fontWeight: 500, opacity: 0.6 }}>%</span>
              </div>
            </div>
            {scoreDifference !== null && (
              <div style={{ fontSize: "clamp(0.7rem, 3vw, 0.82rem)", fontWeight: 700, 
                            color: isImprovement ? D.low : isDecline ? D.high : D.textMuted }}>
                {isImprovement ? <Icons.TrendingUp /> : isDecline ? <Icons.TrendingDown /> : <Icons.Minus />} 
                {isImprovement ? "+" : ""}{scoreDifference} pts vs saved session ({savedOverallScore})
              </div>
            )}
          </div>
        </div>
        <div style={{ display: "flex", gap: "1.5rem", marginTop: "1rem",
                      paddingTop: "0.9rem", borderTop: `1px solid ${VERDICT_BORDER[sevKey]}`,
                      flexWrap: "wrap" as const, alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", gap: "1.5rem", flexWrap: "wrap" as const, alignItems: "center" }}>
            <div>
              <div style={{ fontSize: "clamp(0.55rem, 2.5vw, 0.63rem)", fontWeight: 700, textTransform: "uppercase",
                            letterSpacing: "0.08em", color: VERDICT_INK[sevKey],
                            opacity: 0.55, marginBottom: 4 }}>
                Test Duration
              </div>
              <span style={{
                background: SEV_COLOR[sevKey], color: "#fff",
                borderRadius: 20, padding: "3px 12px", fontSize: "clamp(0.7rem, 2.5vw, 0.78rem)", fontWeight: 700,
                display: "flex", alignItems: "center", gap: "0.3rem",
              }}>
                <Icons.Clock /> {testResult.duration_s.toFixed(1)}s
              </span>
            </div>
            {!isHealthy && (
              <div>
                <div style={{ fontSize: "clamp(0.55rem, 2.5vw, 0.63rem)", fontWeight: 700, textTransform: "uppercase",
                              letterSpacing: "0.08em", color: VERDICT_INK[sevKey],
                              opacity: 0.55, marginBottom: 4 }}>
                  Severity
                </div>
                <span style={{
                  background: SEV_COLOR[sevKey], color: "#fff",
                  borderRadius: 20, padding: "3px 12px", fontSize: "clamp(0.7rem, 2.5vw, 0.78rem)", fontWeight: 700,
                }}>
                  {SEV_LABEL[sevKey]}
                </span>
              </div>
            )}
          </div>
          
          <button onClick={onBack} style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.5rem",
            background: "#ffffff",
            color: VERDICT_INK[sevKey],
            border: `1px solid ${VERDICT_BORDER[sevKey]}`,
            borderRadius: 40,
            padding: "0.5rem 1.25rem",
            fontWeight: 600,
            fontSize: "clamp(0.75rem, 2.5vw, 0.85rem)",
            textDecoration: "none",
            cursor: "pointer",
            transition: "all 0.2s ease",
            whiteSpace: "nowrap" as const,
            fontFamily: "inherit",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "scale(1.02)";
            e.currentTarget.style.background = VERDICT_SOFT[sevKey];
            e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.1)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "scale(1)";
            e.currentTarget.style.background = "#ffffff";
            e.currentTarget.style.boxShadow = "none";
          }}>
            <Icons.ArrowLeft />
            Back to Exercises
          </button>
        </div>
      </div>

      {savedSession && (
        <div style={{
          background: isImprovement ? D.lowSoft : isDecline ? D.highSoft : D.bg,
          border: `1px solid ${isImprovement ? "oklch(0.85 0.08 160)" : isDecline ? "oklch(0.85 0.08 25)" : D.border}`,
          borderRadius:12,
          padding:"1rem 1.25rem",
        }}>
          <div style={{ display:"flex", alignItems:"center", gap:"0.75rem" }}>
            <span style={{ fontSize:"1.5rem" }}>
              {isImprovement ? <Icons.TrendingUp /> : isDecline ? <Icons.TrendingDown /> : <Icons.Minus />}
            </span>
            <div>
              <div style={{ fontWeight:700, fontSize:"0.95rem", color:D.text }}>
                {isImprovement ? "You're improving!" : isDecline ? "Some decline detected" : "Stable performance"}
              </div>
              <div style={{ fontSize:"0.8rem", color:D.textMuted }}>
                {isImprovement 
                  ? `Your test score (${currentOverallScore}) is ${Math.abs(scoreDifference)} points higher than your saved session (${savedOverallScore})`
                  : isDecline
                  ? `Your test score (${currentOverallScore}) is ${Math.abs(scoreDifference)} points lower than your saved session (${savedOverallScore})`
                  : `Your test score (${currentOverallScore}) matches your saved session (${savedOverallScore})`
                }
              </div>
            </div>
          </div>
        </div>
      )}

      <button onClick={() => setShowDetails(s => !s)} style={{
        background:D.surface, border:`1px solid ${D.border}`,
        borderRadius:10, padding:"0.8rem 1.25rem",
        display:"flex", justifyContent:"space-between", alignItems:"center",
        cursor:"pointer", fontFamily:"inherit", width:"100%",
        color:D.text, fontSize:"0.88rem", fontWeight:600,
      }}>
        <span style={{ display:"flex", alignItems:"center", gap:"0.5rem" }}>
          <Icons.Brain />
          Detailed voice analysis
        </span>
        <span style={{ fontSize:"0.8rem", color:D.textMuted }}>
          {showDetails ? <Icons.ArrowUp /> : <Icons.ArrowDown />}
        </span>
      </button>

      {showDetails && (
        <>
          <div style={{
            padding:"1.1rem 1.25rem", borderRadius:12,
            background: isHealthy ? D.lowSoft : (band(currentOverallScore) === "high" ? D.highSoft : D.midSoft),
            border:`1px solid ${isHealthy ? "oklch(0.85 0.08 160)" : "oklch(0.88 0.08 80)"}`,
          }}>
            <div style={{ display:"flex", alignItems:"center", gap:10 }}>
              <span style={{ fontSize:"1.4rem" }}>
                {isHealthy ? <Icons.Check /> : testResult.severity_label === "severe" ? <Icons.Alert /> : <Icons.Warning />}
              </span>
              <div>
                <div style={{ fontWeight:700, fontSize:"0.95rem", color:D.text }}>
                  {DISORDER_LABEL[isHealthy ? "healthy" : primaryKey] ?? primaryKey}
                </div>
                <div style={{ fontSize:"0.82rem", color:D.textMuted, marginTop:2 }}>
                  {testResult.message}
                </div>
                {scoreDifference !== null && (
                  <div style={{
                    fontSize:"0.75rem",
                    fontWeight:600,
                    color: isImprovement ? D.low : isDecline ? D.high : D.textDim,
                    marginTop:4,
                    display:"flex",
                    alignItems:"center",
                    gap:"0.3rem",
                  }}>
                    {isImprovement ? <Icons.TrendingUp /> : isDecline ? <Icons.TrendingDown /> : <Icons.Minus />}
                    {isImprovement ? "Improving" : isDecline ? "Declining" : "Stable"} 
                    {" "}({scoreDifference > 0 ? "+" : ""}{scoreDifference} pts vs saved)
                  </div>
                )}
              </div>
            </div>
          </div>

          <div style={{
            background:D.surface, borderRadius:12, padding:"1.1rem 1.25rem",
            boxShadow:D.shadow, border:`1px solid ${D.border}`,
          }}>
            <div style={{ fontWeight:600, fontSize:"0.72rem", color:D.textMuted,
                          textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:"0.9rem" }}>
              Recovery Scores (higher = better)
            </div>
            <div style={{ display:"flex", flexDirection:"column", gap:"1rem" }}>
              {CLASSIFIERS.map(({ label, score, key }) => {
                const savedScore = savedClassifiers.find(p => p.key === key)?.score || null;
                const isConcern = !isHealthy && primaryKey === key;
                
                return (
                  <ClassifierBar 
                    key={key} 
                    label={label} 
                    score={score} 
                    isConcern={isConcern}
                    previousScore={savedScore}
                  />
                );
              })}
            </div>
          </div>

          <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:"0.9rem" }}>
            {CLASSIFIERS.map(({ label, score, key }) => {
              const b = band(score);
              const active = !isHealthy && primaryKey === key;
              const savedScore = savedClassifiers.find(p => p.key === key)?.score || null;
              const diff = savedScore !== null ? score - savedScore : null;
              
              return (
                <div key={key} style={{
                  background: active ? "oklch(0.22 0.015 150)" : D.surface,
                  borderRadius:12, padding:"1.1rem",
                  border: active ? "none" : `1px solid ${D.border}`,
                  boxShadow: active ? D.shadowMd : D.shadow, textAlign:"center",
                }}>
                  <div style={{ fontSize:"0.72rem", fontWeight:600,
                                color: active ? "rgba(255,255,255,.6)" : D.textMuted,
                                marginBottom:"0.2rem", textTransform:"uppercase",
                                letterSpacing:"0.07em" }}>{label}</div>
                  <div style={{ fontSize:"2rem", fontWeight:800, fontFamily:D.fontMono,
                                color: active ? "#fff" : (D[b as keyof typeof D] as string) }}>
                    {score}
                  </div>
                  {diff !== null && diff !== 0 && (
                    <div style={{
                      fontSize:"0.7rem",
                      fontWeight:600,
                      color: diff > 0 ? D.low : D.high,
                      marginTop:"0.2rem",
                      display:"flex",
                      alignItems:"center",
                      justifyContent:"center",
                      gap:"0.2rem",
                    }}>
                      {diff > 0 ? <Icons.TrendingUp /> : <Icons.TrendingDown />} {Math.abs(diff)} pts
                    </div>
                  )}
                  {savedScore !== null && (
                    <div style={{
                      fontSize:"0.6rem",
                      color:D.textDim,
                      marginTop:"0.1rem",
                    }}>
                      saved: {savedScore}
                    </div>
                  )}
                  {active && (
                    <div style={{
                      background:"rgba(255,255,255,.15)", color:"#fff", borderRadius:6,
                      padding:"2px 8px", fontSize:"0.65rem", fontWeight:700,
                      marginTop:"0.4rem", display:"inline-block",
                    }}>PRIMARY CONCERN</div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

// ── Existing Exercise Level Functions ──────────────────────────────────────
type ExerciseLevel = "beginner" | "intermediate" | "advanced" | "clinical";
type SeverityLevel = "none" | "mild" | "moderate" | "severe";

interface Exercise {
  id: string;
  title: string;
  description: string;
  duration: string;
  difficulty: ExerciseLevel;
  audioUrl: string;
  steps: string[];
  videoUrl?: string;
}

function getExerciseLevel(score: number, severity: SeverityLevel): ExerciseLevel {
  if (severity === "severe" || score < 40) return "clinical";
  if (severity === "moderate" || score < 60) return "advanced";
  if (severity === "mild" || score < 75) return "intermediate";
  return "beginner";
}

function getYouTubeEmbedUrl(url: string): string | null {
  if (!url) return null;
  
  if (url.includes('youtu.be/')) {
    const videoId = url.split('youtu.be/')[1]?.split('?')[0];
    if (videoId) return `https://www.youtube.com/embed/${videoId}`;
  }
  
  if (url.includes('youtube.com/watch')) {
    const videoId = url.split('v=')[1]?.split('&')[0];
    if (videoId) return `https://www.youtube.com/embed/${videoId}`;
  }
  
  if (url.includes('youtube.com/shorts/')) {
    const videoId = url.split('shorts/')[1]?.split('?')[0];
    if (videoId) return `https://www.youtube.com/embed/${videoId}`;
  }
  
  if (url.includes('youtube.com/embed/')) {
    return url;
  }
  
  return null;
}

function getExercises(score: number, severity: SeverityLevel): Exercise[] {
  const level = getExerciseLevel(score, severity);
  
  const exercisesByLevel: Record<ExerciseLevel, Exercise[]> = {
    beginner: [
      {
        id: "beginner_1",
        title: "Gentle Humming",
        description: "Humming exercise to warm up your vocal cords gently.",
        duration: "3 minutes",
        difficulty: "beginner",
        audioUrl: `/audio/exercises/beginner/humming rest.mp3`,
        videoUrl: "https://youtu.be/LiUnFJ8P4gM?si=nOWm5x9kMxlaMToN",
        steps: [
          "Sit up straight with your feet flat on the floor",
          "Take a deep breath through your nose",
          "Close your lips and make a gentle 'hmm' sound",
          "Feel the vibration in your lips and nose",
          "Hold for 3-5 seconds, then release",
          "Repeat 10 times"
        ]
      },
      {
        id: "beginner_2",
        title: "Lip Trills",
        description: "Lip vibration exercise to improve breath support.",
        duration: "4 minutes",
        difficulty: "beginner",
        audioUrl: `/audio/exercises/beginner/lip-trills.mp3`,
        videoUrl: "https://youtu.be/LiUnFJ8P4gM?si=nOWm5x9kMxlaMToN",
        steps: [
          "Relax your lips and keep them loosely together",
          "Take a deep breath",
          "Blow air through your lips making a 'brrr' sound",
          "Try to maintain a steady pitch",
          "Repeat for 30 seconds, rest for 10 seconds",
          "Do 3-4 sets"
        ]
      },
      {
        id: "beginner_3",
        title: "Siren Sounds",
        description: "Gliding through your vocal range gently.",
        duration: "5 minutes",
        difficulty: "beginner",
        audioUrl: `/audio/exercises/beginner/siren-sounds.mp3`,
        videoUrl: "https://youtu.be/LiUnFJ8P4gM?si=nOWm5x9kMxlaMToN",
        steps: [
          "Start with a comfortable low 'oo' sound",
          "Slowly glide up to a high 'ee' sound",
          "Glide back down to the low 'oo'",
          "Keep the sound smooth and connected",
          "Repeat 8-10 times"
        ]
      },
      {
        id: "beginner_4",
        title: "Breath Awareness",
        description: "Gentle diaphragmatic breathing for voice support.",
        duration: "4 minutes",
        difficulty: "beginner",
        audioUrl: `/audio/exercises/beginner/gentle breathing.mp3`,
        videoUrl: "https://youtu.be/LiUnFJ8P4gM?si=nOWm5x9kMxlaMToN",
        steps: [
          "Lie on your back with knees bent",
          "Place one hand on your chest, one on your belly",
          "Breathe in slowly through your nose for 4 counts",
          "Feel your belly rise, chest stays still",
          "Exhale slowly through pursed lips for 6 counts",
          "Repeat 8-10 times"
        ]
      }
    ],
    intermediate: [
      {
        id: "intermediate_1",
        title: "Resonant Voice Therapy",
        description: "Advanced humming with vowel transitions for resonance.",
        duration: "6 minutes",
        difficulty: "intermediate",
        audioUrl: `/audio/exercises/intermediate/resonant-voice.mp3`,
        videoUrl: "https://youtu.be/qwylUxmUacQ?si=Tb5h-f9LV_1cjXB4",
        steps: [
          "Start with a gentle 'hmm' on a comfortable pitch",
          "Transition to 'hmm-may' on the same pitch",
          "Repeat with 'hmm-mee', 'hmm-moh', 'hmm-moo'",
          "Feel the vibration in your face",
          "Practice each transition 5 times"
        ]
      },
      {
        id: "intermediate_2",
        title: "Tongue Twisters",
        description: "Articulation exercises for clearer speech.",
        duration: "5 minutes",
        difficulty: "intermediate",
        audioUrl: `/audio/exercises/intermediate/tongue-twisters.mp3`,
        videoUrl: "https://youtube.com/shorts/fU9LxKuts88?si=BjOz_Ri134dqAuK8",
        steps: [
          "Start slowly: 'Red lorry, yellow lorry'",
          "Repeat: 'Unique New York' 5 times",
          "Practice: 'She sells sea shells'",
          "Gradually increase speed",
          "Focus on clear articulation"
        ]
      },
      {
        id: "intermediate_3",
        title: "Pitch Glides",
        description: "Extended range exercises for vocal flexibility.",
        duration: "7 minutes",
        difficulty: "intermediate",
        audioUrl: `/audio/exercises/intermediate/pitch-glides.mp3`,
        videoUrl: "https://youtu.be/W6kXwfBL33Q?si=PSgdQTZ65-Jh8jsy",
        steps: [
          "Take a deep diaphragmatic breath",
          "Start at your comfortable low pitch",
          "Glide up to your high pitch over 5 seconds",
          "Hold for 2 seconds",
          "Glide back down over 5 seconds",
          "Repeat 8-10 times"
        ]
      },
      {
        id: "intermediate_4",
        title: "Vowel Prolongation",
        description: "Sustained vowel sounds for vocal endurance.",
        duration: "6 minutes",
        difficulty: "intermediate",
        audioUrl: `/audio/exercises/intermediate/vowel-prolongation.mp3`,
        videoUrl: "https://youtu.be/YXieSeDX7OM?si=avMD8PnQwj9_u_5c",
        steps: [
          "Take a deep diaphragmatic breath",
          "Sustain 'AH' on a comfortable pitch for 8 seconds",
          "Rest 5 seconds, repeat with 'EE'",
          "Continue with 'OO', 'OH', 'UH'",
          "Each vowel, try to extend duration by 1 second",
          "Complete 2 full rounds"
        ]
      }
    ],
    advanced: [
      {
        id: "advanced_1",
        title: "Sustained Vowels",
        description: "Extended vowel production for breath control.",
        duration: "8 minutes",
        difficulty: "advanced",
        audioUrl: `/audio/exercises/advanced/sustained-vowels.mp3`,
        videoUrl: "https://youtube.com/shorts/z6x8n7DQf7M?si=0B5vZxH4mWuqsrTv",
        steps: [
          "Take a deep diaphragmatic breath",
          "Produce 'AH' sound on a comfortable pitch",
          "Hold for 10-15 seconds",
          "Repeat with 'EE', 'OH', 'OO'",
          "Focus on steady, clear tone",
          "Do 3 rounds of each vowel"
        ]
      },
      {
        id: "advanced_2",
        title: "Staccato Exercises",
        description: "Precision articulation and vocal cord closure.",
        duration: "6 minutes",
        difficulty: "advanced",
        audioUrl: `/audio/exercises/advanced/staccato.mp3`,
        videoUrl: "https://youtu.be/IeuY84lq3Iw?si=RiiPz-k9f1lkaP5c",
        steps: [
          "Take a quick breath",
          "Say 'HA-HA-HA' in short, crisp bursts",
          "Repeat with 'HO-HO-HO', 'HEE-HEE-HEE'",
          "Keep each burst separate and clear",
          "Do 10 repetitions of each"
        ]
      },
      {
        id: "advanced_3",
        title: "Messaging Practice",
        description: "Functional phrases for daily communication.",
        duration: "8 minutes",
        difficulty: "advanced",
        audioUrl: `/audio/exercises/advanced/messaging-practice.mp3`,
        videoUrl: "https://youtu.be/IsPs1wD-Kk8?si=fFZtcVaRxyVUhw1_",
        steps: [
          "Practice common phrases: 'Hello, how are you?'",
          "Say: 'I would like water, please'",
          "Practice: 'Thank you very much'",
          "Focus on natural intonation",
          "Record and listen back",
          "Adjust based on clarity"
        ]
      },
      {
        id: "advanced_4",
        title: "Dynamic Range Training",
        description: "Volume variation exercises for expressive speech.",
        duration: "7 minutes",
        difficulty: "advanced",
        audioUrl: `/audio/exercises/advanced/dynamic-range.mp3`,
        videoUrl: "https://youtu.be/LDMJi4fauGA?si=95p8xvrIlj8FXGpi",
        steps: [
          "Start with a comfortable 'AH' at medium volume",
          "Gradually increase to loud over 5 seconds",
          "Hold loud for 3 seconds",
          "Gradually decrease to soft over 5 seconds",
          "Hold soft for 3 seconds",
          "Repeat sequence 8 times"
        ]
      }
    ],
    clinical: [
      {
        id: "clinical_1",
        title: "Gentle Breathing",
        description: "Non-strenuous breathing exercises - consult your therapist.",
        duration: "5 minutes",
        difficulty: "clinical",
        audioUrl: `/audio/exercises/clinical/gentle-breathing.mp3`,
        videoUrl: "https://youtu.be/GEJ30bnp780?si=h6joIZbEDrvxnLFM",
        steps: [
          "Sit in a comfortable, supported position",
          "Place one hand on your belly",
          "Breathe in slowly through your nose for 4 seconds",
          "Feel your belly rise",
          "Exhale slowly for 6 seconds through pursed lips",
          "Rest for 10 seconds between breaths",
          "Repeat 5-6 times"
        ]
      },
      {
        id: "clinical_2",
        title: "Humming Rest",
        description: "Minimal effort vocal rest exercise.",
        duration: "4 minutes",
        difficulty: "clinical",
        audioUrl: `/audio/exercises/clinical/humming-rest.mp3`,
        videoUrl: "https://youtu.be/wlqWzHAfSmc?si=133deMo40fYG2eqb",
        steps: [
          "Close your lips gently",
          "Take a relaxed breath",
          "Hum gently on one comfortable note",
          "Keep the volume very soft",
          "Hold for 2-3 seconds only",
          "Rest for 5 seconds between hums",
          "Do 8-10 repetitions"
        ]
      },
      {
        id: "clinical_3",
        title: "Therapist Consultation",
        description: "Critical: Seek professional guidance before continuing.",
        duration: "N/A",
        difficulty: "clinical",
        audioUrl: `/audio/exercises/clinical/consultation.mp3`,
        videoUrl: "https://youtu.be/U3DhRAwN83E?si=5PpcynJkoYPlx20Z",
        steps: [
          "Contact your speech therapist immediately",
          "Share your latest assessment scores",
          "Discuss personalized exercises",
          "Follow their recommendations strictly",
          "Avoid independent voice exercises until cleared"
        ]
      },
      {
        id: "clinical_4",
        title: "Mindful Silence",
        description: "Complete vocal rest with mindfulness techniques.",
        duration: "10 minutes",
        difficulty: "clinical",
        audioUrl: `/audio/exercises/clinical/mindful-silence.mp3`,
        videoUrl: "https://youtu.be/LiUnFJ8P4gM?si=a4NzO520SzM4jn3b",
        steps: [
          "Find a quiet, comfortable space",
          "Refrain from any vocalization or whispering",
          "Focus on nasal breathing only",
          "Observe the sensation of breath without sound",
          "If you need to communicate, use writing",
          "Maintain silence for entire duration",
          "Gradually increase rest periods throughout day"
        ]
      }
    ]
  };
  
  return exercisesByLevel[level];
}

// ── Existing Helper Functions ──────────────────────────────────────────────
function _writeStr(view: DataView, offset: number, str: string) {
  for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i));
}

function encodeWav(buf: AudioBuffer): Blob {
  const ch = buf.getChannelData(0);
  const n  = ch.length;
  const ab = new ArrayBuffer(44 + n * 2);
  const v  = new DataView(ab);
  _writeStr(v, 0, "RIFF");
  v.setUint32(4,  36 + n * 2, true);
  _writeStr(v, 8, "WAVE");
  _writeStr(v, 12, "fmt ");
  v.setUint32(16, 16, true);
  v.setUint16(20, 1, true);
  v.setUint16(22, 1, true);
  v.setUint32(24, buf.sampleRate, true);
  v.setUint32(28, buf.sampleRate * 2, true);
  v.setUint16(32, 2, true);
  v.setUint16(34, 16, true);
  _writeStr(v, 36, "data");
  v.setUint32(40, n * 2, true);
  for (let i = 0; i < n; i++) {
    const s = Math.max(-1, Math.min(1, ch[i]));
    v.setInt16(44 + i * 2, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
  }
  return new Blob([ab], { type: "audio/wav" });
}

async function webmBlobToWavFile(blob: Blob): Promise<{ file: File; rms: number }> {
  const ab      = await blob.arrayBuffer();
  const actx    = new AudioContext({ sampleRate: 16000 });
  const decoded = await actx.decodeAudioData(ab);
  await actx.close();
  const ch = decoded.getChannelData(0);
  let sum = 0;
  for (let i = 0; i < ch.length; i++) sum += ch[i] * ch[i];
  const rms = Math.sqrt(sum / ch.length);
  const wav = encodeWav(decoded);
  return { file: new File([wav], `practice_${Date.now()}.wav`, { type: "audio/wav" }), rms };
}

interface LiveMetrics { db: number; snr: number; pitchHz: number; jitter: number; shimmer: number; hnr: number; }

// ── Professional Recording Section ────────────────────────────────────────
function ProfessionalRecordingSection({ onRecordingComplete }: { onRecordingComplete?: (result: AnalysisResult) => void }) {
  const [phase, setPhase] = useState<"idle" | "recording" | "analyzing" | "done">("idle");
  const [seconds, setSeconds] = useState(0);
  const [metrics, setMetrics] = useState<LiveMetrics>({ db: -40, snr: 35, pitchHz: 0, jitter: 0, shimmer: 0, hnr: 0 });
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const mrRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sampleRateRef = useRef(44100);
  
  const PASSAGE_WORDS = [
    "The","north","wind","and","the","sun","were","disputing",
    "which","was","the","stronger,","when","a","traveler","came",
    "along","wrapped","in","a","warm","cloak.",
  ];
  
  const wordIdx = Math.min(Math.floor(seconds * (110 / 60)), PASSAGE_WORDS.length);
  
  function computeMetrics(analyser: AnalyserNode, sampleRate: number): LiveMetrics {
    const td = new Uint8Array(analyser.fftSize);
    analyser.getByteTimeDomainData(td);
    let sum = 0;
    for (let i = 0; i < td.length; i++) { const v = (td[i]-128)/128; sum += v*v; }
    const rms = Math.sqrt(sum / td.length);
    const db = rms > 0.001 ? Math.max(-40, Math.min(-3, Math.round(20 * Math.log10(rms)))) : -40;
    
    let zcr = 0;
    for (let i = 1; i < td.length; i++) {
      if (((td[i-1]-128) < 0) !== ((td[i]-128) < 0)) zcr++;
    }
    const rawPitch = Math.round((zcr * sampleRate) / (2 * analyser.fftSize));
    const pitchHz = rms > 0.01 ? Math.max(80, Math.min(450, rawPitch)) : 0;
    
    const fd = new Uint8Array(analyser.frequencyBinCount);
    analyser.getByteFrequencyData(fd);
    const noise = (fd[0]+fd[1]+fd[2]) / 3 + 1;
    const sig   = fd.slice(4, 24).reduce((a,b) => a+b, 0) / 20 + 1;
    const snr   = Math.max(10, Math.min(45, Math.round(20 * Math.log10(sig / noise))));
    
    const jitter = rms > 0.01 ? parseFloat((0.3 + Math.abs(Math.sin(Date.now() * 0.003)) * 0.6 + rms * 0.5).toFixed(2)) : 0;
    
    const segLen = Math.floor(td.length / 8);
    const ampVals: number[] = [];
    for (let s = 0; s < 8; s++) {
      let segSq = 0;
      for (let i = s * segLen; i < (s + 1) * segLen; i++) {
        const v = (td[i] - 128) / 128;
        segSq += v * v;
      }
      ampVals.push(Math.sqrt(segSq / segLen));
    }
    const ampMean = ampVals.reduce((a, b) => a + b, 0) / ampVals.length + 1e-6;
    const ampDiffMean = ampVals.slice(1).reduce((acc, v, i) => acc + Math.abs(v - ampVals[i]), 0) / 7;
    const shimmer = rms > 0.01 ? parseFloat(Math.max(0.5, Math.min(15, (ampDiffMean / ampMean) * 100)).toFixed(2)) : 0;
    
    const binHz = sampleRate / analyser.fftSize;
    let hnr = 0;
    if (rms > 0.01 && pitchHz > 0) {
      const harmEnergy = [1, 2, 3, 4]
        .map(h => { const b = Math.round((h * pitchHz) / binHz); return b < fd.length ? fd[b] : 0; })
        .reduce((a, b) => a + b, 0) / 4;
      const noiseFloor = (fd[0] + fd[1] + fd[2]) / 3 + 1;
      hnr = Math.max(5, Math.min(35, Math.round(20 * Math.log10((harmEnergy + 1) / noiseFloor))));
    }
    
    return { db, snr, pitchHz, jitter, shimmer, hnr };
  }
  
  function startRecording() {
    navigator.mediaDevices.getUserMedia({ audio: true }).then(stream => {
      const audioCtx = new AudioContext();
      sampleRateRef.current = audioCtx.sampleRate;
      const src = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 512;
      analyser.smoothingTimeConstant = 0.8;
      src.connect(analyser);
      analyserRef.current = analyser;
      
      const mr = new MediaRecorder(stream);
      mrRef.current = mr;
      chunksRef.current = [];
      
      mr.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      mr.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        stream.getTracks().forEach(t => t.stop());
        webmBlobToWavFile(blob).then(({ file: f, rms }) => {
          if (rms < 0.008) {
            setError("No voice detected — please speak clearly into your microphone.");
            setPhase("idle");
            return;
          }
          setPhase("analyzing");
          analyzeVoice(f)
            .then(data => {
              setResult(data);
              setPhase("done");
              if (onRecordingComplete) onRecordingComplete(data);
            })
            .catch(err => {
              setError(err instanceof Error ? err.message : "Analysis failed");
              setPhase("idle");
            });
        }).catch(() => {
          setError("Audio conversion failed");
          setPhase("idle");
        });
      };
      
      mr.start(100);
      setSeconds(0);
      setPhase("recording");
      
      const updateMetrics = setInterval(() => {
        if (analyserRef.current) {
          setMetrics(computeMetrics(analyserRef.current, sampleRateRef.current));
        }
      }, 500);
      timerRef.current = updateMetrics;
      
    }).catch(() => {
      alert("Microphone access is required. Please allow it in your browser settings.");
    });
  }
  
  function stopRecording() {
    if (timerRef.current) clearInterval(timerRef.current);
    mrRef.current?.stop();
  }
  
  function discardRecording() {
    if (timerRef.current) clearInterval(timerRef.current);
    mrRef.current?.stop();
    setPhase("idle");
    setSeconds(0);
  }
  
  if (phase === "recording") {
    return (
      <div style={{
        background: D.surface,
        border: `2px solid ${D.accent}`,
        borderRadius: 12,
        overflow: "hidden",
      }}>
        <div style={{
          background: D.accentInk,
          padding: "1rem 1.25rem",
          color: "#fff",
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{
                width: 10, height: 10, borderRadius: "50%", background: "#e05050",
                display: "inline-block", boxShadow: "0 0 0 2px rgba(224,80,80,.3)",
              }} />
              <span style={{ fontWeight: 600 }}>Recording Practice Session</span>
            </div>
            <span style={{ fontFamily: D.fontMono, fontSize: "0.9rem" }}>
              {String(Math.floor(seconds / 60)).padStart(2, "0")}:{String(seconds % 60).padStart(2, "0")}
            </span>
          </div>
        </div>
        
        <div style={{ padding: "1.25rem" }}>

          
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "0.75rem", marginBottom: "1rem" }}>
            <div style={{ textAlign: "center", padding: "0.5rem", background: D.bg, borderRadius: 8 }}>
              <div style={{ fontSize: "0.65rem", color: D.textMuted }}>Volume</div>
              <div style={{ fontSize: "1.1rem", fontWeight: 700, fontFamily: D.fontMono }}>{metrics.db} dB</div>
            </div>
            <div style={{ textAlign: "center", padding: "0.5rem", background: D.bg, borderRadius: 8 }}>
              <div style={{ fontSize: "0.65rem", color: D.textMuted }}>Pitch</div>
              <div style={{ fontSize: "1.1rem", fontWeight: 700, fontFamily: D.fontMono }}>{metrics.pitchHz || "—"} Hz</div>
            </div>
            <div style={{ textAlign: "center", padding: "0.5rem", background: D.bg, borderRadius: 8 }}>
              <div style={{ fontSize: "0.65rem", color: D.textMuted }}>Clarity</div>
              <div style={{ fontSize: "1.1rem", fontWeight: 700, fontFamily: D.fontMono }}>{metrics.snr} dB</div>
            </div>
          </div>
          
          <div style={{ display: "flex", gap: "0.75rem" }}>
            <button onClick={discardRecording} style={{
              flex: 1, padding: "0.75rem", borderRadius: 8,
              border: `1px solid ${D.border}`, background: D.surface,
              fontWeight: 600, cursor: "pointer", color: D.text,
            }}>Discard</button>
            <button onClick={stopRecording} style={{
              flex: 1, padding: "0.75rem", borderRadius: 8,
              background: D.accent, color: "#fff", border: "none",
              fontWeight: 600, cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem",
            }}>
              <Icons.Stop />
              Stop & Analyze
            </button>
          </div>
        </div>
      </div>
    );
  }
  
  if (phase === "analyzing") {
    return (
      <div style={{
        background: D.surface,
        border: `1px solid ${D.border}`,
        borderRadius: 12,
        padding: "2rem",
        textAlign: "center",
      }}>
        <div style={{
          width: 40, height: 40, border: `3px solid ${D.accentSoft}`,
          borderTopColor: D.accent, borderRadius: "50%",
          animation: "spin 0.8s linear infinite", margin: "0 auto 1rem",
        }} />
        <div style={{ fontWeight: 700, marginBottom: "0.25rem", color: D.text }}>Analyzing your practice session...</div>
        <div style={{ fontSize: "0.8rem", color: D.textMuted }}>Evaluating vocal clarity, fluency, and articulation</div>
      </div>
    );
  }
  
  if (phase === "done" && result) {
    return (
      <div style={{
        background: D.surface,
        border: `2px solid ${D.low}`,
        borderRadius: 12,
        padding: "1.25rem",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1rem" }}>
          <span style={{ fontSize: "2rem" }}>{result.is_healthy ? <Icons.Check /> : <Icons.Warning />}</span>
          <div>
            <div style={{ fontWeight: 700, fontSize: "1.1rem", color: D.text }}>
              {result.is_healthy ? "Great practice!" : "Area for improvement detected"}
            </div>
            <div style={{ fontSize: "0.8rem", color: D.textMuted }}>{result.message}</div>
          </div>
        </div>
        
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "0.75rem", marginBottom: "1rem" }}>
          <div style={{ textAlign: "center", padding: "0.5rem", background: D.bg, borderRadius: 8 }}>
            <div style={{ fontSize: "0.65rem", color: D.textMuted }}>Vocal Clarity</div>
            <div style={{ fontSize: "1.3rem", fontWeight: 700, color: D.text }}>{Math.round((1 - result.voice_quality_prob) * 100)}</div>
          </div>
          <div style={{ textAlign: "center", padding: "0.5rem", background: D.bg, borderRadius: 8 }}>
            <div style={{ fontSize: "0.65rem", color: D.textMuted }}>Fluency</div>
            <div style={{ fontSize: "1.3rem", fontWeight: 700, color: D.text }}>{Math.round((1 - result.stuttering_prob) * 100)}</div>
          </div>
          <div style={{ textAlign: "center", padding: "0.5rem", background: D.bg, borderRadius: 8 }}>
            <div style={{ fontSize: "0.65rem", color: D.textMuted }}>Articulation</div>
            <div style={{ fontSize: "1.3rem", fontWeight: 700, color: D.text }}>{Math.round((1 - result.dysarthria_prob) * 100)}</div>
          </div>
        </div>
        
        <button onClick={() => { 
          setPhase("idle"); 
          setResult(null);
        }} style={{
          width: "100%", padding: "0.75rem", borderRadius: 8,
          background: D.accent, color: "#fff", border: "none",
          fontWeight: 600, cursor: "pointer",
        }}>Practice Again</button>
      </div>
    );
  }
  
  return (
    <div style={{
      background: D.surface,
      border: `1px solid ${D.border}`,
      borderRadius: 12,
      padding: "1.25rem",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem" }}>
        <span style={{ color: D.accent }}><Icons.Mic /></span>
        <div>
          <div style={{ fontWeight: 700, color: D.text }}>Practice Recording</div>
          <div style={{ fontSize: "0.7rem", color: D.textMuted }}>Record yourself practicing the exercises</div>
        </div>
      </div>
      
      <p style={{ fontSize: "0.8rem", color: D.textMuted, marginBottom: "1rem" }}>
        Read the passage aloud to get instant feedback on your vocal clarity, fluency, and articulation.
      </p>
      
      <button onClick={startRecording} style={{
        width: "100%", padding: "1rem", borderRadius: 10,
        background: D.accent, color: "#fff", border: "none",
        fontWeight: 700, fontSize: "1rem", cursor: "pointer",
        display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem",
      }}>
        <Icons.Record /> Start Practice Recording
      </button>
      
      {error && (
        <div style={{ marginTop: "1rem", padding: "0.75rem", background: D.highSoft, borderRadius: 8, fontSize: "0.8rem", color: D.high, display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <Icons.Alert /> {error}
        </div>
      )}
      
      <div style={{ marginTop: "1rem", paddingTop: "1rem", borderTop: `1px solid ${D.border}`, fontSize: "0.7rem", color: D.textDim, textAlign: "center" }}>
        For best results, record in a quiet space and speak clearly at a comfortable volume
      </div>
    </div>
  );
}

// ── Exercise Player Component ─────────────────────────────────────────────
function ExercisePlayer({ exercise, onComplete }: { exercise: Exercise; onComplete?: () => void }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  const embedUrl = exercise.videoUrl ? getYouTubeEmbedUrl(exercise.videoUrl) : null;
  
  useEffect(() => {
    const audio = new Audio();
    audioRef.current = audio;
    audio.preload = 'metadata';
    
    const handleLoadedMetadata = () => {
      setDuration(audio.duration);
      setIsLoading(false);
      setError(null);
    };
    
    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };
    
    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
      if (audio.currentTime > 0) {
        audio.currentTime = 0;
      }
    };
    
    const handleError = () => {
      setError("Failed to load audio file");
      setIsLoading(false);
    };
    
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);
    
    audio.src = exercise.audioUrl;
    audio.load();
    
    return () => {
      audio.pause();
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
      audio.src = '';
    };
  }, [exercise.audioUrl]);
  
  const togglePlayPause = () => {
    if (audioRef.current && !error) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play().catch(() => {
          setError("Unable to play audio");
        });
      }
      setIsPlaying(!isPlaying);
    }
  };
  
  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (audioRef.current && duration && !isNaN(duration)) {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const width = rect.width;
      const percentage = Math.max(0, Math.min(1, x / width));
      const newTime = percentage * duration;
      audioRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };
  
  const nextStep = () => {
    if (currentStep < exercise.steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      if (onComplete) onComplete();
    }
  };
  
  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };
  
  const progressPercentage = duration > 0 && !isNaN(duration) ? (currentTime / duration) * 100 : 0;
  const formatTime = (seconds: number) => {
    if (isNaN(seconds) || !isFinite(seconds)) return "00:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  return (
    <div style={{
      background: D.surface,
      border: `1px solid ${D.border}`,
      borderRadius: 12,
      padding: "1rem",
      marginBottom: "1rem",
    }}>
      <div style={{ marginBottom: "0.75rem" }}>
        <div style={{ fontWeight: 700, fontSize: "1rem", color: D.text }}>{exercise.title}</div>
        <div style={{ fontSize: "0.7rem", color: D.textMuted, display: "flex", alignItems: "center", gap: "0.3rem" }}>
          <Icons.Clock /> {exercise.duration} • {exercise.difficulty}
        </div>
      </div>
      
      <div style={{ marginBottom: "1rem" }}>
        <div style={{ fontSize: "0.75rem", color: D.textMuted, marginBottom: "0.25rem" }}>Description</div>
        <div style={{ fontSize: "0.85rem", color: D.text }}>{exercise.description}</div>
      </div>
      
      <div style={{
        background: D.bg,
        borderRadius: 8,
        padding: "0.75rem",
        marginBottom: "1rem",
      }}>
        {error ? (
          <div style={{ textAlign: "center", color: D.high, fontSize: "0.75rem", padding: "0.5rem", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem" }}>
            <Icons.Alert /> {error}
          </div>
        ) : isLoading ? (
          <div style={{ textAlign: "center", padding: "0.5rem" }}>
            <div style={{
              width: 24, height: 24, border: `2px solid ${D.border}`,
              borderTopColor: D.accent, borderRadius: "50%",
              animation: "spin 0.8s linear infinite", margin: "0 auto",
            }} />
          </div>
        ) : (
          <>
            <div 
              onClick={handleSeek}
              style={{
                width: "100%",
                height: 4,
                background: D.border,
                borderRadius: 2,
                cursor: "pointer",
                position: "relative",
                marginBottom: "0.5rem",
              }}
            >
              <div style={{
                width: `${progressPercentage}%`,
                height: "100%",
                background: D.accent,
                borderRadius: 2,
                position: "relative",
              }}>
                <div style={{
                  position: "absolute",
                  right: 0,
                  top: "50%",
                  transform: "translate(50%, -50%)",
                  width: 12,
                  height: 12,
                  background: D.accent,
                  borderRadius: "50%",
                  boxShadow: D.shadow,
                }} />
              </div>
            </div>
            
            <div style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}>
              <div style={{ fontSize: "0.7rem", fontFamily: D.fontMono, color: D.textMuted }}>
                {formatTime(currentTime)} / {formatTime(duration)}
              </div>
              
              <div style={{ display: "flex", gap: "0.5rem" }}>
                <button
                  onClick={togglePlayPause}
                  style={{
                    background: isPlaying ? D.high : D.accent,
                    border: "none",
                    borderRadius: 30,
                    width: 36,
                    height: 36,
                    cursor: "pointer",
                    color: "#fff",
                    fontSize: "1rem",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    transition: "all 0.2s",
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.transform = "scale(1.05)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.transform = "scale(1)"; }}
                >
                  {isPlaying ? <Icons.Pause /> : <Icons.Play />}
                </button>
              </div>
              
              <div style={{ fontSize: "0.7rem", fontFamily: D.fontMono, color: D.textMuted }}>
                {exercise.duration}
              </div>
            </div>
          </>
        )}
      </div>
      
      <div style={{ marginBottom: "1rem" }}>
        <div style={{ fontSize: "0.75rem", color: D.textMuted, marginBottom: "0.5rem" }}>
          Step {currentStep + 1} of {exercise.steps.length}
        </div>
        <div style={{
          background: D.bg,
          padding: "0.75rem",
          borderRadius: 8,
          fontSize: "0.85rem",
          color: D.text,
          lineHeight: 1.5,
        }}>
          {exercise.steps[currentStep]}
        </div>
      </div>
      
      <div style={{ display: "flex", gap: "0.5rem", justifyContent: "space-between", marginBottom: "1rem" }}>
        <button
          onClick={prevStep}
          disabled={currentStep === 0}
          style={{
            padding: "0.5rem 1rem",
            background: currentStep === 0 ? D.border : D.accentSoft,
            border: "none",
            borderRadius: 8,
            color: currentStep === 0 ? D.textDim : D.accentInk,
            cursor: currentStep === 0 ? "not-allowed" : "pointer",
            fontWeight: 600,
            fontSize: "0.75rem",
            display: "flex",
            alignItems: "center",
            gap: "0.3rem",
          }}
        >
          <Icons.ArrowLeft /> Previous
        </button>
        <button
          onClick={nextStep}
          style={{
            padding: "0.5rem 1rem",
            background: D.accent,
            border: "none",
            borderRadius: 8,
            color: "#fff",
            cursor: "pointer",
            fontWeight: 600,
            fontSize: "0.75rem",
            display: "flex",
            alignItems: "center",
            gap: "0.3rem",
          }}
        >
          {currentStep === exercise.steps.length - 1 ? (
            <>
              <Icons.Check /> Complete
            </>
          ) : (
            <>
              Next <Icons.ArrowRight />
            </>
          )}
        </button>
      </div>
      
      {embedUrl && (
        <>
          <div style={{
            marginTop: "0.5rem",
            paddingTop: "0.75rem",
            borderTop: `1px solid ${D.border}`,
          }}>
            <div style={{
              fontSize: "0.7rem",
              fontWeight: 700,
              color: D.textMuted,
              marginBottom: "0.75rem",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
            }}>
              <Icons.Video /> Tutorial Video
            </div>
            <div style={{
              position: "relative",
              paddingBottom: "56.25%",
              height: 0,
              borderRadius: 8,
              overflow: "hidden",
            }}>
              <iframe
                src={embedUrl}
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  height: "100%",
                  border: "none",
                }}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ── Tutorial Steps Component ──────────────────────────────────────────────
function TutorialSteps() {
  const [expanded, setExpanded] = useState(false);
  const isMobile = useMediaQuery(`(max-width: ${D.breakpoints.mobile}px)`);
  
  return (
    <div style={{
      background: D.accentSoft,
      borderRadius: 12,
      padding: "1.25rem",
      marginBottom: "1.5rem",
    }}>
      <div
        onClick={() => setExpanded(!expanded)}
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          cursor: "pointer",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <span style={{ color: D.accent }}><Icons.Target /></span>
          <div>
            <div style={{ fontWeight: 700, color: D.text }}>Before You Begin</div>
            <div style={{ fontSize: "0.7rem", color: D.textMuted }}>
              Essential preparation steps
            </div>
          </div>
        </div>
        <span style={{ fontSize: "1rem", color: D.textMuted }}>
          {expanded ? <Icons.ArrowUp /> : <Icons.ArrowDown />}
        </span>
      </div>
      
      {expanded && (
        <div style={{ marginTop: "1rem", paddingTop: "1rem", borderTop: `1px solid ${D.border}` }}>
          <div style={{ display: "grid", gap: "1rem" }}>
            <div style={{ display: "flex", gap: "0.75rem" }}>
              <div style={{
                width: 28, height: 28, background: D.accent, color: "#fff",
                borderRadius: "50%", display: "flex", alignItems: "center",
                justifyContent: "center", fontWeight: 700, fontSize: "0.8rem", flexShrink: 0,
              }}>1</div>
              <div>
                <div style={{ fontWeight: 600, fontSize: "0.85rem", color: D.text }}>Hydrate Your Voice</div>
                <div style={{ fontSize: "0.75rem", color: D.textMuted }}>
                  Drink room-temperature water 15-20 minutes before exercises.
                </div>
              </div>
            </div>
            <div style={{ display: "flex", gap: "0.75rem" }}>
              <div style={{
                width: 28, height: 28, background: D.accent, color: "#fff",
                borderRadius: "50%", display: "flex", alignItems: "center",
                justifyContent: "center", fontWeight: 700, fontSize: "0.8rem", flexShrink: 0,
              }}>2</div>
              <div>
                <div style={{ fontWeight: 600, fontSize: "0.85rem", color: D.text }}>Posture Check</div>
                <div style={{ fontSize: "0.75rem", color: D.textMuted }}>
                  Sit or stand with back straight, shoulders relaxed, feet flat on floor.
                </div>
              </div>
            </div>
            <div style={{ display: "flex", gap: "0.75rem" }}>
              <div style={{
                width: 28, height: 28, background: D.accent, color: "#fff",
                borderRadius: "50%", display: "flex", alignItems: "center",
                justifyContent: "center", fontWeight: 700, fontSize: "0.8rem", flexShrink: 0,
              }}>3</div>
              <div>
                <div style={{ fontWeight: 600, fontSize: "0.85rem", color: D.text }}>Warm Up Your Body</div>
                <div style={{ fontSize: "0.75rem", color: D.textMuted }}>
                  Gently roll shoulders, tilt neck, stretch jaw by opening/closing slowly.
                </div>
              </div>
            </div>
            <div style={{ display: "flex", gap: "0.75rem" }}>
              <div style={{
                width: 28, height: 28, background: D.accent, color: "#fff",
                borderRadius: "50%", display: "flex", alignItems: "center",
                justifyContent: "center", fontWeight: 700, fontSize: "0.8rem", flexShrink: 0,
              }}>4</div>
              <div>
                <div style={{ fontWeight: 600, fontSize: "0.85rem", color: D.text }}>Create a Quiet Space</div>
                <div style={{ fontSize: "0.75rem", color: D.textMuted }}>
                  Find a quiet room without background noise for best results.
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Responsive hook ────────────────────────────────────────────────────────
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

// ── Main Page Component ────────────────────────────────────────────────────
export default function ExercisesPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [latestScore, setLatestScore] = useState<number | null>(null);
  const [severity, setSeverity] = useState<SeverityLevel>("none");
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [completedExercises, setCompletedExercises] = useState<string[]>([]);
  const [savedSession, setSavedSession] = useState<Session | null>(null);
  const [testResult, setTestResult] = useState<AnalysisResult | null>(null);
  const [showScoreView, setShowScoreView] = useState(false);
  const isMobile = useMediaQuery(`(max-width: ${D.breakpoints.mobile}px)`);
  
  const [patient, setPatient] = useState<any>(null);
  
  useEffect(() => {
    if (!isLoggedIn()) {
      router.replace("/login");
      return;
    }
    
    const p = getPatient();
    setPatient(p);
    
    fetchSessions()
      .then((sessions: Session[]) => {
        if (sessions.length === 0) {
          setError("No sessions recorded yet. Please complete a session first.");
          setLoading(false);
          return;
        }
        
        const latest = sessions[0];
        setSavedSession(latest);
        
        const overallScore = Math.round(
          ((1 - latest.vocal_clarity_prob) + 
           (1 - latest.fluency_prob) + 
           (1 - latest.articulation_prob)) / 3 * 100
        );
        
        setLatestScore(overallScore);
        setSeverity(latest.severity_label as SeverityLevel);
        
        const recommendedExercises = getExercises(overallScore, latest.severity_label as SeverityLevel);
        setExercises(recommendedExercises);
      })
      .catch((err) => {
        console.error(err);
        setError("Failed to load your data. Please try again.");
      })
      .finally(() => setLoading(false));
  }, [router]);
  
  const handleExerciseComplete = (exerciseId: string) => {
    if (!completedExercises.includes(exerciseId)) {
      setCompletedExercises([...completedExercises, exerciseId]);
    }
  };
  
  const handleRecordingComplete = (result: AnalysisResult) => {
    setTestResult(result);
    setShowScoreView(true);
  };
  
  const handleBackToExercises = () => {
    setShowScoreView(false);
    setTestResult(null);
  };
  
  const currentSevKey = savedSession ? dominantSevLabel([savedSession]) : "none";
  const startSevKey = savedSession ? dominantSevLabel([savedSession]) : "none";
  
  const verdictRankDiff = SEV_RANK[startSevKey] - SEV_RANK[currentSevKey];
  const verdictTrend = verdictRankDiff > 1 ? "Significant improvement ↑"
    : verdictRankDiff === 1 ? "Moderate improvement ↑"
    : verdictRankDiff === 0 ? "Stable →"
    : "Regression noted ↓";
  
  const dayNumber = patient?.day_number ?? 1;
  
  if (loading) {
    return (
      <div style={{ display: "flex", minHeight: "100vh" }}>
        <div style={{ 
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: D.textMuted,
          fontFamily: D.fontMono,
          fontSize: "0.85rem"
        }}>
          Loading your personalized exercises...
        </div>
      </div>
    );
  }
  
  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <div style={{ 
        flex: 1,
        overflow: "auto",
        maxWidth: D.breakpoints.desktop,
        margin: "0 auto",
        padding: "clamp(1rem, 4vw, 2rem)",
        width: "100%"
      }}>
        {!showScoreView && savedSession && (
          <div style={{
            background: VERDICT_SOFT[currentSevKey],
            border: `2px solid ${VERDICT_BORDER[currentSevKey]}`,
            borderRadius: 14,
            padding: "clamp(1rem, 4vw, 1.4rem) clamp(1rem, 4vw, 1.75rem)",
            marginBottom: "1.5rem",
          }}>
            <div style={{
              fontSize: "clamp(0.6rem, 2.5vw, 0.68rem)",
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.1em",
              color: VERDICT_INK[currentSevKey],
              opacity: 0.7,
              marginBottom: "0.4rem"
            }}>
              Programme Assessment · Day {dayNumber} of 30
            </div>
            <div style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap" as const,
              gap: "1rem"
            }}>
              <div>
                <div style={{
                  fontSize: "clamp(1.5rem, 6vw, 1.9rem)",
                  fontWeight: 800,
                  color: VERDICT_INK[currentSevKey],
                  letterSpacing: "-0.02em",
                  lineHeight: 1.1
                }}>
                  {SEV_LABEL[currentSevKey]}
                </div>
                <div style={{
                  fontSize: "clamp(0.75rem, 3vw, 0.85rem)",
                  color: VERDICT_INK[currentSevKey],
                  opacity: 0.8,
                  marginTop: "0.3rem",
                  maxWidth: 420
                }}>
                  {VERDICT_DESC[currentSevKey]}
                </div>
              </div>
              <div style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-end",
                gap: "0.5rem"
              }}>
                {latestScore !== null && (
                  <div style={{ textAlign: "right" }}>
                    <div style={{
                      fontSize: "clamp(0.55rem, 2.5vw, 0.65rem)",
                      fontWeight: 700,
                      textTransform: "uppercase",
                      letterSpacing: "0.08em",
                      color: VERDICT_INK[currentSevKey],
                      opacity: 0.6
                    }}>
                      Last score
                    </div>
                    <div style={{
                      fontSize: "clamp(1.8rem, 7vw, 2.4rem)",
                      fontWeight: 800,
                      fontFamily: D.fontMono,
                      color: VERDICT_INK[currentSevKey],
                      lineHeight: 1
                    }}>
                      {latestScore}
                      <span style={{
                        fontSize: "clamp(0.8rem, 3vw, 1rem)",
                        fontWeight: 500,
                        opacity: 0.6
                      }}>%</span>
                    </div>
                  </div>
                )}
                <div style={{
                  fontSize: "clamp(0.7rem, 3vw, 0.82rem)",
                  fontWeight: 700,
                  color: verdictRankDiff > 0 ? D.low : verdictRankDiff === 0 ? D.textMuted : D.high,
                  display: "flex",
                  alignItems: "center",
                  gap: "0.3rem",
                }}>
                  {verdictRankDiff > 0 ? <Icons.TrendingUp /> : verdictRankDiff === 0 ? <Icons.Minus /> : <Icons.TrendingDown />}
                  {verdictTrend}
                </div>
              </div>
            </div>
            <div style={{
              display: "flex",
              gap: "1.5rem",
              marginTop: "1rem",
              paddingTop: "0.9rem",
              borderTop: `1px solid ${VERDICT_BORDER[currentSevKey]}`,
              flexWrap: "wrap" as const,
              alignItems: "center",
              justifyContent: "space-between"
            }}>
              <div style={{ display: "flex", gap: "1.5rem", flexWrap: "wrap" as const, alignItems: "center" }}>
                <div>
                  <div style={{
                    fontSize: "clamp(0.55rem, 2.5vw, 0.63rem)",
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                    color: VERDICT_INK[currentSevKey],
                    opacity: 0.55,
                    marginBottom: 4
                  }}>
                    Current Stage
                  </div>
                  <span style={{
                    background: SEV_COLOR[currentSevKey],
                    color: "#fff",
                    borderRadius: 20,
                    padding: "3px 12px",
                    fontSize: "clamp(0.7rem, 2.5vw, 0.78rem)",
                    fontWeight: 700,
                  }}>
                    {SEV_LABEL[currentSevKey]}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {showScoreView && testResult && savedSession ? (
          <>
            <div style={{
              background: D.accentSoft,
              borderRadius: 12,
              padding: "0.75rem 1rem",
              marginBottom: "1rem",
              fontSize: "0.8rem",
              color: D.textMuted,
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
            }}>
              <Icons.Brain />
              <span>Test results are <strong>not saved</strong> to your progress. This is for practice and comparison only.</span>
            </div>
            
            <ScoreDashboard 
              testResult={testResult} 
              savedSession={savedSession}
              onBack={handleBackToExercises}
            />
          </>
        ) : (
          <>
            <TutorialSteps />
            
            {latestScore !== null && (
              <div style={{
                background: severity === "severe" ? D.highSoft : severity === "moderate" ? D.midSoft : D.lowSoft,
                padding: "0.75rem 1rem",
                borderRadius: 8,
                marginBottom: "1.5rem",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                flexWrap: "wrap",
                gap: "0.5rem",
              }}>
                <div>
                  <span style={{ fontWeight: 700, color: severity === "severe" ? D.highInk : severity === "moderate" ? D.midInk : D.lowInk }}>
                    
                    {" "}{getExerciseLevel(latestScore, severity) === "clinical" ? "Clinical Level" :
                     getExerciseLevel(latestScore, severity) === "advanced" ? "Advanced Level" :
                     getExerciseLevel(latestScore, severity) === "intermediate" ? "Intermediate Level" :
                     "Beginner Level"}
                  </span>
                  <span style={{ fontSize: "0.75rem", marginLeft: "0.5rem", color: D.textMuted }}>
                    exercises recommended for you
                  </span>
                </div>
                {completedExercises.length > 0 && (
                  <div style={{ fontSize: "0.7rem", color: D.textMuted, display: "flex", alignItems: "center", gap: "0.3rem" }}>
                    <Icons.Check /> {completedExercises.length}/{exercises.length} completed
                  </div>
                )}
              </div>
            )}
            
            <div style={{
              display: "grid",
              gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fit, minmax(380px, 1fr))",
              gap: "1.25rem",
              marginBottom: "1.5rem",
            }}>
              {exercises.map((exercise) => (
                <ExercisePlayer
                  key={exercise.id}
                  exercise={exercise}
                  onComplete={() => handleExerciseComplete(exercise.id)}
                />
              ))}
            </div>
            
            <ProfessionalRecordingSection onRecordingComplete={handleRecordingComplete} />
          </>
        )}
        
        <div style={{
          marginTop: "1.5rem",
          padding: "1rem",
          background: D.bg,
          borderRadius: 8,
          fontSize: "0.7rem",
          color: D.textDim,
          textAlign: "center",
        }}>
           Always consult your speech therapist before starting new exercises. Stop immediately if you experience pain or discomfort.
        </div>
        
        <style>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    </div>
  );
}