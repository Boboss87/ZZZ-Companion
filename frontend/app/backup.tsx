import { useRouter } from "expo-router";
import { CaretLeft, DownloadSimple, Export, Warning } from "phosphor-react-native";
import React, { useState } from "react";
import { Pressable, ScrollView, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { BottomSheet } from "@/src/components/BottomSheet";
import { AppText, Card, PrimaryButton, haptic, useToast } from "@/src/components/ui";
import { useStore } from "@/src/store/AppStore";
import { exportBackup, importBackup } from "@/src/store/backup";
import { makeStyles, radius, spacing, useTheme } from "@/src/theme";

export default function BackupScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors } = useTheme();
  const styles = useStyles();
  const toast = useToast();
  const store = useStore();

  const [busy, setBusy] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);

  const doExport = async () => {
    setBusy(true);
    const res = await exportBackup(store.state);
    setBusy(false);
    toast(res.message, res.ok ? "success" : "error");
  };

  const doImport = async () => {
    setBusy(true);
    const res = await importBackup();
    setBusy(false);
    if (res.ok && res.state) {
      store.replaceState(res.state);
      toast(res.message, "success");
    } else {
      toast(res.message, res.message === "Import annulé." ? "info" : "error");
    }
  };

  const doReset = () => {
    store.resetState();
    setConfirmReset(false);
    toast("Données réinitialisées", "info");
  };

  const counts = {
    agents: store.state.agents.length,
    objectifs: store.state.objectives.length,
    presets: store.state.presets.length,
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.surface }}>
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <Pressable testID="backup-back" onPress={() => router.back()} style={styles.iconBtn} hitSlop={10}>
          <CaretLeft size={20} color={colors.onSurface} weight="bold" />
        </Pressable>
        <AppText variant="title">SAUVEGARDE</AppText>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: spacing.lg, gap: spacing.md, paddingBottom: insets.bottom + spacing.xxl }}>
        <Card>
          <AppText variant="subtitle" style={{ marginBottom: spacing.sm }}>Contenu actuel</AppText>
          <Row label="Agents" value={`${counts.agents}`} />
          <Row label="Objectifs de farm" value={`${counts.objectifs}`} />
          <Row label="Presets" value={`${counts.presets}`} />
          <AppText variant="caption" color={colors.muted} style={{ marginTop: spacing.sm }}>
            Toutes tes données tiennent dans un seul fichier .json. Enregistre-le sur ton Drive via le menu de partage.
          </AppText>
        </Card>

        <Pressable testID="export-button" onPress={() => { haptic.light(); doExport(); }} disabled={busy} style={[styles.bigBtn, { backgroundColor: colors.brandPrimary }]}>
          <Export size={22} color={colors.onBrandPrimary} weight="bold" />
          <AppText variant="title" color={colors.onBrandPrimary}>EXPORTER / SAUVEGARDER</AppText>
        </Pressable>

        <Pressable testID="import-button" onPress={() => { haptic.light(); doImport(); }} disabled={busy} style={[styles.bigBtn, { backgroundColor: colors.surfaceSecondary, borderWidth: 1, borderColor: colors.border }]}>
          <DownloadSimple size={22} color={colors.onSurface} weight="bold" />
          <AppText variant="title">IMPORTER UNE SAUVEGARDE</AppText>
        </Pressable>

        <Pressable testID="reset-button" onPress={() => { haptic.light(); setConfirmReset(true); }} style={[styles.bigBtn, { borderWidth: 1, borderColor: colors.error }]}>
          <Warning size={20} color={colors.error} weight="bold" />
          <AppText variant="title" color={colors.error}>RÉINITIALISER LES DONNÉES</AppText>
        </Pressable>
      </ScrollView>

      <BottomSheet visible={confirmReset} onClose={() => setConfirmReset(false)} title="Réinitialiser ?" scroll={false}>
        <AppText variant="body" color={colors.onSurfaceSecondary}>
          Toutes tes données seront remplacées par les données d'exemple. Cette action est irréversible — pense à exporter avant.
        </AppText>
        <PrimaryButton label="OUI, RÉINITIALISER" variant="danger" onPress={doReset} testID="confirm-reset-button" />
        <PrimaryButton label="ANNULER" variant="ghost" onPress={() => setConfirmReset(false)} />
      </BottomSheet>
    </View>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  const { colors } = useTheme();
  return (
    <View style={{ flexDirection: "row", justifyContent: "space-between", paddingVertical: 4 }}>
      <AppText variant="body" color={colors.muted}>{label}</AppText>
      <AppText variant="body">{value}</AppText>
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
  bigBtn: {
    flexDirection: "row",
    gap: spacing.md,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.xl,
    borderRadius: radius.md,
  },
}));
