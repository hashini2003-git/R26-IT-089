"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { C, FEATURE_ICON, FEATURE_META, Glass, Icon, Ring, Screen, TabBar, TopBar, loadResult, severityColor, type IpeResult } from "../../../_lib/ipe-ui";

export default function FeatureDetail() {
  const router = useRouter();
  const params = useParams<{ feature: string }>();
  const [result, setResult] = useState<IpeResult | null>(null);

  useEffect(() => {
    const r = loadResult();
    if (!r) { router.replace("/Component1"); return; }
    setResult(r);
  }, [router]);

  if (!result) return null;

  const key = params.feature as string;
  const meta = FEATURE_META[key];
  if (!meta) {
    return (
      <Screen>
        <TopBar title="Not found" />
        <Glass><div style={{ color: C.ink }}>Unknown feature: {key}</div></Glass>
        <TabBar active="results" />
      </Screen>
    );
  }

  const raw = result.visual_features as unknown as Record<string, number>;
  const value = key === "physio" ? 1 - raw.physio : raw[key];
  const color = severityColor(value);

  return (
    <Screen>
      <TopBar title={meta.label} subtitle={meta.short} />

      <Glass style={{ marginBottom: 14, textAlign: "center", padding: "30px 20px" }}>
        <Ring value={value} color={color} size={160} stroke={14}>
          <div style={{ marginBottom: 2 }}><Icon name={FEATURE_ICON[key]} size={40} color={color} /></div>
          <div style={{ fontSize: 24, fontWeight: 800, color: C.ink }}>{Math.round(value * 100)}%</div>
        </Ring>
      </Glass>

      <Glass style={{ marginBottom: 14, borderLeft: `4px solid ${color}` }}>
        <div style={{ fontSize: 11, fontWeight: 700, color, letterSpacing: 0.4, textTransform: "uppercase", marginBottom: 8 }}>
          What this means
        </div>
        <div style={{ fontSize: 13.5, color: C.ink, lineHeight: 1.7 }}>{meta.explain(value)}</div>
      </Glass>

      <Glass style={{ marginBottom: 90 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: C.teal, letterSpacing: 0.4, textTransform: "uppercase", marginBottom: 10 }}>
          Contribution to your scores
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5, color: C.inkMuted, padding: "6px 0", borderBottom: "1px solid rgba(21,50,56,0.06)" }}>
          <span>Pain score (PPI)</span>
          <span style={{ fontWeight: 700, color: C.ink }}>{result.ppi.score.toFixed(1)} / 10</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5, color: C.inkMuted, padding: "6px 0" }}>
          <span>Urgency</span>
          <span style={{ fontWeight: 700, color: result.urgency.color }}>{result.urgency.level}</span>
        </div>
      </Glass>

      <TabBar active="results" />
    </Screen>
  );
}
