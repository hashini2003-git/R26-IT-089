"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import {
  Heart, Camera, LayoutDashboard, BarChart2, TrendingUp, GitCompare,
  MessageSquare, Stethoscope, Menu, X, ChevronRight, CheckCircle2,
} from "lucide-react";
import { loadResult, type IpeResult } from "../_lib/ipe-ui";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

/* ── Palette ─────────────────────────────────────────────────── */
const BLUE = "#1565C0";
const BLUE_TINT = "#E3EEF9";
const MINT = "#0D9488";
const MINT_TINT = "#E0F5F3";
const NAVY = "#0B1F38";
const BG = "#F4F8FD";
const BORDER = "rgba(21,101,192,0.10)";
const SIDEBAR_BG = "#0B1F38";
const TEXT = "#0F2137";
const TEXT2 = "#4A6070";
const SEV = ["#2ECC91", "#F5C242", "#FF9F43", "#FF6B5B", "#E8483A"];
const FONT = "'Inter', system-ui, sans-serif";
const SERIF = "'DM Serif Display', Georgia, serif";
const MONO = "'DM Mono', monospace";

function ppiColor(p: number) { return p <= 1 ? SEV[0] : p <= 3 ? SEV[1] : p <= 5 ? SEV[2] : p <= 7.5 ? SEV[3] : SEV[4]; }

type Visit = { id: string; date: string; classification: string; ppi: number; fis_speech: number; fis_swallow: number; fis_mouth: number; erythema: number; ulceration: number; texture: number; };
function loadVisits(): Visit[] { try { const r = localStorage.getItem("ipe_visits"); return r ? JSON.parse(r) : []; } catch { return []; } }

