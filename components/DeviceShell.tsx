"use client";

import { motion } from "framer-motion";
import dynamic from "next/dynamic";
import { useEffect, type ReactNode } from "react";
import { handleDeviceKeyDown, withDeviceClick } from "@/lib/deviceControls";
import ButtonHints, { type DeviceHints } from "@/components/ButtonHints";
import { useIsMobile } from "@/lib/useIsMobile";

const ScreenOverlay = dynamic(() => import("./ScreenOverlay"), { ssr: false });

function SideButton({ height, variant = "dark" }: { height: number; variant?: "silver" | "dark" }) {
  const isSilver = variant === "silver";
  return (
    <div className="relative" style={{ width: 4, height }}>
      {/* Recessed slot */}
      <div className="absolute inset-0" style={{
        borderRadius: '100px',
        background: '#1a1a1a',
        boxShadow: 'inset 1px 1px 2px rgba(0,0,0,0.8), inset -0.5px 0 1px rgba(255,255,255,0.05)',
      }} />
      {/* Button body */}
      <div className="absolute" style={{
        top: 2,
        bottom: 2,
        left: 1,
        right: 0,
        borderRadius: '3px 0 0 3px',
        background: isSilver
          ? 'linear-gradient(180deg, #e8e8e8 0%, #d0d0d0 15%, #a8a8a8 50%, #c0c0c0 85%, #dcdcdc 100%)'
          : 'linear-gradient(180deg, #4a4a4a 0%, #333 15%, #1a1a1a 50%, #2a2a2a 85%, #3a3a3a 100%)',
        boxShadow: isSilver
          ? 'inset 0 1px 0 rgba(255,255,255,0.9), inset 0 -1px 0 rgba(0,0,0,0.2), -2px 0 4px rgba(0,0,0,0.3)'
          : 'inset 0 1px 0 rgba(255,255,255,0.15), inset 0 -1px 0 rgba(0,0,0,0.5), -2px 0 4px rgba(0,0,0,0.4)',
      }}>
        {/* Top highlight edge */}
        <div className="absolute inset-x-0 top-0 h-px" style={{
          borderRadius: '3px 0 0 0',
          background: isSilver
            ? 'linear-gradient(90deg, rgba(255,255,255,0.8), rgba(255,255,255,0.4))'
            : 'linear-gradient(90deg, rgba(255,255,255,0.2), rgba(255,255,255,0.05))',
        }} />
      </div>
    </div>
  );
}

