"use client";

import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { getPatient } from "../../lib/auth";
import { useEffect, useState, memo, useMemo } from "react";

// Using NavBar's color scheme
const D = {
  surface:      "#ffffff",
  border:       "oklch(0.92 0.01 145)",
  text:         "oklch(0.22 0.015 150)",
  textMuted:    "oklch(0.50 0.015 150)",
  accent:       "oklch(0.62 0.14 150)",
  accentSoft:   "oklch(0.96 0.03 150)",
  accentInk:    "oklch(0.38 0.08 150)",
  sidebarBg:    "oklch(0.98 0.005 150)",
  breakpoints: { 
    mobile: 480,   // < 480px
    tablet: 768,   // 480px - 768px
    laptop: 1024,  // 768px - 1024px
    desktop: 1280, // > 1024px
  },
};

// ── SidebarLink Component ────────────────────────────────────────────────
const SidebarLink = memo(function SidebarLink({
  href,
  icon,
  label,
  active,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "10px 16px",
        borderRadius: 10,
        color: active ? D.accentInk : D.textMuted,
        background: active ? D.accentSoft : "transparent",
        textDecoration: "none",
        fontWeight: active ? 600 : 500,
        fontSize: "0.9rem",
        transition: "background .15s, color .15s",
        width: "100%",
        cursor: "pointer",
      }}
    >
      <span style={{ width: 20, height: 20, flexShrink: 0 }}>{icon}</span>
      {label}
    </Link>
  );
});

// ── DayProgress Component ─────────────────────────────────────────────────
const DayProgress = memo(function DayProgress({ current, total }: { current: number; total: number }) {
  const percentage = Math.min((current / total) * 100, 100);

  return (
    <div
      style={{
        padding: "16px 20px",
        background: D.surface,
        borderRadius: 12,
        border: `1px solid ${D.border}`,
        marginBottom: 16,
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 8,
        }}
      >
        <span
          style={{
            fontSize: "0.75rem",
            fontWeight: 600,
            color: D.textMuted,
            textTransform: "uppercase",
            letterSpacing: "0.04em",
          }}
        >
          Progress
        </span>
        <span
          style={{
            fontSize: "0.85rem",
            fontWeight: 700,
            color: D.text,
          }}
        >
          Day {current} of {total}
        </span>
      </div>

      <div
        style={{
          width: "100%",
          height: 6,
          background: D.border,
          borderRadius: 4,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            width: `${percentage}%`,
            height: "100%",
            background: D.accent,
            borderRadius: 4,
            transition: "width .3s ease",
          }}
        />
      </div>
    </div>
  );
});

// ── ExerciseButton Component ─────────────────────────────────────────────
const ExerciseButton = memo(function ExerciseButton() {
  const router = useRouter();

  return (
    <button
      onClick={() => router.push("/vocal_therapy/exercises")}
      style={{
        width: "100%",
        padding: "12px 20px",
        background: D.accent,
        color: "#fff",
        border: "none",
        borderRadius: 10,
        fontWeight: 700,
        fontSize: "0.9rem",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        transition: "opacity .15s, transform .15s",
        marginBottom: 24,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.opacity = "0.9";
        e.currentTarget.style.transform = "scale(0.98)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.opacity = "1";
        e.currentTarget.style.transform = "scale(1)";
      }}
    >
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <path
          d="M8 2v12M2 8h12"
          stroke="white"
          strokeWidth="1.6"
          strokeLinecap="round"
        />
      </svg>
      Start Exercise
    </button>
  );
});

