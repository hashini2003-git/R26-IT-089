"use client";

import React from "react";
import { useRouter } from "next/navigation";

/* ───────────────────────────────────────────────────────────────────────────
   IPE Design System
   "Liquid glass" — frosted translucent panels over a calm mint/lavender
   gradient. Warm-but-not-alarming severity scale (avoids harsh pure red,
   since this is a chronic-illness patient-facing app).
─────────────────────────────────────────────────────────────────────────── */

export const C = {
  bgTop:      "#EAF6F3",
  bgBottom:   "#F1EEFB",
  glass:      "rgba(255,255,255,0.60)",
  glassEdge:  "rgba(255,255,255,0.85)",
  ink:        "#153238",
  inkMuted:   "#5B7A80",
  inkFaint:   "#93ACAF",
  ink3:       "#5B7A80",   // alias of inkMuted, used by newer pages
  teal:       "#159E92",
  tealSoft:   "#DFF4F1",
  tealLight:  "#DFF4F1",   // alias of tealSoft
  tealDark:   "#0E5C54",
  bgWhite:    "#FFFFFF",
  lavender:   "#8B7FD1",
  // severity scale, calm → critical
  sev: ["#2ECC91", "#F5C242", "#FF9F43", "#FF6B5B", "#E8483A"],
};

export function severityColor(v: number) {
  // v in 0-1
  if (v <= 0.2) return C.sev[0];
  if (v <= 0.4) return C.sev[1];
  if (v <= 0.6) return C.sev[2];
  if (v <= 0.8) return C.sev[3];
  return C.sev[4];
}

export const FONT =
  "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Inter', system-ui, sans-serif";

/* ── Page shell: gradient bg + safe max-width like an iPhone screen ──────── */
export function Screen({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: `linear-gradient(160deg, ${C.bgTop} 0%, ${C.bgBottom} 100%)`,
        fontFamily: FONT,
        display: "flex",
        justifyContent: "center",
      }}
    >
      <div style={{ width: "100%", maxWidth: 430, padding: "20px 18px 100px", position: "relative" }}>
        {children}
      </div>
    </div>
  );
}

