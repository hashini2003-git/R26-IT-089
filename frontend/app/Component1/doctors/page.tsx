"use client";

import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import {
  Heart, Camera, LayoutDashboard, BarChart2, TrendingUp, GitCompare,
  MessageSquare, Stethoscope, Menu, X, MapPin, Search, Building2, Navigation, Info, Phone, Globe,
} from "lucide-react";

/* ── Palette ─────────────────────────────────────────────────── */
const BLUE = "#1565C0";
const BLUE_TINT = "#E3EEF9";
const MINT = "#0D9488";
const NAVY = "#0B1F38";
const BG = "#F4F8FD";
const BORDER = "rgba(21,101,192,0.10)";
const SIDEBAR_BG = "#0B1F38";
const TEXT = "#0F2137";
const TEXT2 = "#4A6070";
const FONT = "'Inter', system-ui, sans-serif";
const SERIF = "'DM Serif Display', Georgia, serif";

function GlassCard({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{ background: "#fff", borderRadius: 20, border: `1px solid ${BORDER}`, boxShadow: "0 2px 12px rgba(21,101,192,0.06), 0 1px 3px rgba(0,0,0,0.04)", padding: 22, ...style }}>
      {children}
    </div>
  );
}

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

interface Doctor {
  name: string;
  type: string;
  location: string;
  notes: string;
  phone?: string;
  website?: string;
}

function mapsUrl(doc: Doctor) {
  const q = encodeURIComponent(`${doc.name}, ${doc.location}`);
  return `https://www.google.com/maps/search/?api=1&query=${q}`;
}

