"use client";

import { Clock3, History, Sparkles, Trash2, Volume2 } from "lucide-react";
import { useEffect, useState } from "react";
import { ActionButton } from "../_components/ActionButton";
import { MeditationHeader } from "../_components/MeditationHeader";
import {
  clearSessions,
  ENVIRONMENTS,
  labelForGoal,
  readSessions,
  type MeditationSessionRecord,
} from "../_lib/meditation";
import styles from "../meditation.module.css";

function formatCompletedAt(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Completed session";
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export default function HistoryPage() {
  const [sessions, setSessions] = useState<MeditationSessionRecord[]>([]);

  useEffect(() => {
    const timer = window.setTimeout(() => setSessions(readSessions()), 0);
    return () => window.clearTimeout(timer);
  }, []);

  const clearHistory = () => {
    clearSessions();
    setSessions([]);
  };

  return (
    <div className={styles.app}>
      <MeditationHeader backHref="/component3" backLabel="Back to meditation home" />
      <main className={styles.historyPage}>
        <section className={styles.historyHeading}>
          <div>
            <span className={styles.eyebrow}>Finished journeys</span>
            <h1>Session history</h1>
            <p>Your completed meditation sessions are stored on this device.</p>
          </div>
          {sessions.length > 0 && (
            <ActionButton secondary icon={<Trash2 size={17} />} onClick={clearHistory}>
              Clear history
            </ActionButton>
          )}
        </section>

        {sessions.length === 0 ? (
          <section className={styles.emptyState}>
            <History size={34} />
            <strong>No completed journeys yet</strong>
            <span>Complete a meditation session and it will appear here.</span>
          </section>
        ) : (
          <div className={styles.historyList}>
            {sessions.map((session) => (
              <article className={styles.historyCard} key={session.id}>
                <span className={styles.historyIcon} aria-hidden="true">
                  <Sparkles size={22} />
                </span>
                <div>
                  <h2>{ENVIRONMENTS[session.environment].title}</h2>
                  <p>{labelForGoal(session.goal)}</p>
                  <div className={styles.historyMeta}>
                    <span><Clock3 size={12} /> {session.duration}</span>
                    <span><Volume2 size={12} /> {session.sound}</span>
                    <span>{session.complexity}</span>
                  </div>
                </div>
                <time className={styles.historyDate} dateTime={session.completedAt}>
                  {formatCompletedAt(session.completedAt)}
                </time>
              </article>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
