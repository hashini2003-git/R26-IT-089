"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function VocalTherapyPage() {
  const router = useRouter();
  
  useEffect(() => {
    router.replace("/vocal_therapy/dashboard");
  }, [router]);
  
  return (
    <div style={{ textAlign: "center", padding: "2rem", color: "oklch(0.48 0.018 250)" }}>
      Redirecting to dashboard...
    </div>
  );
}