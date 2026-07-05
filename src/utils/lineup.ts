import { FieldSlot, FORMATION_TEMPLATES } from "../constants/formations";
import { POSITION_WEIGHTS } from "../constants/positions";
import { FormationKey, Player, PositionKey } from "../types";

export interface AssignedFieldSlot extends FieldSlot {
  player?: Player;
}

export const ALL_POSITIONS: PositionKey[] = ["GOL","ZAG","LD","LE","VOL","MC","MEI","PD","PE","SA","CA"];

function emptyCounts(): Record<PositionKey, number> {
  return {GOL:0, ZAG:0, LD:0, LE:0, VOL:0, MC:0, MEI:0, PD:0, PE:0, SA:0, CA:0};
}

function templateSlots(formation:FormationKey): FieldSlot[] {
  return FORMATION_TEMPLATES[formation].map((role,idx)=>({x:0, y:0, num:idx+1, role, line:0}));
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

export function scorePlayerForRole(player:Player, slotRole:PositionKey): number {
  const w = POSITION_WEIGHTS[slotRole];
  const roleRating =
    player.pac*w.pac +
    player.sho*w.sho +
    player.pas*w.pas +
    player.def*w.def +
    player.phy*w.phy +
    player.dri*w.dri;

  return roleRating * getPositionCompatibility(player.pos, slotRole);
}

export function positionStatus(player:Player|undefined, slotRole:PositionKey): {label:string;efficiency:number;colorKey:"success"|"warning"|"danger"} {
  const efficiency = slotEfficiency(player, slotRole);
  if(efficiency>=1) return {label:"Natural", efficiency, colorKey:"success"};
  if(efficiency>=0.9) return {label:"Secundaria", efficiency, colorKey:"success"};
  if(efficiency>=0.75) return {label:"Adaptado", efficiency, colorKey:"warning"};
  return {label:"Fora de posicao", efficiency, colorKey:"danger"};
}

export function assignPlayersToSlots(lineup:Player[], slots:FieldSlot[]): AssignedFieldSlot[] {
  const players = lineup.slice(0, slots.length);
  const memo = new Map<string, {score:number; picks:(number|null)[]}>();

  const countUsed = (mask:number): number => {
    let count = 0;
    for(let m=mask; m>0; m>>=1) count += m&1;
    return count;
  };

  const best = (slotIdx:number, usedMask:number): {score:number; picks:(number|null)[]} => {
    const key = `${slotIdx}:${usedMask}`;
    const cached = memo.get(key);
    if(cached) return cached;
    if(slotIdx>=slots.length) return {score:0, picks:[]};

    const remainingSlots = slots.length-slotIdx;
    const remainingPlayers = players.length-countUsed(usedMask);
    let result: {score:number; picks:(number|null)[]} = {score:-Infinity, picks:[]};

    if(remainingSlots>remainingPlayers){
      const skipped = best(slotIdx+1, usedMask);
      result = {score:skipped.score, picks:[null, ...skipped.picks]};
    }

    players.forEach((player,playerIdx)=>{
      const bit = 1<<playerIdx;
      if(usedMask&bit) return;
      const roleScore = scorePlayerForRole(player, slots[slotIdx].role);
      const exactBonus = player.pos===slots[slotIdx].role ? 8 : 0;
      const next = best(slotIdx+1, usedMask|bit);
      const candidate = {
        score: roleScore+exactBonus+next.score,
        picks: [playerIdx, ...next.picks],
      };
      if(candidate.score>result.score) result = candidate;
    });

    memo.set(key, result);
    return result;
  };

  const assignment = best(0, 0).picks;
  return slots.map((slot,idx)=>({
    ...slot,
    player: assignment[idx]===null || assignment[idx]===undefined ? undefined : players[assignment[idx] as number],
  }));
}

// Picks up to 11 players from the roster that actually fit the formation's
// explicit slot template. Each slot uses role-specific attribute weights plus
// out-of-position compatibility, so "Melhor escalacao" means best fit for
// LD/ZAG/MEI/CA etc., not simply first available by broad position.
// `existing` lets a caller top up an already-chosen partial lineup (e.g. when
// migrating an old save) without losing track of positions it already fills.
export function pickBalancedLineup(roster:Player[], formation:FormationKey, existing:Player[]=[]): Player[] {
  const targets = formationTargets(formation);
  const used = new Set(existing.map(p=>p.id));
  const lineup: Player[] = [...existing];
  const template = FORMATION_TEMPLATES[formation];

  const remainingTargets = {...targets};
  existing.forEach(p=>{
    if(remainingTargets[p.pos]>0) remainingTargets[p.pos]--;
  });

  const neededRoles: PositionKey[] = [];
  template.forEach(role=>{
    if(remainingTargets[role]>0){
      neededRoles.push(role);
      remainingTargets[role]--;
    }
  });

  const availableFor = (role:PositionKey) => roster.filter(p=>!used.has(p.id) && scorePlayerForRole(p, role)>0);
  const rolePressure = (role:PositionKey) => availableFor(role).filter(p=>p.pos===role).length || availableFor(role).length;
  neededRoles.sort((a,b)=>rolePressure(a)-rolePressure(b));

  neededRoles.forEach(role=>{
    if(lineup.length>=11) return;
    const best = availableFor(role)
      .sort((a,b)=>scorePlayerForRole(b, role)-scorePlayerForRole(a, role) || b.ovr-a.ovr)[0];
    if(best){
      lineup.push(best);
      used.add(best.id);
    }
  });

  const bestAnyRoleScore = (p:Player) => Math.max(...template.map(role=>scorePlayerForRole(p, role)));
  const remaining = roster
    .filter(p=>!used.has(p.id))
    .sort((a,b)=>bestAnyRoleScore(b)-bestAnyRoleScore(a) || b.ovr-a.ovr);

  for(const p of remaining){
    if(lineup.length>=11) break;
    if(!used.has(p.id)){ lineup.push(p); used.add(p.id); }
  }

  return assignPlayersToSlots(lineup, templateSlots(formation))
    .map(slot=>slot.player)
    .filter((player): player is Player=>!!player);
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
