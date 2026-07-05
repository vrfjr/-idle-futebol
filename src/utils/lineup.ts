import { FieldSlot } from "../constants/formations";
import { FormationKey, Player, PositionKey } from "../types";

export interface AssignedFieldSlot extends FieldSlot {
  player?: Player;
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

export const POSITION_EFFICIENCY: Record<PositionKey, Record<PositionKey, number>> = {
  GOL: {GOL:1,    ZAG:0.55, MEI:0.55, ATA:0.50},
  ZAG: {GOL:0.55, ZAG:1,    MEI:0.75, ATA:0.60},
  MEI: {GOL:0.55, ZAG:0.78, MEI:1,    ATA:0.82},
  ATA: {GOL:0.50, ZAG:0.60, MEI:0.82, ATA:1},
};

export function slotEfficiency(player:Player|undefined, slotRole:PositionKey): number {
  if(!player) return 0;
  return POSITION_EFFICIENCY[player.pos][slotRole] ?? 0.55;
}

export function positionStatus(player:Player|undefined, slotRole:PositionKey): {label:string;efficiency:number;colorKey:"success"|"warning"|"danger"} {
  const efficiency = slotEfficiency(player, slotRole);
  if(efficiency>=1) return {label:"Natural", efficiency, colorKey:"success"};
  if(efficiency>=0.9) return {label:"Secundaria", efficiency, colorKey:"success"};
  if(efficiency>=0.75) return {label:"Adaptado", efficiency, colorKey:"warning"};
  return {label:"Fora de posicao", efficiency, colorKey:"danger"};
}

export function assignPlayersToSlots(lineup:Player[], slots:FieldSlot[]): AssignedFieldSlot[] {
  const used = new Set<string>();

  return slots.map(slot=>{
    const exact = lineup.find(p=>!used.has(p.id) && p.pos===slot.role);
    const fallback = lineup.find(p=>!used.has(p.id));
    const player = exact ?? fallback;
    if(player) used.add(player.id);
    return {...slot, player};
  });
}

// Picks up to 11 players from the roster that actually fit the formation's
// position needs (1 GOL, formation-specific ZAG/MEI/ATA counts) instead of
// just grabbing however the roster happens to be ordered — avoids ending up
// with e.g. 3 goalkeepers in a fresh starting XI purely by random luck.
// `existing` lets a caller top up an already-chosen partial lineup (e.g. when
// migrating an old save) without losing track of positions it already fills.
export function pickBalancedLineup(roster:Player[], formation:FormationKey, existing:Player[]=[]): Player[] {
  const targets = formationTargets(formation);
  const used = new Set(existing.map(p=>p.id));
  const lineup: Player[] = [...existing];

  (Object.keys(targets) as (keyof typeof targets)[]).forEach(pos=>{
    const need = targets[pos] - existing.filter(p=>p.pos===pos).length;
    if(need<=0) return;
    roster
      .filter(p=>p.pos===pos && !used.has(p.id))
      .slice(0, need)
      .forEach(p=>{ lineup.push(p); used.add(p.id); });
  });

  for(const p of roster){
    if(lineup.length>=11) break;
    if(!used.has(p.id)){ lineup.push(p); used.add(p.id); }
  }

  return lineup;
}

export function validateLineup(lineup:Player[], formation:FormationKey): string[] {
  const issues: string[] = [];
  const targets = formationTargets(formation);
  const unique = new Set(lineup.map(p=>p.id));
  if(lineup.length<11) issues.push(`Faltam ${11-lineup.length} jogador(es) em campo.`);
  if(unique.size!==lineup.length) issues.push("Ha jogador duplicado na escalacao.");
  if(!lineup.some(p=>p.pos==="GOL")) issues.push("Escalacao sem goleiro.");
  (Object.keys(targets) as PositionKey[]).forEach(pos=>{
    const have = lineup.filter(p=>p.pos===pos).length;
    if(have<targets[pos]) issues.push(`${pos}: ${have}/${targets[pos]} natural.`);
  });
  return issues;
}
