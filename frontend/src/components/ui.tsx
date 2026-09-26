import * as Haptics from "expo-haptics";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  ActivityIndicator,
  Animated,
  Platform,
  Pressable,
  ScrollView,
  StyleProp,
  Text,
  TextProps,
  TextStyle,
  View,
  ViewStyle,
} from "react-native";

import { fonts, makeStyles, radius, spacing, useTheme } from "@/src/theme";

// ---------------------------------------------------------------------------
// Haptics helper
// ---------------------------------------------------------------------------
export const haptic = {
  light: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {}),
  select: () => Haptics.selectionAsync().catch(() => {}),
  success: () =>
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {}),
  error: () =>
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {}),
};

// ---------------------------------------------------------------------------
// Text
// ---------------------------------------------------------------------------
type Variant = "display" | "title" | "subtitle" | "body" | "label" | "caption";

const VARIANT: Record<Variant, TextStyle> = {
  display: { fontFamily: fonts.display, fontSize: 34, letterSpacing: 0.5 },
  title: { fontFamily: fonts.display, fontSize: 24, letterSpacing: 0.5 },
  subtitle: { fontFamily: fonts.semibold, fontSize: 16 },
  body: { fontFamily: fonts.body, fontSize: 14 },
  label: { fontFamily: fonts.medium, fontSize: 12, letterSpacing: 0.4 },
  caption: { fontFamily: fonts.body, fontSize: 12 },
};

export function AppText({
  variant = "body",
  color,
  style,
  children,
  ...rest
}: TextProps & { variant?: Variant; color?: string }) {
  const { colors } = useTheme();
  return (
    <Text
      style={[VARIANT[variant], { color: color ?? colors.onSurface }, style]}
      {...rest}
    >
      {children}
    </Text>
  );
}

// ---------------------------------------------------------------------------
// Card
// ---------------------------------------------------------------------------
export function Card({
  children,
  style,
  onPress,
  accent,
  testID,
}: {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
  accent?: boolean;
  testID?: string;
}) {
  const styles = useCardStyles();
  const content = (
    <View style={[styles.card, accent && styles.accent, style]}>{children}</View>
  );
  if (onPress) {
    return (
      <Pressable
        testID={testID}
        onPress={() => {
          haptic.light();
          onPress();
        }}
        style={({ pressed }) => (pressed ? { opacity: 0.85 } : undefined)}
      >
        {content}
      </Pressable>
    );
  }
  return <View testID={testID}>{content}</View>;
}

const useCardStyles = makeStyles((c) => ({
  card: {
    backgroundColor: c.surfaceSecondary,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: c.border,
    padding: spacing.lg,
  },
  accent: { borderColor: c.brandPrimary, borderWidth: 2 },
}));

// ---------------------------------------------------------------------------
// Progress bar (sharp corners)
// ---------------------------------------------------------------------------
export function ProgressBar({
  value,
  color,
  height = 8,
}: {
  value: number;
  color?: string;
  height?: number;
}) {
  const { colors } = useTheme();
  const pct = Math.max(0, Math.min(1, value)) * 100;
  return (
    <View style={{ height, backgroundColor: colors.surfaceTertiary, borderRadius: radius.sm, overflow: "hidden" }}>
      <View
        style={{
          width: `${pct}%`,
          height: "100%",
          backgroundColor: color ?? colors.brandPrimary,
        }}
      />
    </View>
  );
}

