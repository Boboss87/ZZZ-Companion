import { BannerType, PullSession } from "./types";

export const BANNERS: { id: BannerType; label: string; short: string; has5050: boolean; ratio: string }[] = [
  { id: "char_limited", label: "Perso limité", short: "Perso", has5050: true, ratio: "50/50" },
  { id: "engine_limited", label: "Moteur limité", short: "Moteur", has5050: true, ratio: "75/25" },
  { id: "bangboo", label: "Bangboo", short: "Bangboo", has5050: false, ratio: "" },
  { id: "permanent", label: "Standard", short: "Standard", has5050: false, ratio: "" },
];

export function bannerLabel(id: BannerType): string {
  return BANNERS.find((b) => b.id === id)?.label ?? id;
}

export interface SRankRow {
  sessionId: string;
  date: string;
  name: string;
  position: number;
  cost: number; // pulls used since previous S-rank
  isDesired: boolean;
  outcome: string;
}

export interface BannerStats {
  banner: BannerType;
  totalPulls: number;
  totalSRanks: number;
  avgSRank: number;
  avgDesired: number;
  currentPity: number;
  wins: number;
  losses: number;
  winRate: number;
  rows: SRankRow[];
}

function mean(arr: number[]): number {
  if (arr.length === 0) return 0;
  return Math.round(arr.reduce((a, b) => a + b, 0) / arr.length);
}

export function computeBannerStats(banner: BannerType, allSessions: PullSession[]): BannerStats {
  const sessions = allSessions
    .filter((s) => s.banner === banner)
    .slice()
    .sort((a, b) => (a.date || a.createdAt).localeCompare(b.date || b.createdAt));

  let pity = 0;
  let desiredAcc = 0;
  let totalPulls = 0;
  let wins = 0;
  let losses = 0;
  const srCosts: number[] = [];
  const desiredCosts: number[] = [];
  const rows: SRankRow[] = [];

  for (const session of sessions) {
    totalPulls += session.pulls;
    const results = session.results.slice().sort((a, b) => a.position - b.position);
    let prevPos = 0;
    for (const r of results) {
      const cost = pity + (r.position - prevPos);
      srCosts.push(cost);
      desiredAcc += cost;
      if (r.isDesired) {
        desiredCosts.push(desiredAcc);
        desiredAcc = 0;
      }
      if (r.outcome === "won") wins += 1;
      else if (r.outcome === "lost") losses += 1;
      rows.push({
        sessionId: session.id,
        date: session.date,
        name: r.name,
        position: r.position,
        cost,
        isDesired: r.isDesired,
        outcome: r.outcome,
      });
      pity = 0;
      prevPos = r.position;
    }
    pity += session.pulls - prevPos;
  }

  return {
    banner,
    totalPulls,
    totalSRanks: srCosts.length,
    avgSRank: mean(srCosts),
    avgDesired: mean(desiredCosts),
    currentPity: pity,
    wins,
    losses,
    winRate: wins + losses > 0 ? Math.round((wins / (wins + losses)) * 100) : 0,
  };
}

// Best available estimate of a desired character's average pull cost.
export function desiredCostEstimate(allSessions: PullSession[], fallback: number): number {
  const stats = computeBannerStats("char_limited", allSessions);
  return stats.avgDesired > 0 ? stats.avgDesired : fallback;
}
