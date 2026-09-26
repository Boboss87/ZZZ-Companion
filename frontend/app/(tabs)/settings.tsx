import { useRouter } from "expo-router";
import {
  BatteryHigh,
  CaretRight,
  FloppyDisk,
  Lightning,
  PencilSimple,
  Plus,
  Trash,
  TrendUp,
} from "phosphor-react-native";
import React, { useState } from "react";
import { Pressable, ScrollView, Switch, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { BottomSheet } from "@/src/components/BottomSheet";
import {
  AppText,
  Card,
  Chip,
  Loading,
  PrimaryButton,
  Stepper,
  haptic,
  useToast,
} from "@/src/components/ui";
import { genId, useStore } from "@/src/store/AppStore";
import { batteryDays, getFarmEnergy, presetSummary } from "@/src/store/farmEngine";
import { Preset } from "@/src/store/types";
import { fonts, makeStyles, radius, spacing, useTheme } from "@/src/theme";

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors } = useTheme();
  const styles = useStyles();
  const toast = useToast();
  const store = useStore();
  const { state, ready } = store;

  const [editing, setEditing] = useState<Preset | null>(null);

  if (!ready) return <Loading />;

  const s = state.settings;
  const farmEnergy = getFarmEnergy(s);

  const newPreset = () => {
    setEditing({
      id: genId("preset"),
      name: "Nouveau preset",
      charLevel: 60,
      engineLevel: 60,
      basic: 11,
      ex: 12,
      ultimate: 11,
      dodge: 6,
      assist: 6,
      coreSkill: "F",
    });
  };

  const savePreset = (p: Preset) => {
    const exists = state.presets.some((x) => x.id === p.id);
    if (exists) store.updatePreset(p.id, p);
    else store.addPreset(p);
    setEditing(null);
    toast("Preset enregistré", "success");
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.surface }}>
      <View style={{ paddingTop: insets.top + spacing.md, paddingHorizontal: spacing.lg, paddingBottom: spacing.sm }}>
        <AppText variant="display">RÉGLAGES</AppText>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: spacing.lg, paddingTop: spacing.sm, gap: spacing.md, paddingBottom: spacing.xxl }}
      >
        {/* Energy */}
        <Card>
          <View style={styles.cardHead}>
            <Lightning size={18} color={colors.brandPrimary} weight="fill" />
            <AppText variant="subtitle">Gestion de l'énergie</AppText>
          </View>

          <SettingRow label="Énergie quotidienne">
            <Stepper value={s.dailyEnergy} onChange={(v) => store.setSettings({ dailyEnergy: v })} step={10} />
          </SettingRow>
          <SettingRow label="Nettoyages de Discs / jour" hint="60 énergie chacun">
            <Stepper value={s.discRuns} onChange={(v) => store.setSettings({ discRuns: v })} step={1} />
          </SettingRow>
          <View style={styles.toggleRow}>
            <View style={{ flex: 1 }}>
              <AppText variant="body">Réserver une batterie quotidienne</AppText>
              <AppText variant="caption" color={colors.muted}>Met de côté 60 énergie</AppText>
            </View>
            <Switch
              testID="reserve-battery-switch"
              value={s.reserveDailyBattery}
              onValueChange={(v) => { haptic.select(); store.setSettings({ reserveDailyBattery: v }); }}
              trackColor={{ true: colors.brandPrimary, false: colors.surfaceTertiary }}
              thumbColor={colors.onSurface}
            />
          </View>
          <View style={styles.result}>
            <AppText variant="label" color={colors.muted}>ÉNERGIE DISPO POUR LE FARM</AppText>
            <AppText style={{ fontFamily: fonts.display, fontSize: 28, color: colors.brandPrimary }}>{farmEnergy}</AppText>
          </View>
        </Card>

        {/* Batteries */}
        <Card>
          <View style={styles.cardHead}>
            <BatteryHigh size={18} color={colors.success} weight="bold" />
            <AppText variant="subtitle">Batteries de secours</AppText>
          </View>
          <SettingRow label="Batteries en stock" hint={`≈ ${batteryDays(s)} jours de farm`}>
            <Stepper value={s.backupBatteries} onChange={(v) => store.setSettings({ backupBatteries: v })} step={1} />
          </SettingRow>
          <AppText variant="caption" color={colors.muted}>
            Information uniquement : jamais intégrée automatiquement dans les calculs.
          </AppText>
        </Card>

        {/* Presets */}
        <Card>
          <View style={[styles.cardHead, { justifyContent: "space-between" }]}>
            <View style={{ flexDirection: "row", gap: spacing.sm, alignItems: "center" }}>
              <FloppyDisk size={18} color={colors.brandPrimary} weight="fill" />
              <AppText variant="subtitle">Presets de montée</AppText>
            </View>
            <Pressable testID="add-preset-button" onPress={() => { haptic.light(); newPreset(); }} style={styles.miniBtn}>
              <Plus size={18} color={colors.onBrandPrimary} weight="bold" />
            </Pressable>
          </View>
          <View style={{ gap: spacing.sm }}>
            {state.presets.map((p) => (
              <View key={p.id} style={styles.presetRow} testID={`preset-row-${p.id}`}>
                <View style={{ flex: 1 }}>
                  <AppText variant="body">{p.name}</AppText>
                  <AppText variant="caption" color={colors.muted}>{presetSummary(p)}</AppText>
                </View>
                <Pressable testID={`preset-edit-${p.id}`} onPress={() => { haptic.light(); setEditing(p); }} style={styles.rowBtn}>
                  <PencilSimple size={16} color={colors.onSurface} />
                </Pressable>
                <Pressable testID={`preset-delete-${p.id}`} onPress={() => { haptic.light(); store.deletePreset(p.id); }} style={[styles.rowBtn, { borderColor: colors.error }]}>
                  <Trash size={16} color={colors.error} />
                </Pressable>
              </View>
            ))}
          </View>
        </Card>

        {/* Projection & pulls */}
        <Card>
          <View style={styles.cardHead}>
            <TrendUp size={18} color={colors.info} weight="bold" />
            <AppText variant="subtitle">Projection & pulls</AppText>
          </View>
          <SettingRow label="Durée d'un patch (jours)">
            <Stepper value={s.patchDurationDays} onChange={(v) => store.setSettings({ patchDurationDays: Math.max(1, v) })} step={7} min={1} />
          </SettingRow>
          <SettingRow label="Coût moyen perso souhaité" hint="tickets — auto via l'historique si dispo">
            <Stepper value={s.avgDesiredCost} onChange={(v) => store.setSettings({ avgDesiredCost: v })} step={5} min={1} />
          </SettingRow>
          <AppText variant="label" color={colors.muted} style={{ marginTop: spacing.md, marginBottom: spacing.xs }}>
            REVENUS PERMANENTS (tickets / patch)
          </AppText>
          <View style={{ gap: spacing.sm }}>
            {state.permanentIncomes.map((inc) => (
              <View key={inc.id} style={styles.incomeCard} testID={`income-row-${inc.id}`}>
                <TextInput
                  value={inc.name}
                  onChangeText={(t) => store.updatePermanentIncome(inc.id, { name: t })}
                  placeholderTextColor={colors.muted}
                  style={styles.incomeInput}
                />
                <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: spacing.sm }}>
                  <Stepper value={inc.pullsPerPatch} onChange={(v) => store.updatePermanentIncome(inc.id, { pullsPerPatch: v })} step={2} />
                  <Pressable testID={`income-delete-${inc.id}`} onPress={() => { haptic.light(); store.deletePermanentIncome(inc.id); }} style={[styles.rowBtn, { borderColor: colors.error }]}>
                    <Trash size={16} color={colors.error} />
                  </Pressable>
                </View>
              </View>
            ))}
          </View>
          <Pressable
            testID="add-income-button"
            onPress={() => { haptic.light(); store.addPermanentIncome({ name: "Nouvelle source", pullsPerPatch: 10 }); }}
            style={styles.addRow}
          >
            <Plus size={16} color={colors.brandPrimary} weight="bold" />
            <AppText variant="label" color={colors.brandPrimary}>AJOUTER UNE SOURCE</AppText>
          </Pressable>
        </Card>

        {/* Backup */}
        <Card onPress={() => router.push("/backup")} testID="settings-backup-card">
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
            <View>
              <AppText variant="subtitle">Sauvegarde & données</AppText>
              <AppText variant="caption" color={colors.muted}>Exporter / importer un fichier unique</AppText>
            </View>
            <CaretRight size={18} color={colors.muted} />
          </View>
        </Card>

        <Card>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <View style={{ flex: 1, paddingRight: spacing.md }}>
              <AppText variant="body">Sauvegarde auto</AppText>
              <AppText variant="caption" color={colors.muted}>
                Te propose d'exporter tes données en revenant dans l'app après des modifications
              </AppText>
            </View>
            <Switch
              testID="autobackup-switch"
              value={s.autoBackup}
              onValueChange={(v) => { haptic.select(); store.setSettings({ autoBackup: v }); }}
              trackColor={{ true: colors.brandPrimary, false: colors.surfaceTertiary }}
              thumbColor={colors.onSurface}
            />
          </View>
        </Card>

        {/* Appearance + info */}
        <Card>
          <AppText variant="subtitle" style={{ marginBottom: spacing.sm }}>Apparence</AppText>
          <View style={{ flexDirection: "row", gap: spacing.sm }}>
            <Chip label="Système" selected={s.themeMode === "system"} onPress={() => store.setSettings({ themeMode: "system" })} testID="theme-system" />
            <Chip label="Clair" selected={s.themeMode === "light"} onPress={() => store.setSettings({ themeMode: "light" })} testID="theme-light" />
            <Chip label="Sombre" selected={s.themeMode === "dark"} onPress={() => store.setSettings({ themeMode: "dark" })} testID="theme-dark" />
          </View>
          <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: spacing.md }}>
            <AppText variant="body" color={colors.muted}>Version</AppText>
            <AppText variant="body">1.1.0 · 100% local</AppText>
          </View>
        </Card>
      </ScrollView>

      <PresetSheet editing={editing} onClose={() => setEditing(null)} onSave={savePreset} />
    </View>
  );
}

