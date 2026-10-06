import { useRouter } from "expo-router";
import { BatteryHigh, CaretRight, ClockCounterClockwise, Lightning, TrendUp } from "phosphor-react-native";
import React, { useMemo } from "react";
import { ScrollView, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AppText, Badge, Card, Loading, ProgressBar } from "@/src/components/ui";
import { batteryDays, computeFarm, fmtDays } from "@/src/store/farmEngine";
import { daysUntil } from "@/src/store/format";
import { computeProjection } from "@/src/store/projectionEngine";
import { computeBannerStats, desiredCostEstimate } from "@/src/store/pullStats";
import { useStore } from "@/src/store/AppStore";
import { fonts, radius, spacing, useTheme } from "@/src/theme";

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors } = useTheme();
  const { state, ready } = useStore();

  const farm = useMemo(() => computeFarm(state), [state]);

  if (!ready) return <Loading />;

  const active = farm.statuses.filter((s) => s.agent && !s.complete);
  let cumulative = 0;
  const dashboard = active.map((s) => {
    cumulative += s.daysLeft;
    const obj = state.objectives.find((o) => o.id === s.objectiveId);
    const d = daysUntil(obj?.targetDate ?? "");
    return { status: s, cumulative, delay: d, delta: d != null ? d - cumulative : null };
  });

  const owned = state.agents.filter((a) => a.owned).length;
  const total = state.agents.length;
  const bDays = batteryDays(state.settings);

  const avgDesired = desiredCostEstimate(state.pullSessions, state.settings.avgDesiredCost);
  const proj = computeProjection(state, avgDesired);
  const firstRow = proj.rows[0];
  const budgetOk = proj.firstDeficitIndex < 0;
  const charStats = computeBannerStats("char_limited", state.pullSessions);

  return (
    <View style={{ flex: 1, backgroundColor: colors.surface }}>
      <View style={{ paddingTop: insets.top + spacing.md, paddingHorizontal: spacing.lg, paddingBottom: spacing.sm }}>
        <AppText variant="display" color={colors.brandPrimary}>ZZZ COMPANION</AppText>
        <AppText variant="caption" color={colors.muted}>Ton compagnon de compte · hors-ligne</AppText>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xxl }}
      >
        {/* Farm dashboard — overview of all active objectives */}
        <Card accent onPress={() => router.navigate("/farm")} testID="home-farm-card">
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: spacing.sm }}>
            <Badge label="ASSISTANT DE FARM" bg={colors.brandPrimary} fg={colors.onBrandPrimary} />
            <CaretRight size={18} color={colors.muted} />
          </View>
          {dashboard.length === 0 ? (
            <AppText variant="body" color={colors.muted}>
              Aucun objectif actif. Ajoute un personnage à préparer.
            </AppText>
          ) : (
            dashboard.map((d, i) => (
              <View
                key={d.status.objectiveId}
                style={{ gap: 6, paddingVertical: spacing.sm, borderTopWidth: i === 0 ? 0 : 1, borderTopColor: colors.divider }}
              >
                <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
                  <AppText variant="subtitle" numberOfLines={1} style={{ flex: 1 }}>{d.status.agent?.name}</AppText>
                  <AppText variant="label" color={colors.muted}>{Math.round(d.status.progress * 100)}%</AppText>
                  {d.delta != null ? (
                    <Badge
                      label={`${d.delta >= 0 ? "▲ +" : "▼ "}${d.delta} j`}
                      bg={d.delta >= 0 ? colors.success : colors.error}
                      fg={d.delta >= 0 ? colors.onSuccess : colors.onError}
                    />
                  ) : null}
                </View>
                <ProgressBar value={d.status.progress} />
                <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                  <AppText variant="caption" color={colors.muted}>
                    Restant {fmtDays(d.status.daysLeft)} · Cumulé {fmtDays(d.cumulative)}
                  </AppText>
                  {d.delay != null ? (
                    <AppText variant="caption" color={colors.muted}>Délai {delayLabel(d.delay)}</AppText>
                  ) : null}
                </View>
              </View>
            ))
          )}
        </Card>

        {/* Projection financière */}
        <Card onPress={() => router.navigate("/projection")} testID="home-projection-card">
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
            <View style={{ flexDirection: "row", gap: spacing.sm, alignItems: "center" }}>
              <TrendUp size={20} color={colors.info} weight="bold" />
              <AppText variant="subtitle">Projection financière</AppText>
            </View>
            <View style={{ flexDirection: "row", gap: spacing.sm, alignItems: "center" }}>
              <Badge
                label={budgetOk ? "BUDGET OK" : "INSUFFISANT"}
                bg={budgetOk ? colors.success : colors.error}
                fg={budgetOk ? colors.onSuccess : colors.onError}
              />
              <CaretRight size={18} color={colors.muted} />
            </View>
          </View>
          {firstRow ? (
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end", marginTop: spacing.sm }}>
              <View>
                <AppText variant="caption" color={colors.muted}>APRÈS {firstRow.patch.name.toUpperCase()}</AppText>
                <AppText style={{ fontFamily: fonts.display, fontSize: 28, color: firstRow.deficit ? colors.error : colors.brandPrimary }}>
                  {firstRow.balanceAfter} <AppText variant="title" color={colors.muted}>tickets</AppText>
                </AppText>
              </View>
              <View style={{ alignItems: "flex-end" }}>
                <AppText variant="label" color={colors.muted}>MARGE</AppText>
                <AppText variant="subtitle" color={colors.info}>≈ {firstRow.chars} perso</AppText>
              </View>
            </View>
          ) : (
            <AppText variant="caption" color={colors.muted} style={{ marginTop: spacing.xs }}>
              Ajoute des patchs pour planifier ta saison.
            </AppText>
          )}
          {!budgetOk && proj.rows[proj.firstDeficitIndex] ? (
            <AppText variant="caption" color={colors.error} style={{ marginTop: spacing.xs }}>
              Déficit prévu au patch {proj.rows[proj.firstDeficitIndex].patch.name}
            </AppText>
          ) : null}
        </Card>

        {/* Historique de pulls */}
        <Card onPress={() => router.navigate("/history")} testID="home-history-card">
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
            <View style={{ flexDirection: "row", gap: spacing.sm, alignItems: "center" }}>
              <ClockCounterClockwise size={20} color={colors.brandSecondary} weight="bold" />
              <AppText variant="subtitle">Historique de pulls</AppText>
            </View>
            <CaretRight size={18} color={colors.muted} />
          </View>
          {state.pullSessions.length === 0 ? (
            <AppText variant="caption" color={colors.muted} style={{ marginTop: spacing.xs }}>
              Ajoute ta première session pour suivre pity, 50/50 et coût moyen.
            </AppText>
          ) : (
            <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: spacing.sm }}>
              <MiniStat label="COÛT MOYEN" value={charStats.avgDesired > 0 ? `${charStats.avgDesired}` : "—"} color={colors.brandPrimary} />
              <MiniStat label="50/50" value={charStats.wins + charStats.losses > 0 ? `${charStats.winRate}%` : "—"} color={colors.info} />
              <MiniStat label="PITY PERSO" value={`${charStats.currentPity}`} color={colors.brandSecondary} />
            </View>
          )}
        </Card>


        {/* Row: ZZZdex + Batteries */}
        <View style={{ flexDirection: "row", gap: spacing.md }}>
          <Card style={{ flex: 1 }} onPress={() => router.navigate("/zzzdex")} testID="home-zzzdex-card">
            <SquaresIcon color={colors.brandPrimary} />
            <AppText variant="display" style={{ marginTop: spacing.sm }}>
              {owned}
              <AppText variant="title" color={colors.muted}>/{total}</AppText>
            </AppText>
            <AppText variant="label" color={colors.muted}>AGENTS POSSÉDÉS</AppText>
          </Card>

          <Card style={{ flex: 1 }} onPress={() => router.navigate("/settings")} testID="home-battery-card">
            <BatteryHigh size={22} color={colors.success} weight="bold" />
            <AppText variant="display" style={{ marginTop: spacing.sm }}>
              {state.settings.backupBatteries}
            </AppText>
            <AppText variant="label" color={colors.muted}>
              BATTERIES · ≈ {bDays} J DE FARM
            </AppText>
          </Card>
        </View>

        {/* farm energy summary */}
        <Card>
          <View style={{ flexDirection: "row", gap: spacing.sm, alignItems: "center", marginBottom: spacing.sm }}>
            <Lightning size={18} color={colors.brandPrimary} weight="fill" />
            <AppText variant="subtitle">Énergie du jour</AppText>
          </View>
          <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
            <EnergyStat label="TOTAL" value={state.settings.dailyEnergy} color={colors.onSurface} />
            <EnergyStat label="DISCS" value={state.settings.discRuns * 60} color={colors.info} />
            <EnergyStat label="FARM" value={farm.farmEnergy} color={colors.brandPrimary} />
          </View>
        </Card>
      </ScrollView>
    </View>
  );
}

