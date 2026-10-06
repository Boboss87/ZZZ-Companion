import { useLocalSearchParams, useRouter } from "expo-router";
import { CaretLeft, Check, Heart, PencilSimple, Plus, Star, Trash } from "phosphor-react-native";
import React, { useState } from "react";
import { Pressable, ScrollView, Switch, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { BottomSheet } from "@/src/components/BottomSheet";
import { AppText, Badge, Card, Chip, DateField, MultiSelect, PrimaryButton, Select, Stepper, haptic, useToast } from "@/src/components/ui";
import { genId, useStore } from "@/src/store/AppStore";
import { fmtDate, daysUntil } from "@/src/store/format";
import { ResImage } from "@/src/store/resources";
import { RANKS, SKILL_TYPES } from "@/src/store/gameData";
import { Build, OptionLists } from "@/src/store/types";
import { ELEMENT_COLORS, fonts, makeStyles, radius, spacing, useTheme } from "@/src/theme";

type Tab = "fiche" | "builds";

export default function AgentDetailScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors } = useTheme();
  const styles = useStyles();
  const toast = useToast();
  const store = useStore();
  const { id, edit } = useLocalSearchParams<{ id: string; edit?: string }>();
  const agent = store.state.agents.find((a) => a.id === id);

  const [tab, setTab] = useState<Tab>("fiche");
  const [editingBuild, setEditingBuild] = useState<Build | null>(null);
  const [editOpen, setEditOpen] = useState(edit === "1");

  if (!agent) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.surface, paddingTop: insets.top + 80, alignItems: "center" }}>
        <AppText variant="title">Agent introuvable</AppText>
        <PrimaryButton label="RETOUR" onPress={() => router.back()} style={{ marginTop: spacing.lg }} />
      </View>
    );
  }

  const el = ELEMENT_COLORS[agent.element] ?? colors.brandPrimary;
  const lists = store.state.optionLists;
  const upd = (partial: Partial<typeof agent>) => store.updateAgent(agent.id, partial);
  const activeBuild = agent.builds.find((b) => b.id === agent.activeBuildId) ?? agent.builds[0];
  const du = daysUntil(agent.lastBanner);
  const daysSinceRerun = du != null ? -du : null;
  const mxwx = `M${agent.mindscape}W${agent.hasSignatureEngine ? agent.engineRank : 0}`;

  const deleteAgent = () => {
    store.deleteAgent(agent.id);
    toast("Agent supprimé", "info");
    router.back();
  };

  const saveBuild = (b: Build) => {
    const exists = agent.builds.some((x) => x.id === b.id);
    if (exists) store.updateBuild(agent.id, b.id, b);
    else store.addBuild(agent.id, b);
    setEditingBuild(null);
    toast("Build enregistré", "success");
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.surface }}>
      {/* header */}
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm, borderBottomColor: el }]}>
        <Pressable testID="back-btn" onPress={() => router.back()} style={styles.iconBtn} hitSlop={10}>
          <CaretLeft size={20} color={colors.onSurface} weight="bold" />
        </Pressable>
        <View style={{ flex: 1, marginHorizontal: spacing.md }}>
          <AppText variant="title" numberOfLines={1}>{agent.name}</AppText>
          <View style={{ flexDirection: "row", gap: spacing.sm, alignItems: "center" }}>
            <Badge label={agent.rank} bg={agent.rank === "S" ? colors.brandPrimary : colors.surfaceTertiary} fg={agent.rank === "S" ? colors.onBrandPrimary : colors.onSurfaceTertiary} />
            <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: el }} />
            <AppText variant="caption" color={colors.muted}>{agent.element} · {agent.specialization}</AppText>
          </View>
        </View>
        <View style={{ flexDirection: "row", gap: spacing.sm }}>
          <Pressable testID="toggle-wishlist" onPress={() => { haptic.light(); upd({ wishlist: !agent.wishlist }); }} style={styles.iconBtn} hitSlop={10}>
            <Heart size={18} color={agent.wishlist ? colors.brandSecondary : colors.muted} weight={agent.wishlist ? "fill" : "regular"} />
          </Pressable>
          <Pressable testID="edit-agent-btn" onPress={() => { haptic.light(); setEditOpen(true); }} style={[styles.iconBtn, { borderColor: colors.brandPrimary }]} hitSlop={10}>
            <PencilSimple size={18} color={colors.brandPrimary} />
          </Pressable>
          <Pressable testID="delete-agent-btn" onPress={deleteAgent} style={[styles.iconBtn, { borderColor: colors.error }]} hitSlop={10}>
            <Trash size={18} color={colors.error} />
          </Pressable>
        </View>
      </View>

      {/* tabs */}
      <View style={styles.tabRow}>
        {(["fiche", "builds"] as Tab[]).map((t) => (
          <Pressable key={t} testID={`tab-${t}`} onPress={() => { haptic.select(); setTab(t); }} style={[styles.tabBtn, tab === t && { borderBottomColor: colors.brandPrimary }]}>
            <AppText variant="label" color={tab === t ? colors.brandPrimary : colors.muted}>
              {t === "fiche" ? "FICHE" : "BUILDS"}
            </AppText>
          </Pressable>
        ))}
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ padding: spacing.lg, gap: spacing.md, paddingBottom: insets.bottom + spacing.xxl }}
      >
        {tab === "fiche" ? (
          <>
            <Card>
              <View style={{ flexDirection: "row", gap: spacing.md }}>
                <ResImage
                  kind="portrait"
                  value={agent.name}
                  style={{ width: 120, height: 150, borderRadius: radius.md }}
                  fallback={
                    <View style={{ width: 120, height: 150, borderRadius: radius.md, backgroundColor: el, alignItems: "center", justifyContent: "center" }}>
                      <AppText style={{ fontFamily: fonts.display, fontSize: 40, color: "#0A0A0A" }}>{agent.name.slice(0, 2).toUpperCase()}</AppText>
                    </View>
                  }
                />
                <View style={{ flex: 1, justifyContent: "center", gap: spacing.sm }}>
                  <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: spacing.sm }}>
                    <AppText variant="title" numberOfLines={1} style={{ flex: 1 }}>{agent.name}</AppText>
                    <Badge label={mxwx} bg={colors.surfaceTertiary} fg={colors.info} />
                  </View>
                  <AppText variant="body">{agent.rank} · {agent.element}</AppText>
                  <AppText variant="body">{agent.specialization}</AppText>
                  <AppText variant="body" color={colors.muted}>{agent.faction || "Sans faction"}</AppText>
                  <AppText variant="body" color={agent.owned ? colors.success : colors.muted}>{agent.owned ? "Possédé" : "Non possédé"}</AppText>
                </View>
              </View>
            </Card>
            <Card>
              <AppText variant="subtitle" style={{ marginBottom: spacing.sm }}>Bannières</AppText>
              <InfoRow label="Première bannière" value={fmtDate(agent.releaseDate) || "—"} />
              <InfoRow label="Dernière bannière" value={fmtDate(agent.lastBanner) || "—"} />
              <InfoRow label="Nombre de reruns" value={`${agent.reruns}`} />
              <InfoRow label="Jours depuis rerun" value={daysSinceRerun != null ? `${daysSinceRerun} j` : "—"} />
            </Card>
            {activeBuild ? (
              <Card>
                <AppText variant="subtitle" style={{ marginBottom: spacing.sm }}>Build actif · {activeBuild.name}</AppText>
                <BuildLine label="Set 4pc" value={activeBuild.set4 || "—"} />
                <BuildLine label="Set 2pc" value={activeBuild.set2 || "—"} />
                <BuildLine label="Disc 4" value={activeBuild.mainStat4 || "—"} />
                <BuildLine label="Disc 5" value={activeBuild.mainStat5 || "—"} />
                <BuildLine label="Disc 6" value={activeBuild.mainStat6 || "—"} />
                <BuildLine label="Priorité substats" value={activeBuild.substats.join(" > ") || "—"} />
                <BuildLine label="Priorité skills" value={activeBuild.skillPriority || "—"} />
                {activeBuild.caps ? <BuildLine label="Stats / caps" value={activeBuild.caps} /> : null}
              </Card>
            ) : null}
            {agent.notes ? (
              <Card>
                <AppText variant="subtitle" style={{ marginBottom: spacing.sm }}>Notes</AppText>
                <AppText variant="body" color={colors.onSurfaceSecondary}>{agent.notes}</AppText>
              </Card>
            ) : null}
          </>
        ) : null}

        {tab === "builds" ? (
          <>
            {agent.builds.map((b) => (
              <Card key={b.id} testID={`build-card-${b.id}`}>
                <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: spacing.sm }}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm, flex: 1 }}>
                    <AppText variant="subtitle" numberOfLines={1} style={{ flexShrink: 1 }}>{b.name}</AppText>
                    {agent.activeBuildId === b.id ? <Badge label="ACTIF" bg={colors.brandPrimary} fg={colors.onBrandPrimary} /> : null}
                    {b.official ? <Badge label="OFFICIEL" bg={colors.surfaceTertiary} fg={colors.muted} /> : <Badge label="PERSO" bg={colors.brandSecondary} fg={colors.onBrandSecondary} />}
                  </View>
                </View>
                <BuildLine label="Set 4pc" value={b.set4} />
                <BuildLine label="Set 2pc" value={b.set2} />
                <BuildLine label="Stats 4/5/6" value={`${b.mainStat4} / ${b.mainStat5} / ${b.mainStat6}`} />
                <BuildLine label="Sous-stats" value={b.substats.join(" > ")} />
                <BuildLine label="Priorité skills" value={b.skillPriority} />
                <BuildLine label="Moteur" value={b.engine} />
                {b.caps ? <BuildLine label="Caps" value={b.caps} /> : null}
                <View style={{ flexDirection: "row", gap: spacing.sm, marginTop: spacing.md }}>
                  {agent.activeBuildId !== b.id ? (
                    <Pressable testID={`build-active-${b.id}`} onPress={() => { haptic.light(); store.setActiveBuild(agent.id, b.id); }} style={styles.smallBtn}>
                      <Star size={14} color={colors.onSurface} />
                      <AppText variant="label">DÉFINIR ACTIF</AppText>
                    </Pressable>
                  ) : null}
                  <Pressable testID={`build-edit-${b.id}`} onPress={() => { haptic.light(); setEditingBuild(b); }} style={[styles.smallBtn, { flex: 1 }]}>
                    <AppText variant="label">MODIFIER</AppText>
                  </Pressable>
                  {agent.builds.length > 1 ? (
                    <Pressable testID={`build-delete-${b.id}`} onPress={() => { haptic.light(); store.deleteBuild(agent.id, b.id); }} style={[styles.smallBtn, { borderColor: colors.error }]}>
                      <Trash size={14} color={colors.error} />
                    </Pressable>
                  ) : null}
                </View>
              </Card>
            ))}
            <Pressable
              testID="add-build-btn"
              onPress={() => {
                haptic.light();
                setEditingBuild({
                  id: genId("b"),
                  name: "Nouveau build",
                  set4: "",
                  set2: "",
                  mainStat4: "Crit ATK",
                  mainStat5: "Dégâts élément",
                  mainStat6: "ATK%",
                  substats: ["Crit RATE", "Crit ATK"],
                  skillPriority: "EX > Basic > Ultimate",
                  engine: "",
                  alternatives: "",
                  caps: "",
                  official: false,
                });
              }}
              style={styles.addBuild}
            >
              <Plus size={18} color={colors.brandPrimary} weight="bold" />
              <AppText variant="subtitle" color={colors.brandPrimary}>Ajouter un build</AppText>
            </Pressable>
          </>
        ) : null}
      </ScrollView>

      <BuildSheet editing={editingBuild} onClose={() => setEditingBuild(null)} onSave={saveBuild} lists={lists} />

      <BottomSheet visible={editOpen} onClose={() => setEditOpen(false)} title="Modifier l'agent">
        <EditText label="NOM" value={agent.name} onChange={(t) => upd({ name: t })} />
        <ChipSelect label="RANG" options={RANKS} value={agent.rank} onChange={(v) => upd({ rank: v as any })} />
        <SelectField label="ÉLÉMENT" options={lists.elements} value={agent.element} onChange={(v) => upd({ element: v as any })} testID="select-element" />
        <SelectField label="SPÉCIALISATION" options={lists.specializations} value={agent.specialization} onChange={(v) => upd({ specialization: v as any })} testID="select-spec" />
        <EditText label="FACTION" value={agent.faction} onChange={(t) => upd({ faction: t })} />
        <DateFieldRow label="PREMIÈRE BANNIÈRE (JJ.MM.AAAA)" value={agent.releaseDate} onChange={(t) => upd({ releaseDate: t })} testID="agent-release" />
        <DateFieldRow label="DERNIÈRE BANNIÈRE (JJ.MM.AAAA)" value={agent.lastBanner} onChange={(t) => upd({ lastBanner: t })} testID="agent-lastbanner" />
        <View style={styles.stepRow}>
          <AppText variant="body">Nombre de reruns</AppText>
          <Stepper value={agent.reruns} onChange={(v) => upd({ reruns: Math.max(0, v) })} min={0} />
        </View>
        <ToggleRow label="Possédé" value={agent.owned} onChange={(v) => upd({ owned: v })} testID="toggle-owned" />
        {agent.owned ? (
          <View style={styles.stepRow}>
            <AppText variant="body">Mindscape</AppText>
            <Stepper value={agent.mindscape} onChange={(v) => upd({ mindscape: Math.min(6, Math.max(0, v)) })} min={0} />
          </View>
        ) : null}
        <ToggleRow label="Moteur signature" value={agent.hasSignatureEngine} onChange={(v) => upd({ hasSignatureEngine: v })} testID="toggle-engine" />
        {agent.hasSignatureEngine ? (
          <View style={styles.stepRow}>
            <AppText variant="body">Rang moteur (W)</AppText>
            <Stepper value={agent.engineRank} onChange={(v) => upd({ engineRank: Math.min(5, Math.max(1, v)) })} min={1} />
          </View>
        ) : null}
        <ToggleRow label="Wishlist" value={agent.wishlist} onChange={(v) => upd({ wishlist: v })} testID="toggle-wishlist-edit" />
        <View style={{ marginTop: spacing.sm }}>
          <AppText variant="label" color={colors.muted} style={{ marginBottom: spacing.sm }}>NOTES</AppText>
          <TextInput
            testID="notes-input"
            value={agent.notes}
            onChangeText={(t) => upd({ notes: t })}
            placeholder="Ajoute une note libre…"
            placeholderTextColor={colors.muted}
            multiline
            style={styles.notes}
          />
        </View>
        <PrimaryButton label="FERMER" onPress={() => setEditOpen(false)} testID="close-edit-agent" />
      </BottomSheet>
    </View>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  const { colors } = useTheme();
  return (
    <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: spacing.xs }}>
      <AppText variant="body" color={colors.muted}>{label}</AppText>
      <AppText variant="body" numberOfLines={1} style={{ flexShrink: 1, textAlign: "right", marginLeft: spacing.md }}>{value}</AppText>
    </View>
  );
}

