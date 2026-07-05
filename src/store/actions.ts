import { Player, FormationKey, UpgradeKey, GameState, LeagueState, MatchResult } from "../types";
export const PASSIVE_INCOME  = "PASSIVE_INCOME"  as const;
export const BUY_PLAYER      = "BUY_PLAYER"      as const;
export const SELL_PLAYER     = "SELL_PLAYER"     as const;
export const TOGGLE_SQUAD    = "TOGGLE_SQUAD"    as const;
export const UPGRADE         = "UPGRADE"         as const;
export const REFRESH_MARKET  = "REFRESH_MARKET"  as const;
export const BUY_PACK        = "BUY_PACK"        as const;
export const PURCHASE_STORE_OFFER = "PURCHASE_STORE_OFFER" as const;
export const ADD_REWARD      = "ADD_REWARD"      as const;
export const SET_FORMATION   = "SET_FORMATION"   as const;
export const SET_LINEUP      = "SET_LINEUP"      as const;
export const RESOLVE_ROUND   = "RESOLVE_ROUND"   as const;
export const SET_TEAM_IDENTITY = "SET_TEAM_IDENTITY" as const;
export const UNLOCK_SPEED_3X = "UNLOCK_SPEED_3X" as const;
export const CLEAR_OFFLINE_REWARD = "CLEAR_OFFLINE_REWARD" as const;
export const LOAD            = "LOAD"            as const;

export type GameAction =
  | {type:typeof PASSIVE_INCOME; amount:number}
  | {type:typeof BUY_PLAYER;     player:Player}
  | {type:typeof SELL_PLAYER;    player:Player}
  | {type:typeof TOGGLE_SQUAD;   player:Player}
  | {type:typeof UPGRADE;        key:UpgradeKey}
  | {type:typeof REFRESH_MARKET; market:Player[]}
  | {type:typeof BUY_PACK;       players:Player[]; cost:number}
  | {type:typeof PURCHASE_STORE_OFFER; diamonds:number; removeAds?:boolean}
  | {type:typeof ADD_REWARD;     coins:number; diamonds:number}
  | {type:typeof SET_FORMATION;  formation:FormationKey}
  | {type:typeof SET_LINEUP;     lineup:Player[]}
  | {type:typeof RESOLVE_ROUND;  league:LeagueState; result:MatchResult; reward:number; diamondReward:number}
  | {type:typeof SET_TEAM_IDENTITY; name:string; color:string; diamondCost?:number; markNameChange?:boolean; markColorChange?:boolean}
  | {type:typeof UNLOCK_SPEED_3X; cost:number}
  | {type:typeof CLEAR_OFFLINE_REWARD}
  | {type:typeof LOAD;           payload:Partial<GameState>; loadedAt:number};
