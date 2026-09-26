import { useRouter } from "expo-router";
import { CaretLeft, PencilSimple, Plus, Trash } from "phosphor-react-native";
import React, { useMemo, useState } from "react";
import { Pressable, ScrollView, Switch, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { BottomSheet } from "@/src/components/BottomSheet";
import { AppText, Badge, Card, Chip, EmptyState, PrimaryButton, Stepper, haptic, useToast } from "@/src/components/ui";
import { genId, useStore } from "@/src/store/AppStore";
import { BANNERS, bannerLabel, computeBannerStats } from "@/src/store/pullStats";
import { BannerType, Outcome, PullSession, SRankResult } from "@/src/store/types";
import { fonts, makeStyles, radius, spacing, useTheme } from "@/src/theme";

const OUTCOMES: { id: Outcome; label: string }[] = [
  { id: "won", label: "Gagné" },
  { id: "lost", label: "Perdu" },
  { id: "guaranteed", label: "Garanti" },
];

export default function HistoryScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors } = useTheme();
  const styles = useStyles();
  const store = useStore();
  const toast = useToast();
  const { state } = store;

  const [banner, setBanner] = useState<BannerType>("char_limited");
  const [editing, setEditing] = useState<PullSession | null>(null);

  const stats = useMemo(() => computeBannerStats(banner, state.pullSessions), [banner, state.pullSessions]);
  const sessions = useMemo(
    () => state.pullSessions.filter((s) => s.banner === banner).slice().reverse(),
    [banner, state.pullSessions],
  );
  const bannerMeta = BANNERS.find((b) => b.id === banner)!;

  const newSession = () =>
    setEditing({
      id: genId("sess"),
      banner,
      date: new Date().toISOString().slice(0, 10),
      pulls: 10,
      results: [],
      createdAt: new Date().toISOString(),
    });

  return (
    <View style={{ flex: 1, backgroundColor: colors.surface }}>
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <Pressable testID="history-back" onPress={() => router.back()} style={styles.iconBtn} hitSlop={10}>
          <CaretLeft size={20} color={colors.onSurface} weight="bold" />
        </Pressable>
        <AppText variant="title">HISTORIQUE</AppText>
        <View style={{ width: 36 }} />
      </View>

      {/* banner chips */}
      <View style={{ height: 56, justifyContent: "center" }}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.sm, paddingHorizontal: spacing.lg, alignItems: "center" }}>
          {BANNERS.map((b) => (
            <Chip key={b.id} label={b.label} selected={banner === b.id} onPress={() => setBanner(b.id)} testID={`banner-${b.id}`} />
          ))}
        </ScrollView>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: spacing.lg, paddingTop: spacing.sm, gap: spacing.md, paddingBottom: insets.bottom + 120 }}
      >
        {/* stats */}
        <Card accent>
          <AppText variant="subtitle" style={{ marginBottom: spacing.md }}>{bannerLabel(banner)}</AppText>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.md }}>
            <Stat label="PITY ACTUELLE" value={`${stats.currentPity}`} color={colors.brandPrimary} />
            <Stat label="MOYENNE S-RANK" value={stats.avgSRank > 0 ? `${stats.avgSRank}` : "—"} color={colors.onSurface} />
            {bannerMeta.has5050 ? (
              <>
                <Stat label="COÛT MOYEN SOUHAITÉ" value={stats.avgDesired > 0 ? `${stats.avgDesired}` : "—"} color={colors.info} />
                <Stat label={bannerMeta.ratio} value={stats.wins + stats.losses > 0 ? `${stats.winRate}% (${stats.wins}/${stats.wins + stats.losses})` : "—"} color={colors.brandSecondary} />
              </>
            ) : null}
            <Stat label="TOTAL TIRAGES" value={`${stats.totalPulls}`} color={colors.onSurface} />
            <Stat label="S-RANK OBTENUS" value={`${stats.totalSRanks}`} color={colors.onSurface} />
          </View>
        </Card>

        {sessions.length === 0 ? (
          <EmptyState title="AUCUNE SESSION" subtitle="Ajoute une session de tirages pour cette bannière." />
        ) : (
          sessions.map((s) => (
            <Card key={s.id} testID={`session-card-${s.id}`}>
              <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                <View>
                  <AppText variant="subtitle">{s.date || "Sans date"}</AppText>
                  <AppText variant="caption" color={colors.muted}>{s.pulls} tirages · {s.results.length} S-Rank</AppText>
                </View>
                <View style={{ flexDirection: "row", gap: spacing.sm }}>
                  <Pressable testID={`session-edit-${s.id}`} onPress={() => { haptic.light(); setEditing(s); }} style={styles.rowBtn}>
                    <PencilSimple size={16} color={colors.onSurface} />
                  </Pressable>
                  <Pressable testID={`session-delete-${s.id}`} onPress={() => { haptic.light(); store.deleteSession(s.id); }} style={[styles.rowBtn, { borderColor: colors.error }]}>
                    <Trash size={16} color={colors.error} />
                  </Pressable>
                </View>
              </View>
              {s.results.length > 0 ? (
                <View style={{ marginTop: spacing.sm, gap: spacing.xs }}>
                  {s.results.slice().sort((a, b) => a.position - b.position).map((r) => (
                    <View key={r.id} style={styles.resultLine}>
                      <View style={{ flex: 1, flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
                        <AppText variant="body" numberOfLines={1} style={{ flexShrink: 1 }}>{r.name || "S-Rank"}</AppText>
                        {r.isDesired ? <Badge label="SOUHAITÉ" bg={colors.brandPrimary} fg={colors.onBrandPrimary} /> : null}
                        {r.outcome === "won" ? <Badge label="GAGNÉ" bg={colors.success} fg={colors.onSuccess} /> : r.outcome === "lost" ? <Badge label="PERDU" bg={colors.error} fg={colors.onError} /> : null}
                      </View>
                      <AppText variant="caption" color={colors.muted}>#{r.position}</AppText>
                    </View>
                  ))}
                </View>
              ) : null}
            </Card>
          ))
        )}
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: spacing.md }]}>
        <PrimaryButton label="+ AJOUTER UNE SESSION" onPress={newSession} testID="add-session-button" />
      </View>

      <SessionSheet
        editing={editing}
        bannerMeta={bannerMeta}
        onClose={() => setEditing(null)}
        onSave={(sess) => {
          const exists = state.pullSessions.some((x) => x.id === sess.id);
          if (exists) store.updateSession(sess.id, sess);
          else store.addSession({ banner: sess.banner, date: sess.date, pulls: sess.pulls, results: sess.results });
          setEditing(null);
          toast("Session enregistrée", "success");
        }}
      />
    </View>
  );
}

