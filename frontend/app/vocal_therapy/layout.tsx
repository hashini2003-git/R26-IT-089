"use client";

import SideBar from "@/app/vocal_therapy/components/SideBar";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const D = {
  bg:         "oklch(0.985 0.004 230)",
  surface:    "#ffffff",
  border:     "oklch(0.92 0.008 230)",
  text:       "oklch(0.22 0.018 250)",
  textMuted:  "oklch(0.48 0.018 250)",
  textDim:    "oklch(0.62 0.012 250)",
  accent:     "oklch(0.55 0.10 220)",
  accentSoft: "oklch(0.96 0.025 220)",
  accentInk:  "oklch(0.36 0.08 220)",
  breakpoints: { 
    mobile: 480,   // < 480px
    tablet: 768,   // 480px - 768px
    laptop: 1024,  // 768px - 1024px
    desktop: 1280, // > 1024px
  },
};

export default function VocalTherapyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [screenSize, setScreenSize] = useState<'mobile' | 'tablet' | 'laptop' | 'desktop'>('desktop');

  useEffect(() => {
    const checkScreenSize = () => {
      const width = window.innerWidth;
      if (width < D.breakpoints.mobile) {
        setScreenSize('mobile');
      } else if (width < D.breakpoints.tablet) {
        setScreenSize('tablet');
      } else if (width < D.breakpoints.laptop) {
        setScreenSize('laptop');
      } else {
        setScreenSize('desktop');
      }
    };
    checkScreenSize();
    window.addEventListener("resize", checkScreenSize);
    return () => window.removeEventListener("resize", checkScreenSize);
  }, []);

  // Get left margin based on screen size
  const getLeftMargin = () => {
    switch(screenSize) {
      case 'mobile':
        return 'auto';
      case 'tablet':
        return 'auto';
      case 'laptop':
        return '280px'; // Sidebar is visible on laptop
      case 'desktop':
        return '300px'; // Slightly more space on larger screens
      default:
        return 'auto';
    }
  };

  // Get maxWidth based on screen size
  const getMaxWidth = () => {
    switch(screenSize) {
      case 'mobile':
        return '100%';
      case 'tablet':
        return D.breakpoints.tablet;
      case 'laptop':
        return D.breakpoints.laptop;
      case 'desktop':
        return D.breakpoints.desktop;
      default:
        return D.breakpoints.desktop;
    }
  };

  // Get padding based on screen size
  const getPadding = () => {
    switch(screenSize) {
      case 'mobile':
        return "0 0.75rem clamp(1rem, 4vw, 2rem) 0.75rem";
      case 'tablet':
        return "0 1rem clamp(1rem, 4vw, 2rem) 1rem";
      case 'laptop':
        return "0 1.25rem clamp(1rem, 4vw, 2rem) 1.25rem";
      case 'desktop':
        return "0 1.5rem clamp(1rem, 4vw, 2rem) 1.5rem";
      default:
        return "0 clamp(0.75rem, 3vw, 1.25rem) clamp(1rem, 4vw, 2rem) clamp(0.75rem, 3vw, 1.25rem)";
    }
  };

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: D.bg }}>
      <SideBar />
      
      {/* Main Content */}
      <div style={{
        flex: 1,
        overflow: "auto",
        padding: getPadding(),
        maxWidth: getMaxWidth(),
        margin: "0 auto",
        marginLeft: getLeftMargin(),
        width: "100%",
        minHeight: "100vh",
      }}>
        {children}
      </div>
    </div>
  );
}