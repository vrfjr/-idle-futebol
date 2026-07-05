import { CLEAR_OFFLINE_REWARD, LOAD, PURCHASE_STORE_OFFER, SET_TEAM_IDENTITY } from "./actions";
import { createInitialState, gameReducer, IDENTITY_CHANGE_DIAMOND_COST } from "./gameReducer";

describe("gameReducer offline income", () => {
  it("aplica ganho offline uma vez ao carregar save", () => {
    const loadedAt = 120_000;
    const saved = {
      ...createInitialState(),
      coins: 100,
      passiveRate: 10,
      upgrades: {attack:0, defense:0, training:0, fans:0},
      lastSavedAt: 60_000,
      pendingOfflineReward: null,
    };

    const result = gameReducer(createInitialState(), {
      type: LOAD,
      payload: saved,
      loadedAt,
    });

    expect(result.coins).toBe(700);
    expect(result.lastSavedAt).toBe(loadedAt);
    expect(result.pendingOfflineReward?.coins).toBe(600);
  });

  it("limpa aviso de recompensa offline sem remover moedas", () => {
    const state = {
      ...createInitialState(),
      coins: 700,
      pendingOfflineReward: {coins:600, seconds:60, capped:false, reason:"ok" as const},
    };

    const result = gameReducer(state, {type:CLEAR_OFFLINE_REWARD});

    expect(result.coins).toBe(700);
    expect(result.pendingOfflineReward).toBeNull();
  });

  it("preserva dados principais do save ao carregar", () => {
    const loadedAt = 200_000;
    const saved = {
      ...createInitialState(),
      teamName: "FC Teste",
      teamColor: "#dc2626",
      coins: 4321,
      diamonds: 12,
      upgrades: {attack:2, defense:1, training:3, fans:4},
      lastSavedAt: loadedAt,
    };

    const result = gameReducer(createInitialState(), {
      type: LOAD,
      payload: saved,
      loadedAt,
    });

    expect(result.teamName).toBe("FC Teste");
    expect(result.teamColor).toBe("#dc2626");
    expect(result.coins).toBe(4321);
    expect(result.diamonds).toBe(12);
    expect(result.roster.map(p=>p.id)).toEqual(saved.roster.map(p=>p.id));
    expect(result.lineup.map(p=>p.id)).toEqual(saved.lineup.map(p=>p.id));
    expect(result.league.tier).toBe(saved.league.tier);
    expect(result.league.round).toBe(saved.league.round);
    expect(result.league.table).toEqual(saved.league.table);
    expect(result.market.map(p=>p.id)).toEqual(saved.market.map(p=>p.id));
    expect(result.upgrades).toEqual(saved.upgrades);
  });

  it("cobra diamantes para identidade depois da primeira troca gratis", () => {
    const state = {
      ...createInitialState(),
      diamonds: 80,
      freeNameChangeUsed: true,
    };

    const result = gameReducer(state, {
      type:SET_TEAM_IDENTITY,
      name:"Novo FC",
      color:state.teamColor,
      diamondCost:IDENTITY_CHANGE_DIAMOND_COST,
      markNameChange:true,
    });

    expect(result.teamName).toBe("Novo FC");
    expect(result.diamonds).toBe(30);
  });

  it("adiciona diamantes por oferta da loja", () => {
    const state = {...createInitialState(), diamonds:5};

    const result = gameReducer(state, {type:PURCHASE_STORE_OFFER, diamonds:80});

    expect(result.diamonds).toBe(85);
  });

  it("remove anuncios e desbloqueia velocidade 3x na compra unica", () => {
    const state = createInitialState();

    const result = gameReducer(state, {type:PURCHASE_STORE_OFFER, diamonds:0, removeAds:true});

    expect(result.adsRemoved).toBe(true);
    expect(result.speed3Unlocked).toBe(true);
  });
});
