import { collectionMultipliers, currentPass, freshPass, passTierUnlocked } from "./collection";
import { PASS_PREMIUM_COST, PASS_TIERS } from "../constants/economy";
import { makePlayer } from "./gameLogic";
import { gameReducer, createInitialState } from "../store/gameReducer";
import { UNLOCK_PREMIUM_PASS, CLAIM_PASS_TIER } from "../store/actions";
import { GameState } from "../types";

describe("bonus de colecao", () => {
  it("elenco inicial (so comuns) nao ativa nada", () => {
    const state = createInitialState();
    const mult = collectionMultipliers(state.roster);
    expect(mult.income).toBe(1);
    expect(mult.power).toBe(1);
  });

  it("lendarios ativam renda e poder", () => {
    const roster = Array.from({length:5}, ()=>makePlayer("legendary"));
    const mult = collectionMultipliers(roster);
    expect(mult.income).toBeGreaterThan(1.25); // leg1 +10% e leg5 +20%
    expect(mult.power).toBeGreaterThan(1.05);
  });
});

describe("passe de temporada", () => {
  function playedState(rounds:number): GameState {
    const base = createInitialState();
    return {...base, league: {...base.league, round: rounds}};
  }

  it("tiers destravam por rodadas jogadas", () => {
    const early = playedState(0);
    const late = playedState(PASS_TIERS[2].rounds);
    expect(passTierUnlocked(0, early.league)).toBe(false);
    expect(passTierUnlocked(2, late.league)).toBe(true);
    expect(passTierUnlocked(7, late.league)).toBe(false);
  });

  it("premium exige diamantes e so desbloqueia uma vez", () => {
    const state = {...playedState(4), diamonds: PASS_PREMIUM_COST};
    const unlocked = gameReducer(state, {type:UNLOCK_PREMIUM_PASS});
    expect(unlocked.diamonds).toBe(0);
    expect(unlocked.seasonPass!.premium).toBe(true);
    expect(gameReducer(unlocked, {type:UNLOCK_PREMIUM_PASS})).toBe(unlocked);

    const broke = {...playedState(4), diamonds: 0};
    expect(gameReducer(broke, {type:UNLOCK_PREMIUM_PASS})).toBe(broke);
  });

  it("coleta free exige tier destravado e paga uma unica vez", () => {
    const locked = playedState(0);
    expect(gameReducer(locked, {type:CLAIM_PASS_TIER, tierIndex:0, track:"free"})).toBe(locked);

    const ready = playedState(PASS_TIERS[0].rounds);
    const claimed = gameReducer(ready, {type:CLAIM_PASS_TIER, tierIndex:0, track:"free"});
    expect(claimed.coins).toBeGreaterThan(ready.coins);
    expect(gameReducer(claimed, {type:CLAIM_PASS_TIER, tierIndex:0, track:"free"})).toBe(claimed);
  });

  it("trilha premium bloqueada sem desbloquear o passe", () => {
    const ready = playedState(PASS_TIERS[0].rounds);
    expect(gameReducer(ready, {type:CLAIM_PASS_TIER, tierIndex:0, track:"premium"})).toBe(ready);
  });

  it("passe reseta quando a temporada muda", () => {
    const state = createInitialState();
    const pass = freshPass(state.league.seasonId!);
    const claimed = {...pass, claimedFree:[0,1]};
    const other = {...state.league, seasonId:"outra-temporada"};
    expect(currentPass(claimed, state.league).claimedFree).toHaveLength(2);
    expect(currentPass(claimed, other).claimedFree).toHaveLength(0);
  });
});
