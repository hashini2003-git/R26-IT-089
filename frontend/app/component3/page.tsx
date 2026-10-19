"use client";

import { BrainCircuit, Clock3, History, Play, Sparkles, Waves } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ActionButton } from "./_components/ActionButton";
import { MeditationHeader } from "./_components/MeditationHeader";
import {
  environmentIdFromLabel,
  ENVIRONMENTS,
  readRecommendation,
  readSessions,
  type RecommendationResult,
} from "./_lib/meditation";
import styles from "./meditation.module.css";

export default function MeditationPage() {
  const router = useRouter();
  const [recommendation, setRecommendation] = useState<RecommendationResult | null>(null);
  const [sessionCount, setSessionCount] = useState(0);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setRecommendation(readRecommendation());
      setSessionCount(readSessions().length);
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  const environment = recommendation
    ? ENVIRONMENTS[environmentIdFromLabel(recommendation.Recommended_Environment)]
    : null;

  return (
    <div className={styles.app}>
      <MeditationHeader />
      <main className={styles.page}>
        <section className={styles.homeIntro}>
          <div className={styles.introIcon} aria-hidden="true">
            <Waves size={32} />
          </div>
          <div>
            <span className={styles.eyebrow}>Mind relax journey</span>
            <h1>Begin a session that fits how you feel today.</h1>
            <p>
              Answer three short questions. The recommendation model will select your
              environment, sound, duration, and interaction complexity.
            </p>
          </div>
        </section>

        <section className={styles.homeGrid}>
          <div className={styles.startPanel}>
            <div className={styles.panelHeading}>
              <BrainCircuit size={22} />
              <div>
                <h2>New personalized session</h2>
                <p>Your choices are used only to prepare the recommendation.</p>
              </div>
            </div>
            <ActionButton
              icon={<Sparkles size={18} />}
              onClick={() => router.push("/component3/preferences")}
            >
              Start preference check
            </ActionButton>
          </div>

          <div className={styles.summaryPanel}>
            <div className={styles.summaryMetric}>
              <History size={20} />
              <span>Completed sessions</span>
              <strong>{sessionCount}</strong>
            </div>
            <div className={styles.summaryMetric}>
              <Clock3 size={20} />
              <span>Latest recommendation</span>
              <strong>{recommendation?.Recommended_Session_Duration ?? "Not created"}</strong>
            </div>
          </div>
        </section>

        {recommendation && environment && (
          <section className={styles.recentBand}>
            <div>
              <span className={styles.eyebrow}>Latest recommendation</span>
              <h2>{environment.title}</h2>
              <p>
                {recommendation.Recommended_Sound_Type} sound, {recommendation.Recommended_Session_Duration},{" "}
                {recommendation.Recommended_Complexity.toLowerCase()} interaction.
              </p>
            </div>
            <ActionButton
              secondary
              icon={<Play size={18} />}
              onClick={() => router.push("/component3/recommendation")}
            >
              Review session
            </ActionButton>
          </section>
        )}

        <button
          type="button"
          className={styles.historyLink}
          onClick={() => router.push("/component3/history")}
        >
          <History size={18} />
          View session history
        </button>
      </main>
    </div>
  );
}
