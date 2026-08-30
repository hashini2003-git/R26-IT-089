"use client";

import Link from "next/link";

export default function Footer() {
  return (
    <footer style={{ background: "linear-gradient(160deg, #091929 0%, #0B1F38 55%, #0D2B4E 100%)" }}>
      <div className="h-px w-full" style={{ background: "linear-gradient(90deg, transparent, #1565C0, #0D9488, #1565C0, transparent)" }} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10">
          {/* Brand */}
          <div className="md:col-span-5">
            <div className="flex items-center gap-2.5 mb-4">
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center shadow-md"
                style={{ background: "linear-gradient(135deg, #1565C0, #0D9488)" }}
              >
                <svg width="20" height="20" viewBox="0 0 22 22" fill="none">
                  <path d="M11 1.5C7 1.5 4 4.5 4 8C4 12 7.5 14.8 11 19C14.5 14.8 18 12 18 8C18 4.5 15 1.5 11 1.5Z" fill="white" fillOpacity="0.92" />
                  <circle cx="11" cy="8.5" r="2.8" fill="white" />
                </svg>
              </div>
              <div>
                <span className="text-white font-semibold text-sm block">OralCare AI</span>
                <span className="text-[9px] tracking-[0.14em] oc-font-mono" style={{ color: "#14B8A6" }}>
                  CLINICAL PLATFORM
                </span>
              </div>
            </div>

            <p className="text-white/45 text-sm leading-relaxed max-w-sm mb-6">
              AI-powered oral cancer screening, voice monitoring, and personalized patient care — a research-grade clinical intelligence platform.
            </p>

            <div
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs oc-font-mono"
              style={{
                background: "rgba(13,148,136,0.10)",
                border: "1px solid rgba(13,148,136,0.18)",
                color: "#14B8A6",
              }}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-[#14B8A6] animate-pulse" />
              Platform active — All systems operational
            </div>
          </div>

          {/* Platform links */}
          <div className="md:col-span-3 md:col-start-7">
            <h4 className="text-white/40 text-[10px] oc-font-mono tracking-[0.14em] uppercase mb-4">Platform</h4>
            <ul className="space-y-3 text-sm text-white/50">
              {[
                { label: "Lesion Analysis", path: "/home" },
                { label: "Risk & Voice Monitor", path: "/home" },
                { label: "Speech Therapy", path: "/home" },
                { label: "Meditation Environment", path: "/home" },
              ].map((item) => (
                <li key={item.label}>
                  <Link href={item.path} className="hover:text-[#14B8A6] transition-colors">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Clinical */}
          <div className="md:col-span-2">
            <h4 className="text-white/40 text-[10px] oc-font-mono tracking-[0.14em] uppercase mb-4">Clinical AI</h4>
            <ul className="space-y-3 text-sm text-white/50">
              {["IPE Framework", "Multimodal AI", "Voice Biomarkers", "ViT-B/16 Model", "Real-time Analysis"].map((t) => (
                <li key={t}>{t}</li>
              ))}
            </ul>
          </div>
        </div>

        <div
          className="mt-10 pt-6 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-white/25"
          style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
        >
          <p>© 2026 OralCare AI Clinical Platform. Research project.</p>
          <p style={{ color: "rgba(20,184,166,0.45)" }}>Vision Transformer · Oral Health Innovation</p>
        </div>
      </div>
    </footer>
  );
}
