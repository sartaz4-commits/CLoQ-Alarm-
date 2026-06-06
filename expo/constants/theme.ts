import { Platform } from "react-native";

/**
 * Old-paper / indie western palette.
 * `cream` is repurposed as the display-text color (dark warm brown) since the
 * UI flipped from dark-on-dark to dark-on-parchment — most existing screens
 * use COLORS.cream for headings & big numbers and pick up the new value
 * automatically.
 */
export const COLORS = {
  bg: "#F2E0B6",
  card: "#E8C98A",
  cardElevated: "#E8C98A",
  border: "#C4714A",
  borderLight: "#D4C4A8",
  primary: "#2A1005",
  primaryDim: "#3D1F0A",
  success: "#4A8B5C",
  error: "#8B3E2F",
  warm: "#E8A857",
  warmDeep: "#C4714A",
  sienna: "#8B3E2F",
  warmBg: "#1C0E08",
  cream: "#2A1005",
  creamLight: "#F2E0B6",
  text: "#3D1F0A",
  textMuted: "#8B4513",
  textDim: "#A0826B",
  tabActive: "#2A1005",
  grain: "#8B4513",
  loudBg: "#8B3E2F",
  // Trace-the-path puzzle (indie western dark theme)
  traceBg: "#100B08",
  tracePath: "#E8A857",
  traceStart: "#C4714A",
  traceEnd: "#4A8B5C",
  traceWrong: "#8B3E2F",
  traceText: "#F5E6C8",
} as const;

export const FONTS = {
  display: Platform.select({ ios: "Georgia", android: "serif", default: "Georgia" }) as string,
  mono: Platform.select({ ios: "Menlo", android: "monospace", default: "monospace" }) as string,
} as const;

export const RADIUS = {
  sm: 8,
  md: 12,
  lg: 14,
  xl: 22,
  pill: 999,
} as const;

export const DEV_MODE = false as const;
