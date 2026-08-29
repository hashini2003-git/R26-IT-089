"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, Clock, Stethoscope, Heart } from "lucide-react";
import { loadResult, type IpeResult } from "../../_lib/ipe-ui";
import { SidebarLayout, GlassCard, Reveal, DetailHeader, TEXT, TEXT2 } from "../_shell";

export default function TreatmentDetail() {
  const router = useRouter();
  const [result, setResult] = useState<IpeResult | null>(null);

  useEffect(() => {
    const r = loadResult();
    if (!r) { router.replace("/Component1"); return; }
    setResult(r);
  }, [router]);

  if (!result) return null;

  const tiers: { title: string; Icon: typeof AlertTriangle; items: string[]; color: string; bg: string }[] = [
    { title: "Do now", Icon: AlertTriangle, items: result.treatment_plan.immediate, color: "#E8483A", bg: "#FDEDEB" },
    { title: "This week", Icon: Clock, items: result.treatment_plan.short_term, color: "#FF9F43", bg: "#FFF3E4" },
    { title: "Clinical", Icon: Stethoscope, items: result.treatment_plan.clinical, color: "#8B7FD1", bg: "#EFEDFB" },
    { title: "Lifestyle", Icon: Heart, items: result.treatment_plan.lifestyle, color: "#2ECC91", bg: "#E9F9F2" },
  ];

  return (
    <SidebarLayout title="Treatment Plan">
      <div style={{ padding: "28px 26px 48px", maxWidth: 980, margin: "0 auto", fontFamily: "'Inter', system-ui, sans-serif" }}>
        <DetailHeader eyebrow="Personalized Care Pathway" title="Treatment Plan" subtitle="What to do now, this week, clinically, and long-term — generated from your pain, function, and diagnosis scores." />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {tiers.map((t, i) =>
            t.items?.length ? (
              <Reveal key={t.title} delay={i * 70}>
                <GlassCard style={{ background: t.bg, border: `1px solid ${t.color}30`, height: "100%" }}>
                  <div style={{ fontSize: 13.5, fontWeight: 800, color: t.color, marginBottom: 10, display: "flex", alignItems: "center", gap: 8 }}>
                    <t.Icon size={16} color={t.color} /> {t.title}
                  </div>
                  {t.items.map((item, i2) => (
                    <div key={i2} style={{ display: "flex", gap: 8, marginBottom: 8, alignItems: "flex-start" }}>
                      <span style={{ width: 5, height: 5, borderRadius: 3, background: t.color, marginTop: 7, flexShrink: 0 }} />
                      <span style={{ fontSize: 13, color: TEXT, lineHeight: 1.5 }}>{item}</span>
                    </div>
                  ))}
                </GlassCard>
              </Reveal>
            ) : null
          )}
        </div>

        <Reveal delay={280} style={{ marginTop: 16 }}>
          <GlassCard>
            <div style={{ fontSize: 12.5, color: TEXT2, lineHeight: 1.6 }}>
              This plan is generated from your pain, function, and diagnosis scores. It&rsquo;s a starting
              point for the conversation with your doctor, not a replacement for one.
            </div>
          </GlassCard>
        </Reveal>
      </div>
    </SidebarLayout>
  );
}
