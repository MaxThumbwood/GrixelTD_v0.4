
import { TowerType, TowerConfig, EnemyType, Coordinates, MapConfig, Gear, GearSize } from './types';

export const INITIAL_HEALTH = 20;
export const CELL_SIZE = 48; // Fixed pixel size for grid cells

// World Map Config
export const WORLD_SIZE = { width: 2500, height: 2000 };

export const TERRAIN_FEATURES = [
  // Mountains
  { type: 'MOUNTAIN', x: 5, y: 5, size: 250, color: '#2a2a2a' },
  { type: 'MOUNTAIN', x: 15, y: 2, size: 300, color: '#333' },
  { type: 'MOUNTAIN', x: 80, y: 80, size: 400, color: '#222' },
  { type: 'MOUNTAIN', x: 90, y: 75, size: 300, color: '#2a2a2a' },
  { type: 'MOUNTAIN', x: 35, y: 35, size: 150, color: '#333' },
  
  // Water
  { type: 'WATER', x: 45, y: 45, size: 500, color: '#29adff' },
  { type: 'WATER', x: 85, y: 15, size: 300, color: '#29adff' },
  { type: 'WATER', x: 5, y: 60, size: 200, color: '#29adff' },

  // Forest
  { type: 'FOREST', x: 10, y: 80, size: 180, color: '#38b764' },
  { type: 'FOREST', x: 25, y: 65, size: 200, color: '#38b764' },
  { type: 'FOREST', x: 60, y: 20, size: 250, color: '#38b764' },
  { type: 'FOREST', x: 70, y: 55, size: 150, color: '#38b764' },
  { type: 'FOREST', x: 90, y: 40, size: 180, color: '#38b764' },
];

// Helper to generate full path from waypoints
const createPathFromWaypoints = (waypoints: Coordinates[]): Coordinates[] => {
  const path: Coordinates[] = [];
  if (waypoints.length < 2) return waypoints;
  path.push({ ...waypoints[0] });

  for (let i = 0; i < waypoints.length - 1; i++) {
    const start = waypoints[i];
    const end = waypoints[i+1];
    let currentX = start.x;
    let currentY = start.y;

    while (currentX !== end.x || currentY !== end.y) {
      if (currentX < end.x) currentX++;
      else if (currentX > end.x) currentX--;
      else if (currentY < end.y) currentY++;
      else if (currentY > end.y) currentY--;
      path.push({ x: currentX, y: currentY });
    }
  }
  return path;
};

// --- MAP DEFINITIONS ---

const MAP_1: MapConfig = {
  id: 'map_1',
  name: 'Training Grounds',
  description: 'Standard facility. Good for beginners.',
  width: 10,
  height: 15,
  startingCredits: 120,
  maxWaves: 25, // Increased from 10
  difficultyRating: 1,
  worldPosition: { x: 10, y: 85 },
  obstacles: [
    { x: 3, y: 2 }, { x: 7, y: 2 }, { x: 0, y: 6 }, 
    { x: 9, y: 6 }, { x: 4, y: 8 }, { x: 5, y: 8 }, 
    { x: 0, y: 12 }, { x: 7, y: 12 }
  ],
  path: createPathFromWaypoints([
    { x: 1, y: 0 }, { x: 1, y: 4 }, { x: 8, y: 4 }, 
    { x: 8, y: 10 }, { x: 2, y: 10 }, { x: 2, y: 14 }
  ])
};

const MAP_2: MapConfig = {
  id: 'map_2',
  name: 'Zigzag Hollow',
  description: 'A winding path that gives you plenty of time.',
  width: 8,
  height: 12,
  startingCredits: 130, 
  maxWaves: 30, // Increased from 12
  difficultyRating: 1,
  worldPosition: { x: 20, y: 75 },
  obstacles: [
    { x: 3, y: 1 }, { x: 4, y: 1 },
    { x: 3, y: 3 }, { x: 4, y: 3 },
    { x: 3, y: 4 }, { x: 4, y: 4 },
    { x: 3, y: 6 }, { x: 4, y: 6 }
  ],
  path: createPathFromWaypoints([
    { x: 1, y: 0 }, { x: 1, y: 2 }, 
    { x: 6, y: 2 }, { x: 6, y: 5 }, 
    { x: 1, y: 5 }, { x: 1, y: 8 }, 
    { x: 6, y: 8 }, { x: 6, y: 11 }
  ])
};

