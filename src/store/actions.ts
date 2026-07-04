import { Player, FormationKey, UpgradeKey, GameState } from "../types";
export const PASSIVE_INCOME  = "PASSIVE_INCOME"  as const;
export const BUY_PLAYER      = "BUY_PLAYER"      as const;
export const SELL_PLAYER     = "SELL_PLAYER"     as const;
export const TOGGLE_SQUAD    = "TOGGLE_SQUAD"    as const;
export const UPGRADE         = "UPGRADE"         as const;
export const REFRESH_MARKET  = "REFRESH_MARKET"  as const;
export const BUY_PACK        = "BUY_PACK"        as const;
export const ADD_REWARD      = "ADD_REWARD"      as const;
export const SET_FORMATION   = "SET_FORMATION"   as const;
export const MATCH_RESULT    = "MATCH_RESULT"    as const;
export const LOAD            = "LOAD"            as const;

export type GameAction =
  | {type:typeof PASSIVE_INCOME; amount:number}
  | {type:typeof BUY_PLAYER;     player:Player}
  | {type:typeof SELL_PLAYER;    player:Player}
  | {type:typeof TOGGLE_SQUAD;   player:Player}
  | {type:typeof UPGRADE;        key:UpgradeKey}
  | {type:typeof REFRESH_MARKET; market:Player[]}
  | {type:typeof BUY_PACK;       players:Player[]; cost:number}
  | {type:typeof ADD_REWARD;     coins:number; diamonds:number}
  | {type:typeof SET_FORMATION;  formation:FormationKey}
  | {type:typeof MATCH_RESULT;   result:"win"|"draw"|"loss"; reward:number; diamondReward:number}
  | {type:typeof LOAD;           payload:GameState};
