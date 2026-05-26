import type { AudioSource } from "expo-audio";
import {
  SOUND_CONFIG,
  REMINDER_SOUNDS as REGISTRY_REMINDER_SOUNDS,
  type SoundConfigEntry,
  type ReminderSoundEntry,
} from "@/utils/soundRegistry";

/**
 * Compatibility layer. All sound data is sourced from
 * `utils/soundRegistry.ts` — the single source of truth. This module just
 * exposes the registry in the shape the rest of the app already consumes.
 *
 * No direct require() of audio files lives here.
 */

export type SoundCategory =
  | "default"
  | "funny"
  | "character"
  | "nature";

export interface BuiltInSound {
  id: string;
  name: string;
  category: SoundCategory;
  module: number | null;
}

const CATEGORY_FROM_REGISTRY: Record<SoundConfigEntry["category"], SoundCategory> = {
  "Default Tones": "default",
  "Wake Up Laughing": "funny",
  "Character Voices": "character",
};

// Map registry entries (single source of truth) to the shape the UI uses.
const REGISTRY_SOUNDS: BuiltInSound[] = SOUND_CONFIG.map((s) => ({
  // Keep the legacy id "default" for the classic alarm so existing alarms /
  // stored selections keep working.
  id: s.isDefault ? "default" : s.id,
  name: s.displayName,
  category: CATEGORY_FROM_REGISTRY[s.category],
  module: s.source,
}));

// Coming-soon placeholders. These have no audio file in the registry yet but
// remain visible in the selector so users know they're on the roadmap.
const COMING_SOON: BuiltInSound[] = [
  { id: "dial_up", name: "Dial-up internet", category: "funny", module: null },
  { id: "buzzer", name: "Incorrect buzzer", category: "funny", module: null },
  { id: "evil_laugh", name: "Evil laugh", category: "funny", module: null },
  { id: "doorbell", name: "Doorbell gone wrong", category: "funny", module: null },
  { id: "birds", name: "Morning birds", category: "nature", module: null },
  { id: "rain", name: "Gentle rain", category: "nature", module: null },
  { id: "ocean", name: "Ocean waves", category: "nature", module: null },
];

export const BUILT_IN_SOUNDS: BuiltInSound[] = [...REGISTRY_SOUNDS, ...COMING_SOON];

// Legacy ids → current registry ids (keeps stored alarm selections working).
const ID_ALIASES: Record<string, string> = {
  meow_cat: "angry_cat",
  classic_alarm: "default",
};

export function getBuiltInSound(id: string | undefined): BuiltInSound | undefined {
  if (!id) return undefined;
  const resolved = ID_ALIASES[id] ?? id;
  return BUILT_IN_SOUNDS.find((s) => s.id === resolved);
}

export function soundSource(id: string | undefined): AudioSource | undefined {
  const s = getBuiltInSound(id);
  if (!s || s.module === null) return undefined;
  return s.module as AudioSource;
}

export const CATEGORY_LABEL: Record<SoundCategory, string> = {
  default: "Default Tones",
  funny: "Wake Up Laughing",
  character: "Character Voices",
  nature: "Nature Sounds",
};

// Reminder sounds for the medication screen — derived from the registry plus
// a "Silent" option.
export interface ReminderSound {
  id: "silent" | "goat_bleat" | "cow_moo" | "sad_trombone" | "angry_cat";
  label: string;
  module: number | null;
}

const REGISTRY_REMINDER_MAPPED: ReminderSound[] = REGISTRY_REMINDER_SOUNDS.map(
  (s: ReminderSoundEntry) => ({
    id: s.id as ReminderSound["id"],
    label: s.displayName,
    module: s.source,
  }),
);

export const REMINDER_SOUNDS: ReminderSound[] = [
  { id: "silent", label: "Silent", module: null },
  ...REGISTRY_REMINDER_MAPPED,
];

export function reminderSoundSource(id: string | undefined): AudioSource | undefined {
  if (!id) return undefined;
  const resolved = ID_ALIASES[id] ?? id;
  const found = REMINDER_SOUNDS.find((s) => s.id === resolved);
  if (!found || found.module === null) return undefined;
  return found.module as AudioSource;
}
