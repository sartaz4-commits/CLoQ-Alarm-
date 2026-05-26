import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Easing,
  GestureResponderEvent,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Svg, { Circle as SvgCircle, Polyline } from "react-native-svg";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { COLORS, FONTS, RADIUS } from "@/constants/theme";
import GrainBackground from "@/components/GrainBackground";
import { useApp } from "@/providers/AppProvider";
import { pickQuestion } from "@/constants/questions";
import { Question } from "@/types";
import { startAlarmAudio, type AlarmHandle } from "@/utils/alarmSound";
import { soundSource } from "@/constants/sounds";

const { width, height } = Dimensions.get("window");

export default function AlarmFiring() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string }>();
  const { alarms, settings, startSnooze, recordings, recentQuestions, recordQuestionShown } = useApp();
  const alarm = alarms.find((a) => a.id === params.id) ?? alarms[0];
  const mode = alarm?.mode ?? settings.defaultMode;
  const alarmId = alarm?.id ?? "";

  // Audio: start when this screen mounts, stop when it unmounts.
  const audioRef = useRef<AlarmHandle | null>(null);
  useEffect(() => {
    const recId = alarm?.sound?.type === "recording" ? alarm.sound.recordingId : undefined;
    const recUri = recId ? recordings.find((r) => r.id === recId)?.uri : undefined;
    const builtInId = alarm?.sound?.type === "builtIn" ? alarm.sound.builtInId : undefined;
    const builtInSource = builtInId ? soundSource(builtInId) : undefined;
    audioRef.current = startAlarmAudio({ recordingUri: recUri, builtInSource, loud: mode === "loud" });
    return () => {
      audioRef.current?.stop();
      audioRef.current = null;
    };
  }, []);

  const stopAudio = () => {
    audioRef.current?.stop();
    audioRef.current = null;
  };

  const onSnooze = (minutes: number, adUsed: boolean) => {
    stopAudio();
    startSnooze(alarmId, minutes, adUsed);
    router.replace("/(tabs)");
  };

  if (!alarm) {
    return (
      <View style={styles.root}>
        <Text style={{ color: "#fff" }}>No alarm</Text>
        <Pressable onPress={() => router.back()}><Text style={{ color: COLORS.primary }}>Close</Text></Pressable>
      </View>
    );
  }

  if (mode === "loud") {
    return (
      <LoudMode
        onStop={() => {
          stopAudio();
          router.replace({ pathname: "/alarm-dismissed", params: { fact: "" } });
        }}
        onSnooze={onSnooze}
      />
    );
  }
  return (
    <ChallengeMode
      alarmCategories={alarm.categories.length > 0 ? alarm.categories : ["Mixed"]}
      recentQuestions={recentQuestions}
      onPickedQuestion={recordQuestionShown}
      onDone={(fact) => {
        stopAudio();
        router.replace({ pathname: "/alarm-dismissed", params: { fact } });
      }}
      onSnooze={onSnooze}
    />
  );
}

const LOUD_BG = COLORS.loudBg;
const LOUD_TEXT = COLORS.creamLight;

