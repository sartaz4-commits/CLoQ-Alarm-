/* eslint-disable @typescript-eslint/no-require-imports */
/**
 * Single source of truth for all audio assets in the app.
 *
 * No other file in the codebase should reference audio files directly via
 * require(). Everything must go through this registry.
 */

export const SOUNDS = {
  GOAT_BLEAT: require("../assets/sounds/sound_01_goat_bleat.mp3"),
  ANGRY_CAT: require("../assets/sounds/sound_02_angry_cat.mp3"),
  SAD_TROMBONE: require("../assets/sounds/sound_03_sad_trombone.mp3"),
  COW_MOO: require("../assets/sounds/sound_04_cow_moo.mp3"),
  CLASSIC_ALARM: require("../assets/sounds/sound_05_classic_alarm.mp3"),
  RETRO_BELL: require("../assets/sounds/sound_06_retro_bell.mp3"),
  FRENCH_MAN: require("../assets/sounds/sound_07_french_man.mp3"),
  INDIAN_AUNTIE: require("../assets/sounds/sound_08_indian_auntie.mp3"),
  SCOTTISH_MAN: require("../assets/sounds/sound_09_scottish_man.mp3"),
} as const;

export type SoundCategory = "Default Tones" | "Wake Up Laughing" | "Character Voices";

export interface SoundConfigEntry {
  id: string;
  displayName: string;
  category: SoundCategory;
  source: number;
  isDefault: boolean;
}

export const SOUND_CONFIG: SoundConfigEntry[] = [
  {
    id: "classic_alarm",
    displayName: "Classic Alarm",
    category: "Default Tones",
    source: SOUNDS.CLASSIC_ALARM,
    isDefault: true,
  },
  {
    id: "retro_bell",
    displayName: "Retro Bell",
    category: "Default Tones",
    source: SOUNDS.RETRO_BELL,
    isDefault: false,
  },
  {
    id: "goat_bleat",
    displayName: "Goat Bleat",
    category: "Wake Up Laughing",
    source: SOUNDS.GOAT_BLEAT,
    isDefault: false,
  },
  {
    id: "angry_cat",
    displayName: "Angry Cat",
    category: "Wake Up Laughing",
    source: SOUNDS.ANGRY_CAT,
    isDefault: false,
  },
  {
    id: "sad_trombone",
    displayName: "Sad Trombone",
    category: "Wake Up Laughing",
    source: SOUNDS.SAD_TROMBONE,
    isDefault: false,
  },
  {
    id: "cow_moo",
    displayName: "Cow Moo",
    category: "Wake Up Laughing",
    source: SOUNDS.COW_MOO,
    isDefault: false,
  },
  {
    id: "scottish_man",
    displayName: "Scottish Man",
    category: "Character Voices",
    source: SOUNDS.SCOTTISH_MAN,
    isDefault: false,
  },
  {
    id: "indian_auntie",
    displayName: "Indian Auntie",
    category: "Character Voices",
    source: SOUNDS.INDIAN_AUNTIE,
    isDefault: false,
  },
  {
    id: "french_man",
    displayName: "French Man",
    category: "Character Voices",
    source: SOUNDS.FRENCH_MAN,
    isDefault: false,
  },
];

export interface ReminderSoundEntry {
  id: string;
  displayName: string;
  source: number;
}

export const REMINDER_SOUNDS: ReminderSoundEntry[] = [
  { id: "goat_bleat", displayName: "Goat Bleat", source: SOUNDS.GOAT_BLEAT },
  { id: "angry_cat", displayName: "Angry Cat", source: SOUNDS.ANGRY_CAT },
  { id: "sad_trombone", displayName: "Sad Trombone", source: SOUNDS.SAD_TROMBONE },
  { id: "cow_moo", displayName: "Cow Moo", source: SOUNDS.COW_MOO },
];

export const DEFAULT_ALARM_SOUND = SOUNDS.CLASSIC_ALARM;
export const DEFAULT_ALARM_SOUND_ID = "classic_alarm";

export function getSoundConfig(id: string | undefined): SoundConfigEntry | undefined {
  if (!id) return undefined;
  return SOUND_CONFIG.find((s) => s.id === id);
}

export function getSoundSource(id: string | undefined): number | undefined {
  return getSoundConfig(id)?.source;
}

export function getReminderSound(id: string | undefined): ReminderSoundEntry | undefined {
  if (!id) return undefined;
  return REMINDER_SOUNDS.find((s) => s.id === id);
}
