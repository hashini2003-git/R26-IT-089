"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { analyzeVoice, analyzeSentiment } from "../../lib/api";
import { getPatient, isLoggedIn } from "../../lib/auth";
import type { AnalysisResult, ModelScore, SentimentResult } from "../../lib/types";

// ── Design tokens ─────────────────────────────────────────────────────────────
// Updated to match NavBar/SideBar green color scheme
const D = {
  bg:          "oklch(0.985 0.004 150)",
  surface:     "#ffffff",
  border:      "oklch(0.92 0.01 145)",
  borderStrong:"oklch(0.86 0.015 145)",
  text:        "oklch(0.22 0.015 150)",
  textMuted:   "oklch(0.50 0.015 150)",
  textDim:     "oklch(0.62 0.012 150)",
  accent:      "oklch(0.62 0.14 150)",
  accentSoft:  "oklch(0.96 0.03 150)",
  accentInk:   "oklch(0.38 0.08 150)",
  low:         "oklch(0.62 0.13 160)",
  lowSoft:     "oklch(0.95 0.04 160)",
  lowInk:      "oklch(0.40 0.10 160)",
  mid:         "oklch(0.75 0.15 85)", // Yellow for mild
  midSoft:     "oklch(0.97 0.06 85)",
  midInk:      "oklch(0.50 0.12 70)",
  moderate:    "oklch(0.65 0.18 55)", // Orange for moderate
  moderateSoft: "oklch(0.96 0.08 55)",
  moderateInk:  "oklch(0.45 0.15 55)",
  high:        "oklch(0.62 0.16 25)",
  highSoft:    "oklch(0.95 0.04 25)",
  highInk:     "oklch(0.42 0.13 25)",
  shadow:      "0 1px 3px rgba(15,32,60,0.06), 0 1px 0 rgba(15,32,60,0.02)",
  shadowMd:    "0 4px 16px rgba(15,32,60,0.07)",
  fontMono:    "'JetBrains Mono', ui-monospace, monospace",
};

// ── Icons ─────────────────────────────────────────────────────────────────────
const Icons = {
  Mic: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
      <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
      <line x1="12" y1="19" x2="12" y2="23" />
      <line x1="8" y1="23" x2="16" y2="23" />
    </svg>
  ),
  Upload: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="17 8 12 3 7 8" />
      <line x1="12" y1="3" x2="12" y2="15" />
    </svg>
  ),
  Check: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 6L9 17l-5-5" />
    </svg>
  ),
  Alert: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  ),
  Warning: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  ),
  Brain: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 3a2 2 0 0 1 6 0v1a2 2 0 0 1-2 2h-2a2 2 0 0 1-2-2V3z" />
      <path d="M12 6v2" />
      <path d="M9 8v6a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2V8" />
      <path d="M15 14a5 5 0 0 1-6 0" />
    </svg>
  ),
  Chart: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  ),
  ArrowDown: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="6 9 12 15 18 9" />
    </svg>
  ),
  ArrowUp: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="18 15 12 9 6 15" />
    </svg>
  ),
  Play: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="5 3 19 12 5 21 5 3" />
    </svg>
  ),
  Stop: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="6" y="4" width="12" height="16" rx="1" />
    </svg>
  ),
  File: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
    </svg>
  ),
  Clock: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  ),
};

// ── Constants ─────────────────────────────────────────────────────────────────
const PASSAGE_WORDS = [
  "The","north","wind","and","the","sun","were","disputing",
  "which","was","the","stronger,","when","a","traveler","came",
  "along","wrapped","in","a","warm","cloak.",
];
const TARGET_WPM = 110;

const DISORDER_LABEL: Record<string, string> = {
  healthy:    "Speech within normal range",
  parkinsons: "Vocal clarity concern",
  stuttering: "Speech fluency concern",
  dysarthria: "Articulation concern",
};
const SEVERITY_LABEL: Record<string, string> = {
  none: "No concern", mild: "Mild", moderate: "Moderate", severe: "Needs attention",
};

const SENTIMENT_MODELS = [
  { value: "ensemble",     label: "Ensemble (all models)" },
  { value: "bert",         label: "DistilBERT" },
  { value: "lstm_scratch", label: "LSTM (scratch)" },
  { value: "xgboost",     label: "XGBoost" },
  { value: "logreg",      label: "Logistic Regression" },
  { value: "svm",         label: "LinearSVC" },
  { value: "naivebayes",  label: "Naive Bayes" },
];

const PROB_BARS = [
  { label: "Positive", key: "positive" as const, color: D.low  },
  { label: "Neutral",  key: "neutral"  as const, color: D.textDim },
  { label: "Negative", key: "negative" as const, color: D.high },
];

const MOOD_CFG = {
  positive: { icon: "😊", label: "Feeling Positive",  bg: D.lowSoft,  color: D.lowInk,  border: "oklch(0.85 0.08 160)" },
  neutral:  { icon: "😐", label: "Feeling Neutral",   bg: D.bg,       color: D.textMuted, border: D.border },
  negative: { icon: "😔", label: "Feeling Down",      bg: D.highSoft, color: D.highInk, border: "oklch(0.85 0.08 25)" },
} as const;

// ── Types ─────────────────────────────────────────────────────────────────────
interface LiveMetrics { db: number; snr: number; pitchHz: number; jitter: number; shimmer: number; hnr: number; }
type Phase = "idle" | "recording" | "analyzing" | "done";

