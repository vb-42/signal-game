"use client";

import { motion } from "framer-motion";
import { forwardRef, useEffect, useImperativeHandle, useState } from "react";

export interface HomeScreenHandle {
  up: () => void;
  down: () => void;
  left: () => void;
  right: () => void;
  a: () => void;
}

interface HomeScreenProps {
  onLaunch: () => void;
}

function StatusBar() {
  const [time, setTime] = useState(() => {
    const now = new Date();
    return now.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: false });
  });

  useEffect(() => {
    const tick = () => {
      const now = new Date();
      setTime(now.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: false }));
    };
    const id = setInterval(tick, 10000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="flex items-center justify-between px-4 pt-2 pb-1 shrink-0">
      <span
        className="text-white/80 text-[11px] font-semibold font-mono tabular-nums"
        style={{ WebkitFontSmoothing: "antialiased" }}
      >
        {time}
      </span>
      <div className="flex items-center gap-1.5">
        <div className="flex items-end gap-[2px]">
          {[3, 5, 7, 9].map((h, i) => (
            <div
              key={i}
              className="w-[3px] rounded-[1px]"
              style={{
                height: h,
                background: i < 3 ? "rgba(255,255,255,0.8)" : "rgba(255,255,255,0.25)",
              }}
            />
          ))}
        </div>
        <div className="relative flex items-center">
          <div
            className="rounded-[2px] border border-white/50"
            style={{ width: 18, height: 10 }}
          >
            <div
              className="absolute inset-[2px] rounded-[1px]"
              style={{ width: "70%", background: "rgba(255,255,255,0.75)" }}
            />
          </div>
          <div
            className="rounded-[1px] ml-[1px]"
            style={{ width: 2, height: 5, background: "rgba(255,255,255,0.5)" }}
          />
        </div>
      </div>
    </div>
  );
}

interface MockIconData {
  label: string;
  icon: React.ReactNode;
}

export function DotPatternIcon({ rows }: { rows: string[] }) {
  const cell = 3;
  const gap = 0.9;
  const pitch = cell + gap;
  const size = rows.length * cell + (rows.length - 1) * gap;

  return (
    <svg width="35" height="35" viewBox={`0 0 ${size} ${size}`} fill="none" aria-hidden>
      {rows.map((row, y) =>
        [...row].map((dot, x) => (
          <rect
            key={`${x}-${y}`}
            x={x * pitch}
            y={y * pitch}
            width={cell}
            height={cell}
            rx="0.9"
            fill="white"
            opacity={dot === "1" ? 0.92 : 0.09}
          />
        ))
      )}
    </svg>
  );
}

// Nothing Phone-style: black backgrounds, white dot-matrix glyphs, no gradients
const MOCK_APPS: MockIconData[] = [
  {
    label: "Coming soon",
    icon: <DotPatternIcon rows={["000000000", "011111100", "100000010", "101010110", "100000010", "011111100", "001100000", "000100000", "000000000"]} />,
  },
  {
    label: "Coming soon",
    icon: <DotPatternIcon rows={["000111000", "001111100", "011111110", "110111011", "110101011", "110111011", "011111110", "000000000", "000000000"]} />,
  },
  {
    label: "Coming soon",
    icon: <DotPatternIcon rows={["110000000", "111000000", "011100000", "001110000", "000111000", "000011100", "000001110", "000000111", "000000011"]} />,
  },
  {
    label: "Coming soon",
    icon: <DotPatternIcon rows={["001111100", "010000010", "100010001", "100010001", "100011101", "100000001", "010000010", "001111100", "000000000"]} />,
  },
  {
    label: "Coming soon",
    icon: <DotPatternIcon rows={["000111000", "001111100", "001111100", "000111000", "001111100", "011111110", "111111111", "111000111", "000000000"]} />,
  },
  {
    label: "Coming soon",
    icon: <DotPatternIcon rows={["011111110", "010000110", "010001010", "010000010", "011111010", "010000010", "011111010", "010000010", "011111110"]} />,
  },
  {
    label: "Coming soon",
    icon: <DotPatternIcon rows={["001010100", "010111010", "101000101", "011010110", "111101111", "011010110", "101000101", "010111010", "001010100"]} />,
  },
];

const COLS = 4;
const TOTAL_ITEMS = 1 + MOCK_APPS.length;

