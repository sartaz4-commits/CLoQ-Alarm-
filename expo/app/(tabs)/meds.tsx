import React, { useMemo } from "react";
import { Alert, FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Check, Plus, X } from "lucide-react-native";
import { COLORS, FONTS, RADIUS } from "@/constants/theme";
import GrainBackground from "@/components/GrainBackground";
import { useApp } from "@/providers/AppProvider";
import { MedFrequency, Medication } from "@/types";
import { DAY_LABELS, buzzForTime, todayIndex, ymd } from "@/utils/time";

const FREQ_COLOR: Record<MedFrequency, string> = {
  daily: "#C4714A",
  twice: "#E8A857",
  alternate: "#8B6FA0",
  weekly: "#D88848",
  custom: "#8B4513",
};

const FREQ_LABEL: Record<MedFrequency, string> = {
  daily: "Daily",
  twice: "Twice Daily",
  alternate: "Alternate Days",
  weekly: "Weekly",
  custom: "Custom",
};

export default function MedsScreen() {
  const router = useRouter();
  const { meds, removeMed } = useApp();

  const periodLabel = useMemo(() => {
    const d = new Date();
    const start = new Date(d);
    start.setDate(d.getDate() - ((d.getDay() + 6) % 7));
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    const fmt = (x: Date) => `${x.getDate()}`;
    const month = start.toLocaleString(undefined, { month: "short" });
    return `Week of ${fmt(start)}–${fmt(end)} ${month}`;
  }, []);

  return (
    <SafeAreaView style={styles.root} edges={["top"]}>
      <GrainBackground />
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.title}>Reminders</Text>
          <Text style={styles.period}>{periodLabel}</Text>
        </View>
        <Pressable onPress={() => router.push("/add-med")} style={styles.addBtn} testID="add-med-header">
          <Plus size={20} color={COLORS.creamLight} />
        </Pressable>
      </View>

      <FlatList
        data={meds}
        keyExtractor={(m) => m.id}
        renderItem={({ item }) => (
          <MedCard
            med={item}
            onLongPress={() => {
              Alert.alert(item.label, undefined, [
                { text: "Cancel", style: "cancel" },
                { text: "Delete", style: "destructive", onPress: () => removeMed(item.id) },
              ]);
            }}
          />
        )}
        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>No reminders yet</Text>
            <Text style={styles.emptyBody}>Tap + to add a personal reminder. Use a label like &ldquo;Med A&rdquo; — never a real medication name.</Text>
          </View>
        }
        ListFooterComponent={
          <Text style={styles.disclaimer}>CloQ is a reminder tool only, not a medical device.</Text>
        }
      />
    </SafeAreaView>
  );
}

