import { useRouter } from "expo-router";
import { CaretLeft, CheckCircle, Plus, Trash } from "phosphor-react-native";
import React, { useMemo, useState } from "react";
import { Pressable, ScrollView, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { BottomSheet } from "@/src/components/BottomSheet";
import { AppText, Badge, Card, PrimaryButton, Stepper, haptic, useToast } from "@/src/components/ui";
import { useStore } from "@/src/store/AppStore";
import { computeProjection } from "@/src/store/projectionEngine";
import { desiredCostEstimate } from "@/src/store/pullStats";
import { ProjPatch } from "@/src/store/types";
import { fonts, makeStyles, radius, spacing, useTheme } from "@/src/theme";

export default function ProjectionScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors } = useTheme();
  const styles = useStyles();
  const store = useStore();
  const { state } = store;
  const [editId, setEditId] = useState<string | null>(null);

  const avgDesired = desiredCostEstimate(state.pullSessions, state.settings.avgDesiredCost);
  const proj = useMemo(() => computeProjection(state, avgDesired), [state, avgDesired]);
  const editPatch = state.projection.patches.find((p) => p.id === editId) || null;

  return (
    <View style={{ flex: 1, backgroundColor: colors.surface }}>
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <Pressable testID="projection-back" onPress={() => router.back()} style={styles.iconBtn} hitSlop={10}>
          <CaretLeft size={20} color={colors.onSurface} weight="bold" />
        </Pressable>
        <AppText variant="title">PROJECTION</AppText>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ padding: spacing.lg, gap: spacing.md, paddingBottom: insets.bottom + spacing.xxl }}
      >
        {/* Current situation */}
        <Card>
          <AppText variant="subtitle" style={{ marginBottom: spacing.sm }}>Situation actuelle</AppText>
          <NumberField label="Tickets encapsulés" value={state.projection.startPulls} onChange={(v) => store.setProjection({ startPulls: v })} />
          <NumberField label="Polychromes" value={state.projection.polychromes} onChange={(v) => store.setProjection({ polychromes: v })} />
          <NumberField label="Monochromes" value={state.projection.monochromes} onChange={(v) => store.setProjection({ monochromes: v })} />
          <View style={styles.totalRow}>
            <AppText variant="label" color={colors.muted}>TOTAL DISPONIBLE</AppText>
            <AppText style={{ fontFamily: fonts.display, fontSize: 28, color: colors.brandPrimary }}>{proj.startTotal} tickets</AppText>
          </View>
          <AppText variant="caption" color={colors.muted}>
            Coût moyen d'un perso souhaité : {avgDesired} tickets (160 polychromes = 1 ticket).
          </AppText>
        </Card>

        {/* Patch projection */}
        <AppText variant="label" color={colors.muted}>PROJECTION PAR PATCH</AppText>
        {proj.rows.map((row) => (
          <Card key={row.patch.id} onPress={() => setEditId(row.patch.id)} accent={row.deficit} testID={`patch-card-${row.patch.id}`}>
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: spacing.sm }}>
              <AppText variant="title">{row.patch.name}</AppText>
              <Badge
                label={row.deficit ? "INSUFFISANT" : `≈ ${row.chars} PERSO`}
                bg={row.deficit ? colors.error : colors.surfaceTertiary}
                fg={row.deficit ? colors.onError : colors.info}
              />
            </View>
            <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
              <Col label="ENTRÉES" value={`+${row.income}`} color={colors.success} />
              <Col label="DÉPENSES" value={`-${row.spent}`} color={colors.brandSecondary} />
              <Col label="SOLDE" value={`${row.balanceAfter}`} color={row.deficit ? colors.error : colors.brandPrimary} />
            </View>
            <AppText variant="caption" color={colors.muted} style={{ marginTop: spacing.sm }}>
              {row.patch.expenses.length} dépense(s) · appuie pour modifier
            </AppText>
          </Card>
        ))}

        <Pressable testID="add-patch-button" onPress={() => { haptic.light(); store.addPatch(); }} style={styles.addRow}>
          <Plus size={16} color={colors.brandPrimary} weight="bold" />
          <AppText variant="label" color={colors.brandPrimary}>AJOUTER UN PATCH</AppText>
        </Pressable>

        {state.archivedPatches.length > 0 ? (
          <Card>
            <AppText variant="subtitle" style={{ marginBottom: spacing.sm }}>Patchs clôturés</AppText>
            {state.archivedPatches.slice().reverse().map((a) => (
              <View key={a.id} style={{ flexDirection: "row", justifyContent: "space-between", paddingVertical: 4 }}>
                <AppText variant="body" color={colors.muted}>{a.name}</AppText>
                <AppText variant="caption" color={colors.muted}>+{a.income} / -{a.spent}</AppText>
              </View>
            ))}
          </Card>
        ) : null}
      </ScrollView>

      <PatchSheet patch={editPatch} onClose={() => setEditId(null)} />
    </View>
  );
}

