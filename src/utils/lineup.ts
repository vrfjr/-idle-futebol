import { FieldSlot } from "../constants/formations";
import { FormationKey, Player } from "../types";
import { formationTargets } from "./balance";

export interface AssignedFieldSlot extends FieldSlot {
  player?: Player;
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
