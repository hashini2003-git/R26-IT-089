"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { C, Glass, Icon, Meter, Ring, Screen, TabBar, TopBar, loadResult, severityColor, type IpeResult } from "../../_lib/ipe-ui";

function tip(key: string, v: number) {
  if (key === "speech") return v > 0.5 ? "Speaking may be difficult right now." : "Speech is only mildly affected.";
  if (key === "swallowing") return v > 0.5 ? "Soft diet recommended for comfort." : "Swallowing is largely unaffected.";
  return v > 0.5 ? "Jaw stretching exercises may help." : "Mouth opening is close to normal.";
}

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
  const ICONS = { speech: "chat", swallowing: "swallow", mouth: "mouth" } as const;

  return (
    <Screen>
      <TopBar title="Function Assessment" subtitle="Visual Functional Impact (VFI)" />

      <Glass style={{ marginBottom: 14, textAlign: "center", padding: "28px 20px" }}>
        <Ring value={1 - overall} color={C.teal} size={148} stroke={13}>
          <div style={{ fontSize: 30, fontWeight: 800, color: C.ink }}>{Math.round((1 - overall) * 100)}%</div>
          <div style={{ fontSize: 11.5, color: C.inkMuted }}>normal function</div>
        </Ring>
        <div style={{
          display: "inline-block", marginTop: 14, padding: "6px 16px", borderRadius: 20,
          background: `${severityColor(overall)}18`, color: severityColor(overall), fontWeight: 700, fontSize: 13,
        }}>
          {overall > 0.5 ? "Significant impact" : overall > 0.25 ? "Moderate impact" : "Mild impact"}
        </div>
      </Glass>

      <Glass style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: C.teal, letterSpacing: 0.4, textTransform: "uppercase", marginBottom: 14 }}>
          Areas affected
        </div>
        {rows.map((r) => (
          <div key={r.key} style={{ marginBottom: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
              <span style={{ fontSize: 13.5, fontWeight: 600, color: C.ink, display: "inline-flex", alignItems: "center", gap: 7 }}><Icon name={ICONS[r.key]} size={15} color={severityColor(r.v)} /> {r.label}</span>
              <span style={{ fontSize: 12.5, color: C.inkMuted }}>{Math.round(r.v * 100)}%</span>
            </div>
            <Meter value={r.v} color={severityColor(r.v)} />
            <div style={{ fontSize: 12, color: C.inkMuted, marginTop: 5 }}>{tip(r.key, r.v)}</div>
          </div>
        ))}
      </Glass>

      <Glass style={{ marginBottom: 90, borderLeft: `4px solid ${C.teal}` }}>
        <div style={{ fontSize: 12.5, color: C.ink, lineHeight: 1.6 }}>
          FIS estimates how your condition may affect daily activities. This is a supportive
          guide, not a clinical diagnosis — always confirm with your care team.
        </div>
      </Glass>

      <TabBar active="results" />
    </Screen>
  );
}
