import { makePlayer } from "./gameLogic";
import { applyTraining, nextTrainingCost, trainingCap, trainingLevel } from "./training";
import { TRAIN_COIN_LEVELS, TRAIN_MAX_BY_RARITY } from "../constants/economy";
import { gameReducer, createInitialState } from "../store/gameReducer";
import { TRAIN_PLAYER } from "../store/actions";

describe("training costs", () => {
  it("primeiros niveis custam moedas, depois somente diamantes", () => {
    let p = makePlayer("legendary");
    const currencies: string[] = [];
    for(let lvl=0; lvl<trainingCap(p); lvl++){
      const cost = nextTrainingCost(p)!;
      expect(cost.amount).toBeGreaterThan(0);
      currencies.push(cost.currency);
      p = applyTraining(p);
    }
    const expected = currencies.map((_,i)=>i<TRAIN_COIN_LEVELS ? "coins" : "diamonds");
    expect(currencies).toEqual(expected);
    expect(nextTrainingCost(p)).toBeNull();
  });

  it("teto de treino por raridade", () => {
    (["common","rare","epic","legendary"] as const).forEach(rarity=>{
      const p = makePlayer(rarity);
      expect(trainingCap(p)).toBe(TRAIN_MAX_BY_RARITY[rarity]);
    });
  });

  it("treinar sobe atributos e OVR", () => {
    const p = makePlayer("common");
    const trained = applyTraining(p);
    expect(trained.pac).toBe(Math.min(99, p.pac+1));
    expect(trained.ovr).toBeGreaterThanOrEqual(p.ovr);
    expect(trainingLevel(trained)).toBe(1);
  });
});

describe("TRAIN_PLAYER reducer", () => {
  it("cobra moedas e atualiza roster E lineup", () => {
    const state = createInitialState();
    const target = state.lineup[0];
    const cost = nextTrainingCost(target)!;
    const next = gameReducer({...state, coins: cost.amount+10}, {type:TRAIN_PLAYER, playerId: target.id});

    expect(next.coins).toBe(10);
    const inRoster = next.roster.find(p=>p.id===target.id)!;
    const inLineup = next.lineup.find(p=>p.id===target.id)!;
    expect(trainingLevel(inRoster)).toBe(1);
    expect(trainingLevel(inLineup)).toBe(1);
  });

  it("nao treina sem saldo", () => {
    const state = createInitialState();
    const target = state.lineup[0];
    const broke = {...state, coins: 0};
    const next = gameReducer(broke, {type:TRAIN_PLAYER, playerId: target.id});
    expect(next).toBe(broke);
    expect(trainingLevel(next.roster.find(p=>p.id===target.id)!)).toBe(0);
  });
});
