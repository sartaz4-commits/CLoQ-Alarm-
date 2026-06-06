import React from "react";
import { Pressable, ScrollView, StyleSheet, Switch, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { ArrowLeft, ChevronRight, Mic, Sparkles } from "lucide-react-native";
import { COLORS, FONTS, RADIUS } from "@/constants/theme";
import GrainBackground from "@/components/GrainBackground";
import { useApp } from "@/providers/AppProvider";
import { QuizCategory, SnoozeMinutes } from "@/types";

const ALL_CATS: QuizCategory[] = ["Science", "History", "Maths", "Puzzles", "Mixed", "Geography", "Art"];

export default function Settings() {
  const router = useRouter();
  const { settings, updateSettings, recordings } = useApp();

  const toggleCat = (c: QuizCategory) => {
    const has = settings.enabledCategories.includes(c);
    updateSettings({
      enabledCategories: has
        ? settings.enabledCategories.filter((x) => x !== c)
        : [...settings.enabledCategories, c],
    });
  };

  return (
    <SafeAreaView style={styles.root} edges={["top", "bottom"]}>
      <GrainBackground />
      <View style={styles.headerRow}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft size={20} color={COLORS.text} />
        </Pressable>
        <Text style={styles.title}>Settings</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Section title="Quiz Categories">
          {ALL_CATS.map((c) => {
            const on = settings.enabledCategories.includes(c);
            return (
              <View key={c} style={styles.row}>
                <Text style={styles.rowLabel}>{c}</Text>
                <Switch
                  value={on}
                  onValueChange={() => toggleCat(c)}
                  trackColor={{ false: COLORS.borderLight, true: COLORS.warmDeep }}
                  thumbColor={COLORS.creamLight}
                />
              </View>
            );
          })}
        </Section>

        <Section title="Alarm Behaviour">
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Default alarm mode</Text>
            <View style={styles.segRow}>
              <Pressable onPress={() => updateSettings({ defaultMode: "challenge" })} style={[styles.seg, settings.defaultMode === "challenge" && styles.segOn]}>
                <Text style={[styles.segText, settings.defaultMode === "challenge" && { color: COLORS.creamLight }]}>Challenge</Text>
              </Pressable>
              <Pressable onPress={() => updateSettings({ defaultMode: "loud" })} style={[styles.seg, settings.defaultMode === "loud" && styles.segOn]}>
                <Text style={[styles.segText, settings.defaultMode === "loud" && { color: COLORS.creamLight }]}>Loud</Text>
              </Pressable>
            </View>
          </View>

          <View style={styles.row}>
            <Text style={styles.rowLabel}>Wrong answer penalty</Text>
            <View style={styles.segRow}>
              <Pressable onPress={() => updateSettings({ wrongPenalty: "15s" })} style={[styles.seg, settings.wrongPenalty === "15s" && styles.segOn]}>
                <Text style={[styles.segText, settings.wrongPenalty === "15s" && { color: COLORS.creamLight }]}>+15s</Text>
              </Pressable>
              <Pressable onPress={() => updateSettings({ wrongPenalty: "30s" })} style={[styles.seg, settings.wrongPenalty === "30s" && styles.segOn]}>
                <Text style={[styles.segText, settings.wrongPenalty === "30s" && { color: COLORS.creamLight }]}>+30s louder</Text>
              </Pressable>
            </View>
          </View>

          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.rowLabel, { color: COLORS.textDim }]}>Snooze</Text>
              <Text style={styles.tip}>No snooze. That’s the whole point.</Text>
            </View>
            <Switch value={false} disabled trackColor={{ false: COLORS.borderLight, true: COLORS.borderLight }} thumbColor={COLORS.textDim} />
          </View>
        </Section>

        <Section title="Alarm Sound">
          <Pressable onPress={() => router.push("/record-sound")} style={styles.row} testID="settings-record">
            <View style={{ flexDirection: "row", alignItems: "center", gap: 10, flex: 1 }}>
              <Mic size={18} color={COLORS.warmDeep} />
              <View>
                <Text style={styles.rowLabel}>Record voice alarm</Text>
                <Text style={styles.tip}>{recordings.length} saved recording{recordings.length === 1 ? "" : "s"}</Text>
              </View>
            </View>
            <ChevronRight size={18} color={COLORS.textMuted} />
          </Pressable>
        </Section>

        <Section title="Snooze">
          <View style={[styles.row, { flexDirection: "column", alignItems: "flex-start", gap: 10 }]}>
            <Text style={styles.rowLabel}>Snooze timer</Text>
            <View style={styles.chipRow}>
              {([5, 10, 15, 20] as SnoozeMinutes[]).map((m) => {
                const on = settings.snoozeMinutes === m;
                return (
                  <Pressable
                    key={m}
                    onPress={() => updateSettings({ snoozeMinutes: m })}
                    style={[styles.chip, on && styles.chipOn]}
                    testID={`snooze-${m}`}
                  >
                    <Text style={[styles.chipText, on && { color: COLORS.creamLight }]}>{m} min</Text>
                  </Pressable>
                );
              })}
            </View>
            <Text style={styles.tip}>
              Free users can snooze once per alarm by watching an ad. Premium users use their preset time.
            </Text>
          </View>
        </Section>

        <Section title="Reminder Buzz Intensity">
          <BuzzRow label="5–7 am" intensity={1} desc="Low" />
          <BuzzRow label="7–9 am" intensity={2} desc="Moderate" />
          <BuzzRow label="6 pm +" intensity={3} desc="Loud" />
        </Section>

        <Section title="Premium">
          <View style={styles.premiumCard}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <Sparkles size={18} color={COLORS.warmDeep} />
              <Text style={styles.premiumTitle}>CloQ Premium</Text>
            </View>
            <Text style={styles.premiumBody}>Enjoy CloQ completely ad-free. That’s it. No ads, ever.</Text>
            <Text style={styles.premiumPrice}>Try free for 1 month — then £0.99/month. Cancel anytime.</Text>
            <Pressable
              onPress={() => updateSettings({ premium: true })}
              style={({ pressed }) => [styles.premiumBtn, pressed && { opacity: 0.9 }, settings.premium && { backgroundColor: COLORS.success }]}
              testID="premium-cta"
            >
              <Text style={styles.premiumBtnText}>{settings.premium ? "Ads removed" : "Remove Ads — Start Free Trial"}</Text>
            </Pressable>
            <Pressable><Text style={styles.restoreText}>Restore purchases</Text></Pressable>
          </View>
        </Section>

      </ScrollView>
    </SafeAreaView>
  );
}

