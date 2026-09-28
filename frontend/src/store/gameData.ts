import { Agent, AppState, Build, GameConfig, Preset } from "./types";

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
export function coreRankIndex(rank: string): number {
  const idx = "ABCDEF".indexOf((rank || "A").toUpperCase());
  return idx < 0 ? 0 : idx;
}

export interface ReqEntry {
  materialId: string;
  name: string;
  type: string;
  qty: number;
  scope: "common" | "specific";
  countsForTime: boolean;
}

// Real barème from the user's ZZZ Database (per-level, editable in-app).
export const DEFAULT_GAME_CONFIG: GameConfig = {
  farmYield: { energy: 20, dennies: 25000, logs: 4.2, power: 5.4, sceaux: 1.495, composants: 2.165, puces: 1.83, expert: 2.5 },
  agentProg: [
    { denny: 0, journaux: 2, sceaux: 0 },
    { denny: 24000, journaux: 8, sceaux: 0.444 },
    { denny: 56000, journaux: 20, sceaux: 4 },
    { denny: 120000, journaux: 45, sceaux: 6.666 },
    { denny: 200000, journaux: 75, sceaux: 10 },
    { denny: 400000, journaux: 150, sceaux: 20 },
  ],
  engineProg: [
    { denny: 0, modules: 0.8, composants: 0 },
    { denny: 12000, modules: 3.2, composants: 0.444 },
    { denny: 28000, modules: 8, composants: 4 },
    { denny: 60000, modules: 18, composants: 6.666 },
    { denny: 100000, modules: 30, composants: 10 },
    { denny: 200000, modules: 60, composants: 20 },
  ],
  skillProg: [
    { denny: 2000, puces: 0.222, hamster: 0 },
    { denny: 3000, puces: 0.333, hamster: 0 },
    { denny: 6000, puces: 0.666, hamster: 0 },
    { denny: 9000, puces: 1, hamster: 0 },
    { denny: 12000, puces: 1.333, hamster: 0 },
    { denny: 18000, puces: 2, hamster: 0 },
    { denny: 45000, puces: 5, hamster: 0 },
    { denny: 67500, puces: 8, hamster: 0 },
    { denny: 90000, puces: 10, hamster: 0 },
    { denny: 112500, puces: 12, hamster: 0 },
    { denny: 135000, puces: 15, hamster: 1 },
  ],
  coreProg: [
    { denny: 5000, expert: 0, infame: 0 },
    { denny: 12000, expert: 2, infame: 0 },
    { denny: 28000, expert: 4, infame: 0 },
    { denny: 60000, expert: 9, infame: 2 },
    { denny: 100000, expert: 15, infame: 3 },
    { denny: 200000, expert: 30, infame: 4 },
  ],
};

function sumRows<T>(rows: T[], count: number, key: keyof T): number {
  let s = 0;
  for (let i = 0; i < Math.min(count, rows.length); i++) s += (rows[i][key] as unknown as number) || 0;
  return s;
}

