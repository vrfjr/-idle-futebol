import { useEffect, useState, useRef } from "react";
import { useGame } from "../store/GameContext";
import { MATCH_RESULT } from "../store/actions";
import { calcPower } from "../utils/balance";
import { simulateMatch } from "../utils/gameLogic";
import { LiveScore } from "../types";

export function useGameLoop() {
  const { state, dispatch } = useGame();
  const [liveScore, setLiveScore] = useState<LiveScore>({home:0,away:0,min:0});

  // Ref always holds the latest state — avoids stale closures in the intervals
  // without causing the intervals to be recreated on every render.
  const stateRef = useRef(state);
  stateRef.current = state;

  // Match result every 45 seconds
  useEffect(()=>{
    const id = setInterval(()=>{
      const s = stateRef.current;
      const pwr = calcPower(s.lineup, s.formation, s.upgrades);
      const opp = 40 + s.league*10 + Math.random()*30;
      const result = simulateMatch(pwr, opp);
      const reward = result==="win" ? 700+s.league*130 : result==="draw" ? 220 : 70;
      const diamondReward = result==="win" && Math.random()<0.18 ? 1 : 0;
      dispatch({ type:MATCH_RESULT, result, reward, diamondReward });
    }, 45000);
    return ()=>clearInterval(id);
  // dispatch is stable (React guarantee); no other deps needed — stateRef handles state
  }, [dispatch]);

  // Live match minute timer (0-90 min mapped over 45 real seconds)
  useEffect(()=>{
    let t = 0;
    const id = setInterval(()=>{
      t = (t+1) % 45;
      setLiveScore(prev=>({...prev, min: Math.floor(t*2)}));
    }, 1000);
    return ()=>clearInterval(id);
  }, []);

  return { liveScore, setLiveScore };
}
