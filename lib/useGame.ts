"use client";

import { useCallback, useEffect, useReducer, useRef } from "react";
import {
  shuffleSignals,
  type SignalInfo,
  type SignalType,
  MAX_ATTEMPTS,
  RECORDING_DURATION_MS,
} from "@/lib/signals";

export type GamePhase =
  | "idle"
  | "announcing"
  | "countdown"
  | "recording"
  | "analyzing"
  | "success"
  | "fail"
  | "game_over"
  | "victory";

export interface SignalAttempt {
  signalType: SignalType;
  detected: string[];
  matched: boolean;
}

export interface GameState {
  phase: GamePhase;
  signals: SignalInfo[];
  currentIndex: number;
  attemptsRemaining: number;
  totalAttempts: number;
  countdown: number;
  detectedSignals: string[];
  errorMessage: string | null;
  attemptHistory: SignalAttempt[];
}

type Action =
  | { type: "START_GAME" }
  | { type: "START_COUNTDOWN" }
  | { type: "TICK_COUNTDOWN" }
  | { type: "START_RECORDING" }
  | { type: "START_ANALYZING" }
  | { type: "SIGNAL_DETECTED"; detected: string[] }
  | { type: "SIGNAL_MATCHED" }
  | { type: "SIGNAL_MISSED"; detected: string[] }
  | { type: "NEXT_SIGNAL" }
  | { type: "SET_ERROR"; message: string }
  | { type: "RETRY" };

function initialState(): GameState {
  return {
    phase: "idle",
    signals: shuffleSignals(),
    currentIndex: 0,
    attemptsRemaining: MAX_ATTEMPTS,
    totalAttempts: 0,
    countdown: 3,
    detectedSignals: [],
    errorMessage: null,
    attemptHistory: [],
  };
}

function reducer(state: GameState, action: Action): GameState {
  switch (action.type) {
    case "START_GAME":
      return {
        ...initialState(),
        signals: shuffleSignals(),
        phase: "announcing",
      };

    case "START_COUNTDOWN":
      return { ...state, phase: "countdown", countdown: 3, errorMessage: null };

    case "TICK_COUNTDOWN":
      return { ...state, countdown: state.countdown - 1 };

    case "START_RECORDING":
      return { ...state, phase: "recording", errorMessage: null };

    case "START_ANALYZING":
      return { ...state, phase: "analyzing", totalAttempts: state.totalAttempts + 1 };

    case "SIGNAL_DETECTED":
      return { ...state, detectedSignals: action.detected };

    case "SIGNAL_MATCHED": {
      const currentSignal = state.signals[state.currentIndex];
      const historyEntry: SignalAttempt = {
        signalType: currentSignal.type,
        detected: state.detectedSignals,
        matched: true,
      };
      if (state.currentIndex >= state.signals.length - 1) {
        return {
          ...state,
          phase: "victory",
          attemptHistory: [...state.attemptHistory, historyEntry],
        };
      }
      return {
        ...state,
        phase: "success",
        attemptHistory: [...state.attemptHistory, historyEntry],
      };
    }

    case "NEXT_SIGNAL":
      return {
        ...state,
        phase: "announcing",
        currentIndex: state.currentIndex + 1,
        attemptsRemaining: MAX_ATTEMPTS,
        detectedSignals: [],
        errorMessage: null,
      };

    case "SIGNAL_MISSED": {
      const newAttempts = state.attemptsRemaining - 1;
      const currentSignal = state.signals[state.currentIndex];
      const historyEntry: SignalAttempt = {
        signalType: currentSignal.type,
        detected: action.detected,
        matched: false,
      };
      if (newAttempts <= 0) {
        return {
          ...state,
          phase: "game_over",
          attemptsRemaining: 0,
          detectedSignals: action.detected,
          attemptHistory: [...state.attemptHistory, historyEntry],
        };
      }
      return {
        ...state,
        phase: "fail",
        attemptsRemaining: newAttempts,
        detectedSignals: action.detected,
        errorMessage: action.detected.length === 0 ? "No signal detected — try again" : null,
        attemptHistory: [...state.attemptHistory, historyEntry],
      };
    }

    case "RETRY":
      return {
        ...state,
        phase: "announcing",
        detectedSignals: [],
        errorMessage: null,
      };

    case "SET_ERROR":
      return {
        ...state,
        phase: "fail",
        errorMessage: action.message,
        totalAttempts: Math.max(0, state.totalAttempts - 1),
      };

    default:
      return state;
  }
}

