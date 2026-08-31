"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Upload, Eye, FlaskConical, ScanSearch, ClipboardCheck, CheckCircle2,
  Camera, Image as ImageIcon, Info, AlertTriangle, X, ShieldCheck, ArrowRight,
  SwitchCamera,
} from "lucide-react";
import { saveResult, type IpeResult } from "../_lib/ipe-ui";

/* ── Palette (exact match to approved design) ───────────────────── */
const BLUE = "#1565C0";
const BLUE_DEEP = "#0D47A1";
const BLUE_TINT = "#E3EEF9";
const MINT = "#0D9488";
const MINT_TINT = "#E0F5F3";
const NAVY = "#0B1F38";
const BG = "#F4F8FD";
const BORDER = "rgba(21,101,192,0.10)";
const TEXT = "#0F2137";
const TEXT2 = "#4A6070";
const FONT = "'Inter', system-ui, sans-serif";
const SERIF = "'DM Serif Display', Georgia, serif";
const MONO = "'DM Mono', monospace";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

const LOAD_STEPS = [
  { icon: Eye, label: "Detecting tissue regions…" },
  { icon: FlaskConical, label: "Measuring biomarkers…" },
  { icon: ScanSearch, label: "Classifying pathology…" },
  { icon: ClipboardCheck, label: "Generating your report…" },
];

const TIPS = [
  { n: "1", title: "Good lighting", body: "Natural light or a bright room. Avoid shadows falling inside your mouth." },
  { n: "2", title: "Open wide", body: "Open as wide as comfortable so the affected area is fully visible." },
  { n: "3", title: "Hold steady, close", body: "15–20 cm away, hold perfectly still for a sharp, detailed capture." },
];