/* ── Glass card ────────────────────────────────────────────────────────── */
export function Glass({
  children,
  style,
  onClick,
}: {
  children: React.ReactNode;
  style?: React.CSSProperties;
  onClick?: () => void;
}) {
  return (
    <div
      onClick={onClick}
      style={{
        background: C.glass,
        backdropFilter: "blur(20px) saturate(160%)",
        WebkitBackdropFilter: "blur(20px) saturate(160%)",
        border: `1px solid ${C.glassEdge}`,
        borderRadius: 26,
        padding: 20,
        boxShadow: "0 8px 32px rgba(21,50,56,0.08)",
        cursor: onClick ? "pointer" : "default",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

/* ── Top bar with back button, glass pill ─────────────────────────────── */
export function TopBar({ title, subtitle }: { title: string; subtitle?: string }) {
  const router = useRouter();
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 18 }}>
      <button
        onClick={() => router.back()}
        aria-label="Back"
        style={{
          width: 38, height: 38, borderRadius: 19,
          background: C.glass, backdropFilter: "blur(16px)",
          border: `1px solid ${C.glassEdge}`, display: "flex",
          alignItems: "center", justifyContent: "center",
          cursor: "pointer", flexShrink: 0, boxShadow: "0 4px 16px rgba(21,50,56,0.06)",
        }}
      >
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
          <path d="M15 18l-6-6 6-6" stroke={C.ink} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      <div>
        <div style={{ fontSize: 19, fontWeight: 700, color: C.ink, letterSpacing: "-0.02em" }}>{title}</div>
        {subtitle && <div style={{ fontSize: 12.5, color: C.inkMuted, marginTop: 1 }}>{subtitle}</div>}
      </div>
    </div>
  );
}

/* ── Apple-Health-style ring ──────────────────────────────────────────── */
export function Ring({
  value,        // 0-1
  size = 128,
  stroke = 12,
  color,
  trackColor = "rgba(21,50,56,0.08)",
  children,
}: {
  value: number;
  size?: number;
  stroke?: number;
  color: string;
  trackColor?: string;
  children?: React.ReactNode;
}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c * (1 - Math.min(Math.max(value, 0), 1));
  return (
    <div style={{ position: "relative", width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={size / 2} cy={size / 2} r={r} stroke={trackColor} strokeWidth={stroke} fill="none" />
        <circle
          cx={size / 2} cy={size / 2} r={r} stroke={color} strokeWidth={stroke} fill="none"
          strokeLinecap="round" strokeDasharray={c} strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 1s cubic-bezier(.4,0,.2,1)" }}
        />
      </svg>
      <div style={{
        position: "absolute", inset: 0, display: "flex",
        alignItems: "center", justifyContent: "center", flexDirection: "column",
      }}>
        {children}
      </div>
    </div>
  );
}

/* ── Linear meter bar ──────────────────────────────────────────────────── */
export function Meter({ value, color }: { value: number; color: string }) {
  return (
    <div style={{ width: "100%", height: 8, borderRadius: 6, background: "rgba(21,50,56,0.08)", overflow: "hidden" }}>
      <div style={{
        width: `${Math.round(value * 100)}%`, height: "100%", borderRadius: 6,
        background: color, transition: "width .8s cubic-bezier(.4,0,.2,1)",
      }} />
    </div>
  );
}

/* ── Bottom glass tab bar ─────────────────────────────────────────────── */
export function TabBar({ active }: { active: "home" | "results" | "progress" | "assistant" }) {
  const router = useRouter();
  const items: { key: typeof active; label: string; href: string; icon: (c: string) => React.ReactNode }[] = [
    {
      key: "home", label: "Analyze", href: "/Component1",
      icon: (c) => (
        <svg width="21" height="21" viewBox="0 0 24 24" fill="none"><path d="M12 16V4M12 4L7 9M12 4l5 5" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /><path d="M4 16v3a2 2 0 002 2h12a2 2 0 002-2v-3" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
      ),
    },
    {
      key: "results", label: "Results", href: "/Component1/results",
      icon: (c) => (
        <svg width="21" height="21" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke={c} strokeWidth="2" /><path d="M12 7v5l3 3" stroke={c} strokeWidth="2" strokeLinecap="round" /></svg>
      ),
    },
    {
      key: "progress", label: "Progress", href: "/Component1/progress",
      icon: (c) => (
        <svg width="21" height="21" viewBox="0 0 24 24" fill="none"><path d="M4 19V9M11 19V5M18 19v-7" stroke={c} strokeWidth="2" strokeLinecap="round" /></svg>
      ),
    },
    {
      key  : "assistant", label: "Assistant", href : "/Component1/assistant",
      icon : (c: string) => (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
          <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
  ),
},
  ];
  return (
    <div style={{
      position: "fixed", bottom: 18, left: "50%", transform: "translateX(-50%)",
      display: "flex", gap: 6, background: "rgba(255,255,255,0.72)",
      backdropFilter: "blur(24px) saturate(180%)", WebkitBackdropFilter: "blur(24px) saturate(180%)",
      border: `1px solid ${C.glassEdge}`, borderRadius: 24, padding: 6,
      boxShadow: "0 12px 32px rgba(21,50,56,0.14)", zIndex: 50,
    }}>
      {items.map((it) => {
        const isActive = it.key === active;
        return (
          <button
            key={it.key}
            onClick={() => router.push(it.href)}
            style={{
              display: "flex", alignItems: "center", gap: 7,
              padding: isActive ? "10px 18px" : "10px 14px",
              borderRadius: 18, border: "none", cursor: "pointer",
              background: isActive ? C.teal : "transparent",
              transition: "all .2s",
            }}
          >
            {it.icon(isActive ? "#fff" : C.inkMuted)}
            {isActive && <span style={{ color: "#fff", fontSize: 13, fontWeight: 600 }}>{it.label}</span>}
          </button>
        );
      })}
    </div>
  );
}

/* ── Class colors: green=normal, ambers/reds scale up with severity ─────── */
export const CLASS_COLORS: Record<string, string> = {
  "Normal": "#2ECC91",
  "Variation from Normal": "#F5C242",
  "OPMD": "#FF9F43",
  "Oral Cancer": "#E8483A",
};

export function ClassBar({ name, pct }: { name: string; pct: number }) {
  const color = CLASS_COLORS[name] ?? C.teal;
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: C.ink }}>{name}</span>
        <span style={{ fontSize: 12.5, fontWeight: 700, color }}>{pct}%</span>
      </div>
      <Meter value={pct / 100} color={color} />
    </div>
  );
}

