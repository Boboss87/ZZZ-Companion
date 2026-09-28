import { useRouter } from "expo-router";
import { ArrowCounterClockwise, CaretLeft, Lightning } from "phosphor-react-native";
import React, { useState } from "react";
import { Pressable, ScrollView, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { BottomSheet } from "@/src/components/BottomSheet";
import { AppText, Card, PrimaryButton, haptic, useToast } from "@/src/components/ui";
import { useStore } from "@/src/store/AppStore";
import { FarmYield } from "@/src/store/types";
import { fonts, makeStyles, radius, spacing, useTheme } from "@/src/theme";

type ProgTable = "agentProg" | "engineProg" | "skillProg" | "coreProg";

const YIELD_FIELDS: { key: keyof FarmYield; label: string }[] = [
  { key: "energy", label: "Énergie dépensée (base)" },
  { key: "dennies", label: "Denny" },
  { key: "logs", label: "Journaux" },
  { key: "power", label: "Modules" },
  { key: "sceaux", label: "Sceaux" },
  { key: "composants", label: "Composants" },
  { key: "puces", label: "Puces" },
  { key: "expert", label: "Expert" },
];

const TABLES: {
  table: ProgTable;
  title: string;
  labels: string[];
  cols: { key: string; label: string }[];
}[] = [
  {
    table: "agentProg",
    title: "Progression agent (par palier)",
    labels: ["1-10", "10-20", "20-30", "30-40", "40-50", "50-60"],
    cols: [{ key: "denny", label: "Denny" }, { key: "journaux", label: "Journaux" }, { key: "sceaux", label: "Sceaux" }],
  },
  {
    table: "engineProg",
    title: "Progression moteur (par palier)",
    labels: ["1-10", "10-20", "20-30", "30-40", "40-50", "50-60"],
    cols: [{ key: "denny", label: "Denny" }, { key: "modules", label: "Modules" }, { key: "composants", label: "Compos." }],
  },
  {
    table: "skillProg",
    title: "Progression skill (par niveau, ×1 skill)",
    labels: ["1-2", "2-3", "3-4", "4-5", "5-6", "6-7", "7-8", "8-9", "9-10", "10-11", "11-12"],
    cols: [{ key: "denny", label: "Denny" }, { key: "puces", label: "Puces" }, { key: "hamster", label: "Cage" }],
  },
  {
    table: "coreProg",
    title: "Progression core passif (A → F)",
    labels: ["A", "B", "C", "D", "E", "F"],
    cols: [{ key: "denny", label: "Denny" }, { key: "expert", label: "Expert" }, { key: "infame", label: "Infâme" }],
  },
];

export default function GameDataScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors } = useTheme();
  const styles = useStyles();
  const toast = useToast();
  const store = useStore();
  const cfg = store.state.gameConfig;
  const [confirmReset, setConfirmReset] = useState(false);

  return (
    <View style={{ flex: 1, backgroundColor: colors.surface }}>
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <Pressable testID="gamedata-back" onPress={() => router.back()} style={styles.iconBtn} hitSlop={10}>
          <CaretLeft size={20} color={colors.onSurface} weight="bold" />
        </Pressable>
        <AppText variant="title">DONNÉES DU JEU</AppText>
        <Pressable testID="gamedata-reset" onPress={() => { haptic.light(); setConfirmReset(true); }} style={styles.iconBtn} hitSlop={10}>
          <ArrowCounterClockwise size={18} color={colors.onSurface} />
        </Pressable>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ padding: spacing.lg, gap: spacing.md, paddingBottom: insets.bottom + spacing.xxl }}
      >
        <AppText variant="caption" color={colors.muted}>
          Barème officiel de ton compte. Les presets calculent automatiquement les matériaux à partir de ces valeurs.
          Cage à hamster & Infâme sont affichés comme manquants mais jamais comptés dans le temps de farm.
        </AppText>

        {/* Farm yields */}
        <Card>
          <View style={styles.cardHead}>
            <Lightning size={18} color={colors.brandPrimary} weight="fill" />
            <AppText variant="subtitle">Rendement par énergie</AppText>
          </View>
          <AppText variant="caption" color={colors.muted} style={{ marginBottom: spacing.sm }}>
            Quantité obtenue pour l'énergie de base indiquée (décimales OK).
          </AppText>
          {YIELD_FIELDS.map((f) => (
            <View key={f.key} style={styles.yieldRow}>
              <AppText variant="body" style={{ flex: 1 }}>{f.label}</AppText>
              <NumberCell testID={`yield-${f.key}`} value={cfg.farmYield[f.key]} onChange={(v) => store.setFarmYield(f.key, v)} wide />
            </View>
          ))}
        </Card>

        {/* Progression tables */}
        {TABLES.map((t) => {
          const rows = cfg[t.table] as Record<string, number>[];
          return (
            <Card key={t.table}>
              <AppText variant="subtitle" style={{ marginBottom: spacing.sm }}>{t.title}</AppText>
              <View style={styles.gridHeader}>
                <AppText variant="label" color={colors.muted} style={{ width: 52 }}>NIV</AppText>
                {t.cols.map((c) => (
                  <AppText key={c.key} variant="label" color={colors.muted} style={{ flex: 1, textAlign: "center" }}>{c.label}</AppText>
                ))}
              </View>
              {t.labels.map((lvl, i) => (
                <View key={lvl} style={styles.gridRow}>
                  <AppText variant="caption" style={{ width: 52 }}>{lvl}</AppText>
                  {t.cols.map((c) => (
                    <View key={c.key} style={{ flex: 1, paddingHorizontal: 3 }}>
                      <NumberCell
                        testID={`prog-${t.table}-${i}-${c.key}`}
                        value={rows[i]?.[c.key] ?? 0}
                        onChange={(v) => store.setProgRow(t.table, i, c.key, v)}
                      />
                    </View>
                  ))}
                </View>
              ))}
            </Card>
          );
        })}
      </ScrollView>

      <BottomSheet visible={confirmReset} onClose={() => setConfirmReset(false)} title="Réinitialiser le barème ?" scroll={false}>
        <AppText variant="body" color={colors.onSurfaceSecondary}>
          Les valeurs reviennent au barème par défaut. Agents, objectifs et sauvegardes ne sont pas touchés.
        </AppText>
        <PrimaryButton label="RÉINITIALISER" variant="danger" onPress={() => { store.resetGameConfig(); setConfirmReset(false); toast("Barème réinitialisé", "info"); }} testID="confirm-reset-gamedata" />
        <PrimaryButton label="ANNULER" variant="ghost" onPress={() => setConfirmReset(false)} />
      </BottomSheet>
    </View>
  );
}

