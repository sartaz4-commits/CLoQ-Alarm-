import { Day } from "@/types";

export const DAY_LABELS = ["M", "T", "W", "T", "F", "S", "S"] as const;
export const DAY_LABELS_LONG = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;

export function pad(n: number): string {
  return n < 10 ? `0${n}` : String(n);
}

export function formatTime(h: number, m: number): string {
  return `${pad(h)}:${pad(m)}`;
}

export function todayIndex(): Day {
  const d = new Date().getDay();
  return ((d + 6) % 7) as Day;
}

export function ymd(d: Date = new Date()): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function greeting(): string {
  const h = new Date().getHours();
  if (h < 5) return "Still up?";
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  if (h < 22) return "Good evening";
  return "Night owl";
}

export function buzzForTime(time: string): { label: string; level: 1 | 2 | 3 } {
  const [h] = time.split(":").map((s) => parseInt(s, 10));
  if (h >= 5 && h < 7) return { label: "Low buzz", level: 1 };
  if (h >= 7 && h < 9) return { label: "Moderate buzz", level: 2 };
  if (h >= 18) return { label: "Loud buzz", level: 3 };
  if (h >= 9 && h < 18) return { label: "Moderate buzz", level: 2 };
  return { label: "Low buzz", level: 1 };
}

const setEqual = (a: number[], b: number[]): boolean => a.length === b.length && a.every((x) => b.includes(x));

export function formatRepeat(days: Day[]): string {
  if (days.length === 0) return "Once";
  if (setEqual(days, [0, 1, 2, 3, 4, 5, 6])) return "Every day";
  if (setEqual(days, [0, 1, 2, 3, 4])) return "Weekdays";
  if (setEqual(days, [5, 6])) return "Weekends";
  if (setEqual(days, [0, 2, 4])) return "Mon Wed Fri";
  if (days.length <= 3) {
    return [...days].sort().map((d) => DAY_LABELS_LONG[d].slice(0, 3)).join(" ");
  }
  return "Custom days";
}

export function nextAlarmDate(hour: number, minute: number, days: Day[]): Date {
  const now = new Date();
  const candidate = new Date();
  candidate.setHours(hour, minute, 0, 0);
  if (days.length === 0) {
    if (candidate.getTime() <= now.getTime()) candidate.setDate(candidate.getDate() + 1);
    return candidate;
  }
  for (let i = 0; i < 8; i++) {
    const d = new Date(candidate);
    d.setDate(candidate.getDate() + i);
    const di = ((d.getDay() + 6) % 7) as Day;
    if (days.includes(di) && d.getTime() > now.getTime()) return d;
  }
  return candidate;
}

export function distanceLabel(target: Date): string {
  const diff = target.getTime() - Date.now();
  if (diff <= 0) return "now";
  const m = Math.floor(diff / 60000);
  const h = Math.floor(m / 60);
  const d = Math.floor(h / 24);
  if (d > 0) return `in ${d}d ${h % 24}h`;
  if (h > 0) return `in ${h}h ${m % 60}m`;
  return `in ${m}m`;
}

export function suggestedBuzz(time: string): { pattern: "short" | "double" | "long"; sound: "silent" | "goat_bleat" | "cow_moo" | "sad_trombone" | "angry_cat"; volume: number; text: string } {
  const [h] = time.split(":").map((s) => parseInt(s, 10));
  if (h >= 5 && h < 7) {
    return { pattern: "short", sound: "goat_bleat", volume: 30, text: "Suggested for early morning: Short pulse, Goat Bleat, low volume — gentle enough not to disturb others." };
  }
  if (h >= 7 && h < 9) {
    return { pattern: "double", sound: "cow_moo", volume: 60, text: "Suggested for morning: Double tap, Cow Moo, medium volume." };
  }
  if (h >= 18) {
    return { pattern: "long", sound: "sad_trombone", volume: 90, text: "Suggested for evening: Long buzz, Sad Trombone, high volume — makes sure you don't miss it." };
  }
  return { pattern: "double", sound: "cow_moo", volume: 60, text: "Suggested: Double tap, Cow Moo, medium volume." };
}

export function generateFriendCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let s = "";
  for (let i = 0; i < 6; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return s;
}
