"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import {
  Heart, Camera, LayoutDashboard, BarChart2, TrendingUp, GitCompare,
  MessageSquare, Stethoscope, Menu, X, Clock, AlertTriangle, CheckCircle2,
  Droplet, ScanSearch, Activity, ChevronRight,
} from "lucide-react";
import {
  AreaChart, Area, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer,
} from "recharts";
import { loadResult, type IpeResult } from "../_lib/ipe-ui";

/* ── Palette (exact match) ───────────────────────────────────── */
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

/* Visit history is stored out of a fixed /10 scale — matches your existing
   progress/page.tsx exactly, since Visit records don't carry their own ppi.max. */
function ppiColorV(v: number) {
  if (v <= 2) return SEV[0]; if (v <= 4) return SEV[1]; if (v <= 6.5) return SEV[2]; return SEV[3];
}
function ppiLabelV(v: number) {
  if (v <= 2) return "No Pain"; if (v <= 4) return "Mild"; if (v <= 6.5) return "Moderate"; if (v <= 8) return "Severe"; return "Critical";
}
/* Current live result's ppi uses its own real ppi.max from the API. */
function ppiColorResult(v: number, max: number) {
  const pct = v / max;
  if (pct <= 0.2) return SEV[0]; if (pct <= 0.4) return SEV[1]; if (pct <= 0.65) return SEV[2]; return SEV[3];
}

type Visit = {
  id: string; date: string; classification: string; ppi: number;
  fis_speech: number; fis_swallow: number; fis_mouth: number;
  erythema: number; ulceration: number; texture: number;
};
function loadVisits(): Visit[] {
  try { const r = localStorage.getItem("ipe_visits"); return r ? JSON.parse(r) : []; } catch { return []; }
}

