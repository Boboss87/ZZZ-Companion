import { CheckCircle, Plus, Trash } from "phosphor-react-native";
import React, { useMemo, useState } from "react";
import { Pressable, ScrollView, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { BottomSheet } from "@/src/components/BottomSheet";
import { AppText, Badge, Card, DateField, InlineNumber, PrimaryButton, Stepper, haptic, useToast } from "@/src/components/ui";
import { useStore } from "@/src/store/AppStore";
import { fmtDate } from "@/src/store/format";
import { computeProjection, ProjRow } from "@/src/store/projectionEngine";
import { desiredCostEstimate } from "@/src/store/pullStats";
import { ProjExpense } from "@/src/store/types";
import { fonts, makeStyles, radius, spacing, useTheme } from "@/src/theme";

export default function ProjectionScreen() {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const styles = useStyles();
  const store = useStore();
  const { state } = store;
  const [editId, setEditId] = useState<string | null>(null);

  const avgDesired = desiredCostEstimate(state.pullSessions, state.settings.avgDesiredCost);
  const proj = useMemo(() => computeProjection(state, avgDesired), [state, avgDesired]);
  const editRow = proj.rows.find((r) => r.patch.id === editId) || null;
  const editIndex = proj.rows.findIndex((r) => r.patch.id === editId);

  return (
    <View style={{ flex: 1, backgroundColor: colors.surface }}>
      <View style={{ paddingTop: insets.top + spacing.md, paddingHorizontal: spacing.lg, paddingBottom: spacing.sm }}>
        <AppText variant="display">PROJECTION</AppText>
        <AppText variant="caption" color={colors.muted}>Planifie tes pulls patch par patch</AppText>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ padding: spacing.lg, gap: spacing.md, paddingBottom: insets.bottom + spacing.xxl }}
      >
        {/* Current situation */}
        <Card>
          <AppText variant="subtitle" style={{ marginBottom: spacing.sm }}>Situation actuelle</AppText>
          <NumberField label="Encrypted Master Tapes" value={state.projection.masterTapes} onChange={(v) => store.setProjection({ masterTapes: v })} />
          <NumberField label="Polychromes" value={state.projection.polychromes} onChange={(v) => store.setProjection({ polychromes: v })} />
          <NumberField label="Monochromes" value={state.projection.monochromes} onChange={(v) => store.setProjection({ monochromes: v })} />
          <NumberField label="Residual Signals" value={state.projection.residualSignals} onChange={(v) => store.setProjection({ residualSignals: v })} />
          <View style={styles.totalRow}>
            <AppText variant="label" color={colors.muted}>TOTAL DISPONIBLE</AppText>
            <AppText style={{ fontFamily: fonts.display, fontSize: 28, color: colors.brandPrimary }}>{proj.startTotal} tickets</AppText>
          </View>
          <AppText variant="caption" color={colors.muted}>
            Coût moyen d&apos;un perso souhaité : {avgDesired} tickets (160 polychromes = 1 ticket).
          </AppText>
        </Card>

        {/* Patch projection */}
        <AppText variant="label" color={colors.muted}>PROJECTION PAR PATCH</AppText>
        {proj.rows.length === 0 ? (
          <AppText variant="caption" color={colors.muted}>Aucun patch. Ajoute ton patch en cours ci-dessous.</AppText>
        ) : null}
        {proj.rows.map((row, i) => (
          <Card key={row.patch.id} onPress={() => setEditId(row.patch.id)} accent={row.deficit} testID={`patch-card-${row.patch.id}`}>
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 2 }}>
              <AppText variant="title">{row.patch.name}</AppText>
              <Badge
                label={row.deficit ? "INSUFFISANT" : `≈ ${row.chars} PERSO`}
                bg={row.deficit ? colors.error : colors.surfaceTertiary}
                fg={row.deficit ? colors.onError : colors.info}
              />
            </View>
            <AppText variant="caption" color={colors.muted} style={{ marginBottom: spacing.sm }}>
              {row.startISO ? `${fmtDate(row.startISO)} → ${fmtDate(row.endISO)}` : "Date de début non définie"}
              {i === 0 ? ` · ${row.daysRemaining} j restants` : ""}
            </AppText>
            <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
              <Col label="À GAGNER" value={`+${row.income}`} color={colors.success} />
              <Col label="PRÉVU" value={`-${row.plannedSpent}`} color={colors.brandSecondary} />
              <Col label="SOLDE" value={`${row.balanceAfter}`} color={row.deficit ? colors.error : colors.brandPrimary} />
            </View>
            <AppText variant="caption" color={colors.muted} style={{ marginTop: spacing.sm }}>
              {row.plannedCount} prévue(s){row.doneCount ? ` · ${row.doneCount} effectuée(s)` : ""} · appuie pour modifier
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

      <PatchSheet row={editRow} isFirst={editIndex === 0} onClose={() => setEditId(null)} />
    </View>
  );
}

