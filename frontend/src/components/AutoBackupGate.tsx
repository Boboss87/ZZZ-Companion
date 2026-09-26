import { CloudArrowUp } from "phosphor-react-native";
import React, { useEffect, useRef, useState } from "react";
import { AppState as RNAppState, AppStateStatus, View } from "react-native";

import { useStore } from "@/src/store/AppStore";
import { exportBackup } from "@/src/store/backup";
import { spacing, useTheme } from "@/src/theme";
import { BottomSheet } from "./BottomSheet";
import { AppText, PrimaryButton, useToast } from "./ui";

export function AutoBackupGate() {
  const { colors } = useTheme();
  const toast = useToast();
  const store = useStore();
  const { state, dirty, markExported } = store;
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const appStateRef = useRef<AppStateStatus>(RNAppState.currentState);

  useEffect(() => {
    const sub = RNAppState.addEventListener("change", (next: AppStateStatus) => {
      const prev = appStateRef.current;
      appStateRef.current = next;
      const cameToForeground = /inactive|background/.test(prev) && next === "active";
      if (cameToForeground && state.settings.autoBackup && dirty) {
        setShow(true);
      }
    });
    return () => sub.remove();
  }, [state.settings.autoBackup, dirty]);

  const doExport = async () => {
    setBusy(true);
    const res = await exportBackup(state);
    setBusy(false);
    if (res.ok) markExported();
    toast(res.message, res.ok ? "success" : "error");
    setShow(false);
  };

  return (
    <BottomSheet visible={show} onClose={() => setShow(false)} title="Sauvegarde recommandée" scroll={false}>
      <View style={{ alignItems: "center", gap: spacing.sm, paddingVertical: spacing.sm }}>
        <CloudArrowUp size={40} color={colors.brandPrimary} weight="fill" />
        <AppText variant="body" color={colors.onSurfaceSecondary} style={{ textAlign: "center" }}>
          Tu as des modifications non sauvegardées. Enregistre une copie de tes données pour ne jamais rien perdre.
        </AppText>
      </View>
      <PrimaryButton label="SAUVEGARDER MAINTENANT" onPress={doExport} disabled={busy} testID="autobackup-save" />
      <PrimaryButton label="PLUS TARD" variant="ghost" onPress={() => setShow(false)} testID="autobackup-later" />
    </BottomSheet>
  );
}