function BuildSheet({ editing, onClose, onSave, lists }: { editing: Build | null; onClose: () => void; onSave: (b: Build) => void; lists: OptionLists }) {
  const [draft, setDraft] = useState<Build | null>(editing);
  React.useEffect(() => setDraft(editing), [editing]);
  if (!draft) return null;
  const set = (partial: Partial<Build>) => setDraft({ ...draft, ...partial });

  return (
    <BottomSheet visible={!!editing} onClose={onClose} title="Build">
      <EditText label="NOM" value={draft.name} onChange={(t) => set({ name: t })} />
      <SelectField label="SET 4 PIÈCES" options={lists.discSets} value={draft.set4} onChange={(v) => set({ set4: v })} testID="build-set4" />
      <SelectField label="SET 2 PIÈCES" options={lists.discSets} value={draft.set2} onChange={(v) => set({ set2: v })} testID="build-set2" />
      <SelectField label="STAT PRINCIPALE — DISQUE 4" options={lists.mainStats} value={draft.mainStat4} onChange={(v) => set({ mainStat4: v })} testID="build-stat4" />
      <SelectField label="STAT PRINCIPALE — DISQUE 5" options={lists.mainStats} value={draft.mainStat5} onChange={(v) => set({ mainStat5: v })} testID="build-stat5" />
      <SelectField label="STAT PRINCIPALE — DISQUE 6" options={lists.mainStats} value={draft.mainStat6} onChange={(v) => set({ mainStat6: v })} testID="build-stat6" />
      <MultiSelectField label="SOUS-STATS PRIORITAIRES" options={lists.subStats} values={draft.substats} onChange={(v) => set({ substats: v })} separator=" > " testID="build-substats" />
      <MultiSelectField
        label="PRIORITÉ DES COMPÉTENCES"
        options={SKILL_TYPES}
        values={draft.skillPriority ? draft.skillPriority.split(" > ").filter(Boolean) : []}
        onChange={(v) => set({ skillPriority: v.join(" > ") })}
        separator=" > "
        testID="build-skills"
      />
      <EditText label="MOTEUR RECOMMANDÉ" value={draft.engine} onChange={(t) => set({ engine: t })} />
      <EditText label="ALTERNATIVES" value={draft.alternatives} onChange={(t) => set({ alternatives: t })} />
      <EditText label="CAPS (ex. ATK ≥ 3400)" value={draft.caps} onChange={(t) => set({ caps: t })} />
      <ToggleRow label="Build officiel (référence)" value={draft.official} onChange={(v) => set({ official: v })} />
      <PrimaryButton label="ENREGISTRER LE BUILD" onPress={() => onSave(draft)} testID="save-build-button" />
    </BottomSheet>
  );
}

