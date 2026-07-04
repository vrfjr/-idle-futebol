import { FormationKey } from "../types";
export const FORMATIONS_LIST: FormationKey[] = ["4-3-3","4-4-2","3-5-2","4-2-3-1","5-3-2"];
export const FORMATION_BONUS: Record<FormationKey,{atk:number;def:number}> = {
  "4-3-3":  {atk:1.20,def:1.00}, "4-4-2":  {atk:1.00,def:1.15},
  "3-5-2":  {atk:1.10,def:1.00}, "4-2-3-1":{atk:1.15,def:1.10}, "5-3-2":{atk:0.90,def:1.30},
};
export interface FieldSlot { x:number; y:number; num:number; }
export function fieldLayout(formation:FormationKey, isHome:boolean, W:number, H:number): FieldSlot[] {
  const parts = formation.split("-").map(Number);
  const slots: FieldSlot[] = [{x:isHome?W*0.055:W*0.945, y:H*0.5, num:1}];
  parts.forEach((cnt,si)=>{
    const xp = isHome ? 0.17+(si+1)*(0.62/(parts.length+1)) : 0.83-(si+1)*(0.62/(parts.length+1));
    for(let i=0;i<cnt;i++) slots.push({x:W*xp, y:H*((i+1)/(cnt+1)), num:slots.length+1});
  });
  return slots;
}