function delayLabel(d: number): string {
  if (d < 0) return `en retard de ${Math.abs(d)} j`;
  if (d === 0) return "aujourd'hui";
  return `${d} j`;
}

function EnergyStat({ label, value, color }: { label: string; value: number; color: string }) {
  const { colors } = useTheme();
  return (
    <View style={{ alignItems: "center", flex: 1 }}>
      <AppText style={{ fontFamily: fonts.display, fontSize: 26, color }}>{value}</AppText>
      <AppText variant="label" color={colors.muted}>{label}</AppText>
    </View>
  );
}

function MiniStat({ label, value, color }: { label: string; value: string; color: string }) {
  const { colors } = useTheme();
  return (
    <View style={{ alignItems: "center", flex: 1 }}>
      <AppText style={{ fontFamily: fonts.display, fontSize: 22, color }}>{value}</AppText>
      <AppText variant="label" color={colors.muted}>{label}</AppText>
    </View>
  );
}

function SquaresIcon({ color }: { color: string }) {
  return (
    <View style={{ width: 22, height: 22, flexDirection: "row", flexWrap: "wrap", gap: 2 }}>
      {[0, 1, 2, 3].map((i) => (
        <View key={i} style={{ width: 9, height: 9, backgroundColor: color, borderRadius: radius.sm }} />
      ))}
    </View>
  );
}
