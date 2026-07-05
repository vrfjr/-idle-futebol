import { GameState } from "../types";
// Bumped from v2: PositionKey expanded from 4 to 11 roles (Player.pos values
// like "MEI"/"ATA" now mean something different) — old saves are intentionally
// orphaned rather than migrated (no real users yet, pre-launch; same practice
// used for the v1->v2 bump).
export const KEY = "football_idle_v3";

// Set right before an intentional wipe (e.g. the "reset game" button) so that
// no autosave — the 3s interval or the visibilitychange handler, which the
// reload triggered by that button fires on its way out — can silently write
// the stale in-memory state back over the clear before the page is gone.
let suppressed = false;
export function suppressAutosave(): void {
  suppressed = true;
}

// Simple serialization with error handling
export async function saveGame(data: GameState): Promise<void> {
  if(suppressed) return;
  try {
    localStorage.setItem(KEY, JSON.stringify({
      ...data,
      lastSavedAt: Date.now(),
      pendingOfflineReward: null,
    }));
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
