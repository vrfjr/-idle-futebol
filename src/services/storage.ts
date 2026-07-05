import { GameState } from "../types";
// Bumped from v1: GameState shape changed (league:number -> league:LeagueState,
// Player stats reshaped, teamName/teamColor added) — old saves are intentionally
// orphaned rather than migrated (no real users yet, pre-launch).
const KEY = "football_idle_v2";

// Simple serialization with error handling
export async function saveGame(data: GameState): Promise<void> {
  try {
    localStorage.setItem(KEY, JSON.stringify(data));
  } catch(e) {
    // QuotaExceededError or similar — fail silently
    console.warn("[storage] saveGame failed:", e);
  }
}

export async function loadGame(): Promise<GameState | null> {
  try {
    const raw = localStorage.getItem(KEY);
    if(!raw) return null;
    return JSON.parse(raw) as GameState;
  } catch(e) {
    console.warn("[storage] loadGame failed, resetting:", e);
    localStorage.removeItem(KEY);
    return null;
  }
}

export async function clearSave(): Promise<void> {
  localStorage.removeItem(KEY);
}
