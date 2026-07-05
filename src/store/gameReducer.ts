import { GameState, FormationKey } from "../types";
import { GameAction, PASSIVE_INCOME, BUY_PLAYER, SELL_PLAYER, TOGGLE_SQUAD,
  UPGRADE, REFRESH_MARKET, BUY_PACK, ADD_REWARD, SET_FORMATION, RESOLVE_ROUND,
  SET_TEAM_IDENTITY, LOAD } from "./actions";
import { makePlayer } from "../utils/gameLogic";
import { upgCost } from "../utils/balance";
import { startNewSeason } from "../utils/league";

export const PLAYER_TEAM_ID = "player";
const DEFAULT_TEAM_NAME = "Meu Time";
const DEFAULT_TEAM_COLOR = "#1d4ed8";

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
    teamName: DEFAULT_TEAM_NAME, teamColor: DEFAULT_TEAM_COLOR,
    league: startNewSeason(1, {id:PLAYER_TEAM_ID, name:DEFAULT_TEAM_NAME, color:DEFAULT_TEAM_COLOR}),
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

    case RESOLVE_ROUND:
      return {
        ...state,
        coins: state.coins+action.reward,
        diamonds: state.diamonds+action.diamondReward,
        league: action.league,
      };

    case SET_TEAM_IDENTITY:
      return {
        ...state,
        teamName: action.name,
        teamColor: action.color,
        league: {
          ...state.league,
          teams: state.league.teams.map(t=>t.isPlayer ? {...t, name:action.name, color:action.color} : t),
        },
      };

    case LOAD:
      // FIX: merge with initialState defaults so missing fields in saved data don't break the game
      return {...state, ...action.payload};

    default:
      return state;
  }
}