function SettingRow({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  const { colors } = useTheme();
  return (
    <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: spacing.md }}>
      <View style={{ flex: 1, paddingRight: spacing.md }}>
        <AppText variant="body">{label}</AppText>
        {hint ? <AppText variant="caption" color={colors.muted}>{hint}</AppText> : null}
      </View>
      {children}
    </View>
  );
}

function PresetSheet({
  editing,
  onClose,
  onSave,
}: {
  editing: Preset | null;
  onClose: () => void;
  onSave: (p: Preset) => void;
}) {
  const { colors } = useTheme();
  const styles = useStyles();
  const [draft, setDraft] = useState<Preset | null>(editing);

  React.useEffect(() => setDraft(editing), [editing]);

  if (!draft) return null;
  const set = (partial: Partial<Preset>) => setDraft({ ...draft, ...partial });

  return (
    <BottomSheet visible={!!editing} onClose={onClose} title="Preset de montée">
      <View style={styles.presetInputWrap}>
        <AppText variant="label" color={colors.muted}>NOM</AppText>
        <TextInput
          testID="preset-name-input"
          value={draft.name}
          onChangeText={(t) => set({ name: t })}
          placeholderTextColor={colors.muted}
          style={styles.presetInput}
        />
      </View>

      <PresetStepRow label="Niveau perso" value={draft.charLevel} onChange={(v) => set({ charLevel: v })} step={10} />
      <PresetStepRow label="Niveau moteur" value={draft.engineLevel} onChange={(v) => set({ engineLevel: v })} step={10} />
      <PresetStepRow label="Basic" value={draft.basic} onChange={(v) => set({ basic: Math.min(12, v) })} />
      <PresetStepRow label="EX (Special)" value={draft.ex} onChange={(v) => set({ ex: Math.min(12, v) })} />
      <PresetStepRow label="Ultimate (Chain)" value={draft.ultimate} onChange={(v) => set({ ultimate: Math.min(12, v) })} />
      <PresetStepRow label="Dodge" value={draft.dodge} onChange={(v) => set({ dodge: Math.min(12, v) })} />
      <PresetStepRow label="Assist" value={draft.assist} onChange={(v) => set({ assist: Math.min(12, v) })} />

      <AppText variant="label" color={colors.muted}>CORE SKILL</AppText>
      <View style={{ flexDirection: "row", gap: spacing.sm, flexWrap: "wrap" }}>
        {["A", "B", "C", "D", "E", "F"].map((r) => (
          <Chip key={r} label={r} selected={draft.coreSkill === r} onPress={() => set({ coreSkill: r })} testID={`core-${r}`} />
        ))}
      </View>

      <PrimaryButton label="ENREGISTRER LE PRESET" onPress={() => onSave(draft)} testID="save-preset-button" />
    </BottomSheet>
  );
}

