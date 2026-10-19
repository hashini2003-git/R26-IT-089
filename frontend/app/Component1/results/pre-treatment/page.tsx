"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, ChevronRight, Pause, Play, ShieldCheck, Timer } from "lucide-react";
import { GlassCard, PageContainer, DetailHeader, SidebarLayout, BLUE, MINT, NAVY, TEXT2 } from "../_shell";
import styles from "./pre-treatment.module.css";

type Movement = "jaw-open" | "jaw-side" | "neck-turn";
type LightActivity = "walking" | "gentle";
type PageMode = "physiotherapy" | "body" | null;

const movements: { id: Movement; title: string; shortCue: string; area: string; detail: string }[] = [
  { id: "jaw-open", title: "Open and close jaw", shortCue: "Gently open, then return to your starting position.", area: "Jaw", detail: "Jaw opening" },
  { id: "jaw-side", title: "Move jaw side to side", shortCue: "Move gently to one side, return, then the other side.", area: "Jaw", detail: "Jaw side-to-side" },
  { id: "neck-turn", title: "Turn head gently", shortCue: "Turn within the comfortable range your clinician showed you.", area: "Neck", detail: "Neck turning" },
];

function MovementIllustration({ movement, playing }: { movement: Movement; playing: boolean }) {
  const movementClass = movement === "jaw-open" ? styles.jawOpen : movement === "jaw-side" ? styles.jawSide : styles.neckTurn;
  return (
    <div className={`${styles.illustration} ${movementClass} ${playing ? styles.playing : ""}`}>
      <svg viewBox="0 0 240 190" role="img" aria-label={`Animated illustration: ${movements.find((item) => item.id === movement)?.detail}`}>
        <path d="M37 175c8-28 27-42 56-47m54 0c29 5 48 19 56 47" fill="none" stroke="#B6D2E5" strokeWidth="16" strokeLinecap="round" />
        <path d="M100 127v21m40-21v21" fill="none" stroke="#8DB2CC" strokeWidth="12" strokeLinecap="round" />
        <g className={styles.head}>
          <ellipse cx="120" cy="75" rx="51" ry="59" fill="#F4D6C3" stroke="#7A9AB1" strokeWidth="3" />
          <path d="M73 70c3-38 23-58 49-58 30 0 48 21 50 54-12-7-19-18-23-29-15 17-40 25-76 25" fill="#233D59" />
          <ellipse cx="101" cy="75" rx="4" ry="3" fill="#233D59" />
          <ellipse cx="139" cy="75" rx="4" ry="3" fill="#233D59" />
          <path d="M119 79l-5 14h9" fill="none" stroke="#B17E6D" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M103 103c10 5 24 5 34 0" fill="none" stroke="#B17E6D" strokeWidth="3" strokeLinecap="round" />
          <path d="M105 105q15 8 30 0l-3 8q-12 5-24 0z" fill="#9B5B61" opacity="0.72" />
          <g className={styles.jaw}>
            <path d="M83 104c5 24 18 34 37 34s32-10 37-34" fill="#F4D6C3" stroke="#7A9AB1" strokeWidth="3" strokeLinejoin="round" />
          </g>
        </g>
      </svg>
      <div className={styles.motionLabel}>{playing ? "Follow the movement on screen" : "Paused"}</div>
    </div>
  );
}

