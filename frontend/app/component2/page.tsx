"use client";

import Link from "next/link";
import { Activity, AudioLines, ClipboardList } from "lucide-react";
import { Card, Loading, Notice, RiskBadge } from "./ui";
import { formatDate, usePredictions } from "./hooks";
import styles from "./risk-voice.module.css";

export default function RiskVoiceDashboard() {
  const { records, loading, error, reload } = usePredictions();
  const risk = records.find((record) => record.predictionType !== "voice");
  const voice = records.find(
    (record) => record.predictionType !== "risk_factors",
  );
  const number = (record: typeof risk, key: string) =>
    typeof record?.response[key] === "number"
      ? (record.response[key] as number)
      : null;

  return (
    <>
      <div className={styles.pageHead}>
        <div>
          <span className={styles.eyebrow}>YOUR HEALTH OVERVIEW</span>
          <h2>Your oral health at a glance</h2>
          <p>
            See your latest risk and voice results, or start a new check.
          </p>
        </div>
        <Link
          className={`${styles.button} ${styles.primary}`}
          href="/component2/risk"
        >
          Start my risk check
        </Link>
      </div>

      {error && (
        <Notice error>
          {error}{" "}
          <button
            className={`${styles.button} ${styles.secondary}`}
            onClick={reload}
          >
            Try again
          </button>
        </Notice>
      )}

      {loading ? (
        <Loading />
      ) : (
        <>
          <div className={styles.grid3}>
            <Card className={styles.stat}>
              <small>Latest Risk Score</small>
              <strong>
                {number(risk, "structuredScore")?.toFixed(1) ?? "—"}%
              </strong>
              {risk?.history && <RiskBadge level={risk.history.level} />}
            </Card>
            <Card className={styles.stat}>
              <small>Latest Voice Score</small>
              <strong>
                {number(voice, "voiceScore")?.toFixed(1) ?? "—"}%
              </strong>
              <span className={styles.muted}>Result from your voice check</span>
            </Card>
            <Card className={styles.stat}>
              <small>Saved Results</small>
              <strong>{records.length}</strong>
              <span className={styles.muted}>Your previous checks</span>
            </Card>
          </div>

          <div className={styles.quick}>
            <Link href="/component2/risk">
              <ClipboardList />
              <b>Check My Risk</b>
              <span>Answer a few questions about your health and habits</span>
            </Link>
            <Link href="/component2/voice">
              <AudioLines />
              <b>Check My Voice</b>
              <span>Record or upload a short voice sample</span>
            </Link>
            <Link href="/component2/monitoring">
              <Activity />
              <b>Track My Progress</b>
              <span>See how your voice results change over time</span>
            </Link>
          </div>

          <div className={styles.pageHead} style={{ marginTop: 30 }}>
            <div>
              <h2>Recent checks</h2>
            </div>
            <Link href="/component2/history">See all results</Link>
          </div>

          {records.length === 0 ? (
            <Card className={styles.empty}>
              No results yet. Start your first risk check to begin.
            </Card>
          ) : (
            <div className={styles.records}>
              {records.slice(0, 5).map((record) => (
                <Card className={styles.record} key={record.id}>
                  <span className={styles.recordIcon}>
                    {record.predictionType === "voice" ? (
                      <AudioLines />
                    ) : (
                      <ClipboardList />
                    )}
                  </span>
                  <div>
                    <b>
                      {record.predictionType === "voice"
                        ? "Voice Check"
                        : record.predictionType === "multimodal"
                          ? "Combined Risk & Voice Result"
                          : "Risk Check"}
                    </b>
                    <small>{formatDate(record.date)}</small>
                  </div>
                  {record.history && <RiskBadge level={record.history.level} />}
                </Card>
              ))}
            </div>
          )}
        </>
      )}
    </>
  );
}
