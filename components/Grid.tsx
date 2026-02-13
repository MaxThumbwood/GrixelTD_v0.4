

import React, { useMemo, memo, useRef } from 'react';
import { GameState, TowerType, Enemy, EnemyType } from '../types';
import { TOWER_DEFS, CELL_SIZE } from '../constants';
import { getEntityPosition } from '../services/gameLogic';
import { Crosshair, ScanEye } from 'lucide-react';

interface GridProps {
  gameState: GameState;
  onCellClick: (x: number, y: number) => void;
  selectedTowerId: string | null;
  activeShader: 'NONE' | 'PETER' | 'PLASTIC';
  shaderSettings?: {
      shadowIntensity: number;
      lightPower: number;
      bloomStrength: number;
  };
  disableDayNight: boolean;
}

// Material Simulation Component (RTX Only)
const MaterialOverlay = () => (
  <div className="absolute inset-0 rounded-sm pointer-events-none z-20 mix-blend-overlay opacity-30"
    style={{
      background: 'linear-gradient(135deg, rgba(255,255,255,0.4) 0%, rgba(255,255,255,0) 40%, rgba(0,0,0,0.1) 50%, rgba(255,255,255,0) 60%, rgba(255,255,255,0.2) 100%)'
    }}
  />
);

interface TowerPlateProps {
  isRTX: boolean;
  isPlastic: boolean;
  specularOffset?: { x: number, y: number };
  baseColor?: string;
}

const TowerPlate = memo(({ isRTX, isPlastic, specularOffset = { x: 0, y: 0 }, baseColor = "#94b0c2" }: TowerPlateProps) => {
  const gradId = isRTX ? "plateGrad-rtx" : (isPlastic ? "plateGrad-plastic" : "plateGrad-base");

  if (isPlastic) {
      return (
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              <div className="w-[92%] h-[92%] relative rounded-xl bg-gradient-to-b from-slate-200 to-slate-300 shadow-[0_3px_0_rgba(0,0,0,0.15),inset_1px_1px_0_rgba(255,255,255,0.9)]">
                  <div className="absolute inset-2 flex items-center justify-center bg-slate-200 rounded-full shadow-[inset_1px_1px_3px_rgba(0,0,0,0.15)]">
                       <div className="w-[60%] h-[60%] bg-slate-300 rounded-full shadow-[1px_1px_2px_rgba(255,255,255,0.8)]"></div>
                  </div>
              </div>
          </div>
      );
  }

  return (
    <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
       <div className="w-[90%] h-[90%] relative">
          <svg viewBox="0 0 48 48" className="w-full h-full">
              <defs>
                  <radialGradient id={gradId} cx="30%" cy="30%" r="80%">
                      <stop offset="0%" stopColor="#dceeff" />
                      <stop offset="40%" stopColor="#7a92a3" />
                      <stop offset="100%" stopColor="#4a5568" />
                  </radialGradient>
              </defs>
              
              <path d="M16 2 H32 V16 H46 V32 H32 V46 H16 V32 H2 V16 H16 Z" 
                    fill={isRTX ? `url(#${gradId})` : baseColor} 
                    stroke={isRTX ? "#0f1115" : "#1a1c2c"} 
                    strokeWidth="2" 
              />
              <rect x="18" y="18" width="12" height="12" 
                    fill={isRTX ? "#332233" : "#5d275d"} 
                    stroke={isRTX ? "#000" : "#1a1c2c"} 
                    strokeWidth="1" 
                    opacity={isRTX ? "0.9" : "1"} 
              />
              {[
                {cx:10, cy:24}, {cx:38, cy:24}, {cx:24, cy:10}, {cx:24, cy:38}
              ].map((p, i) => (
                 <circle key={i} cx={p.cx} cy={p.cy} r="2" fill={isRTX ? "#222" : "#333c57"} />
              ))}
          </svg>
          
          {isRTX && (
            <>
              <div 
                className="absolute w-2 h-2 bg-white rounded-full blur-[2px] opacity-60 transition-transform duration-500 will-change-transform"
                style={{
                    left: '50%', top: '50%',
                    transform: `translate(calc(-50% + ${specularOffset.x * 12}px), calc(-50% + ${specularOffset.y * 12}px))`
                }}
              />
              <MaterialOverlay />
            </>
          )}
       </div>
    </div>
  );
});