function LoudMode({ onStop, onSnooze }: { onStop: () => void; onSnooze: (minutes: number, adUsed: boolean) => void }) {
  const pulse = useRef(new Animated.Value(0)).current;
  const [clock, setClock] = useState(() => new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
  const [snoozeOpen, setSnoozeOpen] = useState<boolean>(false);

  useEffect(() => {
    const t = setInterval(() => setClock(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })), 1000);
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 600, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 600, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      ])
    ).start();

    let count = 0;
    const haptic = setInterval(() => {
      if (Platform.OS !== "web") {
        Haptics.impactAsync(count < 10 ? Haptics.ImpactFeedbackStyle.Medium : Haptics.ImpactFeedbackStyle.Heavy);
      }
      count++;
    }, 700);
    return () => { clearInterval(t); clearInterval(haptic); };
  }, [pulse]);

  const scale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.04] });
  const opacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.5, 0.15] });

  return (
    <View style={[styles.root, { backgroundColor: LOUD_BG }]}>
      <Animated.View style={[styles.redGlow, { opacity }]} />
      <Animated.Text style={[styles.megaTime, { color: LOUD_TEXT, transform: [{ scale }] }]}>{clock}</Animated.Text>
      <Text style={[styles.loudHint, { color: LOUD_TEXT }]}>Alarm</Text>
      <Pressable onPress={async () => {
        if (Platform.OS !== "web") await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        onStop();
      }} style={({ pressed }) => [styles.stopBtn, pressed && { transform: [{ scale: 0.97 }] }]}>
        <Text style={styles.stopBtnText}>STOP ALARM</Text>
      </Pressable>
      <Pressable onPress={() => setSnoozeOpen(true)} style={styles.snoozeLink} testID="loud-snooze-link">
        <Text style={[styles.snoozeLinkText, { color: LOUD_TEXT }]}>Need more time? Snooze for free →</Text>
      </Pressable>
      <SnoozeSheet visible={snoozeOpen} onClose={() => setSnoozeOpen(false)} onSnooze={onSnooze} />
    </View>
  );
}

interface Circle { id: number; x: number; y: number; status: "idle" | "correct" | "wrong" }

