import React from "react";
import { X, Target, Medal, Coins, Gem, Check, Ticket, Album, Lock } from "lucide-react";
import { useGame } from "../store/GameContext";
import { CLAIM_MISSION, CLAIM_ACHIEVEMENT, UNLOCK_PREMIUM_PASS, CLAIM_PASS_TIER } from "../store/actions";
import { ACHIEVEMENTS } from "../constants/missions";
import { COLLECTION_BONUSES, PASS_PREMIUM_COST, PASS_TIERS } from "../constants/economy";
import { achievementMet, missionDef, missionRewardCoins, statsOf } from "../utils/missions";
import { collectionActive, currentPass, passCoins, passTierUnlocked } from "../utils/collection";
import { fmt } from "../utils/helpers";
import { ProgressBar } from "../components/ProgressBar";
import { GameButton } from "../components/GameButton";
import { colors, radii, withAlpha } from "../styles/tokens";

interface Props { onClose:()=>void; onToast:(msg:string,bad?:boolean)=>void; }

export function MissionsScreen({onClose, onToast}:Props) {
  const {state, dispatch} = useGame();
  const claimed = new Set(state.achievementsClaimed ?? []);
  const stats = statsOf(state);
  const pass = currentPass(state.seasonPass, state.league);

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

          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:8}}>
            <div style={{display:"flex",alignItems:"center",gap:6,fontSize:10,color:colors.success,fontWeight:900,letterSpacing:1}}>
              <Ticket size={12}/> PASSE DA TEMPORADA - RODADA {state.league.round}/{PASS_TIERS[PASS_TIERS.length-1].rounds}
            </div>
            {!pass.premium&&(
              <GameButton variant="upgrade" color={colors.cyan} size="sm" disabled={state.diamonds<PASS_PREMIUM_COST}
                onClick={()=>{
                  if(state.diamonds<PASS_PREMIUM_COST){onToast("Diamantes insuficientes",true);return;}
                  dispatch({type:UNLOCK_PREMIUM_PASS});
                  onToast("Passe Premium desbloqueado!");
                }}>
                Premium {PASS_PREMIUM_COST} <Gem size={10}/>
              </GameButton>
            )}
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:6,marginBottom:18}}>
            {PASS_TIERS.map((def,i)=>{
              const unlocked = passTierUnlocked(i, state.league);
              const freeClaimed = pass.claimedFree.includes(i);
              const premiumClaimed = pass.claimedPremium.includes(i);
              const freeCoins = passCoins(def.free.coins, state.league.tier);
              const premCoins = passCoins(def.premium.coins, state.league.tier);
              const rewardText = (coins:number, diamonds:number) => (
                <>
                  {coins>0&&<span style={{color:colors.warning}}>+{fmt(coins)} <Coins size={9} style={{display:"inline"}}/></span>}
                  {coins>0&&diamonds>0&&" "}
                  {diamonds>0&&<span style={{color:colors.cyan}}>+{diamonds} <Gem size={9} style={{display:"inline"}}/></span>}
                </>
              );
              return (
                <div key={def.rounds} style={{background:colors.panel,border:`1px solid ${unlocked?withAlpha(colors.success,"border"):colors.border}`,
                  borderRadius:radii.card,padding:"8px 10px",opacity:unlocked?1:0.6,
                  display:"grid",gridTemplateColumns:"38px 1fr auto auto",gap:8,alignItems:"center"}}>
                  <div style={{fontSize:10,fontWeight:900,color:unlocked?colors.success:colors.textMuted,textAlign:"center"}}>
                    R{def.rounds}
                  </div>
                  <div style={{fontSize:10,fontWeight:800,minWidth:0}}>
                    <div>Gratis: {rewardText(freeCoins, def.free.diamonds)}</div>
                    <div style={{marginTop:2,color:pass.premium?undefined:colors.textMuted}}>
                      Premium: {rewardText(premCoins, def.premium.diamonds)}
                    </div>
                  </div>
                  {freeClaimed
                    ? <Check size={13} color={colors.success}/>
                    : <GameButton variant="upgrade" color={colors.success} size="sm" disabled={!unlocked}
                        onClick={()=>{ dispatch({type:CLAIM_PASS_TIER, tierIndex:i, track:"free"}); onToast("Recompensa do passe coletada"); }}>
                        Gratis
                      </GameButton>}
                  {premiumClaimed
                    ? <Check size={13} color={colors.cyan}/>
                    : pass.premium
                      ? <GameButton variant="upgrade" color={colors.cyan} size="sm" disabled={!unlocked}
                          onClick={()=>{ dispatch({type:CLAIM_PASS_TIER, tierIndex:i, track:"premium"}); onToast("Recompensa premium coletada"); }}>
                          Premium
                        </GameButton>
                      : <Lock size={13} color={colors.textMuted}/>}
                </div>
              );
            })}
          </div>

          <div style={{display:"flex",alignItems:"center",gap:6,fontSize:10,color:colors.primaryLight,fontWeight:900,letterSpacing:1,marginBottom:8}}>
            <Album size={12}/> BONUS DE COLECAO (automaticos)
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:5,marginBottom:18}}>
            {COLLECTION_BONUSES.map(def=>{
              const active = collectionActive(def, state.roster);
              const have = state.roster.filter(p=>p.rarity===def.rarity).length;
              return (
                <div key={def.id} style={{background:colors.panel,border:`1px solid ${active?withAlpha(colors.primaryLight,"medium"):colors.border}`,
                  borderRadius:radii.card,padding:"7px 10px",opacity:active?1:0.65,
                  display:"flex",alignItems:"center",justifyContent:"space-between",gap:8,fontSize:10,fontWeight:800}}>
                  <span style={{color:active?colors.textHeading:colors.textMuted}}>
                    {def.label} ({Math.min(have,def.count)}/{def.count})
                  </span>
                  <span style={{color:active?colors.primaryLight:colors.textMuted,flexShrink:0}}>
                    {def.incomeBonus>0&&`+${Math.round(def.incomeBonus*100)}% renda`}
                    {def.incomeBonus>0&&def.powerBonus>0&&" / "}
                    {def.powerBonus>0&&`+${Math.round(def.powerBonus*100)}% poder`}
                  </span>
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
