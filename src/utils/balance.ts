import { Player, Upgrades, FormationKey, PositionKey } from "../types";
import { FORMATION_BONUS, fieldLayout } from "../constants/formations";
import { assignPlayersToSlots, formationTargets, lineupCounts, slotEfficiency } from "./lineup";
import {
  UPGRADE_COST_BASE, UPGRADE_COST_GROWTH, UPGRADE_POWER_PER_LEVEL,
  FANS_INCOME_PER_LEVEL, PRESTIGE_INCOME_PER_LEVEL,
  LEGACY_INCOME_PER_POINT, LEGACY_POWER_PER_POINT,
} from "../constants/economy";

export interface PowerBreakdown {
  total:number;
  averageOvr:number;
  lineupRatio:number;
  positionFit:number;
  formationMultiplier:number;
  upgradeMultiplier:number;
  upgradesTotal:number;
  legacyMultiplier:number;
  counts:Record<PositionKey, number>;
  targets:Record<PositionKey, number>;
}

// Real per-slot efficiency average (same POSITION_EFFICIENCY table the Team
// screen shows per player as "Natural/Adaptado/Fora de posicao") — replaces an
// earlier coarse approximation that only compared position *counts* against
// the formation's needs and could disagree with what the UI told the player.
// Empty slots are excluded here on purpose: lineupMultiplier below already
// penalizes fielding fewer than 11, so this only measures fit for the players
// actually on the pitch.
export function positionFit(lineup:Player[], formation:FormationKey): number {
  const active = lineup.slice(0, 11);
  const slots = fieldLayout(formation, true, 1, 1);
  const assigned = assignPlayersToSlots(active, slots);
  const filled = assigned.filter(s=>s.player);
  if(!filled.length) return 0;
  const total = filled.reduce((sum,slot)=>sum+slotEfficiency(slot.player, slot.role), 0);
  return total/filled.length;
}

// extraMult: multiplicative hook for always-on set bonuses (see
// utils/collection.ts) so this file stays independent of roster contents.
export function calcPowerBreakdown(lineup:Player[], formation:FormationKey, upgrades:Upgrades, legacyPoints=0, extraMult=1): PowerBreakdown {
  const active = lineup.slice(0, 11);
  const averageOvr = active.length ? active.reduce((s,p)=>s+p.ovr,0)/active.length : 0;
  const f = FORMATION_BONUS[formation] ?? FORMATION_BONUS["4-3-3"];
  const formationMultiplier = (f.atk+f.def)/2;
  const upgradesTotal = upgrades.attack+upgrades.defense+upgrades.training;
  // Linear benefit per level: exponential cost buying logarithmic power made
  // every upgrade past ~10 combined levels a trap (see constants/economy.ts).
  const upgradeMultiplier = 1+upgradesTotal*UPGRADE_POWER_PER_LEVEL;
  const fit = positionFit(active, formation);
  // Wide range on purpose: fielding players out of position (e.g. extra
  // goalkeepers pushed into outfield slots) should visibly hurt real power,
  // not just shave a cosmetic percent or two.
  const fitMultiplier = 0.70 + fit*0.35;
  const lineupRatio = Math.max(0, Math.min(1, active.length/11));
  const lineupMultiplier = 0.65 + lineupRatio*0.35;
  const legacyMultiplier = 1 + Math.max(0, legacyPoints)*LEGACY_POWER_PER_POINT;
  const total = Math.round(averageOvr*formationMultiplier*upgradeMultiplier*fitMultiplier*lineupMultiplier*legacyMultiplier*Math.max(1, extraMult));

  return {
    total,
    averageOvr,
    lineupRatio,
    positionFit: fit,
    formationMultiplier,
    upgradeMultiplier,
    upgradesTotal,
    legacyMultiplier,
    counts: lineupCounts(active),
    targets: formationTargets(formation),
  };
}

export function calcPower(lineup:Player[], formation:FormationKey, upgrades:Upgrades, legacyPoints=0, extraMult=1): number {
  return calcPowerBreakdown(lineup, formation, upgrades, legacyPoints, extraMult).total;
}
export function upgCost(level:number): number {
  return Math.floor(UPGRADE_COST_BASE*Math.pow(UPGRADE_COST_GROWTH,level));
}
// prestige = divisions climbed (1 at tier 25 up to 25 at tier 1). Promotion
// feeds the idle engine so passive income stays relevant across the whole run.
export function prestigeOf(tier:number): number {
  return Math.max(1, Math.min(25, 26-Math.round(tier)));
}
export function passivePerSec(rate:number, fans:number, tier=25, legacyPoints=0, extraMult=1): number {
  const prestigeBonus = 1+(prestigeOf(tier)-1)*PRESTIGE_INCOME_PER_LEVEL;
  const legacyBonus = 1+Math.max(0, legacyPoints)*LEGACY_INCOME_PER_POINT;
  return Math.ceil(rate*(1+fans*FANS_INCOME_PER_LEVEL)*prestigeBonus*legacyBonus*Math.max(1, extraMult));
}