function NumberCell({ value, onChange, testID, wide }: { value: number; onChange: (v: number) => void; testID?: string; wide?: boolean }) {
  const { colors } = useTheme();
  const styles = useStyles();
  const [text, setText] = useState(`${value}`);
  React.useEffect(() => setText(`${value}`), [value]);
  const commit = (t: string) => {
    const cleaned = t.replace(/[^0-9.]/g, "");
    setText(cleaned);
    const n = parseFloat(cleaned);
    onChange(Number.isFinite(n) ? n : 0);
  };
  return (
    <TextInput
      testID={testID}
      value={text}
      onChangeText={commit}
      keyboardType="decimal-pad"
      placeholderTextColor={colors.muted}
      style={[styles.cell, wide && { minWidth: 120, textAlign: "right" }]}
    />
  );
}

const useStyles = makeStyles((c) => ({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: c.border,
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    backgroundColor: c.surfaceTertiary,
    borderWidth: 1,
    borderColor: c.border,
    alignItems: "center",
    justifyContent: "center",
  },
  cardHead: { flexDirection: "row", gap: spacing.sm, alignItems: "center", marginBottom: spacing.sm },
  yieldRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: c.divider,
  },
  gridHeader: { flexDirection: "row", alignItems: "center", paddingBottom: spacing.xs },
  gridRow: { flexDirection: "row", alignItems: "center", paddingVertical: 3 },
  cell: {
    fontFamily: fonts.medium,
    fontSize: 13,
    color: c.brandPrimary,
    backgroundColor: c.surfaceTertiary,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: c.border,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    textAlign: "center",
  },
}));
