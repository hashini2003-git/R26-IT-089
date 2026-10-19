"use client";

import { getPatient } from "@/app/lib/auth";
import { ArrowLeft, BrainCircuit, UserRound } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import styles from "../meditation.module.css";

interface MeditationHeaderProps {
  backHref?: string;
  backLabel?: string;
}

export function MeditationHeader({
  backHref = "/home",
  backLabel = "Back to dashboard",
}: MeditationHeaderProps) {
  const router = useRouter();
  const [patientName, setPatientName] = useState("Patient");

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setPatientName(getPatient()?.name?.split(" ")[0] || "Patient");
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <header className={styles.header}>
      <button
        type="button"
        className={styles.iconButton}
        onClick={() => router.push(backHref)}
        title={backLabel}
        aria-label={backLabel}
      >
        <ArrowLeft size={19} />
      </button>
      <div className={styles.brandMark} aria-hidden="true">
        <BrainCircuit size={21} />
      </div>
      <div className={styles.brandCopy}>
        <strong>Meditation AI</strong>
        <span>Personalized wellness session</span>
      </div>
      <div className={styles.patientBadge}>
        <UserRound size={16} />
        <span>{patientName}</span>
      </div>
    </header>
  );
}
