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

// ── Sessions ──────────────────────────────────────────────────────────────────
export type Session = {
  session_id:         string;
  patient_id:         string;
  recorded_at:        string;
  day_number:         number;
  duration_s:         number;
  vocal_clarity_prob: number;
  fluency_prob:       number;
  articulation_prob:  number;
  severity_score:     number;
  severity_label:     string;
  is_healthy:         boolean;
  primary_disorder:   string;
  message:            string;
};

// ── Sentiment ─────────────────────────────────────────────────────────────────
export type ModelScore = {
  model:     string;
  sentiment: string;
  positive:  number;
  neutral:   number;
  negative:  number;
};

export type SentimentResult = {
  sentiment:  "positive" | "neutral" | "negative";
  positive:   number;
  neutral:    number;
  negative:   number;
  message:    string;
  model_used: string;
  all_models: ModelScore[];
};

// ── Progress ──────────────────────────────────────────────────────────────────
export type ProgressPoint = {
  day_number:    number;
  vocal_clarity: number;
  fluency:       number;
  articulation:  number;
  severity:      number;
  session_count: number;
};

