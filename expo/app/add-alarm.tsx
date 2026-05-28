import React, { useEffect, useMemo, useRef, useState } from "react";
import { FlatList, Platform, Pressable, StyleSheet, Text, ToastAndroid, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { Brain, Check, ChevronDown, ChevronRight, ChevronUp, Info, Mic, Play, Square, Trash2, X, Zap } from "lucide-react-native";
import { createAudioPlayer, type AudioPlayer } from "expo-audio";
import { COLORS, RADIUS } from "@/constants/theme";
import { useApp } from "@/providers/AppProvider";
import { Day, QuizCategory, SoundType } from "@/types";
import TimePicker from "@/components/TimePicker";
import DayToggle from "@/components/DayToggle";
import GrainBackground from "@/components/GrainBackground";
import { BUILT_IN_SOUNDS, CATEGORY_LABEL, type SoundCategory } from "@/constants/sounds";

const CATS: QuizCategory[] = ["Science", "History", "Maths", "Puzzles", "Mixed"];

type DayPresetId = "everyday" | "weekdays" | "weekends" | "mwf" | "custom";
const DAY_PRESETS: { id: DayPresetId; label: string; days: Day[] | null }[] = [
  { id: "everyday", label: "Every day", days: [0, 1, 2, 3, 4, 5, 6] },
  { id: "weekdays", label: "Weekdays", days: [0, 1, 2, 3, 4] },
  { id: "weekends", label: "Weekends", days: [5, 6] },
  { id: "mwf", label: "Mon Wed Fri", days: [0, 2, 4] },
  { id: "custom", label: "Custom", days: null },
];

const sameSet = (a: Day[], b: Day[]): boolean => a.length === b.length && a.every((x) => b.includes(x));

export default function AddAlarm() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string }>();
  const { addAlarm, updateAlarm, removeAlarm, alarms, settings, recordings } = useApp();
  const existing = params.id ? alarms.find((a) => a.id === params.id) : undefined;
  const editing = !!existing;

  const [hour, setHour] = useState<number>(existing?.hour ?? 7);
  const [minute, setMinute] = useState<number>(existing?.minute ?? 30);
  const [days, setDays] = useState<Day[]>(existing?.days ?? [0, 1, 2, 3, 4]);
  const [mode, setMode] = useState<"challenge" | "loud">(existing?.mode ?? settings.defaultMode);
  const [cats, setCats] = useState<QuizCategory[]>(existing?.categories ?? ["Mixed"]);
  const [soundType, setSoundType] = useState<SoundType>(existing?.sound?.type ?? "default");
  const [recordingId, setRecordingId] = useState<string | undefined>(existing?.sound?.recordingId);
  const [builtInId, setBuiltInId] = useState<string | undefined>(existing?.sound?.builtInId);
  const [openCats, setOpenCats] = useState<Record<string, boolean>>({ default: true, funny: true, character: true });
  const [playingId, setPlayingId] = useState<string | null>(null);
  const previewRef = useRef<AudioPlayer | null>(null);

  const stopPreview = () => {
    try { previewRef.current?.pause(); previewRef.current?.remove(); } catch {}
    previewRef.current = null;
    setPlayingId(null);
  };

  useEffect(() => {
    return () => {
      try { previewRef.current?.pause(); previewRef.current?.remove(); } catch {}
      previewRef.current = null;
    };
  }, []);

  const togglePreview = (id: string, mod: number | null) => {
    if (playingId === id) { stopPreview(); return; }
    try { previewRef.current?.pause(); previewRef.current?.remove(); } catch {}
    previewRef.current = null;
    if (mod === null) {
      const msg = "Audio coming soon — check back after the next update.";
      if (Platform.OS === "android") ToastAndroid.show(msg, ToastAndroid.SHORT);
      else console.log("[preview]", msg);
      setPlayingId(null);
      return;
    }
    try {
      const p = createAudioPlayer(mod as unknown as number);
      p.volume = 1.0;
      p.loop = false;
      p.play();
      previewRef.current = p;
      setPlayingId(id);
      const sub = p.addListener("playbackStatusUpdate", (status) => {
        if (status.didJustFinish) {
          try { sub.remove(); } catch {}
          stopPreview();
        }
      });
    } catch (e) {
      console.log("[preview] error", e);
      setPlayingId(null);
    }
  };

  const activePreset = useMemo<DayPresetId>(() => {
    for (const p of DAY_PRESETS) {
      if (p.days && sameSet(days, p.days)) return p.id;
    }
    return "custom";
  }, [days]);

  const selectedRecording = recordings.find((r) => r.id === recordingId);

  const save = async () => {
    if (Platform.OS !== "web") await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const sound = {
      type: soundType,
      recordingId: soundType === "recording" ? recordingId : undefined,
      builtInId: soundType === "builtIn" ? builtInId : undefined,
    };
    if (editing && existing) {
      updateAlarm(existing.id, { hour, minute, days, mode, categories: cats, sound });
    } else {
      addAlarm({ hour, minute, days, mode, categories: cats, enabled: true, sound });
    }
    router.back();
  };

  const onDelete = () => {
    if (existing) {
      removeAlarm(existing.id);
      router.back();
    }
  };

  return (
    <SafeAreaView style={styles.root} edges={["top", "bottom"]}>
      <GrainBackground decor={["horseshoe", "star"]} />
      <View style={styles.header}>
        <Text style={styles.title}>{editing ? "Edit alarm" : "New alarm"}</Text>
        <Pressable onPress={() => router.back()} style={styles.closeBtn}>
          <X size={20} color={COLORS.textMuted} />
        </Pressable>
      </View>

      <FlatList
        data={[1]}
        keyExtractor={(i) => String(i)}
        renderItem={() => null}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        ListHeaderComponent={
          <View style={{ gap: 20 }}>
            <TimePicker hour={hour} minute={minute} onChange={(h, m) => { setHour(h); setMinute(m); }} />

            <Section title="Repeat">
              <DayToggle days={days} onChange={setDays} />
              <View style={[styles.chipRow, { marginTop: 10 }]}>
                {DAY_PRESETS.map((p) => {
                  const on = p.id === activePreset;
                  return (
                    <Pressable
                      key={p.id}
                      onPress={() => {
                        if (p.days) setDays(p.days);
                        else setDays([]);
                      }}
                      style={[styles.presetChip, on && styles.presetChipOn]}
                      testID={`preset-${p.id}`}
                    >
                      <Text style={[styles.presetText, on && { color: COLORS.creamLight }]}>{p.label}</Text>
                    </Pressable>
                  );
                })}
              </View>
            </Section>

            <Section title="Alarm mode">
              <View style={styles.row2}>
                <Pressable onPress={() => setMode("challenge")} style={[styles.modeTile, mode === "challenge" && styles.modeTileOn]}>
                  <Brain size={22} color={mode === "challenge" ? COLORS.warmDeep : COLORS.textMuted} />
                  <Text style={styles.modeLabel}>Challenge</Text>
                  <Text style={styles.modeSub}>Puzzle + question</Text>
                </Pressable>
                <Pressable onPress={() => setMode("loud")} style={[styles.modeTile, mode === "loud" && styles.modeTileOn]}>
                  <Zap size={22} color={mode === "loud" ? COLORS.warmDeep : COLORS.textMuted} />
                  <Text style={styles.modeLabel}>Loud</Text>
                  <Text style={styles.modeSub}>Just make it stop</Text>
                </Pressable>
              </View>
            </Section>

            {mode === "challenge" && (
              <Section title="Quiz category">
                <View style={styles.chipRow}>
                  {CATS.map((c) => {
                    const on = cats.includes(c);
                    return (
                      <Pressable
                        key={c}
                        onPress={() => setCats(on ? cats.filter((x) => x !== c) : [...cats, c])}
                        style={[styles.chip, on && styles.chipOn]}
                      >
                        <Text style={[styles.chipText, on && { color: COLORS.creamLight }]}>{c}</Text>
                      </Pressable>
                    );
                  })}
                </View>
              </Section>
            )}

            <Section title="Alarm sound">
              <Pressable onPress={() => router.push("/record-sound")} style={styles.recordCta} testID="record-own">
                <Mic size={20} color={COLORS.creamLight} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.recordCtaTitle}>Record your own voice</Text>
                  <Text style={styles.recordCtaSub}>Use a voice note as your alarm sound</Text>
                </View>
                <ChevronRight size={18} color={COLORS.creamLight} />
              </Pressable>

              {(["default", "funny", "character", "nature"] as SoundCategory[]).map((cat) => {
                const items = BUILT_IN_SOUNDS.filter((s) => s.category === cat);
                const open = openCats[cat] ?? false;
                return (
                  <View key={cat} style={styles.catBlock}>
                    <Pressable
                      onPress={() => setOpenCats((prev) => ({ ...prev, [cat]: !open }))}
                      style={styles.catHeader}
                    >
                      <Text style={styles.catTitle}>{CATEGORY_LABEL[cat]}</Text>
                      {open ? <ChevronUp size={16} color={COLORS.textMuted} /> : <ChevronDown size={16} color={COLORS.textMuted} />}
                    </Pressable>
                    {open && items.map((s) => {
                      const isDefault = s.id === "default";
                      const on = isDefault
                        ? soundType === "default"
                        : soundType === "builtIn" && builtInId === s.id;
                      const comingSoon = s.module === null;
                      const isPlaying = playingId === s.id;
                      return (
                        <Pressable
                          key={s.id}
                          onPress={() => {
                            if (comingSoon) {
                              const msg = "Audio coming soon — check back after the next update.";
                              if (Platform.OS === "android") ToastAndroid.show(msg, ToastAndroid.SHORT);
                              return;
                            }
                            if (isDefault) { setSoundType("default"); setBuiltInId(undefined); }
                            else { setSoundType("builtIn"); setBuiltInId(s.id); setRecordingId(undefined); }
                          }}
                          style={[styles.soundRow, on && styles.soundRowOn, comingSoon && styles.soundRowDisabled]}
                        >
                            <Text style={[styles.soundRowText, comingSoon && { color: COLORS.textMuted }]}>
                              {s.name}{comingSoon ? "  · Coming soon" : ""}
                            </Text>
                            <Pressable
                              onPress={(e) => { e.stopPropagation(); togglePreview(s.id, s.module); }}
                              hitSlop={10}
                              style={styles.previewBtn}
                              testID={`preview-${s.id}`}
                            >
                              {isPlaying ? (
                                <Square size={12} color={COLORS.warmDeep} fill={COLORS.warmDeep} />
                              ) : (
                                <Play size={14} color={COLORS.warmDeep} />
                              )}
                            </Pressable>
                            {on && <Check size={16} color={COLORS.warmDeep} />}
                        </Pressable>
                      );
                    })}
                  </View>
                );
              })}

              <View style={styles.catBlock}>
                <Pressable
                  onPress={() => setOpenCats((prev) => ({ ...prev, recordings: !(prev.recordings ?? false) }))}
                  style={styles.catHeader}
                >
                  <Text style={styles.catTitle}>My Recordings {recordings.length > 0 ? `(${recordings.length})` : ""}</Text>
                  {openCats.recordings ? <ChevronUp size={16} color={COLORS.textMuted} /> : <ChevronDown size={16} color={COLORS.textMuted} />}
                </Pressable>
                {openCats.recordings && (
                  <View style={{ gap: 6 }}>
                    {recordings.length === 0 && (
                      <Text style={styles.lockText}>No saved recordings yet. Tap “Record your own voice” above.</Text>
                    )}
                    {recordings.map((r) => {
                      const on = recordingId === r.id && soundType === "recording";
                      return (
                        <Pressable
                          key={r.id}
                          onPress={() => { setSoundType("recording"); setRecordingId(r.id); setBuiltInId(undefined); }}
                          style={[styles.savedRow, on && styles.savedRowOn]}
                        >
                          <Text style={styles.savedName}>{r.name}</Text>
                          <Text style={styles.savedMeta}>{Math.round(r.durationMs / 1000)}s {on ? "· selected" : ""}</Text>
                        </Pressable>
                      );
                    })}
                  </View>
                )}
              </View>

              {selectedRecording && (
                <Text style={styles.lockText}>Selected: {selectedRecording.name}</Text>
              )}
            </Section>

            <Section title="Difficulty">
              <View style={styles.lockRow}>
                <Info size={16} color={COLORS.textMuted} />
                <Text style={styles.lockText}>Kept easy on purpose. You&apos;re half asleep!</Text>
              </View>
            </Section>

            {editing && (
              <Pressable onPress={onDelete} style={styles.deleteBtn} testID="delete-alarm">
                <Trash2 size={16} color={COLORS.sienna} />
                <Text style={styles.deleteText}>Delete alarm</Text>
              </Pressable>
            )}
          </View>
        }
      />

      <View style={styles.footer}>
        <Pressable onPress={save} style={({ pressed }) => [styles.cta, pressed && { opacity: 0.9 }]}>
          <Text style={styles.ctaText} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}>{editing ? "Save changes" : "+ Add alarm"}</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 20 },
  title: { color: COLORS.cream, fontSize: 22, fontWeight: "800" },
  closeBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: COLORS.card, alignItems: "center", justifyContent: "center" },
  content: { padding: 20, paddingTop: 8, paddingBottom: 32 },
  section: { gap: 10 },
  sectionTitle: { color: COLORS.textMuted, fontSize: 11, letterSpacing: 1.4, fontWeight: "800" },
  row2: { flexDirection: "row", gap: 12 },
  modeTile: { flex: 1, padding: 16, gap: 8, borderRadius: RADIUS.lg, borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.card },
  modeTileOn: { borderColor: COLORS.warmDeep, borderWidth: 1.5, backgroundColor: "rgba(196,113,74,0.18)" },
  modeLabel: { color: COLORS.text, fontWeight: "700", fontSize: 15 },
  modeSub: { color: COLORS.textMuted, fontSize: 12 },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 999, borderWidth: 1, borderColor: COLORS.warmDeep, backgroundColor: COLORS.card },
  chipOn: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  chipText: { color: COLORS.warmDeep, fontWeight: "700", fontSize: 12 },
  presetChip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999, borderWidth: 1, borderColor: COLORS.borderLight, backgroundColor: "transparent" },
  presetChipOn: { backgroundColor: COLORS.warmDeep, borderColor: COLORS.warmDeep },
  presetText: { color: COLORS.textMuted, fontWeight: "700", fontSize: 11 },
  catBlock: { gap: 6 },
  catHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 8, paddingHorizontal: 4 },
  catTitle: { color: COLORS.cream, fontWeight: "800", fontSize: 13, letterSpacing: 0.5 },
  previewBtn: { width: 32, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(196,113,74,0.18)" },
  soundRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 12, paddingHorizontal: 14, borderRadius: RADIUS.md, backgroundColor: COLORS.card, borderWidth: 0.75, borderColor: COLORS.border },
  soundRowOn: { borderColor: COLORS.warmDeep, backgroundColor: "rgba(196,113,74,0.15)" },
  soundRowDisabled: { opacity: 0.5 },
  soundRowText: { flex: 1, color: COLORS.text, fontWeight: "700", fontSize: 14 },
  soundCheck: { color: COLORS.warmDeep, fontWeight: "900", fontSize: 16 },
  savedRow: { paddingVertical: 10, paddingHorizontal: 14, borderRadius: RADIUS.sm, backgroundColor: COLORS.card, borderWidth: 0.5, borderColor: COLORS.borderLight },
  savedRowOn: { borderColor: COLORS.warmDeep, backgroundColor: "rgba(196,113,74,0.15)" },
  savedName: { color: COLORS.text, fontWeight: "700", fontSize: 13 },
  savedMeta: { color: COLORS.textMuted, fontSize: 11, marginTop: 2 },
  lockRow: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: COLORS.card, borderColor: COLORS.border, borderWidth: 0.75, padding: 12, borderRadius: RADIUS.md },
  lockText: { color: COLORS.textMuted, fontSize: 12, flex: 1 },
  recordCta: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 14, paddingHorizontal: 16, borderRadius: RADIUS.md, backgroundColor: COLORS.primary },
  recordCtaTitle: { color: COLORS.creamLight, fontWeight: "800", fontSize: 15 },
  recordCtaSub: { color: COLORS.creamLight, opacity: 0.85, fontSize: 11, marginTop: 2 },
  deleteBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 12, borderRadius: RADIUS.md, borderWidth: 1, borderColor: COLORS.sienna, marginTop: 8 },
  deleteText: { color: COLORS.sienna, fontWeight: "700", fontSize: 13 },
  footer: { padding: 20, paddingTop: 12, alignItems: "center", justifyContent: "center" },
  cta: { backgroundColor: COLORS.primary, paddingVertical: 16, paddingHorizontal: 36, borderRadius: RADIUS.pill, alignItems: "center", justifyContent: "center", alignSelf: "center", minWidth: 200 },
  ctaText: { color: COLORS.creamLight, fontWeight: "800", fontSize: 15, textAlign: "center" },
});
