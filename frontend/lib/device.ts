export function deviceHint() {
  if (typeof window === "undefined") return "desktop";
  const coarse = window.matchMedia("(pointer: coarse)").matches;
  const narrow = window.innerWidth < 768;
  const mid = window.innerWidth < 1100;
  if (coarse && narrow) return "mobile";
  if (coarse && mid) return "tablet";
  return "desktop";
}

export { collectSignals, publicIp } from "./fingerprint";
