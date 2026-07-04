import { Player, Upgrades, FormationKey } from "../types";
import { FORMATION_BONUS } from "../constants/formations";
export function calcPower(lineup:Player[], formation:FormationKey, upgrades:Upgrades): number {
  if(!lineup.length) return 50;
  const avg = lineup.reduce((s,p)=>s+p.ovr,0)/lineup.length;
  const f = FORMATION_BONUS[formation] ?? FORMATION_BONUS["4-3-3"];
  // Logarithmic scaling so upgrades don't snowball
  const upg = Math.log1p(upgrades.attack+upgrades.defense+upgrades.training)*0.25;
  return Math.round(avg*f.atk*(1+upg));
}
export function upgCost(level:number): number {
  return Math.floor(500*Math.pow(1.7,level));
}
export function passivePerSec(rate:number, fans:number): number {
  return Math.ceil(rate*(1+fans*0.4));
}
