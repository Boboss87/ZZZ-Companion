import { AppState, ProjPatch } from "./types";

const DAY = 86400000;

function toDate(iso: string): Date | null {
  const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!m) return null;
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  d.setHours(0, 0, 0, 0);
  return d;
}

function addDays(d: Date, n: number): Date {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

function isoOf(d: Date): string {
  const p = (n: number) => `${n}`.padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

// Full-duration income estimate for a patch (used for the archived summary).
export function patchIncome(state: AppState, patch: ProjPatch): number {
  const polyPerDay = state.permanentIncomes.reduce((sum, i) => sum + i.polyPerDay, 0);
  const permPulls = Math.floor((polyPerDay * patch.durationDays) / 160);
  return permPulls + patch.tempIncome;
}

// Money actually spent in a patch = sum of validated (done) expenses only.
export function patchSpent(patch: ProjPatch): number {
  return patch.expenses.reduce((sum, e) => sum + (e.actualCost ?? 0), 0);
}

export interface ProjRow {
  patch: ProjPatch;
  startISO: string; // computed start date
  endISO: string; // computed end date (exclusive — next patch start)
  elapsed: number; // days elapsed within the patch (0..duration)
  daysRemaining: number; // days left within the patch
  income: number; // remaining income to earn (perm + remaining event rewards)
  plannedSpent: number; // planned (not-yet-done) expenses
  plannedCount: number;
  doneCount: number;
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
  const p = state.projection;
  const startTotal =
    p.masterTapes +
    Math.floor(p.polychromes / 160) +
    Math.floor(p.monochromes / 160) +
    Math.floor(p.residualSignals / 20);

  const polyPerDay = state.permanentIncomes.reduce((sum, i) => sum + i.polyPerDay, 0);
  const k = state.gameConfig.eventRewardCoefficient || 1;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const rows: ProjRow[] = [];
  let balance = startTotal;
  let firstDeficitIndex = -1;
  const safeAvg = avgDesired > 0 ? avgDesired : 130;

  // The first patch anchors the chain with its user-set start date.
  let cursor: Date | null = p.patches[0]?.startDate ? toDate(p.patches[0].startDate) : null;

  p.patches.forEach((patch, i) => {
    const start = cursor;
    const duration = Math.max(1, patch.durationDays);

    let elapsed = 0;
    if (start) {
      const diff = Math.floor((today.getTime() - start.getTime()) / DAY);
      elapsed = Math.max(0, Math.min(duration, diff));
    }
    const daysRemaining = Math.max(0, duration - elapsed);

    // Daily (permanent) income is always linear over the remaining days.
    const permPulls = Math.floor((polyPerDay * daysRemaining) / 160);
    // Event rewards distributed over the patch; only the remaining part is projected.
    const f = duration > 0 ? elapsed / duration : 0;
    const rewardsRemaining = Math.round(patch.tempIncome * Math.pow(1 - f, k));
    const income = permPulls + rewardsRemaining;

    // Only planned (not validated) expenses count — done ones are already deducted.
    const planned = patch.expenses.filter((e) => e.actualCost === null);
    const plannedSpent = planned.reduce((s, e) => s + e.pullCost, 0);

    const balanceBefore = balance;
    const balanceAfter = balanceBefore + income - plannedSpent;
    const deficit = balanceAfter < 0;
    if (deficit && firstDeficitIndex < 0) firstDeficitIndex = i;

    rows.push({
      patch,
      startISO: start ? isoOf(start) : "",
      endISO: start ? isoOf(addDays(start, duration)) : "",
      elapsed,
      daysRemaining,
      income,
      plannedSpent,
      plannedCount: planned.length,
      doneCount: patch.expenses.length - planned.length,
      balanceBefore,
      balanceAfter,
      chars: Math.floor(Math.max(0, balanceAfter) / safeAvg),
      deficit,
    });

    balance = balanceAfter;
    cursor = start ? addDays(start, duration) : null;
  });

  return { startTotal, avgDesired: safeAvg, rows, firstDeficitIndex };
}
