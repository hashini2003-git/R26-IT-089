import { CheckCircle2, History, RefreshCw } from "lucide-react";
import Link from "next/link";
import { MeditationHeader } from "../_components/MeditationHeader";
import { ENVIRONMENTS, type EnvironmentId } from "../_lib/meditation";
import styles from "../meditation.module.css";

interface CompletionPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

function firstValue(value: string | string[] | undefined, fallback: string): string {
  return Array.isArray(value) ? value[0] ?? fallback : value ?? fallback;
}

function validEnvironment(value: string): EnvironmentId {
  return value === "beach" || value === "rain" || value === "night-sky" ? value : "forest";
}

export default async function CompletionPage({ searchParams }: CompletionPageProps) {
  const params = await searchParams;
  const environmentId = validEnvironment(firstValue(params.environment, "forest"));
  const environment = ENVIRONMENTS[environmentId];
  const duration = firstValue(params.duration, "10");
  const sound = firstValue(params.sound, "Nature");
  const complexity = firstValue(params.complexity, "Simple");

  return (
    <div className={styles.app}>
      <MeditationHeader backHref="/component3" backLabel="Back to meditation home" />
      <main className={styles.completionPage}>
        <section className={styles.completionPanel}>
          <span className={styles.completionIcon} aria-hidden="true">
            <CheckCircle2 size={31} />
          </span>
          <h1>Session complete</h1>
          <p>Well done for taking time to return to your breath.</p>

          <div className={styles.completionSummary}>
            <div>
              <span>Environment</span>
              <strong>{environment.title}</strong>
            </div>
            <div>
              <span>Duration</span>
              <strong>{duration} min</strong>
            </div>
            <div>
              <span>Sound</span>
              <strong>{sound}</strong>
            </div>
            <div>
              <span>Complexity</span>
              <strong>{complexity}</strong>
            </div>
          </div>

          <div className={styles.completionActions}>
            <Link className={styles.linkButtonPrimary} href="/component3/preferences">
              <RefreshCw size={17} />
              Start another session
            </Link>
            <Link className={styles.linkButtonSecondary} href="/component3/history">
              <History size={17} />
              View session history
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}
