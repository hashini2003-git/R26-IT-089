"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import {
  Heart, Camera, LayoutDashboard, BarChart2, TrendingUp, GitCompare,
  MessageSquare, Stethoscope, Menu, X, Clock, AlertTriangle, CheckCircle2, Download, Mic, ChevronRight,
} from "lucide-react";
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  BarChart, Bar, XAxis, YAxis, Tooltip, Cell, ResponsiveContainer,
} from "recharts";
import { loadResult, type IpeResult } from "../_lib/ipe-ui";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8001";

/* ── Palette (exact match to approved design) ───────────────────── */
const BLUE = "#1565C0";
const BLUE_DEEP = "#0D47A1";
const BLUE_TINT = "#E3EEF9";
const MINT = "#0D9488";
const MINT_TINT = "#E0F5F3";
const NAVY = "#0B1F38";
const BG = "#F4F8FD";
const BORDER = "rgba(21,101,192,0.10)";
const SIDEBAR_BG = "#0B1F38";
const TEXT = "#0F2137";
const TEXT2 = "#4A6070";
const SEV = ["#2ECC91", "#F5C242", "#FF9F43", "#E8483A"];
const CLASS_COLORS: Record<string, string> = {
  "Normal": "#2ECC91",
  "Variation from Normal": "#F5C242",
  "OPMD": "#FF9F43",
  "Oral Cancer": "#E8483A",
};
const FONT = "'Inter', system-ui, sans-serif";
const SERIF = "'DM Serif Display', Georgia, serif";
const MONO = "'DM Mono', monospace";

function sevColor(v: number) {
  if (v < 0.25) return SEV[0]; if (v < 0.5) return SEV[1]; if (v < 0.75) return SEV[2]; return SEV[3];
}
function ppiColor(v: number, max: number) {
  const pct = v / max;
  if (pct <= 0.2) return SEV[0]; if (pct <= 0.4) return SEV[1]; if (pct <= 0.65) return SEV[2]; return SEV[3];
}

