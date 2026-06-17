"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { isLoggedIn, getPatient, clearAuth, subscribeToAuthChanges } from "../lib/auth";

const D = {
  surface: "#ffffff",

  // Borders & backgrounds
  border: "oklch(0.92 0.01 145)",

  // Text
  text: "oklch(0.22 0.015 150)",
  textMuted: "oklch(0.50 0.015 150)",

  // Primary healthcare green
  accent: "oklch(0.62 0.14 150)",

  // Hover & active states
  accentDark: "oklch(0.55 0.14 150)",

  // Soft backgrounds
  accentSoft: "oklch(0.96 0.03 150)",

  // Active text
  accentInk: "oklch(0.38 0.08 150)",

  // Optional success color
  success: "#22c55e",

  // Optional emergency red
  danger: "#ef4444",
};

function WaveformLogo({ loggedIn }: { loggedIn?: boolean }) {
  const href = loggedIn ? "/home" : "/home";
  
  return (
    <a href={href} style={{
      display: "flex", alignItems: "center", gap: 10,
      textDecoration: "none", color: D.text,
    }}>
      <div style={{
        width: 30, height: 30, borderRadius: 8,
        background: D.accent,
        display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
      }}>
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M2 8 L4 8 L5 4 L7 12 L9 5 L10 8 L14 8"
            stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
      <span style={{ fontWeight: 600, fontSize: "0.95rem", letterSpacing: "-0.01em" }}>
        Project Topic
      </span>
    </a>
  );
}

function TabLink({
  href, children, active,
}: { href: string; children: React.ReactNode; active: boolean }) {
  return (
    <a href={href} style={{
      color:          active ? D.accentInk : D.textMuted,
      textDecoration: "none",
      fontWeight:     active ? 600 : 500,
      fontSize:       "0.85rem",
      padding:        "8px 20px",
      borderRadius:   8,
      background:     active ? D.accentSoft : "transparent",
      transition:     "all .2s ease",
      position:       "relative",
    }}
    onMouseEnter={(e) => {
      if (!active) {
        e.currentTarget.style.color = D.accentInk;
        e.currentTarget.style.background = D.accentSoft;
      }
    }}
    onMouseLeave={(e) => {
      if (!active) {
        e.currentTarget.style.color = D.textMuted;
        e.currentTarget.style.background = "transparent";
      }
    }}>
      {children}
    </a>
  );
}

function InitialsBadge({ name }: { name: string }) {
  const parts    = name.trim().split(/\s+/);
  const initials = parts.length >= 2
    ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    : name.slice(0, 2).toUpperCase();

  return (
    <div title={name} style={{
      width: 32, height: 32, borderRadius: "50%",
      background: D.accent, color: "#fff",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: "0.75rem", fontWeight: 700, letterSpacing: "0.03em",
      flexShrink: 0, cursor: "pointer",
      transition: "transform .2s ease",
    }}
    onMouseEnter={(e) => e.currentTarget.style.transform = "scale(1.05)"}
    onMouseLeave={(e) => e.currentTarget.style.transform = "scale(1)"}>
      {initials}
    </div>
  );
}

function HamburgerIcon({ isOpen }: { isOpen: boolean }) {
  return (
    <div style={{
      width: 24, height: 24,
      display: "flex", flexDirection: "column",
      justifyContent: "space-around",
      alignItems: "center",
      padding: "2px 0",
    }}>
      <span style={{
        display: "block",
        width: "100%",
        height: 2,
        background: D.text,
        borderRadius: 2,
        transition: "all .25s ease",
        transform: isOpen ? "rotate(45deg) translate(5px, 5px)" : "none",
      }} />
      <span style={{
        display: "block",
        width: "100%",
        height: 2,
        background: D.text,
        borderRadius: 2,
        transition: "all .25s ease",
        opacity: isOpen ? 0 : 1,
      }} />
      <span style={{
        display: "block",
        width: "100%",
        height: 2,
        background: D.text,
        borderRadius: 2,
        transition: "all .25s ease",
        transform: isOpen ? "rotate(-45deg) translate(5px, -5px)" : "none",
      }} />
    </div>
  );
}

