import React, { useRef, useCallback } from "react";
import { Coins, Zap, CircleDot, Circle, Tv, Gem, Trophy, BarChart3, Waypoints, Shirt, Users, ChevronRight } from "lucide-react";
import { useGame } from "../store/GameContext";
import { useMatchSimulation } from "../hooks/useMatchSimulation";
import { useGameLoop } from "../hooks/useGameLoop";
import { calcPower, passivePerSec } from "../utils/balance";
import { fmt } from "../utils/helpers";
import { ADD_REWARD } from "../store/actions";
import { StatPill } from "../components/StatPill";
import { colors, radii, shadows, withAlpha } from "../styles/tokens";

interface Props { onToast:(msg:string,bad?:boolean)=>void; onNavigateShop:()=>void; }

export function MatchScreen({onToast,onNavigateShop}:Props) {
  const {state, dispatch} = useGame();
  const containerRef = useRef<HTMLDivElement>(null);
  const {liveScore, setLiveScore} = useGameLoop();

  const handleGoal = useCallback((home:number,away:number)=>{
    setLiveScore(prev=>({...prev,home,away}));
  },[setLiveScore]);

  useMatchSimulation(containerRef, handleGoal, state.teamColor);

  const pwr = calcPower(state.lineup, state.formation, state.upgrades);
  const pps = passivePerSec(state.passiveRate, state.upgrades.fans);
  const playerTeamId = state.league.teams.find(t=>t.isPlayer)?.id;
  const playerRow = state.league.table.find(r=>r.teamId===playerTeamId);

  return (
    <div>
      <div style={{padding:"16px 16px 12px",background:colors.bg}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:14}}>
          <div>
            <div style={{fontSize:9,color:colors.textMuted,fontWeight:700,letterSpacing:1.5,display:"flex",alignItems:"center",gap:4}}><Trophy size={10}/> TEMPORADA</div>
            <div style={{fontSize:22,fontWeight:900,color:colors.warning,letterSpacing:-0.5,lineHeight:1}}>Liga {state.league.tier}</div>
          </div>
          <div style={{textAlign:"center"}}>
            <div style={{fontSize:9,color:colors.textMuted,fontWeight:700,letterSpacing:1.5,display:"flex",alignItems:"center",justifyContent:"center",gap:4}}><Zap size={10}/> PODER</div>
            <div style={{fontSize:28,fontWeight:900,color:colors.success,letterSpacing:-1,lineHeight:1}}>{pwr}</div>
          </div>
          <div style={{textAlign:"right"}}>
            <div style={{fontSize:9,color:colors.textMuted,fontWeight:700,letterSpacing:1.5,display:"flex",alignItems:"center",justifyContent:"flex-end",gap:4}}><BarChart3 size={10}/> V / E / D</div>
            <div style={{fontSize:16,fontWeight:800,letterSpacing:1,marginTop:1}}>
              <span style={{color:colors.success}}>{playerRow?.won ?? 0}</span>
              <span style={{color:colors.textSeparator,margin:"0 3px"}}>/</span>
              <span style={{color:colors.warning}}>{playerRow?.drawn ?? 0}</span>
              <span style={{color:colors.textSeparator,margin:"0 3px"}}>/</span>
              <span style={{color:colors.danger}}>{playerRow?.lost ?? 0}</span>
            </div>
          </div>
        </div>
        <div style={{display:"flex",gap:6}}>
          <div style={{flex:2}}>
            <StatPill label="MOEDAS" value={fmt(state.coins)} color={colors.warning} icon={<Coins size={16} color={colors.warning}/>} onAction={onNavigateShop}/>
          </div>
          <div style={{flex:1}}>
            <StatPill label="/SEG" value={pps} color={colors.success} icon={<Zap size={16} color={colors.success}/>} onAction={onNavigateShop} topAccent={colors.success}/>
          </div>
        </div>
      </div>

      <div style={{margin:"0 14px 12px",background:colors.surface,border:`1px solid ${colors.border}`,borderRadius:12,padding:"12px 20px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        <div style={{textAlign:"center"}}>
          <div style={{width:38,height:38,borderRadius:radii.badge,background:withAlpha(colors.primary,"soft"),border:`1px solid ${withAlpha(colors.primary,"medium")}`,boxShadow:shadows.glow(colors.primary),display:"flex",alignItems:"center",justifyContent:"center",marginBottom:4}}><CircleDot size={18} color={colors.primary}/></div>
          <div style={{fontSize:8,color:colors.primary,fontWeight:700,letterSpacing:0.8}}>MEU TIME</div>
        </div>
        <div style={{textAlign:"center"}}>
          <div style={{fontSize:8,color:colors.textMuted,fontWeight:700,letterSpacing:1,marginBottom:4}}>{liveScore.min<90?`${liveScore.min}'`:"FIM"}</div>
          <div style={{fontSize:40,fontWeight:900,letterSpacing:8,lineHeight:1}}>
            <span style={{color:colors.textHeading}}>{liveScore.home}</span>
            <span style={{color:colors.textSeparator,margin:"0 2px"}}>:</span>
            <span style={{color:colors.textHeading}}>{liveScore.away}</span>
          </div>
          <div style={{fontSize:7,color:colors.success,fontWeight:700,letterSpacing:2,marginTop:4,display:"flex",alignItems:"center",justifyContent:"center",gap:4}}>
            <span style={{display:"inline-block",width:5,height:5,borderRadius:"50%",background:colors.success,animation:"pulse 1.5s infinite"}}/>
            AO VIVO
          </div>
        </div>
        <div style={{textAlign:"center"}}>
          <div style={{width:38,height:38,borderRadius:radii.badge,background:withAlpha(colors.rivalDark,"soft"),border:`1px solid ${withAlpha(colors.rivalDark,"medium")}`,boxShadow:shadows.glow(colors.rivalDark),display:"flex",alignItems:"center",justifyContent:"center",marginBottom:4}}><Circle size={18} color={colors.rivalDark} fill={colors.rivalDark}/></div>
          <div style={{fontSize:8,color:colors.rivalDark,fontWeight:700,letterSpacing:0.8}}>RIVAL</div>
        </div>
      </div>

      <div style={{margin:"0 14px 10px",borderRadius:12,overflow:"hidden",border:`1px solid ${colors.border}`}}>
        <div ref={containerRef} style={{width:"100%"}}/>
      </div>

      <div style={{display:"flex",gap:6,margin:"0 14px 10px"}}>
        <StatPill label="FORMAÇÃO" value={state.formation} icon={<Waypoints size={14} color={colors.textMuted}/>}/>
        <StatPill label="EM CAMPO" value={`${state.lineup.length}/11`} icon={<Shirt size={14} color={colors.textMuted}/>}/>
        <StatPill label="ELENCO" value={state.roster.length} icon={<Users size={14} color={colors.textMuted}/>}/>
      </div>

      <div style={{margin:"0 14px 14px"}}>
        <button onClick={()=>{dispatch({type:ADD_REWARD,coins:600,diamonds:3});onToast("+600 moedas e +3 diamantes");}}
          style={{width:"100%",padding:"12px 14px",borderRadius:radii.card,cursor:"pointer",
            background:`linear-gradient(180deg, ${withAlpha(colors.warning,"soft")}, ${withAlpha(colors.warning,"subtle")})`,
            border:`1px solid ${withAlpha(colors.warning,"strong")}`,boxShadow:shadows.glow(colors.warning),
            color:colors.warning,fontSize:13,fontWeight:800,fontFamily:"inherit",
            letterSpacing:0.3,display:"flex",alignItems:"center",justifyContent:"space-between",gap:8}}>
          <span style={{display:"flex",alignItems:"center",gap:8}}>
            <Tv size={16}/>
            <span style={{display:"inline-flex",alignItems:"center",gap:4}}>
              Assistir anúncio +600 <Coins size={13}/> +3 <Gem size={13}/>
            </span>
          </span>
          <ChevronRight size={16}/>
        </button>
      </div>
    </div>
  );
}
