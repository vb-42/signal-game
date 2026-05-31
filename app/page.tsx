"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { BOOT_SEEN_KEY } from "@/lib/routes";
import DeviceShell from "@/components/DeviceShell";
import HomeScreen from "@/components/HomeScreen";
import type { HomeScreenHandle } from "@/components/HomeScreen";

type BootPhase = "video" | "home" | "ready";

function resolveInitialPhase(): BootPhase {
  if (typeof window === "undefined") return "video";
  const params = new URLSearchParams(window.location.search);
  if (params.get("menu") === "1") return "ready";
  if (sessionStorage.getItem(BOOT_SEEN_KEY) === "1") return "home";
  return "video";
}

export default function HomePage() {
  const [phase, setPhase] = useState<BootPhase>(resolveInitialPhase);
  const videoRef = useRef<HTMLVideoElement>(null);
  const homeRef = useRef<HomeScreenHandle>(null);
  const router = useRouter();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("menu") === "1") {
      setPhase("ready");
      return;
    }
    if (sessionStorage.getItem(BOOT_SEEN_KEY) === "1") {
      setPhase((current) => (current === "video" ? "home" : current));
    }
  }, []);

  function markBootSeen() {
    sessionStorage.setItem(BOOT_SEEN_KEY, "1");
  }

  function handleVideoEnd() {
    markBootSeen();
    setPhase("home");
  }

  function skipVideo() {
    markBootSeen();
    setPhase("home");
  }

  function handleVideoPlay() {
    const duration = videoRef.current?.duration ?? 7;
    import("@/lib/sounds").then(({ playBootSound }) => {
      playBootSound(duration);
    });
  }

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (phase === "video") setPhase("home");
    }, 15000);
    return () => clearTimeout(timeout);
  }, [phase]);

  if (phase === "video") {
    return (
      <DeviceShell label="BOOT" hints={{ b: "Skip" }} onB={skipVideo}>
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
              background: "radial-gradient(circle, rgba(139,92,246,0.12) 0%, transparent 70%)",
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
            whileHover={{ scale: 1.1, opacity: 1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setPhase("video")}
            className="absolute top-3 left-3 w-7 h-7 rounded-full border border-white/15 bg-white/5 flex items-center justify-center cursor-pointer opacity-40 hover:opacity-100 transition-opacity"
            title="Replay boot sequence"
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path
                d="M6 1.5C3.515 1.5 1.5 3.515 1.5 6S3.515 10.5 6 10.5 10.5 8.485 10.5 6"
                stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"
                className="text-violet-300"
              />
              <path
                d="M9 1.5L10.5 3 9 4.5"
                stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"
                className="text-violet-300"
              />
            </svg>
          </motion.button>


          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-5xl font-bold tracking-tight mb-3 font-mono"
            style={{
              background: "linear-gradient(135deg, #f0f0ff 0%, #a78bfa 50%, #ec4899 100%)",
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


        
        </div>
      </motion.div>
    </DeviceShell>
  );
}