function SessionSheet({
  editing,
  bannerMeta,
  onClose,
  onSave,
}: {
  editing: PullSession | null;
  bannerMeta: (typeof BANNERS)[number];
  onClose: () => void;
  onSave: (s: PullSession) => void;
}) {
  const { colors } = useTheme();
  const styles = useStyles();
  const [draft, setDraft] = useState<PullSession | null>(editing);
  React.useEffect(() => setDraft(editing), [editing]);
  if (!draft) return null;

  const set = (partial: Partial<PullSession>) => setDraft({ ...draft, ...partial });
  const setResult = (id: string, partial: Partial<SRankResult>) =>
    setDraft({ ...draft, results: draft.results.map((r) => (r.id === id ? { ...r, ...partial } : r)) });
  const addResult = () =>
    setDraft({
      ...draft,
      results: [
        ...draft.results,
        { id: genId("sr"), name: "", position: Math.min(draft.pulls, draft.results.length * 20 + 10), isDesired: false, outcome: bannerMeta.has5050 ? "won" : "na" },
      ],
    });

  return (
    <BottomSheet visible={!!editing} onClose={onClose} title="Session de tirages">
      <View style={{ marginBottom: spacing.md }}>
        <AppText variant="label" color={colors.muted} style={{ marginBottom: spacing.xs }}>DATE</AppText>
        <TextInput
          testID="session-date"
          value={draft.date}
          onChangeText={(t) => set({ date: t })}
          placeholder="AAAA-MM-JJ"
          placeholderTextColor={colors.muted}
          style={styles.field}
        />
      </View>
      <View style={styles.stepField}>
        <AppText variant="body">Nombre de tirages</AppText>
        <Stepper value={draft.pulls} onChange={(v) => set({ pulls: Math.max(1, v) })} step={10} min={1} />
      </View>

      <AppText variant="label" color={colors.muted}>S-RANK OBTENUS</AppText>
      {draft.results.map((r) => (
        <View key={r.id} style={styles.resultCard} testID={`result-${r.id}`}>
          <View style={{ flexDirection: "row", gap: spacing.sm, alignItems: "center" }}>
            <TextInput
              value={r.name}
              onChangeText={(t) => setResult(r.id, { name: t })}
              placeholder="Nom du S-Rank"
              placeholderTextColor={colors.muted}
              style={[styles.field, { flex: 1 }]}
            />
            <Pressable testID={`result-delete-${r.id}`} onPress={() => setDraft({ ...draft, results: draft.results.filter((x) => x.id !== r.id) })} style={[styles.rowBtn, { borderColor: colors.error }]}>
              <Trash size={16} color={colors.error} />
            </Pressable>
          </View>
          <View style={styles.stepField}>
            <AppText variant="caption" color={colors.muted}>Tirage n° (dans la session)</AppText>
            <TextInput
              testID={`result-pos-${r.id}`}
              value={`${r.position}`}
              onChangeText={(t) => setResult(r.id, { position: Math.max(1, parseInt(t.replace(/[^0-9]/g, "") || "1", 10)) })}
              keyboardType="number-pad"
              style={styles.posInput}
            />
          </View>
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: spacing.xs }}>
            <AppText variant="body">Perso souhaité</AppText>
            <Switch
              testID={`result-desired-${r.id}`}
              value={r.isDesired}
              onValueChange={(v) => { haptic.select(); setResult(r.id, { isDesired: v }); }}
              trackColor={{ true: colors.brandPrimary, false: colors.surfaceTertiary }}
              thumbColor={colors.onSurface}
            />
          </View>
          {bannerMeta.has5050 ? (
            <View style={{ flexDirection: "row", gap: spacing.sm, flexWrap: "wrap" }}>
              {OUTCOMES.map((o) => (
                <Chip key={o.id} label={o.label} selected={r.outcome === o.id} onPress={() => setResult(r.id, { outcome: o.id })} testID={`outcome-${r.id}-${o.id}`} />
              ))}
            </View>
          ) : null}
        </View>
      ))}
      <Pressable testID="add-result-button" onPress={() => { haptic.light(); addResult(); }} style={styles.addRow}>
        <Plus size={16} color={colors.brandPrimary} weight="bold" />
        <AppText variant="label" color={colors.brandPrimary}>AJOUTER UN S-RANK</AppText>
      </Pressable>

      <PrimaryButton label="ENREGISTRER LA SESSION" onPress={() => onSave(draft)} testID="save-session-button" />
    </BottomSheet>
  );
}

function Stat({ label, value, color }: { label: string; value: string; color: string }) {
  const { colors } = useTheme();
  return (
    <View style={{ width: "45%" }}>
      <AppText style={{ fontFamily: fonts.display, fontSize: 24, color }}>{value}</AppText>
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
  rowBtn: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: c.border,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: c.surfaceTertiary,
  },
  resultLine: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: c.surfaceTertiary,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  field: {
    fontFamily: fonts.body,
    fontSize: 15,
    color: c.onSurface,
    backgroundColor: c.surfaceTertiary,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: c.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  stepField: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: spacing.xs },
  posInput: {
    fontFamily: fonts.display,
    fontSize: 20,
    color: c.brandPrimary,
    backgroundColor: c.surfaceTertiary,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: c.border,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    minWidth: 90,
    textAlign: "center",
  },
  resultCard: {
    backgroundColor: c.surfaceSecondary,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: c.border,
    padding: spacing.md,
    gap: spacing.xs,
    marginTop: spacing.sm,
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
