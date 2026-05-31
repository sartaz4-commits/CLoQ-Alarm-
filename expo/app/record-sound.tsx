import React, { useEffect, useRef, useState } from "react";
import { Alert, Animated, Easing, Linking, Platform, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { AudioModule, createAudioPlayer, useAudioRecorder, RecordingPresets, type AudioPlayer } from "expo-audio";
import * as Haptics from "expo-haptics";
import { Mic, Pause, Play, Save, Square, Trash2, X } from "lucide-react-native";
import { COLORS, FONTS, RADIUS } from "@/constants/theme";
import GrainBackground from "@/components/GrainBackground";
import { useApp } from "@/providers/AppProvider";

export default function RecordSound() {
  const router = useRouter();
  const { addRecording } = useApp();
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [elapsed, setElapsed] = useState<number>(0);
  const [savedUri, setSavedUri] = useState<string | null>(null);
  const [name, setName] = useState<string>("");
  const [playing, setPlaying] = useState<boolean>(false);
  const playerRef = useRef<AudioPlayer | null>(null);
  const wavePhase = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(wavePhase, { toValue: 1, duration: 900, easing: Easing.linear, useNativeDriver: true })
    ).start();
  }, [wavePhase]);

  useEffect(() => {
    let t: ReturnType<typeof setInterval> | null = null;
    if (isRecording) {
      const start = Date.now();
      t = setInterval(() => setElapsed(Date.now() - start), 100);
    }
    return () => { if (t) clearInterval(t); };
  }, [isRecording]);

  const startRecording = async () => {
    try {
      const perm = await AudioModule.requestRecordingPermissionsAsync();
      if (!perm.granted) {
        Alert.alert(
          "Microphone needed",
          "Microphone permission is required to record custom alarm sounds. Please enable it in Settings.",
          [
            { text: "Cancel", style: "cancel" },
            { text: "Open Settings", onPress: () => {
              try {
                if (typeof Linking.openSettings === "function") {
                  Linking.openSettings().catch(() => {});
                } else {
                  Linking.openURL("app-settings:").catch(() => {});
                }
              } catch {}
            } },
          ],
        );
        return;
      }
      await recorder.prepareToRecordAsync();
      recorder.record();
      setIsRecording(true);
      setElapsed(0);
      if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch {
      Alert.alert("Recording unavailable", "Couldn't start recording on this device.");
    }
  };

  const stopRecording = async () => {
    try {
      await recorder.stop();
      const uri = recorder.uri;
      setSavedUri(uri);
      setIsRecording(false);
      if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      setIsRecording(false);
    }
  };

  const playPreview = async () => {
    if (!savedUri) return;
    try {
      if (playerRef.current) {
        playerRef.current.pause();
        playerRef.current.remove();
        playerRef.current = null;
        setPlaying(false);
        return;
      }
      const p = createAudioPlayer({ uri: savedUri });
      playerRef.current = p;
      p.volume = 1;
      p.play();
      setPlaying(true);
    } catch {
    }
  };

  useEffect(() => {
    return () => {
      try {
        playerRef.current?.pause();
        playerRef.current?.remove();
      } catch {}
      playerRef.current = null;
    };
  }, []);

  const save = () => {
    if (!savedUri) return;
    const finalName = name.trim() || `Recording ${new Date().toLocaleDateString()}`;
    addRecording({ name: finalName.slice(0, 30), uri: savedUri, durationMs: elapsed });
    router.back();
  };

  const discard = () => {
    try { playerRef.current?.pause(); playerRef.current?.remove(); } catch {}
    playerRef.current = null;
    setPlaying(false);
    setSavedUri(null);
    setName("");
    setElapsed(0);
  };

  const fmt = (ms: number): string => {
    const total = Math.floor(ms / 1000);
    const m = Math.floor(total / 60);
    const s = total % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <SafeAreaView style={styles.root} edges={["top", "bottom"]}>
      <GrainBackground decor={["cactus"]} />
      <View style={styles.header}>
        <Text style={styles.title}>Record sound</Text>
        <Pressable onPress={() => router.back()} style={styles.closeBtn}>
          <X size={20} color={COLORS.textMuted} />
        </Pressable>
      </View>

      <View style={styles.body}>
        <Text style={styles.timer}>{fmt(elapsed)}</Text>

        <View style={styles.wave}>
          {[...Array(20)].map((_, i) => {
            const h = wavePhase.interpolate({
              inputRange: [0, 1],
              outputRange: [10 + ((i * 7) % 30), 40 + ((i * 13) % 30)],
            });
            return (
              <Animated.View
                key={i}
                style={[
                  styles.waveBar,
                  { height: isRecording ? h : 8, opacity: isRecording ? 1 : 0.3 },
                ]}
              />
            );
          })}
        </View>

        <Pressable
          onPress={isRecording ? stopRecording : startRecording}
          style={[styles.bigBtn, isRecording && styles.bigBtnStop]}
          testID="record-button"
        >
          {isRecording ? (
            <Square size={42} color={COLORS.creamLight} fill={COLORS.creamLight} />
          ) : (
            <Mic size={48} color={COLORS.creamLight} />
          )}
        </Pressable>
        <Text style={styles.hint}>
          {isRecording ? "Recording… tap to stop" : savedUri ? "Recorded. Preview or save below." : "Tap to start recording"}
        </Text>

        {savedUri && (
          <View style={styles.previewArea}>
            <Pressable onPress={playPreview} style={styles.previewBtn} testID="play-preview">
              {playing ? <Pause size={18} color={COLORS.creamLight} /> : <Play size={18} color={COLORS.creamLight} />}
              <Text style={styles.previewText}>{playing ? "Stop" : "Play"}</Text>
            </Pressable>
            <TextInput
              value={name}
              onChangeText={(t) => setName(t.slice(0, 30))}
              placeholder="Name your recording"
              placeholderTextColor={COLORS.textDim}
              style={styles.nameInput}
              maxLength={30}
            />
            <Pressable onPress={save} style={styles.saveBtn} testID="save-recording">
              <Save size={16} color={COLORS.creamLight} />
              <Text style={styles.saveText}>Save</Text>
            </Pressable>
            <Pressable onPress={discard} style={styles.discardBtn} testID="discard-recording">
              <Trash2 size={14} color={COLORS.sienna} />
              <Text style={styles.discardText}>Discard recording</Text>
            </Pressable>
          </View>
        )}

        <Text style={styles.privacy}>Recordings are stored only on your device. Nothing uploaded.</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 20 },
  title: { color: COLORS.cream, fontSize: 22, fontWeight: "800", fontFamily: FONTS.display },
  closeBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: COLORS.card, alignItems: "center", justifyContent: "center" },
  body: { flex: 1, alignItems: "center", paddingHorizontal: 24, gap: 16 },
  timer: { color: COLORS.cream, fontSize: 44, fontWeight: "700", fontVariant: ["tabular-nums"], fontFamily: FONTS.display, marginTop: 12 },
  wave: { flexDirection: "row", alignItems: "center", gap: 4, height: 60 },
  waveBar: { width: 4, borderRadius: 2, backgroundColor: COLORS.warmDeep },
  bigBtn: { width: 140, height: 140, borderRadius: 70, backgroundColor: COLORS.primary, alignItems: "center", justifyContent: "center", shadowColor: COLORS.sienna, shadowOpacity: 0.4, shadowRadius: 20 },
  bigBtnStop: { backgroundColor: COLORS.sienna },
  hint: { color: COLORS.textMuted, fontSize: 13, textAlign: "center" },
  previewArea: { width: "100%", gap: 10 },
  previewBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, backgroundColor: COLORS.warmDeep, paddingVertical: 12, borderRadius: 999 },
  previewText: { color: COLORS.creamLight, fontWeight: "800", fontSize: 13 },
  nameInput: { backgroundColor: COLORS.card, borderColor: COLORS.border, borderWidth: 0.75, borderRadius: RADIUS.md, padding: 14, color: COLORS.text, fontSize: 15 },
  saveBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, backgroundColor: COLORS.primary, paddingVertical: 14, borderRadius: 999 },
  saveText: { color: COLORS.creamLight, fontWeight: "800", fontSize: 14 },
  discardBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 10, borderRadius: 999, borderWidth: 1, borderColor: COLORS.sienna },
  discardText: { color: COLORS.sienna, fontWeight: "700", fontSize: 12 },
  privacy: { color: COLORS.textDim, fontSize: 11, textAlign: "center", marginTop: "auto", marginBottom: 12, fontStyle: "italic" },
});
