import { useEffect } from "react";
import { useGame } from "../store/GameContext";
import { PASSIVE_INCOME } from "../store/actions";
import { passivePerSec } from "../utils/balance";
import { collectionMultipliers } from "../utils/collection";

// FIX: hook now reads from context instead of requiring manual param-passing
export function usePassiveIncome(): void {
  const { state, dispatch } = useGame();

  useEffect(()=>{
    const rate = state.passiveRate;
    const fans = state.upgrades.fans;
    const tier = state.league.tier;
    const legacyPoints = state.legacy?.points ?? 0;
    const collectionIncome = collectionMultipliers(state.roster).income;
    const id = setInterval(()=>{
      if(document.visibilityState==="hidden") return;
      dispatch({ type: PASSIVE_INCOME, amount: passivePerSec(rate, fans, tier, legacyPoints, collectionIncome) });
    }, 1000);
    return ()=>clearInterval(id);
  // Only re-create when the values that affect the calculation change
  }, [state.passiveRate, state.upgrades.fans, state.league.tier, state.legacy?.points, state.roster, dispatch]);
}
