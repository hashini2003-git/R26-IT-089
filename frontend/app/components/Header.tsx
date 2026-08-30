"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

interface HeaderProps {
  variant?: "dark" | "light";
  user?: { name: string; patientId: string } | null;
  onLogout?: () => void;
}

const LogoMark = () => (
  <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
    <path
      d="M11 1.5C7 1.5 4 4.5 4 8C4 12 7.5 14.8 11 19C14.5 14.8 18 12 18 8C18 4.5 15 1.5 11 1.5Z"
      fill="white"
      fillOpacity="0.92"
    />
    <circle cx="11" cy="8.5" r="2.8" fill="white" />
    <path d="M7 15.5 Q11 20 15 15.5" stroke="white" strokeWidth="0.6" strokeOpacity="0.4" fill="none" />
  </svg>
);

export default function Header({ variant = "dark", user, onLogout }: HeaderProps) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 24);
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);

  const isLight = variant === "light";

  const bgClass = isLight
    ? scrolled
      ? "bg-white/95 oc-nav-blur border-b border-[rgba(21,101,192,0.08)] shadow-sm"
      : "bg-white/88 oc-nav-blur border-b border-transparent"
    : scrolled
    ? "bg-[#0B1F38]/92 oc-nav-blur border-b border-white/[0.06] shadow-[0_1px_0_rgba(13,148,136,0.1)]"
    : "bg-transparent";

  const navLinks = user
    ? [
        { label: "Dashboard", path: "/home" },
        { label: "Lesion Analysis", path: "/Component1" },
        { label: "Risk Monitor", path: "/component2" },
        { label: "Meditation", path: "/component3" },
        { label: "Speech Therapy", path: "/vocal_therapy" },
      ]
    : [
        { label: "About", path: "/#about" },
        { label: "Modules", path: "/#modules" },
        { label: "How It Works", path: "/#how" },
      ];

  const initials = user
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "";

  function handleLogout() {
    onLogout?.();
    router.push("/");
    setMobileOpen(false);
  }

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${bgClass}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-[60px]">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group shrink-0">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center shadow-sm transition-transform group-hover:scale-105"
              style={{ background: "linear-gradient(135deg, #1565C0, #0D9488)" }}
            >
              <LogoMark />
            </div>
            <div className="leading-none">
              <span className={`oc-font-serif font-semibold text-[13px] block tracking-[-0.01em] ${isLight ? "text-[#0F2137]" : "text-white"}`}>
                OralCare AI
              </span>
              <span className="text-[9px] tracking-[0.14em] oc-font-mono uppercase" style={{ color: "#14B8A6" }}>
                Clinical Platform
              </span>
            </div>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-0.5">
            {navLinks.map((link) => {
              const active = pathname === link.path.split("#")[0];
              return (
                <Link
                  key={link.path}
                  href={link.path}
                  className={`px-3.5 py-1.5 rounded-lg text-[13px] font-medium transition-all duration-150 ${
                    active
                      ? isLight
                        ? "text-[#1565C0] bg-[#E3EEF9]"
                        : "text-[#14B8A6] bg-[rgba(13,148,136,0.12)]"
                      : isLight
                      ? "text-[#4A6070] hover:text-[#1565C0] hover:bg-[#E3EEF9]/70"
                      : "text-white/60 hover:text-white hover:bg-white/8"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          {/* Auth area */}
          <div className="hidden md:flex items-center gap-2">
            {user ? (
              <div className="flex items-center gap-3">
                <div
                  className="flex items-center gap-2.5 pl-2 pr-3 py-1.5 rounded-xl"
                  style={{
                    background: isLight ? "rgba(21,101,192,0.05)" : "rgba(255,255,255,0.06)",
                    border: isLight ? "1px solid rgba(21,101,192,0.10)" : "1px solid rgba(255,255,255,0.09)",
                  }}
                >
                  <div
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-[11px] font-bold shadow-sm"
                    style={{ background: "linear-gradient(135deg, #1565C0, #0D9488)" }}
                  >
                    {initials}
                  </div>
                  <span className={`text-[13px] font-medium ${isLight ? "text-[#0F2137]" : "text-white/85"}`}>
                    {user.name.split(" ")[0]}
                  </span>
                </div>
                <button
                  onClick={handleLogout}
                  className={`px-3.5 py-1.5 text-[13px] rounded-lg border transition-all ${
                    isLight
                      ? "border-[rgba(21,101,192,0.14)] text-[#4A6070] hover:text-[#1565C0] hover:border-[rgba(21,101,192,0.25)] hover:bg-[#E3EEF9]/50"
                      : "border-white/12 text-white/50 hover:text-white hover:border-white/25 hover:bg-white/6"
                  }`}
                >
                  Sign out
                </button>
              </div>
            ) : (
              <>
                <Link
                  href="/login"
                  className={`px-4 py-1.5 text-[13px] font-medium rounded-lg transition-colors ${
                    isLight ? "text-[#1565C0] hover:bg-[#E3EEF9]" : "text-white/70 hover:text-white hover:bg-white/8"
                  }`}
                >
                  Sign in
                </Link>
                <Link
                  href="/register"
                  className="px-4 py-1.5 text-[13px] font-semibold text-white rounded-lg transition-all shadow-sm"
                  style={{
                    background: "linear-gradient(135deg, #1565C0, #0D47A1)",
                    boxShadow: "0 2px 10px rgba(21,101,192,0.25)",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.boxShadow = "0 4px 16px rgba(21,101,192,0.38)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.boxShadow = "0 2px 10px rgba(21,101,192,0.25)";
                  }}
                >
                  Get Started
                </Link>
              </>
            )}
          </div>

          {/* Mobile toggle */}
          <button
            className={`md:hidden w-9 h-9 flex items-center justify-center rounded-lg transition-colors ${
              isLight ? "text-[#0F2137] hover:bg-[#E3EEF9]" : "text-white/75 hover:bg-white/10"
            }`}
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? (
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M1 1l16 16M17 1L1 17" />
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M1 4h16M1 9h16M1 14h10" />
              </svg>
            )}
          </button>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className={`md:hidden pb-5 mt-1 border-t ${isLight ? "border-[rgba(21,101,192,0.09)]" : "border-white/8"}`}>
            <div className="pt-3 space-y-0.5">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  href={link.path}
                  onClick={() => setMobileOpen(false)}
                  className={`block px-3 py-2.5 rounded-lg text-sm transition-colors ${
                    isLight ? "text-[#4A6070] hover:text-[#1565C0] hover:bg-[#E3EEF9]" : "text-white/65 hover:text-white hover:bg-white/8"
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </div>
            <div className={`mt-3 pt-3 flex gap-2 border-t ${isLight ? "border-[rgba(21,101,192,0.09)]" : "border-white/8"}`}>
              {user ? (
                <button onClick={handleLogout} className="flex-1 py-2.5 text-sm border border-[rgba(21,101,192,0.15)] text-[#4A6070] rounded-lg">
                  Sign out
                </button>
              ) : (
                <>
                  <Link
                    href="/login"
                    onClick={() => setMobileOpen(false)}
                    className="flex-1 py-2.5 text-center text-sm border border-[rgba(21,101,192,0.15)] text-[#1565C0] rounded-lg"
                  >
                    Sign in
                  </Link>
                  <Link
                    href="/register"
                    onClick={() => setMobileOpen(false)}
                    className="flex-1 py-2.5 text-center text-sm font-semibold text-white rounded-lg"
                    style={{ background: "linear-gradient(135deg, #1565C0, #0D47A1)" }}
                  >
                    Get Started
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
