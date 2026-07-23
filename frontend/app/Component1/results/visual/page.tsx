"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { C, FEATURE_ICON, FEATURE_META, Glass, Icon, RadarChart, Screen, TabBar, TopBar, loadResult, severityColor, type IpeResult } from "../../_lib/ipe-ui";

export default function VisualDetail() {
  const router = useRouter();
  const [result, setResult] = useState<IpeResult | null>(null);

  useEffect(() => {
    const r = loadResult();
    if (!r) { router.replace("/Component1"); return; }
    setResult(r);
  }, [router]);

  if (!result) return null;
  const { erythema, ulceration, texture, physio } = result.visual_features;

  const radarData = [
    { label: "Erythema", value: erythema },
    { label: "Ulceration", value: ulceration },
    { label: "Texture", value: texture },
    { label: "Pathological", value: 1 - physio },
  ];

  return (
    <Screen>
      <TopBar title="Visual Analysis" subtitle="Feature contribution profile" />

      {/* Radar chart — the actual data visualization the reviewer wants to see */}
      <Glass style={{ marginBottom: 14, display: "flex", justifyContent: "center", padding: "24px 8px" }}>
        <RadarChart data={radarData} color={C.teal} size={252} />
      </Glass>

      {/* Stat cards — each opens its own dedicated page */}
      <div style={{ fontSize: 11, fontWeight: 700, color: C.teal, letterSpacing: 0.4, textTransform: "uppercase", margin: "4px 4px 10px" }}>
        Explore each feature
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 90 }}>
        {(["erythema", "ulceration", "texture", "physio"] as const).map((key) => {
          const raw = result.visual_features as unknown as Record<string, number>;
          const value = key === "physio" ? 1 - raw.physio : raw[key];
          const meta = FEATURE_META[key];
          const color = severityColor(value);
          return (
            <Glass
              key={key}
              onClick={() => router.push(`/Component1/results/visual/${key}`)}
              style={{ padding: 14 }}
            >
              <div style={{ marginBottom: 6 }}><Icon name={FEATURE_ICON[key]} size={20} color={color} /></div>
              <div style={{ fontSize: 12.5, fontWeight: 700, color: C.ink }}>{meta.label}</div>
              <div style={{ fontSize: 11, color: C.inkMuted, marginBottom: 8 }}>{meta.short}</div>
              <div style={{ fontSize: 18, fontWeight: 800, color }}>{Math.round(value * 100)}%</div>
            </Glass>
          );
        })}
      </div>

      <TabBar active="results" />
    </Screen>
  );
}
