import { useRouter } from "expo-router";
import { MagnifyingGlass, Plus } from "phosphor-react-native";
import React, { useMemo, useState } from "react";
import { ScrollView, Pressable, TextInput, useWindowDimensions, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AgentPortrait } from "@/src/components/AgentPortrait";
import { AppText, Chip, EmptyState, Loading, haptic } from "@/src/components/ui";
import { genId, useStore } from "@/src/store/AppStore";
import { ELEMENTS } from "@/src/store/gameData";
import { daysUntil } from "@/src/store/format";
import { Agent } from "@/src/store/types";
import { fonts, makeStyles, radius, spacing, useTheme } from "@/src/theme";

type Status = "all" | "owned" | "unowned" | "wishlist";
type SortMode = "rerun" | "name" | "element" | "spec";
const SORT_LABEL: Record<SortMode, string> = { rerun: "Rerun", name: "Nom", element: "Élément", spec: "Spé" };

export default function ZZZdexScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors } = useTheme();
  const styles = useStyles();
  const store = useStore();
  const { state, ready } = store;
  const { width } = useWindowDimensions();

  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<Status>("all");
  const [element, setElement] = useState<string | null>(null);
  const [sort, setSort] = useState<SortMode>("rerun");

  const cols = width >= 700 ? 4 : 3;
  const size = (width - spacing.lg * 2 - spacing.sm * (cols - 1)) / cols;

  const filtered = useMemo(() => {
    const list = state.agents.filter((a) => {
      if (query && !a.name.toLowerCase().includes(query.toLowerCase())) return false;
      if (status === "owned" && !a.owned) return false;
      if (status === "unowned" && a.owned) return false;
      if (status === "wishlist" && !a.wishlist) return false;
      if (element && a.element !== element) return false;
      return true;
    });
    // days since last rerun (bigger = more likely to come back). Unknown dates go last.
    const sinceKey = (a: Agent) => {
      const du = daysUntil(a.lastBanner);
      return du == null ? -Infinity : -du;
    };
    list.sort((a, b) => {
      if (sort === "name") return a.name.localeCompare(b.name);
      if (sort === "element") return a.element.localeCompare(b.element) || a.name.localeCompare(b.name);
      if (sort === "spec") return a.specialization.localeCompare(b.specialization) || a.name.localeCompare(b.name);
      // rerun: most days since last rerun first
      const ka = sinceKey(a);
      const kb = sinceKey(b);
      if (ka === kb) return a.name.localeCompare(b.name);
      return kb - ka;
    });
    return list;
  }, [state.agents, query, status, element, sort]);

  if (!ready) return <Loading />;

  const owned = state.agents.filter((a) => a.owned).length;

  const addAgent = () => {
    const id = genId("agent");
    const buildId = genId("b");
    const newAgent: Agent = {
      id,
      name: "Nouvel agent",
      rank: "S",
      element: "Ice",
      specialization: "Attack",
      faction: "",
      portrait: "",
      releaseDate: "",
      lastBanner: "",
      reruns: 0,
      promoMaterial: "Certificat",
      skillMaterial: "Défi d'expert",
      bossMaterial: "Matériau de boss",
      owned: false,
      mindscape: 0,
      hasSignatureEngine: false,
      engineRank: 1,
      wishlist: false,
      notes: "",
      builds: [
        {
          id: buildId,
          name: "Build standard",
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
          official: true,
        },
      ],
      activeBuildId: buildId,
    };
    store.addAgent(newAgent);
    router.push(`/agent/${id}?edit=1`);
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.surface }}>
      {/* sticky header */}
      <View style={{ paddingTop: insets.top + spacing.md, paddingHorizontal: spacing.lg }}>
        <View style={{ flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between" }}>
          <View>
            <AppText variant="display">ZZZDEX</AppText>
            <AppText variant="caption" color={colors.muted}>{owned}/{state.agents.length} agents possédés</AppText>
          </View>
          <Pressable
            style={styles.addBtn}
            onPress={() => { haptic.light(); addAgent(); }}
            testID="add-agent-button"
          >
            <Plus size={22} color={colors.onBrandPrimary} weight="bold" />
          </Pressable>
        </View>

        <View style={styles.search}>
          <MagnifyingGlass size={18} color={colors.muted} />
          <TextInput
            testID="agent-search"
            value={query}
            onChangeText={setQuery}
            placeholder="Rechercher un agent"
            placeholderTextColor={colors.muted}
            style={styles.searchInput}
          />
        </View>
      </View>

      {/* one horizontal chip row */}
      <View style={{ height: 56, justifyContent: "center" }}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: spacing.sm, paddingHorizontal: spacing.lg, alignItems: "center" }}
        >
          <Chip
            label={`Tri : ${SORT_LABEL[sort]}`}
            selected
            onPress={() => setSort(sort === "rerun" ? "name" : sort === "name" ? "element" : sort === "element" ? "spec" : "rerun")}
            testID="sort-cycle"
          />
          <View style={styles.chipDivider} />
          <Chip label="Tous" selected={status === "all"} onPress={() => setStatus("all")} testID="filter-all" />
          <Chip label="Possédés" selected={status === "owned"} onPress={() => setStatus(status === "owned" ? "all" : "owned")} testID="filter-owned" />
          <Chip label="Manquants" selected={status === "unowned"} onPress={() => setStatus(status === "unowned" ? "all" : "unowned")} testID="filter-unowned" />
          <Chip label="Wishlist" selected={status === "wishlist"} onPress={() => setStatus(status === "wishlist" ? "all" : "wishlist")} testID="filter-wishlist" />
          <View style={styles.chipDivider} />
          {ELEMENTS.map((el) => (
            <Chip key={el} label={el} selected={element === el} onPress={() => setElement(element === el ? null : el)} testID={`filter-el-${el}`} />
          ))}
        </ScrollView>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: spacing.lg, paddingTop: spacing.sm, paddingBottom: spacing.xxl }}
      >
        {filtered.length === 0 ? (
          <EmptyState title="AUCUN AGENT" subtitle="Aucun agent ne correspond à ces filtres." />
        ) : (
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.sm }}>
            {filtered.map((a) => (
              <AgentPortrait key={a.id} agent={a} size={size} onPress={() => router.push(`/agent/${a.id}`)} />
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const useStyles = makeStyles((c) => ({
  addBtn: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: c.brandPrimary,
    alignItems: "center",
    justifyContent: "center",
  },
  search: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: c.surfaceSecondary,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: c.border,
    paddingHorizontal: spacing.md,
    marginTop: spacing.md,
  },
  searchInput: {
    flex: 1,
    fontFamily: fonts.body,
    fontSize: 14,
    color: c.onSurface,
    paddingVertical: spacing.md,
  },
  chipDivider: { width: 1, height: 24, backgroundColor: c.border, alignSelf: "center" },
}));
