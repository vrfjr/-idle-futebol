import { LucideIcon, Swords, ShieldCheck, Dumbbell, Heart } from "lucide-react";
import { UpgradeKey } from "../types";
export interface UpgradeDef { key:UpgradeKey; icon:LucideIcon; label:string; desc:string; color:string; }
export const UPGRADES_DEF: UpgradeDef[] = [
  {key:"attack",  icon:Swords,      label:"Ataque",  desc:"Aumenta gols marcados",    color:"#f87171"},
  {key:"defense", icon:ShieldCheck, label:"Defesa",  desc:"Reduz gols sofridos",      color:"#60a5fa"},
  {key:"training",icon:Dumbbell,    label:"Treino",  desc:"Melhora atributos gerais", color:"#34d399"},
  {key:"fans",    icon:Heart,       label:"Torcida", desc:"Aumenta renda por segundo",color:"#fbbf24"},
];
