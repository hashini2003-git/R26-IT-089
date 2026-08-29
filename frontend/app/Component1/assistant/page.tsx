"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import {
  Heart, Camera, LayoutDashboard, BarChart2, TrendingUp, GitCompare,
  MessageSquare, Stethoscope, Menu, X, Mic, MicOff, Volume2, VolumeX, ArrowRight,
} from "lucide-react";
import { loadResult, type IpeResult } from "../_lib/ipe-ui";

/* ── Palette ─────────────────────────────────────────────────── */
const BLUE = "#1565C0";
const BLUE_DEEP = "#0D47A1";
const BLUE_TINT = "#E3EEF9";
const MINT = "#0D9488";
const NAVY = "#0B1F38";
const BG = "#F4F8FD";
const BORDER = "rgba(21,101,192,0.10)";
const SIDEBAR_BG = "#0B1F38";
const TEXT = "#0F2137";
const TEXT2 = "#4A6070";
const FONT = "'Inter', system-ui, sans-serif";
const SERIF = "'DM Serif Display', Georgia, serif";

function timeNow() { return new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }); }

type Message = { id: string; from: "ai" | "user"; text: string; time: string; buttons?: string[] };
type Stage = "greeting" | "symptoms_burning" | "symptoms_eating" | "symptoms_stiff" | "symptoms_duration" | "validating" | "advice" | "treatment" | "appointment" | "done";
const STRUCTURED_STAGES: Stage[] = ["greeting", "symptoms_burning", "symptoms_eating", "symptoms_stiff", "symptoms_duration"];