function GlassCard({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{ background: "#fff", borderRadius: 20, border: `1px solid ${BORDER}`, boxShadow: "0 2px 12px rgba(21,101,192,0.06), 0 1px 3px rgba(0,0,0,0.04)", padding: 22, ...style }}>
      {children}
    </div>
  );
}
function SevBadge({ label, color }: { label: string; color: string }) {
  return <span style={{ fontSize: 10.5, fontWeight: 700, padding: "3px 10px", borderRadius: 20, background: `${color}18`, color, letterSpacing: 0.3 }}>{label}</span>;
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

/* ── Sidebar shell (identical across Dashboard/Results/Progress/Compare/Assistant) ── */
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

/* ── Dashboard content ───────────────────────────────────────── */
function DashboardContent({ result, visits }: { result: IpeResult | null; visits: Visit[] }) {
  const router = useRouter();
  const latest = visits[visits.length - 1];
  const prev = visits.length > 1 ? visits[visits.length - 2] : null;
  const improving = prev && latest ? latest.ppi < prev.ppi : null;
  const ppiMax = result?.ppi.max ?? 10;

  return (
    <div style={{ padding: "28px 26px 48px", maxWidth: 980, margin: "0 auto", fontFamily: FONT }}>
      <div style={{ marginBottom: 26, display: "flex", alignItems: "flex-end", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <div>
          <button
            onClick={() => router.push("/home")}
            style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", cursor: "pointer", padding: "4px 0 8px", color: TEXT2, fontSize: 12.5, fontWeight: 600, fontFamily: FONT }}
            onMouseEnter={(e) => (e.currentTarget.style.color = BLUE)}
            onMouseLeave={(e) => (e.currentTarget.style.color = TEXT2)}
          >
            <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
              <path d="M2 7L8 2l6 5M3.5 6v7h9V6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Back to Home
          </button>
          <p style={{ fontSize: 11.5, color: TEXT2, marginBottom: 5 }}>
            {new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
          </p>
          <h1 style={{ fontSize: 24, fontWeight: 400, color: NAVY, margin: 0, fontFamily: SERIF }}>Patient Dashboard</h1>
        </div>
        <button onClick={() => router.push("/Component1/upload")}
          style={{ display: "flex", alignItems: "center", gap: 8, padding: "11px 20px", borderRadius: 999, background: `linear-gradient(135deg, ${BLUE}, ${BLUE_DEEP})`, border: "none", color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: FONT, boxShadow: `0 4px 16px ${BLUE}40` }}>
          <Camera size={15} /> New Scan
        </button>
      </div>

      {result && (
        <div style={{ background: `${result.urgency.color}0D`, border: `1px solid ${result.urgency.color}28`, borderRadius: 16, padding: "13px 18px", marginBottom: 22, display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <div style={{ width: 9, height: 9, borderRadius: "50%", background: result.urgency.color, flexShrink: 0, boxShadow: `0 0 8px ${result.urgency.color}88` }} />
          <span style={{ fontSize: 13, fontWeight: 700, color: result.urgency.color }}>{result.urgency.level}</span>
          <span style={{ fontSize: 12.5, color: TEXT2 }}>{result.urgency.message}</span>
          <button onClick={() => router.push("/Component1/results")} style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 4, background: "none", border: "none", cursor: "pointer", color: BLUE, fontSize: 12.5, fontWeight: 700, fontFamily: FONT, flexShrink: 0 }}>
            View full results <ChevronRight size={13} />
          </button>
        </div>
      )}

      {result && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: 14, marginBottom: 22 }}>
          <StatTile label="Pain Score (PPI)" value={`${result.ppi.score.toFixed(1)}/${ppiMax}`} sub={result.ppi.label} color={ppiColorResult(result.ppi.score, ppiMax)} icon={<Droplet size={14} color={ppiColorResult(result.ppi.score, ppiMax)} />} />
          <StatTile label="Diagnosis" value={result.classification.name} sub={`${Math.round(result.classification.confidence)}% confidence`} color={CLASS_COLORS[result.classification.name] ?? BLUE} icon={<ScanSearch size={14} color={CLASS_COLORS[result.classification.name] ?? BLUE} />} />
          <StatTile label="Oral Function" value={`${Math.round((1 - (result.fis.speech + result.fis.swallowing + result.fis.mouth) / 3) * 100)}%`} sub="Normal function retained" color={MINT} icon={<Activity size={14} color={MINT} />} />
          <StatTile label="Appointment" value={result.urgency.timeframe} sub="Recommended timing" color={BLUE} icon={<Clock size={14} color={BLUE} />} />
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
        <GlassCard>
          <div style={{ fontSize: 10.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1.1, color: MINT, marginBottom: 14 }}>Pain Score Trend</div>
          {visits.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={116}>
                <AreaChart data={visits.map((v, i) => ({ visit: `V${i + 1}`, ppi: v.ppi }))}>
                  <defs>
                    <linearGradient id="ppiGradDB" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={BLUE} stopOpacity={0.18} />
                      <stop offset="100%" stopColor={BLUE} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(21,101,192,0.05)" />
                  <XAxis dataKey="visit" tick={{ fontSize: 10, fill: TEXT2 }} axisLine={false} tickLine={false} />
                  <YAxis domain={[0, 10]} tick={{ fontSize: 10, fill: TEXT2 }} axisLine={false} tickLine={false} width={22} />
                  <Tooltip formatter={(v) => [`${Number(v).toFixed(1)}/10`, "Pain (PPI)"]} />
                  <Area type="monotone" dataKey="ppi" stroke={BLUE} fill="url(#ppiGradDB)" strokeWidth={2.5} dot={{ fill: BLUE, r: 4, strokeWidth: 2, stroke: "#fff" }} />
                </AreaChart>
              </ResponsiveContainer>
              {improving !== null && (
                <div style={{ marginTop: 10, display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: improving ? SEV[0] : SEV[2] }}>{improving ? "↓ Improving" : "↑ Worsening"}</span>
                  <span style={{ fontSize: 12, color: TEXT2 }}>since last visit</span>
                </div>
              )}
            </>
          ) : (
            <div style={{ padding: "20px 0", textAlign: "center", fontSize: 12.5, color: TEXT2 }}>
              No visit history yet — complete a scan to start tracking your trend.
            </div>
          )}
          <button onClick={() => router.push("/Component1/progress")} style={{ marginTop: 12, width: "100%", background: "none", border: `1px solid ${BORDER}`, borderRadius: 12, padding: "9px", fontSize: 12.5, fontWeight: 600, color: BLUE, cursor: "pointer", fontFamily: FONT }}>
            View full journey →
          </button>
        </GlassCard>

        <GlassCard>
          <div style={{ fontSize: 10.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1.1, color: MINT, marginBottom: 14 }}>Recent Visits</div>
          {visits.length > 0 ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {visits.slice(-3).reverse().map((v, i, arr) => (
                <div key={v.id} style={{ display: "flex", alignItems: "center", gap: 11, padding: "9px 0", borderBottom: i < arr.length - 1 ? `1px solid ${BORDER}` : undefined }}>
                  <div style={{ width: 40, height: 40, borderRadius: 11, background: `${ppiColorV(v.ppi)}12`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, border: `1px solid ${ppiColorV(v.ppi)}20` }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: ppiColorV(v.ppi), fontFamily: MONO }}>{v.ppi.toFixed(1)}</span>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12.5, fontWeight: 600, color: TEXT }}>{v.classification}</div>
                    <div style={{ fontSize: 11, color: TEXT2 }}>{v.date}</div>
                  </div>
                  <SevBadge label={ppiLabelV(v.ppi)} color={ppiColorV(v.ppi)} />
                </div>
              ))}
            </div>
          ) : (
            <div style={{ padding: "20px 0", textAlign: "center", fontSize: 12.5, color: TEXT2 }}>
              No visits recorded yet.
            </div>
          )}
          <button onClick={() => router.push("/Component1/compare")} style={{ marginTop: 12, width: "100%", background: "none", border: `1px solid ${BORDER}`, borderRadius: 12, padding: "9px", fontSize: 12.5, fontWeight: 600, color: MINT, cursor: "pointer", fontFamily: FONT }}>
            Before & After comparison →
          </button>
        </GlassCard>
      </div>

      {result && (
        <GlassCard style={{ marginBottom: 22 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16, flexWrap: "wrap", gap: 8 }}>
            <div>
              <div style={{ fontSize: 10.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1.1, color: MINT, marginBottom: 4 }}>Your Active Care Plan</div>
              <div style={{ fontSize: 13, color: TEXT2 }}>Based on your latest analysis · {result.classification.name}</div>
            </div>
            <button onClick={() => router.push("/Component1/results")} style={{ display: "flex", alignItems: "center", gap: 4, background: "none", border: "none", cursor: "pointer", color: BLUE, fontSize: 12.5, fontWeight: 600, fontFamily: FONT }}>
              Full results <ChevronRight size={13} />
            </button>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12 }}>
            {[
              { title: "Do Right Now", items: result.treatment_plan.immediate.slice(0, 2), color: "#E8483A", bg: "#FDEDEB", Icon: AlertTriangle },
              { title: "This Week", items: result.treatment_plan.short_term.slice(0, 2), color: "#FF9F43", bg: "#FFF3E4", Icon: Clock },
              { title: "Clinical Steps", items: result.treatment_plan.clinical.slice(0, 2), color: BLUE, bg: BLUE_TINT, Icon: Stethoscope },
              { title: "Lifestyle", items: result.treatment_plan.lifestyle.slice(0, 2), color: MINT, bg: MINT_TINT, Icon: CheckCircle2 },
            ].map(tier => tier.items?.length ? (
              <div key={tier.title} style={{ borderRadius: 14, padding: "14px 16px", background: tier.bg, border: `1px solid ${tier.color}18` }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10, fontSize: 12, fontWeight: 700, color: tier.color }}>
                  <tier.Icon size={13} color={tier.color} /> {tier.title}
                </div>
                {tier.items.map((item, i) => (
                  <div key={i} style={{ display: "flex", gap: 7, marginBottom: 6, fontSize: 11.5, color: TEXT, lineHeight: 1.55 }}>
                    <span style={{ width: 5, height: 5, borderRadius: 3, background: tier.color, marginTop: 6, flexShrink: 0 }} />
                    {item}
                  </div>
                ))}
              </div>
            ) : null)}
          </div>
        </GlassCard>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 12, marginBottom: 22 }}>
        {[
          { label: "New Scan", sub: "Upload & analyze", Icon: Camera, color: BLUE, href: "/Component1/upload" },
          { label: "AI Assistant", sub: "Get guidance", Icon: MessageSquare, color: "#F59E0B", href: "/Component1/assistant" },
          { label: "Progress", sub: "Track recovery", Icon: TrendingUp, color: "#8B5CF6", href: "/Component1/progress" },
          { label: "Before & After", sub: "Visual compare", Icon: GitCompare, color: MINT, href: "/Component1/compare" },
        ].map(({ label, sub, Icon, color, href }) => (
          <button key={href} onClick={() => router.push(href)}
            style={{ background: "#fff", border: `1px solid ${BORDER}`, borderRadius: 16, padding: "16px", textAlign: "left", cursor: "pointer", fontFamily: FONT, transition: "all .2s", boxShadow: "0 2px 8px rgba(21,101,192,0.04)" }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-2px)"; (e.currentTarget as HTMLButtonElement).style.boxShadow = `0 8px 20px ${color}18`; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.transform = "translateY(0)"; (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 2px 8px rgba(21,101,192,0.04)"; }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: `${color}12`, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 10 }}>
              <Icon size={16} color={color} />
            </div>
            <div style={{ fontSize: 12.5, fontWeight: 600, color: TEXT, marginBottom: 3 }}>{label}</div>
            <div style={{ fontSize: 10.5, color: TEXT2 }}>{sub}</div>
          </button>
        ))}
      </div>

      <div style={{ padding: "22px 26px", borderRadius: 20, background: `linear-gradient(135deg, ${NAVY}, #0D2B4E)`, display: "flex", alignItems: "center", gap: 18, flexWrap: "wrap" }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 14.5, fontWeight: 600, color: "#fff", marginBottom: 5, fontFamily: SERIF }}>Questions about your results?</div>
          <div style={{ fontSize: 12.5, color: "rgba(255,255,255,0.45)" }}>Our AI assistant can explain findings and guide next steps.</div>
        </div>
        <button onClick={() => router.push("/Component1/assistant")} style={{ display: "flex", alignItems: "center", gap: 8, padding: "11px 20px", borderRadius: 999, background: MINT, border: "none", cursor: "pointer", fontSize: 13, fontWeight: 600, color: "#fff", fontFamily: FONT, flexShrink: 0, boxShadow: `0 4px 14px ${MINT}44` }}>
          <MessageSquare size={15} /> Message Care Team
        </button>
      </div>
    </div>
  );
}

export default function Component1DashboardPage() {
  const [result, setResult] = useState<IpeResult | null>(null);
  const [visits, setVisits] = useState<Visit[]>([]);

  useEffect(() => {
    setResult(loadResult());
    setVisits(loadVisits());
  }, []);

  return (
    <SidebarLayout title="Patient Dashboard">
      <DashboardContent result={result} visits={visits} />
    </SidebarLayout>
  );
}