/* ── Radar / spider chart — proper axis + gridlines, not a color block ──── */
export function RadarChart({
  data, size = 240, color = C.teal,
}: { data: { label: string; value: number }[]; size?: number; color?: string }) {
  const cx = size / 2, cy = size / 2;
  const R = size / 2 - 42;
  const n = data.length;
  const angle = (i: number) => (Math.PI * 2 * i) / n - Math.PI / 2;
  const pt = (i: number, r: number) => [cx + r * Math.cos(angle(i)), cy + r * Math.sin(angle(i))];
  const rings = [0.25, 0.5, 0.75, 1];
  const dataPts = data.map((d, i) => pt(i, R * Math.min(Math.max(d.value, 0), 1)));
  const path = dataPts.map((p, i) => `${i === 0 ? "M" : "L"}${p[0]},${p[1]}`).join(" ") + "Z";

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {/* grid rings */}
      {rings.map((r, ri) => {
        const ringPts = data.map((_, i) => pt(i, R * r));
        const d = ringPts.map((p, i) => `${i === 0 ? "M" : "L"}${p[0]},${p[1]}`).join(" ") + "Z";
        return <path key={ri} d={d} fill="none" stroke="rgba(21,50,56,0.10)" strokeWidth={1} />;
      })}
      {/* spokes */}
      {data.map((_, i) => {
        const p = pt(i, R);
        return <line key={i} x1={cx} y1={cy} x2={p[0]} y2={p[1]} stroke="rgba(21,50,56,0.10)" strokeWidth={1} />;
      })}
      {/* data area */}
      <path d={path} fill={color} fillOpacity={0.16} stroke={color} strokeWidth={2} strokeLinejoin="round" />
      {dataPts.map((p, i) => (
        <circle key={i} cx={p[0]} cy={p[1]} r={3.5} fill={color} stroke="#fff" strokeWidth={1.5} />
      ))}
      {/* labels */}
      {data.map((d, i) => {
        const p = pt(i, R + 24);
        return (
          <text key={i} x={p[0]} y={p[1]} textAnchor="middle" dominantBaseline="middle"
            fontSize="11" fontWeight={600} fill={C.inkMuted} fontFamily={FONT}>
            {d.label}
          </text>
        );
      })}
    </svg>
  );
}