const MAP_3: MapConfig = {
  id: 'map_3',
  name: 'The Serpent',
  description: 'A winding path offering maximum coverage.',
  width: 12,
  height: 12,
  startingCredits: 150,
  maxWaves: 35, // Increased from 12
  difficultyRating: 2,
  worldPosition: { x: 35, y: 80 },
  obstacles: [{ x: 5, y: 5 }, { x: 6, y: 5 }, { x: 5, y: 6 }, { x: 6, y: 6 }],
  path: createPathFromWaypoints([
    { x: 0, y: 1 }, { x: 10, y: 1 }, { x: 10, y: 4 }, 
    { x: 1, y: 4 }, { x: 1, y: 7 }, { x: 10, y: 7 }, 
    { x: 10, y: 10 }, { x: 0, y: 10 }
  ])
};

const MAP_4: MapConfig = {
  id: 'map_4',
  name: 'Iron Fortress',
  description: 'Debris everywhere. Build space is limited.',
  width: 11,
  height: 11,
  startingCredits: 200,
  maxWaves: 40, // Increased from 15
  difficultyRating: 3,
  worldPosition: { x: 55, y: 65 },
  obstacles: [
    { x: 1, y: 1 }, { x: 3, y: 1 }, { x: 5, y: 1 }, { x: 7, y: 1 }, { x: 9, y: 1 },
    { x: 1, y: 9 }, { x: 3, y: 9 }, { x: 5, y: 9 }, { x: 7, y: 9 }, { x: 9, y: 9 },
    { x: 5, y: 4 }, { x: 5, y: 5 } 
  ],
  path: createPathFromWaypoints([
    { x: 0, y: 5 }, { x: 2, y: 5 }, { x: 2, y: 2 }, 
    { x: 8, y: 2 }, { x: 8, y: 8 }, { x: 2, y: 8 }, 
    { x: 2, y: 6 }, { x: 10, y: 6 }
  ])
};

const MAP_5: MapConfig = {
  id: 'map_5',
  name: 'The Spiral',
  description: 'They come from the center. Protect the rim.',
  width: 13,
  height: 13,
  startingCredits: 180,
  maxWaves: 45, // Increased from 15
  difficultyRating: 3,
  worldPosition: { x: 70, y: 70 },
  obstacles: [],
  path: createPathFromWaypoints([
    { x: 6, y: 6 }, { x: 6, y: 4 }, { x: 8, y: 4 }, 
    { x: 8, y: 8 }, { x: 4, y: 8 }, { x: 4, y: 2 }, 
    { x: 10, y: 2 }, { x: 10, y: 10 }, { x: 2, y: 10 }, 
    { x: 2, y: 0 }
  ])
};

const MAP_6: MapConfig = {
  id: 'map_6',
  name: 'Twin Rivers',
  description: 'A split path that converges.',
  width: 10,
  height: 16,
  startingCredits: 150,
  maxWaves: 50, // Increased from 20
  difficultyRating: 4,
  worldPosition: { x: 85, y: 55 },
  obstacles: [{ x: 4, y: 5 }, { x: 5, y: 5 }, { x: 4, y: 10 }, { x: 5, y: 10 }],
  path: createPathFromWaypoints([
    { x: 2, y: 0 }, { x: 2, y: 4 }, { x: 7, y: 4 }, 
    { x: 7, y: 8 }, { x: 2, y: 8 }, { x: 2, y: 12 }, 
    { x: 7, y: 12 }, { x: 7, y: 15 }
  ])
};

