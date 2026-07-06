import { missionsForDay, progressMissions, achievementMet, claimableAchievements, FRESH_STATS } from "./missions";
import { MISSIONS_PER_DAY, MISSION_POOL, ACHIEVEMENTS } from "../constants/missions";
import { gameReducer, createInitialState } from "../store/gameReducer";
import { CLAIM_MISSION, CLAIM_ACHIEVEMENT, ROLLOVER_MISSIONS, RESOLVE_ROUND } from "../store/actions";
import { dayKey } from "./daily";
import { GameState } from "../types";

const NOON = new Date(2026, 6, 5, 12, 0, 0).getTime();

describe("missionsForDay", () => {
  it("sorteia 3 missoes distintas e deterministicas por dia", () => {
    const a = missionsForDay("2026-07-05");
    const b = missionsForDay("2026-07-05");
    const c = missionsForDay("2026-07-06");
    expect(a.entries).toHaveLength(MISSIONS_PER_DAY);
    expect(new Set(a.entries.map(e=>e.id)).size).toBe(MISSIONS_PER_DAY);
    expect(a.entries.map(e=>e.id)).toEqual(b.entries.map(e=>e.id));
    // dias diferentes podem repetir, mas o sorteio nao pode quebrar
    expect(c.entries).toHaveLength(MISSIONS_PER_DAY);
  });
});

describe("progressMissions", () => {
  it("avanca somente missoes do stat correspondente", () => {
    const missions = {dayKey:"2026-07-05", entries: MISSION_POOL.slice(0,3).map(d=>({id:d.id, goal:d.goal, progress:0, claimed:false}))};
    const after = progressMissions(missions, MISSION_POOL[0].stat)!;
    expect(after.entries[0].progress).toBe(1);
  });
});

describe("reducer integration", () => {
  it("vitoria conta para stats e missao win3", () => {
    let state: GameState = {...createInitialState(), missions: {dayKey: dayKey(Date.now()), entries:[{id:"win3", goal:3, progress:0, claimed:false}]}};
    const action = {type:RESOLVE_ROUND, league:state.league, result:"win", reward:100, diamondReward:0} as const;
    state = gameReducer(state, action as any);
    expect(state.stats!.wins).toBe(1);
    expect(state.missions!.entries[0].progress).toBe(1);
  });

  it("CLAIM_MISSION paga uma unica vez e exige objetivo cumprido", () => {
    const base = createInitialState();
    const today = dayKey(NOON);
    const ready = {...base, missions:{dayKey:today, entries:[{id:"win3", goal:3, progress:3, claimed:false}]}};
    const claimed = gameReducer(ready, {type:CLAIM_MISSION, id:"win3", now:NOON});
    expect(claimed.coins).toBeGreaterThan(ready.coins);
    const again = gameReducer(claimed, {type:CLAIM_MISSION, id:"win3", now:NOON});
    expect(again).toBe(claimed);

    const notReady = {...base, missions:{dayKey:today, entries:[{id:"win3", goal:3, progress:2, claimed:false}]}};
    expect(gameReducer(notReady, {type:CLAIM_MISSION, id:"win3", now:NOON})).toBe(notReady);
  });

  it("ROLLOVER_MISSIONS troca a lista apenas em dia novo", () => {
    const state = {...createInitialState(), missions: missionsForDay(dayKey(NOON))};
    const same = gameReducer(state, {type:ROLLOVER_MISSIONS, now:NOON});
    expect(same).toBe(state);
    const next = gameReducer(state, {type:ROLLOVER_MISSIONS, now:NOON+86400000});
    expect(next.missions!.dayKey).toBe(dayKey(NOON+86400000));
  });

  it("CLAIM_ACHIEVEMENT paga diamantes uma unica vez quando condicao cumprida", () => {
    const base = createInitialState();
    const withWins = {...base, stats:{...FRESH_STATS, wins:10}};
    const claimed = gameReducer(withWins, {type:CLAIM_ACHIEVEMENT, id:"w10"});
    expect(claimed.diamonds).toBe(base.diamonds+ACHIEVEMENTS.find(a=>a.id==="w10")!.rewardDiamonds);
    expect(gameReducer(claimed, {type:CLAIM_ACHIEVEMENT, id:"w10"})).toBe(claimed);
    // condicao nao cumprida: nada muda
    expect(gameReducer(base, {type:CLAIM_ACHIEVEMENT, id:"w500"})).toBe(base);
  });
});

describe("achievementMet specials", () => {
  it("lendarios no elenco e melhor liga alcancada", () => {
    const base = createInitialState();
    const leg3 = ACHIEVEMENTS.find(a=>a.id==="leg3")!;
    expect(achievementMet(leg3, base)).toBe(false);
    const tier10 = ACHIEVEMENTS.find(a=>a.id==="tier10")!;
    const climbed = {...base, stats:{...FRESH_STATS, bestTier:9}};
    expect(achievementMet(tier10, climbed)).toBe(true);
    expect(claimableAchievements(climbed).some(a=>a.id==="tier10")).toBe(true);
  });
});
