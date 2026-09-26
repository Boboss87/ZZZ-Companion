import { Agent, AppState, Build, Preset } from "./types";

// ---------------------------------------------------------------------------
// Common materials (global shared stock)
// ---------------------------------------------------------------------------
export const COMMON_MATERIALS: { id: string; name: string; type: string }[] = [
  { id: "dennies", name: "Dennies", type: "dennies" },
  { id: "logs", name: "Journaux d'enquête", type: "logs" },
  { id: "power", name: "Modules d'alimentation", type: "power" },
  { id: "hamster", name: "Cage à hamster", type: "hamster" },
];

export const COMMON_IDS = COMMON_MATERIALS.map((m) => m.id);

// Energy required to farm ONE unit of each material type. Used for time
// estimates. Approximate values — the single user can refine them over time.
export const ENERGY_PER_UNIT: Record<string, number> = {
  dennies: 0.0016,
  logs: 0.9,
  power: 0.9,
  hamster: 3,
  promo: 40, // agent promotion material (specific)
  skillMat: 22, // Expert Challenge skill material (specific)
  boss: 30, // Notorious boss material (specific)
};

// ---------------------------------------------------------------------------
// Cost tables (approximate ZZZ S-rank leveling costs)
// ---------------------------------------------------------------------------
const CHAR_ASCENSION = { dennies: 100000, logs: 366, promo: 24 };
const ENGINE_ASCENSION = { dennies: 100000, power: 366 };

// Incremental cost to raise ONE skill from level L-1 to L (index = level).
const SKILL_INC = {
  dennies: [0, 0, 1000, 2000, 4000, 6000, 9000, 13000, 18000, 25000, 35000, 48000],
  hamster: [0, 0, 2, 3, 4, 5, 6, 8, 10, 12, 15, 18],
  skillMat: [0, 0, 0, 0, 0, 1, 1, 2, 2, 3, 3, 4],
  boss: [0, 0, 0, 0, 0, 0, 0, 1, 1, 2, 2, 3],
};

// Cumulative Core Skill cost by rank index (A=0 .. F=5).
const CORE_CUM = {
  dennies: [0, 5000, 12000, 22000, 36000, 55000],
  hamster: [0, 3, 7, 12, 18, 25],
  skillMat: [0, 1, 2, 3, 4, 6],
  boss: [0, 1, 2, 3, 4, 5],
};

export function coreRankIndex(rank: string): number {
  const idx = "ABCDEF".indexOf((rank || "A").toUpperCase());
  return idx < 0 ? 0 : idx;
}

function charCost(level: number) {
  const f = Math.max(0, Math.min(1, level / 60));
  return {
    dennies: Math.round(CHAR_ASCENSION.dennies * f),
    logs: Math.round(CHAR_ASCENSION.logs * f),
    promo: Math.round(CHAR_ASCENSION.promo * f),
  };
}

function engineCost(level: number) {
  const f = Math.max(0, Math.min(1, level / 60));
  return {
    dennies: Math.round(ENGINE_ASCENSION.dennies * f),
    power: Math.round(ENGINE_ASCENSION.power * f),
  };
}

function skillCumTo(level: number) {
  const out = { dennies: 0, hamster: 0, skillMat: 0, boss: 0 };
  for (let l = 2; l <= level; l++) {
    out.dennies += SKILL_INC.dennies[l] || 0;
    out.hamster += SKILL_INC.hamster[l] || 0;
    out.skillMat += SKILL_INC.skillMat[l] || 0;
    out.boss += SKILL_INC.boss[l] || 0;
  }
  return out;
}

export interface ReqEntry {
  materialId: string;
  name: string;
  type: string;
  qty: number;
  scope: "common" | "specific";
}

// Total materials needed to bring an agent to a preset target.
export function computeRequirements(agent: Agent, preset: Preset): ReqEntry[] {
  const c = charCost(preset.charLevel);
  const e = engineCost(preset.engineLevel);

  const skills = [preset.basic, preset.ex, preset.ultimate, preset.dodge, preset.assist];
  let sDennies = 0,
    sHamster = 0,
    sSkillMat = 0,
    sBoss = 0;
  for (const lvl of skills) {
    const s = skillCumTo(lvl);
    sDennies += s.dennies;
    sHamster += s.hamster;
    sSkillMat += s.skillMat;
    sBoss += s.boss;
  }
  const ci = coreRankIndex(preset.coreSkill);
  const core = {
    dennies: CORE_CUM.dennies[ci],
    hamster: CORE_CUM.hamster[ci],
    skillMat: CORE_CUM.skillMat[ci],
    boss: CORE_CUM.boss[ci],
  };

  const dennies = c.dennies + e.dennies + sDennies + core.dennies;
  const logs = c.logs;
  const power = e.power;
  const hamster = sHamster + core.hamster;
  const promo = c.promo;
  const skillMat = sSkillMat + core.skillMat;
  const boss = sBoss + core.boss;

  return [
    { materialId: "dennies", name: "Dennies", type: "dennies", qty: dennies, scope: "common" },
    { materialId: "logs", name: "Journaux d'enquête", type: "logs", qty: logs, scope: "common" },
    { materialId: "power", name: "Modules d'alimentation", type: "power", qty: power, scope: "common" },
    { materialId: "hamster", name: "Cage à hamster", type: "hamster", qty: hamster, scope: "common" },
    { materialId: agent.promoMaterial, name: agent.promoMaterial, type: "promo", qty: promo, scope: "specific" },
    { materialId: agent.skillMaterial, name: agent.skillMaterial, type: "skillMat", qty: skillMat, scope: "specific" },
    { materialId: agent.bossMaterial, name: agent.bossMaterial, type: "boss", qty: boss, scope: "specific" },
  ].filter((r) => r.qty > 0 && !!r.materialId);
}

