import { Player, PositionKey, RarityKey } from "../types";
import { fieldLayout, FORMATION_TEMPLATES } from "../constants/formations";
import { assignPlayersToSlots, pickBalancedLineup } from "./lineup";

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

describe("pickBalancedLineup", () => {
  it("escolhe o melhor jogador para o slot, nao o primeiro da lista", () => {
    const weakLd = player("ld-fraco", "LD", 20);
    const strongLd = player("ld-forte", "LD", 80);
    const roster = [
      player("gol", "GOL", 50),
      weakLd,
      player("zag1", "ZAG", 50),
      player("zag2", "ZAG", 50),
      player("le", "LE", 50),
      player("vol", "VOL", 50),
      player("mc1", "MC", 50),
      player("mc2", "MC", 50),
      player("pd", "PD", 50),
      player("ca", "CA", 50),
      player("pe", "PE", 50),
      strongLd,
    ];

    const lineup = pickBalancedLineup(roster, "4-3-3");

    expect(lineup.some(p=>p.id===strongLd.id)).toBe(true);
    expect(lineup.some(p=>p.id===weakLd.id)).toBe(false);
  });

  it("retorna a melhor escalacao na ordem dos slots da formacao", () => {
    const roster = [
      player("gol", "GOL", 50),
      player("zag1", "ZAG", 50),
      player("zag2", "ZAG", 50),
      player("ld", "LD", 50),
      player("le", "LE", 50),
      player("vol", "VOL", 50),
      player("mc1", "MC", 50),
      player("mc2", "MC", 50),
      player("pd", "PD", 50),
      player("ca", "CA", 50),
      player("pe", "PE", 50),
    ];

    const lineup = pickBalancedLineup(roster, "4-3-3");

    expect(lineup.map(p=>p.pos)).toEqual(FORMATION_TEMPLATES["4-3-3"]);
  });

  it("nao rouba jogador natural de um slot posterior ao preencher vaga adaptada", () => {
    const lineup = [
      player("gol", "GOL", 50),
      player("zag1", "ZAG", 50),
      player("zag2", "ZAG", 50),
      player("le", "LE", 50),
      player("vol", "VOL", 50),
      player("mc1", "MC", 50),
      player("mc2", "MC", 50),
      player("pd", "PD", 50),
      player("ca", "CA", 50),
      player("pe", "PE", 50),
      player("sa", "SA", 50),
    ];

    const assigned = assignPlayersToSlots(lineup, fieldLayout("4-3-3", true, 320, 244));

    expect(assigned.filter(slot=>slot.role==="ZAG").map(slot=>slot.player?.pos)).toEqual(["ZAG","ZAG"]);
  });
});
