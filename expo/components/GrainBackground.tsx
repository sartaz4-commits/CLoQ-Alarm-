import React, { useMemo } from "react";
import { Dimensions, StyleSheet, View } from "react-native";
import Svg, { Circle, Ellipse, G, Path, Rect } from "react-native-svg";
import { COLORS } from "@/constants/theme";

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get("window");

type WesternKind = "cactus" | "hat" | "horseshoe" | "star";

interface Props {
  /** Distance between horizontal paper lines */
  lineSpacing?: number;
  /** Opacity for the paper lines */
  opacity?: number;
  /** Which decorative western icons to scatter behind content */
  decor?: WesternKind[];
}

/**
 * Aged-paper background overlay: warm parchment color, faint horizontal
 * ruled lines, scattered soft brown spots and a couple of decorative
 * western icons (cactus, cowboy hat, horseshoe, sheriff star) near the
 * edges. Sits behind all screen content and is non-interactive.
 */
export default function GrainBackground({
  lineSpacing: _lineSpacing = 15,
  opacity: _opacity = 0.11,
  decor = ["cactus", "hat", "horseshoe", "star"],
}: Props) {
  const spots = useMemo(() => {
    // Deterministic-ish positions near corners/edges for aged paper feel.
    const seed: { x: number; y: number; r: number; o: number }[] = [
      { x: 0.08, y: 0.06, r: 22, o: 0.07 },
      { x: 0.92, y: 0.04, r: 14, o: 0.05 },
      { x: 0.04, y: 0.55, r: 18, o: 0.06 },
      { x: 0.95, y: 0.42, r: 25, o: 0.06 },
      { x: 0.18, y: 0.95, r: 16, o: 0.05 },
      { x: 0.78, y: 0.97, r: 20, o: 0.07 },
      { x: 0.5, y: 0.78, r: 12, o: 0.05 },
    ];
    return seed;
  }, []);

  return (
    <View pointerEvents="none" style={styles.root}>
      <View style={styles.bgFill} />

      <Svg width={SCREEN_W} height={SCREEN_H} style={StyleSheet.absoluteFill}>
        {/* aged paper spots */}
        {spots.map((s, i) => (
          <Circle
            key={`sp-${i}`}
            cx={s.x * SCREEN_W}
            cy={s.y * SCREEN_H}
            r={s.r}
            fill={COLORS.grain}
            opacity={s.o}
          />
        ))}

        {/* scattered western decorative icons */}
        {decor.includes("cactus") && (
          <Cactus x={SCREEN_W * 0.06} y={SCREEN_H * 0.18} />
        )}
        {decor.includes("hat") && (
          <CowboyHat x={SCREEN_W * 0.82} y={SCREEN_H * 0.12} />
        )}
        {decor.includes("horseshoe") && (
          <Horseshoe x={SCREEN_W * 0.08} y={SCREEN_H * 0.86} />
        )}
        {decor.includes("star") && (
          <SheriffStar x={SCREEN_W * 0.86} y={SCREEN_H * 0.82} />
        )}
        {decor.includes("cactus") && decor.length > 1 && (
          <Cactus x={SCREEN_W * 0.88} y={SCREEN_H * 0.5} scale={0.7} />
        )}
      </Svg>
    </View>
  );
}

const DECOR_FILL = COLORS.sienna;
const DECOR_OPACITY = 0.08;

function Cactus({ x, y, scale = 1 }: { x: number; y: number; scale?: number }) {
  return (
    <G transform={`translate(${x},${y}) scale(${scale})`} opacity={DECOR_OPACITY}>
      {/* trunk */}
      <Rect x={-7} y={-26} width={14} height={52} rx={6} fill={DECOR_FILL} />
      {/* left arm */}
      <Rect x={-22} y={-6} width={10} height={5} rx={2.5} fill={DECOR_FILL} />
      <Rect x={-22} y={-22} width={5} height={18} rx={2.5} fill={DECOR_FILL} />
      {/* right arm */}
      <Rect x={12} y={-2} width={12} height={5} rx={2.5} fill={DECOR_FILL} />
      <Rect x={19} y={-20} width={5} height={20} rx={2.5} fill={DECOR_FILL} />
    </G>
  );
}

function CowboyHat({ x, y, scale = 1 }: { x: number; y: number; scale?: number }) {
  return (
    <G transform={`translate(${x},${y}) scale(${scale})`} opacity={DECOR_OPACITY}>
      <Ellipse cx={0} cy={6} rx={26} ry={5} fill={DECOR_FILL} />
      <Path
        d="M -14 6 C -14 -10 -8 -16 0 -16 C 8 -16 14 -10 14 6 Z"
        fill={DECOR_FILL}
      />
      <Rect x={-14} y={2} width={28} height={2.5} fill={COLORS.bg} opacity={0.6} />
    </G>
  );
}

function Horseshoe({ x, y, scale = 1 }: { x: number; y: number; scale?: number }) {
  return (
    <G transform={`translate(${x},${y}) scale(${scale})`} opacity={DECOR_OPACITY}>
      <Path
        d="M -16 -14 C -16 14 -6 22 0 22 C 6 22 16 14 16 -14 L 10 -14 C 10 12 4 16 0 16 C -4 16 -10 12 -10 -14 Z"
        fill={DECOR_FILL}
      />
      <Circle cx={-13} cy={-12} r={1.6} fill={COLORS.bg} opacity={0.6} />
      <Circle cx={13} cy={-12} r={1.6} fill={COLORS.bg} opacity={0.6} />
    </G>
  );
}

function SheriffStar({ x, y, scale = 1 }: { x: number; y: number; scale?: number }) {
  // 5-point star path centered at 0,0
  const pts: string[] = [];
  const outer = 22;
  const inner = 9;
  for (let i = 0; i < 10; i++) {
    const r = i % 2 === 0 ? outer : inner;
    const a = (Math.PI / 5) * i - Math.PI / 2;
    pts.push(`${Math.cos(a) * r},${Math.sin(a) * r}`);
  }
  return (
    <G transform={`translate(${x},${y}) scale(${scale})`} opacity={DECOR_OPACITY}>
      <Path d={`M ${pts.join(" L ")} Z`} fill={DECOR_FILL} />
    </G>
  );
}

const styles = StyleSheet.create({
  root: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0 },
  bgFill: { ...StyleSheet.absoluteFillObject, backgroundColor: COLORS.bg },
});