function ActivityIllustration({ activity, playing }: { activity: LightActivity; playing: boolean }) {
  if (activity === "gentle") {
    return (
      <div className={`${styles.illustration} ${playing ? styles.seatedActivityPlaying : ""}`}>
        <svg viewBox="0 0 240 190" role="img" aria-label="Animated illustration of a person seated and gently moving">
          <path d="M34 160h172" stroke="#B6D2E5" strokeWidth="5" strokeLinecap="round" />
          <path d="M78 67v54h83M78 120h83m-74 0v39m65-39v39" fill="none" stroke="#8DB2CC" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M97 118h48" stroke="#B6D2E5" strokeWidth="5" strokeLinecap="round" />
          <g className={styles.seatFootLeft}><path d="M94 119v29h15" fill="none" stroke="#233D59" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" /></g>
          <g className={styles.seatFootRight}><path d="M146 119v29h-15" fill="none" stroke="#233D59" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" /></g>
          <path d="M108 105 94 119M132 105 146 119" fill="none" stroke="#233D59" strokeWidth="11" strokeLinecap="round" />
          <path d="M104 62q16-8 32 0l8 45q-24 9-48 0z" fill="#0D9488" />
          <circle cx="120" cy="39" r="17" fill="#F4D6C3" stroke="#7A9AB1" strokeWidth="3" />
          <path d="M103 39q2-18 18-18 14 0 17 16-12-7-19-13-5 8-16 15" fill="#233D59" />
          <g className={styles.seatArmLeft}><path d="M105 68 90 86 94 103" fill="none" stroke="#7A9AB1" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" /></g>
          <g className={styles.seatArmRight}><path d="m135 68 15 18-4 17" fill="none" stroke="#7A9AB1" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" /></g>
        </svg>
        <div className={styles.motionLabel}>{playing ? "Lift your arms gently and tap your feet while seated" : "Activity paused"}</div>
      </div>
    );
  }
  return (
    <div className={`${styles.illustration} ${playing ? styles.activityPlaying : ""}`}>
      <svg viewBox="0 0 240 190" role="img" aria-label="Side view illustration of a person walking gently">
        <path d="M34 157h172" stroke="#B6D2E5" strokeWidth="5" strokeLinecap="round" />
        <g className={styles.walker}>
          <g className={styles.walkLegLeft} fill="none" stroke="#233D59" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round">
            <path d="m117 105-8 24" />
            <g className={styles.walkShinLeft}>
              <path d="m109 129-12 21-12 2" />
            </g>
          </g>
          <g className={styles.walkLegRight} fill="none" stroke="#354E62" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round">
            <path d="m123 105 9 24" />
            <g className={styles.walkShinRight}>
              <path d="m132 129 13 20 12 1" />
            </g>
          </g>
          <path d="M110 64q12-5 23 2l7 41q-18 8-37 0l4-34z" fill="#0D9488" />
          <g className={styles.walkArmLeft} fill="none" stroke="#8DB2CC" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round">
            <path d="m111 70-10 17 5 13" />
          </g>
          <g className={styles.walkArmRight} fill="none" stroke="#7A9AB1" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round">
            <path d="m132 70 11 16-5 14" />
          </g>
          <path d="M108 43c-2-13 5-23 16-23 12 0 19 9 17 21l-2 13c-2 9-8 14-17 13-9-1-14-8-14-17z" fill="#F4D6C3" stroke="#7A9AB1" strokeWidth="2.5" />
          <path d="M108 43c-1-14 6-24 18-24 10 0 17 6 18 17-5-1-8-5-10-9-6 5-15 7-25 7z" fill="#233D59" />
          <path d="m139 45 7 3-7 3" fill="#F4D6C3" stroke="#7A9AB1" strokeWidth="2" strokeLinejoin="round" />
          <circle cx="136" cy="42" r="1.8" fill="#233D59" />
        </g>
      </svg>
      <div className={styles.motionLabel}>{playing ? "Move at a comfortable pace" : "Activity paused"}</div>
    </div>
  );
}

