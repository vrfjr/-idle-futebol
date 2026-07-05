import { basePower, BEST_LEAGUE_TIER, STARTING_LEAGUE_TIER } from "./league";

describe("league power curve", () => {
  it("aumenta bem a distancia de poder entre ligas", () => {
    const bottom = basePower(STARTING_LEAGUE_TIER);
    const next = basePower(STARTING_LEAGUE_TIER-1);
    const top = basePower(BEST_LEAGUE_TIER);

    expect(Math.round((next-bottom)*10)).toBeGreaterThanOrEqual(45);
    expect(Math.round(top-bottom)).toBeGreaterThanOrEqual(108);
  });
});
