"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { Activity, AudioLines, ClipboardList, LayoutDashboard, ListChecks } from "lucide-react";
import { isLoggedIn } from "../lib/auth";
import { AssessmentProvider } from "./context";
import styles from "./risk-voice.module.css";

const links = [
  ["/component2", "Overview", LayoutDashboard],
  ["/component2/risk", "Risk Assessment", ClipboardList],
  ["/component2/voice", "Voice Analysis", AudioLines],
  ["/component2/monitoring", "Weekly Monitoring", Activity],
  ["/component2/history", "History", ListChecks],
] as const;

export default function ComponentTwoLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [ready, setReady] = useState(false);
  useEffect(() => { const timer = window.setTimeout(() => { if (!isLoggedIn()) router.replace("/login"); else setReady(true); }, 0); return () => window.clearTimeout(timer); }, [router]);
  if (!ready) return <div className={styles.loading}><span className={styles.spinner} />Checking your session…</div>;
  return <AssessmentProvider><div className={styles.app}><header className={styles.moduleHeader}><div><span>MEMBER 2 · SUPPORTIVE SCREENING</span><h1>Risk & Voice Monitoring</h1></div><nav aria-label="Risk and voice navigation">{links.map(([href, label, Icon]) => <Link key={href} href={href} className={pathname === href ? styles.active : ""}><Icon size={17} />{label}</Link>)}</nav></header><main className={styles.content}>{children}</main></div></AssessmentProvider>;
}
