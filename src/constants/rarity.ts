import { RarityKey } from "../types";
export interface RarityConfig { label:string; c:string; glow:string; mult:number; bg:string; }
export const RARITY: Record<RarityKey, RarityConfig> = {
  common:    { label:"Comum",    c:"#6b7280", glow:"#4b5563", mult:1,   bg:"#111827" },
  rare:      { label:"Raro",     c:"#38bdf8", glow:"#0ea5e9", mult:2.2, bg:"#0c1a2e" },
  epic:      { label:"Épico",    c:"#a78bfa", glow:"#8b5cf6", mult:4,   bg:"#160d26" },
  legendary: { label:"Lendário", c:"#fbbf24", glow:"#f59e0b", mult:8,   bg:"#1c1000" },
};
