import { FieldSlot, FORMATION_TEMPLATES } from "../constants/formations";
import { FormationKey, Player, PositionKey } from "../types";

export interface AssignedFieldSlot extends FieldSlot {
  player?: Player;
}

export const ALL_POSITIONS: PositionKey[] = ["GOL","ZAG","LD","LE","VOL","MC","MEI","PD","PE","SA","CA"];

function emptyCounts(): Record<PositionKey, number> {
  return {GOL:0, ZAG:0, LD:0, LE:0, VOL:0, MC:0, MEI:0, PD:0, PE:0, SA:0, CA:0};
}

// Trivial now that formations are explicit templates (constants/formations.ts)
// instead of a "3 line-counts from the formation string" derivation — just
// count how many of each role the template actually contains.
export function formationTargets(formation:FormationKey): Record<PositionKey, number> {
  const targets = emptyCounts();
  FORMATION_TEMPLATES[formation].forEach(role=>{ targets[role]++; });
  return targets;
}

export function lineupCounts(lineup:Player[]): Record<PositionKey, number> {
  return lineup.reduce((acc,p)=>{
    acc[p.pos]++;
    return acc;
  }, emptyCounts());
}

// Where each position sits in "role space": how defensive (0) vs attacking (5)
// it plays, and which channel (-1 left, 0 center, 1 right). Out-of-position
// compatibility is then just a distance in this space — scalable to any number
// of positions without hand-writing an NxN matrix (11x11 = 121 cells) that's
// easy to leave inconsistent when a new role is added.
const ROLE_COORD: Record<PositionKey, {line:number; side:number}> = {
  GOL:{line:0,   side:0},
  ZAG:{line:1,   side:0},
  LD: {line:1.5, side:1},
  LE: {line:1.5, side:-1},
  VOL:{line:2,   side:0},
  MC: {line:3,   side:0},
  MEI:{line:4,   side:0},
  PD: {line:4,   side:1},
  PE: {line:4,   side:-1},
  SA: {line:4.5, side:0},
  CA: {line:5,   side:0},
};

export function getPositionCompatibility(playerPos:PositionKey, slotRole:PositionKey): number {
  if(playerPos===slotRole) return 1;
  // A goalkeeper playing outfield (or vice versa) is a categorically different
  // job, not just a "further away" one — kept as an extreme, explicit case
  // rather than letting the distance formula produce a merely-bad number.
  if((playerPos==="GOL") !== (slotRole==="GOL")) return 0.05;
  const a = ROLE_COORD[playerPos], b = ROLE_COORD[slotRole];
  const dist = Math.abs(a.line-b.line) + Math.abs(a.side-b.side)*0.6;
  return Math.max(0.15, Math.min(0.95, 1-dist*0.16));
}

export function slotEfficiency(player:Player|undefined, slotRole:PositionKey): number {
  if(!player) return 0;
  return getPositionCompatibility(player.pos, slotRole);
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
