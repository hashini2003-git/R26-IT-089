"use client";

import { useCallback, useEffect, useState } from "react";
import { fetchRiskVoicePredictions } from "../lib/api";
import type { PredictionRecord } from "../lib/types";

export function usePredictions() {
  const [records, setRecords] = useState<PredictionRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const load = useCallback(async () => {
    setLoading(true); setError("");
    try { setRecords(await fetchRiskVoicePredictions()); }
    catch (reason) { setError(reason instanceof Error ? reason.message : "Unable to load records."); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { const timer = window.setTimeout(() => void load(), 0); return () => window.clearTimeout(timer); }, [load]);
  return { records, loading, error, reload: load };
}

export const formatDate = (value: string) => new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
