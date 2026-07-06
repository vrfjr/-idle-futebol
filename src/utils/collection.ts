import { Player, SeasonPassState, LeagueState } from "../types";
import { COLLECTION_BONUSES, CollectionBonusDef, PASS_TIERS, PRESTIGE_INCOME_PER_LEVEL } from "../constants/economy";
import { prestigeOf } from "./balance";

// ---- Collection set bonuses (always-on, no claim step) --------------------

export function collectionActive(def:CollectionBonusDef, roster:Player[]): boolean {
  return roster.filter(p=>p.rarity===def.rarity).length>=def.count;
}

export interface CollectionMultipliers {
  income: number;
  power: number;
}

export function collectionMultipliers(roster:Player[]): CollectionMultipliers {
  let income = 1, power = 1;
  for(const def of COLLECTION_BONUSES){
    if(collectionActive(def, roster)){
      income += def.incomeBonus;
      power += def.powerBonus;
    }
  }
  return {income, power};
}

// ---- Season pass -----------------------------------------------------------

export function freshPass(seasonId:string): SeasonPassState {
  return {seasonId, premium:false, claimedFree:[], claimedPremium:[]};
}

// Pass state valid for the CURRENT season (resets lazily when league rolls).
export function currentPass(pass:SeasonPassState|undefined, league:LeagueState): SeasonPassState {
  const seasonId = league.seasonId ?? "legacy-season";
  if(!pass || pass.seasonId!==seasonId) return freshPass(seasonId);
  return pass;
}

export function passTierUnlocked(tierIndex:number, league:LeagueState): boolean {
  const def = PASS_TIERS[tierIndex];
  return !!def && league.round>=def.rounds;
}

export function passCoins(baseCoins:number, tier:number): number {
  return Math.round(baseCoins*(1+(prestigeOf(tier)-1)*PRESTIGE_INCOME_PER_LEVEL));
}
