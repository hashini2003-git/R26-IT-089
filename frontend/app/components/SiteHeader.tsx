"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

interface HeaderProps {
  transparent?: boolean;
  user?: { name: string; email: string } | null;
  onLogout?: () => void;
}

export default function SiteHeader({ transparent = false, user, onLogout }: HeaderProps) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = user
    ? [
        { label: "Home", path: "/home" },
        { label: "Lesion Analysis", path: "/Component1" },
        { label: "Risk & Voice Monitor", path: "/component2" },
        { label: "Speech Therapy", path: "/vocal_therapy" },
        { label: "Meditation", path: "/component4" },
      ]
    : [
        { label: "About", path: "/#about" },
        { label: "Features", path: "/#features" },
        { label: "Clinical AI", path: "/#clinical" },
      ];

  const handleLogout = () => {
    onLogout?.();
    router.push("/");
  };

  const bgClass =
    transparent && !scrolled
      ? "bg-transparent"
      : "bg-[#0B1F38]/95 nav-blur shadow-[0_1px_0_rgba(13,148,136,0.15)]";

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${bgClass}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 md:h-18">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="relative w-9 h-9">
              <div className="absolute inset-0 rounded-xl bg-[#0D9488] opacity-20 group-hover:opacity-30 transition-opacity" />
              <div className="relative w-9 h-9 rounded-xl bg-gradient-to-br from-[#0D9488] to-[#1565C0] flex items-center justify-center">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path d="M10 2C6.5 2 4 4.5 4 7.5C4 11 7 13.5 10 17C13 13.5 16 11 16 7.5C16 4.5 13.5 2 10 2Z" fill="white" fillOpacity="0.9" />
                  <circle cx="10" cy="8" r="2.5" fill="white" />
                </svg>
              </div>
            </div>
            <div>
              <span className="text-white font-semibold text-base tracking-tight leading-none block">OralCare AI</span>
              <span className="text-[#0D9488] text-[10px] font-mono tracking-widest leading-none">CLINICAL PLATFORM</span>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                href={link.path}
                className={`px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                  pathname === link.path ? "text-[#0D9488] bg-[#0D9488]/10" : "text-white/70 hover:text-white hover:bg-white/5"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#0D9488] to-[#1565C0] flex items-center justify-center text-white text-sm font-semibold">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-white/80 text-sm">{user.name}</span>
                </div>
                <button onClick={handleLogout} className="px-4 py-1.5 text-sm text-white/70 hover:text-white border border-white/15 hover:border-white/30 rounded-lg transition-all">
                  Sign out
                </button>
              </div>
            ) : (
              <>
                <Link href="/login" className="px-4 py-1.5 text-sm text-white/80 hover:text-white transition-colors">
                  Sign in
                </Link>
                <Link href="/register" className="px-4 py-1.5 text-sm font-medium bg-[#0D9488] hover:bg-[#14B8A6] text-white rounded-lg transition-all shadow-sm shadow-[#0D9488]/30">
                  Get Started
                </Link>
              </>
            )}
          </div>

          <button className="md:hidden w-9 h-9 flex items-center justify-center rounded-lg text-white/80 hover:bg-white/10 transition-colors" onClick={() => setMobileOpen(!mobileOpen)}>
            {mobileOpen ? (
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M1 1l16 16M17 1L1 17" />
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M1 4h16M1 9h16M1 14h16" />
              </svg>
            )}
          </button>
        </div>

        {mobileOpen && (
          <div className="md:hidden pb-4 border-t border-white/10 mt-1">
            <div className="pt-3 space-y-1">
              {navLinks.map((link) => (
                <Link key={link.path} href={link.path} onClick={() => setMobileOpen(false)} className="block px-3 py-2 rounded-lg text-sm text-white/75 hover:text-white hover:bg-white/8 transition-colors">
                  {link.label}
                </Link>
              ))}
              <div className="pt-3 border-t border-white/10 flex gap-2">
                {user ? (
                  <button onClick={handleLogout} className="flex-1 py-2 text-sm text-white/70 border border-white/15 rounded-lg">
                    Sign out
                  </button>
                ) : (
                  <>
                    <Link href="/login" onClick={() => setMobileOpen(false)} className="flex-1 py-2 text-center text-sm text-white/80 border border-white/15 rounded-lg">
                      Sign in
                    </Link>
                    <Link href="/register" onClick={() => setMobileOpen(false)} className="flex-1 py-2 text-center text-sm font-medium bg-[#0D9488] text-white rounded-lg">
                      Get Started
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}