const Obstacle = memo(({ x, y, isRTX, isPlastic, lightVector, shadowIntensity = 1 }: { x: number, y: number, isRTX: boolean, isPlastic: boolean, lightVector: any, shadowIntensity?: number }) => {
  const height = (isRTX || isPlastic) ? 10 : 0; 
  const cx = 50 + (lightVector.x * 40); 
  const cy = 50 + (lightVector.y * 40);

  const angle = Math.atan2(lightVector.vecY, lightVector.vecX) * (180 / Math.PI);
  const vecLen = Math.sqrt(lightVector.vecX**2 + lightVector.vecY**2);
  
  const shadowLength = Math.min(vecLen * 6, 120); 
  const widthStart = 34; 
  const widthEnd = 64 + (shadowLength * 0.4); 

  const startYRadius = (widthStart / widthEnd) * 50; 
  const y1 = 50 - startYRadius;
  const y2 = 50 + startYRadius;
  
  const clipPath = `polygon(0% ${y1.toFixed(1)}%, 100% 0%, 100% 100%, 0% ${y2.toFixed(1)}%)`;

  const style = {
      left: `${x * CELL_SIZE}px`,
      top: `${y * CELL_SIZE}px`,
      width: `${CELL_SIZE}px`,
      height: `${CELL_SIZE}px`,
      zIndex: 15,
  };

  if (isPlastic) {
      return (
        <div className="absolute pointer-events-none" style={style}>
             <div 
                 className="absolute top-1/2 left-1/2 origin-left transition-transform duration-500 will-change-transform rounded-full blur-[1px]"
                 style={{
                     width: `${shadowLength * 0.6}px`, 
                     height: `${widthEnd * 0.6}px`,
                     background: `rgba(0,0,0,0.25)`,
                     transform: `translateY(-50%) rotate(${angle}deg)`, 
                     zIndex: -1,
                     pointerEvents: 'none'
                 }}
             />
             <div className="w-[88%] h-[88%] left-[6%] top-[6%] relative rounded-md bg-gradient-to-br from-rose-500 to-rose-600 shadow-[inset_1px_1px_0px_rgba(255,255,255,0.4),inset_-1px_-1px_0px_rgba(0,0,0,0.2),0_4px_0_#9f1239]">
                 <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-tr from-transparent via-transparent to-white/30 rounded-md" />
                 <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 bg-rose-500 rounded-full shadow-[inset_1px_1px_1px_rgba(255,255,255,0.4),1px_1px_2px_rgba(0,0,0,0.2)]" />
             </div>
        </div>
      );
  }

  return (
    <div className="absolute pointer-events-none" style={style}>
        {isRTX ? (
           <>
               <div 
                    className="absolute top-1/2 left-1/2 origin-left transition-transform duration-500 will-change-transform"
                    style={{
                        width: `${shadowLength + 20}px`, 
                        height: `${widthEnd}px`,
                        background: `linear-gradient(90deg, rgba(0,0,0,${0.9 * shadowIntensity}) 0%, rgba(0,0,0,${0.5 * shadowIntensity}) 50%, transparent 100%)`,
                        clipPath: clipPath,
                        transform: `translateY(-50%) rotate(${angle}deg)`, 
                        zIndex: -1,
                        pointerEvents: 'none'
                    }}
               />
               <div className="w-full h-full relative transition-all duration-300">
                   <div className="absolute w-[86%] h-[86%] left-[7%] top-[7%] rounded-sm bg-[#080808] shadow-sm"
                        style={{ transform: `translateY(${height/2}px)` }} 
                   />
                   <div className="absolute w-[86%] h-[86%] left-[7%] top-[7%] flex items-center justify-center border border-white/10 rounded-sm"
                        style={{ 
                            transform: `translateY(-${height}px)`,
                            background: `radial-gradient(circle at ${cx}% ${cy}%, #777 0%, #222 100%)`,
                            boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.15)'
                        }}
                   >
                      <div className="absolute w-full h-full opacity-30 mix-blend-overlay rounded-sm"
                         style={{ background: `radial-gradient(circle at ${cx}% ${cy}%, white 0%, transparent 50%)` }} />
                      <div className="w-4 h-4 bg-black/40 rounded-sm shadow-inner border border-white/5" />
                   </div>
               </div>
           </>
        ) : (
           <div className="absolute inset-0 flex items-center justify-center">
             <div className="w-3/4 h-3/4 bg-[#4a3b3b] border-2 border-black shadow-sm relative">
                <div className="absolute top-1 left-1 w-1 h-1 bg-white/20" />
             </div>
           </div>
        )}
    </div>
  );
});

const StaticBackground = memo(({ 
  onCellClick, 
  width, 
  height, 
  path, 
  obstacles,
  isRTX,
  isPlastic,
  shadowIntensity = 1,
}: { 
  onCellClick: (x: number, y: number) => void,
  width: number,
  height: number,
  path: any[],
  obstacles: any[],
  isRTX: boolean,
  isPlastic: boolean,
  shadowIntensity?: number,
}) => {
  const cells = [];

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const isPath = path.some(c => c.x === x && c.y === y);
      const isObstacle = obstacles.some(c => c.x === x && c.y === y);
      const isEven = (x + y) % 2 === 0;
      
      let bgClass = '';
      let additionalStyle: React.CSSProperties = {};

      if (isPlastic) {
        if (isPath) {
           bgClass = 'bg-[#f1f5f9]'; 
           additionalStyle = {
               boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.05)'
           };
        } else if (isObstacle) {
           bgClass = 'bg-[#6366f1]'; 
        } else {
           bgClass = isEven ? 'bg-[#6366f1]' : 'bg-[#4f46e5]'; 
           additionalStyle = {
               boxShadow: 'inset 2px 2px 0 rgba(255,255,255,0.1), inset -2px -2px 0 rgba(0,0,0,0.1)'
           };
        }
      } else if (isRTX) {
        if (isPath) {
          bgClass = 'bg-[#050505]';
          additionalStyle = {
             boxShadow: 'inset 0 0 8px 2px rgba(0,0,0,0.9)',
             borderColor: 'rgba(255,255,255,0.02)'
          };
        } else if (isObstacle) {
          bgClass = 'bg-[#2a2a2a]'; 
        } else {
          bgClass = isEven ? 'bg-[#1e2029]' : 'bg-[#15161c]'; 
          additionalStyle = {
              backgroundImage: 'linear-gradient(135deg, rgba(255,255,255,0.03) 0%, transparent 100%)'
          };
        }
      } else {
        bgClass = isEven ? 'bg-[#333c57]' : 'bg-[#292e42]';
        if (isPath) bgClass = 'bg-[#1a1c2c]';
        if (isObstacle) bgClass = 'bg-[#564040]'; 
      }

      cells.push(
        <div
          key={`bg-${x}-${y}`}
          onClick={() => onCellClick(x, y)}
          className={`absolute box-border border-r border-b ${isRTX ? 'border-white/5' : (isPlastic ? 'border-black/5' : 'border-black/20')} flex items-center justify-center
            ${bgClass}
            ${!isPath && !isObstacle ? 'hover:bg-white/5 cursor-pointer' : ''}
          `}
          style={{
            left: `${x * CELL_SIZE}px`,
            top: `${y * CELL_SIZE}px`,
            width: `${CELL_SIZE}px`,
            height: `${CELL_SIZE}px`,
            ...additionalStyle
          }}
        >
          {isPath && <div className={`w-1 h-1 rounded-full pointer-events-none ${isRTX ? 'bg-white/5' : (isPlastic ? 'bg-black/5' : 'bg-white/10')}`} />}
        </div>
      );
    }
  }
  return <>{cells}</>;
});

