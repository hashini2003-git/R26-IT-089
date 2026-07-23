"use client";

import React, { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { C, FONT, Icon, saveResult, type IpeResult } from "./_lib/ipe-ui";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export default function Component1Home() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);

  function pick(f: File | undefined | null) {
    if (!f) return;
    if (!f.type.startsWith("image/")) { setError("Please choose an image file."); return; }
    setError(null);
    setFile(f);
    setPreview(URL.createObjectURL(f));
  }

  async function analyze() {
    if (!file) return;
    setLoading(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch(`${API}/predict`, { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Analysis failed.");
      saveResult(data as IpeResult);
      router.push("/Component1/results");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not reach the server.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{
      minHeight: "100vh",
      background: `linear-gradient(175deg, #0B4A44 0%, #0E5C54 32%, #159E92 68%, #2CBFB0 100%)`,
      fontFamily: FONT,
      display: "flex", justifyContent: "center",
      position: "relative", overflow: "hidden",
    }}>
      {/* Decorative glow orbs — depth, not clutter */}
      <div style={{ position: "absolute", top: -80, left: -60, width: 260, height: 260, borderRadius: "50%", background: "rgba(255,255,255,0.08)", filter: "blur(30px)" }} />
      <div style={{ position: "absolute", bottom: 160, right: -90, width: 220, height: 220, borderRadius: "50%", background: "rgba(255,255,255,0.06)", filter: "blur(30px)" }} />

      <div style={{ width: "100%", maxWidth: 430, display: "flex", flexDirection: "column", minHeight: "100vh", position: "relative" }}>

        {/* Top: brand mark + tagline, full-bleed like reference onboarding screens */}
        <div style={{ padding: "56px 28px 0", color: "#fff" }}>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            background: "rgba(255,255,255,0.14)", padding: "6px 13px 6px 10px", borderRadius: 20,
            fontSize: 11, fontWeight: 700, marginBottom: 22, backdropFilter: "blur(6px)",
          }}>
            <Icon name="stethoscope" size={13} />
            Clinically-informed AI
          </div>
          <h1 style={{ fontSize: 30, fontWeight: 800, letterSpacing: "-0.03em", lineHeight: 1.15, margin: "0 0 10px" }}>
            Understand your<br />oral health instantly
          </h1>
          <p style={{ fontSize: 14, opacity: 0.85, lineHeight: 1.55, margin: "0 0 24px", maxWidth: 300 }}>
            Upload a photo of the affected area. Our AI checks pain indicators,
            function impact, and urgency in seconds — reviewed by your doctor.
          </p>

          <div style={{ display: "flex", gap: 22 }}>
            <Stat n="2,469" l="Training images" />
            <Stat n="4" l="Diagnostic classes" />
            <Stat n="<5s" l="Analysis time" />
          </div>
        </div>

        {/* Centered medallion illustration — stands in for the "trusted doctor" photo */}
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px 0" }}>
          <div style={{
            width: 150, height: 150, borderRadius: "50%",
            background: "rgba(255,255,255,0.10)", backdropFilter: "blur(10px)",
            border: "1px solid rgba(255,255,255,0.22)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <div style={{
              width: 104, height: 104, borderRadius: "50%",
              background: "rgba(255,255,255,0.16)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <Icon name="camera" size={46} color="#fff" strokeWidth={1.5} />
            </div>
          </div>
        </div>

        {/* Bottom sheet — the actual interactive card, frosted white over the gradient */}
        <div style={{
          background: "#fff", borderTopLeftRadius: 32, borderTopRightRadius: 32,
          padding: "26px 22px 110px", boxShadow: "0 -20px 50px rgba(0,0,0,0.18)",
        }}>
          {!preview ? (
            <div
              onClick={() => inputRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => { e.preventDefault(); setDragOver(false); pick(e.dataTransfer.files?.[0]); }}
              style={{
                borderRadius: 20, padding: "26px 20px", textAlign: "center", cursor: "pointer",
                background: dragOver ? C.tealSoft : "#F4FAF9",
                border: `2px dashed ${dragOver ? C.teal : "rgba(21,50,56,0.14)"}`,
                transition: "all .15s",
              }}
            >
              <div style={{ fontSize: 15.5, fontWeight: 700, color: C.ink, marginBottom: 4 }}>
                Tap to upload a photo
              </div>
              <div style={{ fontSize: 12.5, color: C.inkMuted }}>or drag it here — JPG or PNG</div>
            </div>
          ) : (
            <div style={{ borderRadius: 20, overflow: "hidden", marginBottom: 14, background: "#0B1F1D" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={preview} alt="Selected" style={{ width: "100%", height: 200, objectFit: "cover", display: "block" }} />
            </div>
          )}
          <input ref={inputRef} type="file" accept="image/*" capture="environment" style={{ display: "none" }}
            onChange={(e) => pick(e.target.files?.[0])} />

          {error && (
            <div style={{ marginTop: 12, padding: "10px 14px", borderRadius: 12, background: "#FDEDEB", color: "#E8483A", fontSize: 13, fontWeight: 600 }}>
              {error}
            </div>
          )}

          <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
            {preview && (
              <button
                onClick={() => { setFile(null); setPreview(null); }}
                style={{
                  padding: "16px 20px", borderRadius: 999, border: `1px solid rgba(21,50,56,0.14)`,
                  background: "transparent", color: C.inkMuted, fontWeight: 700, fontSize: 13.5,
                  cursor: "pointer", fontFamily: FONT,
                }}
              >
                Change
              </button>
            )}
            <button
              onClick={preview ? analyze : () => inputRef.current?.click()}
              disabled={loading}
              style={{
                flex: 1, padding: "17px", border: "none", borderRadius: 999,
                fontSize: 15, fontWeight: 700, color: "#fff", fontFamily: FONT,
                background: loading ? "#B9C6C7" : `linear-gradient(135deg, #159E92, #0E5C54)`,
                cursor: loading ? "not-allowed" : "pointer",
                boxShadow: loading ? "none" : "0 12px 28px rgba(14,92,84,0.35)",
              }}
            >
              {loading ? "Analyzing…" : preview ? "Analyze photo →" : "Get started →"}
            </button>
          </div>
        </div>
      </div>

      {/* Floating tab bar */}
      <div style={{
        position: "fixed", bottom: 18, left: "50%", transform: "translateX(-50%)",
        display: "flex", gap: 6, background: "rgba(255,255,255,0.9)",
        backdropFilter: "blur(20px)", borderRadius: 24, padding: 6,
        boxShadow: "0 12px 32px rgba(0,0,0,0.18)", zIndex: 50,
      }}>
        <TabIcon active label="Analyze" onClick={() => {}} icon="upload" />
        <TabIcon label="Results" onClick={() => router.push("/Component1/results")} icon="clock" />
        <TabIcon label="Progress" onClick={() => router.push("/Component1/progress")} icon="bars" />
      </div>
    </div>
  );
}

function Stat({ n, l }: { n: string; l: string }) {
  return (
    <div>
      <div style={{ fontSize: 19, fontWeight: 800, color: "#fff" }}>{n}</div>
      <div style={{ fontSize: 10.5, color: "rgba(255,255,255,0.75)" }}>{l}</div>
    </div>
  );
}

function TabIcon({ active, label, onClick, icon }: { active?: boolean; label: string; onClick: () => void; icon: "upload" | "clock" | "bars" }) {
  const color = active ? "#fff" : "#5B7A80";
  const paths: Record<string, React.ReactNode> = {
    upload: <><path d="M12 16V4M12 4L7 9M12 4l5 5" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /><path d="M4 16v3a2 2 0 002 2h12a2 2 0 002-2v-3" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></>,
    clock: <><circle cx="12" cy="12" r="9" stroke={color} strokeWidth="2" /><path d="M12 7v5l3 3" stroke={color} strokeWidth="2" strokeLinecap="round" /></>,
    bars: <path d="M4 19V9M11 19V5M18 19v-7" stroke={color} strokeWidth="2" strokeLinecap="round" />,
  };
  return (
    <button onClick={onClick} style={{
      display: "flex", alignItems: "center", gap: 7,
      padding: active ? "10px 18px" : "10px 14px", borderRadius: 18, border: "none",
      cursor: "pointer", background: active ? C.teal : "transparent", transition: "all .2s",
    }}>
      <svg width="21" height="21" viewBox="0 0 24 24" fill="none">{paths[icon]}</svg>
      {active && <span style={{ color: "#fff", fontSize: 13, fontWeight: 600 }}>{label}</span>}
    </button>
  );
}
