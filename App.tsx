
import React, { useState, useEffect, useRef, useCallback } from 'react';
import Grid from './components/Grid';
import { 
  GameState, 
  TowerType, 
  MapConfig, 
  Gear,
  GearSize,
  TowerConfig
} from './types';
import { 
  getInitialState, 
  updateGame, 
  startNextWave,
  loadCompletedLevels,
  saveLevelCompletion,
  generateRandomGear
} from './services/gameLogic';
import { 
  TOWER_DEFS, 
  MAPS,
  CELL_SIZE,
  WORLD_SIZE,
  TERRAIN_FEATURES,
  INITIAL_INVENTORY,
  INITIAL_LOADOUTS
} from './constants';
import { 
  Pause, 
  Play,
  FastForward,
  Trash2,
  Flag,
  Crosshair,
  X,
  Star,
  ArrowLeft,
  CheckCircle2,
  Monitor,
  Terminal,
  Ticket,
  AlertTriangle,
  Zap,
  Box,
  Database,
  Grid3X3,
  Sword,
  Timer,
  MousePointer2,
  ScanEye,
  DollarSign,
  ArrowDownUp,
  ShoppingBag,
  Package,
  Sparkles,
  Sliders,
  EyeOff,
  Eye,
  Sun,
  Moon,
  Droplets,
  Infinity as InfinityIcon,
  Clock
} from 'lucide-react';

// --- CUSTOM PIXEL ICONS ---

const PixelGear = ({ size = 24, className = "" }: { size?: number, className?: string }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="currentColor" 
    className={className} 
    xmlns="http://www.w3.org/2000/svg"
    style={{ shapeRendering: 'crispEdges' }}
  >
    <path 
      fillRule="evenodd"
      clipRule="evenodd"
      d="
        M10 2H14V4H17L18 5V8H20V9H22V15H20V16H18V19L17 20H14V22H10V20H7L6 19V16H4V15H2V9H4V8H6V5L7 4H10V2ZM12 8C9.79086 8 8 9.79086 8 12C8 14.2091 9.79086 16 12 16C14.2091 16 16 14.2091 16 12C16 9.79086 14.2091 8 12 8ZM12 10C13.1046 10 14 10.8954 14 12C14 13.1046 13.1046 14 12 14C10.8954 14 10 13.1046 10 12C10 10.8954 10.8954 10 12 10Z"
    />
    <rect x="11" y="2" width="2" height="2" fill="white" fillOpacity="0.3" />
    <rect x="20" y="11" width="2" height="2" fill="white" fillOpacity="0.3" />
    <rect x="11" y="20" width="2" height="2" fill="black" fillOpacity="0.3" />
    <rect x="2" y="11" width="2" height="2" fill="black" fillOpacity="0.3" />
  </svg>
);

const PixelWrench = ({ size = 24, className = "" }: { size?: number, className?: string }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="currentColor" 
    className={className} 
    xmlns="http://www.w3.org/2000/svg"
    style={{ shapeRendering: 'crispEdges' }}
  >
    <path 
      fillRule="evenodd"
      clipRule="evenodd"
      d="
        M15 3H19V5H21V10H19V11H17V12H16V13H14V14H13V15H12V16H11V17H10V18H9V19H6V22H2V18H5V15H6V14H7V13H8V12H9V11H10V10H11V9H12V8H13V7H14V5H12V3H15ZM16 7H19V9H16V7ZM4 20H5V21H4V20Z
      "
    />
    <path d="M15 3H19V4H15V3ZM6 14H7V15H6V14ZM2 18H5V19H2V18Z" fill="white" fillOpacity="0.2" />
    <path d="M14 5H12V7H13V8H14V5ZM6 22H2V21H6V22ZM9 19H10V18H9V19Z" fill="black" fillOpacity="0.3" />
  </svg>
);

// --- VISUAL ENHANCEMENT COMPONENT ---
const GearDisplay = ({ gear, size = 24, className = "", showEffects = true }: { gear: Gear, size?: number, className?: string, showEffects?: boolean }) => {
  const isLegendary = gear.rarity === 'LEGENDARY';
  const isEpic = gear.rarity === 'EPIC';
  const isRare = gear.rarity === 'RARE';
  const isUncommon = gear.rarity === 'UNCOMMON';

  // Base size for overlay particles
  const particleSize = Math.max(3, Math.floor(size / 5));

  return (
    <div className={`relative flex items-center justify-center ${className}`} style={{ width: size, height: size }}>
      
      {/* Rarity Background Glows */}
      {showEffects && (
          <div className="absolute inset-0 pointer-events-none">
              {isLegendary && <div className="absolute inset-[-30%] bg-retro-orange/40 blur-lg rounded-full animate-pulse" />}
              {isEpic && <div className="absolute inset-[-20%] bg-retro-purple/30 blur-md rounded-full animate-pulse" />}
              {isRare && <div className="absolute inset-[-10%] bg-retro-cyan/20 blur-sm rounded-full" />}
              {isUncommon && <div className="absolute inset-0 bg-retro-green/10 blur-[1px] rounded-full" />}
          </div>
      )}

      {/* The Gear Icon */}
      <div className={`relative z-10 transition-transform will-change-transform
          ${showEffects && isLegendary ? 'animate-spin-slow' : ''} 
          ${showEffects && isEpic ? 'animate-[bounce_2s_infinite]' : ''}
      `}>
         <PixelGear size={size} className={`${gear.color} drop-shadow-sm`} />
         
         {/* Legendary Core Pulse */}
         {showEffects && isLegendary && (
             <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1/3 h-1/3 bg-white rounded-full mix-blend-overlay animate-ping opacity-75" />
         )}
         
         {/* Epic/Rare Center Highlight */}
         {showEffects && (isEpic || isRare) && (
             <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1/4 h-1/4 bg-white rounded-full mix-blend-overlay opacity-50" />
         )}
      </div>

      {/* Overlay Particles for Legendary/Epic */}
      {showEffects && isLegendary && (
        <>
           <div className="absolute -top-1 -right-1 animate-bounce" style={{ animationDuration: '2s' }}>
              <Star size={particleSize} className="text-yellow-200 fill-yellow-200 drop-shadow-md" />
           </div>
           <div className="absolute -bottom-1 -left-1 animate-bounce" style={{ animationDuration: '3s', animationDelay: '0.5s' }}>
              <Sparkles size={particleSize} className="text-orange-300 drop-shadow-md" />
           </div>
           <div className="absolute top-1/2 -left-2 animate-pulse" style={{ animationDuration: '1.5s' }}>
              <div className="w-1 h-1 bg-white rounded-full shadow-[0_0_4px_white]" />
           </div>
        </>
      )}
      
      {showEffects && isEpic && (
         <div className="absolute -top-1 -right-1 animate-pulse">
             <Sparkles size={particleSize} className="text-purple-300 drop-shadow-sm" />
         </div>
      )}
      
      {showEffects && isRare && (
         <div className="absolute bottom-0 right-0">
             <div className="w-1.5 h-1.5 bg-retro-cyan/50 rounded-full shadow-[0_0_4px_#41a6f6]" />
         </div>
      )}
    </div>
  );
};