function PatchSheet({ patch, onClose }: { patch: ProjPatch | null; onClose: () => void }) {
  const { colors } = useTheme();
  const styles = useStyles();
  const store = useStore();
  const toast = useToast();
  if (!patch) return null;

  const spent = patch.expenses.reduce((sum, e) => sum + (e.actualCost ?? e.pullCost), 0);

  return (
    <BottomSheet visible={!!patch} onClose={onClose} title={`Patch ${patch.name}`}>
      <NumberField label="Nom du patch" value={patch.name} text onChangeText={(t) => store.updatePatch(patch.id, { name: t })} />
      <View style={styles.stepField}>
        <AppText variant="body">Durée (jours)</AppText>
        <Stepper value={patch.durationDays} onChange={(v) => store.updatePatch(patch.id, { durationDays: Math.max(1, v) })} step={7} min={1} />
      </View>
      <View style={styles.stepField}>
        <AppText variant="body">Revenus événements</AppText>
        <Stepper value={patch.tempIncome} onChange={(v) => store.updatePatch(patch.id, { tempIncome: v })} step={5} />
      </View>

      <AppText variant="label" color={colors.muted} style={{ marginTop: spacing.sm }}>DÉPENSES PRÉVUES (tickets)</AppText>
      {patch.expenses.map((e) => (
        <View key={e.id} style={styles.expenseCard} testID={`expense-${e.id}`}>
          <TextInput
            value={e.name}
            onChangeText={(t) => store.updateExpense(patch.id, e.id, { name: t })}
            placeholder="Nom (ex. Perso limité)"
            placeholderTextColor={colors.muted}
            style={styles.expenseInput}
          />
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: spacing.sm }}>
            <View>
              <AppText variant="label" color={colors.muted}>PRÉVU</AppText>
              <Stepper value={e.pullCost} onChange={(v) => store.updateExpense(patch.id, e.id, { pullCost: v })} step={10} />
            </View>
            <Pressable testID={`expense-delete-${e.id}`} onPress={() => { haptic.light(); store.deleteExpense(patch.id, e.id); }} style={[styles.rowBtn, { borderColor: colors.error }]}>
              <Trash size={16} color={colors.error} />
            </Pressable>
          </View>
        </View>
      ))}
      <Pressable testID="add-expense-button" onPress={() => { haptic.light(); store.addExpense(patch.id, { name: "Nouvelle dépense", pullCost: 130, actualCost: null }); }} style={styles.addRow}>
        <Plus size={16} color={colors.brandPrimary} weight="bold" />
        <AppText variant="label" color={colors.brandPrimary}>AJOUTER UNE DÉPENSE</AppText>
      </Pressable>

      <View style={styles.spentTotal}>
        <AppText variant="label" color={colors.muted}>TOTAL DÉPENSES</AppText>
        <AppText variant="subtitle" color={colors.brandSecondary}>-{spent} tickets</AppText>
      </View>

      <Pressable testID="close-patch-button" onPress={() => { haptic.success(); store.closePatch(patch.id); toast("Patch clôturé — solde reporté", "success"); onClose(); }} style={[styles.actionBtn, { backgroundColor: colors.success }]}>
        <CheckCircle size={18} color={colors.onSuccess} weight="bold" />
        <AppText variant="subtitle" color={colors.onSuccess}>Clôturer ce patch</AppText>
      </Pressable>
      <PrimaryButton label="SUPPRIMER LE PATCH" variant="ghost" onPress={() => { store.deletePatch(patch.id); onClose(); }} testID="delete-patch-button" />
    </BottomSheet>
  );
}

function NumberField({
  label,
  value,
  onChange,
  onChangeText,
  text,
}: {
  label: string;
  value: number | string;
  onChange?: (v: number) => void;
  onChangeText?: (t: string) => void;
  text?: boolean;
}) {
  const { colors } = useTheme();
  const styles = useStyles();
  return (
    <View style={{ marginBottom: spacing.md }}>
      <AppText variant="label" color={colors.muted} style={{ marginBottom: spacing.xs }}>{label.toUpperCase()}</AppText>
      <TextInput
        value={`${value}`}
        onChangeText={(t) =>
          text ? onChangeText?.(t) : onChange?.(Math.max(0, parseInt(t.replace(/[^0-9]/g, "") || "0", 10)))
        }
        keyboardType={text ? "default" : "number-pad"}
        placeholderTextColor={colors.muted}
        style={styles.field}
      />
    </View>
  );
}

function Col({ label, value, color }: { label: string; value: string; color: string }) {
  const { colors } = useTheme();
  return (
    <View style={{ alignItems: "center", flex: 1 }}>
      <AppText style={{ fontFamily: fonts.display, fontSize: 22, color }}>{value}</AppText>
      <AppText variant="label" color={colors.muted}>{label}</AppText>
    </View>
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
  field: {
    fontFamily: fonts.display,
    fontSize: 22,
    color: c.brandPrimary,
    backgroundColor: c.surfaceTertiary,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: c.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  totalRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: c.border,
    paddingVertical: spacing.md,
    marginTop: spacing.xs,
  },
  stepField: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: spacing.sm },
  expenseCard: {
    backgroundColor: c.surfaceTertiary,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: c.border,
    padding: spacing.md,
    marginTop: spacing.sm,
  },
  expenseInput: {
    fontFamily: fonts.medium,
    fontSize: 15,
    color: c.onSurface,
    backgroundColor: c.surfaceSecondary,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: c.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  rowBtn: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: c.border,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: c.surfaceSecondary,
  },
  addRow: {
    flexDirection: "row",
    gap: spacing.sm,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: c.brandPrimary,
    borderStyle: "dashed",
    marginTop: spacing.sm,
  },
  spentTotal: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: c.border,
    paddingTop: spacing.md,
    marginTop: spacing.xs,
  },
  actionBtn: {
    flexDirection: "row",
    gap: spacing.sm,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: radius.md,
    marginTop: spacing.sm,
  },
}));
