"use client";

import { useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import DeviceShell from "@/components/DeviceShell";
import SignalCarousel, { type SignalCarouselHandle } from "@/components/SignalCarousel";

export default function OnboardingPage() {
  const router = useRouter();
  const carouselRef = useRef<SignalCarouselHandle>(null);

  const startPlay = useCallback(() => {
    router.push("/play");
  }, [router]);

  const skip = startPlay;

  const nextCard = useCallback(() => {
    carouselRef.current?.next();
  }, []);

  const prevCard = useCallback(() => {
    carouselRef.current?.prev();
  }, []);

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
        <div className="flex items-center justify-between px-4 py-2 border-b border-white/5">
          <span className="text-white/30 text-[10px] font-mono tracking-widest">
            SIGNAL CATALOG
          </span>
        </div>

        <SignalCarousel ref={carouselRef} className="flex-1" />
      </div>
    </DeviceShell>
  );
}
