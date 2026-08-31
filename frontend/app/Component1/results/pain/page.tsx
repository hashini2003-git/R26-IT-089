"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Icon, FEATURE_ICON, loadResult, type IpeResult } from "../../_lib/ipe-ui";
import { SidebarLayout, GlassCard, Ring, Meter, Reveal, DetailHeader, PageContainer, getSeverity, TEXT, TEXT2, MONO } from "../_shell";

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
    <SidebarLayout title="Pain Assessment">
      <PageContainer>
        <DetailHeader eyebrow="Visual Pain Phenotyping (VPP)" title="Pain Assessment" subtitle="How the AI reads redness, sores, and stiffness in your scan to estimate a pain intensity score." />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Score ring */}
          <Reveal>
            <GlassCard style={{ textAlign: "center", padding: "28px 20px", height: "100%" }}>
              <Ring value={result.ppi.score / 10} color={result.ppi.color} size={148} stroke={13}>
                <div style={{ fontSize: 34, fontWeight: 800, color: TEXT, fontFamily: MONO }}>{result.ppi.score.toFixed(1)}</div>
                <div style={{ fontSize: 11.5, color: TEXT2 }}>out of 10</div>
              </Ring>
              <div style={{ display: "inline-block", marginTop: 14, padding: "6px 16px", borderRadius: 20, background: `${result.ppi.color}18`, color: result.ppi.color, fontWeight: 700, fontSize: 13 }}>
                {result.ppi.label}
              </div>
            </GlassCard>
          </Reveal>

          {/* Breakdown */}
          <Reveal delay={80}>
            <GlassCard style={{ height: "100%" }}>
              <div style={{ fontSize: 10.5, fontWeight: 700, color: "#0D9488", letterSpacing: 1, textTransform: "uppercase", marginBottom: 14 }}>
                What we found
              </div>
              {rows.map((r) => (
                <div key={r.key} style={{ marginBottom: 16 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                    <span style={{ fontSize: 13.5, fontWeight: 600, color: TEXT, display: "inline-flex", alignItems: "center", gap: 7 }}>
                      <Icon name={FEATURE_ICON[r.key]} size={15} color={getSeverity(r.v).color} /> {r.label}
                    </span>
                    <span style={{ fontSize: 12.5, color: TEXT2, fontFamily: MONO }}>{Math.round(r.v * 100)}%</span>
                  </div>
                  <Meter value={r.v} color={getSeverity(r.v).color} />
                  <div style={{ fontSize: 12, color: TEXT2, marginTop: 5 }}>{featureNote(r.key, r.v)}</div>
                </div>
              ))}
            </GlassCard>
          </Reveal>
        </div>

        <Reveal delay={140} style={{ marginTop: 16 }}>
          <GlassCard style={{ borderLeft: `4px solid ${result.ppi.color}` }}>
            <div style={{ fontSize: 12.5, color: TEXT, lineHeight: 1.6 }}>
              These three visual features are combined into your PPI (Proxy Pain Intensity) score.
              Higher redness, sore presence, and stiffness all raise your pain estimate.
            </div>
          </GlassCard>
        </Reveal>
      </PageContainer>
    </SidebarLayout>
  );
}