function ChallengeMode({ alarmCategories, recentQuestions, onPickedQuestion, onDone, onSnooze }: { alarmCategories: import("@/types").QuizCategory[]; recentQuestions: string[]; onPickedQuestion: (q: string) => void; onDone: (fact: string) => void; onSnooze: (minutes: number, adUsed: boolean) => void }) {
  const [stage, setStage] = useState<"puzzle" | "quiz">("puzzle");
  const [useFallback, setUseFallback] = useState<boolean>(false);
  const [order, setOrder] = useState<number>(0);
  const [attempts, setAttempts] = useState<number>(0);
  const [showHint, setShowHint] = useState<boolean>(true);
  const [circles, setCircles] = useState<Circle[]>([]);
  const [clock, setClock] = useState<string>(() => new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
  const question = useMemo<Question>(() => pickQuestion(alarmCategories, recentQuestions), [alarmCategories, recentQuestions]);
  const [feedback, setFeedback] = useState<number | null>(null);
  const [snoozeOpen, setSnoozeOpen] = useState<boolean>(false);

  useEffect(() => {
    onPickedQuestion(question.question);
  }, [question, onPickedQuestion]);

  useEffect(() => {
    const t = setInterval(() => setClock(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })), 1000);
    return () => clearInterval(t);
  }, []);

  const reposition = () => {
    const padX = 50;
    const padY = 180;
    const usableW = width - padX * 2;
    const usableH = height * 0.55;
    const points: { x: number; y: number }[] = [];
    let tries = 0;
    while (points.length < 3 && tries < 200) {
      const x = padX + Math.random() * usableW;
      const y = padY + Math.random() * usableH;
      if (points.every((p) => Math.hypot(p.x - x, p.y - y) > 110)) {
        points.push({ x, y });
      }
      tries++;
    }
    while (points.length < 3) points.push({ x: padX + Math.random() * usableW, y: padY + Math.random() * usableH });
    setCircles([
      { id: 1, x: points[0].x, y: points[0].y, status: "idle" },
      { id: 2, x: points[1].x, y: points[1].y, status: "idle" },
      { id: 3, x: points[2].x, y: points[2].y, status: "idle" },
    ]);
  };

  useEffect(() => { reposition(); }, []);

  const tap = async (n: number) => {
    if (showHint) setShowHint(false);
    if (n === order + 1) {
      if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setCircles((prev) => prev.map((c) => (c.id === n ? { ...c, status: "correct" } : c)));
      if (n === 3) {
        if (Platform.OS !== "web") await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setTimeout(() => setStage("quiz"), 400);
      } else {
        setOrder(n);
      }
    } else {
      if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setCircles((prev) => prev.map((c) => (c.id === n ? { ...c, status: "wrong" } : c)));
      setTimeout(() => { setOrder(0); reposition(); }, 250);
    }
  };

  const answer = async (idx: number) => {
    setAttempts((a) => a + 1);
    if (idx === question.correct) {
      if (Platform.OS !== "web") await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setFeedback(idx);
      setTimeout(() => onDone(question.fact), 350);
    } else {
      if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      setFeedback(idx);
      setTimeout(() => setFeedback(null), 350);
    }
  };

  if (stage === "puzzle") {
    if (useFallback) {
      return (
        <View style={[styles.root, { backgroundColor: COLORS.traceBg }]}>
          <GrainLines />
          <Text style={[styles.timeTop, { color: COLORS.traceText }]}>{clock}</Text>
          <Text style={[styles.puzzleTitle, { color: COLORS.traceText }]}>Tap 1, 2, 3 to wake up</Text>
          {circles.map((c) => (
            <PuzzleCircle key={c.id} circle={c} onPress={() => tap(c.id)} />
          ))}
          {showHint && <Text style={[styles.hint, { color: COLORS.traceText, opacity: 0.7 }]}>Tap 1, 2, 3</Text>}
          <Pressable onPress={() => setSnoozeOpen(true)} style={styles.snoozeLinkPuzzle} testID="challenge-snooze-link">
            <Text style={[styles.snoozeLinkText, { color: COLORS.traceText, opacity: 0.75 }]}>Need more time? Snooze for free →</Text>
          </Pressable>
          <SnoozeSheet visible={snoozeOpen} onClose={() => setSnoozeOpen(false)} onSnooze={onSnooze} />
        </View>
      );
    }
    return (
      <View style={[styles.root, { backgroundColor: COLORS.traceBg }]}>
        <GrainLines />
        <Text style={[styles.timeTop, { color: COLORS.traceText }]}>{clock}</Text>
        <Text style={[styles.puzzleTitle, { color: COLORS.traceText }]}>Trace the path to wake up</Text>
        <TracePathPuzzle
          onComplete={async () => {
            if (Platform.OS !== "web") await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            setTimeout(() => setStage("quiz"), 600);
          }}
          onFallback={() => setUseFallback(true)}
        />
        <Pressable onPress={() => setSnoozeOpen(true)} style={styles.snoozeLinkPuzzle} testID="challenge-snooze-link">
          <Text style={[styles.snoozeLinkText, { color: COLORS.traceText, opacity: 0.75 }]}>Need more time? Snooze for free →</Text>
        </Pressable>
        <SnoozeSheet visible={snoozeOpen} onClose={() => setSnoozeOpen(false)} onSnooze={onSnooze} />
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <GrainBackground />
      <View style={styles.purpleGlow} pointerEvents="none" />
      <Text style={styles.timeTop}>{clock}</Text>
      <View style={styles.quizCard}>
        <View style={styles.catBadge}><Text style={styles.catBadgeText}>{question.category}</Text></View>
        <Text style={styles.question}>{question.question}</Text>
        <View style={styles.grid}>
          {question.options.map((opt, i) => {
            const correct = feedback === i && i === question.correct;
            const wrong = feedback === i && i !== question.correct;
            return (
              <Pressable
                key={`opt-${i}`}
                onPress={() => answer(i)}
                style={[
                  styles.opt,
                  correct && styles.optCorrect,
                  wrong && styles.optWrong,
                ]}
              >
                <Text style={styles.optLetter}>{String.fromCharCode(65 + i)}</Text>
                <Text style={styles.optText}>{opt}</Text>
              </Pressable>
            );
          })}
        </View>
        {attempts > 0 && <Text style={styles.attemptText}>{attempts} attempts — you’re nearly there</Text>}
      </View>
      <Pressable onPress={() => setSnoozeOpen(true)} style={styles.snoozeLinkQuiz} testID="quiz-snooze-link">
        <Text style={styles.snoozeLinkText}>Need more time? Snooze for free →</Text>
      </Pressable>
      <SnoozeSheet visible={snoozeOpen} onClose={() => setSnoozeOpen(false)} onSnooze={onSnooze} />
    </View>
  );
}