interface UseGameOptions {
  onVictory?: (totalAttempts: number, history: SignalAttempt[]) => void;
}

export function useGame({ onVictory }: UseGameOptions = {}) {
  const [state, dispatch] = useReducer(reducer, undefined, initialState);
  const countdownTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const recordingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const stateRef = useRef(state);
  const onVictoryRef = useRef(onVictory);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  useEffect(() => {
    onVictoryRef.current = onVictory;
  }, [onVictory]);

  function clearTimers() {
    if (countdownTimerRef.current) clearTimeout(countdownTimerRef.current);
    if (recordingTimerRef.current) clearTimeout(recordingTimerRef.current);
  }

  const startGame = useCallback(() => {
    clearTimers();
    dispatch({ type: "START_GAME" });
  }, []);

  const startCountdown = useCallback(() => {
    dispatch({ type: "START_COUNTDOWN" });
  }, []);

  useEffect(() => {
    if (state.phase === "victory") {
      onVictoryRef.current?.(state.totalAttempts, state.attemptHistory);
    }
  }, [state.phase, state.totalAttempts, state.attemptHistory]);

  useEffect(() => {
    if (state.phase === "success") {
      const t = setTimeout(() => {
        dispatch({ type: "NEXT_SIGNAL" });
      }, 2000);
      return () => clearTimeout(t);
    }
  }, [state.phase]);

  useEffect(() => {
    if (state.phase !== "countdown") return;

    if (state.countdown <= 0) {
      dispatch({ type: "START_RECORDING" });
      return;
    }

    const t = setTimeout(() => {
      dispatch({ type: "TICK_COUNTDOWN" });
    }, 1000);
    countdownTimerRef.current = t;
    return () => clearTimeout(t);
  }, [state.phase, state.countdown]);

  const startRecording = useCallback(async (): Promise<void> => {
    if (!streamRef.current) return;

    const mimeType = MediaRecorder.isTypeSupported("video/webm;codecs=vp8,opus")
      ? "video/webm;codecs=vp8,opus"
      : MediaRecorder.isTypeSupported("video/webm")
        ? "video/webm"
        : "video/mp4";

    const chunks: Blob[] = [];
    const recorder = new MediaRecorder(streamRef.current, { mimeType });
    mediaRecorderRef.current = recorder;

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunks.push(e.data);
    };

    recorder.onstop = async () => {
      const blob = new Blob(chunks, { type: mimeType });
      dispatch({ type: "START_ANALYZING" });

      try {
        const response = await fetch("/api/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/octet-stream" },
          body: blob,
        });

        if (!response.ok) {
          const err = await response.json().catch(() => ({ error: "Unknown error" }));
          dispatch({ type: "SET_ERROR", message: err.error ?? "Analysis failed" });
          return;
        }

        const data = await response.json();
        const detectedTypes: string[] = (data.signals ?? []).map(
          (s: { type: string }) => s.type
        );

        dispatch({ type: "SIGNAL_DETECTED", detected: detectedTypes });

        const { signals, currentIndex } = stateRef.current;
        const currentSignal = signals[currentIndex];

        if (detectedTypes.includes(currentSignal.type)) {
          dispatch({ type: "SIGNAL_MATCHED" });
        } else {
          dispatch({ type: "SIGNAL_MISSED", detected: detectedTypes });
        }
      } catch (err) {
        dispatch({ type: "SET_ERROR", message: String(err) });
      }
    };

    recorder.start();

    recordingTimerRef.current = setTimeout(() => {
      if (recorder.state === "recording") {
        recorder.stop();
      }
    }, RECORDING_DURATION_MS);
  }, []);

  const initCamera = useCallback(async (): Promise<MediaStream | null> => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: "user" },
        audio: true,
      });
      streamRef.current = stream;
      return stream;
    } catch (err) {
      console.error("Camera error:", err);
      return null;
    }
  }, []);

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);

  const retry = useCallback(() => {
    dispatch({ type: "RETRY" });
  }, []);

  return {
    state,
    currentSignal: state.signals[state.currentIndex] ?? null,
    startGame,
    startCountdown,
    startRecording,
    initCamera,
    stopCamera,
    retry,
    streamRef,
  };
}
