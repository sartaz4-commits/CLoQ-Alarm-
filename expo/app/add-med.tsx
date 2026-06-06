import React, { useEffect, useMemo, useRef, useState } from "react";
import { FlatList, Platform, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { Check, Play, Sparkles, Square, X } from "lucide-react-native";
import { createAudioPlayer, type AudioPlayer } from "expo-audio";
import { COLORS, RADIUS } from "@/constants/theme";
import { useApp } from "@/providers/AppProvider";
import { BuzzPattern, BuzzSound, Day, MedBuzz, MedFrequency } from "@/types";
import TimePicker from "@/components/TimePicker";
import DayToggle from "@/components/DayToggle";
import GrainBackground from "@/components/GrainBackground";
import { REMINDER_SOUNDS } from "@/constants/sounds";
import { buzzForTime, formatTime, suggestedBuzz } from "@/utils/time";

const FREQS: { id: MedFrequency; label: string }[] = [
  { id: "daily", label: "Once Daily" },
  { id: "twice", label: "Twice Daily" },
  { id: "alternate", label: "Alternate Days" },
  { id: "weekly", label: "Weekly" },
  { id: "custom", label: "Custom" },
];

const PATTERNS: { id: BuzzPattern; label: string }[] = [
  { id: "short", label: "Short pulse" },
  { id: "double", label: "Double tap" },
  { id: "long", label: "Long buzz" },
];



export default function AddMed() {
  const router = useRouter();
  const { addMed } = useApp();
  const [label, setLabel] = useState<string>("");
  const [dosage, setDosage] = useState<string>("");
  const [freq, setFreq] = useState<MedFrequency>("daily");
  const [hour1, setHour1] = useState<number>(8);
  const [minute1, setMinute1] = useState<number>(0);
  const [hour2, setHour2] = useState<number>(20);
  const [minute2, setMinute2] = useState<number>(0);
  const [customDays, setCustomDays] = useState<Day[]>([0, 2, 4]);
  const [weeklyDay, setWeeklyDay] = useState<Day>(0);
  const [buzz, setBuzz] = useState<MedBuzz>({ pattern: "double", sound: "cow_moo", volume: 60 });
  const previewRef = useRef<AudioPlayer | null>(null);
  const [playingId, setPlayingId] = useState<string | null>(null);

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
    if (mod === null) { setPlayingId(null); return; }
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
    } catch {
      setPlayingId(null);
    }
  };

  const buzz1 = useMemo(() => buzzForTime(formatTime(hour1, minute1)), [hour1, minute1]);
  const buzz2 = useMemo(() => buzzForTime(formatTime(hour2, minute2)), [hour2, minute2]);
  void buzz2;
  const suggestion = useMemo(() => suggestedBuzz(formatTime(hour1, minute1)), [hour1, minute1]);

  const previewPattern = async (p: BuzzPattern) => {
    setBuzz((b) => ({ ...b, pattern: p }));
    if (Platform.OS === "web") return;
    if (p === "short") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } else if (p === "double") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium), 140);
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    }
  };

  const applySuggestion = () => {
    setBuzz({ pattern: suggestion.pattern, sound: suggestion.sound, volume: suggestion.volume });
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const save = async () => {
    if (!label.trim()) return;
    if (Platform.OS !== "web") await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const times = freq === "twice"
      ? [formatTime(hour1, minute1), formatTime(hour2, minute2)]
      : [formatTime(hour1, minute1)];
    addMed({
      label: label.trim().slice(0, 20),
      dosage: dosage.trim().slice(0, 30),
      frequency: freq,
      times,
      customDays: freq === "custom" ? customDays : undefined,
      weeklyDay: freq === "weekly" ? weeklyDay : undefined,
      buzz,
    });
    router.back();
  };

  return (
    <SafeAreaView style={styles.root} edges={["top", "bottom"]}>
      <GrainBackground decor={["hat", "cactus"]} />
      <View style={styles.header}>
        <Text style={styles.title}>New reminder</Text>
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
            <Section title="Label">
              <TextInput
                value={label}
                onChangeText={(t) => setLabel(t.slice(0, 20))}
                placeholder="e.g. Med A, Morning Pill"
                placeholderTextColor={COLORS.textDim}
                style={styles.input}
                maxLength={20}
              />
            </Section>

            <Section title="Dosage">
              <TextInput
                value={dosage}
                onChangeText={(t) => setDosage(t.slice(0, 30))}
                placeholder="e.g. 1 tablet · 50mg"
                placeholderTextColor={COLORS.textDim}
                style={styles.input}
                maxLength={30}
              />
            </Section>

            <Section title="Frequency">
              <View style={styles.chipRow}>
                {FREQS.map((f) => {
                  const on = freq === f.id;
                  return (
                    <Pressable key={f.id} onPress={() => setFreq(f.id)} style={[styles.chip, on && styles.chipOn]}>
                      <Text style={[styles.chipText, on && { color: COLORS.creamLight }]}>{f.label}</Text>
                    </Pressable>
                  );
                })}
              </View>
            </Section>

            <Section title={freq === "twice" ? "First dose" : "Time"}>
              <TimePicker hour={hour1} minute={minute1} onChange={(h, m) => { setHour1(h); setMinute1(m); }} />
              <Text style={styles.preview}>{buzz1.label}</Text>
            </Section>

            {freq === "twice" && (
              <Section title="Second dose">
                <TimePicker hour={hour2} minute={minute2} onChange={(h, m) => { setHour2(h); setMinute2(m); }} />
                <Text style={styles.preview}>{buzz2.label}</Text>
              </Section>
            )}

            {freq === "custom" && (
              <Section title="Days">
                <DayToggle days={customDays} onChange={setCustomDays} />
              </Section>
            )}

            <Section title="Buzz settings">
              <Text style={styles.subLabel}>Vibration pattern</Text>
              <View style={styles.chipRow}>
                {PATTERNS.map((p) => {
                  const on = buzz.pattern === p.id;
                  return (
                    <Pressable key={p.id} onPress={() => previewPattern(p.id)} style={[styles.chip, on && styles.chipOn]} testID={`pattern-${p.id}`}>
                      <Text style={[styles.chipText, on && { color: COLORS.creamLight }]}>{p.label}</Text>
                    </Pressable>
                  );
                })}
              </View>

              <Text style={styles.subLabel}>Reminder sound</Text>
              <View style={{ gap: 8 }}>
                {REMINDER_SOUNDS.map((s) => {
                  const on = buzz.sound === s.id;
                  const isPlaying = playingId === s.id;
                  const hasAudio = s.module !== null;
                  return (
                    <Pressable
                      key={s.id}
                      onPress={() => setBuzz((b) => ({ ...b, sound: s.id as BuzzSound }))}
                      style={[styles.soundRow, on && styles.soundRowOn]}
                      testID={`sound-${s.id}`}
                    >
                      <Text style={styles.soundRowText}>{s.label}</Text>
                      {hasAudio && (
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
                      )}
                      {on && <Check size={16} color={COLORS.warmDeep} />}
                    </Pressable>
                  );
                })}
              </View>

              <Text style={styles.subLabel}>Volume {buzz.volume}%</Text>
              <VolumeSlider value={buzz.volume} onChange={(v) => setBuzz((b) => ({ ...b, volume: v }))} />

              <View style={styles.suggestionCard}>
                <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 8 }}>
                  <Sparkles size={16} color={COLORS.warm} />
                  <Text style={styles.suggestionText}>{suggestion.text}</Text>
                </View>
                <Pressable onPress={applySuggestion} style={styles.applyBtn} testID="apply-suggestion">
                  <Text style={styles.applyText}>Apply suggestion</Text>
                </Pressable>
              </View>
            </Section>

            <Text style={styles.disclaimer}>Personal reminder only — not medical advice.</Text>
          </View>
        }
      />

      <View style={styles.footer}>
        <Pressable
          onPress={save}
          style={({ pressed }) => [styles.cta, pressed && { opacity: 0.9 }, !label.trim() && { opacity: 0.5 }]}
          disabled={!label.trim()}
        >
          <Text style={styles.ctaText}>Save Reminder</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

