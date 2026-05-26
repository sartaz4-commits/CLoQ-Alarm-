import React, { useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Easing,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { Bell, Bolt, Brain, Check, ChevronRight, Zap } from "lucide-react-native";
import { COLORS, FONTS, RADIUS } from "@/constants/theme";
import GrainBackground from "@/components/GrainBackground";
import { useApp } from "@/providers/AppProvider";
import { Day, QuizCategory } from "@/types";
import CloQMark from "@/components/CloQMark";
import TimePicker from "@/components/TimePicker";
import DayToggle from "@/components/DayToggle";

const { width } = Dimensions.get("window");

const CATEGORIES: { id: QuizCategory; label: string }[] = [
  { id: "Science", label: "Science" },
  { id: "History", label: "History" },
  { id: "Puzzles", label: "Puzzles" },
  { id: "Mixed", label: "Mixed" },
];

export default function Onboarding() {
  const router = useRouter();
  const { completeOnboarding } = useApp();
  const [step, setStep] = useState<number>(0);
  const [cats, setCats] = useState<QuizCategory[]>(["Mixed"]);
  const [mode, setMode] = useState<"challenge" | "loud">("challenge");
  const [hour, setHour] = useState<number>(7);
  const [minute, setMinute] = useState<number>(30);
  const [days, setDays] = useState<Day[]>([0, 1, 2, 3, 4]);
  const [permGranted, setPermGranted] = useState<{ notif: boolean; alarm: boolean }>({ notif: false, alarm: false });

  const haptic = async () => {
    if (Platform.OS !== "web") await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const next = async () => {
    await haptic();
    if (step < 4) setStep((s) => s + 1);
    else finish();
  };

  const finish = () => {
    completeOnboarding({
      categories: cats,
      mode,
      firstAlarm: {
        hour,
        minute,
        days,
        mode,
        categories: cats,
      },
    });
    router.replace("/(tabs)");
  };

  const toggleCat = (c: QuizCategory) => {
    setCats((prev) => (prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]));
  };

  return (
    <SafeAreaView style={styles.root} edges={["top", "bottom"]}>
      <GrainBackground />
      <View style={styles.progressRow}>
        {[0, 1, 2, 3, 4].map((i) => (
          <View key={i} style={[styles.dot, i <= step && styles.dotActive]} />
        ))}
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {step === 0 && <Slide1 />}
        {step === 1 && (
          <Slide2 cats={cats} toggle={toggleCat} />
        )}
        {step === 2 && <Slide3 mode={mode} setMode={setMode} />}
        {step === 3 && (
          <Slide4 hour={hour} minute={minute} setTime={(h, m) => { setHour(h); setMinute(m); }} days={days} setDays={setDays} />
        )}
        {step === 4 && (
          <Slide5
            granted={permGranted}
            grant={(k) => setPermGranted((p) => ({ ...p, [k]: true }))}
          />
        )}
      </ScrollView>

      <View style={styles.footer}>
        <Pressable onPress={next} style={({ pressed }) => [styles.cta, pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] }]}>
          <Text style={styles.ctaText}>
            {step === 0 ? "Let’s go" : step === 4 ? "Done — let’s go" : "Next"}
          </Text>
          <ChevronRight size={20} color={COLORS.creamLight} />
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

function Slide1() {
  const anim = useRef(new Animated.Value(0)).current;
  React.useEffect(() => {
    Animated.timing(anim, { toValue: 1, duration: 700, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
  }, [anim]);
  return (
    <Animated.View style={{ alignItems: "center", opacity: anim, transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [16, 0] }) }] }}>
      <View style={{ marginTop: 32 }}>
        <CloQMark size={140} />
      </View>
      <Text style={styles.bigName}>CloQ</Text>
      <Text style={styles.tagline}>The alarm that earns its dismiss.</Text>
    </Animated.View>
  );
}

