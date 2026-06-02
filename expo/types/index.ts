export type QuizCategory = "Science" | "History" | "Maths" | "Puzzles" | "Mixed" | "Fun Facts" | "This or That" | "Geography" | "Art" | "Animals" | "Food" | "Sport" | "Pop Culture";

export type AlarmMode = "challenge" | "loud";

export type Day = 0 | 1 | 2 | 3 | 4 | 5 | 6; // 0=Mon..6=Sun

export type SoundType = "default" | "recording" | "builtIn";

export interface AlarmSound {
  type: SoundType;
  recordingId?: string;
  builtInId?: string;
}

export interface Alarm {
  id: string;
  hour: number;
  minute: number;
  days: Day[]; // empty = one-shot
  enabled: boolean;
  mode: AlarmMode;
  categories: QuizCategory[];
  label?: string;
  sound?: AlarmSound;
}

export type MedFrequency = "daily" | "twice" | "alternate" | "weekly" | "custom";

export interface MedDoseLog {
  date: string; // YYYY-MM-DD
  slot: 0 | 1;
  taken: boolean;
}

export type BuzzPattern = "short" | "double" | "long";
export type BuzzSound = "silent" | "goat_bleat" | "cow_moo" | "sad_trombone" | "angry_cat";

export interface MedBuzz {
  pattern: BuzzPattern;
  sound: BuzzSound;
  volume: number; // 0..100
}

export interface Medication {
  id: string;
  label: string;
  dosage: string;
  frequency: MedFrequency;
  times: string[];
  customDays?: Day[];
  weeklyDay?: Day;
  startDate: string;
  logs: MedDoseLog[];
  streak: number;
  buzz?: MedBuzz;
}

export interface Question {
  category: QuizCategory;
  question: string;
  options: [string, string, string, string];
  correct: 0 | 1 | 2 | 3;
  fact: string;
}

export type SnoozeMinutes = 5 | 10 | 15 | 20;

export interface Settings {
  enabledCategories: QuizCategory[];
  defaultMode: AlarmMode;
  wrongPenalty: "15s" | "30s";
  premium: boolean;
  privacyAcknowledged: boolean;
  snoozeMinutes: SnoozeMinutes;
  displayName?: string;
  myCode?: string;
  userId?: string;
  timeSensitivePromptShown?: boolean;
}

export interface SnoozeState {
  alarmId: string;
  resumesAt: number;
  adUsed: boolean;
}

export interface Recording {
  id: string;
  name: string;
  uri: string;
  durationMs: number;
  createdAt: number;
}

export type FriendStatus = "set" | "none" | "snoozed";

export interface Friend {
  id: string;
  name: string;
  code: string;
  alarmTime?: string;
  status: FriendStatus;
  addedAt: number;
  nudgesByDate: Record<string, boolean>; // date -> nudged?
}

export interface WakeRequest {
  id: string;
  friendId: string;
  friendName: string;
  time: string; // HH:mm
  status: "pending" | "accepted" | "declined";
  createdAt: number;
  outgoing: boolean;
}
