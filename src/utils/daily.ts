import { DailyRewardState } from "../types";
import { DAILY_REWARDS, PRESTIGE_INCOME_PER_LEVEL } from "../constants/economy";
import { prestigeOf } from "./balance";

export const FRESH_DAILY: DailyRewardState = {lastClaimDayKey:null, lastClaimAt:0, streak:0};

// Local-time day bucket (players think in "days" of their own timezone).
export function dayKey(ts:number): string {
  const d = new Date(ts);
  const mm = String(d.getMonth()+1).padStart(2,"0");
  const dd = String(d.getDate()).padStart(2,"0");
  return `${d.getFullYear()}-${mm}-${dd}`;
}

export interface DailyStatus {
  canClaim: boolean;
  // 1-based day in the 7-day cycle the player would claim NOW.
  nextStreak: number;
}

export function dailyStatus(daily:DailyRewardState|undefined, now:number): DailyStatus {
  const d = daily ?? FRESH_DAILY;
  // Same clock-tamper stance as offline income: a reversed clock never pays.
  if(now < d.lastClaimAt) return {canClaim:false, nextStreak:1};
  const today = dayKey(now);
  if(d.lastClaimDayKey===today) return {canClaim:false, nextStreak:(d.streak%7)+1};
  const yesterday = dayKey(now-86400000);
  const continues = d.lastClaimDayKey===yesterday;
  return {canClaim:true, nextStreak: continues ? (d.streak%7)+1 : 1};
}

export interface DailyReward {
  coins: number;
  diamonds: number;
}

// Coins scale with league prestige (same factor as passive income) so the
// calendar never becomes pocket change in high divisions.
export function dailyRewardFor(streakDay:number, tier:number): DailyReward {
  const idx = Math.max(1, Math.min(7, streakDay))-1;
  const base = DAILY_REWARDS[idx];
  const mult = 1+(prestigeOf(tier)-1)*PRESTIGE_INCOME_PER_LEVEL;
  return {coins: Math.round(base.coins*mult), diamonds: base.diamonds};
}
