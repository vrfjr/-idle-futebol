// Central balance sheet for the whole game economy.
// Every tunable lives here so rebalancing never requires hunting magic
// numbers across reducers/screens (idle-genre rule: data-driven values).
//
// Design notes (2026-07-05 rebalance):
// - Upgrade POWER benefit is linear per level (was logarithmic while cost grew
//   exponentially — late levels cost thousands of times more for ~0.5% gains).
// - Passive income now scales with league prestige, so the idle engine keeps
//   mattering all game long instead of being frozen at the tier-25 rate.
// - Round/season rewards grow quadratically with prestige so top divisions
//   pay for top-rarity squads (win at Serie A ~32k vs legendary card ~68k).

// ---- Upgrades ----------------------------------------------------------
export const UPGRADE_COST_BASE = 500;
export const UPGRADE_COST_GROWTH = 1.7;
export const UPGRADE_MAX_LEVEL = 25;
// Each attack/defense/training level adds +3% team power, linearly.
// 75 combined levels -> x3.25 power (old log curve capped out near x2.08
// but delivered almost all of it in the first 10 cheap levels).
export const UPGRADE_POWER_PER_LEVEL = 0.03;
// Each fans level adds +40% passive income (unchanged).
export const FANS_INCOME_PER_LEVEL = 0.4;

// ---- Passive income ----------------------------------------------------
export const PASSIVE_BASE_RATE = 10;
// Promotion multiplies the idle engine: +45% base income per division climbed.
// Tier 25 -> x1.0, tier 1 -> x11.8.
export const PRESTIGE_INCOME_PER_LEVEL = 0.45;

// ---- League rewards ----------------------------------------------------
// winReward(prestige) = BASE + LINEAR*prestige + QUAD*prestige^2
// prestige 1 (tier 25): 875 coins  |  prestige 25 (tier 1): ~31.8k coins
export const WIN_REWARD_BASE = 700;
export const WIN_REWARD_LINEAR = 130;
export const WIN_REWARD_QUAD = 45;
export const DRAW_REWARD_RATIO = 0.3;
export const LOSS_REWARD_RATIO = 0.1;
export const WIN_DIAMOND_CHANCE = 0.18;

// Season completion bonus also scales with division.
export const SEASON_BONUS_COINS_BASE = 900;
export const SEASON_BONUS_COINS_PER_PRESTIGE = 350;
export const SEASON_BONUS_DIAMONDS_BASE = 3;
// +1 diamond every 5 divisions climbed.
export const SEASON_BONUS_DIAMONDS_PER_5_PRESTIGE = 1;

// ---- CPU difficulty ----------------------------------------------------
// basePower(prestige) = BASE + LINEAR*prestige + prestige^EXP * EXP_SCALE
// Rescaled for the new x3.25 upgrade ceiling: tier 25 ~29, tier 1 ~228
// (old curve topped out at 138, trivial against a maxed squad).
export const CPU_POWER_BASE = 26;
export const CPU_POWER_LINEAR = 3;
export const CPU_POWER_EXP = 1.9;
export const CPU_POWER_EXP_SCALE = 0.28;
// Per-team random spread around basePower (unchanged).
export const CPU_POWER_SPREAD_MIN = 0.78;
export const CPU_POWER_SPREAD_RANGE = 0.44;

// ---- Market ------------------------------------------------------------
export const MARKET_REFRESH_COST = 300;

