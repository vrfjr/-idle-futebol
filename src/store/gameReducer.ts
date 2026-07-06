import { GameState, FormationKey, Player } from "../types";
import { GameAction, PASSIVE_INCOME, BUY_PLAYER, SELL_PLAYER, TOGGLE_SQUAD,
  UPGRADE, REFRESH_MARKET, BUY_PACK, ADD_REWARD, SET_FORMATION, SET_LINEUP, RESOLVE_ROUND,
  SET_TEAM_IDENTITY, UNLOCK_SPEED_3X, TRAIN_PLAYER, CLAIM_DAILY, PURCHASE_STORE_OFFER, CLEAR_OFFLINE_REWARD, LOAD } from "./actions";
import { makeMarket, makeMarketPlayer, makePlayer } from "../utils/gameLogic";
import { passivePerSec, upgCost } from "../utils/balance";
import { STARTING_LEAGUE_TIER, startNewSeason } from "../utils/league";
import { pickBalancedLineup } from "../utils/lineup";
import { calculateOfflineIncome } from "../utils/offlineIncome";
import { MARKET_REFRESH_COST } from "../constants/economy";
import { applyTraining, nextTrainingCost } from "../utils/training";
import { FRESH_DAILY, dailyStatus, dailyRewardFor, dayKey } from "../utils/daily";

export const PLAYER_TEAM_ID = "player";
const DEFAULT_TEAM_NAME = "Meu Time";
const DEFAULT_TEAM_COLOR = "#1d4ed8";
export const IDENTITY_CHANGE_DIAMOND_COST = 50;
// Covers exactly the 11 roles a 4-3-3 needs, plus a 3-player bench.
const STARTER_POSITIONS: Player["pos"][] = [
  "GOL", "GOL",
  "ZAG", "ZAG", "LD", "LE",
  "VOL", "MC", "MC", "MEI",
  "PD", "PE", "SA", "CA",
];
const STARTER_ROSTER_SIZE = STARTER_POSITIONS.length;
const STARTER_LINEUP_SIZE = 11;

function createStarterRoster(): Player[] {
  return STARTER_POSITIONS.map(pos=>makePlayer("common", pos));
}

function shouldRepairFreshStarterRoster(state:GameState): boolean {
  if(state.roster.length!==STARTER_ROSTER_SIZE) return false;
  if(!state.roster.every(p=>p.rarity==="common")) return false;
  if(state.league.round!==0) return false;
  if(!state.league.table.every(row=>row.played===0)) return false;

  const required = STARTER_POSITIONS.reduce((acc,pos)=>{
    acc[pos] = (acc[pos] ?? 0)+1;
    return acc;
  }, {} as Record<Player["pos"], number>);
  const counts = state.roster.reduce((acc,p)=>{
    acc[p.pos] = (acc[p.pos] ?? 0)+1;
    return acc;
  }, {} as Record<Player["pos"], number>);

  return STARTER_POSITIONS.some(pos=>(counts[pos] ?? 0) < required[pos]);
}

function ensureStarterRoster(state:GameState): GameState {
  if(shouldRepairFreshStarterRoster(state)){
    const roster = createStarterRoster();
    return {...state, roster, lineup: pickBalancedLineup(roster, state.formation)};
  }

  const roster = state.roster.slice();
  while(roster.length<STARTER_ROSTER_SIZE) roster.push(makePlayer("common"));

  const validIds = new Set(roster.map(p=>p.id));
  const preserved = state.lineup.filter(p=>validIds.has(p.id)).slice(0, STARTER_LINEUP_SIZE);
  if(preserved.length>=STARTER_LINEUP_SIZE) return {...state, roster, lineup: preserved};

  const usedIds = new Set(preserved.map(p=>p.id));
  const rest = roster.filter(p=>!usedIds.has(p.id));
  // Top up the preserved lineup in a position-balanced way rather than just
  // grabbing the next roster entry (same reasoning as pickBalancedLineup —
  // avoids padding an old save into e.g. 3 goalkeepers).
  const lineup = pickBalancedLineup(rest, state.formation, preserved);

  return {...state, roster, lineup};
}

function applyOfflineIncome(state:GameState, loadedAt:number): GameState {
  const reward = calculateOfflineIncome(
    state.lastSavedAt,
    loadedAt,
    passivePerSec(state.passiveRate, state.upgrades.fans, state.league.tier),
  );
  return {
    ...state,
    coins: state.coins + reward.coins,
    lastSavedAt: loadedAt,
    pendingOfflineReward: reward.coins>0 ? reward : null,
  };
}

