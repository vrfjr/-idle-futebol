import { calculateOfflineIncome } from "./offlineIncome";

describe("calculateOfflineIncome", () => {
  it("calcula moedas pelo tempo offline dentro do limite", () => {
    const reward = calculateOfflineIncome(1000, 61_000, 10);

    expect(reward).toEqual({
      coins: 600,
      seconds: 60,
      capped: false,
      reason: "ok",
    });
  });

  it("limita ganho offline absurdo", () => {
    const reward = calculateOfflineIncome(0 + 1000, 101_000, 10, {maxSeconds:30});

    expect(reward.coins).toBe(300);
    expect(reward.seconds).toBe(30);
    expect(reward.capped).toBe(true);
  });

  it("bloqueia relogio voltando no tempo", () => {
    const reward = calculateOfflineIncome(60_000, 30_000, 10);

    expect(reward.coins).toBe(0);
    expect(reward.reason).toBe("clock_reversed");
  });

  it("ignora ausencias muito curtas", () => {
    const reward = calculateOfflineIncome(1000, 5000, 10);

    expect(reward.coins).toBe(0);
    expect(reward.reason).toBe("too_short");
  });
});
