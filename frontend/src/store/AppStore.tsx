import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { storage } from "@/src/utils/storage";
import { DEFAULT_GAME_CONFIG, makeInitialState } from "./gameData";
import { patchIncome, patchSpent } from "./projectionEngine";
import {
  Agent,
  AppState,
  ArchivedPatch,
  Build,
  FarmObjective,
  FarmYield,
  GameConfig,
  OptionLists,
  PermanentIncome,
  Preset,
  ProjExpense,
  ProjPatch,
  Projection,
  PullSession,
  Settings,
} from "./types";

const STORAGE_KEY = "zzz_companion_state_v1";

let counter = 0;
export function genId(prefix: string): string {
  counter += 1;
  return `${prefix}_${Date.now().toString(36)}_${counter}`;
}

// Fill any missing fields introduced by later versions so old saves keep working.
// Each list item (agent/build/objective/patch/expense) is backfilled field-by-field
// so adding new fields never breaks an older JSON backup.
function mBuild(bl: Partial<Build> = {}): Build {
  return {
    id: bl.id ?? genId("b"),
    name: bl.name ?? "Build",
    set4: bl.set4 ?? "",
    set2: bl.set2 ?? "",
    mainStat4: bl.mainStat4 ?? "",
    mainStat5: bl.mainStat5 ?? "",
    mainStat6: bl.mainStat6 ?? "",
    substats: Array.isArray(bl.substats) ? bl.substats : [],
    skillPriority: bl.skillPriority ?? "",
    engine: bl.engine ?? "",
    alternatives: bl.alternatives ?? "",
    caps: bl.caps ?? "",
    official: bl.official ?? false,
  };
}

function mAgent(a: Partial<Agent> = {}): Agent {
  const builds = Array.isArray(a.builds) ? a.builds.map(mBuild) : [];
  return {
    id: a.id ?? genId("a"),
    name: a.name ?? "",
    rank: a.rank ?? "S",
    element: a.element ?? "Ice",
    specialization: a.specialization ?? "Attack",
    faction: a.faction ?? "",
    portrait: a.portrait ?? "",
    releaseDate: a.releaseDate ?? "",
    lastBanner: a.lastBanner ?? "",
    reruns: a.reruns ?? 0,
    promoMaterial: a.promoMaterial ?? "",
    skillMaterial: a.skillMaterial ?? "",
    bossMaterial: a.bossMaterial ?? "",
    owned: a.owned ?? false,
    mindscape: a.mindscape ?? 0,
    hasSignatureEngine: a.hasSignatureEngine ?? false,
    engineRank: a.engineRank ?? 1,
    wishlist: a.wishlist ?? false,
    notes: a.notes ?? "",
    builds,
    activeBuildId: a.activeBuildId ?? builds[0]?.id ?? "",
  };
}

function mObjective(o: Partial<FarmObjective> = {}): FarmObjective {
  return {
    id: o.id ?? genId("obj"),
    agentId: o.agentId ?? "",
    presetId: o.presetId ?? "",
    targetDate: o.targetDate ?? "",
    ownedSpecific: o.ownedSpecific ?? {},
    createdAt: o.createdAt ?? new Date().toISOString(),
  };
}

function mExpense(e: Partial<ProjExpense> = {}): ProjExpense {
  return {
    id: e.id ?? genId("e"),
    name: e.name ?? "",
    pullCost: e.pullCost ?? 0,
    actualCost: e.actualCost ?? null,
  };
}

function mPatch(p: Partial<ProjPatch> = {}): ProjPatch {
  return {
    id: p.id ?? genId("p"),
    name: p.name ?? "",
    durationDays: p.durationDays ?? 42,
    tempIncome: p.tempIncome ?? 30,
    startDate: p.startDate ?? "",
    expenses: Array.isArray(p.expenses) ? p.expenses.map(mExpense) : [],
  };
}

