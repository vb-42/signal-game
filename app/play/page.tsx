"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { MENU_PATH } from "@/lib/routes";
import { useRouter } from "next/navigation";
import { useGame, type SignalAttempt } from "@/lib/useGame";
import { useTTS } from "@/lib/useTTS";
import { MAX_ATTEMPTS, RECORDING_DURATION_MS, SIGNALS, getSignalLabel } from "@/lib/signals";
import DeviceShell from "@/components/DeviceShell";
import VictoryScreen from "@/components/VictoryScreen";
import type { AmbientHandle } from "@/lib/sounds";

type SignalFeedbackBubble = {
  id: string;
  type: string;
  index: number;
};

const FEEDBACK_BUBBLE_POSITIONS = [
  { left: "9%", top: "20%" },
  { left: "54%", top: "18%" },
  { left: "18%", top: "48%" },
  { left: "62%", top: "52%" },
  { left: "34%", top: "32%" },
];

export default function PlayPage() {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const shouldReduceMotion = useReducedMotion();
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
        // Start ambient pad once camera (and thus AudioContext) is allowed
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
    if (phase === "recording" || phase === "announcing" || phase === "countdown") {
      setFeedbackBubbles([]);
      return;
    }

    if ((phase !== "success" && phase !== "fail") || state.detectedSignals.length === 0) {
      return;
    }

    const batchId = `${state.totalAttempts}-${state.currentIndex}-${Date.now()}`;
    setFeedbackBubbles(
      state.detectedSignals.map((type, index) => ({
        id: `${batchId}-${type}-${index}`,
        type,
        index,
      }))
    );

    const hideTimer = window.setTimeout(() => {
      setFeedbackBubbles([]);
    }, 1700);

    return () => window.clearTimeout(hideTimer);
  }, [phase, state.currentIndex, state.detectedSignals, state.totalAttempts]);

  if (cameraError) {
    return (
      <DeviceShell label="CAM-ERR" hints={{ b: "Menu" }} onB={() => router.push(MENU_PATH)}>
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
      hints={showFailControls ? { a: "Retry", b: "Menu" } : undefined}
      onA={showFailControls ? retry : undefined}
      onB={showFailControls ? () => router.push(MENU_PATH) : undefined}
    >
      <div className="flex flex-col flex-1 bg-[#0a0a0f]">
        {/* Top bar */}
        <div className="flex items-center justify-between px-3 py-2 border-b border-white/5">
          <button
            onClick={() => router.push(MENU_PATH)}
            className="text-white/30 hover:text-white/60 text-xs transition-colors cursor-pointer font-mono"
          >
            ESC
          </button>
          <div className="flex gap-1">
            {state.signals.map((sig, i) => (
              <div
                key={sig.type}
                className="h-1 rounded-full transition-all duration-300"
                style={{
                  width: i === state.currentIndex ? 16 : 6,
                  background:
                    i < state.currentIndex
                      ? sig.color
                      : i === state.currentIndex
                        ? sig.color
                        : "rgba(255,255,255,0.12)",
                  opacity: i <= state.currentIndex ? 1 : 0.35,
                }}
              />
            ))}
          </div>
          <span className="text-white/40 text-xs font-mono tabular-nums">
            {state.currentIndex + 1}/{state.signals.length}
          </span>
        </div>

        {/* Camera feed */}
        <div className="relative flex-1 flex flex-col items-center justify-center px-3 py-3">
          <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-black/60">
            <video
              ref={videoRef}
              autoPlay
              muted
              playsInline
              className="w-full h-full object-cover scale-x-[-1]"
            />

            <AnimatePresence>
              {(phase === "countdown" || phase === "recording") && currentSignal && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="absolute bottom-5 left-0 right-0 z-10 pointer-events-none"
                >
                  <div
                    className="w-fit mx-2 mt-2 rounded-lg px-2.5 py-2 border backdrop-blur-md"
                    style={{
                      background: "rgba(0,0,0,0.72)",
                      borderColor: `${currentSignal.color}35`,
                    }}
                  >
                    <div className="flex items-center gap-2 mb-1 w-fit">
                      <span className="text-base leading-none">{currentSignal.emoji}</span>
                      <span
                        className="text-[11px] font-bold font-mono uppercase tracking-wide"
                        style={{ color: currentSignal.color }}
                      >
                        {currentSignal.label}
                      </span>
          
                    </div>
                    <p className="text-[10px] text-white/30 uppercase tracking-widest font-mono mb-0.5">
                      Clue
                    </p>
                    <p className="text-[11px] text-white/80 leading-snug">{currentSignal.description}</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence>
              {phase === "recording" && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 rounded-xl border-2 border-red-500 pointer-events-none"
                  style={{ boxShadow: "0 0 20px rgba(239,68,68,0.3) inset" }}
                />
              )}
            </AnimatePresence>

            <AnimatePresence>
              {phase === "countdown" && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-xl"
                >
                  <AnimatePresence mode="wait">
                    <motion.span
                      key={state.countdown}
                      initial={{ scale: 2, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.5, opacity: 0 }}
                      transition={{ duration: 0.4 }}
                      className="text-7xl font-bold text-white drop-shadow-lg font-mono"
                    >
                      {state.countdown <= 0 ? "GO!" : state.countdown}
                    </motion.span>
                  </AnimatePresence>
                </motion.div>
              )}
            </AnimatePresence>

   

            {phase === "recording" && (
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/40 overflow-hidden">
                <motion.div
                  className="h-full bg-red-500"
                  style={{ width: `${recordingProgress * 100}%` }}
                />
                
              </div>
            )}

            <AnimatePresence>
              {feedbackBubbles.length > 0 && (
                <div className="pointer-events-none absolute inset-0 z-30 overflow-hidden rounded-xl">
                  {feedbackBubbles.map((bubble) => {
                    const info = SIGNALS.find((sig) => sig.type === bubble.type);
                    const position =
                      FEEDBACK_BUBBLE_POSITIONS[
                        bubble.index % FEEDBACK_BUBBLE_POSITIONS.length
                      ];
                    const isTarget = bubble.type === currentSignal?.type;
                    const color = isTarget ? "#22c55e" : (info?.color ?? "#ffffff");

                    return (
                      <motion.div
                        key={bubble.id}
                        initial={
                          shouldReduceMotion
                            ? false
                            : { opacity: 0, y: 8, scale: 0.96 }
                        }
                        animate={
                          shouldReduceMotion
                            ? { opacity: 1 }
                            : {
                                opacity: [0, 1, 1, 0],
                                y: [8, 0, -10, -24],
                                scale: [0.96, 1, 1, 0.98],
                              }
                        }
                        exit={{ opacity: 0 }}
                        transition={
                          shouldReduceMotion
                            ? { duration: 0 }
                            : {
                                duration: 1.45,
                                ease: [0.16, 1, 0.3, 1],
                                times: [0, 0.18, 0.72, 1],
                              }
                        }
                        className="absolute rounded-full border px-2.5 py-1.5 shadow-lg backdrop-blur-md"
                        style={{
                          ...position,
                          borderColor: `${color}55`,
                          background: `linear-gradient(135deg, ${color}22, rgba(0,0,0,0.7))`,
                          boxShadow: `0 0 18px ${color}24`,
                        }}
                      >
                        <span
                          className="flex items-center gap-1.5 whitespace-nowrap text-[11px] font-mono font-semibold"
                          style={{ color }}
                        >
                          <span>{info?.emoji ?? "?"}</span>
                          {getSignalLabel(bubble.type)}
                        </span>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </AnimatePresence>

            <AnimatePresence>
              {phase === "success" && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 rounded-xl"
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: [0, 1.3, 1] }}
                    transition={{ duration: 0.5 }}
                    className="text-6xl mb-2"
                  >
                    ✓
                  </motion.div>
                  <p className="text-green-400 text-lg font-bold font-mono">
                    {currentSignal?.label.toUpperCase()} DETECTED
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence>
              {phase === "fail" && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 rounded-xl px-4"
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: [0, 1.2, 1] }}
                    transition={{ duration: 0.4 }}
                    className="text-3xl mb-1"
                  >
                    ✗
                  </motion.div>
                  <p className="text-red-400 font-semibold font-mono text-sm mb-3">NOT QUITE</p>

                  {/* Target signal */}
                  {currentSignal && (
                    <div className="w-full mb-2">
                      <p className="text-[9px] text-white/25 font-mono uppercase tracking-widest text-center mb-1">
                        Target
                      </p>
                      <div
                        className="w-full flex items-center justify-center gap-2 py-2 rounded-lg border"
                        style={{
                          borderColor: `${currentSignal.color}40`,
                          background: `${currentSignal.color}12`,
                        }}
                      >
                        <span className="text-lg">{currentSignal.emoji}</span>
                        <span
                          className="text-sm font-bold font-mono"
                          style={{ color: currentSignal.color }}
                        >
                          {currentSignal.label}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Detected signals */}
                  {state.detectedSignals.length > 0 ? (
                    <div className="w-full mb-3">
                      <p className="text-[9px] text-white/25 font-mono uppercase tracking-widest text-center mb-1">
                       Detected signals
                      </p>
                      <div className="flex flex-wrap gap-1.5 justify-center">
                        {state.detectedSignals.map((s) => {
                          const info = SIGNALS.find((sig) => sig.type === s);
                          const isMatch = s === currentSignal?.type;
                          return (
                            <motion.span
                              key={s}
                              initial={{ opacity: 0, scale: 0.8 }}
                              animate={{ opacity: 1, scale: 1 }}
                              className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-mono border"
                              style={{
                                borderColor: isMatch
                                  ? "#22c55e60"
                                  : `${info?.color ?? "#fff"}35`,
                                background: isMatch
                                  ? "#22c55e18"
                                  : `${info?.color ?? "#fff"}10`,
                                color: isMatch
                                  ? "#22c55e"
                                  : (info?.color ?? "rgba(255,255,255,0.5)"),
                              }}
                            >
                              {info?.emoji ?? "?"} {getSignalLabel(s)}
                            </motion.span>
                          );
                        })}
                      </div>
                    </div>
                  ) : (
                    <p className="text-white/35 text-xs font-mono mb-3 text-center">
                      {state.errorMessage ?? "No signal detected"}
                    </p>
                  )}

                  <p className="text-white/40 text-[10px] font-mono">
                    {state.attemptsRemaining} ATTEMPT{state.attemptsRemaining !== 1 ? "S" : ""} LEFT
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence>
              {phase === "announcing" && currentSignal && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 rounded-xl"
                >
                  <motion.div
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.1 }}
                    className="text-5xl mb-2"
                  >
                    {currentSignal.emoji}
                  </motion.div>
                  <motion.p
                    initial={{ y: 10, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="text-xl font-bold font-mono tracking-wide"
                    style={{ color: currentSignal.color }}
                  >
                    {currentSignal.label.toUpperCase()}
                  </motion.p>
                  <motion.p
                    initial={{ y: 10, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.35 }}
                    className="text-white/50 text-xs text-center leading-relaxed max-w-[85%] mt-3 px-2"
                  >
                    {currentSignal.description}
                  </motion.p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {currentSignal && (
            <motion.div
              key={currentSignal.type}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="w-full mt-3"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{currentSignal.emoji}</span>
                  <span className="text-sm font-bold font-mono" style={{ color: currentSignal.color }}>
                    {currentSignal.label}
                  </span>
                </div>
                <div className="flex gap-1">
                  {Array.from({ length: MAX_ATTEMPTS }).map((_, i) => (
                    <motion.div
                      key={i}
                      animate={
                        i >= state.attemptsRemaining
                          ? { scale: [1, 0.7, 0], opacity: [1, 0.5, 0.2] }
                          : {}
                      }
                      className="w-5 h-5 rounded-full flex items-center justify-center text-xs"
                      style={{
                        background:
                          i < state.attemptsRemaining
                            ? `${currentSignal.color}25`
                            : "rgba(255,255,255,0.05)",
                      }}
                    >
                      {i < state.attemptsRemaining ? "♥" : "♡"}
                    </motion.div>
                  ))}
                </div>
              </div>
              {phase !== "countdown" && phase !== "recording" && (
                <div className="rounded-lg px-3 py-2 bg-white/5 border border-white/8 mb-2">
                  <p className="text-[10px] text-white/25 uppercase tracking-widest mb-0.5 font-mono">
                    Clue
                  </p>
                  <p className="text-white/55 text-xs leading-relaxed">{currentSignal.description}</p>
                </div>
              )}
              <div className="rounded-lg px-3 py-2 bg-white/5 border border-white/8">
                <p className="text-[10px] text-white/25 uppercase tracking-widest mb-0.5 font-mono">
                  Acting tip
                </p>
                <p className="text-white/55 text-xs leading-relaxed">{currentSignal.actingTip}</p>
              </div>

              {/* Last scan results - persists across retry */}
              {state.detectedSignals.length > 0 && phase !== "idle" && phase !== "countdown" && phase !== "recording" && phase !== "analyzing" && (
                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-2 rounded-lg px-3 py-2 bg-violet-500/5 border border-violet-500/15"
                >
                  <p className="text-[10px] text-violet-300/50 uppercase tracking-widest mb-1.5 font-mono">
                    Last scan detected
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {state.detectedSignals.map((s) => {
                      const info = SIGNALS.find((sig) => sig.type === s);
                      const isTarget = s === currentSignal.type;
                      return (
                        <span
                          key={s}
                          className="flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono border"
                          style={{
                            borderColor: isTarget ? "#22c55e50" : `${info?.color ?? "#fff"}30`,
                            background: isTarget ? "#22c55e15" : `${info?.color ?? "#fff"}08`,
                            color: isTarget ? "#22c55e" : (info?.color ?? "rgba(255,255,255,0.5)"),
                          }}
                        >
                          {info?.emoji ?? "?"} {getSignalLabel(s)}
                        </span>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </motion.div>
          )}
        </div>
      </div>
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
