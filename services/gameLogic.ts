
import { 
  GameState, 
  Enemy, 
  Projectile, 
  EnemyType, 
  Coordinates, 
  TowerType,
  MapConfig,
  Gear,
  GearSize,
  GearStat,
  Effect,
  FloatingText
} from '../types';
import { 
  TOWER_DEFS, 
  ENEMY_STATS, 
  INITIAL_HEALTH,
  MAPS
} from '../constants';

const COMPLETED_LEVELS_KEY = 'pixel_defense_completed_v1';

export const saveLevelCompletion = (mapId: string) => {
  try {
    const completed = loadCompletedLevels();
    if (!completed.includes(mapId)) {
      completed.push(mapId);
      localStorage.setItem(COMPLETED_LEVELS_KEY, JSON.stringify(completed));
    }
  } catch (e) {
    console.error("Failed to save progress", e);
  }
};

export const loadCompletedLevels = (): string[] => {
  try {
    const data = localStorage.getItem(COMPLETED_LEVELS_KEY);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    console.error("Failed to load progress", e);
    return [];
  }
};

// Helper to get difficulty modifiers based on star rating (0-5)
const getDifficultyModifiers = (level: number) => {
    // 0 = Normal (No changes)
    if (level <= 0) return { hp: 1.0, spawnCount: 1.0, shieldRegen: 0, spawnRate: 1.0 };
    
    // 1⭐ = 30% enemy hp defense boost
    if (level === 1) return { hp: 1.3, spawnCount: 1.0, shieldRegen: 0, spawnRate: 1.0 };
    
    // 2⭐ = 40% enemy defense boost and 10% spawn number boost
    if (level === 2) return { hp: 1.4, spawnCount: 1.1, shieldRegen: 0, spawnRate: 1.0 };
    
    // 3⭐ = 50% enemy defense boost, 20% spawn number, 10% enemy shield regen boost
    if (level === 3) return { hp: 1.5, spawnCount: 1.2, shieldRegen: 1.1, spawnRate: 1.0 };
    
    // 4⭐ = 50% enemy defense boost, 30% spawn number, 15% enemy shield regen boost
    if (level === 4) return { hp: 1.5, spawnCount: 1.3, shieldRegen: 1.15, spawnRate: 1.0 };
    
    // 5⭐ = 60% enemy defense boost, 30% spawn number, 20% enemy shield regen, 10% enemy spawn rate
    if (level >= 5) return { hp: 1.6, spawnCount: 1.3, shieldRegen: 1.2, spawnRate: 1.1 };
    
    return { hp: 1.0, spawnCount: 1.0, shieldRegen: 0, spawnRate: 1.0 };
};

// Initialize state with a specific map
export const getInitialState = (
    mapConfig: MapConfig, 
    inventory: Gear[], 
    loadouts: Record<TowerType, (Gear | null)[]>,
    initialTickets: number,
    difficultyLevel: number = 0,
    isEndless: boolean = false
): GameState => ({
  mapData: mapConfig,
  credits: mapConfig.startingCredits,
  wave: 1,
  health: INITIAL_HEALTH,
  maxHealth: INITIAL_HEALTH,
  tick: 0,
  isPlaying: false,
  towers: [],
  enemies: [],
  projectiles: [],
  floatingTexts: [],
  effects: [], // Initialize effects
  gameOver: false,
  gameWon: false,
  waveActive: false,
  enemiesToSpawn: [],
  spawnTimer: 0,
  gameSpeed: 1,
  incomePerSecond: 0,
  lastIncomeTick: 0,
  accumulatedIncome: 0,
  cheats: {
    noCD: false
  },
  skipTickets: initialTickets,
  activeWaveMultiplier: 1,
  pendingWaveBuff: 0,
  activeMoneyMultiplier: 1,
  pendingMoneyBonus: 0,
  difficultyLevel,
  isEndless,
  
  autoStart: {
    enabled: false,
    delay: 10,
    timer: 0
  },
  
  // GEARSMITH INITIALIZATION (Injected from App State)
  gearInventory: [...inventory], 
  // Deep copy loadouts to prevent mutation of global state during game if that were to happen
  towerLoadouts: JSON.parse(JSON.stringify(loadouts))
});

// Helper for Bernoulli trial
const bernoulli = (p: number) => Math.random() < p;