// ---------------------------------------------------------------------------
// Default presets
// ---------------------------------------------------------------------------
export const DEFAULT_PRESETS: Preset[] = [
  {
    id: "preset_normal",
    name: "Build normal",
    charLevel: 60,
    engineLevel: 60,
    basic: 11,
    ex: 12,
    ultimate: 11,
    dodge: 6,
    assist: 6,
    coreSkill: "F",
  },
  {
    id: "preset_vh",
    name: "Build VH",
    charLevel: 60,
    engineLevel: 60,
    basic: 12,
    ex: 12,
    ultimate: 12,
    dodge: 6,
    assist: 6,
    coreSkill: "F",
  },
];

// ---------------------------------------------------------------------------
// Seed agents (a few real ZZZ agents as examples — editable in the ZZZdex)
// ---------------------------------------------------------------------------
function build(partial: Partial<Build> & { id: string; name: string }): Build {
  return {
    set4: "",
    set2: "",
    mainStat4: "Crit ATK",
    mainStat5: "Dégâts élément",
    mainStat6: "ATK%",
    substats: ["Crit RATE", "Crit ATK", "ATK%"],
    skillPriority: "EX > Basic > Ultimate > Assist > Dodge",
    engine: "",
    alternatives: "",
    caps: "",
    official: true,
    ...partial,
  };
}

let uid = 0;
const nid = (p: string) => `${p}_${++uid}`;

function agent(a: Partial<Agent> & { id: string; name: string; element: Agent["element"]; specialization: Agent["specialization"]; rank: Agent["rank"]; faction: string }): Agent {
  const std = build({
    id: nid("b"),
    name: "Build standard",
    set4: a.rank === "S" ? "Woodpecker Electro" : "Freedom Blues",
    set2: "Puffer Electro",
    engine: "Signature",
  });
  return {
    portrait: "",
    releaseDate: "",
    lastBanner: "",
    promoMaterial: `Certificat ${a.name}`,
    skillMaterial: "Défi d'expert",
    bossMaterial: "Matériau de boss",
    owned: false,
    mindscape: 0,
    hasSignatureEngine: false,
    engineRank: 1,
    wishlist: false,
    notes: "",
    builds: [std],
    activeBuildId: std.id,
    ...a,
  };
}

