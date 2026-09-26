import { AppState, ProjPatch } from "./types";

export function patchIncome(state: AppState, patch: ProjPatch): number {
  const base = state.permanentIncomes.reduce((sum, i) => sum + i.pullsPerPatch, 0);
  const factor = state.settings.patchDurationDays > 0 ? patch.durationDays / state.settings.patchDurationDays : 1;
  return Math.round(base * factor) + patch.tempIncome;
}

export function patchSpent(patch: ProjPatch): number {
  return patch.expenses.reduce((sum, e) => sum + (e.actualCost ?? e.pullCost), 0);
}

export interface ProjRow {
  patch: ProjPatch;
  income: number;
  spent: number;
  balanceBefore: number;
  balanceAfter: number;
  chars: number;
  deficit: boolean;
}

export interface ProjResult {
  startTotal: number;
  avgDesired: number;
  rows: ProjRow[];
  firstDeficitIndex: number;
}

export function computeProjection(state: AppState, avgDesired: number): ProjResult {
  const startTotal =
    state.projection.startPulls +
    Math.floor((state.projection.polychromes + state.projection.monochromes) / 160);

  const rows: ProjRow[] = [];
  let balance = startTotal;
  let firstDeficitIndex = -1;
  const safeAvg = avgDesired > 0 ? avgDesired : 130;

  state.projection.patches.forEach((patch, i) => {
    const income = patchIncome(state, patch);
    const spent = patchSpent(patch);
    const balanceBefore = balance;
    const balanceAfter = balanceBefore + income - spent;
    const deficit = balanceAfter < 0;
    if (deficit && firstDeficitIndex < 0) firstDeficitIndex = i;
    rows.push({
      patch,
      income,
      spent,
      balanceBefore,
      balanceAfter,
      chars: Math.floor(Math.max(0, balanceAfter) / safeAvg),
      deficit,
    });
    balance = balanceAfter;
  });

  return { startTotal, avgDesired: safeAvg, rows, firstDeficitIndex };
}
