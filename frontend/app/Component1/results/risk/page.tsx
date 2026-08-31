"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle } from "lucide-react";
import { BarChart, CLASS_COLORS, loadResult, type IpeResult } from "../../_lib/ipe-ui";
import { SidebarLayout, GlassCard, Reveal, DetailHeader, MINT, TEXT, TEXT2 } from "../_shell";

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
    <SidebarLayout title="Risk & Safety">
      <div style={{ padding: "28px 26px 48px", maxWidth: 980, margin: "0 auto", fontFamily: "'Inter', system-ui, sans-serif" }}>
        <DetailHeader eyebrow="Diagnosis Confidence & Urgency" title="Risk & Safety" subtitle="How confident the AI is in each possible diagnosis, and how urgently you should follow up." />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Reveal>
            <GlassCard style={{ textAlign: "center", padding: "26px 20px", height: "100%" }}>
              <div style={{ width: 56, height: 56, borderRadius: 16, margin: "0 auto 12px", background: `${result.urgency.color}18`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <AlertTriangle size={26} color={result.urgency.color} />
              </div>
              <div style={{ fontSize: 17, fontWeight: 800, color: result.urgency.color }}>{result.urgency.level}</div>
              <div style={{ fontSize: 13, color: TEXT2, marginTop: 3 }}>{result.urgency.timeframe}</div>
              <div style={{ marginTop: 12, padding: "10px 14px", borderRadius: 12, background: `${result.urgency.color}14`, fontSize: 12.5, color: TEXT }}>
                {result.urgency.message}
              </div>
            </GlassCard>
          </Reveal>

          <Reveal delay={80}>
            <GlassCard style={{ height: "100%" }}>
              <div style={{ fontSize: 10.5, fontWeight: 700, color: MINT, letterSpacing: 1, textTransform: "uppercase", marginBottom: 10 }}>
                Diagnosis confidence
              </div>
              <BarChart data={probs.map(([name, pct]) => ({ label: name, value: pct, color: CLASS_COLORS[name] ?? MINT }))} />
              <div style={{ display: "flex", gap: 10, marginTop: 6, flexWrap: "wrap" }}>
                <Legend color="#2ECC91" label="Normal" />
                <Legend color="#F5C242" label="Variation" />
                <Legend color="#FF9F43" label="OPMD" />
                <Legend color="#E8483A" label="Oral Cancer" />
              </div>
            </GlassCard>
          </Reveal>
        </div>

        <Reveal delay={140} style={{ marginTop: 16 }}>
          <GlassCard style={{ borderLeft: "4px solid #E8483A" }}>
            <div style={{ fontSize: 12.5, color: TEXT, lineHeight: 1.6 }}>
              ⚠️ This AI assists clinicians and does not replace a professional diagnosis.
              Always confirm findings with a doctor.
            </div>
          </GlassCard>
        </Reveal>
      </div>
    </SidebarLayout>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
      <span style={{ width: 8, height: 8, borderRadius: 4, background: color }} />
      <span style={{ fontSize: 11, color: TEXT2 }}>{label}</span>
    </div>
  );
}