function MedCard({ med, onLongPress }: { med: Medication; onLongPress: () => void }) {
  const { toggleMedDose } = useApp();
  const today = ymd();
  const ti = todayIndex();

  const buzzes = med.times.map((t) => buzzForTime(t));
  const buzzLabel = med.buzz
    ? `${med.buzz.pattern} · ${med.buzz.sound} · ${med.buzz.volume}%`
    : med.frequency === "twice"
    ? `${med.times[0]} · ${med.times[1]}`
    : `${buzzes[0]?.label ?? "Buzz"}`;

  const week = useMemo(() => {
    const arr: { date: string; dayIndex: number }[] = [];
    const d = new Date();
    const monday = new Date(d);
    monday.setDate(d.getDate() - ((d.getDay() + 6) % 7));
    for (let i = 0; i < 7; i++) {
      const cur = new Date(monday);
      cur.setDate(monday.getDate() + i);
      arr.push({ date: ymd(cur), dayIndex: i });
    }
    return arr;
  }, []);

  const totalDoses = med.frequency === "twice" ? 14 : 7;
  const taken = med.logs.filter((l) => l.taken && week.some((w) => w.date === l.date)).length;

  const renderDaily = () => (
    <View style={styles.weekRow}>
      {week.map((w) => {
        const log = med.logs.find((l) => l.date === w.date && l.slot === 0);
        const isToday = w.dayIndex === ti;
        const isPast = w.date < today;
        const state = log?.taken ? "taken" : isPast ? "missed" : "upcoming";
        return (
          <Pressable
            key={`d-${w.date}`}
            onPress={() => toggleMedDose(med.id, w.date, 0)}
            style={[
              styles.daySquare,
              state === "taken" && styles.dayTaken,
              state === "missed" && styles.dayMissed,
              isToday && styles.dayToday,
            ]}
          >
            {state === "taken" && <Check size={14} color={COLORS.creamLight} />}
            {state === "missed" && <X size={14} color={COLORS.creamLight} />}
            <Text style={styles.dayLbl}>{DAY_LABELS[w.dayIndex]}</Text>
          </Pressable>
        );
      })}
    </View>
  );

  const renderTwice = () => {
    const todayTaken = med.logs.filter((l) => l.date === today && l.taken);
    const cnt = todayTaken.length;
    const todayBadge = cnt === 0
      ? { text: "0 / 2 today", color: COLORS.textMuted }
      : cnt === 1
      ? { text: "1 / 2 today", color: COLORS.warmDeep }
      : { text: "2 / 2 today", color: COLORS.success };

    return (
      <>
        <View style={styles.weekRow}>
          {week.map((w) => {
            const log0 = med.logs.find((l) => l.date === w.date && l.slot === 0);
            const log1 = med.logs.find((l) => l.date === w.date && l.slot === 1);
            const isToday = w.dayIndex === ti;
            return (
              <View key={`tw-${w.date}`} style={[styles.daySplit, isToday && styles.dayToday]}>
                <Pressable onPress={() => toggleMedDose(med.id, w.date, 0)} style={[styles.splitHalf, log0?.taken && styles.splitTaken]}>
                  {log0?.taken && <Check size={10} color={COLORS.creamLight} />}
                </Pressable>
                <View style={styles.splitDivider} />
                <Pressable onPress={() => toggleMedDose(med.id, w.date, 1)} style={[styles.splitHalf, log1?.taken && styles.splitTaken]}>
                  {log1?.taken && <Check size={10} color={COLORS.creamLight} />}
                </Pressable>
                <Text style={[styles.dayLbl, styles.splitLbl]}>{DAY_LABELS[w.dayIndex]}</Text>
              </View>
            );
          })}
        </View>
        <Text style={[styles.todayBadge, { color: todayBadge.color }]}>{todayBadge.text}</Text>
      </>
    );
  };

  return (
    <Pressable onLongPress={onLongPress} delayLongPress={350} style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={{ flex: 1 }}>
          <Text style={styles.cardLabel}>{med.label}</Text>
          {med.dosage ? <Text style={styles.cardDose}>{med.dosage}</Text> : null}
        </View>
        {med.streak > 0 ? <Text style={styles.streak}>{med.streak} day streak</Text> : null}
      </View>

      <View style={[styles.freqBadge, { backgroundColor: `${FREQ_COLOR[med.frequency]}33`, borderColor: FREQ_COLOR[med.frequency] }]}>
        <Text style={[styles.freqText, { color: FREQ_COLOR[med.frequency] }]}>{FREQ_LABEL[med.frequency]}</Text>
      </View>

      <View style={styles.progressRow}>
        <Text style={styles.fraction}>{taken}/{totalDoses}</Text>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${(taken / totalDoses) * 100}%` }]} />
        </View>
      </View>

      {med.frequency === "twice" ? renderTwice() : renderDaily()}

      <View style={styles.buzzRow}>
        <Text style={styles.buzzText}>{buzzLabel}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end", paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 },
  title: { color: COLORS.cream, fontSize: 28, fontWeight: "700", letterSpacing: -0.3, fontFamily: FONTS.display },
  period: { color: COLORS.textMuted, fontSize: 12, marginTop: 4, fontWeight: "600" },
  addBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: COLORS.primary, alignItems: "center", justifyContent: "center" },
  content: { padding: 20, paddingTop: 12, paddingBottom: 40 },
  empty: { padding: 28, borderWidth: 1, borderColor: COLORS.border, borderRadius: RADIUS.lg, alignItems: "center", gap: 8 },
  emptyTitle: { color: COLORS.cream, fontWeight: "700", fontSize: 16 },
  emptyBody: { color: COLORS.textMuted, textAlign: "center", fontSize: 13, lineHeight: 19 },
  card: { backgroundColor: COLORS.card, borderColor: COLORS.border, borderWidth: 0.75, borderRadius: RADIUS.lg, padding: 18, gap: 12 },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  cardLabel: { color: COLORS.cream, fontSize: 18, fontWeight: "700", fontFamily: FONTS.display },
  cardDose: { color: COLORS.textMuted, fontSize: 12, marginTop: 2 },
  streak: { color: COLORS.warmDeep, fontWeight: "700", fontSize: 12 },
  freqBadge: { alignSelf: "flex-start", borderWidth: 1, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  freqText: { fontWeight: "800", fontSize: 11, letterSpacing: 0.5 },
  progressRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  fraction: { color: COLORS.text, fontWeight: "700", fontSize: 14, fontVariant: ["tabular-nums"], minWidth: 40 },
  progressTrack: { flex: 1, height: 6, borderRadius: 3, backgroundColor: COLORS.borderLight, overflow: "hidden" },
  progressFill: { height: "100%", backgroundColor: COLORS.warmDeep },
  weekRow: { flexDirection: "row", justifyContent: "space-between", gap: 6 },
  daySquare: { flex: 1, aspectRatio: 1, borderRadius: 8, borderWidth: 1, borderColor: COLORS.borderLight, backgroundColor: COLORS.borderLight, alignItems: "center", justifyContent: "center", gap: 2 },
  dayTaken: { borderColor: COLORS.warmDeep, backgroundColor: COLORS.warmDeep },
  dayMissed: { borderColor: COLORS.sienna, backgroundColor: COLORS.sienna },
  dayToday: { borderColor: COLORS.warmDeep, borderWidth: 2, shadowColor: COLORS.warmDeep, shadowOpacity: 0.5, shadowRadius: 5 },
  dayLbl: { color: COLORS.textMuted, fontSize: 9, fontWeight: "800" },
  daySplit: { flex: 1, aspectRatio: 0.7, borderRadius: 8, borderWidth: 1, borderColor: COLORS.borderLight, backgroundColor: COLORS.borderLight, overflow: "hidden", alignItems: "center" },
  splitHalf: { flex: 1, alignSelf: "stretch", alignItems: "center", justifyContent: "center" },
  splitTaken: { backgroundColor: COLORS.warmDeep },
  splitDivider: { height: 1, alignSelf: "stretch", backgroundColor: COLORS.border },
  splitLbl: { position: "absolute", bottom: 2 },
  todayBadge: { fontSize: 12, fontWeight: "700" },
  buzzRow: { borderTopWidth: 1, borderTopColor: COLORS.border, paddingTop: 10 },
  buzzText: { color: COLORS.textMuted, fontSize: 12, fontWeight: "600" },
  disclaimer: { color: COLORS.textDim, fontSize: 11, textAlign: "center", marginTop: 16, fontStyle: "italic" },
});
