import { useEffect, useRef, useState } from "react";
import { useGame } from "../store/GameContext";
import { RESOLVE_ROUND } from "../store/actions";
import { calcPower } from "../utils/balance";
import { resolveRound } from "../utils/league";
import { LiveScore } from "../types";

export function useGameLoop(speed=1) {
  const { state, dispatch } = useGame();
  const [liveScore, setLiveScore] = useState<LiveScore>({home:0, away:0, min:0});
  const safeSpeed = Math.max(1, Math.min(3, Math.round(speed)));

  const stateRef = useRef(state);
  const speedRef = useRef(safeSpeed);
  const elapsedRef = useRef(0);

  stateRef.current = state;
  speedRef.current = safeSpeed;

  useEffect(()=>{
    const tickMs = 250;
    const id = setInterval(()=>{
      if(document.visibilityState==="hidden") return;

      elapsedRef.current += tickMs*speedRef.current;

      if(elapsedRef.current>=45000){
        elapsedRef.current %= 45000;

        const s = stateRef.current;
        const pwr = calcPower(s.lineup, s.formation, s.upgrades);
        const playerId = s.league.teams.find(t=>t.isPlayer)!.id;
        const {league, playerResult, reward, diamondReward} = resolveRound(s.league, playerId, pwr);

        dispatch({type:RESOLVE_ROUND, league, result:playerResult, reward, diamondReward});
        setLiveScore({home:0, away:0, min:0});
        return;
      }

      const min = Math.min(89, Math.floor((elapsedRef.current/45000)*90));
      setLiveScore(prev=>prev.min===min ? prev : {...prev, min});
    }, tickMs);

    return ()=>clearInterval(id);
  }, [dispatch]);

  return {liveScore, setLiveScore};
}