function CameraLens({ isOpen }: { isOpen: boolean }) {
  return (
    <div className="relative flex flex-col items-end justify-center bg-[#222] rounded-full overflow-hidden"
      style={{ width: 80, height: 40,
        boxShadow: '0px 0px 1px 1px rgba(255, 255, 255, 0.5) inset'
      }} aria-hidden>
      {/* Silver shutter cover — slides left to reveal the lens */}
      <div
        className="absolute left-0 overflow-hidden rounded-full z-11"
        style={{
          background: 'linear-gradient(90deg, #c4c4c4 0%, #d8d8d8 18%, #bababa 45%, #dedede 70%, #bebebe 100%)',
          width: 40,
          height: 40,
          boxShadow: 'inset .43px .43px 1.72px 0px rgba(255,255,255,0.7), inset -.43px -.43px 1.72px 0px rgba(0,0,0,0.36)',
          transform: isOpen ? 'translateX(0px)' : 'translateX(42px)',
          transition: 'transform 500ms cubic-bezier(0.23, 1, 0.32, 1)',
          zIndex: 10,
        }}
      >
                      <a className="w-full h-full flex flex-col justify-center items-center cursor-pointer hover:opacity-40 transition-opacity" href="https://interhuman.ai" target="_blank">
                <img  src="/logo_icon.png" alt="Interhuman" style={{ height: 20, opacity: 0.35, filter: 'grayscale(1)' }} />
              </a>

        <div className="pointer-events-none absolute inset-0 z-[1]" aria-hidden style={{
          background: 'repeating-radial-gradient(circle at 0 0, rgba(255,255,255,0.035) 0px, rgba(255,255,255,0.035) 1px, transparent 1px, transparent 4px)',
        }} />
        <div className="pointer-events-none absolute inset-0 z-[2]" aria-hidden style={{
          backgroundImage: 'url(/images/sandblasted-texture.png)',
          backgroundSize: '400px 400px',
          backgroundRepeat: 'repeat',
          opacity: 0.35,
          mixBlendMode: 'multiply',
        }} />
        <div className="pointer-events-none absolute inset-0 z-[3]" aria-hidden style={{
          opacity: 0.18,
          mixBlendMode: 'overlay',
          backgroundImage: 'repeating-linear-gradient(0deg, rgba(255,255,255,0.03) 0px, rgba(255,255,255,0.03) 1px, rgba(0,0,0,0.02) 2px, transparent 3px)',
        }} />
        <div className="pointer-events-none absolute inset-0 z-[4]" aria-hidden style={{
          background: 'radial-gradient(circle at top left, rgba(255,255,255,0.35), transparent 60%), radial-gradient(circle at bottom right, rgba(0,0,0,0.08), transparent 60%)',
        }} />
      </div>

      <div className="relative shrink-0 flex items-center justify-center" style={{ width: 40, height: 40 }} aria-hidden>
        <div className="absolute inset-0 rounded-full" />
        <div className="absolute rounded-full border-2 border-black/10" style={{
          inset: 4,
          background: 'linear-gradient(135deg, #1a0a0c 0%, #0d0508 60%, #1c0a0d 100%)',
          boxShadow: '0 0 0 1px rgba(255,255,255,0.06) inset',
        }} />
        <div className="absolute rounded-full" style={{
          inset: 9,
          background: 'radial-gradient(circle at 35% 35%, #1e1218 0%, #0a0508 70%, #050204 100%)',
          boxShadow: '0 0 8px rgba(0,0,0,0.9) inset',
        }} />
        <div className="flex items-center justify-center z-9">
          <div className="rounded-full bg-blue-500/50" style={{ width: 10, height: 10, opacity: 0.1 }} />
          <div className="absolute rounded-full bg-blue-500/10" style={{ width: 6, height: 6 }} />
          <div className="absolute rounded-full bg-blue-500/10" style={{ width: 2, height: 2 }} />
        </div>
        <div className="absolute flex items-center justify-center z-5">
          <div className="rounded-full bg-white" style={{ width: 20, height: 20, opacity: 0.05 }} />
          <div className="absolute rounded-full bg-black" style={{ width: 16, height: 16 }} />
        </div>
        <div className="absolute flex items-center justify-center z-1">
          <div className="rounded-full border-2 border-white" style={{ width: 30, height: 30, opacity: 0.03 }} />
        </div>
      </div>
    </div>
  );
}

interface DeviceShellProps {
  children: ReactNode;
  label?: string;
  isLensOpen?: boolean;
  presentation?: "page" | "embedded";
  crt?: boolean;
  hints?: DeviceHints;
  onA?: () => void;
  onB?: () => void;
  onUp?: () => void;
  onDown?: () => void;
  onLeft?: () => void;
  onRight?: () => void;
}