function VolumeSlider({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const steps = [0, 25, 50, 75, 100];
  return (
    <View style={styles.volRow}>
      {steps.map((s) => {
        const on = value >= s;
        return (
          <Pressable key={s} onPress={() => onChange(s)} style={[styles.volStep, on && styles.volStepOn]} testID={`vol-${s}`}>
            <Text style={[styles.volStepText, on && { color: COLORS.creamLight }]}>{s}</Text>
          </Pressable>
        );
      })}
    </View>
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
  content: { padding: 20, paddingTop: 4, paddingBottom: 32 },
  section: { gap: 10 },
  sectionTitle: { color: COLORS.textMuted, fontSize: 11, letterSpacing: 1.4, fontWeight: "800" },
  subLabel: { color: COLORS.textMuted, fontSize: 11, fontWeight: "700", marginTop: 6 },
  input: { backgroundColor: COLORS.card, borderColor: COLORS.border, borderWidth: 0.75, borderRadius: RADIUS.md, padding: 14, color: COLORS.text, fontSize: 15 },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 999, borderWidth: 1, borderColor: COLORS.warmDeep, backgroundColor: COLORS.card },
  chipOn: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  chipText: { color: COLORS.warmDeep, fontWeight: "700", fontSize: 12 },
  preview: { color: COLORS.warmDeep, fontSize: 13, fontWeight: "700", textAlign: "center" },
  volRow: { flexDirection: "row", gap: 6 },
  volStep: { flex: 1, paddingVertical: 10, borderRadius: RADIUS.sm, borderWidth: 1, borderColor: COLORS.warmDeep, alignItems: "center", backgroundColor: COLORS.card },
  volStepOn: { backgroundColor: COLORS.warmDeep },
  volStepText: { color: COLORS.warmDeep, fontWeight: "700", fontSize: 12 },
  suggestionCard: { backgroundColor: "rgba(232,168,87,0.2)", borderColor: COLORS.warm, borderWidth: 1, borderRadius: RADIUS.md, padding: 12, gap: 10 },
  suggestionText: { flex: 1, color: COLORS.text, fontSize: 12, lineHeight: 17 },
  applyBtn: { alignSelf: "flex-start", paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999, backgroundColor: COLORS.warm },
  applyText: { color: COLORS.primary, fontWeight: "800", fontSize: 12 },
  soundRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 12, paddingHorizontal: 14, borderRadius: RADIUS.md, backgroundColor: COLORS.card, borderWidth: 0.75, borderColor: COLORS.border },
  soundRowOn: { borderColor: COLORS.warmDeep, backgroundColor: "rgba(196,113,74,0.15)" },
  soundRowText: { flex: 1, color: COLORS.text, fontWeight: "700", fontSize: 14 },
  previewBtn: { width: 32, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(196,113,74,0.18)" },
  disclaimer: { color: COLORS.textDim, fontSize: 11, textAlign: "center", fontStyle: "italic" },
  footer: { padding: 20, paddingTop: 0 },
  cta: { backgroundColor: COLORS.primary, paddingVertical: 16, borderRadius: RADIUS.pill, alignItems: "center" },
  ctaText: { color: COLORS.creamLight, fontWeight: "800", fontSize: 16 },
});