function GlassCard({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return <div style={{ background: "#fff", borderRadius: 20, border: `1px solid ${BORDER}`, boxShadow: "0 2px 12px rgba(21,101,192,0.06), 0 1px 3px rgba(0,0,0,0.04)", padding: 22, ...style }}>{children}</div>;
}
function SevBadge({ label, color }: { label: string; color: string }) {
  return <span style={{ fontSize: 10.5, fontWeight: 700, padding: "3px 10px", borderRadius: 20, background: `${color}18`, color, letterSpacing: 0.3 }}>{label}</span>;
}
function Meter({ value, color, height = 8 }: { value: number; color: string; height?: number }) {
  return (
    <div style={{ width: "100%", height, borderRadius: height, background: "rgba(21,101,192,0.07)", overflow: "hidden" }}>
      <div style={{ width: `${Math.round(value * 100)}%`, height: "100%", borderRadius: height, background: color, transition: "width 1s cubic-bezier(.4,0,.2,1)" }} />
    </div>
  );
}

/* ── Sidebar shell ────────────────────────────────────────────── */
const NAV_SECTIONS = [
  { label: "Overview", items: [{ href: "/Component1/dashboard", label: "Patient Dashboard", sub: "Summary & care plan", Icon: LayoutDashboard }] },
  { label: "My Health", items: [
    { href: "/Component1/results", label: "Analysis Results", sub: "Latest AI findings", Icon: BarChart2 },
    { href: "/Component1/progress", label: "Recovery Journey", sub: "Progress tracking", Icon: TrendingUp },
    { href: "/Component1/compare", label: "Before & After", sub: "Visual comparison", Icon: GitCompare },
  ] },
  { label: "Tools", items: [
    { href: "/Component1/upload", label: "New Scan", sub: "Upload oral image", Icon: Camera },
    { href: "/Component1/assistant", label: "AI Assistant", sub: "Get guidance", Icon: MessageSquare },
    { href: "/Component1/doctors", label: "Find a Doctor", sub: "Doctor recommendation", Icon: Stethoscope },
  ] },
];
function SectionLabel({ children }: { children: React.ReactNode }) {
  return <div style={{ fontSize: 9.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1.6, color: "rgba(255,255,255,0.28)", padding: "16px 14px 6px", marginTop: 4 }}>{children}</div>;
}
function NavSidebar({ onClose }: { onClose?: () => void }) {
  const router = useRouter();
  const pathname = usePathname();
  return (
    <div style={{ width: 248, background: SIDEBAR_BG, display: "flex", flexDirection: "column", height: "100%", flexShrink: 0, fontFamily: FONT, overflowY: "auto" }}>
      <div style={{ padding: "22px 18px 18px", borderBottom: "1px solid rgba(255,255,255,0.06)", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 38, height: 38, borderRadius: 11, background: `linear-gradient(135deg, ${BLUE}, ${MINT})`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, boxShadow: `0 4px 12px ${BLUE}44` }}>
            <Heart size={17} color="#fff" />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14.5, fontWeight: 700, color: "#fff", lineHeight: 1.2, fontFamily: SERIF }}>OralCare AI</div>
            <div style={{ fontSize: 9.5, color: "rgba(255,255,255,0.35)", marginTop: 1, letterSpacing: 0.3 }}>Clinical Patient Portal</div>
          </div>
          {onClose && (
            <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.35)", display: "flex", padding: 2 }}>
              <X size={17} />
            </button>
          )}
        </div>
        <div style={{ marginTop: 14, display: "flex", alignItems: "center", gap: 8, padding: "9px 11px", borderRadius: 11, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.06)" }}>
          <div style={{ width: 30, height: 30, borderRadius: "50%", background: `${BLUE}44`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: "#90CAF9" }}>P</span>
          </div>
          <div>
            <div style={{ fontSize: 11.5, fontWeight: 600, color: "#fff" }}>Patient Portal</div>
            <div style={{ fontSize: 9.5, color: "rgba(255,255,255,0.3)" }}>Secure session active</div>
          </div>
          <div style={{ marginLeft: "auto", width: 7, height: 7, borderRadius: "50%", background: "#2ECC91", flexShrink: 0, boxShadow: "0 0 6px #2ECC9188" }} />
        </div>
      </div>
      <nav style={{ flex: 1, padding: "6px 10px 14px" }}>
        {NAV_SECTIONS.map((section) => (
          <div key={section.label}>
            <SectionLabel>{section.label}</SectionLabel>
            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              {section.items.map(({ href, label, sub, Icon }) => {
                const active = pathname === href;
                return (
                  <button key={href} onClick={() => { router.push(href); onClose?.(); }}
                    style={{
                      display: "flex", alignItems: "center", gap: 10, padding: "9px 10px", borderRadius: 10,
                      border: "none", cursor: "pointer", textAlign: "left", width: "100%",
                      background: active ? `linear-gradient(135deg, ${BLUE}cc, #0D47A1cc)` : "transparent",
                      transition: "all .15s", fontFamily: FONT,
                      boxShadow: active ? `0 3px 10px ${BLUE}33` : "none",
                    }}
                  >
                    <div style={{ width: 32, height: 32, borderRadius: 9, background: active ? "rgba(255,255,255,0.18)" : "rgba(255,255,255,0.06)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <Icon size={14} color={active ? "#fff" : "rgba(255,255,255,0.45)"} />
                    </div>
                    <div>
                      <div style={{ fontSize: 12.5, fontWeight: active ? 600 : 400, color: active ? "#fff" : "rgba(255,255,255,0.6)", lineHeight: 1.25 }}>{label}</div>
                      <div style={{ fontSize: 10, color: "rgba(255,255,255,0.25)", marginTop: 1 }}>{sub}</div>
                    </div>
                    {active && <div style={{ marginLeft: "auto", width: 5, height: 5, borderRadius: "50%", background: "#90CAF9", flexShrink: 0 }} />}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </nav>
      <div style={{ padding: "10px 10px 20px", borderTop: "1px solid rgba(255,255,255,0.06)", flexShrink: 0 }}>
        <button onClick={() => { router.push("/Component1/assistant"); onClose?.(); }}
          style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "12px 13px", borderRadius: 11, border: `1px solid rgba(13,148,136,0.3)`, background: "rgba(13,148,136,0.1)", cursor: "pointer", fontFamily: FONT }}>
          <div style={{ width: 30, height: 30, borderRadius: 9, background: "rgba(13,148,136,0.2)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <Stethoscope size={14} color={MINT} />
          </div>
          <div style={{ textAlign: "left" }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: MINT, lineHeight: 1.2 }}>Message Care Team</div>
            <div style={{ fontSize: 10, color: "rgba(255,255,255,0.28)", marginTop: 1 }}>AI-powered assistant</div>
          </div>
        </button>
        <div style={{ marginTop: 12, fontSize: 9, color: "rgba(255,255,255,0.18)", textAlign: "center", letterSpacing: 0.3 }}>
          OralCare AI v3.0 · HIPAA-aligned · Encrypted
        </div>
      </div>
    </div>
  );
}
function SidebarLayout({ title, children }: { title: string; children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden", fontFamily: FONT, background: BG }}>
      <div className="hidden lg:flex" style={{ flexDirection: "column", height: "100%", flexShrink: 0 }}>
        <NavSidebar />
      </div>
      {mobileOpen && (
        <div style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex" }}>
          <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.45)", backdropFilter: "blur(3px)" }} onClick={() => setMobileOpen(false)} />
          <div style={{ position: "relative", height: "100%", width: 248, zIndex: 1 }}>
            <NavSidebar onClose={() => setMobileOpen(false)} />
          </div>
        </div>
      )}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", minWidth: 0 }}>
        <div className="flex lg:hidden" style={{ alignItems: "center", gap: 12, padding: "12px 16px", background: "#fff", borderBottom: `1px solid ${BORDER}`, flexShrink: 0 }}>
          <button onClick={() => setMobileOpen(true)} style={{ background: "none", border: "none", cursor: "pointer", display: "flex", padding: 4 }}>
            <Menu size={20} color={NAVY} />
          </button>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 28, height: 28, borderRadius: 8, background: `linear-gradient(135deg, ${BLUE}, ${MINT})`, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Heart size={13} color="#fff" />
            </div>
            <span style={{ fontSize: 14, fontWeight: 700, color: NAVY, fontFamily: SERIF }}>OralCare AI</span>
          </div>
          <div style={{ marginLeft: "auto", fontSize: 11.5, color: TEXT2 }}>{title}</div>
        </div>
        <div style={{ flex: 1, overflowY: "auto" }}>{children}</div>
      </div>
    </div>
  );
}

/* ── Compare content ─────────────────────────────────────────── */
function CompareContent({ visits }: { visits: Visit[] }) {
  const router = useRouter();
  const [beforeImg, setBeforeImg] = useState<File | null>(null);
  const [afterImg, setAfterImg] = useState<File | null>(null);
  const [beforePrev, setBeforePrev] = useState<string | null>(null);
  const [afterPrev, setAfterPrev] = useState<string | null>(null);
  const [beforeRes, setBeforeRes] = useState<IpeResult | null>(null);
  const [afterRes, setAfterRes] = useState<IpeResult | null>(null);
  const [loading, setLoading] = useState<"before" | "after" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const beforeRef = useRef<HTMLInputElement>(null);
  const afterRef = useRef<HTMLInputElement>(null);

  function pickImage(side: "before" | "after") {
    return (e: React.ChangeEvent<HTMLInputElement>) => {
      const f = e.target.files?.[0];
      if (!f) return;
      const u = URL.createObjectURL(f);
      if (side === "before") { setBeforeImg(f); setBeforePrev(u); setBeforeRes(null); }
      else { setAfterImg(f); setAfterPrev(u); setAfterRes(null); }
    };
  }

  async function analyzeOne(side: "before" | "after") {
    const file = side === "before" ? beforeImg : afterImg;
    if (!file) return;
    setLoading(side);
    setError(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch(`${API}/predict`, { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Analysis failed.");
      if (side === "before") setBeforeRes(data as IpeResult); else setAfterRes(data as IpeResult);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not reach the server.");
    } finally {
      setLoading(null);
    }
  }

  const ppiChange = beforeRes && afterRes ? beforeRes.ppi.score - afterRes.ppi.score : null;
  const improved = ppiChange !== null && ppiChange > 0;

  const compareFeatures = [
    { label: "Redness (Erythema)", key: "erythema" as const },
    { label: "Open Sores (Ulceration)", key: "ulceration" as const },
    { label: "Tissue Stiffness", key: "texture" as const },
  ];

  return (
    <div style={{ padding: "28px 26px 48px", maxWidth: 980, margin: "0 auto", fontFamily: FONT }}>
      <style>{`@keyframes spinComp{to{transform:rotate(360deg)}}`}</style>
      <div style={{ marginBottom: 24, display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1.3, color: MINT, marginBottom: 5 }}>Visual Comparison</div>
          <h1 style={{ fontSize: 26, fontWeight: 400, color: NAVY, margin: "0 0 5px", fontFamily: SERIF }}>Before &amp; After</h1>
          <p style={{ fontSize: 13, color: TEXT2, margin: 0 }}>Compare two scans side-by-side to measure your progress.</p>
        </div>
        <button onClick={() => router.push("/Component1/progress")} style={{ display: "flex", alignItems: "center", gap: 6, padding: "10px 16px", borderRadius: 999, background: BLUE_TINT, border: `1px solid ${BLUE}28`, color: BLUE, fontSize: 12.5, fontWeight: 600, cursor: "pointer", fontFamily: FONT }}>
          <TrendingUp size={14} /> Recovery Journey
        </button>
      </div>

      {visits.length >= 2 && (
        <div style={{ marginBottom: 18, padding: "13px 18px", borderRadius: 14, background: MINT_TINT, border: `1px solid ${MINT}28`, display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <CheckCircle2 size={15} color={MINT} />
          <span style={{ fontSize: 12.5, color: TEXT2, flex: 1 }}>
            You have <strong style={{ color: MINT }}>{visits.length} recorded visits</strong> in your recovery journey.
          </span>
          <button onClick={() => router.push("/Component1/progress")} style={{ background: "none", border: "none", cursor: "pointer", color: MINT, fontSize: 12.5, fontWeight: 700, fontFamily: FONT, padding: 0, display: "flex", alignItems: "center", gap: 4 }}>
            View history <ChevronRight size={13} />
          </button>
        </div>
      )}

      {error && (
        <div style={{ marginBottom: 18, padding: "12px 16px", borderRadius: 14, background: "#FDEDEB", color: "#E8483A", fontSize: 13, fontWeight: 600 }}>{error}</div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
        {(["before", "after"] as const).map(side => {
          const prev = side === "before" ? beforePrev : afterPrev;
          const res = side === "before" ? beforeRes : afterRes;
          const ref = side === "before" ? beforeRef : afterRef;
          const c = side === "before" ? SEV[2] : SEV[0];
          const label = side === "before" ? "Before" : "After";
          return (
            <div key={side}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                <span style={{ width: 10, height: 10, borderRadius: "50%", background: c, display: "inline-block", boxShadow: `0 0 6px ${c}88` }} />
                <span style={{ fontSize: 12, fontWeight: 700, color: c, textTransform: "uppercase", letterSpacing: 1 }}>{label} photo</span>
              </div>
              <div onClick={() => ref.current?.click()}
                style={{ border: `2px dashed ${prev ? "transparent" : c + "44"}`, borderRadius: 20, overflow: "hidden", cursor: "pointer", minHeight: 190, display: "flex", alignItems: "center", justifyContent: "center", background: prev ? "#000" : `${c}07`, position: "relative", boxShadow: prev ? "0 4px 24px rgba(0,0,0,0.18)" : "none", transition: "all .2s" }}>
                {prev ? (
                  <>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={prev} alt={side} style={{ width: "100%", height: 190, objectFit: "cover", display: "block", opacity: loading === side ? 0.35 : 1 }} />
                    {res && (
                      <div style={{ position: "absolute", bottom: 10, left: 10, right: 10, background: "rgba(11,31,56,0.85)", backdropFilter: "blur(10px)", borderRadius: 14, padding: "10px 14px", display: "flex", alignItems: "center", gap: 10 }}>
                        <div>
                          <div style={{ fontSize: 22, fontWeight: 700, color: ppiColor(res.ppi.score), fontFamily: MONO, lineHeight: 1 }}>{res.ppi.score.toFixed(1)}<span style={{ fontSize: 11, color: "rgba(255,255,255,0.45)" }}>/{res.ppi.max ?? 10}</span></div>
                          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.65)", fontWeight: 600 }}>{res.classification.name}</div>
                        </div>
                        <div style={{ marginLeft: "auto" }}>
                          <SevBadge label={res.ppi.label} color={ppiColor(res.ppi.score)} />
                        </div>
                      </div>
                    )}
                    {loading === side && (
                      <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.3)" }}>
                        <div style={{ width: 36, height: 36, borderRadius: "50%", border: `3px solid ${c}`, borderTopColor: "transparent", animation: "spinComp .7s linear infinite" }} />
                      </div>
                    )}
                  </>
                ) : (
                  <div style={{ textAlign: "center", padding: 28 }}>
                    <div style={{ width: 56, height: 56, borderRadius: 16, background: `${c}12`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px" }}>
                      <Camera size={26} color={c} strokeWidth={1.5} />
                    </div>
                    <div style={{ fontSize: 13.5, fontWeight: 600, color: c, marginBottom: 4 }}>Add {label.toLowerCase()} photo</div>
                    <div style={{ fontSize: 12, color: TEXT2 }}>Click to upload or drag here</div>
                  </div>
                )}
              </div>
              <input ref={ref} type="file" accept="image/*" style={{ display: "none" }} onChange={pickImage(side)} />
              {prev && !res && loading !== side && (
                <button onClick={() => analyzeOne(side)} style={{ width: "100%", marginTop: 12, background: `linear-gradient(135deg, ${c}, ${c}bb)`, color: "#fff", border: "none", borderRadius: 14, padding: "12px", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: FONT, boxShadow: `0 4px 16px ${c}40` }}>
                  Analyze {label} photo →
                </button>
              )}
            </div>
          );
        })}
      </div>

      {beforeRes && afterRes && (
        <>
          <GlassCard style={{ marginBottom: 18, textAlign: "center", background: improved ? "#E9F9F2" : "#FDEDEB", border: `1px solid ${improved ? SEV[0] : SEV[4]}30` }}>
            <div style={{ fontSize: 22, fontWeight: 700, color: improved ? SEV[0] : SEV[4], marginBottom: 7 }}>
              {improved ? `Pain reduced by ${ppiChange!.toFixed(1)} points` : `Pain increased by ${Math.abs(ppiChange!).toFixed(1)} points`}
            </div>
            <div style={{ fontSize: 14, color: TEXT2, marginBottom: 5 }}>
              Before: <strong style={{ color: ppiColor(beforeRes.ppi.score), fontFamily: MONO }}>{beforeRes.ppi.score.toFixed(1)}/{beforeRes.ppi.max ?? 10}</strong> → After: <strong style={{ color: ppiColor(afterRes.ppi.score), fontFamily: MONO }}>{afterRes.ppi.score.toFixed(1)}/{afterRes.ppi.max ?? 10}</strong>
            </div>
            {improved && <div style={{ fontSize: 12.5, color: SEV[0], fontWeight: 600 }}>Keep following your care plan — you are making progress!</div>}
          </GlassCard>

          <GlassCard style={{ marginBottom: 18 }}>
            <div style={{ fontSize: 10.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, color: MINT, marginBottom: 16 }}>Symptom Comparison</div>
            {compareFeatures.map(({ label, key }) => {
              const bv = beforeRes.visual_features[key];
              const av = afterRes.visual_features[key];
              const diff = av - bv;
              const good = diff < 0;
              return (
                <div key={label} style={{ marginBottom: 20 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 9, alignItems: "center" }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: TEXT }}>{label}</span>
                    <span style={{ fontSize: 11, fontWeight: 700, color: good ? SEV[0] : SEV[2], background: good ? `${SEV[0]}12` : `${SEV[2]}12`, borderRadius: 20, padding: "4px 11px" }}>
                      {diff < 0 ? "↓" : "↑"}{Math.abs(diff * 100).toFixed(0)}% {good ? "better" : "worse"}
                    </span>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 20px 1fr", gap: 8, alignItems: "center" }}>
                    <div>
                      <div style={{ fontSize: 10.5, color: TEXT2, marginBottom: 5 }}>Before: <strong style={{ fontFamily: MONO }}>{(bv * 100).toFixed(0)}%</strong></div>
                      <Meter value={bv} color={SEV[2]} height={8} />
                    </div>
                    <span style={{ fontSize: 13, color: TEXT2, textAlign: "center" }}>→</span>
                    <div>
                      <div style={{ fontSize: 10.5, color: TEXT2, marginBottom: 5 }}>After: <strong style={{ fontFamily: MONO }}>{(av * 100).toFixed(0)}%</strong></div>
                      <Meter value={av} color={good ? SEV[0] : SEV[4]} height={8} />
                    </div>
                  </div>
                </div>
              );
            })}
          </GlassCard>
        </>
      )}

      {!beforePrev && !afterPrev && (
        <GlassCard style={{ textAlign: "center", padding: "52px 28px" }}>
          <div style={{ width: 72, height: 72, borderRadius: 20, background: BLUE_TINT, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
            <GitCompare size={30} color={BLUE} strokeWidth={1.4} />
          </div>
          <div style={{ fontSize: 18, fontWeight: 400, color: NAVY, marginBottom: 8, fontFamily: SERIF }}>Upload two scans to compare</div>
          <div style={{ fontSize: 13.5, color: TEXT2, marginBottom: 20, maxWidth: 300, margin: "0 auto 20px", lineHeight: 1.65 }}>Upload photos taken at different dates to see exactly how your condition is changing.</div>
          <button onClick={() => router.push("/Component1/progress")} style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "11px 22px", borderRadius: 999, background: MINT_TINT, border: `1px solid ${MINT}28`, color: MINT, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: FONT }}>
            <TrendingUp size={14} /> View recovery journey first
          </button>
        </GlassCard>
      )}
    </div>
  );
}

export default function Component1ComparePage() {
  const [visits, setVisits] = useState<Visit[]>([]);
  useEffect(() => { setVisits(loadVisits()); }, []);
  return (
    <SidebarLayout title="Before & After">
      <CompareContent visits={visits} />
    </SidebarLayout>
  );
}