import { useRouter } from "expo-router";
import {
  ArrowDown,
  ArrowUp,
  Barbell,
  PencilSimple,
  Plus,
  Trash,
} from "phosphor-react-native";
import React, { useMemo, useState } from "react";
import { Pressable, ScrollView, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AgentPortrait } from "@/src/components/AgentPortrait";
import { BottomSheet } from "@/src/components/BottomSheet";
import {
  AppText,
  Badge,
  Card,
  Chip,
  EmptyState,
  Loading,
  PrimaryButton,
  ProgressBar,
  Stepper,
  haptic,
  useToast,
} from "@/src/components/ui";
import { useStore } from "@/src/store/AppStore";
import { COMMON_MATERIALS } from "@/src/store/gameData";
import { computeFarm, fmtDays, fmtQty, presetSummary } from "@/src/store/farmEngine";
import { fonts, makeStyles, radius, spacing, useTheme } from "@/src/theme";

const STEP_BY_TYPE: Record<string, number> = {
  dennies: 10000,
  logs: 10,
  power: 10,
  hamster: 5,
  promo: 1,
  skillMat: 1,
  boss: 1,
};

interface StockTarget {
  kind: "common" | "specific";
  materialId: string;
  name: string;
  type: string;
  objectiveId?: string;
  current: number;
}

export default function FarmScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors } = useTheme();
  const styles = useStyles();
  const toast = useToast();
  const store = useStore();
  const { state, ready } = store;

  const [tab, setTab] = useState<"list" | "objectives">("list");
  const [target, setTarget] = useState<StockTarget | null>(null);
  const [draft, setDraft] = useState(0);

  const farm = useMemo(() => computeFarm(state), [state]);

  if (!ready) return <Loading />;

  const openCommon = (materialId: string, name: string, type: string) => {
    setTarget({ kind: "common", materialId, name, type, current: state.commonStock[materialId] ?? 0 });
    setDraft(state.commonStock[materialId] ?? 0);
  };
  const openSpecific = (objectiveId: string, materialId: string, name: string, type: string) => {
    const obj = state.objectives.find((o) => o.id === objectiveId);
    const cur = obj?.ownedSpecific[materialId] ?? 0;
    setTarget({ kind: "specific", materialId, name, type, objectiveId, current: cur });
    setDraft(cur);
  };
  const saveStock = () => {
    if (!target) return;
    if (target.kind === "common") store.setCommonStock(target.materialId, draft);
    else if (target.objectiveId) store.setObjectiveSpecific(target.objectiveId, target.materialId, draft);
    setTarget(null);
    toast("Stock mis à jour", "success");
  };

  const step = target ? STEP_BY_TYPE[target.type] ?? 1 : 1;

  return (
    <View style={{ flex: 1, backgroundColor: colors.surface }}>
      {/* header */}
      <View style={{ paddingTop: insets.top + spacing.md, paddingHorizontal: spacing.lg }}>
        <AppText variant="display">ASSISTANT DE FARM</AppText>
        <View style={styles.segment}>
          <SegBtn label="LISTE DE FARM" active={tab === "list"} onPress={() => setTab("list")} />
          <SegBtn label="OBJECTIFS" active={tab === "objectives"} onPress={() => setTab("objectives")} />
        </View>
      </View>

      {tab === "list" ? (
        <FarmList
          rows={farm.rows}
          onCommon={openCommon}
          onSpecific={openSpecific}
          onManageCommon={() => setTab("list")}
        />
      ) : (
        <ObjectivesList farmStatuses={farm.statuses} />
      )}

      {/* sticky footer */}
      <View style={[styles.footer, { paddingBottom: spacing.md }]}>
        {tab === "list" ? (
          <View style={{ flexDirection: "row", gap: spacing.sm }}>
            {COMMON_MATERIALS.map((m) => (
              <Pressable
                key={m.id}
                testID={`common-stock-${m.id}`}
                onPress={() => openCommon(m.id, m.name, m.type)}
                style={styles.commonPill}
              >
                <AppText variant="caption" color={colors.muted} numberOfLines={1}>
                  {m.name.split(" ")[0]}
                </AppText>
                <AppText style={{ fontFamily: fonts.display, fontSize: 18, color: colors.brandPrimary }}>
                  {fmtQty(state.commonStock[m.id] ?? 0)}
                </AppText>
              </Pressable>
            ))}
          </View>
        ) : (
          <PrimaryButton
            label="+ AJOUTER UN OBJECTIF"
            onPress={() => router.push("/farm/objective")}
            testID="add-objective-button"
          />
        )}
      </View>

      {/* stock update sheet */}
      <BottomSheet visible={!!target} onClose={() => setTarget(null)} title="Mettre à jour le stock" scroll={false}>
        {target ? (
          <>
            <AppText variant="subtitle">{target.name}</AppText>
            <AppText variant="caption" color={colors.muted}>
              Indique ton stock actuel. Les besoins seront recalculés automatiquement.
            </AppText>
            <View style={{ alignItems: "center", marginVertical: spacing.md }}>
              <Stepper value={draft} onChange={setDraft} step={step} />
            </View>
            <View style={styles.inputRow}>
              <AppText variant="label" color={colors.muted}>VALEUR EXACTE</AppText>
              <TextInput
                testID="stock-input"
                value={`${draft}`}
                onChangeText={(t) => setDraft(Math.max(0, parseInt(t.replace(/[^0-9]/g, "") || "0", 10)))}
                keyboardType="number-pad"
                style={styles.input}
                placeholderTextColor={colors.muted}
              />
            </View>
            <PrimaryButton label="ENREGISTRER" onPress={saveStock} testID="save-stock-button" />
          </>
        ) : null}
      </BottomSheet>
    </View>
  );
}

