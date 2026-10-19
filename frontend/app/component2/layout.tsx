"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import {
  Activity,
  AudioLines,
  ClipboardList,
  LayoutDashboard,
  ListChecks,
} from "lucide-react";
import Header from "../components/Header";
import { clearAuth, getPatient, isLoggedIn } from "../lib/auth";
import type { Patient } from "../lib/types";
import { AssessmentProvider } from "./context";
import styles from "./risk-voice.module.css";

const links = [
  ["/component2", "My Overview", LayoutDashboard],
  ["/component2/risk", "Check My Risk", ClipboardList],
  ["/component2/voice", "Check My Voice", AudioLines],
  ["/component2/monitoring", "Track Progress", Activity],
  ["/component2/history", "My Results", ListChecks],
] as const;

export default function ComponentTwoLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [ready, setReady] = useState(false);
  const [patient, setPatient] = useState<Patient | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (!isLoggedIn()) {
        router.replace("/login");
        return;
      }

      setPatient(getPatient());
      setReady(true);
    }, 0);

    return () => window.clearTimeout(timer);
  }, [router]);

  if (!ready) {
    return (
      <div className={styles.sessionLoading}>
        <span className={styles.spinner} />
        Checking your session…
      </div>
    );
  }

  return (
    <AssessmentProvider>
      <div className={styles.app}>
        <Header
          variant="light"
          user={
            patient
              ? { name: patient.name, patientId: patient.patient_id }
              : null
          }
          onLogout={clearAuth}
        />

        <header className={styles.moduleHeader}>
          <div className={styles.moduleTitle}>
            <span>YOUR ORAL HEALTH CHECK</span>
            <h1>Oral Health Risk &amp; Voice Check</h1>
            <p>
              Check your oral health risk, record your voice, and follow changes
              over time.
            </p>
          </div>

          <nav aria-label="Risk and voice navigation">
            {links.map(([href, label, Icon]) => (
              <Link
                key={href}
                href={href}
                className={pathname === href ? styles.active : ""}
                aria-current={pathname === href ? "page" : undefined}
              >
                <Icon size={17} aria-hidden="true" />
                {label}
              </Link>
            ))}
          </nav>
        </header>

        <main className={styles.content}>{children}</main>
      </div>
    </AssessmentProvider>
  );
}