function GlassCard({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div
      style={{
        background: "#fff",
        borderRadius: 20,
        border: `1px solid ${BORDER}`,
        boxShadow: "0 2px 12px rgba(21,101,192,0.06), 0 1px 3px rgba(0,0,0,0.04)",
        padding: 22,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

export default function Component1UploadPage() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadStep, setLoadStep] = useState(0);
  const [drag, setDrag] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const galleryRef = useRef<HTMLInputElement>(null);

  // Live camera state
  const [showCamera, setShowCamera] = useState(false);
  const [facing, setFacing] = useState<"environment" | "user">("environment");
  const [cameraError, setCameraError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  function pick(f: File | null | undefined) {
    if (!f) return;
    if (!f.type.startsWith("image/")) {
      setError("Please choose a JPG or PNG image file.");
      return;
    }
    setError(null);
    setFile(f);
    setPreview(URL.createObjectURL(f));
  }

  function stopCamera() {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }

  async function openCamera() {
    setError(null);
    setCameraError(null);
    setShowCamera(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: facing }, audio: false });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
    } catch {
      setCameraError("Camera access was denied, or no camera is available on this device.");
    }
  }

  function closeCamera() {
    stopCamera();
    setShowCamera(false);
    setCameraError(null);
  }

  async function switchCamera() {
    const next = facing === "environment" ? "user" : "environment";
    setFacing(next);
    stopCamera();
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: next }, audio: false });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
    } catch {
      setCameraError("Could not switch camera.");
    }
  }

  function capturePhoto() {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || !video.videoWidth) return;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0);
    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        const f = new File([blob], "camera-capture.jpg", { type: "image/jpeg" });
        pick(f);
        closeCamera();
      },
      "image/jpeg",
      0.92
    );
  }

  useEffect(() => stopCamera, []);

  async function analyze() {
    if (!file) return;
    setLoading(true);
    setError(null);
    setLoadStep(0);

    const stepTimer = setInterval(() => {
      setLoadStep((s) => (s < LOAD_STEPS.length - 1 ? s + 1 : s));
    }, 700);

    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch(`${API}/predict`, { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Analysis failed. Please try again.");
      clearInterval(stepTimer);
      setLoadStep(LOAD_STEPS.length - 1);
      saveResult(data as IpeResult);
      router.push("/Component1/results");
    } catch (e) {
      clearInterval(stepTimer);
      setError(e instanceof Error ? e.message : "Could not reach the server.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ minHeight: "100vh", background: BG, fontFamily: FONT }}>
      <style>{`
        @keyframes spinAnim{to{transform:rotate(360deg)}}
        @keyframes stepFadeIn{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:translateY(0)}}
        @keyframes scanLine{0%{top:0%}100%{top:100%}}
        @keyframes pulseRing{0%,100%{transform:scale(1);opacity:0.3}50%{transform:scale(1.06);opacity:0.5}}
        ::-webkit-scrollbar{width:0;height:0}
        .upload-zone-hover:hover{background:#EAF3FF!important;border-color:${BLUE}!important;}
      `}</style>

      {/* Top bar */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 22px", background: "#fff", borderBottom: `1px solid ${BORDER}`, boxShadow: "0 1px 4px rgba(21,101,192,0.06)" }}>
        <button
          onClick={() => router.back()}
          style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 6, color: TEXT2, fontSize: 13, fontFamily: FONT, padding: "5px 10px", borderRadius: 9, transition: "background .15s" }}
          onMouseEnter={(e) => (e.currentTarget.style.background = BG)}
          onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
        >
          <ArrowRight size={14} style={{ transform: "rotate(180deg)" }} /> Back
        </button>
        <div style={{ flex: 1, textAlign: "center" }}>
          <span style={{ fontSize: 14, fontWeight: 600, color: NAVY }}>New Oral Scan</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: MINT, fontWeight: 600 }}>
          <ShieldCheck size={13} color={MINT} /> Secure
        </div>
      </div>

      <div style={{ maxWidth: 960, margin: "0 auto", padding: "32px 24px 56px" }}>
        {/* Header */}
        <div style={{ marginBottom: 32, textAlign: "center" }}>
          <p style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1.5, color: MINT, marginBottom: 8 }}>Step 1 of 2</p>
          <h1 style={{ fontSize: 28, fontWeight: 400, color: NAVY, margin: "0 0 10px", fontFamily: SERIF }}>Upload your photo</h1>
          <p style={{ fontSize: 14, color: TEXT2, margin: "0 auto", maxWidth: 440, lineHeight: 1.65 }}>
            Take or upload a clear photo of the affected oral area. Our AI checks pain indicators, tissue changes, and urgency.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2" style={{ display: "grid", gap: 28 }}>
          {/* LEFT: Upload zone */}
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {!preview && !loading ? (
              <div
                className="upload-zone-hover"
                onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
                onDragLeave={() => setDrag(false)}
                onDrop={(e) => { e.preventDefault(); setDrag(false); pick(e.dataTransfer.files?.[0]); }}
                onClick={() => galleryRef.current?.click()}
                style={{
                  borderRadius: 24, padding: "52px 28px 44px", textAlign: "center",
                  background: drag ? "#EAF3FF" : "#fff",
                  border: `2px dashed ${drag ? BLUE : "rgba(21,101,192,0.22)"}`,
                  transition: "all .2s", cursor: "pointer",
                  boxShadow: drag ? `0 0 0 4px ${BLUE}14` : "0 2px 12px rgba(21,101,192,0.05)",
                  position: "relative", overflow: "hidden",
                }}
              >
                <div style={{ position: "absolute", top: "30%", left: "50%", transform: "translate(-50%,-50%)", width: 180, height: 180, borderRadius: "50%", background: `radial-gradient(circle, ${BLUE}09, transparent 70%)`, pointerEvents: "none", animation: "pulseRing 3s ease-in-out infinite" }} />

                <div style={{ position: "relative" }}>
                  <div style={{ width: 76, height: 76, borderRadius: "50%", background: BLUE_TINT, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 18px", border: `1.5px solid ${BLUE}20` }}>
                    <Upload size={30} color={BLUE} strokeWidth={1.5} />
                  </div>
                  <div style={{ fontSize: 17, fontWeight: 600, color: NAVY, marginBottom: 6, fontFamily: SERIF }}>Drop your photo here</div>
                  <div style={{ fontSize: 13, color: TEXT2, marginBottom: 26, lineHeight: 1.6 }}>or click to browse · JPG or PNG up to 25 MB</div>

                  <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
                    <button
                      onClick={(e) => { e.stopPropagation(); galleryRef.current?.click(); }}
                      style={{ display: "flex", alignItems: "center", gap: 7, padding: "11px 22px", borderRadius: 999, background: `linear-gradient(135deg, ${BLUE}, ${BLUE_DEEP})`, border: "none", color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: FONT, boxShadow: `0 4px 16px ${BLUE}40`, transition: "transform .15s" }}
                      onMouseEnter={(e) => (e.currentTarget.style.transform = "translateY(-1px)")}
                      onMouseLeave={(e) => (e.currentTarget.style.transform = "")}
                    >
                      <ImageIcon size={15} /> From gallery
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); openCamera(); }}
                      style={{ display: "flex", alignItems: "center", gap: 7, padding: "11px 22px", borderRadius: 999, background: MINT_TINT, border: `1.5px solid ${MINT}33`, color: MINT, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: FONT, transition: "transform .15s" }}
                      onMouseEnter={(e) => (e.currentTarget.style.transform = "translateY(-1px)")}
                      onMouseLeave={(e) => (e.currentTarget.style.transform = "")}
                    >
                      <Camera size={15} /> Take photo
                    </button>
                  </div>
                </div>
              </div>
            ) : loading ? (
              /* Loading state */
              <div style={{ borderRadius: 24, overflow: "hidden", background: "#fff", border: `1px solid ${BORDER}`, boxShadow: "0 4px 24px rgba(21,101,192,0.08)" }}>
                {preview && (
                  <div style={{ position: "relative", height: 220, overflow: "hidden" }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={preview} alt="Scan" style={{ width: "100%", height: "100%", objectFit: "cover", filter: "brightness(0.6) blur(1px)" }} />
                    <div style={{ position: "absolute", left: 0, right: 0, height: 2, background: `linear-gradient(90deg, transparent, ${MINT}, transparent)`, animation: "scanLine 1.6s ease-in-out infinite", boxShadow: `0 0 12px ${MINT}` }} />
                    <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <div style={{ textAlign: "center" }}>
                        <div style={{ width: 52, height: 52, borderRadius: "50%", border: "3px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", animation: "spinAnim .8s linear infinite", margin: "0 auto 12px" }} />
                        <div style={{ fontSize: 13.5, fontWeight: 600, color: "#fff" }}>Scanning…</div>
                      </div>
                    </div>
                  </div>
                )}
                <div style={{ padding: "22px 24px" }}>
                  <div style={{ fontSize: 13.5, fontWeight: 700, color: NAVY, marginBottom: 18 }}>Analyzing your scan</div>
                  {LOAD_STEPS.map((step, i) => {
                    const StepIcon = step.icon;
                    const done = i < loadStep;
                    const active = i === loadStep;
                    return (
                      <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: i < LOAD_STEPS.length - 1 ? 14 : 0, opacity: i > loadStep ? 0.35 : 1, transition: "opacity .4s", animation: active ? "stepFadeIn .4s ease" : "none" }}>
                        <div style={{ width: 34, height: 34, borderRadius: 10, background: done ? `${MINT}18` : active ? BLUE_TINT : "#f5f7fa", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, border: `1.5px solid ${done ? MINT + "30" : active ? BLUE + "30" : "transparent"}`, transition: "all .3s" }}>
                          {done ? <CheckCircle2 size={16} color={MINT} /> : <StepIcon size={15} color={active ? BLUE : TEXT2} />}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 12.5, fontWeight: active ? 600 : 400, color: done ? MINT : active ? NAVY : TEXT2 }}>{step.label}</div>
                          {active && (
                            <div style={{ marginTop: 6, height: 3, borderRadius: 2, background: BLUE_TINT, overflow: "hidden" }}>
                              <div style={{ height: "100%", background: BLUE, borderRadius: 2, animation: "spinAnim 1s linear infinite", width: "40%", transformOrigin: "left" }} />
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              /* Preview state */
              <div style={{ borderRadius: 24, overflow: "hidden", background: "#fff", border: `2px solid ${MINT}30`, boxShadow: "0 4px 24px rgba(13,148,136,0.10)" }}>
                <div style={{ position: "relative" }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={preview!} alt="Selected scan" style={{ width: "100%", height: 260, objectFit: "cover", display: "block" }} />
                  <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, transparent 50%, rgba(11,31,56,0.5))" }} />
                  <button
                    onClick={() => { setFile(null); setPreview(null); }}
                    style={{ position: "absolute", top: 12, right: 12, width: 32, height: 32, borderRadius: "50%", background: "rgba(0,0,0,0.5)", backdropFilter: "blur(6px)", border: "1px solid rgba(255,255,255,0.2)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
                  >
                    <X size={15} color="#fff" />
                  </button>
                  <div style={{ position: "absolute", bottom: 14, left: 14, right: 14, display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(13,148,136,0.25)", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, border: "1px solid rgba(13,148,136,0.3)" }}>
                      <CheckCircle2 size={18} color="#fff" />
                    </div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: "#fff" }}>{file?.name}</div>
                      <div style={{ fontSize: 11, color: "rgba(255,255,255,0.7)" }}>Ready for analysis</div>
                    </div>
                    <button
                      onClick={() => galleryRef.current?.click()}
                      style={{ marginLeft: "auto", background: "rgba(255,255,255,0.15)", backdropFilter: "blur(6px)", border: "1px solid rgba(255,255,255,0.25)", borderRadius: 8, padding: "6px 14px", fontSize: 11.5, fontWeight: 600, color: "#fff", cursor: "pointer", fontFamily: FONT }}
                    >
                      Change
                    </button>
                  </div>
                </div>
                <div style={{ padding: "16px 18px 14px" }}>
                  <div style={{ display: "flex", gap: 10, fontSize: 11, color: TEXT2 }}>
                    <span>✓ Image loaded</span>
                    <span>✓ Format valid</span>
                    <span>✓ Ready to analyze</span>
                  </div>
                </div>
              </div>
            )}

            <input ref={galleryRef} type="file" accept="image/*" style={{ display: "none" }} onChange={(e) => pick(e.target.files?.[0])} />

            {error && (
              <div style={{ padding: "12px 16px", borderRadius: 14, background: "#FDEDEB", color: "#E8483A", fontSize: 13, fontWeight: 600, display: "flex", alignItems: "center", gap: 8 }}>
                <AlertTriangle size={15} /> {error}
              </div>
            )}

            {!loading && (
              <button
                onClick={preview ? analyze : () => galleryRef.current?.click()}
                disabled={loading}
                style={{ width: "100%", padding: "16px", border: "none", borderRadius: 999, fontSize: 15, fontWeight: 700, color: "#fff", fontFamily: FONT, background: `linear-gradient(135deg, ${BLUE}, ${BLUE_DEEP})`, cursor: "pointer", boxShadow: `0 8px 28px ${BLUE}40`, transition: "all .2s" }}
                onMouseEnter={(e) => (e.currentTarget.style.transform = "translateY(-1px)")}
                onMouseLeave={(e) => (e.currentTarget.style.transform = "")}
              >
                {preview ? "Analyze photo →" : "Choose a photo →"}
              </button>
            )}

            {/* Trust badges */}
            <div style={{ display: "flex", gap: 7, flexWrap: "wrap", justifyContent: "center" }}>
              {[["🔒", "Encrypted"], ["🦷", "Dental AI reviewed"], ["🛡️", "HIPAA-safe"]].map(([icon, label]) => (
                <span key={label} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 10.5, color: TEXT2, background: "#fff", border: `1px solid ${BORDER}`, borderRadius: 20, padding: "4px 12px" }}>
                  {icon} {label}
                </span>
              ))}
            </div>
          </div>

          {/* RIGHT: Tips + Privacy + Stats */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <GlassCard style={{ padding: "22px 24px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 18 }}>
                <div style={{ width: 32, height: 32, borderRadius: 9, background: BLUE_TINT, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <Info size={15} color={BLUE} />
                </div>
                <span style={{ fontSize: 13.5, fontWeight: 600, color: NAVY }}>Tips for a better result</span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                {TIPS.map((tip) => (
                  <div key={tip.n} style={{ display: "flex", gap: 13 }}>
                    <div style={{ width: 28, height: 28, borderRadius: "50%", background: `linear-gradient(135deg, ${BLUE}, ${MINT})`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 1 }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: "#fff", fontFamily: MONO }}>{tip.n}</span>
                    </div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: TEXT, marginBottom: 3 }}>{tip.title}</div>
                      <div style={{ fontSize: 12, color: TEXT2, lineHeight: 1.6 }}>{tip.body}</div>
                    </div>
                  </div>
                ))}
              </div>
            </GlassCard>

            <div style={{ borderRadius: 20, border: `1px solid ${MINT}22`, padding: "20px 22px", background: `linear-gradient(135deg, ${MINT_TINT}, #F0FAF9)` }}>
              <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 10 }}>
                <ShieldCheck size={18} color={MINT} />
                <span style={{ fontSize: 13.5, fontWeight: 600, color: NAVY }}>Your photo stays private</span>
              </div>
              <p style={{ fontSize: 12.5, color: TEXT2, lineHeight: 1.65, margin: 0 }}>
                Images are encrypted in transit and processed ephemerally — never stored after analysis. Only you and your care team can access your results.
              </p>
            </div>

            <div style={{ borderRadius: 20, padding: "22px 24px", background: `linear-gradient(135deg, ${NAVY}, #0D2B4E)` }}>
              <div style={{ fontSize: 10.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1.2, color: "rgba(255,255,255,0.35)", marginBottom: 18 }}>AI Model Performance</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
                {[["2,469+", "Training images"], ["4", "Diagnostic classes"], ["< 5s", "Analysis time"]].map(([n, l]) => (
                  <div key={l} style={{ textAlign: "center" }}>
                    <div style={{ fontSize: 20, fontWeight: 700, color: "#fff", fontFamily: MONO, lineHeight: 1, marginBottom: 4 }}>{n}</div>
                    <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", lineHeight: 1.4 }}>{l}</div>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: 18, paddingTop: 16, borderTop: "1px solid rgba(255,255,255,0.08)" }}>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", lineHeight: 1.6 }}>
                  Results are for informational purposes only and do not replace clinical examination by a qualified healthcare provider.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Live camera modal */}
      {showCamera && (
        <div style={{ position: "fixed", inset: 0, zIndex: 100, background: "rgba(11,31,56,0.92)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div style={{ width: "100%", maxWidth: 520, borderRadius: 24, overflow: "hidden", background: NAVY }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 18px" }}>
              <span style={{ fontSize: 13.5, fontWeight: 600, color: "#fff" }}>Take a photo</span>
              <button onClick={closeCamera} style={{ width: 32, height: 32, borderRadius: "50%", background: "rgba(255,255,255,0.1)", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <X size={16} color="#fff" />
              </button>
            </div>

            <div style={{ position: "relative", aspectRatio: "4 / 3", background: "#000" }}>
              {cameraError ? (
                <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12, padding: 24, textAlign: "center" }}>
                  <AlertTriangle size={26} color="rgba(255,255,255,0.7)" />
                  <p style={{ fontSize: 13, color: "rgba(255,255,255,0.8)", margin: 0 }}>{cameraError}</p>
                  <button onClick={openCamera} style={{ padding: "8px 18px", borderRadius: 999, background: "rgba(255,255,255,0.12)", border: "none", color: "#fff", fontSize: 12.5, fontWeight: 600, cursor: "pointer" }}>
                    Try again
                  </button>
                </div>
              ) : (
                <>
                  <video ref={videoRef} autoPlay playsInline muted style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  <button
                    onClick={switchCamera}
                    aria-label="Switch camera"
                    style={{ position: "absolute", top: 12, right: 12, width: 36, height: 36, borderRadius: "50%", background: "rgba(0,0,0,0.4)", backdropFilter: "blur(6px)", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
                  >
                    <SwitchCamera size={16} color="#fff" />
                  </button>
                  <div style={{ position: "absolute", left: 0, right: 0, bottom: 18, display: "flex", justifyContent: "center" }}>
                    <button
                      onClick={capturePhoto}
                      aria-label="Capture"
                      style={{ width: 60, height: 60, borderRadius: "50%", border: "3px solid #fff", background: "rgba(255,255,255,0.2)", backdropFilter: "blur(4px)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
                    >
                      <div style={{ width: 44, height: 44, borderRadius: "50%", background: "#fff" }} />
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
          <canvas ref={canvasRef} style={{ display: "none" }} />
        </div>
      )}
    </div>
  );
}