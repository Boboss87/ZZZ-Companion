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
import { makeInitialState } from "./gameData";
import { Agent, AppState, Build, FarmObjective, Preset, Settings } from "./types";

const STORAGE_KEY = "zzz_companion_state_v1";

let counter = 0;
export function genId(prefix: string): string {
  counter += 1;
  return `${prefix}_${Date.now().toString(36)}_${counter}`;
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
  // data
  replaceState: (s: AppState) => void;
  resetState: () => void;
}

const StoreContext = createContext<StoreContextValue | null>(null);

export function AppStoreProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AppState>(() => makeInitialState());
  const [ready, setReady] = useState(false);
  const loaded = useRef(false);

  useEffect(() => {
    (async () => {
      const saved = await storage.getItem<AppState | null>(STORAGE_KEY, null);
      if (saved && typeof saved === "object" && (saved as AppState).version) {
        setState(saved as AppState);
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
    setState((prev) => fn({ ...prev }));
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

      replaceState: (s) => setState(s),
      resetState: () => setState(makeInitialState()),
    };
  }, [state, ready, update]);

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): StoreContextValue {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used within AppStoreProvider");
  return ctx;
}