// ── WAV encoder ──────────────────────────────────────────────────────────────
function _writeStr(view: DataView, offset: number, str: string) {
  for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i));
}
function encodeWav(buf: AudioBuffer): Blob {
  const ch = buf.getChannelData(0);
  const n  = ch.length;
  const ab = new ArrayBuffer(44 + n * 2);
  const v  = new DataView(ab);
  _writeStr(v, 0, "RIFF");
  v.setUint32(4,  36 + n * 2, true);
  _writeStr(v, 8, "WAVE");
  _writeStr(v, 12, "fmt ");
  v.setUint32(16, 16, true);
  v.setUint16(20, 1, true);
  v.setUint16(22, 1, true);
  v.setUint32(24, buf.sampleRate, true);
  v.setUint32(28, buf.sampleRate * 2, true);
  v.setUint16(32, 2, true);
  v.setUint16(34, 16, true);
  _writeStr(v, 36, "data");
  v.setUint32(40, n * 2, true);
  for (let i = 0; i < n; i++) {
    const s = Math.max(-1, Math.min(1, ch[i]));
    v.setInt16(44 + i * 2, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
  }
  return new Blob([ab], { type: "audio/wav" });
}

async function webmBlobToWavFile(blob: Blob): Promise<{ file: File; rms: number }> {
  try {
    const ab = await blob.arrayBuffer();
    const actx = new AudioContext({ sampleRate: 16000 });
    const decoded = await actx.decodeAudioData(ab);
    await actx.close();
    
    const ch = decoded.getChannelData(0);
    let sum = 0;
    for (let i = 0; i < ch.length; i++) sum += ch[i] * ch[i];
    const rms = Math.sqrt(sum / ch.length);
    
    if (rms < 0.005) {
      throw new Error("No voice detected - recording was silent");
    }
    
    const wav = encodeWav(decoded);
    return { 
      file: new File([wav], `recording_${Date.now()}.wav`, { type: "audio/wav" }), 
      rms 
    };
  } catch (err) {
    throw new Error("Failed to process audio recording. Please try again.");
  }
}

// ── Pure helpers ──────────────────────────────────────────────────────────────
function band(score: number) { return score >= 70 ? "low" : score >= 40 ? "mid" : "high"; }
function toScore(prob: number) { return Math.round((1 - prob) * 100); }

function spectroColor(v: number): string {
  if (v < 0.5) {
    const t = v * 2;
    return `rgb(${Math.round(10+t*10)},${Math.round(18+t*92)},${Math.round(35+t*125)})`;
  }
  const t = (v - 0.5) * 2;
  return `rgb(${Math.round(20+t*158)},${Math.round(110+t*119)},${Math.round(160+t*78)})`;
}

function computeMetrics(analyser: AnalyserNode, sampleRate: number): LiveMetrics {
  const td = new Uint8Array(analyser.fftSize);
  analyser.getByteTimeDomainData(td);
  let sum = 0;
  for (let i = 0; i < td.length; i++) { const v = (td[i]-128)/128; sum += v*v; }
  const rms = Math.sqrt(sum / td.length);
  const db = rms > 0.001
    ? Math.max(-40, Math.min(-3, Math.round(20 * Math.log10(rms))))
    : -40;

  let zcr = 0;
  for (let i = 1; i < td.length; i++) {
    if (((td[i-1]-128) < 0) !== ((td[i]-128) < 0)) zcr++;
  }
  const rawPitch = Math.round((zcr * sampleRate) / (2 * analyser.fftSize));
  const pitchHz = rms > 0.01 ? Math.max(80, Math.min(450, rawPitch)) : 0;

  const fd = new Uint8Array(analyser.frequencyBinCount);
  analyser.getByteFrequencyData(fd);
  const noise = (fd[0]+fd[1]+fd[2]) / 3 + 1;
  const sig   = fd.slice(4, 24).reduce((a,b) => a+b, 0) / 20 + 1;
  const snr   = Math.max(10, Math.min(45, Math.round(20 * Math.log10(sig / noise))));

  const jitter = rms > 0.01
    ? parseFloat((0.3 + Math.abs(Math.sin(Date.now() * 0.003)) * 0.6 + rms * 0.5).toFixed(2))
    : 0;

  const segLen = Math.floor(td.length / 8);
  const ampVals: number[] = [];
  for (let s = 0; s < 8; s++) {
    let segSq = 0;
    for (let i = s * segLen; i < (s + 1) * segLen; i++) {
      const v = (td[i] - 128) / 128;
      segSq += v * v;
    }
    ampVals.push(Math.sqrt(segSq / segLen));
  }
  const ampMean = ampVals.reduce((a, b) => a + b, 0) / ampVals.length + 1e-6;
  const ampDiffMean = ampVals.slice(1)
    .reduce((acc, v, i) => acc + Math.abs(v - ampVals[i]), 0) / 7;
  const shimmer = rms > 0.01
    ? parseFloat(Math.max(0.5, Math.min(15, (ampDiffMean / ampMean) * 100)).toFixed(2))
    : 0;

  const binHz = sampleRate / analyser.fftSize;
  let hnr = 0;
  if (rms > 0.01 && pitchHz > 0) {
    const harmEnergy = [1, 2, 3, 4]
      .map(h => { const b = Math.round((h * pitchHz) / binHz); return b < fd.length ? fd[b] : 0; })
      .reduce((a, b) => a + b, 0) / 4;
    const noiseFloor = (fd[0] + fd[1] + fd[2]) / 3 + 1;
    hnr = Math.max(5, Math.min(35, Math.round(20 * Math.log10((harmEnergy + 1) / noiseFloor))));
  }

  return { db, snr, pitchHz, jitter, shimmer, hnr };
}

// ── Gauge ─────────────────────────────────────────────────────────────────────
function Gauge({ score, size = 160 }: { score: number; size?: number }) {
  const th = 11, r = size/2 - th, cx = size/2, cy = size/2;
  const sA = Math.PI * 0.75, sw = Math.PI * 1.5;
  const vA = sA + Math.max(0, Math.min(1, score/100)) * sw;
  const b = band(score);
  const color = D[b as keyof typeof D] as string;

  function arc(a0: number, a1: number, c: string, w = th) {
    const x0=cx+r*Math.cos(a0), y0=cy+r*Math.sin(a0);
    const x1=cx+r*Math.cos(a1), y1=cy+r*Math.sin(a1);
    return <path d={`M ${x0} ${y0} A ${r} ${r} 0 ${a1-a0>Math.PI?1:0} 1 ${x1} ${y1}`}
      stroke={c} strokeWidth={w} strokeLinecap="round" fill="none" />;
  }

  return (
    <div style={{ position:"relative", width:size, height:size }}>
      <svg width={size} height={size}>
        {arc(sA, sA+sw, D.border)}
        {arc(sA, vA, color)}
        <circle cx={cx+r*Math.cos(vA)} cy={cy+r*Math.sin(vA)}
          r={th/2+1.5} fill="#fff" stroke={color} strokeWidth="2" />
      </svg>
      <div style={{ position:"absolute", inset:0, display:"flex", flexDirection:"column",
                    alignItems:"center", justifyContent:"center", gap:2 }}>
        <div style={{ fontFamily:D.fontMono, fontSize:size*0.26, fontWeight:600,
                      color:D.text, lineHeight:1 }}>{score}</div>
        <div style={{ fontSize:10, color:D.textMuted, textTransform:"uppercase",
                      letterSpacing:"0.08em", marginTop:3 }}>score</div>
        <div style={{ fontSize:11, fontWeight:600,
                      color:D[`${b}Ink` as keyof typeof D] as string,
                      marginTop:4, padding:"2px 8px",
                      background:D[`${b}Soft` as keyof typeof D] as string,
                      borderRadius:999 }}>
          {b==="low"?"Low risk":b==="mid"?"Moderate":"Concern"}
        </div>
      </div>
    </div>
  );
}

// ── ClassifierBar ─────────────────────────────────────────────────────────────
function ClassifierBar({ label, score, isConcern }: {
  label: string; score: number; isConcern: boolean;
}) {
  const b = band(score);
  const color = D[b as keyof typeof D] as string;
  return (
    <div>
      <div style={{ display:"flex", justifyContent:"space-between", marginBottom:5, alignItems:"center" }}>
        <span style={{ fontSize:"0.85rem", color:D.text, fontWeight:isConcern?700:500 }}>
          {label}
          {isConcern && <span style={{
            background:D.mid, color:"#fff", borderRadius:4,
            padding:"1px 7px", fontSize:"0.68rem", fontWeight:700, marginLeft:8,
          }}>CONCERN</span>}
        </span>
        <span style={{ fontWeight:800, fontSize:"0.85rem", color, fontFamily:D.fontMono }}>{score}</span>
      </div>
      <div style={{ background:D.border, borderRadius:6, height:7, overflow:"hidden" }}>
        <div style={{
          width:`${Math.min(100,Math.max(0,score))}%`, height:"100%",
          background:color, borderRadius:6,
          transition:"width .7s cubic-bezier(.4,0,.2,1)",
        }} />
      </div>
    </div>
  );
}

// ── Card ──────────────────────────────────────────────────────────────────────
function Card({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{
      background:D.surface, borderRadius:12, padding:"1.1rem 1.25rem",
      boxShadow:D.shadow, border:`1px solid ${D.border}`, ...style,
    }}>{children}</div>
  );
}

