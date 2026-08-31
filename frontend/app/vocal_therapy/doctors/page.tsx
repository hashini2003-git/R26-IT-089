"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { isLoggedIn } from "../../lib/auth";

// Design tokens - Updated to match NavBar/SideBar green color scheme
const D = {
  bg:         "oklch(0.985 0.004 150)",
  surface:    "#ffffff",
  border:     "oklch(0.92 0.01 145)",
  borderStrong: "oklch(0.86 0.015 145)",
  text:       "oklch(0.22 0.015 150)",
  textMuted:  "oklch(0.50 0.015 150)",
  textDim:    "oklch(0.62 0.012 150)",
  accent:     "oklch(0.62 0.14 150)",
  accentSoft: "oklch(0.96 0.03 150)",
  accentInk:  "oklch(0.38 0.08 150)",
  low:        "oklch(0.62 0.13 160)",
  lowSoft:    "oklch(0.95 0.04 160)",
  shadow:     "0 1px 3px rgba(15,32,60,0.06), 0 1px 0 rgba(15,32,60,0.02)",
  shadowMd:   "0 4px 16px rgba(15,32,60,0.07)",
  fontMono:   "'JetBrains Mono', ui-monospace, monospace",
  breakpoints: { mobile: 640, tablet: 768, desktop: 960 },
};

// ── Icons ─────────────────────────────────────────────────────────────────────
const Icons = {
  Calendar: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  ),
  Location: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  ),
  Briefcase: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
      <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
    </svg>
  ),
  Check: () => (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  ),
  Clock: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  ),
  X: () => (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  ),
  ArrowRight: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="12 5 19 12 12 19" />
    </svg>
  ),
};

// ── Doctor Data with Individual Booking Links ──────────────────────────────
interface Doctor {
  id: string;
  name: string;
  title: string;
  specialty: string;
  availability: "available" | "busy" | "away";
  experience: string;
  location: string;
  bookingUrl: string;
}

const doctors: Doctor[] = [
  {
    id: "1",
    name: "MS NINA ANUPAMA PANTERLIYON",
    title: "SPEECH THERAPIST AND AUDIOLOGIST",
    specialty: "Adult & Pediatric Audiology",
    availability: "available",
    experience: "NA",
    location: "Colombo, Sri Lanka",
    bookingUrl: "https://www.echannelling.com/doctor-search/D3685?doctorId=D3685&doctorName=NINA%20ANUPAMA%20PANTERLIYON&id=D3685&specializationType=multiple",
  },
  {
    id: "2",
    name: "MS BUDDHIMA SAMARAWEERA",
    title: "SPEECH LANGUAGE PATHALOGIST AND AUDIOLOGIST",
    specialty: "Clinical Audiology",
    availability: "available",
    experience: "NA",
    location: "Colombo, Sri Lanka",
    bookingUrl: "https://www.echannelling.com/doctor-search/D1386?doctorId=D1386&doctorName=BUDDHIMA%20SAMARAWEERA&id=D1386&specializationType=multiple",
  },
  {
    id: "3",
    name: "MR SHANILKA NIRUKSHAN FERNANDO",
    title: "SPEECH THERAPIST AND AUDIOLOGIST",
    specialty: "Clinical Audiology",
    availability: "available",
    experience: "NA",
    location: "Colombo, Sri Lanka",
    bookingUrl: "https://www.echannelling.com/doctor-search/D15164?doctorId=D15164&doctorName=MR%20SHANILKA%20NIRUKSHAN%20FERNANDO&id=D15164&isChannelNow=true&session_date&specializationId=22&specializationType=multiple",
  }, 
  {
    id: "4",
    name: "DR WEERARATHNE",
    title: "SPEECH THERAPIST",
    specialty: "Clinical Audiology",
    availability: "available",
    experience: "NA",
    location: "Colombo, Sri Lanka",
    bookingUrl: "https://www.echannelling.com/doctor-search/D10825?doctorId=D10825&doctorName=DR%20NIMEERA%20C.%20WEERARATHNE&id=D10825&isChannelNow=true&session_date&specializationId=22&specializationType=multiple",
  },
  {
    id: "5",
    name: "MRS EVON WEERASINGHE",
    title: "SPEECH THERAPIST",
    specialty: "Clinical Audiology",
    availability: "available",
    experience: "NA",
    location: "Colombo, Sri Lanka",
    bookingUrl: "https://www.echannelling.com/doctor-search/D4266?doctorId=D4266&doctorName=MRS%20EVON%20WEERASINGHE&id=D4266&isChannelNow=true&session_date&specializationId=22&specializationType=multiple",
  },   
  {
    id: "6",
    name: "DR UPULI PERERA",
    title: "SPEECH THERAPIST",
    specialty: "Clinical Audiology",
    availability: "available",
    experience: "NA",
    location: "Colombo, Sri Lanka",
    bookingUrl: "https://www.echannelling.com/doctor-search/D11458?doctorId=D11458&doctorName=DR%20UPULI%20PERERA&id=D11458&isChannelNow=true&session_date&specializationId=22&specializationType=multiple",
  },
  {
    id: "7",
    name: "MS MAYURI BANDARA",
    title: "SPEECH THERAPIST",
    specialty: "Clinical Audiology",
    availability: "available",
    experience: "NA",
    location: "Colombo, Sri Lanka",
    bookingUrl: "https://www.echannelling.com/doctor-search/D4387?doctorId=D4387&doctorName=MS%20MAYURI%20BANDARA&id=D4387&isChannelNow=true&session_date&specializationId=22&specializationType=multiple",
  }, 
  {
    id: "8",
    name: "DR W G D S GUNASEKARA",
    title: "SPEECH THERAPIST",
    specialty: "Clinical Audiology",
    availability: "available",
    experience: "NA",
    location: "Colombo, Sri Lanka",
    bookingUrl: "https://www.echannelling.com/doctor-search/D9149?doctorId=D9149&doctorName=DR%20W%20G%20D%20S%20GUNASEKARA&id=D9149&isChannelNow=true&session_date&specializationId=22&specializationType=multiple",
  }, 
  {
    id: "9",
    name: "DR . NISANSALA",
    title: "SPEECH THERAPIST",
    specialty: "Clinical Audiology",
    availability: "available",
    experience: "NA",
    location: "Colombo, Sri Lanka",
    bookingUrl: "https://www.echannelling.com/doctor-search/D3590?doctorId=D3590&doctorName=DR%20.%20NISANSALA&id=D3590&isChannelNow=true&session_date&specializationId=22&specializationType=multiple",
  },     
];

