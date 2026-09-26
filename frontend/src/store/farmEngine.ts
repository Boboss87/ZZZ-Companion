import { computeRequirements } from "./gameData";
import { Agent, AppState, FarmObjective, FarmRate, Preset } from "./types";

export function getFarmEnergy(s: AppState["settings"]): number {
  const discEnergy = s.discRuns * 60;
  const battery = s.reserveDailyBattery ? 60 : 0;
  return Math.max(0, s.dailyEnergy - discEnergy - battery);
}

export function batteryDays(s: AppState["settings"]): number {
  const farm = getFarmEnergy(s);
  if (farm <= 0) return 0;
  return Math.round((s.backupBatteries * 60) / farm);
}

export interface FarmRow {
  key: string;
  objectiveId: string;
  agentId: string;
  agentName: string;
  materialId: string;
  materialName: string;
  type: string;
  remaining: number;
  days: number;
  priority: number; // objective index
}

export interface ObjectiveStatus {
  objectiveId: string;
  agent: Agent | undefined;
  preset: Preset | undefined;
  totalEnergy: number;
  remainingEnergy: number;
  progress: number; // 0..1
  complete: boolean;
  daysLeft: number;
  rows: FarmRow[];
}

export interface FarmResult {
  farmEnergy: number;
  rows: FarmRow[];
  statuses: ObjectiveStatus[];
}

function energyFor(rate: FarmRate, type: string, qty: number): number {
  const per = (rate as unknown as Record<string, number>)[type];
  return per > 0 ? (qty * 60) / per : 0;
}

export function computeFarm(state: AppState): FarmResult {
  const farmEnergy = getFarmEnergy(state.settings);
  const agentsById = new Map(state.agents.map((a) => [a.id, a]));
  const presetsById = new Map(state.presets.map((p) => [p.id, p]));

  // Common stock is consumed by priority order (objectives array order).
  const commonRemaining: Record<string, number> = { ...state.commonStock };

  const statuses: ObjectiveStatus[] = [];
  const allRows: FarmRow[] = [];

  state.objectives.forEach((obj: FarmObjective, index: number) => {
    const agent = agentsById.get(obj.agentId);
    const preset = presetsById.get(obj.presetId);
    if (!agent || !preset) {
      statuses.push({
        objectiveId: obj.id,
        agent,
        preset,
        totalEnergy: 0,
        remainingEnergy: 0,
        progress: 0,
        complete: false,
        daysLeft: 0,
        rows: [],
      });
      return;
    }

    const reqs = computeRequirements(agent, preset, state.gameConfig);
    const rate = state.gameConfig.farmRate;
    let totalEnergy = 0;
    let remainingEnergy = 0;
    const rows: FarmRow[] = [];

    for (const r of reqs) {
      totalEnergy += energyFor(rate, r.type, r.qty);
      let remaining = 0;
      if (r.scope === "common") {
        const avail = commonRemaining[r.materialId] ?? 0;
        const covered = Math.min(avail, r.qty);
        remaining = r.qty - covered;
        commonRemaining[r.materialId] = avail - covered;
      } else {
        const owned = obj.ownedSpecific[r.materialId] ?? 0;
        remaining = Math.max(0, r.qty - owned);
      }
      const remEnergy = energyFor(rate, r.type, remaining);
      remainingEnergy += remEnergy;
      if (remaining > 0) {
        const row: FarmRow = {
          key: `${obj.id}-${r.materialId}`,
          objectiveId: obj.id,
          agentId: agent.id,
          agentName: agent.name,
          materialId: r.materialId,
          materialName: r.name,
          type: r.type,
          remaining,
          days: farmEnergy > 0 ? Math.ceil(remEnergy / farmEnergy) : 0,
          priority: index,
        };
        rows.push(row);
        allRows.push(row);
      }
    }

    const complete = remainingEnergy <= 0;
    statuses.push({
      objectiveId: obj.id,
      agent,
      preset,
      totalEnergy,
      remainingEnergy,
      progress: totalEnergy > 0 ? 1 - remainingEnergy / totalEnergy : 1,
      complete,
      daysLeft: farmEnergy > 0 ? Math.ceil(remainingEnergy / farmEnergy) : 0,
      rows,
    });
  });

  return { farmEnergy, rows: allRows, statuses };
}

export function presetSummary(p: Preset): string {
  return `Lv${p.charLevel} · Moteur ${p.engineLevel} · ${p.basic}/${p.ex}/${p.ultimate} · Core ${p.coreSkill}`;
}

export function fmtQty(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}k`;
  return `${n}`;
}

export function fmtDays(d: number): string {
  if (d <= 0) return "—";
  if (d === 1) return "1 jour";
  return `${d} jours`;
}
