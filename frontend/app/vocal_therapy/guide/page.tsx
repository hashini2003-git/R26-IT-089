"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { isLoggedIn } from "../../lib/auth";

// ── Design tokens matches dashboard/analyze/exercises/doctors pages ──────
const D = {
  bg:          "oklch(0.985 0.004 150)",
  surface:     "#ffffff",
  border:      "oklch(0.92 0.01 145)",
  borderStrong:"oklch(0.86 0.015 145)",
  text:        "oklch(0.22 0.015 150)",
  textMuted:   "oklch(0.50 0.015 150)",
  textDim:     "oklch(0.62 0.012 150)",
  accent:      "oklch(0.62 0.14 150)",
  accentSoft:  "oklch(0.96 0.03 150)",
  accentInk:   "oklch(0.38 0.08 150)",
  low:         "oklch(0.62 0.13 160)",
  lowSoft:     "oklch(0.95 0.04 160)",
  lowInk:      "oklch(0.40 0.10 160)",
  mid:         "oklch(0.72 0.13 80)",
  midSoft:     "oklch(0.96 0.05 85)",
  midInk:      "oklch(0.42 0.10 70)",
  high:        "oklch(0.62 0.16 25)",
  highSoft:    "oklch(0.95 0.04 25)",
  highInk:     "oklch(0.42 0.13 25)",
  shadow:      "0 1px 3px rgba(15,32,60,0.06), 0 1px 0 rgba(15,32,60,0.02)",
  shadowMd:    "0 4px 16px rgba(15,32,60,0.07)",
  fontMono:    "'JetBrains Mono', ui-monospace, monospace",
  breakpoints: { mobile: 640, tablet: 768, desktop: 960 },
};

// ── Icons (same family as the other pages) ─────────────────────────────────
const Icons = {
  Mic: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
      <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
      <line x1="12" y1="19" x2="12" y2="23" />
      <line x1="8" y1="23" x2="16" y2="23" />
    </svg>
  ),
  Chart: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  ),
  Exercise: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 5a3 3 0 0 1 0 6H6a3 3 0 0 1 0-6h12z" />
      <path d="M6 11v6a3 3 0 0 0 3 3h6a3 3 0 0 0 3-3v-6" />
    </svg>
  ),
  Doctor: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  ),
  Check: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  ),
  ArrowRight: () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="12 5 19 12 12 19" />
    </svg>
  ),
  ArrowDown: () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="6 9 12 15 18 9" />
    </svg>
  ),
  ArrowUp: () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="18 15 12 9 6 15" />
    </svg>
  ),
  Calendar: () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  ),
  Download: () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  ),
  Gauge: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 14l4-4" />
      <path d="M3.34 19a10 10 0 1 1 17.32 0" />
    </svg>
  ),
  Lightbulb: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 18h6" /><path d="M10 22h4" />
      <path d="M15.09 14c.18-.98.65-1.74 1.41-2.5A4.65 4.65 0 0 0 18 8 6 6 0 0 0 6 8c0 1 .23 2.23 1.5 3.5.71.71 1.21 1.5 1.41 2.5" />
    </svg>
  ),
  Chat: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  ),
  Alert: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  ),
  Heart: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  ),
  Play: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="5 3 19 12 5 21 5 3" />
    </svg>
  ),
};

// ── Responsive hook ──────────────────────────────────────────────────────────
function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);
  useEffect(() => {
    const media = window.matchMedia(query);
    if (media.matches !== matches) setMatches(media.matches);
    const listener = (e: MediaQueryListEvent) => setMatches(e.matches);
    media.addEventListener("change", listener);
    return () => media.removeEventListener("change", listener);
  }, [matches, query]);
  return matches;
}

// ── Card ──────────────────────────────────────────────────────────────────────
function Card({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{
      background: D.surface, borderRadius: 12, padding: "clamp(1rem, 4vw, 1.5rem)",
      border: `1px solid ${D.border}`, boxShadow: D.shadow, ...style,
    }}>
      {children}
    </div>
  );
}

function SectionLabel({ children, icon }: { children: React.ReactNode; icon?: React.ReactNode }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "clamp(0.6rem, 3vw, 0.9rem)" }}>
      {icon && <span style={{ color: D.accent }}>{icon}</span>}
      <div style={{ fontWeight: 700, fontSize: "clamp(0.95rem, 3.5vw, 1.05rem)", color: D.text }}>
        {children}
      </div>
    </div>
  );
}

