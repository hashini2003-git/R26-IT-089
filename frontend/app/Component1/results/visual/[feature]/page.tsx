"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Icon, FEATURE_ICON, FEATURE_META, loadResult, type IpeResult } from "../../../_lib/ipe-ui";
import { SidebarLayout, GlassCard, Ring, SeverityScale, Reveal, DetailHeader, PageContainer, getSeverity, TEXT, TEXT2, MONO } from "../../_shell";

/* General, non-personalized explainer for each feature — "what is this, in
   general" — separate from FEATURE_META.explain(), which is the patient's
   own personalized reading. */
const FEATURE_GENERAL_INFO: Record<string, string> = {
  erythema:
    "Erythema is redness of the oral tissue caused by increased blood flow to the area. It's one of the earliest visible signs of inflammation or irritation, and clinicians track both how red the tissue looks and how widely the redness spreads.",
  ulceration:
    "Ulceration means a break or open sore has formed in the surface of the tissue. Sores can range from small, minor irritations that heal on their own to deeper wounds that need clinical treatment and monitoring.",
  texture:
    "Texture describes how smooth or rough, and how flexible or stiff, the tissue surface appears. Changes in texture can point to scarring, thickening, or tissue that is healing abnormally.",
  physio:
    "This is a confidence check, not a symptom. It tells you how sure the AI is that what it's seeing is a real pathological finding — rather than a normal fold, shadow, or anatomical variation that everyone has.",
};

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
      <SidebarLayout title="Not found">
        <PageContainer>
          <DetailHeader eyebrow="Visual Analysis" title="Feature not found" />
          <GlassCard><div style={{ color: TEXT }}>Unknown feature: {key}</div></GlassCard>
        </PageContainer>
      </SidebarLayout>
    );
  }

  const raw = result.visual_features as unknown as Record<string, number>;
  const value = key === "physio" ? 1 - raw.physio : raw[key];
  const sev = getSeverity(value);

  return (
    <SidebarLayout title={meta.label}>
      <PageContainer>
        <DetailHeader eyebrow={meta.short} title={meta.label} />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Score ring + severity scale graph */}
          <Reveal>
            <GlassCard style={{ textAlign: "center", padding: "30px 24px", height: "100%" }}>
              <div style={{ position: "relative", display: "inline-block" }}>
                {/* soft colored glow behind the ring so the exact tier color reads clearly, not washed out */}
                <div style={{ position: "absolute", inset: -14, borderRadius: "50%", background: sev.color, opacity: 0.16, filter: "blur(18px)" }} />
                <Ring value={value} color={sev.color} size={160} stroke={14}>
                  <div style={{ marginBottom: 2 }}><Icon name={FEATURE_ICON[key]} size={40} color={sev.color} /></div>
                  <div style={{ fontSize: 24, fontWeight: 800, color: TEXT, fontFamily: MONO }}>{Math.round(value * 100)}%</div>
                </Ring>
              </div>

              <div style={{ display: "inline-flex", alignItems: "center", gap: 6, marginTop: 12, padding: "5px 14px", borderRadius: 999, background: `${sev.color}1c`, border: `1px solid ${sev.color}40` }}>
                <span style={{ width: 7, height: 7, borderRadius: "50%", background: sev.color }} />
                <span style={{ fontSize: 12.5, fontWeight: 700, color: sev.color }}>{sev.tier} · {sev.label}</span>
              </div>

              <p style={{ fontSize: 11, color: TEXT2, marginTop: 10, lineHeight: 1.5 }}>
                {Math.round(value * 100)}% falls in the <strong style={{ color: sev.color }}>{sev.label}</strong> range.
              </p>

              <div style={{ marginTop: 20, paddingTop: 18, borderTop: "1px solid rgba(21,101,192,0.08)", textAlign: "left" }}>
                <div style={{ fontSize: 10.5, fontWeight: 700, color: TEXT2, letterSpacing: 0.8, textTransform: "uppercase", marginBottom: 10, textAlign: "center" }}>
                  Concern scale
                </div>
                <SeverityScale value={value} />
              </div>
            </GlassCard>
          </Reveal>

          {/* Explanations */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16, height: "100%" }}>
            <Reveal delay={70}>
              <GlassCard>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#1565C0", letterSpacing: 0.4, textTransform: "uppercase", marginBottom: 8 }}>
                  What is {meta.label.toLowerCase()}?
                </div>
                <div style={{ fontSize: 13, color: TEXT2, lineHeight: 1.7 }}>{FEATURE_GENERAL_INFO[key]}</div>
              </GlassCard>
            </Reveal>

            <Reveal delay={140}>
              <GlassCard style={{ borderLeft: `4px solid ${sev.color}` }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: sev.color, letterSpacing: 0.4, textTransform: "uppercase", marginBottom: 8 }}>
                  What this means for you
                </div>
                <div style={{ fontSize: 13.5, color: TEXT, lineHeight: 1.7 }}>{meta.explain(value)}</div>
              </GlassCard>
            </Reveal>

            <Reveal delay={210}>
              <GlassCard style={{ flex: 1 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#0D9488", letterSpacing: 0.4, textTransform: "uppercase", marginBottom: 10 }}>
                  Contribution to your scores
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5, color: TEXT2, padding: "6px 0", borderBottom: "1px solid rgba(21,101,192,0.08)" }}>
                  <span>Pain score (PPI)</span>
                  <span style={{ fontWeight: 700, color: TEXT, fontFamily: MONO }}>{result.ppi.score.toFixed(1)} / 10</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5, color: TEXT2, padding: "6px 0" }}>
                  <span>Urgency</span>
                  <span style={{ fontWeight: 700, color: result.urgency.color }}>{result.urgency.level}</span>
                </div>
              </GlassCard>
            </Reveal>
          </div>
        </div>
      </PageContainer>
    </SidebarLayout>
  );
}