/* ── Horizontal bar chart — axis, gridlines, direct value labels ────────── */
export function BarChart({
  data, height,
}: { data: { label: string; value: number; color: string }[]; height?: number }) {
  const rowH = 38;
  const h = height ?? data.length * rowH + 24;
  const max = 100;
  const gridSteps = [0, 25, 50, 75, 100];
  const leftPad = 96;
  const w = 300;

  return (
    <svg width="100%" height={h} viewBox={`0 0 ${leftPad + w + 20} ${h}`} preserveAspectRatio="xMinYMin meet">
      {/* gridlines */}
      {gridSteps.map((g) => {
        const x = leftPad + (g / max) * w;
        return (
          <g key={g}>
            <line x1={x} y1={4} x2={x} y2={h - 20} stroke="rgba(21,50,56,0.08)" strokeWidth={1} />
            <text x={x} y={h - 6} textAnchor="middle" fontSize="9.5" fill={C.inkFaint} fontFamily={FONT}>{g}%</text>
          </g>
        );
      })}
      {/* bars */}
      {data.map((d, i) => {
        const y = i * rowH + 10;
        const barW = (Math.min(d.value, max) / max) * w;
        return (
          <g key={d.label}>
            <text x={leftPad - 10} y={y + 14} textAnchor="end" fontSize="12" fontWeight={600} fill={C.ink} fontFamily={FONT}>
              {d.label}
            </text>
            <rect x={leftPad} y={y} width={w} height={16} rx={4} fill="rgba(21,50,56,0.06)" />
            <rect x={leftPad} y={y} width={barW} height={16} rx={4} fill={d.color} />
            <text x={leftPad + barW + 8} y={y + 12} fontSize="11.5" fontWeight={700} fill={d.color} fontFamily={FONT}>
              {d.value}%
            </text>
          </g>
        );
      })}
    </svg>
  );
}

/* ── Per-feature metadata for individual detail pages ─────────────────── */
export const FEATURE_META: Record<
  string,
  { label: string; short: string; explain: (v: number) => string }
> = {
  erythema: {
    label: "Erythema", short: "Redness / inflammation",
    explain: (v) => v > 0.6
      ? "High inflammation detected. This level of redness is commonly associated with a burning sensation and active tissue irritation."
      : v > 0.3
      ? "Moderate redness present, suggesting some inflammation in the tissue."
      : "Low inflammation. The tissue coloring appears close to healthy baseline.",
  },
  ulceration: {
    label: "Ulceration", short: "Open sores",
    explain: (v) => v > 0.4
      ? "An open sore was detected. This is typically the main source of sharp, localized pain — especially when eating or drinking."
      : v > 0.2
      ? "A minor sore is present, which may cause intermittent discomfort."
      : "No significant ulceration was detected in this image.",
  },
  texture: {
    label: "Texture", short: "Stiffness / roughness",
    explain: (v) => v > 0.5
      ? "Noticeable tissue stiffness was detected, which can restrict jaw or tongue movement."
      : v > 0.3
      ? "Mild roughness detected — worth monitoring over your next few visits."
      : "Tissue texture appears within a normal range.",
  },
  physio: {
    label: "Pathological signal", short: "Real condition vs. normal anatomy",
    explain: (v) => v > 0.7
      ? "The model is highly confident this reflects a real pathological condition, not a normal anatomical variant."
      : v > 0.4
      ? "Mixed signal — some borderline features present. A clinical exam would help confirm."
      : "This may be closer to a normal anatomical variant rather than a pathological finding.",
  },
};

/* ── Hero card: deep gradient, white text, badge + pill button ──────────
   Modeled on premium healthcare-app references — used for the top of the
   hub page and the results summary, where the "wow" factor matters most. */
export function Hero({
  eyebrow, title, subtitle, badge, children,
}: {
  eyebrow?: string; title: string; subtitle?: string;
  badge?: { text: string; icon?: React.ComponentProps<typeof Icon>["name"]; color?: string }; children?: React.ReactNode;
}) {
  return (
    <div style={{
      borderRadius: 28, padding: "26px 22px",
      background: `linear-gradient(155deg, #0E5C54 0%, #159E92 55%, #1FB5A8 100%)`,
      boxShadow: "0 16px 40px rgba(14,92,84,0.35)",
      position: "relative", overflow: "hidden", color: "#fff",
    }}>
      {/* soft decorative glow, matches reference gradient depth */}
      <div style={{
        position: "absolute", top: -60, right: -60, width: 180, height: 180,
        borderRadius: "50%", background: "rgba(255,255,255,0.10)", filter: "blur(10px)",
      }} />
      {badge && (
        <div style={{
          display: "inline-flex", alignItems: "center", gap: 6,
          background: badge.color ?? "rgba(255,255,255,0.18)",
          padding: "6px 13px 6px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700,
          marginBottom: 14, backdropFilter: "blur(6px)",
        }}>
          {badge.icon && <Icon name={badge.icon} size={13} />}
          {badge.text}
        </div>
      )}
      {eyebrow && <div style={{ fontSize: 12, fontWeight: 600, opacity: 0.85, marginBottom: 4 }}>{eyebrow}</div>}
      <div style={{ fontSize: 24, fontWeight: 800, letterSpacing: "-0.02em", marginBottom: subtitle ? 6 : 0, position: "relative" }}>
        {title}
      </div>
      {subtitle && <div style={{ fontSize: 13, opacity: 0.88, lineHeight: 1.5, position: "relative" }}>{subtitle}</div>}
      {children && <div style={{ marginTop: 16, position: "relative" }}>{children}</div>}
    </div>
  );
}