function GrainLines() {
  const lines = [];
  for (let i = 0; i < 40; i++) {
    lines.push(<View key={`gl-${i}`} style={[styles.grainLine, { top: i * (height / 40) }]} />);
  }
  return <View pointerEvents="none" style={styles.grainLines}>{lines}</View>;
}

function PuzzleCircle({ circle, onPress }: { circle: Circle; onPress: () => void }) {
  const shake = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (circle.status === "wrong") {
      shake.setValue(0);
      Animated.sequence([
        Animated.timing(shake, { toValue: 1, duration: 60, useNativeDriver: true }),
        Animated.timing(shake, { toValue: -1, duration: 60, useNativeDriver: true }),
        Animated.timing(shake, { toValue: 1, duration: 60, useNativeDriver: true }),
        Animated.timing(shake, { toValue: 0, duration: 60, useNativeDriver: true }),
      ]).start();
    } else if (circle.status === "correct") {
      Animated.sequence([
        Animated.timing(scale, { toValue: 1.25, duration: 140, easing: Easing.out(Easing.back(2)), useNativeDriver: true }),
        Animated.timing(scale, { toValue: 1, duration: 160, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      ]).start();
    }
  }, [circle.status, scale, shake]);

  const tx = shake.interpolate({ inputRange: [-1, 1], outputRange: [-12, 12] });

  const color =
    circle.status === "correct" ? COLORS.success :
    circle.status === "wrong" ? COLORS.sienna :
    COLORS.warmDeep;
  const numberColor =
    circle.status === "correct" || circle.status === "wrong" ? COLORS.creamLight : COLORS.cream;

  return (
    <Animated.View
      style={{
        position: "absolute",
        left: circle.x - 38,
        top: circle.y - 38,
        transform: [{ translateX: tx }, { scale }],
      }}
    >
      <Pressable
        onPress={onPress}
        style={[
          styles.puzzleCircle,
          { borderColor: color },
          circle.status === "correct" && { backgroundColor: COLORS.success },
          circle.status === "wrong" && { backgroundColor: COLORS.sienna },
        ]}
      >
        <Text style={[styles.puzzleNum, { color: numberColor }]}>{circle.id}</Text>
      </Pressable>
    </Animated.View>
  );
}

/**
 * TracePathPuzzle — randomised dotted path the user must trace start → end.
 * Path geometry (segments, direction, length, position) regenerates every time
 * the puzzle mounts so it can never be memorised.
 */
interface PathPoint { x: number; y: number }

function generatePath(): PathPoint[] {
  const numSegments = 2 + Math.floor(Math.random() * 3); // 2..4
  const dirs: { dx: number; dy: number }[] = [
    { dx: 0, dy: -1 }, // up
    { dx: 0, dy: 1 },  // down
    { dx: -1, dy: 0 }, // left
    { dx: 1, dy: 0 },  // right
  ];
  let prev = -1;
  let x = 0, y = 0;
  const pts: PathPoint[] = [{ x, y }];
  for (let i = 0; i < numSegments; i++) {
    let idx = 0;
    let safety = 0;
    do {
      idx = Math.floor(Math.random() * 4);
      safety++;
      if (safety > 30) break;
    } while (prev !== -1 && (idx === prev || (dirs[idx].dx === -dirs[prev].dx && dirs[idx].dy === -dirs[prev].dy)));
    const len = 80 + Math.floor(Math.random() * 81); // 80..160
    x += dirs[idx].dx * len;
    y += dirs[idx].dy * len;
    pts.push({ x, y });
    prev = idx;
  }
  // Center the path within the middle-third box of the screen
  const minX = Math.min(...pts.map((p) => p.x));
  const maxX = Math.max(...pts.map((p) => p.x));
  const minY = Math.min(...pts.map((p) => p.y));
  const maxY = Math.max(...pts.map((p) => p.y));
  const pathW = maxX - minX;
  const pathH = maxY - minY;
  const cx = width / 2 - pathW / 2 - minX;
  const cy = height / 2 - pathH / 2 - minY;
  return pts.map((p) => ({ x: p.x + cx, y: p.y + cy }));
}