export default function NavBar() {
  const router   = useRouter();
  const pathname = usePathname();
  const [loggedIn, setLoggedIn] = useState(false);
  const [name,     setName]     = useState("");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Function to update auth state
  const updateAuthState = () => {
    const li = isLoggedIn();
    setLoggedIn(li);
    if (li) {
      const p = getPatient();
      setName(p?.name ?? "");
    } else {
      setName("");
    }
  };

  useEffect(() => {
    // Initial check
    updateAuthState();

    // Subscribe to auth changes
    const unsubscribe = subscribeToAuthChanges(updateAuthState);

    // Cleanup subscription on unmount
    return unsubscribe;
  }, []);

  function handleLogout() {
    clearAuth();
    router.push("/login");
    setIsMobileMenuOpen(false);
  }

  // Navigation links configuration
  const navLinks = [
    { href: "/component1", label: "Component 1" },
    { href: "/component2", label: "Component 2" },
    { href: "/component3", label: "Component 3" },
    { href: "/component4", label: "Component 4" },
  ];

  return (
    <>
      <nav style={{
        background:     D.surface,
        borderBottom:   `1px solid ${D.border}`,
        padding:        "0 1.75rem",
        height:         64,
        display:        "flex",
        alignItems:     "center",
        justifyContent: "space-between",
        position:       "sticky",
        top:            0,
        zIndex:         200,
        boxShadow:      "0 1px 3px rgba(0,0,0,0.02)",
      }}>
        <WaveformLogo />

        {/* Desktop Navigation Links - Only show when logged in */}
        {loggedIn && (
          <div style={{
            display: "none",
            gap: "0.5rem",
            alignItems: "center",
            position: "absolute",
            left: "50%",
            transform: "translateX(-50%)",
          }} className="desktop-nav">
            {navLinks.map((link) => (
              <TabLink
                key={link.href}
                href={link.href}
                active={pathname === link.href}
              >
                {link.label}
              </TabLink>
            ))}
          </div>
        )}

        {/* Right side - Auth buttons */}
        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
          {/* Desktop auth buttons */}
          <div style={{
            display: "none",
            alignItems: "center",
            gap: "0.5rem",
          }} className="desktop-auth">
            {loggedIn ? (
              <>
                <button
                  onClick={handleLogout}
                  style={{
                    background: "transparent",
                    border: "none",
                    cursor: "pointer",
                    padding: "6px 12px",
                    color: D.textMuted,
                    fontSize: "0.8rem",
                    fontWeight: 500,
                    borderRadius: 6,
                    transition: "all .2s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = D.accentInk;
                    e.currentTarget.style.background = D.accentSoft;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = D.textMuted;
                    e.currentTarget.style.background = "transparent";
                  }}
                >
                  Sign out
                </button>
                <InitialsBadge name={name} />
              </>
            ) : (
              <>
                <a href="/login" style={{
                  color: D.textMuted,
                  textDecoration: "none",
                  fontWeight: 500,
                  fontSize: "0.85rem",
                  padding: "8px 16px",
                  borderRadius: 6,
                  transition: "all .2s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = D.accentInk;
                  e.currentTarget.style.background = D.accentSoft;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = D.textMuted;
                  e.currentTarget.style.background = "transparent";
                }}>
                  Sign in
                </a>
                <a href="/register" style={{
                  background: D.accent,
                  color: "#fff",
                  textDecoration: "none",
                  fontWeight: 600,
                  fontSize: "0.85rem",
                  padding: "8px 20px",
                  borderRadius: 8,
                  transition: "all .2s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "oklch(0.55 0.18 150)";
                  e.currentTarget.style.transform = "translateY(-1px)";
                  e.currentTarget.style.boxShadow = "0 4px 12px rgba(34, 197, 94, 0.25)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = D.accent;
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "none";
                }}>
                  Create account
                </a>
              </>
            )}
          </div>

          {/* Mobile Hamburger - Show when logged in */}
          {loggedIn && (
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              style={{
                display: "block",
                background: "transparent",
                border: "none",
                cursor: "pointer",
                padding: "8px",
              }}
              className="hamburger-btn"
              aria-label="Toggle menu"
            >
              <HamburgerIcon isOpen={isMobileMenuOpen} />
            </button>
          )}

          {/* Mobile auth buttons when not logged in */}
          {!loggedIn && (
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
            }} className="mobile-auth">
              <a href="/login" style={{
                color: D.textMuted,
                textDecoration: "none",
                fontWeight: 500,
                fontSize: "0.85rem",
                padding: "8px 16px",
                borderRadius: 6,
                transition: "all .2s ease",
              }}>
                Sign in
              </a>
              <a href="/register" style={{
                background: D.accent,
                color: "#fff",
                textDecoration: "none",
                fontWeight: 600,
                fontSize: "0.85rem",
                padding: "8px 20px",
                borderRadius: 8,
                transition: "all .2s ease",
              }}>
                Create account
              </a>
            </div>
          )}
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      {loggedIn && isMobileMenuOpen && (
        <div style={{
          position: "fixed",
          top: 64,
          left: 0,
          right: 0,
          bottom: 0,
          background: "rgba(0,0,0,0.3)",
          zIndex: 199,
          animation: "fadeIn 0.2s ease",
        }} onClick={() => setIsMobileMenuOpen(false)}>
          <div style={{
            background: D.surface,
            padding: "1.5rem 1.75rem",
            borderBottom: `1px solid ${D.border}`,
            boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
            display: "flex",
            flexDirection: "column",
            gap: "0.5rem",
            animation: "slideDown 0.25s ease",
          }} onClick={(e) => e.stopPropagation()}>
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setIsMobileMenuOpen(false)}
                style={{
                  color: pathname === link.href ? D.accentInk : D.text,
                  textDecoration: "none",
                  fontWeight: pathname === link.href ? 600 : 500,
                  fontSize: "1rem",
                  padding: "12px 16px",
                  borderRadius: 8,
                  background: pathname === link.href ? D.accentSoft : "transparent",
                  transition: "all .2s ease",
                  border: "none",
                  width: "100%",
                  textAlign: "left",
                }}
              >
                {link.label}
              </a>
            ))}
            <hr style={{
              border: "none",
              borderTop: `1px solid ${D.border}`,
              margin: "0.5rem 0",
            }} />
            <button
              onClick={handleLogout}
              style={{
                background: "transparent",
                border: "none",
                cursor: "pointer",
                padding: "12px 16px",
                color: D.textMuted,
                fontSize: "1rem",
                fontWeight: 500,
                borderRadius: 8,
                transition: "all .2s ease",
                textAlign: "left",
                width: "100%",
              }}
            >
              Sign out
            </button>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideDown {
          from { 
            opacity: 0;
            transform: translateY(-10px);
          }
          to { 
            opacity: 1;
            transform: translateY(0);
          }
        }
        @media (min-width: 768px) {
          .desktop-nav {
            display: flex !important;
          }
          .desktop-auth {
            display: flex !important;
          }
          .hamburger-btn {
            display: none !important;
          }
          .mobile-auth {
            display: none !important;
          }
        }
        @media (max-width: 767px) {
          .desktop-nav {
            display: none !important;
          }
          .desktop-auth {
            display: none !important;
          }
          .hamburger-btn {
            display: block !important;
          }
        }
      `}</style>
    </>
  );
}