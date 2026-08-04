"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { BarChart, C, Chip, FEATURE_ICON, FEATURE_META, Glass, Hero, Icon, PillButton, Ring, Screen, TabBar, TopBar, loadResult, severityColor, type IpeResult } from "../_lib/ipe-ui";

function NavCard({
  icon, title, subtitle, onClick, accent,
}: { icon: React.ComponentProps<typeof Icon>["name"]; title: string; subtitle: string; onClick: () => void; accent: string }) {
  return (
    <Glass onClick={onClick} style={{ display: "flex", alignItems: "center", gap: 14, padding: 16 }}>
      <div style={{
        width: 44, height: 44, borderRadius: 14, flexShrink: 0,
        background: `${accent}18`, display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <Icon name={icon} size={20} color={accent} />
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: C.ink }}>{title}</div>
        <div style={{ fontSize: 11.5, color: C.inkMuted, marginTop: 1 }}>{subtitle}</div>
      </div>
      <svg width="8" height="14" viewBox="0 0 8 14" fill="none">
        <path d="M1 1l6 6-6 6" stroke={C.inkFaint} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </Glass>
  );
}

export default function ResultsOverview() {
  const router = useRouter();
  const [result, setResult] = useState<IpeResult | null>(null);

  useEffect(() => {
    const r = loadResult();
    if (!r) { router.replace("/Component1"); return; }
    setResult(r);
  }, [router]);

  if (!result) return null;

  const painFrac = result.ppi.score / 10;
  const fnFrac = 1 - (result.fis.speech + result.fis.swallowing + result.fis.mouth) / 3;

  function speak() {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    const text =
      `Your predicted condition is ${result!.classification.name}, with ${result!.classification.confidence} percent confidence. ` +
      `Your pain score is ${result!.ppi.score.toFixed(1)} out of 10. ${result!.urgency.message}`;
    const u = new SpeechSynthesisUtterance(text);
    u.rate = 0.92;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(u);
  }

  return (
    <Screen>
      <TopBar title="Results" subtitle={result.classification.name} />

      {/* Hero summary — deep gradient card, matches reference "status" style */}
      <Hero
        badge={{ text: result.urgency.level, icon: "alert", color: `${result.urgency.color}CC` }}
        title={result.classification.name}
        subtitle={result.urgency.message}
      >
        <div style={{ marginBottom: 14 }}>
          <Chip text={`${result.classification.confidence}% confidence`} tone="amber" icon="pulse" />
        </div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <PillButton variant="light" onClick={speak}><Icon name="mic" size={14} color={C.teal} /> Listen</PillButton>
          <PillButton variant="light" onClick={() => router.push("/Component1/results/report")}><Icon name="document" size={14} color={C.teal} /> Get report</PillButton>
          <PillButton variant="light" onClick={() => router.push("/Component1/results/pain")}>View pain →</PillButton>
        </div>
      </Hero>
      <div style={{ height: 16 }} />

      {/* Two ring cards: pain + function */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
        <Glass onClick={() => router.push("/Component1/results/pain")} style={{ textAlign: "center" }}>
          <Ring value={painFrac} color={result.ppi.color} size={92} stroke={9}>
            <div style={{ fontSize: 20, fontWeight: 800, color: C.ink }}>{result.ppi.score.toFixed(1)}</div>
            <div style={{ fontSize: 9.5, color: C.inkMuted }}>/ 10</div>
          </Ring>
          <div style={{ fontSize: 13, fontWeight: 700, color: C.ink, marginTop: 10 }}>Pain (PPI)</div>
          <div style={{ fontSize: 11.5, color: C.inkMuted }}>{result.ppi.label} →</div>
        </Glass>

        <Glass onClick={() => router.push("/Component1/results/function")} style={{ textAlign: "center" }}>
          <Ring value={fnFrac} color={C.teal} size={92} stroke={9}>
            <div style={{ fontSize: 20, fontWeight: 800, color: C.ink }}>{Math.round(fnFrac * 100)}%</div>
            <div style={{ fontSize: 9.5, color: C.inkMuted }}>normal</div>
          </Ring>
          <div style={{ fontSize: 13, fontWeight: 700, color: C.ink, marginTop: 10 }}>Function (FIS)</div>
          <div style={{ fontSize: 11.5, color: C.inkMuted }}>3 areas →</div>
        </Glass>
      </div>

      {/* Feature stat cards — quick jump straight into each biomarker page */}
      <div style={{ fontSize: 11, fontWeight: 700, color: C.teal, letterSpacing: 0.4, textTransform: "uppercase", margin: "4px 4px 10px" }}>
        Pain biomarkers
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 8, marginBottom: 18 }}>
        {(["erythema", "ulceration", "texture", "physio"] as const).map((key) => {
          const raw = result.visual_features as unknown as Record<string, number>;
          const value = key === "physio" ? 1 - raw.physio : raw[key];
          const meta = FEATURE_META[key];
          const color = severityColor(value);
          return (
            <Glass
              key={key}
              onClick={() => router.push(`/Component1/results/visual/${key}`)}
              style={{ padding: "10px 6px", textAlign: "center" }}
            >
              <div style={{ display: "flex", justifyContent: "center" }}><Icon name={FEATURE_ICON[key]} size={17} color={color} /></div>
              <div style={{ fontSize: 13, fontWeight: 800, color, marginTop: 4 }}>{Math.round(value * 100)}%</div>
              <div style={{ fontSize: 9, color: C.inkMuted, marginTop: 1, lineHeight: 1.2 }}>{meta.label}</div>
            </Glass>
          );
        })}
      </div>

      {/* Bar chart — all biomarkers at a glance, axis-labeled */}
      <Glass style={{ marginBottom: 18 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: C.teal, letterSpacing: 0.4, textTransform: "uppercase", marginBottom: 6 }}>
          Biomarker levels
        </div>
        <BarChart
          data={(["erythema", "ulceration", "texture", "physio"] as const).map((key) => {
            const raw = result.visual_features as unknown as Record<string, number>;
            const value = key === "physio" ? 1 - raw.physio : raw[key];
            return { label: FEATURE_META[key].label, value: Math.round(value * 100), color: severityColor(value) };
          })}
        />
      </Glass>

      {/* Navigation to every detail page */}
      <div style={{ fontSize: 11, fontWeight: 700, color: C.teal, letterSpacing: 0.4, textTransform: "uppercase", margin: "4px 4px 10px" }}>
        Explore your analysis
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 14 }}>
        <NavCard icon="layers" title="Visual Analysis" subtitle="Where the AI focused attention" accent={C.lavender}
          onClick={() => router.push("/Component1/results/visual")} />
        <NavCard icon="shield" title="Risk & Safety" subtitle="Diagnosis confidence, urgency" accent="#E8483A"
          onClick={() => router.push("/Component1/results/risk")} />
        <NavCard icon="pill" title="Treatment Plan" subtitle="Your personalized care pathway" accent="#2ECC91"
          onClick={() => router.push("/Component1/results/treatment")} />
        <NavCard icon="document" title="Clinical Report" subtitle="Download PDF with QR code" accent={C.teal}
          onClick={() => router.push("/Component1/results/report")} />
        <NavCard icon="trend" title="Before & After" subtitle="Compare two visits side by side" accent={C.lavender}
          onClick={() => router.push("/Component1/compare")} />
        </div>

      {/* Assistant message */}
      <Glass style={{ marginBottom: 90, borderLeft: `4px solid ${C.teal}` }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: C.teal, letterSpacing: 0.4, textTransform: "uppercase", marginBottom: 6 }}>
          Summary
        </div>
        <div style={{ fontSize: 13.5, color: C.ink, lineHeight: 1.6, marginBottom: 12 }}>{result.assistant_message}</div>

        {/* ADD BUTTON HERE ↓ */}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button
            onClick={speak}
            style={{
              background: C.tealLight,
              border: `1px solid ${C.teal}30`,
              borderRadius: 10,
              padding: "7px 14px",
              fontSize: 12,
              fontWeight: 700,
              color: C.teal,
              cursor: "pointer",
            }}
          >
            🔊 Listen
          </button>
          <button
            onClick={() => router.push("/Component1/assistant")}
            style={{
              background: `linear-gradient(135deg,${C.teal},#007A6E)`,
              border: "none",
              borderRadius: 10,
              padding: "7px 14px",
              fontSize: 12,
              fontWeight: 700,
              color: "#fff",
              cursor: "pointer",
            }}
          >
            💬 Talk to Assistant
          </button>
        </div>
      </Glass>
      

      <TabBar active="results" />
    </Screen>
  );
}