export default function DeviceShell({
  children,
  label = "SIGNAL-12",
  isLensOpen = false,
  presentation = "page",
  crt = true,
  hints,
  onA,
  onB,
  onUp,
  onDown,
  onLeft,
  onRight,
}: DeviceShellProps) {
  const isEmbedded = presentation === "embedded";

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      handleDeviceKeyDown(e, { onA, onB, onUp, onDown, onLeft, onRight });
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onA, onB, onUp, onDown, onLeft, onRight]);

  const isMobile = useIsMobile();

  return (
    <div
      className={
        isEmbedded
          ? "flex items-center justify-center bg-transparent"
          : "min-h-screen bg-[#08080c] flex items-center justify-center md:p-4"
      }
    >
      <motion.div
        role="group"
        aria-label={label}
        initial={{ opacity: 0, y: 24, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.32, 0.72, 0, 1] }}
        className={isEmbedded ? "relative w-full max-w-3xl" : "relative w-full md:max-w-3xl"}
        style={{ aspectRatio: `1024 / ${!isMobile ? 900 : 1800}` }}
      >
        {/* Right side buttons (outside bezel, desktop only) */}
        <div className="pointer-events-none absolute inset-y-0 z-30 hidden md:flex flex-col" style={{ right: "-4px", top: "58px" }}>
          <div style={{ marginTop: '18%' }}>
            <SideButton height={68} variant="silver" />
          </div>
          <div className="flex flex-col gap-[10px]" style={{ marginTop: '12%' }}>
            <SideButton height={46} variant="dark" />
            <SideButton height={46} variant="dark" />
          </div>
        </div>

        {/* Outer gradient border */}
        <div className="absolute inset-0 hidden md:block" style={{
          borderRadius: '40px',
          padding: '1px',
          background: 'linear-gradient(145deg, #d4d4d4 0%, #c2c2c2 40%, #707070 70%, #adadad 100%)',
          boxShadow: '0 24px 80px rgba(0,0,0,0.8), 0 8px 24px rgba(0,0,0,0.5), 0 0 0 0.5px rgba(255,255,255,0.04)',
        }} />

        {/* Device body */}
        <div
          className="relative h-full w-full overflow-hidden flex flex-col rounded-none md:rounded-[40px]"
          style={{
            background: 'linear-gradient(90deg, #aaaaaa 0%, #bebebe 18%, #a2a2a2 45%, #c4c4c4 70%, #a6a6a6 100%)',
          }}
        >
          {/* Subtle grain */}
          <div className="pointer-events-none absolute inset-0 z-[1]" aria-hidden style={{
            background: 'repeating-radial-gradient(circle at 0 0, rgba(255,255,255,0.035) 0px, rgba(255,255,255,0.035) 1px, transparent 1px, transparent 4px)',
          }} />
          {/* Sandblasted texture (CSS noise) */}
          <div className="pointer-events-none absolute inset-0 z-[2]" aria-hidden style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='200' height='200' filter='url(%23n)' opacity='0.12'/%3E%3C/svg%3E")`,
            backgroundSize: '200px 200px',
            backgroundRepeat: 'repeat',
            opacity: 0.9,
            mixBlendMode: 'multiply',
          }} />
          {/* Metallic lines */}
          <div className="pointer-events-none absolute inset-0 z-[3]" aria-hidden style={{
            opacity: 0.98,
            mixBlendMode: 'overlay',
            backgroundImage: 'repeating-linear-gradient(0deg, rgba(255,255,255,0.03) 0px, rgba(255,255,255,0.03) 1px, rgba(0,0,0,0.02) 2px, transparent 3px)',
          }} />
          {/* Corner bloom */}
          <div className="pointer-events-none absolute inset-0 z-[4]" aria-hidden style={{
            background: 'radial-gradient(circle at top left, rgba(255,255,255,0.35), transparent 30%), radial-gradient(circle at bottom right, rgba(0,0,0,0.08), transparent 35%)',
          }} />
          {/* Inset depth shadows */}
          <div className="pointer-events-none absolute inset-0 z-[5] rounded-[40px]" aria-hidden style={{
            boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.7), inset 0 -2px 4px rgba(0,0,0,0.12), inset 1px 0 2px rgba(255,255,255,0.4), inset -1px 0 2px rgba(0,0,0,0.08)',
          }} />
          {/* Edge highlights */}
          <div className="pointer-events-none absolute inset-x-0 top-0 z-20 h-px" aria-hidden style={{ background: 'linear-gradient(90deg, transparent 10%, rgba(255,255,255,0.5) 30%, rgba(255,255,255,0.7) 50%, rgba(255,255,255,0.5) 70%, transparent 90%)' }} />
          <div className="pointer-events-none absolute inset-y-0 left-0 z-20 w-px" aria-hidden style={{ background: 'linear-gradient(rgba(255,255,255,0.4) 10%, rgba(255,255,255,0.2) 50%, transparent 90%)' }} />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 h-px" aria-hidden style={{ background: 'linear-gradient(90deg, transparent 10%, rgba(0,0,0,0.15) 30%, rgba(0,0,0,0.2) 50%, rgba(0,0,0,0.15) 70%, transparent 90%)' }} />
          <div className="pointer-events-none absolute inset-y-0 right-0 z-20 w-px" aria-hidden style={{ background: 'linear-gradient(rgba(0,0,0,0.1) 10%, rgba(0,0,0,0.06) 50%, transparent 90%)' }} />

          {/* Main layout */}
          <div className="relative z-10 flex flex-col h-full p-4">
            
            {/* Top bezel: camera lens */}
            <div className="w-full flex justify-center items-center pb-2">
              
              <CameraLens isOpen={isLensOpen} />
            </div>

            {/* Screen */}
            <div
              className="relative min-h-0 flex-1 overflow-hidden rounded-[22px]"
              style={{
                background: 'rgb(5,5,5)',
                boxShadow: '0px 0px 10px 1px rgba(255,255,255,0.5) inset',
              }}
            >
              {crt && (
                <>
                  {/* Scanlines */}
                  <div className="pointer-events-none absolute inset-0 z-[11]" aria-hidden style={{
                    backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.012) 2px, rgba(255,255,255,0.012) 3px)',
                    backgroundSize: '100% 3px',
                  }} />
                  {/* Vignette */}
                  <div className="pointer-events-none absolute inset-0 z-[11]" aria-hidden style={{
                    background: 'radial-gradient(70% 70%, transparent 55%, rgba(0,0,0,0.35) 100%)',
                  }} />
                  {/* CRT screen overlay */}
                  <ScreenOverlay
                    crtEnabled={true}
                    bloomEnabled={true}
                    bloomIntensity={0.6}
                    colorNum={8.0}
                    pixelSize={28.0}
                    curve={0.45}
                  />
                </>
              )}
              {/* Screen content */}
              <div className="relative z-10 flex h-full min-h-0 flex-col">
                {children}
                <ButtonHints hints={hints} />
              </div>
            </div>

            {/* Chin */}
            <div
              className="flex shrink-0 items-center justify-between gap-4 pt-3"
              style={{ flex: '0 0 18%' }}
            >

              {/* Left: wordmark + d-pad */}
              <div className="flex min-w-0 flex-col gap-1.5">

                <DPad
                  onUp={withDeviceClick("dpad", onUp)}
                  onDown={withDeviceClick("dpad", onDown)}
                  onLeft={withDeviceClick("dpad", onLeft)}
                  onRight={withDeviceClick("dpad", onRight)}
                />
              </div>

              {/* Right: A/B button cluster */}
              <DeviceButtonCluster
                onA={withDeviceClick("a", onA)}
                onB={withDeviceClick("b", onB)}
              />
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

