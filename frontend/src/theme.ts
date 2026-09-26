// Design tokens for ZZZ Companion — Dark-First Utility (ZZZ yellow/black gaming).
// Keys match the "color" block of /app/design_guidelines.json.
// The app ships a single dark palette; the forced scheme always resolves to it
// so the UI is always dark regardless of the device setting.

import { createContext, createElement, useContext, useMemo } from "react";
import type { ReactNode } from "react";
import { Appearance, StyleSheet, useColorScheme } from "react-native";

export type ColorScheme = "light" | "dark";
export type ThemeMode = "light" | "dark" | "system";

const dark = {
  // Surfaces
  surface: "#0A0A0A",
  onSurface: "#FFFFFF",
  surfaceSecondary: "#1A1A1A",
  onSurfaceSecondary: "#E5E5E5",
  surfaceTertiary: "#262626",
  onSurfaceTertiary: "#CCCCCC",
  surfaceInverse: "#EEEEEE",
  onSurfaceInverse: "#000000",
  muted: "#808080",

  // Brand
  brand: "#FEEE00",
  onBrand: "#000000",
  brandPrimary: "#FEEE00",
  onBrandPrimary: "#000000",
  brandSecondary: "#FF2A55",
  onBrandSecondary: "#FFFFFF",
  brandTertiary: "#333333",
  onBrandTertiary: "#FFFFFF",

  // Status
  success: "#00FF66",
  onSuccess: "#000000",
  warning: "#FF9900",
  onWarning: "#000000",
  error: "#FF3333",
  onError: "#FFFFFF",
  info: "#00E5FF",
  onInfo: "#000000",

  // Lines
  border: "#333333",
  borderStrong: "#FEEE00",
  divider: "#262626",
};

// Light pastel palette — calm, soft, less "violent" than the dark theme.
const light: typeof dark = {
  surface: "#F5F6FA",
  onSurface: "#232733",
  surfaceSecondary: "#FFFFFF",
  onSurfaceSecondary: "#3A3F4C",
  surfaceTertiary: "#EBEEF3",
  onSurfaceTertiary: "#565C6B",
  surfaceInverse: "#232733",
  onSurfaceInverse: "#FFFFFF",
  muted: "#8A909E",

  brand: "#4FA3C7",
  onBrand: "#FFFFFF",
  brandPrimary: "#4FA3C7",
  onBrandPrimary: "#FFFFFF",
  brandSecondary: "#F2A65A",
  onBrandSecondary: "#3A2400",
  brandTertiary: "#E4EAF0",
  onBrandTertiary: "#3A3F4C",

  success: "#2FA36B",
  onSuccess: "#FFFFFF",
  warning: "#D98A2B",
  onWarning: "#FFFFFF",
  error: "#E5484D",
  onError: "#FFFFFF",
  info: "#3E9DC4",
  onInfo: "#FFFFFF",

  border: "#E1E5EC",
  borderStrong: "#4FA3C7",
  divider: "#EBEEF3",
};

export type ThemeColors = typeof dark;

export const defaultScheme = "dark" satisfies ColorScheme;

export const themes: { light: ThemeColors; dark: ThemeColors } = { light, dark };

export function setColorScheme(scheme: ColorScheme | null) {
  Appearance.setColorScheme?.(scheme ?? "unspecified");
}

export function applyThemeMode(mode: ThemeMode) {
  setColorScheme(mode === "system" ? null : mode);
}

// Context lets an in-app toggle drive the palette on every platform,
// including web where Appearance.setColorScheme is a no-op.
const ThemeContext = createContext<ColorScheme | null>(null);

export function ThemeSchemeProvider({ mode, children }: { mode: ThemeMode; children: ReactNode }) {
  const system = useColorScheme();
  const resolved: ColorScheme =
    mode === "system" ? (system && themes[system] ? system : defaultScheme) : mode;
  return createElement(ThemeContext.Provider, { value: resolved }, children);
}

export function useTheme(): { scheme: ColorScheme; colors: ThemeColors } {
  const override = useContext(ThemeContext);
  const system = useColorScheme();
  const scheme: ColorScheme = override ?? (system && themes[system] ? system : defaultScheme);
  return { scheme, colors: themes[scheme] ?? themes.dark };
}

export function makeStyles<T extends StyleSheet.NamedStyles<T> | StyleSheet.NamedStyles<any>>(
  factory: (colors: ThemeColors) => T & StyleSheet.NamedStyles<any>,
): () => T {
  return function useStyles(): T {
    const { colors } = useTheme();
    return useMemo(() => StyleSheet.create(factory(colors)), [colors]);
  };
}

// Non-color tokens (safe to import directly, they never change with scheme).
export const fonts = {
  display: "BebasNeue",
  body: "IBMPlexSans",
  medium: "IBMPlexSans-Medium",
  semibold: "IBMPlexSans-SemiBold",
};

export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32, xxxl: 48 };

export const radius = { sm: 0, md: 4, lg: 8, pill: 999 };

// Elemental accent colors — allowed hex literals per design override,
// used ONLY for element badges/indicators.
export const ELEMENT_COLORS: Record<string, string> = {
  Ice: "#00E5FF",
  Fire: "#FF6B3D",
  Electric: "#C77DFF",
  Physical: "#F5C542",
  Ether: "#FF2A55",
};
