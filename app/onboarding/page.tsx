"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent,
  type WheelEvent,
} from "react";
import { useAnimationFrame } from "framer-motion";
import { useRouter } from "next/navigation";
import { SIGNALS, type SignalInfo } from "@/lib/signals";
import DeviceShell from "@/components/DeviceShell";

const CARD_SPACING = 240;
const GALLERY_BEND = 100;
const GALLERY_HALF_WIDTH = 400;
const SCROLL_SPEED = 2.2;
const SCROLL_EASE = 0.05;

function lerp(start: number, end: number, amount: number) {
  return start + (end - start) * amount;
}

function wrapOffset(offset: number, length: number) {
  return ((((offset + length / 2) % length) + length) % length) - length / 2;
}

function SignalCard({
  signal,
  transform,
  opacity,
  isFront,
}: {
  signal: SignalInfo;
  transform: string;
  opacity: number;
  isFront: boolean;
}) {
  return (
    <div
      className="absolute left-1/2 top-1/2 pointer-events-none"
      style={{
        width: 200,
        height: 280,
        marginLeft: -80,
        marginTop: -150,
        transform,
        opacity,
        transformStyle: "preserve-3d",
      }}
    >
      <div
        className="w-full h-full rounded-xl overflow-hidden"
        style={{
          background: "rgba(20,20,28,0.97)",
          boxShadow: isFront
            ? `0 25px 50px rgba(0,0,0,0.8), 0 0 40px ${signal.color}15`
            : "0 10px 30px rgba(0,0,0,0.6)",
          border: isFront
            ? `1px solid ${signal.color}50`
            : "1px solid rgba(255,255,255,0.06)",
        }}
      >
        <div
          className="w-full h-[60%] flex items-center justify-center"
          style={{
            background: `linear-gradient(145deg, ${signal.color}25 0%, ${signal.color}08 100%)`,
          }}
        >
          <span className="text-4xl select-none">{signal.emoji}</span>
        </div>
        <div className="p-2.5 h-[40%]"       style={{
            background: `linear-gradient(145deg, ${signal.color}25 0%, ${signal.color}08 100%)`,
          }}>
          <h3 className="text-base font-bold text-white leading-tight">{signal.label}</h3>
          <p className="text-sm text-gray-400 mt-0.5">
            {signal.description}
          </p>
        </div>
      </div>
    </div>
  );
}

