"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { MENU_PATH } from "@/lib/routes";
import type { LeaderboardEntry } from "@/lib/db";
import DeviceShell from "@/components/DeviceShell";

const rankMedal: Record<number, string> = { 0: "🥇", 1: "🥈", 2: "🥉" };

function formatDate(dateStr: string) {
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  } catch {
    return "";
  }
}

export default function LeaderboardShell({ entries: initialEntries }: { entries: LeaderboardEntry[] }) {
  const [entries] = useState(initialEntries);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const router = useRouter();
  const listRef = useRef<HTMLDivElement>(null);

  const totalItems = entries.length;

  const goBack = useCallback(() => router.push(MENU_PATH), [router]);
  const moveUp = useCallback(() => setSelectedIndex((prev) => Math.max(prev - 1, 0)), []);
  const moveDown = useCallback(() => setSelectedIndex((prev) => Math.min(prev + 1, totalItems - 1)), [totalItems]);

  useEffect(() => {
    const el = listRef.current?.querySelector(`[data-index="${selectedIndex}"]`);
    el?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [selectedIndex]);

  const winners = entries.filter((e) => e.completed_signals === 12);
  const others = entries.filter((e) => e.completed_signals < 12);

  return (
    <DeviceShell
      label="SCORES"
      hints={{ dpad: { label: "Navigate", arrows: "ud" }, b: "Back" }}
      onB={goBack}
      onUp={moveUp}
      onDown={moveDown}
    >
      <div className="flex flex-col flex-1 bg-[#0a0a0f]">
        <div className="flex-1 overflow-y-auto px-4 py-4">
          <div className="text-center mb-5">
            <div className="text-4xl mb-2">🏆</div>
            <h2 className="text-xl font-bold text-white mb-1 font-mono">TOP PLAYERS</h2>
            <p className="text-white/35 text-[10px] font-mono">
              RANKED BY SIGNALS · FEWEST ATTEMPTS
            </p>
          </div>

          {entries.length === 0 ? (
            <div className="text-center py-10">
              <div className="text-4xl mb-3">🌑</div>
              <p className="text-white/40 mb-1 text-sm font-mono">NO SCORES YET</p>
              <p className="text-white/25 text-[10px] mb-6 font-mono">
                BE THE FIRST TO COMPLETE ALL 12 SIGNALS
              </p>
            </div>
          ) : (
            <div ref={listRef}>
              {winners.length > 0 && (
                <section className="mb-6">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-[10px] uppercase tracking-widest text-white/30 font-mono">
                      Hall of Fame · 12/12
                    </span>
                    <div className="flex-1 h-px bg-white/8" />
                  </div>
                  <div className="space-y-2">
                    {winners.map((entry, i) => (
                      <motion.div
                        key={entry.id}
                        data-index={i}
                        initial={{ opacity: 0, x: -12 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.04 }}
                        className={`flex items-center gap-3 px-3 py-3 rounded-xl border transition-colors ${
                          selectedIndex === i ? "ring-1 ring-purple-400/60" : ""
                        }`}
                        style={{
                          background:
                            selectedIndex === i
                              ? "rgba(124,58,237,0.15)"
                              : i === 0
                                ? "linear-gradient(135deg, rgba(245,158,11,0.1), rgba(251,191,36,0.04))"
                                : "rgba(255,255,255,0.03)",
                          borderColor:
                            selectedIndex === i
                              ? "rgba(168,85,247,0.5)"
                              : i === 0
                                ? "rgba(245,158,11,0.25)"
                                : "rgba(255,255,255,0.07)",
                        }}
                      >
                        <span className="text-xl w-7 text-center">{rankMedal[i] ?? `${i + 1}`}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-white font-semibold truncate text-sm">{entry.username}</p>
                          <p className="text-white/25 text-[10px] font-mono">{formatDate(entry.completed_at)}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-green-400 font-mono font-semibold text-xs tabular-nums">
                            {entry.completed_signals}/12
                          </p>
                          <p className="text-white/25 text-[10px] font-mono tabular-nums">
                            {entry.total_attempts} att
                          </p>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </section>
              )}

              {others.length > 0 && (
                <section className="mb-6">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-[10px] uppercase tracking-widest text-white/30 font-mono">
                      Partial
                    </span>
                    <div className="flex-1 h-px bg-white/8" />
                  </div>
                  <div className="space-y-2">
                    {others.map((entry, i) => {
                      const globalIndex = winners.length + i;
                      return (
                        <motion.div
                          key={entry.id}
                          data-index={globalIndex}
                          initial={{ opacity: 0, x: -12 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: globalIndex * 0.04 }}
                          className={`flex items-center gap-3 px-3 py-3 rounded-xl border transition-colors ${
                            selectedIndex === globalIndex ? "ring-1 ring-purple-400/60" : ""
                          }`}
                          style={{
                            background:
                              selectedIndex === globalIndex
                                ? "rgba(124,58,237,0.15)"
                                : "rgba(255,255,255,0.02)",
                            borderColor:
                              selectedIndex === globalIndex
                                ? "rgba(168,85,247,0.5)"
                                : "rgba(255,255,255,0.07)",
                          }}
                        >
                          <span className="text-white/25 font-mono text-xs w-7 text-center">
                            {globalIndex + 1}
                          </span>
                          <div className="flex-1 min-w-0">
                            <p className="text-white/65 font-medium truncate text-sm">{entry.username}</p>
                            <p className="text-white/20 text-[10px] font-mono">{formatDate(entry.completed_at)}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-white/45 font-mono text-xs tabular-nums">
                              {entry.completed_signals}/12
                            </p>
                            <p className="text-white/20 text-[10px] font-mono tabular-nums">
                              {entry.total_attempts} att
                            </p>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </section>
              )}
            </div>
          )}
        </div>
      </div>
    </DeviceShell>
  );
}