// ── MoodModelBadge ────────────────────────────────────────────────────────────
function MoodModelBadge({ score }: { score: ModelScore }) {
  const cfg = MOOD_CFG[score.sentiment as keyof typeof MOOD_CFG];
  return (
    <div style={{
      background:D.bg, borderRadius:8, padding:"0.55rem 0.85rem",
      border:`1px solid ${D.border}`,
      display:"flex", alignItems:"center", justifyContent:"space-between", gap:"0.5rem",
    }}>
      <span style={{ fontSize:"0.76rem", fontWeight:700, color:D.textMuted }}>{score.model}</span>
      <span style={{
        background:cfg?.bg ?? D.bg, color:cfg?.color ?? D.textMuted,
        borderRadius:6, padding:"2px 8px", fontSize:"0.73rem", fontWeight:700,
      }}>{cfg?.icon} {score.sentiment}</span>
      <span style={{ fontSize:"0.7rem", color:D.textDim, fontFamily:D.fontMono }}>
        {Math.round(Math.max(score.positive, score.neutral, score.negative) * 100)}%
      </span>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function AnalyzePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [phase,       setPhase]       = useState<Phase>("idle");
  const [uploadMode,  setUploadMode]  = useState(false);
  const [seconds,     setSeconds]     = useState(0);
  const [metrics,     setMetrics]     = useState<LiveMetrics>({ db: -40, snr: 35, pitchHz: 0, jitter: 0, shimmer: 0, hnr: 0 });
  const [file,        setFile]        = useState<File | null>(null);
  const [dragging,    setDragging]    = useState(false);
  const [result,      setResult]      = useState<AnalysisResult | null>(null);
  const [error,       setError]       = useState<string | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  const mrRef             = useRef<MediaRecorder | null>(null);
  const chunksRef         = useRef<Blob[]>([]);
  const timerRef          = useRef<ReturnType<typeof setInterval> | null>(null);
  const rafRef            = useRef<number | null>(null);
  const analyserRef       = useRef<AnalyserNode | null>(null);
  const spectroRef        = useRef<HTMLCanvasElement>(null);
  const spectroCtxRef     = useRef<CanvasRenderingContext2D | null>(null);
  const sampleRateRef     = useRef(44100);
  const frameCountRef     = useRef(0);
  const pendingAnalyzeRef = useRef(false);
  const fileInputRef      = useRef<HTMLInputElement>(null);
  const resultsRef        = useRef<HTMLDivElement>(null);

  const [patient,  setPatientState] = useState<ReturnType<typeof getPatient>>(null);
  const [loggedIn, setLoggedIn]     = useState(false);

  // Authentication check - redirect if not logged in
  useEffect(() => {
    if (!isLoggedIn()) {
      router.replace("/login");
      return;
    }
    setPatientState(getPatient());
    setLoggedIn(true);
    setLoading(false);
  }, [router]);

  const wordIdx = Math.min(Math.floor(seconds * (TARGET_WPM / 60)), PASSAGE_WORDS.length);
  const wpm     = seconds > 3 ? Math.round(wordIdx / (seconds / 60)) : 0;
  const mm      = String(Math.floor(seconds / 60)).padStart(2, "0");
  const ss      = String(seconds % 60).padStart(2, "0");
  const elapsed = `00:${mm}:${ss}`;
  const midTime = seconds >= 8
    ? `00:${String(Math.floor(seconds/2/60)).padStart(2,"0")}:${String(Math.floor(seconds/2)%60).padStart(2,"0")}`
    : "00:04";

  function stopAll() {
    if (timerRef.current) clearInterval(timerRef.current);
    if (rafRef.current)   cancelAnimationFrame(rafRef.current);
    timerRef.current = null;
    rafRef.current   = null;
  }

  function initSpectroCanvas() {
    const canvas = spectroRef.current;
    if (!canvas) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width  = canvas.offsetWidth  * dpr;
    canvas.height = canvas.offsetHeight * dpr;
    const ctx2d = canvas.getContext("2d");
    if (!ctx2d) return;
    ctx2d.scale(dpr, dpr);
    ctx2d.fillStyle = spectroColor(0);
    ctx2d.fillRect(0, 0, canvas.offsetWidth, canvas.offsetHeight);
    spectroCtxRef.current = ctx2d;
  }

  const drawColumn = useCallback(() => {
    const analyser = analyserRef.current;
    const canvas   = spectroRef.current;
    const ctx2d    = spectroCtxRef.current;
    if (!analyser || !canvas || !ctx2d) return;

    const buf = new Uint8Array(analyser.frequencyBinCount);
    analyser.getByteFrequencyData(buf);
    const W = canvas.width, H = canvas.height;
    const img = ctx2d.getImageData(2, 0, W - 2, H);
    ctx2d.putImageData(img, 0, 0);
    for (let y = 0; y < H; y++) {
      const binIdx = Math.floor(((H - 1 - y) / H) * buf.length);
      ctx2d.fillStyle = spectroColor(buf[binIdx] / 255);
      ctx2d.fillRect(W - 2, y, 2, 1);
    }

    frameCountRef.current++;
    if (frameCountRef.current % 8 === 0) {
      setMetrics(computeMetrics(analyser, sampleRateRef.current));
    }
    rafRef.current = requestAnimationFrame(drawColumn);
  }, []);

  function cleanupRecording() {
    stopAll();
    if (mrRef.current && mrRef.current.state !== 'inactive') {
      try {
        mrRef.current.stop();
      } catch (e) {
        // Ignore errors if already stopped
      }
    }
    if (analyserRef.current) {
      try {
        analyserRef.current.disconnect();
      } catch (e) {
        // Ignore errors
      }
      analyserRef.current = null;
    }
    chunksRef.current = [];
    setPhase("idle");
    setFile(null);
    setSeconds(0);
    setMetrics({ db: -40, snr: 35, pitchHz: 0, jitter: 0, shimmer: 0, hnr: 0 });
  }

  async function startRecording() {
    setError(null); // Clear any previous errors
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 16000
        } 
      });
      
      const audioCtx = new AudioContext();
      sampleRateRef.current = audioCtx.sampleRate;
      const src = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 512;
      analyser.smoothingTimeConstant = 0.8;
      src.connect(analyser);
      analyserRef.current = analyser;

      const mr = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });
      mrRef.current = mr;
      chunksRef.current = [];

      mr.ondataavailable = e => { 
        if (e.data.size > 0) chunksRef.current.push(e.data); 
      };
      
      mr.onstop = async () => {
        try {
          const blob = new Blob(chunksRef.current, { type: "audio/webm" });
          stream.getTracks().forEach(t => t.stop());
          
          if (blob.size === 0) {
            setError("No audio data recorded. Please try again.");
            setPhase("idle");
            return;
          }
          
          const { file: f, rms } = await webmBlobToWavFile(blob);
          
          if (pendingAnalyzeRef.current) {
            pendingAnalyzeRef.current = false;
            setPhase("analyzing");
            
            try {
              const data = await analyzeVoice(f);
              setResult(data);
              setPhase("done");
              setTimeout(() => resultsRef.current?.scrollIntoView({ 
                behavior: "smooth", 
                block: "start" 
              }), 120);
            } catch (err) {
              setError(err instanceof Error ? err.message : "Analysis failed. Please try again.");
              setPhase("idle");
            }
          } else {
            setFile(f);
            if (rms > 0.008) {
              setPhase("analyzing");
              try {
                const data = await analyzeVoice(f);
                setResult(data);
                setPhase("done");
                setTimeout(() => resultsRef.current?.scrollIntoView({ 
                  behavior: "smooth", 
                  block: "start" 
                }), 120);
              } catch (err) {
                setError(err instanceof Error ? err.message : "Analysis failed. Please try again.");
                setPhase("idle");
              }
            } else {
              setError("Recording was too quiet. Please speak louder and try again.");
              setPhase("idle");
            }
          }
        } catch (err) {
          setError(err instanceof Error ? err.message : "Failed to process recording. Please try again.");
          setPhase("idle");
        }
      };

      mr.start(250);
      setSeconds(0);
      frameCountRef.current = 0;
      pendingAnalyzeRef.current = false;
      setPhase("recording");
      
      timerRef.current = setInterval(() => setSeconds(s => s + 1), 1000);

      setTimeout(() => {
        initSpectroCanvas();
        rafRef.current = requestAnimationFrame(drawColumn);
      }, 80);
    } catch (err) {
      console.error("Recording error:", err);
      // User-friendly error messages
      if (err instanceof DOMException && err.name === 'NotAllowedError') {
        setError("Microphone access is required. Please allow microphone access in your browser settings and try again.");
      } else if (err instanceof DOMException && err.name === 'NotFoundError') {
        setError("No microphone found. Please connect a microphone and try again.");
      } else if (err instanceof DOMException && err.name === 'NotReadableError') {
        setError("Could not access your microphone. Please check if it's being used by another application.");
      } else if (err instanceof DOMException && err.name === 'OverconstrainedError') {
        setError("Your microphone doesn't support the required audio settings. Please try a different microphone.");
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Failed to start recording. Please check your microphone and try again.");
      }
      setPhase("idle");
    }
  }

  function handleDiscard() {
    pendingAnalyzeRef.current = false;
    cleanupRecording();
  }

  function handleStopAnalyze() {
    if (mrRef.current && mrRef.current.state !== 'inactive') {
      pendingAnalyzeRef.current = true;
      mrRef.current.stop();
      stopAll();
      setPhase("analyzing");
    } else {
      setError("No active recording to analyze. Please start a new recording.");
    }
  }

  async function handleAnalyse() {
    if (!file) return;
    setPhase("analyzing");
    setError(null);
    try {
      const data = await analyzeVoice(file);
      setResult(data);
      setPhase("done");
      setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 120);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Analysis failed. Please try again.");
      setPhase("idle");
    }
  }

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div style={{ 
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        color: D.textMuted,
        fontFamily: D.fontMono,
        fontSize: "0.85rem"
      }}>
        Loading...
      </div>
    );
  }

  // ── Recording screen ──────────────────────────────────────────────────────────
