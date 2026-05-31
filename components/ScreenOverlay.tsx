"use client";

import { useRef, useSyncExternalStore } from "react";
import { Canvas } from "@react-three/fiber";
import { Bloom, EffectComposer } from "@react-three/postprocessing";
import { CRTEffect } from "./crt-effect";

interface ScreenOverlayProps {
  crtEnabled?: boolean;
  bloomEnabled?: boolean;
  bloomIntensity?: number;
  colorNum?: number;
  pixelSize?: number;
  curve?: number;
}

function ScreenScene() {
  return (
    <mesh>
      <planeGeometry args={[2, 2]} />
      <meshBasicMaterial color="#e8e8ff" />
    </mesh>
  );
}

function BloomBridge({
  crtEnabled,
  bloomEnabled,
  bloomIntensity,
  colorNum,
  pixelSize,
  curve,
}: {
  crtEnabled: boolean;
  bloomEnabled: boolean;
  bloomIntensity: number;
  colorNum: number;
  pixelSize: number;
  curve: number;
}) {
  if (!crtEnabled && !bloomEnabled) return null;

  if (crtEnabled) {
    return (
      <EffectComposer>
      <CRTEffect
        colorNum={4.0}
        pixelSize={2.0}
        blending={true}
        curve={0.05}
        scanlineStrength={0.1}
      />
      <Bloom
        luminanceThreshold={22.4}
        luminanceSmoothing={.1}
          intensity={bloomEnabled ? bloomIntensity : 0}
          mipmapBlur
        />
      </EffectComposer>
    );
  }

  return (
    <EffectComposer>
      <Bloom
        luminanceThreshold={0.4}
        luminanceSmoothing={0.8}
        intensity={bloomIntensity}
        mipmapBlur
      />
    </EffectComposer>
  );
}

export default function ScreenOverlay({
  crtEnabled = true,
  bloomEnabled = true,
  bloomIntensity = 0.6,
  colorNum = 8.0,
  pixelSize = 28.0,
  curve = 0.45,
}: ScreenOverlayProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );

  if (!mounted) return null;

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 z-30 overflow-hidden rounded-2xl"
      style={{ mixBlendMode: "multiply", opacity: 0.72, pointerEvents: "none" }}
    >
      <Canvas
        gl={{ alpha: true, antialias: false, powerPreference: "high-performance" }}
        camera={{ position: [0, 0, 1] }}
        style={{ background: "transparent", pointerEvents: "none" }}
        dpr={1}
        events={() => ({ enabled: false, priority: 0, compute: () => {} }) as never}
      >
        <ScreenScene />
        <BloomBridge
          crtEnabled={crtEnabled}
          bloomEnabled={bloomEnabled}
          bloomIntensity={bloomIntensity}
          colorNum={colorNum}
          pixelSize={pixelSize}
          curve={curve}
        />
      </Canvas>
    </div>
  );
}