export default function OnboardingPage() {
  const router = useRouter();
  const scrollRef = useRef({ current: 0, target: 0 });
  const dragRef = useRef({ isDown: false, startX: 0, startTarget: 0 });
  const snapTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [scrollPosition, setScrollPosition] = useState(0);

  const CARD_COUNT = SIGNALS.length;

  const snapToCard = useCallback(() => {
    scrollRef.current.target = Math.round(scrollRef.current.target);
  }, []);

  const scheduleSnap = useCallback(() => {
    if (snapTimeoutRef.current) {
      clearTimeout(snapTimeoutRef.current);
    }

    snapTimeoutRef.current = setTimeout(snapToCard, 180);
  }, [snapToCard]);

  useAnimationFrame(() => {
    const scroll = scrollRef.current;
    const diff = scroll.target - scroll.current;

    if (Math.abs(diff) < 0.001) {
      if (scroll.current === scroll.target) return;

      scroll.current = scroll.target;
      setScrollPosition(scroll.current);
      return;
    }

    scroll.current = lerp(scroll.current, scroll.target, SCROLL_EASE);
    setScrollPosition(scroll.current);
  });

  const startPlay = useCallback(() => {
    router.push("/play");
  }, [router]);

  const skip = startPlay;

  const nextCard = useCallback(() => {
    scrollRef.current.target += 1;
  }, []);

  const prevCard = useCallback(() => {
    scrollRef.current.target -= 1;
  }, []);

  const handleWheel = useCallback(
    (e: WheelEvent<HTMLDivElement>) => {
      e.preventDefault();
      const delta = e.deltaY || e.deltaX;
      scrollRef.current.target += Math.sign(delta) * SCROLL_SPEED * 0.08;
      scheduleSnap();
    },
    [scheduleSnap],
  );

  const handlePointerDown = useCallback((e: PointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    dragRef.current = {
      isDown: true,
      startX: e.clientX,
      startTarget: scrollRef.current.target,
    };
  }, []);

  const handlePointerMove = useCallback((e: PointerEvent<HTMLDivElement>) => {
    if (!dragRef.current.isDown) return;

    const distance = (dragRef.current.startX - e.clientX) / CARD_SPACING;
    scrollRef.current.target = dragRef.current.startTarget + distance * SCROLL_SPEED;
  }, []);

  const handlePointerUp = useCallback(
    (e: PointerEvent<HTMLDivElement>) => {
      if (!dragRef.current.isDown) return;

      dragRef.current.isDown = false;
      if (e.currentTarget.hasPointerCapture(e.pointerId)) {
        e.currentTarget.releasePointerCapture(e.pointerId);
      }
      snapToCard();
    },
    [snapToCard],
  );

  useEffect(() => {
    return () => {
      if (snapTimeoutRef.current) {
        clearTimeout(snapTimeoutRef.current);
      }
    };
  }, []);

  const cards = SIGNALS.map((signal, i) => {
    const offset = wrapOffset(i - scrollPosition, CARD_COUNT);
    const x = offset * CARD_SPACING;
    const effectiveX = Math.min(Math.abs(x), GALLERY_HALF_WIDTH);
    const radius =
      (GALLERY_HALF_WIDTH * GALLERY_HALF_WIDTH + GALLERY_BEND * GALLERY_BEND) /
      (2 * GALLERY_BEND);
    const arc = radius - Math.sqrt(Math.max(0, radius * radius - effectiveX * effectiveX));
    const rotation = Math.sign(x) * Math.asin(effectiveX / radius) * (180 / Math.PI);
    const distance = Math.abs(offset);
    const scale = 1 - Math.min(distance * 0.08, 0.36);
    const opacity = 1 - Math.min(Math.max(distance - 1.5, 0) * 0.22, 0.72);

    return { signal, x, y: arc, rotation, scale, opacity, distance, index: i };
  });

  const sorted = [...cards].sort((a, b) => b.distance - a.distance);
  const frontIndex = ((Math.round(scrollPosition) % CARD_COUNT) + CARD_COUNT) % CARD_COUNT;

  return (
    <DeviceShell
      label="SIGNALS"
      hints={{ a: "Play", dpad: { label: "Browse", arrows: "lr" } }}
      onA={startPlay}
      onLeft={prevCard}
      onRight={nextCard}
      onB={skip}
    >
      <div className="flex flex-col flex-1 bg-[#080810] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-2 border-b border-white/5">
          <span className="text-white/30 text-[10px] font-mono tracking-widest">
            SIGNAL CATALOG
          </span>
        </div>

        {/* Circular Gallery */}
        <div
          className="flex-1 relative flex items-center justify-center select-none cursor-grab active:cursor-grabbing"
          style={{ touchAction: "pan-y" }}
          onWheel={handleWheel}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
        >
          <div
            className="relative w-full h-full"
            style={{ transformStyle: "preserve-3d" }}
          >
            {sorted.map(({ signal, x, y, rotation, scale, opacity, index }) => {
              return (
                <SignalCard
                  key={signal.type}
                  signal={signal}
                  isFront={index === frontIndex}
                  opacity={opacity}
                  transform={`translate3d(${x}px, ${y}px, 0) rotate(${rotation}deg) scale(${scale})`}
                />
              );
            })}
          </div>

          {/* Reflection/floor gradient */}
          <div
            className="absolute bottom-0 left-0 right-0 h-1/3 pointer-events-none"
            style={{
              background: "linear-gradient(to top, rgba(8,8,16,1) 0%, transparent 100%)",
            }}
          />
        </div>
      </div>
    </DeviceShell>
  );
}
