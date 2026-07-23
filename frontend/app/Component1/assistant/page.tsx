"use client";
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";

// ── Import from your existing ipe-ui ──────────────────────────
// Adjust path if different
import {
  C, FONT, Screen, TabBar, loadResult, type IpeResult
} from "../_lib/ipe-ui";

// ── Types ─────────────────────────────────────────────────────
type Message = {
  id     : string;
  from   : "ai" | "user";
  text   : string;
  time   : string;
  buttons?: string[];
};

type Stage =
  | "greeting"
  | "symptoms_burning"
  | "symptoms_eating"
  | "symptoms_stiff"
  | "symptoms_duration"
  | "validating"
  | "advice"
  | "treatment"
  | "appointment"
  | "done";

// ── Voice helpers ─────────────────────────────────────────────
function speak(text: string, onEnd?: () => void) {
  if (!("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
  const msg    = new SpeechSynthesisUtterance(text);
  msg.rate     = 0.88;
  msg.pitch    = 1.0;
  msg.volume   = 1.0;
  if (onEnd) msg.onend = onEnd;
  window.speechSynthesis.speak(msg);
}

function stopSpeaking() {
  if ("speechSynthesis" in window) window.speechSynthesis.cancel();
}

function ppiColor(p: number) {
  if (p <= 1)   return "#00B4A0";
  if (p <= 3)   return "#7BC67E";
  if (p <= 5)   return "#FFD166";
  if (p <= 7.5) return "#F4845F";
  return "#E63946";
}

function timeNow() {
  return new Date().toLocaleTimeString("en-US", {
    hour: "2-digit", minute: "2-digit"
  });
}

// ── Main component ────────────────────────────────────────────
export default function AssistantPage() {
  const router  = useRouter();
  const [r, setR]       = useState<IpeResult | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [stage, setStage]       = useState<Stage>("greeting");
  const [listening, setListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [symptoms, setSymptoms] = useState({
    burning : false,
    eating  : false,
    stiff   : false,
    duration: "",
  });
  const [combinedScore, setCombinedScore] = useState(0);
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const recognRef = useRef<any>(null);

  // ── Load result ───────────────────────────────────────────
  useEffect(() => {
    const res = loadResult();
    if (!res) { router.replace("/Component1"); return; }
    setR(res);
  }, [router]);

  // ── Start greeting after result loads ────────────────────
  useEffect(() => {
    if (!r) return;
    setTimeout(() => startGreeting(r), 600);
  }, [r]);

  // ── Auto scroll ───────────────────────────────────────────
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ── Add message helper ────────────────────────────────────
const msgIdCounter = useRef(0);
const nextMsgId = () => {
  msgIdCounter.current += 1;
  return `${Date.now()}-${msgIdCounter.current}`;
};

const addMsg = (
  from: "ai" | "user",
  text: string,
  buttons?: string[]
) => {
  const msg: Message = {
    id     : nextMsgId(),
    from,
    text,
    time   : timeNow(),
    buttons,
  };
  setMessages(prev => [...prev, msg]);
  return msg;
};

  // ── Stage: Greeting ───────────────────────────────────────
    const startGreeting = (res: IpeResult) => {
    const ppi  = res.ppi.score;
    const name = res.classification.name;
    const text = `Hello! I have analyzed your oral image. 
Your diagnosis is ${name} with a pain score of ${ppi.toFixed(1)} out of 10. 
This is ${res.ppi.label}. 
I have a few quick questions to better understand your condition. 
Are you ready?`;

    addMsg("ai", text, ["Yes, I'm ready", "Just show me results"]);
    setIsSpeaking(true);
    speak(text, () => setIsSpeaking(false));
  };

  // ── Stage: Symptom 1 — Burning ────────────────────────────
  const askBurning = () => {
    const text = r!.visual_features.erythema > 0.5
      ? `I detected significant redness in your tissue. Are you experiencing a burning or stinging sensation in your mouth?`
      : `Are you experiencing any burning sensation in your mouth?`;
    addMsg("ai", text, ["Yes", "No", "Sometimes"]);
    setStage("symptoms_burning");
    setIsSpeaking(true);
    speak(text, () => setIsSpeaking(false));
  };

  // ── Stage: Symptom 2 — Eating pain ───────────────────────
  const askEating = () => {
    const text = r!.visual_features.ulceration > 0.3
      ? `I detected possible ulceration. Does eating or drinking cause you sharp pain?`
      : `Do you experience any pain when eating or drinking?`;
    addMsg("ai", text, ["Yes, very painful", "Mild discomfort", "No pain"]);
    setStage("symptoms_eating");
    setIsSpeaking(true);
    speak(text, () => setIsSpeaking(false));
  };

  // ── Stage: Symptom 3 — Stiffness ─────────────────────────
  const askStiff = () => {
    const text = r!.visual_features.texture > 0.4
      ? `I detected some tissue stiffness. Is your mouth feeling stiff or hard to open fully?`
      : `Is your mouth feeling stiff or restricted?`;
    addMsg("ai", text, ["Yes", "A little", "No"]);
    setStage("symptoms_stiff");
    setIsSpeaking(true);
    speak(text, () => setIsSpeaking(false));
  };

  // ── Stage: Symptom 4 — Duration ──────────────────────────
  const askDuration = () => {
    const text = "How long have you had these symptoms?";
    addMsg("ai", text, [
      "Less than 1 week",
      "1–4 weeks",
      "1–3 months",
      "More than 3 months",
    ]);
    setStage("symptoms_duration");
    setIsSpeaking(true);
    speak(text, () => setIsSpeaking(false));
  };

  // ── Stage: Validation ─────────────────────────────────────
  const validateAndAdvise = (duration: string) => {
    if (!r) return;
    setStage("validating");

    const ppi = r.ppi.score;
    let confirmed = 0;

    if (symptoms.burning && r.visual_features.erythema > 0.5) confirmed++;
    if (symptoms.eating  && r.visual_features.ulceration > 0.3) confirmed++;
    if (symptoms.stiff   && r.visual_features.texture > 0.4) confirmed++;

    const longTerm   = duration.includes("month");
    const combined   = Math.min(10, ppi * (1 + confirmed * 0.08));
    setCombinedScore(+combined.toFixed(2));

    setTimeout(() => {
      setStage("advice");

      let validation = "";
      if (confirmed >= 2) {
        validation = `Your symptoms strongly confirm the AI findings. Combined assessment score: ${combined.toFixed(1)} out of 10. High confidence in this assessment.`;
      } else if (confirmed === 1) {
        validation = `Some of your symptoms match what I detected in the image. Combined score: ${combined.toFixed(1)} out of 10.`;
      } else {
        validation = `Your reported symptoms don't fully match the visual findings. This may be early-stage or the image angle may have limited detection. Score remains ${ppi.toFixed(1)} out of 10.`;
      }

      if (longTerm) {
        validation += ` You mentioned symptoms lasting over a month — this is clinically important and warrants prompt evaluation.`;
      }

      const advice = buildAdvice(r, confirmed, duration);
      const fullText = validation + " " + advice;

      addMsg("ai", fullText, ["What should I do now?", "Treatment plan", "Book appointment"]);
      setIsSpeaking(true);
      speak(fullText, () => setIsSpeaking(false));
    }, 1500);
  };

  // ── Build personalized advice ─────────────────────────────
  const buildAdvice = (
    res: IpeResult,
    confirmed: number,
    duration: string
  ): string => {
    const ppi  = res.ppi.score;
    const cls  = res.classification.index;

    if (cls === 3) {
      return "Based on your image and symptoms, I strongly recommend seeing a specialist TODAY. Oral cancer requires immediate professional evaluation.";
    }
    if (ppi > 7 || (confirmed >= 2 && ppi > 5)) {
      return "Given your pain level and symptoms, please see your doctor within the next 1 to 2 days. Pain management and clinical evaluation are needed urgently.";
    }
    if (ppi > 4 || cls === 2) {
      return "I recommend seeing your dentist or oral medicine specialist within 2 weeks. In the meantime, avoid spicy foods and use salt water rinse.";
    }
    return "Your condition appears manageable. Monitor your symptoms and see your dentist at your next routine visit. Maintain good oral hygiene.";
  };

  // ── Treatment stage ───────────────────────────────────────
  const showTreatment = () => {
    if (!r) return;
    setStage("treatment");
    const tx   = r.treatment_plan;
    const items = [
      ...(tx.immediate  || []).slice(0, 2),
      ...(tx.short_term || []).slice(0, 2),
      ...(tx.clinical   || []).slice(0, 1),
    ];
    const text = `Here is your personalized treatment plan: ${items.join(". ")}.`;
    addMsg("ai", text, ["Download full report", "Set appointment reminder", "Done"]);
    setIsSpeaking(true);
    speak(text, () => setIsSpeaking(false));
  };

  // ── Appointment stage ─────────────────────────────────────
  const showAppointment = () => {
    if (!r) return;
    setStage("appointment");
    const text = `Based on your results, ${r.urgency.message} Your recommended timeframe is ${r.urgency.timeframe}. I have noted this for you. Would you like to download your clinical report to show your doctor?`;
    addMsg("ai", text, ["Download report", "Analyze another image", "Finish"]);
    setIsSpeaking(true);
    speak(text, () => setIsSpeaking(false));
  };

  // ── Finish stage ──────────────────────────────────────────
  const finish = () => {
    setStage("done");
    const text = "Thank you for using the IPE Framework. Take care of yourself and don't delay your clinic visit. Goodbye!";
    addMsg("ai", text);
    setIsSpeaking(true);
    speak(text, () => setIsSpeaking(false));
  };

  // ── Handle button tap ─────────────────────────────────────
  const handleButton = (btn: string) => {
    addMsg("user", btn);
    stopSpeaking();
    setIsSpeaking(false);

    const b = btn.toLowerCase();

    if (stage === "greeting") {
      if (b.includes("ready")) askBurning();
      else {
        addMsg("ai", r!.assistant_message);
        speak(r!.assistant_message);
        setStage("done");
      }
      return;
    }

    if (stage === "symptoms_burning") {
      setSymptoms(s => ({ ...s, burning: b.includes("yes") || b.includes("sometimes") }));
      askEating(); return;
    }
    if (stage === "symptoms_eating") {
      setSymptoms(s => ({ ...s, eating: b.includes("yes") || b.includes("very") }));
      askStiff(); return;
    }
    if (stage === "symptoms_stiff") {
      setSymptoms(s => ({ ...s, stiff: b.includes("yes") || b.includes("little") }));
      askDuration(); return;
    }
    if (stage === "symptoms_duration") {
      setSymptoms(s => ({ ...s, duration: btn }));
      validateAndAdvise(btn); return;
    }

    if (stage === "advice" || stage === "treatment") {
      if (b.includes("treatment"))   { showTreatment();   return; }
      if (b.includes("appointment")) { showAppointment(); return; }
      if (b.includes("report"))      { router.push("/Component1/results/report"); return; }
      if (b.includes("download"))    { router.push("/Component1/results/report"); return; }
      if (b.includes("done") || b.includes("finish")) { finish(); return; }
    }

    if (stage === "appointment") {
      if (b.includes("report") || b.includes("download")) {
        router.push("/Component1/results/report"); return;
      }
      if (b.includes("analyze")) {
        router.push("/Component1"); return;
      }
      finish(); return;
    }

    if (stage === "done") {
      router.push("/Component1"); return;
    }
  };

  // ── Voice input ───────────────────────────────────────────
  const startListening = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert("Voice input not supported in this browser. Please use Chrome.");
      return;
    }

    stopSpeaking();
    const recog = new SpeechRecognition();
    recog.lang           = "en-US";
    recog.interimResults = false;
    recog.maxAlternatives = 1;
    recognRef.current    = recog;

    recog.onstart  = () => setListening(true);
    recog.onend    = () => setListening(false);
    recog.onerror  = () => setListening(false);

    recog.onresult = (e: any) => {
      const said = e.results[0][0].transcript.trim();
      setInput("");

      // Map speech to button
      const low = said.toLowerCase();
      const lastMsg = messages[messages.length - 1];
      if (lastMsg?.buttons) {
        const match = lastMsg.buttons.find(b =>
          low.includes(b.toLowerCase().split(" ")[0]) ||
          b.toLowerCase().includes(low.split(" ")[0])
        );
        if (match) { handleButton(match); return; }
      }
      // Auto yes/no
      if (low.includes("yes") || low.includes("yeah")) handleButton("Yes");
      else if (low.includes("no"))                      handleButton("No");
      else addMsg("user", said);
    };

    recog.start();
  };

  const stopListening = () => {
    recognRef.current?.stop();
    setListening(false);
  };

  if (!r) return null;

  const ppi = r.ppi.score;
  const pc  = ppiColor(ppi);

  return (
    <div style={{
      minHeight   : "100dvh",
      background  : "#F0F4F8",
      fontFamily  : FONT,
      display     : "flex",
      justifyContent: "center",
    }}>
      <div style={{ width: "100%", maxWidth: 430, display: "flex", flexDirection: "column" }}>

        {/* ── Header ──────────────────────────────────────── */}
        <div style={{
          background   : `linear-gradient(135deg, #00B4A0, #007A6E)`,
          padding      : "env(safe-area-inset-top,44px) 20px 20px",
          position     : "relative",
          overflow     : "hidden",
          flexShrink   : 0,
        }}>
          <div style={{ position:"absolute",top:-30,right:-30,width:120,height:120,borderRadius:"50%",background:"rgba(255,255,255,0.08)",pointerEvents:"none" }}/>
          <div style={{ display:"flex", alignItems:"center", gap:12 }}>
            <button onClick={()=>router.back()} style={{ width:38,height:38,borderRadius:19,border:"none",background:"rgba(255,255,255,0.2)",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center" }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M19 12H5M12 5l-7 7 7 7" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </button>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:11,color:"rgba(255,255,255,0.7)",fontWeight:700,letterSpacing:1.2,textTransform:"uppercase" }}>AI Assistant</div>
              <div style={{ fontSize:18,fontWeight:800,color:"#fff",letterSpacing:"-0.02em" }}>IPE Health Guide</div>
            </div>
            {/* Speaking indicator */}
            <div style={{ display:"flex", alignItems:"center", gap:6, background:"rgba(255,255,255,0.15)", borderRadius:20, padding:"6px 12px" }}>
              {isSpeaking
                ? <div style={{ display:"flex",gap:3 }}>{[0,1,2].map(i=><div key={i} style={{ width:3,height:12+i*4,borderRadius:99,background:"#fff",animation:`bounce 0.6s ${i*0.15}s infinite alternate` }}/>)}</div>
                : <div style={{ width:8,height:8,borderRadius:"50%",background:stage==="done"?"#FFD166":"#7BC67E" }}/>
              }
              <span style={{ fontSize:11,color:"rgba(255,255,255,0.85)",fontWeight:600 }}>{isSpeaking?"Speaking...":stage==="done"?"Done":"Ready"}</span>
            </div>
          </div>

          {/* Mini PPI badge */}
          <div style={{ display:"flex", gap:8, marginTop:12, alignItems:"center" }}>
            <div style={{ background:"rgba(255,255,255,0.15)", borderRadius:20, padding:"4px 14px", display:"flex", alignItems:"center", gap:6 }}>
              <div style={{ width:8,height:8,borderRadius:"50%",background:pc }}/>
              <span style={{ fontSize:12,color:"#fff",fontWeight:600 }}>PPI {ppi.toFixed(1)}/10 · {r.ppi.label}</span>
            </div>
            <div style={{ background:"rgba(255,255,255,0.15)", borderRadius:20, padding:"4px 14px" }}>
              <span style={{ fontSize:12,color:"#fff",fontWeight:600 }}>{r.classification.name}</span>
            </div>
          </div>
        </div>

        {/* ── Messages ─────────────────────────────────────── */}
        <div style={{ flex:1, overflowY:"auto", padding:"16px 16px 0", display:"flex", flexDirection:"column", gap:10 }}>
          {messages.map(msg => (
            <div key={msg.id} style={{ display:"flex", flexDirection:"column", alignItems: msg.from==="user" ? "flex-end" : "flex-start" }}>
              {/* Avatar */}
              {msg.from==="ai" && (
                <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:4 }}>
                  <div style={{ width:28,height:28,borderRadius:10,background:"linear-gradient(135deg,#00B4A0,#007A6E)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14 }}>🤖</div>
                  <span style={{ fontSize:11,color:"#8FA3B1",fontWeight:600 }}>IPE Assistant · {msg.time}</span>
                </div>
              )}
              {msg.from==="user" && (
                <span style={{ fontSize:11,color:"#8FA3B1",fontWeight:600,marginBottom:4 }}>You · {msg.time}</span>
              )}

              {/* Bubble */}
              <div style={{
                maxWidth         : "85%",
                background       : msg.from==="ai" ? "#FFFFFF" : "linear-gradient(135deg,#00B4A0,#007A6E)",
                color            : msg.from==="ai" ? "#0D2137" : "#fff",
                borderRadius     : msg.from==="ai" ? "4px 18px 18px 18px" : "18px 4px 18px 18px",
                padding          : "12px 16px",
                fontSize         : 14,
                lineHeight       : 1.6,
                boxShadow        : "0 2px 12px rgba(13,33,55,0.08)",
              }}>
                {msg.text}
              </div>

              {/* Quick reply buttons */}
              {msg.buttons && msg.from==="ai" && (
                <div style={{ display:"flex", flexWrap:"wrap", gap:8, marginTop:8 }}>
                  {msg.buttons.map(btn => (
                    <button key={btn} onClick={()=>handleButton(btn)}
                      style={{
                        background  : "#fff",
                        border      : "1.5px solid rgba(0,180,160,0.4)",
                        borderRadius: 20,
                        padding     : "8px 16px",
                        fontSize    : 13,
                        fontWeight  : 600,
                        color       : "#00B4A0",
                        cursor      : "pointer",
                        fontFamily  : FONT,
                        transition  : "all 0.15s",
                        boxShadow   : "0 2px 8px rgba(13,33,55,0.06)",
                      }}
                    >
                      {btn}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}

          {/* Typing indicator */}
          {stage==="validating" && (
            <div style={{ display:"flex", alignItems:"center", gap:6 }}>
              <div style={{ width:28,height:28,borderRadius:10,background:"linear-gradient(135deg,#00B4A0,#007A6E)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14 }}>🤖</div>
              <div style={{ background:"#fff",borderRadius:"4px 18px 18px 18px",padding:"12px 18px",boxShadow:"0 2px 12px rgba(13,33,55,0.08)",display:"flex",gap:5,alignItems:"center" }}>
                {[0,1,2].map(i=>(
                  <div key={i} style={{ width:7,height:7,borderRadius:"50%",background:"#00B4A0",opacity:0.4,animation:`dotBounce 1s ${i*0.2}s infinite` }}/>
                ))}
              </div>
            </div>
          )}

          {/* Combined score card */}
          {combinedScore > 0 && stage!=="validating" && (
            <div style={{ background:"#fff",borderRadius:18,padding:16,boxShadow:"0 2px 12px rgba(13,33,55,0.08)",borderLeft:`4px solid ${ppiColor(combinedScore)}` }}>
              <div style={{ fontSize:11,color:"#8FA3B1",fontWeight:700,textTransform:"uppercase",letterSpacing:0.8,marginBottom:6 }}>Combined Assessment Score</div>
              <div style={{ display:"flex",alignItems:"flex-end",gap:8 }}>
                <span style={{ fontSize:36,fontWeight:900,color:ppiColor(combinedScore),letterSpacing:"-0.04em" }}>{combinedScore.toFixed(1)}</span>
                <span style={{ fontSize:16,color:"#8FA3B1",marginBottom:6 }}>/10</span>
                <span style={{ fontSize:13,fontWeight:600,color:ppiColor(combinedScore),marginBottom:6 }}>(AI + symptoms)</span>
              </div>
            </div>
          )}

          <div ref={bottomRef}/>
        </div>

        {/* ── Input bar ────────────────────────────────────── */}
        <div style={{
          background  : "#fff",
          borderTop   : "1px solid rgba(13,33,55,0.06)",
          padding     : "12px 16px calc(12px + env(safe-area-inset-bottom,0px))",
          display     : "flex",
          gap         : 10,
          alignItems  : "center",
          flexShrink  : 0,
        }}>
          <input
            value={input}
            onChange={e=>setInput(e.target.value)}
            onKeyDown={e=>{
              if (e.key==="Enter" && input.trim()) {
                handleButton(input.trim());
                setInput("");
              }
            }}
            placeholder="Type a response or tap 🎤"
            style={{ flex:1, background:"#F0F4F8", border:"none", borderRadius:14, padding:"11px 16px", fontSize:14, fontFamily:FONT, outline:"none", color:"#0D2137" }}
          />

          {/* Mic button */}
          <button
            onClick={listening ? stopListening : startListening}
            style={{
              width      : 46, height:46,
              borderRadius: 14,
              border     : "none",
              background : listening
                ? "linear-gradient(135deg,#E63946,#C0392B)"
                : "linear-gradient(135deg,#00B4A0,#007A6E)",
              cursor     : "pointer",
              display    : "flex",
              alignItems : "center",
              justifyContent:"center",
              flexShrink : 0,
              boxShadow  : listening ? "0 0 0 3px rgba(230,57,70,0.3)" : "0 4px 16px rgba(0,180,160,0.35)",
              transition : "all 0.2s",
            }}
          >
            {listening ? (
              <div style={{ width:14,height:14,borderRadius:2,background:"#fff" }}/>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" fill="#fff"/>
                <path d="M19 10v2a7 7 0 0 1-14 0v-2M12 19v4M8 23h8" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            )}
          </button>

          {/* Speaker toggle */}
          <button
            onClick={isSpeaking ? stopSpeaking : ()=>{}}
            style={{ width:46,height:46,borderRadius:14,border:"none",background:isSpeaking?"rgba(230,57,70,0.1)":"rgba(13,33,55,0.05)",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0 }}
          >
            {isSpeaking ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <rect x="6" y="4" width="4" height="16" rx="2" fill="#E63946"/>
                <rect x="14" y="4" width="4" height="16" rx="2" fill="#E63946"/>
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M11 5L6 9H2v6h4l5 4V5z" fill="#8FA3B1"/>
                <path d="M19.07 4.93a10 10 0 010 14.14M15.54 8.46a5 5 0 010 7.07" stroke="#8FA3B1" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* ── Animations ─────────────────────────────────────── */}
      <style>{`
        @keyframes bounce {
          from { transform: scaleY(0.5); opacity: 0.5; }
          to   { transform: scaleY(1.2); opacity: 1;   }
        }
        @keyframes dotBounce {
          0%,80%,100% { transform: scale(0); opacity: 0.3; }
          40%          { transform: scale(1); opacity: 1;   }
        }
      `}</style>
    </div>
  );
}