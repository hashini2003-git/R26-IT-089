"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Header from "./Header";
import {
  clearAuth,
  getPatient,
  isLoggedIn,
  subscribeToAuthChanges,
} from "../lib/auth";

type HeaderUser = {
  name: string;
  patientId: string;
};

/**
 * Adds the current shared navigation to routes that do not own a header.
 * Landing, dashboard, risk-monitor, lesion-analysis, and vocal-therapy
 * screens already render their own navigation or full-screen shell.
 */
export default function NavBar() {
  const pathname = usePathname();
  const [ready, setReady] = useState(false);
  const [user, setUser] = useState<HeaderUser | null>(null);

  useEffect(() => {
    const updateAuth = () => {
      const patient = isLoggedIn() ? getPatient() : null;
      setUser(
        patient
          ? { name: patient.name, patientId: patient.patient_id }
          : null,
      );
      setReady(true);
    };

    const timer = window.setTimeout(updateAuth, 0);
    const unsubscribe = subscribeToAuthChanges(updateAuth);

    return () => {
      window.clearTimeout(timer);
      unsubscribe();
    };
  }, []);

  const routeOwnsHeader =
    pathname === "/" ||
    pathname === "/login" ||
    pathname === "/register" ||
    pathname === "/home" ||
    pathname?.startsWith("/Component1") ||
    pathname?.startsWith("/component2") ||
    pathname?.startsWith("/vocal_therapy");

  if (routeOwnsHeader) return null;

  return (
    <>
      {ready && (
        <Header
          variant="light"
          user={user}
          onLogout={clearAuth}
        />
      )}
      <div aria-hidden="true" style={{ height: 60, flexShrink: 0 }} />
    </>
  );
}
