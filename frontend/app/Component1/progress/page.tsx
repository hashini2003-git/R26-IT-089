"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import {
  Heart, Camera, LayoutDashboard, BarChart2, TrendingUp, GitCompare,
  MessageSquare, Stethoscope, Menu, X, ChevronRight, CheckCircle2,
  Droplet, FileText, AlertCircle,
} from "lucide-react";
import {
  AreaChart, Area, CartesianGrid, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import { loadResult, type IpeResult } from "../_lib/ipe-ui";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

/* ── Palette ─────────────────────────────────────────────────── */
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
/* Real 5-tier severity scale from your backend's _lib/ipe-ui.tsx (C.sev) —
   different from the 4-tier scale used elsewhere; matches your existing progress logic exactly. */
const SEV5 = ["#2ECC91", "#F5C242", "#FF9F43", "#FF6B5B", "#E8483A"];
const CLASS_COLORS: Record<string, string> = {
  "Normal": "#2ECC91",
  "Variation from Normal": "#F5C242",
  "OPMD": "#FF9F43",
  "Oral Cancer": "#E8483A",
};
const FONT = "'Inter', system-ui, sans-serif";
const SERIF = "'DM Serif Display', Georgia, serif";
const MONO = "'DM Mono', monospace";

function ppiColor(p: number) { return p <= 1 ? SEV5[0] : p <= 3 ? SEV5[1] : p <= 5 ? SEV5[2] : p <= 7.5 ? SEV5[3] : SEV5[4]; }
function ppiLabel(p: number) { return p <= 1 ? "No Pain" : p <= 3 ? "Mild" : p <= 5 ? "Moderate" : p <= 7.5 ? "Severe" : "Critical"; }
function sevColor(v: number) { if (v < 0.25) return SEV5[0]; if (v < 0.5) return SEV5[1]; if (v < 0.75) return SEV5[2]; return SEV5[4]; }

type Visit = {
  id: string; date: string; classification: string; ppi: number;
  fis_speech: number; fis_swallow: number; fis_mouth: number;
  erythema: number; ulceration: number; texture: number;
};
function loadVisits(): Visit[] {
  try { const r = localStorage.getItem("ipe_visits"); return r ? JSON.parse(r) : []; } catch { return []; }
}
function saveVisits(v: Visit[]) { try { localStorage.setItem("ipe_visits", JSON.stringify(v)); } catch {} }
function resultToVisit(r: IpeResult): Visit {
  return {
    id: Date.now().toString(),
    date: new Date().toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }),
    classification: r.classification.name,
    ppi: r.ppi.score,
    fis_speech: r.fis.speech, fis_swallow: r.fis.swallowing, fis_mouth: r.fis.mouth,
    erythema: r.visual_features.erythema, ulceration: r.visual_features.ulceration, texture: r.visual_features.texture,
  };
}

