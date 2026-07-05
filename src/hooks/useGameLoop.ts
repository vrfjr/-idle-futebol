import { useEffect, useState, useRef } from "react";
import { useGame } from "../store/GameContext";
import { RESOLVE_ROUND } from "../store/actions";
import { calcPower } from "../utils/balance";
import { resolveRound } from "../utils/league";
import { LiveScore } from "../types";

export function useGameLoop() {
  const { state, dispatch } = useGame();
  const [liveScore, setLiveScore] = useState<LiveScore>({home:0,away:0,min:0});

  // Ref always holds the latest state — avoids stale closures in the intervals
  // without causing the intervals to be recreated on every render.
  const stateRef = useRef(state);
  stateRef.current = state;

  // Resolve one full league round every 45 seconds
  useEffect(()=>{
    const id = setInterval(()=>{
      if(document.visibilityState==="hidden") return;
      const s = stateRef.current;
      const pwr = calcPower(s.lineup, s.formation, s.upgrades);
      const playerId = s.league.teams.find(t=>t.isPlayer)!.id;
      const {league, playerResult, reward, diamondReward} = resolveRound(s.league, playerId, pwr);
      dispatch({ type:RESOLVE_ROUND, league, result:playerResult, reward, diamondReward });
    }, 45000);
    return ()=>clearInterval(id);
  // dispatch is stable (React guarantee); no other deps needed — stateRef handles state
  }, [dispatch]);

  // Live match minute timer (0-90 min mapped over 45 real seconds)
  useEffect(()=>{
    let t = 0;
    const id = setInterval(()=>{
      if(document.visibilityState==="hidden") return;
      t = (t+1) % 45;
      setLiveScore(prev=>({...prev, min: Math.floor(t*2)}));
    }, 1000);
    return ()=>clearInterval(id);
  }, []);

  return { liveScore, setLiveScore };
}
