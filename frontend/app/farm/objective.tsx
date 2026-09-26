import { useLocalSearchParams, useRouter } from "expo-router";
import { Check, X } from "phosphor-react-native";
import React, { useMemo, useState } from "react";
import { Pressable, ScrollView, TextInput, useWindowDimensions, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AgentPortrait } from "@/src/components/AgentPortrait";
import { AppText, Chip, PrimaryButton, haptic, useToast } from "@/src/components/ui";
import { useStore } from "@/src/store/AppStore";
import { presetSummary } from "@/src/store/farmEngine";
import { fonts, makeStyles, radius, spacing, useTheme } from "@/src/theme";

export default function ObjectiveScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors } = useTheme();
  const styles = useStyles();
  const toast = useToast();
  const store = useStore();
  const { state } = store;
  const { width } = useWindowDimensions();
  const params = useLocalSearchParams<{ id?: string }>();

  const existing = params.id ? state.objectives.find((o) => o.id === params.id) : undefined;

  const [agentId, setAgentId] = useState<string>(existing?.agentId ?? "");
  const [presetId, setPresetId] = useState<string>(existing?.presetId ?? state.presets[0]?.id ?? "");
  const [targetDate, setTargetDate] = useState<string>(existing?.targetDate ?? "");
  const [query, setQuery] = useState("");

  const cols = width >= 700 ? 5 : 4;
  const size = (width - spacing.lg * 2 - spacing.sm * (cols - 1)) / cols;

  const agents = useMemo(
    () => state.agents.filter((a) => !query || a.name.toLowerCase().includes(query.toLowerCase())),
    [state.agents, query],
  );

  const canSave = !!agentId && !!presetId;

  const save = () => {
    if (!canSave) return;
    if (existing) {
      store.updateObjective(existing.id, { agentId, presetId, targetDate });
      toast("Objectif modifié", "success");
    } else {
      store.addObjective({ agentId, presetId, targetDate, ownedSpecific: {} });
      toast("Objectif ajouté", "success");
    }
    router.back();
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.surface }}>
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <Pressable testID="close-objective" onPress={() => router.back()} style={styles.closeBtn} hitSlop={10}>
          <X size={20} color={colors.onSurface} weight="bold" />
        </Pressable>
        <AppText variant="title">{existing ? "MODIFIER L'OBJECTIF" : "NOUVEL OBJECTIF"}</AppText>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ padding: spacing.lg, gap: spacing.lg, paddingBottom: insets.bottom + 120 }}
      >
        <View>
          <AppText variant="label" color={colors.muted} style={{ marginBottom: spacing.sm }}>1 · PERSONNAGE</AppText>
          <TextInput
            testID="objective-search"
            value={query}
            onChangeText={setQuery}
            placeholder="Rechercher"
            placeholderTextColor={colors.muted}
            style={styles.search}
          />
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, marginTop: spacing.md }}>
            {agents.map((a) => (
              <View key={a.id} style={{ width: size, opacity: agentId && agentId !== a.id ? 0.5 : 1 }}>
                <AgentPortrait agent={a} size={size} onPress={() => { haptic.select(); setAgentId(a.id); }} />
                {agentId === a.id ? (
                  <View style={styles.selectedTick}>
                    <Check size={14} color={colors.onBrandPrimary} weight="bold" />
                  </View>
                ) : null}
              </View>
            ))}
          </View>
        </View>

        <View>
          <AppText variant="label" color={colors.muted} style={{ marginBottom: spacing.sm }}>2 · PRESET DE MONTÉE</AppText>
          <View style={{ gap: spacing.sm }}>
            {state.presets.map((p) => (
              <Pressable
                key={p.id}
                testID={`preset-pick-${p.id}`}
                onPress={() => { haptic.select(); setPresetId(p.id); }}
                style={[styles.presetPick, presetId === p.id && styles.presetPickActive]}
              >
                <View style={{ flex: 1 }}>
                  <AppText variant="subtitle" color={presetId === p.id ? colors.brandPrimary : colors.onSurface}>{p.name}</AppText>
                  <AppText variant="caption" color={colors.muted}>{presetSummary(p)}</AppText>
                </View>
                {presetId === p.id ? <Check size={20} color={colors.brandPrimary} weight="bold" /> : null}
              </Pressable>
            ))}
          </View>
        </View>

        <View>
          <AppText variant="label" color={colors.muted} style={{ marginBottom: spacing.sm }}>3 · DATE CIBLE (OPTIONNEL)</AppText>
          <TextInput
            testID="objective-date"
            value={targetDate}
            onChangeText={setTargetDate}
            placeholder="AAAA-MM-JJ"
            placeholderTextColor={colors.muted}
            style={styles.search}
          />
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + spacing.md }]}>
        <PrimaryButton label={existing ? "ENREGISTRER" : "AJOUTER L'OBJECTIF"} onPress={save} disabled={!canSave} testID="save-objective-button" />
      </View>
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
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    backgroundColor: c.surfaceTertiary,
    alignItems: "center",
    justifyContent: "center",
  },
  search: {
    fontFamily: fonts.body,
    fontSize: 15,
    color: c.onSurface,
    backgroundColor: c.surfaceSecondary,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: c.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  selectedTick: {
    position: "absolute",
    top: -4,
    right: -4,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: c.brandPrimary,
    alignItems: "center",
    justifyContent: "center",
  },
  presetPick: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: c.surfaceSecondary,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: c.border,
    padding: spacing.md,
  },
  presetPickActive: { borderColor: c.brandPrimary, borderWidth: 2 },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    backgroundColor: c.surface,
    borderTopWidth: 1,
    borderTopColor: c.border,
  },
}));
