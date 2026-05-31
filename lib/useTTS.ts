"use client";

import { useCallback, useRef } from "react";

export function useTTS() {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const speak = useCallback(async (text: string): Promise<void> => {
    try {
      // Stop any currently playing audio
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }

      const url = `/api/tts?text=${encodeURIComponent(text)}`;
      const audio = new Audio(url);
      audioRef.current = audio;

      return new Promise((resolve) => {
        audio.onended = () => resolve();
        audio.onerror = () => resolve(); // resolve even on error so game continues
        audio.play().catch(() => resolve());
      });
    } catch {
      // TTS is non-critical; game continues without it
    }
  }, []);

  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
  }, []);

  return { speak, stop };
}