const Grid: React.FC<GridProps> = ({ gameState, onCellClick, selectedTowerId, activeShader, shaderSettings, disableDayNight }) => {
  const { width, height, path, obstacles } = gameState.mapData;
  const selectedTowerInstance = selectedTowerId ? gameState.towers.find(t => t.id === selectedTowerId) : null;

  const isRTX = activeShader === 'PETER';
  const isPlastic = activeShader === 'PLASTIC';
  const enableShaders = isRTX || isPlastic;

  const settings = shaderSettings || {
      shadowIntensity: 0.6,
      lightPower: 1.0,
      bloomStrength: 0.13
  };

  const TICKS_PER_DAY = 10800; 
  const timeOfDay = (gameState.tick % TICKS_PER_DAY) / TICKS_PER_DAY; 

  const lightingKey = useMemo(() => {
      if (!enableShaders) return 'disabled';
      if (isPlastic) return 'plastic-static';
      if (disableDayNight) return 'static-dusk'; 
      if (timeOfDay < 0.2) return 'night-static'; 
      if (timeOfDay > 0.8) return 'night-static'; 
      const quantizedTick = Math.floor(gameState.tick / 12); 
      return `dynamic-${quantizedTick}`;
  }, [timeOfDay, enableShaders, isPlastic, gameState.tick, disableDayNight]);

  const cycle = useMemo(() => {
    if (isPlastic) {
        return { phase: 'PLASTIC', ambientColor: 'transparent', globalLight: { x: -4, y: -6, intensity: 1.0 }, bloomBoost: 0.8 };
    }
    if (!enableShaders) return { phase: 'DEFAULT', ambientColor: 'transparent', globalLight: { x: 0, y: 0, intensity: 0 }, bloomBoost: 1.0 };
    const effectiveTime = disableDayNight ? 0.75 : timeOfDay;

    let phase = ''; 
    let ambientColor = '';
    let globalLight = { x: 0, y: 0, intensity: 0 };
    let bloomBoost = 1.0;

    if (effectiveTime < 0.2) { 
        phase = 'NIGHT';
        ambientColor = 'rgba(10, 15, 30, 0.55)'; 
        globalLight = { x: -2, y: -4, intensity: 0.1 }; 
        bloomBoost = 1.4; 
    } else if (effectiveTime < 0.3) { 
        phase = 'DAWN';
        const t = (effectiveTime - 0.2) / 0.1; 
        ambientColor = `rgba(50, 20, 10, ${0.4 * (1 - t)})`; 
        globalLight = { x: 6 * (1 - t), y: 2, intensity: t * 0.8 }; 
        bloomBoost = 1.4 - (0.4 * t);
    } else if (effectiveTime < 0.7) { 
        phase = 'DAY';
        const t = (effectiveTime - 0.3) / 0.4; 
        const sunX = -4 + (8 * t); 
        const sunY = -Math.sin(t * Math.PI) * 4; 
        ambientColor = 'rgba(0,0,0,0)'; 
        globalLight = { x: -sunX, y: -sunY, intensity: 1.2 }; 
        bloomBoost = 1.0;
    } else if (effectiveTime < 0.8) { 
        phase = 'DUSK';
        const t = (effectiveTime - 0.7) / 0.1; 
        ambientColor = `rgba(60, 20, 40, ${0.5 * t})`; 
        globalLight = { x: 4 + (2 * t), y: 2, intensity: 1.0 * (1 - t) };
        bloomBoost = 1.0 + (0.4 * t);
    } else { 
        phase = 'NIGHT';
        ambientColor = 'rgba(10, 15, 30, 0.55)'; 
        globalLight = { x: -2, y: -4, intensity: 0.1 };
        bloomBoost = 1.4;
    }
    return { phase, ambientColor, globalLight, bloomBoost };
  }, [lightingKey, enableShaders, isPlastic, disableDayNight]);

  const staticLights = useMemo(() => {
    if (!enableShaders) return [];
    return gameState.towers.map(t => {
       let power = 25; 
       if (t.type === TowerType.SNIPER) power = 30; 
       if (t.type === TowerType.BLASTER) power = 20; 
       if (t.type === TowerType.MINER) power = 20;
       return { x: t.position.x + 0.5, y: t.position.y + 0.5, power: power * settings.lightPower };
    });
  }, [gameState.towers, enableShaders, settings.lightPower]);

  const getLightVector = React.useCallback((cx: number, cy: number) => {
    if (!enableShaders) return { x: 0, y: 0, vecX: 2, vecY: 2 }; 

    let vecX = cycle.globalLight.x * cycle.globalLight.intensity * 3;
    let vecY = cycle.globalLight.y * cycle.globalLight.intensity * 3; 

    if (isPlastic) {
        const len = Math.sqrt(vecX*vecX + vecY*vecY);
        return { vecX, vecY, x: -vecX/len, y: -vecY/len };
    }

    for (const light of staticLights) {
       const dx = cx - light.x;
       const dy = cy - light.y;
       const distSq = dx*dx + dy*dy;
       if (distSq < 0.1 || distSq > 30) continue; 

       const weight = light.power / (distSq * 1.5);
       vecX += (dx / Math.sqrt(distSq)) * weight * 6;
       vecY += (dy / Math.sqrt(distSq)) * weight * 6;
    }

    const len = Math.sqrt(vecX*vecX + vecY*vecY);
    const MAX_LEN = 10;
    if (len > MAX_LEN) {
       vecX = (vecX / len) * MAX_LEN;
       vecY = (vecY / len) * MAX_LEN;
    }
    const normX = len > 0.1 ? vecX / len : 0;
    const normY = len > 0.1 ? vecY / len : 0;
    return { vecX, vecY, x: -normX, y: -normY }; 
  }, [enableShaders, staticLights, cycle, isPlastic]);

  const renderedObstacles = useMemo(() => {
    return obstacles.map((obs, i) => {
        const lightInfo = getLightVector(obs.x + 0.5, obs.y + 0.5);
        const localIntensity = Math.min(1.5, Math.sqrt(lightInfo.vecX**2 + lightInfo.vecY**2) / 4);
        return (
            <Obstacle 
                key={`obs-${i}`}
                x={obs.x}
                y={obs.y}
                isRTX={isRTX}
                isPlastic={isPlastic}
                lightVector={lightInfo}
                shadowIntensity={settings.shadowIntensity * localIntensity}
            />
        );
    });
  }, [obstacles, isRTX, isPlastic, getLightVector, settings.shadowIntensity]);

  const renderEnemy = (enemy: Enemy, pos: {x:number, y:number}) => {
    const commonClasses = "absolute transform -translate-x-1/2 -translate-y-1/2 will-change-transform";
    const bars = (
        <div className="absolute -top-5 left-1/2 -translate-x-1/2 w-5 flex flex-col gap-[1px] z-30 pointer-events-none">
            {enemy.maxShield > 0 && (
                <div className="h-1 bg-black border border-black/50 shadow-sm relative">
                    <div className="h-full bg-cyan-400" style={{ width: `${Math.max(0, (enemy.shield / enemy.maxShield) * 100)}%` }} />
                </div>
            )}
            <div className="h-1 bg-black border border-black/50 shadow-sm relative">
                <div className="h-full bg-gradient-to-r from-retro-red to-orange-500" style={{ width: `${Math.max(0, (enemy.health / enemy.maxHealth) * 100)}%` }} />
            </div>
        </div>
    );
    const shadowStyle = isRTX 
        ? { filter: `drop-shadow(${2 * settings.shadowIntensity}px ${2 * settings.shadowIntensity}px 2px rgba(0,0,0,${0.6 * settings.shadowIntensity}))` }
        : (isPlastic ? { filter: `drop-shadow(2px 2px 1px rgba(0,0,0,0.2))` } : {}); 
        
    const materialStyle = isRTX ? {
      boxShadow: 'inset 0 0 5px rgba(0,0,0,0.9), inset 1px 1px 1px rgba(255,255,255,0.2)'
    } : (isPlastic ? {
        boxShadow: 'inset -2px -2px 4px rgba(0,0,0,0.2), inset 1px 1px 2px rgba(255,255,255,0.6)',
    } : {});

    let body = null;
    switch (enemy.type) {
      case EnemyType.DRONE:
        body = (
           <div className={`relative w-4 h-4 rotate-45 rounded-sm ${isRTX ? 'bg-[#a3283e] border border-black' : (isPlastic ? 'bg-red-500' : 'bg-retro-red border border-black')}`} style={materialStyle}>
              {isRTX && <div className="absolute inset-0 bg-gradient-to-tr from-transparent to-white/20 mix-blend-overlay" />}
              {isPlastic && <div className="absolute top-0.5 left-0.5 w-1.5 h-1.5 bg-white rounded-full opacity-60 blur-[0.5px]" />}
              {!isPlastic && !isRTX && <div className="absolute top-0 left-0 w-full h-[1px] bg-white/40" />}
           </div>
        );
        break;
      case EnemyType.TANK:
        body = (
           <div className={`relative w-5 h-5 rounded-sm ${isRTX ? 'bg-[#23587d] border border-black' : (isPlastic ? 'bg-blue-600 rounded-md' : 'bg-retro-blue border border-black')}`} style={materialStyle}>
               {isRTX && <MaterialOverlay />}
               {isPlastic && <div className="absolute top-0.5 left-0.5 w-2 h-2 bg-white rounded-full opacity-50 blur-[1px]" />}
               <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-black/40 border border-black/50" />
           </div>
        );
        break;
      case EnemyType.BOSS:
        body = (
            <div className={`relative w-8 h-8 flex items-center justify-center ${isRTX ? 'bg-[#e0e0e0] border-2 border-black' : (isPlastic ? 'bg-slate-100 rounded-lg shadow-inner' : 'bg-white border-2 border-black')}`} style={materialStyle}>
               {isPlastic && <div className="absolute top-1 left-1 w-3 h-2 bg-white rounded-full opacity-90 blur-[1px]" />}
               <div className="w-5 h-5 bg-retro-red border border-black shadow-inner" />
            </div>
        );
        break;
    }
    return (
        <div className={commonClasses} style={shadowStyle}>
            {!isRTX && !isPlastic && (
                <div className="absolute top-1 left-1 w-full h-full bg-black/30 pointer-events-none rounded-sm -z-10" />
            )}
            {enemy.isLockedOn && (
               <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[160%] h-[160%] animate-spin-reverse-slow z-50 pointer-events-none">
                  <ScanEye size={24} className="text-red-500 opacity-80" strokeWidth={3} />
               </div>
            )}
            {bars}
            {body}
        </div>
    );
  };

  const renderProjectile = (proj: any) => {
    const dx = proj.targetPos.x - proj.start.x;
    const dy = proj.targetPos.y - proj.start.y;
    const angle = Math.atan2(dy, dx) * (180 / Math.PI);
    const legacyHeadStyle = { boxShadow: '1px 1px 0px rgba(0,0,0,0.5)' };

    const isGlock = proj.isGlockShot;
    const glockStyle = isGlock ? { 
        filter: 'drop-shadow(0 0 6px red) saturate(200%) hue-rotate(-20deg)', 
        transform: 'scale(1.8)',
        zIndex: 100
    } : {};

    if (proj.isCluster) {
        const arcHeight = 50 * Math.sin(proj.progress * Math.PI); 
        return (
            <div className="absolute transform -translate-x-1/2 -translate-y-1/2"
                style={{ 
                    transform: `translate(-50%, calc(-50% - ${arcHeight}px))` 
                }}
            >
                <div className={`w-1.5 h-1.5 rounded-full ${enableShaders ? 'bg-orange-400 shadow-[0_0_5px_orange]' : 'bg-retro-orange border border-black'}`} />
            </div>
        );
    }
    
    return (
      <div style={glockStyle} className={isGlock ? "relative z-10" : ""}>
            {(() => {
                switch (proj.type) {
                case TowerType.TURRET:
                    return (
                        <div className="relative">
                            {isPlastic ? (
                            <div className="relative w-2 h-2 rounded-full bg-sky-400 shadow-[inset_-1px_-1px_2px_rgba(0,0,0,0.3),inset_1px_1px_2px_rgba(255,255,255,0.8)]">
                                <div className="absolute top-0.5 left-0.5 w-1 h-1 bg-white rounded-full opacity-80" />
                            </div>
                            ) : (
                                <>
                                    <div className={`absolute top-1/2 right-0 -translate-y-1/2 h-[2px] origin-right ${enableShaders ? 'bg-white/50' : 'bg-white/30'} ${isGlock ? 'bg-red-500 w-[30px]' : ''}`}
                                        style={{ width: isGlock ? '28px' : '20px', transform: `rotate(${angle}deg)` }} />
                                    {enableShaders ? (
                                    <div className="relative w-1.5 h-1.5 bg-white">
                                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 rounded-full"
                                            style={{ 
                                                background: `radial-gradient(circle, ${isGlock ? 'rgba(255,0,0,0.9)' : 'rgba(65,166,246,0.8)'} 0%, transparent 70%)`,
                                                opacity: 0.8 * settings.bloomStrength * cycle.bloomBoost
                                            }} />
                                    </div>
                                    ) : (
                                    <div className={`w-1.5 h-1.5 border ${isGlock ? 'bg-red-600' : 'bg-retro-cyan'} border-black`} style={legacyHeadStyle} />
                                    )}
                                </>
                            )}
                        </div>
                    );
                case TowerType.SNIPER:
                    return (
                    <div className="relative">
                        <div className={`absolute top-1/2 right-0 -translate-y-1/2 h-[1px] origin-right ${isPlastic ? 'bg-lime-400 opacity-80' : (enableShaders ? 'bg-[#a7f070]' : 'bg-retro-green')}`}
                            style={{ width: '80px', transform: `rotate(${angle}deg)`, opacity: isPlastic ? 0.8 : 0.6 }} />
                        {enableShaders ? (
                            <div className={`w-0.5 h-6 ${isPlastic ? 'bg-white/80' : 'bg-white'} relative`} style={{ transform: `rotate(${angle + 90}deg)` }}>
                            {!isPlastic && (
                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-8 rounded-full"
                                        style={{ 
                                            background: 'radial-gradient(ellipse, rgba(167,240,112,0.8) 0%, transparent 70%)',
                                            opacity: 0.8 * settings.bloomStrength * cycle.bloomBoost
                                        }} />
                            )}
                            </div>
                        ) : (
                            <div className="w-0.5 h-3 bg-retro-green border-x border-black" 
                                style={{ transform: `rotate(${angle + 90}deg)`, ...legacyHeadStyle }} />
                        )}
                    </div>
                    );
                case TowerType.BLASTER:
                    const arcHeight = 120 * Math.sin(proj.progress * Math.PI);
                    const scale = 0.8 + Math.sin(proj.progress * Math.PI) * 0.5;
                    const spin = Math.floor(proj.progress * 8) * 45; 
                    return (
                    <>
                        <div 
                            className="absolute transform -translate-x-1/2 -translate-y-1/2 bg-black/40 rounded-full"
                            style={{ 
                                width: `${12 * (1 - Math.sin(proj.progress * Math.PI) * 0.4)}px`,
                                height: `${8 * (1 - Math.sin(proj.progress * Math.PI) * 0.4)}px`
                            }}
                        />
                        <div className="absolute transform -translate-x-1/2 -translate-y-1/2"
                            style={{ transform: `translate(-50%, calc(-50% - ${arcHeight}px)) scale(${scale})` }}
                        >
                            {enableShaders && !isPlastic && (
                                <div className="absolute inset-0 rounded-full" 
                                    style={{ 
                                        background: 'radial-gradient(circle, rgba(255,100,255,0.8) 0%, transparent 70%)',
                                        transform: 'scale(2.5)',
                                        opacity: 0.7 * settings.bloomStrength * cycle.bloomBoost
                                    }} 
                                />
                            )}
                            <div 
                                className={`w-3 h-3 ${isPlastic ? 'bg-fuchsia-500 rounded-full shadow-[inset_-2px_-2px_4px_rgba(0,0,0,0.3)]' : (enableShaders ? 'bg-[#ff80ff] border border-white' : 'bg-retro-purple border border-black')}`}
                                style={{ 
                                    transform: `rotate(${spin}deg)`,
                                    ...(!enableShaders ? legacyHeadStyle : {})
                                }}
                            >
                                {isPlastic && <div className="absolute top-0.5 left-0.5 w-1 h-1 bg-white rounded-full opacity-90" />}
                            </div>
                        </div>
                    </>
                    );
                default: return <div className="w-1 h-1 bg-white" />;
                }
            })()}
        </div>
    );
  };

  const renderRange = () => {
    if (!selectedTowerInstance) return null;
    const def = TOWER_DEFS[selectedTowerInstance.type];
    let bonusRange = 0;
    const loadout = gameState.towerLoadouts[selectedTowerInstance.type];
    if (loadout) {
         loadout.forEach((gear, idx) => {
             if (gear && def.slots[idx] === gear.size) {
                 if (!gear.restrictedTo || gear.restrictedTo === selectedTowerInstance.type) {
                      gear.stats.forEach(s => {
                          if (s.type === 'RANGE') bonusRange += s.value;
                      });
                 }
             }
         });
    }
    const range = Math.max(1, def.range + bonusRange);
    const rangeSq = range * range;
    if (range <= 0) return null;
    const tX = selectedTowerInstance.position.x;
    const tY = selectedTowerInstance.position.y;
    const cx = tX + 0.5;
    const cy = tY + 0.5;
    const minX = Math.max(0, Math.floor(tX - range));
    const maxX = Math.min(width - 1, Math.ceil(tX + range));
    const minY = Math.max(0, Math.floor(tY - range));
    const maxY = Math.min(height - 1, Math.ceil(tY + range));
    const halfCell = CELL_SIZE / 2;
    const rangeHighlights = [];
    for (let y = minY; y <= maxY; y++) {
      for (let x = minX; x <= maxX; x++) {
        const quads = [
           { dx: 0, dy: 0, cx: x + 0.25, cy: y + 0.25 },
           { dx: halfCell, dy: 0, cx: x + 0.75, cy: y + 0.25 },
           { dx: 0, dy: halfCell, cx: x + 0.25, cy: y + 0.75 },
           { dx: halfCell, dy: halfCell, cx: x + 0.75, cy: y + 0.75 }
        ];
        quads.forEach((q, i) => {
           const distSq = (q.cx - cx)**2 + (q.cy - cy)**2;
           if (distSq <= rangeSq) {
               rangeHighlights.push(
                 <div key={`rng-${x}-${y}-${i}`} className={`absolute pointer-events-none z-10 ${enableShaders ? 'bg-white/5' : 'bg-white/20'}`}
                   style={{ 
                       left: `${x * CELL_SIZE + q.dx}px`, 
                       top: `${y * CELL_SIZE + q.dy}px`, 
                       width: `${halfCell}px`, 
                       height: `${halfCell}px`,
                       boxShadow: 'inset 0 0 1px rgba(255,255,255,0.1)'
                   }}
                 />
               );
           }
        });
      }
    }
    return rangeHighlights;
  };

  const backgroundGrid = useMemo(() => (
    <StaticBackground 
      onCellClick={onCellClick} width={width} height={height} path={path} obstacles={obstacles} 
      isRTX={isRTX} isPlastic={isPlastic} shadowIntensity={settings.shadowIntensity}
    />
  ), [onCellClick, width, height, path, obstacles, isRTX, isPlastic, settings.shadowIntensity]);

  const containerClass = isPlastic 
      ? 'relative border-4 border-indigo-900 shadow-xl isolate overflow-hidden bg-indigo-800'
      : (isRTX ? 'relative border-4 border-retro-gray shadow-retro isolate overflow-hidden bg-[#15161c]' : 'relative border-4 border-retro-gray shadow-retro isolate overflow-hidden bg-[#1a1c2c]');

  return (
    <div 
      className={containerClass}
      style={{ width: width * CELL_SIZE, height: height * CELL_SIZE }}
    >
      {backgroundGrid}
      {renderedObstacles}
      
      {isRTX && (
          <div className="absolute inset-0 pointer-events-none z-0 mix-blend-screen opacity-40">
              {gameState.towers.map(tower => (
                  <div key={`ref-t-${tower.id}`} 
                       className="absolute bg-current blur-md rounded-full transform scale-y-[-0.6] translate-y-4"
                       style={{
                           left: `${tower.position.x * CELL_SIZE}px`,
                           top: `${tower.position.y * CELL_SIZE}px`,
                           width: `${CELL_SIZE}px`,
                           height: `${CELL_SIZE}px`,
                           color: TOWER_DEFS[tower.type].color.replace('bg-', 'text-').replace('retro-', ''),
                           background: 'currentColor',
                           opacity: settings.bloomStrength * 0.8 * cycle.bloomBoost
                       }} 
                  />
              ))}
              {gameState.projectiles.map(proj => {
                  const curX = proj.start.x + (proj.targetPos.x - proj.start.x) * proj.progress;
                  const curY = proj.start.y + (proj.targetPos.y - proj.start.y) * proj.progress;
                  return (
                    <div key={`ref-p-${proj.id}`}
                         className="absolute bg-current blur-[2px] rounded-full transform scale-y-[-0.6] translate-y-2"
                         style={{
                             left: `${curX * CELL_SIZE}px`,
                             top: `${curY * CELL_SIZE}px`,
                             width: `${CELL_SIZE}px`,
                             height: `${CELL_SIZE}px`,
                             color: proj.color.replace('bg-', 'text-').replace('retro-', ''),
                             background: 'currentColor',
                             opacity: settings.bloomStrength * 0.6 * cycle.bloomBoost
                         }}
                    />
                  )
              })}
          </div>
      )}

      {isRTX && (
          <>
            <div className="absolute inset-0 z-0 pointer-events-none opacity-10 mix-blend-overlay"
                style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.7'/%3E%3C/svg%3E")`,
                    backgroundSize: '200px 200px'
                }} 
            />
            <div 
                className="absolute inset-0 z-0 pointer-events-none transition-colors duration-[2000ms]"
                style={{ backgroundColor: cycle.ambientColor, mixBlendMode: 'multiply' }} 
            />

            <div className="absolute inset-0 pointer-events-none z-0">
                {gameState.towers.map(tower => {
                    const def = TOWER_DEFS[tower.type];
                    let gradient = '';
                    let opacity = 0.5;

                    switch (tower.type) {
                        case TowerType.TURRET:
                            gradient = `radial-gradient(circle, #3388ff 0%, transparent 70%)`;
                            opacity = 0.6 * settings.bloomStrength * cycle.bloomBoost; 
                            break;
                        case TowerType.SNIPER:
                            gradient = `radial-gradient(circle, #66ff33 0%, transparent 70%)`;
                            opacity = 0.6 * settings.bloomStrength * cycle.bloomBoost;
                            break;
                        case TowerType.BLASTER:
                            gradient = `radial-gradient(circle, #ff55ff 0%, transparent 70%)`;
                            opacity = 0.5 * settings.bloomStrength * cycle.bloomBoost; 
                            break;
                        case TowerType.MINER:
                            gradient = `radial-gradient(circle, #ffcc00 0%, transparent 70%)`;
                            opacity = 0.5 * settings.bloomStrength * cycle.bloomBoost;
                            break;
                        default:
                            gradient = `radial-gradient(circle, #333 0%, transparent 70%)`;
                            opacity = 0.4 * settings.bloomStrength * cycle.bloomBoost;
                    }

                    return (
                        <div key={`light-${tower.id}`} className="absolute rounded-full transform -translate-x-1/2 -translate-y-1/2"
                            style={{
                                left: `${(tower.position.x + 0.5) * CELL_SIZE}px`,
                                top: `${(tower.position.y + 0.5) * CELL_SIZE}px`,
                                width: `${def.lightRadius * CELL_SIZE * 2.5 * settings.lightPower}px`,
                                height: `${def.lightRadius * CELL_SIZE * 2.5 * settings.lightPower}px`,
                                background: gradient,
                                opacity: opacity,
                                mixBlendMode: 'color-dodge'
                            }}
                        />
                    );
                })}
            </div>
          </>
      )}
      
      {isPlastic && (
          <div className="absolute inset-0 pointer-events-none z-[60]" style={{ opacity: 0.15, mixBlendMode: 'overlay' }}>
              <div className="w-full h-full bg-gradient-to-b from-white to-black" />
          </div>
      )}

      {renderRange()}

      {gameState.effects && gameState.effects.map((effect, i) => {
        if (effect.type === 'EXPLOSION') {
           const lifeRatio = effect.life / effect.maxLife;
           const cx = effect.x;
           const cy = effect.y;
           
           const isBlaster = effect.color === 'bg-retro-purple';
           // Blaster radius needs to be slightly larger visually to cover full cells nicely, 
           // but using quadrant rendering we can be more precise.
           const visualRadius = isBlaster ? Math.max(effect.radius, 1.5) : effect.radius; 
           const rangeSq = visualRadius * visualRadius;
           
           const minX = Math.floor(cx - visualRadius);
           const maxX = Math.ceil(cx + visualRadius);
           const minY = Math.floor(cy - visualRadius);
           const maxY = Math.ceil(cy + visualRadius);
           const halfCell = CELL_SIZE / 2;
           
           const cells = [];
           
           // Unified Quadrant Rendering for cleaner circular look on grid
           for(let y=minY; y<=maxY; y++) {
               for(let x=minX; x<=maxX; x++) {
                   if (x >= 0 && x < width && y >= 0 && y < height) {
                       const quads = [
                           { dx: 0, dy: 0, qcx: x + 0.25, qcy: y + 0.25 },
                           { dx: halfCell, dy: 0, qcx: x + 0.75, qcy: y + 0.25 },
                           { dx: 0, dy: halfCell, qcx: x + 0.25, qcy: y + 0.75 },
                           { dx: halfCell, dy: halfCell, qcx: x + 0.75, qcy: y + 0.75 }
                       ];
                       
                       quads.forEach((q, qIndex) => {
                           // Standard circle equation: (x - center_x)^2 + (y - center_y)^2 <= r^2
                           let renderQuad = false;
                           
                           if (effect.pattern === 'PLUS_SMALL') {
                               // 5-tile quarter grid (Plus shape in quarter-grid space)
                               // Convert both effect center and quadrant center to "quarter cell grid" coordinates
                               // Multiply by 2 and floor
                               const gx = Math.floor(cx * 2);
                               const gy = Math.floor(cy * 2);
                               const qx = Math.floor(q.qcx * 2);
                               const qy = Math.floor(q.qcy * 2);
                               
                               // Check Manhattan distance <= 1
                               const manhattan = Math.abs(qx - gx) + Math.abs(qy - gy);
                               if (manhattan <= 1) renderQuad = true;
                           } else {
                               const distSq = (q.qcx - cx)**2 + (q.qcy - cy)**2;
                               if (distSq <= rangeSq) renderQuad = true;
                           }
                           
                           if (renderQuad) {
                               let cellColor = effect.color;
                               let opacity = lifeRatio * (enableShaders ? 0.8 : 0.6);

                               if (isBlaster) {
                                   const distSq = (q.qcx - cx)**2 + (q.qcy - cy)**2;
                                   const dist = Math.sqrt(distSq);
                                   const ratio = dist / visualRadius;
                                   // Gradient Logic: Inner Red (60%), Outer Orange
                                   cellColor = ratio < 0.6 ? 'bg-retro-red' : 'bg-retro-orange';
                                   // Blaster explosions are brighter
                                   opacity = lifeRatio * 0.9;
                               }

                               cells.push(
                                   <div key={`exp-${i}-${x}-${y}-${qIndex}`} 
                                       className={`absolute z-20 pointer-events-none ${cellColor} ${enableShaders ? 'mix-blend-screen' : ''}`}
                                       style={{
                                           left: `${x * CELL_SIZE + q.dx}px`,
                                           top: `${y * CELL_SIZE + q.dy}px`,
                                           width: `${halfCell}px`,
                                           height: `${halfCell}px`,
                                           opacity: opacity,
                                           boxShadow: 'inset 0 0 1px rgba(0,0,0,0.1)'
                                       }}
                                   />
                               );
                           }
                       });
                   }
               }
           }
           
           return <React.Fragment key={`${effect.id}-${i}`}>{cells}</React.Fragment>;
        }
        return null;
      })}

      {gameState.towers.map(tower => {
         const rotation = tower.rotation || 0;
         const isSelected = tower.id === selectedTowerId;
         const lightInfo = getLightVector(tower.position.x + 0.5, tower.position.y + 0.5);
         const shadowStyle = !enableShaders 
            ? { boxShadow: '2px 2px 0px rgba(0,0,0,0.5)' } 
            : { }; 

         // --- ATTACK ANIMATION CALCS ---
         const ticksSinceFire = gameState.tick - tower.lastFiredTick;
         const animDuration = 6;
         const isAnimating = ticksSinceFire >= 0 && ticksSinceFire < animDuration;
         
         let recoilY = 0;
         let scaleVal = 1;
         let brightness = 1;
         
         if (isAnimating) {
             const t = ticksSinceFire / animDuration;
             const power = 1 - t; // 1.0 down to 0.0
             
             if (tower.type === TowerType.SNIPER) {
                 recoilY = 8 * power;
             } else if (tower.type === TowerType.TURRET) {
                 recoilY = 4 * power;
             } else if (tower.type === TowerType.BLASTER) {
                 scaleVal = 1 + (0.2 * power);
                 brightness = 1 + (0.5 * power); 
             } else if (tower.type === TowerType.MINER) {
                 scaleVal = 1 + (0.15 * power);
                 brightness = 1 + (0.3 * power);
             }
         }
         // ------------------------------

         return (
          <div key={tower.id} className={`absolute pointer-events-none flex items-center justify-center will-change-transform z-20 ${isSelected ? 'brightness-125' : ''}`}
            style={{
              left: `${tower.position.x * CELL_SIZE}px`, top: `${tower.position.y * CELL_SIZE}px`,
              width: `${CELL_SIZE}px`, height: `${CELL_SIZE}px`,
              ...shadowStyle
            }}
          >
              {isRTX && (
                  <div 
                    className="absolute inset-0 bg-black/60 rounded-full blur-[2px] transition-transform duration-300 -z-10"
                    style={{
                        transform: `translate(${lightInfo.vecX}px, ${lightInfo.vecY}px) scale(0.9)`
                    }}
                  />
              )}
              {isPlastic && (
                  <div 
                    className="absolute inset-0 bg-black/20 rounded-full blur-sm -z-10 transform translate-x-1 translate-y-1"
                  />
              )}

              <div className="relative w-full h-full flex items-center justify-center">
                <TowerPlate isRTX={isRTX} isPlastic={isPlastic} specularOffset={{ x: lightInfo.x, y: lightInfo.y }} />
                
                {tower.type === TowerType.MINER ? (
                  <div className={`w-[60%] h-[60%] border-2 border-black relative flex items-center justify-center z-10 ${isRTX ? 'bg-[#eec040] shadow-inner' : (isPlastic ? 'bg-amber-300 rounded-full border-0 shadow-[inset_-2px_-2px_4px_rgba(0,0,0,0.2)]' : 'bg-retro-yellow')}`}
                       style={{ transform: `scale(${scaleVal})`, filter: brightness > 1 ? `brightness(${brightness})` : undefined }}
                  >
                     {isRTX && <MaterialOverlay />}
                     {isPlastic && <div className="absolute top-1 left-2 w-3 h-2 bg-white rounded-full opacity-60 blur-[1px]" />}
                     <div className="w-full h-1 bg-black/10 absolute top-1"></div>
                     <div className="w-2 h-full bg-black/10 absolute left-1"></div>
                     <div className={`animate-pulse w-2 h-2 bg-white rounded-full ${enableShaders ? 'shadow-[0_0_5px_white]' : ''}`} style={{ opacity: settings.bloomStrength }} />
                  </div>
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center z-10" 
                       style={{ transform: `rotate(${rotation}deg) translateY(${recoilY}px) scale(${scaleVal})`, filter: brightness > 1 ? `brightness(${brightness})` : undefined }}
                  >
                       {tower.type === TowerType.TURRET && (
                         <div className="relative">
                            <div className={`absolute -top-3 left-1/2 -translate-x-1/2 ${isRTX ? 'w-2 h-5 bg-[#3a96e6] border border-black/50 shadow-inner' : (isPlastic ? 'w-2 h-6 bg-sky-500 rounded-t-sm shadow-sm' : 'w-1.5 h-4 bg-retro-cyan border border-black')}`} />
                            <div className={`w-4 h-4 border border-black relative z-10 rounded-sm ${isRTX ? 'bg-[#556677] shadow-[inset_1px_1px_0_rgba(255,255,255,0.2)]' : (isPlastic ? 'bg-slate-300 border-slate-400 rounded-md shadow-inner' : 'bg-retro-gray')}`} />
                         </div>
                       )}
                       {tower.type === TowerType.SNIPER && (
                          <div className="relative">
                            <div className={`absolute left-1/2 -translate-x-1/2 border border-black ${isRTX ? '-top-5 w-1.5 h-7 bg-[#80c050] shadow-[0_0_5px_#a7f070]' : (isPlastic ? '-top-6 w-2 h-8 bg-lime-400 rounded-full border-0 shadow-sm' : '-top-4 w-1 h-6 bg-retro-green')}`} />
                            <div className={`w-3 h-4 border border-black relative z-10 ${isRTX ? 'bg-[#222]' : (isPlastic ? 'bg-gray-800 rounded-sm' : 'bg-retro-dark')}`} />
                          </div>
                       )}
                       {tower.type === TowerType.BLASTER && (
                          <div className="relative">
                             <div className={`border border-black relative z-10 ${isRTX ? 'w-5 h-5 bg-[#4d174d] shadow-[inset_0_0_5px_rgba(255,255,255,0.2)]' : (isPlastic ? 'w-5 h-5 bg-fuchsia-500 rounded-full border-0 shadow-[inset_-2px_-2px_4px_rgba(0,0,0,0.3)]' : 'w-4 h-4 bg-retro-purple')}`} />
                             {enableShaders && <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-black/30 rounded-full" />}
                          </div>
                       )}
                  </div>
                )}
              </div>
          </div>
         );
      })}

      {gameState.enemies.map(enemy => {
        const pos = getEntityPosition(enemy.pathIndex, enemy.progress, path);
        return (
          <div key={enemy.id} className="absolute z-20 pointer-events-none will-change-transform"
            style={{
              left: `${(pos.x + 0.5) * CELL_SIZE}px`, top: `${(pos.y + 0.5) * CELL_SIZE}px`
            }}
          >
            {renderEnemy(enemy, pos)}
          </div>
        );
      })}

      {gameState.projectiles.map(proj => {
        const startX = (proj.start.x + 0.5) * CELL_SIZE; const startY = (proj.start.y + 0.5) * CELL_SIZE;
        const endX = (proj.targetPos.x + 0.5) * CELL_SIZE; const endY = (proj.targetPos.y + 0.5) * CELL_SIZE;
        const curX = startX + (endX - startX) * proj.progress; const curY = startY + (endY - startY) * proj.progress;
        return (
          <div key={proj.id} className="absolute z-10 pointer-events-none will-change-transform"
            style={{ left: `${curX}px`, top: `${curY}px` }}
          >
            {renderProjectile(proj)}
          </div>
        );
      })}

      {gameState.floatingTexts.map(ft => (
        <div key={ft.id} className={`absolute ${enableShaders ? 'text-[10px]' : 'text-[8px]'} font-bold z-30 pointer-events-none ${ft.color}`}
          style={{
            left: `${(ft.x + 0.5) * CELL_SIZE}px`, top: `${(ft.y + 0.5) * CELL_SIZE}px`,
            transform: 'translate(-50%, -50%)', opacity: ft.life > 5 ? 1 : ft.life / 5,
            textShadow: '2px 2px 0px #000', filter: 'drop-shadow(0 0 2px black)'
          }}
        >
          {ft.text}
        </div>
      ))}
      
      <div className="absolute inset-0 pointer-events-none z-50 select-none overflow-hidden">
        <div className={`absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_40%,rgba(0,0,0,${enableShaders ? 0.6 * settings.shadowIntensity : 0.4})_100%)]`} />
      </div>
    </div>
  );
};

export default Grid;