function PatchSheet({ row, isFirst, onClose }: { row: ProjRow | null; isFirst: boolean; onClose: () => void }) {
  const { colors } = useTheme();
  const styles = useStyles();
  const store = useStore();
  const toast = useToast();
  const [confirmNext, setConfirmNext] = useState(false);
  if (!row) return null;
  const patch = row.patch;

  const plannedRemaining = patch.expenses.filter((e) => e.actualCost === null).length;
  const doAdvance = () => { haptic.success(); store.advancePatch(patch.id); toast("Patch archivé", "success"); onClose(); };
  const nextPatch = () => { if (plannedRemaining > 0) setConfirmNext(true); else doAdvance(); };

  return (
    <BottomSheet visible={!!row} onClose={onClose} title={`Patch ${patch.name}`}>
      <NumberField label="Nom du patch" value={patch.name} text onChangeText={(t) => store.updatePatch(patch.id, { name: t })} />
      {isFirst ? (
        <View style={{ marginBottom: spacing.md }}>
          <AppText variant="label" color={colors.muted} style={{ marginBottom: spacing.xs }}>DATE DE DÉBUT (JJ.MM.AAAA)</AppText>
          <DateField valueISO={patch.startDate} onChange={(iso) => store.updatePatch(patch.id, { startDate: iso })} style={styles.field} testID="patch-startdate" />
        </View>
      ) : (
        <View style={{ marginBottom: spacing.md }}>
          <AppText variant="label" color={colors.muted} style={{ marginBottom: spacing.xs }}>DÉBUT (CALCULÉ AUTO)</AppText>
          <AppText variant="body">{row.startISO ? `${fmtDate(row.startISO)} → ${fmtDate(row.endISO)}` : "Définis la date du patch en cours"}</AppText>
        </View>
      )}
      <View style={styles.stepField}>
        <AppText variant="body">Durée (jours)</AppText>
        <Stepper value={patch.durationDays} onChange={(v) => store.updatePatch(patch.id, { durationDays: Math.max(1, v) })} step={7} min={1} />
      </View>
      <View style={styles.stepField}>
        <AppText variant="body">Récompenses events (estim.)</AppText>
        <InlineNumber value={patch.tempIncome} onChange={(v) => store.updatePatch(patch.id, { tempIncome: v })} testID="patch-income" />
      </View>

      <AppText variant="label" color={colors.muted} style={{ marginTop: spacing.sm }}>DÉPENSES (tickets)</AppText>
      {patch.expenses.map((e) => (
        <ExpenseRow key={e.id} patchId={patch.id} expense={e} />
      ))}
      <Pressable testID="add-expense-button" onPress={() => { haptic.light(); store.addExpense(patch.id, { name: "Nouvelle dépense", pullCost: 130, actualCost: null }); }} style={styles.addRow}>
        <Plus size={16} color={colors.brandPrimary} weight="bold" />
        <AppText variant="label" color={colors.brandPrimary}>AJOUTER UNE DÉPENSE</AppText>
      </Pressable>

      <View style={styles.spentTotal}>
        <AppText variant="label" color={colors.muted}>PRÉVU (restant)</AppText>
        <AppText variant="subtitle" color={colors.brandSecondary}>-{row.plannedSpent} tickets</AppText>
      </View>

      {isFirst ? (
        <>
          <Pressable testID="next-patch-button" onPress={nextPatch} style={[styles.actionBtn, { backgroundColor: colors.success }]}>
            <CheckCircle size={18} color={colors.onSuccess} weight="bold" />
            <AppText variant="subtitle" color={colors.onSuccess}>Passer au patch suivant</AppText>
          </Pressable>
          {confirmNext ? (
            <View style={styles.validateBox}>
              <AppText variant="body" style={{ marginBottom: spacing.sm }}>
                Il reste {plannedRemaining} dépense(s) non réalisée(s). Souhaitez-vous les réaliser avant de passer au patch suivant ?
              </AppText>
              <View style={{ flexDirection: "row", gap: spacing.sm }}>
                <View style={{ flex: 1 }}>
                  <PrimaryButton label="Oui, les réaliser" variant="ghost" onPress={() => setConfirmNext(false)} />
                </View>
                <View style={{ flex: 1 }}>
                  <PrimaryButton label="Non, passer" testID="confirm-next-patch" onPress={() => { setConfirmNext(false); doAdvance(); }} />
                </View>
              </View>
            </View>
          ) : null}
        </>
      ) : null}
      <PrimaryButton label="SUPPRIMER LE PATCH" variant="ghost" onPress={() => { store.deletePatch(patch.id); onClose(); }} testID="delete-patch-button" />
    </BottomSheet>
  );
}

