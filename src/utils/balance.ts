import { Player, Upgrades, FormationKey, PositionKey } from "../types";
import { FORMATION_BONUS, fieldLayout } from "../constants/formations";
import { assignPlayersToSlots, formationTargets, lineupCounts, slotEfficiency } from "./lineup";

export interface PowerBreakdown {
  total:number;
  averageOvr:number;
  lineupRatio:number;
  positionFit:number;
  formationMultiplier:number;
  upgradeMultiplier:number;
  upgradesTotal:number;
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

export function calcPowerBreakdown(lineup:Player[], formation:FormationKey, upgrades:Upgrades): PowerBreakdown {
  const active = lineup.slice(0, 11);
  const averageOvr = active.length ? active.reduce((s,p)=>s+p.ovr,0)/active.length : 0;
  const f = FORMATION_BONUS[formation] ?? FORMATION_BONUS["4-3-3"];
  const formationMultiplier = (f.atk+f.def)/2;
  const upgradesTotal = upgrades.attack+upgrades.defense+upgrades.training;
  const upgradeMultiplier = 1+Math.log1p(upgradesTotal)*0.25;
  const fit = positionFit(active, formation);
  // Wide range on purpose: fielding players out of position (e.g. extra
  // goalkeepers pushed into outfield slots) should visibly hurt real power,
  // not just shave a cosmetic percent or two.
  const fitMultiplier = 0.70 + fit*0.35;
  const lineupRatio = Math.max(0, Math.min(1, active.length/11));
  const lineupMultiplier = 0.65 + lineupRatio*0.35;
  const total = Math.round(averageOvr*formationMultiplier*upgradeMultiplier*fitMultiplier*lineupMultiplier);

  return {
    total,
    averageOvr,
    lineupRatio,
    positionFit: fit,
    formationMultiplier,
    upgradeMultiplier,
    upgradesTotal,
    counts: lineupCounts(active),
    targets: formationTargets(formation),
  };
}

export function calcPower(lineup:Player[], formation:FormationKey, upgrades:Upgrades): number {
  return calcPowerBreakdown(lineup, formation, upgrades).total;
}
export function upgCost(level:number): number {
  return Math.floor(500*Math.pow(1.7,level));
}
export function passivePerSec(rate:number, fans:number): number {
  return Math.ceil(rate*(1+fans*0.4));
}