// ── MobileBottomNav Component ────────────────────────────────────────────
const MobileBottomNav = memo(function MobileBottomNav() {
  const pathname = usePathname();
  const router = useRouter();

  const getButtonColor = useMemo(() => {
    return (path: string) => {
      return pathname === path ? D.accent : D.textMuted;
    };
  }, [pathname]);

  return (
    <div
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        background: D.surface,
        borderTop: `1px solid ${D.border}`,
        padding: "6px 8px",
        display: "flex",
        justifyContent: "space-around",
        alignItems: "center",
        zIndex: 200,
        boxShadow: "0 -2px 10px rgba(0,0,0,0.05)",
        height: 72,
      }}
    >
      {/* Guide Button */}
      <button
        onClick={() => router.push("/vocal_therapy/guide")}
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 2,
          background: "none",
          border: "none",
          cursor: "pointer",
          padding: "4px 8px",
          color: getButtonColor("/vocal_therapy/guide"),
          flex: 1,
        }}
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path
            d="M2 6h8v14H4a2 2 0 01-2-2V6z"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M22 6h-8v14h6a2 2 0 002-2V6z"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M12 6v14"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
        <span style={{ fontSize: "0.55rem", fontWeight: 600 }}>Guide</span>
      </button>

      {/* Today Button */}
      <button
        onClick={() => router.push("/vocal_therapy/analyze")}
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 2,
          background: "none",
          border: "none",
          cursor: "pointer",
          padding: "4px 8px",
          color: getButtonColor("/vocal_therapy/analyze"),
          flex: 1,
        }}
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path
            d="M4 12h4l2-8 6 16 2-8h4"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <span style={{ fontSize: "0.55rem", fontWeight: 600 }}>Today</span>
      </button>

      {/* Exercise Button (Center - Prominent) */}
      <button
        onClick={() => router.push("/vocal_therapy/exercises")}
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 2,
          background: D.accent,
          border: "none",
          cursor: "pointer",
          padding: "8px 16px",
          borderRadius: 30,
          color: "#fff",
          transform: "translateY(-12px)",
          boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
          flex: 1,
        }}
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path
            d="M12 4v16M4 12h16"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
        <span style={{ fontSize: "0.55rem", fontWeight: 700 }}>Exercise</span>
      </button>

      {/* Dashboard Button */}
      <button
        onClick={() => router.push("/vocal_therapy/dashboard")}
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 2,
          background: "none",
          border: "none",
          cursor: "pointer",
          padding: "4px 8px",
          color: getButtonColor("/vocal_therapy/dashboard"),
          flex: 1,
        }}
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <rect
            x="2"
            y="2"
            width="8"
            height="8"
            rx="1.5"
            stroke="currentColor"
            strokeWidth="2"
          />
          <rect
            x="14"
            y="2"
            width="8"
            height="8"
            rx="1.5"
            stroke="currentColor"
            strokeWidth="2"
          />
          <rect
            x="2"
            y="14"
            width="8"
            height="8"
            rx="1.5"
            stroke="currentColor"
            strokeWidth="2"
          />
          <rect
            x="14"
            y="14"
            width="8"
            height="8"
            rx="1.5"
            stroke="currentColor"
            strokeWidth="2"
          />
        </svg>
        <span style={{ fontSize: "0.55rem", fontWeight: 600 }}>Dashboard</span>
      </button>

      {/* Doctors Button */}
      <button
        onClick={() => router.push("/vocal_therapy/doctors")}
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 2,
          background: "none",
          border: "none",
          cursor: "pointer",
          padding: "4px 8px",
          color: getButtonColor("/vocal_therapy/doctors"),
          flex: 1,
        }}
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path
            d="M12 4a3 3 0 100 6 3 3 0 000-6zM4 20v-1a4 4 0 014-4h8a4 4 0 014 4v1"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <span style={{ fontSize: "0.55rem", fontWeight: 600 }}>Doctors</span>
      </button>
    </div>
  );
});

