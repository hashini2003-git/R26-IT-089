export type AgeGroup = "below-25" | "25-50" | "above-50";
export type SessionGoal =
  | "relaxation"
  | "better-sleep"
  | "calm-mind"
  | "stress-relief"
  | "focus-improvement"
  | "emotional-comfort";
export type InteractionStyle = "tap" | "hold" | "swipe" | "guided-breathing";
export type EnvironmentId = "forest" | "beach" | "rain" | "night-sky";

export interface MeditationPreferences {
  ageGroup?: AgeGroup;
  sessionGoal?: SessionGoal;
  interactionStyle?: InteractionStyle;
}

export interface RecommendationResult {
  Recommended_Environment: string;
  Recommended_Sound_Type: string;
  Recommended_Session_Duration: string;
  Recommended_Complexity: string;
  confidence: number;
}

export interface MeditationSessionRecord {
  id: string;
  completedAt: string;
  environment: EnvironmentId;
  sound: string;
  duration: string;
  complexity: string;
  goal?: SessionGoal;
}

export const AGE_GROUPS: ReadonlyArray<{ id: AgeGroup; label: string; description: string }> = [
  { id: "below-25", label: "Below 25", description: "A lighter, more responsive session." },
  { id: "25-50", label: "25 to 50", description: "A balanced session with steady pacing." },
  { id: "above-50", label: "Above 50", description: "A gentle session with simpler interaction." },
];

export const SESSION_GOALS: ReadonlyArray<{ id: SessionGoal; label: string; description: string }> = [
  { id: "relaxation", label: "Relaxation", description: "Release tension gently." },
  { id: "better-sleep", label: "Better Sleep", description: "Prepare for deeper rest." },
  { id: "calm-mind", label: "Calm Mind", description: "Build a quieter mental rhythm." },
  { id: "stress-relief", label: "Stress Relief", description: "Lower stress with steady breathing." },
  { id: "focus-improvement", label: "Focus Improvement", description: "Support clearer attention." },
  { id: "emotional-comfort", label: "Emotional Comfort", description: "Create a reassuring pause." },
];

export const INTERACTION_STYLES: ReadonlyArray<{
  id: InteractionStyle;
  label: string;
  description: string;
}> = [
  { id: "tap", label: "Tap", description: "Use simple taps for session cues." },
  { id: "hold", label: "Hold", description: "Press and hold to settle into the rhythm." },
  { id: "swipe", label: "Swipe", description: "Use slow swipes to move between cues." },
  { id: "guided-breathing", label: "Guided Breathing", description: "Follow calm breathing prompts." },
];

export const ENVIRONMENTS: Record<EnvironmentId, { title: string; description: string }> = {
  forest: { title: "Forest", description: "Soft leaves, gentle air, and steady grounding." },
  beach: { title: "Beach", description: "Slow waves and open space for an easy breath." },
  rain: { title: "Rain", description: "Quiet rainfall for a soft, steady rhythm." },
  "night-sky": { title: "Night Sky", description: "A still evening sky for quiet reflection." },
};

const PREFERENCES_KEY = "meditation.preferences";
const RECOMMENDATION_KEY = "meditation.recommendation";
const HISTORY_KEY = "meditation.sessions";

function parseStored<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const value = localStorage.getItem(key);
    return value ? (JSON.parse(value) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function readPreferences(): MeditationPreferences {
  return parseStored<MeditationPreferences>(PREFERENCES_KEY, {});
}

export function savePreferences(preferences: MeditationPreferences): void {
  localStorage.setItem(PREFERENCES_KEY, JSON.stringify(preferences));
}

export function preferencesAreComplete(
  preferences: MeditationPreferences,
): preferences is Required<MeditationPreferences> {
  return Boolean(preferences.ageGroup && preferences.sessionGoal && preferences.interactionStyle);
}

export function readRecommendation(): RecommendationResult | null {
  return parseStored<RecommendationResult | null>(RECOMMENDATION_KEY, null);
}

export function saveRecommendation(recommendation: RecommendationResult): void {
  localStorage.setItem(RECOMMENDATION_KEY, JSON.stringify(recommendation));
}

export async function fetchRecommendation(
  preferences: Required<MeditationPreferences>,
  signal?: AbortSignal,
): Promise<RecommendationResult> {
  const response = await fetch("/api/meditation/recommend", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      age_group: preferences.ageGroup,
      meditation_purpose: preferences.sessionGoal,
      interaction_style: preferences.interactionStyle,
    }),
    signal,
  });

  if (!response.ok) {
    const error = (await response.json().catch(() => ({}))) as { detail?: string };
    throw new Error(error.detail || `Recommendation request failed (${response.status})`);
  }

  return response.json() as Promise<RecommendationResult>;
}

export function environmentIdFromLabel(label: string): EnvironmentId {
  const normalized = label.toLowerCase().replaceAll("_", "-").replaceAll(" ", "-");
  if (normalized === "beach" || normalized === "rain" || normalized === "night-sky") {
    return normalized;
  }
  return "forest";
}

export function readSessions(): MeditationSessionRecord[] {
  return parseStored<MeditationSessionRecord[]>(HISTORY_KEY, []);
}

export function addSession(record: Omit<MeditationSessionRecord, "id" | "completedAt">): void {
  const sessions = readSessions();
  const id = typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}`;
  sessions.unshift({ ...record, id, completedAt: new Date().toISOString() });
  localStorage.setItem(HISTORY_KEY, JSON.stringify(sessions.slice(0, 20)));
}

export function clearSessions(): void {
  localStorage.removeItem(HISTORY_KEY);
}

export function labelForGoal(goal?: SessionGoal): string {
  return SESSION_GOALS.find((item) => item.id === goal)?.label ?? "Personal session";
}

export function labelForInteraction(style?: InteractionStyle): string {
  return INTERACTION_STYLES.find((item) => item.id === style)?.label ?? "Guided Breathing";
}
