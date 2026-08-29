"use client";

import { useState, useEffect, useLayoutEffect, useRef } from "react";
import Link from "next/link";
import Header from "./components/Header";
import Footer from "./components/Footer";

/* ── Animated counter ── */
function Counter({ end, suffix = "", prefix = "" }: { end: number; suffix?: string; prefix?: string }) {
  const [val, setVal] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const done = useRef(false);
  useEffect(() => {
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting && !done.current) {
          done.current = true;
          const steps = 60;
          const inc = end / steps;
          let cur = 0;
          const t = setInterval(() => {
            cur += inc;
            if (cur >= end) {
              setVal(end);
              clearInterval(t);
            } else setVal(Math.floor(cur));
          }, 1600 / steps);
        }
      },
      { threshold: 0.4 }
    );
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [end]);
  return (
    <span ref={ref}>
      {prefix}
      {val.toLocaleString()}
      {suffix}
    </span>
  );
}

/* ── Reveal hook — immediately shows elements already in viewport ── */
function useReveal(containerRef: React.RefObject<HTMLDivElement | null>) {
  useLayoutEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const elements = container.querySelectorAll<HTMLElement>(".oc-reveal");
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("oc-visible");
            obs.unobserve(e.target);
          }
        });
      },
      { threshold: 0.06 }
    );
    elements.forEach((el) => {
      const rect = el.getBoundingClientRect();
      if (rect.top < window.innerHeight && rect.bottom > 0) {
        el.classList.add("oc-visible");
      } else {
        obs.observe(el);
      }
    });
    return () => obs.disconnect();
  }, [containerRef]);
}

const moduleImages = [
  "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=600&h=240&fit=crop&auto=format",
  "https://images.unsplash.com/photo-1617994452722-4145e196248b?w=600&h=240&fit=crop&auto=format",
  "https://images.unsplash.com/photo-1631217868264-e5b90bb7e133?w=600&h=240&fit=crop&auto=format",
  "https://images.unsplash.com/photo-1542273917363-3b1817f69a2d?w=600&h=240&fit=crop&auto=format",
];

const modules = [
  {
    id: "01", label: "Lesion Analysis",
    title: "Oral Lesion Analysis & IPE Framework",
    desc: "Multi-head Vision Transformer classifies oral tissue and quantifies patient pain intensity and functional impairment across speech, swallowing, and mouth-opening domains.",
    accent: "#0D9488", chip: "oc-chip-mint",
    capabilities: ["ViT-B/16 tissue classification", "Pain Intensity Score (0–10)", "Functional Impairment Score", "Physiological Filter v2.0"],
  },
  {
    id: "02", label: "Risk Monitor",
    title: "Multimodal Risk & Voice Progression",
    desc: "Combines lifestyle risk factors with weekly voice biomarker recordings — pitch, jitter, shimmer, MFCC — to generate continuously updated oral cancer risk trends.",
    accent: "#1565C0", chip: "oc-chip-blue",
    capabilities: ["Lifestyle risk scoring", "Voice biomarker tracking", "Acoustic feature extraction", "Risk trend alerts"],
  },
  {
    id: "03", label: "Speech Therapy",
    title: "Speech Analysis & Care Planning",
    desc: "AI signal processing detects articulation issues and voice quality changes. Severity classification triggers specialist matching and personalized therapy care plans.",
    accent: "#0D9488", chip: "oc-chip-mint",
    capabilities: ["Speech signal AI analysis", "3-Tier severity classification", "Specialist recommendation", "Personalized care plan"],
  },
  {
    id: "04", label: "Meditation AI",
    title: "AI Personalized Meditation Environment",
    desc: "Adaptive wellness environment — forest, beach, rain, night sky — with ML-optimized session duration and age-adaptive interactions for therapeutic comfort.",
    accent: "#8B7FD1", chip: "oc-chip-lavender",
    capabilities: ["4 immersive environments", "ML-based personalization", "Age-adaptive interactions", "Guided breathing & relaxation"],
  },
];

