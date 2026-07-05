import React, { createContext, useContext, useReducer, useEffect, useRef, ReactNode } from "react";
import { GameState } from "../types";
import { GameAction } from "./actions";
import { gameReducer, initialState } from "./gameReducer";
import { loadGame, saveGame } from "../services/storage";

interface GameContextValue {
  state: GameState;
  dispatch: React.Dispatch<GameAction>;
}

const GameContext = createContext<GameContextValue | null>(null);

const AUTOSAVE_INTERVAL_MS = 3000;

export function GameProvider({ children }: { children:ReactNode }) {
  const [state, dispatch] = useReducer(gameReducer, initialState);

  // Tracks whether the async load has completed, so we don't save the empty
  // initial state before the real save data arrives from storage.
  const hasLoaded = useRef(false);

  // Always holds the latest state so the autosave interval/visibility handler
  // below never close over a stale snapshot, without needing `state` in deps.
  const stateRef = useRef(state);
  stateRef.current = state;

  // Load saved game on mount only
  useEffect(()=>{
    loadGame().then(data=>{
      if(data) dispatch({type:"LOAD", payload: data}); // FIX: was `payload` (undefined)
      hasLoaded.current = true;
    }).catch(()=>{ hasLoaded.current = true; });
  }, []);

  // FIX: the old debounce (setTimeout reset on every `state` change, [state] dep)
  // never actually fired during normal play — passive income ticks state every
  // 1s, faster than the 2s debounce window, so the timer was perpetually cleared
  // and rescheduled and the game essentially never saved. A fixed-interval
  // autosave reading the latest state via a ref (not a dependency) guarantees a
  // save happens periodically no matter how often state changes.
  useEffect(()=>{
    const id = setInterval(()=>{
      if(hasLoaded.current) saveGame(stateRef.current);
    }, AUTOSAVE_INTERVAL_MS);
    return ()=>clearInterval(id);
  }, []);

  // Also save when the app is backgrounded, since the interval alone can miss
  // the last few seconds of progress if the OS kills the WebView activity
  // between ticks (more likely on mobile than on desktop browsers).
  useEffect(()=>{
    const onVisibilityChange = () => {
      if(hasLoaded.current && document.visibilityState==="hidden") saveGame(stateRef.current);
    };
    document.addEventListener("visibilitychange", onVisibilityChange);
    return ()=>document.removeEventListener("visibilitychange", onVisibilityChange);
  }, []);

  return (
    <GameContext.Provider value={{state, dispatch}}>
      {children}
    </GameContext.Provider>
  );
}

export function useGame(): GameContextValue {
  const ctx = useContext(GameContext);
  if(!ctx) throw new Error("useGame must be used inside <GameProvider>");
  return ctx;
}
