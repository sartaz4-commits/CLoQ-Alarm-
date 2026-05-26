import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { COLORS } from "@/constants/theme";
import { DAY_LABELS } from "@/utils/time";
import { Day } from "@/types";

interface Props {
  days: Day[];
  onChange: (days: Day[]) => void;
}

export default function DayToggle({ days, onChange }: Props) {
  const toggle = (d: Day) => {
    onChange(days.includes(d) ? days.filter((x) => x !== d) : [...days, d].sort());
  };
  return (
    <View style={styles.row}>
      {DAY_LABELS.map((lbl, i) => {
        const d = i as Day;
        const on = days.includes(d);
        return (
          <Pressable
            key={`day-${i}`}
            onPress={() => toggle(d)}
            style={[styles.chip, on && styles.chipOn]}
            testID={`day-${i}`}
          >
            <Text style={[styles.txt, on && styles.txtOn]}>{lbl}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", gap: 8, justifyContent: "space-between" },
  chip: {
    flex: 1,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: COLORS.warmDeep,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.card,
  },
  chipOn: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  txt: { color: COLORS.warmDeep, fontWeight: "600", fontSize: 13 },
  txtOn: { color: COLORS.creamLight },
});
