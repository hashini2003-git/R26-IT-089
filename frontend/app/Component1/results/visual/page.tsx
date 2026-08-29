"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { RadarChart, Icon, FEATURE_ICON, FEATURE_META, loadResult, type IpeResult } from "../../_lib/ipe-ui";
import { SidebarLayout, GlassCard, Reveal, DetailHeader, PageContainer, SeverityScale, getSeverity, MINT, TEXT, TEXT2, MONO } from "../_shell";

export default function VisualOverview() {
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

  // Most significant finding across the four features — used to place the
  // marker on the color scale below, same scale used on each detail page.
  const worst = Math.max(erythema, ulceration, texture, 1 - physio);

  return (
    <SidebarLayout title="Visual Analysis">
      <PageContainer>
        <DetailHeader eyebrow="Feature Contribution Profile" title="Visual Analysis" subtitle="Each axis shows the strength of that signal detected in your scan. Closer to the edge means a stronger finding." />

        <Reveal>
          <GlassCard style={{ display: "flex", justifyContent: "center", padding: "28px 8px", marginBottom: 20 }}>
            <RadarChart data={radarData} color={MINT} size={280} />
          </GlassCard>
        </Reveal>

        <Reveal delay={60}>
          <GlassCard style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 10.5, fontWeight: 700, color: TEXT2, letterSpacing: 0.8, textTransform: "uppercase", marginBottom: 12, textAlign: "center" }}>
              Concern scale
            </div>
            <SeverityScale value={worst} />
            <p style={{ fontSize: 11.5, color: TEXT2, marginTop: 12, textAlign: "center" }}>
              Marker shows your most significant finding — <strong style={{ color: getSeverity(worst).color }}>{getSeverity(worst).label}</strong>.
            </p>
          </GlassCard>
        </Reveal>

        <div style={{ fontSize: 10.5, fontWeight: 700, color: MINT, letterSpacing: 1, textTransform: "uppercase", marginBottom: 12 }}>
          Explore each feature
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {(["erythema", "ulceration", "texture", "physio"] as const).map((key, i) => {
            const raw = result.visual_features as unknown as Record<string, number>;
            const value = key === "physio" ? 1 - raw.physio : raw[key];
            const meta = FEATURE_META[key];
            const color = getSeverity(value).color;
            return (
              <Reveal key={key} delay={120 + i * 60}>
                <GlassCard onClick={() => router.push(`/Component1/results/visual/${key}`)} style={{ padding: 16, height: "100%" }}>
                  <div style={{ marginBottom: 8 }}><Icon name={FEATURE_ICON[key]} size={22} color={color} /></div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: TEXT }}>{meta.label}</div>
                  <div style={{ fontSize: 11, color: TEXT2, marginBottom: 10 }}>{meta.short}</div>
                  <div style={{ fontSize: 20, fontWeight: 800, color, fontFamily: MONO }}>{Math.round(value * 100)}%</div>
                </GlassCard>
              </Reveal>
            );
          })}
        </div>
      </PageContainer>
    </SidebarLayout>
  );
}
