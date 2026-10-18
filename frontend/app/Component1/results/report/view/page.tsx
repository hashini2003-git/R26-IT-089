"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { C, FONT, Icon } from "../../../_lib/ipe-ui";

export default function ReportViewer() {
  const router = useRouter();
  const [dataUrl, setDataUrl] = useState<string | null>(null);
  const [missing, setMissing] = useState(false);

  useEffect(() => {
    const b64 = typeof window !== "undefined" ? sessionStorage.getItem("ipe_report_pdf_base64") : null;
    if (!b64) { setMissing(true); return; }
    setDataUrl(`data:application/pdf;base64,${b64}`);
  }, []);

  function downloadCopy() {
    if (!dataUrl) return;
    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = `IPE_Report_${new Date().toISOString().slice(0, 10)}.pdf`;
    a.click();
  }

  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column", background: "#2A2A2A", fontFamily: FONT }}>
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "10px 16px", background: "#1C1C1C", flexShrink: 0,
      }}>
        <button
          onClick={() => router.back()}
          style={{
            display: "flex", alignItems: "center", gap: 6, background: "transparent",
            border: "none", color: "#fff", fontSize: 13.5, fontWeight: 600, cursor: "pointer",
          }}
        >
          <span style={{ display: "inline-flex", transform: "rotate(180deg)" }}>
            <Icon name="chevron-right" size={16} color="#fff" strokeWidth={2} />
          </span>
          Back
        </button>
        <span style={{ color: "#fff", fontSize: 13.5, fontWeight: 700 }}>IPE Clinical Report</span>
        {dataUrl ? (
          <button
            onClick={downloadCopy}
            style={{
              display: "flex", alignItems: "center", gap: 6, color: C.teal, background: "transparent",
              border: "none", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: FONT,
            }}
          >
            <Icon name="document" size={15} color={C.teal} strokeWidth={2} />
            Save a copy
          </button>
        ) : <span style={{ width: 60 }} />}
      </div>

      {dataUrl ? (
        <iframe
          src={dataUrl}
          title="IPE Clinical Report"
          style={{ flex: 1, border: "none", width: "100%" }}
        />
      ) : missing ? (
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", textAlign: "center", padding: 24 }}>
          No report found in this session — go back and click &quot;Open PDF report&quot; again.
        </div>
      ) : (
        <div style={{ flex: 1, background: "#2A2A2A" }} />
      )}
    </div>
  );
}