// ── Step number badge ─────────────────────────────────────────────────────
function StepBadge({ n, color = D.accent }: { n: number | string; color?: string }) {
  return (
    <div style={{
      width: 30, height: 30, borderRadius: "50%", background: color, color: "#fff",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontWeight: 700, fontSize: "0.85rem", flexShrink: 0, fontFamily: D.fontMono,
    }}>
      {n}
    </div>
  );
}

// ── Glossary term row ──────────────────────────────────────────────────────
function TermRow({ term, def, color }: { term: string; def: string; color: string }) {
  return (
    <div style={{
      display: "flex", gap: "0.85rem", alignItems: "flex-start",
      padding: "0.75rem 0", borderBottom: `1px solid ${D.border}`,
    }}>
      <span style={{
        background: `${color}18`, color, borderRadius: 6, padding: "3px 9px",
        fontSize: "0.72rem", fontWeight: 700, whiteSpace: "nowrap" as const, marginTop: 1,
      }}>
        {term}
      </span>
      <span style={{ fontSize: "0.84rem", color: D.textMuted, lineHeight: 1.55 }}>{def}</span>
    </div>
  );
}

// ── Expandable FAQ row ───────────────────────────────────────────────────
function FaqItem({ q, a }: { q: string; a: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{
      border: `1px solid ${D.border}`, borderRadius: 10, overflow: "hidden",
      background: D.surface,
    }}>
      <div
        onClick={() => setOpen(o => !o)}
        style={{
          padding: "0.85rem 1rem", cursor: "pointer", display: "flex",
          justifyContent: "space-between", alignItems: "center", gap: "0.75rem",
        }}
      >
        <span style={{ fontWeight: 600, fontSize: "0.88rem", color: D.text }}>{q}</span>
        <span style={{ color: D.textMuted, flexShrink: 0 }}>
          {open ? <Icons.ArrowUp /> : <Icons.ArrowDown />}
        </span>
      </div>
      {open && (
        <div style={{
          padding: "0 1rem 1rem", fontSize: "0.84rem", color: D.textMuted, lineHeight: 1.6,
        }}>
          {a}
        </div>
      )}
    </div>
  );
}