// Button size and gap are tightly coupled — the center cell = gap so buttons touch flush
const BTN = 38; // px, the button face
const GAP = 2;  // px between buttons

function DPadButton({
  direction,
  onClick,
}: {
  direction: "up" | "down" | "left" | "right";
  onClick?: () => void;
}) {
  const arrows = { up: "▲", down: "▼", left: "◀", right: "▶" };

  return (
    // Black socket frame
    <div
      style={{
        width: BTN,
        height: BTN,
        borderRadius: 4,
        backgroundColor: "#010101",
        padding: 1,
      }}
    >
      <motion.button
        type="button"
        onClick={onClick}
        aria-label={direction}
        whileTap={{ scale: 0.94 }}
        transition={{ type: "spring", stiffness: 600, damping: 30 }}
        className={[
          "relative w-full h-full outline-none rounded-[6px] select-none",
          
        ].join(" ")}
        style={{
          backgroundColor: "#aaa",
          boxShadow:
            "inset 1px 1px 1px #f7f7f7, inset -1px -1px 1px #646464, 0 2px 3px rgba(0,0,0,0.5)",
        }}
      >
        <span
          className="flex items-center justify-center w-full h-full"
          style={{
            fontSize: 8,
            color: "#010101",
            textShadow: "0 1px 0 rgba(255,255,255,0.4)",
          }}
        >
          {arrows[direction]}
        </span>
      </motion.button>
    </div>
  );
}

