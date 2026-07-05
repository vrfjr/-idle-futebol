import { FieldSlot } from "../constants/formations";
import { Player } from "../types";

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