// ---------------------------------------------------------------------------
// Badge / tech label
// ---------------------------------------------------------------------------
export function Badge({
  label,
  bg,
  fg,
  style,
  testID,
}: {
  label: string;
  bg?: string;
  fg?: string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}) {
  const { colors } = useTheme();
  return (
    <View
      testID={testID}
      style={[
        {
          backgroundColor: bg ?? colors.brandTertiary,
          paddingHorizontal: spacing.sm,
          paddingVertical: 3,
          borderRadius: radius.sm,
          alignSelf: "flex-start",
        },
        style,
      ]}
    >
      <Text style={{ fontFamily: fonts.medium, fontSize: 11, letterSpacing: 0.5, color: fg ?? colors.onBrandTertiary }}>
        {label}
      </Text>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Buttons
// ---------------------------------------------------------------------------
export function PrimaryButton({
  label,
  onPress,
  disabled,
  variant = "primary",
  style,
  testID,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  variant?: "primary" | "secondary" | "danger" | "ghost";
  style?: StyleProp<ViewStyle>;
  testID?: string;
}) {
  const { colors } = useTheme();
  const bg =
    variant === "primary"
      ? colors.brandPrimary
      : variant === "danger"
        ? colors.error
        : variant === "secondary"
          ? colors.surfaceTertiary
          : "transparent";
  const fg =
    variant === "primary"
      ? colors.onBrandPrimary
      : variant === "danger"
        ? colors.onError
        : colors.onSurface;
  return (
    <Pressable
      testID={testID}
      disabled={disabled}
      onPress={() => {
        haptic.light();
        onPress();
      }}
      style={({ pressed }) => [
        {
          backgroundColor: bg,
          borderRadius: radius.md,
          paddingVertical: 14,
          paddingHorizontal: spacing.lg,
          alignItems: "center",
          justifyContent: "center",
          borderWidth: variant === "ghost" ? 1 : 0,
          borderColor: colors.border,
          opacity: disabled ? 0.4 : pressed ? 0.85 : 1,
        },
        style,
      ]}
    >
      <Text style={{ fontFamily: fonts.display, fontSize: 18, letterSpacing: 1, color: fg }}>
        {label}
      </Text>
    </Pressable>
  );
}

// ---------------------------------------------------------------------------
// Chip + horizontal chip row (sticky filter row)
// ---------------------------------------------------------------------------
export function Chip({
  label,
  selected,
  onPress,
  color,
  testID,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
  color?: string;
  testID?: string;
}) {
  const { colors } = useTheme();
  return (
    <Pressable
      testID={testID}
      onPress={() => {
        haptic.select();
        onPress();
      }}
      style={{
        height: 36,
        paddingHorizontal: spacing.md,
        borderRadius: radius.sm,
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
        backgroundColor: selected ? colors.brandPrimary : colors.surfaceTertiary,
        borderWidth: 1,
        borderColor: selected ? colors.brandPrimary : colors.border,
      }}
    >
      <Text
        style={{
          fontFamily: fonts.medium,
          fontSize: 13,
          color: selected ? colors.onBrandPrimary : color ?? colors.onSurfaceTertiary,
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}

export function ChipRow({ children }: { children: React.ReactNode }) {
  return (
    <View style={{ height: 56, justifyContent: "center" }}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: spacing.sm, paddingHorizontal: spacing.lg }}
      >
        {children}
      </ScrollView>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Stepper (large touch targets)
// ---------------------------------------------------------------------------
export function Stepper({
  value,
  onChange,
  step = 1,
  min = 0,
}: {
  value: number;
  onChange: (v: number) => void;
  step?: number;
  min?: number;
}) {
  const styles = useStepperStyles();
  const set = (v: number) => {
    haptic.light();
    onChange(Math.max(min, v));
  };
  return (
    <View style={styles.row}>
      <Pressable testID="stepper-minus" style={styles.btn} onPress={() => set(value - step)}>
        <Text style={styles.btnTxt}>−</Text>
      </Pressable>
      <View style={styles.valueBox}>
        <Text style={styles.value}>{value}</Text>
      </View>
      <Pressable testID="stepper-plus" style={styles.btn} onPress={() => set(value + step)}>
        <Text style={styles.btnTxt}>+</Text>
      </Pressable>
    </View>
  );
}

const useStepperStyles = makeStyles((c) => ({
  row: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  btn: {
    width: 52,
    height: 52,
    borderRadius: radius.md,
    backgroundColor: c.brandTertiary,
    alignItems: "center",
    justifyContent: "center",
  },
  btnTxt: { fontFamily: fonts.display, fontSize: 28, color: c.onSurface },
  valueBox: {
    minWidth: 72,
    height: 52,
    borderRadius: radius.md,
    backgroundColor: c.surfaceTertiary,
    borderWidth: 1,
    borderColor: c.border,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.md,
  },
  value: { fontFamily: fonts.display, fontSize: 24, color: c.brandPrimary },
}));

// ---------------------------------------------------------------------------
// Empty state
// ---------------------------------------------------------------------------
export function EmptyState({
  icon,
  title,
  subtitle,
}: {
  icon?: React.ReactNode;
  title: string;
  subtitle?: string;
}) {
  const { colors } = useTheme();
  return (
    <View style={{ alignItems: "center", justifyContent: "center", paddingVertical: spacing.xxxl, gap: spacing.sm }}>
      {icon}
      <AppText variant="title" style={{ marginTop: spacing.md }}>
        {title}
      </AppText>
      {subtitle ? (
        <AppText variant="body" color={colors.muted} style={{ textAlign: "center", paddingHorizontal: spacing.xl }}>
          {subtitle}
        </AppText>
      ) : null}
    </View>
  );
}

export function Loading({ label = "SYNCING..." }: { label?: string }) {
  const { colors } = useTheme();
  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center", gap: spacing.md }}>
      <ActivityIndicator color={colors.brandPrimary} size="large" />
      <AppText variant="title" color={colors.muted}>
        {label}
      </AppText>
    </View>
  );
}

export function SectionTitle({ title, right }: { title: string; right?: React.ReactNode }) {
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: spacing.md,
      }}
    >
      <AppText variant="title">{title}</AppText>
      {right}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Toast (mounted once in root)
// ---------------------------------------------------------------------------
type ToastKind = "success" | "error" | "info";
const ToastContext = createContext<(msg: string, kind?: ToastKind) => void>(() => {});

export function useToast() {
  return useContext(ToastContext);
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const { colors } = useTheme();
  const [msg, setMsg] = useState<string | null>(null);
  const [kind, setKind] = useState<ToastKind>("info");
  const opacity = useRef(new Animated.Value(0)).current;
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const show = useCallback(
    (m: string, k: ToastKind = "info") => {
      setMsg(m);
      setKind(k);
      if (k === "error") haptic.error();
      else if (k === "success") haptic.success();
      const useNative = Platform.OS !== "web";
      Animated.timing(opacity, { toValue: 1, duration: 180, useNativeDriver: useNative }).start();
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => {
        Animated.timing(opacity, { toValue: 0, duration: 220, useNativeDriver: useNative }).start(
          () => setMsg(null),
        );
      }, 2400);
    },
    [opacity],
  );

  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  const bg =
    kind === "success" ? colors.success : kind === "error" ? colors.error : colors.surfaceInverse;
  const fg =
    kind === "success" ? colors.onSuccess : kind === "error" ? colors.onError : colors.onSurfaceInverse;

  return (
    <ToastContext.Provider value={show}>
      {children}
      {msg ? (
        <Animated.View
          pointerEvents="none"
          style={{
            position: "absolute",
            bottom: 100,
            left: spacing.lg,
            right: spacing.lg,
            opacity,
            backgroundColor: bg,
            borderRadius: radius.md,
            paddingVertical: spacing.md,
            paddingHorizontal: spacing.lg,
            ...(Platform.OS === "web" ? { pointerEvents: "none" as const } : {}),
          }}
        >
          <Text style={{ fontFamily: fonts.medium, fontSize: 14, color: fg, textAlign: "center" }}>
            {msg}
          </Text>
        </Animated.View>
      ) : null}
    </ToastContext.Provider>
  );
}
