
export enum TowerType {
  TURRET = 'TURRET',
  SNIPER = 'SNIPER',
  BLASTER = 'BLASTER',
  MINER = 'MINER',
}

export enum EnemyType {
  DRONE = 'DRONE',
  TANK = 'TANK',
  BOSS = 'BOSS'
}

export enum GearSize {
  SMALL = 'SMALL',
  MEDIUM = 'MEDIUM',
  LARGE = 'LARGE'
}

export interface GearStat {
  type: 'DAMAGE' | 'ATTACK_SPEED' | 'RANGE' | 'INCOME';
  value: number;
}

export interface Gear {
  id: string;
  name: string;
  size: GearSize;
  rarity: 'BASIC' | 'COMMON' | 'UNCOMMON' | 'RARE' | 'EPIC' | 'LEGENDARY';
  color: string;
  stats: GearStat[]; // Array of stats
  restrictedTo?: TowerType; // Optional: Only equippable on this tower type
  legendaryEffect?: 'GLOCK' | 'LOCKON' | 'BREAKBLITS' | 'DEMANDUP'; // New Legendary Effects
}

export interface Coordinates {
  x: number;
  y: number;
}

export interface TowerConfig {
  id: TowerType;
  name: string;
  cost: number;
  damage: number;
  range: number;
  fireRate: number; 
  description: string;
  color: string;
  icon: string;
  baseLimit: number;
  limitPerWave: number;
  splashRadius?: number; // Added for AOE
  lightColor: string; // Hex code for lighting engine
  lightRadius: number; // Size of light glow in tiles
  slots: GearSize[]; // REQUIRED GEAR SLOTS
}

export interface TowerInstance {
  id: string;
  type: TowerType;
  position: Coordinates;
  lastFiredTick: number;
  rotation: number; // Current rotation in degrees
}

export interface Enemy {
  id: string;
  type: EnemyType;
  pathIndex: number;
  progress: number; // 0.0 to 1.0
  health: number;
  maxHealth: number;
  speed: number;
  value: number;
  // Shield Mechanic
  shield: number;
  maxShield: number;
  // Legendary Effects Status
  isLockedOn?: boolean;
  sniperRollAttempted?: boolean; // Ensures 15% chance only runs once per enemy
}

export interface Projectile {
  id: string;
  type: TowerType; 
  start: Coordinates;
  targetPos: Coordinates;
  targetId?: string; // The enemy being tracked
  damage: number;
  color: string;
  progress: number; // 0 to 1
  effects?: string[]; // Carries legendary effects like LOCKON or BREAKBLITS
  // Legendary Specifics
  isGlockShot?: boolean;
  // Cluster Logic
  isCluster?: boolean;
  clusterRadius?: number;
}

export interface FloatingText {
  id: string;
  text: string;
  x: number;
  y: number;
  color: string;
  life: number;
}

export interface Effect {
  id: string;
  type: 'EXPLOSION';
  x: number;
  y: number;
  radius: number;
  life: number;
  maxLife: number;
  color: string;
  pattern?: 'CIRCLE' | 'PLUS_SMALL'; // Added pattern for BreakBlits
}

export interface AiAdvice {
  title: string;
  content: string;
  tone: 'neutral' | 'urgent' | 'confident';
}

export interface MapConfig {
  id: string;
  name: string;
  description: string;
  width: number;
  height: number;
  path: Coordinates[];
  obstacles: Coordinates[];
  maxWaves: number;
  startingCredits: number;
  difficultyRating: number; // 1-5 stars
  worldPosition: { x: number; y: number }; // Percentage 0-100 on world map
}

export interface GameState {
  // Map specific data
  mapData: MapConfig;
  
  credits: number;
  wave: number;
  health: number;
  maxHealth: number;
  tick: number;
  isPlaying: boolean;
  towers: TowerInstance[];
  enemies: Enemy[];
  projectiles: Projectile[];
  floatingTexts: FloatingText[];
  effects: Effect[]; // Added for visual effects like explosions
  gameOver: boolean;
  gameWon: boolean; // New win state
  waveActive: boolean;
  enemiesToSpawn: EnemyType[];
  spawnTimer: number;
  // New Fields
  gameSpeed: number; // 1 = normal, 1.5, 2, 3 etc.
  incomePerSecond: number; // Calculated income rate
  lastIncomeTick: number; // For batching income updates
  accumulatedIncome: number; // For batching floating text
  
  // Difficulty & Modes
  difficultyLevel: number; // 0 = Normal, 1-5 = Star Levels
  isEndless: boolean;

  // Cheat / Bonus States
  cheats: {
    noCD: boolean;
  };
  skipTickets: number;
  
  // Stacking Skip Logic
  activeWaveMultiplier: number; // Applied to the currently spawning wave (1.0 = normal, 1.5 = +50%, etc)
  pendingWaveBuff: number; // Accumulated buff from skips while waiting to start (0.5, 1.0, etc)

  // Loot Logic
  activeMoneyMultiplier: number; // Multiplier for enemy kills in current wave
  pendingMoneyBonus: number; // Accumulated money buff from skips

  // Auto Start Logic
  autoStart: {
    enabled: boolean;
    delay: number; // seconds
    timer: number; // ticks
  };

  // GEARSMITH STATE
  gearInventory: Gear[];
  // Maps TowerType to an array of equipped Gear (or null if empty)
  // The index in the array corresponds to the slot index
  towerLoadouts: Record<TowerType, (Gear | null)[]>;
}
