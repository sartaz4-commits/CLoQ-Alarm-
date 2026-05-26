import React, { useCallback, useMemo, useRef, useState } from "react";
import {
  FlatList,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import DateTimePicker, { type DateTimePickerEvent } from "@react-native-community/datetimepicker";
import { COLORS, RADIUS } from "@/constants/theme";

interface TimePickerProps {
  hour: number;
  minute: number;
  onChange: (h: number, m: number) => void;
}

/**
 * Native time picker.
 * - iOS: inline spinner (always visible).
 * - Android: tap-to-open dialog.
 * - Web: scroll-wheel fallback (no native DateTimePicker on web).
 */
export default function TimePicker({ hour, minute, onChange }: TimePickerProps) {
  if (Platform.OS === "web") {
    return <WheelTimePicker hour={hour} minute={minute} onChange={onChange} />;
  }
  if (Platform.OS === "ios") {
    return <IOSPicker hour={hour} minute={minute} onChange={onChange} />;
  }
  return <AndroidPicker hour={hour} minute={minute} onChange={onChange} />;
}

function makeDate(hour: number, minute: number): Date {
  const d = new Date();
  d.setHours(hour, minute, 0, 0);
  return d;
}

function IOSPicker({ hour, minute, onChange }: TimePickerProps) {
  const value = useMemo(() => makeDate(hour, minute), [hour, minute]);
  const handle = useCallback(
    (_e: DateTimePickerEvent, d?: Date) => {
      if (!d) return;
      onChange(d.getHours(), d.getMinutes());
    },
    [onChange],
  );
  return (
    <View style={styles.iosWrap}>
      <DateTimePicker
        value={value}
        mode="time"
        display="spinner"
        onChange={handle}
        textColor={COLORS.cream}
        themeVariant="dark"
        style={styles.iosPicker}
      />
    </View>
  );
}

function AndroidPicker({ hour, minute, onChange }: TimePickerProps) {
  const [open, setOpen] = useState<boolean>(false);
  const value = useMemo(() => makeDate(hour, minute), [hour, minute]);
  const handle = useCallback(
    (_e: DateTimePickerEvent, d?: Date) => {
      setOpen(false);
      if (!d) return;
      onChange(d.getHours(), d.getMinutes());
    },
    [onChange],
  );
  const label = `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
  return (
    <View style={styles.androidWrap}>
      <Pressable onPress={() => setOpen(true)} style={styles.androidBtn} testID="time-picker-android">
        <Text style={styles.androidTime}>{label}</Text>
        <Text style={styles.androidSub}>Tap to change</Text>
      </Pressable>
      {open && (
        <DateTimePicker
          value={value}
          mode="time"
          display="default"
          is24Hour
          onChange={handle}
        />
      )}
    </View>
  );
}

const ITEM_H = 44;

interface WheelProps {
  values: number[];
  value: number;
  onChange: (v: number) => void;
}

function Wheel({ values, value, onChange }: WheelProps) {
  const ref = useRef<FlatList<number>>(null);
  const idx = values.indexOf(value);

  React.useEffect(() => {
    const i = Math.max(0, values.indexOf(value));
    setTimeout(() => {
      ref.current?.scrollToOffset({ offset: i * ITEM_H, animated: false });
    }, 0);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const onMomentumScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const y = e.nativeEvent.contentOffset.y;
    const i = Math.round(y / ITEM_H);
    const next = values[Math.max(0, Math.min(values.length - 1, i))];
    if (next !== value) onChange(next);
  };

  return (
    <View style={styles.wheelWrap}>
      <View pointerEvents="none" style={styles.wheelSelection} />
      <FlatList
        ref={ref}
        data={values}
        keyExtractor={(v) => String(v)}
        renderItem={({ item, index }) => (
          <View style={styles.wheelItem}>
            <Text style={[styles.wheelText, index === idx && styles.wheelTextActive]}>
              {String(item).padStart(2, "0")}
            </Text>
          </View>
        )}
        showsVerticalScrollIndicator={false}
        snapToInterval={ITEM_H}
        decelerationRate="fast"
        contentContainerStyle={{ paddingVertical: ITEM_H * 2 }}
        onMomentumScrollEnd={onMomentumScrollEnd}
        getItemLayout={(_, i) => ({ length: ITEM_H, offset: ITEM_H * i, index: i })}
      />
    </View>
  );
}

function WheelTimePicker({ hour, minute, onChange }: TimePickerProps) {
  const hours = Array.from({ length: 24 }, (_, i) => i);
  const minutes = Array.from({ length: 60 }, (_, i) => i);
  return (
    <View style={styles.wheelContainer}>
      <Wheel values={hours} value={hour} onChange={(h) => onChange(h, minute)} />
      <Text style={styles.colon}>:</Text>
      <Wheel values={minutes} value={minute} onChange={(m) => onChange(hour, m)} />
    </View>
  );
}

const styles = StyleSheet.create({
  iosWrap: { alignItems: "center", justifyContent: "center" },
  iosPicker: { alignSelf: "center", width: 260, height: 180 },
  androidWrap: { alignItems: "center" },
  androidBtn: {
    alignSelf: "stretch",
    paddingVertical: 18,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.card,
    borderWidth: 0.75,
    borderColor: COLORS.border,
    alignItems: "center",
  },
  androidTime: {
    color: COLORS.cream,
    fontSize: 44,
    fontWeight: "700",
    fontVariant: ["tabular-nums"],
    letterSpacing: -1,
  },
  androidSub: { color: COLORS.textMuted, fontSize: 11, marginTop: 4, fontWeight: "700", letterSpacing: 0.5 },
  wheelContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: ITEM_H * 5,
    gap: 12,
  },
  wheelWrap: { width: 96, height: ITEM_H * 5, overflow: "hidden" },
  wheelSelection: {
    position: "absolute",
    top: ITEM_H * 2,
    left: 0,
    right: 0,
    height: ITEM_H,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: COLORS.warmDeep,
    backgroundColor: "rgba(196,113,74,0.12)",
    borderRadius: 8,
  },
  wheelItem: { height: ITEM_H, alignItems: "center", justifyContent: "center" },
  wheelText: {
    fontSize: 28,
    color: COLORS.textMuted,
    fontVariant: ["tabular-nums"],
    fontWeight: "500",
  },
  wheelTextActive: { color: COLORS.cream, fontSize: 36, fontWeight: "700" },
  colon: { color: COLORS.cream, fontSize: 36, fontWeight: "700", marginBottom: 4 },
});