const MAP_7: MapConfig = {
  id: 'map_7',
  name: 'Choke Point',
  description: 'Force them through the grinder.',
  width: 9,
  height: 13,
  startingCredits: 100,
  maxWaves: 40, // Increased from 15
  difficultyRating: 3,
  worldPosition: { x: 65, y: 40 },
  obstacles: [
    { x: 0, y: 6 }, { x: 1, y: 6 }, { x: 2, y: 6 }, { x: 3, y: 6 },
    { x: 5, y: 6 }, { x: 6, y: 6 }, { x: 7, y: 6 }, { x: 8, y: 6 }
  ],
  path: createPathFromWaypoints([
    { x: 1, y: 0 }, { x: 1, y: 4 }, { x: 4, y: 4 }, 
    { x: 4, y: 8 }, { x: 7, y: 8 }, { x: 7, y: 12 }
  ])
};

const MAP_8: MapConfig = {
  id: 'map_8',
  name: 'The Box',
  description: 'They circle the perimeter.',
  width: 10,
  height: 10,
  startingCredits: 250,
  maxWaves: 55, // Increased from 20
  difficultyRating: 4,
  worldPosition: { x: 50, y: 25 },
  obstacles: [
    { x: 3, y: 3 }, { x: 4, y: 3 }, { x: 5, y: 3 }, { x: 6, y: 3 },
    { x: 3, y: 4 }, { x: 6, y: 4 },
    { x: 3, y: 5 }, { x: 6, y: 5 },
    { x: 3, y: 6 }, { x: 4, y: 6 }, { x: 5, y: 6 }, { x: 6, y: 6 }
  ],
  path: createPathFromWaypoints([
    { x: 1, y: 1 }, { x: 8, y: 1 }, { x: 8, y: 8 }, 
    { x: 1, y: 8 }, { x: 1, y: 2 }
  ])
};

const MAP_9: MapConfig = {
  id: 'map_9',
  name: 'Tiny Terror',
  description: 'Small map, fast enemies. Panic mode.',
  width: 6,
  height: 8,
  startingCredits: 200,
  maxWaves: 30, // Increased from 10
  difficultyRating: 5,
  worldPosition: { x: 30, y: 35 },
  obstacles: [],
  path: createPathFromWaypoints([
    { x: 0, y: 0 }, { x: 5, y: 0 }, { x: 5, y: 7 }, 
    { x: 0, y: 7 }, { x: 0, y: 4 }, { x: 3, y: 4 }
  ])
};

const MAP_10: MapConfig = {
  id: 'map_10',
  name: 'Cyber Core',
  description: 'The final defense. Massive waves.',
  width: 14,
  height: 18,
  startingCredits: 300,
  maxWaves: 75, // Increased from 25
  difficultyRating: 5,
  worldPosition: { x: 50, y: 5 },
  obstacles: [
    { x: 2, y: 2 }, { x: 11, y: 2 }, { x: 2, y: 15 }, { x: 11, y: 15 },
    { x: 6, y: 8 }, { x: 7, y: 8 }, { x: 6, y: 9 }, { x: 7, y: 9 }
  ],
  path: createPathFromWaypoints([
    { x: 7, y: 0 }, { x: 7, y: 3 }, { x: 2, y: 3 }, 
    { x: 2, y: 14 }, { x: 11, y: 14 }, { x: 11, y: 5 }, 
    { x: 7, y: 5 }, { x: 7, y: 8 }
  ])
};

export const MAPS = [
  MAP_1, MAP_2, MAP_3, MAP_4, MAP_5, 
  MAP_6, MAP_7, MAP_8, MAP_9, MAP_10
];

