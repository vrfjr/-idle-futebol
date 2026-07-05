import { FormationKey, PositionKey } from "../types";
export const FORMATIONS_LIST: FormationKey[] = ["4-3-3","4-4-2","3-5-2","4-2-3-1","5-3-2"];
export const FORMATION_BONUS: Record<FormationKey,{atk:number;def:number}> = {
  "4-3-3":  {atk:1.20,def:1.00}, "4-4-2":  {atk:1.00,def:1.15},
  "3-5-2":  {atk:1.10,def:1.00}, "4-2-3-1":{atk:1.15,def:1.10}, "5-3-2":{atk:0.90,def:1.30},
};

// Explicit position template per formation — replaces the old "split the
// formation string into 3 line-counts, first=ZAG/last=ATA/middle=MEI" scheme,
// which can't express "which of these 4 defenders is LD vs ZAG vs LE" once
// there are 11 distinct roles instead of 4. 3-5-2/5-3-2 use LD/LE as wing-backs
// rather than inventing a separate "ALA" role.
export const FORMATION_TEMPLATES: Record<FormationKey, PositionKey[]> = {
  "4-3-3":   ["GOL","LD","ZAG","ZAG","LE","VOL","MC","MC","PD","CA","PE"],
  "4-4-2":   ["GOL","LD","ZAG","ZAG","LE","MC","MC","PD","PE","CA","CA"],
  "3-5-2":   ["GOL","ZAG","ZAG","ZAG","LD","VOL","MC","MEI","LE","SA","CA"],
  "4-2-3-1": ["GOL","LD","ZAG","ZAG","LE","VOL","VOL","PD","MEI","PE","CA"],
  "5-3-2":   ["GOL","LD","ZAG","ZAG","ZAG","LE","VOL","MC","MEI","SA","CA"],
};

// Each outfield position's inherent depth (0 = hugging its own goal line, 1 =
// hugging the opponent's) and side (-1 = left touchline, 0 = center, 1 = right
// touchline). fieldLayout() derives x/y from this plus the formation template,
// instead of every formation hand-placing 11 coordinate pairs.
const ROLE_LANE: Record<Exclude<PositionKey,"GOL">, {depth:number; side:number}> = {
  ZAG: {depth:0.16, side:0},
  LD:  {depth:0.22, side:0.85},
  LE:  {depth:0.22, side:-0.85},
  VOL: {depth:0.32, side:0},
  MC:  {depth:0.46, side:0},
  MEI: {depth:0.60, side:0},
  PD:  {depth:0.66, side:0.78},
  PE:  {depth:0.66, side:-0.78},
  SA:  {depth:0.74, side:0},
  CA:  {depth:0.84, side:0},
};

function clamp(v:number, min:number, max:number): number {
  return Math.max(min, Math.min(max, v));
}

export interface FieldSlot { x:number; y:number; num:number; role:PositionKey; line:number; }

export function fieldLayout(formation:FormationKey, isHome:boolean, W:number, H:number): FieldSlot[] {
  const template = FORMATION_TEMPLATES[formation];

  const indicesByRole = new Map<PositionKey, number[]>();
  template.forEach((role,idx)=>{
    const list = indicesByRole.get(role) ?? [];
    list.push(idx);
    indicesByRole.set(role, list);
  });

  return template.map((role,idx)=>{
    if(role==="GOL"){
      return {x:isHome?W*0.055:W*0.945, y:H*0.5, num:idx+1, role, line:0};
    }

    const lane = ROLE_LANE[role];
    const depth = isHome ? lane.depth : 1-lane.depth;
    const xp = 0.09 + depth*0.82;

    // When a role repeats in a formation (e.g. two ZAG, three ZAG, two CA),
    // nudge each occurrence apart on the y axis by a fixed fraction of H per
    // step (rather than folding it into `side`, which is meaningless for
    // central roles) — keeps a comfortable gap between same-depth teammates
    // regardless of container size, so labels never overlap on the small
    // tactical-pitch preview even at 3-wide (3-5-2/5-3-2's back three).
    const occurrences = indicesByRole.get(role)!;
    const withinIdx = occurrences.indexOf(idx);
    const count = occurrences.length;
    const spreadStep = count>1 ? (withinIdx - (count-1)/2) * H*0.24 : 0;
    const y = clamp(H*0.5 + lane.side*H*0.42 + spreadStep, H*0.06, H*0.94);
    const line = Math.max(1, Math.round(lane.depth*6));

    return {x:W*xp, y, num:idx+1, role, line};
  });
}
