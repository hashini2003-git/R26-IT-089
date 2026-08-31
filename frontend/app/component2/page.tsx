"use client";

import Link from "next/link";
import { Activity, AudioLines, ClipboardList } from "lucide-react";
import { Card, Loading, Notice, RiskBadge } from "./ui";
import { formatDate, usePredictions } from "./hooks";
import styles from "./risk-voice.module.css";

export default function RiskVoiceDashboard() {
  const { records, loading, error, reload } = usePredictions();
  const risk = records.find(record => record.predictionType !== "voice");
  const voice = records.find(record => record.predictionType !== "risk_factors");
  const number = (record: typeof risk, key: string) => typeof record?.response[key] === "number" ? record.response[key] as number : null;
  return <><div className={styles.pageHead}><div><span className={styles.eyebrow}>PERSONAL OVERVIEW</span><h2>Preventive risk and voice monitoring</h2><p>Review your latest supportive screening results and continue weekly monitoring.</p></div><Link className={`${styles.button} ${styles.primary}`} href="/component2/risk">Start assessment</Link></div>{error && <Notice error>{error} <button className={`${styles.button} ${styles.secondary}`} onClick={reload}>Retry</button></Notice>}{loading ? <Loading /> : <><div className={styles.grid3}><Card className={styles.stat}><small>Latest Preventive Risk</small><strong>{number(risk, "structuredScore")?.toFixed(1) ?? "—"}%</strong>{risk?.history && <RiskBadge level={risk.history.level} />}</Card><Card className={styles.stat}><small>Latest Voice Abnormality</small><strong>{number(voice, "voiceScore")?.toFixed(1) ?? "—"}%</strong><span className={styles.muted}>Backend model result</span></Card><Card className={styles.stat}><small>Saved analyses</small><strong>{records.length}</strong><span className={styles.muted}>Your patient-scoped records</span></Card></div><div className={styles.quick}><Link href="/component2/risk"><ClipboardList /><b>Risk-Factor Assessment</b><span>Complete the structured questionnaire</span></Link><Link href="/component2/voice"><AudioLines /><b>Voice Analysis</b><span>Record or upload a voice sample</span></Link><Link href="/component2/monitoring"><Activity /><b>Weekly Monitoring</b><span>Review chronological voice records</span></Link></div><div className={styles.pageHead} style={{ marginTop: 30 }}><div><h2>Recent activity</h2></div><Link href="/component2/history">View all</Link></div>{records.length === 0 ? <Card className={styles.empty}>No analyses yet. Complete your first assessment to begin.</Card> : <div className={styles.records}>{records.slice(0, 5).map(record => <Card className={styles.record} key={record.id}><span className={styles.recordIcon}>{record.predictionType === "voice" ? <AudioLines /> : <ClipboardList />}</span><div><b>{record.predictionType === "voice" ? "Voice Analysis" : record.predictionType === "multimodal" ? "Final Multimodal Analysis" : "Risk-Factor Assessment"}</b><small>{formatDate(record.date)}</small></div>{record.history && <RiskBadge level={record.history.level} />}</Card>)}</div>}</>}</>;
}
