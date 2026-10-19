"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Header from "../../components/Header";
import { getPatient, isLoggedIn } from "../../lib/auth";
import { CarePlan, connectCarePatient, fetchCarePatientRecords, fetchCarePatients, fetchMe, fetchMyCarePlan, LesionRecord, saveCarePlan } from "../../lib/api";

const blankPlan: CarePlan = { diagnosis_status: "awaiting_confirmation", diagnosis: "", stage: "", treatment_type: "", treatment_status: "not_planned", next_appointment: "", instructions: "", tasks: [], movement_ids: [] };
const field: React.CSSProperties = { width: "100%", padding: "11px 13px", borderRadius: 12, border: "1px solid #D8E3EE", background: "white", color: "#183047", outlineColor: "#1565C0" };

export default function DoctorCarePage() {
  const router = useRouter();
  const [doctorName, setDoctorName] = useState("Doctor");
  const [patients, setPatients] = useState<{ patient_id: string; patient_name: string; plan: CarePlan | null; acknowledged_at?: string | null; latest_upload_at?: string | null; photo_reminder_date?: string | null; has_new_upload?: boolean }[]>([]);
  const [selected, setSelected] = useState("");
  const [plan, setPlan] = useState<CarePlan>(blankPlan);
  const [code, setCode] = useState("");
  const [taskText, setTaskText] = useState("");
  const [records, setRecords] = useState<LesionRecord[]>([]);
  const [recordsLoading, setRecordsLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function refresh(preselect?: string) {
    const rows = await fetchCarePatients(); setPatients(rows);
    const id = preselect ?? (rows.some((item) => item.patient_id === selected) ? selected : "");
    setSelected(id);
    const row = rows.find((item) => item.patient_id === id);
    setPlan(row?.plan ? { ...blankPlan, ...row.plan } : blankPlan);
    setTaskText(row?.plan?.tasks?.map((task) => task.title).join("\n") ?? "");
    if (preselect && id) await loadRecords(id);
    else setRecords([]);
  }
  async function loadRecords(patientId: string) {
    setRecordsLoading(true);
    setRecords([]);
    try {
      const result = await fetchCarePatientRecords(patientId); setRecords(result.records);
      setPatients((current) => current.map((patient) => patient.patient_id === patientId ? { ...patient, has_new_upload: false } : patient));
    }
    catch (error) { setRecords([]); setMessage(error instanceof Error ? error.message : "Could not load patient records."); }
    finally { setRecordsLoading(false); }
  }
  useEffect(() => { if (!isLoggedIn()) { router.push("/login"); return; } if (getPatient()?.role !== "doctor") { router.push("/home"); return; }
    fetchMe().then((me) => setDoctorName(me.name)).catch(() => {}); refresh().catch((e) => setMessage(e.message));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  async function connect() {
    setBusy(true); setMessage("");
    try { const patient = await connectCarePatient(code); setCode(""); setMessage(`Connected to ${patient.patient_name}.`); await refresh(patient.patient_id); }
    catch (error) { setMessage(error instanceof Error ? error.message : "Could not connect."); } finally { setBusy(false); }
  }
  async function save() {
    if (!selected) return; setBusy(true); setMessage("");
    try { const updated = await saveCarePlan(selected, { ...plan, tasks: taskText.split("\n").map((title) => title.trim()).filter(Boolean).map((title) => ({ title, category: "Care step" })) }); setPlan(updated); setMessage("Care plan saved and shared with the patient."); await refresh(selected); }
    catch (error) { setMessage(error instanceof Error ? error.message : "Could not save the plan."); } finally { setBusy(false); }
  }
  const change = <K extends keyof CarePlan>(key: K, value: CarePlan[K]) => setPlan((current) => ({ ...current, [key]: value }));
  const priorRecord = records[1];
  const ppiChange = records[0] && priorRecord ? records[0].result.ppi.score - priorRecord.result.ppi.score : null;

  return <div className="min-h-screen" style={{ background: "#F3F7FB", color: "#183047" }}>
    <Header variant="light" user={{ name: doctorName, patientId: getPatient()?.patient_id ?? "" }} />
    <main style={{ maxWidth: 1100, margin: "0 auto", padding: "92px 22px 48px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 14, alignItems: "end", marginBottom: 24 }}>
        <div><p style={{ color: "#0D9488", fontWeight: 700, letterSpacing: 1, fontSize: 12 }}>CLINICIAN WORKSPACE</p><h1 style={{ fontSize: 32, fontWeight: 750, marginTop: 6 }}>Patient uploads and care plans</h1><p style={{ color: "#63788A", marginTop: 6 }}>New patient photos are flagged here for review. Open a patient's record to view the image and analysis.</p></div>
        <Link href="/Component1" style={{ color: "#1565C0", fontWeight: 650 }}>Open lesion analysis →</Link>
      </div>
        <section style={{ background: "white", borderRadius: 18, padding: 20, border: "1px solid #DCE7F0", marginBottom: 20 }}>
        <h2 style={{ fontWeight: 700, fontSize: 18 }}>Connect a patient</h2><p style={{ color: "#63788A", fontSize: 14, margin: "5px 0 14px" }}>Ask the patient to create a one-time code from the Photo follow-up card on their lesion-analysis dashboard. It expires after 15 minutes. Connected uploads are flagged here for your review.</p>
        <div style={{ display: "flex", gap: 10, maxWidth: 470 }}><input aria-label="Patient sharing code" inputMode="numeric" maxLength={6} placeholder="6-digit patient code" value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))} style={{ ...field, letterSpacing: 3, fontSize: 18 }} /><button disabled={busy || code.length !== 6} onClick={connect} style={{ whiteSpace: "nowrap", background: "#1565C0", color: "white", border: 0, borderRadius: 12, padding: "0 18px", fontWeight: 700, opacity: code.length !== 6 ? .5 : 1 }}>Connect</button></div>
      </section>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 340px), 1fr))", gap: 20 }}>
        <section style={{ background: "white", borderRadius: 18, padding: 18, border: "1px solid #DCE7F0", alignSelf: "start" }}><div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}><h2 style={{ fontWeight: 700, marginBottom: 12 }}>Connected patients</h2><button disabled={busy} onClick={() => refresh().catch((e) => setMessage(e.message))} style={{ border: "1px solid #D8E3EE", borderRadius: 9, background: "white", color: "#1565C0", padding: "7px 10px", fontWeight: 650 }}>{busy ? "Refreshing..." : "Refresh"}</button></div>{patients.length ? patients.map((patient) => <button key={patient.patient_id} onClick={() => { setSelected(patient.patient_id); setPlan(patient.plan ? { ...blankPlan, ...patient.plan } : blankPlan); setTaskText(patient.plan?.tasks?.map((task) => task.title).join("\n") ?? ""); void loadRecords(patient.patient_id); }} style={{ display: "block", width: "100%", textAlign: "left", border: selected === patient.patient_id ? "1px solid #1565C0" : "1px solid #E6EDF3", background: selected === patient.patient_id ? "#EFF6FF" : "white", borderRadius: 12, padding: 12, marginTop: 9 }}><strong>{patient.patient_name}</strong>{patient.has_new_upload && <span style={{ float: "right", borderRadius: 99, background: "#FFF0D5", color: "#9A5B00", padding: "4px 8px", fontSize: 10, fontWeight: 750 }}>NEW PHOTO</span>}<small style={{ display: "block", color: "#718497", marginTop: 5 }}>{patient.patient_id} · {patient.photo_reminder_date ? `Photo reminder: ${patient.photo_reminder_date}` : "Photo reminder not set"}</small>{patient.latest_upload_at && <small style={{ display: "block", color: patient.has_new_upload ? "#9A5B00" : "#718497", marginTop: 3 }}>{patient.has_new_upload ? "New photo to review · " : "Latest photo · "}{new Date(patient.latest_upload_at).toLocaleDateString()}</small>}</button>) : <p style={{ color: "#718497", fontSize: 14 }}>No connected patients yet.</p>}</section>
        <section style={{ background: "white", borderRadius: 18, padding: 22, border: "1px solid #DCE7F0" }}><h2 style={{ fontWeight: 700, fontSize: 20, marginBottom: 5 }}>Clinical plan</h2><p style={{ fontSize: 13, color: "#63788A", marginBottom: 18 }}>Only enter diagnosis, stage and treatment confirmed in your clinical review. The image analysis does not fill these fields.</p>
          {!selected ? <div style={{ padding: 26, background: "#F5F8FB", borderRadius: 12, color: "#63788A" }}>Connect or select a patient to write their plan.</div> : <>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(190px,1fr))", gap: 12 }}>
              <label style={{ fontSize: 13, fontWeight: 650 }}>Diagnosis status<select value={plan.diagnosis_status} onChange={(e) => change("diagnosis_status", e.target.value as CarePlan["diagnosis_status"])} style={{ ...field, display: "block", marginTop: 6 }}><option value="awaiting_confirmation">Awaiting confirmation / tests</option><option value="confirmed">Confirmed by care team</option></select></label>
              <label style={{ fontSize: 13, fontWeight: 650 }}>Diagnosis<input value={plan.diagnosis} onChange={(e) => change("diagnosis", e.target.value)} placeholder="e.g. Add after confirmation" style={{ ...field, display: "block", marginTop: 6 }} /></label>
              <label style={{ fontSize: 13, fontWeight: 650 }}>Stage (if confirmed)<input value={plan.stage} onChange={(e) => change("stage", e.target.value)} placeholder="Leave blank if not established" style={{ ...field, display: "block", marginTop: 6 }} /></label>
              <label style={{ fontSize: 13, fontWeight: 650 }}>Treatment plan<select value={plan.treatment_type} onChange={(e) => change("treatment_type", e.target.value)} style={{ ...field, display: "block", marginTop: 6 }}><option value="">Not decided</option><option>Surgery</option><option>Radiotherapy</option><option>Systemic treatment</option><option>Combined treatment</option><option>Monitoring / further tests</option><option>Other</option></select></label>
              <label style={{ fontSize: 13, fontWeight: 650 }}>Treatment status<select value={plan.treatment_status} onChange={(e) => change("treatment_status", e.target.value)} style={{ ...field, display: "block", marginTop: 6 }}><option value="not_planned">Not planned yet</option><option value="discussing">Discussing options</option><option value="preparation">Preparing</option><option value="scheduled">Scheduled</option><option value="in_progress">In progress</option><option value="completed">Completed</option></select></label>
              <label style={{ fontSize: 13, fontWeight: 650 }}>Next appointment<input type="datetime-local" value={plan.next_appointment} onChange={(e) => change("next_appointment", e.target.value)} style={{ ...field, display: "block", marginTop: 6 }} /></label>
            </div>
            <label style={{ display: "block", fontSize: 13, fontWeight: 650, marginTop: 15 }}>Your instructions<textarea rows={4} value={plan.instructions} onChange={(e) => change("instructions", e.target.value)} placeholder="Explain what happens next, who to contact, and any personalized preparation." style={{ ...field, display: "block", resize: "vertical", marginTop: 6 }} /></label>
            <label style={{ display: "block", fontSize: 13, fontWeight: 650, marginTop: 15 }}>Patient next steps <span style={{ fontWeight: 400, color: "#718497" }}>(one short task per line)</span><textarea rows={4} value={taskText} onChange={(e) => setTaskText(e.target.value)} placeholder={"Book pre-treatment dental review\nBring medication list to appointment\nPractise clinician-approved jaw movement"} style={{ ...field, display: "block", resize: "vertical", marginTop: 6 }} /></label>
            {!!plan.tasks?.length && <div style={{ marginTop: 10, padding: 13, borderRadius: 11, background: "#F3F8FB" }}><strong style={{ fontSize: 13 }}>Patient checklist progress</strong><p style={{ color: "#63788A", fontSize: 12, marginTop: 4 }}>{plan.tasks.filter((task) => task.completed).length} of {plan.tasks.length} steps completed</p>{plan.tasks.map((task, index) => <div key={task.task_id ?? `${task.title}-${index}`} style={{ display: "flex", alignItems: "center", gap: 8, paddingTop: 7, fontSize: 13, color: task.completed ? "#0D766E" : "#52697A" }}><span aria-hidden="true">{task.completed ? "✓" : "○"}</span><span>{task.title}</span></div>)}</div>}
            <fieldset style={{ marginTop: 16, border: "1px solid #E0EAF1", borderRadius: 12, padding: 14 }}><legend style={{ fontSize: 13, fontWeight: 700, padding: "0 5px" }}>Assign guided movement (optional)</legend><p style={{ fontSize: 12, color: "#718497", marginBottom: 8 }}>Only select movements you have personally prescribed for this patient.</p>{[{ id: "jaw-open", label: "Open and close jaw" }, { id: "jaw-side", label: "Move jaw side to side" }, { id: "neck-turn", label: "Turn head gently" }].map((movement) => <label key={movement.id} style={{ display: "flex", gap: 9, alignItems: "center", padding: "6px 0", fontSize: 14 }}><input type="checkbox" checked={plan.movement_ids?.includes(movement.id as NonNullable<CarePlan["movement_ids"]>[number]) ?? false} onChange={(e) => setPlan((current) => ({ ...current, movement_ids: e.target.checked ? [...(current.movement_ids ?? []), movement.id as NonNullable<CarePlan["movement_ids"]>[number]] : (current.movement_ids ?? []).filter((id) => id !== movement.id) }))} />{movement.label}</label>)}</fieldset>
            <p style={{ fontSize: 12, color: "#718497", marginTop: 10 }}>The app does not recommend exercises based on diagnosis or stage. It only displays movements you explicitly prescribe.</p>
            <button disabled={busy} onClick={save} style={{ marginTop: 16, background: "#0D9488", color: "white", border: 0, borderRadius: 12, padding: "12px 20px", fontWeight: 700 }}>{busy ? "Saving…" : "Save plan & notify patient"}</button>
          </>}
        </section>
      </div>
      <section style={{ background: "white", borderRadius: 18, padding: 22, border: "1px solid #DCE7F0", marginTop: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}><div><h2 style={{ fontSize: 20, fontWeight: 700 }}>Uploaded images and analysis</h2><p style={{ color: "#63788A", fontSize: 13, marginTop: 4 }}>Latest patient uploads, newest first. Select a record to open the image and full analysis details.</p></div>{selected && <button onClick={() => void loadRecords(selected)} style={{ border: "1px solid #D8E3EE", background: "white", borderRadius: 10, padding: "8px 12px", color: "#1565C0", fontWeight: 650 }}>Refresh records</button>}</div>
        {!selected ? <p style={{ color: "#718497", marginTop: 14 }}>Select a connected patient to view their records.</p> : recordsLoading ? <p style={{ color: "#718497", marginTop: 14 }}>Loading records…</p> : records.length === 0 ? <p style={{ color: "#718497", marginTop: 14 }}>No saved image analyses yet. Patient uploads made while signed in will appear here.</p> : <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(170px,1fr))", gap: 10, marginTop: 16 }}><div style={{ background: "#F3F8FB", borderRadius: 12, padding: 14 }}><div style={{ color: "#718497", fontSize: 12 }}>Uploaded analyses</div><strong style={{ fontSize: 22 }}>{records.length}{records.length === 20 ? "+" : ""}</strong></div><div style={{ background: "#F3F8FB", borderRadius: 12, padding: 14 }}><div style={{ color: "#718497", fontSize: 12 }}>Latest screening category</div><strong>{records[0].result.classification.name}</strong></div><div style={{ background: "#F3F8FB", borderRadius: 12, padding: 14 }}><div style={{ color: "#718497", fontSize: 12 }}>PPI vs previous upload</div><strong>{ppiChange === null ? "Need another upload" : `${ppiChange > 0 ? "+" : ""}${ppiChange.toFixed(1)}`}</strong></div></div>
          <p style={{ fontSize: 11, color: "#718497", marginTop: 8 }}>Image-based scores can vary with photo conditions and are not a confirmed diagnosis or a substitute for clinical review.</p>
          <div style={{ display: "grid", gap: 12, marginTop: 12 }}>{records.map((record) => {
          const result = record.result;
          return <details key={record.record_id} style={{ border: "1px solid #E1EAF1", borderRadius: 14, overflow: "hidden" }}><summary style={{ cursor: "pointer", padding: 15, background: "#F7FAFC", display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", fontWeight: 700 }}><span>{result.classification.name} · PPI {result.ppi.score.toFixed(1)}/{result.ppi.max}</span><span style={{ color: "#64798B", fontWeight: 500 }}>{new Date(record.created_at).toLocaleString()} · {record.filename}</span></summary><div style={{ padding: 16, display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%, 320px),1fr))", gap: 20 }}><div><img src={`data:image/jpeg;base64,${record.image_base64}`} alt={`Patient upload: ${record.filename}`} style={{ width: "100%", maxHeight: 460, objectFit: "contain", background: "#F3F7FA", borderRadius: 12 }} /><p style={{ fontSize: 11, color: "#718497", marginTop: 6 }}>Image saved from patient upload for care-team review.</p></div><div style={{ display: "grid", gap: 12, alignContent: "start" }}><div><strong>AI screening result</strong><p style={{ marginTop: 4 }}>{result.classification.name} · Model score {result.classification.confidence}%</p><p style={{ fontSize: 12, color: "#64798B" }}>This is a screening output, not a confirmed diagnosis.</p></div><div><strong>Class probabilities</strong><div style={{ marginTop: 5, display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(130px,1fr))", gap: 6 }}>{Object.entries(result.classification.all_probs).map(([name, value]) => <span key={name} style={{ background: "#F1F6FA", padding: "7px 9px", borderRadius: 8, fontSize: 12 }}>{name}: {value}%</span>)}</div></div><div><strong>Pain and function</strong><p style={{ fontSize: 13, marginTop: 4 }}>PPI: {result.ppi.score}/{result.ppi.max} ({result.ppi.label}) · Speech: {result.fis.speech} · Swallowing: {result.fis.swallowing} · Mouth: {result.fis.mouth}</p></div><div><strong>Visual features and movement estimate</strong><p style={{ fontSize: 13, marginTop: 4 }}>Redness: {result.visual_features.erythema} · Ulceration: {result.visual_features.ulceration} · Texture: {result.visual_features.texture} · Physio estimate: {result.visual_features.physio}</p></div><div><strong>Urgency output</strong><p style={{ fontSize: 13, marginTop: 4 }}>{result.urgency.level} · {result.urgency.timeframe} · {result.urgency.message}</p></div><div><strong>Generated next-step suggestions</strong>{(["immediate", "short_term", "clinical", "lifestyle"] as const).map((key) => <div key={key} style={{ marginTop: 6 }}><span style={{ textTransform: "capitalize", fontWeight: 650 }}>{key.replace("_", " ")}: </span><span style={{ fontSize: 13 }}>{result.treatment_plan[key].join(" · ") || "None"}</span></div>)}</div><div><strong>AI explanation</strong><p style={{ fontSize: 13, lineHeight: 1.55, marginTop: 4 }}>{result.assistant_message}</p></div><details style={{ borderTop: "1px solid #E5EDF3", paddingTop: 8 }}><summary style={{ cursor: "pointer", fontSize: 13, color: "#1565C0", fontWeight: 650 }}>Open raw result data</summary><pre style={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere", fontSize: 10, background: "#F5F8FB", padding: 10, borderRadius: 8, maxHeight: 320, overflow: "auto" }}>{JSON.stringify(result, null, 2)}</pre></details></div></div></details>;
        })}</div></>}
      </section>
      {message && <p role="status" style={{ marginTop: 16, color: "#1565C0", fontWeight: 600 }}>{message}</p>}
    </main>
  </div>;
}
