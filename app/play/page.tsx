"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { MENU_PATH } from "@/lib/routes";
import { useRouter } from "next/navigation";
import { useGame, type SignalAttempt } from "@/lib/useGame";
import { useTTS } from "@/lib/useTTS";
import { RECORDING_DURATION_MS, SIGNALS } from "@/lib/signals";
import DeviceShell from "@/components/DeviceShell";
import SignalPlayView, {
  type SignalFeedbackBubble,
  type SignalPlayPhase,
} from "@/components/SignalPlayView";
import VictoryScreen from "@/components/VictoryScreen";
import type { AmbientHandle } from "@/lib/sounds";

export default function PlayPage() {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [cameraReady, setCameraReady] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [victoryAttempts, setVictoryAttempts] = useState(0);
  const [victoryHistory, setVictoryHistory] = useState<SignalAttempt[]>([]);
  const [recordingProgress, setRecordingProgress] = useState(0);
  const [feedbackBubbles, setFeedbackBubbles] = useState<SignalFeedbackBubble[]>([]);
  const recordingProgressRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const ambientRef = useRef<AmbientHandle | null>(null);
  const { speak, stop: stopTTS } = useTTS();

  const { state, currentSignal, startGame, startCountdown, startRecording, initCamera, stopCamera, retry } = useGame({
    onVictory: (totalAttempts, history) => {
      setVictoryAttempts(totalAttempts);
      setVictoryHistory(history);
    },
  });

  const { phase } = state;

  useEffect(() => {
    let mounted = true;
    initCamera().then((stream) => {
      if (!mounted) {
        stream?.getTracks().forEach((t) => t.stop());
        return;
      }
      if (stream && videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(() => {});
        setCameraReady(true);
        import("@/lib/sounds").then(({ startStreamingAmbient }) => {
          if (!mounted) return;
          ambientRef.current = startStreamingAmbient(1);
        });
      } else {
        setCameraError("Could not access camera. Please allow camera and microphone access.");
      }
    });
    return () => {
      mounted = false;
      stopTTS();
      stopCamera();
      ambientRef.current?.stop();
      ambientRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    ambientRef.current?.setLevel(state.currentIndex + 1);
  }, [state.currentIndex]);

  useEffect(() => {
    if (cameraReady && phase === "idle") {
      startGame();
    }
  }, [cameraReady, phase, startGame]);

  useEffect(() => {
    if (phase !== "announcing" || !currentSignal) return;
    let cancelled = false;

    const phrases = [
      `Show me ${currentSignal.label}`,
      `Express ${currentSignal.label}`,
      `Act out ${currentSignal.label}`,
    ];
    const phrase = phrases[Math.floor(Math.random() * phrases.length)];

    speak(phrase).then(() => {
      if (!cancelled) startCountdown();
    });

    return () => {
      cancelled = true;
    };
  }, [phase, currentSignal?.type]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (phase === "success") {
      import("@/lib/sounds").then(({ playSuccessSound }) => playSuccessSound());
    } else if (phase === "fail") {
      import("@/lib/sounds").then(({ playFailSound }) => playFailSound());
    }
  }, [phase]);

  useEffect(() => {
    if (phase !== "recording") {
      if (recordingProgressRef.current) {
        clearInterval(recordingProgressRef.current);
        recordingProgressRef.current = null;
      }
      return;
    }

    const start = Date.now();
    recordingProgressRef.current = setInterval(() => {
      const elapsed = Date.now() - start;
      setRecordingProgress(Math.min(elapsed / RECORDING_DURATION_MS, 1));
    }, 50);

    startRecording();

    return () => {
      if (recordingProgressRef.current) {
        clearInterval(recordingProgressRef.current);
        recordingProgressRef.current = null;
      }
    };
  }, [phase]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (phase !== "success" && phase !== "fail") {
      return;
    }

    if (state.detectedSignals.length === 0) {
      return;
    }

    const batchId = `${state.totalAttempts}-${state.currentIndex}-${Date.now()}`;
    const showTimer = window.setTimeout(() => {
      setFeedbackBubbles(
        state.detectedSignals.map((type, index) => ({
          id: `${batchId}-${type}-${index}`,
          type,
          index,
        }))
      );
    }, 0);

    const hideTimer = window.setTimeout(() => {
      setFeedbackBubbles([]);
    }, 1700);

    return () => {
      window.clearTimeout(showTimer);
      window.clearTimeout(hideTimer);
    };
  }, [phase, state.currentIndex, state.detectedSignals, state.totalAttempts]);

  const visibleFeedbackBubbles =
    phase === "recording" || phase === "announcing" || phase === "countdown"
      ? []
      : feedbackBubbles;

  if (cameraError) {
    return (
      <DeviceShell label="CAM-ERR" crt={false} hints={{ b: "Menu" }} onB={() => router.push(MENU_PATH)}>
        <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
          <div className="text-5xl mb-4">📷</div>
          <h2 className="text-xl font-semibold text-white mb-2">Camera Required</h2>
          <p className="text-white/50 text-sm">{cameraError}</p>
        </div>
      </DeviceShell>
    );
  }

  if (phase === "victory") {
    return (
      <VictoryScreen
        totalAttempts={victoryAttempts}
        totalSignals={12}
        attemptHistory={victoryHistory}
      />
    );
  }

  if (phase === "game_over") {
    return (
      <GameOverScreen
        onRestart={() => startGame()}
        onLeaderboard={() => router.push("/leaderboard")}
        completedCount={state.currentIndex}
      />
    );
  }

  const showFailControls = phase === "fail";

  return (
    <DeviceShell
      label={`SIG ${state.currentIndex + 1}/12`}
      isLensOpen={cameraReady}
      crt={false}
      hints={showFailControls ? { a: "Retry", b: "Menu" } : undefined}
      onA={showFailControls ? retry : undefined}
      onB={showFailControls ? () => router.push(MENU_PATH) : undefined}
    >
      <SignalPlayView
        videoRef={videoRef}
        mirrorVideo
        signal={currentSignal}
        signals={state.signals}
        currentIndex={state.currentIndex}
        phase={phase as SignalPlayPhase}
        countdown={state.countdown}
        recordingProgress={recordingProgress}
        feedbackBubbles={visibleFeedbackBubbles}
        attemptsRemaining={state.attemptsRemaining}
        detectedSignals={state.detectedSignals}
        errorMessage={state.errorMessage}
        onEscape={() => router.push(MENU_PATH)}
      />
    </DeviceShell>
  );
}

