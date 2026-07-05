import { Player, RarityKey, PositionKey, MatchResult } from "../types";
import { RARITY } from "../constants/rarity";
import { POSITION_WEIGHTS } from "../constants/positions";
import { freshName } from "./helpers";
const POSITIONS: PositionKey[] = ["GOL","ZAG","LD","LE","VOL","MC","MEI","PD","PE","SA","CA"];
let _idSeed = 0;

function clampTier(tier:number): number {
  return Math.max(1, Math.min(25, Math.round(tier)));
}

function clamp(v:number, min:number, max:number): number {
  return Math.max(min, Math.min(max, v));
}

export function makePlayer(forced?: RarityKey, forcedPosition?: PositionKey): Player {
  const r = Math.random()*100;
  const rarity: RarityKey = forced ?? (r<3?"legendary":r<15?"epic":r<40?"rare":"common");
  const m = RARITY[rarity].mult;
  const s = () => Math.min(99, Math.floor(22+Math.random()*22*m));
  const pos = forcedPosition ?? POSITIONS[Math.floor(Math.random()*POSITIONS.length)];
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

export function marketRarityForTier(tier:number): RarityKey {
  const t = clampTier(tier);
  const r = Math.random()*100;
  if(t>=21) return r<98 ? "common" : "rare";
  if(t>=16) return r<90 ? "common" : "rare";
  if(t>=11) return r<70 ? "common" : r<96 ? "rare" : "epic";
  if(t>=6) return r<25 ? "common" : r<85 ? "rare" : "epic";
  if(t>=2) return r<4 ? "common" : r<69 ? "rare" : r<99 ? "epic" : "legendary";
  return r<55 ? "rare" : r<97 ? "epic" : "legendary";
}

export function makeMarketPlayer(tier:number): Player {
  return makePlayer(marketRarityForTier(tier));
}

export function makeMarket(tier:number, count=6): Player[] {
  return Array.from({length:count}, ()=>makeMarketPlayer(tier));
}

export interface MatchOutcomeProbabilities {
  win:number;
  draw:number;
  loss:number;
}

export function matchOutcomeProbabilities(firstPower:number, secondPower:number): MatchOutcomeProbabilities {
  const diff = clamp(firstPower, 1, 999) - clamp(secondPower, 1, 999);
  const gap = Math.abs(diff);
  const draw = clamp(0.06 + Math.exp(-gap/22)*0.18, 0.05, 0.24);
  const firstShare = 1/(1+Math.exp(-diff/13));
  const decisive = 1-draw;
  return {
    win: firstShare*decisive,
    draw,
    loss: (1-firstShare)*decisive,
  };
}

export function simulateMatch(playerPower:number, opponentPower:number): MatchResult {
  const chance = matchOutcomeProbabilities(playerPower, opponentPower);
  const roll = Math.random();
  if(roll < chance.win) return "win";
  if(roll < chance.win+chance.draw) return "draw";
  return "loss";
}