function migrate(saved: AppState): AppState {
  const base = makeInitialState();
  const savedConfig = saved.gameConfig as (GameConfig & { farmYield?: unknown; agentProg?: unknown }) | undefined;
  // One-time clean slate when upgrading from v1: remove the example data the app
  // shipped with (agents / objectives / projection patches / pull sessions), while
  // keeping the user's reusable level presets, barème (gameConfig) and dropdown lists.
  const fromV1 = (saved.version ?? 1) < 2;

  const agents = fromV1 ? [] : Array.isArray(saved.agents) ? saved.agents.map(mAgent) : base.agents;
  const objectives = fromV1 ? [] : Array.isArray(saved.objectives) ? saved.objectives.map(mObjective) : base.objectives;
  const pullSessions = fromV1 ? [] : Array.isArray(saved.pullSessions) ? saved.pullSessions : base.pullSessions;

  return {
    ...base,
    ...saved,
    version: 2,
    settings: { ...base.settings, ...saved.settings },
    optionLists: { ...base.optionLists, ...(saved.optionLists ?? {}) },
    presets: Array.isArray(saved.presets) && saved.presets.length ? saved.presets : base.presets,
    agents,
    objectives,
    commonStock: saved.commonStock ?? base.commonStock,
    pullSessions,
    permanentIncomes:
      saved.permanentIncomes && (saved.permanentIncomes[0] as { polyPerDay?: unknown } | undefined)?.polyPerDay !== undefined
        ? saved.permanentIncomes
        : base.permanentIncomes,
    projection: saved.projection
      ? {
          masterTapes:
            (saved.projection as { masterTapes?: number; startPulls?: number }).masterTapes ??
            (saved.projection as { startPulls?: number }).startPulls ??
            0,
          polychromes: saved.projection.polychromes ?? 0,
          monochromes: saved.projection.monochromes ?? 0,
          residualSignals: (saved.projection as { residualSignals?: number }).residualSignals ?? 0,
          patches: fromV1 ? [] : Array.isArray(saved.projection.patches) ? saved.projection.patches.map(mPatch) : [],
        }
      : base.projection,
    archivedPatches: fromV1 ? [] : Array.isArray(saved.archivedPatches) ? saved.archivedPatches : base.archivedPatches,
    gameConfig:
      savedConfig && savedConfig.farmYield && savedConfig.agentProg
        ? { ...savedConfig, eventRewardCoefficient: savedConfig.eventRewardCoefficient ?? 1 }
        : base.gameConfig,
  };
}

interface StoreContextValue {
  state: AppState;
  ready: boolean;
  update: (fn: (draft: AppState) => AppState) => void;
  // settings
  setSettings: (partial: Partial<Settings>) => void;
  // agents
  addAgent: (a: Agent) => void;
  updateAgent: (id: string, partial: Partial<Agent>) => void;
  deleteAgent: (id: string) => void;
  // builds
  addBuild: (agentId: string, b: Build) => void;
  updateBuild: (agentId: string, buildId: string, partial: Partial<Build>) => void;
  deleteBuild: (agentId: string, buildId: string) => void;
  setActiveBuild: (agentId: string, buildId: string) => void;
  // objectives
  addObjective: (o: Omit<FarmObjective, "id" | "createdAt">) => void;
  updateObjective: (id: string, partial: Partial<FarmObjective>) => void;
  deleteObjective: (id: string) => void;
  moveObjective: (id: string, dir: -1 | 1) => void;
  setObjectiveSpecific: (id: string, materialId: string, qty: number) => void;
  // stock
  setCommonStock: (materialId: string, qty: number) => void;
  // presets
  addPreset: (p: Preset) => void;
  updatePreset: (id: string, partial: Partial<Preset>) => void;
  deletePreset: (id: string) => void;
  // pull history
  addSession: (s: Omit<PullSession, "id" | "createdAt">) => void;
  updateSession: (id: string, partial: Partial<PullSession>) => void;
  deleteSession: (id: string) => void;
  // projection
  setProjection: (partial: Partial<Projection>) => void;
  addPatch: () => void;
  updatePatch: (id: string, partial: Partial<ProjPatch>) => void;
  deletePatch: (id: string) => void;
  advancePatch: (id: string) => void;
  validateExpense: (patchId: string, expenseId: string, realCost: number) => void;
  addExpense: (patchId: string, e: Omit<ProjExpense, "id">) => void;
  updateExpense: (patchId: string, expenseId: string, partial: Partial<ProjExpense>) => void;
  deleteExpense: (patchId: string, expenseId: string) => void;
  // permanent incomes
  addPermanentIncome: (i: Omit<PermanentIncome, "id">) => void;
  updatePermanentIncome: (id: string, partial: Partial<PermanentIncome>) => void;
  deletePermanentIncome: (id: string) => void;
  // editable game data (barème)
  setFarmYield: (key: keyof FarmYield, value: number) => void;
  setEventRewardCoefficient: (value: number) => void;
  setProgRow: (
    table: "agentProg" | "engineProg" | "skillProg" | "coreProg",
    index: number,
    key: string,
    value: number,
  ) => void;
  resetGameConfig: () => void;
  // editable option lists (dropdowns)
  setOptionList: (key: keyof OptionLists, values: string[]) => void;
  // data
  replaceState: (s: AppState) => void;
  resetState: () => void;
  dirty: boolean;
  markExported: () => void;
}