/* ── Pill button — used inside Hero and as primary CTAs ──────────────── */
export function PillButton({
  children, onClick, variant = "light", disabled,
}: { children: React.ReactNode; onClick?: () => void; variant?: "light" | "dark"; disabled?: boolean }) {
  const light = variant === "light";
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        padding: "12px 22px", borderRadius: 999, border: "none",
        fontSize: 13.5, fontWeight: 700, fontFamily: FONT,
        cursor: disabled ? "not-allowed" : "pointer",
        background: disabled ? "rgba(255,255,255,0.3)" : (light ? "#fff" : C.teal),
        color: light ? C.teal : "#fff",
        boxShadow: light ? "0 6px 18px rgba(0,0,0,0.12)" : `0 8px 20px ${C.teal}50`,
        display: "inline-flex", alignItems: "center", gap: 6,
      }}
    >
      {children}
    </button>
  );
}

/* ── Small badge chip — status labels like "VIP", "Lab ready" ──────────── */
export function Chip({ text, tone = "teal", icon }: { text: string; tone?: "teal" | "amber" | "coral" | "neutral"; icon?: React.ComponentProps<typeof Icon>["name"] }) {
  const map: Record<string, [string, string]> = {
    teal: [C.tealSoft, C.teal],
    amber: ["#FFF3E0", "#C98500"],
    coral: ["#FDEDEB", "#E8483A"],
    neutral: ["rgba(21,50,56,0.06)", C.inkMuted],
  };
  const [bg, fg] = map[tone];
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 5, padding: "4px 11px",
      borderRadius: 20, background: bg, color: fg, fontSize: 11, fontWeight: 700,
    }}>
      {icon && <Icon name={icon} size={12} />}
      {text}
    </span>
  );
}

/* ── Icon system — real line icons, not emoji. This is what separates a
   clinical-research-grade UI from a consumer toy app. Stroke-based,
   consistent 1.6 weight, currentColor so they inherit context. ─────────── */
