import { useEffect } from "react";
import { useGame } from "../store/GameContext";
import { PASSIVE_INCOME } from "../store/actions";
import { passivePerSec } from "../utils/balance";

// FIX: hook now reads from context instead of requiring manual param-passing
export function usePassiveIncome(): void {
  const { state, dispatch } = useGame();

  useEffect(()=>{
    const rate = state.passiveRate;
    const fans = state.upgrades.fans;
    const id = setInterval(()=>{
      if(document.visibilityState==="hidden") return;
      dispatch({ type: PASSIVE_INCOME, amount: passivePerSec(rate, fans) });
    }, 1000);
    return ()=>clearInterval(id);
  // Only re-create when the values that affect the calculation change
  }, [state.passiveRate, state.upgrades.fans, dispatch]);
}