const StoreContext = createContext<StoreContextValue | null>(null);

export function AppStoreProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AppState>(() => makeInitialState());
  const [ready, setReady] = useState(false);
  const [dirty, setDirty] = useState(false);
  const loaded = useRef(false);

  useEffect(() => {
    (async () => {
      const saved = await storage.getItem<AppState | null>(STORAGE_KEY, null);
      if (saved && typeof saved === "object" && (saved as AppState).version) {
        setState(migrate(saved as AppState));
      }
      loaded.current = true;
      setReady(true);
    })();
  }, []);

  useEffect(() => {
    if (!loaded.current) return;
    storage.setItem(STORAGE_KEY, state as any);
  }, [state]);

  const update = useCallback((fn: (draft: AppState) => AppState) => {
    setDirty(true);
    setState((prev) => fn({ ...prev }));
  }, []);

  const markExported = useCallback(() => {
    setState((prev) => ({ ...prev, lastExportAt: new Date().toISOString() }));
    setDirty(false);
  }, []);

  const value = useMemo<StoreContextValue>(() => {
    const mutAgents = (mut: (agents: Agent[]) => Agent[]) =>
      update((s) => ({ ...s, agents: mut(s.agents) }));

    return {
      state,
      ready,
      update,

      setSettings: (partial) =>
        update((s) => ({ ...s, settings: { ...s.settings, ...partial } })),

      addAgent: (a) => mutAgents((agents) => [...agents, a]),
      updateAgent: (id, partial) =>
        mutAgents((agents) => agents.map((a) => (a.id === id ? { ...a, ...partial } : a))),
      deleteAgent: (id) =>
        update((s) => ({
          ...s,
          agents: s.agents.filter((a) => a.id !== id),
          objectives: s.objectives.filter((o) => o.agentId !== id),
        })),

      addBuild: (agentId, b) =>
        mutAgents((agents) =>
          agents.map((a) =>
            a.id === agentId ? { ...a, builds: [...a.builds, b] } : a,
          ),
        ),
      updateBuild: (agentId, buildId, partial) =>
        mutAgents((agents) =>
          agents.map((a) =>
            a.id === agentId
              ? {
                  ...a,
                  builds: a.builds.map((b) =>
                    b.id === buildId ? { ...b, ...partial } : b,
                  ),
                }
              : a,
          ),
        ),
      deleteBuild: (agentId, buildId) =>
        mutAgents((agents) =>
          agents.map((a) =>
            a.id === agentId
              ? {
                  ...a,
                  builds: a.builds.filter((b) => b.id !== buildId),
                  activeBuildId:
                    a.activeBuildId === buildId
                      ? a.builds.find((b) => b.id !== buildId)?.id || ""
                      : a.activeBuildId,
                }
              : a,
          ),
        ),
      setActiveBuild: (agentId, buildId) =>
        mutAgents((agents) =>
          agents.map((a) => (a.id === agentId ? { ...a, activeBuildId: buildId } : a)),
        ),

      addObjective: (o) =>
        update((s) => ({
          ...s,
          objectives: [
            ...s.objectives,
            { ...o, id: genId("obj"), createdAt: new Date().toISOString() },
          ],
        })),
      updateObjective: (id, partial) =>
        update((s) => ({
          ...s,
          objectives: s.objectives.map((o) => (o.id === id ? { ...o, ...partial } : o)),
        })),
      deleteObjective: (id) =>
        update((s) => ({ ...s, objectives: s.objectives.filter((o) => o.id !== id) })),
      moveObjective: (id, dir) =>
        update((s) => {
          const idx = s.objectives.findIndex((o) => o.id === id);
          if (idx < 0) return s;
          const target = idx + dir;
          if (target < 0 || target >= s.objectives.length) return s;
          const next = [...s.objectives];
          const [item] = next.splice(idx, 1);
          next.splice(target, 0, item);
          return { ...s, objectives: next };
        }),
      setObjectiveSpecific: (id, materialId, qty) =>
        update((s) => ({
          ...s,
          objectives: s.objectives.map((o) =>
            o.id === id
              ? { ...o, ownedSpecific: { ...o.ownedSpecific, [materialId]: Math.max(0, qty) } }
              : o,
          ),
        })),

      setCommonStock: (materialId, qty) =>
        update((s) => ({
          ...s,
          commonStock: { ...s.commonStock, [materialId]: Math.max(0, qty) },
        })),

      addPreset: (p) => update((s) => ({ ...s, presets: [...s.presets, p] })),
      updatePreset: (id, partial) =>
        update((s) => ({
          ...s,
          presets: s.presets.map((p) => (p.id === id ? { ...p, ...partial } : p)),
        })),
      deletePreset: (id) =>
        update((s) => ({ ...s, presets: s.presets.filter((p) => p.id !== id) })),

      addSession: (session) =>
        update((s) => ({
          ...s,
          pullSessions: [
            ...s.pullSessions,
            { ...session, id: genId("sess"), createdAt: new Date().toISOString() },
          ],
        })),
      updateSession: (id, partial) =>
        update((s) => ({
          ...s,
          pullSessions: s.pullSessions.map((x) => (x.id === id ? { ...x, ...partial } : x)),
        })),
      deleteSession: (id) =>
        update((s) => ({ ...s, pullSessions: s.pullSessions.filter((x) => x.id !== id) })),

      setProjection: (partial) =>
        update((s) => ({ ...s, projection: { ...s.projection, ...partial } })),
      addPatch: () =>
        update((s) => ({
          ...s,
          projection: {
            ...s.projection,
            patches: [
              ...s.projection.patches,
              {
                id: genId("patch"),
                name: `Patch ${s.projection.patches.length + 1}`,
                durationDays: s.settings.patchDurationDays,
                tempIncome: 30,
                startDate: s.projection.patches.length === 0 ? new Date().toISOString().slice(0, 10) : "",
                expenses: [],
              },
            ],
          },
        })),
      updatePatch: (id, partial) =>
        update((s) => ({
          ...s,
          projection: {
            ...s.projection,
            patches: s.projection.patches.map((p) => (p.id === id ? { ...p, ...partial } : p)),
          },
        })),
      deletePatch: (id) =>
        update((s) => ({
          ...s,
          projection: { ...s.projection, patches: s.projection.patches.filter((p) => p.id !== id) },
        })),
      advancePatch: (id) =>
        update((s) => {
          const idx = s.projection.patches.findIndex((p) => p.id === id);
          if (idx < 0) return s;
          const patch = s.projection.patches[idx];
          const archived: ArchivedPatch = {
            id: genId("arch"),
            name: patch.name,
            income: patchIncome(s, patch),
            spent: patchSpent(patch),
            closedAt: new Date().toISOString(),
          };
          const remaining = s.projection.patches.filter((p) => p.id !== id);
          // The new current patch starts today (real start), subsequent dates re-chain.
          if (remaining.length > 0) {
            remaining[0] = { ...remaining[0], startDate: new Date().toISOString().slice(0, 10) };
          }
          return {
            ...s,
            archivedPatches: [...s.archivedPatches, archived],
            projection: { ...s.projection, patches: remaining },
          };
        }),
      validateExpense: (patchId, expenseId, realCost) =>
        update((s) => ({
          ...s,
          projection: {
            ...s.projection,
            masterTapes: Math.max(0, s.projection.masterTapes - realCost),
            patches: s.projection.patches.map((p) =>
              p.id === patchId
                ? { ...p, expenses: p.expenses.map((e) => (e.id === expenseId ? { ...e, actualCost: realCost } : e)) }
                : p,
            ),
          },
        })),
      addExpense: (patchId, e) =>
        update((s) => ({
          ...s,
          projection: {
            ...s.projection,
            patches: s.projection.patches.map((p) =>
              p.id === patchId ? { ...p, expenses: [...p.expenses, { ...e, id: genId("exp") }] } : p,
            ),
          },
        })),
      updateExpense: (patchId, expenseId, partial) =>
        update((s) => ({
          ...s,
          projection: {
            ...s.projection,
            patches: s.projection.patches.map((p) =>
              p.id === patchId
                ? { ...p, expenses: p.expenses.map((e) => (e.id === expenseId ? { ...e, ...partial } : e)) }
                : p,
            ),
          },
        })),
      deleteExpense: (patchId, expenseId) =>
        update((s) => ({
          ...s,
          projection: {
            ...s.projection,
            patches: s.projection.patches.map((p) =>
              p.id === patchId ? { ...p, expenses: p.expenses.filter((e) => e.id !== expenseId) } : p,
            ),
          },
        })),

      addPermanentIncome: (i) =>
        update((s) => ({
          ...s,
          permanentIncomes: [...s.permanentIncomes, { ...i, id: genId("inc") }],
        })),
      updatePermanentIncome: (id, partial) =>
        update((s) => ({
          ...s,
          permanentIncomes: s.permanentIncomes.map((x) => (x.id === id ? { ...x, ...partial } : x)),
        })),
      deletePermanentIncome: (id) =>
        update((s) => ({ ...s, permanentIncomes: s.permanentIncomes.filter((x) => x.id !== id) })),

      setFarmYield: (key, value) =>
        update((s) => ({
          ...s,
          gameConfig: { ...s.gameConfig, farmYield: { ...s.gameConfig.farmYield, [key]: value } },
        })),
      setEventRewardCoefficient: (value) =>
        update((s) => ({ ...s, gameConfig: { ...s.gameConfig, eventRewardCoefficient: value } })),
      setProgRow: (table, index, key, value) =>
        update((s) => {
          const rows = [...(s.gameConfig[table] as Record<string, number>[])];
          rows[index] = { ...rows[index], [key]: value };
          return { ...s, gameConfig: { ...s.gameConfig, [table]: rows } };
        }),
      resetGameConfig: () => update((s) => ({ ...s, gameConfig: DEFAULT_GAME_CONFIG })),

      setOptionList: (key, values) =>
        update((s) => ({ ...s, optionLists: { ...s.optionLists, [key]: values } })),

      replaceState: (s) => {
        setState(migrate(s));
        setDirty(false);
      },
      resetState: () => {
        setState(makeInitialState());
        setDirty(false);
      },
      dirty,
      markExported,
    };
  }, [state, ready, update, dirty, markExported]);

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): StoreContextValue {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used within AppStoreProvider");
  return ctx;
}