// ── Page section card (one of the 4 app pages) ─────────────────────────────
function AppPageCard({
  icon, badge, badgeColor, title, tagline, points, href, ctaLabel,
}: {
  icon: React.ReactNode; badge: string; badgeColor: string; title: string;
  tagline: string; points: string[]; href: string; ctaLabel: string;
}) {
  return (
    <Card style={{ display: "flex", flexDirection: "column", gap: "0.9rem", height: "100%" }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "0.5rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.7rem" }}>
          <div style={{
            width: 42, height: 42, borderRadius: 10, background: `${badgeColor}16`,
            color: badgeColor, display: "flex", alignItems: "center", justifyContent: "center",
            flexShrink: 0,
          }}>
            {icon}
          </div>
          <div>
            <div style={{
              fontSize: "0.62rem", fontWeight: 700, color: badgeColor, textTransform: "uppercase",
              letterSpacing: "0.08em",
            }}>{badge}</div>
            <div style={{ fontWeight: 700, fontSize: "1.05rem", color: D.text, lineHeight: 1.2 }}>{title}</div>
          </div>
        </div>
      </div>

      <div style={{ fontSize: "0.85rem", color: D.textMuted, lineHeight: 1.55 }}>{tagline}</div>

      <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", flex: 1 }}>
        {points.map((p, i) => (
          <div key={i} style={{ display: "flex", gap: "0.55rem", alignItems: "flex-start" }}>
            <span style={{ color: badgeColor, marginTop: 3, flexShrink: 0 }}><Icons.Check /></span>
            <span style={{ fontSize: "0.82rem", color: D.text, lineHeight: 1.5 }}>{p}</span>
          </div>
        ))}
      </div>

      <Link href={href} style={{
        marginTop: "0.3rem", textAlign: "center", padding: "0.65rem 1rem", borderRadius: 8,
        background: badgeColor, color: "#fff", fontWeight: 700, fontSize: "0.82rem",
        textDecoration: "none", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.4rem",
      }}>
        {ctaLabel} <Icons.ArrowRight />
      </Link>
    </Card>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────
export default function GuidePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const isMobile = useMediaQuery(`(max-width: ${D.breakpoints.mobile}px)`);

  useEffect(() => {
    if (!isLoggedIn()) { router.replace("/login"); return; }
    setLoading(false);
  }, [router]);

  if (loading) {
    return (
      <div style={{ display: "flex", minHeight: "100vh" }}>
        <div style={{
          flex: 1, display: "flex", alignItems: "center", justifyContent: "center",
          color: D.textMuted, fontFamily: D.fontMono, fontSize: "0.85rem",
        }}>
          Loading guide…
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <div style={{
        flex: 1, overflow: "auto",
        padding: "clamp(1rem, 4vw, 2rem) clamp(0.75rem, 3vw, 1.25rem)",
        maxWidth: D.breakpoints.desktop, margin: "0 auto", width: "100%",
      }}>

        {/* ── Header ── */}
        <div style={{
          background: `linear-gradient(135deg, oklch(0.22 0.14 160) 0%, ${D.accent} 100%)`,
          borderRadius: 14, padding: "clamp(1.25rem, 4vw, 2rem) clamp(1.25rem, 4vw, 1.75rem)",
          color: "#fff", marginBottom: "1.5rem",
        }}>
          <div style={{
            fontSize: "clamp(10px, 3vw, 11px)", fontFamily: D.fontMono, textTransform: "uppercase",
            letterSpacing: "0.1em", color: "rgba(255,255,255,.55)", marginBottom: 6,
          }}>
            Getting started
          </div>
          <div style={{
            fontWeight: 800, fontSize: "clamp(1.4rem, 5.5vw, 2rem)", letterSpacing: "-0.02em",
            marginBottom: "0.4rem", display: "flex", alignItems: "center", gap: "0.6rem",
          }}>
            <Icons.Lightbulb /> How Vocal Therapy works
          </div>
          <div style={{ opacity: 0.85, fontSize: "clamp(0.8rem, 3vw, 0.95rem)", maxWidth: 560, lineHeight: 1.6 }}>
            A simple, plain-language walkthrough of every part of the app what each page does,
            what the numbers mean, and what to do first.
          </div>
        </div>

        {/* ── In a nutshell ── */}
        <Card style={{ marginBottom: "1.5rem", background: D.accentSoft, border: `1px solid oklch(0.88 0.05 145)` }}>
          <div style={{ display: "flex", gap: "0.85rem", alignItems: "flex-start" }}>
            <span style={{ color: D.accentInk, flexShrink: 0, marginTop: 2 }}><Icons.Heart /></span>
            <div>
              <div style={{ fontWeight: 700, color: D.accentInk, marginBottom: "0.3rem", fontSize: "0.95rem" }}>
                In one sentence
              </div>
              <div style={{ fontSize: "0.88rem", color: D.text, lineHeight: 1.6 }}>
                Vocal Therapy listens to your voice once a day for 30 days, tells you in plain language
                how your speech is recovering, gives you exercises matched to where you are right now,
                and connects you to a real speech therapist if you need one.
              </div>
            </div>
          </div>
        </Card>

        {/* ── The 4 pages ── */}
        <SectionLabel icon={<Icons.Chart />}>The 4 main pages</SectionLabel>
        <div style={{
          display: "grid",
          gridTemplateColumns: isMobile ? "1fr" : "repeat(2, 1fr)",
          gap: "1.1rem", marginBottom: "2rem",
        }}>
          <AppPageCard
            icon={<Icons.Chart />}
            badge="Page 1 · Your progress"
            badgeColor="oklch(0.55 0.10 180)"
            title="Dashboard"
            tagline="Your home base. A snapshot of how your voice has changed since day one, and how it's trending now."
            points={[
              "A round gauge (\"Therapy index\") gives one overall number for today",
              "A 30-day calendar shows a colored square for every day you checked in",
              "Charts show Vocal Clarity, Speech Fluency, and Articulation over time",
              "A list of every past recording, with its three scores",
              "AI-written suggestions and a chat assistant you can ask questions",
            ]}
            href="/vocal_therapy/dashboard"
            ctaLabel="Open Dashboard"
          />
          <AppPageCard
            icon={<Icons.Mic />}
            badge="Page 2 · Today's check-in"
            badgeColor={D.accent}
            title="Analyze"
            tagline="Where you record your voice each day. This is the only page that actually creates new data."
            points={[
              "Read a short passage out loud, or upload an existing audio file",
              "A live spectrogram and volume meter show your voice as you speak",
              "Stop, and the AI scores your Vocal Clarity, Fluency, and Articulation",
              "Your result is automatically saved to your Dashboard",
            ]}
            href="/vocal_therapy/analyze"
            ctaLabel="Start Today's Check-in"
          />
          <AppPageCard
            icon={<Icons.Exercise />}
            badge="Page 3 · Practice"
            badgeColor={D.low}
            title="Exercises"
            tagline="A set of voice exercises chosen specifically for your latest score not generic, just for you."
            points={[
              "Difficulty (Beginner → Clinical) is set automatically from your last result",
              "Each exercise has audio guidance, a tutorial video, and clear steps",
              "A practice recorder lets you test yourself without affecting your official scores",
              "\"Before You Begin\" tips help you warm up properly first",
            ]}
            href="/vocal_therapy/exercises"
            ctaLabel="View My Exercises"
          />
          <AppPageCard
            icon={<Icons.Doctor />}
            badge="Page 4 · Professional help"
            badgeColor="oklch(0.62 0.15 42)"
            title="Doctors"
            tagline="If your results suggest you need a specialist, this is where you find and book one."
            points={[
              "Browse certified speech-language pathologists and audiologists",
              "See real-time availability before you commit",
              "Tap \"Book Now\" to be taken straight to that doctor's booking page",
              "Recommended automatically when your scores need attention",
            ]}
            href="/vocal_therapy/doctors"
            ctaLabel="Find a Specialist"
          />
        </div>

        {/* ── Step-by-step: what to do, in order ── */}
        <SectionLabel icon={<Icons.Calendar />}>What to do, step by step</SectionLabel>
        <Card style={{ marginBottom: "2rem" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "1.1rem" }}>
            {[
              {
                title: "Record your check-in once a day",
                color: D.accent,
                body: "Go to Analyze and read the short passage aloud (or upload a recording). Try to do this around the same time every day, somewhere quiet, for all 30 days.",
              },
              {
                title: "Check your Dashboard",
                color: "oklch(0.55 0.10 180)",
                body: "After recording, your Dashboard updates automatically. Look at the Therapy Index gauge and the calendar green means things are going well, orange/red means there's more work to do.",
              },
              {
                title: "Do the exercises that match your score",
                color: D.low,
                body: "Visit Exercises. You don't need to choose a difficulty the app already picked exercises that fit your latest result. Follow the steps and play the tutorial videos.",
              },
              {
                title: "Use the practice recorder to check your form",
                color: D.low,
                body: "Still on the Exercises page, you can record yourself practicing. This won't change your official scores it's just for your own feedback before your next real check-in.",
              },
              {
                title: "If a result says \"needs attention,\" book a doctor",
                color: "oklch(0.62 0.15 42)",
                body: "The Dashboard and Exercises pages will both nudge you toward this. Go to Doctors, pick someone available, and tap Book Now.",
              },
              {
                title: "Download your report when you want to share progress",
                color: D.accentInk,
                body: "On the Dashboard, the \"Download Report\" button creates a printable summary of your 30 days useful to bring to a clinical appointment.",
              },
            ].map((s, i) => (
              <div key={i} style={{ display: "flex", gap: "0.9rem", alignItems: "flex-start" }}>
                <StepBadge n={i + 1} color={s.color} />
                <div style={{ paddingTop: 2 }}>
                  <div style={{ fontWeight: 700, fontSize: "0.92rem", color: D.text, marginBottom: 2 }}>
                    {s.title}
                  </div>
                  <div style={{ fontSize: "0.83rem", color: D.textMuted, lineHeight: 1.55 }}>
                    {s.body}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* ── Understanding your scores ── */}
        <SectionLabel icon={<Icons.Gauge />}>Understanding your scores</SectionLabel>
        <div style={{
          display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: "1.1rem", marginBottom: "1.1rem",
        }}>
          <Card>
            <div style={{ fontWeight: 700, fontSize: "0.9rem", color: D.text, marginBottom: "0.7rem" }}>
              The 3 things we measure
            </div>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <TermRow color="#4ECDC4" term="Vocal Clarity"
                def="How clean and steady your voice sounds fewer breathy, strained, or shaky qualities." />
              <TermRow color="#FFD93D" term="Speech Fluency"
                def="How smoothly your words flow fewer unwanted pauses, repeats, or blocks." />
              <TermRow color="#FF6B6B" term="Articulation"
                def="How clearly each sound and word is formed and understood." />
            </div>
            <div style={{ fontSize: "0.78rem", color: D.textDim, marginTop: "0.7rem", lineHeight: 1.5 }}>
              All three are shown as a score from 0–100, where <strong>higher is always better</strong>.
            </div>
          </Card>

          <Card>
            <div style={{ fontWeight: 700, fontSize: "0.9rem", color: D.text, marginBottom: "0.7rem" }}>
              What the colors mean
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.65rem" }}>
              {[
                { label: "70–100 · No concern",      color: D.low,  sub: "Within the normal recovery range" },
                { label: "55–69 · Mild",              color: D.mid,  sub: "Keep doing your daily exercises" },
                { label: "40–54 · Moderate",          color: "oklch(0.62 0.15 42)", sub: "Worth extra attention and monitoring" },
                { label: "Below 40 · Needs attention", color: D.high, sub: "Consider booking a specialist soon" },
              ].map(row => (
                <div key={row.label} style={{ display: "flex", alignItems: "center", gap: "0.65rem" }}>
                  <span style={{ width: 12, height: 12, borderRadius: 4, background: row.color, flexShrink: 0 }} />
                  <div>
                    <div style={{ fontSize: "0.82rem", fontWeight: 700, color: D.text }}>{row.label}</div>
                    <div style={{ fontSize: "0.75rem", color: D.textMuted }}>{row.sub}</div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        <Card style={{ marginBottom: "2rem" }}>
          <div style={{ fontWeight: 700, fontSize: "0.9rem", color: D.text, marginBottom: "0.7rem" }}>
            Other words you'll see around the app
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <TermRow color={D.accent} term="Therapy Index"
              def="One combined number (the average of all three scores) shown as a circular gauge on your Dashboard. A quick way to see 'how am I doing overall' at a glance." />
            <TermRow color={D.accent} term="Day X of 30"
              def="Where you are in your 30-day programme, counted from your surgery or treatment start date." />
            <TermRow color={D.accent} term="Severity stage"
              def="A plain-English label (No concern / Mild / Moderate / Needs attention) that summarizes your most recent week of check-ins." />
            <TermRow color={D.accent} term="Trend"
              def="Whether your scores are improving, staying stable, or going down compared to where you started." />
            <TermRow color={D.accent} term="Session"
              def="One completed voice check-in, saved with its date, duration, and three scores." />
          </div>
        </Card>

        {/* ── A typical day ── */}
        <SectionLabel icon={<Icons.Play />}>What a typical day looks like</SectionLabel>
        <Card style={{ marginBottom: "2rem" }}>
          <div style={{
            display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(4, 1fr)", gap: "0.9rem",
          }}>
            {[
              { icon: <Icons.Mic />, color: D.accent, label: "1. Record", text: "Open Analyze, read the passage aloud, stop and analyze." },
              { icon: <Icons.Chart />, color: "oklch(0.55 0.10 180)", label: "2. Check", text: "Glance at your Dashboard gauge and today's square on the calendar." },
              { icon: <Icons.Exercise />, color: D.low, label: "3. Practice", text: "Spend a few minutes on the exercises matched to your score." },
              { icon: <Icons.Doctor />, color: "oklch(0.62 0.15 42)", label: "4. Get help", text: "If flagged, book time with a doctor on the Doctors page." },
            ].map((s, i) => (
              <div key={i} style={{
                display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center",
                gap: "0.5rem", padding: "0.5rem",
              }}>
                <div style={{
                  width: 46, height: 46, borderRadius: "50%", background: `${s.color}16`, color: s.color,
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  {s.icon}
                </div>
                <div style={{ fontWeight: 700, fontSize: "0.82rem", color: D.text }}>{s.label}</div>
                <div style={{ fontSize: "0.76rem", color: D.textMuted, lineHeight: 1.5 }}>{s.text}</div>
              </div>
            ))}
          </div>
        </Card>

        {/* ── Where the chatbot fits in ── */}
        <Card style={{ marginBottom: "2rem", display: "flex", gap: "0.9rem", alignItems: "flex-start" }}>
          <span style={{ color: D.accentInk, flexShrink: 0, marginTop: 2 }}><Icons.Chat /></span>
          <div>
            <div style={{ fontWeight: 700, color: D.text, marginBottom: "0.3rem", fontSize: "0.92rem" }}>
              Stuck? Ask the chat assistant
            </div>
            <div style={{ fontSize: "0.84rem", color: D.textMuted, lineHeight: 1.6 }}>
              On the Dashboard, the round chat button in the bottom-right corner opens a free assistant
              you can ask anything "what exercises help with vocal clarity?", "when should I see a
              specialist?", or "how do I read my progress?". It knows your recent scores, so its answers
              are personal to you.
            </div>
          </div>
        </Card>

        {/* ── FAQ ── */}
        <SectionLabel icon={<Icons.Alert />}>Common questions</SectionLabel>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.65rem", marginBottom: "2rem" }}>
          <FaqItem
            q="Do I have to do this exactly once a day?"
            a="It's designed around a daily check-in over 30 days, since consistency is what makes the trend charts meaningful. Missing a day isn't the end of the world it just shows up as a gray 'missed' square on your calendar but try to stay close to daily."
          />
          <FaqItem
            q="What's the difference between a check-in on Analyze and a practice recording on Exercises?"
            a={<>A check-in on <strong>Analyze</strong> is your official daily result it's saved and shows up on your Dashboard and calendar. The practice recorder on <strong>Exercises</strong> is just for you to test your progress; it is <strong>not</strong> saved anywhere.</>}
          />
          <FaqItem
            q="My score went down one day should I worry?"
            a="A single day can move around naturally (room noise, tiredness, time of day). What matters more is the trend across several days, shown in your 30-day chart. If you see a sustained drop, that's when the app will suggest booking a specialist."
          />
          <FaqItem
            q="Is this a replacement for seeing a real speech therapist?"
            a="No. Every score in this app is an AI-generated screening indicator, not a medical diagnosis. Always discuss your results with your speech therapist or clinical team the Doctors page exists to make that easy."
          />
          <FaqItem
            q="What if I don't have a microphone or quiet room?"
            a="You can upload an existing audio file instead of recording live there's an 'Upload' option on the Analyze page that accepts WAV, MP3, OGG, FLAC, and M4A files."
          />
        </div>

        {/* ── Disclaimer (matches other pages) ── */}
        <div style={{
          padding: "10px 14px", background: D.bg, borderRadius: 8,
          border: `1px solid ${D.border}`, fontSize: "clamp(0.65rem, 2.5vw, 0.72rem)", color: D.textDim, lineHeight: 1.5,
          display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem",
        }}>
          <Icons.Alert /> <strong>Clinical disclaimer:</strong> Scores are AI-generated screening indicators only.
          Always discuss results with your speech therapist or clinical team.
        </div>

        {/* ── Final CTA ── */}
        <Card style={{
          textAlign: "center", background: D.accentSoft, border: `1px solid oklch(0.88 0.05 145)`,
        }}>
          <div style={{ fontWeight: 700, color: D.accentInk, marginBottom: "0.4rem", fontSize: "1rem" }}>
            Ready to begin?
          </div>
          <div style={{ fontSize: "0.85rem", color: D.textMuted, marginBottom: "1rem" }}>
            Your first step is always the same: record today's check-in.
          </div>
          <Link href="/vocal_therapy/analyze" style={{
            display: "inline-flex", alignItems: "center", gap: "0.5rem",
            background: D.accent, color: "#fff", borderRadius: 10,
            padding: "0.7rem 1.5rem", fontWeight: 700, fontSize: "0.88rem", textDecoration: "none",
          }}>
            <Icons.Mic /> Start first check-in
          </Link>
        </Card>

      </div>
    </div>
  );
}
