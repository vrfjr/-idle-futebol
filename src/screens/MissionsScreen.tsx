import React from "react";
import { X, Target, Medal, Coins, Gem, Check } from "lucide-react";
import { useGame } from "../store/GameContext";
import { CLAIM_MISSION, CLAIM_ACHIEVEMENT } from "../store/actions";
import { ACHIEVEMENTS } from "../constants/missions";
import { achievementMet, missionDef, missionRewardCoins, statsOf } from "../utils/missions";
import { fmt } from "../utils/helpers";
import { ProgressBar } from "../components/ProgressBar";
import { GameButton } from "../components/GameButton";
import { colors, radii, withAlpha } from "../styles/tokens";

interface Props { onClose:()=>void; onToast:(msg:string,bad?:boolean)=>void; }

export function MissionsScreen({onClose, onToast}:Props) {
  const {state, dispatch} = useGame();
  const claimed = new Set(state.achievementsClaimed ?? []);
  const stats = statsOf(state);

  return (
    <div style={{position:"fixed",inset:0,background:"rgba(3,7,15,0.85)",zIndex:500,
      display:"flex",alignItems:"flex-end",justifyContent:"center"}}>
      <div style={{width:"100%",maxWidth:430,maxHeight:"85vh",background:colors.bg,
        borderRadius:"16px 16px 0 0",border:`1px solid ${colors.border}`,borderBottom:"none",
        display:"flex",flexDirection:"column",overflow:"hidden"}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"14px 16px",borderBottom:`1px solid ${colors.border}`}}>
          <div style={{fontSize:17,fontWeight:900,color:colors.textHeading,letterSpacing:-0.3}}>Missoes e conquistas</div>
          <button onClick={onClose} style={{background:colors.surface,border:`1px solid ${colors.border}`,
            borderRadius:radii.badge,width:32,height:32,display:"flex",alignItems:"center",justifyContent:"center",
            color:colors.textMuted,cursor:"pointer"}}>
            <X size={16}/>
          </button>
        </div>

        <div style={{overflowY:"auto",padding:"12px 14px 18px"}}>
          <div style={{display:"flex",alignItems:"center",gap:6,fontSize:10,color:colors.cyan,fontWeight:900,letterSpacing:1,marginBottom:8}}>
            <Target size={12}/> MISSOES DE HOJE
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:7,marginBottom:18}}>
            {(state.missions?.entries ?? []).map(entry=>{
              const def = missionDef(entry.id);
              if(!def) return null;
              const done = entry.progress>=entry.goal;
              const coins = missionRewardCoins(def, state.league.tier);
              return (
                <div key={entry.id} style={{background:colors.panel,border:`1px solid ${done&&!entry.claimed?withAlpha(colors.success,"medium"):colors.border}`,
                  borderRadius:radii.card,padding:"10px 11px"}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:8,marginBottom:6}}>
                    <div style={{fontSize:12,fontWeight:900,color:entry.claimed?colors.textMuted:colors.textHeading}}>{def.label}</div>
                    <div style={{fontSize:10,fontWeight:900,display:"flex",alignItems:"center",gap:6,flexShrink:0}}>
                      {coins>0&&<span style={{color:colors.warning,display:"flex",alignItems:"center",gap:2}}>+{fmt(coins)} <Coins size={10}/></span>}
                      {def.rewardDiamonds>0&&<span style={{color:colors.cyan,display:"flex",alignItems:"center",gap:2}}>+{def.rewardDiamonds} <Gem size={10}/></span>}
                    </div>
                  </div>
                  <div style={{display:"flex",alignItems:"center",gap:8}}>
                    <div style={{flex:1}}>
                      <ProgressBar value={(entry.progress/entry.goal)*100} color={entry.claimed?colors.textMuted:done?colors.success:colors.cyan}/>
                    </div>
                    <div style={{fontSize:10,color:colors.textMuted,fontWeight:800,flexShrink:0}}>{entry.progress}/{entry.goal}</div>
                    {entry.claimed
                      ? <Check size={14} color={colors.success}/>
                      : <GameButton variant="upgrade" color={colors.success} size="sm" disabled={!done}
                          onClick={()=>{
                            dispatch({type:CLAIM_MISSION, id:entry.id, now:Date.now()});
                            onToast("Missao concluida!");
                          }}>
                          Coletar
                        </GameButton>}
                  </div>
                </div>
              );
            })}
          </div>

          <div style={{display:"flex",alignItems:"center",gap:6,fontSize:10,color:colors.warning,fontWeight:900,letterSpacing:1,marginBottom:8}}>
            <Medal size={12}/> CONQUISTAS
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:7}}>
            {ACHIEVEMENTS.map(a=>{
              const isClaimed = claimed.has(a.id);
              const met = achievementMet(a, state);
              const progressText = a.stat&&a.goal!==undefined ? `${Math.min(stats[a.stat], a.goal)}/${a.goal}` : null;
              return (
                <div key={a.id} style={{background:colors.panel,opacity:isClaimed?0.55:1,
                  border:`1px solid ${met&&!isClaimed?withAlpha(colors.warning,"medium"):colors.border}`,
                  borderRadius:radii.card,padding:"9px 11px",display:"flex",alignItems:"center",justifyContent:"space-between",gap:8}}>
                  <div style={{minWidth:0}}>
                    <div style={{fontSize:12,fontWeight:900,color:colors.textHeading}}>{a.label}</div>
                    <div style={{fontSize:10,color:colors.textMuted,fontWeight:700,marginTop:1}}>
                      {a.desc}{progressText&&<span> - {progressText}</span>}
                    </div>
                  </div>
                  <div style={{display:"flex",alignItems:"center",gap:8,flexShrink:0}}>
                    <span style={{fontSize:11,fontWeight:900,color:colors.cyan,display:"flex",alignItems:"center",gap:2}}>+{a.rewardDiamonds} <Gem size={11}/></span>
                    {isClaimed
                      ? <Check size={14} color={colors.success}/>
                      : <GameButton variant="upgrade" color={colors.warning} size="sm" disabled={!met}
                          onClick={()=>{
                            dispatch({type:CLAIM_ACHIEVEMENT, id:a.id});
                            onToast(`Conquista: ${a.label}!`);
                          }}>
                          Coletar
                        </GameButton>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