export const SEED_AGENTS: Agent[] = [
  agent({
    id: "ellen", name: "Ellen Joe", rank: "S", element: "Ice", specialization: "Attack",
    faction: "Victoria Housekeeping", releaseDate: "2024-07-04", lastBanner: "2024-07-04",
    promoMaterial: "Certificat Ellen", skillMaterial: "Ombre du Requin", bossMaterial: "Cristal de Notorious",
    owned: true, mindscape: 0, hasSignatureEngine: true, engineRank: 1,
  }),
  agent({
    id: "zhuyuan", name: "Zhu Yuan", rank: "S", element: "Ether", specialization: "Attack",
    faction: "Criminal Investigation", releaseDate: "2024-07-24", lastBanner: "2024-07-24",
    promoMaterial: "Certificat Zhu Yuan", skillMaterial: "Badge des Enquêteurs", bossMaterial: "Noyau de Notorious",
    owned: true, mindscape: 1, hasSignatureEngine: true, engineRank: 1,
  }),
  agent({
    id: "miyabi", name: "Hoshimi Miyabi", rank: "S", element: "Ice", specialization: "Anomaly",
    faction: "Section 6", releaseDate: "2024-11-29", lastBanner: "2024-11-29",
    promoMaterial: "Certificat Miyabi", skillMaterial: "Lame de Givre", bossMaterial: "Éclat de Notorious",
    owned: false, wishlist: true,
  }),
  agent({
    id: "qingyi", name: "Qingyi", rank: "S", element: "Electric", specialization: "Stun",
    faction: "Criminal Investigation", releaseDate: "2024-09-04", lastBanner: "2024-09-04",
    promoMaterial: "Certificat Qingyi", skillMaterial: "Circuit de Voltage", bossMaterial: "Noyau de Notorious",
    owned: true, mindscape: 0,
  }),
  agent({
    id: "jane", name: "Jane Doe", rank: "S", element: "Physical", specialization: "Anomaly",
    faction: "Criminal Investigation", releaseDate: "2024-10-14", lastBanner: "2024-10-14",
    promoMaterial: "Certificat Jane", skillMaterial: "Rose Écarlate", bossMaterial: "Griffe de Notorious",
    owned: false, wishlist: true,
  }),
  agent({
    id: "burnice", name: "Burnice", rank: "S", element: "Fire", specialization: "Anomaly",
    faction: "Sons of Calydon", releaseDate: "2024-10-14", lastBanner: "2024-10-14",
    promoMaterial: "Certificat Burnice", skillMaterial: "Étincelle Nitro", bossMaterial: "Cendre de Notorious",
    owned: false,
  }),
  agent({
    id: "lycaon", name: "Von Lycaon", rank: "S", element: "Ice", specialization: "Stun",
    faction: "Victoria Housekeeping", releaseDate: "2024-07-04", lastBanner: "2024-07-04",
    promoMaterial: "Certificat Lycaon", skillMaterial: "Croc de Givre", bossMaterial: "Cristal de Notorious",
    owned: true, mindscape: 0,
  }),
  agent({
    id: "rina", name: "Rina", rank: "S", element: "Electric", specialization: "Support",
    faction: "Victoria Housekeeping", releaseDate: "2024-07-04", lastBanner: "2024-07-04",
    promoMaterial: "Certificat Rina", skillMaterial: "Circuit de Voltage", bossMaterial: "Noyau de Notorious",
    owned: true, mindscape: 6,
  }),
  agent({
    id: "nicole", name: "Nicole", rank: "A", element: "Ether", specialization: "Support",
    faction: "Cunning Hares", releaseDate: "2024-07-04", lastBanner: "2024-07-04",
    promoMaterial: "Certificat Nicole", skillMaterial: "Badge des Lièvres", bossMaterial: "Fragment d'Éther",
    owned: true, mindscape: 6,
  }),
  agent({
    id: "anby", name: "Anby Demara", rank: "A", element: "Electric", specialization: "Stun",
    faction: "Cunning Hares", releaseDate: "2024-07-04", lastBanner: "2024-07-04",
    promoMaterial: "Certificat Anby", skillMaterial: "Circuit de Voltage", bossMaterial: "Fragment Électrique",
    owned: true, mindscape: 6,
  }),
  agent({
    id: "nekomata", name: "Nekomata", rank: "S", element: "Physical", specialization: "Attack",
    faction: "Cunning Hares", releaseDate: "2024-07-04", lastBanner: "2024-08-14",
    promoMaterial: "Certificat Nekomata", skillMaterial: "Griffe Féline", bossMaterial: "Griffe de Notorious",
    owned: false,
  }),
  agent({
    id: "soukaku", name: "Soukaku", rank: "A", element: "Ice", specialization: "Support",
    faction: "Section 6", releaseDate: "2024-07-04", lastBanner: "2024-07-04",
    promoMaterial: "Certificat Soukaku", skillMaterial: "Éventail de Givre", bossMaterial: "Fragment de Glace",
    owned: true, mindscape: 6,
  }),
  agent({
    id: "koleda", name: "Koleda", rank: "S", element: "Fire", specialization: "Stun",
    faction: "Belobog", releaseDate: "2024-07-04", lastBanner: "2024-07-04",
    promoMaterial: "Certificat Koleda", skillMaterial: "Marteau Ardent", bossMaterial: "Cendre de Notorious",
    owned: false,
  }),
  agent({
    id: "grace", name: "Grace Howard", rank: "S", element: "Electric", specialization: "Anomaly",
    faction: "Belobog", releaseDate: "2024-07-04", lastBanner: "2024-07-04",
    promoMaterial: "Certificat Grace", skillMaterial: "Bobine Tesla", bossMaterial: "Noyau de Notorious",
    owned: false, wishlist: true,
  }),
];

export function makeInitialState(): AppState {
  const stock: Record<string, number> = {};
  COMMON_IDS.forEach((id) => (stock[id] = 0));
  return {
    version: 1,
    settings: {
      dailyEnergy: 320,
      discRuns: 2,
      reserveDailyBattery: false,
      backupBatteries: 0,
      patchDurationDays: 42,
      safetyMargin: 10,
    },
    presets: DEFAULT_PRESETS,
    agents: SEED_AGENTS,
    objectives: [
      {
        id: nid("obj"),
        agentId: "miyabi",
        presetId: "preset_normal",
        targetDate: "",
        ownedSpecific: {},
        createdAt: new Date().toISOString(),
      },
    ],
    commonStock: stock,
  };
}

export const DISC_SETS = [
  "Woodpecker Electro",
  "Puffer Electro",
  "Freedom Blues",
  "Swing Jazz",
  "Chaos Jazz",
  "Fanged Metal",
  "Polar Metal",
  "Thunder Metal",
  "Inferno Metal",
  "Chaotic Metal",
  "Hormone Punk",
  "Soul Rock",
  "Proto Punk",
  "Shockstar Disco",
  "Branch & Blade Song",
  "Astral Voice",
];

export const ELEMENTS: string[] = ["Ice", "Fire", "Electric", "Physical", "Ether"];
export const SPECIALIZATIONS: string[] = [
  "Attack",
  "Stun",
  "Anomaly",
  "Support",
  "Defense",
  "Rupture",
];
export const RANKS: string[] = ["S", "A"];
