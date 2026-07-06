import { Player } from "../types";
import { POSITION_WEIGHTS } from "../constants/positions";
import {
  TRAIN_COIN_LEVELS, TRAIN_COIN_COST_RATIO, TRAIN_COIN_COST_GROWTH,
  TRAIN_DIAMOND_BASE, TRAIN_DIAMOND_STEP, TRAIN_MAX_BY_RARITY,
} from "../constants/economy";

export type TrainingCurrency = "coins" | "diamonds";

export interface TrainingCost {
  currency: TrainingCurrency;
  amount: number;
}

export function trainingLevel(p:Player): number {
  return p.training ?? 0;
}

export function trainingCap(p:Player): number {
  return TRAIN_MAX_BY_RARITY[p.rarity] ?? TRAIN_COIN_LEVELS;
}

// Cost of the NEXT training level, or null when the player is maxed.
// First TRAIN_COIN_LEVELS levels cost coins (scaled to the card's price);
// every level beyond is diamond-only by design (paid-currency advantage).
export function nextTrainingCost(p:Player): TrainingCost|null {
  const lvl = trainingLevel(p);
  if(lvl>=trainingCap(p)) return null;
  if(lvl<TRAIN_COIN_LEVELS){
    return {
      currency: "coins",
      amount: Math.max(100, Math.round(p.price*TRAIN_COIN_COST_RATIO*Math.pow(TRAIN_COIN_COST_GROWTH, lvl))),
    };
  }
  return {
    currency: "diamonds",
    amount: TRAIN_DIAMOND_BASE + TRAIN_DIAMOND_STEP*(lvl-TRAIN_COIN_LEVELS),
  };
}

// +1 to every attribute (capped 99) and OVR recomputed from the same
// position weights makePlayer uses, so card stats and OVR never disagree.
export function applyTraining(p:Player): Player {
  const bump = (v:number)=>Math.min(99, v+1);
  const pac=bump(p.pac), sho=bump(p.sho), pas=bump(p.pas), def=bump(p.def), phy=bump(p.phy), dri=bump(p.dri);
  const w = POSITION_WEIGHTS[p.pos];
  const ovr = Math.floor(pac*w.pac + sho*w.sho + pas*w.pas + def*w.def + phy*w.phy + dri*w.dri);
  return {...p, pac, sho, pas, def, phy, dri, ovr, training: trainingLevel(p)+1};
}