// --- REFINED GEAR GENERATION FORMULA ---
export const generateRandomGear = (size: GearSize, fixedRarity?: Gear['rarity'], fixedTowerType?: TowerType): Gear => {
    // 1. Rarity Selection (Rebalanced: 5% Basic, 5% Legendary)
    let rarity: Gear['rarity'] = 'BASIC';
    if (fixedRarity) {
        rarity = fixedRarity;
    } else {
        const R = Math.random() * 100;
        if (R <= 5) rarity = 'BASIC';          // 5%
        else if (R <= 35) rarity = 'COMMON';   // 30%
        else if (R <= 60) rarity = 'UNCOMMON'; // 25%
        else if (R <= 80) rarity = 'RARE';     // 20%
        else if (R <= 95) rarity = 'EPIC';     // 15%
        else rarity = 'LEGENDARY';             // 5%
    }

    // 2. Restriction
    let restrictedTo = fixedTowerType;
    if (!restrictedTo) {
        // Equal chance for all towers
        const towerTypes = [TowerType.TURRET, TowerType.SNIPER, TowerType.BLASTER, TowerType.MINER];
        restrictedTo = towerTypes[Math.floor(Math.random() * towerTypes.length)];
    }
    const def = TOWER_DEFS[restrictedTo];

    // 3. Stat Config Table (Percentages)
    // Structure: [DAMAGE, RANGE, SPEED, INCOME]
    // Values are multiplier percentages (e.g., 5 = 5%)
    const STAT_TABLE: Record<string, Record<string, { DMG: number, RNG: number, SPD: number, INC?: number }>> = {
        [TowerType.TURRET]: {
            BASIC:      { DMG: 5,  RNG: 2,  SPD: 5 },
            COMMON:     { DMG: 10, RNG: 5,  SPD: 10 },
            UNCOMMON:   { DMG: 20, RNG: 8,  SPD: 20 },
            RARE:       { DMG: 35, RNG: 10, SPD: 20 },
            EPIC:       { DMG: 50, RNG: 15, SPD: 30 },
            LEGENDARY:  { DMG: 80, RNG: 20, SPD: 50 }
        },
        [TowerType.SNIPER]: {
            BASIC:      { DMG: 5,  RNG: 2,  SPD: 3 },
            COMMON:     { DMG: 10, RNG: 5,  SPD: 5 },
            UNCOMMON:   { DMG: 20, RNG: 8,  SPD: 8 },
            RARE:       { DMG: 35, RNG: 10, SPD: 10 },
            EPIC:       { DMG: 50, RNG: 15, SPD: 13 },
            LEGENDARY:  { DMG: 85, RNG: 15, SPD: 20 }
        },
        [TowerType.BLASTER]: {
            BASIC:      { DMG: 5,  RNG: 5,  SPD: 2 },
            COMMON:     { DMG: 15, RNG: 10, SPD: 5 },
            UNCOMMON:   { DMG: 20, RNG: 15, SPD: 10 },
            RARE:       { DMG: 35, RNG: 20, SPD: 15 },
            EPIC:       { DMG: 50, RNG: 25, SPD: 20 },
            LEGENDARY:  { DMG: 80, RNG: 30, SPD: 25 }
        },
        [TowerType.MINER]: {
            BASIC:      { DMG: 0, RNG: 0, SPD: 0,  INC: 30 },
            COMMON:     { DMG: 0, RNG: 0, SPD: 0,  INC: 30 },
            UNCOMMON:   { DMG: 0, RNG: 0, SPD: 0,  INC: 30 },
            RARE:       { DMG: 0, RNG: 0, SPD: 10, INC: 50 },
            EPIC:       { DMG: 0, RNG: 0, SPD: 15, INC: 70 },
            LEGENDARY:  { DMG: 0, RNG: 0, SPD: 20, INC: 100 }
        }
    };

    // 4. Determine Available Stats & Count
    let availableStats: string[] = [];
    if (restrictedTo === TowerType.MINER) {
        availableStats = ['INCOME'];
        // Miner only gets Speed at Rare+
        if (['RARE', 'EPIC', 'LEGENDARY'].includes(rarity)) {
            availableStats.push('ATTACK_SPEED');
        }
    } else {
        availableStats = ['DAMAGE', 'ATTACK_SPEED', 'RANGE'];
    }

    // Number of stats (k)
    let k = 1;
    if (rarity === 'BASIC') k = 1;
    else if (rarity === 'COMMON') k = 1;
    else if (rarity === 'UNCOMMON') k = 2;
    else if (rarity === 'RARE') k = 2;
    else if (rarity === 'EPIC') k = 3;
    else if (rarity === 'LEGENDARY') k = 3;

    // Adjust k for Miner (max 2 stats)
    if (restrictedTo === TowerType.MINER && k > 2) k = 2;

    // Select Stats
    const selectedStatTypes: string[] = [];
    const shuffled = [...availableStats].sort(() => Math.random() - 0.5);
    
    // Ensure we fill up to k, looping if necessary (though usually unique stats are better)
    // For this balance patch, we will try to make them unique.
    for(let i = 0; i < k; i++) {
        if (i < shuffled.length) {
            selectedStatTypes.push(shuffled[i]);
        } else {
            // Fallback if k > available stats (unlikely with new logic)
            selectedStatTypes.push(shuffled[Math.floor(Math.random() * shuffled.length)]);
        }
    }

    // 5. Calculate Values
    const finalStats: GearStat[] = [];
    const config = STAT_TABLE[restrictedTo][rarity];

    selectedStatTypes.forEach(type => {
        let pct = 0;
        let baseValue = 0;

        if (type === 'DAMAGE') {
            pct = config.DMG;
            baseValue = def.damage;
        } else if (type === 'RANGE') {
            pct = config.RNG;
            baseValue = def.range;
        } else if (type === 'ATTACK_SPEED') {
            pct = config.SPD;
            // Base Hz calculation: 60 / fireRate(ticks)
            baseValue = 60 / def.fireRate; 
        } else if (type === 'INCOME') {
            pct = config.INC || 0;
            baseValue = 3; // Base miner income
        }

        // Apply Variance (±5% of the target percentage to add "Tycoon" flavor but keep it clean)
        // e.g. if target is 50%, actual might be 48% to 52%
        // But the prompt was specific, so we will stick to the exact values for clean math
        // calculated as a flat bonus.
        
        let val = baseValue * (pct / 100);
        
        // Round to nice numbers
        if (val < 1 && val > 0) val = Math.round(val * 100) / 100;
        else val = Math.round(val * 10) / 10;

        // Ensure at least tiny benefit if % is small but base is small
        if (val === 0 && pct > 0) val = 0.1;

        // Add to stats if not duplicate (sum duplicates)
        const existing = finalStats.find(s => s.type === type);
        if (existing) {
            existing.value += val;
        } else {
            finalStats.push({ type: type as any, value: val });
        }
    });

    // --- LEGENDARY EFFECT LOGIC ---
    // 5% Chance for Gear to be Legendary, and if so, it always gets an effect now
    let legendaryEffect: Gear['legendaryEffect'] = undefined;
    if (rarity === 'LEGENDARY') {
       if (restrictedTo === TowerType.TURRET) legendaryEffect = 'GLOCK';
       if (restrictedTo === TowerType.SNIPER) legendaryEffect = 'LOCKON';
       if (restrictedTo === TowerType.BLASTER) legendaryEffect = 'BREAKBLITS';
       if (restrictedTo === TowerType.MINER) legendaryEffect = 'DEMANDUP';
    }

    // Name Generation
    let name = "Unknown Part";
    const prefixes = {
        [TowerType.TURRET]: ['Ballistic', 'Rapid', 'Combat', 'Assault'],
        [TowerType.SNIPER]: ['Scope', 'Barrel', 'Caliber', 'Rifle'],
        [TowerType.BLASTER]: ['Diffusion', 'Payload', 'Blast', 'Radius'],
        [TowerType.MINER]: ['Ledger', 'Drill', 'Chip', 'Grid']
    };
    
    // Rarity Adjectives
    const rarityAdj = {
        'BASIC': ['Rusted', 'Old', 'Used'],
        'COMMON': ['Standard', 'Issued', 'Generic'],
        'UNCOMMON': ['Polished', 'Upgraded', 'Custom'],
        'RARE': ['Military', 'Elite', 'Advanced'],
        'EPIC': ['Prototype', 'Experimental', 'High-Tech'],
        'LEGENDARY': ['Sentient', 'Quantum', 'Omega']
    };

    const suffixes = ['Module', 'Gear', 'Core', 'Unit', 'System'];
    
    if (legendaryEffect) {
        if (legendaryEffect === 'GLOCK') name = "G-Lock Protocol";
        else if (legendaryEffect === 'LOCKON') name = "Seeker System";
        else if (legendaryEffect === 'BREAKBLITS') name = "Cluster Engine";
        else if (legendaryEffect === 'DEMANDUP') name = "DemandUp OS";
    } else {
        const pList = prefixes[restrictedTo];
        const rList = rarityAdj[rarity];
        
        const r = rList[Math.floor(Math.random() * rList.length)];
        const p = pList[Math.floor(Math.random() * pList.length)];
        const s = suffixes[Math.floor(Math.random() * suffixes.length)];
        
        // 50% chance to include Rarity Adjective
        if (Math.random() < 0.5) name = `${r} ${s}`;
        else name = `${r} ${p}`;
    }

    let color = 'text-gray-500'; 
    if (rarity === 'COMMON') color = 'text-gray-300';
    if (rarity === 'UNCOMMON') color = 'text-retro-green';
    if (rarity === 'RARE') color = 'text-retro-cyan';
    if (rarity === 'EPIC') color = 'text-retro-purple';
    if (rarity === 'LEGENDARY') color = 'text-retro-orange';

    return {
        id: `g_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        name,
        size,
        rarity,
        color,
        stats: finalStats,
        restrictedTo,
        legendaryEffect
    };
};

export const getEntityPosition = (pathIndex: number, progress: number, path: Coordinates[]) => {
  if (pathIndex >= path.length - 1) return path[path.length - 1];
  const start = path[pathIndex];
  const end = path[pathIndex + 1];
  return {
    x: start.x + (end.x - start.x) * progress,
    y: start.y + (end.y - start.y) * progress
  };
};

export const startNextWave = (state: GameState): GameState => {
  const waveNumber = state.wave;
  const mods = getDifficultyModifiers(state.difficultyLevel);
  
  // Base Count Calculation modified by Spawn Count Boost
  const baseCount = Math.floor((5 + Math.floor(waveNumber * 1.5)) * mods.spawnCount);
  
  const enemiesToSpawn: EnemyType[] = [];
  const isBoss = waveNumber % 5 === 0;
  
  for(let i=0; i<baseCount; i++) {
     if (isBoss && i === baseCount - 1) {
         enemiesToSpawn.push(EnemyType.BOSS);
     } else if (waveNumber > 3 && i % 4 === 0) {
         enemiesToSpawn.push(EnemyType.TANK);
     } else {
         enemiesToSpawn.push(EnemyType.DRONE);
     }
  }

  return {
      ...state,
      waveActive: true,
      enemiesToSpawn,
      spawnTimer: 0,
      activeWaveMultiplier: 1 + state.pendingWaveBuff,
      activeMoneyMultiplier: 1 + state.pendingMoneyBonus,
      pendingWaveBuff: 0,
      pendingMoneyBonus: 0,
      autoStart: {
          ...state.autoStart,
          timer: 0 // Reset auto-start timer on manual or auto start
      }
  };
};

export const updateGame = (state: GameState): GameState => {
  if (state.gameOver || state.gameWon || !state.isPlaying) return state;

  let nextState = { ...state };

  // AUTO START LOGIC
  // If wave is not active, check if we should auto-start
  if (!nextState.waveActive && nextState.autoStart.enabled) {
      // Don't auto-start past max waves (though gameWon check above handles this mostly)
      if (nextState.isEndless || nextState.wave <= nextState.mapData.maxWaves) {
          nextState.autoStart.timer++;
          const targetTicks = nextState.autoStart.delay * 60; // 60 ticks per sec
          if (nextState.autoStart.timer >= targetTicks) {
              // Trigger Wave
              nextState = startNextWave(nextState);
          }
      }
  }

  let { 
      enemies, 
      projectiles, 
      towers, 
      credits, 
      health, 
      waveActive, 
      enemiesToSpawn, 
      spawnTimer, 
      tick, 
      effects, 
      floatingTexts,
      gameOver,
      gameWon,
      wave,
      incomePerSecond,
      lastIncomeTick,
      accumulatedIncome,
      difficultyLevel
  } = nextState;

  const mapPath = nextState.mapData.path;
  const mods = getDifficultyModifiers(difficultyLevel);

  // 1. Spawn Enemies
  let newEnemies = [...enemies];
  let newEnemiesToSpawn = [...enemiesToSpawn];
  let newSpawnTimer = spawnTimer;
  
  if (waveActive && newEnemiesToSpawn.length > 0) {
      newSpawnTimer++;
      // Spawn Rate logic: 30 is default (0.5s). Divide by rate modifier to decrease delay (spawn faster)
      // e.g. Rate 1.1 -> 30 / 1.1 = 27 ticks
      const spawnThreshold = Math.max(5, 30 / mods.spawnRate);
      
      if (newSpawnTimer > spawnThreshold) { 
          const type = newEnemiesToSpawn.shift()!;
          const stats = ENEMY_STATS[type];
          
          const hpMultiplier = nextState.activeWaveMultiplier;
          // Apply Difficulty HP Modifier here
          const maxHealth = stats.hp * (1 + (wave * 0.2)) * hpMultiplier * mods.hp;
          
          newEnemies.push({
              id: `e_${Date.now()}_${Math.random()}`,
              type,
              pathIndex: 0,
              progress: 0,
              health: maxHealth,
              maxHealth: maxHealth,
              speed: stats.speed, 
              value: stats.value * nextState.activeMoneyMultiplier,
              shield: 0,
              maxShield: type === EnemyType.TANK || type === EnemyType.BOSS ? maxHealth * 0.5 : 0, // Tanks/Boss get base shields
              isLockedOn: false, 
              sniperRollAttempted: false 
          });
          newSpawnTimer = 0;
      }
  }

  // 2. Update Enemies (Move & Shield Regen)
  let baseDamage = 0;
  newEnemies = newEnemies.filter(e => {
      e.progress += e.speed;
      
      // SHIELD REGEN LOGIC (Difficulty 3+)
      // Only regen if shield is active (maxShield > 0) and damaged
      if (mods.shieldRegen > 0 && e.maxShield > 0 && e.shield < e.maxShield) {
          // Regen 0.5% of max shield per tick * modifier
          const regenAmount = (e.maxShield * 0.005) * mods.shieldRegen;
          e.shield = Math.min(e.maxShield, e.shield + regenAmount);
      }

      if (e.progress >= 1) {
          e.pathIndex++;
          e.progress = 0;
      }
      
      if (e.pathIndex >= mapPath.length - 1) {
          baseDamage += 1;
          return false;
      }
      return true;
  });

  health -= baseDamage;
  if (health <= 0) {
      health = 0;
      gameOver = true;
  }

  // 3. Towers Fire
  let newProjectiles = [...projectiles];
  let incomeToAdd = 0;
  const newIncomeTexts: FloatingText[] = [];
  
  const newTowers = towers.map(tower => {
      const def = TOWER_DEFS[tower.type];
      
      let rangeBonus = 0;
      let attackSpeedBonus = 0;
      let damageBonus = 0;
      
      const loadout = nextState.towerLoadouts[tower.type];
      if (loadout) {
          loadout.forEach((gear, idx) => {
               if (gear && def.slots[idx] === gear.size) {
                  if (!gear.restrictedTo || gear.restrictedTo === tower.type) {
                      gear.stats.forEach(s => {
                          if (s.type === 'RANGE') rangeBonus += s.value;
                          if (s.type === 'ATTACK_SPEED') attackSpeedBonus += s.value;
                          if (s.type === 'DAMAGE') damageBonus += s.value;
                      });
                  }
               }
          });
      }

      const effectiveRange = def.range + rangeBonus;
      const baseHz = 60 / def.fireRate;
      const newHz = Math.max(0.1, baseHz + attackSpeedBonus);
      const effectiveFireRate = 60 / newHz;

      if (tick - tower.lastFiredTick >= effectiveFireRate) {
          const towerPos = { x: tower.position.x + 0.5, y: tower.position.y + 0.5 };
          
          // TARGETING: "FIRST" (Closest to base / furthest along path)
          let target: Enemy | null = null;
          let maxDist = -1;

          // Filter range first
          const inRange = newEnemies.filter(e => {
              const enemyPos = getEntityPosition(e.pathIndex, e.progress, mapPath);
              const dist = Math.sqrt(Math.pow(enemyPos.x + 0.5 - towerPos.x, 2) + Math.pow(enemyPos.y + 0.5 - towerPos.y, 2));
              return dist <= effectiveRange;
          });

          // Find furthest along path (Targeting Logic)
          inRange.forEach(e => {
              // PathIndex is strictly increasing nodes. Progress is % between nodes.
              const distMetric = e.pathIndex + e.progress;
              if (distMetric > maxDist) {
                  maxDist = distMetric;
                  target = e;
              }
          });

          if (target) {
              const damage = def.damage + damageBonus;
              const legEffects: string[] = [];
              if (loadout) {
                  loadout.forEach(g => {
                      if (g?.legendaryEffect) legEffects.push(g.legendaryEffect);
                  });
              }

              // GLOCK: 30% chance for special bullet dealing +100% damage (Total 200%)
              const isGlock = legEffects.includes('GLOCK') && Math.random() < 0.3;
              
              newProjectiles.push({
                  id: `p_${Date.now()}_${Math.random()}`,
                  type: tower.type,
                  start: tower.position,
                  targetPos: { x: 0, y: 0 }, 
                  targetId: (target as Enemy).id,
                  damage: damage,
                  color: def.color,
                  progress: 0,
                  effects: legEffects,
                  isGlockShot: isGlock
              });
              
              const enemyPos = getEntityPosition((target as Enemy).pathIndex, (target as Enemy).progress, mapPath);
              const dx = (enemyPos.x + 0.5) - towerPos.x;
              const dy = (enemyPos.y + 0.5) - towerPos.y;
              const rotation = Math.atan2(dy, dx) * (180 / Math.PI) + 90;

              return { ...tower, lastFiredTick: tick, rotation };
          }
      }
      
      if (tower.type === TowerType.MINER) {
          let incomeBonus = 0;
          let hasDemandUp = false;
          if (loadout) {
              loadout.forEach(g => {
                  if (g?.legendaryEffect === 'DEMANDUP') hasDemandUp = true;
                  if (g?.stats) {
                      g.stats.forEach(s => {
                         if (s.type === 'INCOME') incomeBonus += s.value;
                      });
                  }
              });
          }
          const baseIncome = 3;
          const effectiveIncome = baseIncome + incomeBonus;
          
          // DEMANDUP EFFECT: 50% extra income triggered every 2 seconds (120 ticks)
          if (hasDemandUp && tick % 120 === 0) {
              const bonus = effectiveIncome * 0.5;
              incomeToAdd += bonus;
              
              // DemandUp Indicator (Distinct visual)
              newIncomeTexts.push({
                  id: `du_${tower.id}_${tick}`,
                  text: `+$${Math.floor(bonus)}`,
                  x: tower.position.x, 
                  y: tower.position.y - 0.9, // Higher up
                  color: 'text-retro-orange !text-[6px]', // Smaller text
                  life: 60
              });
          }

          if (tick - tower.lastFiredTick >= effectiveFireRate) {
              incomeToAdd += effectiveIncome;
              
              // Standard Income Indicator
              newIncomeTexts.push({
                  id: `inc_${tower.id}_${tick}`,
                  text: `+$${Math.floor(effectiveIncome)}`,
                  x: tower.position.x,
                  y: tower.position.y - 0.5, // Top of cell
                  color: 'text-green-400',
                  life: 40
              });
              return { ...tower, lastFiredTick: tick };
          }
      }

      return tower;
  });
  
  accumulatedIncome += incomeToAdd;

  // 4. Update Projectiles
  let newEffects = [...effects];
  let newFloatingTexts = [...floatingTexts, ...newIncomeTexts];
  const spawnedProjectiles: Projectile[] = [];
  
  newProjectiles = newProjectiles.filter(p => {
      let target = p.targetId ? newEnemies.find(e => e.id === p.targetId) : null;
      
      if (p.targetId && !target) {
          if (!p.isCluster) return false;
      }
      
      if (target) {
          const tPos = getEntityPosition(target.pathIndex, target.progress, mapPath);
          p.targetPos = tPos;
      }

      const speed = p.isCluster ? 0.05 : 0.1;
      p.progress += speed;
      
      if (p.progress >= 1) {
          if (p.isCluster) {
              // Cluster Landed - EXPLODE
              const aoeRadius = p.clusterRadius || 0.6;
              newEffects.push({
                 id: `fx_${Date.now()}_${Math.random()}`,
                 type: 'EXPLOSION',
                 x: p.targetPos.x,
                 y: p.targetPos.y,
                 radius: aoeRadius,
                 life: 15,
                 maxLife: 15,
                 color: 'bg-retro-orange',
                 pattern: 'PLUS_SMALL' // New pattern for clusters
              });
              
              // Deal AOE Damage
              newEnemies.forEach(e => {
                 const ep = getEntityPosition(e.pathIndex, e.progress, mapPath);
                 const dist = Math.sqrt(Math.pow(ep.x - p.targetPos.x, 2) + Math.pow(ep.y - p.targetPos.y, 2));
                 if (dist < aoeRadius) {
                     // Damage to shield first
                     const dmg = p.damage;
                     if (e.shield > 0) {
                         if (e.shield >= dmg) {
                             e.shield -= dmg;
                         } else {
                             const overflow = dmg - e.shield;
                             e.shield = 0;
                             e.health -= overflow;
                         }
                     } else {
                         e.health -= dmg; 
                     }
                 }
              });
          } else if (target) {
              // Main Projectile Hit
              let finalDamage = p.damage;
              
              if (p.isGlockShot) {
                  finalDamage *= 2; // +100% Damage
              }

              // Apply damage to shield first if exists
              if (target.shield > 0) {
                  if (target.shield >= finalDamage) {
                      target.shield -= finalDamage;
                  } else {
                      const overflow = finalDamage - target.shield;
                      target.shield = 0;
                      target.health -= overflow;
                  }
              } else {
                  target.health -= finalDamage;
              }
              
              // LOCKON: 15% Chance to Apply Status, one check per enemy
              if (p.effects?.includes('LOCKON')) {
                   // Instakill Check if already locked
                   if (target.isLockedOn && target.health < target.maxHealth * 0.25) {
                        target.health = 0;
                        newFloatingTexts.push({
                           id: `term_${Date.now()}_${Math.random()}`,
                           text: 'TERMINATED',
                           x: p.targetPos.x,
                           y: p.targetPos.y,
                           color: "text-red-600",
                           life: 30
                        });
                   } 
                   // Try to lock if not attempted yet
                   else if (!target.sniperRollAttempted && !target.isLockedOn) {
                       target.sniperRollAttempted = true; // Mark as attempted
                       if (Math.random() < 0.15) {
                           target.isLockedOn = true;
                           newFloatingTexts.push({
                               id: `lock_${Date.now()}_${Math.random()}`,
                               text: 'LOCKED',
                               x: p.targetPos.x,
                               y: p.targetPos.y,
                               color: "text-red-500",
                               life: 40
                           });
                       }
                   }
              }

              // BREAKBLITS: 20% Chance to spawn clusters
              if (p.effects?.includes('BREAKBLITS')) {
                 if (Math.random() < 0.2) {
                     const clusterCount = 3;
                     for(let i=0; i<clusterCount; i++) {
                         const angle = (Math.PI * 2 / clusterCount) * i + (Math.random() * 0.5);
                         const dist = 1.0 + (Math.random() * 0.5); 
                         const landX = p.targetPos.x + Math.cos(angle) * dist;
                         const landY = p.targetPos.y + Math.sin(angle) * dist;
                         
                         spawnedProjectiles.push({
                             id: `p_clus_${Date.now()}_${i}_${Math.random()}`,
                             type: p.type,
                             start: p.targetPos,
                             targetPos: { x: landX, y: landY },
                             damage: p.damage * 0.3, // 30% of original damage
                             color: p.color,
                             progress: 0,
                             isCluster: true,
                             clusterRadius: 0.6, // Smaller AOE (Weaker)
                             effects: [] 
                         });
                     }
                 }
              }

              if (p.type === TowerType.BLASTER) {
                  const def = TOWER_DEFS[TowerType.BLASTER];
                  const radius = def.splashRadius || 1.5;
                  newEffects.push({
                     id: `fx_${Date.now()}_${Math.random()}`,
                     type: 'EXPLOSION',
                     x: p.targetPos.x,
                     y: p.targetPos.y,
                     radius: radius,
                     life: 15,
                     maxLife: 15,
                     color: 'bg-retro-purple'
                  });
                  
                  newEnemies.forEach(e => {
                     if (e.id === target?.id) return;
                     const ep = getEntityPosition(e.pathIndex, e.progress, mapPath);
                     const dist = Math.sqrt(Math.pow(ep.x - p.targetPos.x, 2) + Math.pow(ep.y - p.targetPos.y, 2));
                     if (dist < radius) {
                         const dmg = p.damage * 0.5;
                         if (e.shield > 0) {
                             if (e.shield >= dmg) e.shield -= dmg;
                             else {
                                 const rem = dmg - e.shield;
                                 e.shield = 0;
                                 e.health -= rem;
                             }
                         } else {
                             e.health -= dmg;
                         }
                     }
                  });
              }
          }
          return false;
      }
      return true;
  });

  newProjectiles = [...newProjectiles, ...spawnedProjectiles];

  // 5. Cleanup Dead Enemies
  let gainedCredits = 0;
  newEnemies = newEnemies.filter(e => {
      if (e.health <= 0) {
          gainedCredits += e.value;
          newFloatingTexts.push({
              id: `ft_${Date.now()}_${Math.random()}`,
              text: `+$${Math.floor(e.value)}`,
              x: getEntityPosition(e.pathIndex, e.progress, mapPath).x,
              y: getEntityPosition(e.pathIndex, e.progress, mapPath).y,
              color: 'text-yellow-300',
              life: 20
          });
          return false;
      }
      return true;
  });
  
  credits += gainedCredits;

  newEffects = newEffects.filter(e => {
      e.life--;
      return e.life > 0;
  });
  
  newFloatingTexts = newFloatingTexts.filter(ft => {
      ft.life--;
      return ft.life > 0;
  });

  // 7. Process Accumulated Income
  if (tick - lastIncomeTick >= 60) {
      if (accumulatedIncome > 0) {
          credits += accumulatedIncome;
          // Global text removed in favor of per-tower popups
          accumulatedIncome = 0;
      }
      lastIncomeTick = tick;
      
      let currentRate = 0;
      newTowers.forEach(t => {
          if (t.type === TowerType.MINER) {
              const def = TOWER_DEFS[TowerType.MINER];
              let speedBonus = 0;
              let incomeBonus = 0;
              let hasDemandUp = false;
              const loadout = nextState.towerLoadouts[TowerType.MINER];
              if (loadout) {
                   loadout.forEach((g, idx) => {
                       if (g && def.slots[idx] === g.size && (!g.restrictedTo || g.restrictedTo === TowerType.MINER)) {
                           if (g.legendaryEffect === 'DEMANDUP') hasDemandUp = true;
                           g.stats.forEach(s => {
                               if (s.type === 'ATTACK_SPEED') speedBonus += s.value;
                               if (s.type === 'INCOME') incomeBonus += s.value;
                           });
                       }
                   });
              }
              const hz = Math.max(0.1, (60/def.fireRate) + speedBonus);
              const val = 3 + incomeBonus;
              let totalPerSec = val * hz;
              if (hasDemandUp) {
                  // Add the extra 50% every 2s (0.5 times per second)
                  totalPerSec += (val * 0.5) * 0.5;
              }
              currentRate += totalPerSec;
          }
      });
      incomePerSecond = Math.floor(currentRate);
  }

  // 8. Wave Completion
  if (waveActive && newEnemies.length === 0 && newEnemiesToSpawn.length === 0) {
      waveActive = false;
      wave++;
      // Endless mode ignores maxWaves check
      if (!nextState.isEndless && wave > nextState.mapData.maxWaves) {
          gameWon = true;
          saveLevelCompletion(nextState.mapData.id);
      }
  }

  return {
      ...nextState,
      enemies: newEnemies,
      enemiesToSpawn: newEnemiesToSpawn,
      projectiles: newProjectiles,
      towers: newTowers,
      effects: newEffects,
      floatingTexts: newFloatingTexts,
      credits,
      health,
      gameOver,
      gameWon,
      waveActive,
      spawnTimer: newSpawnTimer,
      wave,
      tick: tick + 1,
      lastIncomeTick,
      accumulatedIncome,
      incomePerSecond
  };
};
