import { createSim, stepSimulation } from "./matchSim";
import { Player, PositionKey, RarityKey } from "../types";

const W = 480;
const H = 294;

function player(id:string, pos:PositionKey, ovr:number, patch:Partial<Player>={}): Player {
  return {
    id,
    name:id,
    pos,
    rarity:"common" as RarityKey,
    pac:ovr,
    sho:ovr,
    pas:ovr,
    def:ovr,
    phy:ovr,
    dri:ovr,
    ovr,
    price:100,
    sellPrice:50,
    ...patch,
  };
}

const attackingLineup: Player[] = [
  player("gol", "GOL", 68, {sho:8, def:76, phy:72}),
  player("ld", "LD", 82, {sho:38, pas:78, def:72}),
  player("zag1", "ZAG", 78, {sho:18, def:82, phy:82}),
  player("zag2", "ZAG", 78, {sho:18, def:82, phy:82}),
  player("le", "LE", 82, {sho:38, pas:78, def:72}),
  player("vol", "VOL", 82, {sho:48, pas:82, def:76}),
  player("mc1", "MC", 86, {sho:72, pas:88, dri:84}),
  player("mc2", "MC", 86, {sho:72, pas:88, dri:84}),
  player("pd", "PD", 90, {sho:88, pac:92, dri:92}),
  player("ca", "CA", 94, {sho:96, phy:90, dri:88}),
  player("pe", "PE", 90, {sho:88, pac:92, dri:92}),
];

describe("match simulation", () => {
  it("gera gols pelo fluxo visual em um confronto ofensivo favoravel", () => {
    let goalCallbacks = 0;
    const sim = createSim(W, H, "4-3-3", attackingLineup, 28, {
      seed: 2244,
      homeTactics: {tempo:0.92, risk:0.82, directness:0.78, depth:0.62},
      awayTactics: {tempo:0.44, risk:0.30, directness:0.38, depth:0.40},
    });
    const recordGoal = () => { goalCallbacks += 1; };

    for(let frame=0; frame<12000; frame++){
      stepSimulation(sim, W, H, recordGoal);
    }

    expect(sim.homeGoals).toBeGreaterThanOrEqual(1);
    expect(sim.homeGoals+sim.awayGoals).toBeGreaterThanOrEqual(1);
    expect(goalCallbacks).toBe(sim.homeGoals+sim.awayGoals);
    expect(sim.restart ? sim.restart.timer : 0).toBeLessThanOrEqual(42);
  });
});