export function Icon({
  name, size = 20, color = "currentColor", strokeWidth = 1.7,
}: {
  name: "stethoscope" | "camera" | "droplet" | "alert" | "layers" | "pulse" | "shield" | "chart" | "pill" | "document" | "trend" | "mic" | "heart" | "chat" | "swallow" | "mouth" | "clock" | "chevron-right" | "warning" | "check-shield";
  size?: number; color?: string; strokeWidth?: number;
}) {
  const common = { fill: "none", stroke: color, strokeWidth, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  const paths: Record<string, React.ReactNode> = {
    stethoscope: <><path d="M5 3v6a4 4 0 008 0V3" {...common} /><circle cx="18" cy="15" r="2.4" {...common} /><path d="M9 9v3a5 5 0 005 5h0a5 5 0 002-.4" {...common} /></>,
    camera: <><path d="M4 8a2 2 0 012-2h1l1.5-2h7L17 6h1a2 2 0 012 2v10a2 2 0 01-2 2H6a2 2 0 01-2-2V8z" {...common} /><circle cx="12" cy="13" r="3.4" {...common} /></>,
    droplet: <path d="M12 3s6 6.5 6 11a6 6 0 11-12 0c0-4.5 6-11 6-11z" {...common} />,
    alert: <><circle cx="12" cy="12" r="9" {...common} /><path d="M12 8v5" {...common} /><circle cx="12" cy="16" r="0.6" fill={color} stroke="none" /></>,
    layers: <><path d="M12 3l9 5-9 5-9-5 9-5z" {...common} /><path d="M3 13l9 5 9-5" {...common} /></>,
    pulse: <path d="M3 12h4l2-7 4 14 2-7h6" {...common} />,
    shield: <path d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6l7-3z" {...common} />,
    chart: <><path d="M4 19V9M11 19V5M18 19v-7" {...common} /></>,
    pill: <><rect x="3" y="10" width="18" height="7" rx="3.5" transform="rotate(-25 12 13.5)" {...common} /><path d="M9.5 8.5l5 8" {...common} /></>,
    document: <><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z" {...common} /><path d="M14 2v6h6" {...common} /></>,
    trend: <><path d="M3 17l6-6 4 4 8-8" {...common} /><path d="M15 7h6v6" {...common} /></>,
    mic: <><rect x="9" y="2" width="6" height="12" rx="3" {...common} /><path d="M5 11a7 7 0 0014 0M12 18v3" {...common} /></>,
    heart: <path d="M12 20s-7-4.35-9.5-8.5C.5 7.5 3 4 6.5 4c2 0 3.5 1.2 5.5 3.5C14 5.2 15.5 4 17.5 4 21 4 23.5 7.5 21.5 11.5 19 15.65 12 20 12 20z" {...common} />,
    chat: <path d="M4 5h16v11H8l-4 4V5z" {...common} />,
    swallow: <><path d="M12 3v12" {...common} /><path d="M7 11l5 5 5-5" {...common} /><path d="M5 21h14" {...common} /></>,
    mouth: <><path d="M4 10c3-2 13-2 16 0" {...common} /><path d="M6 13c2.5 3 9.5 3 12 0" {...common} /></>,
    clock: <><circle cx="12" cy="12" r="9" {...common} /><path d="M12 7v5l3 3" {...common} /></>,
    "chevron-right": <path d="M9 6l6 6-6 6" {...common} />,
    warning: <><path d="M10.3 3.6L2.5 17a1.8 1.8 0 001.6 2.7h15.8a1.8 1.8 0 001.6-2.7L13.7 3.6a1.8 1.8 0 00-3.4 0z" {...common} /><path d="M12 9v4.5" {...common} /><circle cx="12" cy="16.3" r="0.6" fill={color} stroke="none" /></>,
    "check-shield": <><path d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6l7-3z" {...common} /><path d="M9 12l2 2 4-4" {...common} /></>,
  };
  return <svg width={size} height={size} viewBox="0 0 24 24">{paths[name]}</svg>;
}

export const FEATURE_ICON: Record<string, "droplet" | "alert" | "layers" | "shield"> = {
  erythema: "droplet", ulceration: "alert", texture: "layers", physio: "shield",
};

/* ── Shared result type + storage helpers (sessionStorage bridges pages) ─ */
export type IpeResult = {
  success: boolean;
  filename: string;
  classification: { name: string; index: number; confidence: number; all_probs: Record<string, number> };
  ppi: { score: number; label: string; color: string; max: number };
  fis: { speech: number; swallowing: number; mouth: number };
  visual_features: { erythema: number; ulceration: number; texture: number; physio: number };
  urgency: { level: string; timeframe: string; color: string; emoji: string; message: string; days: number };
  treatment_plan: { immediate: string[]; short_term: string[]; clinical: string[]; lifestyle: string[] };
  assistant_message: string;
};

const KEY = "ipe_last_result";

export function saveResult(r: IpeResult) {
  if (typeof window !== "undefined") sessionStorage.setItem(KEY, JSON.stringify(r));
}
export function loadResult(): IpeResult | null {
  if (typeof window === "undefined") return null;
  const raw = sessionStorage.getItem(KEY);
  return raw ? (JSON.parse(raw) as IpeResult) : null;
}