function BuzzRow({ label, intensity, desc }: { label: string; intensity: 1 | 2 | 3; desc: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
        <View style={styles.bars}>
          {[1, 2, 3].map((b) => (
            <View key={b} style={[styles.bar, b <= intensity && { backgroundColor: COLORS.warmDeep }]} />
          ))}
        </View>
        <Text style={styles.rowMeta}>{desc}</Text>
      </View>
    </View>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={{ gap: 8 }}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionBody}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg },
  headerRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 20 },
  backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: COLORS.card, borderWidth: 0.75, borderColor: COLORS.border, alignItems: "center", justifyContent: "center" },
  title: { color: COLORS.cream, fontSize: 22, fontWeight: "700", fontFamily: FONTS.display },
  content: { padding: 20, paddingTop: 0, gap: 20, paddingBottom: 60 },
  sectionTitle: { color: COLORS.textMuted, fontSize: 11, letterSpacing: 1.4, fontWeight: "800" },
  sectionBody: { backgroundColor: COLORS.card, borderColor: COLORS.border, borderWidth: 0.75, borderRadius: RADIUS.lg, overflow: "hidden" },
  row: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 14, borderBottomWidth: 0.5, borderBottomColor: COLORS.borderLight, gap: 12 },
  rowLabel: { color: COLORS.text, fontSize: 15, fontWeight: "600" },
  rowMeta: { color: COLORS.textMuted, fontSize: 13, fontWeight: "600" },
  tip: { color: COLORS.textDim, fontSize: 11, marginTop: 2, fontStyle: "italic" },
  segRow: { flexDirection: "row", gap: 6 },
  seg: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, borderWidth: 1, borderColor: COLORS.warmDeep },
  segOn: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  segText: { color: COLORS.warmDeep, fontWeight: "700", fontSize: 11 },
  bars: { flexDirection: "row", gap: 3, alignItems: "flex-end" },
  chipRow: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999, borderWidth: 1, borderColor: COLORS.warmDeep, backgroundColor: "transparent" },
  chipOn: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  chipText: { color: COLORS.warmDeep, fontWeight: "700", fontSize: 12 },
  bar: { width: 4, height: 14, backgroundColor: COLORS.borderLight, borderRadius: 2 },
  premiumCard: { padding: 18, gap: 12 },
  premiumTitle: { color: COLORS.cream, fontSize: 18, fontWeight: "700", fontFamily: FONTS.display },
  premiumBody: { color: COLORS.textMuted, fontSize: 13, lineHeight: 19 },
  premiumPrice: { color: COLORS.cream, fontSize: 12, fontWeight: "700" },
  premiumBtn: { backgroundColor: COLORS.primary, paddingVertical: 14, borderRadius: 999, alignItems: "center" },
  premiumBtnText: { color: COLORS.creamLight, fontWeight: "800", fontSize: 14 },
  restoreText: { color: COLORS.warmDeep, textAlign: "center", fontSize: 13, fontWeight: "600" },

});
