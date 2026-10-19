"use client";

import {
  ArrowLeft,
  ArrowRight,
  Check,
  HeartPulse,
  MousePointerClick,
  UserRound,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { ActionButton } from "../_components/ActionButton";
import { MeditationHeader } from "../_components/MeditationHeader";
import {
  AGE_GROUPS,
  INTERACTION_STYLES,
  readPreferences,
  savePreferences,
  SESSION_GOALS,
  type AgeGroup,
  type InteractionStyle,
  type MeditationPreferences,
  type SessionGoal,
} from "../_lib/meditation";
import styles from "../meditation.module.css";

type PreferenceValue = AgeGroup | SessionGoal | InteractionStyle;

export default function PreferencesPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [preferences, setPreferences] = useState<MeditationPreferences>({});

  useEffect(() => {
    const timer = window.setTimeout(() => setPreferences(readPreferences()), 0);
    return () => window.clearTimeout(timer);
  }, []);

  const stepConfig = useMemo(() => {
    if (step === 0) {
      return {
        eyebrow: "About you",
        title: "Which age group fits you?",
        description: "This helps the model choose an appropriate pace and interaction complexity.",
        options: AGE_GROUPS,
        selected: preferences.ageGroup,
        icon: UserRound,
        select: (value: PreferenceValue) =>
          setPreferences((current) => ({ ...current, ageGroup: value as AgeGroup })),
      };
    }

    if (step === 1) {
      return {
        eyebrow: "Session purpose",
        title: "What would you like from this session?",
        description: "Choose the outcome that feels most useful for you right now.",
        options: SESSION_GOALS,
        selected: preferences.sessionGoal,
        icon: HeartPulse,
        select: (value: PreferenceValue) =>
          setPreferences((current) => ({ ...current, sessionGoal: value as SessionGoal })),
      };
    }

    return {
      eyebrow: "Interaction",
      title: "How would you like to interact?",
      description: "The model uses this preference when choosing session duration and complexity.",
      options: INTERACTION_STYLES,
      selected: preferences.interactionStyle,
        icon: MousePointerClick,
      select: (value: PreferenceValue) =>
        setPreferences((current) => ({ ...current, interactionStyle: value as InteractionStyle })),
    };
  }, [preferences, step]);

  const handleBack = () => {
    if (step === 0) {
      router.push("/component3");
      return;
    }
    setStep((current) => current - 1);
  };

  const handleContinue = () => {
    if (!stepConfig.selected) return;
    if (step < 2) {
      setStep((current) => current + 1);
      return;
    }
    savePreferences(preferences);
    router.push("/component3/recommendation");
  };

  const StepIcon = stepConfig.icon;

  return (
    <div className={styles.app}>
      <MeditationHeader backHref="/component3" backLabel="Back to meditation home" />
      <main className={styles.wizard}>
        <div className={styles.wizardTop}>
          <span className={styles.stepMeta}>Step {step + 1} of 3</span>
          <div className={styles.progress} aria-label={`Step ${step + 1} of 3`}>
            {[0, 1, 2].map((index) => (
              <span
                key={index}
                className={`${styles.progressSegment} ${index <= step ? styles.progressSegmentActive : ""}`}
              />
            ))}
          </div>
        </div>

        <section className={styles.wizardHeading}>
          <span className={styles.eyebrow}>{stepConfig.eyebrow}</span>
          <h1>{stepConfig.title}</h1>
          <p>{stepConfig.description}</p>
        </section>

        <div className={styles.optionGrid}>
          {stepConfig.options.map((option) => {
            const selected = stepConfig.selected === option.id;
            return (
              <button
                type="button"
                key={option.id}
                className={`${styles.optionButton} ${selected ? styles.optionButtonSelected : ""}`}
                onClick={() => stepConfig.select(option.id)}
                aria-pressed={selected}
              >
                <span className={styles.optionIcon} aria-hidden="true">
                  <StepIcon size={21} />
                </span>
                <span className={styles.optionCopy}>
                  <strong>{option.label}</strong>
                  <span>{option.description}</span>
                </span>
                {selected && (
                  <span className={styles.checkBadge} aria-hidden="true">
                    <Check size={14} />
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <div className={styles.footerActions}>
          <ActionButton secondary icon={<ArrowLeft size={17} />} onClick={handleBack}>
            Back
          </ActionButton>
          <ActionButton
            icon={<ArrowRight size={17} />}
            onClick={handleContinue}
            disabled={!stepConfig.selected}
          >
            {step === 2 ? "Create recommendation" : "Continue"}
          </ActionButton>
        </div>
      </main>
    </div>
  );
}