// FIX: factory function so makePlayer() runs lazily at app start, not at import time
export function createInitialState(): GameState {
  const roster = createStarterRoster();
  return {
    coins: 6000, diamonds: 50,
    roster, lineup: pickBalancedLineup(roster, "4-3-3"),
    formation: "4-3-3",
    upgrades: {attack:0, defense:0, training:0, fans:0},
    teamName: DEFAULT_TEAM_NAME, teamColor: DEFAULT_TEAM_COLOR,
    freeNameChangeUsed: false,
    freeColorChangeUsed: false,
    adsRemoved: false,
    speed3Unlocked: false,
    league: startNewSeason(STARTING_LEAGUE_TIER, {id:PLAYER_TEAM_ID, name:DEFAULT_TEAM_NAME, color:DEFAULT_TEAM_COLOR}),
    market: makeMarket(STARTING_LEAGUE_TIER),
    passiveRate: 10,
    lastSavedAt: Date.now(),
    pendingOfflineReward: null,
    daily: FRESH_DAILY,
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
        market: state.market.map(m=>m.id===action.player.id ? makeMarketPlayer(state.league.tier) : m),
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
      if(state.coins < MARKET_REFRESH_COST) return state;
      return {...state, coins: state.coins-MARKET_REFRESH_COST, market: action.market};
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

    case PURCHASE_STORE_OFFER:
      return {
        ...state,
        diamonds: state.diamonds+action.diamonds,
        adsRemoved: state.adsRemoved || !!action.removeAds,
        speed3Unlocked: state.speed3Unlocked || !!action.removeAds,
      };

    case ADD_REWARD:
      return {...state, coins: state.coins+action.coins, diamonds: state.diamonds+action.diamonds};

    case SET_FORMATION:
      return {...state, formation: action.formation as FormationKey};

    case SET_LINEUP:
      return {...state, lineup: action.lineup.slice(0, STARTER_LINEUP_SIZE)};

    case RESOLVE_ROUND:
      return {
        ...state,
        coins: state.coins+action.reward,
        diamonds: state.diamonds+action.diamondReward,
        league: action.league,
      };

    case SET_TEAM_IDENTITY: {
      const diamondCost = action.diamondCost ?? 0;
      if(state.diamonds < diamondCost) return state;
      return {
        ...state,
        diamonds: state.diamonds-diamondCost,
        teamName: action.name,
        teamColor: action.color,
        freeNameChangeUsed: state.freeNameChangeUsed || !!action.markNameChange,
        freeColorChangeUsed: state.freeColorChangeUsed || !!action.markColorChange,
        league: {
          ...state.league,
          teams: state.league.teams.map(t=>t.isPlayer ? {...t, name:action.name, color:action.color} : t),
        },
      };
    }

    case TRAIN_PLAYER: {
      const player = state.roster.find(p=>p.id===action.playerId);
      if(!player) return state;
      const cost = nextTrainingCost(player);
      if(!cost) return state;
      if(cost.currency==="coins" && state.coins<cost.amount) return state;
      if(cost.currency==="diamonds" && state.diamonds<cost.amount) return state;
      const trained = applyTraining(player);
      // Lineup holds its own copies — update both by id or the pitch would
      // keep fielding the untrained version of the card.
      return {
        ...state,
        coins: cost.currency==="coins" ? state.coins-cost.amount : state.coins,
        diamonds: cost.currency==="diamonds" ? state.diamonds-cost.amount : state.diamonds,
        roster: state.roster.map(p=>p.id===trained.id ? trained : p),
        lineup: state.lineup.map(p=>p.id===trained.id ? trained : p),
      };
    }

    case CLAIM_DAILY: {
      const status = dailyStatus(state.daily, action.now);
      if(!status.canClaim) return state;
      const reward = dailyRewardFor(status.nextStreak, state.league.tier);
      return {
        ...state,
        coins: state.coins+reward.coins,
        diamonds: state.diamonds+reward.diamonds,
        daily: {
          lastClaimDayKey: dayKey(action.now),
          lastClaimAt: action.now,
          streak: status.nextStreak,
        },
      };
    }

    case UNLOCK_SPEED_3X:
      if(state.speed3Unlocked) return state;
      if(state.diamonds < action.cost) return state;
      return {...state, diamonds: state.diamonds-action.cost, speed3Unlocked:true};

    case CLEAR_OFFLINE_REWARD:
      return {...state, pendingOfflineReward:null};

    case LOAD:
      // FIX: merge with initialState defaults so missing fields in saved data don't break the game
      return applyOfflineIncome(ensureStarterRoster({...state, ...action.payload}), action.loadedAt);

    default:
      return state;
  }
}
