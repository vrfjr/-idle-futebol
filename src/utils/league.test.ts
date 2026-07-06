import { basePower, BEST_LEAGUE_TIER, STARTING_LEAGUE_TIER, winReward } from "./league";

describe("league power curve", () => {
  it("cresce de forma superlinear ate o topo", () => {
    const bottom = basePower(STARTING_LEAGUE_TIER);
    const next = basePower(STARTING_LEAGUE_TIER-1);
    const mid = basePower(13);
    const top = basePower(BEST_LEAGUE_TIER);

    // Bottom divisions ramp gently so a starter squad isn't walled early...
    expect(next-bottom).toBeGreaterThanOrEqual(3);
    expect(next-bottom).toBeLessThanOrEqual(6);
    // ...but the total climb is steep: top division demands a maxed-out squad
    // (avg legendary OVR ~85 x upgrade ceiling x3.25 ~= 280 player power).
    expect(mid-bottom).toBeGreaterThanOrEqual(60);
    expect(top-bottom).toBeGreaterThanOrEqual(190);
    // Superlinear: each division climbed is a bigger jump than the previous.
    expect(top-mid).toBeGreaterThan(mid-bottom);
  });
});

describe("league rewards curve", () => {
  it("recompensa cresce quadraticamente com o prestigio", () => {
    // Early value preserved (~875 at prestige 1, close to the old 830)...
    expect(winReward(1)).toBeGreaterThanOrEqual(800);
    expect(winReward(1)).toBeLessThanOrEqual(950);
    // ...and top-division wins pay in the same order of magnitude as the
    // legendary cards that division requires (~68k each).
    expect(winReward(25)).toBeGreaterThanOrEqual(30000);
    // Superlinear growth: the jump 20->25 outpays the jump 1->5.
    expect(winReward(25)-winReward(20)).toBeGreaterThan(winReward(5)-winReward(1));
  });
});
