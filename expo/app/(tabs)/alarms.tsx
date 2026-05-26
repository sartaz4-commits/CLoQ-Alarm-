import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  FlatList,
  Platform,
  Pressable,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Linking } from "react-native";
import * as Haptics from "expo-haptics";
import { Plus, Settings as SettingsIcon } from "lucide-react-native";
import { COLORS, DEV_MODE, FONTS, RADIUS } from "@/constants/theme";
import GrainBackground from "@/components/GrainBackground";
import { useApp } from "@/providers/AppProvider";
import { Alarm } from "@/types";
import { DAY_LABELS, distanceLabel, formatRepeat, formatTime, greeting, nextAlarmDate, todayIndex, ymd } from "@/utils/time";

export default function Home() {
  const router = useRouter();
  const { alarms, updateAlarm, removeAlarm, meds, settings, updateSettings, snooze, clearSnooze, wakeRequests } = useApp();
  const [countdown, setCountdown] = useState<number | null>(null);
  const [snoozeRemaining, setSnoozeRemaining] = useState<number>(0);

  // One-time Time Sensitive notification prompt (after onboarding).
  useEffect(() => {
    if (settings.timeSensitivePromptShown) return;
    const t = setTimeout(() => {
      Alert.alert(
        "Enable Time Sensitive notifications",
        "Enable Time Sensitive notifications for CloQ in Settings to make sure your alarm wakes you even in Focus mode.",
        [
          { text: "Later", style: "cancel", onPress: () => updateSettings({ timeSensitivePromptShown: true }) },
          {
            text: "Open Settings",
            onPress: () => {
              updateSettings({ timeSensitivePromptShown: true });
              try {
                if (typeof Linking.openSettings === "function") {
                  Linking.openSettings().catch(() => {});
                } else {
                  Linking.openURL("app-settings:").catch(() => {});
                }
              } catch {}
            },
          },
        ],
      );
    }, 800);
    return () => clearTimeout(t);
  }, [settings.timeSensitivePromptShown, updateSettings]);

  useEffect(() => {
    if (!snooze) { setSnoozeRemaining(0); return; }
    const tick = () => {
      const remaining = Math.max(0, snooze.resumesAt - Date.now());
      setSnoozeRemaining(remaining);
      if (remaining <= 0) {
        const aid = snooze.alarmId;
        clearSnooze();
        router.push({ pathname: "/alarm-firing", params: { id: aid } });
      }
    };
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, [snooze, clearSnooze, router]);

  const showPrivacy = !settings.privacyAcknowledged;

  const sorted = useMemo(() => {
    return [...alarms].sort((a, b) => {
      if (a.enabled !== b.enabled) return a.enabled ? -1 : 1;
      return a.hour * 60 + a.minute - (b.hour * 60 + b.minute);
    });
  }, [alarms]);

  // Fallback to first alarm so a disabled alarm still shows as the primary card
  // (no empty placeholder box appearing underneath).
  const nextAlarm = sorted.find((a) => a.enabled) ?? sorted[0];
  const secondaryAlarms = sorted.filter((a) => a.id !== nextAlarm?.id);
  const topStreak = meds.reduce((max, m) => Math.max(max, m.streak), 0);

  const today = ymd();
  const takenToday = meds.reduce((acc, m) => acc + m.logs.filter((l) => l.date === today && l.taken).length, 0);
  const todayMax = meds.reduce((acc, m) => acc + m.times.length, 0);
  const progress = todayMax === 0 ? 0 : Math.min(1, takenToday / todayMax);

  const acceptedNudge = wakeRequests.find((r) => r.outgoing && r.status === "accepted");

  const startTest = () => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setCountdown(5);
  };

  const formatRemaining = (ms: number): string => {
    const total = Math.ceil(ms / 1000);
    const m = Math.floor(total / 60);
    const s = total % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  useEffect(() => {
    if (countdown === null) return;
    if (countdown <= 0) {
      setCountdown(null);
      const a = alarms[0];
      router.push({ pathname: "/alarm-firing", params: a ? { id: a.id } : {} });
      return;
    }
    const t = setTimeout(() => setCountdown((c) => (c === null ? null : c - 1)), 1000);
    return () => clearTimeout(t);
  }, [countdown, alarms, router]);

  const editAlarm = (id: string) => {
    router.push({ pathname: "/add-alarm", params: { id } });
  };

  const onLongPressAlarm = (id: string) => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert(
      "Alarm options",
      undefined,
      [
        { text: "Edit", onPress: () => editAlarm(id) },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            Alert.alert("Delete this alarm?", undefined, [
              { text: "Cancel", style: "cancel" },
              { text: "Delete", style: "destructive", onPress: () => removeAlarm(id) },
            ]);
          },
        },
        { text: "Cancel", style: "cancel" },
      ],
    );
  };

  const header = (
    <View style={{ gap: 14 }}>
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.greeting}>{greeting()}</Text>
          <Text style={styles.h1}>Today&apos;s plan</Text>
        </View>
        <View style={{ flexDirection: "row", gap: 8 }}>
          <Pressable onPress={() => router.push("/add-alarm")} style={styles.iconBtn} testID="add-alarm-header">
            <Plus size={20} color={COLORS.cream} />
          </Pressable>
          <Pressable onPress={() => router.push("/settings")} style={styles.iconBtn}>
            <SettingsIcon size={20} color={COLORS.textMuted} />
          </Pressable>
        </View>
      </View>

      {acceptedNudge && (
        <View style={styles.nudgeCard}>
          <Text style={styles.nudgeTitle}>{acceptedNudge.friendName} will nudge you at {acceptedNudge.time}</Text>
          <Text style={styles.nudgeSub}>A friendly wake-up is on the way.</Text>
        </View>
      )}

      {showPrivacy && (
        <View style={styles.privacyCard}>
          <Text style={styles.privacyTitle}>Your data stays on your device</Text>
          <Text style={styles.privacyBody}>CloQ never collects or shares personal health information.</Text>
          <Pressable onPress={() => updateSettings({ privacyAcknowledged: true })} style={styles.privacyBtn}>
            <Text style={styles.privacyBtnText}>Got it</Text>
          </Pressable>
        </View>
      )}

      {nextAlarm ? (
        <PrimaryAlarmCard
          alarm={nextAlarm}
          onToggle={(v) => updateAlarm(nextAlarm.id, { enabled: v })}
          onEdit={() => editAlarm(nextAlarm.id)}
          onLongPress={() => onLongPressAlarm(nextAlarm.id)}
        />
      ) : (
        <Pressable onPress={() => router.push("/add-alarm")} style={[styles.alarmCard, { alignItems: "center", paddingVertical: 32 }]}>
          <Text style={styles.alarmLabel}>NO ALARMS</Text>
          <Text style={styles.alarmTime}>+ Add alarm</Text>
          <Text style={styles.alarmTags}>Tap to create your first</Text>
        </Pressable>
      )}
    </View>
  );

  const footer = (
    <View style={{ gap: 14, marginTop: 14 }}>
      {DEV_MODE && (
        <View style={{ gap: 4 }}>
          <Pressable onPress={startTest} style={styles.testAlarmBtn} testID="test-alarm-btn">
            <Text style={styles.testAlarmTxt}>Test Alarm — fires in 5 seconds</Text>
          </Pressable>
          <Text style={styles.testAlarmSub}>test button · remove before launch</Text>
        </View>
      )}

      <Pressable onPress={() => router.push("/(tabs)/meds")} style={styles.medCard}>
        <View style={styles.medHeader}>
          <Text style={styles.medTitle}>Reminders</Text>
          <Text style={styles.medCount}>{takenToday}/{todayMax || 0} today</Text>
        </View>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
        </View>
        {topStreak > 0 && (
          <Text style={styles.streakText}>{topStreak} day streak</Text>
        )}
        <Text style={styles.medSummary}>
          {meds.length === 0
            ? "No reminders yet — tap to add one"
            : meds.slice(0, 2).map((m) => {
                const taken = m.logs.filter((l) => l.date === today && l.taken).length;
                return `${m.label} · ${taken}/${m.times.length}`;
              }).join(" | ")}
        </Text>
        {meds.length > 0 && (
          <View style={styles.weekRow}>
            {DAY_LABELS.map((lbl, i) => {
              const isToday = i === todayIndex();
              return (
                <View key={`wk-${i}`} style={[styles.weekDot, isToday && styles.weekDotToday]}>
                  <Text style={[styles.weekLbl, isToday && { color: COLORS.text }]}>{lbl}</Text>
                </View>
              );
            })}
          </View>
        )}
      </Pressable>

      {!settings.premium && (
        <View style={styles.adBanner}>
          <Text style={styles.adTag}>Ad</Text>
          <Text style={styles.adText}>Upgrade to Premium to remove all ads — £0.99/month with 1 month free trial.</Text>
        </View>
      )}
    </View>
  );

  return (
    <View style={styles.root}>
      <GrainBackground />
      <SafeAreaView edges={["top"]} style={{ flex: 1 }}>
        {countdown !== null && (
          <View pointerEvents="none" style={styles.toast}>
            <Text style={styles.toastText}>Alarm fires in {Math.max(1, countdown)}…</Text>
          </View>
        )}
        {snoozeRemaining > 0 && (
          <View pointerEvents="none" style={styles.snoozeBanner}>
            <Text style={styles.snoozeBannerText}>
              Alarm resumes in {formatRemaining(snoozeRemaining)}
            </Text>
          </View>
        )}

        <FlatList
          data={secondaryAlarms}
          keyExtractor={(a) => a.id}
          renderItem={({ item }) => (
            <SecondaryAlarmCard
              alarm={item}
              onToggle={(v) => updateAlarm(item.id, { enabled: v })}
              onEdit={() => editAlarm(item.id)}
              onLongPress={() => onLongPressAlarm(item.id)}
            />
          )}
          ListHeaderComponent={header}
          ListFooterComponent={footer}
          contentContainerStyle={styles.content}
          ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
          showsVerticalScrollIndicator={false}
        />
      </SafeAreaView>
    </View>
  );
}

