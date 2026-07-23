"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { C, BarChart, CLASS_COLORS, Glass, Icon, Screen, TabBar, TopBar, loadResult, type IpeResult } from "../../_lib/ipe-ui";

export default function RiskDetail() {
  const router = useRouter();
  const [result, setResult] = useState<IpeResult | null>(null);

  useEffect(() => {
    const r = loadResult();
    if (!r) { router.replace("/Component1"); return; }
    setResult(r);
  }, [router]);

  if (!result) return null;

  const probs = Object.entries(result.classification.all_probs).sort((a, b) => b[1] - a[1]);

  return (
    <Screen>
      <TopBar title="Risk & Safety" subtitle="Diagnosis confidence and urgency" />

      {/* Urgency */}
      <Glass style={{ marginBottom: 14, textAlign: "center", padding: "26px 20px" }}>
        <div style={{
          width: 56, height: 56, borderRadius: 16, margin: "0 auto 12px",
          background: `${result.urgency.color}18`, display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <Icon name="alert" size={26} color={result.urgency.color} />
        </div>
        <div style={{ fontSize: 17, fontWeight: 800, color: result.urgency.color }}>{result.urgency.level}</div>
        <div style={{ fontSize: 13, color: C.inkMuted, marginTop: 3 }}>{result.urgency.timeframe}</div>
        <div style={{
          marginTop: 12, padding: "10px 14px", borderRadius: 12,
          background: `${result.urgency.color}14`, fontSize: 12.5, color: C.ink,
        }}>
          {result.urgency.message}
        </div>
      </Glass>

      {/* Class probabilities — proper axis-labeled bar chart */}
      <Glass style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: C.teal, letterSpacing: 0.4, textTransform: "uppercase", marginBottom: 10 }}>
          Diagnosis confidence
        </div>
        <BarChart data={probs.map(([name, pct]) => ({ label: name, value: pct, color: CLASS_COLORS[name] ?? C.teal }))} />
        <div style={{ display: "flex", gap: 10, marginTop: 6, flexWrap: "wrap" }}>
          <Legend color="#2ECC91" label="Normal" />
          <Legend color="#F5C242" label="Variation" />
          <Legend color="#FF9F43" label="OPMD" />
          <Legend color="#E8483A" label="Oral Cancer" />
        </div>
      </Glass>

      <Glass style={{ marginBottom: 90, borderLeft: "4px solid #E8483A" }}>
        <div style={{ fontSize: 12.5, color: C.ink, lineHeight: 1.6 }}>
          ⚠️ This AI assists clinicians and does not replace a professional diagnosis.
          Always confirm findings with a doctor.
        </div>
      </Glass>

      <TabBar active="results" />
    </Screen>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
      <span style={{ width: 8, height: 8, borderRadius: 4, background: color }} />
      <span style={{ fontSize: 11, color: C.inkMuted }}>{label}</span>
    </div>
  );
}
