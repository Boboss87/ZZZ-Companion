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

export interface Settings {
  dailyEnergy: number; // default 320
  discRuns: number; // runs/day, 60 energy each
  reserveDailyBattery: boolean; // reserve 60 energy for a daily battery
  backupBatteries: number;
  patchDurationDays: number; // default 42
  safetyMargin: number; // pulls
}

export interface AppState {
  version: number;
  settings: Settings;
  presets: Preset[];
  agents: Agent[];
  objectives: FarmObjective[]; // order = priority (index 0 = highest)
  commonStock: Record<string, number>; // materialId -> qty
}