function FarmList({
  rows,
  onCommon,
  onSpecific,
}: {
  rows: ReturnType<typeof computeFarm>["rows"];
  onCommon: (id: string, name: string, type: string) => void;
  onSpecific: (objId: string, id: string, name: string, type: string) => void;
  onManageCommon: () => void;
}) {
  const { colors } = useTheme();
  const styles = useStyles();

  if (rows.length === 0) {
    return (
      <EmptyState
        icon={<Barbell size={48} color={colors.brandPrimary} weight="fill" />}
        title="AUCUN FARM EN COURS"
        subtitle="Tous tes objectifs sont complets, ou tu n'as pas encore d'objectif. Ajoute un personnage à préparer."
      />
    );
  }

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ padding: spacing.lg, paddingTop: spacing.sm, gap: spacing.sm, paddingBottom: 140 }}
    >
      {rows.map((r) => (
        <Pressable
          key={r.key}
          testID={`farm-row-${r.key}`}
          onPress={() =>
            r.type === "dennies" || r.type === "logs" || r.type === "power" || r.type === "hamster"
              ? onCommon(r.materialId, r.materialName, r.type)
              : onSpecific(r.objectiveId, r.materialId, r.materialName, r.type)
          }
          style={[styles.farmRow, r.priority === 0 && styles.farmRowTop]}
        >
          <View style={{ flex: 1 }}>
            <AppText variant="subtitle" numberOfLines={1}>{r.materialName}</AppText>
            <AppText variant="caption" color={colors.muted}>Pour {r.agentName}</AppText>
          </View>
          <View style={{ alignItems: "flex-end" }}>
            <AppText style={{ fontFamily: fonts.display, fontSize: 22, color: colors.brandPrimary }}>
              {fmtQty(r.remaining)}
            </AppText>
            <AppText variant="caption" color={colors.muted}>{fmtDays(r.days)}</AppText>
          </View>
        </Pressable>
      ))}
    </ScrollView>
  );
}

