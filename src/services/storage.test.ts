import { createInitialState } from "../store/gameReducer";
import { KEY, saveGame } from "./storage";

describe("storage", () => {
  beforeEach(() => {
    localStorage.clear();
    jest.spyOn(Date, "now").mockReturnValue(123_456);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("salva timestamp atual e nao persiste recompensa offline pendente", async () => {
    await saveGame({
      ...createInitialState(),
      lastSavedAt: 1,
      pendingOfflineReward: {coins:100, seconds:10, capped:false, reason:"ok"},
    });

    const raw = localStorage.getItem(KEY);
    expect(raw).not.toBeNull();

    const saved = JSON.parse(raw!);
    expect(saved.lastSavedAt).toBe(123_456);
    expect(saved.pendingOfflineReward).toBeNull();
  });
});
