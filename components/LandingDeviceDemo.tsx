"use client";

import { useEffect, useState } from "react";
import { useReducedMotion } from "framer-motion";
import {
  RECORDING_DURATION_MS,
  SIGNALS,
  TOTAL_SIGNALS,
  type SignalInfo,
} from "@/lib/signals";
import SignalPlayView, {
  type SignalFeedbackBubble,
  type SignalPlayPhase,
} from "@/components/SignalPlayView";

const DEMO_VIDEO_SRC = "/landing/uncertainty-demo.mp4";
const DEMO_INDEX = 2;
const SUCCESS_DURATION_MS = 2000;

const demoSignal: SignalInfo =
  SIGNALS.find((s) => s.type === "uncertainty") ?? SIGNALS[0];

const demoFeedbackBubbles: SignalFeedbackBubble[] = [
  { id: "demo-uncertainty", type: "uncertainty", index: 0 },
  { id: "demo-hesitation", type: "hesitation", index: 1 },
];

export default function LandingDeviceDemo() {
  const shouldReduceMotion = useReducedMotion();
  const [phase, setPhase] = useState<SignalPlayPhase>("recording");
  const [recordingProgress, setRecordingProgress] = useState(0);
  const [feedbackBubbles, setFeedbackBubbles] = useState<SignalFeedbackBubble[]>([]);

  const recordingDuration = shouldReduceMotion
    ? RECORDING_DURATION_MS * 0.6
    : RECORDING_DURATION_MS;
  const successDuration = shouldReduceMotion ? 1200 : SUCCESS_DURATION_MS;

  useEffect(() => {
    let cancelled = false;
    let progressInterval: ReturnType<typeof setInterval> | null = null;
    let phaseTimer: ReturnType<typeof setTimeout> | null = null;

    function clearTimers() {
      if (progressInterval) {
        clearInterval(progressInterval);
        progressInterval = null;
      }
      if (phaseTimer) {
        clearTimeout(phaseTimer);
        phaseTimer = null;
      }
    }

    function startRecording() {
      if (cancelled) return;

      setPhase("recording");
      setRecordingProgress(0);
      setFeedbackBubbles([]);

      const start = Date.now();
      progressInterval = setInterval(() => {
        const elapsed = Date.now() - start;
        setRecordingProgress(Math.min(elapsed / recordingDuration, 1));
      }, 50);

      phaseTimer = setTimeout(() => {
        clearTimers();
        startSuccess();
      }, recordingDuration);
    }

    function startSuccess() {
      if (cancelled) return;

      setPhase("success");
      setFeedbackBubbles(demoFeedbackBubbles);

      phaseTimer = setTimeout(() => {
        clearTimers();
        startRecording();
      }, successDuration);
    }

    phaseTimer = setTimeout(startRecording, 0);

    return () => {
      cancelled = true;
      clearTimers();
    };
  }, [recordingDuration, successDuration]);

  return (
    <SignalPlayView
      videoSrc={DEMO_VIDEO_SRC}
      mirrorVideo={false}
      signal={demoSignal}
      signals={SIGNALS}
      currentIndex={DEMO_INDEX}
      phase={phase}
      recordingProgress={recordingProgress}
      feedbackBubbles={feedbackBubbles}
      attemptsRemaining={3}
      detectedSignals={phase === "success" ? ["uncertainty", "hesitation"] : []}
    />
  );
}

export const LANDING_DEMO_LABEL = `SIG ${DEMO_INDEX + 1}/${TOTAL_SIGNALS}`;