function speak(text: string, onEnd?: () => void) {
  if (!("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
  const msg = new SpeechSynthesisUtterance(text);
  msg.rate = 0.88; msg.pitch = 1.0; msg.volume = 1.0;
  if (onEnd) msg.onend = onEnd;
  window.speechSynthesis.speak(msg);
}
function stopSpeaking() { if ("speechSynthesis" in window) window.speechSynthesis.cancel(); }

/* ── Sidebar shell ────────────────────────────────────────────── */
const NAV_SECTIONS = [
  { label: "Overview", items: [{ href: "/Component1/dashboard", label: "Patient Dashboard", sub: "Summary & care plan", Icon: LayoutDashboard }] },
  { label: "My Health", items: [
    { href: "/Component1/results", label: "Analysis Results", sub: "Latest AI findings", Icon: BarChart2 },
    { href: "/Component1/progress", label: "Recovery Journey", sub: "Progress tracking", Icon: TrendingUp },
    { href: "/Component1/compare", label: "Before & After", sub: "Visual comparison", Icon: GitCompare },
  ] },
  { label: "Tools", items: [
    { href: "/Component1/upload", label: "New Scan", sub: "Upload oral image", Icon: Camera },
    { href: "/Component1/assistant", label: "AI Assistant", sub: "Get guidance", Icon: MessageSquare },
    { href: "/Component1/doctors", label: "Find a Doctor", sub: "Doctor recommendation", Icon: Stethoscope },
  ] },
];
function SectionLabel({ children }: { children: React.ReactNode }) {
  return <div style={{ fontSize: 9.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1.6, color: "rgba(255,255,255,0.28)", padding: "16px 14px 6px", marginTop: 4 }}>{children}</div>;
}
function NavSidebar({ onClose }: { onClose?: () => void }) {
  const router = useRouter();
  const pathname = usePathname();
  return (
    <div style={{ width: 248, background: SIDEBAR_BG, display: "flex", flexDirection: "column", height: "100%", flexShrink: 0, fontFamily: FONT, overflowY: "auto" }}>
      <div style={{ padding: "22px 18px 18px", borderBottom: "1px solid rgba(255,255,255,0.06)", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 38, height: 38, borderRadius: 11, background: `linear-gradient(135deg, ${BLUE}, ${MINT})`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, boxShadow: `0 4px 12px ${BLUE}44` }}>
            <Heart size={17} color="#fff" />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14.5, fontWeight: 700, color: "#fff", lineHeight: 1.2, fontFamily: SERIF }}>OralCare AI</div>
            <div style={{ fontSize: 9.5, color: "rgba(255,255,255,0.35)", marginTop: 1, letterSpacing: 0.3 }}>Clinical Patient Portal</div>
          </div>
          {onClose && (
            <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.35)", display: "flex", padding: 2 }}>
              <X size={17} />
            </button>
          )}
        </div>
        <div style={{ marginTop: 14, display: "flex", alignItems: "center", gap: 8, padding: "9px 11px", borderRadius: 11, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.06)" }}>
          <div style={{ width: 30, height: 30, borderRadius: "50%", background: `${BLUE}44`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: "#90CAF9" }}>P</span>
          </div>
          <div>
            <div style={{ fontSize: 11.5, fontWeight: 600, color: "#fff" }}>Patient Portal</div>
            <div style={{ fontSize: 9.5, color: "rgba(255,255,255,0.3)" }}>Secure session active</div>
          </div>
          <div style={{ marginLeft: "auto", width: 7, height: 7, borderRadius: "50%", background: "#2ECC91", flexShrink: 0, boxShadow: "0 0 6px #2ECC9188" }} />
        </div>
      </div>
      <nav style={{ flex: 1, padding: "6px 10px 14px" }}>
        {NAV_SECTIONS.map((section) => (
          <div key={section.label}>
            <SectionLabel>{section.label}</SectionLabel>
            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              {section.items.map(({ href, label, sub, Icon }) => {
                const active = pathname === href;
                return (
                  <button key={href} onClick={() => { router.push(href); onClose?.(); }}
                    style={{
                      display: "flex", alignItems: "center", gap: 10, padding: "9px 10px", borderRadius: 10,
                      border: "none", cursor: "pointer", textAlign: "left", width: "100%",
                      background: active ? `linear-gradient(135deg, ${BLUE}cc, ${BLUE_DEEP}cc)` : "transparent",
                      transition: "all .15s", fontFamily: FONT,
                      boxShadow: active ? `0 3px 10px ${BLUE}33` : "none",
                    }}
                  >
                    <div style={{ width: 32, height: 32, borderRadius: 9, background: active ? "rgba(255,255,255,0.18)" : "rgba(255,255,255,0.06)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <Icon size={14} color={active ? "#fff" : "rgba(255,255,255,0.45)"} />
                    </div>
                    <div>
                      <div style={{ fontSize: 12.5, fontWeight: active ? 600 : 400, color: active ? "#fff" : "rgba(255,255,255,0.6)", lineHeight: 1.25 }}>{label}</div>
                      <div style={{ fontSize: 10, color: "rgba(255,255,255,0.25)", marginTop: 1 }}>{sub}</div>
                    </div>
                    {active && <div style={{ marginLeft: "auto", width: 5, height: 5, borderRadius: "50%", background: "#90CAF9", flexShrink: 0 }} />}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </nav>
      <div style={{ padding: "10px 10px 20px", borderTop: "1px solid rgba(255,255,255,0.06)", flexShrink: 0 }}>
        <button onClick={() => { router.push("/Component1/assistant"); onClose?.(); }}
          style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "12px 13px", borderRadius: 11, border: `1px solid rgba(13,148,136,0.3)`, background: "rgba(13,148,136,0.1)", cursor: "pointer", fontFamily: FONT }}>
          <div style={{ width: 30, height: 30, borderRadius: 9, background: "rgba(13,148,136,0.2)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <Stethoscope size={14} color={MINT} />
          </div>
          <div style={{ textAlign: "left" }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: MINT, lineHeight: 1.2 }}>Message Care Team</div>
            <div style={{ fontSize: 10, color: "rgba(255,255,255,0.28)", marginTop: 1 }}>AI-powered assistant</div>
          </div>
        </button>
        <div style={{ marginTop: 12, fontSize: 9, color: "rgba(255,255,255,0.18)", textAlign: "center", letterSpacing: 0.3 }}>
          OralCare AI v3.0 · HIPAA-aligned · Encrypted
        </div>
      </div>
    </div>
  );
}
function SidebarLayout({ title, children }: { title: string; children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden", fontFamily: FONT, background: BG }}>
      <div className="hidden lg:flex" style={{ flexDirection: "column", height: "100%", flexShrink: 0 }}>
        <NavSidebar />
      </div>
      {mobileOpen && (
        <div style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex" }}>
          <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.45)", backdropFilter: "blur(3px)" }} onClick={() => setMobileOpen(false)} />
          <div style={{ position: "relative", height: "100%", width: 248, zIndex: 1 }}>
            <NavSidebar onClose={() => setMobileOpen(false)} />
          </div>
        </div>
      )}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", minWidth: 0 }}>
        <div className="flex lg:hidden" style={{ alignItems: "center", gap: 12, padding: "12px 16px", background: "#fff", borderBottom: `1px solid ${BORDER}`, flexShrink: 0 }}>
          <button onClick={() => setMobileOpen(true)} style={{ background: "none", border: "none", cursor: "pointer", display: "flex", padding: 4 }}>
            <Menu size={20} color={NAVY} />
          </button>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 28, height: 28, borderRadius: 8, background: `linear-gradient(135deg, ${BLUE}, ${MINT})`, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Heart size={13} color="#fff" />
            </div>
            <span style={{ fontSize: 14, fontWeight: 700, color: NAVY, fontFamily: SERIF }}>OralCare AI</span>
          </div>
          <div style={{ marginLeft: "auto", fontSize: 11.5, color: TEXT2 }}>{title}</div>
        </div>
        <div style={{ flex: 1, overflow: "hidden" }}>{children}</div>
      </div>
    </div>
  );
}

/* ── Merged assistant flow: structured check-in + open Q&A fallback ── */
function AssistantContent({ result }: { result: IpeResult }) {
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [stage, setStage] = useState<Stage>("greeting");
  const [listening, setListening] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [input, setInput] = useState("");
  const [symptoms, setSymptoms] = useState({ burning: false, eating: false, stiff: false, duration: "" });
  const [thinking, setThinking] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const recognRef = useRef<any>(null);
  const msgIdCounter = useRef(0);
  const messagesRef = useRef<Message[]>([]);
  const stageRef = useRef<Stage>("greeting");
  messagesRef.current = messages;
  stageRef.current = stage;

  function nextMsgId() { msgIdCounter.current += 1; return `${Date.now()}-${msgIdCounter.current}`; }
  function addMsg(from: "ai" | "user", text: string, buttons?: string[]) {
    setMessages((prev) => [...prev, { id: nextMsgId(), from, text, time: timeNow(), buttons }]);
  }
  function say(text: string) { setSpeaking(true); speak(text.replace(/\*\*/g, ""), () => setSpeaking(false)); }

  useEffect(() => {
    const t = setTimeout(() => {
      const text = `Hello! I have analyzed your oral image.\nYour diagnosis is ${result.classification.name} with a pain score of ${result.ppi.score.toFixed(1)} out of ${result.ppi.max ?? 10}.\nThis is ${result.ppi.label}.\nI have a few quick questions to better understand your condition — or ask me anything, anytime.\nAre you ready?`;
      addMsg("ai", text, ["Yes, I'm ready", "Just show me results"]);
      say(text);
    }, 600);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    return () => {
      stopSpeaking();
      recognRef.current?.stop();
    };
  }, []);

  /* ── Structured question stages ─────────────────────────────── */
  function askBurning() {
    const text = result.visual_features.erythema > 0.5
      ? "I detected significant redness in your tissue. Are you experiencing a burning or stinging sensation in your mouth?"
      : "Are you experiencing any burning sensation in your mouth?";
    addMsg("ai", text, ["Yes", "No", "Sometimes"]);
    setStage("symptoms_burning");
    say(text);
  }
  function askEating() {
    const text = result.visual_features.ulceration > 0.3
      ? "I detected possible ulceration. Does eating or drinking cause you sharp pain?"
      : "Do you experience any pain when eating or drinking?";
    addMsg("ai", text, ["Yes, very painful", "Mild discomfort", "No pain"]);
    setStage("symptoms_eating");
    say(text);
  }
  function askStiff() {
    const text = result.visual_features.texture > 0.4
      ? "I detected some tissue stiffness. Is your mouth feeling stiff or hard to open fully?"
      : "Is your mouth feeling stiff or restricted?";
    addMsg("ai", text, ["Yes", "A little", "No"]);
    setStage("symptoms_stiff");
    say(text);
  }
  function askDuration() {
    const text = "How long have you had these symptoms?";
    addMsg("ai", text, ["Less than 1 week", "1–4 weeks", "1–3 months", "More than 3 months"]);
    setStage("symptoms_duration");
    say(text);
  }
  function buildAdvice(confirmed: number): string {
    const ppi = result.ppi.score;
    const ppiMax = result.ppi.max ?? 10;
    const cls = result.classification.index;
    if (cls === 3) return "Based on your image and symptoms, I strongly recommend seeing a specialist TODAY. Oral cancer requires immediate professional evaluation.";
    if (ppi / ppiMax > 0.7 || (confirmed >= 2 && ppi / ppiMax > 0.5)) return "Given your pain level and symptoms, please see your doctor within the next 1 to 2 days. Pain management and clinical evaluation are needed urgently.";
    if (ppi / ppiMax > 0.4 || cls === 2) return "I recommend seeing your dentist or oral medicine specialist within 2 weeks. In the meantime, avoid spicy foods and use salt water rinse.";
    return "Your condition appears manageable. Monitor your symptoms and see your dentist at your next routine visit. Maintain good oral hygiene.";
  }
  function validateAndAdvise(duration: string, finalSymptoms: typeof symptoms) {
    setStage("validating");
    const ppi = result.ppi.score;
    const ppiMax = result.ppi.max ?? 10;
    let confirmed = 0;
    if (finalSymptoms.burning && result.visual_features.erythema > 0.5) confirmed++;
    if (finalSymptoms.eating && result.visual_features.ulceration > 0.3) confirmed++;
    if (finalSymptoms.stiff && result.visual_features.texture > 0.4) confirmed++;
    const longTerm = duration.includes("month");
    const combined = Math.min(ppiMax, ppi * (1 + confirmed * 0.08));

    setTimeout(() => {
      setStage("advice");
      let validation = "";
      if (confirmed >= 2) validation = `Your symptoms strongly confirm the AI findings. Combined assessment score: ${combined.toFixed(1)} out of ${ppiMax}. High confidence in this assessment.`;
      else if (confirmed === 1) validation = `Some of your symptoms match what I detected in the image. Combined score: ${combined.toFixed(1)} out of ${ppiMax}.`;
      else validation = `Your reported symptoms don't fully match the visual findings. This may be early-stage or the image angle may have limited detection. Score remains ${ppi.toFixed(1)} out of ${ppiMax}.`;
      if (longTerm) validation += " You mentioned symptoms lasting over a month — this is clinically important and warrants prompt evaluation.";
      const advice = buildAdvice(confirmed);
      const fullText = validation + " " + advice;
      addMsg("ai", fullText, ["What should I do now?", "Treatment plan", "Book appointment", "Ask something else"]);
      say(fullText);
    }, 1500);
  }
  function showTreatment() {
    setStage("treatment");
    const tx = result.treatment_plan;
    const items = [...(tx.immediate || []).slice(0, 2), ...(tx.short_term || []).slice(0, 2), ...(tx.clinical || []).slice(0, 1)];
    const text = `Here is your personalized treatment plan: ${items.join(". ")}.`;
    addMsg("ai", text, ["Download full report", "Set appointment reminder", "Ask something else", "Done"]);
    say(text);
  }
  function showAppointment() {
    setStage("appointment");
    const text = `Based on your results, ${result.urgency.message} Your recommended timeframe is ${result.urgency.timeframe}. I have noted this for you. Would you like to download your clinical report to show your doctor?`;
    addMsg("ai", text, ["Download report", "Analyze another image", "Ask something else", "Finish"]);
    say(text);
  }
  function finish() {
    setStage("done");
    const text = "Thank you for using OralCare AI. Take care of yourself and don't delay your clinic visit. You can still ask me anything below. Goodbye for now!";
    addMsg("ai", text);
    say(text);
  }

  /* ── Open-ended Q&A — calls the real Gemini-backed /api/oral-chat route
     (used mid-flow for side questions, and freely once the structured flow is done) ── */
  async function generateReply(msg: string): Promise<string> {
    try {
      const res = await fetch("/api/chat/oral-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: msg,
          context: {
            classification: result.classification.name,
            confidence: Math.round(result.classification.confidence),
            ppiScore: result.ppi.score,
            ppiMax: result.ppi.max ?? 10,
            ppiLabel: result.ppi.label,
            erythema: Math.round(result.visual_features.erythema * 100),
            ulceration: Math.round(result.visual_features.ulceration * 100),
            texture: Math.round(result.visual_features.texture * 100),
            urgencyLevel: result.urgency.level,
            urgencyMessage: result.urgency.message,
            urgencyTimeframe: result.urgency.timeframe,
            treatmentImmediate: result.treatment_plan.immediate,
            treatmentShortTerm: result.treatment_plan.short_term,
          },
        }),
      });
      if (!res.ok) throw new Error(`oral-chat request failed (${res.status})`);
      const data = await res.json();
      return data.reply ?? "I'm here to help — could you rephrase that?";
    } catch (err) {
      console.error("oral-chat fetch failed:", err);
      return "I'm having trouble reaching my full assistant right now, but I'm still here — you can ask about your diagnosis, pain score, or treatment plan, or check back in a moment.";
    }
  }

  /* ── Button taps always drive the structured flow ────────────── */
  async function handleButton(btn: string) {
    addMsg("user", btn);
    stopSpeaking();
    setSpeaking(false);
    const b = btn.toLowerCase();

    if (b.includes("ask something else")) {
      addMsg("ai", "Sure — what would you like to know? You can ask about your diagnosis, pain score, or treatment plan.");
      say("Sure, what would you like to know?");
      return;
    }

    if (stage === "greeting") {
      if (b.includes("ready")) askBurning();
      else { addMsg("ai", result.assistant_message); say(result.assistant_message); setStage("done"); }
      return;
    }
    if (stage === "symptoms_burning") { const u = { ...symptoms, burning: b.includes("yes") || b.includes("sometimes") }; setSymptoms(u); askEating(); return; }
    if (stage === "symptoms_eating") { const u = { ...symptoms, eating: b.includes("yes") || b.includes("very") }; setSymptoms(u); askStiff(); return; }
    if (stage === "symptoms_stiff") { const u = { ...symptoms, stiff: b.includes("yes") || b.includes("little") }; setSymptoms(u); askDuration(); return; }
    if (stage === "symptoms_duration") { const u = { ...symptoms, duration: btn }; setSymptoms(u); validateAndAdvise(btn, u); return; }

    if (stage === "advice" || stage === "treatment") {
      if (b.includes("treatment")) { showTreatment(); return; }
      if (b.includes("appointment")) { showAppointment(); return; }
      if (b.includes("report") || b.includes("download")) { router.push("/Component1/results/report"); return; }
      if (b.includes("done") || b.includes("finish")) { finish(); return; }
    }
    if (stage === "appointment") {
      if (b.includes("report") || b.includes("download")) { router.push("/Component1/results/report"); return; }
      if (b.includes("analyze")) { router.push("/Component1/upload"); return; }
      if (b.includes("finish")) { finish(); return; }
    }
    if (stage === "done" && (b.includes("dashboard") || b.includes("go to"))) { router.push("/Component1/dashboard"); return; }

    // Fallback: nothing above matched (e.g. "What else should I know?", "How do I track progress?")
    // — treat it as an open question instead of silently doing nothing.
    setThinking(true);
    const reply = await generateReply(btn);
    setThinking(false);
    addMsg("ai", reply, ["What else should I know?", "Explain my treatment plan", "How do I track progress?"]);
    say(reply);
  }

  /* ── Free text (typed or voice) — try to match the expected answer first;
     otherwise answer it as an open question, then gently resume the check-in. ── */
  async function handleFreeText(said: string) {
    addMsg("user", said);
    const low = said.toLowerCase();
    const cur = stageRef.current;
    const lastMsg = messagesRef.current[messagesRef.current.length - 1];

    // Try to match one of the currently offered buttons (covers yes/no + most phrasing).
    if (lastMsg?.buttons) {
      const match = lastMsg.buttons.find((btn) => low.includes(btn.toLowerCase().split(" ")[0]) || btn.toLowerCase().includes(low.split(" ")[0]));
      if (match) { stopSpeaking(); setSpeaking(false); handleButton(match); return; }
    }
    const offeringYesNo = lastMsg?.buttons?.some((b) => b === "Yes" || b === "No");
    if (offeringYesNo) {
      if (low.includes("yes") || low.includes("yeah")) { stopSpeaking(); setSpeaking(false); handleButton("Yes"); return; }
      if (low === "no" || low.startsWith("no ") || low.startsWith("no,")) { stopSpeaking(); setSpeaking(false); handleButton("No"); return; }
    }

    // Didn't match an expected answer — treat as a genuine question.
    stopSpeaking(); setSpeaking(false);
    setThinking(true);
    const reply = await generateReply(said);
    setThinking(false);

    if (STRUCTURED_STAGES.includes(cur) && cur !== "greeting") {
      // Mid check-in: answer, then re-ask the same pending question so the flow isn't lost.
      addMsg("ai", reply);
      setTimeout(() => {
        addMsg("ai", "Now, back to my question:", lastMsg?.buttons);
        say("Now, back to my question.");
      }, 400);
    } else {
      // Flow finished (or still on greeting) — open Q&A, offer more topics.
      addMsg("ai", reply, ["What else should I know?", "Explain my treatment plan", "How do I track progress?"]);
      say(reply);
    }
  }

  function handleTextSend() {
    const msg = input.trim();
    if (!msg) return;
    setInput("");
    handleFreeText(msg);
  }

  function toggleListen() {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) { alert("Voice input not supported in this browser. Please use Chrome."); return; }
    if (listening) { recognRef.current?.stop(); setListening(false); return; }
    stopSpeaking();
    const r = new SR();
    recognRef.current = r;
    r.lang = "en-US"; r.interimResults = false; r.maxAlternatives = 1;
    r.onstart = () => setListening(true);
    r.onend = () => setListening(false);
    r.onerror = () => setListening(false);
    r.onresult = (e: any) => { handleFreeText(e.results[0][0].transcript.trim()); };
    r.start();
  }
  function toggleSpeak(text: string) {
    if (speaking) { stopSpeaking(); setSpeaking(false); return; }
    say(text);
  }

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", fontFamily: FONT, background: BG }}>
      <div style={{ padding: "15px 22px", background: "#fff", borderBottom: `1px solid ${BORDER}`, display: "flex", alignItems: "center", gap: 13, flexShrink: 0, boxShadow: "0 1px 4px rgba(21,101,192,0.05)" }}>
        <div style={{ width: 40, height: 40, borderRadius: 12, background: `linear-gradient(135deg, ${BLUE}, ${MINT})`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <Stethoscope size={18} color="#fff" />
        </div>
        <div>
          <div style={{ fontSize: 14, fontWeight: 600, color: NAVY, fontFamily: SERIF }}>OralCare AI Guide</div>
          <div style={{ fontSize: 10.5, color: MINT, fontWeight: 600, display: "flex", alignItems: "center", gap: 4 }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: MINT, display: "inline-block", boxShadow: `0 0 5px ${MINT}` }} />
            Guided check-in · Ask anything anytime
          </div>
        </div>
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 6, padding: "6px 14px", borderRadius: 20, background: BLUE_TINT }}>
          <span style={{ fontSize: 11, fontWeight: 600, color: BLUE }}>{result.classification.name} · {result.ppi.score.toFixed(1)}/{result.ppi.max ?? 10}</span>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "18px 18px 10px" }}>
        {messages.map((m) => (
          <div key={m.id} style={{ marginBottom: 16, display: "flex", flexDirection: "column", alignItems: m.from === "user" ? "flex-end" : "flex-start" }}>
            {m.from === "ai" && (
              <div style={{ display: "flex", alignItems: "flex-start", gap: 10, maxWidth: "86%" }}>
                <div style={{ width: 30, height: 30, borderRadius: 9, background: `linear-gradient(135deg, ${BLUE}, ${MINT})`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 2 }}>
                  <Stethoscope size={14} color="#fff" />
                </div>
                <div>
                  <div style={{ background: "#fff", border: `1px solid ${BORDER}`, borderRadius: "0 16px 16px 16px", padding: "12px 16px", fontSize: 13.5, color: TEXT, lineHeight: 1.7, boxShadow: "0 2px 8px rgba(21,101,192,0.05)", whiteSpace: "pre-line" }}>
                    {m.text.split("**").map((part, i) => (i % 2 === 1 ? <strong key={i}>{part}</strong> : <span key={i}>{part}</span>))}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 5 }}>
                    <span style={{ fontSize: 10, color: TEXT2 }}>{m.time}</span>
                    <button onClick={() => toggleSpeak(m.text)} style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 3, color: TEXT2, fontSize: 10, fontFamily: FONT }}>
                      {speaking ? <VolumeX size={12} /> : <Volume2 size={12} />} {speaking ? "Stop" : "Speak"}
                    </button>
                  </div>
                  {m.buttons && (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 9 }}>
                      {m.buttons.map((b) => (
                        <button key={b} onClick={() => handleButton(b)}
                          style={{ padding: "6px 13px", borderRadius: 20, background: BLUE_TINT, border: `1px solid ${BLUE}20`, color: BLUE, fontSize: 11.5, fontWeight: 600, cursor: "pointer", fontFamily: FONT, transition: "background .15s" }}
                          onMouseEnter={(e) => (e.currentTarget.style.background = "#D4E6F7")}
                          onMouseLeave={(e) => (e.currentTarget.style.background = BLUE_TINT)}>
                          {b}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
            {m.from === "user" && (
              <div style={{ maxWidth: "80%" }}>
                <div style={{ background: `linear-gradient(135deg, ${BLUE}, ${BLUE_DEEP})`, borderRadius: "16px 0 16px 16px", padding: "11px 16px", fontSize: 13.5, color: "#fff", lineHeight: 1.65 }}>
                  {m.text}
                </div>
                <div style={{ textAlign: "right", fontSize: 10, color: TEXT2, marginTop: 4 }}>{m.time}</div>
              </div>
            )}
          </div>
        ))}
        {thinking && (
          <div style={{ marginBottom: 16, display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: 10, maxWidth: "86%" }}>
              <div style={{ width: 30, height: 30, borderRadius: 9, background: `linear-gradient(135deg, ${BLUE}, ${MINT})`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 2 }}>
                <Stethoscope size={14} color="#fff" />
              </div>
              <div style={{ background: "#fff", border: `1px solid ${BORDER}`, borderRadius: "0 16px 16px 16px", padding: "12px 16px", display: "flex", gap: 4, alignItems: "center", boxShadow: "0 2px 8px rgba(21,101,192,0.05)" }}>
                {[0, 1, 2].map((i) => (
                  <span key={i} style={{ width: 6, height: 6, borderRadius: "50%", background: MINT, opacity: 0.6, animation: "oc-typing-dot 1.1s ease-in-out infinite", animationDelay: `${i * 0.15}s` }} />
                ))}
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>
      <style>{`@keyframes oc-typing-dot { 0%, 60%, 100% { transform: translateY(0); opacity: 0.4; } 30% { transform: translateY(-4px); opacity: 1; } }`}</style>

      <div style={{ padding: "13px 18px 18px", background: "#fff", borderTop: `1px solid ${BORDER}`, flexShrink: 0 }}>
        <div style={{ display: "flex", gap: 9, alignItems: "flex-end" }}>
          <div style={{ flex: 1, background: BG, borderRadius: 18, border: `1.5px solid ${BORDER}`, display: "flex", alignItems: "center", gap: 6, padding: "9px 14px" }}>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleTextSend(); } }}
              placeholder="Answer, or ask me anything…"
              style={{ flex: 1, border: "none", background: "none", outline: "none", fontSize: 13.5, color: TEXT, fontFamily: FONT }}
            />
            <button onClick={toggleListen}
              style={{ background: listening ? `${BLUE}18` : "none", border: listening ? `1px solid ${BLUE}35` : "none", borderRadius: 8, padding: "5px 7px", cursor: "pointer", display: "flex" }}>
              {listening ? <Mic size={16} color={BLUE} /> : <MicOff size={16} color={TEXT2} />}
            </button>
          </div>
          <button onClick={handleTextSend} disabled={!input.trim() || thinking}
            style={{ width: 44, height: 44, borderRadius: 14, background: input.trim() && !thinking ? `linear-gradient(135deg, ${BLUE}, ${BLUE_DEEP})` : "#E8EDF2", border: "none", cursor: input.trim() && !thinking ? "pointer" : "not-allowed", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, boxShadow: input.trim() && !thinking ? `0 4px 14px ${BLUE}40` : "none" }}>
            <ArrowRight size={17} color="#fff" />
          </button>
        </div>
        <div style={{ fontSize: 10, color: TEXT2, textAlign: "center", marginTop: 9, lineHeight: 1.5 }}>
          AI assistant for guidance only · Always consult a qualified healthcare provider
        </div>
      </div>
    </div>
  );
}

export default function Component1AssistantPage() {
  const router = useRouter();
  const [result, setResult] = useState<IpeResult | null | undefined>(undefined);

  useEffect(() => {
    const r = loadResult();
    if (!r) { router.replace("/Component1/upload"); return; }
    setResult(r);
  }, [router]);

  return (
    <SidebarLayout title="AI Assistant">
      {!result ? (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", fontFamily: FONT, fontSize: 13, color: TEXT2 }}>
          Loading…
        </div>
      ) : (
        <AssistantContent result={result} />
      )}
    </SidebarLayout>
  );
}