function Slide2({ cats, toggle }: { cats: QuizCategory[]; toggle: (c: QuizCategory) => void }) {
  return (
    <View>
      <Text style={styles.title}>Wake up smarter</Text>
      <Text style={styles.subtitle}>Pick your morning question style</Text>
      <View style={styles.grid2}>
        {CATEGORIES.map((c) => {
          const on = cats.includes(c.id);
          return (
            <Pressable key={c.id} onPress={() => toggle(c.id)} style={[styles.tile, on && styles.tileOn]}>
              <Text style={styles.tileLabel}>{c.label}</Text>
              {on && (
                <View style={styles.checkBadge}>
                  <Check size={14} color={COLORS.creamLight} />
                </View>
              )}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function Slide3({ mode, setMode }: { mode: "challenge" | "loud"; setMode: (m: "challenge" | "loud") => void }) {
  return (
    <View>
      <Text style={styles.title}>How do you want to wake up?</Text>
      <View style={[styles.grid2, { marginTop: 24 }]}>
        <Pressable onPress={() => setMode("challenge")} style={[styles.modeTile, mode === "challenge" && styles.modeTileOn]}>
          <Brain size={32} color={mode === "challenge" ? COLORS.warmDeep : COLORS.textMuted} />
          <Text style={styles.modeLabel}>Challenge{"\n"}Mode</Text>
          <Text style={styles.modeSub}>Tap puzzle + question</Text>
        </Pressable>
        <Pressable onPress={() => setMode("loud")} style={[styles.modeTile, mode === "loud" && styles.modeTileOn]}>
          <Zap size={32} color={mode === "loud" ? COLORS.warmDeep : COLORS.textMuted} />
          <Text style={styles.modeLabel}>Loud{"\n"}Mode</Text>
          <Text style={styles.modeSub}>Just make it stop</Text>
        </Pressable>
      </View>
    </View>
  );
}

function Slide4({ hour, minute, setTime, days, setDays }: { hour: number; minute: number; setTime: (h: number, m: number) => void; days: Day[]; setDays: (d: Day[]) => void }) {
  return (
    <View>
      <Text style={styles.title}>Set up your first alarm</Text>
      <View style={{ marginTop: 16 }}>
        <TimePicker hour={hour} minute={minute} onChange={setTime} />
      </View>
      <Text style={[styles.subtitle, { marginTop: 24, marginBottom: 12 }]}>Repeat</Text>
      <DayToggle days={days} onChange={setDays} />
    </View>
  );
}

function Slide5({ granted, grant }: { granted: { notif: boolean; alarm: boolean }; grant: (k: "notif" | "alarm") => void }) {
  const isAndroid = Platform.OS === "android";
  return (
    <View>
      <Text style={styles.title}>Almost there</Text>
      <Text style={styles.subtitle}>Permissions help CloQ wake you reliably.</Text>
      <View style={{ marginTop: 20, gap: 12 }}>
        <PermRow
          icon={<Bell size={22} color={COLORS.warmDeep} />}
          title="Notifications"
          sub="So we can wake you up"
          granted={granted.notif}
          onGrant={() => grant("notif")}
        />
        {isAndroid && (
          <PermRow
            icon={<Bolt size={22} color={COLORS.warmDeep} />}
            title="Alarm permission"
            sub="To fire even on silent"
            granted={granted.alarm}
            onGrant={() => grant("alarm")}
          />
        )}
      </View>
      <Text style={styles.timeSensitiveNote}>
        For the best experience make sure CloQ has Time Sensitive notification permission enabled in your iPhone Settings.
      </Text>
    </View>
  );
}

function PermRow({ icon, title, sub, granted, onGrant }: { icon: React.ReactNode; title: string; sub: string; granted: boolean; onGrant: () => void }) {
  return (
    <View style={styles.permRow}>
      <View style={styles.permIcon}>{icon}</View>
      <View style={{ flex: 1 }}>
        <Text style={styles.permTitle}>{title}</Text>
        <Text style={styles.permSub}>{sub}</Text>
      </View>
      <Pressable onPress={onGrant} style={[styles.permBtn, granted && styles.permBtnOn]}>
        <Text style={[styles.permBtnText, granted && { color: COLORS.success }]}>{granted ? "Granted" : "Allow"}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg },
  progressRow: { flexDirection: "row", gap: 6, paddingHorizontal: 24, paddingTop: 12 },
  dot: { flex: 1, height: 4, borderRadius: 2, backgroundColor: COLORS.borderLight },
  dotActive: { backgroundColor: COLORS.warmDeep },
  content: { padding: 24, paddingTop: 28, paddingBottom: 32, flexGrow: 1 },
  bigName: { color: COLORS.cream, fontSize: 56, fontWeight: "700", letterSpacing: -1, marginTop: 28, fontFamily: FONTS.display },
  tagline: { color: COLORS.textMuted, fontSize: 14, marginTop: 8, fontStyle: "italic" },
  title: { color: COLORS.cream, fontSize: 30, fontWeight: "700", letterSpacing: -0.3, fontFamily: FONTS.display },
  subtitle: { color: COLORS.textMuted, fontSize: 15, marginTop: 8 },
  grid2: { flexDirection: "row", flexWrap: "wrap", gap: 12, marginTop: 24 },
  tile: {
    width: (width - 24 * 2 - 12) / 2,
    backgroundColor: COLORS.card,
    borderColor: COLORS.border,
    borderWidth: 0.75,
    borderRadius: RADIUS.lg,
    padding: 20,
    minHeight: 110,
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    position: "relative",
  },
  tileOn: { borderColor: COLORS.warmDeep, backgroundColor: "rgba(196,113,74,0.15)" },
  tileLabel: { color: COLORS.text, fontSize: 16, fontWeight: "700" },
  checkBadge: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: COLORS.warmDeep,
    alignItems: "center",
    justifyContent: "center",
  },
  modeTile: {
    width: (width - 24 * 2 - 12) / 2,
    backgroundColor: COLORS.card,
    borderColor: COLORS.border,
    borderWidth: 1,
    borderRadius: RADIUS.lg,
    padding: 20,
    minHeight: 170,
    gap: 12,
  },
  modeTileOn: { borderColor: COLORS.warmDeep, backgroundColor: "rgba(196,113,74,0.15)" },
  modeLabel: { color: COLORS.text, fontSize: 18, fontWeight: "700", lineHeight: 22 },
  modeSub: { color: COLORS.textMuted, fontSize: 13 },
  permRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.card,
    borderColor: COLORS.border,
    borderWidth: 0.75,
    borderRadius: RADIUS.lg,
    padding: 16,
    gap: 12,
  },
  permIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: COLORS.borderLight, alignItems: "center", justifyContent: "center" },
  permTitle: { color: COLORS.text, fontWeight: "700", fontSize: 15 },
  permSub: { color: COLORS.textMuted, fontSize: 12, marginTop: 2 },
  permBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999, backgroundColor: COLORS.primary },
  permBtnOn: { backgroundColor: "rgba(74,139,92,0.18)", borderWidth: 1, borderColor: COLORS.success },
  permBtnText: { color: COLORS.creamLight, fontSize: 13, fontWeight: "700" },
  timeSensitiveNote: { color: COLORS.textMuted, fontSize: 12, lineHeight: 18, marginTop: 16, fontStyle: "italic", textAlign: "center" },
  footer: { padding: 24, paddingTop: 0 },
  cta: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: COLORS.primary,
    paddingVertical: 16,
    borderRadius: RADIUS.pill,
  },
  ctaText: { color: COLORS.creamLight, fontWeight: "700", fontSize: 16 },
});