/* ── Shared UI ───────────────────────────────────────────────── */
function Ring({ value, size = 120, stroke = 10, color, children }: { value: number; size?: number; stroke?: number; color: string; children?: React.ReactNode }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c * (1 - Math.min(Math.max(value, 0), 1));
  return (
    <div style={{ position: "relative", width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={size / 2} cy={size / 2} r={r} stroke="rgba(21,101,192,0.08)" strokeWidth={stroke} fill="none" />
        <circle cx={size / 2} cy={size / 2} r={r} stroke={color} strokeWidth={stroke} fill="none"
          strokeLinecap="round" strokeDasharray={c} strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 1.2s cubic-bezier(.4,0,.2,1)" }} />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column" }}>
        {children}
      </div>
    </div>
  );
}
function Meter({ value, color, height = 8 }: { value: number; color: string; height?: number }) {
  return (
    <div style={{ width: "100%", height, borderRadius: height, background: "rgba(21,101,192,0.07)", overflow: "hidden" }}>
      <div style={{ width: `${Math.round(value * 100)}%`, height: "100%", borderRadius: height, background: color, transition: "width 1s cubic-bezier(.4,0,.2,1)" }} />
    </div>
  );
}
function SevBadge({ label, color }: { label: string; color: string }) {
  return <span style={{ fontSize: 10.5, fontWeight: 700, padding: "3px 10px", borderRadius: 20, background: `${color}18`, color, letterSpacing: 0.3 }}>{label}</span>;
}
function GlassCard({ children, style, onClick }: { children: React.ReactNode; style?: React.CSSProperties; onClick?: () => void }) {
  return (
    <div
      onClick={onClick}
      style={{ background: "#fff", borderRadius: 20, border: `1px solid ${BORDER}`, boxShadow: "0 2px 12px rgba(21,101,192,0.06), 0 1px 3px rgba(0,0,0,0.04)", padding: 22, cursor: onClick ? "pointer" : "default", transition: "box-shadow .18s, transform .18s", ...style }}
      onMouseEnter={onClick ? (e) => { (e.currentTarget as HTMLElement).style.boxShadow = "0 6px 20px rgba(21,101,192,0.12)"; (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)"; } : undefined}
      onMouseLeave={onClick ? (e) => { (e.currentTarget as HTMLElement).style.boxShadow = "0 2px 12px rgba(21,101,192,0.06), 0 1px 3px rgba(0,0,0,0.04)"; (e.currentTarget as HTMLElement).style.transform = "translateY(0)"; } : undefined}
    >
      {children}
    </div>
  );
}

/* ── Sidebar (shared shell — reused across Dashboard/Results/Progress/Compare/Assistant) ── */
const NAV_SECTIONS = [
  { label: "Overview", items: [{ href: "/Component1/dashboard", label: "Patient Dashboard", sub: "Summary & care plan", Icon: LayoutDashboard }] },
  { label: "My Health", items: [
    { href: "/Component1/results", label: "Analysis Results", sub: "Latest AI findings", Icon: BarChart2 },
    { href: "/Component1/progress", label: "Recovery Journey", sub: "Progress tracking", Icon: TrendingUp },
    { href: "/Component1/compare", label: "Before & After", sub: "Visual comparison", Icon: GitCompare },
  ] },
  { label: "Tools", items: [
    { href: "/Component1/upload", label: "New Scan", sub: "Upload oral image", Icon: Camera },
    { href: "/Component1/assistant", label: "AI Assistant", sub: "Get guidance", Icon: MessageSquare },
    { href: "/Component1/doctors", label: "Find a Doctor", sub: "Doctor recommendation", Icon: Stethoscope },
  ] },
];

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <div style={{ fontSize: 9.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1.6, color: "rgba(255,255,255,0.28)", padding: "16px 14px 6px", marginTop: 4 }}>{children}</div>;
}

function NavSidebar({ onClose }: { onClose?: () => void }) {
  const router = useRouter();
  const pathname = usePathname();
  return (
    <div style={{ width: 248, background: SIDEBAR_BG, display: "flex", flexDirection: "column", height: "100%", flexShrink: 0, fontFamily: FONT, overflowY: "auto" }}>
      <div style={{ padding: "22px 18px 18px", borderBottom: "1px solid rgba(255,255,255,0.06)", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 38, height: 38, borderRadius: 11, background: `linear-gradient(135deg, ${BLUE}, ${MINT})`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, boxShadow: `0 4px 12px ${BLUE}44` }}>
            <Heart size={17} color="#fff" />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14.5, fontWeight: 700, color: "#fff", lineHeight: 1.2, fontFamily: SERIF }}>OralCare AI</div>
            <div style={{ fontSize: 9.5, color: "rgba(255,255,255,0.35)", marginTop: 1, letterSpacing: 0.3 }}>Clinical Patient Portal</div>
          </div>
          {onClose && (
            <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.35)", display: "flex", padding: 2 }}>
              <X size={17} />
            </button>
          )}
        </div>
        <div style={{ marginTop: 14, display: "flex", alignItems: "center", gap: 8, padding: "9px 11px", borderRadius: 11, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.06)" }}>
          <div style={{ width: 30, height: 30, borderRadius: "50%", background: `${BLUE}44`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: "#90CAF9" }}>P</span>
          </div>
          <div>
            <div style={{ fontSize: 11.5, fontWeight: 600, color: "#fff" }}>Patient Portal</div>
            <div style={{ fontSize: 9.5, color: "rgba(255,255,255,0.3)" }}>Secure session active</div>
          </div>
          <div style={{ marginLeft: "auto", width: 7, height: 7, borderRadius: "50%", background: "#2ECC91", flexShrink: 0, boxShadow: "0 0 6px #2ECC9188" }} />
        </div>
      </div>

      <nav style={{ flex: 1, padding: "6px 10px 14px" }}>
        {NAV_SECTIONS.map((section) => (
          <div key={section.label}>
            <SectionLabel>{section.label}</SectionLabel>
            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              {section.items.map(({ href, label, sub, Icon }) => {
                const active = pathname === href;
                return (
                  <button key={href} onClick={() => { router.push(href); onClose?.(); }}
                    style={{
                      display: "flex", alignItems: "center", gap: 10, padding: "9px 10px", borderRadius: 10,
                      border: "none", cursor: "pointer", textAlign: "left", width: "100%",
                      background: active ? `linear-gradient(135deg, ${BLUE}cc, ${BLUE_DEEP}cc)` : "transparent",
                      transition: "all .15s", fontFamily: FONT,
                      boxShadow: active ? `0 3px 10px ${BLUE}33` : "none",
                    }}
                  >
                    <div style={{ width: 32, height: 32, borderRadius: 9, background: active ? "rgba(255,255,255,0.18)" : "rgba(255,255,255,0.06)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <Icon size={14} color={active ? "#fff" : "rgba(255,255,255,0.45)"} />
                    </div>
                    <div>
                      <div style={{ fontSize: 12.5, fontWeight: active ? 600 : 400, color: active ? "#fff" : "rgba(255,255,255,0.6)", lineHeight: 1.25 }}>{label}</div>
                      <div style={{ fontSize: 10, color: "rgba(255,255,255,0.25)", marginTop: 1 }}>{sub}</div>
                    </div>
                    {active && <div style={{ marginLeft: "auto", width: 5, height: 5, borderRadius: "50%", background: "#90CAF9", flexShrink: 0 }} />}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div style={{ padding: "10px 10px 20px", borderTop: "1px solid rgba(255,255,255,0.06)", flexShrink: 0 }}>
        <button onClick={() => { router.push("/Component1/assistant"); onClose?.(); }}
          style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "12px 13px", borderRadius: 11, border: `1px solid rgba(13,148,136,0.3)`, background: "rgba(13,148,136,0.1)", cursor: "pointer", fontFamily: FONT }}>
          <div style={{ width: 30, height: 30, borderRadius: 9, background: "rgba(13,148,136,0.2)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <Stethoscope size={14} color={MINT} />
          </div>
          <div style={{ textAlign: "left" }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: MINT, lineHeight: 1.2 }}>Message Care Team</div>
            <div style={{ fontSize: 10, color: "rgba(255,255,255,0.28)", marginTop: 1 }}>AI-powered assistant</div>
          </div>
        </button>
        <div style={{ marginTop: 12, fontSize: 9, color: "rgba(255,255,255,0.18)", textAlign: "center", letterSpacing: 0.3 }}>
          OralCare AI v3.0 · HIPAA-aligned · Encrypted
        </div>
      </div>
    </div>
  );
}

function SidebarLayout({ title, children }: { title: string; children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden", fontFamily: FONT, background: BG }}>
      <div className="hidden lg:flex" style={{ flexDirection: "column", height: "100%", flexShrink: 0 }}>
        <NavSidebar />
      </div>
      {mobileOpen && (
        <div style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex" }}>
          <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.45)", backdropFilter: "blur(3px)" }} onClick={() => setMobileOpen(false)} />
          <div style={{ position: "relative", height: "100%", width: 248, zIndex: 1 }}>
            <NavSidebar onClose={() => setMobileOpen(false)} />
          </div>
        </div>
      )}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", minWidth: 0 }}>
        <div className="flex lg:hidden" style={{ alignItems: "center", gap: 12, padding: "12px 16px", background: "#fff", borderBottom: `1px solid ${BORDER}`, flexShrink: 0 }}>
          <button onClick={() => setMobileOpen(true)} style={{ background: "none", border: "none", cursor: "pointer", display: "flex", padding: 4 }}>
            <Menu size={20} color={NAVY} />
          </button>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 28, height: 28, borderRadius: 8, background: `linear-gradient(135deg, ${BLUE}, ${MINT})`, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Heart size={13} color="#fff" />
            </div>
            <span style={{ fontSize: 14, fontWeight: 700, color: NAVY, fontFamily: SERIF }}>OralCare AI</span>
          </div>
          <div style={{ marginLeft: "auto", fontSize: 11.5, color: TEXT2 }}>{title}</div>
        </div>
        <div style={{ flex: 1, overflowY: "auto" }}>{children}</div>
      </div>
    </div>
  );
}

/* ── Results content ─────────────────────────────────────────── */
function ResultsContent({ result }: { result: IpeResult }) {
  const router = useRouter();
  const { classification, ppi, fis, visual_features: vf, urgency, treatment_plan } = result;
  const ppiMax = ppi.max ?? 10;
  const ppiC = ppiColor(ppi.score, ppiMax);
  const confidencePct = Math.round(classification.confidence);

  const [reportLoading, setReportLoading] = useState(false);
  const [reportError, setReportError] = useState<string | null>(null);

  async function downloadReport() {
    setReportLoading(true);
    setReportError(null);
    try {
      const res = await fetch(`${API}/report/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patient_name: "Patient",
          class_name: result.classification.name,
          confidence: result.classification.confidence,
          ppi: result.ppi.score,
          pain_label: result.ppi.label,
          fis_speech: result.fis.speech,
          fis_swallow: result.fis.swallowing,
          fis_mouth: result.fis.mouth,
          erythema: result.visual_features.erythema,
          ulceration: result.visual_features.ulceration,
          texture: result.visual_features.texture,
          physio: result.visual_features.physio,
          urgency: result.urgency.timeframe,
          visits: (() => {
            try {
              const raw = localStorage.getItem("ipe_visits");
              return raw ? JSON.parse(raw) : [];
            } catch { return []; }
          })(),
        }),
      });
      if (!res.ok) {
        const err = await res.text();
        throw new Error(`Server error ${res.status}: ${err}`);
      }
      const data = await res.json();
      sessionStorage.setItem("ipe_report_pdf_base64", data.pdf_base64);
      router.push("/Component1/results/report/view");
    } catch (e) {
      setReportError(e instanceof Error ? e.message : "Could not generate report.");
    } finally {
      setReportLoading(false);
    }
  }

  const radarData = [
    { label: "Erythema", value: Math.round(vf.erythema * 100) },
    { label: "Ulceration", value: Math.round(vf.ulceration * 100) },
    { label: "Texture", value: Math.round(vf.texture * 100) },
    { label: "Pathological", value: Math.round((1 - vf.physio) * 100) },
  ];

  const probData = Object.entries(classification.all_probs)
    .map(([name, value]) => ({ name, value: Math.round(value), color: CLASS_COLORS[name] ?? MINT }))
    .sort((a, b) => b.value - a.value);

  const biomarkers = [
    { key: "erythema", label: "Redness (Erythema)", plain: "How inflamed the tissue looks", value: vf.erythema, note: vf.erythema > 0.6 ? "High inflammation — likely causing burning or stinging sensations." : vf.erythema > 0.3 ? "Moderate redness present in the tissue." : "Tissue coloring appears close to healthy baseline." },
    { key: "ulceration", label: "Open Sores (Ulceration)", plain: "Presence of tissue ulcers", value: vf.ulceration, note: vf.ulceration > 0.4 ? "Open sore detected — typically the main source of sharp, localized pain." : vf.ulceration > 0.2 ? "Minor sore present, may cause intermittent discomfort." : "No significant sores detected in this image." },
    { key: "texture", label: "Stiffness (Texture)", plain: "How rough or stiff the tissue is", value: vf.texture, note: vf.texture > 0.5 ? "Noticeable stiffness that can restrict jaw or tongue movement." : vf.texture > 0.3 ? "Mild roughness — worth monitoring over time." : "Tissue texture appears within a normal range." },
    { key: "physio", label: "Pathological Signal", plain: "Is this a real finding or normal anatomy?", value: 1 - vf.physio, note: (1 - vf.physio) > 0.7 ? "Model is highly confident this reflects a real pathological condition." : (1 - vf.physio) > 0.4 ? "Mixed signal — some borderline features present. Clinical exam recommended." : "This may be closer to a normal anatomical variant." },
  ];

  const fisRows = [
    { label: "Speech", value: fis.speech, note: fis.speech > 0.5 ? "Speaking may be difficult right now." : "Speech is only mildly affected." },
    { label: "Swallowing", value: fis.swallowing, note: fis.swallowing > 0.5 ? "A soft diet is recommended for comfort." : "Swallowing is largely unaffected." },
    { label: "Mouth Opening", value: fis.mouth, note: fis.mouth > 0.5 ? "Jaw stretching exercises may help." : "Mouth opening is close to normal range." },
  ];

  const txTiers = [
    { title: "Do Right Now", Icon: AlertTriangle, items: treatment_plan.immediate, color: "#E8483A", bg: "#FDEDEB" },
    { title: "This Week", Icon: Clock, items: treatment_plan.short_term, color: "#FF9F43", bg: "#FFF3E4" },
    { title: "Clinical Steps", Icon: Stethoscope, items: treatment_plan.clinical, color: BLUE, bg: BLUE_TINT },
    { title: "Lifestyle Changes", Icon: CheckCircle2, items: treatment_plan.lifestyle, color: MINT, bg: MINT_TINT },
  ];

  return (
    <div style={{ padding: "28px 26px 48px", maxWidth: 980, margin: "0 auto", fontFamily: FONT }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
        <div>
          <div style={{ fontSize: 10.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1.3, color: MINT, marginBottom: 5 }}>Analysis Report</div>
          <h1 style={{ fontSize: 26, fontWeight: 400, color: NAVY, margin: 0, fontFamily: SERIF }}>Your Results</h1>
        </div>
        <button onClick={downloadReport} disabled={reportLoading}
          style={{ display: "flex", alignItems: "center", gap: 8, padding: "11px 20px", borderRadius: 999, background: reportLoading ? "#B9C6C7" : `linear-gradient(135deg, ${BLUE}, ${BLUE_DEEP})`, border: "none", color: "#fff", fontSize: 13, fontWeight: 600, cursor: reportLoading ? "not-allowed" : "pointer", fontFamily: FONT, boxShadow: reportLoading ? "none" : `0 4px 16px ${BLUE}40` }}>
          <Download size={15} /> {reportLoading ? "Generating…" : "Download PDF Report"}
        </button>
      </div>

      {reportError && (
        <div style={{ padding: "12px 16px", borderRadius: 14, background: "#FDEDEB", color: "#E8483A", fontSize: 13, fontWeight: 600, marginBottom: 16 }}>
          {reportError}
        </div>
      )}

      <div style={{ background: "#fff", borderRadius: 14, border: `1px solid ${BORDER}`, padding: "10px 18px", marginBottom: 20, display: "flex", flexWrap: "wrap", gap: 16, alignItems: "center" }}>
        <span style={{ fontSize: 10.5, fontWeight: 700, color: TEXT2, textTransform: "uppercase", letterSpacing: 0.8 }}>Color guide:</span>
        {[["#2ECC91", "Normal"], ["#F5C242", "Mild concern"], ["#FF9F43", "See doctor soon"], ["#E8483A", "Urgent"]].map(([c, l]) => (
          <div key={l} style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <span style={{ width: 10, height: 10, borderRadius: "50%", background: c, display: "inline-block" }} />
            <span style={{ fontSize: 11.5, color: TEXT2 }}>{l}</span>
          </div>
        ))}
      </div>

      {/* SECTION 1: Diagnosis Hero */}
      <div style={{ background: `linear-gradient(140deg, ${NAVY} 0%, #0D2B4E 55%, #091929 100%)`, borderRadius: 24, padding: "28px 26px", marginBottom: 20, position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, opacity: 0.1, backgroundImage: `radial-gradient(circle at 20% 50%, ${BLUE}99, transparent 40%), radial-gradient(circle at 80% 50%, ${MINT}88, transparent 40%)` }} />
        <div style={{ position: "relative" }}>
          <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1.4, color: "rgba(255,255,255,0.35)", marginBottom: 12 }}>Section 1 · What is my diagnosis?</div>
          <div style={{ display: "flex", alignItems: "flex-start", gap: 20, flexWrap: "wrap" }}>
            <div style={{ flex: 1, minWidth: 220 }}>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 14 }}>
                <span style={{ fontSize: 11, fontWeight: 700, padding: "5px 14px", borderRadius: 20, background: `${urgency.color}cc`, color: "#fff" }}>{urgency.level}</span>
                <span style={{ fontSize: 11, fontWeight: 700, padding: "5px 14px", borderRadius: 20, background: "rgba(255,255,255,0.12)", color: "#fff" }}>{confidencePct}% confidence</span>
              </div>
              <h2 style={{ fontSize: 32, fontWeight: 400, color: "#fff", margin: "0 0 12px", fontFamily: SERIF }}>{classification.name}</h2>
              <p style={{ fontSize: 14, color: "rgba(255,255,255,0.7)", lineHeight: 1.7, margin: "0 0 16px", maxWidth: 420 }}>{urgency.message}</p>
              <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "rgba(255,255,255,0.5)" }}>
                <Clock size={14} /> Recommended: <strong style={{ color: "#fff" }}>{urgency.timeframe}</strong>
              </div>
            </div>
            <div style={{ textAlign: "center", flexShrink: 0 }}>
              <Ring value={ppi.score / ppiMax} size={110} stroke={10} color={ppiC}>
                <div style={{ fontSize: 26, fontWeight: 700, color: "#fff", fontFamily: MONO, lineHeight: 1 }}>{ppi.score.toFixed(1)}</div>
                <div style={{ fontSize: 10, color: "rgba(255,255,255,0.5)", marginTop: 2 }}>pain / {ppiMax}</div>
              </Ring>
              <div style={{ fontSize: 11.5, color: "rgba(255,255,255,0.65)", marginTop: 8, fontWeight: 600 }}>{ppi.label}</div>
              <div style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", marginTop: 2 }}>Pain Intensity</div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 10, marginTop: 20, flexWrap: "wrap" }}>
            <button onClick={() => router.push("/Component1/assistant")} style={{ display: "flex", alignItems: "center", gap: 7, padding: "10px 18px", borderRadius: 999, background: "rgba(255,255,255,0.92)", border: "none", cursor: "pointer", fontSize: 12.5, fontWeight: 600, color: NAVY, fontFamily: FONT }}>
              <MessageSquare size={14} color={MINT} /> Ask AI Assistant
            </button>
            <button onClick={() => router.push("/Component1/progress")} style={{ display: "flex", alignItems: "center", gap: 7, padding: "10px 18px", borderRadius: 999, background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.18)", cursor: "pointer", fontSize: 12.5, fontWeight: 600, color: "#fff", fontFamily: FONT }}>
              <TrendingUp size={14} /> Track Progress
            </button>
            <button onClick={downloadReport} disabled={reportLoading} style={{ display: "flex", alignItems: "center", gap: 7, padding: "10px 18px", borderRadius: 999, background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.18)", cursor: reportLoading ? "not-allowed" : "pointer", fontSize: 12.5, fontWeight: 600, color: "#fff", fontFamily: FONT }}>
              <Download size={14} /> {reportLoading ? "Generating…" : "PDF Report"}
            </button>
          </div>
        </div>
      </div>

      {/* SECTION 2: How this feels */}
      <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1.3, color: TEXT2, marginBottom: 12 }}>Section 2 · How does this feel?</div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
        <GlassCard>
          <div style={{ fontSize: 10.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, color: MINT, marginBottom: 16 }}>Your Pain Level (PPI)</div>
          <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
            <Ring value={ppi.score / ppiMax} size={104} stroke={10} color={ppiC}>
              <div style={{ fontSize: 22, fontWeight: 700, color: TEXT, fontFamily: MONO }}>{ppi.score.toFixed(1)}</div>
              <div style={{ fontSize: 9.5, color: TEXT2 }}>out of {ppiMax}</div>
            </Ring>
            <div>
              <SevBadge label={ppi.label} color={ppiC} />
              <p style={{ fontSize: 12.5, color: TEXT2, lineHeight: 1.65, margin: "10px 0 0" }}>Combined pain indicator from redness, sores, and tissue stiffness.</p>
            </div>
          </div>
          <div style={{ marginTop: 16 }}>
            <div style={{ display: "flex", marginBottom: 6 }}>
              {SEV.map((c, i) => (
                <div key={i} style={{ flex: 1, height: 4, borderRadius: i === 0 ? "4px 0 0 4px" : i === 3 ? "0 4px 4px 0" : 0, background: c, opacity: ppiC === c ? 1 : 0.25 }} />
              ))}
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 9.5, color: TEXT2 }}>
              <span>No pain</span><span>Mild</span><span>Moderate</span><span>Severe</span>
            </div>
          </div>
        </GlassCard>

        <GlassCard>
          <div style={{ fontSize: 10.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, color: MINT, marginBottom: 16 }}>How Daily Life Is Affected</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {fisRows.map(f => {
              const c = sevColor(f.value);
              return (
                <div key={f.label}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: TEXT }}>{f.label}</span>
                    <span style={{ fontSize: 12.5, color: c, fontWeight: 700, fontFamily: MONO }}>{Math.round(f.value * 100)}%</span>
                  </div>
                  <Meter value={f.value} color={c} height={9} />
                  <p style={{ fontSize: 11, color: TEXT2, margin: "5px 0 0", lineHeight: 1.55 }}>{f.note}</p>
                </div>
              );
            })}
          </div>
        </GlassCard>
      </div>

      {/* SECTION 3: Biomarkers */}
      <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1.3, color: TEXT2, marginBottom: 12 }}>Section 3 · What the AI found in your photo</div>
      <GlassCard style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 10.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, color: MINT, marginBottom: 18 }}>Detailed Findings — In Plain English</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 14 }}>
          {biomarkers.map(b => {
            const c = sevColor(b.value);
            const pct = Math.round(b.value * 100);
            const tier = b.value < 0.25 ? "Low" : b.value < 0.5 ? "Mild" : b.value < 0.75 ? "High" : "Critical";
            return (
            <div
                key={b.key}
                onClick={() => router.push(`/Component1/results/visual/${b.key}`)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => { if (e.key === "Enter") router.push(`/Component1/results/visual/${b.key}`); }}
                style={{ padding: "16px 18px", borderRadius: 16, border: `1px solid ${BORDER}`, background: "#FAFCFF", position: "relative", overflow: "hidden", cursor: "pointer", transition: "box-shadow .15s, transform .15s" }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = "0 4px 14px rgba(21,101,192,0.10)"; (e.currentTarget as HTMLElement).style.transform = "translateY(-1px)"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = "none"; (e.currentTarget as HTMLElement).style.transform = "translateY(0)"; }}
              >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: TEXT, marginBottom: 2 }}>{b.label}</div>
                <div style={{ fontSize: 10.5, color: TEXT2 }}>{b.plain}</div>
              </div>
              <div style={{ fontSize: 22, fontWeight: 700, color: c, fontFamily: MONO, flexShrink: 0, marginLeft: 10 }}>{pct}<span style={{ fontSize: 12 }}>%</span></div>
            </div>
            <Meter value={b.value} color={c} height={7} />
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginTop: 10 }}>
              <p style={{ fontSize: 11.5, color: TEXT2, lineHeight: 1.55, margin: 0, flex: 1 }}>{b.note}</p>
              <SevBadge label={tier} color={c} />
            </div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 4, marginTop: 10, fontSize: 10.5, fontWeight: 700, color: BLUE }}>
              What does this mean? <ChevronRight size={12} />
            </div>
          </div>
        );
      })}
        </div>
      </GlassCard>

      {/* SECTION 4: Care plan */}
      <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1.3, color: TEXT2, marginBottom: 12 }}>Section 4 · What should you do next?</div>
      <GlassCard style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 10.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, color: MINT, marginBottom: 18 }}>Your Personalized Care Plan</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 14 }}>
          {txTiers.map(tier => tier.items?.length ? (
            <div key={tier.title} style={{ borderRadius: 16, padding: "16px 18px", background: tier.bg, border: `1px solid ${tier.color}20` }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                <div style={{ width: 32, height: 32, borderRadius: 9, background: `${tier.color}18`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <tier.Icon size={15} color={tier.color} />
                </div>
                <span style={{ fontSize: 13, fontWeight: 700, color: tier.color }}>{tier.title}</span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
                {tier.items.map((item, i) => (
                  <div key={i} style={{ display: "flex", gap: 9, alignItems: "flex-start" }}>
                    <span style={{ width: 6, height: 6, borderRadius: 3, background: tier.color, marginTop: 6, flexShrink: 0 }} />
                    <span style={{ fontSize: 12.5, color: TEXT, lineHeight: 1.55 }}>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : null)}
        </div>
      </GlassCard>

      {/* SECTION 5: Technical */}
      <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1.3, color: TEXT2, marginBottom: 12 }}>Section 5 · Technical analysis</div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
        <GlassCard onClick={() => router.push("/Component1/results/visual")}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
            <div style={{ fontSize: 10.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, color: MINT }}>Biomarker Overview (Radar)</div>
          </div>
          <p style={{ fontSize: 11.5, color: TEXT2, marginBottom: 14, lineHeight: 1.55 }}>Each axis shows the strength of that signal. Closer to edge = stronger finding.</p>
          <ResponsiveContainer width="100%" height={220}>
            <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="58%" margin={{ top: 10, right: 30, bottom: 10, left: 30 }}>
              <PolarGrid stroke="rgba(21,101,192,0.08)" />
              <PolarAngleAxis dataKey="label" tick={{ fontSize: 10.5, fill: TEXT2, fontFamily: FONT }} />
              <PolarRadiusAxis angle={90} domain={[0, 100]} tick={false} axisLine={false} />
              <Radar dataKey="value" stroke={BLUE} fill={BLUE} fillOpacity={0.15} dot={{ fill: BLUE, r: 3, strokeWidth: 0 }} />
            </RadarChart>
          </ResponsiveContainer>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 4, marginTop: 10, fontSize: 10.5, fontWeight: 700, color: BLUE }}>
            View full breakdown →
          </div>
        </GlassCard>

        <GlassCard>
          <div style={{ fontSize: 10.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, color: MINT, marginBottom: 8 }}>Diagnosis Probabilities</div>
          <p style={{ fontSize: 11.5, color: TEXT2, marginBottom: 14, lineHeight: 1.55 }}>How confident the AI is about each possible diagnosis. Longest bar = primary finding.</p>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={probData} layout="vertical" margin={{ left: 4, right: 32, top: 0, bottom: 0 }}>
              <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 9.5, fill: TEXT2 }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="name" width={124} tick={{ fontSize: 10.5, fill: TEXT, fontFamily: FONT }} axisLine={false} tickLine={false} />
              <Tooltip formatter={(v) => [`${Number(v)}%`, "Confidence"]} />
              <Bar dataKey="value" radius={[0, 6, 6, 0]} barSize={14}>
                {probData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 12 }}>
            {Object.entries(CLASS_COLORS).map(([name, color]) => (
              <div key={name} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: color, display: "inline-block" }} />
                <span style={{ fontSize: 10.5, color: TEXT2 }}>{name}</span>
              </div>
            ))}
          </div>
        </GlassCard>
      </div>

      {/* AI Summary */}
      <GlassCard style={{ borderLeft: `4px solid ${MINT}` }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, flexWrap: "wrap", marginBottom: 14 }}>
          <div style={{ fontSize: 10.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, color: MINT }}>AI Clinical Summary</div>
          <button onClick={downloadReport} disabled={reportLoading}
            style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", borderRadius: 999, background: BLUE_TINT, border: `1px solid ${BLUE}25`, cursor: reportLoading ? "not-allowed" : "pointer", fontSize: 12, fontWeight: 600, color: BLUE, fontFamily: FONT, flexShrink: 0 }}>
            <Download size={13} /> {reportLoading ? "Generating…" : "Save PDF"}
          </button>
        </div>
        <p style={{ fontSize: 14, color: TEXT, lineHeight: 1.8, marginBottom: 18 }}>{result.assistant_message}</p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
          <button onClick={() => router.push("/Component1/assistant")} style={{ display: "flex", alignItems: "center", gap: 6, padding: "10px 18px", borderRadius: 999, background: `linear-gradient(135deg, ${MINT}, #0B7A70)`, border: "none", cursor: "pointer", fontSize: 12.5, fontWeight: 600, color: "#fff", fontFamily: FONT }}>
            <Mic size={14} /> Talk to AI Assistant
          </button>
          <button onClick={() => router.push("/Component1/compare")} style={{ display: "flex", alignItems: "center", gap: 6, padding: "10px 18px", borderRadius: 999, background: BLUE_TINT, border: `1px solid ${BLUE}25`, cursor: "pointer", fontSize: 12.5, fontWeight: 600, color: BLUE, fontFamily: FONT }}>
            <GitCompare size={14} /> Before & After
          </button>
          <button onClick={() => router.push("/Component1/progress")} style={{ display: "flex", alignItems: "center", gap: 6, padding: "10px 18px", borderRadius: 999, background: MINT_TINT, border: `1px solid ${MINT}25`, cursor: "pointer", fontSize: 12.5, fontWeight: 600, color: MINT, fontFamily: FONT }}>
            <TrendingUp size={14} /> Track Progress
          </button>
        </div>
      </GlassCard>
    </div>
  );
}

