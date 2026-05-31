import { playClickA, playClickB, playClickDpad } from "@/lib/sounds";

export type DeviceButton = "a" | "b" | "dpad";

export interface DeviceHandlers {
  onA?: () => void;
  onB?: () => void;
  onUp?: () => void;
  onDown?: () => void;
  onLeft?: () => void;
  onRight?: () => void;
}

export function playDeviceClick(button: DeviceButton) {
  switch (button) {
    case "a":
      playClickA();
      break;
    case "b":
      playClickB();
      break;
    case "dpad":
      playClickDpad();
      break;
  }
}

function isTypingTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false;
  return (
    target instanceof HTMLInputElement ||
    target instanceof HTMLTextAreaElement ||
    target instanceof HTMLSelectElement ||
    target.isContentEditable
  );
}

export function handleDeviceKeyDown(
  e: KeyboardEvent,
  handlers: DeviceHandlers,
): boolean {
  if (isTypingTarget(e.target)) return false;

  let button: DeviceButton | null = null;
  let action: (() => void) | undefined;

  switch (e.key) {
    case "a":
    case "A":
      button = "a";
      action = handlers.onA;
      break;
    case "b":
    case "B":
      button = "b";
      action = handlers.onB;
      break;
    case "ArrowUp":
      button = "dpad";
      action = handlers.onUp;
      break;
    case "ArrowDown":
      button = "dpad";
      action = handlers.onDown;
      break;
    case "ArrowLeft":
      button = "dpad";
      action = handlers.onLeft;
      break;
    case "ArrowRight":
      button = "dpad";
      action = handlers.onRight;
      break;
    default:
      return false;
  }

  e.preventDefault();
  playDeviceClick(button);
  action?.();
  return true;
}

export function withDeviceClick(
  button: DeviceButton,
  handler?: () => void,
): (() => void) | undefined {
  if (!handler) return undefined;
  return () => {
    playDeviceClick(button);
    handler();
  };
}