function GlassCard({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return <div style={{ background: "#fff", borderRadius: 20, border: `1px solid ${BORDER}`, boxShadow: "0 2px 12px rgba(21,101,192,0.06), 0 1px 3px rgba(0,0,0,0.04)", padding: 22, ...style }}>{children}</div>;
}
function StatTile({ label, value, sub, color, icon }: { label: string; value: string; sub?: string; color: string; icon?: React.ReactNode }) {
  return (
    <div style={{ background: "#fff", borderRadius: 16, border: `1px solid ${BORDER}`, boxShadow: "0 2px 10px rgba(21,101,192,0.05)", padding: "18px 20px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
        {icon && <div style={{ width: 32, height: 32, borderRadius: 9, background: `${color}12`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{icon}</div>}
        <span style={{ fontSize: 10.5, fontWeight: 600, color: TEXT2, textTransform: "uppercase", letterSpacing: 0.6 }}>{label}</span>
      </div>
      <div style={{ fontSize: 24, fontWeight: 700, color, fontFamily: MONO, lineHeight: 1 }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: TEXT2, marginTop: 5 }}>{sub}</div>}
    </div>
  );
}

/* ── Sidebar shell (identical shape across all app pages) ───────── */
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

/* ── Progress content ────────────────────────────────────────── */
function ProgressContent({ result, visits, setVisits }: { result: IpeResult | null; visits: Visit[]; setVisits: (v: Visit[]) => void }) {
  const router = useRouter();
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  async function saveCurrentVisit() {
    if (!result) return;
    setSaving(true);
    try {
      const token = localStorage.getItem("oc_token");
      const res = await fetch(`${API}/progress/save`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({
          class_name: result.classification.name,
          confidence: result.classification.confidence,
          ppi: result.ppi.score,
          ppi_label: result.ppi.label,
          fis_speech: result.fis.speech,
          fis_swallow: result.fis.swallowing,
          fis_mouth: result.fis.mouth,
          erythema: result.visual_features.erythema,
          ulceration: result.visual_features.ulceration,
          texture: result.visual_features.texture,
          physio: result.visual_features.physio,
          urgency: result.urgency.timeframe,
        }),
      });
      const data = await res.json();
      if (!data.success) throw new Error("Save failed");
      const v = resultToVisit(result);
      v.id = data.id?.toString() ?? v.id;
      const updated = [...visits, v];
      setVisits(updated);
      saveVisits(updated);
      setSaved(true);
    } catch {
      // Backend save failed (offline, not logged in, etc.) — keep it locally, same as your existing page.
      const v = resultToVisit(result);
      const updated = [...visits, v];
      setVisits(updated);
      saveVisits(updated);
      setSaved(true);
    } finally {
      setSaving(false);
    }
  }

  function clearHistory() {
    if (confirm("Clear all visit history?")) {
      setVisits([]);
      saveVisits([]);
      setSaved(false);
    }
  }

  const chartData = visits.map((v, i) => ({ visit: `V${i + 1}`, date: v.date, ppi: v.ppi, speech: Math.round(v.fis_speech * 100), swallow: Math.round(v.fis_swallow * 100), erythema: Math.round(v.erythema * 100) }));
  const latestV = visits[visits.length - 1];
  const prevV = visits.length > 1 ? visits[visits.length - 2] : null;
  const ppiChange = prevV ? (latestV.ppi - prevV.ppi).toFixed(1) : null;
  const improving = ppiChange !== null && parseFloat(ppiChange) < 0;

  return (
    <div style={{ padding: "28px 26px 48px", maxWidth: 980, margin: "0 auto", fontFamily: FONT }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 26, flexWrap: "wrap", gap: 12 }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1.3, color: MINT, marginBottom: 5 }}>Recovery Tracking</div>
          <h1 style={{ fontSize: 26, fontWeight: 400, color: NAVY, margin: "0 0 4px", fontFamily: SERIF }}>Recovery Journey</h1>
          <p style={{ fontSize: 13, color: TEXT2, margin: 0 }}>{visits.length} visit{visits.length !== 1 ? "s" : ""} recorded · Charts need 2+ visits</p>
        </div>
        <div style={{ display: "flex", gap: 9, flexWrap: "wrap" }}>
          <button onClick={() => router.push("/Component1/compare")}
            style={{ display: "flex", alignItems: "center", gap: 6, padding: "10px 16px", borderRadius: 999, background: MINT_TINT, border: `1px solid ${MINT}28`, color: MINT, fontSize: 12.5, fontWeight: 600, cursor: "pointer", fontFamily: FONT }}>
            <GitCompare size={14} /> Before & After
          </button>
          {visits.length > 0 && (
            <button onClick={clearHistory}
              style={{ padding: "10px 16px", background: "#FDEDEB", border: "none", borderRadius: 999, fontSize: 12, fontWeight: 700, color: "#E8483A", cursor: "pointer", fontFamily: FONT }}>
              Clear history
            </button>
          )}
        </div>
      </div>

      {result && !saved && (
        <GlassCard style={{ marginBottom: 20, borderLeft: `3px solid ${MINT}` }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: MINT, marginBottom: 5 }}>Save today's analysis as a visit?</div>
          <div style={{ fontSize: 12.5, color: TEXT2, marginBottom: 14 }}>{result.classification.name} · PPI {result.ppi.score.toFixed(1)}/{result.ppi.max ?? 10} · {new Date().toLocaleDateString("en-GB")}</div>
          <button onClick={saveCurrentVisit} disabled={saving} style={{ background: saving ? "#9AA3AE" : `linear-gradient(135deg, ${MINT}, #0B7A70)`, border: "none", borderRadius: 14, padding: "12px 22px", fontSize: 13, fontWeight: 700, color: "#fff", cursor: saving ? "not-allowed" : "pointer", width: "100%", fontFamily: FONT }}>
            {saving ? "Saving…" : "+ Add to Progress History"}
          </button>
        </GlassCard>
      )}
      {saved && (
        <div style={{ marginBottom: 18, padding: "13px 18px", borderRadius: 14, background: "#E9F9F2", border: `1px solid ${SEV5[0]}30`, display: "flex", alignItems: "center", gap: 8 }}>
          <CheckCircle2 size={16} color={SEV5[0]} />
          <span style={{ fontSize: 13, fontWeight: 600, color: SEV5[0] }}>Visit saved to your progress history!</span>
        </div>
      )}

      <div style={{ marginBottom: 18, padding: "13px 18px", borderRadius: 14, background: BLUE_TINT, border: `1px solid ${BLUE}18`, display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
        <GitCompare size={15} color={BLUE} />
        <span style={{ fontSize: 12.5, color: TEXT2, flex: 1 }}>Your progress data is connected to the <strong style={{ color: BLUE }}>Before & After</strong> comparison view.</span>
        <button onClick={() => router.push("/Component1/compare")} style={{ background: "none", border: "none", cursor: "pointer", color: BLUE, fontSize: 12.5, fontWeight: 700, fontFamily: FONT, padding: 0, display: "flex", alignItems: "center", gap: 4 }}>
          Open comparison <ChevronRight size={13} />
        </button>
      </div>

      {visits.length >= 2 ? (
        <>
          {ppiChange && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 14, marginBottom: 20 }}>
              <StatTile label="Latest PPI" value={`${latestV.ppi.toFixed(1)}/10`} sub={ppiLabel(latestV.ppi)} color={ppiColor(latestV.ppi)} icon={<Droplet size={14} color={ppiColor(latestV.ppi)} />} />
              <StatTile label="Change" value={`${improving ? "↓" : "↑"} ${Math.abs(parseFloat(ppiChange))}`} sub={improving ? "Improving" : "Worsening"} color={improving ? SEV5[0] : SEV5[2]} icon={<TrendingUp size={14} color={improving ? SEV5[0] : SEV5[2]} />} />
              <StatTile label="Total Visits" value={String(visits.length)} sub="Recorded sessions" color={BLUE} icon={<FileText size={14} color={BLUE} />} />
              <StatTile label="Latest Redness" value={`${Math.round(latestV.erythema * 100)}%`} sub="Erythema level" color={sevColor(latestV.erythema)} icon={<AlertCircle size={14} color={sevColor(latestV.erythema)} />} />
            </div>
          )}

          <GlassCard style={{ marginBottom: 18 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14, flexWrap: "wrap", gap: 8 }}>
              <div>
                <div style={{ fontSize: 10.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, color: MINT, marginBottom: 4 }}>Pain Score Over Time</div>
                {ppiChange && <span style={{ fontSize: 12, fontWeight: 700, color: improving ? SEV5[0] : SEV5[2] }}>{improving ? `↓ Improved ${Math.abs(parseFloat(ppiChange))} pts` : `↑ Increased ${Math.abs(parseFloat(ppiChange))} pts`} since last visit</span>}
              </div>
            </div>
            <ResponsiveContainer width="100%" height={175}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="ppiArea2" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={BLUE} stopOpacity={0.18} />
                    <stop offset="100%" stopColor={BLUE} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(21,101,192,0.05)" />
                <XAxis dataKey="visit" tick={{ fontSize: 10, fill: TEXT2 }} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 10]} tick={{ fontSize: 10, fill: TEXT2 }} axisLine={false} tickLine={false} width={24} />
                <Tooltip formatter={(v) => [`${Number(v).toFixed(1)}/10`, "Pain (PPI)"]} />
                <Area type="monotone" dataKey="ppi" stroke={BLUE} fill="url(#ppiArea2)" strokeWidth={2.5} dot={{ fill: BLUE, r: 5, strokeWidth: 2, stroke: "#fff" }} />
              </AreaChart>
            </ResponsiveContainer>
          </GlassCard>

          <GlassCard style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 10.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, color: MINT, marginBottom: 14 }}>Functional Impact & Redness Over Time</div>
            <ResponsiveContainer width="100%" height={175}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="speechArea2" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={MINT} stopOpacity={0.18} />
                    <stop offset="100%" stopColor={MINT} stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="eryArea2" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={SEV5[2]} stopOpacity={0.15} />
                    <stop offset="100%" stopColor={SEV5[2]} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(21,101,192,0.05)" />
                <XAxis dataKey="visit" tick={{ fontSize: 10, fill: TEXT2 }} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: TEXT2 }} axisLine={false} tickLine={false} width={30} tickFormatter={v => `${v}%`} />
                <Tooltip formatter={(v) => [`${v}%`]} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                <Area type="monotone" dataKey="speech" name="Speech impact %" stroke={MINT} fill="url(#speechArea2)" strokeWidth={2} dot={{ fill: MINT, r: 4, strokeWidth: 2, stroke: "#fff" }} />
                <Area type="monotone" dataKey="erythema" name="Redness %" stroke={SEV5[2]} fill="url(#eryArea2)" strokeWidth={2} dot={{ fill: SEV5[2], r: 4, strokeWidth: 2, stroke: "#fff" }} />
              </AreaChart>
            </ResponsiveContainer>
          </GlassCard>

          <div style={{ fontSize: 14, fontWeight: 600, color: NAVY, marginBottom: 14, fontFamily: SERIF }}>Visit History</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {[...visits].reverse().map((v, i) => {
              const pc = ppiColor(v.ppi);
              const isLatest = i === 0;
              return (
                <GlassCard key={v.id} style={{ borderLeft: `4px solid ${pc}`, padding: "18px 20px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                        <span style={{ fontSize: 12, fontWeight: 600, color: TEXT2 }}>Visit {visits.length - i} · {v.date}</span>
                        {isLatest && <span style={{ background: MINT_TINT, color: MINT, fontSize: 10, fontWeight: 700, borderRadius: 20, padding: "2px 9px" }}>Latest</span>}
                      </div>
                      <div style={{ fontSize: 15, fontWeight: 600, color: CLASS_COLORS[v.classification] ?? TEXT }}>{v.classification}</div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: 28, fontWeight: 700, color: pc, fontFamily: MONO, lineHeight: 1 }}>{v.ppi.toFixed(1)}</div>
                      <div style={{ fontSize: 10.5, color: TEXT2 }}>/10 pain</div>
                    </div>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 9 }}>
                    {[["Speech", `${Math.round(v.fis_speech * 100)}%`], ["Swallowing", `${Math.round(v.fis_swallow * 100)}%`], ["Redness", `${Math.round(v.erythema * 100)}%`]].map(([l, val]) => (
                      <div key={l} style={{ background: BG, borderRadius: 11, padding: "9px 12px" }}>
                        <div style={{ fontSize: 10.5, color: TEXT2, marginBottom: 2 }}>{l}</div>
                        <div style={{ fontSize: 15, fontWeight: 700, color: TEXT, fontFamily: MONO }}>{val}</div>
                      </div>
                    ))}
                  </div>
                </GlassCard>
              );
            })}
          </div>
        </>
      ) : (
        <GlassCard style={{ textAlign: "center", padding: "56px 28px" }}>
          <div style={{ width: 78, height: 78, borderRadius: 22, background: BLUE_TINT, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 18px" }}>
            <TrendingUp size={34} color={BLUE} strokeWidth={1.4} />
          </div>
          <div style={{ fontSize: 20, fontWeight: 400, color: NAVY, marginBottom: 8, fontFamily: SERIF }}>Your Journey Starts Here</div>
          <div style={{ fontSize: 13.5, color: TEXT2, lineHeight: 1.65, marginBottom: 26, maxWidth: 300, margin: "0 auto 26px" }}>
            Analyze your first image, then save it here to start tracking your recovery. Charts appear after 2+ visits.
          </div>
          <button onClick={() => router.push("/Component1/upload")} style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "13px 30px", borderRadius: 999, background: `linear-gradient(135deg, ${BLUE}, ${BLUE_DEEP})`, border: "none", color: "#fff", fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: FONT, boxShadow: `0 8px 28px ${BLUE}40` }}>
            <Camera size={16} /> Analyze First Image
          </button>
        </GlassCard>
      )}

      <p style={{ textAlign: "center", fontSize: 11, color: TEXT2, lineHeight: 1.65, marginTop: 22 }}>
        Progress data is saved on this device only.<br />Show these charts to your doctor at your next visit.
      </p>
    </div>
  );
}

export default function Component1ProgressPage() {
  const [result, setResult] = useState<IpeResult | null>(null);
  const [visits, setVisitsState] = useState<Visit[]>([]);

  useEffect(() => {
    setResult(loadResult());
    setVisitsState(loadVisits());
  }, []);

  function setVisits(v: Visit[]) {
    setVisitsState(v);
  }

  return (
    <SidebarLayout title="Recovery Journey">
      <ProgressContent result={result} visits={visits} setVisits={setVisits} />
    </SidebarLayout>
  );
}