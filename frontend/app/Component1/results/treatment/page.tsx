"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { C, Glass, Icon, Screen, TabBar, TopBar, loadResult, type IpeResult } from "../../_lib/ipe-ui";

export default function TreatmentDetail() {
  const router = useRouter();
  const [result, setResult] = useState<IpeResult | null>(null);

  useEffect(() => {
    const r = loadResult();
    if (!r) { router.replace("/Component1"); return; }
    setResult(r);
  }, [router]);

  if (!result) return null;

  const tiers: { title: string; icon: React.ComponentProps<typeof Icon>["name"]; items: string[]; color: string; bg: string }[] = [
    { title: "Do now", icon: "pulse", items: result.treatment_plan.immediate, color: "#E8483A", bg: "#FDEDEB" },
    { title: "This week", icon: "chart", items: result.treatment_plan.short_term, color: "#FF9F43", bg: "#FFF3E4" },
    { title: "Clinical", icon: "stethoscope", items: result.treatment_plan.clinical, color: C.lavender, bg: "#EFEDFB" },
    { title: "Lifestyle", icon: "heart", items: result.treatment_plan.lifestyle, color: "#2ECC91", bg: "#E9F9F2" },
  ];

  return (
    <Screen>
      <TopBar title="Treatment Plan" subtitle="Personalized care pathway" />

      {tiers.map((t) =>
        t.items?.length ? (
          <Glass key={t.title} style={{ marginBottom: 14, background: t.bg, border: `1px solid ${t.color}30` }}>
            <div style={{ fontSize: 13.5, fontWeight: 800, color: t.color, marginBottom: 10, display: "flex", alignItems: "center", gap: 8 }}><Icon name={t.icon} size={16} color={t.color} /> {t.title}</div>
            {t.items.map((item, i) => (
              <div key={i} style={{ display: "flex", gap: 8, marginBottom: 8, alignItems: "flex-start" }}>
                <span style={{ width: 5, height: 5, borderRadius: 3, background: t.color, marginTop: 7, flexShrink: 0 }} />
                <span style={{ fontSize: 13, color: C.ink, lineHeight: 1.5 }}>{item}</span>
              </div>
            ))}
          </Glass>
        ) : null
      )}

      <Glass style={{ marginBottom: 90 }}>
        <div style={{ fontSize: 12.5, color: C.inkMuted, lineHeight: 1.6 }}>
          This plan is generated from your pain, function, and diagnosis scores. It's a starting
          point for the conversation with your doctor, not a replacement for one.
        </div>
      </Glass>

      <TabBar active="results" />
    </Screen>
  );
}
