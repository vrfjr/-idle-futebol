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

export function GameProvider({ children }: { children:ReactNode }) {
  const [state, dispatch] = useReducer(gameReducer, initialState);

  // Tracks whether the async load has completed, so we don't save the empty
  // initial state before the real save data arrives from storage.
  const hasLoaded = useRef(false);

  // Load saved game on mount only
  useEffect(()=>{
    loadGame().then(data=>{
      if(data) dispatch({type:"LOAD", payload: data}); // FIX: was `payload` (undefined)
      hasLoaded.current = true;
    }).catch(()=>{ hasLoaded.current = true; });
  }, []);

  // Auto-save whenever state changes, but only after the load completed.
  // Debounced to 2s so the 1-second coin ticks don't hammer localStorage.
  useEffect(()=>{
    if(!hasLoaded.current) return;
    const id = setTimeout(()=>saveGame(state), 2000);
    return ()=>clearTimeout(id);
  }, [state]);

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
