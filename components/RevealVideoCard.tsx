"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

const REVEAL_VIDEO_SRC = "/Reveal_video.mp4";
const DISMISS_KEY = "signal-reveal-card-dismissed";

export default function RevealVideoCard() {
  const shouldReduceMotion = useReducedMotion();
  const previewRef = useRef<HTMLVideoElement>(null);
  const [dismissed, setDismissed] = useState(true);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setDismissed(sessionStorage.getItem(DISMISS_KEY) === "1");
  }, []);

  useEffect(() => {
    if (dismissed) return;

    const video = previewRef.current;
    if (!video) return;

    video.muted = true;
    const playPromise = video.play();
    if (playPromise) {
      playPromise.catch(() => {
        /* autoplay blocked — preview stays on first frame */
      });
    }
  }, [dismissed]);

  function dismiss() {
    previewRef.current?.pause();
    sessionStorage.setItem(DISMISS_KEY, "1");
    setDismissed(true);
    setOpen(false);
  }

  function openExpanded() {
    previewRef.current?.pause();
    setOpen(true);
  }

  if (dismissed) return null;

  return (
    <>
      <motion.aside
        role="complementary"
        aria-label="Reveal video announcement"
        initial={{ opacity: 0, y: 20, scale: 0.96 }}
        animate={{
          opacity: 1,
          y: shouldReduceMotion ? 0 : [0, -6, 0],
          scale: 1,
        }}
        transition={{
          opacity: { duration: 0.45, delay: 0.5 },
          scale: { type: "spring", duration: 0.5, bounce: 0, delay: 0.5 },
          y: shouldReduceMotion
            ? { duration: 0 }
            : { duration: 4.5, repeat: Infinity, ease: "easeInOut", delay: 1 },
        }}
        className="fixed bottom-6 right-5 z-40 w-[min(100vw-2.5rem,18rem)] sm:right-8"
      >
        <div className="relative overflow-hidden rounded-2xl  shadow-[0_0_0_1px_rgba(255,255,255,0.1),0_24px_60px_rgba(0,0,0,0.45)] backdrop-blur-xl">
          <div className="pointer-events-none absolute inset-0  via-transparent to-pink-500/15" />

          <button
            type="button"
            onClick={dismiss}
            aria-label="Dismiss announcement"
            className="absolute right-2 top-2 z-20 flex h-7 w-7 items-center justify-center rounded-full border border-white/10 bg-black/50 text-white/50 backdrop-blur-sm transition-colors hover:bg-white/10 hover:text-white"
          >
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden>
              <path d="M1 1l8 8M9 1L1 9" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
            </svg>
          </button>

          <button
            type="button"
            onClick={openExpanded}
            className="relative flex w-full flex-col text-left transition-[transform,background-color] hover:bg-white/[0.03] active:scale-[0.98]"
          >
            <div className="relative aspect-video w-full overflow-hidden bg-black">
              <video
                ref={previewRef}
                src={REVEAL_VIDEO_SRC}
                muted
                autoPlay
                loop
                playsInline
                preload="auto"
                className="h-full w-full object-cover outline outline-1 outline-white/10"
              />
              <div className="pointer-events-none absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-black/70 to-transparent" />
            </div>

            <div className="flex flex-col gap-1.5 p-3.5 pt-3">
              <span className="inline-flex w-fit items-center rounded-full border border-violet-400/30 bg-[#F75B1E] px-2.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-white">
                New
              </span>
              <p className="font-mono text-xs font-bold uppercase tracking-[0.14em] text-black">
                Watch the reveal
              </p>
              <p className="text-xs leading-snug text-black/45">
                Tap to expand
              </p>
            </div>
          </button>
        </div>
      </motion.aside>

      <AnimatePresence>
        {open ? (
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Reveal video"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md"
            onClick={() => setOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, y: 12, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.98 }}
              transition={{ type: "spring", duration: 0.35, bounce: 0 }}
              className="relative w-full max-w-3xl overflow-hidden rounded-2xl bg-black shadow-[0_0_0_1px_rgba(255,255,255,0.12),0_32px_80px_rgba(0,0,0,0.6)]"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close video"
                className="absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-black/50 text-white/70 backdrop-blur-sm transition-colors hover:bg-white/10 hover:text-white"
              >
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden>
                  <path d="M2 2l8 8M10 2L2 10" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                </svg>
              </button>

              <video
                src={REVEAL_VIDEO_SRC}
                controls
                autoPlay
                playsInline
                className="aspect-video w-full bg-black object-contain outline outline-1 outline-white/10"
              />
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
}