// Total materials needed to bring an agent to a preset target, from the barème.
export function computeRequirements(agent: Agent, preset: Preset, config: GameConfig): ReqEntry[] {
  const charN = Math.max(0, Math.min(6, Math.floor(preset.charLevel / 10)));
  const engN = Math.max(0, Math.min(6, Math.floor(preset.engineLevel / 10)));
  const coreN = coreRankIndex(preset.coreSkill) + 1;
  const skillLvls = [preset.basic, preset.ex, preset.ultimate, preset.dodge, preset.assist];

  let sDenny = 0, sPuces = 0, sHamster = 0;
  for (const lvl of skillLvls) {
    const n = Math.max(0, Math.min(11, lvl - 1));
    sDenny += sumRows(config.skillProg, n, "denny");
    sPuces += sumRows(config.skillProg, n, "puces");
    sHamster += sumRows(config.skillProg, n, "hamster");
  }

  const dennies = Math.round(
    sumRows(config.agentProg, charN, "denny") +
      sumRows(config.engineProg, engN, "denny") +
      sDenny +
      sumRows(config.coreProg, coreN, "denny"),
  );
  const logs = Math.round(sumRows(config.agentProg, charN, "journaux"));
  const power = Math.round(sumRows(config.engineProg, engN, "modules"));
  const sceaux = Math.round(sumRows(config.agentProg, charN, "sceaux"));
  const composants = Math.round(sumRows(config.engineProg, engN, "composants"));
  const puces = Math.round(sPuces);
  const hamster = Math.round(sHamster);
  const expert = Math.round(sumRows(config.coreProg, coreN, "expert"));
  const infame = Math.round(sumRows(config.coreProg, coreN, "infame"));

  const spec = agent.specialization;
  const el = agent.element;
  return [
    { materialId: "dennies", name: "Dennies", type: "dennies", qty: dennies, scope: "common", countsForTime: true },
    { materialId: "logs", name: "Journaux d'enquête", type: "logs", qty: logs, scope: "common", countsForTime: true },
    { materialId: "power", name: "Modules d'alimentation", type: "power", qty: power, scope: "common", countsForTime: true },
    { materialId: "hamster", name: "Cage à hamster", type: "hamster", qty: hamster, scope: "common", countsForTime: false },
    { materialId: "sceaux", name: `Sceau · ${spec}`, type: "sceaux", qty: sceaux, scope: "specific", countsForTime: true },
    { materialId: "composants", name: `Composant · ${spec}`, type: "composants", qty: composants, scope: "specific", countsForTime: true },
    { materialId: "puces", name: `Puce · ${el}`, type: "puces", qty: puces, scope: "specific", countsForTime: true },
    { materialId: "expert", name: agent.skillMaterial || "Expert", type: "expert", qty: expert, scope: "specific", countsForTime: true },
    { materialId: "infame", name: agent.bossMaterial || "Infâme", type: "infame", qty: infame, scope: "specific", countsForTime: false },
  ].filter((r) => r.qty > 0);
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
      themeMode: "dark",
      avgDesiredCost: 130,
      autoBackup: true,
    },
    optionLists: defaultOptionLists(),
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
    pullSessions: [],
    permanentIncomes: [
      { id: "inc_ik", name: "IK Membership", polyPerDay: 100 },
      { id: "inc_bp", name: "Battle Pass", polyPerDay: 31.43 },
      { id: "inc_daily", name: "Dailies", polyPerDay: 60 },
      { id: "inc_ridu", name: "Ridu hebdo", polyPerDay: 8.57 },
      { id: "inc_hoyolab", name: "HoyoLAB", polyPerDay: 2 },
      { id: "inc_hz", name: "Hollow Zero", polyPerDay: 22.86 },
      { id: "inc_shiyu", name: "Shiyu Defense", polyPerDay: 55.71 },
      { id: "inc_da", name: "Deadly Assault", polyPerDay: 21.43 },
    ],
    projection: {
      masterTapes: 0,
      polychromes: 0,
      monochromes: 0,
      residualSignals: 0,
      patches: [
        { id: "p1", name: "3.0", durationDays: 42, tempIncome: 20, expenses: [] },
        { id: "p2", name: "3.1", durationDays: 42, tempIncome: 20, expenses: [] },
        { id: "p3", name: "3.2", durationDays: 42, tempIncome: 20, expenses: [] },
      ],
    },
    archivedPatches: [],
    lastExportAt: null,
    gameConfig: DEFAULT_GAME_CONFIG,
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

// Build stat option lists (dropdowns) — editable in "Données du jeu".
export const MAIN_STATS: string[] = [
  "HP", "HP%", "ATK", "ATK%", "DEF", "DEF%",
  "Crit RATE", "Crit ATK", "Anomaly Proficiency", "Anomaly Mastery",
  "PEN Ratio", "Regen d'énergie", "Impact",
  "Dégâts élément", "Dégâts physique", "Dégâts feu", "Dégâts glace",
  "Dégâts électrique", "Dégâts éther",
];
export const SUB_STATS: string[] = [
  "HP", "HP%", "ATK", "ATK%", "DEF", "DEF%",
  "Crit RATE", "Crit ATK", "Anomaly Proficiency", "PEN",
];

export function defaultOptionLists() {
  return {
    elements: [...ELEMENTS],
    specializations: [...SPECIALIZATIONS],
    discSets: [...DISC_SETS],
    mainStats: [...MAIN_STATS],
    subStats: [...SUB_STATS],
  };
}
