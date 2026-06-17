"use client";

const D = {
  bg:         "oklch(0.985 0.004 230)",
  text:       "oklch(0.22 0.018 250)",
  textMuted:  "oklch(0.48 0.018 250)",
  accent:     "oklch(0.55 0.10 220)",
  accentSoft: "oklch(0.96 0.025 220)",
  accentInk:  "oklch(0.36 0.08 220)",
};

export default function LandingPage() {
  return (
    <div style={{ 
      minHeight: "100vh", 
      display: "flex", 
      flexDirection: "column",
      alignItems: "center", 
      justifyContent: "center",
      background: D.bg,
      padding: "40px 20px",
    }}>
      <div style={{
        maxWidth: 600,
        textAlign: "center",
      }}>

        <h1 style={{
          fontSize: "clamp(2.5rem, 5vw, 3.5rem)",
          fontWeight: 600,
          letterSpacing: "-0.025em", 
          lineHeight: 1.1,
          margin: "0 0 18px", 
          color: D.text,
        }}>
          Landing Page
        </h1>
      </div>
    </div>
  );
}