import { Player, RarityKey, PositionKey, MatchResult } from "../types";
import { RARITY } from "../constants/rarity";
import { POSITION_WEIGHTS } from "../constants/positions";
import { freshName } from "./helpers";
const POSITIONS: PositionKey[] = ["GOL","ZAG","MEI","ATA"];
let _idSeed = 0;
export function makePlayer(forced?: RarityKey): Player {
  const r = Math.random()*100;
  const rarity: RarityKey = forced ?? (r<3?"legendary":r<15?"epic":r<40?"rare":"common");
  const m = RARITY[rarity].mult;
  const s = () => Math.min(99, Math.floor(22+Math.random()*22*m));
  const pos = POSITIONS[Math.floor(Math.random()*4)];
  const pac=s(), sho=s(), pas=s(), def=s(), phy=s(), dri=s();
  const w = POSITION_WEIGHTS[pos];
  const ovr = Math.floor(pac*w.pac + sho*w.sho + pas*w.pas + def*w.def + phy*w.phy + dri*w.dri);
  const price = Math.floor(ovr*m*95*(0.85+Math.random()*0.3));
  return {
    id: `p${Date.now().toString(36)}${(_idSeed++).toString(36)}`,
    name: freshName(), pos, rarity, pac, sho, pas, def, phy, dri, ovr, price,
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
