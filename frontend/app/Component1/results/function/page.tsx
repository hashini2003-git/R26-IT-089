"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Icon, loadResult, type IpeResult } from "../../_lib/ipe-ui";
import { SidebarLayout, GlassCard, Ring, Meter, Reveal, DetailHeader, PageContainer, getSeverity, MINT, TEXT, TEXT2, MONO } from "../_shell";

function tip(key: string, v: number) {
  if (key === "speech") return v > 0.5 ? "Speaking may be difficult right now." : "Speech is only mildly affected.";
  if (key === "swallowing") return v > 0.5 ? "Soft diet recommended for comfort." : "Swallowing is largely unaffected.";
  return v > 0.5 ? "Jaw stretching exercises may help." : "Mouth opening is close to normal.";
}

const ICONS = { speech: "chat", swallowing: "swallow", mouth: "mouth" } as const;

export default function FunctionDetail() {
  const router = useRouter();
  const [result, setResult] = useState<IpeResult | null>(null);

  useEffect(() => {
    const r = loadResult();
    if (!r) { router.replace("/Component1"); return; }
    setResult(r);
  }, [router]);

  if (!result) return null;

  const { speech, swallowing, mouth } = result.fis;
  const overall = (speech + swallowing + mouth) / 3;
  const rows: { key: "speech" | "swallowing" | "mouth"; label: string; v: number }[] = [
    { key: "speech", label: "Speech", v: speech },
    { key: "swallowing", label: "Swallowing", v: swallowing },
    { key: "mouth", label: "Mouth opening", v: mouth },
  ];

  return (
    <SidebarLayout title="Function Assessment">
      <PageContainer>
        <DetailHeader eyebrow="Visual Functional Impact (VFI)" title="Function Assessment" subtitle="How your condition may be affecting speech, swallowing, and mouth opening." />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Reveal>
            <GlassCard style={{ textAlign: "center", padding: "28px 20px", height: "100%" }}>
              <Ring value={1 - overall} color={MINT} size={148} stroke={13}>
                <div style={{ fontSize: 30, fontWeight: 800, color: TEXT, fontFamily: MONO }}>{Math.round((1 - overall) * 100)}%</div>
                <div style={{ fontSize: 11.5, color: TEXT2 }}>normal function</div>
              </Ring>
              <div style={{ display: "inline-block", marginTop: 14, padding: "6px 16px", borderRadius: 20, background: `${getSeverity(overall).color}18`, color: getSeverity(overall).color, fontWeight: 700, fontSize: 13 }}>
                {overall > 0.5 ? "Significant impact" : overall > 0.25 ? "Moderate impact" : "Mild impact"}
              </div>
            </GlassCard>
          </Reveal>

          <Reveal delay={80}>
            <GlassCard style={{ height: "100%" }}>
              <div style={{ fontSize: 10.5, fontWeight: 700, color: MINT, letterSpacing: 1, textTransform: "uppercase", marginBottom: 14 }}>
                Areas affected
              </div>
              {rows.map((r) => (
                <div key={r.key} style={{ marginBottom: 16 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                    <span style={{ fontSize: 13.5, fontWeight: 600, color: TEXT, display: "inline-flex", alignItems: "center", gap: 7 }}>
                      <Icon name={ICONS[r.key]} size={15} color={getSeverity(r.v).color} /> {r.label}
                    </span>
                    <span style={{ fontSize: 12.5, color: TEXT2, fontFamily: MONO }}>{Math.round(r.v * 100)}%</span>
                  </div>
                  <Meter value={r.v} color={getSeverity(r.v).color} />
                  <div style={{ fontSize: 12, color: TEXT2, marginTop: 5 }}>{tip(r.key, r.v)}</div>
                </div>
              ))}
            </GlassCard>
          </Reveal>
        </div>

        <Reveal delay={140} style={{ marginTop: 16 }}>
          <GlassCard style={{ borderLeft: `4px solid ${MINT}` }}>
            <div style={{ fontSize: 12.5, color: TEXT, lineHeight: 1.6 }}>
              FIS estimates how your condition may affect daily activities. This is a supportive
              guide, not a clinical diagnosis — always confirm with your care team.
            </div>
          </GlassCard>
        </Reveal>
      </PageContainer>
    </SidebarLayout>
  );
}
