"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import type { RiskFactors } from "../lib/types";

type AssessmentState = {
  riskFactors: RiskFactors | null;
  setRiskFactors: (value: RiskFactors | null) => void;
};

const AssessmentContext = createContext<AssessmentState | null>(null);

export function AssessmentProvider({ children }: { children: ReactNode }) {
  const [riskFactors, setRiskFactors] = useState<RiskFactors | null>(null);
  return <AssessmentContext.Provider value={{ riskFactors, setRiskFactors }}>{children}</AssessmentContext.Provider>;
}

export function useAssessment() {
  const state = useContext(AssessmentContext);
  if (!state) throw new Error("Assessment context is unavailable");
  return state;
}
