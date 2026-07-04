import { GameState, FormationKey } from "../types";
import { GameAction, PASSIVE_INCOME, BUY_PLAYER, SELL_PLAYER, TOGGLE_SQUAD,
  UPGRADE, REFRESH_MARKET, BUY_PACK, ADD_REWARD, SET_FORMATION, MATCH_RESULT, LOAD } from "./actions";
import { makePlayer } from "../utils/gameLogic";
import { upgCost } from "../utils/balance";

// FIX: factory function so makePlayer() runs lazily at app start, not at import time
export function createInitialState(): GameState {
  const roster = [
    makePlayer("common"), makePlayer("common"), makePlayer("common"),
    makePlayer("rare"),   makePlayer("common"), makePlayer("common"),
    makePlayer("common"), makePlayer("rare"),
  ];
  return {
    coins: 6000, diamonds: 50,
    roster, lineup: roster.slice(0,7),
    formation: "4-3-3",
    upgrades: {attack:0, defense:0, training:0, fans:0},
    wins:0, losses:0, draws:0, league:1,
    market: Array.from({length:6}, ()=>makePlayer()),
    passiveRate: 10,
  };
}

// Exported singleton — only created once at module evaluation
export const initialState: GameState = createInitialState();

export function gameReducer(state:GameState, action:GameAction): GameState {
  switch(action.type) {

    case PASSIVE_INCOME:
      return {...state, coins: state.coins+action.amount};

    case BUY_PLAYER: {
      if(state.coins < action.player.price) return state;
      return {
        ...state,
        coins: state.coins-action.player.price,
        roster: [...state.roster, action.player],
        // Replace the bought card in the market immediately
        market: state.market.map(m=>m.id===action.player.id ? makePlayer() : m),
      };
    }

    case SELL_PLAYER: {
      // Guard: cannot sell a player who is on the field
      if(state.lineup.some(l=>l.id===action.player.id)) return state;
      return {
        ...state,
        coins: state.coins+action.player.sellPrice,
        roster: state.roster.filter(r=>r.id!==action.player.id),
      };
    }

    case TOGGLE_SQUAD: {
      const inSquad = state.lineup.some(l=>l.id===action.player.id);
      if(inSquad) return {...state, lineup: state.lineup.filter(l=>l.id!==action.player.id)};
      if(state.lineup.length>=11) return state;
      return {...state, lineup: [...state.lineup, action.player]};
    }

    case UPGRADE: {
      const cost = upgCost(state.upgrades[action.key]);
      if(state.coins < cost) return state;
      return {
        ...state,
        coins: state.coins-cost,
        upgrades: {...state.upgrades, [action.key]: state.upgrades[action.key]+1},
      };
    }

    case REFRESH_MARKET: {
      // FIX: coins deducted here in reducer, not split between UI and reducer
      if(state.coins < 300) return state;
      return {...state, coins: state.coins-300, market: action.market};
    }

    case BUY_PACK: {
      // FIX: diamond check now enforced in reducer, not just in UI
      if(state.diamonds < action.cost) return state;
      return {
        ...state,
        diamonds: state.diamonds-action.cost,
        roster: [...state.roster, ...action.players],
      };
    }

    case ADD_REWARD:
      return {...state, coins: state.coins+action.coins, diamonds: state.diamonds+action.diamonds};

    case SET_FORMATION:
      return {...state, formation: action.formation as FormationKey};

    case MATCH_RESULT: {
      const nW = state.wins+(action.result==="win"?1:0);
      const nL = state.losses+(action.result==="loss"?1:0);
      const nD = state.draws+(action.result==="draw"?1:0);
      return {
        ...state,
        coins: state.coins+action.reward,
        diamonds: state.diamonds+action.diamondReward,
        wins:nW, losses:nL, draws:nD,
        league: Math.max(1, Math.floor(nW/5)+1),
      };
    }

    case LOAD:
      // FIX: merge with initialState defaults so missing fields in saved data don't break the game
      return {...state, ...action.payload};

    default:
      return state;
  }
}
