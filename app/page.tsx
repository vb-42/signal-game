"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { BOOT_SEEN_KEY } from "@/lib/routes";
import DeviceShell from "@/components/DeviceShell";
import HomeScreen from "@/components/HomeScreen";
import type { HomeScreenHandle } from "@/components/HomeScreen";
import { DotPatternIcon } from "@/components/HomeScreen";
import LandingDeviceDemo, { LANDING_DEMO_LABEL } from "@/components/LandingDeviceDemo";
import RevealVideoCard from "@/components/RevealVideoCard";
import { SIGNALS } from "@/lib/signals";
import { playBootSound } from "@/lib/sounds";
import SignalCarousel from "@/components/SignalCarousel";

const NAV_DOT_PATTERNS: Record<string, string[]> = {
  Play: ["010000000", "011000000", "011100000", "011110000", "011111000", "011110000", "011100000", "011000000", "010000000"],
  Leaderboard: ["100000000", "110000000", "111000000", "111100000", "111110000", "111111000", "111111100", "111111110", "111111111"],
  Manifesto: ["111111111", "100000001", "100000001", "100000001", "100000001", "100000001", "100000001", "100000001", "111111111"],
};

function NavDotPattern({ rows }: { rows: string[] }) {
  const cell = 2.4;
  const gap = 0.7;
  const pitch = cell + gap;
  const size = rows.length * cell + (rows.length - 1) * gap;

  return (
    <svg width="18" height="18" viewBox={`0 0 ${size} ${size}`} fill="none" aria-hidden>
      {rows.map((row, y) =>
        [...row].map((dot, x) => (
          <rect
            key={`${x}-${y}`}
            x={x * pitch}
            y={y * pitch}
            width={cell}
            height={cell}
            rx={0.7}
            fill="currentColor"
            opacity={dot === "1" ? 0.8 : 0.06}
          />
        ))
      )}
    </svg>
  );
}

type BootPhase = "landing" | "video" | "home" | "ready";

const LANDING_STATS = [
  "12 signals",
  "3 attempts each",
  "Camera powered",
];

function resolveInitialPhase(): BootPhase {
  if (typeof window === "undefined") return "landing";
  const params = new URLSearchParams(window.location.search);
  if (params.get("menu") === "1") return "ready";
  if (params.get("home") === "1") return "home";
  return "landing";
}