function SelectField({ label, value, options, onChange, placeholder, testID }: { label: string; value: string; options: string[]; onChange: (v: string) => void; placeholder?: string; testID?: string }) {
  const { colors } = useTheme();
  return (
    <View style={{ marginBottom: spacing.md }}>
      <AppText variant="label" color={colors.muted} style={{ marginBottom: spacing.xs }}>{label}</AppText>
      <Select value={value} options={options} onChange={onChange} placeholder={placeholder} testID={testID} />
    </View>
  );
}

function MultiSelectField({ label, values, options, onChange, separator, testID }: { label: string; values: string[]; options: string[]; onChange: (v: string[]) => void; separator?: string; testID?: string }) {
  const { colors } = useTheme();
  return (
    <View style={{ marginBottom: spacing.md }}>
      <AppText variant="label" color={colors.muted} style={{ marginBottom: spacing.xs }}>{label}</AppText>
      <MultiSelect values={values} options={options} onChange={onChange} separator={separator} testID={testID} />
    </View>
  );
}

function DateFieldRow({ label, value, onChange, testID }: { label: string; value: string; onChange: (t: string) => void; testID?: string }) {
  const { colors } = useTheme();
  const styles = useStyles();
  return (
    <View style={{ marginBottom: spacing.md }}>
      <AppText variant="label" color={colors.muted} style={{ marginBottom: spacing.xs }}>{label}</AppText>
      <DateField valueISO={value} onChange={onChange} style={styles.input} testID={testID} />
    </View>
  );
}

