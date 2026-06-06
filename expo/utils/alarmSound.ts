import { createAudioPlayer, type AudioPlayer, type AudioSource } from "expo-audio";
import { DEFAULT_ALARM_SOUND } from "./soundRegistry";

/**
 * Alarm tone — uses AVAudioSessionCategoryPlayback (iOS) / STREAM_ALARM
 * equivalent (Android) configured at app start so audio plays even on
 * silent / DND.
 */

// Loud mode uses the classic Google alarm clock tone (streamed).
const LOUD_SOURCE: AudioSource = {
  uri: "https://actions.google.com/sounds/v1/alarms/alarm_clock.ogg",
};

// Bundled default tone — works offline. Sourced from the central registry.
const ALARM_SOURCE: AudioSource = DEFAULT_ALARM_SOUND as unknown as AudioSource;
const FALLBACK_SOURCE: AudioSource = ALARM_SOURCE;

export interface AlarmHandle {
  stop: () => void;
}

export interface AlarmSourceOptions {
  recordingUri?: string;
  builtInSource?: AudioSource;
  loud?: boolean;
}

/**
 * Start the alarm with escalating volume: 40% → 70% (10s) → 100% (20s).
 * Pass a recording URI to play a user recording or a built-in module source
 * to play a bundled sound instead of the default tone.
 */
export function startAlarmAudio(opts?: AlarmSourceOptions | string): AlarmHandle {
  const options: AlarmSourceOptions = typeof opts === "string" ? { recordingUri: opts } : (opts ?? {});
  let player: AudioPlayer | null = null;
  const timers: ReturnType<typeof setTimeout>[] = [];

  const source: AudioSource = options.recordingUri
    ? { uri: options.recordingUri }
    : options.builtInSource ?? (options.loud ? LOUD_SOURCE : ALARM_SOURCE);

  try {
    player = createAudioPlayer(source);
    player.loop = true;
    player.volume = 0.4;
    player.play();
  } catch {
    try {
      player = createAudioPlayer(FALLBACK_SOURCE);
      player.loop = true;
      player.volume = 0.4;
      player.play();
    } catch {
    }
  }

  timers.push(setTimeout(() => { if (player) player.volume = 0.7; }, 10_000));
  timers.push(setTimeout(() => { if (player) player.volume = 1.0; }, 20_000));

  return {
    stop: () => {
      for (const t of timers) clearTimeout(t);
      try {
        player?.pause();
        player?.remove();
      } catch {
      }
      player = null;
    },
  };
}
