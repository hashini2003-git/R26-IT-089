"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function VocalTherapyPage() {
  const router = useRouter();
  
  useEffect(() => {
    router.replace("/vocal_therapy/guide");
  }, [router]);
  
  return (
    <div style={{ textAlign: "center", padding: "2rem", color: "#4A6070" }}>
      Redirecting to guide...
    </div>
  );
}