function projectOnSegment(px: number, py: number, a: PathPoint, b: PathPoint): { t: number; dist: number } {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const lenSq = dx * dx + dy * dy;
  if (lenSq === 0) return { t: 0, dist: Math.hypot(px - a.x, py - a.y) };
  let t = ((px - a.x) * dx + (py - a.y) * dy) / lenSq;
  if (t < 0) t = 0; else if (t > 1) t = 1;
  const cx = a.x + dx * t;
  const cy = a.y + dy * t;
  return { t, dist: Math.hypot(px - cx, py - cy) };
}

function progressedPolyline(points: PathPoint[], segIdx: number, segT: number): PathPoint[] {
  const res: PathPoint[] = [points[0]];
  for (let i = 0; i < segIdx; i++) res.push(points[i + 1]);
  if (segIdx < points.length - 1) {
    const a = points[segIdx];
    const b = points[segIdx + 1];
    res.push({ x: a.x + (b.x - a.x) * segT, y: a.y + (b.y - a.y) * segT });
  }
  return res;
}

function TracePathPuzzle({ onComplete, onFallback }: { onComplete: () => void; onFallback: () => void }) {
  const [spec] = useState<PathPoint[]>(() => {
    try { return generatePath(); } catch (e) { console.log("[trace] gen error", e); return []; }
  });
  const [segIdx, setSegIdx] = useState<number>(0);
  const [segT, setSegT] = useState<number>(0);
  const [tracing, setTracing] = useState<boolean>(false);
  const [attempts, setAttempts] = useState<number>(0);
  const [completed, setCompleted] = useState<boolean>(false);
  const ripple = useRef(new Animated.Value(0)).current;

  const TOLERANCE = 40;
  const START_RADIUS = 50;
  const END_RADIUS = 50;

  const reset = () => {
    setSegIdx(0);
    setSegT(0);
    setTracing(false);
  };

  const handleStart = (e: GestureResponderEvent) => {
    if (completed || spec.length < 2) return;
    const { locationX, locationY } = e.nativeEvent;
    const start = spec[0];
    if (Math.hypot(locationX - start.x, locationY - start.y) <= START_RADIUS) {
      setTracing(true);
      setSegIdx(0);
      setSegT(0);
      if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const handleMove = (e: GestureResponderEvent) => {
    if (!tracing || completed || spec.length < 2) return;
    const { locationX, locationY } = e.nativeEvent;
    let bestIdx = -1;
    let bestT = 0;
    for (let i = segIdx; i <= Math.min(segIdx + 1, spec.length - 2); i++) {
      const proj = projectOnSegment(locationX, locationY, spec[i], spec[i + 1]);
      if (proj.dist <= TOLERANCE) {
        if (i > segIdx || proj.t >= segT - 0.08) {
          bestIdx = i;
          bestT = i === segIdx ? Math.max(segT, proj.t) : proj.t;
          break;
        }
      }
    }
    if (bestIdx === -1) {
      setAttempts((a) => a + 1);
      if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      reset();
      return;
    }
    setSegIdx(bestIdx);
    setSegT(bestT);
    const end = spec[spec.length - 1];
    if (bestIdx === spec.length - 2 && (bestT >= 0.95 || Math.hypot(locationX - end.x, locationY - end.y) <= END_RADIUS)) {
      setCompleted(true);
      setTracing(false);
      Animated.timing(ripple, { toValue: 1, duration: 600, useNativeDriver: true }).start();
      onComplete();
    }
  };

  const handleEnd = () => {
    if (completed) return;
    if (tracing) {
      setAttempts((a) => a + 1);
      reset();
    }
  };

  if (spec.length < 2) {
    return (
      <View style={styles.traceContainer}>
        <Pressable onPress={onFallback} style={styles.traceFallbackBtn}>
          <Text style={styles.traceFallbackText}>Trouble tracing? Use tap puzzle</Text>
        </Pressable>
      </View>
    );
  }

  const dotsBg: { x: number; y: number; key: string }[] = [];
  for (let i = 0; i < spec.length - 1; i++) {
    const a = spec[i];
    const b = spec[i + 1];
    const segLen = Math.hypot(b.x - a.x, b.y - a.y);
    const steps = Math.max(1, Math.floor(segLen / 20));
    for (let s = 0; s <= steps; s++) {
      const t = s / steps;
      dotsBg.push({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t, key: `bg-${i}-${s}` });
    }
  }

  const progressed = progressedPolyline(spec, segIdx, segT);
  const progressedStr = progressed.map((p) => `${p.x},${p.y}`).join(" ");
  const start = spec[0];
  const end = spec[spec.length - 1];
  const rippleScale = ripple.interpolate({ inputRange: [0, 1], outputRange: [1, 6] });
  const rippleOpacity = ripple.interpolate({ inputRange: [0, 1], outputRange: [0.6, 0] });

  return (
    <View
      style={styles.traceContainer}
      onStartShouldSetResponder={() => true}
      onMoveShouldSetResponder={() => true}
      onResponderGrant={handleStart}
      onResponderMove={handleMove}
      onResponderRelease={handleEnd}
      onResponderTerminate={handleEnd}
    >
      <Svg width={width} height={height} pointerEvents="none">
        {dotsBg.map((d) => (
          <SvgCircle key={d.key} cx={d.x} cy={d.y} r={4} fill="#E8A857" opacity={0.55} />
        ))}
        {progressed.length >= 2 && (
          <Polyline
            points={progressedStr}
            stroke={COLORS.tracePath}
            strokeWidth={10}
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
            opacity={0.9}
          />
        )}
        <SvgCircle cx={start.x} cy={start.y} r={32} fill={COLORS.traceStart} />
        <SvgCircle cx={end.x} cy={end.y} r={32} fill={COLORS.traceEnd} />
      </Svg>
      <View style={[styles.startEndWrap, { left: start.x - 32, top: start.y - 32 }]} pointerEvents="none">
        <Text style={styles.startEndLabel} numberOfLines={1} adjustsFontSizeToFit>START</Text>
      </View>
      <View style={[styles.startEndWrap, { left: end.x - 32, top: end.y - 32 }]} pointerEvents="none">
        <Text style={styles.startEndLabel} numberOfLines={1} adjustsFontSizeToFit>END</Text>
      </View>
      <Text style={styles.traceInstruction} pointerEvents="none">trace the path to wake up</Text>
      <Text style={styles.traceAttempts} pointerEvents="none">{attempts} attempts — trace from start to end</Text>
      <Pressable onPress={onFallback} style={styles.traceFallbackBtn} testID="trace-fallback">
        <Text style={styles.traceFallbackText}>Trouble tracing? Use tap puzzle</Text>
      </Pressable>
      {completed && (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.ripple,
            {
              left: end.x - 30,
              top: end.y - 30,
              width: 60,
              height: 60,
              transform: [{ scale: rippleScale }],
              opacity: rippleOpacity,
              backgroundColor: COLORS.traceEnd,
            },
          ]}
        />
      )}
    </View>
  );
}

