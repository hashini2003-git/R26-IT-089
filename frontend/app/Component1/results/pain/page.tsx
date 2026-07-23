"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { C, FEATURE_ICON, Glass, Icon, Meter, Ring, Screen, TabBar, TopBar, loadResult, severityColor, type IpeResult } from "../../_lib/ipe-ui";

function featureNote(key: string, v: number) {
  if (key === "erythema") return v > 0.6 ? "High inflammation — likely causing burning." : v > 0.3 ? "Moderate redness present." : "Low inflammation detected.";
  if (key === "ulceration") return v > 0.4 ? "Open sore detected — a source of sharp pain." : v > 0.2 ? "Minor sore present." : "No significant ulceration.";
  return v > 0.5 ? "Tissue stiffness — may restrict movement." : v > 0.3 ? "Mild roughness, worth watching." : "Normal tissue texture.";
}

export default function PainDetail() {
  const router = useRouter();
  const [result, setResult] = useState<IpeResult | null>(null);

  useEffect(() => {
    const r = loadResult();
    if (!r) { router.replace("/Component1"); return; }
    setResult(r);
  }, [router]);

  if (!result) return null;
  const { erythema, ulceration, texture } = result.visual_features;
  const rows: { key: "erythema" | "ulceration" | "texture"; label: string; v: number }[] = [
    { key: "erythema", label: "Erythema (redness)", v: erythema },
    { key: "ulceration", label: "Ulceration (sores)", v: ulceration },
    { key: "texture", label: "Texture (stiffness)", v: texture },
  ];

  return (
    <Screen>
      <TopBar title="Pain Assessment" subtitle="Visual Pain Phenotyping (VPP)" />

      <Glass style={{ marginBottom: 14, textAlign: "center", padding: "28px 20px" }}>
        <Ring value={result.ppi.score / 10} color={result.ppi.color} size={148} stroke={13}>
          <div style={{ fontSize: 34, fontWeight: 800, color: C.ink }}>{result.ppi.score.toFixed(1)}</div>
          <div style={{ fontSize: 11.5, color: C.inkMuted }}>out of 10</div>
        </Ring>
        <div style={{
          display: "inline-block", marginTop: 14, padding: "6px 16px", borderRadius: 20,
          background: `${result.ppi.color}18`, color: result.ppi.color, fontWeight: 700, fontSize: 13,
        }}>
          {result.ppi.label}
        </div>
      </Glass>

      <Glass style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: C.teal, letterSpacing: 0.4, textTransform: "uppercase", marginBottom: 14 }}>
          What we found
        </div>
        {rows.map((r) => (
          <div key={r.key} style={{ marginBottom: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
              <span style={{ fontSize: 13.5, fontWeight: 600, color: C.ink, display: "inline-flex", alignItems: "center", gap: 7 }}><Icon name={FEATURE_ICON[r.key]} size={15} color={severityColor(r.v)} /> {r.label}</span>
              <span style={{ fontSize: 12.5, color: C.inkMuted }}>{Math.round(r.v * 100)}%</span>
            </div>
            <Meter value={r.v} color={severityColor(r.v)} />
            <div style={{ fontSize: 12, color: C.inkMuted, marginTop: 5 }}>{featureNote(r.key, r.v)}</div>
          </div>
        ))}
      </Glass>

      <Glass style={{ marginBottom: 90, borderLeft: `4px solid ${result.ppi.color}` }}>
        <div style={{ fontSize: 12.5, color: C.ink, lineHeight: 1.6 }}>
          These three visual features are combined into your PPI (Proxy Pain Intensity) score.
          Higher redness, sore presence, and stiffness all raise your pain estimate.
        </div>
      </Glass>

      <TabBar active="results" />
    </Screen>
  );
}