function DPad({
  onUp,
  onDown,
  onLeft,
  onRight,
}: {
  onUp?: () => void;
  onDown?: () => void;
  onLeft?: () => void;
  onRight?: () => void;
}) {
  // Cross layout using absolute positioning — avoids grid column/row size mismatch
  const housing = BTN * 3 + GAP * 2;
  const mid = (housing - BTN) / 2; // offset to center a button

  return (
    <div
      style={{
        width: housing,
        height: housing,
        borderRadius: 100,
        backgroundColor: "#909090",
        position: "relative",
        boxShadow:
          "inset 2px 2px 5px rgba(0,0,0,0.8), inset -1px -1px 3px rgba(255,255,255,0.08), 0 2px 4px rgba(0,0,0,0.4)",
      }}
    >
      {/* Up — centered horizontally, top row */}
      <div style={{ position: "absolute", left: mid, top: GAP }}>
        <DPadButton direction="up" onClick={onUp} />
      </div>
      {/* Down — centered horizontally, bottom row */}
      <div style={{ position: "absolute", left: mid, bottom: GAP }}>
        <DPadButton direction="down" onClick={onDown} />
      </div>
      {/* Left — centered vertically, left column */}
      <div style={{ position: "absolute", top: mid, left: GAP }}>
        <DPadButton direction="left" onClick={onLeft} />
      </div>
      {/* Right — centered vertically, right column */}
      <div style={{ position: "absolute", top: mid, right: GAP }}>
        <DPadButton direction="right" onClick={onRight} />
      </div>
    </div>
  );
}

function DeviceButtonCluster({
  onA,
  onB,
}: {
  onA?: () => void;
  onB?: () => void;
}) {
  return (
    // Outer bounding wrapper
    <div className="flex items-end justify-center w-36 h-36">
      {/* The Recessed Track: 
        Rotated 45deg clockwise so top -> top-right, and bottom -> bottom-left.
        The inset shadow simulates light falling from the top-left.
      */}
      <div
        className="relative rounded-full rotate-45 flex flex-col justify-between items-center p-1.5"
        style={{
          width: 60,
          height: 128,
          backgroundColor: "#969696",
          boxShadow:
            "inset 4px 4px 8px rgba(0, 0, 0, 0.35), inset -2px -2px 5px rgba(255, 255, 255, 0.5)",
        }}
      >
        {/* Button A (Orange) - Placed first, moves to Top-Right after rotation */}
        <DeviceButton letter="a" variant="primary" onClick={onA} />

        {/* Button B (Blue) - Placed second, moves to Bottom-Left after rotation */}
        <DeviceButton letter="b" variant="secondary" onClick={onB} />
      </div>
    </div>
  );
}

function DeviceButton({
  letter,
  onClick,
  variant = "secondary",
}: {
  letter: string;
  onClick?: () => void;
  variant?: "primary" | "secondary";
}) {
  const isPrimary = variant === "primary";
  const isActive = Boolean(onClick);

  function handleClick() {
    if (!onClick) return;
    onClick();
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={letter.toUpperCase()}
      // -rotate-45 counter-rotates the button so its light reflections stay perfectly vertical
      className={[
        "rounded-full outline-none transform -rotate-45 transition-opacity",
      ].join(" ")}
    >
      <motion.div
        whileTap={isActive ? { scale: 0.94 } : {}}
        className="rounded-full select-none"
        style={{
          width: 46,
          height: 46,
          // Sophisticated linear gradients matching the image hues
          background: isPrimary
            ? "linear-gradient(rgb(212 124 15) 0%, rgb(179 110 45) 50%, rgb(143 89 46) 100%)"
            : "linear-gradient(rgb(15 90 155) 0%, rgb(11 58 112) 50% 50%, rgb(13 43 89) 100%)",
          boxShadow: `
            0 3px 6px rgba(0, 0, 0, 0.4), 
            0 0 1px rgba(0, 0, 0, 0.5), 
            inset 0 2px 3px rgba(255, 255, 255, 0.8), 
            inset 0 -2px 4px rgba(0, 0, 0, 0.3)
          `,
        }}
      >
        {/* Hidden visually to match the clean image look, but preserved for accessibility */}
        <span className="text-base sr-only">{letter}</span>
        <span className="flex h-full w-full items-center justify-center text-sm font-bold text-white/80" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.4)' }}>{letter}</span>
      </motion.div>
    </button>
  );
}