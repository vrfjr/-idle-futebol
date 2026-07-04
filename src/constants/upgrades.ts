import { UpgradeKey } from "../types";
export interface UpgradeDef { key:UpgradeKey; icon:string; label:string; desc:string; color:string; }
export const UPGRADES_DEF: UpgradeDef[] = [
  {key:"attack",  icon:"⚔", label:"Ataque",  desc:"Aumenta gols marcados",    color:"#f87171"},
  {key:"defense", icon:"◈",  label:"Defesa",  desc:"Reduz gols sofridos",      color:"#60a5fa"},
  {key:"training",icon:"◉",  label:"Treino",  desc:"Melhora atributos gerais", color:"#34d399"},
  {key:"fans",    icon:"◎",  label:"Torcida", desc:"Aumenta renda por segundo",color:"#fbbf24"},
];
