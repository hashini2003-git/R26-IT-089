"use client";

import React, { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import {
  Heart, Camera, LayoutDashboard, BarChart2, TrendingUp, GitCompare,
  MessageSquare, Stethoscope, Menu, X, ChevronLeft,
} from "lucide-react";

/* ── Palette (exact match to results/page.tsx — the approved desktop design) ── */
export const BLUE = "#1565C0";
export const BLUE_DEEP = "#0D47A1";
export const BLUE_TINT = "#E3EEF9";
export const MINT = "#0D9488";
export const MINT_TINT = "#E0F5F3";
export const NAVY = "#0B1F38";
export const BG = "#F4F8FD";
export const BORDER = "rgba(21,101,192,0.10)";
export const SIDEBAR_BG = "#0B1F38";
export const TEXT = "#0F2137";
export const TEXT2 = "#4A6070";
/* Severity palette — bold, clearly distinct so adjacent tiers never look alike */
export const SEV_GREEN = "#22C55E";   // Normal
export const SEV_YELLOW = "#FACC15";  // Mild Concern
export const SEV_ORANGE = "#F97316";  // See Doctor Soon
export const SEV_RED = "#EF4444";     // Urgent
export const SEV = [SEV_GREEN, SEV_YELLOW, SEV_ORANGE, SEV_RED];
export const FONT = "'Inter', system-ui, sans-serif";
export const SERIF = "'DM Serif Display', Georgia, serif";
export const MONO = "'DM Mono', monospace";

export const SEVERITY_LEVELS = [
  { min: 0, max: 0.25, color: SEV_GREEN, dot: "🟢", tier: "Low", label: "Normal" },
  { min: 0.25, max: 0.5, color: SEV_YELLOW, dot: "🟡", tier: "Mild", label: "Mild Concern" },
  { min: 0.5, max: 0.75, color: SEV_ORANGE, dot: "🟠", tier: "High", label: "See Doctor Soon" },
  { min: 0.75, max: 1, color: SEV_RED, dot: "🔴", tier: "Critical", label: "Urgent" },
];

export function getSeverity(v: number) {
  return SEVERITY_LEVELS.find((l) => v < l.max) ?? SEVERITY_LEVELS[SEVERITY_LEVELS.length - 1];
}

export function sevColor(v: number) {
  if (v < 0.25) return SEV[0];
  if (v < 0.5) return SEV[1];
  if (v < 0.75) return SEV[2];
  return SEV[3];
}
export function ppiColor(v: number, max: number) {
  const pct = v / max;
  if (pct <= 0.2) return SEV[0];
  if (pct <= 0.4) return SEV[1];
  if (pct <= 0.65) return SEV[2];
  return SEV[3];
}

/* ── Shared UI primitives (copied from results/page.tsx) ─────────────── */
export function Ring({ value, size = 120, stroke = 10, color, children }: { value: number; size?: number; stroke?: number; color: string; children?: React.ReactNode }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const target = Math.min(Math.max(value, 0), 1);
  // Animate from 0 on mount — without this the ring renders directly at its
  // final offset and the CSS transition below never has anything to
  // interpolate from, so it silently never plays.
  const [animated, setAnimated] = useState(0);
  useEffect(() => {
    const id = requestAnimationFrame(() => setAnimated(target));
    return () => cancelAnimationFrame(id);
  }, [target]);
  const offset = c * (1 - animated);
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

export function Meter({ value, color, height = 8 }: { value: number; color: string; height?: number }) {
  const target = Math.min(Math.max(value, 0), 1);
  const [animated, setAnimated] = useState(0);
  useEffect(() => {
    const id = requestAnimationFrame(() => setAnimated(target));
    return () => cancelAnimationFrame(id);
  }, [target]);
  return (
    <div style={{ width: "100%", height, borderRadius: height, background: "rgba(21,101,192,0.07)", overflow: "hidden" }}>
      <div style={{ width: `${Math.round(animated * 100)}%`, height: "100%", borderRadius: height, background: color, transition: "width 1s cubic-bezier(.4,0,.2,1)" }} />
    </div>
  );
}

/* ── Severity scale graph — shows patients exactly where their score sits ── */
export function SeverityScale({ value }: { value: number }) {
  const target = Math.min(Math.max(value, 0), 1) * 100;
  const [animated, setAnimated] = useState(0);
  useEffect(() => {
    const id = requestAnimationFrame(() => setAnimated(target));
    return () => cancelAnimationFrame(id);
  }, [target]);
  return (
    <div style={{ width: "100%" }}>
      <div style={{ position: "relative", height: 14, borderRadius: 8, overflow: "visible", display: "flex" }}>
        {SEVERITY_LEVELS.map((lvl) => (
          <div key={lvl.label} style={{ flex: 1, height: 14, background: lvl.color, opacity: 0.9 }} />
        ))}
        <div
          style={{
            position: "absolute", top: -7, left: `calc(${animated}% - 8px)`, width: 16, height: 16, borderRadius: "50%",
            background: "#fff", border: `3px solid ${getSeverity(value).color}`, boxShadow: "0 1px 4px rgba(0,0,0,0.25)",
            transition: "left 1s cubic-bezier(.4,0,.2,1)",
          }}
        />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", marginTop: 8 }}>
        {SEVERITY_LEVELS.map((lvl) => (
          <div key={lvl.label} style={{ textAlign: "center" }}>
            <div style={{ fontSize: 9.5, fontWeight: 700, color: lvl.color }}>{lvl.dot} {lvl.tier}</div>
            <div style={{ fontSize: 8.5, color: TEXT2, marginTop: 1 }}>{lvl.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function SevBadge({ label, color }: { label: string; color: string }) {
  return <span style={{ fontSize: 10.5, fontWeight: 700, padding: "3px 10px", borderRadius: 20, background: `${color}18`, color, letterSpacing: 0.3 }}>{label}</span>;
}

export function GlassCard({ children, style, onClick }: { children: React.ReactNode; style?: React.CSSProperties; onClick?: () => void }) {
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

/* ── Reveal on mount — small staggered fade/slide, matches Home page motion ── */
export function Reveal({ children, delay = 0, style }: { children: React.ReactNode; delay?: number; style?: React.CSSProperties }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 60 + delay);
    return () => clearTimeout(t);
  }, [delay]);
  return (
    <div style={{ opacity: visible ? 1 : 0, transform: visible ? "translateY(0)" : "translateY(14px)", transition: "opacity .5s ease, transform .5s ease", ...style }}>
      {children}
    </div>
  );
}

/* ── Responsive page container — tighter padding on phones, roomier on
   desktop, instead of one fixed padding value at every screen size ──────── */
export function PageContainer({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="px-4 py-5 sm:px-6 sm:py-7 md:px-6.5 md:py-7"
      style={{ maxWidth: 980, margin: "0 auto", fontFamily: FONT, paddingBottom: 48 }}
    >
      {children}
    </div>
  );
}

/* ── Detail page header: back link + eyebrow + serif title ───────────── */
export function DetailHeader({ eyebrow, title, subtitle, backHref = "/Component1/results" }: { eyebrow: string; title: string; subtitle?: string; backHref?: string }) {
  const router = useRouter();
  return (
    <div style={{ marginBottom: 22 }}>
      <button
        onClick={() => router.push(backHref)}
        style={{ display: "inline-flex", alignItems: "center", gap: 5, background: "none", border: "none", cursor: "pointer", padding: 0, marginBottom: 14, fontSize: 12.5, fontWeight: 600, color: TEXT2, fontFamily: FONT }}
        onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = BLUE; }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = TEXT2; }}
      >
        <ChevronLeft size={15} /> Back to Results
      </button>
      <div style={{ fontSize: 10.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1.3, color: MINT, marginBottom: 5 }}>{eyebrow}</div>
      <h1 className="text-2xl sm:text-[28px]" style={{ fontWeight: 400, color: NAVY, margin: 0, fontFamily: SERIF }}>{title}</h1>
      {subtitle && <p style={{ fontSize: 13.5, color: TEXT2, margin: "6px 0 0", maxWidth: 560, lineHeight: 1.6 }}>{subtitle}</p>}
    </div>
  );
}

/* ── Sidebar (identical to results/page.tsx — shared shell across Component1) ── */
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
                const active = pathname === href || pathname?.startsWith(href + "/");
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

export function SidebarLayout({ title, children }: { title: string; children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();
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
        {/* key={pathname} retriggers the fade on every route change, so moving
            between detail pages (e.g. Back, or a feature card) transitions
            instead of hard-cutting straight to the new content. */}
        <div key={pathname} style={{ flex: 1, overflowY: "auto", animation: "shellFadeIn .35s ease" }}>{children}</div>
      </div>
      <style>{`@keyframes shellFadeIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }`}</style>
    </div>
  );
}