/**
 * SnoozeSheet — bottom sheet with two snooze options.
 * Option 1: Watch a rewarded ad → 10 min snooze (free users only).
 * Option 2: Preset snooze — free for everyone.
 */
function SnoozeSheet({ visible, onClose, onSnooze }: { visible: boolean; onClose: () => void; onSnooze: (minutes: number, adUsed: boolean) => void }) {
  const { settings } = useApp();
  const [adUsed, setAdUsed] = useState<boolean>(false);

  const onWatchAd = async () => {
    if (adUsed) return;
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    // Simulated rewarded ad — in production this would call AdMob's rewarded flow.
    setAdUsed(true);
    setTimeout(() => onSnooze(10, true), 250);
  };

  const onPresetSnooze = () => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onSnooze(settings.snoozeMinutes, false);
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={sheetStyles.backdrop} onPress={onClose}>
        <Pressable style={sheetStyles.sheet} onPress={() => {}}>
          <View style={sheetStyles.handle} />
          <Text style={sheetStyles.title}>Need more time?</Text>
          <Text style={sheetStyles.sub}>Snooze your alarm. You’ll still need to finish the puzzle when it returns.</Text>

          {!settings.premium && (
            <Pressable
              onPress={onWatchAd}
              style={[sheetStyles.option, adUsed && { opacity: 0.5 }]}
              disabled={adUsed}
              testID="snooze-watch-ad"
            >
              <View style={{ flex: 1 }}>
                <Text style={sheetStyles.optionTitle}>Watch an ad — snooze for 10 min</Text>
                <Text style={sheetStyles.optionSub}>{adUsed ? "Already used for this alarm" : "One ad-snooze per alarm"}</Text>
              </View>
            </Pressable>
          )}

          <Pressable onPress={onPresetSnooze} style={sheetStyles.option} testID="snooze-preset">
            <View style={{ flex: 1 }}>
              <Text style={sheetStyles.optionTitle}>Snooze for {settings.snoozeMinutes} min</Text>
              <Text style={sheetStyles.optionSub}>Your preset snooze time</Text>
            </View>
          </Pressable>

          <Pressable onPress={onClose} style={sheetStyles.cancelBtn} testID="snooze-cancel">
            <Text style={sheetStyles.cancelText}>Cancel — back to alarm</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg, justifyContent: "center", alignItems: "center" },
  purpleGlow: {
    position: "absolute",
    top: -120,
    width: 500,
    height: 500,
    borderRadius: 250,
    backgroundColor: COLORS.warmDeep,
    opacity: 0.18,
  },
  redGlow: {
    position: "absolute",
    width: 600,
    height: 600,
    borderRadius: 300,
    backgroundColor: "#5C1A0E",
    opacity: 0.6,
  },
  timeTop: {
    position: "absolute",
    top: 80,
    color: COLORS.cream,
    fontSize: 56,
    fontWeight: "700",
    fontVariant: ["tabular-nums"],
    letterSpacing: -1,
    fontFamily: FONTS.display,
  },
  megaTime: {
    color: COLORS.cream,
    fontSize: 88,
    fontWeight: "700",
    fontVariant: ["tabular-nums"],
    letterSpacing: -3,
    fontFamily: FONTS.display,
  },
  loudHint: {
    color: COLORS.creamLight,
    fontWeight: "800",
    letterSpacing: 4,
    marginTop: 8,
    marginBottom: 40,
  },
  stopBtn: {
    backgroundColor: COLORS.primary,
    paddingVertical: 22,
    paddingHorizontal: 60,
    borderRadius: 999,
    marginTop: 12,
  },
  stopBtnText: { color: COLORS.creamLight, fontWeight: "900", fontSize: 18, letterSpacing: 1 },
  puzzleTitle: {
    position: "absolute",
    top: 180,
    color: COLORS.cream,
    fontSize: 22,
    fontWeight: "700",
    textAlign: "center",
    paddingHorizontal: 40,
    fontFamily: FONTS.display,
  },
  puzzleCircle: {
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 3,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.card,
  },
  puzzleNum: { fontSize: 28, fontWeight: "800" },
  hint: {
    position: "absolute",
    bottom: 120,
    color: COLORS.textMuted,
    fontSize: 14,
    fontStyle: "italic",
  },
  quizCard: {
    width: width - 32,
    backgroundColor: COLORS.card,
    borderColor: COLORS.border,
    borderWidth: 0.75,
    borderRadius: RADIUS.lg,
    padding: 20,
    gap: 16,
  },
  catBadge: { alignSelf: "flex-start", borderRadius: 999, borderWidth: 1, borderColor: "rgba(196,113,74,0.5)", paddingHorizontal: 10, paddingVertical: 4, backgroundColor: "rgba(196,113,74,0.2)" },
  catBadgeText: { color: COLORS.sienna, fontWeight: "800", fontSize: 11, letterSpacing: 0.5 },
  question: { color: COLORS.cream, fontSize: 22, fontWeight: "700", lineHeight: 28 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  opt: {
    width: (width - 32 - 20 - 10) / 2,
    minHeight: 72,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.warmDeep,
    backgroundColor: COLORS.card,
    padding: 14,
    gap: 4,
    flexDirection: "row",
    alignItems: "center",
  },
  optCorrect: { borderColor: COLORS.success, backgroundColor: COLORS.success },
  optWrong: { borderColor: COLORS.sienna, backgroundColor: COLORS.sienna },
  optLetter: { color: COLORS.warmDeep, fontWeight: "800", fontSize: 14, marginRight: 8 },
  optText: { color: COLORS.cream, fontSize: 14, flexShrink: 1, fontWeight: "600" },
  attemptText: { color: COLORS.textMuted, textAlign: "center", fontSize: 12 },
  snoozeLink: { marginTop: 22, padding: 10 },
  snoozeLinkPuzzle: { position: "absolute", bottom: 60, padding: 10 },
  snoozeLinkQuiz: { marginTop: 18, padding: 10 },
  snoozeLinkText: { color: COLORS.textMuted, fontSize: 13, fontWeight: "600", textDecorationLine: "underline" },
  traceContainer: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0 },
  traceInstruction: { position: "absolute", top: 220, alignSelf: "center", color: COLORS.traceText, fontFamily: FONTS.display, fontSize: 13, opacity: 0.85 },
  traceAttempts: { position: "absolute", bottom: 120, alignSelf: "center", color: COLORS.traceText, fontFamily: FONTS.mono, fontSize: 11, opacity: 0.65 },
  traceFallbackBtn: { position: "absolute", bottom: 96, alignSelf: "center", padding: 6 },
  traceFallbackText: { color: COLORS.traceText, fontSize: 11, textDecorationLine: "underline", fontFamily: FONTS.mono, opacity: 0.65 },
  startEndWrap: { position: "absolute", width: 64, height: 64, alignItems: "center", justifyContent: "center" },
  startEndLabel: { color: COLORS.traceText, fontWeight: "800", fontSize: 12, letterSpacing: 1, textAlign: "center", textAlignVertical: "center", includeFontPadding: false },
  ripple: { position: "absolute", borderRadius: 9999, backgroundColor: COLORS.traceEnd },
  grainLines: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0 },
  grainLine: { position: "absolute", left: 0, right: 0, height: 1, backgroundColor: COLORS.traceText, opacity: 0.04 },
});

