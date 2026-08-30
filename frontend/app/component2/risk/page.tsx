"use client";

import { type FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, ChevronLeft, ChevronRight } from "lucide-react";
import { submitRiskFactors } from "../../lib/api";
import type { RiskFactors, RiskResult } from "../../lib/types";
import { useAssessment } from "../context";
import { Card, Disclaimer, Notice, Ring, RiskBadge } from "../ui";
import styles from "../risk-voice.module.css";

const initial: RiskFactors = { age: 0, gender: "", smoking: "", alcohol: "", betelChewing: "", oralUlcer: "", gumDisease: "", oralPain: "", hpvInfection: "", poorOralHygiene: "", diet: "", familyHistory: "", compromisedImmuneSystem: "", unexplainedBleeding: "", difficultySwallowing: "", whiteOrRedPatches: "" };
const steps = ["Personal", "Lifestyle", "Medical History", "Oral Indicators", "Review"];
const fields: { key: keyof RiskFactors; label: string; step: number; options?: string[] }[] = [
  { key: "age", label: "Age", step: 0 }, { key: "gender", label: "Gender", step: 0, options: ["Male", "Female", "Other", "Prefer not to say"] },
  { key: "smoking", label: "Tobacco use", step: 1, options: ["No", "Current", "Former"] }, { key: "alcohol", label: "Alcohol consumption", step: 1, options: ["Never", "Rare", "Social", "Regular"] }, { key: "betelChewing", label: "Betel quid use", step: 1, options: ["No", "Current", "Former"] }, { key: "diet", label: "Fruit and vegetable intake", step: 1, options: ["Low", "Medium", "High"] },
  { key: "hpvInfection", label: "HPV status/history", step: 2, options: ["No", "Yes", "Unknown"] }, { key: "familyHistory", label: "Family history of cancer", step: 2, options: ["No", "Yes", "Unknown"] }, { key: "compromisedImmuneSystem", label: "Compromised immune system", step: 2, options: ["No", "Yes", "Unknown"] }, { key: "poorOralHygiene", label: "Poor oral hygiene", step: 2, options: ["No", "Yes"] },
  { key: "oralUlcer", label: "Oral lesions or ulcers", step: 3, options: ["No", "Yes"] }, { key: "gumDisease", label: "Gum disease", step: 3, options: ["No", "Mild", "Moderate", "Severe"] }, { key: "oralPain", label: "Oral pain", step: 3, options: ["No", "Yes"] }, { key: "difficultySwallowing", label: "Difficulty swallowing", step: 3, options: ["No", "Yes"] }, { key: "unexplainedBleeding", label: "Unexplained bleeding", step: 3, options: ["No", "Yes"] }, { key: "whiteOrRedPatches", label: "White or red patches", step: 3, options: ["No", "Yes"] },
];

export default function RiskAssessmentPage() {
  const router = useRouter();
  const { setRiskFactors } = useAssessment();
  const [form, setForm] = useState(initial);
  const [step, setStep] = useState(0);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<RiskResult | null>(null);
  const update = (key: keyof RiskFactors, value: string) => setForm(current => ({ ...current, [key]: key === "age" ? Number(value) : value }));
  const validate = () => { const next: Record<string, string> = {}; for (const field of fields.filter(item => item.step === step)) if (!form[field.key]) next[field.key] = "This field is required."; if (step === 0 && (form.age < 1 || form.age > 120)) next.age = "Enter an age between 1 and 120."; setErrors(next); return Object.keys(next).length === 0; };
  const next = () => { if (validate()) setStep(value => Math.min(4, value + 1)); };
  async function submit(event: FormEvent) { event.preventDefault(); if (step < 4) { next(); return; } setBusy(true); setError(""); try { const response = await submitRiskFactors(form); setRiskFactors(form); setResult(response); window.scrollTo({ top: 0, behavior: "smooth" }); } catch (reason) { setError(reason instanceof Error ? reason.message : "Assessment failed."); } finally { setBusy(false); } }

  if (result) return <><div className={styles.pageHead}><div><span className={styles.eyebrow}>ASSESSMENT COMPLETE</span><h2>Your Preventive Risk result</h2><p>Continue with voice analysis to receive the final multimodal result.</p></div></div><Card className={styles.result}><Ring value={result.structuredScore} label="Risk-Factor Score" /><div className={styles.resultCopy}><RiskBadge level={result.level} /><h2>{result.level === "high" ? "Elevated" : result.level[0].toUpperCase() + result.level.slice(1)} preventive risk</h2><p>This score was returned by the structured risk model.</p><button className={`${styles.button} ${styles.primary}`} onClick={() => router.push("/component2/voice")}>Continue with Voice Analysis <ChevronRight size={18} /></button></div></Card><div className={styles.grid2}><Card><h3>Supportive insights</h3><ul className={styles.list}>{result.insights.map(item => <li key={item}>{item}</li>)}</ul></Card><Card><h3>Recommendations</h3><ul className={styles.list}>{result.recommendations.map(item => <li key={item}>{item}</li>)}</ul></Card></div><Disclaimer text={result.disclaimer} /></>;

  return <><div className={styles.pageHead}><div><span className={styles.eyebrow}>PREVENTIVE SCREENING</span><h2>Risk-Factor Assessment</h2><p>Complete all steps. The calculation is performed only by the backend model.</p></div></div><ol className={styles.steps}>{steps.map((label, index) => <li key={label} className={index === step ? styles.current : index < step ? styles.done : ""}><span>{index < step ? <Check size={16} /> : index + 1}</span><b>{label}</b></li>)}</ol><Card><div className={styles.formTitle}><span className={styles.eyebrow}>STEP {step + 1} OF 5</span><h2>{steps[step]}</h2><p>{step === 4 ? "Confirm your answers before submission." : "All fields shown in this step are required."}</p></div>{error && <Notice error>{error}</Notice>}<form onSubmit={submit} noValidate>{step < 4 ? <div className={styles.formGrid}>{fields.filter(field => field.step === step).map(field => <label className={styles.field} key={field.key}><span>{field.label}</span>{field.options ? <select value={String(form[field.key])} onChange={event => update(field.key, event.target.value)}><option value="">Select an option</option>{field.options.map(option => <option key={option}>{option}</option>)}</select> : <input type="number" min="1" max="120" value={form.age || ""} onChange={event => update(field.key, event.target.value)} />}{errors[field.key] && <small className={styles.fieldError}>{errors[field.key]}</small>}</label>)}</div> : <div className={styles.review}>{fields.map(field => <div key={field.key}><span>{field.label}</span><b>{form[field.key]}</b></div>)}</div>}<div className={styles.actions}>{step > 0 && <button type="button" className={`${styles.button} ${styles.secondary}`} onClick={() => setStep(value => value - 1)}><ChevronLeft size={18} />Back</button>}<button disabled={busy} className={`${styles.button} ${styles.primary}`}>{busy ? "Analyzing…" : step === 4 ? "Submit Assessment" : "Continue"}<ChevronRight size={18} /></button></div></form></Card><Disclaimer /></>;
}
