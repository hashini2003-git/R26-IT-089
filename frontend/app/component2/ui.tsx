import type { HTMLAttributes, ReactNode } from "react";
import type { RiskLevel } from "../lib/types";
import styles from "./risk-voice.module.css";

export const DISCLAIMER = "This result is intended only for supportive preventive screening and is not a medical diagnosis. It does not replace examination by a qualified healthcare professional.";

export function Card({ children, className = "", ...props }: { children: ReactNode; className?: string } & HTMLAttributes<HTMLElement>) {
  return <section className={`${styles.card} ${className}`} {...props}>{children}</section>;
}

export function RiskBadge({ level }: { level: RiskLevel }) {
  const label = level === "high" ? "Elevated Risk" : `${level[0].toUpperCase()}${level.slice(1)} Risk`;
  return <span className={`${styles.badge} ${styles[level]}`}>{label}</span>;
}

export function Ring({ value, label }: { value: number; label: string }) {
  const safe = Math.max(0, Math.min(100, value));
  return <div className={styles.ring} style={{ "--risk-value": `${safe * 3.6}deg` } as React.CSSProperties}><div><strong>{safe.toFixed(1)}%</strong><span>{label}</span></div></div>;
}

export function Notice({ children, error = false }: { children: ReactNode; error?: boolean }) {
  return <div className={error ? styles.error : styles.notice} role={error ? "alert" : "status"}>{children}</div>;
}

export function Disclaimer({ text = DISCLAIMER }: { text?: string }) {
  return <aside className={styles.disclaimer}>{text.includes("qualified healthcare professional") ? text : DISCLAIMER}</aside>;
}

export function Loading() { return <div className={styles.loading}><span className={styles.spinner} />Loading your records…</div>; }
