export type SignalType =
  | "agreement"
  | "confidence"
  | "confusion"
  | "disagreement"
  | "disengagement"
  | "engagement"
  | "frustration"
  | "hesitation"
  | "interest"
  | "skepticism"
  | "stress"
  | "uncertainty";

export interface SignalInfo {
  type: SignalType;
  label: string;
  emoji: string;
  description: string;
  actingTip: string;
  color: string;
}

export const SIGNALS: SignalInfo[] = [
  {
    type: "agreement",
    label: "Agreement",
    emoji: "✅",
    description: "You are on the same page — affirming, nodding, building on what was said.",
    actingTip: "Nod firmly and say 'Exactly!' while keeping warm eye contact.",
    color: "#22c55e",
  },
  {
    type: "confidence",
    label: "Confidence",
    emoji: "💪",
    description: "You speak with conviction — clear, steady, no visible doubt.",
    actingTip: "Sit tall, chin up, speak in a firm steady voice. Hold eye contact.",
    color: "#f59e0b",
  },
  {
    type: "confusion",
    label: "Confusion",
    emoji: "😕",
    description: "You lost the thread — visibly struggling to follow or understand.",
    actingTip: "Furrow your brow, tilt your head, squint like you're trying to decode something.",
    color: "#a78bfa",
  },
  {
    type: "disagreement",
    label: "Disagreement",
    emoji: "🙅",
    description: "You push back — rejecting or challenging what was just said.",
    actingTip: "Shake your head, cross your arms, make a clear 'no' hand gesture.",
    color: "#ef4444",
  },
  {
    type: "disengagement",
    label: "Disengagement",
    emoji: "😶",
    description: "You checked out — attention gone, minimal response, looking away.",
    actingTip: "Look away from the camera, slump back, stare blankly off to the side.",
    color: "#6b7280",
  },
  {
    type: "engagement",
    label: "Engagement",
    emoji: "🔥",
    description: "You are locked in — focused, leaning in, actively participating.",
    actingTip: "Lean forward, nod along, keep steady eye contact. Look energized.",
    color: "#f97316",
  },
  {
    type: "frustration",
    label: "Frustration",
    emoji: "😤",
    description: "Things aren't working — visible irritation, tension building.",
    actingTip: "Sigh loudly, rub your temples, clench your jaw. Look visibly annoyed.",
    color: "#dc2626",
  },
  {
    type: "hesitation",
    label: "Hesitation",
    emoji: "🤔",
    description: "You are stalling — unsure what to say, holding back before committing.",
    actingTip: "Pause mid-sentence, look up, touch your chin. Start to speak then stop.",
    color: "#0ea5e9",
  },
  {
    type: "interest",
    label: "Interest",
    emoji: "👀",
    description: "This got your attention — curious, drawn in, wanting to hear more.",
    actingTip: "Raise your eyebrows, lean in slightly, widen your eyes with genuine curiosity.",
    color: "#10b981",
  },
  {
    type: "skepticism",
    label: "Skepticism",
    emoji: "🤨",
    description: "You are not buying it — doubtful, evaluating, wanting proof.",
    actingTip: "Raise one eyebrow, tilt your head, give a 'really?' squint.",
    color: "#d97706",
  },
  {
    type: "stress",
    label: "Stress",
    emoji: "😰",
    description: "Pressure is on — tense, rushed, overwhelmed by the moment.",
    actingTip: "Glance around quickly, touch your neck, breathe fast. Look overwhelmed.",
    color: "#ec4899",
  },
  {
    type: "uncertainty",
    label: "Uncertainty",
    emoji: "🤷",
    description: "You are not sure — tentative, open to being wrong, low conviction.",
    actingTip: "Shrug your shoulders, look down, speak softly. Make an 'I don't know' face.",
    color: "#8b5cf6",
  },
];

export function shuffleSignals(): SignalInfo[] {
  const arr = [...SIGNALS];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export function getSignalLabel(type: string): string {
  return SIGNALS.find((s) => s.type === type)?.label ?? type;
}

export const MAX_ATTEMPTS = 3;
export const TOTAL_SIGNALS = 12;
export const RECORDING_DURATION_MS = 5000;