function PrimaryAlarmCard({ alarm, onToggle, onEdit, onLongPress }: { alarm: Alarm; onToggle: (v: boolean) => void; onEdit: () => void; onLongPress: () => void }) {
  const next = nextAlarmDate(alarm.hour, alarm.minute, alarm.days);
  return (
    <Pressable onPress={onEdit} onLongPress={onLongPress} delayLongPress={400} style={[styles.alarmCard, !alarm.enabled && { opacity: 0.55 }]} testID={`alarm-card-${alarm.id}`}>
      <View style={styles.accent} />
      <View style={styles.alarmRowTop}>
        <Text style={styles.alarmLabel}>NEXT ALARM · {distanceLabel(next)}</Text>
        <Switch
          value={alarm.enabled}
          onValueChange={onToggle}
          trackColor={{ false: COLORS.borderLight, true: COLORS.warmDeep }}
          thumbColor={COLORS.creamLight}
        />
      </View>
      <Text style={styles.alarmTime}>{formatTime(alarm.hour, alarm.minute)}</Text>
      <View style={styles.tagRow}>
        <Pressable onPress={onEdit} style={styles.tag} testID="alarm-tag-category">
          <Text style={styles.tagText}>{alarm.mode === "challenge" ? (alarm.categories[0] ?? "Mixed") : "Loud Mode"}</Text>
        </Pressable>
        <Pressable onPress={onEdit} style={styles.tag} testID="alarm-tag-days">
          <Text style={styles.tagText}>{formatRepeat(alarm.days)}</Text>
        </Pressable>
      </View>
    </Pressable>
  );
}