// CONSTANTS
const TICKS_PER_DAY = 10800; // 3 minutes @ 60fps

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [selectedTower, setSelectedTower] = useState<TowerType | null>(null); 
  const [selectedInstanceId, setSelectedInstanceId] = useState<string | null>(null);
  const [showMapSelect, setShowMapSelect] = useState(true);
  const [showStats, setShowStats] = useState(false);
  const [selectedMapBriefing, setSelectedMapBriefing] = useState<MapConfig | null>(null);
  
  // Mission Selector State
  const [selectedDifficulty, setSelectedDifficulty] = useState<number>(0);
  const [isEndlessMode, setIsEndlessMode] = useState(false);

  // Settings State
  const [settings, setSettings] = useState<{ 
    activeShader: 'NONE' | 'PETER' | 'PLASTIC';
    shadowIntensity: number;
    lightPower: number;
    bloomStrength: number;
    skipCrateAnimation: boolean;
    disableDayNight: boolean;
    autoStart: boolean;
    autoStartDelay: number;
  }>({ 
    activeShader: 'NONE',
    shadowIntensity: 0.6,
    lightPower: 1.0,
    bloomStrength: 0.13,
    skipCrateAnimation: false,
    disableDayNight: false,
    autoStart: false,
    autoStartDelay: 10
  });
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [code, setCode] = useState("");
  const [codeMessage, setCodeMessage] = useState<string | null>(null);
  const [resetConfirm, setResetConfirm] = useState(false); // For data reset safety
  const [redeemedCodes, setRedeemedCodes] = useState<string[]>([]); // Track redeemed codes

  // GearSmith State
  const [showGearSmith, setShowGearSmith] = useState(false);
  const [selectedGearTower, setSelectedGearTower] = useState<TowerType>(TowerType.TURRET);
  const [activeSlotIndex, setActiveSlotIndex] = useState<number | null>(null);
  const [inspectedGear, setInspectedGear] = useState<Gear | null>(null); 
  const [gearSortMode, setGearSortMode] = useState<'RARITY' | 'NEWEST' | 'DAMAGE' | 'ATK_SPEED' | 'RANGE' | 'INCOME'>('RARITY');

  // Shop State
  const [showShop, setShowShop] = useState(false);
  const [globalTickets, setGlobalTickets] = useState(0);
  const [crateState, setCrateState] = useState<'IDLE' | 'OPENING' | 'REVEALED'>('IDLE');
  const [rewardGear, setRewardGear] = useState<Gear | null>(null);

  // Tooltip / Hold State
  const [gearTooltip, setGearTooltip] = useState<{ gear: Gear; x: number; y: number } | null>(null);
  const [towerTooltip, setTowerTooltip] = useState<{ def: TowerConfig; x: number; y: number } | null>(null);
  const longPressTimer = useRef<number | null>(null);
  const isLongPress = useRef(false);

  // Persistent Player Data (Inventory & Loadouts)
  const [gearInventory, setGearInventory] = useState<Gear[]>(INITIAL_INVENTORY);
  const [towerLoadouts, setTowerLoadouts] = useState<Record<TowerType, (Gear | null)[]>>(INITIAL_LOADOUTS);

  // Currency State (Cubes)
  const [cubes, setCubes] = useState(0);

  // Retreat Modal State
  const [showRetreatModal, setShowRetreatModal] = useState(false);

  // Track completed levels
  const [completedLevels, setCompletedLevels] = useState<string[]>([]);

  // Track which map to focus on in Campaign View
  const [focusedMapId, setFocusedMapId] = useState<string>(MAPS[0].id);

  // Reset briefing state when opening a new one
  useEffect(() => {
     if (selectedMapBriefing) {
         setSelectedDifficulty(0);
         setIsEndlessMode(false);
     }
  }, [selectedMapBriefing]);

  // Helper to calculate center offset for a map node
  const getMapCenterOffset = useCallback((mapId: string) => {
    const targetMap = MAPS.find(m => m.id === mapId) || MAPS[0];
    const targetX = (targetMap.worldPosition.x / 100) * WORLD_SIZE.width;
    const targetY = (targetMap.worldPosition.y / 100) * WORLD_SIZE.height;
    
    // Safety check for window (SSR or early render)
    const vw = typeof window !== 'undefined' ? window.innerWidth : 375;
    const vh = typeof window !== 'undefined' ? window.innerHeight : 667;

    return {
      x: (vw / 2) - targetX,
      y: (vh / 2) - targetY
    };
  }, []);

  // Viewport & Drag State (Game)
  const [viewOffset, setViewOffset] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [isDragging, setIsDragging] = useState(false);
  const lastDragPos = useRef({ x: 0, y: 0 });
  const gameViewportRef = useRef<HTMLDivElement>(null);
  
  // Ref for gesture physics (avoids closure staleness)
  const transformRef = useRef({ x: 0, y: 0, scale: 1 });

  // Campaign Map Viewport - Initialize with first map centered to avoid jump
  const [campaignOffset, setCampaignOffset] = useState(() => getMapCenterOffset(MAPS[0].id));
  
  // Touch Handling State
  const activePointers = useRef<Map<number, {x: number, y: number}>>(new Map());
  
  // Refs for Game Loop
  const requestRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);
  const accumulatorRef = useRef<number>(0);

  // Load completed levels, settings, currency, and inventory on mount
  useEffect(() => {
    const completed = loadCompletedLevels();
    setCompletedLevels(completed);
    
    const savedSettings = localStorage.getItem('pixel_defense_settings_v1');
    if (savedSettings) {
        try {
            const parsed = JSON.parse(savedSettings);
            
            // Migration logic for old enableShaders boolean
            let shaderMode: 'NONE' | 'PETER' | 'PLASTIC' = parsed.activeShader ?? 'NONE';
            if (!parsed.activeShader && parsed.enableShaders) {
                shaderMode = 'PETER';
            }

            setSettings({
                activeShader: shaderMode,
                shadowIntensity: parsed.shadowIntensity ?? 0.6,
                lightPower: parsed.lightPower ?? 1.0,
                bloomStrength: parsed.bloomStrength ?? 0.13,
                skipCrateAnimation: parsed.skipCrateAnimation ?? false,
                disableDayNight: parsed.disableDayNight ?? false,
                autoStart: parsed.autoStart ?? false,
                autoStartDelay: parsed.autoStartDelay ?? 10
            });
        } catch(e) { console.error("Failed to load settings"); }
    }

    const savedCubes = localStorage.getItem('pixel_defense_cubes_v1');
    if (savedCubes) {
        setCubes(parseInt(savedCubes));
    } else {
        setCubes(0);
    }

    const savedTickets = localStorage.getItem('pixel_defense_tickets_v1');
    if (savedTickets) {
        setGlobalTickets(parseInt(savedTickets));
    }

    const savedCodes = localStorage.getItem('pixel_defense_redeemed_codes_v1');
    if (savedCodes) {
        try { setRedeemedCodes(JSON.parse(savedCodes)); } catch(e) {}
    }

    // Load Inventory & Loadouts
    const savedInventory = localStorage.getItem('pixel_defense_inventory_v1');
    if (savedInventory) {
        try { setGearInventory(JSON.parse(savedInventory)); } catch(e) {}
    }
    
    const savedLoadouts = localStorage.getItem('pixel_defense_loadouts_v1');
    if (savedLoadouts) {
        try { setTowerLoadouts(JSON.parse(savedLoadouts)); } catch(e) {}
    }

    // Auto-focus the first uncompleted map or the last map if all done
    const firstUncompleted = MAPS.find(m => !completed.includes(m.id));
    if (firstUncompleted) {
       setFocusedMapId(firstUncompleted.id);
       setCampaignOffset(getMapCenterOffset(firstUncompleted.id));
    } else {
       // If all completed, focus last
       const lastMap = MAPS[MAPS.length - 1];
       setFocusedMapId(lastMap.id);
       setCampaignOffset(getMapCenterOffset(lastMap.id));
    }
  }, [getMapCenterOffset]);

  // Sync Settings to Game State
  useEffect(() => {
      if (gameState) {
          setGameState(prev => {
              if (!prev) return null;
              // Check if values actually changed to avoid unnecessary state updates
              if (prev.autoStart.enabled === settings.autoStart && prev.autoStart.delay === settings.autoStartDelay) {
                  return prev;
              }
              return {
                  ...prev,
                  autoStart: {
                      ...prev.autoStart,
                      enabled: settings.autoStart,
                      delay: settings.autoStartDelay
                  }
              };
          });
      }
  }, [settings.autoStart, settings.autoStartDelay, gameState?.autoStart?.enabled]);

  // Save Inventory & Loadouts on Change
  useEffect(() => {
      localStorage.setItem('pixel_defense_inventory_v1', JSON.stringify(gearInventory));
  }, [gearInventory]);

  useEffect(() => {
      localStorage.setItem('pixel_defense_loadouts_v1', JSON.stringify(towerLoadouts));
  }, [towerLoadouts]);

  useEffect(() => {
      localStorage.setItem('pixel_defense_tickets_v1', globalTickets.toString());
  }, [globalTickets]);

  // Handle visibility change to auto-pause
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        setGameState(prev => prev ? ({ ...prev, isPlaying: false }) : null);
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  const toggleShader = (mode: 'PETER' | 'PLASTIC') => {
      const newMode = settings.activeShader === mode ? 'NONE' : mode;
      const newSettings = { ...settings, activeShader: newMode };
      setSettings(newSettings);
      localStorage.setItem('pixel_defense_settings_v1', JSON.stringify(newSettings));
  };

  const updateShaderSetting = (key: string, value: number) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    localStorage.setItem('pixel_defense_settings_v1', JSON.stringify(newSettings));
  };

  const toggleCrateAnimation = () => {
      const newSettings = { ...settings, skipCrateAnimation: !settings.skipCrateAnimation };
      setSettings(newSettings);
      localStorage.setItem('pixel_defense_settings_v1', JSON.stringify(newSettings));
  };

  const toggleAutoStart = () => {
      const newSettings = { ...settings, autoStart: !settings.autoStart };
      setSettings(newSettings);
      localStorage.setItem('pixel_defense_settings_v1', JSON.stringify(newSettings));
  };

  const setAutoStartDelay = (val: number) => {
      const newSettings = { ...settings, autoStartDelay: val };
      setSettings(newSettings);
      localStorage.setItem('pixel_defense_settings_v1', JSON.stringify(newSettings));
  };

  const handleResetData = () => {
    if (resetConfirm) {
        localStorage.removeItem('pixel_defense_completed_v1');
        localStorage.removeItem('pixel_defense_settings_v1');
        localStorage.removeItem('pixel_defense_cubes_v1');
        localStorage.removeItem('pixel_defense_inventory_v1');
        localStorage.removeItem('pixel_defense_loadouts_v1');
        localStorage.removeItem('pixel_defense_tickets_v1');
        localStorage.removeItem('pixel_defense_redeemed_codes_v1');
        window.location.reload();
    } else {
        setResetConfirm(true);
        // Reset confirmation state after 3 seconds
        setTimeout(() => setResetConfirm(false), 3000);
    }
  };

  const handleRedeemCode = () => {
    if (!code) return;
    const cleanCode = code.trim();
    
    // Check if redeemed (Except NoCD and TFE)
    if (cleanCode !== 'NoCD' && cleanCode !== 'TFE' && redeemedCodes.includes(cleanCode)) {
        setCodeMessage("ALREADY REDEEMED");
        setCode("");
        setTimeout(() => setCodeMessage(null), 2000);
        return;
    }

    let success = false;
    let msg = "";

    // Global Cheats (Available anywhere)
    if (cleanCode === 'CompleteNerd') {
        MAPS.forEach(m => saveLevelCompletion(m.id));
        setCompletedLevels(loadCompletedLevels());
        msg = "ALL LEVELS UNLOCKED";
        success = true;
    } else if (cleanCode === 'RichGuy') {
        const newCubes = cubes + 1000;
        setCubes(newCubes);
        localStorage.setItem('pixel_defense_cubes_v1', newCubes.toString());
        msg = "+1000 CUBES";
        success = true;
    } else if (cleanCode === 'Cubed') {
        const newCubes = cubes + 1000; // BUFFED FROM 100
        setCubes(newCubes);
        localStorage.setItem('pixel_defense_cubes_v1', newCubes.toString());
        msg = "+1000 CUBES";
        success = true;
    } else if (cleanCode === 'GearUp') {
        const newGears: Gear[] = [];
        const sizes = Object.values(GearSize);
        
        // Structured Drop: 1 of each Rarity for each Tower Type
        const rarities: Gear['rarity'][] = ['LEGENDARY', 'EPIC', 'RARE', 'UNCOMMON', 'COMMON', 'BASIC'];
        const types = [TowerType.TURRET, TowerType.SNIPER, TowerType.BLASTER, TowerType.MINER];

        for (const rarity of rarities) {
            for (const type of types) {
                // Random Size
                const size = sizes[Math.floor(Math.random() * sizes.length)];
                // Deterministic generation
                newGears.push(generateRandomGear(size, rarity, type));
            }
        }

        setGearInventory(prev => [...prev, ...newGears]);
        msg = `CRATE UNLOCKED: ${newGears.length} GEARS`;
        success = true;
    } else if (cleanCode === 'TFE') {
        const testGears: Gear[] = [
            {
                id: `g_tfe_${Date.now()}_1`,
                name: "Proto-Glock",
                size: GearSize.SMALL,
                rarity: 'BASIC',
                color: 'text-gray-500',
                stats: [{ type: 'DAMAGE', value: 5 }],
                restrictedTo: TowerType.TURRET,
                legendaryEffect: 'GLOCK'
            },
            {
                id: `g_tfe_${Date.now()}_2`,
                name: "Proto-Seeker",
                size: GearSize.MEDIUM,
                rarity: 'BASIC',
                color: 'text-gray-500',
                stats: [{ type: 'RANGE', value: 2 }],
                restrictedTo: TowerType.SNIPER,
                legendaryEffect: 'LOCKON'
            },
            {
                id: `g_tfe_${Date.now()}_3`,
                name: "Proto-Cluster",
                size: GearSize.SMALL,
                rarity: 'BASIC',
                color: 'text-gray-500',
                stats: [{ type: 'DAMAGE', value: 2 }],
                restrictedTo: TowerType.BLASTER,
                legendaryEffect: 'BREAKBLITS'
            },
            {
                id: `g_tfe_${Date.now()}_4`,
                name: "Proto-Ledger",
                size: GearSize.SMALL,
                rarity: 'BASIC',
                color: 'text-gray-500',
                stats: [{ type: 'INCOME', value: 2 }],
                restrictedTo: TowerType.MINER,
                legendaryEffect: 'DEMANDUP'
            }
        ];
        setGearInventory(prev => [...prev, ...testGears]);
        msg = "LEGENDARY PROTOTYPES ADDED";
        success = true;
    } else if (gameState) {
        // In-Game Cheats
        if (cleanCode === 'HappyKill') {
            setGameState(prev => prev ? ({ ...prev, skipTickets: prev.skipTickets + 5 }) : null);
            setGlobalTickets(t => t + 5);
            msg = "+5 SKIP TICKETS";
            success = true;
        } else if (cleanCode === 'MoneyMoney') {
            setGameState(prev => prev ? ({ ...prev, credits: prev.credits + 5000 }) : null);
            msg = "+$5,000";
            success = true;
        } else if (cleanCode === 'NoCD') {
            setGameState(prev => prev ? ({ ...prev, cheats: { ...prev.cheats, noCD: true } }) : null);
            msg = "NO COOLDOWN (THIS MAP)";
            success = true;
        } else {
            msg = "INVALID CODE";
        }
    } else {
         if (['HappyKill', 'MoneyMoney', 'NoCD'].includes(cleanCode)) {
            msg = "MUST BE IN-GAME";
         } else {
            msg = "INVALID CODE";
         }
    }

    setCodeMessage(msg);
    if (success) {
        setCode("");
        // Save redemption state (Except NoCD and TFE)
        if (cleanCode !== 'NoCD' && cleanCode !== 'TFE') {
            const newRedeemed = [...redeemedCodes, cleanCode];
            setRedeemedCodes(newRedeemed);
            localStorage.setItem('pixel_defense_redeemed_codes_v1', JSON.stringify(newRedeemed));
        }
    }
    setTimeout(() => setCodeMessage(null), 3000);
  };

  // --- SHOP LOGIC ---
  const purchaseTicket = () => {
    if (cubes < 10) return;
    setCubes(c => {
        const newC = c - 10;
        localStorage.setItem('pixel_defense_cubes_v1', newC.toString());
        return newC;
    });
    setGlobalTickets(t => t + 1);
  };

  const purchaseCrate = () => {
    if (cubes < 50) return;
    setCubes(c => {
        const newC = c - 50;
        localStorage.setItem('pixel_defense_cubes_v1', newC.toString());
        return newC;
    });
    
    // Generate Item immediately
    const sizes = Object.values(GearSize);
    const size = sizes[Math.floor(Math.random() * sizes.length)];
    const newGear = generateRandomGear(size); 
    setRewardGear(newGear);
    setGearInventory(prev => [...prev, newGear]);

    if (settings.skipCrateAnimation) {
        // Skip animation
        setCrateState('REVEALED');
    } else {
        // Play Animation
        setCrateState('OPENING');
        setTimeout(() => {
            setCrateState('REVEALED');
        }, 2500); // 2.5 seconds spin
    }
  };

  // --- UPDATED RARITY COLORS ---
  const getRarityColor = (rarity: string) => {
    switch (rarity) {
        case 'LEGENDARY': return 'text-retro-orange';
        case 'EPIC': return 'text-retro-purple';
        case 'RARE': return 'text-retro-cyan';
        case 'UNCOMMON': return 'text-retro-green';
        case 'COMMON': return 'text-gray-300';
        default: return 'text-gray-500';
    }
  };

  // --- CLAMPING HELPER (Pure Function) ---
  const getClampedOffset = useCallback((x: number, y: number, z: number, vw: number, vh: number, mw: number, mh: number) => {
    const currentMapW = mw * z;
    const currentMapH = mh * z;

    let newX = x;
    let newY = y;

    // Horizontal Logic
    if (currentMapW > vw) {
      const minX = vw - currentMapW;
      const maxX = 0;
      newX = Math.min(maxX, Math.max(minX, x));
    } else {
      // Center if smaller
      newX = (vw - currentMapW) / 2;
    }

    // Vertical Logic
    if (currentMapH > vh) {
      const minY = vh - currentMapH;
      const maxY = 0;
      newY = Math.min(maxY, Math.max(minY, y));
    } else {
      newY = (vh - currentMapH) / 2;
    }

    return { x: newX, y: newY };
  }, []);

  // Calculate Zoom & Center View on Map Load/Resize
  useEffect(() => {
    const handleResize = () => {
      if (gameState && gameViewportRef.current && !showMapSelect) {
         const vw = gameViewportRef.current.clientWidth;
         const vh = gameViewportRef.current.clientHeight;
         const mw = gameState.mapData.width * CELL_SIZE;
         const mh = gameState.mapData.height * CELL_SIZE;
  
         // "Cover" logic: Zoom to fill the screen completely (no black bars)
         const coverZoom = Math.max(vw / mw, vh / mh);
         
         // Set fixed zoom
         setZoom(coverZoom);
         transformRef.current.scale = coverZoom;
  
         // Center initially
         const clamped = getClampedOffset(
             (vw - mw * coverZoom) / 2, 
             (vh - mh * coverZoom) / 2, 
             coverZoom, 
             vw, vh, mw, mh
         );
         
         setViewOffset(clamped);
         transformRef.current.x = clamped.x;
         transformRef.current.y = clamped.y;
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    const timer = setTimeout(handleResize, 100);

    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(timer);
    };
  }, [gameState?.mapData.id, showMapSelect, getClampedOffset]);

  // Campaign Camera Logic: Center on focusedMapId when Map Select is shown
  useEffect(() => {
    if (showMapSelect) {
      // Slight timeout to allow layout to settle if needed, but primary calculation is instant
      const timer = setTimeout(() => {
        setCampaignOffset(getMapCenterOffset(focusedMapId));
      }, 10);
      return () => clearTimeout(timer);
    }
  }, [showMapSelect, focusedMapId, getMapCenterOffset]);

  // Auto-hide stats
  useEffect(() => {
    if (showStats && !selectedInstanceId) {
      const timer = setTimeout(() => setShowStats(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [showStats, selectedInstanceId]);

  const animate = (time: number) => {
    if (lastTimeRef.current !== 0) {
      const deltaTime = time - lastTimeRef.current;
      
      // Safety Clamp: If delta > 1000ms (1s), skip accumulation to prevent fast-forwarding
      if (deltaTime > 1000) {
        lastTimeRef.current = time;
        requestRef.current = requestAnimationFrame(animate);
        return;
      }

      // Scale deltaTime by gameSpeed to support fractional speeds (1.5x)
      const speed = gameState?.gameSpeed || 1;
      accumulatorRef.current += deltaTime * speed;

      const fixedStep = 16.667;
      const maxUpdates = 10; // Cap updates to avoid death spiral
      
      let updates = 0;
      while (accumulatorRef.current >= fixedStep && updates < maxUpdates) {
        if (gameState) {
           setGameState(prev => prev ? updateGame(prev) : null);
        }
        accumulatorRef.current -= fixedStep;
        updates++;
      }
    }
    lastTimeRef.current = time;
    requestRef.current = requestAnimationFrame(animate);
  };

  useEffect(() => {
    // RESET TIMING REFS when loop restarts (new speed or resume)
    // This prevents stale large deltaTimes from causing a "fast forward" surge
    lastTimeRef.current = 0;
    accumulatorRef.current = 0;
    
    requestRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(requestRef.current);
  }, [gameState?.gameSpeed, gameState?.isPlaying]); 

  // --- UNIFIED TOUCH/POINTER HANDLERS ---
  const handlePointerDown = useCallback((e: React.PointerEvent, context: 'GAME' | 'MAP') => {
    // Only drag if the target itself is the container or an allowed child
    // This is a fallback; stopPropagation on buttons is the primary fix.
    if (e.target instanceof Element && e.target.closest('button')) return;
    if (e.target instanceof Element && e.target.closest('input')) return; // Allow input focus

    // Use currentTarget to ensure we capture on the container
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    activePointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

    // Initialize state
    if (activePointers.current.size === 1) {
      if (context === 'GAME') {
        transformRef.current = { x: viewOffset.x, y: viewOffset.y, scale: zoom };
      }
      setIsDragging(true);
      lastDragPos.current = { x: e.clientX, y: e.clientY };
    }
  }, [viewOffset.x, viewOffset.y, zoom]);

  const handlePointerMove = useCallback((e: React.PointerEvent, context: 'GAME' | 'MAP') => {
    if (!activePointers.current.has(e.pointerId)) return;
    
    activePointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    
    // --- DRAG ---
    if (activePointers.current.size === 1 && isDragging) {
      const dx = e.clientX - lastDragPos.current.x;
      const dy = e.clientY - lastDragPos.current.y;
      
      if (context === 'GAME' && gameViewportRef.current && gameState) {
        const vw = gameViewportRef.current.clientWidth;
        const vh = gameViewportRef.current.clientHeight;
        const mw = gameState.mapData.width * CELL_SIZE;
        const mh = gameState.mapData.height * CELL_SIZE;

        const nextX = transformRef.current.x + dx;
        const nextY = transformRef.current.y + dy;
        const currentZ = transformRef.current.scale;

        const clamped = getClampedOffset(nextX, nextY, currentZ, vw, vh, mw, mh);
        
        transformRef.current = { x: clamped.x, y: clamped.y, scale: currentZ };
        setViewOffset({ x: clamped.x, y: clamped.y });
      } else {
        setCampaignOffset(prev => ({ x: prev.x + dx, y: prev.y + dy }));
      }
      
      lastDragPos.current = { x: e.clientX, y: e.clientY };
    }
  }, [isDragging, gameState, getClampedOffset]);

  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    if (activePointers.current.has(e.pointerId)) {
      try {
        (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
      } catch (err) {
        // Ignore if pointer capture was lost
      }
      activePointers.current.delete(e.pointerId);
    }
    
    if (activePointers.current.size === 0) {
      setIsDragging(false);
    } else if (activePointers.current.size === 1) {
      const p = activePointers.current.values().next().value;
      lastDragPos.current = { x: p.x, y: p.y };
      transformRef.current = { x: viewOffset.x, y: viewOffset.y, scale: zoom };
    }
  }, [viewOffset.x, viewOffset.y, zoom]);

  // Memoize handleGridClick to prevent Grid re-renders
  const handleGridClickWrapper = useCallback((x: number, y: number) => {
    if (!gameState || gameState.gameOver || gameState.gameWon) return;

    const existingTower = gameState.towers.find(t => t.position.x === x && t.position.y === y);
    if (existingTower) {
        setSelectedInstanceId(existingTower.id);
        setSelectedTower(null);
        setShowStats(true);
        return;
    }

    if (selectedTower) {
        const isPath = gameState.mapData.path.some(c => c.x === x && c.y === y);
        const isObstacle = gameState.mapData.obstacles.some(c => c.x === x && c.y === y);
        const hasTower = gameState.towers.some(t => t.position.x === x && t.position.y === y);
        const def = TOWER_DEFS[selectedTower];
        const currentCount = gameState.towers.filter(t => t.type === selectedTower).length;
        
        // Calculate limit: Normal towers scale with waves, Bank scales with map clears
        let currentLimit = def.baseLimit + (def.limitPerWave * (gameState.wave - 1));
        if (selectedTower === TowerType.MINER) {
             currentLimit = def.baseLimit + Math.floor(completedLevels.length / 2);
        }

        if (!isPath && !isObstacle && !hasTower && currentCount < currentLimit && gameState.credits >= def.cost) {
            setGameState(prev => prev ? ({
                ...prev,
                credits: prev.credits - def.cost,
                towers: [
                    ...prev.towers,
                    {
                        id: `t_${Date.now()}_${x}_${y}`,
                        type: selectedTower,
                        position: { x, y },
                        lastFiredTick: 0,
                        rotation: 0 
                    }
                ]
            }) : null);
        }
    } else {
        setSelectedInstanceId(null);
        setShowStats(false);
    }
  }, [gameState, selectedTower, completedLevels]); 

  const handleSellTower = () => {
    if (!selectedInstanceId || !gameState) return;
    const tower = gameState.towers.find(t => t.id === selectedInstanceId);
    if (!tower) return;

    const def = TOWER_DEFS[tower.type];
    const refund = Math.floor(def.cost * 0.5);

    setGameState(prev => prev ? ({
      ...prev,
      credits: prev.credits + refund,
      towers: prev.towers.filter(t => t.id !== selectedInstanceId),
      floatingTexts: [...prev.floatingTexts, {
        id: `sell_${Date.now()}`,
        text: `+$${refund}`,
        x: tower.position.x + 0.5,
        y: tower.position.y + 0.5,
        color: "text-green-400",
        life: 30
      }]
    }) : null);
    setSelectedInstanceId(null);
    setShowStats(false);
  };

  const handleStartWave = () => {
    if (gameState && !gameState.waveActive) {
      setGameState(prev => prev ? ({ ...startNextWave(prev), isPlaying: true }) : null);
    }
  };

  // QUEUE SKIP MECHANIC: Stackable Skips
  const handleQueueSkip = () => {
      if (gameState && !gameState.waveActive && gameState.skipTickets > 0) {
          // Extra validation to ensure we don't skip illegal waves
          const isBoss = gameState.wave % 5 === 0;
          const isPreBoss = (gameState.wave + 1) % 5 === 0;
          if (isBoss || isPreBoss) return;

          setGameState(prev => {
              if (!prev) return null;
              // 1. Consume Ticket
              const newTickets = prev.skipTickets - 1;
              // 2. NO CASH REWARD - ONLY LOOT BONUS
              // 3. Stack Buffs
              
              return {
                 ...prev,
                 skipTickets: newTickets,
                 wave: prev.wave + 1, // Visually advance wave counter
                 pendingWaveBuff: prev.pendingWaveBuff + 0.25, // Accumulate 25% Threat
                 pendingMoneyBonus: prev.pendingMoneyBonus + 0.50, // Accumulate 50% Money
                 floatingTexts: [...prev.floatingTexts, {
                     id: `skip_${Date.now()}`,
                     text: `THREAT UP / LOOT UP`,
                     x: prev.mapData.width / 2,
                     y: prev.mapData.height / 2,
                     color: "text-yellow-400",
                     life: 60
                 }]
              };
          });
          setGlobalTickets(t => Math.max(0, t - 1)); // Sync global tickets
      }
  };
  
  // Initiates the retreat process. If game is active, show modal. If finished, just go.
  const handleRetreatRequest = () => {
      if (!gameState) return;
      if (gameState.gameOver || gameState.gameWon) {
          performRetreat();
      } else {
          setShowRetreatModal(true);
      }
  };

  // Actually performs the map transition
  const performRetreat = () => {
      // Reload completed levels to reflect any new victories before returning
      const latestCompleted = loadCompletedLevels();
      setCompletedLevels(latestCompleted);

      // Logic to move to next level if won
      if (gameState?.gameWon) {
        const currentIndex = MAPS.findIndex(m => m.id === gameState.mapData.id);
        if (currentIndex !== -1 && currentIndex < MAPS.length - 1) {
          // Focus next level
          setFocusedMapId(MAPS[currentIndex + 1].id);
        } else {
          // End of game or stay on last
          setFocusedMapId(gameState.mapData.id);
        }
      } else if (gameState) {
        // Return to current level pin on defeat/retreat
        setFocusedMapId(gameState.mapData.id);
      }

      setGameState(null);
      setShowMapSelect(true);
      setShowRetreatModal(false);
  };
  
  const toggleSpeed = () => {
    setGameState(prev => {
      if (!prev) return null;
      const speeds = [1, 1.5, 2, 3];
      const currentIndex = speeds.indexOf(prev.gameSpeed);
      const nextIndex = (currentIndex + 1) % speeds.length;
      return { ...prev, gameSpeed: speeds[nextIndex] };
    });
  };

  const selectMap = (mapConfig: MapConfig) => {
    const newState = getInitialState(
        mapConfig, 
        gearInventory, 
        towerLoadouts, 
        globalTickets, 
        selectedDifficulty, 
        isEndlessMode
    );
    // Apply auto start settings immediately
    newState.autoStart = {
        enabled: settings.autoStart,
        delay: settings.autoStartDelay,
        timer: 0
    };
    setGameState(newState);
    setShowMapSelect(false);
    setSelectedMapBriefing(null);
    setFocusedMapId(mapConfig.id); // Track current playing map
  };

  // --- GEARSMITH LOGIC ---
  
  // Long Press Handlers
  const handleGearPointerDown = (e: React.PointerEvent, gear: Gear) => {
      isLongPress.current = false;
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top; // Show above

      longPressTimer.current = window.setTimeout(() => {
          isLongPress.current = true;
          setGearTooltip({ gear, x: centerX, y: centerY });
      }, 250); // 250ms hold threshold
  };

  const handleSocketPointerDown = (e: React.PointerEvent, gear: Gear | null) => {
      if (!gear) return;
      isLongPress.current = false;
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top; 

      longPressTimer.current = window.setTimeout(() => {
          isLongPress.current = true;
          setGearTooltip({ gear, x: centerX, y: centerY });
      }, 250); 
  };

  const handleGearPointerUp = () => {
      if (longPressTimer.current) {
          clearTimeout(longPressTimer.current);
          longPressTimer.current = null;
      }
      setGearTooltip(null);
  };

  const handleInventoryItemClick = (gear: Gear) => {
      if (isLongPress.current) return; // Ignore click if we held it

      // If a slot is active, try to equip
      if (activeSlotIndex !== null) {
          const targetSlotSize = TOWER_DEFS[selectedGearTower].slots[activeSlotIndex];
          
          // Size Check
          if (gear.size === targetSlotSize) {
              // Restriction Check
              if (gear.restrictedTo && gear.restrictedTo !== selectedGearTower) {
                  // Cannot equip due to restriction
                  return; 
              }
              
              // UNIQUE LEGENDARY CHECK
              if (gear.legendaryEffect) {
                  const currentLoadout = towerLoadouts[selectedGearTower];
                  const hasConflict = currentLoadout.some((g, idx) => 
                      idx !== activeSlotIndex && g?.legendaryEffect === gear.legendaryEffect
                  );
                  
                  if (hasConflict) {
                      // Cannot equip due to unique constraint
                      return;
                  }
              }

              handleEquipGear(gear, activeSlotIndex);
          }
      } else {
          // Otherwise just inspect
          setInspectedGear(gear);
      }
  };

  const handleEquipGear = (gear: Gear, slotIndex: number) => {
      const currentLoadout = [...towerLoadouts[selectedGearTower]];
      
      // Check if there is already a gear in this slot
      const existingGear = currentLoadout[slotIndex];
      const newInventory = [...gearInventory];
      
      // Remove the gear we are equipping from inventory
      const gearIndex = newInventory.findIndex(g => g.id === gear.id);
      if (gearIndex !== -1) {
          newInventory.splice(gearIndex, 1);
      }

      // If there was a gear in the slot, return it to inventory
      if (existingGear) {
          newInventory.push(existingGear);
      }

      // Update loadout
      currentLoadout[slotIndex] = gear;

      setGearInventory(newInventory);
      setTowerLoadouts({
          ...towerLoadouts,
          [selectedGearTower]: currentLoadout
      });
      setActiveSlotIndex(null); // Deselect after equip
      setInspectedGear(null);
  };

  const handleSlotClick = (slotIndex: number) => {
      if (isLongPress.current) return; // Ignore click if held

      const currentLoadout = [...towerLoadouts[selectedGearTower]];
      const existingGear = currentLoadout[slotIndex];
      const targetSlotSize = TOWER_DEFS[selectedGearTower].slots[slotIndex];

      // Logic: If an inventory item is selected (inspected), try to equip it to this slot.
      // We need to verify `inspectedGear` is from inventory.
      const isInventoryItem = inspectedGear && gearInventory.some(g => g.id === inspectedGear.id);

      if (isInventoryItem && activeSlotIndex === null) {
          // Validate size
          if (inspectedGear.size === targetSlotSize) {
               // Validate restriction
               if (!inspectedGear.restrictedTo || inspectedGear.restrictedTo === selectedGearTower) {
                   // Validate unique legendary
                   if (inspectedGear.legendaryEffect) {
                       const conflict = currentLoadout.some((g, i) => i !== slotIndex && g?.legendaryEffect === inspectedGear.legendaryEffect);
                       if (conflict) {
                           return; // Conflict
                       }
                   }
                   handleEquipGear(inspectedGear, slotIndex);
                   return;
               }
          }
      }

      if (activeSlotIndex === slotIndex) {
          // Deselect if already selected
          setActiveSlotIndex(null);
          // If it had a gear, inspect it
          if (existingGear) setInspectedGear(existingGear);
          else setInspectedGear(null);
          return;
      }

      setActiveSlotIndex(slotIndex);
      // If there's a gear, set it as inspected too so we see stats
      if (existingGear) {
          setInspectedGear(existingGear);
      } else {
          setInspectedGear(null);
      }
  };

  const handleUnequipCurrentSlot = () => {
      if (activeSlotIndex === null) return;
      const currentLoadout = [...towerLoadouts[selectedGearTower]];
      const gear = currentLoadout[activeSlotIndex];
      
      if (gear) {
          currentLoadout[activeSlotIndex] = null;
          setGearInventory([...gearInventory, gear]);
          setTowerLoadouts({
              ...towerLoadouts,
              [selectedGearTower]: currentLoadout
          });
          setInspectedGear(null);
      }
  };

  // --- TOWER TOOLTIP LOGIC (IN-GAME) ---
  const handleTowerBtnDown = (e: React.PointerEvent, def: TowerConfig) => {
      isLongPress.current = false;
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top; 

      longPressTimer.current = window.setTimeout(() => {
          isLongPress.current = true;
          setTowerTooltip({ def, x: centerX, y: centerY });
      }, 300); // 300ms hold threshold
  };

  const handleTowerBtnUp = () => {
      if (longPressTimer.current) {
          clearTimeout(longPressTimer.current);
          longPressTimer.current = null;
      }
      setTowerTooltip(null);
  };

  // --- RENDERERS ---

  const renderSettingsModal = () => (
    <div className="absolute inset-0 z-[60] bg-black/80 flex items-center justify-center backdrop-blur-sm p-4" 
         onPointerDown={(e) => e.stopPropagation()}>
        <div className="bg-retro-dark border-4 border-black w-full max-w-sm shadow-retro relative pixel-panel flex flex-col max-h-[85vh]">
            {/* Header Section: Rigid */}
            <div className="p-6 pb-2 shrink-0">
                <button 
                    onClick={() => setShowSettingsModal(false)}
                    className="absolute top-2 right-2 w-8 h-8 bg-retro-red pixel-btn flex items-center justify-center text-white z-10"
                >
                    <X size={16} />
                </button>
                <h2 className="text-xl text-white border-b-4 border-black pb-2 flex items-center gap-2">
                    <PixelGear size={20} /> SETTINGS
                </h2>
            </div>
            
            {/* Content Section: Scrollable */}
            <div className="p-6 pt-2 overflow-y-auto space-y-4 overscroll-contain">
                {/* Auto Start Wave Settings */}
                <div className="bg-black/20 p-3 border-2 border-black pixel-inset space-y-3 animate-in fade-in slide-in-from-top-2 mb-4">
                     <div className="flex items-center justify-between border-b border-white/10 pb-1 mb-1">
                         <div className="flex items-center gap-2 text-[10px] text-retro-yellow font-bold">
                             <Clock size={12} />
                             <span>AUTO START WAVE</span>
                         </div>
                         <button 
                            onClick={toggleAutoStart}
                            className={`w-10 h-5 border border-black flex items-center px-0.5 transition-colors ${settings.autoStart ? 'bg-retro-green' : 'bg-retro-red'}`}
                         >
                            <div className={`w-3.5 h-3.5 bg-white border border-black shadow-sm transition-transform ${settings.autoStart ? 'translate-x-5' : 'translate-x-0'}`} />
                         </button>
                     </div>
                     
                     {settings.autoStart && (
                         <div className="space-y-2">
                             <div className="text-[8px] text-gray-400">DELAY BEFORE START: <span className="text-white font-bold">{settings.autoStartDelay}s</span></div>
                             <div className="grid grid-cols-4 gap-1">
                                 {[1, 3, 5, 10].map(val => (
                                     <button
                                         key={val}
                                         onClick={() => setAutoStartDelay(val)}
                                         className={`py-1 text-[8px] font-bold border border-black transition-colors ${settings.autoStartDelay === val ? 'bg-retro-yellow text-black' : 'bg-[#333] text-gray-400 hover:bg-[#444]'}`}
                                     >
                                         {val}s
                                     </button>
                                 ))}
                             </div>
                             <div className="flex items-center gap-2">
                                 <span className="text-[8px] text-gray-500 whitespace-nowrap">CUSTOM:</span>
                                 <input 
                                     type="number" 
                                     min="10"
                                     value={settings.autoStartDelay}
                                     onChange={(e) => {
                                         const val = parseInt(e.target.value);
                                         // Allow typing, but validation logic technically applies. 
                                         // Since button overrides, we just set whatever they type if valid.
                                         if (!isNaN(val)) setAutoStartDelay(val);
                                     }}
                                     className="w-full bg-black border border-[#555] text-[10px] p-1 text-white font-mono text-center"
                                     placeholder="Min 10s"
                                 />
                             </div>
                             {settings.autoStartDelay < 10 && ![1, 3, 5].includes(settings.autoStartDelay) && (
                                 <div className="text-[8px] text-red-500 text-center animate-pulse">CUSTOM DELAY MUST BE ≥ 10s</div>
                             )}
                         </div>
                     )}
                </div>

                {/* PeterShader Toggle */}
                <div className="flex items-center justify-between bg-black/20 p-3 border-2 border-black pixel-inset">
                    <div className="flex items-center gap-2">
                        <Monitor size={16} className="text-retro-cyan" />
                        <div className="flex flex-col">
                            <span className="text-xs text-white font-bold">PeterShader</span>
                            <span className="text-[8px] text-retro-gray">v1.3 RTX</span>
                        </div>
                    </div>
                    <button 
                        onClick={() => toggleShader('PETER')}
                        className={`w-14 h-6 border-2 border-black flex items-center px-1 transition-colors ${settings.activeShader === 'PETER' ? 'bg-retro-green' : 'bg-retro-red'}`}
                    >
                        <div className={`w-4 h-4 bg-white border border-black shadow-sm transition-transform ${settings.activeShader === 'PETER' ? 'translate-x-7' : 'translate-x-0'}`} />
                    </button>
                </div>

                {/* PlasticShader Toggle */}
                <div className="flex items-center justify-between bg-black/20 p-3 border-2 border-black pixel-inset">
                    <div className="flex items-center gap-2">
                        <Droplets size={16} className="text-pink-400" />
                        <div className="flex flex-col">
                            <span className="text-xs text-white font-bold">PlasticShader</span>
                            <span className="text-[8px] text-retro-gray">High Gloss & Vibrant</span>
                        </div>
                    </div>
                    <button 
                        onClick={() => toggleShader('PLASTIC')}
                        className={`w-14 h-6 border-2 border-black flex items-center px-1 transition-colors ${settings.activeShader === 'PLASTIC' ? 'bg-retro-green' : 'bg-retro-red'}`}
                    >
                        <div className={`w-4 h-4 bg-white border border-black shadow-sm transition-transform ${settings.activeShader === 'PLASTIC' ? 'translate-x-7' : 'translate-x-0'}`} />
                    </button>
                </div>
                
                {/* Advanced Shader Controls (Only if any shader active) */}
                {settings.activeShader !== 'NONE' && (
                    <div className="bg-black/20 p-3 border-2 border-black pixel-inset space-y-3 animate-in fade-in slide-in-from-top-2">
                         <div className="flex items-center gap-2 text-[10px] text-retro-cyan border-b border-white/10 pb-1 mb-1 font-bold">
                             <Sliders size={10} />
                             <span>SHADER CONFIG</span>
                         </div>
                         
                         {/* Disable Day/Night Toggle */}
                         <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                {settings.disableDayNight ? <Sun size={12} className="text-retro-orange" /> : <Moon size={12} className="text-gray-400" />}
                                <div className="flex flex-col">
                                    <span className="text-[8px] text-white font-bold">DISABLE CYCLE</span>
                                </div>
                            </div>
                            <button 
                                onClick={() => {
                                     const newSettings = { ...settings, disableDayNight: !settings.disableDayNight };
                                     setSettings(newSettings);
                                     localStorage.setItem('pixel_defense_settings_v1', JSON.stringify(newSettings));
                                }}
                                className={`w-8 h-4 border border-black flex items-center px-0.5 transition-colors ${settings.disableDayNight ? 'bg-retro-green' : 'bg-retro-red'}`}
                            >
                                <div className={`w-2.5 h-2.5 bg-white border border-black shadow-sm transition-transform ${settings.disableDayNight ? 'translate-x-4' : 'translate-x-0'}`} />
                            </button>
                         </div>

                         {/* Shadow Intensity */}
                         <div className="space-y-1">
                             <div className="flex justify-between text-[8px] text-gray-400">
                                 <span>SHADOW INTENSITY</span>
                                 <span>{Math.round(settings.shadowIntensity * 100)}%</span>
                             </div>
                             <input 
                                 type="range" min="0" max="1" step="0.1"
                                 value={settings.shadowIntensity}
                                 onChange={(e) => updateShaderSetting('shadowIntensity', parseFloat(e.target.value))}
                                 className="w-full h-2 bg-black rounded-lg appearance-none cursor-pointer accent-retro-cyan"
                             />
                         </div>

                         {/* Light Power */}
                         <div className="space-y-1">
                             <div className="flex justify-between text-[8px] text-gray-400">
                                 <span>LIGHT POWER</span>
                                 <span>{settings.lightPower.toFixed(1)}x</span>
                             </div>
                             <input 
                                 type="range" min="0.5" max="2" step="0.1"
                                 value={settings.lightPower}
                                 onChange={(e) => updateShaderSetting('lightPower', parseFloat(e.target.value))}
                                 className="w-full h-2 bg-black rounded-lg appearance-none cursor-pointer accent-retro-yellow"
                             />
                         </div>

                         {/* Bloom Strength */}
                         <div className="space-y-1">
                             <div className="flex justify-between text-[8px] text-gray-400">
                                 <span>BLOOM STRENGTH</span>
                                 <span>{Math.round(settings.bloomStrength * 100)}%</span>
                             </div>
                             <input 
                                 type="range" min="0" max="1" step="0.1"
                                 value={settings.bloomStrength}
                                 onChange={(e) => updateShaderSetting('bloomStrength', parseFloat(e.target.value))}
                                 className="w-full h-2 bg-black rounded-lg appearance-none cursor-pointer accent-retro-purple"
                             />
                         </div>
                    </div>
                )}
                
                {/* Skip Animation Toggle */}
                <div className="flex items-center justify-between bg-black/20 p-3 border-2 border-black pixel-inset">
                    <div className="flex items-center gap-2">
                        {settings.skipCrateAnimation ? <EyeOff size={16} className="text-gray-400" /> : <Eye size={16} className="text-retro-yellow" />}
                        <div className="flex flex-col">
                            <span className="text-xs text-white font-bold">SKIP ANIMATIONS</span>
                            <span className="text-[8px] text-retro-gray">For faster loot</span>
                        </div>
                    </div>
                    <button 
                        onClick={toggleCrateAnimation}
                        className={`w-14 h-6 border-2 border-black flex items-center px-1 transition-colors ${settings.skipCrateAnimation ? 'bg-retro-green' : 'bg-retro-red'}`}
                    >
                        <div className={`w-4 h-4 bg-white border border-black shadow-sm transition-transform ${settings.skipCrateAnimation ? 'translate-x-7' : 'translate-x-0'}`} />
                    </button>
                </div>

                {/* CHEAT CODE BOX */}
                <div className="bg-black/20 p-3 border-2 border-black pixel-inset space-y-2">
                     <div className="flex items-center gap-2 text-xs text-retro-yellow mb-1 font-bold">
                        <Terminal size={14} />
                        <span>CODE BOX</span>
                     </div>
                     <div className="flex gap-2">
                        <input 
                            type="text" 
                            value={code}
                            onChange={(e) => setCode(e.target.value)}
                            placeholder="ENTER CODE..."
                            className="flex-1 bg-black border-2 border-[#555] text-[10px] p-2 text-green-400 placeholder-green-800 outline-none focus:border-green-500 font-mono"
                        />
                        <button 
                            onClick={handleRedeemCode}
                            className="bg-retro-gray text-black text-[10px] px-3 font-bold pixel-btn active:pixel-btn-active"
                        >
                            ENTER
                        </button>
                     </div>
                     {codeMessage && (
                        <div className="text-[8px] text-center text-retro-green animate-pulse font-bold bg-black/50 p-1">
                            {'>'} {codeMessage}
                        </div>
                     )}
                </div>

                {/* RESET DATA BUTTON */}
                <div className="pt-2">
                   <button 
                       onClick={handleResetData}
                       className={`w-full py-2 border-2 text-[10px] font-bold transition-all pixel-btn ${
                          resetConfirm 
                            ? 'bg-retro-red text-white animate-pulse border-red-900' 
                            : 'bg-black text-retro-red border-retro-red hover:bg-red-900'
                       }`}
                   >
                       {resetConfirm ? "CONFIRM WIPE?" : "RESET SAVE DATA"}
                   </button>
                </div>
                
                <div className="text-center text-[8px] text-retro-gray bg-black/20 py-1 border border-black/10">
                    VERSION 1.4.0 • GRIDXEL ENGINE
                </div>
            </div>
        </div>
    </div>
  );

  const renderGearSmith = () => (
    <div className="fixed inset-0 z-50 bg-[#121215] flex flex-col font-pixel text-white animate-in slide-in-from-bottom duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-3 md:p-4 bg-retro-dark border-b-4 border-black shadow-lg z-10 shrink-0">
             <div className="flex items-center gap-3">
                 <div className="w-8 h-8 md:w-10 md:h-10 bg-retro-orange border-2 border-black flex items-center justify-center">
                    <PixelWrench size={16} className="text-black md:w-5 md:h-5" />
                 </div>
                 <div>
                    <h1 className="text-sm md:text-lg text-retro-yellow tracking-widest leading-none">GEARSMITH</h1>
                    <span className="text-[8px] md:text-[10px] text-gray-400">MODIFY TOWER LOADOUTS</span>
                 </div>
             </div>
             <button onClick={() => setShowGearSmith(false)} className="bg-retro-red text-white w-8 h-8 md:w-10 md:h-10 flex items-center justify-center border-2 border-black hover:bg-white hover:text-red-500 pixel-btn"><X size={16} className="md:w-5 md:h-5"/></button>
        </div>

        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
            {/* Left: Tower Selection & Slots */}
            <div className="w-full md:w-80 bg-[#1a1a1a] border-b-4 md:border-b-0 md:border-r-4 border-black p-3 md:p-4 flex flex-col gap-4 overflow-y-auto shrink-0 max-h-[45vh] md:max-h-full">
                {/* Tower Selector */}
                <div className="grid grid-cols-4 md:grid-cols-2 gap-2 shrink-0">
                    {Object.values(TOWER_DEFS).map(def => (
                        <button
                            key={def.id}
                            onClick={() => { setSelectedGearTower(def.id); setActiveSlotIndex(null); setInspectedGear(null); }}
                            className={`p-2 border-2 flex flex-col items-center gap-1 transition-all pixel-btn
                                ${selectedGearTower === def.id 
                                    ? 'bg-retro-orange border-black text-black scale-95 md:scale-105 shadow-retro-sm' 
                                    : 'bg-[#333] border-black text-gray-400 hover:bg-[#444]'
                                }
                            `}
                        >
                            <div className={`w-3 h-3 md:w-4 md:h-4 ${def.color} border border-black`} />
                            <span className="text-[6px] md:text-[8px] font-bold">{def.name}</span>
                        </button>
                    ))}
                </div>

                {/* Active Tower Slots (The "Puzzle" Board) */}
                <div className="flex-1 bg-black/40 p-4 rounded border-2 border-black/50 pixel-inset relative overflow-hidden flex flex-col items-center justify-center min-h-[200px]">
                    {/* Blueprint Background Grid */}
                    <div className="absolute inset-0 opacity-10 pointer-events-none" 
                         style={{ backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '20px 20px' }} 
                    />
                    
                    <div className="relative z-10 flex items-center justify-center gap-4 md:gap-8">
                        {TOWER_DEFS[selectedGearTower].slots.map((size, idx) => {
                            const equipped = towerLoadouts[selectedGearTower][idx];
                            const isActive = activeSlotIndex === idx;
                            
                            // Visual sizing based on GearSize
                            let sizeClass = "w-12 h-12";
                            if (size === GearSize.MEDIUM) sizeClass = "w-16 h-16";
                            if (size === GearSize.LARGE) sizeClass = "w-20 h-20";

                            // Visual compatibility check for potential placement
                            const isInventoryItem = inspectedGear && gearInventory.some(g => g.id === inspectedGear.id);
                            const isCompatible = isInventoryItem && !activeSlotIndex && inspectedGear.size === size && (!inspectedGear.restrictedTo || inspectedGear.restrictedTo === selectedGearTower);

                            return (
                                <div key={idx} className="flex flex-col items-center gap-2">
                                    <button
                                        onPointerDown={(e) => handleSocketPointerDown(e, equipped)}
                                        onPointerUp={handleGearPointerUp}
                                        onPointerLeave={handleGearPointerUp}
                                        onClick={() => handleSlotClick(idx)}
                                        className={`
                                            ${sizeClass} rounded-full border-4 flex items-center justify-center relative transition-all
                                            ${isActive 
                                                ? 'border-retro-yellow bg-retro-yellow/20 shadow-[0_0_15px_rgba(255,205,117,0.5)] scale-110' 
                                                : (isCompatible 
                                                    ? 'border-green-500 bg-green-900/30 animate-pulse hover:bg-green-800/50 hover:border-green-400' 
                                                    : 'border-[#444] bg-black/60 hover:border-gray-500')
                                            }
                                        `}
                                    >
                                        {/* Connecting Line (Cosmetic) */}
                                        {idx < TOWER_DEFS[selectedGearTower].slots.length - 1 && (
                                            <div className="absolute left-full top-1/2 -translate-y-1/2 w-4 md:w-8 h-1 bg-[#333] -z-10" />
                                        )}

                                        {equipped ? (
                                            <GearDisplay gear={equipped} size={size === 'LARGE' ? 48 : (size === 'MEDIUM' ? 32 : 24)} showEffects={true} />
                                        ) : (
                                            <div className="opacity-30 text-[8px] text-gray-500 font-bold">{size[0]}</div>
                                        )}
                                        
                                        {/* Empty Socket Indicator */}
                                        {!equipped && (
                                            <div className="absolute inset-0 rounded-full border-2 border-dashed border-white/20 animate-spin-slow" />
                                        )}
                                    </button>
                                    
                                    {/* Slot Label/Unequip */}
                                    <div className="text-center">
                                        <div className="text-[6px] text-gray-500 font-bold mb-1">SLOT {idx + 1}</div>
                                        {isActive && equipped && (
                                             <button 
                                                onClick={(e) => { e.stopPropagation(); handleUnequipCurrentSlot(); }}
                                                className="text-[6px] bg-retro-red text-white px-2 py-1 rounded border border-black hover:bg-red-600"
                                             >
                                                 REMOVE
                                             </button>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                    
                    <div className="absolute bottom-2 left-2 text-[8px] text-retro-gray font-mono">
                        CONFIGURING: <span className="text-white font-bold">{TOWER_DEFS[selectedGearTower].name}</span>
                    </div>
                </div>
            </div>

            {/* Right: Inventory */}
            <div className="flex-1 bg-[#222] flex flex-col min-h-0 relative">
                {/* Inventory Filter/Sort Bar */}
                <div className="h-10 bg-[#2a2a2a] border-b-2 border-black flex items-center px-3 gap-3 overflow-x-auto no-scrollbar shrink-0">
                    <span className="text-[8px] text-gray-400 font-bold shrink-0">SORT:</span>
                    {['RARITY', 'NEWEST', 'DMG', 'SPD', 'RNG', '$$$'].map(modeKey => {
                        // Map short labels to logic keys
                        const mapKey: any = {
                            'DMG': 'DAMAGE', 'SPD': 'ATK_SPEED', 'RNG': 'RANGE', '$$$': 'INCOME'
                        };
                        const logicKey = mapKey[modeKey] || modeKey;
                        return (
                            <button
                                key={modeKey}
                                onClick={() => setGearSortMode(logicKey)}
                                className={`text-[8px] px-2 py-1 rounded border border-black transition-colors whitespace-nowrap ${gearSortMode === logicKey ? 'bg-retro-green text-black' : 'bg-black text-gray-500'}`}
                            >
                                {modeKey}
                            </button>
                        )
                    })}
                </div>

                <div className="flex-1 p-3 overflow-y-auto pb-32 md:pb-36">
                    {activeSlotIndex !== null && (
                        <div className="mb-3 bg-retro-blue/20 border border-retro-blue p-2 text-[8px] md:text-[10px] text-retro-cyan text-center animate-pulse">
                            SELECT ITEM FOR SLOT {activeSlotIndex + 1} ({TOWER_DEFS[selectedGearTower].slots[activeSlotIndex]})
                        </div>
                    )}
                
                    <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-5 lg:grid-cols-6 gap-2 md:gap-3">
                        {gearInventory
                            .sort((a, b) => {
                                if (gearSortMode === 'RARITY') {
                                    const rOrder = { 'LEGENDARY': 5, 'EPIC': 4, 'RARE': 3, 'UNCOMMON': 2, 'COMMON': 1, 'BASIC': 0 };
                                    return rOrder[b.rarity] - rOrder[a.rarity];
                                }
                                if (gearSortMode === 'NEWEST') return parseInt(b.id.split('_')[1]) - parseInt(a.id.split('_')[1]);
                                // Stat sort
                                const getStat = (g: Gear, type: string) => g.stats.find(s => s.type === type)?.value || 0;
                                const mapType = { 'ATK_SPEED': 'ATTACK_SPEED' };
                                const key = mapType[gearSortMode as any] || gearSortMode;
                                return getStat(b, key) - getStat(a, key);
                            })
                            .map(gear => {
                                const isCompatible = activeSlotIndex !== null 
                                    ? gear.size === TOWER_DEFS[selectedGearTower].slots[activeSlotIndex]
                                    : true;
                                const isRestricted = gear.restrictedTo && gear.restrictedTo !== selectedGearTower;
                                const isDimmed = (activeSlotIndex !== null && !isCompatible) || (activeSlotIndex !== null && isRestricted);

                                return (
                                    <button
                                        key={gear.id}
                                        onPointerDown={(e) => handleGearPointerDown(e, gear)}
                                        onPointerUp={handleGearPointerUp}
                                        onPointerLeave={handleGearPointerUp}
                                        onClick={() => handleInventoryItemClick(gear)}
                                        className={`
                                            aspect-square bg-black border-2 relative group transition-transform active:scale-95
                                            ${inspectedGear?.id === gear.id ? 'border-white shadow-[0_0_10px_white]' : 'border-[#444]'}
                                            ${isDimmed ? 'opacity-20 grayscale' : 'opacity-100 hover:border-gray-400'}
                                        `}
                                    >
                                        {/* Rarity BG glow */}
                                        <div className={`absolute inset-0 opacity-10 ${gear.color.replace('text-', 'bg-')}`} />
                                        
                                        <div className="absolute top-0.5 left-0.5 text-[5px] text-gray-500">{gear.size[0]}</div>
                                        {gear.restrictedTo && (
                                            <div className="absolute top-0.5 right-0.5 w-1.5 h-1.5 rounded-full border border-black" 
                                                 style={{ backgroundColor: TOWER_DEFS[gear.restrictedTo].color.replace('bg-', '') }}
                                            />
                                        )}
                                        
                                        <div className="w-full h-full flex items-center justify-center p-1.5">
                                            <GearDisplay gear={gear} size={20} showEffects={true} />
                                        </div>

                                        {gear.legendaryEffect && (
                                            <div className="absolute bottom-0.5 right-0.5 text-retro-orange animate-pulse">
                                                <Star size={6} fill="currentColor" />
                                            </div>
                                        )}
                                    </button>
                                );
                            })}
                        {gearInventory.length === 0 && (
                            <div className="col-span-full text-center text-gray-500 py-10 text-[10px]">
                                INVENTORY EMPTY.
                            </div>
                        )}
                    </div>
                </div>

                {/* Inspection Panel (Bottom Overlay) */}
                {inspectedGear && (
                    <div className="absolute bottom-0 left-0 right-0 max-h-[40%] bg-[#151515] border-t-4 border-black p-3 flex gap-3 animate-in slide-in-from-bottom duration-200 shadow-[0_-4px_10px_rgba(0,0,0,0.5)] z-20 overflow-hidden">
                         <div className="w-20 md:w-24 h-full bg-black border-2 border-[#333] flex items-center justify-center relative shrink-0">
                             <GearDisplay gear={inspectedGear} size={40} showEffects={true} />
                             <div className={`absolute bottom-0 w-full text-center text-[6px] md:text-[8px] bg-black/80 text-white py-0.5 font-bold ${getRarityColor(inspectedGear.rarity)}`}>
                                 {inspectedGear.rarity}
                             </div>
                         </div>
                         <div className="flex-1 flex flex-col overflow-y-auto">
                             <div className="flex flex-wrap items-center gap-2 mb-1">
                                 <h3 className="text-xs md:text-sm font-bold text-white">{inspectedGear.name}</h3>
                                 <span className="text-[6px] md:text-[8px] bg-[#333] px-1 rounded text-gray-400">{inspectedGear.size}</span>
                                 {inspectedGear.restrictedTo && (
                                     <span className="text-[6px] md:text-[8px] bg-retro-red/20 text-retro-red px-1 rounded border border-retro-red/50 whitespace-nowrap">
                                         {TOWER_DEFS[inspectedGear.restrictedTo].name} ONLY
                                     </span>
                                 )}
                             </div>
                             
                             <div className="grid grid-cols-2 gap-x-4 gap-y-1 mt-1">
                                 {inspectedGear.stats.map((s, i) => (
                                     <div key={i} className="flex justify-between text-[8px] md:text-[10px] border-b border-[#333] pb-0.5">
                                         <span className="text-gray-400">{s.type.replace('_', ' ').substring(0, 8)}</span>
                                         <span className={`font-bold font-mono ${s.value > 0 ? "text-green-400" : "text-red-400"}`}>
                                             {s.value > 0 ? '+' : ''}{s.value}
                                         </span>
                                     </div>
                                 ))}
                                 {inspectedGear.stats.length === 0 && <span className="text-[8px] text-gray-600 italic">Cosmetic/Junk</span>}
                             </div>

                             {inspectedGear.legendaryEffect && (
                                 <div className="mt-2 text-[8px] md:text-[10px] text-retro-orange flex items-center gap-1 font-bold">
                                     <Star size={8} fill="currentColor" />
                                     <span>{inspectedGear.legendaryEffect}</span>
                                 </div>
                             )}
                         </div>
                    </div>
                )}
            </div>
        </div>
        
        {/* GLOBAL TOOLTIP FOR LONG PRESS (Re-used for Gears & Sockets) */}
        {gearTooltip && (
            <div 
              className="fixed z-[90] bg-black/95 border-2 border-white p-3 pointer-events-none mb-4 animate-in fade-in zoom-in-95 duration-100 min-w-[140px] shadow-[0_0_20px_rgba(0,0,0,0.8)] transform -translate-x-1/2 -translate-y-full"
              style={{ left: gearTooltip.x, top: gearTooltip.y - 20 }}
            >
                <div className={`text-xs font-bold mb-2 pb-1 border-b border-white/20 ${gearTooltip.gear.color}`}>
                    {gearTooltip.gear.name}
                </div>
                <div className="space-y-1">
                    {gearTooltip.gear.stats.map((s, i) => (
                        <div key={i} className="flex justify-between text-[10px]">
                            <span className="text-gray-400">{s.type.substring(0,3)}</span>
                            <span className={s.value > 0 ? "text-green-400" : "text-red-400"}>{s.value > 0 ? '+' : ''}{s.value}</span>
                        </div>
                    ))}
                    {gearTooltip.gear.legendaryEffect && (
                        <div className="text-[8px] text-retro-orange mt-2 italic border-t border-white/10 pt-1">
                            {gearTooltip.gear.legendaryEffect}
                        </div>
                    )}
                </div>
            </div>
        )}
    </div>
  );

  const renderRetreatModal = () => (
    <div className="absolute inset-0 z-[80] bg-black/80 flex items-center justify-center backdrop-blur-sm p-4"
         onPointerDown={(e) => e.stopPropagation()}>
        <div className="bg-retro-dark border-4 border-black p-6 w-full max-w-sm shadow-retro relative text-center pixel-panel">
            <h2 className="text-xl text-retro-red mb-4 border-b-4 border-black pb-2 flex items-center justify-center gap-2">
                <AlertTriangle size={24} /> ABORT MISSION?
            </h2>
            <p className="text-xs text-white mb-6 leading-relaxed">
                Leaving now will forfeit all progress in this session. <br/>
                <span className="text-gray-400">Current Wave: {gameState?.wave}</span>
            </p>
            <div className="flex gap-4">
                <button 
                    onClick={() => setShowRetreatModal(false)}
                    className="flex-1 py-3 bg-retro-gray text-black font-bold pixel-btn hover:bg-white"
                >
                    CANCEL
                </button>
                <button 
                    onClick={performRetreat}
                    className="flex-1 py-3 bg-retro-red text-white font-bold pixel-btn hover:bg-red-600"
                >
                    RETREAT
                </button>
            </div>
        </div>
    </div>
  );

  const renderShop = () => (
    <div className="absolute inset-0 z-[70] bg-black/90 flex items-center justify-center p-4 backdrop-blur-sm"
         onPointerDown={(e) => e.stopPropagation()}>
        <div className="bg-retro-dark border-4 border-black p-6 w-full max-w-sm shadow-retro relative pixel-panel">
            <button 
                onClick={() => setShowShop(false)}
                className="absolute top-2 right-2 text-retro-red hover:text-white"
            >
                <X size={24} />
            </button>
            
            <h2 className="text-xl text-retro-green mb-6 border-b-4 border-black pb-2 flex items-center gap-2">
                <ShoppingBag size={20} /> SUPPLY DEPOT
            </h2>
            
            <div className="bg-black/30 p-3 mb-4 flex items-center justify-between border-2 border-black/50 pixel-inset">
                <span className="text-xs text-gray-400">BALANCE</span>
                <div className="flex items-center gap-2 text-retro-green font-bold">
                    <div className="w-3 h-3 bg-retro-green rounded-sm animate-pulse" />
                    {cubes.toLocaleString()} CUBES
                </div>
            </div>

            <div className="space-y-3">
                {/* Buy Ticket */}
                <button 
                    onClick={purchaseTicket}
                    disabled={cubes < 10}
                    className={`w-full p-3 border-2 border-black flex items-center justify-between pixel-btn group ${cubes < 10 ? 'bg-gray-800 opacity-50' : 'bg-[#2a2a2a] hover:bg-[#333]'}`}
                >
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-retro-yellow flex items-center justify-center border border-black">
                            <Ticket size={20} className="text-black" />
                        </div>
                        <div className="text-left">
                            <div className="text-xs font-bold text-white">SKIP TICKET</div>
                            <div className="text-[8px] text-gray-400">Skip waves for buffs</div>
                        </div>
                    </div>
                    <div className="text-retro-green font-bold text-xs bg-black/50 px-2 py-1 rounded">
                        10 <span className="text-[8px]">CUBES</span>
                    </div>
                </button>

                {/* Buy Crate */}
                <button 
                    onClick={purchaseCrate}
                    disabled={cubes < 50}
                    className={`w-full p-3 border-2 border-black flex items-center justify-between pixel-btn group ${cubes < 50 ? 'bg-gray-800 opacity-50' : 'bg-[#2a2a2a] hover:bg-[#333]'}`}
                >
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-retro-orange flex items-center justify-center border border-black">
                            <Package size={20} className="text-black" />
                        </div>
                        <div className="text-left">
                            <div className="text-xs font-bold text-white">GEAR CRATE</div>
                            <div className="text-[8px] text-gray-400">Random Equipment</div>
                        </div>
                    </div>
                    <div className="text-retro-green font-bold text-xs bg-black/50 px-2 py-1 rounded">
                        50 <span className="text-[8px]">CUBES</span>
                    </div>
                </button>
            </div>
        </div>
    </div>
  );

  const renderCrateOpening = () => {
      if (crateState === 'IDLE') return null;

      return (
        <div className="absolute inset-0 z-[80] bg-black/95 flex flex-col items-center justify-center p-4"
             onPointerDown={(e) => e.stopPropagation()}>
            
            {crateState === 'OPENING' && (
                <div className="flex flex-col items-center gap-4">
                    <div className="relative w-32 h-32">
                         <div className="absolute inset-0 bg-retro-orange animate-ping opacity-20 rounded-full" />
                         <div className="relative z-10 w-full h-full bg-retro-dark border-4 border-black flex items-center justify-center pixel-panel animate-bounce">
                             <Package size={64} className="text-retro-orange" />
                         </div>
                    </div>
                    <div className="text-retro-yellow font-bold text-lg animate-pulse tracking-widest">
                        DECRYPTING SUPPLY DROP...
                    </div>
                </div>
            )}

            {crateState === 'REVEALED' && rewardGear && (
                <div className="flex flex-col items-center gap-6 animate-in zoom-in duration-300">
                    <div className="text-white text-sm tracking-widest uppercase">ACQUIRED NEW GEAR</div>
                    
                    <div className={`relative w-48 h-48 bg-[#1a1a1a] border-4 ${rewardGear.rarity === 'LEGENDARY' ? 'border-retro-orange shadow-[0_0_30px_orange]' : 'border-white'} pixel-panel flex items-center justify-center group`}>
                         <div className={`absolute inset-0 opacity-20 ${rewardGear.color.replace('text-', 'bg-')}`} />
                         <div className="relative z-10 transform group-hover:scale-110 transition-transform duration-300">
                            <GearDisplay gear={rewardGear} size={96} showEffects={true} />
                         </div>
                         <div className={`absolute top-2 right-2 px-2 py-0.5 text-[10px] font-bold bg-black text-white border border-white/20`}>
                            {rewardGear.size}
                         </div>
                    </div>

                    <div className="text-center space-y-1">
                        <h2 className={`text-2xl font-bold ${rewardGear.color}`}>{rewardGear.name}</h2>
                        <div className={`text-xs font-bold px-3 py-1 bg-black/50 inline-block border border-white/10 ${getRarityColor(rewardGear.rarity)}`}>
                            {rewardGear.rarity}
                        </div>
                    </div>

                    <div className="bg-black/40 p-4 border-2 border-white/10 w-full max-w-xs space-y-2">
                        {rewardGear.stats.map((s, i) => (
                            <div key={i} className="flex justify-between text-xs border-b border-white/5 pb-1 last:border-0">
                                <span className="text-gray-400">{s.type.replace('_', ' ')}</span>
                                <span className={s.value > 0 ? "text-green-400" : "text-red-400"}>
                                    {s.value > 0 ? '+' : ''}{s.value}
                                </span>
                            </div>
                        ))}
                        {rewardGear.legendaryEffect && (
                            <div className="pt-2 mt-2 border-t border-white/10 text-center text-retro-orange font-bold text-xs flex items-center justify-center gap-2">
                                <Star size={12} fill="currentColor" /> {rewardGear.legendaryEffect}
                            </div>
                        )}
                    </div>

                    <button 
                        onClick={() => {
                            setCrateState('IDLE');
                            setRewardGear(null);
                        }}
                        className="mt-4 px-8 py-3 bg-retro-green text-black font-bold text-sm pixel-btn hover:bg-white hover:scale-105 transition-all"
                    >
                        COLLECT
                    </button>
                </div>
            )}
        </div>
      );
  };

  // --- CAMPAIGN MAP RENDERER ---
  if (showMapSelect) {
    return (
      <div className="fixed inset-0 bg-retro-black overflow-hidden font-pixel">
        {/* Style injection for pixel-art buttons */}
        <style>{`
            .pixel-btn {
                box-shadow: inset 2px 2px 0px rgba(255,255,255,0.2), inset -2px -2px 0px rgba(0,0,0,0.4);
                border: 2px solid #000;
            }
            .pixel-btn {
                box-shadow: inset 2px 2px 0px rgba(255,255,255,0.2), inset -2px -2px 0px rgba(0,0,0,0.4);
                border: 2px solid #000;
            }
            .pixel-btn:active {
                box-shadow: inset 2px 2px 0px rgba(0,0,0,0.4), inset -2px -2px 0px rgba(255,255,255,0.1);
                transform: translateY(2px);
            }
            .pixel-panel {
                box-shadow: 4px 4px 0px rgba(0,0,0,0.5);
                border: 4px solid #000;
            }
            .pixel-inset {
                box-shadow: inset 2px 2px 4px rgba(0,0,0,0.5);
            }
            @keyframes tumble {
                0% { transform: rotate3d(1, 1, 1, 0deg); }
                50% { transform: rotate3d(1, 0, 1, 180deg); }
                100% { transform: rotate3d(1, 1, 1, 360deg); }
            }
            .animate-tumble {
                animation: tumble 8s linear infinite;
            }
        `}</style>
        
        {/* Floating UI */}
        <div className="absolute top-0 left-0 right-0 p-4 z-40 bg-gradient-to-b from-black/80 to-transparent pointer-events-none flex flex-col items-center">
          <h1 className="text-3xl text-retro-yellow drop-shadow-retro text-center">GRIDXEL TD</h1>
          <p className="text-[10px] text-white/70 text-center mt-2 animate-pulse bg-black/40 px-2 py-1 rounded">DRAG TO EXPLORE • SELECT A ZONE</p>
        </div>

        {/* CUBES CURRENCY DISPLAY (TOP LEFT) */}
        <div className="absolute top-24 left-4 z-50 flex items-center gap-3 bg-retro-dark border-2 border-black px-3 py-2 pixel-btn pointer-events-auto transition-transform hover:scale-105 select-none group">
            <div className="w-6 h-6" style={{ perspective: '300px' }}>
               <div className="w-full h-full relative animate-tumble" style={{ transformStyle: 'preserve-3d' }}>
                  {/* Front */}
                  <div className="absolute inset-0 border border-retro-green bg-retro-green/30" style={{ transform: 'translateZ(12px)' }} />
                  {/* Back */}
                  <div className="absolute inset-0 border border-retro-green bg-retro-green/30" style={{ transform: 'rotateY(180deg) translateZ(12px)' }} />
                  {/* Left */}
                  <div className="absolute inset-0 border border-retro-green bg-retro-green/30" style={{ transform: 'rotateY(-90deg) translateZ(12px)' }} />
                  {/* Right */}
                  <div className="absolute inset-0 border border-retro-green bg-retro-green/30" style={{ transform: 'rotateY(90deg) translateZ(12px)' }} />
                  {/* Top */}
                  <div className="absolute inset-0 border border-retro-green bg-retro-green/30" style={{ transform: 'rotateX(90deg) translateZ(12px)' }} />
                  {/* Bottom */}
                  <div className="absolute inset-0 border border-retro-green bg-retro-green/30" style={{ transform: 'rotateX(-90deg) translateZ(12px)' }} />
                  
                  {/* Core Glow */}
                  <div className="absolute top-1/2 left-1/2 w-2 h-2 bg-retro-green rounded-full shadow-[0_0_10px_#a7f070] -translate-x-1/2 -translate-y-1/2" />
               </div>
            </div>
            
            <div className="flex flex-col">
                <span className="text-[8px] text-retro-gray font-bold tracking-widest group-hover:text-white transition-colors">CUBES</span>
                <span className="text-sm text-retro-green font-bold leading-none drop-shadow-sm">{cubes.toLocaleString()}</span>
            </div>
        </div>

        {/* SHOP BUTTON */}
        <div className="absolute top-40 left-4 z-50 pointer-events-auto">
             <button 
                onClick={() => setShowShop(true)}
                className="w-12 h-12 bg-retro-green pixel-btn flex items-center justify-center hover:bg-white hover:text-green-600 transition-colors group"
             >
                 <ShoppingBag size={24} className="group-hover:-rotate-12 transition-transform" />
             </button>
        </div>

        {/* GEARSMITH BUTTON */}
        <div className="absolute top-40 right-4 z-50 pointer-events-auto">
            <button 
                onClick={() => setShowGearSmith(true)}
                className="w-12 h-12 bg-retro-orange pixel-btn flex items-center justify-center hover:bg-white hover:text-orange-500 transition-colors group"
            >
                <PixelWrench size={24} className="group-hover:rotate-12 transition-transform" />
            </button>
        </div>

        {/* Settings Button */}
        <div className="absolute top-24 right-4 z-50 pointer-events-auto">
            <button 
                onClick={() => setShowSettingsModal(true)}
                className="w-12 h-12 bg-retro-dark pixel-btn flex items-center justify-center hover:bg-white hover:text-black transition-colors"
            >
                <PixelGear size={24} />
            </button>
        </div>

        {/* Shop Modal */}
        {showShop && renderShop()}
        
        {/* Crate Cutscene */}
        {renderCrateOpening()}

        {/* GearSmith Modal (Overlay) */}
        {showGearSmith && renderGearSmith()}

        {/* Settings Modal */}
        {showSettingsModal && renderSettingsModal()}

        {/* Viewport for Large World */}
        <div 
          className="w-full h-full cursor-move touch-none"
          onPointerDown={(e) => handlePointerDown(e, 'MAP')}
          onPointerMove={(e) => handlePointerMove(e, 'MAP')}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
        >
          <div 
            className="absolute origin-top-left transition-transform duration-500 ease-out will-change-transform"
            style={{ 
              width: `${WORLD_SIZE.width}px`,
              height: `${WORLD_SIZE.height}px`,
              transform: `translate(${campaignOffset.x}px, ${campaignOffset.y}px)`,
              backgroundColor: '#1a1c2c' 
            }}
          >
            {/* 1. Base Grid Pattern */}
            <div className="absolute inset-0 opacity-10 pointer-events-none" 
              style={{
                backgroundImage: 'linear-gradient(#4a5568 1px, transparent 1px), linear-gradient(90deg, #4a5568 1px, transparent 1px)',
                backgroundSize: '40px 40px'
              }}
            />

            {/* 2. Terrain Decoration Layer */}
            {TERRAIN_FEATURES.map((feat, i) => (
              <div 
                key={`terrain-${i}`}
                className="absolute transform -translate-x-1/2 -translate-y-1/2 pointer-events-none opacity-80"
                style={{ 
                  left: `${feat.x}%`, 
                  top: `${feat.y}%`,
                  width: `${feat.size}px`,
                  height: `${feat.size}px`
                }}
              >
                {feat.type === 'MOUNTAIN' && (
                  <div className="w-0 h-0 border-l-[50px] border-r-[50px] border-b-[80px] border-transparent"
                       style={{ 
                         borderBottomColor: feat.color, 
                         transform: 'scale(2.5)',
                         filter: 'drop-shadow(4px 4px 0px rgba(0,0,0,0.5))' 
                       }} 
                  />
                )}
                {feat.type === 'WATER' && (
                  <div className="w-full h-full rounded-[40%_60%_70%_30%/40%_50%_60%_50%]"
                       style={{ backgroundColor: feat.color, opacity: 0.6 }} />
                )}
                {feat.type === 'FOREST' && (
                  <div className="w-full h-full flex flex-wrap gap-2 justify-center items-center opacity-70">
                     {[...Array(5)].map((_, j) => (
                       <div key={j} className="w-8 h-8 rounded-full bg-retro-green/40" />
                     ))}
                  </div>
                )}
              </div>
            ))}

            {/* 3. Connecting Lines */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-50">
               {MAPS.map((map, i) => {
                 if (i === MAPS.length - 1) return null;
                 const next = MAPS[i+1];
                 const x1 = (map.worldPosition.x / 100) * WORLD_SIZE.width;
                 const y1 = (map.worldPosition.y / 100) * WORLD_SIZE.height;
                 const x2 = (next.worldPosition.x / 100) * WORLD_SIZE.width;
                 const y2 = (next.worldPosition.y / 100) * WORLD_SIZE.height;
                 
                 const isNextCompleted = completedLevels.includes(map.id); // If this map is done, the path to next is "open"
                 
                 return (
                   <line 
                     key={`line-${i}`}
                     x1={x1} y1={y1} x2={x2} y2={y2}
                     stroke={isNextCompleted ? "#a7f070" : "white"} 
                     strokeWidth="4" 
                     strokeDasharray={isNextCompleted ? "" : "12 12"}
                     className="transition-colors duration-500"
                   />
                 );
               })}
            </svg>

            {/* 4. Map Nodes */}
            {MAPS.map((map, i) => {
               const posX = (map.worldPosition.x / 100) * WORLD_SIZE.width;
               const posY = (map.worldPosition.y / 100) * WORLD_SIZE.height;
               const isFocused = map.id === focusedMapId;
               const isCompleted = completedLevels.includes(map.id);
               
               return (
                <button
                   key={map.id}
                   onPointerDown={(e) => e.stopPropagation()} 
                   onClick={() => setSelectedMapBriefing(map)}
                   className={`absolute transform -translate-x-1/2 -translate-y-1/2 group z-10 transition-all duration-300 ${isFocused ? 'scale-125 z-20' : 'hover:scale-110'}`}
                   style={{ left: `${posX}px`, top: `${posY}px` }}
                >
                   {/* Ripple effect */}
                   <div className={`absolute inset-0 animate-ping rounded-full ${isCompleted ? 'bg-green-400/20' : 'bg-white/20'}`}></div>
                   
                   <div className={`w-12 h-12 flex items-center justify-center pixel-btn active:translate-y-1 
                       ${isCompleted 
                         ? 'bg-retro-green' 
                         : (i === 9 ? 'bg-retro-red' : 'bg-retro-blue')
                       }`}>
                       {isCompleted ? (
                           <CheckCircle2 size={24} className="text-black fill-white/50" />
                       ) : (
                           i === 9 ? <Crosshair size={24} className="text-white" /> : <Flag size={20} className="text-white fill-white" />
                       )}
                   </div>
                   <div className="absolute top-14 left-1/2 -translate-x-1/2 whitespace-nowrap bg-black px-2 py-1 border-2 border-white/50 text-[10px] text-white backdrop-blur-sm shadow-retro-sm">
                      {map.name}
                   </div>
                </button>
            )})}
          </div>
        </div>

        {/* Mission Briefing Modal */}
        {selectedMapBriefing && (
            <div className="absolute inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm">
                <div className="bg-retro-dark border-4 border-black p-6 max-w-sm w-full shadow-retro relative animate-[fadeIn_0.2s_ease-out] pixel-panel flex flex-col max-h-[90vh]">
                    <button 
                        onClick={() => setSelectedMapBriefing(null)}
                        className="absolute top-2 right-2 text-retro-red hover:text-white"
                    >
                        <X size={24} />
                    </button>
                    
                    <h2 className="text-xl text-retro-yellow mb-4 border-b-4 border-black pb-2 flex items-center gap-2">
                        {selectedMapBriefing.name}
                        {completedLevels.includes(selectedMapBriefing.id) && (
                            <span className="text-[10px] bg-retro-green text-black px-2 py-0.5 rounded-sm border border-black font-bold">DONE</span>
                        )}
                    </h2>
                    
                    <div className="space-y-4 mb-4 text-xs leading-relaxed overflow-y-auto">
                        <p className="bg-black/20 p-2 border-2 border-black/20">{selectedMapBriefing.description}</p>
                        <div className="grid grid-cols-2 gap-4 text-retro-gray bg-black/30 p-3 rounded-sm border-2 border-black/50">
                            <div>MAX WAVES</div>
                            <div className="text-white font-bold">{selectedMapBriefing.maxWaves}</div>
                            <div>STARTING CASH</div>
                            <div className="text-green-400 font-bold">${selectedMapBriefing.startingCredits}</div>
                            <div>GRID SIZE</div>
                            <div className="text-white">{selectedMapBriefing.width}x{selectedMapBriefing.height}</div>
                        </div>
                    </div>
                    
                    {/* DIFFICULTY SELECTION - Only if completed */}
                    {completedLevels.includes(selectedMapBriefing.id) && (
                        <div className="mb-4 space-y-3 bg-black/20 p-3 border-2 border-black/20 animate-in slide-in-from-bottom duration-300">
                             <div className="flex items-center justify-between text-xs font-bold text-gray-400 border-b border-white/10 pb-1">
                                 <span>DIFFICULTY SELECT</span>
                                 <div className="flex items-center gap-1">
                                     <span>ENDLESS</span>
                                     <button 
                                        onClick={() => setIsEndlessMode(!isEndlessMode)}
                                        className={`w-4 h-4 border border-black flex items-center justify-center ${isEndlessMode ? 'bg-retro-green' : 'bg-black'}`}
                                     >
                                         {isEndlessMode && <CheckCircle2 size={10} className="text-black" />}
                                     </button>
                                 </div>
                             </div>

                             <div className="flex justify-between gap-1">
                                 {[1, 2, 3, 4, 5].map((level) => {
                                     const isActive = selectedDifficulty === level;
                                     return (
                                         <button
                                             key={level}
                                             onClick={() => setSelectedDifficulty(isActive ? 0 : level)}
                                             className={`flex-1 py-2 border-2 border-black flex flex-col items-center justify-center transition-all ${isActive ? 'bg-retro-orange text-black -translate-y-1 shadow-retro-sm' : 'bg-[#333] text-gray-500 hover:bg-[#444]'}`}
                                         >
                                             <Star size={12} fill="currentColor" />
                                             <span className="text-[8px] font-bold">{level}</span>
                                         </button>
                                     )
                                 })}
                             </div>
                             
                             {/* Difficulty Description */}
                             <div className="text-[8px] text-center bg-black/40 p-2 text-gray-400 border border-white/5 min-h-[40px] flex items-center justify-center">
                                 {selectedDifficulty === 0 && "STANDARD OPERATIONS. NO MODIFIERS."}
                                 {selectedDifficulty === 1 && "HP +30%"}
                                 {selectedDifficulty === 2 && "HP +40% • SPAWN COUNT +10%"}
                                 {selectedDifficulty === 3 && "HP +50% • SPAWN COUNT +20% • SHIELD REGEN +10%"}
                                 {selectedDifficulty === 4 && "HP +50% • SPAWN COUNT +30% • SHIELD REGEN +15%"}
                                 {selectedDifficulty === 5 && "HP +60% • SPAWN COUNT +30% • SHIELD REGEN +20% • RATE +10%"}
                             </div>
                        </div>
                    )}
                    
                    <button 
                        onClick={() => selectMap(selectedMapBriefing)}
                        className="w-full py-4 bg-retro-green text-black pixel-btn shadow-retro-sm hover:bg-white font-bold text-sm tracking-widest mt-auto"
                    >
                        {completedLevels.includes(selectedMapBriefing.id) ? (
                            selectedDifficulty > 0 || isEndlessMode ? "DEPLOY CUSTOM OP" : "REPLAY MISSION"
                        ) : "DEPLOY SQUAD"}
                    </button>
                </div>
            </div>
        )}
      </div>
    );
  }

  if (!gameState) return null;

  const selectedInstance = selectedInstanceId ? gameState.towers.find(t => t.id === selectedInstanceId) : null;
  const activeDef = selectedInstance 
    ? TOWER_DEFS[selectedInstance.type] 
    : (selectedTower ? TOWER_DEFS[selectedTower] : null);

  const isBossWave = gameState.wave % 5 === 0;
  const isPreBossWave = (gameState.wave + 1) % 5 === 0;
  const canSkip = gameState.skipTickets > 0 && !gameState.waveActive && !isBossWave && !isPreBossWave;

  // CLOCK CALCULATION
  const timeOfDay = (gameState.tick % TICKS_PER_DAY) / TICKS_PER_DAY;
  
  const getTimePhase = (t: number) => {
    if (t < 0.2) return "NIGHT";
    if (t < 0.3) return "DAWN";
    if (t < 0.7) return "DAY";
    if (t < 0.8) return "DUSK";
    return "NIGHT";
  };
  
  const timePhase = getTimePhase(timeOfDay);

  return (
    <div className="flex flex-col h-[100dvh] w-full bg-retro-black text-white font-pixel overflow-hidden">
      {/* GLOBAL STYLES FOR PIXEL ART UI */}
      <style>{`
            .pixel-btn {
                box-shadow: inset 2px 2px 0px rgba(255,255,255,0.2), inset -2px -2px 0px rgba(0,0,0,0.4);
                border: 2px solid #000;
            }
            .pixel-btn:active, .pixel-btn-active {
                box-shadow: inset 2px 2px 0px rgba(0,0,0,0.4), inset -2px -2px 0px rgba(255,255,255,0.1);
                transform: translateY(2px);
                background-color: #222;
                color: #aaa;
            }
            .pixel-panel {
                box-shadow: 4px 4px 0px rgba(0,0,0,0.5);
                border: 4px solid #000;
            }
            .pixel-inset {
                box-shadow: inset 2px 2px 4px rgba(0,0,0,0.5);
            }
            .pixel-border {
                border: 2px solid #000;
                box-shadow: 2px 2px 0px rgba(0,0,0,0.3);
            }
      `}</style>

      {/* Settings Modal (In-Game) */}
      {showSettingsModal && renderSettingsModal()}
      
      {/* Retreat Confirmation Modal */}
      {showRetreatModal && renderRetreatModal()}

      {/* TOWER TOOLTIP OVERLAY */}
      {towerTooltip && (
          <div 
            className="fixed z-[60] bg-retro-dark border-4 border-black p-3 pointer-events-none mb-4 animate-in fade-in zoom-in-95 duration-100 min-w-[140px] shadow-[4px_4px_0_rgba(0,0,0,0.5)] transform -translate-x-1/2 -translate-y-full"
            style={{ left: towerTooltip.x, top: towerTooltip.y - 20 }}
          >
              <div className="text-xs font-bold text-retro-yellow border-b-2 border-white/20 pb-1 mb-2">
                  {towerTooltip.def.name}
              </div>
              <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-[8px] mb-2">
                  <span className="text-gray-400">DMG:</span> <span className="text-white font-bold">{towerTooltip.def.damage}</span>
                  <span className="text-gray-400">RNG:</span> <span className="text-white font-bold">{towerTooltip.def.range}</span>
                  <span className="text-gray-400">SPD:</span> <span className="text-white font-bold">{(60 / towerTooltip.def.fireRate).toFixed(1)}s</span>
              </div>
              <p className="text-[8px] text-gray-300 leading-tight italic border-t border-white/10 pt-1">
                  {towerTooltip.def.description}
              </p>
          </div>
      )}

      {/* Top Bar */}
      <div className="h-14 shrink-0 flex items-center justify-between px-2 bg-retro-dark border-b-4 border-black z-20 shadow-lg gap-2">
        <div className="flex gap-2 min-w-0 overflow-x-auto no-scrollbar">
           <div className="flex flex-col shrink-0">
             <span className="text-[8px] text-retro-gray font-bold">CASH</span>
             <span className="text-retro-yellow text-xs flex items-center bg-black/30 px-2 py-0.5 rounded pixel-inset whitespace-nowrap">
               ${Math.floor(gameState.credits)}
             </span>
             {gameState.incomePerSecond > 0 && (
                <span className="text-[8px] text-green-400 absolute top-10 animate-pulse bg-black/50 px-1 rounded whitespace-nowrap">
                   +${gameState.incomePerSecond}/s
                </span>
             )}
           </div>
           <div className="flex flex-col shrink-0">
             <span className="text-[8px] text-retro-gray font-bold">HP</span>
             <span className="text-retro-red text-xs flex items-center bg-black/30 px-2 py-0.5 rounded pixel-inset whitespace-nowrap">
               {gameState.health}
             </span>
           </div>
           <div className="flex flex-col shrink-0">
             <span className="text-[8px] text-retro-gray font-bold">WAVE</span>
             <span className="text-xs flex items-center text-white bg-black/30 px-2 py-0.5 rounded pixel-inset whitespace-nowrap">
               {gameState.isEndless ? <InfinityIcon size={12} /> : `${gameState.wave} / ${gameState.mapData.maxWaves}`}
             </span>
           </div>
           {/* Difficulty Indicator */}
           {gameState.difficultyLevel > 0 && (
                <div className="flex flex-col shrink-0">
                    <span className="text-[8px] text-retro-gray font-bold">DIFF</span>
                    <div className="flex items-center text-retro-orange bg-black/30 px-1 py-0.5 rounded pixel-inset">
                        {[...Array(gameState.difficultyLevel)].map((_, i) => (
                            <Star key={i} size={8} fill="currentColor" />
                        ))}
                    </div>
                </div>
           )}
        </div>
        
        <div className="flex items-center gap-2 shrink-0">
            {/* IN-GAME SETTINGS BUTTON */}
          <button 
             onClick={() => setShowSettingsModal(true)}
             className="w-10 h-10 bg-retro-dark pixel-btn flex items-center justify-center text-white"
          >
             <PixelGear size={16} />
          </button>

          <button 
             onClick={toggleSpeed}
             className="w-10 h-10 bg-retro-gray pixel-btn flex items-center justify-center text-black relative group"
          >
             {gameState.gameSpeed > 1 && gameState.gameSpeed < 2 ? (
                <span className="text-[8px] font-bold">1.5x</span>
             ) : gameState.gameSpeed >= 2 ? (
               <div className="flex items-center">
                  <FastForward size={14} fill="black" /> 
                  <span className="text-[8px] font-bold ml-0.5">{gameState.gameSpeed}x</span>
               </div>
             ) : (
                <span className="text-[10px] font-bold">1x</span>
             )}
          </button>
          <button 
            onClick={() => setGameState(p => p ? ({ ...p, isPlaying: !p.isPlaying }) : null)}
            className="w-10 h-10 bg-retro-gray pixel-btn flex items-center justify-center text-black"
          >
            {gameState.isPlaying ? <Pause size={16} /> : <Play size={16} />}
          </button>
          <button 
            onClick={handleRetreatRequest}
            title="Retreat to Map"
            className="w-10 h-10 bg-retro-red pixel-btn flex items-center justify-center text-white"
          >
            <ArrowLeft size={16} />
          </button>
        </div>
      </div>

      {/* Main Game Viewport */}
      <div 
        ref={gameViewportRef}
        className="flex-1 relative min-h-0 bg-[#111] overflow-hidden touch-none"
        onPointerDown={(e) => handlePointerDown(e, 'GAME')}
        onPointerMove={(e) => handlePointerMove(e, 'GAME')}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        style={{ touchAction: 'none' }} 
      >
        <div 
            className="absolute origin-top-left will-change-transform"
            style={{ 
                transform: `translate(${viewOffset.x}px, ${viewOffset.y}px) scale(${zoom})`
            }}
        > 
           <Grid 
             gameState={gameState} 
             onCellClick={handleGridClickWrapper} 
             selectedTowerId={selectedInstanceId}
             activeShader={settings.activeShader}
             shaderSettings={settings}
             disableDayNight={settings.disableDayNight}
           />
        </div>
        
        {/* HUD Overlay */}
        <div className="absolute top-2 left-2 text-[8px] text-white/50 pointer-events-none select-none font-mono tracking-wide">
            DRAG TO PAN
        </div>
        
        {/* TIME INDICATOR */}
        <div className="absolute top-2 right-2 text-[8px] text-white/50 pointer-events-none select-none font-mono tracking-wide bg-black/40 px-2 py-1 rounded border border-white/10 backdrop-blur-sm">
            {settings.disableDayNight ? "STATUS: SUNSET" : `TIME: ${timePhase}`}
        </div>

        {/* Skip Ticket Indicator (If owned) */}
        {gameState.skipTickets > 0 && !gameState.waveActive && (
            <div className="absolute top-20 right-2 z-30 flex flex-col items-end animate-bounce">
                <span className="text-[8px] text-yellow-400 font-bold mb-1 shadow-black drop-shadow-md bg-black/60 px-2 rounded border border-yellow-400/30">TICKETS: {gameState.skipTickets}</span>
            </div>
        )}

        {/* AUTO START COUNTDOWN OVERLAY */}
        {gameState.autoStart.enabled && !gameState.waveActive && !gameState.gameOver && !gameState.gameWon && (
            <div className="absolute top-20 left-1/2 -translate-x-1/2 pointer-events-none z-30 flex flex-col items-center animate-in fade-in zoom-in duration-300">
                <div className="text-[8px] text-retro-yellow font-bold bg-black/60 px-2 py-1 rounded border border-retro-yellow/30 shadow-retro-sm mb-1">
                    AUTO START ENGAGED
                </div>
                <div className="text-xl font-bold text-white drop-shadow-md font-mono">
                    {Math.ceil(gameState.autoStart.delay - (gameState.autoStart.timer / 60))}s
                </div>
            </div>
        )}

        {/* Stats Overlay */}
        {activeDef && showStats && (
            <div 
              className={`absolute top-4 left-1/2 -translate-x-1/2 bg-retro-dark border-4 border-black p-2 shadow-retro w-48 z-40 transition-opacity duration-300 pixel-panel ${selectedInstanceId ? '' : 'pointer-events-none'}`}
              onPointerDown={(e) => e.stopPropagation()} 
            >
               <h3 className={`text-[10px] mb-1 font-bold ${activeDef.color.replace('bg-', 'text-')} flex justify-between`}>
                 <span>{selectedInstanceId ? `ACTIVE ${activeDef.name}` : activeDef.name}</span>
                 {selectedInstanceId && <span className="text-[8px] text-gray-400">ID:{selectedInstanceId.split('_')[1].slice(-4)}</span>}
               </h3>
               <p className="text-[8px] text-retro-gray mb-2 bg-black/20 p-1 border border-black/20">{activeDef.description}</p>
               <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-[8px] bg-black/30 p-2 pixel-inset mb-2">
                  <span>DMG: <span className="text-white">{activeDef.damage}</span></span>
                  <span>RNG: <span className="text-white">{activeDef.range}</span></span>
                  <span>SPD: <span className="text-white">{(60/activeDef.fireRate).toFixed(1)}/s</span></span>
               </div>
               
               {selectedInstanceId && (
                 <button 
                   onClick={handleSellTower}
                   className="w-full bg-[#3d1515] text-retro-red text-[8px] py-2 flex items-center justify-center gap-2 pixel-btn hover:bg-[#521b1b]"
                 >
                   <Trash2 size={10} />
                   <span>SELL (+${Math.floor(activeDef.cost * 0.5)})</span>
                 </button>
               )}
            </div>
        )}

        {/* Game Over */}
        {gameState.gameOver && (
          <div 
            className="absolute inset-0 z-50 bg-retro-red/90 flex flex-col items-center justify-center pointer-events-auto"
            onPointerDown={(e) => e.stopPropagation()}
          >
            <div className="bg-black border-4 border-white p-8 text-center pixel-panel shadow-2xl">
                <h2 className="text-3xl mb-4 text-retro-red drop-shadow-retro">DEFEAT</h2>
                <p className="text-sm mb-8 text-white">WAVE {gameState.wave} REACHED</p>
                <button 
                  onClick={performRetreat}
                  className="px-6 py-4 bg-white text-black pixel-btn font-bold hover:bg-retro-gray"
                >
                  RETREAT TO MAP
                </button>
            </div>
          </div>
        )}

        {/* Victory Screen */}
        {gameState.gameWon && (
           <div 
              className="absolute inset-0 z-50 bg-retro-blue/90 flex flex-col items-center justify-center pointer-events-auto"
              onPointerDown={(e) => e.stopPropagation()}
           >
             <div className="bg-black border-4 border-white p-8 text-center pixel-panel shadow-2xl">
                 <h2 className="text-3xl mb-4 text-retro-green drop-shadow-retro">VICTORY</h2>
                 <p className="text-sm mb-2 text-white">SECTOR SECURED</p>
                 <p className="text-xs mb-8 text-black bg-white px-2 py-1 inline-block font-bold">Waves Cleared: {gameState.mapData.maxWaves}</p>
                 <div className="mt-4">
                     <button 
                       onClick={performRetreat}
                       className="px-6 py-4 bg-white text-black pixel-btn font-bold hover:bg-retro-gray"
                    >
                       NEXT MISSION
                     </button>
                 </div>
             </div>
           </div>
        )}
      </div>

      {/* Bottom Controls */}
      <div className="h-auto bg-retro-dark border-t-4 border-black shrink-0 flex flex-col p-2 gap-2 pb-6 md:pb-2 z-30 shadow-[0_-4px_10px_rgba(0,0,0,0.5)]">
        <div className="flex gap-2">
            <button 
              onClick={handleStartWave} 
              disabled={gameState.waveActive}
              className={`flex-1 border-2 border-black py-3 text-xs font-bold pixel-btn relative transition-transform
                ${gameState.waveActive ? 'bg-[#444] text-black/50 cursor-not-allowed border-gray-600' : 'bg-retro-green text-black hover:bg-white'}
              `}
            >
              {gameState.waveActive ? 'WAVE IN PROGRESS' : 'START NEXT WAVE'}
              {gameState.pendingWaveBuff > 0 && !gameState.waveActive && (
                  <div className="absolute top-1 right-2 text-[8px] text-red-600 font-bold animate-pulse">
                      THREAT +{(gameState.pendingWaveBuff * 100).toFixed(0)}%
                  </div>
              )}
              {gameState.pendingMoneyBonus > 0 && !gameState.waveActive && (
                  <div className="absolute top-1 left-2 text-[8px] text-green-400 font-bold animate-pulse">
                      LOOT +{(gameState.pendingMoneyBonus * 100).toFixed(0)}%
                  </div>
              )}
            </button>
            
            {/* SKIP TICKET BUTTON (Stackable) */}
            {gameState.skipTickets > 0 && !gameState.waveActive && (
                <button 
                    onClick={handleQueueSkip}
                    disabled={!canSkip}
                    className={`w-16 pixel-btn flex flex-col items-center justify-center transition-colors
                        ${canSkip 
                            ? 'bg-retro-yellow text-black hover:bg-white cursor-pointer' 
                            : 'bg-retro-gray text-black/40 cursor-not-allowed opacity-50'
                        }
                    `}
                >
                    <div className="flex items-center gap-1">
                        <Ticket size={12} />
                        <span className="text-[10px] font-bold">SKIP</span>
                    </div>
                    <span className="text-[6px] font-bold opacity-75">THREAT UP</span>
                    <span className="text-[6px] font-bold opacity-75 text-green-700">LOOT (+50%)</span>
                </button>
            )}
        </div>

        {/* Towers Grid */}
        <div className="grid grid-cols-4 gap-2 pt-1 pb-1">
          {Object.values(TOWER_DEFS).map(def => {
            const isSelected = selectedTower === def.id;
            const canAfford = gameState.credits >= def.cost;
            const currentCount = gameState.towers.filter(t => t.type === def.id).length;
            
            // Calculate limit: Normal towers scale with waves, Bank scales with map clears
            let currentLimit = def.baseLimit + (def.limitPerWave * (gameState.wave - 1));
            if (def.id === TowerType.MINER) {
                 currentLimit = def.baseLimit + Math.floor(completedLevels.length / 2);
            }
            
            const isAtLimit = currentCount >= currentLimit;
            
            return (
              <button
                key={def.id}
                onPointerDown={(e) => handleTowerBtnDown(e, def)}
                onPointerUp={handleTowerBtnUp}
                onPointerLeave={handleTowerBtnUp}
                onClick={() => {
                  if (isLongPress.current) return;
                  setSelectedTower(def.id);
                  setSelectedInstanceId(null);
                  setShowStats(true);
                }}
                className={`
                  w-full h-20 flex flex-col items-center justify-center gap-1 transition-transform relative
                  ${isSelected 
                    ? 'bg-retro-dark pixel-btn-active' 
                    : 'bg-retro-gray text-black/70 pixel-btn'
                  }
                  ${(!canAfford || isAtLimit) && !isSelected ? 'opacity-50 grayscale' : ''}
                `}
              >
                <div className={`w-6 h-6 border-2 border-black ${def.color} shadow-sm`}></div>
                <div className="flex items-center gap-1 mt-1">
                   <span className="text-[8px] font-bold">{def.name}</span>
                   <span className={`text-[6px] px-1 rounded border border-black/20 ${isAtLimit ? 'bg-retro-red text-white' : 'bg-black/20'}`}>
                      {currentCount}/{currentLimit}
                   </span>
                </div>
                <span className={`text-[8px] font-bold ${canAfford ? 'text-black' : 'text-retro-red'}`}>
                  ${def.cost}
                </span>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  );
};

export default App;