const stats = [
  { value: 5461, suffix: "+", label: "Oral Lesion Images", sub: "Curated clinical dataset" },
  { value: 4, suffix: "", label: "AI Modules", sub: "Integrated clinical platform" },
  { value: 5, suffix: " tiers", label: "Severity Classification", sub: "PPI scale mapping" },
  { value: 98, suffix: "%+", label: "Classification Accuracy", sub: "ViT-B/16 benchmark" },
];

const steps = [
  { step: "01", title: "Register & Profile", desc: "Create your clinical profile with demographic information, lifestyle indicators, and health history for personalized AI analysis.", color: "#1565C0" },
  { step: "02", title: "Upload & Record", desc: "Upload oral cavity images and record voice samples. Our clinical AI processes both visual and acoustic data in real time.", color: "#0D9488" },
  { step: "03", title: "AI Analysis", desc: "Vision Transformer and signal processing models analyze tissue classification, pain intensity, functional impairment, and voice biomarkers.", color: "#1565C0" },
  { step: "04", title: "Clinical Insights", desc: "Receive personalized risk scores, specialist recommendations, therapy plans, and adaptive wellness sessions tailored to your condition.", color: "#0D9488" },
];

function HeroOrbs() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none select-none">
      <div className="absolute rounded-full" style={{ width: 600, height: 600, top: "-180px", right: "-150px", background: "radial-gradient(ellipse at center, rgba(21,101,192,0.18) 0%, transparent 70%)", filter: "blur(40px)", animation: "oc-orb-drift-1 18s ease-in-out infinite" }} />
      <div className="absolute rounded-full" style={{ width: 500, height: 500, bottom: "-120px", left: "-100px", background: "radial-gradient(ellipse at center, rgba(13,148,136,0.16) 0%, transparent 70%)", filter: "blur(50px)", animation: "oc-orb-drift-2 22s ease-in-out infinite" }} />
      <div className="absolute rounded-full" style={{ width: 320, height: 320, top: "30%", left: "35%", background: "radial-gradient(ellipse at center, rgba(21,101,192,0.09) 0%, transparent 70%)", filter: "blur(30px)", animation: "oc-orb-drift-1 14s ease-in-out infinite reverse" }} />
      <div className="absolute inset-0" style={{ backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.06) 1px, transparent 1px)", backgroundSize: "36px 36px" }} />
      <div className="absolute left-0 right-0 h-[1px] opacity-[0.04]" style={{ background: "linear-gradient(90deg, transparent, #14B8A6, transparent)", animation: "oc-scan-line 8s linear infinite" }} />
    </div>
  );
}

