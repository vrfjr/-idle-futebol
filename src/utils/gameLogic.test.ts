import { matchOutcomeProbabilities } from "./gameLogic";

describe("matchOutcomeProbabilities", () => {
  it("reduz zebra extrema quando a diferenca de poder e muito grande", () => {
    const odds = matchOutcomeProbabilities(85, 37);

    expect(Math.round(odds.win*100)).toBeGreaterThanOrEqual(89);
    expect(Math.round(odds.loss*1000)).toBeLessThanOrEqual(25);
  });

  it("mantem jogo equilibrado quando os poderes sao parecidos", () => {
    const odds = matchOutcomeProbabilities(50, 50);

    expect(Math.round(odds.win*100)).toBe(38);
    expect(Math.round(odds.draw*100)).toBe(24);
    expect(Math.round(odds.loss*100)).toBe(38);
  });
});
