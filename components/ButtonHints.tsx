"use client";

import { motion } from "framer-motion";

export interface DeviceHints {
  a?: string;
  b?: string;
  dpad?: { label: string; arrows?: "lr" | "ud" | "all" };
}

const A_GRADIENT = "linear-gradient(180deg, #faba6b 0%, #e8903c 50%, #c46214 100%)";
const B_GRADIENT = "linear-gradient(180deg, #4faeff 0%, #107fff 50%, #0050c7 100%)";
const D_PAD_GRADIENT = "linear-gradient(180deg, #bbb 0%, #999 100%)";

const ARROW_LABELS = {
  lr: "◀▶",
  ud: "▲▼",
  all: "✛",
} as const;

function HintItem({
  label,
  pulse = false,
  pill,
}: {
  label: string;
  pulse?: boolean;
  pill: React.ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: [0.32, 0.72, 0, 1] }}
      className="flex items-center gap-1.5"
    >
      {pulse ? (
        <motion.div
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          {pill}
        </motion.div>
      ) : (
        pill
      )}
      <span className="text-white/40 text-xs font-mono">{label}</span>
    </motion.div>
  );
}

export default function ButtonHints({ hints }: { hints?: DeviceHints }) {
  if (!hints || (!hints.a && !hints.b && !hints.dpad)) {
    return null;
  }

  const dpadArrows = hints.dpad?.arrows ?? "lr";

  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 flex justify-center px-4 pb-4 pt-8">
      <div
        className="absolute inset-x-0 bottom-0 h-16 pointer-events-none"
        style={{
          background: "linear-gradient(to top, rgba(8,8,12,0.95) 0%, transparent 100%)",
        }}
        aria-hidden
      />
      <div className="relative flex items-center justify-center gap-4">
        {hints.dpad && (
          <HintItem
            label={hints.dpad.label}
            pill={
              <span
                className="inline-flex items-center justify-center w-5 h-5 rounded text-[10px] font-bold"
                style={{
                  background: D_PAD_GRADIENT,
                  color: "#111",
                }}
              >
                {ARROW_LABELS[dpadArrows]}
              </span>
            }
          />
        )}
        {hints.a && (
          <HintItem
            label={hints.a}
            pulse
            pill={
              <span
                className="inline-flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-bold text-white"
                style={{ background: A_GRADIENT }}
              >
                a
              </span>
            }
          />
        )}
        {hints.b && (
          <HintItem
            label={hints.b}
            pulse
            pill={
              <span
                className="inline-flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-bold text-white"
                style={{ background: B_GRADIENT }}
              >
                b
              </span>
            }
          />
        )}
      </div>
    </div>
  );
}
