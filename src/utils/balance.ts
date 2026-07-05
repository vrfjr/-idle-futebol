import { Player, Upgrades, FormationKey, PositionKey } from "../types";
import { FORMATION_BONUS } from "../constants/formations";

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

function emptyCounts(): Record<PositionKey, number> {
  return {GOL:0, ZAG:0, MEI:0, ATA:0};
}

export function formationTargets(formation:FormationKey): Record<PositionKey, number> {
  const parts = formation.split("-").map(Number);
  const targets = emptyCounts();
  targets.GOL = 1;
  targets.ZAG = parts[0] ?? 0;
  targets.ATA = parts[parts.length-1] ?? 0;
  targets.MEI = parts.slice(1, -1).reduce((sum,n)=>sum+n, 0);
  return targets;
}

export function lineupCounts(lineup:Player[]): Record<PositionKey, number> {
  return lineup.reduce((acc,p)=>{
    acc[p.pos]++;
    return acc;
  }, emptyCounts());
}

export function positionFit(lineup:Player[], formation:FormationKey): number {
  const counts = lineupCounts(lineup);
  const targets = formationTargets(formation);
  const matched = (Object.keys(targets) as PositionKey[])
    .reduce((sum,pos)=>sum+Math.min(counts[pos], targets[pos]), 0);
  return Math.max(0, Math.min(1, matched/11));
}

export function calcPowerBreakdown(lineup:Player[], formation:FormationKey, upgrades:Upgrades): PowerBreakdown {
  const active = lineup.slice(0, 11);
  const averageOvr = active.length ? active.reduce((s,p)=>s+p.ovr,0)/active.length : 0;
  const f = FORMATION_BONUS[formation] ?? FORMATION_BONUS["4-3-3"];
  const formationMultiplier = (f.atk+f.def)/2;
  const upgradesTotal = upgrades.attack+upgrades.defense+upgrades.training;
  const upgradeMultiplier = 1+Math.log1p(upgradesTotal)*0.25;
  const fit = positionFit(active, formation);
  const fitMultiplier = 0.90 + fit*0.15;
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