export default function PreTreatmentSupportPage() {
  const router = useRouter();
  const [chosen, setChosen] = useState<Movement[]>([]);
  const [session, setSession] = useState(false);
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [complete, setComplete] = useState(false);
  const [sessionSeconds, setSessionSeconds] = useState(0);
  const [targetMinutes, setTargetMinutes] = useState<number | null>(null);
  const [customDuration, setCustomDuration] = useState("");
  const [customDurationOpen, setCustomDurationOpen] = useState(false);
  const [prescribedMovements, setPrescribedMovements] = useState<Movement[] | null>(null);
  const [lightActivity, setLightActivity] = useState<LightActivity | null>(null);
  const [activityTargetMinutes, setActivityTargetMinutes] = useState<number | null>(null);
  const [pageMode, setPageMode] = useState<PageMode>(null);
  const selectedMovement = movements.find((movement) => movement.id === chosen[step]);
  const selectedMinutes = lightActivity ? activityTargetMinutes : targetMinutes;
  const targetSeconds = selectedMinutes === null ? null : selectedMinutes * 60;
  const remainingSeconds = targetSeconds === null ? null : Math.max(0, targetSeconds - sessionSeconds);
  const timerReached = targetSeconds !== null && sessionSeconds >= targetSeconds;

  useEffect(() => {
    if (!session || complete || !playing) return;
    const interval = window.setInterval(() => {
      setSessionSeconds((seconds) => seconds + 1);
    }, 1000);
    return () => window.clearInterval(interval);
  }, [session, complete, playing]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const mode = params.get("mode");
    if (mode === "physiotherapy" || mode === "body") setPageMode(mode);
    const raw = params.get("prescribed");
    if (!raw) return;
    const valid = raw.split(",").filter((item): item is Movement => movements.some((movement) => movement.id === item));
    if (valid.length) { setPrescribedMovements(valid); setChosen(valid); }
  }, []);

  function formatTime(totalSeconds: number) {
    const minutes = Math.floor(totalSeconds / 60).toString().padStart(2, "0");
    const seconds = (totalSeconds % 60).toString().padStart(2, "0");
    return `${minutes}:${seconds}`;
  }

  function toggleMovement(id: Movement) {
    setChosen((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  }

  function startSession() {
    setLightActivity(null);
    setComplete(false);
    setStep(0);
    setSessionSeconds(0);
    setSession(true);
    setPlaying(true);
  }

  function startLightActivity() {
    if (!lightActivity) return;
    setComplete(false);
    setStep(0);
    setSessionSeconds(0);
    setSession(true);
    setPlaying(true);
  }

  function finishLightActivity() {
    setPlaying(false);
    setComplete(true);
  }

  function completeStep() {
    if (step + 1 < chosen.length) {
      setStep((current) => current + 1);
      setPlaying(true);
    } else {
      setPlaying(false);
      setComplete(true);
    }
  }

  function leaveSession() {
    setPlaying(false);
    setSession(false);
    setComplete(false);
    setSessionSeconds(0);
    setLightActivity(null);
  }

  function finishAndReturn() {
    if (pageMode) {
      router.push("/Component1/results");
      return;
    }
    leaveSession();
  }

  return (
    <SidebarLayout title="Guided movement">
      <PageContainer>
        <DetailHeader
          eyebrow="Patient movement session"
          title={session ? (complete ? "Session complete" : "Follow along") : pageMode === "body" ? "Body guided movement" : pageMode === "physiotherapy" ? "Physiotherapy movements" : "Physiotherapy and guided movement"}
          subtitle={session ? undefined : pageMode === "body" ? "Choose a gentle activity and follow along at your own pace." : pageMode === "physiotherapy" ? "Choose only the movements your care team prescribed." : "Start with prescribed physiotherapy movements, then explore gentle body movement below."}
        />

        {!session ? (
          <>
            {pageMode !== "body" && <>
            <GlassCard style={{ marginBottom: 16, borderLeft: "4px solid #0D9488" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 7 }}>
                <ShieldCheck size={18} color={MINT} />
                <strong style={{ fontSize: 13, color: NAVY }}>Use this only for movements prescribed for you</strong>
              </div>
              <p style={{ fontSize: 12, color: TEXT2, lineHeight: 1.55, margin: 0 }}>
                A lesion result does not mean you need physiotherapy. Ask your care team which movements, if any, are right for you.
              </p>
            </GlassCard>

            <GlassCard style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: .8, textTransform: "uppercase", color: MINT, marginBottom: 6 }}>Physiotherapy movements</div>
              <h2 style={{ fontSize: 16, color: NAVY, margin: "0 0 5px" }}>What did your clinician ask you to practice?</h2>
              <p style={{ fontSize: 12, color: TEXT2, lineHeight: 1.5, margin: "0 0 14px" }}>{prescribedMovements ? "Your clinician selected these movements for you." : "Tap each movement your care team prescribed. Choose one or more."}</p>
              <div className={styles.selectList}>
                {movements.filter((movement) => !prescribedMovements || prescribedMovements.includes(movement.id)).map((movement) => {
                  const checked = chosen.includes(movement.id);
                  return (
                    <button key={movement.id} type="button" aria-pressed={checked} onClick={() => toggleMovement(movement.id)} className={`${styles.selectMovement} ${checked ? styles.selectMovementActive : ""}`}>
                      <span className={styles.selectCheck}>{checked && <Check size={15} />}</span>
                      <span className={styles.selectText}><strong>{movement.title}</strong><small>{movement.area}</small></span>
                      <ChevronRight size={16} color={checked ? BLUE : "#90A4B4"} />
                    </button>
                  );
                })}
              </div>
              <div className={styles.durationPicker}>
                <div className={styles.durationTitle}>How much time did your care team suggest?</div>
                <p>Choose their recommended time, or use elapsed time only. Five minutes is an optional timer preset, not a medical recommendation.</p>
                <div className={styles.durationOptions}>
                  <button type="button" aria-pressed={targetMinutes === null && !customDurationOpen} onClick={() => { setTargetMinutes(null); setCustomDurationOpen(false); }} className={`${styles.durationOption} ${targetMinutes === null && !customDurationOpen ? styles.durationOptionActive : ""}`}>
                    Elapsed only
                  </button>
                  <button type="button" aria-pressed={targetMinutes === 5} onClick={() => { setTargetMinutes(5); setCustomDurationOpen(false); }} className={`${styles.durationOption} ${targetMinutes === 5 ? styles.durationOptionActive : ""}`}>
                    5 minutes
                  </button>
                  <button type="button" aria-pressed={customDurationOpen} onClick={() => setCustomDurationOpen(true)} className={`${styles.durationOption} ${customDurationOpen ? styles.durationOptionActive : ""}`}>
                    Set my time
                  </button>
                </div>
                {customDurationOpen && <div className={styles.customDuration}>
                  <label htmlFor="session-duration">Time recommended for your session</label>
                  <div>
                    <input id="session-duration" type="number" min="1" max="120" step="1" inputMode="numeric" placeholder="e.g. 8" value={customDuration} onChange={(event) => setCustomDuration(event.target.value)} />
                    <span>minutes</span>
                    <button type="button" disabled={!customDuration || !Number.isInteger(Number(customDuration)) || Number(customDuration) < 1 || Number(customDuration) > 120} onClick={() => { setTargetMinutes(Number(customDuration)); setCustomDurationOpen(false); }} className={styles.applyDuration}>Apply</button>
                  </div>
                </div>}
              </div>
              {chosen.length > 0 && <button type="button" onClick={startSession} className={styles.startButton}>
                <Play size={17} fill="currentColor" /> Start task
              </button>}
              {chosen.length === 0 && <div className={styles.startHint}>Choose a movement to show the start button.</div>}
            </GlassCard>

            </>}
            {pageMode !== "physiotherapy" && <GlassCard style={{ marginBottom: 16, borderLeft: "4px solid #1565C0" }}>
              <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: .8, textTransform: "uppercase", color: BLUE, marginBottom: 6 }}>Body guided movement</div>
              <h2 style={{ fontSize: 17, color: NAVY, margin: "0 0 5px" }}>A simple way to stay gently active</h2>
              <p style={{ fontSize: 12, color: TEXT2, lineHeight: 1.55, margin: "-1px 0 8px" }}>Walking and light activity</p>
              <p style={{ fontSize: 12, color: TEXT2, lineHeight: 1.55, margin: "0 0 12px" }}>Choose an easy activity and follow the timer at your own pace. This is a guide, not a treatment prescription.</p>
              <div className={styles.selectList}>
                <button type="button" aria-pressed={lightActivity === "walking"} onClick={() => setLightActivity("walking")} className={`${styles.selectMovement} ${lightActivity === "walking" ? styles.selectMovementActive : ""}`}><span className={styles.selectCheck}>{lightActivity === "walking" && <Check size={15} />}</span><span className={styles.selectText}><strong>Comfortable walk</strong><small>Choose a safe, even route or walk indoors.</small></span><ChevronRight size={16} color={lightActivity === "walking" ? BLUE : "#90A4B4"} /></button>
                <button type="button" aria-pressed={lightActivity === "gentle"} onClick={() => setLightActivity("gentle")} className={`${styles.selectMovement} ${lightActivity === "gentle" ? styles.selectMovementActive : ""}`}><span className={styles.selectCheck}>{lightActivity === "gentle" && <Check size={15} />}</span><span className={styles.selectText}><strong>Gentle seated movement</strong><small>Sit comfortably and follow the gentle arm and foot motion.</small></span><ChevronRight size={16} color={lightActivity === "gentle" ? BLUE : "#90A4B4"} /></button>
              </div>
              <div className={styles.durationPicker}>
                <div className={styles.durationTitle}>Optional timer</div>
                <p>Use the time your care team suggested, or choose elapsed time. Timer choices are not exercise recommendations.</p>
                <div className={styles.durationOptions}>{[null, 5, 10].map((minutes) => <button key={minutes ?? "elapsed"} type="button" aria-pressed={activityTargetMinutes === minutes} onClick={() => setActivityTargetMinutes(minutes)} className={`${styles.durationOption} ${activityTargetMinutes === minutes ? styles.durationOptionActive : ""}`}>{minutes === null ? "Elapsed only" : `${minutes} min timer`}</button>)}</div>
              </div>
              {lightActivity && <button type="button" onClick={startLightActivity} className={styles.startButton}><Play size={17} fill="currentColor" /> Start task</button>}
              {!lightActivity && <div className={styles.startHint}>Choose an activity to show the start button.</div>}
              <p style={{ fontSize: 11, color: TEXT2, lineHeight: 1.55, margin: "12px 0 0" }}>Check with your care team if you are unsure this activity is right for you, and follow any limits they gave you.</p>
              <p style={{ fontSize: 11, color: TEXT2, lineHeight: 1.55, margin: "12px 0 0" }}>Stop and rest if you feel pain, dizziness, unusual shortness of breath, or feel unwell. Contact your care team if symptoms concern you.</p>
            </GlassCard>}

            <details className={styles.moreInfo}>
              <summary>What is pre-treatment support?</summary>
              <div className={styles.detailsContent}>
                <p>It can include checking your movement and daily function, setting goals, planning activity and recovery, and coordinating support. Exercises are only one part, and are not suitable for everyone.</p>
                <p>A physiotherapist may help with movement, activity, and recovery. A speech and language therapist may assess speech or swallowing and advise on exercises for those areas. The team and support depend on the planned treatment.</p>
                <p>A precancerous lesion does not automatically mean cancer, surgery, radiotherapy, or physiotherapy. Your clinician will explain your diagnosis and options.</p>
              </div>
            </details>
          </>
        ) : complete ? (
          <GlassCard style={{ textAlign: "center", padding: "36px 22px" }}>
            <div className={styles.completeIcon}><Check size={26} /></div>
            <h2 style={{ color: NAVY, fontSize: 21, margin: "12px 0 7px" }}>You’ve reached the end of this session</h2>
            <p style={{ color: TEXT2, fontSize: 13, lineHeight: 1.6, maxWidth: 460, margin: "0 auto 8px" }}>{lightActivity ? "Take a moment to rest and notice how you feel. Follow any activity limits from your care team." : "Follow the pace and repetitions your care team gave you. Stop if you feel pain or your symptoms worsen."}</p>
            <div className={styles.completionTime}><Timer size={15} /> Time spent: {formatTime(sessionSeconds)}{selectedMinutes !== null ? ` · Timer set: ${selectedMinutes}:00` : ""}</div>
            <button type="button" onClick={finishAndReturn} className={styles.startButton}>{pageMode ? "Return to analysis results" : "Finish session"}</button>
          </GlassCard>
        ) : lightActivity ? (
          <GlassCard style={{ maxWidth: 760, margin: "0 auto" }}>
            <div className={styles.sessionTop}><span>{lightActivity === "walking" ? "Comfortable walking" : "Gentle home movement"}</span><div className={styles.sessionTopActions}><span className={styles.timerPill}><Timer size={14} /> {remainingSeconds === null ? `Elapsed ${formatTime(sessionSeconds)}` : `Left ${formatTime(remainingSeconds)}`}</span><button type="button" onClick={leaveSession} className={styles.exitButton}>End session</button></div></div>
            <div className={styles.progressTrack} aria-label="Activity session progress"><div style={{ width: `${targetSeconds ? Math.min(100, (sessionSeconds / targetSeconds) * 100) : 0}%` }} /></div>
            <div className={styles.sessionTitle}><small>Move at your own pace</small><h2>{lightActivity === "walking" ? "Take a comfortable walk" : "Gentle seated movement"}</h2><p>{lightActivity === "walking" ? "Walk slowly enough to talk comfortably. Rest whenever you need." : "Sit in a stable chair and follow the gentle seated motion shown. Stay within a comfortable range."}</p></div>
            <ActivityIllustration activity={lightActivity} playing={playing} />
            <div className={styles.sessionInstruction}>{timerReached ? "Your optional timer is up. You can finish now or stop whenever you need." : "Keep the effort easy. This session timer tracks time; it does not measure your fitness."} Stop and rest if you feel unwell.</div>
            <div className={styles.sessionControls}><button type="button" onClick={() => setPlaying((value) => !value)} className={styles.pauseButton}>{playing ? <Pause size={17} /> : <Play size={17} fill="currentColor" />}{playing ? "Pause" : "Resume timer"}</button><button type="button" onClick={finishLightActivity} className={styles.nextButton}>Finish activity <Check size={16} /></button></div>
          </GlassCard>
        ) : selectedMovement ? (
          <GlassCard style={{ maxWidth: 760, margin: "0 auto" }}>
            <div className={styles.sessionTop}>
              <span>Movement {step + 1} of {chosen.length}</span>
              <div className={styles.sessionTopActions}>
                <span className={styles.timerPill}><Timer size={14} /> {remainingSeconds === null ? `Elapsed ${formatTime(sessionSeconds)}` : `Left ${formatTime(remainingSeconds)}`}</span>
                <button type="button" onClick={leaveSession} className={styles.exitButton}>End session</button>
              </div>
            </div>
            <div className={styles.progressTrack} aria-label={`Movement ${step + 1} of ${chosen.length}`}>
              <div style={{ width: `${((step + 1) / chosen.length) * 100}%` }} />
            </div>
            <div className={styles.sessionTitle}>
              <small>{selectedMovement.area}</small>
              <h2>{selectedMovement.title}</h2>
              <p>{selectedMovement.shortCue}</p>
            </div>
            <MovementIllustration movement={selectedMovement.id} playing={playing} />
            <div className={styles.sessionInstruction}>
              {timerReached ? "Your timer is up. Follow your care team’s instructions to finish; the app won’t end the task automatically." : "Follow your care team’s pace and repetitions. Stop if you feel pain or symptoms worsen."}
            </div>
            <div className={styles.sessionControls}>
              <button type="button" onClick={() => setPlaying((value) => !value)} className={styles.pauseButton}>
                {playing ? <Pause size={17} /> : <Play size={17} fill="currentColor" />}
                {playing ? "Pause" : "Resume animation"}
              </button>
              <button type="button" onClick={completeStep} className={styles.nextButton}>
                {step + 1 === chosen.length ? "Finish session" : "Done · Next movement"} <ChevronRight size={17} />
              </button>
            </div>
          </GlassCard>
        ) : null}
      </PageContainer>
    </SidebarLayout>
  );
}
