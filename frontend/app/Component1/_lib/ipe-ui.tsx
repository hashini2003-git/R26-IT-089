"use client";

import React from "react";
import { useRouter, usePathname } from "next/navigation";
import {
  Heart, Camera, LayoutDashboard, BarChart2, TrendingUp, GitCompare,
  MessageSquare, Stethoscope, Menu, X,
} from "lucide-react";

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
  const target = Math.min(Math.max(value, 0), 1);

  // Animate from 0 on mount: without this, the SVG renders at its final
  // strokeDashoffset on first paint and the CSS transition never has
  // anything to interpolate from, so nothing visibly animates.
  const [animated, setAnimated] = React.useState(0);
  React.useEffect(() => {
    const id = requestAnimationFrame(() => setAnimated(target));
    return () => cancelAnimationFrame(id);
  }, [target]);

  const offset = c * (1 - animated);
  const gradId = React.useId();

  return (
    <div style={{ position: "relative", width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)", overflow: "visible" }}>
        <defs>
          <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={color} stopOpacity={0.65} />
            <stop offset="100%" stopColor={color} stopOpacity={1} />
          </linearGradient>
        </defs>
        <circle cx={size / 2} cy={size / 2} r={r} stroke={trackColor} strokeWidth={stroke} fill="none" />
        <circle
          cx={size / 2} cy={size / 2} r={r} stroke={`url(#${gradId})`} strokeWidth={stroke} fill="none"
          strokeLinecap="round" strokeDasharray={c} strokeDashoffset={offset}
          style={{
            transition: "stroke-dashoffset 1.1s cubic-bezier(.4,0,.2,1)",
            filter: `drop-shadow(0 0 6px ${color}55)`,
          }}
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

/* ── Fade/slide-up entrance wrapper, staggered by index ──────────────────── */
export function RevealIn({
  children, delay = 0, style,
}: { children: React.ReactNode; delay?: number; style?: React.CSSProperties }) {
  const [shown, setShown] = React.useState(false);
  React.useEffect(() => {
    const t = setTimeout(() => setShown(true), delay);
    return () => clearTimeout(t);
  }, [delay]);
  return (
    <div style={{
      opacity: shown ? 1 : 0,
      transform: shown ? "translateY(0)" : "translateY(14px)",
      transition: "opacity 0.55s cubic-bezier(.4,0,.2,1), transform 0.55s cubic-bezier(.4,0,.2,1)",
      ...style,
    }}>
      {children}
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
  data, size = 300, color = C.teal,
}: { data: { label: string; value: number }[]; size?: number; color?: string }) {
  const cx = size / 2, cy = size / 2;
  const R = size / 2 - 48;
  const n = data.length;
  const angle = (i: number) => (Math.PI * 2 * i) / n - Math.PI / 2;
  const pt = (i: number, r: number) => [cx + r * Math.cos(angle(i)), cy + r * Math.sin(angle(i))];
  const rings = [0.25, 0.5, 0.75, 1];

  // Animate the shape growing outward from the center on mount, instead of
  // rendering the final polygon immediately with nothing to animate from.
  const [grown, setGrown] = React.useState(0);
  React.useEffect(() => {
    const id = requestAnimationFrame(() => setGrown(1));
    return () => cancelAnimationFrame(id);
  }, []);

  const dataPts = data.map((d, i) => pt(i, R * Math.min(Math.max(d.value, 0), 1)));
  const path = dataPts.map((p, i) => `${i === 0 ? "M" : "L"}${p[0]},${p[1]}`).join(" ") + "Z";
  const gradId = React.useId();
  // Outline/fill color = the most severe finding across all axes, so the
  // overall shape gives an at-a-glance read consistent with its worst dot.
  const worstValue = Math.max(...data.map((d) => d.value), 0);
  const shapeColor = data.length ? severityColor(worstValue) : color;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ overflow: "visible" }}>
      <defs>
        <radialGradient id={gradId} cx="50%" cy="50%" r="65%">
          <stop offset="0%" stopColor={shapeColor} stopOpacity={0.38} />
          <stop offset="100%" stopColor={shapeColor} stopOpacity={0.10} />
        </radialGradient>
      </defs>
      {/* grid rings, with faint % labels on the top axis */}
      {rings.map((r, ri) => {
        const ringPts = data.map((_, i) => pt(i, R * r));
        const d = ringPts.map((p, i) => `${i === 0 ? "M" : "L"}${p[0]},${p[1]}`).join(" ") + "Z";
        return (
          <g key={ri}>
            <path d={d} fill="none" stroke="rgba(21,50,56,0.09)" strokeWidth={1} />
            <text x={cx + 6} y={cy - R * r - 2} fontSize="9" fill={C.inkFaint} fontFamily={FONT}>
              {Math.round(r * 100)}%
            </text>
          </g>
        );
      })}
      {/* spokes */}
      {data.map((_, i) => {
        const p = pt(i, R);
        return <line key={i} x1={cx} y1={cy} x2={p[0]} y2={p[1]} stroke="rgba(21,50,56,0.09)" strokeWidth={1} />;
      })}
      {/* data area — scales in from the center; outline reflects the worst
          finding among the axes, dots are individually colored by their
          own severity so the chart matches the Normal/Mild/High/Critical
          legend shown underneath it, instead of one flat color for all. */}
      <g style={{
        transform: `scale(${grown})`,
        transformOrigin: `${cx}px ${cy}px`,
        transition: "transform 0.9s cubic-bezier(.34,1.56,.64,1)",
      }}>
        <path d={path} fill={`url(#${gradId})`} stroke={shapeColor} strokeWidth={2.5} strokeLinejoin="round" filter={`drop-shadow(0 2px 8px ${shapeColor}40)`} />
        {dataPts.map((p, i) => (
          <circle key={i} cx={p[0]} cy={p[1]} r={5} fill={severityColor(data[i].value)} stroke="#fff" strokeWidth={2} />
        ))}
      </g>
      {/* labels + value badges */}
      {data.map((d, i) => {
        const p = pt(i, R + 30);
        return (
          <g key={i}>
            <text x={p[0]} y={p[1] - 7} textAnchor="middle" dominantBaseline="middle"
              fontSize="12" fontWeight={700} fill={C.ink} fontFamily={FONT}>
              {d.label}
            </text>
            <text x={p[0]} y={p[1] + 10} textAnchor="middle" dominantBaseline="middle"
              fontSize="11" fontWeight={700} fill={severityColor(d.value)} fontFamily={FONT}>
              {Math.round(d.value * 100)}%
            </text>
          </g>
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
/* ─────────────────────────────────────────────────────────────────────────
   WEB SHELL — the genuinely responsive desktop sidebar layout.
   Same shell already used by /Component1/results, /dashboard, /progress,
   /assistant, /compare (previously copy-pasted into each of those files).
   Pulled out here as ONE shared source so every results sub-page (visual,
   pain, function, risk, treatment, report) can use the same responsive
   shell instead of the old fixed-430px mobile-only `Screen` above.
   Uses real Tailwind breakpoints (`hidden lg:flex` / `flex lg:hidden`),
   so it's a full sidebar on desktop and a hamburger-triggered drawer on
   mobile — not two different apps glued together.
───────────────────────────────────────────────────────────────────────── */
export const WEB = {
  blue: "#1565C0",
  blueDeep: "#0D47A1",
  blueTint: "#E3EEF9",
  mint: "#0D9488",
  mintTint: "#E0F5F3",
  navy: "#0B1F38",
  bg: "#F4F8FD",
  border: "rgba(21,101,192,0.10)",
  sidebarBg: "#0B1F38",
  text: "#0F2137",
  text2: "#4A6070",
  sev: ["#2ECC91", "#F5C242", "#FF9F43", "#E8483A"],
  font: "'Inter', system-ui, sans-serif",
  serif: "'DM Serif Display', Georgia, serif",
  mono: "'DM Mono', monospace",
};

export function WebCard({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{ background: "#fff", borderRadius: 20, border: `1px solid ${WEB.border}`, boxShadow: "0 2px 12px rgba(21,101,192,0.06), 0 1px 3px rgba(0,0,0,0.04)", padding: 22, ...style }}>
      {children}
    </div>
  );
}

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
    <div style={{ width: 248, background: WEB.sidebarBg, display: "flex", flexDirection: "column", height: "100%", flexShrink: 0, fontFamily: WEB.font, overflowY: "auto" }}>
      <div style={{ padding: "22px 18px 18px", borderBottom: "1px solid rgba(255,255,255,0.06)", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 38, height: 38, borderRadius: 11, background: `linear-gradient(135deg, ${WEB.blue}, ${WEB.mint})`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, boxShadow: `0 4px 12px ${WEB.blue}44` }}>
            <Heart size={17} color="#fff" />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14.5, fontWeight: 700, color: "#fff", lineHeight: 1.2, fontFamily: WEB.serif }}>OralCare AI</div>
            <div style={{ fontSize: 9.5, color: "rgba(255,255,255,0.35)", marginTop: 1, letterSpacing: 0.3 }}>Clinical Patient Portal</div>
          </div>
          {onClose && (
            <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.35)", display: "flex", padding: 2 }}>
              <X size={17} />
            </button>
          )}
        </div>
        <div style={{ marginTop: 14, display: "flex", alignItems: "center", gap: 8, padding: "9px 11px", borderRadius: 11, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.06)" }}>
          <div style={{ width: 30, height: 30, borderRadius: "50%", background: `${WEB.blue}44`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
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
                const active = pathname === href || (href === "/Component1/results" && pathname?.startsWith("/Component1/results"));
                return (
                  <button key={href} onClick={() => { router.push(href); onClose?.(); }}
                    style={{
                      display: "flex", alignItems: "center", gap: 10, padding: "9px 10px", borderRadius: 10,
                      border: "none", cursor: "pointer", textAlign: "left", width: "100%",
                      background: active ? `linear-gradient(135deg, ${WEB.blue}cc, ${WEB.blueDeep}cc)` : "transparent",
                      transition: "all .15s", fontFamily: WEB.font,
                      boxShadow: active ? `0 3px 10px ${WEB.blue}33` : "none",
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
          style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "12px 13px", borderRadius: 11, border: `1px solid rgba(13,148,136,0.3)`, background: "rgba(13,148,136,0.1)", cursor: "pointer", fontFamily: WEB.font }}>
          <div style={{ width: 30, height: 30, borderRadius: 9, background: "rgba(13,148,136,0.2)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <Stethoscope size={14} color={WEB.mint} />
          </div>
          <div style={{ textAlign: "left" }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: WEB.mint, lineHeight: 1.2 }}>Message Care Team</div>
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
  const [mobileOpen, setMobileOpen] = React.useState(false);
  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden", fontFamily: WEB.font, background: WEB.bg }}>
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
        <div className="flex lg:hidden" style={{ alignItems: "center", gap: 12, padding: "12px 16px", background: "#fff", borderBottom: `1px solid ${WEB.border}`, flexShrink: 0 }}>
          <button onClick={() => setMobileOpen(true)} style={{ background: "none", border: "none", cursor: "pointer", display: "flex", padding: 4 }}>
            <Menu size={20} color={WEB.navy} />
          </button>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 28, height: 28, borderRadius: 8, background: `linear-gradient(135deg, ${WEB.blue}, ${WEB.mint})`, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Heart size={13} color="#fff" />
            </div>
            <span style={{ fontSize: 14, fontWeight: 700, color: WEB.navy, fontFamily: WEB.serif }}>OralCare AI</span>
          </div>
          <div style={{ marginLeft: "auto", fontSize: 11.5, color: WEB.text2 }}>{title}</div>
        </div>
        <div style={{ flex: 1, overflowY: "auto" }}>{children}</div>
      </div>
    </div>
  );
}
