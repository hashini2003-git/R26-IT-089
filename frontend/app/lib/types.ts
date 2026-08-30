// ── Analysis ──────────────────────────────────────────────────────────────────
export type AnalysisResult = {
  is_healthy:         boolean;
  primary_disorder:   string;   // "healthy" | "parkinsons" | "stuttering" | "dysarthria"
  severity_score:     number;   // 0.0 – 3.0
  severity_label:     string;   // "none" | "mild" | "moderate" | "severe"
  severity_color:     string;
  voice_quality_prob: number;
  stuttering_prob:    number;
  dysarthria_prob:    number;
  duration_s:         number;
  message:            string;
  session_id?:        string;   // present when session auto-saved (logged in)
};

// ── Auth / Patient ────────────────────────────────────────────────────────────
export type Patient = {
  patient_id:    string;
  name:          string;
  surgery_date:  string;
  day_number:    number;
  therapy_stage?: string;
};

export type LoginResponse = {
  token:        string;
  patient_id:   string;
  name:         string;
  surgery_date: string;
  day_number:   number;
};

export type RegisterResponse = {
  token:         string;
  patient_id:    string;
  name:          string;
  surgery_date:  string;
  day_number:    number;
  therapy_stage: string;
};

// ── Component 2: multimodal risk and voice monitoring ──
export type RiskLevel = "low" | "moderate" | "high";

export type RiskFactors = {
  age: number;
  gender: string;
  smoking: string;
  alcohol: string;
  betelChewing: string;
  oralUlcer: string;
  gumDisease: string;
  oralPain: string;
  hpvInfection: string;
  poorOralHygiene: string;
  diet: string;
  familyHistory: string;
  compromisedImmuneSystem: string;
  unexplainedBleeding: string;
  difficultySwallowing: string;
  whiteOrRedPatches: string;
};

export type VoiceMeasurements = {
  mfccPattern: string;
  pitchVariation: string;
  jitter: string;
  shimmer: string;
};

export type GenderPitchReference = {
  gender: "male" | "female" | "other" | "prefer_not_to_say" | "not_provided";
  status: "within_reference_band" | "outside_reference_band" | "not_available";
  pitchMeanHz: number;
  lowerHz: number | null;
  upperHz: number | null;
  interpretation: string;
};

export type RiskResult = {
  riskPercentage: number;
  level: RiskLevel;
  structuredScore: number;
  voiceScore: number | null;
  finalScore: number;
  insights: string[];
  recommendations: string[];
  voiceAnalysis: VoiceMeasurements | null;
  rawFeatures?: Record<string, number> | null;
  genderPitchReference?: GenderPitchReference | null;
  disclaimer: string;
};

export type VoiceResult = {
  voiceScore: number;
  voiceLabel: "stable" | "slight_variation" | "abnormal_marker";
  voiceAnalysis: VoiceMeasurements;
  rawFeatures: Record<string, number>;
  genderPitchReference: GenderPitchReference;
  disclaimer: string;
};

export type PredictionRecord = {
  id: string;
  patientId: string;
  date: string;
  predictionType: "risk_factors" | "voice" | "multimodal";
  request: Record<string, unknown>;
  response: Record<string, unknown>;
  history: { id: string; date: string; riskPercentage: number; level: RiskLevel; summary: string; voiceStatus: string } | null;
};