function ObjectivesList({ farmStatuses }: { farmStatuses: ReturnType<typeof computeFarm>["statuses"] }) {
  const { colors } = useTheme();
  const router = useRouter();
  const store = useStore();
  const { state } = store;
  const toast = useToast();

  if (state.objectives.length === 0) {
    return (
      <EmptyState
        icon={<Barbell size={48} color={colors.brandPrimary} weight="fill" />}
        title="AUCUN OBJECTIF"
        subtitle="Ajoute un personnage à préparer avant sa sortie."
      />
    );
  }

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ padding: spacing.lg, paddingTop: spacing.sm, gap: spacing.md, paddingBottom: 140 }}
    >
      {state.objectives.map((obj, index) => {
        const status = farmStatuses.find((s) => s.objectiveId === obj.id);
        const agent = status?.agent;
        const preset = status?.preset;
        if (!agent || !preset) return null;
        return (
          <Card key={obj.id} testID={`objective-card-${obj.id}`}>
            <View style={{ flexDirection: "row", gap: spacing.md }}>
              <AgentPortrait agent={agent} size={56} onPress={() => router.push(`/agent/${agent.id}`)} />
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
                  <Badge label={`#${index + 1}`} bg={colors.brandPrimary} fg={colors.onBrandPrimary} />
                  <AppText variant="subtitle" numberOfLines={1} style={{ flex: 1 }}>{agent.name}</AppText>
                  {status?.complete ? <Badge label="TERMINÉ" bg={colors.success} fg={colors.onSuccess} /> : null}
                </View>
                <AppText variant="caption" color={colors.muted}>{preset.name} · {presetSummary(preset)}</AppText>
                {obj.targetDate ? (
                  <AppText variant="caption" color={colors.info}>Cible : {obj.targetDate}</AppText>
                ) : null}
                <View style={{ marginTop: spacing.sm, gap: 4 }}>
                  <ProgressBar value={status?.progress ?? 0} height={6} color={status?.complete ? colors.success : colors.brandPrimary} />
                  <AppText variant="caption" color={colors.muted}>
                    {Math.round((status?.progress ?? 0) * 100)}% · reste {fmtDays(status?.daysLeft ?? 0)}
                  </AppText>
                </View>
              </View>
            </View>

            <View style={{ flexDirection: "row", gap: spacing.sm, marginTop: spacing.md }}>
              <IconBtn testID={`obj-up-${obj.id}`} disabled={index === 0} onPress={() => store.moveObjective(obj.id, -1)}>
                <ArrowUp size={18} color={index === 0 ? colors.muted : colors.onSurface} />
              </IconBtn>
              <IconBtn testID={`obj-down-${obj.id}`} disabled={index === state.objectives.length - 1} onPress={() => store.moveObjective(obj.id, 1)}>
                <ArrowDown size={18} color={index === state.objectives.length - 1 ? colors.muted : colors.onSurface} />
              </IconBtn>
              <IconBtn testID={`obj-edit-${obj.id}`} onPress={() => router.push(`/farm/objective?id=${obj.id}`)} flex>
                <PencilSimple size={18} color={colors.onSurface} />
                <AppText variant="label">MODIFIER</AppText>
              </IconBtn>
              <IconBtn testID={`obj-delete-${obj.id}`} onPress={() => { store.deleteObjective(obj.id); toast("Objectif supprimé", "info"); }} danger>
                <Trash size={18} color={colors.error} />
              </IconBtn>
            </View>
          </Card>
        );
      })}
    </ScrollView>
  );
}

function IconBtn({
  children,
  onPress,
  disabled,
  danger,
  flex,
  testID,
}: {
  children: React.ReactNode;
  onPress: () => void;
  disabled?: boolean;
  danger?: boolean;
  flex?: boolean;
  testID?: string;
}) {
  const { colors } = useTheme();
  return (
    <Pressable
      testID={testID}
      disabled={disabled}
      onPress={() => { haptic.light(); onPress(); }}
      style={({ pressed }) => ({
        height: 44,
        minWidth: 44,
        flex: flex ? 1 : undefined,
        paddingHorizontal: spacing.md,
        flexDirection: "row",
        gap: 6,
        alignItems: "center",
        justifyContent: "center",
        borderRadius: radius.md,
        borderWidth: 1,
        borderColor: danger ? colors.error : colors.border,
        backgroundColor: colors.surfaceTertiary,
        opacity: disabled ? 0.4 : pressed ? 0.8 : 1,
      })}
    >
      {children}
    </Pressable>
  );
}

function SegBtn({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={() => { haptic.select(); onPress(); }}
      style={{
        flex: 1,
        height: 40,
        alignItems: "center",
        justifyContent: "center",
        borderRadius: radius.sm,
        backgroundColor: active ? colors.brandPrimary : "transparent",
      }}
    >
      <AppText variant="label" color={active ? colors.onBrandPrimary : colors.muted}>{label}</AppText>
    </Pressable>
  );
}

const useStyles = makeStyles((c) => ({
  segment: {
    flexDirection: "row",
    backgroundColor: c.surfaceSecondary,
    borderRadius: radius.md,
    padding: 4,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: c.border,
  },
  farmRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: c.surfaceSecondary,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: c.border,
    borderLeftWidth: 3,
    borderLeftColor: c.border,
    padding: spacing.md,
    gap: spacing.md,
  },
  farmRowTop: { borderLeftColor: c.brandPrimary, borderLeftWidth: 4 },
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
  commonPill: {
    flex: 1,
    backgroundColor: c.surfaceTertiary,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: c.border,
    paddingVertical: spacing.sm,
    alignItems: "center",
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: c.surfaceTertiary,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: c.border,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
  },
  input: {
    fontFamily: fonts.display,
    fontSize: 22,
    color: c.brandPrimary,
    minWidth: 120,
    textAlign: "right",
    paddingVertical: spacing.md,
  },
}));