function ExpenseRow({ patchId, expense }: { patchId: string; expense: ProjExpense }) {
  const { colors } = useTheme();
  const styles = useStyles();
  const store = useStore();
  const toast = useToast();
  const done = expense.actualCost !== null;
  const [validating, setValidating] = useState(false);
  const [real, setReal] = useState(expense.pullCost);

  return (
    <View style={styles.expenseCard} testID={`expense-${expense.id}`}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
        <TextInput
          value={expense.name}
          editable={!done}
          onChangeText={(t) => store.updateExpense(patchId, expense.id, { name: t })}
          placeholder="Nom (ex. Perso limité)"
          placeholderTextColor={colors.muted}
          style={[styles.expenseInput, { flex: 1 }]}
        />
        {done ? <Badge label="EFFECTUÉE" bg={colors.success} fg={colors.onSuccess} /> : null}
      </View>

      {done ? (
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: spacing.sm }}>
          <View>
            <AppText variant="label" color={colors.muted}>COÛT RÉEL</AppText>
            <AppText variant="subtitle" color={colors.onSurface}>{expense.actualCost} tickets</AppText>
          </View>
          <Pressable testID={`expense-delete-${expense.id}`} onPress={() => { haptic.light(); store.deleteExpense(patchId, expense.id); }} style={[styles.rowBtn, { borderColor: colors.error }]}>
            <Trash size={16} color={colors.error} />
          </Pressable>
        </View>
      ) : (
        <>
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: spacing.sm }}>
            <View>
              <AppText variant="label" color={colors.muted}>PRÉVU</AppText>
              <InlineNumber value={expense.pullCost} onChange={(v) => store.updateExpense(patchId, expense.id, { pullCost: v })} testID={`expense-cost-${expense.id}`} />
            </View>
            <View style={{ flexDirection: "row", gap: spacing.sm }}>
              <Pressable
                testID={`expense-do-${expense.id}`}
                onPress={() => { haptic.light(); setReal(expense.pullCost); setValidating((v) => !v); }}
                style={[styles.rowBtn, { borderColor: colors.success, backgroundColor: colors.success }]}
              >
                <CheckCircle size={18} color={colors.onSuccess} weight="bold" />
              </Pressable>
              <Pressable testID={`expense-delete-${expense.id}`} onPress={() => { haptic.light(); store.deleteExpense(patchId, expense.id); }} style={[styles.rowBtn, { borderColor: colors.error }]}>
                <Trash size={16} color={colors.error} />
              </Pressable>
            </View>
          </View>
          {validating ? (
            <View style={styles.validateBox}>
              <AppText variant="label" color={colors.muted} style={{ marginBottom: spacing.xs }}>COÛT RÉEL (déduit des Master Tapes)</AppText>
              <InlineNumber value={real} onChange={setReal} testID={`expense-real-${expense.id}`} />
              <View style={{ flexDirection: "row", gap: spacing.sm, marginTop: spacing.sm }}>
                <PrimaryButton label="Annuler" variant="ghost" onPress={() => setValidating(false)} />
                <View style={{ flex: 1 }}>
                  <PrimaryButton
                    label="Valider"
                    testID={`expense-validate-${expense.id}`}
                    onPress={() => { haptic.success(); store.validateExpense(patchId, expense.id, real); setValidating(false); toast("Dépense effectuée", "success"); }}
                  />
                </View>
              </View>
            </View>
          ) : null}
        </>
      )}
    </View>
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
  validateBox: {
    marginTop: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: c.success,
    backgroundColor: c.surfaceSecondary,
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