export default function HomePage() {
  const [phase, setPhase] = useState<BootPhase>(resolveInitialPhase);
  const [powerBtnHovered, setPowerBtnHovered] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const homeRef = useRef<HomeScreenHandle>(null);
  const router = useRouter();

  function markBootSeen() {
    sessionStorage.setItem(BOOT_SEEN_KEY, "1");
  }

  function handleVideoEnd() {
    markBootSeen();
    setPhase("ready");
  }

  function skipVideo() {
    markBootSeen();
    setPhase("ready");
  }

  function powerOnDevice() {
    if (sessionStorage.getItem(BOOT_SEEN_KEY) === "1") {
      setPhase("ready");
      return;
    }

    setPhase("video");
  }

  function startPlaying() {
    sessionStorage.removeItem(BOOT_SEEN_KEY);
    setPhase("video");
  }

  function handleVideoPlay() {
    const duration = videoRef.current?.duration ?? 7;
    import("@/lib/sounds").then(({ playBootSound }) => {
      playBootSound(duration);
    });
  }

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (phase === "video") setPhase("ready");
    }, 15000);
    return () => clearTimeout(timeout);
  }, [phase]);

  if (phase === "landing") {
    return (
      <main
        style={{
          backgroundImage: "url('/bg-hand.png')",
          backgroundRepeat: "no-repeat",
          backgroundPosition: "center top",
          backgroundSize: "cover",
          backgroundAttachment: "fixed",
        }}
        className="relative bg-[#D0D5D4] text-white"
      >
        {/* Floating nav */}
        <motion.nav
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3, ease: [0.2, 0, 0, 1] }}
          className="fixed left-1/2 top-5 z-50 -translate-x-1/2"
        >
          <div
            className="flex items-center gap-1 rounded-[50px] bg-white px-2 py-1.5"
            style={{
              boxShadow:
                "rgba(0,0,0,0.02) 0px 0px 0px 1px, rgba(0,0,0,0.02) 0px 1px 1px 0.5px, rgba(0,0,0,0.02) 0px 3px 3px 1.5px, rgba(0,0,0,0.02) 0px 6px 6px -3px, rgba(0,0,0,0.02) 0px 12px 12px -6px, rgba(0,0,0,0.02) 0px 24px 24px -12px",
            }}
          >
            <a
              href="/"
              className="flex items-center gap-2 rounded-full px-3 py-1"
            >

              <span className="text-[15px] font-semibold text-gray-900 tracking-tight">
                Signal
              </span>
            </a>

            <div className="mx-1 h-4 w-px bg-black/[0.06]" />

            <div className="flex items-center gap-0.5">
              {([
                { label: "Play", action: startPlaying },
                { label: "Leaderboard", action: () => router.push("/leaderboard") },
                { label: "Manifesto", action: () => router.push("/manifesto") },
              ] as const).map((item) => (
                <button
                  key={item.label}
                  type="button"
                  onClick={item.action}
                  className="group relative rounded-full px-3.5 py-1.5 text-[15px] font-medium tracking-[-0.01em] text-black/70 transition-colors duration-150 ease hover:bg-black/[0.04] hover:text-black motion-reduce:transition-none"
                >
                  <span className="relative z-10 flex items-center gap-1.5">
                    <span className="inline-block w-0 overflow-hidden opacity-0 transition-all duration-150 ease [@media(hover:hover)_and_(pointer:fine)]:group-hover:w-[18px] [@media(hover:hover)_and_(pointer:fine)]:group-hover:opacity-100 motion-reduce:transition-none motion-reduce:group-hover:w-0 motion-reduce:group-hover:opacity-0">
                      <NavDotPattern rows={NAV_DOT_PATTERNS[item.label] ?? []} />
                    </span>
                    {item.label}
                  </span>
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={powerOnDevice}
              className="cursor-pointer ml-1 inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-[15px] font-medium tracking-[-0.2px] text-white transition-transform active:scale-[0.96]"
              style={{
                background: "linear-gradient(rgb(39, 40, 47) 0%, rgb(13, 12, 15) 100%)",
              }}
            >
              Power On
              <svg width="14" height="14" viewBox="0 0 18 18" fill="none" className="opacity-80">
                <path d="M7 4l6 5-6 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>
        </motion.nav>

        {/* Hero section */}
        <section className="relative min-h-screen overflow-hidden">
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute left-[-12%] top-[-18%] h-96 w-96 rounded-full bg-[#F75B1E]/15 blur-3xl" />
            <div className="absolute bottom-[-18%] right-[-12%] h-96 w-96 rounded-full bg-pink-500/10 blur-3xl" />
            <div className="absolute inset-0 opacity-[0.08]" />
          </div>

          <div className="relative z-10 flex flex-row mx-auto grid min-h-screen w-full max-w-7xl items-center gap-8 px-5 py-8 lg:grid-cols-[0.9fr_1.1fr] lg:px-10">
            <motion.div
              initial={{ opacity: 0, y: 18, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ type: "spring", duration: 0.7, bounce: 0 }}
              className="absolute mx-auto w-full max-w-3xl"
              style={{
                perspective: "1200px",
              }}
            >
              <motion.div
                animate={{ rotateX: powerBtnHovered ? -2 : 0, rotateY: powerBtnHovered ? 1 : 0 }}
                transition={{ type: "spring", duration: 0.6, bounce: 0.1 }}
                style={{ transformStyle: "preserve-3d" }}
              >
                <DeviceShell
                  presentation="embedded"
                  label={LANDING_DEMO_LABEL}
                  isLensOpen
                  crt={false}
                  hints={{ a: "Power", b: "Board" }}
                  onA={powerOnDevice}
                  onB={() => router.push("/leaderboard")}
                >
                  <LandingDeviceDemo />
                </DeviceShell>
              </motion.div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.24 }}
              className="absolute right-0 -translate-x-1/2 mt-8 flex flex-col justify-center gap-3 sm:flex-row lg:justify-start"
            >
              <button
                type="button"
                onClick={startPlaying}
                onMouseEnter={() => setPowerBtnHovered(true)}
                onMouseLeave={() => setPowerBtnHovered(false)}
                className=" font-mono font-semibold text-lg tracking-widest text-white inline-flex h-full cursor-pointer items-center justify-center px-8 py-4 no-underline rounded-[100px] bg-[#F75B1E] transition-transform duration-150 ease will-change-transform [@media(hover:hover)_and_(pointer:fine)]:hover:scale-[1.02] [@media(hover:hover)_and_(pointer:fine)]:hover:-translate-y-px active:scale-[0.97] active:translate-y-0 motion-reduce:transition-none motion-reduce:hover:scale-100 motion-reduce:hover:translate-y-0 motion-reduce:active:scale-100"
                style={{
                  background: "linear-gradient(rgb(39, 40, 47) 0%, rgb(13, 12, 15) 100%)",
                }}
              >
                Power On
              </button>
            </motion.div>
          </div>
        </section>

        {/* Feature bento section */}
        <section id="features" className="relative z-10 bg-[#f0f2f1] px-5 py-24 lg:px-10">
          <div className="mx-auto max-w-5xl">
            {/* Section header */}
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.6, ease: [0.2, 0, 0, 1] }}
              className="mb-16 text-center"
            >
              <h2 className="text-4xl font-semibold tracking-tight text-gray-900 sm:text-5xl" style={{ textWrap: "balance" }}>
                A game that reads your non-verbal cues.
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-lg text-gray-500" style={{ textWrap: "pretty" }}>
                Act out social signals in front of your camera. 
              </p>
            </motion.div>

            {/* Bento grid */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {/* Large card — signals */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.5, ease: [0.2, 0, 0, 1] }}
                className="relative overflow-hidden rounded-3xl border-none bg-white p-8 shadow-[0_0_0_1px_rgba(0,0,0,0.06),0_1px_2px_-1px_rgba(0,0,0,0.06),0_2px_4px_0_rgba(0,0,0,0.04)] sm:col-span-2 lg:col-span-2 lg:row-span-2"
              >
                <h3 className="text-2xl font-semibold text-gray-900">12 social signals to master.</h3>
                <p className="mt-2  text-base text-gray-500">
                  From confidence to confusion, agreement to frustration — each round challenges you with a different signal to perform.
                </p>
                <div className="mt-8 grid grid-cols-3 gap-3 sm:grid-cols-4">
                  {SIGNALS.map((signal) => (
                    <div
                      key={signal.type}
                      className="flex flex-col items-center gap-1.5 rounded-2xl bg-white/70 px-3 py-3 shadow-[0_1px_3px_rgba(0,0,0,0.04),0_0_0_1px_rgba(0,0,0,0.03)]"
                    >
                      <span className="text-2xl">{signal.emoji}</span>
                      <span className="text-xs font-medium text-gray-600">{signal.label}</span>
                    </div>
                  ))}
                </div>
              </motion.div>

              {/* Small card — camera */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.5, delay: 0.08, ease: [0.2, 0, 0, 1] }}
                className="relative overflow-hidden rounded-3xl border-none bg-white p-8 shadow-[0_0_0_1px_rgba(0,0,0,0.06),0_1px_2px_-1px_rgba(0,0,0,0.06),0_2px_4px_0_rgba(0,0,0,0.04)]"
              >
                <h3 className="text-2xl font-semibold text-gray-900">Camera powered.</h3>
                <p className="mt-2 text-base text-gray-500">
                  Your webcam captures every micro-expression in real time — analyzed by Interhuman AI.
                </p>
                <div className="mt-6 flex items-center justify-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/80 shadow-[0_2px_8px_rgba(0,0,0,0.06)]">
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-orange-600">
                      <circle cx="12" cy="12" r="3.5" />
                      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
                    </svg>
                  </div>
                </div>
              </motion.div>

              {/* Small card — attempts */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.5, delay: 0.16, ease: [0.2, 0, 0, 1] }}
                className="relative overflow-hidden rounded-3xl border-none bg-white p-8 shadow-[0_0_0_1px_rgba(0,0,0,0.06),0_1px_2px_-1px_rgba(0,0,0,0.06),0_2px_4px_0_rgba(0,0,0,0.04)]"
              >
                <h3 className="text-2xl font-semibold text-gray-900">3 attempts each.</h3>
                <p className="mt-2 text-base text-gray-500">
                  Didn&apos;t nail it? You get two more tries per signal. Your best performance counts.
                </p>
                <div className="mt-6 flex items-center justify-center gap-2">
                  {[1, 2, 3].map((n) => (
                    <div
                      key={n}
                      className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/80 font-mono text-sm font-semibold text-emerald-700 shadow-[0_2px_8px_rgba(0,0,0,0.06)]"
                    >
                      {n}
                    </div>
                  ))}
                </div>
              </motion.div>
            </div>

            {/* Second row — wide cards */}
            <div className="mt-4 grid gap-4 sm:grid-cols-1">


              {/* Leaderboard */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.5, delay: 0.12, ease: [0.2, 0, 0, 1] }}
                className="relative overflow-hidden rounded-3xl border-none bg-white p-8 shadow-[0_0_0_1px_rgba(0,0,0,0.06),0_1px_2px_-1px_rgba(0,0,0,0.06),0_2px_4px_0_rgba(0,0,0,0.04)]"
              >
                <h3 className="text-2xl font-semibold text-gray-900">Compete globally.</h3>
                <p className="mt-2 text-base text-gray-500">
                  See how your signal game stacks up against other players on the leaderboard.
                </p>
                <div className="mt-6 flex flex-col gap-1.5">
                  {[
                    { rank: 1, name: "SignalPro", score: "11/12" },
                    { rank: 2, name: "BodyLang", score: "10/12" },
                    { rank: 3, name: "You?", score: "—" },
                  ].map((row) => (
                    <div
                      key={row.rank}
                      className="flex items-center gap-3 rounded-xl bg-white/80 px-4 py-2.5 shadow-[0_1px_3px_rgba(0,0,0,0.04)]"
                    >
                      <span className="font-mono text-sm font-semibold text-sky-600 tabular-nums">{row.rank}</span>
                      <span className="flex-1 text-base font-medium text-gray-700">{row.name}</span>
                      <span className="font-mono text-sm text-gray-400 tabular-nums">{row.score}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Apps to come section */}
        <section className="relative z-10 bg-[#0a0a0f] px-5 py-28 lg:px-10">
          <div className="mx-auto max-w-5xl">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.6, ease: [0.2, 0, 0, 1] }}
              className="mb-6 text-center"
            >
              <p className="mb-3 font-mono text-sm font-semibold uppercase tracking-[0.2em] text-[#F75B1E]">
                Coming soon
              </p>
              <h2
                className="text-4xl font-semibold tracking-tight text-white sm:text-5xl"
                style={{ textWrap: "balance" }}
              >
                What if every app could read the room?
              </h2>
              <p
                className="mx-auto mt-4 max-w-2xl text-lg text-white/50"
                style={{ textWrap: "pretty" }}
              >
                Social signal detection isn&apos;t just a game. Imagine your everyday apps reacting to what you actually feel — not just what you type.
              </p>
            </motion.div>

            {/* App concept cards */}
            <div className="mt-16 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[
                {
                  name: "Stocks",
                  signal: "Stress & Uncertainty",
                  idea: "Your trading app notices rising stress during a volatile session and gently suggests: \"You've been tense for 4 minutes. Step away?\"",
                  gradient: "from-[rgb(212,124,15)]/20 to-[rgb(143,89,46)]/10",
                  signalColor: "text-red-400",
                  dotColor: "bg-red-400",
                  dotPattern: ["100000010", "110000110", "010001100", "011001000", "001010000", "001110000", "000100000", "000000000", "000000000"],
                },
                {
                  name: "Video Calls",
                  signal: "Disengagement & Confusion",
                  idea: "Your meeting tool detects half the room has checked out and surfaces a quiet prompt: \"Attention is drifting — maybe time for a break.\"",
                  gradient: "from-blue-500/20 to-cyan-500/10",
                  signalColor: "text-blue-400",
                  dotColor: "bg-blue-400",
                  dotPattern: ["000111000", "001111100", "011111110", "110111011", "110101011", "110111011", "011111110", "000000000", "000000000"],
                },
                {
                  name: "Learning",
                  signal: "Confusion & Frustration",
                  idea: "Your study app spots frustration building on a hard concept and offers an alternative explanation before you quit.",
                  gradient: "from-[#F75B1E]/20 to-orange-500/10",
                  signalColor: "text-[#F75B1E]",
                  dotColor: "bg-[#F75B1E]",
                  dotPattern: ["011111110", "010000110", "010001010", "010000010", "011111010", "010000010", "011111010", "010000010", "011111110"],
                },
                {
                  name: "Health",
                  signal: "Stress & Disengagement",
                  idea: "Your wellness app reads chronic stress patterns from daily check-ins and adjusts your mindfulness plan accordingly.",
                  gradient: "from-emerald-500/20 to-green-500/10",
                  signalColor: "text-emerald-400",
                  dotColor: "bg-emerald-400",
                  dotPattern: ["011011110", "111111111", "111111111", "111111111", "011111110", "001111100", "000111000", "000010000", "000000000"],
                },
                {
                  name: "Coaching",
                  signal: "Confidence & Hesitation",
                  idea: "Your presentation coach watches your practice run and flags moments where confidence dropped — with timestamps.",
                  gradient: "from-amber-500/20 to-yellow-500/10",
                  signalColor: "text-amber-400",
                  dotColor: "bg-amber-400",
                  dotPattern: ["001010100", "010111010", "101000101", "011010110", "111101111", "011010110", "101000101", "010111010", "001010100"],
                },
                {
                  name: "Dating",
                  signal: "Interest & Engagement",
                  idea: "Your video date app gives you a private signal: \"They lit up when you talked about travel\" — so you know what landed.",
                  gradient: "from-pink-500/20 to-rose-500/10",
                  signalColor: "text-pink-400",
                  dotColor: "bg-pink-400",
                  dotPattern: ["001111100", "010000010", "100010001", "100010001", "100011101", "100000001", "010000010", "001111100", "000000000"],
                },
              ].map((app, i) => (
                <motion.div
                  key={app.name}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-40px" }}
                  transition={{ duration: 0.5, delay: i * 0.06, ease: [0.2, 0, 0, 1] }}
                  className={`relative overflow-hidden rounded-3xl bg-gradient-to-br ${app.gradient} p-6 border border-white/[0.06]`}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <DotPatternIcon rows={app.dotPattern} />
                    <div>
                      <span className="text-base font-semibold text-white">{app.name}</span>
                      <div className={`flex items-center gap-1.5 ${app.signalColor}`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${app.dotColor}`} />
                        <span className="text-xs font-medium">{app.signal}</span>
                      </div>
                    </div>
                  </div>
                  <p className="text-base leading-relaxed text-white/50">
                    {app.idea}
                  </p>
                </motion.div>
              ))}
            </div>

            <motion.p
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="mt-10 text-center text-base text-white/30"
            >
              Signal Game is the first app on the Interhuman platform. More are coming.
            </motion.p>
          </div>
        </section>

        <RevealVideoCard />

        {/* Signal carousel footer */}
        <section className="relative z-10 bg-[#080810] px-5 py-20 lg:px-10 overflow-hidden">
          <div className="mx-auto max-w-5xl">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.6, ease: [0.2, 0, 0, 1] }}
              className="mb-4 text-center"
            >
              <p className="font-mono text-sm font-semibold uppercase tracking-[0.2em] text-white/30">
                Browse signals
              </p>
            </motion.div>
          </div>
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="h-[360px] overflow-hidden"
          >
            <SignalCarousel className="h-full" />
          </motion.div>
        </section>
      </main>
    );
  }

  if (phase === "video") {
    return (
      <DeviceShell label="BOOT" crt={false} hints={{ b: "Skip" }} onB={skipVideo}>
        <div className="relative flex-1 flex flex-col bg-black overflow-hidden">
          <video
            ref={videoRef}
            src="/boot.mp4"
            autoPlay
            muted
            playsInline
            onPlay={handleVideoPlay}
            onEnded={handleVideoEnd}
            onError={handleVideoEnd}
            className="absolute inset-0 w-full h-full object-cover"
          />
        </div>
      </DeviceShell>
    );
  }

  if (phase === "home") {
    return (
      <DeviceShell
        label="HOME"
        hints={{ a: "Open", dpad: { label: "Navigate", arrows: "all" } }}
        onA={() => homeRef.current?.a()}
        onUp={() => homeRef.current?.up()}
        onDown={() => homeRef.current?.down()}
        onLeft={() => homeRef.current?.left()}
        onRight={() => homeRef.current?.right()}
      >
        <HomeScreen ref={homeRef} onLaunch={() => setPhase("ready")} />
      </DeviceShell>
    );
  }

  return (
    <DeviceShell
      label="MENU"
      hints={{ a: "Start", b: "Leaderboard" }}
      onA={() => router.push("/onboarding")}
      onB={() => router.push("/leaderboard")}
    >
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
        className="relative flex flex-col flex-1 bg-[#0a0a0f] overflow-hidden"
      >
        {/* Background glow */}
        <div className="absolute inset-0 pointer-events-none">
          <motion.div
            className="absolute top-1/3 left-1/2 -translate-x-1/2 w-48 h-48 rounded-full"
            style={{
              background: "radial-gradient(circle, rgba(247,91,30,0.12) 0%, transparent 70%)",
            }}
            animate={{ scale: [1, 1.15, 1], opacity: [0.5, 0.8, 0.5] }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
          />
        </div>

        <div className="relative z-10 flex flex-col items-center text-center px-4 pt-8 pb-4 flex-1 justify-center">
          {/* Replay boot button — top left */}
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            whileHover={{ scale: 1.06, opacity: 1 }}
            whileTap={{ scale: 0.96 }}
            onClick={() => setPhase("video")}
            className="absolute top-3 left-3 w-7 h-7 rounded-full border border-white/15 bg-white/5 flex items-center justify-center cursor-pointer opacity-40 hover:opacity-100 transition-opacity"
            title="Replay boot sequence"
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path
                d="M6 1.5C3.515 1.5 1.5 3.515 1.5 6S3.515 10.5 6 10.5 10.5 8.485 10.5 6"
                stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"
                className="text-[#F75B1E]"
              />
              <path
                d="M9 1.5L10.5 3 9 4.5"
                stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"
                className="text-[#F75B1E]"
              />
            </svg>
          </motion.button>


          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-5xl font-semibold tracking-tight mb-3 font-mono"
            style={{
              background: "linear-gradient(135deg, #f0f0ff 0%, #F75B1E 50%, #ec4899 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            SIGNAL
            <br />
            GAME
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-base text-white/45 max-w-xs mb-1"
          >
            ACT OUT 12 SIGNALS · 3 ATTEMPTS EACH
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.3 }}
            className="mt-7 flex w-full max-w-xs flex-col gap-2"
          >
            <button
              type="button"
              onClick={() => router.push("/onboarding")}
              className="min-h-11 rounded-2xl bg-white px-5 py-3 font-mono text-sm font-semibold uppercase tracking-[0.18em] text-black shadow-[0_16px_40px_rgba(255,255,255,0.14)] transition-transform active:scale-[0.96]"
            >
              Start game
            </button>
            <button
              type="button"
              onClick={() => router.push("/leaderboard")}
              className="min-h-11 rounded-2xl bg-white/[0.06] px-5 py-3 font-mono text-sm font-semibold uppercase tracking-[0.18em] text-white/65 shadow-[0_0_0_1px_rgba(255,255,255,0.08)] transition-[transform,background-color] hover:bg-white/[0.09] active:scale-[0.96]"
            >
              Leaderboard
            </button>
          </motion.div>

        </div>
      </motion.div>
    </DeviceShell>
  );
}
