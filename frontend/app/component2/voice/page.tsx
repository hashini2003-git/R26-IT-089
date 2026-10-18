"use client";

import Link from "next/link";
import { type ChangeEvent, useEffect, useRef, useState } from "react";
import {
  AudioLines,
  CirclePause,
  CirclePlay,
  Mic,
  Square,
  Trash2,
  Upload,
} from "lucide-react";
import { submitMultimodal, submitVoice } from "../../lib/api";
import type { RiskResult, VoiceResult } from "../../lib/types";
import { WavRecorder } from "../audio";
import { useAssessment } from "../context";
import { Card, Disclaimer, Notice, Ring, RiskBadge } from "../ui";
import styles from "../risk-voice.module.css";

const accepted = ".wav,.m4a,.mp4,.aac,.3gp,audio/wav,audio/mp4,audio/aac";

export default function VoiceAnalysisPage() {
  const { riskFactors } = useAssessment();
  const defaultGender =
    riskFactors?.gender.toLowerCase().replaceAll(" ", "_") ?? "";
  const recorder = useRef<WavRecorder | null>(null);
  const timer = useRef<number | undefined>(undefined);
  const [state, setState] = useState<
    "idle" | "recording" | "paused" | "ready" | "processing"
  >("idle");
  const [file, setFile] = useState<File | null>(null);
  const [url, setUrl] = useState("");
  const [seconds, setSeconds] = useState(0);
  const [gender, setGender] = useState(
    ["male", "female", "other", "prefer_not_to_say"].includes(defaultGender)
      ? defaultGender
      : "",
  );
  const [error, setError] = useState("");
  const [result, setResult] = useState<VoiceResult | RiskResult | null>(null);

  useEffect(
    () => () => {
      if (url) URL.revokeObjectURL(url);
      clearInterval(timer.current);
    },
    [url],
  );

  const tick = () => {
    timer.current = window.setInterval(
      () =>
        setSeconds(
          Math.floor((recorder.current?.duration() ?? 0) / 1000),
        ),
      250,
    );
  };

  async function start() {
    setError("");
    setResult(null);
    try {
      recorder.current = new WavRecorder();
      await recorder.current.start();
      setSeconds(0);
      setState("recording");
      tick();
    } catch {
      setError(
        "Microphone permission was not granted. Allow access or upload an audio file.",
      );
    }
  }

  function pause() {
    recorder.current?.pause();
    clearInterval(timer.current);
    setState("paused");
  }

  function resume() {
    recorder.current?.resume();
    setState("recording");
    tick();
  }

  async function stop() {
    clearInterval(timer.current);
    const blob = await recorder.current!.stop();
    choose(new File([blob], "oralai-recording.wav", { type: "audio/wav" }));
  }

  function choose(next: File) {
    if (url) URL.revokeObjectURL(url);
    setFile(next);
    setUrl(URL.createObjectURL(next));
    setState("ready");
    setError("");
    setResult(null);
  }

  function upload(event: ChangeEvent<HTMLInputElement>) {
    const next = event.target.files?.[0];
    if (next) choose(next);
  }

  function reset() {
    if (url) URL.revokeObjectURL(url);
    setFile(null);
    setUrl("");
    setResult(null);
    setSeconds(0);
    setState("idle");
  }

  async function analyze() {
    if (!file) return;
    if (!gender) {
      setError("Select a gender reference option before analysis.");
      return;
    }

    setState("processing");
    setError("");
    try {
      setResult(
        riskFactors
          ? await submitMultimodal(riskFactors, file, gender)
          : await submitVoice(file, gender),
      );
      setState("ready");
    } catch (reason) {
      setError(
        reason instanceof Error ? reason.message : "Voice analysis failed.",
      );
      setState("ready");
    }
  }

  const time = `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;

  if (result && "finalScore" in result) {
    return (
      <>
        <div className={styles.pageHead}>
          <div>
            <span className={styles.eyebrow}>MULTIMODAL ANALYSIS COMPLETE</span>
            <h2>Your Final Supportive Risk Result</h2>
            <p>The backend combined your risk-factor and voice model outputs.</p>
          </div>
          <button
            className={`${styles.button} ${styles.secondary}`}
            onClick={reset}
          >
            New recording
          </button>
        </div>

        <Card className={styles.result}>
          <Ring value={result.finalScore} label="Final Combined Score" />
          <div className={styles.resultCopy}>
            <RiskBadge level={result.level} />
            <h2>
              {result.level === "high"
                ? "Elevated"
                : result.level[0].toUpperCase() + result.level.slice(1)}{" "}
              Risk
            </h2>
            <p>
              The final level and score were returned by the backend. The browser
              did not calculate them.
            </p>
          </div>
        </Card>

        <div className={styles.grid3}>
          <Card className={styles.stat}>
            <small>Risk-Factor Score</small>
            <strong>{result.structuredScore.toFixed(1)}%</strong>
            <span className={styles.muted}>70% weighting</span>
          </Card>
          <Card className={styles.stat}>
            <small>Voice Abnormality Score</small>
            <strong>{result.voiceScore?.toFixed(1) ?? "—"}%</strong>
            <span className={styles.muted}>30% weighting</span>
          </Card>
          <Card className={styles.stat}>
            <small>Final Combined Score</small>
            <strong>{result.finalScore.toFixed(1)}%</strong>
            <RiskBadge level={result.level} />
          </Card>
        </div>

        {result.voiceAnalysis && (
          <div className={styles.metrics}>
            {Object.entries(result.voiceAnalysis).map(([key, value]) => (
              <Card key={key}>
                <small>{key.replace(/([A-Z])/g, " $1")}</small>
                <b>{value}</b>
              </Card>
            ))}
          </div>
        )}

        <div className={styles.grid2}>
          <Card>
            <h3>Supportive insights</h3>
            <ul className={styles.list}>
              {result.insights.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </Card>
          <Card>
            <h3>Recommendations</h3>
            <ul className={styles.list}>
              {result.recommendations.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </Card>
        </div>
        <Disclaimer text={result.disclaimer} />
      </>
    );
  }

  if (result) {
    return (
      <>
        <div className={styles.pageHead}>
          <div>
            <span className={styles.eyebrow}>VOICE ANALYSIS COMPLETE</span>
            <h2>Your Voice Analysis</h2>
            <p>
              This is a standalone voice result because no questionnaire was
              active.
            </p>
          </div>
          <button
            className={`${styles.button} ${styles.secondary}`}
            onClick={reset}
          >
            Record again
          </button>
        </div>

        <Card className={styles.result}>
          <Ring value={result.voiceScore} label="Voice Abnormality Probability" />
          <div className={styles.resultCopy}>
            <span
              className={`${styles.badge} ${
                result.voiceLabel === "stable"
                  ? styles.low
                  : result.voiceLabel === "slight_variation"
                    ? styles.moderate
                    : styles.high
              }`}
            >
              {result.voiceLabel.replaceAll("_", " ")}
            </span>
            <h2>Voice signal summary</h2>
            <p>The probability was returned directly by the backend voice model.</p>
          </div>
        </Card>

        <div className={styles.metrics}>
          {Object.entries(result.voiceAnalysis).map(([key, value]) => (
            <Card key={key}>
              <small>{key.replace(/([A-Z])/g, " $1")}</small>
              <b>{value}</b>
            </Card>
          ))}
        </div>

        <Card>
          <h3>Gender-aware mean pitch reference</h3>
          <p>{result.genderPitchReference.interpretation}</p>
          <b>{result.genderPitchReference.pitchMeanHz.toFixed(1)} Hz</b>
        </Card>
        <Disclaimer text={result.disclaimer} />
      </>
    );
  }

  return (
    <>
      <div className={styles.pageHead}>
        <div>
          <span className={styles.eyebrow}>
            {riskFactors ? "FINAL MULTIMODAL STEP" : "PERSONAL VOICE CHECK"}
          </span>
          <h2>Voice Analysis</h2>
          <p>
            {riskFactors
              ? "Add a voice sample to receive your final Low, Moderate, or Elevated result."
              : "Complete a risk assessment first for a combined result, or continue with voice only."}
          </p>
        </div>
        {!riskFactors && (
          <Link
            className={`${styles.button} ${styles.secondary}`}
            href="/component2/risk"
          >
            Start risk assessment
          </Link>
        )}
      </div>

      {riskFactors && (
        <Notice>
          Risk-factor assessment received. Your recording will be submitted with
          it to the multimodal backend.
        </Notice>
      )}
      {error && <Notice error>{error}</Notice>}

      <Card className={styles.recorder}>
        <label className={styles.genderBox}>
          <b>Gender reference</b>
          <select
            className={styles.genderSelect}
            value={gender}
            onChange={(event) => setGender(event.target.value)}
          >
            <option value="">Select an option</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other</option>
            <option value="prefer_not_to_say">Prefer not to say</option>
          </select>
          <small>
            Used only for pitch interpretation; it does not change the model
            probability.
          </small>
        </label>

        <div
          className={styles.voicePrompt}
          aria-labelledby="voice-prompt-title"
        >
          <div className={styles.voicePromptLabel}>
            <AudioLines size={17} aria-hidden="true" />
            <span id="voice-prompt-title">Read this sentence aloud</span>
          </div>
          <blockquote>
            “Today I feel calm and comfortable, and I am ready to speak clearly,
            naturally, and confidently in a quiet environment.”
          </blockquote>
          <small>Speak at your normal pace and volume in a quiet place.</small>
        </div>

        <div
          className={`${styles.mic} ${state === "recording" ? styles.live : ""}`}
        >
          <Mic size={36} />
        </div>
        <h2>
          {state === "recording"
            ? "Recording…"
            : state === "paused"
              ? "Recording paused"
              : state === "processing"
                ? "Analyzing voice…"
                : file
                  ? "Recording ready"
                  : "Ready to record"}
        </h2>
        <div className={styles.timer}>{time}</div>

        {url && state !== "processing" && (
          <audio className={styles.audio} controls src={url} />
        )}

        <div className={styles.actions} style={{ justifyContent: "center" }}>
          {state === "idle" && (
            <button className={`${styles.button} ${styles.primary}`} onClick={start}>
              <Mic size={18} />
              Start recording
            </button>
          )}
          {state === "recording" && (
            <>
              <button
                className={`${styles.button} ${styles.secondary}`}
                onClick={pause}
              >
                <CirclePause size={18} />
                Pause
              </button>
              <button
                className={`${styles.button} ${styles.danger}`}
                onClick={stop}
              >
                <Square size={18} />
                Stop
              </button>
            </>
          )}
          {state === "paused" && (
            <>
              <button
                className={`${styles.button} ${styles.primary}`}
                onClick={resume}
              >
                <CirclePlay size={18} />
                Resume
              </button>
              <button
                className={`${styles.button} ${styles.danger}`}
                onClick={stop}
              >
                <Square size={18} />
                Stop
              </button>
            </>
          )}
          {state === "ready" && (
            <>
              <button
                className={`${styles.button} ${styles.secondary}`}
                onClick={reset}
              >
                <Trash2 size={18} />
                Delete
              </button>
              <button
                className={`${styles.button} ${styles.primary}`}
                onClick={analyze}
              >
                <AudioLines size={18} />
                {riskFactors ? "Run final analysis" : "Analyze voice"}
              </button>
            </>
          )}
          {state === "processing" && (
            <span>
              <span className={styles.spinner} /> Processing model…
            </span>
          )}
        </div>

        {state === "idle" && (
          <label className={styles.upload}>
            <Upload size={18} />
            Upload WAV, M4A, MP4, AAC, or 3GP
            <input type="file" accept={accepted} onChange={upload} />
          </label>
        )}
        {file && (
          <p className={styles.file}>
            {file.name} · {(file.size / 1024 / 1024).toFixed(2)} MB
          </p>
        )}
      </Card>
      <Disclaimer />
    </>
  );
}