function PresetStepRow({ label, value, onChange, step = 1 }: { label: string; value: number; onChange: (v: number) => void; step?: number }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
      <AppText variant="body">{label}</AppText>
      <Stepper value={value} onChange={onChange} step={step} min={1} />
    </View>
  );
}

const useStyles = makeStyles((c) => ({
  cardHead: { flexDirection: "row", gap: spacing.sm, alignItems: "center", marginBottom: spacing.xs },
  toggleRow: { flexDirection: "row", alignItems: "center", marginTop: spacing.md },
  result: {
    marginTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: c.border,
    paddingTop: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  miniBtn: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    backgroundColor: c.brandPrimary,
    alignItems: "center",
    justifyContent: "center",
  },
  presetRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: c.surfaceTertiary,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: c.border,
    padding: spacing.md,
  },
  rowBtn: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: c.border,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: c.surfaceSecondary,
  },
  presetInputWrap: { gap: spacing.xs },
  presetInput: {
    fontFamily: fonts.body,
    fontSize: 16,
    color: c.onSurface,
    backgroundColor: c.surfaceTertiary,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: c.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  incomeCard: {
    backgroundColor: c.surfaceTertiary,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: c.border,
    padding: spacing.md,
  },
  incomeInput: {
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
  addRow: {
    flexDirection: "row",
    gap: spacing.sm,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.md,
    marginTop: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: c.brandPrimary,
    borderStyle: "dashed",
  },
}));