// ---- Season pass ---------------------------------------------------------
// Progress = rounds played in the current league season (34 rounds total).
// Premium track is unlocked with diamonds (the premium currency, which the
// Store sells via IAP) — standard 2026 idle monetization ladder.
export const PASS_PREMIUM_COST = 150;
export interface PassTierDef {
  rounds: number;                        // rounds played to unlock
  free: {coins:number; diamonds:number};    // coins scale with prestige
  premium: {coins:number; diamonds:number};
}
export const PASS_TIERS: PassTierDef[] = [
  {rounds:4,  free:{coins:1500,  diamonds:0}, premium:{coins:3000,  diamonds:5}},
  {rounds:8,  free:{coins:2500,  diamonds:0}, premium:{coins:5000,  diamonds:5}},
  {rounds:12, free:{coins:0,     diamonds:2}, premium:{coins:8000,  diamonds:8}},
  {rounds:16, free:{coins:5000,  diamonds:0}, premium:{coins:12000, diamonds:8}},
  {rounds:20, free:{coins:7000,  diamonds:0}, premium:{coins:16000, diamonds:10}},
  {rounds:24, free:{coins:0,     diamonds:4}, premium:{coins:22000, diamonds:12}},
  {rounds:28, free:{coins:12000, diamonds:0}, premium:{coins:30000, diamonds:15}},
  {rounds:34, free:{coins:20000, diamonds:5}, premium:{coins:50000, diamonds:25}},
];

// ---- Collection bonuses ----------------------------------------------------
// Passive set bonuses for owning rare cards — rewards collecting beyond the
// starting XI. Applied automatically, no claim step.
export interface CollectionBonusDef {
  id: string;
  label: string;
  rarity: "rare"|"epic"|"legendary";
  count: number;
  incomeBonus: number; // additive, e.g. 0.05 = +5% passive income
  powerBonus: number;  // additive, e.g. 0.02 = +2% team power
}
export const COLLECTION_BONUSES: CollectionBonusDef[] = [
  {id:"rare5",   label:"5 Raros",      rarity:"rare",      count:5,  incomeBonus:0.05, powerBonus:0},
  {id:"epic3",   label:"3 Epicos",     rarity:"epic",      count:3,  incomeBonus:0.08, powerBonus:0.02},
  {id:"epic8",   label:"8 Epicos",     rarity:"epic",      count:8,  incomeBonus:0.12, powerBonus:0.03},
  {id:"leg1",    label:"1 Lendario",   rarity:"legendary", count:1,  incomeBonus:0.10, powerBonus:0.02},
  {id:"leg5",    label:"5 Lendarios",  rarity:"legendary", count:5,  incomeBonus:0.20, powerBonus:0.05},
  {id:"leg11",   label:"11 Lendarios", rarity:"legendary", count:11, incomeBonus:0.35, powerBonus:0.10},
];

// ---- Legacy (prestige) ---------------------------------------------------
// Unlocked by winning the Serie 1 title. Resetting the run converts progress
// into permanent Legacy points: the classic idle loop-extender.
// Points on reset = divisions climbed (prestigeOf(tier)) + elite title bonus.
export const LEGACY_ELITE_TITLE_BONUS = 10;
// Each point: +2% passive income and +1% team power, forever.
export const LEGACY_INCOME_PER_POINT = 0.02;
export const LEGACY_POWER_PER_POINT = 0.01;

// ---- Daily login rewards -------------------------------------------------
// 7-day cycle, escalating; day 7 is the jackpot. Coin amounts are further
// multiplied by the same prestige factor as passive income so the calendar
// stays meaningful in high divisions.
export const DAILY_REWARDS: {coins:number; diamonds:number}[] = [
  {coins:1000,  diamonds:0},
  {coins:2000,  diamonds:0},
  {coins:2000,  diamonds:3},
  {coins:4000,  diamonds:0},
  {coins:4000,  diamonds:5},
  {coins:8000,  diamonds:0},
  {coins:10000, diamonds:12},
];

// ---- Player training ---------------------------------------------------
// Each training level: +1 to every attribute (recomputed OVR ~+1).
// Coins only buy the first few levels; everything beyond is diamond-only —
// deliberate monetization edge for diamond buyers (product decision).
export const TRAIN_COIN_LEVELS = 3;
export const TRAIN_COIN_COST_RATIO = 0.3;   // of the player's base price
export const TRAIN_COIN_COST_GROWTH = 1.8;  // per level
export const TRAIN_DIAMOND_BASE = 10;
export const TRAIN_DIAMOND_STEP = 5;        // per diamond level
// Total training cap by rarity: better cards have more room to grow.
export const TRAIN_MAX_BY_RARITY: Record<string, number> = {
  common: 5, rare: 6, epic: 8, legendary: 10,
};