export default function Component1ResultsPage() {
  const router = useRouter();
  const [result, setResult] = useState<IpeResult | null | undefined>(undefined);

  useEffect(() => {
    setResult(loadResult());
  }, []);

  return (
    <SidebarLayout title="Analysis Results">
      {result === undefined && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "60vh", fontFamily: FONT, fontSize: 13, color: TEXT2 }}>
          Loading your result…
        </div>
      )}
      {result === null && (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "70vh", padding: 40, textAlign: "center", fontFamily: FONT }}>
          <div style={{ width: 80, height: 80, borderRadius: 22, background: BLUE_TINT, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 20 }}>
            <Camera size={36} color={BLUE} strokeWidth={1.4} />
          </div>
          <h2 style={{ fontSize: 22, fontWeight: 400, color: NAVY, marginBottom: 8, fontFamily: SERIF }}>No results yet</h2>
          <p style={{ fontSize: 14, color: TEXT2, marginBottom: 28, maxWidth: 320, lineHeight: 1.65 }}>Upload an oral scan to see your AI-powered clinical analysis here.</p>
          <button onClick={() => router.push("/Component1/upload")} style={{ display: "flex", alignItems: "center", gap: 8, padding: "13px 30px", borderRadius: 999, background: `linear-gradient(135deg, ${BLUE}, ${BLUE_DEEP})`, border: "none", color: "#fff", fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: FONT, boxShadow: `0 8px 28px ${BLUE}40` }}>
            <Camera size={16} /> Start New Scan
          </button>
        </div>
      )}
      {result && <ResultsContent result={result} />}
    </SidebarLayout>
  );
}