function EditText({ label, value, onChange }: { label: string; value: string; onChange: (t: string) => void }) {
  const { colors } = useTheme();
  const styles = useStyles();
  return (
    <View style={{ marginBottom: spacing.md }}>
      <AppText variant="label" color={colors.muted} style={{ marginBottom: spacing.xs }}>{label}</AppText>
      <TextInput value={value} onChangeText={onChange} placeholderTextColor={colors.muted} style={styles.input} />
    </View>
  );
}

function ChipSelect({ label, options, value, onChange }: { label: string; options: string[]; value: string; onChange: (v: string) => void }) {
  const { colors } = useTheme();
  return (
    <View style={{ marginBottom: spacing.md }}>
      <AppText variant="label" color={colors.muted} style={{ marginBottom: spacing.xs }}>{label}</AppText>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.sm }}>
        {options.map((o) => (
          <Chip key={o} label={o} selected={value === o} onPress={() => onChange(o)} />
        ))}
      </View>
    </View>
  );
}

function ToggleRow({ label, value, onChange, testID }: { label: string; value: boolean; onChange: (v: boolean) => void; testID?: string }) {
  const { colors } = useTheme();
  return (
    <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: spacing.sm }}>
      <AppText variant="body">{label}</AppText>
      <Switch
        testID={testID}
        value={value}
        onValueChange={(v) => { haptic.select(); onChange(v); }}
        trackColor={{ true: colors.brandPrimary, false: colors.surfaceTertiary }}
        thumbColor={colors.onSurface}
      />
    </View>
  );
}

