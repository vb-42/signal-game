"use client";

import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

const sections = [
  { delay: 0 },
  { delay: 0.1 },
  { delay: 0.2 },
  { delay: 0.3 },
  { delay: 0.4 },
  { delay: 0.5 },
];

export default function ManifestoPage() {
  const router = useRouter();

  return (
    <div className="relative min-h-screen bg-[#fafafa] text-black">
      <header className="sticky top-0 z-50 flex items-center px-6 py-4 backdrop-blur-md bg-[#fafafa]/80 border-b border-black/[0.04]">
        <button
          type="button"
          onClick={() => router.push("/")}
          className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[15px] font-medium text-black/60 transition-colors hover:bg-black/[0.04] hover:text-black"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>
      </header>

      <main className="mx-auto max-w-2xl px-6 py-24 md:py-40">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
        >
          <h1 className="text-[clamp(2.5rem,6vw,4.5rem)] font-bold leading-[1.05] tracking-[-0.04em] text-black">
            Manifesto
          </h1>
        </motion.div>

        <div className="mt-20 space-y-20">
          <motion.section
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: sections[0].delay, duration: 0.7, ease: [0.23, 1, 0.32, 1] }}
            className="space-y-8 text-[19px] leading-[1.75] text-black/80"
          >
            <p className="text-[22px] font-medium text-black leading-[1.5] tracking-[-0.01em]">
              For as long as we&rsquo;ve had screens, we&rsquo;ve been looking at them.
            </p>
            <p>
              We tap. We scroll. We type. We stare. And the machine stares back
              with the same blank indifference it showed the last person who held it.
            </p>
            <p>
              Fifty years of personal computing, and the computer still doesn&rsquo;t
              know the first thing about the person using it.
            </p>
          </motion.section>

          <motion.section
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: sections[1].delay, duration: 0.7, ease: [0.23, 1, 0.32, 1] }}
            className="space-y-8 text-[19px] leading-[1.75] text-black/80"
          >
            <p className="text-[24px] font-semibold text-black tracking-[-0.02em] leading-[1.4]">
              What if a screen could look back &mdash; not to judge you, but to
              understand you?
            </p>
            <p>
              Not your clicks. Not your purchase history. Not the data you
              consciously hand over. But the layer beneath all of that &mdash; the
              one that&rsquo;s been invisible to machines until now.
            </p>
            <p>
              The way you lean in when you&rsquo;re curious. The micro-expression
              that flashes before you speak. The shift in posture when you lose
              interest. The signal you send before you even know you&rsquo;re sending it.
            </p>
          </motion.section>

          <motion.section
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: sections[2].delay, duration: 0.7, ease: [0.23, 1, 0.32, 1] }}
            className="border-l-2 border-black/10 pl-8 space-y-8 text-[19px] leading-[1.75] text-black/80"
          >
            <p className="text-black/60 uppercase text-[13px] font-semibold tracking-[0.1em]">
              The idea
            </p>
            <p className="text-[22px] font-medium text-black leading-[1.5]">
              We built a device on top of social signals.
            </p>
            <p>
              It reimagines the computer as something that knows you at that level.
              Not through surveillance. Through perception. The same way a close
              friend reads a room &mdash; effortlessly, silently, with grace.
            </p>
          </motion.section>

          <motion.section
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: sections[3].delay, duration: 0.7, ease: [0.23, 1, 0.32, 1] }}
            className="space-y-8 text-[19px] leading-[1.75] text-black/80"
          >
            <p>
              Every interaction you&rsquo;ve ever had with a computer required you to
              translate yourself into its language. You learned to click. To type
              commands. To navigate menus designed for the machine&rsquo;s convenience,
              not yours.
            </p>
            <p className="text-[22px] font-medium text-black leading-[1.5]">
              We believe that era is ending.
            </p>
            <p>
              The next computer won&rsquo;t ask you to explain yourself. It will
              already know. Not everything &mdash; but the things that matter in the
              moment. Whether you&rsquo;re engaged or drifting. Present or distracted.
              Open or closed off.
            </p>
          </motion.section>

          <motion.section
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: sections[4].delay, duration: 0.7, ease: [0.23, 1, 0.32, 1] }}
            className="space-y-8 text-[19px] leading-[1.75] text-black/80"
          >
            <p>
              This isn&rsquo;t about emotion detection. It&rsquo;s not about reading
              faces to sell you things. It&rsquo;s about building a machine that
              participates in the oldest protocol humans have &mdash; the unspoken
              one. The one that governs every conversation, every relationship,
              every room you&rsquo;ve ever walked into.
            </p>
            <p className="text-black/60 italic">
              Social signals are the operating system of human connection. We just
              gave a computer access to it for the first time.
            </p>
          </motion.section>

          <motion.section
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: sections[5].delay, duration: 0.7, ease: [0.23, 1, 0.32, 1] }}
            className="border-t border-black/[0.08] pt-16 space-y-8"
          >
            <p className="text-[26px] md:text-[32px] font-bold text-black tracking-[-0.03em] leading-[1.2]">
              Today, we&rsquo;re introducing something we&rsquo;ve never made before.
            </p>
            <p className="text-[20px] text-black/70 leading-[1.6]">
              A handheld device. Dedicated to a single, remarkable idea.
            </p>
            <p className="text-[clamp(2rem,5vw,3.5rem)] font-bold tracking-[-0.04em] text-black leading-[1.1]">
              Social signals.
            </p>
          </motion.section>
        </div>
      </main>
    </div>
  );
}
