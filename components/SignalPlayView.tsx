"use client";

import { type RefObject } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import {
  MAX_ATTEMPTS,
  SIGNALS,
  getSignalLabel,
  type SignalInfo,
} from "@/lib/signals";

export type SignalPlayPhase =
  | "idle"
  | "announcing"
  | "countdown"
  | "recording"
  | "analyzing"
  | "success"
  | "fail";

export type SignalFeedbackBubble = {
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

export interface SignalPlayViewProps {
  videoRef?: RefObject<HTMLVideoElement | null>;
  videoSrc?: string;
  mirrorVideo?: boolean;
  signal: SignalInfo | null;
  signals: SignalInfo[];
  currentIndex: number;
  phase: SignalPlayPhase;
  countdown?: number;
  recordingProgress?: number;
  feedbackBubbles?: SignalFeedbackBubble[];
  attemptsRemaining?: number;
  detectedSignals?: string[];
  errorMessage?: string | null;
  onEscape?: () => void;
}

export default function SignalPlayView({
  videoRef,
  videoSrc,
  mirrorVideo = true,
  signal,
  signals,
  currentIndex,
  phase,
  countdown = 3,
  recordingProgress = 0,
  feedbackBubbles = [],
  attemptsRemaining = MAX_ATTEMPTS,
  detectedSignals = [],
  errorMessage,
  onEscape,
}: SignalPlayViewProps) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <div
      className="flex flex-col flex-1 bg-[#0a0a0f] min-h-0"

    >
      <div className="flex items-center justify-between px-3 py-2 border-b border-white/5 shrink-0">
        {onEscape ? (
          <button
            type="button"
            onClick={onEscape}
            className="text-white/30 hover:text-white/60 text-xs transition-colors cursor-pointer font-mono"
          >
            ESC
          </button>
        ) : (
          <span className="text-white/20 text-xs font-mono">SIG</span>
        )}
        <div className="flex gap-1">
          {signals.map((sig, i) => (
            <div
              key={sig.type}
              className="h-1 rounded-full transition-all duration-300"
              style={{
                width: i === currentIndex ? 16 : 6,
                background:
                  i < currentIndex
                    ? sig.color
                    : i === currentIndex
                      ? sig.color
                      : "rgba(255,255,255,0.12)",
                opacity: i <= currentIndex ? 1 : 0.35,
              }}
            />
          ))}
        </div>
        <span className="text-white/40 text-xs font-mono tabular-nums">
          {currentIndex + 1}/{signals.length}
        </span>
      </div>

      <div className="relative flex-1 flex flex-col items-center justify-center px-3 py-2 min-h-0 overflow-y-auto">
        <div className="relative w-full flex-1 rounded-xl overflow-hidden bg-black/60 min-h-0">
          <video
            ref={videoRef}
            src={videoSrc}
            autoPlay
            muted
            playsInline
            loop={Boolean(videoSrc)}
            className={`absolute inset-0 w-full h-full object-cover ${mirrorVideo ? "scale-x-[-1]" : ""}`}
          />



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
                    key={countdown}
                    initial={{ scale: 2, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.5, opacity: 0 }}
                    transition={{ duration: 0.4 }}
                    className="text-7xl font-bold text-white drop-shadow-lg font-mono"
                  >
                    {countdown <= 0 ? "GO!" : countdown}
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
                  const isTarget = bubble.type === signal?.type;
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
                  {signal?.label.toUpperCase()} DETECTED
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

       

                {detectedSignals.length === 0 &&(
                      <p className="text-white/35 text-xs font-mono mb-3 text-center">
                      {errorMessage ?? "No signal detected"}
                    </p>
                )
                }

                <p className="text-white/40 text-[10px] font-mono">
                  {attemptsRemaining} ATTEMPT{attemptsRemaining !== 1 ? "S" : ""} LEFT
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {phase === "announcing" && signal && (
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
                  {signal.emoji}
                </motion.div>
                <motion.p
                  initial={{ y: 10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="text-xl font-bold font-mono tracking-wide"
                  style={{ color: signal.color }}
                >
                  {signal.label.toUpperCase()}
                </motion.p>
                <motion.p
                  initial={{ y: 10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.35 }}
                  className="text-white/50 text-xs text-center leading-relaxed max-w-[85%] mt-3 px-2"
                >
                  {signal.description}
                </motion.p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {signal && (
          <motion.div
            key={signal.type}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full mt-2 shrink-0"
          >
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-2">
                <span className="text-lg">{signal.emoji}</span>
                <span className="text-sm font-bold font-mono" style={{ color: signal.color }}>
                  {signal.label}
                </span>
              </div>
              <div className="flex gap-1">
                {Array.from({ length: MAX_ATTEMPTS }).map((_, i) => (
                  <motion.div
                    key={i}
                    animate={
                      i >= attemptsRemaining
                        ? { scale: [1, 0.7, 0], opacity: [1, 0.5, 0.2] }
                        : {}
                    }
                    className="w-5 h-5 rounded-full flex items-center justify-center text-xs"
                    style={{
                      background:
                        i < attemptsRemaining
                          ? `${signal.color}25`
                          : "rgba(255,255,255,0.05)",
                    }}
                  >
                    {i < attemptsRemaining ? "♥" : "♡"}
                  </motion.div>
                ))}
              </div>
            </div>
            {phase !== "countdown" && phase !== "recording" && (
              <div className="rounded-lg px-2.5 py-1.5 bg-white/5 border border-white/8 mb-1.5">
                <p className="text-white/55 text-xs leading-snug">
                  <span className="text-white/25 text-[10px] font-mono uppercase tracking-widest mr-1.5">Clue</span>
                  {signal.description}
                </p>
              </div>
            )}
            <div className="rounded-lg px-2.5 py-1.5 bg-white/5 border border-white/8">
              <p className="text-white/55 text-xs leading-snug">
                <span className="text-white/25 text-[10px] font-mono uppercase tracking-widest mr-1.5">Tip</span>
                {signal.actingTip}
              </p>
            </div>

            {detectedSignals.length > 0 &&
              phase !== "idle" &&
              phase !== "countdown" &&
              phase !== "recording" &&
              phase !== "analyzing" && (
                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-1.5 rounded-lg px-2.5 py-1.5 bg-violet-500/5 border border-violet-500/15"
                >
                  <p className="text-[9px] text-violet-300/50 uppercase tracking-widest mb-1 font-mono">
                    Detected
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {detectedSignals.map((s) => {
                      const info = SIGNALS.find((sig) => sig.type === s);
                      const isTarget = s === signal.type;
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
  );
}
