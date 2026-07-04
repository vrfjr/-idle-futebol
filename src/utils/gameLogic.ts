import { Player, RarityKey, PositionKey, MatchResult } from "../types";
import { RARITY } from "../constants/rarity";
import { freshName } from "./helpers";
const POSITIONS: PositionKey[] = ["GOL","ZAG","MEI","ATA"];
let _idSeed = 0;
export function makePlayer(forced?: RarityKey): Player {
  const r = Math.random()*100;
  const rarity: RarityKey = forced ?? (r<3?"legendary":r<15?"epic":r<40?"rare":"common");
  const m = RARITY[rarity].mult;
  const s = () => Math.min(99, Math.floor(22+Math.random()*22*m));
  const pos = POSITIONS[Math.floor(Math.random()*4)];
  const atk=s(), def=s(), spd=s(), dbl=s();
  const ovr = Math.floor((atk+def+spd+dbl)/4);
  const price = Math.floor(ovr*m*95*(0.85+Math.random()*0.3));
  return {
    id: `p${Date.now().toString(36)}${(_idSeed++).toString(36)}`,
    name: freshName(), pos, rarity, atk, def, spd, dbl, ovr, price,
    sellPrice: Math.floor(price*(0.55+Math.random()*0.2)),
  };
}
export function simulateMatch(playerPower:number, opponentPower:number): MatchResult {
  const chance = playerPower/(playerPower+opponentPower);
  const roll = Math.random();
  if(roll < chance) return "win";
  if(roll < chance+0.13) return "draw";
  return "loss";
}
