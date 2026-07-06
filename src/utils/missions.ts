import { GameState, GameStats, MissionsState, MissionEntry } from "../types";
import { ACHIEVEMENTS, AchievementDef, MISSION_POOL, MISSIONS_PER_DAY, MissionDef } from "../constants/missions";
import { PRESTIGE_INCOME_PER_LEVEL } from "../constants/economy";
import { calcPower, prestigeOf } from "./balance";
import { STARTING_LEAGUE_TIER } from "./league";

export const FRESH_STATS: GameStats = {
  wins:0, titles:0, seasonsPlayed:0, playersBought:0, packsOpened:0,
  trainingsDone:0, upgradesBought:0, bestTier:STARTING_LEAGUE_TIER,
};

export function statsOf(state:GameState): GameStats {
  return state.stats ?? FRESH_STATS;
}

export function missionDef(id:string): MissionDef|undefined {
  return MISSION_POOL.find(m=>m.id===id);
}

// Deterministic small hash so everyone (and every reload) gets the same
// 3 missions for a given local day — no Math.random inside the reducer.
function hashStr(s:string): number {
  let h = 0;
  for(let i=0;i<s.length;i++) h = (h*31 + s.charCodeAt(i)) >>> 0;
  return h;
}

export function missionsForDay(dayKeyStr:string): MissionsState {
  const picked: MissionEntry[] = [];
  const used = new Set<number>();
  let h = hashStr(dayKeyStr);
  while(picked.length<MISSIONS_PER_DAY && used.size<MISSION_POOL.length){
    const idx = h % MISSION_POOL.length;
    h = (h*1103515245 + 12345) >>> 0;
    if(used.has(idx)) continue;
    used.add(idx);
    const def = MISSION_POOL[idx];
    picked.push({id:def.id, goal:def.goal, progress:0, claimed:false});
  }
  return {dayKey:dayKeyStr, entries:picked};
}

// Bump today's mission progress for every mission watching `stat`.
export function progressMissions(missions:MissionsState|undefined, stat:keyof GameStats, amount=1): MissionsState|undefined {
  if(!missions) return missions;
  let changed = false;
  const entries = missions.entries.map(e=>{
    const def = missionDef(e.id);
    if(!def || def.stat!==stat || e.claimed || e.progress>=e.goal) return e;
    changed = true;
    return {...e, progress: Math.min(e.goal, e.progress+amount)};
  });
  return changed ? {...missions, entries} : missions;
}

export function missionRewardCoins(def:MissionDef, tier:number): number {
  const mult = 1+(prestigeOf(tier)-1)*PRESTIGE_INCOME_PER_LEVEL;
  return Math.round(def.rewardCoins*mult);
}

// ---- Achievements ---------------------------------------------------------

export function achievementMet(def:AchievementDef, state:GameState): boolean {
  if(def.stat && def.goal!==undefined) return statsOf(state)[def.stat]>=def.goal;
  const legendaries = state.roster.filter(p=>p.rarity==="legendary").length;
  switch(def.special){
    case "legendaries3":  return legendaries>=3;
    case "legendaries11": return legendaries>=11;
    case "power150": return calcPower(state.lineup, state.formation, state.upgrades)>=150;
    case "power250": return calcPower(state.lineup, state.formation, state.upgrades)>=250;
    case "tier10": return statsOf(state).bestTier<=10;
    case "tier1":  return statsOf(state).bestTier<=1;
    default: return false;
  }
}

export function claimableAchievements(state:GameState): AchievementDef[] {
  const claimed = new Set(state.achievementsClaimed ?? []);
  return ACHIEVEMENTS.filter(a=>!claimed.has(a.id) && achievementMet(a, state));
}