function SecondaryAlarmCard({ alarm, onToggle, onEdit, onLongPress }: { alarm: Alarm; onToggle: (v: boolean) => void; onEdit: () => void; onLongPress: () => void }) {
  return (
    <Pressable onPress={onEdit} onLongPress={onLongPress} delayLongPress={400} style={[styles.alarmCardSecondary, !alarm.enabled && { opacity: 0.55 }]} testID={`alarm-card-sec-${alarm.id}`}>
      <View style={{ flex: 1, gap: 6 }}>
        <Text style={styles.secondaryTime}>{formatTime(alarm.hour, alarm.minute)}</Text>
        <View style={styles.tagRow}>
          <Pressable onPress={onEdit} style={styles.tag} testID="alarm-tag-category-sec">
            <Text style={styles.tagText}>{alarm.mode === "challenge" ? (alarm.categories[0] ?? "Mixed") : "Loud Mode"}</Text>
          </Pressable>
          <Pressable onPress={onEdit} style={styles.tag} testID="alarm-tag-days-sec">
            <Text style={styles.tagText}>{formatRepeat(alarm.days)}</Text>
          </Pressable>
        </View>
      </View>
      <Switch
        value={alarm.enabled}
        onValueChange={onToggle}
        trackColor={{ false: COLORS.borderLight, true: COLORS.warmDeep }}
        thumbColor={COLORS.creamLight}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg },
  content: { padding: 20, paddingBottom: 40 },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end", marginTop: 4 },
  greeting: { color: COLORS.textMuted, fontSize: 12, fontFamily: Platform.select({ ios: "Menlo", android: "monospace", default: "monospace" }), letterSpacing: 0.5 },
  h1: { color: COLORS.cream, fontSize: 30, fontWeight: "700", letterSpacing: -0.3, marginTop: 4, fontFamily: FONTS.display },
  iconBtn: { padding: 8, borderRadius: 20, backgroundColor: COLORS.card, borderWidth: 0.75, borderColor: COLORS.border },
  privacyCard: { backgroundColor: COLORS.card, borderColor: COLORS.border, borderWidth: 1, borderRadius: RADIUS.lg, padding: 16, gap: 6 },
  privacyTitle: { color: COLORS.text, fontWeight: "700", fontSize: 14 },
  privacyBody: { color: COLORS.textMuted, fontSize: 12, lineHeight: 17 },
  privacyBtn: { alignSelf: "flex-start", marginTop: 8, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999, backgroundColor: COLORS.primary },
  privacyBtnText: { color: COLORS.creamLight, fontWeight: "700", fontSize: 13 },
  nudgeCard: { backgroundColor: "rgba(232,168,87,0.25)", borderColor: COLORS.warm, borderWidth: 0.75, borderRadius: RADIUS.lg, padding: 14 },
  nudgeTitle: { color: COLORS.cream, fontWeight: "700", fontSize: 14 },
  nudgeSub: { color: COLORS.textMuted, fontSize: 12, marginTop: 4 },
  alarmCard: {
    backgroundColor: COLORS.card,
    borderColor: COLORS.border,
    borderWidth: 0.75,
    borderRadius: RADIUS.lg,
    padding: 20,
    paddingTop: 22,
    position: "relative",
    overflow: "hidden",
  },
  accent: { position: "absolute", top: 0, left: 0, right: 0, height: 2, backgroundColor: COLORS.warmDeep },
  alarmRowTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  alarmLabel: { color: COLORS.textMuted, fontSize: 10, letterSpacing: 1.5, fontWeight: "700" },
  alarmTime: { color: COLORS.cream, fontSize: 56, fontWeight: "700", letterSpacing: -1, marginTop: 8, fontVariant: ["tabular-nums"], fontFamily: FONTS.display },
  alarmTags: { color: COLORS.textMuted, fontSize: 13, marginTop: 6 },
  tagRow: { flexDirection: "row", gap: 8, marginTop: 12 },
  tag: { borderRadius: 999, backgroundColor: "rgba(196,113,74,0.2)", paddingHorizontal: 10, paddingVertical: 5, borderWidth: 1, borderColor: "rgba(196,113,74,0.5)" },
  tagText: { color: COLORS.sienna, fontSize: 11, fontWeight: "700", letterSpacing: 0.3 },
  alarmCardSecondary: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.card,
    borderColor: COLORS.border,
    borderWidth: 0.75,
    borderRadius: RADIUS.lg,
    padding: 16,
  },
  secondaryTime: { color: COLORS.cream, fontSize: 26, fontWeight: "700", fontVariant: ["tabular-nums"], fontFamily: FONTS.display },
  secondaryMeta: { color: COLORS.textMuted, fontSize: 12, marginTop: 2 },
  medCard: { backgroundColor: COLORS.card, borderColor: COLORS.border, borderWidth: 0.75, borderRadius: RADIUS.lg, padding: 18, gap: 10 },
  medHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  medTitle: { color: COLORS.cream, fontSize: 18, fontWeight: "700", fontFamily: FONTS.display },
  medCount: { color: COLORS.textMuted, fontSize: 12, fontWeight: "700" },
  progressTrack: { height: 6, borderRadius: 3, backgroundColor: COLORS.borderLight, overflow: "hidden" },
  progressFill: { height: "100%", backgroundColor: COLORS.warmDeep, borderTopRightRadius: 3, borderBottomRightRadius: 3 },
  medSummary: { color: COLORS.textMuted, fontSize: 13 },
  streakText: { color: COLORS.warmDeep, fontWeight: "800", fontSize: 13, letterSpacing: 0.3 },
  weekRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 4 },
  weekDot: { width: 30, height: 30, borderRadius: 15, borderWidth: 1, borderColor: COLORS.border, alignItems: "center", justifyContent: "center" },
  weekDotToday: { borderColor: COLORS.warmDeep, shadowColor: COLORS.warmDeep, shadowOpacity: 0.6, shadowRadius: 6 },
  weekLbl: { color: COLORS.textMuted, fontSize: 10, fontWeight: "700" },
  testAlarmBtn: { paddingVertical: 12, borderRadius: RADIUS.md, borderWidth: 1, borderStyle: "dashed", borderColor: COLORS.warmDeep, backgroundColor: "transparent", alignItems: "center" },
  testAlarmTxt: { color: COLORS.warmDeep, fontWeight: "700", fontSize: 13 },
  testAlarmSub: { color: COLORS.textMuted, fontSize: 10, textAlign: "center", opacity: 0.6 },
  toast: { position: "absolute", top: 60, left: 20, right: 20, zIndex: 50, backgroundColor: COLORS.primary, borderRadius: 999, paddingVertical: 12, alignItems: "center" },
  toastText: { color: COLORS.creamLight, fontWeight: "700", fontSize: 14, letterSpacing: 0.5 },
  snoozeBanner: { position: "absolute", top: 10, left: 20, right: 20, zIndex: 50, backgroundColor: COLORS.primary, borderRadius: 999, paddingVertical: 10, alignItems: "center" },
  snoozeBannerText: { color: COLORS.creamLight, fontWeight: "700", fontSize: 13, letterSpacing: 0.3, fontVariant: ["tabular-nums"] },
  adBanner: { marginTop: 8, borderStyle: "dashed", borderWidth: 0.5, borderColor: COLORS.warmDeep, backgroundColor: COLORS.borderLight, borderRadius: RADIUS.md, padding: 12, flexDirection: "row", alignItems: "center", gap: 8 },
  adTag: { color: COLORS.textMuted, fontSize: 10, fontWeight: "800", letterSpacing: 1, borderWidth: 0.5, borderColor: COLORS.warmDeep, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  adText: { color: COLORS.textMuted, fontSize: 12, flex: 1 },
});
