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
  reruns: number; // number of reruns (manual)
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
  autoBackup: boolean; // propose a file backup when leaving the app
  resourceFolderUri: string; // local (SAF) or remote base for graphical resources
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
  polyPerDay: number; // polychromes per day
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
  tempIncome: number; // estimated event rewards (pulls) over the patch
  startDate: string; // ISO — set on the first (current) patch; others derived
  expenses: ProjExpense[];
}

export interface Projection {
  masterTapes: number;
  polychromes: number;
  monochromes: number;
  residualSignals: number;
  patches: ProjPatch[];
}

export interface ArchivedPatch {
  id: string;
  name: string;
  income: number;
  spent: number;
  closedAt: string;
}

// ---------------------------------------------------------------------------
// Editable game data (barème de farm) — per-level tables (source of truth).
// ---------------------------------------------------------------------------
// Yields obtained for `energy` spent (averages, used for time estimates).
export interface FarmYield {
  energy: number;
  dennies: number;
  logs: number; // journaux (character EXP)
  power: number; // modules (engine EXP)
  sceaux: number; // agent promotion (specialization)
  composants: number; // engine promotion (specialization)
  puces: number; // skill chips (element)
  expert: number; // core expert (agent)
}

export interface AgentProgRow { denny: number; journaux: number; sceaux: number }
export interface EngineProgRow { denny: number; modules: number; composants: number }
export interface SkillProgRow { denny: number; puces: number; hamster: number }
export interface CoreProgRow { denny: number; expert: number; infame: number }

export interface GameConfig {
  farmYield: FarmYield;
  agentProg: AgentProgRow[]; // 6 breakpoints (1-10 .. 50-60)
  engineProg: EngineProgRow[]; // 6 breakpoints
  skillProg: SkillProgRow[]; // 11 rows (1-2 .. 11-12), per single skill
  coreProg: CoreProgRow[]; // 6 rows (A .. F)
  eventRewardCoefficient: number; // exponent for event-reward distribution (1 = linear)
}

// User-editable option lists (dropdown choices across the app).
export interface OptionLists {
  elements: string[];
  specializations: string[];
  discSets: string[];
  mainStats: string[];
  subStats: string[];
}

export interface AppState {
  version: number;
  settings: Settings;
  optionLists: OptionLists;
  presets: Preset[];
  agents: Agent[];
  objectives: FarmObjective[]; // order = priority (index 0 = highest)
  commonStock: Record<string, number>; // materialId -> qty
  pullSessions: PullSession[];
  permanentIncomes: PermanentIncome[];
  projection: Projection;
  archivedPatches: ArchivedPatch[];
  lastExportAt: string | null;
  gameConfig: GameConfig;
}
