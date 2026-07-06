import { dailyStatus, dailyRewardFor, dayKey, FRESH_DAILY } from "./daily";
import { gameReducer, createInitialState } from "../store/gameReducer";
import { CLAIM_DAILY } from "../store/actions";

const DAY = 86400000;
// Fixed noon timestamp avoids DST edge cases in day arithmetic.
const NOON = new Date(2026, 6, 5, 12, 0, 0).getTime();

describe("dailyStatus", () => {
  it("primeiro resgate comeca no dia 1", () => {
    const s = dailyStatus(FRESH_DAILY, NOON);
    expect(s.canClaim).toBe(true);
    expect(s.nextStreak).toBe(1);
  });

  it("nao permite dois resgates no mesmo dia", () => {
    const claimed = {lastClaimDayKey:dayKey(NOON), lastClaimAt:NOON, streak:1};
    expect(dailyStatus(claimed, NOON+3600000).canClaim).toBe(false);
  });

  it("dia seguinte continua a sequencia; pular um dia reseta", () => {
    const claimed = {lastClaimDayKey:dayKey(NOON), lastClaimAt:NOON, streak:2};
    const nextDay = dailyStatus(claimed, NOON+DAY);
    expect(nextDay.canClaim).toBe(true);
    expect(nextDay.nextStreak).toBe(3);

    const skipped = dailyStatus(claimed, NOON+2*DAY);
    expect(skipped.canClaim).toBe(true);
    expect(skipped.nextStreak).toBe(1);
  });

  it("ciclo reinicia depois do dia 7", () => {
    const claimed = {lastClaimDayKey:dayKey(NOON), lastClaimAt:NOON, streak:7};
    expect(dailyStatus(claimed, NOON+DAY).nextStreak).toBe(1);
  });

  it("relogio voltado nao paga", () => {
    const claimed = {lastClaimDayKey:dayKey(NOON), lastClaimAt:NOON, streak:1};
    expect(dailyStatus(claimed, NOON-DAY).canClaim).toBe(false);
  });
});

describe("dailyRewardFor", () => {
  it("moedas escalam com prestigio, diamantes nao", () => {
    const low = dailyRewardFor(3, 25);
    const high = dailyRewardFor(3, 1);
    expect(high.coins).toBeGreaterThan(low.coins);
    expect(high.diamonds).toBe(low.diamonds);
  });
});

describe("CLAIM_DAILY reducer", () => {
  it("credita premio e bloqueia segundo resgate", () => {
    const state = createInitialState();
    const first = gameReducer(state, {type:CLAIM_DAILY, now:NOON});
    expect(first.coins).toBeGreaterThan(state.coins);
    expect(first.daily!.streak).toBe(1);

    const again = gameReducer(first, {type:CLAIM_DAILY, now:NOON+3600000});
    expect(again).toBe(first);
  });
});
