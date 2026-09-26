import { useRouter } from "expo-router";
import { ArrowCounterClockwise, CaretLeft, Lightning, Sword } from "phosphor-react-native";
import React, { useState } from "react";
import { Pressable, ScrollView, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { BottomSheet } from "@/src/components/BottomSheet";
import { AppText, Card, PrimaryButton, haptic, useToast } from "@/src/components/ui";
import { useStore } from "@/src/store/AppStore";
import { FarmRate, RankBareme } from "@/src/store/types";
import { fonts, makeStyles, radius, spacing, useTheme } from "@/src/theme";

const FARM_RATE_FIELDS: { key: keyof FarmRate; label: string }[] = [
  { key: "dennies", label: "Dennies" },
  { key: "logs", label: "EXP perso (Journaux)" },
  { key: "power", label: "EXP moteur (Modules)" },
  { key: "hamster", label: "Livres de skill (Cage à hamster)" },
  { key: "promo", label: "Matériau de promotion" },
  { key: "skillMat", label: "Matériau d'expert" },
  { key: "boss", label: "Matériau de boss" },
];

const BAREME_GROUPS: { title: string; fields: { key: keyof RankBareme; label: string }[] }[] = [
  {
    title: "Personnage (→ niv. 60)",
    fields: [
      { key: "charDennies", label: "Dennies" },
      { key: "charExp", label: "Matériaux d'EXP" },
      { key: "charPromo", label: "Matériaux de promotion" },
    ],
  },
  {
    title: "Moteur (→ niv. 60)",
    fields: [
      { key: "engineDennies", label: "Dennies" },
      { key: "engineExp", label: "Matériaux d'EXP moteur" },
    ],
  },
  {
    title: "Une compétence (niv. 1 → 12)",
    fields: [
      { key: "skillDennies", label: "Dennies" },
      { key: "skillBooks", label: "Livres de skill" },
      { key: "skillExpert", label: "Matériau d'expert" },
      { key: "skillBoss", label: "Matériau de boss" },
    ],
  },
  {
    title: "Core skill (A → F)",
    fields: [
      { key: "coreDennies", label: "Dennies" },
      { key: "coreBooks", label: "Livres de skill" },
      { key: "coreExpert", label: "Matériau d'expert" },
      { key: "coreBoss", label: "Matériau de boss" },
    ],
  },
];

export default function GameDataScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors } = useTheme();
  const styles = useStyles();
  const toast = useToast();
  const store = useStore();
  const { state } = store;
  const [rank, setRank] = useState<"S" | "A">("S");
  const [confirmReset, setConfirmReset] = useState(false);

  const cfg = state.gameConfig;
  const bareme = cfg.ranks[rank];

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
          Ces chiffres pilotent les calculs de farm. Modifie-les avec tes vraies valeurs — tout est enregistré et
          synchronisé automatiquement dans tous les modules.
        </AppText>

        {/* Farm rates */}
        <Card>
          <View style={styles.cardHead}>
            <Lightning size={18} color={colors.brandPrimary} weight="fill" />
            <AppText variant="subtitle">Vitesse de farm</AppText>
          </View>
          <AppText variant="caption" color={colors.muted} style={{ marginBottom: spacing.sm }}>
            Quantité obtenue par run de 60 énergie (décimales autorisées).
          </AppText>
          {FARM_RATE_FIELDS.map((f) => (
            <NumberField
              key={f.key}
              testID={`farmrate-${f.key}`}
              label={f.label}
              value={cfg.farmRate[f.key]}
              onChange={(v) => store.setFarmRate(f.key, v)}
            />
          ))}
        </Card>

        {/* Bareme */}
        <View style={styles.segment}>
          <SegBtn label="BARÈME RANG S" active={rank === "S"} onPress={() => setRank("S")} />
          <SegBtn label="BARÈME RANG A" active={rank === "A"} onPress={() => setRank("A")} />
        </View>

        {BAREME_GROUPS.map((group) => (
          <Card key={group.title}>
            <View style={styles.cardHead}>
              <Sword size={18} color={colors.brandSecondary} weight="fill" />
              <AppText variant="subtitle">{group.title}</AppText>
            </View>
            {group.fields.map((f) => (
              <NumberField
                key={f.key}
                testID={`bareme-${rank}-${f.key}`}
                label={f.label}
                value={bareme[f.key]}
                onChange={(v) => store.setBareme(rank, f.key, v)}
              />
            ))}
          </Card>
        ))}
      </ScrollView>

      <BottomSheet visible={confirmReset} onClose={() => setConfirmReset(false)} title="Réinitialiser le barème ?" scroll={false}>
        <AppText variant="body" color={colors.onSurfaceSecondary}>
          Les chiffres de farm reviendront aux valeurs par défaut de l'app. Tes agents, objectifs et sauvegardes ne
          sont pas touchés.
        </AppText>
        <PrimaryButton
          label="RÉINITIALISER"
          variant="danger"
          onPress={() => { store.resetGameConfig(); setConfirmReset(false); toast("Barème réinitialisé", "info"); }}
          testID="confirm-reset-gamedata"
        />
        <PrimaryButton label="ANNULER" variant="ghost" onPress={() => setConfirmReset(false)} />
      </BottomSheet>
    </View>
  );
}

function NumberField({
  label,
  value,
  onChange,
  testID,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  testID?: string;
}) {
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
    <View style={styles.fieldRow}>
      <AppText variant="body" style={{ flex: 1, paddingRight: spacing.md }}>{label}</AppText>
      <TextInput
        testID={testID}
        value={text}
        onChangeText={commit}
        keyboardType="decimal-pad"
        placeholderTextColor={colors.muted}
        style={styles.input}
      />
    </View>
  );
}

function SegBtn({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={() => { haptic.select(); onPress(); }}
      style={{ flex: 1, height: 40, alignItems: "center", justifyContent: "center", borderRadius: radius.sm, backgroundColor: active ? colors.brandPrimary : "transparent" }}
    >
      <AppText variant="label" color={active ? colors.onBrandPrimary : colors.muted}>{label}</AppText>
    </Pressable>
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
  segment: {
    flexDirection: "row",
    backgroundColor: c.surfaceSecondary,
    borderRadius: radius.md,
    padding: 4,
    borderWidth: 1,
    borderColor: c.border,
  },
  fieldRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: c.divider,
  },
  input: {
    fontFamily: fonts.display,
    fontSize: 18,
    color: c.brandPrimary,
    backgroundColor: c.surfaceTertiary,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: c.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    minWidth: 110,
    textAlign: "right",
  },
}));
