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
  Build,
  FarmObjective,
  FarmRate,
  PermanentIncome,
  Preset,
  ProjExpense,
  ProjPatch,
  Projection,
  PullSession,
  RankBareme,
  Settings,
} from "./types";

const STORAGE_KEY = "zzz_companion_state_v1";

let counter = 0;
export function genId(prefix: string): string {
  counter += 1;
  return `${prefix}_${Date.now().toString(36)}_${counter}`;
}

// Fill any missing fields introduced by later versions so old saves keep working.
function migrate(saved: AppState): AppState {
  const base = makeInitialState();
  return {
    ...base,
    ...saved,
    settings: { ...base.settings, ...saved.settings },
    pullSessions: saved.pullSessions ?? base.pullSessions,
    permanentIncomes: saved.permanentIncomes ?? base.permanentIncomes,
    projection: saved.projection ?? base.projection,
    archivedPatches: saved.archivedPatches ?? base.archivedPatches,
    gameConfig: saved.gameConfig ?? base.gameConfig,
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
  closePatch: (id: string) => void;
  addExpense: (patchId: string, e: Omit<ProjExpense, "id">) => void;
  updateExpense: (patchId: string, expenseId: string, partial: Partial<ProjExpense>) => void;
  deleteExpense: (patchId: string, expenseId: string) => void;
  // permanent incomes
  addPermanentIncome: (i: Omit<PermanentIncome, "id">) => void;
  updatePermanentIncome: (id: string, partial: Partial<PermanentIncome>) => void;
  deletePermanentIncome: (id: string) => void;
  // editable game data (barème)
  setFarmRate: (key: keyof FarmRate, value: number) => void;
  setBareme: (rank: "S" | "A", key: keyof RankBareme, value: number) => void;
  resetGameConfig: () => void;
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
                tempIncome: 20,
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
      closePatch: (id) =>
        update((s) => {
          const patch = s.projection.patches.find((p) => p.id === id);
          if (!patch) return s;
          const startTotal =
            s.projection.startPulls + Math.floor((s.projection.polychromes + s.projection.monochromes) / 160);
          const income = patchIncome(s, patch);
          const spent = patchSpent(patch);
          const balanceAfter = startTotal + income - spent;
          const archived: ArchivedPatch = {
            id: genId("arch"),
            name: patch.name,
            income,
            spent,
            closedAt: new Date().toISOString(),
          };
          return {
            ...s,
            archivedPatches: [...s.archivedPatches, archived],
            projection: {
              ...s.projection,
              startPulls: Math.max(0, balanceAfter),
              polychromes: 0,
              monochromes: 0,
              patches: s.projection.patches.filter((p) => p.id !== id),
            },
          };
        }),
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

      setFarmRate: (key, value) =>
        update((s) => ({
          ...s,
          gameConfig: { ...s.gameConfig, farmRate: { ...s.gameConfig.farmRate, [key]: value } },
        })),
      setBareme: (rank, key, value) =>
        update((s) => ({
          ...s,
          gameConfig: {
            ...s.gameConfig,
            ranks: {
              ...s.gameConfig.ranks,
              [rank]: { ...s.gameConfig.ranks[rank], [key]: value },
            },
          },
        })),
      resetGameConfig: () => update((s) => ({ ...s, gameConfig: DEFAULT_GAME_CONFIG })),

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