// ── Doctor Card Component ──────────────────────────────────────────────────
function DoctorCard({ doctor }: { doctor: Doctor }) {
  const availabilityColor = {
    available: D.low,
    busy: "oklch(0.62 0.15 42)",
    away: D.textDim,
  };

  const availabilityLabel = {
    available: "Available",
    busy: "Currently Busy",
    away: "Away",
  };

  const availabilityBg = {
    available: D.lowSoft,
    busy: "oklch(0.96 0.04 42)",
    away: D.bg,
  };

  // Generate initials for avatar
  const getInitials = (name: string) => {
    const parts = name.split(" ");
    if (parts.length >= 2) {
      return parts[0][0] + parts[parts.length - 1][0];
    }
    return name.substring(0, 2).toUpperCase();
  };

  // Generate placeholder avatar color based on name
  const getAvatarColor = (name: string) => {
    const colors = [
      "oklch(0.62 0.14 150)",
      "oklch(0.55 0.10 180)",
      "oklch(0.55 0.10 260)",
      "oklch(0.55 0.10 140)",
      "oklch(0.55 0.10 300)",
      "oklch(0.55 0.10 30)",
      "oklch(0.55 0.10 80)",
      "oklch(0.55 0.10 340)",
    ];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  };

  // Function to handle booking - opens the individual doctor's link
  const handleBookNow = () => {
    if (doctor.bookingUrl) {
      window.open(doctor.bookingUrl, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div style={{
      background: D.surface,
      borderRadius: 16,
      border: `1px solid ${D.border}`,
      padding: "1.5rem",
      boxShadow: D.shadow,
      transition: "all 0.2s ease",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      textAlign: "center",
      position: "relative",
      cursor: "pointer",
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.transform = "translateY(-4px)";
      e.currentTarget.style.boxShadow = D.shadowMd;
      e.currentTarget.style.borderColor = D.accent;
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.transform = "translateY(0)";
      e.currentTarget.style.boxShadow = D.shadow;
      e.currentTarget.style.borderColor = D.border;
    }}
    >
      {/* Availability Badge */}
      <div style={{
        position: "absolute",
        top: 12,
        right: 12,
        background: availabilityBg[doctor.availability],
        color: availabilityColor[doctor.availability],
        padding: "4px 10px",
        borderRadius: 20,
        fontSize: "0.65rem",
        fontWeight: 700,
        border: `1px solid ${availabilityColor[doctor.availability]}33`,
        display: "flex",
        alignItems: "center",
        gap: "4px",
      }}>
        {doctor.availability === "available" ? (
          <Icons.Check />
        ) : doctor.availability === "busy" ? (
          <Icons.Clock />
        ) : (
          <Icons.X />
        )}
        {availabilityLabel[doctor.availability]}
      </div>

      {/* Profile Avatar */}
      <div style={{
        width: 100,
        height: 100,
        borderRadius: "50%",
        background: getAvatarColor(doctor.name),
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        marginBottom: "0.75rem",
        flexShrink: 0,
        border: `3px solid ${D.accent}`,
        position: "relative",
      }}>
        <span style={{
          fontSize: "2.2rem",
          fontWeight: 700,
          color: "#fff",
          fontFamily: D.fontMono,
          letterSpacing: "0.02em",
        }}>
          {getInitials(doctor.name)}
        </span>
      </div>

      {/* Doctor Info */}
      <div style={{ marginBottom: "0.5rem", width: "100%" }}>
        <div style={{
          fontWeight: 700,
          fontSize: "1.05rem",
          color: D.text,
          marginBottom: "0.15rem",
          lineHeight: 1.2,
        }}>
          {doctor.name}
        </div>
        <div style={{
          fontSize: "0.7rem",
          fontWeight: 700,
          color: D.accent,
          textTransform: "uppercase",
          letterSpacing: "0.06em",
          marginBottom: "0.25rem",
        }}>
          {doctor.title}
        </div>
        <div style={{
          fontSize: "0.75rem",
          color: D.textMuted,
          marginBottom: "0.25rem",
        }}>
          {doctor.specialty}
        </div>
        <div style={{
          fontSize: "0.7rem",
          color: D.textDim,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "0.5rem",
        }}>
          <Icons.Location />
          <span>{doctor.location}</span>
        </div>
      </div>

      {/* Experience */}
      <div style={{
        fontSize: "0.7rem",
        color: D.textDim,
        marginBottom: "0.75rem",
        padding: "3px 10px",
        background: D.bg,
        borderRadius: 12,
        display: "flex",
        alignItems: "center",
        gap: "0.4rem",
      }}>
        <Icons.Briefcase />
        {doctor.experience} experience
      </div>

      {/* Book Now Button */}
      <button
        onClick={handleBookNow}
        style={{
          width: "100%",
          padding: "10px",
          background: doctor.availability === "available" ? D.accent : D.border,
          color: doctor.availability === "available" ? "#fff" : D.textMuted,
          border: "none",
          borderRadius: 8,
          fontWeight: 700,
          fontSize: "0.85rem",
          cursor: doctor.availability === "available" ? "pointer" : "not-allowed",
          transition: "all 0.2s ease",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "0.5rem",
        }}
        onMouseEnter={(e) => {
          if (doctor.availability === "available") {
            e.currentTarget.style.opacity = "0.9";
            e.currentTarget.style.transform = "scale(0.98)";
          }
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.opacity = "1";
          e.currentTarget.style.transform = "scale(1)";
        }}
        disabled={doctor.availability !== "available"}
      >
        {doctor.availability === "available" ? (
          <>
            <Icons.Calendar />
            Book Now
            <Icons.ArrowRight />
          </>
        ) : (
          "Unavailable"
        )}
      </button>
    </div>
  );
}

// ── Responsive Hook ────────────────────────────────────────────────────────
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

// ── Main Page Component ────────────────────────────────────────────────────
export default function DoctorsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const isMobile = useMediaQuery(`(max-width: ${D.breakpoints.mobile}px)`);

  // Authentication check - redirect if not logged in
  useEffect(() => {
    if (!isLoggedIn()) {
      router.replace("/login");
      return;
    }
    setLoading(false);
  }, [router]);

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div style={{ display: "flex", minHeight: "100vh" }}>
        <div style={{ 
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: D.textMuted,
          fontFamily: D.fontMono,
          fontSize: "0.85rem"
        }}>
          Loading...
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <div style={{
        flex: 1,
        overflow: "auto",
        maxWidth: D.breakpoints.desktop,
        margin: "0 auto",
        padding: "clamp(1rem, 4vw, 2rem)",
        width: "100%",
        background: D.bg,
      }}>
        {/* Header */}
        <div style={{
          marginBottom: "2rem",
        }}>
          <div style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            flexWrap: "wrap" as const,
            gap: "1rem",
            marginBottom: "0.5rem",
          }}>
            <div>
              <h1 style={{
                fontSize: "clamp(1.5rem, 5vw, 2.2rem)",
                fontWeight: 800,
                color: D.text,
                marginBottom: "0.25rem",
                letterSpacing: "-0.02em",
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
              }}>
                Find an Audiologist
              </h1>
              <p style={{
                fontSize: "clamp(0.85rem, 3vw, 1rem)",
                color: D.textMuted,
              }}>
                Connect with certified hearing specialists near you
              </p>
            </div>
          </div>
        </div>

        {/* Doctors Grid - 3x2 layout */}
        <div style={{
          display: "grid",
          gridTemplateColumns: isMobile 
            ? "1fr" 
            : "repeat(3, 1fr)",
          gap: "1.25rem",
        }}>
          {doctors.map((doctor) => (
            <DoctorCard key={doctor.id} doctor={doctor} />
          ))}
        </div>

        {/* Footer Note */}
        <div style={{
          marginTop: "2rem",
          padding: "1rem",
          background: D.accentSoft,
          borderRadius: 12,
          fontSize: "0.75rem",
          color: D.textMuted,
          textAlign: "center",
          border: `1px solid ${D.accent}33`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "0.5rem",
        }}>
          All audiologists are certified professionals. Book an appointment 
          for a comprehensive hearing assessment and personalized care plan.
        </div>
      </div>
    </div>
  );
}