export type Element = "Ice" | "Fire" | "Electric" | "Physical" | "Ether";
export type Specialization =
  | "Attack"
  | "Stun"
  | "Anomaly"
  | "Support"
  | "Defense"
  | "Rupture";
export type Rank = "S" | "A";

export interface Build {
  id: string;
  name: string;
  set4: string;
  set2: string;
  mainStat4: string;
  mainStat5: string;
  mainStat6: string;
  substats: string[];
  skillPriority: string;
  engine: string;
  alternatives: string;
  caps: string;
  official: boolean;
}

export interface Agent {
  id: string;
  name: string;
  rank: Rank;
  element: Element;
  specialization: Specialization;
  faction: string;
  portrait: string; // optional url
  releaseDate: string; // ISO date
  lastBanner: string;
  // technical / farm data (source of truth for the farm assistant)
  promoMaterial: string;
  skillMaterial: string;
  bossMaterial: string;
  // personal collection
  owned: boolean;
  mindscape: number; // 0..6
  hasSignatureEngine: boolean;
  engineRank: number; // 1..5 (P1..P5)
  wishlist: boolean;
  notes: string;
  builds: Build[];
  activeBuildId: string;
}

export interface Preset {
  id: string;
  name: string;
  charLevel: number;
  engineLevel: number;
  basic: number;
  ex: number;
  ultimate: number;
  dodge: number;
  assist: number;
  coreSkill: string; // "A".."F"
}

export interface FarmObjective {
  id: string;
  agentId: string;
  presetId: string;
  targetDate: string; // ISO or ""
  ownedSpecific: Record<string, number>; // material name -> qty owned
  createdAt: string;
}

export type ThemeMode = "light" | "dark" | "system";

export interface Settings {
  dailyEnergy: number; // default 320
  discRuns: number; // runs/day, 60 energy each
  reserveDailyBattery: boolean; // reserve 60 energy for a daily battery
  backupBatteries: number;
  patchDurationDays: number; // default 42
  safetyMargin: number; // pulls
  themeMode: ThemeMode;
  avgDesiredCost: number; // fallback avg pulls for a desired character
}

// ---------------------------------------------------------------------------
// Historique de pulls
// ---------------------------------------------------------------------------
export type BannerType = "char_limited" | "engine_limited" | "bangboo" | "permanent";
export type Outcome = "won" | "lost" | "guaranteed" | "na";

export interface SRankResult {
  id: string;
  name: string;
  position: number; // cumulative pull within the session
  isDesired: boolean;
  outcome: Outcome; // 50/50 (char) or 75/25 (engine) result
}

export interface PullSession {
  id: string;
  banner: BannerType;
  date: string;
  pulls: number;
  results: SRankResult[];
  createdAt: string;
}

// ---------------------------------------------------------------------------
// Projection de pulls (financial planner)
// ---------------------------------------------------------------------------
export interface PermanentIncome {
  id: string;
  name: string;
  pullsPerPatch: number; // at the default patch duration
}

export interface ProjExpense {
  id: string;
  name: string;
  pullCost: number;
  actualCost: number | null; // set once the banner is finished
}

export interface ProjPatch {
  id: string;
  name: string;
  durationDays: number;
  tempIncome: number; // pulls from events
  expenses: ProjExpense[];
}

export interface Projection {
  startPulls: number;
  polychromes: number;
  monochromes: number;
  patches: ProjPatch[];
}

export interface ArchivedPatch {
  id: string;
  name: string;
  income: number;
  spent: number;
  closedAt: string;
}

export interface AppState {
  version: number;
  settings: Settings;
  presets: Preset[];
  agents: Agent[];
  objectives: FarmObjective[]; // order = priority (index 0 = highest)
  commonStock: Record<string, number>; // materialId -> qty
  pullSessions: PullSession[];
  permanentIncomes: PermanentIncome[];
  projection: Projection;
  archivedPatches: ArchivedPatch[];
}
