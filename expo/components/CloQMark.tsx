import React from "react";
import { StyleSheet, View } from "react-native";
import Svg, { Circle, G, Line, Rect } from "react-native-svg";
import { COLORS } from "@/constants/theme";

interface Props {
  size?: number;
}

/**
 * Full-centred vintage clock face mark matching the app icon — used inside
 * the app (e.g. onboarding splash). No wordmark; the host renders any
 * "CloQ" text separately.
 */
export default function CloQMark({ size = 120 }: Props) {
  return (
    <View style={[styles.box, { width: size, height: size }]}>
      <Svg width={size} height={size} viewBox="0 0 100 100">
        <Rect x={0} y={0} width={100} height={100} fill={COLORS.warmBg} rx={18} />

        {/* concentric clock rings */}
        <Circle cx={50} cy={50} r={44} fill="#5C2415" />
        <Circle cx={50} cy={50} r={38} fill={COLORS.warmDeep} />
        <Circle cx={50} cy={50} r={34} fill="#D4894A" />
        <Circle cx={50} cy={50} r={30} fill={COLORS.warm} />

        {/* major + minor hour markers */}
        {Array.from({ length: 12 }).map((_, i) => {
          const a = (i * Math.PI * 2) / 12 - Math.PI / 2;
          const major = i % 3 === 0;
          const outerR = 28;
          const innerR = major ? 23 : 25;
          const x1 = 50 + Math.cos(a) * outerR;
          const y1 = 50 + Math.sin(a) * outerR;
          const x2 = 50 + Math.cos(a) * innerR;
          const y2 = 50 + Math.sin(a) * innerR;
          return (
            <Line
              key={`tk-${i}`}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke={COLORS.sienna}
              strokeWidth={major ? 2.2 : 1.1}
              strokeLinecap="round"
            />
          );
        })}

        {/* hands — 7:00 */}
        {/* minute hand straight up */}
        <Line x1={50} y1={50} x2={50} y2={26} stroke="#2A1005" strokeWidth={2.4} strokeLinecap="round" />
        {/* hour hand to 7 o'clock (210deg from 12) */}
        <Line
          x1={50}
          y1={50}
          x2={50 + Math.cos((210 * Math.PI) / 180 - Math.PI / 2) * 13}
          y2={50 + Math.sin((210 * Math.PI) / 180 - Math.PI / 2) * 13}
          stroke="#2A1005"
          strokeWidth={3.2}
          strokeLinecap="round"
        />
        <Circle cx={50} cy={50} r={2.8} fill="#2A1005" />
        <Circle cx={50} cy={50} r={0.9} fill={COLORS.warm} />

        {/* faint grain dots */}
        <G opacity={0.12}>
          {Array.from({ length: 22 }).map((_, i) => (
            <Circle
              key={`gd-${i}`}
              cx={(i * 17) % 100}
              cy={(i * 29) % 100}
              r={0.5}
              fill="#000"
            />
          ))}
        </G>
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    borderRadius: 18,
    overflow: "hidden",
    backgroundColor: COLORS.warmBg,
  },
});
