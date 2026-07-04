import { RarityKey } from "../types";

export interface PackTag { label:string; c:string; }
export interface PackDef {
  key:string; title:string; cost:number; accent:string;
  desc:string; tags:PackTag[]; rarities:RarityKey[]|null; count?:number;
}

export const PACKS: PackDef[] = [
  {key:"basic",  title:"Pack Básico",   cost:10,accent:"#6b7280",
   desc:"3 jogadores de qualquer raridade",tags:[{label:"×3",c:"#6b7280"}],rarities:null,count:3},
  {key:"premium",title:"Pack Premium",  cost:25,accent:"#38bdf8",
   desc:"2 Raros + 1 Épico garantidos",tags:[{label:"Raro ×2",c:"#38bdf8"},{label:"Épico ×1",c:"#a78bfa"}],
   rarities:["rare","rare","epic"]},
  {key:"legendary",title:"Pack Lendário",cost:60,accent:"#fbbf24",
   desc:"1 Épico + 1 Lendário garantidos",tags:[{label:"Épico ×1",c:"#a78bfa"},{label:"Lendário ×1",c:"#fbbf24"}],
   rarities:["epic","legendary"]},
];
