import { gameReducer, createInitialState, legacyPointsOnReset, FRESH_LEGACY, PLAYER_TEAM_ID } from "../store/gameReducer";
import { PRESTIGE_RESET, RESOLVE_ROUND } from "../store/actions";
import { STARTING_LEAGUE_TIER, startNewSeason } from "./league";
import { passivePerSec, calcPower } from "./balance";
import { GameState } from "../types";

function eliteChampState(): GameState {
  const base = createInitialState();
  return {
    ...base,
    diamonds: 777,
    teamName: "Meu Clube",
    league: startNewSeason(1, {id:PLAYER_TEAM_ID, name:"Meu Clube", color:"#123456"}),
    legacy: {points:0, resets:0, eliteChampion:true},
  };
}

describe("legado (prestigio)", () => {
  it("titulo da liga 1 marca eliteChampion", () => {
    const base = createInitialState();
    const inElite: GameState = {...base, league: startNewSeason(1, {id:PLAYER_TEAM_ID, name:base.teamName, color:base.teamColor})};
    const after = gameReducer(inElite, {type:RESOLVE_ROUND, league:inElite.league, result:"win",
      reward:0, diamondReward:0, seasonEnded:true, champion:true});
    expect(after.legacy!.eliteChampion).toBe(true);
  });

  it("reset exige ser campeao da liga 1", () => {
    const notChamp = createInitialState();
    expect(gameReducer(notChamp, {type:PRESTIGE_RESET, now:Date.now()})).toBe(notChamp);
  });

  it("reset converte a run em pontos e preserva o meta", () => {
    const state = eliteChampState();
    const earned = legacyPointsOnReset(state);
    expect(earned).toBeGreaterThanOrEqual(25); // 24 divisoes subidas + bonus de titulo 10

    const after = gameReducer(state, {type:PRESTIGE_RESET, now:Date.now()});
    expect(after.legacy!.points).toBe(earned);
    expect(after.legacy!.resets).toBe(1);
    expect(after.legacy!.eliteChampion).toBe(false);
    // run resetada
    expect(after.league.tier).toBe(STARTING_LEAGUE_TIER);
    expect(after.upgrades.attack).toBe(0);
    // meta preservado
    expect(after.diamonds).toBe(777);
    expect(after.teamName).toBe("Meu Clube");
  });

  it("pontos de legado aumentam renda e poder", () => {
    const base = createInitialState();
    const noLegacy = passivePerSec(10, 0, 25, 0);
    const withLegacy = passivePerSec(10, 0, 25, 50);
    expect(withLegacy).toBeGreaterThan(noLegacy);
    const p0 = calcPower(base.lineup, base.formation, base.upgrades, 0);
    const p50 = calcPower(base.lineup, base.formation, base.upgrades, 50);
    expect(p50).toBeGreaterThan(p0);
  });

  it("FRESH_LEGACY e o padrao de saves antigos", () => {
    expect(FRESH_LEGACY.points).toBe(0);
    expect(legacyPointsOnReset(createInitialState())).toBe(0);
  });
});