function MockIcon({ data, index, selected, onLaunch }: { data: MockIconData; index: number; selected: boolean; onLaunch: () => void }) {
  return (
    <motion.button
      type="button"
      onClick={onLaunch}
      className="flex flex-col items-center gap-1.5 outline-none cursor-pointer select-none"
      initial={{ opacity: 0, scale: 0.7 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: "spring", duration: 0.5, bounce: 0, delay: 0.08 * (index + 1) }}
      whileHover={{ scale: 1.06 }}
      whileTap={{ scale: 0.96 }}
    >
      <div className="relative">
        {selected && (
          <motion.div
            layoutId="app-cursor"
            className="absolute -inset-[4px] rounded-[18px]"
            style={{
              border: "1.5px solid rgba(255,255,255,0.6)",
              boxShadow: "0 0 14px rgba(255,255,255,0.15)",
            }}
            transition={{ type: "spring", duration: 0.3, bounce: 0 }}
          />
        )}
        <div
          className="relative flex items-center justify-center"
          style={{
            width: 52,
            height: 52,
            borderRadius: 14,
            background: "#0a0a0a",
            border: `1px solid ${selected ? "rgba(255,255,255,0.22)" : "rgba(255,255,255,0.09)"}`,
            boxShadow: "0 2px 12px rgba(0,0,0,0.6)",
            opacity: selected ? 1 : 0.55,
            transition: "opacity 150ms ease, border-color 150ms ease",
          }}
        >
          <div className="relative z-10">{data.icon}</div>
        </div>
      </div>
      <span
        className="text-[9px] font-mono tracking-wide text-center leading-tight uppercase"
        style={{
          WebkitFontSmoothing: "antialiased",
          maxWidth: 64,
          color: selected ? "rgba(255,255,255,0.8)" : "rgba(255,255,255,0.35)",
          transition: "color 150ms ease",
          letterSpacing: "0.06em",
        }}
      >
        {data.label}
      </span>
    </motion.button>
  );
}

function SignalGameIcon({ onLaunch, selected }: { onLaunch: () => void; selected: boolean }) {
  return (
    <motion.button
      type="button"
      onClick={onLaunch}
      className="flex flex-col items-center gap-1.5 outline-none cursor-pointer"
      initial={{ opacity: 0, scale: 0.7 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: "spring", duration: 0.5, bounce: 0.2, delay: 0.05 }}
      whileHover={{ scale: 1.06 }}
      whileTap={{ scale: 0.96 }}
    >
      <div className="relative">
        {selected && (
          <motion.div
            layoutId="app-cursor"
            className="absolute -inset-[4px] rounded-[18px]"
            style={{
              border: "1.5px solid rgba(255,255,255,0.6)",
              boxShadow: "0 0 14px rgba(255,255,255,0.15)",
            }}
            transition={{ type: "spring", duration: 0.3, bounce: 0 }}
          />
        )}
        <div
          className="relative flex items-center justify-center"
          style={{
            width: 52,
            height: 52,
            borderRadius: 14,
            background: "#0a0a0a",
            border: `1px solid ${selected ? "rgba(255,255,255,0.28)" : "rgba(255,255,255,0.12)"}`,
            boxShadow: selected
              ? "0 0 18px rgba(255,255,255,0.08), 0 2px 12px rgba(0,0,0,0.6)"
              : "0 2px 12px rgba(0,0,0,0.6)",
            transition: "border-color 150ms ease, box-shadow 150ms ease",
          }}
        >
          <DotPatternIcon rows={["000010000", "000010000", "000111000", "000111000", "001111100", "001111100", "011111110", "000010000", "000010000"]} />
        </div>
      </div>
      <span
        className="text-[9px] font-mono tracking-wide text-center leading-tight uppercase"
        style={{
          WebkitFontSmoothing: "antialiased",
          maxWidth: 64,
          color: "rgba(255,255,255,0.8)",
          letterSpacing: "0.06em",
        } as React.CSSProperties}
      >
        Signal
      </span>
    </motion.button>
  );
}

const HomeScreen = forwardRef<HomeScreenHandle, HomeScreenProps>(
  function HomeScreen({ onLaunch }, ref) {
    const [cursor, setCursor] = useState(0);

    useImperativeHandle(ref, () => ({
      up: () => {
        setCursor((c) => { const n = c - COLS; return n >= 0 ? n : c; });
      },
      down: () => {
        setCursor((c) => { const n = c + COLS; return n < TOTAL_ITEMS ? n : c; });
      },
      left: () => {
        setCursor((c) => (c > 0 ? c - 1 : c));
      },
      right: () => {
        setCursor((c) => (c < TOTAL_ITEMS - 1 ? c + 1 : c));
      },
      a: () => {
        onLaunch();
      },
    }), [cursor, onLaunch]);

    return (
      <motion.div
        key="home"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0, scale: 0.96 }}
        transition={{ duration: 0.35, ease: [0.32, 0.72, 0, 1] }}
        className="relative flex flex-col flex-1 overflow-hidden"
        style={{
          background: "linear-gradient(160deg, #0d0d1a 0%, #0a0a12 40%, #120a1a 100%)",
        }}
      >
        <div className="pointer-events-none absolute inset-0" />
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 60% 40% at 50% 60%, rgba(139,92,246,0.1) 0%, transparent 70%)",
          }}
        />

        <StatusBar />

        <div className="relative z-10 flex flex-1 items-start justify-center px-6 pt-12">
          <div className="grid grid-cols-4 gap-x-5 gap-y-5">
            <SignalGameIcon onLaunch={onLaunch} selected={cursor === 0} />
            {MOCK_APPS.map((app, i) => (
              <MockIcon key={i} data={app} index={i} selected={cursor === i + 1} onLaunch={onLaunch} />
            ))}
          </div>
        </div>
      </motion.div>
    );
  }
);

export default HomeScreen;
