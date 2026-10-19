"use client";

import {
  AlertCircle,
  ArrowLeft,
  Clock3,
  CloudRain,
  Map,
  MoonStar,
  Play,
  RefreshCw,
  SlidersHorizontal,
  TreePine,
  Volume2,
  Waves,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ActionButton } from "../_components/ActionButton";
import { MeditationHeader } from "../_components/MeditationHeader";
import {
  ENVIRONMENTS,
  environmentIdFromLabel,
  fetchRecommendation,
  labelForGoal,
  labelForInteraction,
  preferencesAreComplete,
  readPreferences,
  saveRecommendation,
  type EnvironmentId,
  type MeditationPreferences,
  type RecommendationResult,
} from "../_lib/meditation";
import styles from "../meditation.module.css";

function EnvironmentIcon({ environment }: { environment: EnvironmentId }) {
  if (environment === "beach") return <Waves size={30} />;
  if (environment === "rain") return <CloudRain size={30} />;
  if (environment === "night-sky") return <MoonStar size={30} />;
  return <TreePine size={30} />;
}

export default function RecommendationPage() {
  const router = useRouter();
  const [requestKey, setRequestKey] = useState(0);
  const [preferences, setPreferences] = useState<MeditationPreferences | null>(null);
  const [recommendation, setRecommendation] = useState<RecommendationResult | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      const storedPreferences = readPreferences();
      if (!preferencesAreComplete(storedPreferences)) {
        router.replace("/component3/preferences");
        return;
      }

      setLoading(true);
      setError("");
      setPreferences(storedPreferences);

      try {
        const result = await fetchRecommendation(storedPreferences, controller.signal);
        saveRecommendation(result);
        setRecommendation(result);
      } catch (requestError) {
        if (!controller.signal.aborted) {
          setRecommendation(null);
          setError(
            requestError instanceof Error
              ? requestError.message
              : "The recommendation could not be created.",
          );
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, 0);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [requestKey, router]);

  const beginSession = () => {
    if (!recommendation) return;
    const environment = environmentIdFromLabel(recommendation.Recommended_Environment);
    const duration = recommendation.Recommended_Session_Duration.match(/\d+/)?.[0] ?? "10";
    const params = new URLSearchParams({
      environment,
      duration,
      sound: recommendation.Recommended_Sound_Type,
      complexity: recommendation.Recommended_Complexity,
    });
    router.push(`/component3/session?${params.toString()}`);
  };

  const environmentId = recommendation
    ? environmentIdFromLabel(recommendation.Recommended_Environment)
    : "forest";
  const environment = ENVIRONMENTS[environmentId];

  return (
    <div className={styles.app}>
      <MeditationHeader backHref="/component3/preferences" backLabel="Change preferences" />
      <main className={styles.recommendationPage}>
        <section className={styles.recommendationHeading}>
          <span className={styles.eyebrow}>Personalized care journey</span>
          <h1>Your recommended meditation session</h1>
          <p>The trained model selected these settings from your three preferences.</p>
        </section>

        {loading && (
          <section className={styles.loadingPanel} aria-live="polite">
            <span className={styles.spinner} aria-hidden="true" />
            <h2>Creating your recommendation</h2>
            <p>Comparing environment, sound, duration, and complexity combinations.</p>
          </section>
        )}

        {!loading && error && (
          <section className={styles.errorPanel} role="alert">
            <AlertCircle className={styles.errorIcon} size={38} />
            <h2>Recommendation service unavailable</h2>
            <p>{error}</p>
            <div className={styles.footerActions}>
              <ActionButton
                secondary
                icon={<ArrowLeft size={17} />}
                onClick={() => router.push("/component3/preferences")}
              >
                Change preferences
              </ActionButton>
              <ActionButton icon={<RefreshCw size={17} />} onClick={() => setRequestKey((key) => key + 1)}>
                Retry
              </ActionButton>
            </div>
          </section>
        )}

        {!loading && recommendation && preferences && (
          <section className={styles.recommendationCard}>
            <div className={styles.recommendationHero}>
              <span className={styles.recommendationIcon} aria-hidden="true">
                <EnvironmentIcon environment={environmentId} />
              </span>
              <div>
                <h2>{environment.title}</h2>
                <p>{environment.description}</p>
              </div>
              <div className={styles.confidence}>
                <span>Model confidence</span>
                <strong>{Math.round(recommendation.confidence * 100)}%</strong>
              </div>
            </div>

            <div className={styles.recommendationGrid}>
              <RecommendationDetail
                icon={<Map size={20} />}
                label="Environment"
                value={recommendation.Recommended_Environment}
              />
              <RecommendationDetail
                icon={<Volume2 size={20} />}
                label="Sound type"
                value={recommendation.Recommended_Sound_Type}
              />
              <RecommendationDetail
                icon={<Clock3 size={20} />}
                label="Duration"
                value={recommendation.Recommended_Session_Duration}
              />
              <RecommendationDetail
                icon={<SlidersHorizontal size={20} />}
                label="Complexity"
                value={recommendation.Recommended_Complexity}
              />
            </div>

            <div className={styles.recommendationFooter}>
              <p className={styles.inputSummary}>
                Based on {preferences.ageGroup}, {labelForGoal(preferences.sessionGoal)}, and{" "}
                {labelForInteraction(preferences.interactionStyle)}.
              </p>
              <ActionButton icon={<Play size={18} />} onClick={beginSession}>
                Begin meditation session
              </ActionButton>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

function RecommendationDetail({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className={styles.detailItem}>
      {icon}
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}