const sheetStyles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.45)", justifyContent: "flex-end" },
  sheet: {
    backgroundColor: COLORS.bg,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 22,
    paddingBottom: 36,
    gap: 12,
    borderTopWidth: 0.75,
    borderTopColor: COLORS.border,
  },
  handle: { alignSelf: "center", width: 42, height: 4, borderRadius: 2, backgroundColor: COLORS.borderLight, marginBottom: 6 },
  title: { color: COLORS.cream, fontSize: 22, fontWeight: "700", fontFamily: FONTS.display },
  sub: { color: COLORS.textMuted, fontSize: 13, lineHeight: 18 },
  option: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.lg,
    borderWidth: 0.75,
    borderColor: COLORS.border,
    padding: 16,
  },
  optionTitle: { color: COLORS.text, fontWeight: "700", fontSize: 14 },
  optionSub: { color: COLORS.textMuted, fontSize: 12, marginTop: 2 },
  upgradeCard: {
    backgroundColor: "rgba(196,113,74,0.15)",
    borderRadius: RADIUS.lg,
    borderWidth: 0.75,
    borderColor: COLORS.warmDeep,
    padding: 14,
    gap: 8,
  },
  upgradeTitle: { color: COLORS.cream, fontWeight: "700", fontSize: 14 },
  upgradeBody: { color: COLORS.textMuted, fontSize: 12 },
  upgradeBtn: { alignSelf: "flex-start", backgroundColor: COLORS.primary, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 999 },
  upgradeBtnText: { color: COLORS.creamLight, fontWeight: "800", fontSize: 13 },
  cancelBtn: { alignSelf: "center", paddingVertical: 12, paddingHorizontal: 18, borderRadius: 999, borderWidth: 1, borderColor: COLORS.border, marginTop: 4 },
  cancelText: { color: COLORS.text, fontWeight: "600", fontSize: 13 },
});
