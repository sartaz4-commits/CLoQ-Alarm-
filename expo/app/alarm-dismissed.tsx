import React, { useEffect, useRef } from "react";
import { Animated, Easing, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Check } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { COLORS, FONTS, RADIUS } from "@/constants/theme";
import GrainBackground from "@/components/GrainBackground";

export default function AlarmDismissed() {
  const router = useRouter();
  const params = useLocalSearchParams<{ fact?: string }>();
  const scale = useRef(new Animated.Value(0)).current;
  const fade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.spring(scale, { toValue: 1, friction: 4, useNativeDriver: true }),
      Animated.timing(fade, { toValue: 1, duration: 500, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
    ]).start();

    if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    const timer = setTimeout(() => router.replace("/(tabs)"), 10000);
    return () => clearTimeout(timer);
  }, [fade, scale, router]);

  return (
    <View style={styles.root}>
      <GrainBackground />
      <Animated.View style={[styles.check, { transform: [{ scale }] }]}>
        <Check size={56} color={COLORS.creamLight} strokeWidth={3.5} />
      </Animated.View>
      <Animated.Text style={[styles.title, { opacity: fade }]}>You’re up!</Animated.Text>
      <Animated.Text style={[styles.sub, { opacity: fade }]}>Good morning. That’s the hard part done.</Animated.Text>

      {params.fact ? (
        <Animated.View style={[styles.factCard, { opacity: fade }]}>
          <Text style={styles.factTitle}>Did you know?</Text>
          <Text style={styles.factText}>{params.fact}</Text>
        </Animated.View>
      ) : null}

      <Pressable onPress={() => router.replace("/(tabs)")} style={({ pressed }) => [styles.cta, pressed && { opacity: 0.9 }]}>
        <Text style={styles.ctaText}>Start my day →</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg, alignItems: "center", justifyContent: "center", padding: 28, gap: 18 },
  check: { width: 110, height: 110, borderRadius: 55, backgroundColor: COLORS.success, alignItems: "center", justifyContent: "center" },
  title: { color: COLORS.cream, fontSize: 38, fontWeight: "700", letterSpacing: -0.5, marginTop: 8, fontFamily: FONTS.display },
  sub: { color: COLORS.textMuted, fontSize: 15, textAlign: "center", maxWidth: 280 },
  factCard: { width: "100%", padding: 18, borderRadius: RADIUS.lg, backgroundColor: COLORS.card, borderColor: COLORS.border, borderWidth: 0.75, marginTop: 16, gap: 6 },
  factTitle: { color: COLORS.warmDeep, fontSize: 11, fontWeight: "800", letterSpacing: 1.5 },
  factText: { color: COLORS.text, fontSize: 14, lineHeight: 20 },
  cta: { marginTop: 8, backgroundColor: COLORS.success, paddingVertical: 16, paddingHorizontal: 36, borderRadius: 999 },
  ctaText: { color: COLORS.creamLight, fontWeight: "800", fontSize: 16 },
});
