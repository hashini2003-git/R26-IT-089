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