const TOTAL_SIGNALS = 12;

function GameOverScreen({
  onRestart,
  onLeaderboard,
  completedCount,
}: {
  onRestart: () => void;
  onLeaderboard: () => void;
  completedCount: number;
}) {
  const progress = completedCount / TOTAL_SIGNALS;

  return (
    <DeviceShell
      label="GAME OVER"
      crt={false}
      hints={{ a: "Retry", b: "Leaderboard" }}
      onA={onRestart}
      onB={onLeaderboard}
    >
      <div className="flex-1 flex flex-col items-center justify-center px-6 text-center bg-[#0a0a0f]">
        <motion.h2
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-3xl font-bold text-white mb-6 font-mono text-balance"
        >
          GAME OVER
        </motion.h2>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="w-full max-w-xs mb-5"
        >
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-[10px] text-white/30 font-mono uppercase tracking-widest">
              Run progress
            </span>
            <span className="text-xs text-white/50 font-mono tabular-nums">
              {completedCount}/{TOTAL_SIGNALS}
            </span>
          </div>

          <div
            className="h-2 rounded-full bg-white/[0.06] overflow-hidden mb-3"
            style={{ boxShadow: "inset 0 1px 2px rgba(0,0,0,0.35)" }}
          >
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress * 100}%` }}
              transition={{ delay: 0.45, type: "spring", duration: 0.6, bounce: 0 }}
              className="h-full rounded-full"
              style={{
                background: "linear-gradient(90deg, #7c3aed, #a855f7, #ec4899)",
                boxShadow: "0 0 12px rgba(168,85,247,0.35)",
              }}
            />
          </div>

          <div className="flex gap-1">
            {SIGNALS.map((sig, i) => (
              <motion.div
                key={sig.type}
                initial={{ opacity: 0, scaleY: 0 }}
                animate={{ opacity: 1, scaleY: 1 }}
                transition={{
                  delay: 0.4 + i * 0.04,
                  type: "spring",
                  duration: 0.3,
                  bounce: 0,
                }}
                className="flex-1 h-1.5 rounded-full origin-bottom"
                style={{
                  background:
                    i < completedCount
                      ? sig.color
                      : i === completedCount
                        ? `${sig.color}35`
                        : "rgba(255,255,255,0.08)",
                  boxShadow:
                    i < completedCount ? `0 0 6px ${sig.color}40` : undefined,
                }}
              />
            ))}
          </div>
        </motion.div>

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="text-white/50 mb-1 text-sm tabular-nums"
        >
          Reached signal {completedCount + 1} of {TOTAL_SIGNALS}
        </motion.p>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="text-white/30 text-xs font-mono"
        >
          3 ATTEMPTS USED — START OVER
        </motion.p>
      </div>
    </DeviceShell>
  );
}
