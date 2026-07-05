import React, { useRef, useCallback, useState } from "react";
import { AnimatePresence, m } from "framer-motion";
import { BarChart3, Waypoints, Shirt, Users } from "lucide-react";
import { useGame } from "../store/GameContext";
import { useMatchSimulation } from "../hooks/useMatchSimulation";
import { useGameLoop } from "../hooks/useGameLoop";
import { useDeltaFlash } from "../hooks/useDeltaFlash";
import { calcPower, passivePerSec } from "../utils/balance";
import { ADD_REWARD } from "../store/actions";
import { ResourceBar } from "../components/ResourceBar";
import { StatShortcut } from "../components/StatShortcut";
import { LeagueBadge } from "../components/LeagueBadge";
import { MatchScoreboard } from "../components/MatchScoreboard";
import { RewardButton } from "../components/RewardButton";
import { DeltaBadge } from "../components/DeltaBadge";
import { LeagueTableScreen } from "./LeagueTableScreen";
import { colors } from "../styles/tokens";

interface Props { onToast:(msg:string,bad?:boolean)=>void; onNavigateShop:()=>void; onNavigateTeam:()=>void; }

export function MatchScreen({onToast, onNavigateShop, onNavigateTeam}:Props) {
  const {state, dispatch} = useGame();
  const containerRef = useRef<HTMLDivElement>(null);
  const {liveScore, setLiveScore} = useGameLoop();
  const [showTable, setShowTable] = useState(false);

  const handleGoal = useCallback((home:number,away:number)=>{
    setLiveScore(prev=>({...prev,home,away}));
  },[setLiveScore]);

  useMatchSimulation(containerRef, handleGoal, state.teamColor);

  const pwr = calcPower(state.lineup, state.formation, state.upgrades);
  const pwrFlash = useDeltaFlash(pwr, 1, d=>`+${Math.round(d)} PODER`);
  const pps = passivePerSec(state.passiveRate, state.upgrades.fans);
  const playerTeamId = state.league.teams.find(t=>t.isPlayer)?.id;
  const playerRow = state.league.table.find(r=>r.teamId===playerTeamId);

  return (
    <div>
      <div style={{padding:"16px 16px 12px",background:colors.bg}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:16}}>
          <LeagueBadge tier={state.league.tier} round={state.league.round}
            totalRounds={state.league.fixtures.length} onClick={()=>setShowTable(true)}/>

          <div style={{textAlign:"center",position:"relative"}}>
            <div style={{fontSize:9,color:colors.textMuted,fontWeight:700,letterSpacing:1.5}}>PODER</div>
            <AnimatePresence mode="popLayout">
              <m.div key={pwr} initial={{opacity:0,y:-6,scale:0.9}} animate={{opacity:1,y:0,scale:1}}
                transition={{duration:0.25}}
                style={{fontSize:30,fontWeight:900,color:colors.success,letterSpacing:-1,lineHeight:1}}>
                {pwr}
              </m.div>
            </AnimatePresence>
            {pwrFlash && <DeltaBadge keyId={pwrFlash.id} value={pwrFlash.text} color={colors.success}/>}
          </div>

          <div style={{textAlign:"right"}}>
            <div style={{fontSize:9,color:colors.textMuted,fontWeight:700,letterSpacing:1.5,display:"flex",alignItems:"center",justifyContent:"flex-end",gap:4}}><BarChart3 size={10}/> V / E / D</div>
            <div style={{fontSize:16,fontWeight:800,letterSpacing:1,marginTop:3}}>
              <span style={{color:colors.success}}>{playerRow?.won ?? 0}</span>
              <span style={{color:colors.textSeparator,margin:"0 3px"}}>/</span>
              <span style={{color:colors.warning}}>{playerRow?.drawn ?? 0}</span>
              <span style={{color:colors.textSeparator,margin:"0 3px"}}>/</span>
              <span style={{color:colors.danger}}>{playerRow?.lost ?? 0}</span>
            </div>
          </div>
        </div>

        <ResourceBar coins={state.coins} pps={pps} onAddCoins={onNavigateShop}/>
      </div>

      <MatchScoreboard home={liveScore.home} away={liveScore.away} min={liveScore.min}/>

      <div style={{margin:"0 14px 10px",borderRadius:14,overflow:"hidden",background:"#04310f",
        border:`1px solid ${colors.border}`,
        boxShadow:"inset 0 0 0 1px rgba(255,255,255,0.03), inset 0 6px 14px rgba(0,0,0,0.45), 0 4px 10px rgba(0,0,0,0.35)"}}>
        <div ref={containerRef} style={{width:"100%"}}/>
      </div>

      <div style={{display:"flex",gap:6,margin:"0 14px 10px"}}>
        <StatShortcut label="FORMAÇÃO" value={state.formation} onClick={onNavigateTeam}
          icon={<Waypoints size={14} color={colors.textMuted}/>}/>
        <StatShortcut label="EM CAMPO" value={`${state.lineup.length}/11`} onClick={onNavigateTeam}
          icon={<Shirt size={14} color={colors.textMuted}/>}/>
        <StatShortcut label="ELENCO" value={state.roster.length} onClick={onNavigateTeam}
          icon={<Users size={14} color={colors.textMuted}/>}/>
      </div>

      <div style={{margin:"0 14px 14px"}}>
        <RewardButton coins={600} diamonds={3}
          onClick={()=>{dispatch({type:ADD_REWARD,coins:600,diamonds:3});onToast("+600 moedas e +3 diamantes");}}/>
      </div>

      {showTable && playerTeamId && (
        <LeagueTableScreen league={state.league} playerTeamId={playerTeamId} onClose={()=>setShowTable(false)}/>
      )}
    </div>
  );
}
