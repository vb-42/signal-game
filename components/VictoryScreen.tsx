"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MENU_PATH } from "@/lib/routes";
import { useRouter } from "next/navigation";
import confetti from "canvas-confetti";
import { SIGNALS, getSignalLabel } from "@/lib/signals";
import type { SignalAttempt } from "@/lib/useGame";
import DeviceShell from "@/components/DeviceShell";

interface VictoryScreenProps {
  totalAttempts: number;
  totalSignals: number;
  attemptHistory?: SignalAttempt[];
}

type Step = "celebrate" | "username" | "submitting" | "done";

const starCount = SIGNALS.length;

export default function VictoryScreen({
  totalAttempts,
  totalSignals,
  attemptHistory = [],
}: VictoryScreenProps) {
  const router = useRouter();
  const [step, setStep] = useState<Step>("celebrate");
  const [username, setUsername] = useState("");
  const [error, setError] = useState<string | null>(null);

  const fireConfetti = () => {
    const end = Date.now() + 3000;
    const colors = ["#7c3aed", "#a855f7", "#ec4899", "#f59e0b", "#10b981"];
    const frame = () => {
      confetti({ particleCount: 3, angle: 60, spread: 55, origin: { x: 0 }, colors });
      confetti({ particleCount: 3, angle: 120, spread: 55, origin: { x: 1 }, colors });
      if (Date.now() < end) requestAnimationFrame(frame);
    };
    frame();
  };

  async function submit() {
    const trimmed = username.trim();
    if (!trimmed) return;
    setStep("submitting");
    setError(null);
    try {
      const res = await fetch("/api/leaderboard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: trimmed,
          completedSignals: totalSignals,
          totalAttempts,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        const msg =
          typeof body.error === "string"
            ? body.error
            : body.error?.fieldErrors?.username?.[0] ?? "Failed to save score";
        setError(msg);
        setStep("username");
        return;
      }
      setStep("done");
    } catch {
      setError("Network error. Please try again.");
      setStep("username");
    }
  }

  const efficiency = Math.round((totalSignals / totalAttempts) * 100);

  const matchedSignals = attemptHistory.filter((a) => a.matched);

  const hints =
    step === "celebrate"
      ? { a: "Claim", b: "Menu" }
      : step === "done"
        ? { a: "Leaderboard", b: "Menu" }
        : undefined;

  return (
    <DeviceShell
      label={step === "done" ? "SAVED" : "VICTORY"}
      hints={hints}
      onA={
        step === "celebrate"
          ? () => setStep("username")
          : step === "done"
            ? () => router.push("/leaderboard")
            : undefined
      }
      onB={step === "celebrate" || step === "done" ? () => router.push(MENU_PATH) : undefined}
    >
      <div className="relative flex-1 flex flex-col bg-[#0a0a0f] overflow-hidden">
        <AnimatePresence mode="wait">
          {step === "celebrate" && (
            <motion.div
              key="celebrate"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="flex-1 flex flex-col items-center justify-center px-4 text-center"
              onAnimationComplete={() => fireConfetti()}
            >
              <div className="flex justify-center gap-0.5 mb-4">
                {Array.from({ length: starCount }).map((_, i) => (
                  <motion.span
                    key={i}
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.04 * i, type: "spring", stiffness: 200 }}
                    className="text-yellow-400 text-[10px]"
                  >
                    ★
                  </motion.span>
                ))}
              </div>

              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: [0, 1.3, 1] }}
                transition={{ duration: 0.6, type: "spring" }}
                className="text-6xl mb-3"
              >
                🏆
              </motion.div>

              <h1 className="text-2xl font-bold text-white mb-1 font-mono">YOU&apos;RE A READER</h1>
              <p className="text-white/45 text-sm mb-4 font-mono">
                {totalSignals}/12 SIGNALS DETECTED
              </p>

              <div className="flex gap-3 w-full max-w-xs mb-4">
                <div className="flex-1 rounded-xl bg-white/5 border border-white/8 p-3">
                  <p className="text-xl font-bold text-violet-400 font-mono tabular-nums">
                    {totalAttempts}
                  </p>
                  <p className="text-[10px] text-white/35 mt-0.5 font-mono">ATTEMPTS</p>
                </div>
                <div className="flex-1 rounded-xl bg-white/5 border border-white/8 p-3">
                  <p className="text-xl font-bold text-green-400 font-mono tabular-nums">
                    {Math.min(efficiency, 100)}%
                  </p>
                  <p className="text-[10px] text-white/35 mt-0.5 font-mono">ACCURACY</p>
                </div>
              </div>

              {matchedSignals.length > 0 && (
                <div className="w-full max-w-xs rounded-xl bg-white/4 border border-white/8 p-3 mb-2">
                  <p className="text-[10px] text-white/30 font-mono uppercase tracking-widest mb-2">
                    Your run
                  </p>
                  <div className="flex flex-wrap gap-1 justify-center">
                    {matchedSignals.map((a, i) => (
                      <span
                        key={i}
                        className="text-[10px] px-2 py-0.5 rounded-full bg-violet-500/15 text-violet-300 font-mono"
                      >
                        {getSignalLabel(a.signalType)}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <motion.button
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => setStep("username")}
                className="w-full max-w-xs py-3.5 rounded-xl font-semibold text-white text-sm cursor-pointer font-mono mt-2"
                style={{ background: "linear-gradient(135deg, #7c3aed, #a855f7)" }}
              >
                CLAIM LEADERBOARD SPOT
              </motion.button>
            </motion.div>
          )}

          {(step === "username" || step === "submitting") && (
            <motion.div
              key="username"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex-1 flex flex-col items-center justify-center px-4 text-center"
            >
              <div className="text-3xl mb-3">✍️</div>
              <h2 className="text-xl font-bold text-white mb-1 font-mono">ENTER YOUR NAME</h2>
              <p className="text-white/35 text-xs mb-6 font-mono">
                DISPLAYED ON THE GLOBAL LEADERBOARD
              </p>

              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && username.trim() && submit()}
                placeholder="Display name..."
                maxLength={50}
                disabled={step === "submitting"}
                className="w-full max-w-xs px-4 py-3 rounded-xl bg-white/5 border border-white/15 text-white placeholder:text-white/25 text-base text-center focus:outline-none focus:border-violet-500/50 transition-colors disabled:opacity-50 font-mono mb-3"
                autoFocus
              />

              {error && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-red-400 text-xs mb-3 font-mono"
                >
                  {error}
                </motion.p>
              )}

              <motion.button
                whileHover={username.trim() ? { scale: 1.03 } : {}}
                whileTap={username.trim() ? { scale: 0.97 } : {}}
                onClick={submit}
                disabled={!username.trim() || step === "submitting"}
                className="w-full max-w-xs py-3.5 rounded-xl font-semibold text-white text-sm cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed font-mono"
                style={{ background: "linear-gradient(135deg, #7c3aed, #a855f7)" }}
              >
                {step === "submitting" ? "SAVING..." : "SUBMIT"}
              </motion.button>

              <button
                onClick={() => router.push("/leaderboard")}
                className="text-white/25 text-xs mt-4 hover:text-white/45 transition-colors cursor-pointer font-mono"
              >
                SKIP →
              </button>
            </motion.div>
          )}

          {step === "done" && (
            <motion.div
              key="done"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex-1 flex flex-col items-center justify-center px-4 text-center"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: [0, 1.2, 1] }}
                transition={{ duration: 0.5 }}
                className="text-5xl mb-3"
              >
                🎉
              </motion.div>
              <h2 className="text-xl font-bold text-white mb-1 font-mono">ON THE BOARD</h2>
              <p className="text-white/40 text-xs mb-6 font-mono">
                <span className="text-violet-300">{username.trim()}</span> IS RANKED
              </p>
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => router.push("/leaderboard")}
                className="w-full max-w-xs py-3.5 rounded-xl font-semibold text-white text-sm cursor-pointer font-mono mb-2"
                style={{ background: "linear-gradient(135deg, #7c3aed, #a855f7)" }}
              >
                VIEW LEADERBOARD
              </motion.button>
              <button
                onClick={() => router.push(MENU_PATH)}
                className="text-white/30 text-xs cursor-pointer hover:text-white/50 transition-colors font-mono"
              >
                BACK TO MENU
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </DeviceShell>
  );
}