export const TOWER_DEFS: Record<TowerType, TowerConfig> = {
  [TowerType.TURRET]: {
    id: TowerType.TURRET,
    name: "BASIC",
    cost: 30,
    damage: 10,
    range: 2,
    fireRate: 30, // 2 attacks/sec (60/30)
    description: "Cheap, reliable defense.",
    color: "bg-retro-cyan",
    icon: "Zap",
    baseLimit: 4, 
    limitPerWave: 2, // Gunner +2
    lightColor: '#80d0ff', 
    lightRadius: 2.5,
    slots: [GearSize.SMALL, GearSize.MEDIUM, GearSize.SMALL]
  },
  [TowerType.SNIPER]: {
    id: TowerType.SNIPER,
    name: "SNIPER",
    cost: 120,
    damage: 40,
    range: 6,
    fireRate: 100, // 0.6 attacks/sec (60/100)
    description: "Long range, high impact.",
    color: "bg-retro-green",
    icon: "Crosshair",
    baseLimit: 3, 
    limitPerWave: 1, // Sniper +1
    lightColor: '#c0ff80', 
    lightRadius: 3,
    slots: [GearSize.MEDIUM, GearSize.LARGE]
  },
  [TowerType.BLASTER]: {
    id: TowerType.BLASTER,
    name: "SPLASH",
    cost: 75,
    damage: 20,
    range: 3.5, 
    fireRate: 60, // 1 attack/sec (60/60)
    description: "5-Tile Diamond Splash.",
    color: "bg-retro-purple",
    icon: "Hexagon",
    baseLimit: 3,
    limitPerWave: 2, // Splash +2 (Buffed)
    splashRadius: 1.25, 
    lightColor: '#ff9090', 
    lightRadius: 3.5,
    slots: [GearSize.SMALL, GearSize.SMALL, GearSize.MEDIUM]
  },
  [TowerType.MINER]: {
    id: TowerType.MINER,
    name: "BANK",
    cost: 60,
    damage: 0,
    range: 0,
    fireRate: 75, // 0.8 Hz (1.25s) => 75 ticks
    description: "Income source. Limit rises with Map Clears.",
    color: "bg-retro-yellow",
    icon: "Database",
    baseLimit: 1, 
    limitPerWave: 0, // No longer scales with waves
    lightColor: '#ffe0a0', 
    lightRadius: 1.5,
    slots: [GearSize.SMALL, GearSize.MEDIUM] // Added slots for Miner
  }
};

export const ENEMY_STATS: Record<EnemyType, { hp: number; speed: number; value: number; color: string }> = {
  [EnemyType.DRONE]: { hp: 25, speed: 0.01875, value: 1, color: '#b13e53' }, 
  [EnemyType.TANK]: { hp: 80, speed: 0.009375, value: 4, color: '#29adff' }, 
  [EnemyType.BOSS]: { hp: 400, speed: 0.005625, value: 25, color: '#f4f4f4' },
};

// Defined basic gears to be pre-equipped
const BASE_GEARS = {
    s1: { id: 'g_basic_s1', name: 'Rusted Cog', size: GearSize.SMALL, rarity: 'BASIC' as const, color: 'text-gray-500', stats: [] },
    s2: { id: 'g_basic_s2', name: 'Rusted Cog', size: GearSize.SMALL, rarity: 'BASIC' as const, color: 'text-gray-500', stats: [] },
    s3: { id: 'g_basic_s3', name: 'Rusted Cog', size: GearSize.SMALL, rarity: 'BASIC' as const, color: 'text-gray-500', stats: [] },
    s4: { id: 'g_basic_s4', name: 'Rusted Cog', size: GearSize.SMALL, rarity: 'BASIC' as const, color: 'text-gray-500', stats: [] },
    m1: { id: 'g_basic_m1', name: 'Worn Gear', size: GearSize.MEDIUM, rarity: 'BASIC' as const, color: 'text-gray-500', stats: [] },
    m2: { id: 'g_basic_m2', name: 'Worn Gear', size: GearSize.MEDIUM, rarity: 'BASIC' as const, color: 'text-gray-500', stats: [] },
    m3: { id: 'g_basic_m3', name: 'Worn Gear', size: GearSize.MEDIUM, rarity: 'BASIC' as const, color: 'text-gray-500', stats: [] },
    l1: { id: 'g_basic_l1', name: 'Old Flywheel', size: GearSize.LARGE, rarity: 'BASIC' as const, color: 'text-gray-500', stats: [] },
};

// Initial Inventory is empty because gears are equipped
export const INITIAL_INVENTORY: Gear[] = [];

// Pre-configured Loadouts using the basic gears
export const INITIAL_LOADOUTS: Record<TowerType, (Gear | null)[]> = {
    [TowerType.TURRET]: [BASE_GEARS.s1, BASE_GEARS.m1, BASE_GEARS.s2],
    [TowerType.SNIPER]: [BASE_GEARS.m2, BASE_GEARS.l1],
    [TowerType.BLASTER]: [BASE_GEARS.s3, BASE_GEARS.s4, BASE_GEARS.m3],
    [TowerType.MINER]: []
};