function BuildLine({ label, value }: { label: string; value: string }) {
  const { colors } = useTheme();
  return (
    <View style={{ flexDirection: "row", justifyContent: "space-between", paddingVertical: 3, gap: spacing.md }}>
      <AppText variant="caption" color={colors.muted}>{label}</AppText>
      <AppText variant="caption" style={{ flex: 1, textAlign: "right" }} numberOfLines={2}>{value || "—"}</AppText>
    </View>
  );
}

const useStyles = makeStyles((c) => ({
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: 2,
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
  tabRow: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: c.border },
  tabBtn: { flex: 1, alignItems: "center", paddingVertical: spacing.md, borderBottomWidth: 2, borderBottomColor: "transparent" },
  input: {
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
  notes: {
    fontFamily: fonts.body,
    fontSize: 15,
    color: c.onSurface,
    backgroundColor: c.surfaceTertiary,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: c.border,
    padding: spacing.md,
    minHeight: 140,
    textAlignVertical: "top",
  },
  stepRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: spacing.sm },
  smallBtn: {
    height: 40,
    paddingHorizontal: spacing.md,
    flexDirection: "row",
    gap: 6,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: c.border,
    backgroundColor: c.surfaceTertiary,
  },
  addBuild: {
    flexDirection: "row",
    gap: spacing.sm,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.lg,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: c.brandPrimary,
    borderStyle: "dashed",
  },
}));
