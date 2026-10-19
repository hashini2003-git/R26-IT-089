"use client";

import {
  ArrowLeft,
  Check,
  CloudRain,
  Gamepad2,
  Maximize2,
  MoonStar,
  Pause,
  Play,
  TreePine,
  Waves,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  addSession,
  ENVIRONMENTS,
  readPreferences,
  type EnvironmentId,
} from "../_lib/meditation";
import styles from "../meditation.module.css";

interface SessionClientProps {
  environment: string;
  duration: string;
  sound: string;
  complexity: string;
}

function validEnvironment(value: string): EnvironmentId {
  return value === "beach" || value === "rain" || value === "night-sky" ? value : "forest";
}

function EnvironmentIcon({ environment }: { environment: EnvironmentId }) {
  if (environment === "beach") return <Waves size={20} />;
  if (environment === "rain") return <CloudRain size={20} />;
  if (environment === "night-sky") return <MoonStar size={20} />;
  return <TreePine size={20} />;
}

export function SessionClient({ environment, duration, sound, complexity }: SessionClientProps) {
  const router = useRouter();
  const environmentId = validEnvironment(environment);
  const environmentConfig = ENVIRONMENTS[environmentId];
  const parsedDuration = Number.parseInt(duration, 10);
  const durationMinutes = Number.isFinite(parsedDuration) && parsedDuration > 0 ? parsedDuration : 10;
  const [secondsRemaining, setSecondsRemaining] = useState(durationMinutes * 60);
  const [running, setRunning] = useState(true);
  const [controlsOpen, setControlsOpen] = useState(true);
  const completedRef = useRef(false);
  const gameFrameRef = useRef<HTMLIFrameElement>(null);

  const finishSession = useCallback(() => {
    if (completedRef.current) return;
    completedRef.current = true;
    const preferences = readPreferences();
    addSession({
      environment: environmentId,
      sound,
      duration: `${durationMinutes} min`,
      complexity,
      goal: preferences.sessionGoal,
    });

    const params = new URLSearchParams({
      environment: environmentId,
      duration: String(durationMinutes),
      sound,
      complexity,
    });
    router.replace(`/component3/completion?${params.toString()}`);
  }, [complexity, durationMinutes, environmentId, router, sound]);

  useEffect(() => {
    if (!running) return;

    const interval = window.setInterval(() => {
      setSecondsRemaining((current) => {
        if (current <= 1) {
          window.clearInterval(interval);
          window.setTimeout(finishSession, 0);
          return 0;
        }
        return current - 1;
      });
    }, 1000);

    return () => window.clearInterval(interval);
  }, [finishSession, running]);

  const minutes = Math.floor(secondsRemaining / 60).toString().padStart(2, "0");
  const seconds = (secondsRemaining % 60).toString().padStart(2, "0");
  const unityParams = new URLSearchParams({
    env: environmentId,
    duration: String(durationMinutes),
    sound,
    complexity,
    controls: "2",
  });
  const unitySource = `/meditation-app/index.html?${unityParams.toString()}`;

  const enterFullscreen = async () => {
    const frame = gameFrameRef.current;
    if (!frame) return;
    await frame.requestFullscreen?.();
  };

  return (
    <div className={`${styles.app} ${styles.sessionApp}`}>
      <header className={styles.sessionBar}>
        <button
          type="button"
          className={styles.iconButton}
          onClick={() => router.push("/component3/recommendation")}
          title="Back to recommendation"
          aria-label="Back to recommendation"
        >
          <ArrowLeft size={18} />
        </button>

        <div className={styles.sessionInfo}>
          <span className={styles.sessionIcon} aria-hidden="true">
            <EnvironmentIcon environment={environmentId} />
          </span>
          <div>
            <strong>{environmentConfig.title} meditation</strong>
            <div className={styles.sessionMeta}>
              <span>{durationMinutes} min</span>
              <span>{sound} sound</span>
              <span>{complexity} interaction</span>
            </div>
          </div>
        </div>

        <div className={styles.sessionActions}>
          <span className={styles.sessionTimer} aria-label={`${minutes} minutes ${seconds} seconds remaining`}>
            {minutes}:{seconds}
          </span>
          <button
            type="button"
            className={styles.compactButton}
            onClick={() => setRunning((current) => !current)}
            title={running ? "Pause timer" : "Resume timer"}
          >
            {running ? <Pause size={16} /> : <Play size={16} />}
            <span>{running ? "Pause" : "Resume"}</span>
          </button>
          <button
            type="button"
            className={styles.compactButton}
            onClick={() => setControlsOpen((current) => !current)}
            title="Game controls"
            aria-expanded={controlsOpen}
          >
            <Gamepad2 size={16} />
            <span>Controls</span>
          </button>
          <button
            type="button"
            className={styles.compactButton}
            onClick={enterFullscreen}
            title="Enter fullscreen"
          >
            <Maximize2 size={16} />
            <span>Fullscreen</span>
          </button>
          <button type="button" className={styles.compactButton} onClick={finishSession}>
            <Check size={16} />
            <span>End session</span>
          </button>
        </div>
      </header>

      <div className={styles.unityStage}>
        <iframe
          ref={gameFrameRef}
          key={unitySource}
          src={unitySource}
          title={`${environmentConfig.title} meditation game`}
          className={styles.unityFrame}
          allow="autoplay; fullscreen; gamepad"
          allowFullScreen
          tabIndex={0}
        />

        {controlsOpen && (
          <aside className={styles.controlsPanel} aria-label="Game controls">
            <div className={styles.controlsHeading}>
              <div>
                <Gamepad2 size={18} />
                <strong>Game controls</strong>
              </div>
              <button
                type="button"
                onClick={() => setControlsOpen(false)}
                title="Close game controls"
                aria-label="Close game controls"
              >
                <X size={16} />
              </button>
            </div>
            <button
              type="button"
              className={styles.activateGameButton}
              onClick={() => setControlsOpen(false)}
            >
              Close controls, then click inside the game
            </button>
            <dl className={styles.controlsList}>
              <div><dt><kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd></dt><dd>Move</dd></div>
              <div><dt>Mouse</dt><dd>Look around</dd></div>
              <div><dt><kbd>Shift</kbd></dt><dd>Sprint</dd></div>
              <div><dt><kbd>Space</kbd></dt><dd>Jump</dd></div>
              <div><dt><kbd>Esc</kbd></dt><dd>Game menu</dd></div>
            </dl>
          </aside>
        )}
      </div>
    </div>
  );
}
