import { OfflineReward } from "../types";

export const OFFLINE_INCOME_MAX_SECONDS = 8 * 60 * 60;
export const OFFLINE_INCOME_MIN_SECONDS = 10;

export interface OfflineIncomeOptions {
  maxSeconds?: number;
  minSeconds?: number;
}

function emptyReward(reason: OfflineReward["reason"]): OfflineReward {
  return {coins:0, seconds:0, capped:false, reason};
}

export function calculateOfflineIncome(
  savedAt:number|undefined,
  now:number,
  passivePerSecond:number,
  options:OfflineIncomeOptions = {},
): OfflineReward {
  const maxSeconds = options.maxSeconds ?? OFFLINE_INCOME_MAX_SECONDS;
  const minSeconds = options.minSeconds ?? OFFLINE_INCOME_MIN_SECONDS;

  if(!Number.isFinite(savedAt) || !savedAt) return emptyReward("missing_timestamp");
  if(!Number.isFinite(now) || now<=savedAt) return emptyReward("clock_reversed");

  const rawSeconds = Math.floor((now-savedAt)/1000);
  if(rawSeconds<minSeconds) return emptyReward("too_short");

  const seconds = Math.max(0, Math.min(rawSeconds, maxSeconds));
  const rate = Math.max(0, Math.floor(passivePerSecond));

  return {
    coins: seconds * rate,
    seconds,
    capped: rawSeconds>maxSeconds,
    reason: "ok",
  };
}