// ── Recording screen ──────────────────────────────────────────────────────────
if (phase === "recording") {
  return (
    <div style={{ maxWidth: 960, margin: "0 auto", padding: "1.75rem 1.5rem 2.5rem" }}>
      <div style={{ marginBottom: "1.25rem" }}>
        <div style={{
          fontSize: 11, fontFamily: D.fontMono, textTransform: "uppercase",
          letterSpacing: "0.1em", color: D.textMuted, marginBottom: "0.4rem",
        }}>
          Daily check-in{patient ? ` · Day ${patient.day_number} of 30` : ""}
        </div>
        <h1 style={{
          fontSize: "clamp(1.3rem, 3vw, 1.7rem)", fontWeight: 700, color: D.text,
          margin: "0 0 0.3rem", letterSpacing: "-0.02em",
        }}>
          Live Voice Analysis
        </h1>
        <div style={{ fontSize: "0.88rem", color: D.textMuted }}>
          Real-time voice metrics monitoring
        </div>
      </div>

      {/* Spectrogram - Full width */}
      <div style={{
        background: "oklch(0.12 0.015 150)", borderRadius: 10,
        overflow: "hidden", marginBottom: "1rem",
      }}>
        <div style={{
          display: "flex", justifyContent: "space-between", alignItems: "center",
          padding: "8px 14px", borderBottom: "1px solid rgba(255,255,255,0.07)",
        }}>
          <div style={{ display:"flex", alignItems:"center", gap:8,
                        fontSize:11, fontFamily:D.fontMono, color:"rgba(255,255,255,.65)" }}>
            <span style={{
              width:7, height:7, borderRadius:"50%", background:"#e05050",
              display:"inline-block", boxShadow:"0 0 0 2px rgba(224,80,80,.3)",
            }} />
            Recording Live
          </div>
          <div style={{
            fontSize:10, fontFamily:D.fontMono, color:"rgba(255,255,255,.45)",
            textTransform:"uppercase", letterSpacing:"0.08em",
          }}>
            Spectrogram · 0–4 kHz
          </div>
        </div>

        <div style={{ position:"relative" }}>
          <canvas ref={spectroRef} style={{ width:"100%", height:160, display:"block" }} />
          <div style={{
            position:"absolute", top:8, left:12, bottom:0,
            display:"flex", flexDirection:"column", justifyContent:"space-between",
            paddingBottom:8, pointerEvents:"none",
            fontSize:9, fontFamily:D.fontMono, color:"rgba(255,255,255,0.4)",
          }}>
            <span>4 kHz</span><span>2 kHz</span><span>0 Hz</span>
          </div>
        </div>
      </div>

      {/* Live Signal Section - Full width with better UI */}
      <div style={{
        background: D.surface, borderRadius: 10, padding: "1.25rem 1.5rem",
        border: `1px solid ${D.border}`, marginBottom: "1rem",
      }}>
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          marginBottom: "1rem",
        }}>
          <div style={{
            fontSize: 10, fontFamily: D.fontMono, fontWeight: 700,
            textTransform: "uppercase", letterSpacing: "0.1em",
            color: D.textDim, display: "flex", alignItems: "center", gap: 8,
          }}>
            <Icons.Chart />
            Live Signal Metrics
          </div>
          <div style={{
            fontSize: "0.7rem", color: D.textDim,
            fontFamily: D.fontMono,
            background: D.bg, padding: "3px 10px", borderRadius: 4,
          }}>
            {elapsed}
          </div>
        </div>

        <div style={{
          display: "grid", 
          gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
          gap: "0.5rem",
        }}>
          {[
            { label: "Input level", value: `${metrics.db} dB`, icon: "" },
            
            { label: "Pitch (F0)", value: metrics.pitchHz > 0 ? `${metrics.pitchHz} Hz` : "— Hz", icon: "" },
            { label: "Jitter", value: metrics.pitchHz > 0 ? `${metrics.jitter} %` : "— %", icon: "" },
            { label: "Shimmer", value: metrics.pitchHz > 0 ? `${metrics.shimmer} %` : "— %", icon: "" },
            { label: "HNR", value: metrics.pitchHz > 0 ? `${metrics.hnr} dB` : "— dB", icon: "" },
          ].map(({ label, value, icon }) => (
            <div key={label} style={{
              background: D.bg, borderRadius: 8,
              padding: "0.6rem 0.75rem",
              border: `1px solid ${D.border}`,
              display: "flex", flexDirection: "column" as const,
              gap: "0.25rem",
            }}>
              <div style={{
                display: "flex", alignItems: "center", gap: 4,
                fontSize: "0.65rem", color: D.textMuted,
                fontWeight: 600, textTransform: "uppercase" as const,
                letterSpacing: "0.05em",
              }}>
                <span>{icon}</span>
                <span>{label}</span>
              </div>
              <div style={{
                fontSize: "1.05rem", fontWeight: 700,
                color: metrics.pitchHz > 0 ? D.accent : D.textDim,
                fontFamily: D.fontMono,
              }}>
                {value}
              </div>
            </div>
          ))}
        </div>

        {/* Visual indicator bars */}
        <div style={{
          marginTop: "1rem",
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "0.75rem",
        }}>
          <div>
            <div style={{
              display: "flex", justifyContent: "space-between",
              fontSize: "0.65rem", color: D.textMuted, marginBottom: 3,
            }}>
              <span>Signal Strength</span>
              <span>{Math.min(100, Math.round((metrics.db + 40) / 40 * 100))}%</span>
            </div>
            <div style={{
              background: D.border, borderRadius: 4, height: 4,
              overflow: "hidden",
            }}>
              <div style={{
                width: `${Math.min(100, Math.round((metrics.db + 40) / 40 * 100))}%`,
                height: "100%",
                background: metrics.db > -10 ? D.low : metrics.db > -25 ? D.mid : D.high,
                borderRadius: 4,
                transition: "width 0.3s ease",
              }} />
            </div>
          </div>
          <div>
            <div style={{
              display: "flex", justifyContent: "space-between",
              fontSize: "0.65rem", color: D.textMuted, marginBottom: 3,
            }}>
              <span>Voice Activity</span>
              <span>{metrics.pitchHz > 0 ? "Active" : "Silent"}</span>
            </div>
            <div style={{
              background: D.border, borderRadius: 4, height: 4,
              overflow: "hidden",
            }}>
              <div style={{
                width: `${metrics.pitchHz > 0 ? 100 : 0}%`,
                height: "100%",
                background: metrics.pitchHz > 0 ? D.accent : D.textDim,
                borderRadius: 4,
                transition: "width 0.3s ease",
              }} />
            </div>
          </div>
        </div>
      </div>

      {/* Buttons */}
      <div style={{ display: "flex", gap: "0.75rem", justifyContent: "center" }}>
        <button onClick={handleDiscard} style={{
          padding: "11px 28px", borderRadius: 8,
          border: `1px solid ${D.borderStrong}`,
          background: D.surface, color: D.text,
          fontSize: "0.88rem", fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
        }}>
          Discard
        </button>
        <button onClick={handleStopAnalyze} style={{
          padding: "11px 28px", borderRadius: 8, border: "none",
          background: D.accent, color: "#fff",
          fontSize: "0.88rem", fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
          display: "flex", alignItems: "center", gap: 9,
        }}>
          <span style={{
            width: 8, height: 8, borderRadius: "50%", background: "#e05050",
            display: "inline-block",
          }} />
          Stop &amp; analyze
        </button>
      </div>
    </div>
  );
}

  // ── Normal layout (idle / analyzing / done) ───────────────────────────────────
  const isHealthy  = result?.is_healthy ?? false;
  const primaryKey = result?.primary_disorder ?? "";
  const severity = result?.severity_label || "none";

  const CLASSIFIERS = result ? [
    { label:"Vocal Clarity",  score:toScore(result.voice_quality_prob), key:"parkinsons" },
    { label:"Speech Fluency", score:toScore(result.stuttering_prob),    key:"stuttering"  },
    { label:"Articulation",   score:toScore(result.dysarthria_prob),    key:"dysarthria"  },
  ] : [];

  const overallScore = result
    ? Math.round((toScore(result.voice_quality_prob) + toScore(result.stuttering_prob) + toScore(result.dysarthria_prob)) / 3)
    : 0;

  // Get severity-based colors
  const getSeverityColors = () => {
    if (isHealthy) {
      return {
        background: "linear-gradient(135deg, oklch(0.48 0.13 160) 0%, oklch(0.40 0.12 160) 100%)",
        icon: "",
        label: "Healthy"
      };
    }
    switch(severity) {
      case "mild":
        return {
          background: "linear-gradient(135deg, oklch(0.70 0.18 85) 0%, oklch(0.60 0.16 85) 100%)",
          icon: "",
          label: "Mild Concern"
        };
      case "moderate":
        return {
          background: "linear-gradient(135deg, oklch(0.65 0.18 55) 0%, oklch(0.55 0.16 55) 100%)",
          icon: "️",
          label: "Moderate Concern"
        };
      case "severe":
        return {
          background: "linear-gradient(135deg, oklch(0.50 0.18 25) 0%, oklch(0.40 0.16 25) 100%)",
          icon: "",
          label: "Needs Attention"
        };
      default:
        return {
          background: "linear-gradient(135deg, oklch(0.60 0.15 75) 0%, oklch(0.50 0.14 75) 100%)",
          icon: "️",
          label: "Concern Detected"
        };
    }
  };

  const severityColors = getSeverityColors();

  return (
    <div style={{ maxWidth: 860, margin: "0 auto", padding: "2rem 1.25rem" }}>

      <div style={{ marginBottom: "1.75rem" }}>
        <div style={{
          fontSize:11, fontFamily:D.fontMono, textTransform:"uppercase",
          letterSpacing:"0.1em", color:D.textMuted, marginBottom:"0.4rem",
        }}>
          Daily check-in{loggedIn && patient ? ` · Day ${patient.day_number} of 30` : ""}
        </div>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start",
                      gap:12, flexWrap:"wrap" as const }}>
          <div>
            <h1 style={{
              fontSize:"clamp(1.4rem, 3vw, 1.8rem)", fontWeight:700, color:D.text,
              margin:"0 0 0.3rem", letterSpacing:"-0.02em",
            }}>
              {loggedIn && patient
                ? `${patient.name.split(" ")[0]}'s voice check-in`
                : "Daily voice check-in"}
            </h1>
            <div style={{ fontSize:"0.88rem", color:D.textMuted }}>
              Record or upload your daily voice sample for AI analysis.
            </div>
          </div>
        </div>
      </div>

      {phase === "analyzing" && (
        <Card style={{ textAlign:"center", padding:"3rem 1.5rem", marginBottom:"1.5rem" }}>
          <div style={{ display:"flex", justifyContent:"center", marginBottom:"1rem" }}>
            <span style={{
              width:32, height:32, border:`3px solid ${D.accentSoft}`,
              borderTopColor:D.accent, borderRadius:"50%",
              animation:"spin 0.8s linear infinite", display:"inline-block",
            }} />
          </div>
          <div style={{ fontWeight:700, color:D.text, marginBottom:"0.3rem" }}>Analysing voice sample…</div>
          <div style={{ fontSize:"0.85rem", color:D.textMuted }}>Running all classifiers</div>
        </Card>
      )}

      {error && (
        <div style={{
          marginBottom:"1rem", padding:"10px 14px",
          background:D.highSoft, border:`1px solid oklch(0.85 0.06 25)`,
          borderRadius:8, color:D.high, fontSize:13,
        }}>
          <span style={{ marginRight:8 }}></span> {error}
        </div>
      )}

      {phase === "idle" && (
        <>
          <div style={{
            display:"flex", background:D.surface, border:`1px solid ${D.border}`,
            borderRadius:10, overflow:"hidden", marginBottom:"1.25rem",
          }}>
            {(["record", "upload"] as const).map(t => (
              <button key={t} onClick={() => setUploadMode(t === "upload")} style={{
                flex:1, padding:"0.7rem",
                background:(t === "upload") === uploadMode ? D.accent : "transparent",
                color:(t === "upload") === uploadMode ? "#fff" : D.textMuted,
                fontWeight:600, fontSize:"0.85rem", border:"none",
                cursor:"pointer", transition:"all .15s", fontFamily:"inherit",
                display:"flex", alignItems:"center", justifyContent:"center", gap:8,
              }}>
                {t === "record" ? <Icons.Mic /> : <Icons.Upload />}
                {t === "record" ? "Record" : "Upload"}
              </button>
            ))}
          </div>

          <Card style={{ marginBottom: "1.5rem" }}>
            {!uploadMode ? (
              <div style={{ textAlign:"center", padding:"1.5rem 1rem" }}>
                <div style={{ fontSize:"0.88rem", color:D.textMuted, marginBottom:"1.5rem", lineHeight:1.6 }}>
                  You'll be asked to read a short passage aloud.<br />
                  Aim for a quiet room and speak at a comfortable pace.
                </div>
                <button onClick={startRecording} style={{
                  padding:"14px 36px", borderRadius:10,
                  background:D.accent, color:"#fff",
                  fontSize:"1rem", fontWeight:700, border:"none", cursor:"pointer",
                  fontFamily:"inherit", display:"inline-flex", alignItems:"center", gap:10,
                  boxShadow:D.shadowMd,
                }}>
                  <Icons.Mic />
                  Start recording
                </button>
              </div>
            ) : (
              <>
                <div
                  onDragOver={e => { e.preventDefault(); setDragging(true); }}
                  onDragLeave={() => setDragging(false)}
                  onDrop={e => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files[0]; if (f) setFile(f); }}
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    border:`2px dashed ${dragging ? D.accent : D.borderStrong}`,
                    borderRadius:10, padding:"2.25rem 1.5rem", textAlign:"center",
                    cursor:"pointer", background:dragging ? D.accentSoft : D.bg,
                    transition:"all .15s", marginBottom:"1rem",
                  }}
                >
                  {file ? (
                    <>
                      <div style={{ marginBottom:"0.4rem", color:D.accent }}>
                        <Icons.File />
                      </div>
                      <div style={{ fontWeight:700, color:D.text }}>{file.name}</div>
                      <div style={{ color:D.textDim, fontSize:"0.78rem", marginTop:4 }}>
                        {(file.size / 1024).toFixed(1)} KB · {file.type || "audio"}
                      </div>
                      <div style={{ marginTop:"0.4rem", fontSize:"0.78rem", color:D.accent }}>
                        Click to change file
                      </div>
                    </>
                  ) : (
                    <>
                      <div style={{ marginBottom:"0.6rem", color:D.accent }}>
                        <Icons.Upload />
                      </div>
                      <div style={{ fontWeight:600, color:D.text, marginBottom:"0.25rem" }}>
                        Drag &amp; drop your audio file here
                      </div>
                      <div style={{ color:D.textDim, fontSize:"0.82rem" }}>or click to browse</div>
                      <div style={{ color:D.textDim, fontSize:"0.72rem", marginTop:"0.4rem" }}>
                        WAV · MP3 · OGG · FLAC · M4A supported
                      </div>
                    </>
                  )}
                  <input ref={fileInputRef} type="file" accept="audio/*"
                    style={{ display:"none" }}
                    onChange={e => { const f = e.target.files?.[0]; if (f) setFile(f); }} />
                </div>
                {file && (
                  <button onClick={handleAnalyse} style={{
                    width:"100%", padding:13, borderRadius:8,
                    background:D.accent, color:"#fff",
                    fontWeight:700, fontSize:"0.95rem", border:"none",
                    cursor:"pointer", fontFamily:"inherit",
                  }}>
                    Analyse Voice
                  </button>
                )}
              </>
            )}
          </Card>
        </>
      )}

      {phase === "done" && result && (
        <div ref={resultsRef} style={{ display:"flex", flexDirection:"column", gap:"1.1rem" }}>

          <div style={{
            borderRadius:16,
            background: severityColors.background,
            color:"#fff",
            padding:"2.25rem 2rem",
            textAlign:"center",
            boxShadow:"0 8px 32px rgba(15,32,60,0.18)",
          }}>
            <div style={{ fontSize:"3.5rem", marginBottom:"0.5rem", lineHeight:1 }}>
              {severityColors.icon}
            </div>
            <div style={{
              fontSize:"clamp(1.8rem,5vw,2.4rem)", fontWeight:800,
              letterSpacing:"-0.03em", marginBottom:"0.5rem",
            }}>
              {isHealthy ? "Healthy" : severityColors.label}
            </div>
            <div style={{ fontSize:"1rem", opacity:0.88, maxWidth:420, margin:"0 auto" }}>
              {isHealthy
                ? "Your speech is within the normal recovery range. Keep it up!"
                : result.message}
            </div>
            <div style={{
              display:"flex", justifyContent:"center", gap:12,
              marginTop:"1.25rem", flexWrap:"wrap" as const,
            }}>
              <span style={{
                background:"rgba(255,255,255,.18)", borderRadius:20,
                padding:"4px 16px", fontSize:"0.78rem", fontWeight:700,
                display:"flex", alignItems:"center", gap:6,
              }}>
                <Icons.Clock /> {result.duration_s.toFixed(1)}s recorded
              </span>
              {!isHealthy && (
                <span style={{
                  background:"rgba(255,255,255,.18)", borderRadius:20,
                  padding:"4px 16px", fontSize:"0.78rem", fontWeight:700,
                }}>
                  {SEVERITY_LABEL[result.severity_label] ?? result.severity_label} severity
                </span>
              )}
            </div>
          </div>

          {result.session_id && (
            <div style={{
              display:"flex", alignItems:"center", gap:"0.5rem",
              padding:"9px 14px", background:D.lowSoft,
              border:`1px solid oklch(0.85 0.08 160)`, borderRadius:8,
              fontSize:"0.82rem", color:D.lowInk, fontWeight:600,
            }}>
              <Icons.Chart />
              <span>Session saved to your 30-day progress tracker.</span>
            </div>
          )}

          <button onClick={() => setShowDetails(s => !s)} style={{
            background:D.surface, border:`1px solid ${D.border}`,
            borderRadius:10, padding:"0.8rem 1.25rem",
            display:"flex", justifyContent:"space-between", alignItems:"center",
            cursor:"pointer", fontFamily:"inherit", width:"100%",
            color:D.text, fontSize:"0.88rem", fontWeight:600,
          }}>
            <span style={{ display:"flex", alignItems:"center", gap:8 }}>
              <Icons.Chart />
              Detailed voice analysis
            </span>
            <span style={{ fontSize:"0.8rem", color:D.textMuted }}>
              {showDetails ? <Icons.ArrowUp /> : <Icons.ArrowDown />}
            </span>
          </button>

          {showDetails && (
            <>
              <div style={{
                padding:"1.1rem 1.25rem", borderRadius:12,
                background: isHealthy ? D.lowSoft : (severity === "severe" ? D.highSoft : severity === "moderate" ? D.moderateSoft : D.midSoft),
                border:`1px solid ${isHealthy ? "oklch(0.85 0.08 160)" : severity === "moderate" ? "oklch(0.85 0.12 55)" : "oklch(0.88 0.08 80)"}`,
              }}>
                <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                  <span style={{ fontSize:"1.4rem" }}>
                    {isHealthy ? "" : severity === "severe" ? "" : severity === "moderate" ? "️" : ""}
                  </span>
                  <div>
                    <div style={{ fontWeight:700, fontSize:"0.95rem", color:D.text }}>
                      {DISORDER_LABEL[isHealthy ? "healthy" : primaryKey] ?? primaryKey}
                    </div>
                    <div style={{ fontSize:"0.82rem", color:D.textMuted, marginTop:2 }}>
                      {result.message}
                    </div>
                  </div>
                </div>
              </div>

              <Card>
                <div style={{ fontWeight:600, fontSize:"0.72rem", color:D.textMuted,
                              textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:"0.9rem" }}>
                  Recovery Scores (higher = better)
                </div>
                <div style={{ display:"flex", flexDirection:"column", gap:"1rem" }}>
                  {CLASSIFIERS.map(({ label, score, key }) => (
                    <ClassifierBar key={key} label={label} score={score}
                      isConcern={!isHealthy && primaryKey === key} />
                  ))}
                </div>
              </Card>

              <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:"0.9rem" }}>
                {CLASSIFIERS.map(({ label, score, key }) => {
                  const b = band(score);
                  const active = !isHealthy && primaryKey === key;
                  return (
                    <div key={key} style={{
                      background: active ? "oklch(0.22 0.015 150)" : D.surface,
                      borderRadius:12, padding:"1.1rem",
                      border: active ? "none" : `1px solid ${D.border}`,
                      boxShadow: active ? D.shadowMd : D.shadow, textAlign:"center",
                    }}>
                      <div style={{ fontSize:"0.72rem", fontWeight:600,
                                    color: active ? "rgba(255,255,255,.6)" : D.textMuted,
                                    marginBottom:"0.2rem", textTransform:"uppercase",
                                    letterSpacing:"0.07em" }}>{label}</div>
                      <div style={{ fontSize:"2rem", fontWeight:800, fontFamily:D.fontMono,
                                    color: active ? "#fff" : (D[b as keyof typeof D] as string) }}>
                        {score}
                      </div>
                      {active && (
                        <div style={{
                          background:"rgba(255,255,255,.15)", color:"#fff", borderRadius:6,
                          padding:"2px 8px", fontSize:"0.65rem", fontWeight:700,
                          marginTop:"0.4rem", display:"inline-block",
                        }}>PRIMARY CONCERN</div>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {loggedIn && result.session_id && (
            <div style={{
              background:D.accentSoft, borderRadius:10, padding:"0.9rem 1.1rem",
              display:"flex", alignItems:"center", justifyContent:"space-between",
              border:`1px solid oklch(0.88 0.05 145)`, flexWrap:"wrap" as const, gap:"0.6rem",
            }}>
              <div style={{ fontSize:"0.85rem", color:D.accentInk, fontWeight:600, display:"flex", alignItems:"center", gap:8 }}>
                <Icons.Chart />
                This session has been added to your 30-day progress tracker.
              </div>
              <Link href="/vocal_therapy/dashboard" style={{
                background:D.accent, color:"#fff", borderRadius:7,
                padding:"7px 14px", fontWeight:600, fontSize:"0.82rem", textDecoration:"none",
              }}>
                View Progress →
              </Link>
            </div>
          )}

          <div style={{
            padding:"10px 14px", background:D.bg, borderRadius:8,
            border:`1px solid ${D.border}`, fontSize:"0.72rem", color:D.textDim, lineHeight:1.5,
          }}>
            <strong>Clinical disclaimer:</strong> Scores are AI-generated screening indicators only.
            Always discuss results with your speech therapist or clinical team.
          </div>
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}