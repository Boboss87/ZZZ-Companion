import { useLocalSearchParams, useRouter } from "expo-router";
import { CaretLeft, Check, Plus, Star, Trash } from "phosphor-react-native";
import React, { useState } from "react";
import { Pressable, ScrollView, Switch, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { BottomSheet } from "@/src/components/BottomSheet";
import { AppText, Badge, Card, Chip, DateField, MultiSelect, PrimaryButton, Select, Stepper, haptic, useToast } from "@/src/components/ui";
import { genId, useStore } from "@/src/store/AppStore";
import { RANKS } from "@/src/store/gameData";
import { Build, OptionLists } from "@/src/store/types";
import { ELEMENT_COLORS, fonts, makeStyles, radius, spacing, useTheme } from "@/src/theme";

type Tab = "general" | "collection" | "builds" | "notes";

export default function AgentDetailScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors } = useTheme();
  const styles = useStyles();
  const toast = useToast();
  const store = useStore();
  const { id } = useLocalSearchParams<{ id: string }>();
  const agent = store.state.agents.find((a) => a.id === id);

  const [tab, setTab] = useState<Tab>("general");
  const [editingBuild, setEditingBuild] = useState<Build | null>(null);

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
        <Pressable testID="delete-agent-btn" onPress={deleteAgent} style={[styles.iconBtn, { borderColor: colors.error }]} hitSlop={10}>
          <Trash size={18} color={colors.error} />
        </Pressable>
      </View>

      {/* tabs */}
      <View style={styles.tabRow}>
        {(["general", "collection", "builds", "notes"] as Tab[]).map((t) => (
          <Pressable key={t} testID={`tab-${t}`} onPress={() => { haptic.select(); setTab(t); }} style={[styles.tabBtn, tab === t && { borderBottomColor: colors.brandPrimary }]}>
            <AppText variant="label" color={tab === t ? colors.brandPrimary : colors.muted}>
              {t === "general" ? "GÉNÉRAL" : t === "collection" ? "COLLECTION" : t === "builds" ? "BUILDS" : "NOTES"}
            </AppText>
          </Pressable>
        ))}
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ padding: spacing.lg, gap: spacing.md, paddingBottom: insets.bottom + spacing.xxl }}
      >
        {tab === "general" ? (
          <>
            <Card>
              <EditText label="NOM" value={agent.name} onChange={(t) => upd({ name: t })} />
              <ChipSelect label="RANG" options={RANKS} value={agent.rank} onChange={(v) => upd({ rank: v as any })} />
              <SelectField label="ÉLÉMENT" options={lists.elements} value={agent.element} onChange={(v) => upd({ element: v as any })} testID="select-element" />
              <SelectField label="SPÉCIALISATION" options={lists.specializations} value={agent.specialization} onChange={(v) => upd({ specialization: v as any })} testID="select-spec" />
              <EditText label="FACTION" value={agent.faction} onChange={(t) => upd({ faction: t })} />
            </Card>
            <Card>
              <AppText variant="subtitle" style={{ marginBottom: spacing.sm }}>Historique des bannières</AppText>
              <DateFieldRow label="PREMIÈRE / SORTIE (JJ.MM.AAAA)" value={agent.releaseDate} onChange={(t) => upd({ releaseDate: t })} testID="agent-release" />
              <DateFieldRow label="DERNIÈRE BANNIÈRE (JJ.MM.AAAA)" value={agent.lastBanner} onChange={(t) => upd({ lastBanner: t })} testID="agent-lastbanner" />
            </Card>
          </>
        ) : null}

        {tab === "collection" ? (
          <Card>
            <ToggleRow label="Possédé" value={agent.owned} onChange={(v) => upd({ owned: v })} testID="toggle-owned" />
            {agent.owned ? (
              <View style={styles.stepRow}>
                <AppText variant="body">Mindscape</AppText>
                <Stepper value={agent.mindscape} onChange={(v) => upd({ mindscape: Math.min(6, v) })} min={0} />
              </View>
            ) : null}
            <ToggleRow label="Moteur signature" value={agent.hasSignatureEngine} onChange={(v) => upd({ hasSignatureEngine: v })} testID="toggle-engine" />
            {agent.hasSignatureEngine ? (
              <View style={styles.stepRow}>
                <AppText variant="body">Rang moteur (P)</AppText>
                <Stepper value={agent.engineRank} onChange={(v) => upd({ engineRank: Math.min(5, Math.max(1, v)) })} min={1} />
              </View>
            ) : null}
            <ToggleRow label="Wishlist" value={agent.wishlist} onChange={(v) => upd({ wishlist: v })} testID="toggle-wishlist" />
          </Card>
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
                <BuildLine label="Sous-stats" value={b.substats.join(", ")} />
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

        {tab === "notes" ? (
          <Card>
            <AppText variant="label" color={colors.muted} style={{ marginBottom: spacing.sm }}>NOTES PERSONNELLES</AppText>
            <TextInput
              testID="notes-input"
              value={agent.notes}
              onChangeText={(t) => upd({ notes: t })}
              placeholder="Ajoute une note libre…"
              placeholderTextColor={colors.muted}
              multiline
              style={styles.notes}
            />
          </Card>
        ) : null}
      </ScrollView>

      <BuildSheet editing={editingBuild} onClose={() => setEditingBuild(null)} onSave={saveBuild} lists={lists} />
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
      <MultiSelectField label="SOUS-STATS PRIORITAIRES" options={lists.subStats} values={draft.substats} onChange={(v) => set({ substats: v })} testID="build-substats" />
      <EditText label="PRIORITÉ DES COMPÉTENCES" value={draft.skillPriority} onChange={(t) => set({ skillPriority: t })} />
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

function MultiSelectField({ label, values, options, onChange, testID }: { label: string; values: string[]; options: string[]; onChange: (v: string[]) => void; testID?: string }) {
  const { colors } = useTheme();
  return (
    <View style={{ marginBottom: spacing.md }}>
      <AppText variant="label" color={colors.muted} style={{ marginBottom: spacing.xs }}>{label}</AppText>
      <MultiSelect values={values} options={options} onChange={onChange} testID={testID} />
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