export default function WelcomePage() {
  const pageRef = useRef<HTMLDivElement>(null);
  const statsRef = useRef<HTMLDivElement>(null);
  const modulesRef = useRef<HTMLDivElement>(null);
  const howRef = useRef<HTMLDivElement>(null);
  const techRef = useRef<HTMLDivElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);

  useReveal(statsRef);
  useReveal(modulesRef);
  useReveal(howRef);
  useReveal(techRef);
  useReveal(ctaRef);

  const [heroVisible, setHeroVisible] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setHeroVisible(true), 60);
    return () => clearTimeout(t);
  }, []);

  return (
    <div ref={pageRef} className="min-h-screen" style={{ background: "#F4F8FD" }}>
      <Header variant="dark" />

      {/* ── HERO ── */}
      <section className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden" style={{ background: "linear-gradient(160deg, #091929 0%, #0B1F38 50%, #0D2B4E 100%)" }}>
        <HeroOrbs />

        <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center pt-20 pb-16">
          <div
            className={`inline-flex items-center gap-2.5 px-4 py-2 rounded-full mb-8 text-xs oc-font-mono tracking-wide transition-all duration-700 ${heroVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
            style={{ background: "rgba(13,148,136,0.10)", border: "1px solid rgba(13,148,136,0.22)", color: "#14B8A6" }}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-[#14B8A6] animate-pulse" />
            Clinical AI Platform · 4 Integrated Modules · Real-Time Analysis
          </div>

          <h1
            className={`oc-font-serif text-white leading-[1.1] tracking-[-0.02em] mb-6 transition-all duration-700 delay-100 ${heroVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-5"}`}
            style={{ fontSize: "clamp(2.6rem, 5.5vw, 4.2rem)" }}
          >
            Advanced AI for{" "}
            <span className="italic" style={{ background: "linear-gradient(135deg, #14B8A6, #1976D2)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
              Oral Cancer
            </span>
            <br />Detection &amp; Care
          </h1>

          <p className={`text-white/55 text-lg leading-relaxed max-w-2xl mx-auto mb-10 transition-all duration-700 delay-200 ${heroVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-5"}`}>
            A multimodal clinical intelligence platform combining Vision Transformer imaging,
            voice biomarker monitoring, and adaptive wellness — built for early detection and
            personalized patient care.
          </p>

          <div className={`flex flex-wrap items-center justify-center gap-3 mb-14 transition-all duration-700 delay-300 ${heroVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-5"}`}>
            <Link href="/register" className="oc-btn-primary text-sm px-6 py-3">
              Begin Clinical Assessment
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 8h10M9 4l4 4-4 4" /></svg>
            </Link>
            <Link href="/login" className="oc-btn-ghost text-sm px-6 py-3">Sign In to Platform</Link>
          </div>

          <div className={`flex flex-wrap justify-center gap-2 transition-all duration-700 delay-500 ${heroVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-5"}`}>
            {[
              { label: "Lesion Analysis", color: "#0D9488" },
              { label: "Risk Monitor", color: "#1565C0" },
              { label: "Speech Therapy", color: "#0D9488" },
              { label: "Meditation AI", color: "#8B7FD1" },
            ].map((m) => (
              <div key={m.label} className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] oc-font-mono" style={{ background: `${m.color}18`, border: `1px solid ${m.color}30`, color: m.color }}>
                <span className="w-1 h-1 rounded-full" style={{ background: m.color }} />
                {m.label}
              </div>
            ))}
          </div>
        </div>

        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 opacity-30">
          <span className="text-white text-[10px] oc-font-mono tracking-widest">SCROLL</span>
          <div className="w-px h-10 bg-gradient-to-b from-white/40 to-transparent oc-animate-float" />
        </div>
      </section>

      {/* ── STATS ── */}
      <section ref={statsRef} id="about" className="py-16 relative overflow-hidden scroll-mt-[76px]" style={{ background: "linear-gradient(135deg, #0B1F38 0%, #0D2B4E 100%)" }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map((s, i) => (
              <div key={s.label} className={`oc-reveal oc-reveal-delay-${i + 1} text-center`}>
                <div className="text-4xl sm:text-5xl oc-font-serif font-normal mb-1 leading-none" style={{ background: "linear-gradient(135deg, #14B8A6, #1976D2)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
                  <Counter end={s.value} suffix={s.suffix} />
                </div>
                <div className="text-white font-medium text-sm mb-0.5">{s.label}</div>
                <div className="text-white/35 text-xs oc-font-mono">{s.sub}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── MODULES ── */}
      <section ref={modulesRef} id="modules" className="py-24 scroll-mt-[76px]" style={{ background: "#F4F8FD" }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="oc-reveal text-center mb-16">
            <div className="oc-chip-mint mx-auto mb-4">AI Modules</div>
            <h2 className="oc-font-serif text-[#0F2137] leading-tight mb-4" style={{ fontSize: "clamp(2rem, 4vw, 3rem)" }}>
              Four Integrated Clinical Intelligence Tools
            </h2>
            <p className="text-[#4A6070] max-w-xl mx-auto text-base leading-relaxed">
              Each module addresses a distinct clinical need — from diagnostic imaging to wellness support — forming a unified oral health care platform.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {modules.map((mod, i) => (
              <div key={mod.id} className={`oc-reveal oc-reveal-delay-${(i % 2) + 1} oc-card overflow-hidden group`}>
                <div className="relative h-44 overflow-hidden" style={{ background: `${mod.accent}18` }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={moduleImages[i]} alt={mod.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                  <div className="absolute inset-0" style={{ background: `linear-gradient(to bottom, transparent 40%, ${mod.accent}60)` }} />
                  <div className={`absolute bottom-3 left-4 ${mod.chip}`}>Module {mod.id} · {mod.label}</div>
                </div>

                <div className="p-7">
                  <h3 className="oc-font-serif text-[#0F2137] text-xl leading-snug mb-3">{mod.title}</h3>
                  <p className="text-[#4A6070] text-sm leading-relaxed mb-5">{mod.desc}</p>

                  <div className="grid grid-cols-2 gap-2">
                    {mod.capabilities.map((cap) => (
                      <div key={cap} className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs" style={{ background: `${mod.accent}08`, border: `1px solid ${mod.accent}15` }}>
                        <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke={mod.accent} strokeWidth="2">
                          <path d="M1.5 5l2.5 2.5 4.5-4.5" />
                        </svg>
                        <span style={{ color: "#4A6070" }}>{cap}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section ref={howRef} id="how" className="py-24 relative overflow-hidden scroll-mt-[76px]" style={{ background: "linear-gradient(160deg, #091929 0%, #0B1F38 60%, #0D2B4E 100%)" }}>
        <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.04) 1px, transparent 1px)", backgroundSize: "40px 40px" }} />
        <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="oc-reveal text-center mb-16">
            <div className="oc-chip-blue mx-auto mb-4">Clinical Workflow</div>
            <h2 className="oc-font-serif text-white leading-tight mb-4" style={{ fontSize: "clamp(2rem, 4vw, 3rem)" }}>
              From Registration to Clinical Insight
            </h2>
            <p className="text-white/45 max-w-xl mx-auto text-base">
              A seamless four-step workflow connecting patient profiling, multimodal data capture, AI analysis, and personalized care recommendations.
            </p>
          </div>

          <div className="relative">
            <div className="hidden lg:block absolute top-10 left-[12.5%] right-[12.5%] h-px" style={{ background: "linear-gradient(90deg, #1565C020, #1565C060, #0D948860, #0D948820)" }} />

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {steps.map((step, i) => (
                <div key={step.step} className={`oc-reveal oc-reveal-delay-${i + 1} text-center`}>
                  <div className="w-20 h-20 rounded-2xl mx-auto mb-5 flex flex-col items-center justify-center" style={{ background: `linear-gradient(135deg, ${step.color}20, ${step.color}08)`, border: `1px solid ${step.color}30` }}>
                    <span className="oc-font-mono text-[10px] tracking-widest mb-0.5" style={{ color: `${step.color}80` }}>STEP</span>
                    <span className="oc-font-serif text-2xl leading-none" style={{ color: step.color }}>{step.step}</span>
                  </div>
                  <h3 className="text-white font-semibold text-base mb-3">{step.title}</h3>
                  <p className="text-white/40 text-sm leading-relaxed">{step.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── CLINICAL TECHNOLOGY ── */}
      <section ref={techRef} className="py-24" style={{ background: "#F4F8FD" }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-14 items-center">

            {/* Left — 3 platform pillars */}
            <div className="oc-reveal">
              <div className="oc-chip-blue mb-4">Clinical Technology</div>
              <h2 className="oc-font-serif text-[#0F2137] leading-tight mb-5" style={{ fontSize: "clamp(1.8rem, 3.5vw, 2.6rem)" }}>
                Research-Grade AI at the Forefront of Oral Health
              </h2>
              <p className="text-[#4A6070] leading-relaxed mb-8 text-sm">
                Four specialized AI modules work in concert — from imaging-based tissue classification and longitudinal voice biomarker tracking, to speech therapy planning and adaptive patient wellness — forming a single, unified clinical intelligence platform.
              </p>

              <div className="space-y-4">
                {[
                  {
                    color: "#0D9488", tint: "#E0F5F3",
                    title: "Detect Early",
                    detail: "AI imaging classifies oral tissue across four categories with quantified pain intensity and functional impairment scores — catching changes before they escalate.",
                    icon: (
                      <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                        <circle cx="8" cy="8" r="5.5" /><path d="M14 14l-2.5-2.5" /><path d="M6 8h4M8 6v4" />
                      </svg>
                    ),
                  },
                  {
                    color: "#1565C0", tint: "#E3EEF9",
                    title: "Monitor Continuously",
                    detail: "Weekly voice biomarker recordings track acoustic changes non-invasively over time — pitch, shimmer, and MFCC patterns reveal progression before clinical symptoms appear.",
                    icon: (
                      <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                        <path d="M1 9h2l2-5 2 10 2-6 2 4 2-3h2" />
                      </svg>
                    ),
                  },
                  {
                    color: "#8B7FD1", tint: "#EDEBFA",
                    title: "Care Holistically",
                    detail: "Severity-driven therapy planning matches patients with specialists and generates personalized care plans, while adaptive meditation environments provide therapeutic comfort throughout treatment.",
                    icon: (
                      <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                        <path d="M9 2C5.5 2 3 4.5 3 7.5C3 11 6 13.5 9 17C12 13.5 15 11 15 7.5C15 4.5 12.5 2 9 2Z" />
                        <circle cx="9" cy="8" r="2" />
                      </svg>
                    ),
                  },
                ].map((pillar) => (
                  <div key={pillar.title} className="flex items-start gap-4 p-5 rounded-2xl transition-all" style={{ background: "white", border: "1px solid rgba(21,101,192,0.09)", boxShadow: "0 1px 4px rgba(15,33,55,0.04)" }}>
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: pillar.tint, color: pillar.color }}>
                      {pillar.icon}
                    </div>
                    <div>
                      <div className="text-[#0F2137] text-sm font-semibold mb-1">{pillar.title}</div>
                      <div className="text-[#4A6070] text-xs leading-relaxed">{pillar.detail}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right — 4-module hub visual */}
            <div className="oc-reveal oc-reveal-delay-2 relative rounded-3xl overflow-hidden" style={{ background: "linear-gradient(160deg, #091929, #0B1F38, #0D2B4E)", border: "1px solid rgba(255,255,255,0.07)" }}>

              <div className="absolute inset-0 pointer-events-none">
                <div className="absolute rounded-full" style={{ width: 300, height: 300, top: "50%", left: "50%", transform: "translate(-50%,-50%)", background: "radial-gradient(ellipse, rgba(13,148,136,0.14) 0%, transparent 65%)", filter: "blur(30px)" }} />
              </div>

              <div className="relative z-10 p-7">
                <div className="oc-font-mono text-[10px] text-[#14B8A6] tracking-widest mb-5">INTEGRATED PLATFORM · 4 MODULES</div>

                <div className="grid grid-cols-2 gap-3 mb-5">
                  {[
                    {
                      id: "01", name: "Lesion Analysis", color: "#0D9488", status: "Active",
                      anim: (
                        <div className="flex items-center justify-center h-10">
                          {[0, 1, 2, 3, 4].map((i) => (
                            <div key={i} className="w-0.5 mx-0.5 rounded-full" style={{ height: `${8 + (i % 3) * 8}px`, background: "#0D9488", opacity: 0.7, animation: `oc-float ${0.8 + i * 0.15}s ease-in-out infinite alternate`, animationDelay: `${i * 0.1}s` }} />
                          ))}
                        </div>
                      ),
                    },
                    {
                      id: "02", name: "Risk Monitor", color: "#1565C0", status: "Recording",
                      anim: (
                        <div className="flex items-center justify-center h-10">
                          <svg width="60" height="28" viewBox="0 0 60 28" fill="none">
                            <path d="M0 14h8l5-10 6 20 5-12 5 8 5-6 5 4 5-8 6 4 10 0" stroke="#1565C0" strokeWidth="1.5" strokeLinecap="round" fill="none" opacity="0.8" style={{ animation: "oc-shimmer 2s linear infinite", strokeDasharray: "120", strokeDashoffset: "0" }} />
                          </svg>
                        </div>
                      ),
                    },
                    {
                      id: "03", name: "Speech Therapy", color: "#0D9488", status: "Ready",
                      anim: (
                        <div className="flex items-center justify-center h-10 gap-0.5">
                          {[3, 5, 8, 12, 9, 6, 10, 7, 4, 6, 3].map((h, i) => (
                            <div key={i} className="w-1 rounded-full" style={{ height: `${h}px`, background: "linear-gradient(to top, #0D9488, #14B8A6)", opacity: 0.75, animation: `oc-float ${0.6 + i * 0.1}s ease-in-out infinite alternate`, animationDelay: `${i * 0.08}s` }} />
                          ))}
                        </div>
                      ),
                    },
                    {
                      id: "04", name: "Meditation AI", color: "#8B7FD1", status: "Ready",
                      anim: (
                        <div className="flex items-center justify-center h-10">
                          <div className="relative w-10 h-10 flex items-center justify-center">
                            {[1, 2].map((i) => (
                              <div key={i} className="absolute rounded-full border" style={{ width: 14 + i * 12, height: 14 + i * 12, borderColor: `rgba(139,127,209,${0.5 - i * 0.15})`, animation: `oc-pulse-ring ${1.6 + i * 0.5}s ease-out infinite`, animationDelay: `${i * 0.4}s` }} />
                            ))}
                            <div className="w-4 h-4 rounded-full" style={{ background: "radial-gradient(circle, #A89FDC, #8B7FD1)" }} />
                          </div>
                        </div>
                      ),
                    },
                  ].map((mod) => (
                    <div key={mod.id} className="p-4 rounded-2xl group" style={{ background: "rgba(255,255,255,0.04)", border: `1px solid ${mod.color}22` }}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="oc-font-mono text-[9px] tracking-widest" style={{ color: `${mod.color}80` }}>MOD {mod.id}</span>
                        <div className="flex items-center gap-1 text-[9px] oc-font-mono" style={{ color: mod.color }}>
                          <span className="w-1 h-1 rounded-full animate-pulse" style={{ background: mod.color }} />
                          {mod.status}
                        </div>
                      </div>
                      {mod.anim}
                      <div className="text-white/60 text-[11px] font-medium mt-2 text-center">{mod.name}</div>
                    </div>
                  ))}
                </div>

                <div className="p-3.5 rounded-xl flex items-center gap-3" style={{ background: "rgba(13,148,136,0.09)", border: "1px solid rgba(13,148,136,0.20)" }}>
                  <span className="w-2 h-2 rounded-full bg-[#14B8A6] animate-pulse shrink-0" />
                  <div>
                    <span className="text-[#14B8A6] text-[10px] font-semibold oc-font-mono">All Modules Operational</span>
                    <p className="text-white/35 text-[10px] leading-snug mt-0.5">4 AI systems processing in parallel — real-time clinical intelligence</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section ref={ctaRef} className="py-20 relative overflow-hidden" style={{ background: "linear-gradient(135deg, #091929 0%, #0B1F38 50%, #0D47A1 100%)" }}>
        <div className="absolute inset-0 pointer-events-none opacity-30" style={{ backgroundImage: "radial-gradient(circle, rgba(13,148,136,0.15) 1px, transparent 1px)", backgroundSize: "28px 28px" }} />
        <div className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full pointer-events-none" style={{ background: "radial-gradient(ellipse, rgba(13,148,136,0.15) 0%, transparent 65%)", filter: "blur(60px)" }} />

        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="oc-reveal oc-chip-mint mx-auto mb-6">Begin Your Assessment</div>
          <h2 className="oc-reveal oc-reveal-delay-1 oc-font-serif text-white leading-tight mb-5" style={{ fontSize: "clamp(2rem, 4vw, 3.2rem)" }}>
            Clinical Intelligence for
            <br />
            <span className="italic" style={{ background: "linear-gradient(135deg, #14B8A6, #7CB9E8)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
              Every Patient Journey
            </span>
          </h2>
          <p className="oc-reveal oc-reveal-delay-2 text-white/50 max-w-lg mx-auto mb-10 leading-relaxed">
            Join a platform designed to support patients and clinicians alike — from early detection through to therapeutic wellness and continuous monitoring.
          </p>
          <div className="oc-reveal oc-reveal-delay-3 flex flex-wrap items-center justify-center gap-3">
            <Link href="/register" className="oc-btn-mint px-7 py-3 text-sm">
              Create Clinical Account
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 8h10M9 4l4 4-4 4" /></svg>
            </Link>
            <Link href="/login" className="oc-btn-ghost px-7 py-3 text-sm">Sign In</Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