// ── Main SideBar Component ───────────────────────────────────────────────
const SideBar = memo(function SideBar() {
  const pathname = usePathname();
  const [dayNum, setDayNum] = useState<number | null>(null);
  const [screenType, setScreenType] = useState<'mobile' | 'tablet' | 'laptop' | 'desktop'>('desktop');

  // Check screen size with 4 breakpoints
  useEffect(() => {
    const checkScreenSize = () => {
      const width = window.innerWidth;
      if (width < D.breakpoints.mobile) {
        setScreenType('mobile');
      } else if (width < D.breakpoints.tablet) {
        setScreenType('tablet');
      } else if (width < D.breakpoints.laptop) {
        setScreenType('laptop');
      } else {
        setScreenType('desktop');
      }
    };
    checkScreenSize();
    window.addEventListener("resize", checkScreenSize);
    return () => window.removeEventListener("resize", checkScreenSize);
  }, []);

  // Load patient data once
  useEffect(() => {
    const p = getPatient();
    setDayNum(p?.day_number ?? null);
  }, []);

  // Determine if sidebar should be shown (laptop and desktop)
  const showSidebar = screenType === 'laptop' || screenType === 'desktop';
  const isMobile = screenType === 'mobile' || screenType === 'tablet';

  // Memoize navigation links to prevent re-renders
  const navigationLinks = useMemo(() => (
    <div style={{ 
      display: "flex", 
      flexDirection: "column", 
      gap: 2,
      borderTop: `1px solid ${D.border}`,
      paddingTop: 24,
    }}>
      <SidebarLink
        href="/vocal_therapy/guide"
        icon={
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <path
            d="M2 4h6v12H4a2 2 0 01-2-2V4z"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M18 4h-6v12h4a2 2 0 002-2V4z"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M10 4v12"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
          />
        </svg>
        }
        label="Guide"
        active={pathname === "/vocal_therapy/guide"}
      />    
      <SidebarLink
        href="/vocal_therapy/analyze"
        icon={
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path
              d="M2 10h3l2-6 4 12 2-6h3"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        }
        label="Today"
        active={pathname === "/vocal_therapy/analyze"}
      />  
      <SidebarLink
        href="/vocal_therapy/dashboard"
        icon={
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <rect
            x="2"
            y="2"
            width="6"
            height="6"
            rx="1"
            stroke="currentColor"
            strokeWidth="1.6"
          />
          <rect
            x="12"
            y="2"
            width="6"
            height="6"
            rx="1"
            stroke="currentColor"
            strokeWidth="1.6"
          />
          <rect
            x="2"
            y="12"
            width="6"
            height="6"
            rx="1"
            stroke="currentColor"
            strokeWidth="1.6"
          />
          <rect
            x="12"
            y="12"
            width="6"
            height="6"
            rx="1"
            stroke="currentColor"
            strokeWidth="1.6"
          />
        </svg>
        }
        label="Dashboard"
        active={pathname === "/vocal_therapy/dashboard"}
      />                  
      <SidebarLink
        href="/vocal_therapy/doctors"
        icon={
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path
              d="M10 2a3 3 0 100 6 3 3 0 000-6zM3 17v-1a4 4 0 014-4h6a4 4 0 014 4v1"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        }
        label="Meet your doctor"
        active={pathname === "/vocal_therapy/doctors"}
      />            
    </div>
  ), [pathname]);

  // Render mobile/tablet bottom nav
  if (isMobile) {
    return <MobileBottomNav />;
  }

  // Render sidebar for laptop and desktop with different widths
  const sidebarWidth = screenType === 'laptop' ? 240 : 260;

  return (
    <aside
      style={{
        width: sidebarWidth,
        height: "calc(100vh - 60px)",
        position: "fixed",
        top: 60,
        left: 0,
        background: D.sidebarBg,
        borderRight: `1px solid ${D.border}`,
        padding: "30px 16px",
        display: "flex",
        flexDirection: "column",
        flexShrink: 0,
        overflowY: "auto",
        zIndex: 100,
      }}
    >
      {/* Day Progress */}
      {dayNum !== null && (
        <DayProgress current={dayNum} total={30} />
      )}

      {/* Start Exercise Button - Below Progress */}
      <ExerciseButton />

      {/* Navigation Links - Memoized */}
      {navigationLinks}

      <div style={{ flex: 1 }} />
    </aside>
  );
});

export default SideBar;