function DoctorsContent() {
  const [city, setCity] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [doctors, setDoctors] = useState<Doctor[] | null>(null);
  const [isFallback, setIsFallback] = useState(false);

  async function handleSearch() {
    setLoading(true);
    setError("");
    setDoctors(null);
    setIsFallback(false);
    try {
      const res = await fetch("/api/chat/find-doctors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ city, condition: "oral lesions and oral cancer" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Search failed");
      setDoctors(data.doctors ?? []);
      setIsFallback(Boolean(data.fallback));
    } catch (e) {
      console.error(e);
      setError("Couldn't find doctors right now. Please try again in a moment.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ padding: "28px 26px 48px", maxWidth: 780, margin: "0 auto", fontFamily: FONT }}>
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1.3, color: MINT, marginBottom: 5 }}>Doctor Recommendation</div>
        <h1 style={{ fontSize: 26, fontWeight: 400, color: NAVY, margin: "0 0 5px", fontFamily: SERIF }}>Find a specialist near you</h1>
        <p style={{ fontSize: 13, color: TEXT2, margin: 0 }}>Search for oral medicine specialists, oral surgeons, or hospitals relevant to your results.</p>
      </div>

      <GlassCard style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 8, background: BG, borderRadius: 12, border: `1.5px solid ${BORDER}`, padding: "10px 14px" }}>
            <MapPin size={15} color={TEXT2} />
            <input
              value={city}
              onChange={(e) => setCity(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              placeholder="Your city, e.g. Colombo, Kandy, Galle"
              style={{ flex: 1, border: "none", background: "none", outline: "none", fontSize: 13.5, color: TEXT, fontFamily: FONT }}
            />
          </div>
          <button
            onClick={handleSearch}
            disabled={loading}
            style={{
              display: "flex", alignItems: "center", gap: 7, padding: "11px 20px", borderRadius: 12,
              background: loading ? "#E8EDF2" : `linear-gradient(135deg, ${BLUE}, #0D47A1)`,
              color: loading ? TEXT2 : "#fff", border: "none", fontSize: 13, fontWeight: 700,
              cursor: loading ? "not-allowed" : "pointer", fontFamily: FONT,
              boxShadow: loading ? "none" : `0 4px 14px ${BLUE}40`,
            }}
          >
            <Search size={15} />
            {loading ? "Searching…" : "Search"}
          </button>
        </div>
      </GlassCard>

      {error && (
        <div style={{ padding: "12px 16px", borderRadius: 14, background: "#FDEDEB", color: "#E8483A", fontSize: 13, fontWeight: 600, marginBottom: 18 }}>
          {error}
        </div>
      )}

      {isFallback && doctors && doctors.length > 0 && !loading && (
        <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", borderRadius: 12, background: BLUE_TINT, color: BLUE, fontSize: 12, fontWeight: 600, marginBottom: 16 }}>
          <Info size={14} />
          Showing known specialist centers for this area — live search is temporarily unavailable.
        </div>
      )}

      {loading && (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {[1, 2, 3].map((i) => (
            <GlassCard key={i} style={{ height: 76 }}>
              <div style={{ width: "60%", height: 12, borderRadius: 6, background: "rgba(21,101,192,0.08)", marginBottom: 10 }} />
              <div style={{ width: "40%", height: 10, borderRadius: 5, background: "rgba(21,101,192,0.06)" }} />
            </GlassCard>
          ))}
        </div>
      )}

      {doctors && doctors.length === 0 && !loading && (
        <GlassCard style={{ textAlign: "center", padding: "40px 24px" }}>
          <div style={{ width: 56, height: 56, borderRadius: 16, background: BLUE_TINT, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px" }}>
            <Building2 size={26} color={BLUE} strokeWidth={1.5} />
          </div>
          <div style={{ fontSize: 14, color: TEXT2, lineHeight: 1.6 }}>
            No specific results found for that area. Try a nearby major city, or contact your nearest general hospital&apos;s oral medicine or ENT department directly.
          </div>
        </GlassCard>
      )}

      {doctors && doctors.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {doctors.map((doc, i) => (
            <GlassCard key={i}>
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, marginBottom: 6 }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: TEXT }}>{doc.name}</div>
                <span style={{ fontSize: 10.5, fontWeight: 700, padding: "3px 10px", borderRadius: 20, background: BLUE_TINT, color: BLUE, whiteSpace: "nowrap" }}>{doc.type}</span>
              </div>
              <div style={{ fontSize: 13, color: TEXT2, marginBottom: 4, display: "flex", alignItems: "center", gap: 5 }}>
                <MapPin size={12} /> {doc.location}
              </div>
              <div style={{ fontSize: 12.5, color: "#9BAABA", lineHeight: 1.5, marginBottom: 14 }}>{doc.notes}</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                <a
                  href={mapsUrl(doc)}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12.5, fontWeight: 700,
                    color: MINT, textDecoration: "none", padding: "7px 14px", borderRadius: 10,
                    background: "rgba(13,148,136,0.08)", border: "1px solid rgba(13,148,136,0.18)",
                  }}
                >
                  <Navigation size={13} /> Directions
                </a>
                {doc.phone && (
                  <a
                    href={`tel:${doc.phone.replace(/\s+/g, "")}`}
                    style={{
                      display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12.5, fontWeight: 700,
                      color: BLUE, textDecoration: "none", padding: "7px 14px", borderRadius: 10,
                      background: BLUE_TINT, border: `1px solid ${BLUE}28`,
                    }}
                  >
                    <Phone size={13} /> {doc.phone}
                  </a>
                )}
                {doc.website && (
                  <a
                    href={doc.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12.5, fontWeight: 700,
                      color: TEXT2, textDecoration: "none", padding: "7px 14px", borderRadius: 10,
                      background: "#F4F8FD", border: `1px solid ${BORDER}`,
                    }}
                  >
                    <Globe size={13} /> Website
                  </a>
                )}
              </div>
            </GlassCard>
          ))}
        </div>
      )}

      <p style={{ fontSize: 11, color: "#9BAABA", textAlign: "center", marginTop: 28, lineHeight: 1.6 }}>
        Results are AI-assisted search suggestions, not a verified directory. Always confirm details and availability directly with the clinic before visiting.
      </p>
    </div>
  );
}

export default function Component1DoctorsPage() {
  return (
    <SidebarLayout title="Find a Doctor">
      <DoctorsContent />
    </SidebarLayout>
  );
}