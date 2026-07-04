import React from "react";
import { useGame } from "../store/GameContext";
import { TOGGLE_SQUAD, SET_FORMATION } from "../store/actions";
import { calcPower } from "../utils/balance";
import { FORMATIONS_LIST } from "../constants/formations";
import { FormationKey } from "../types";
import { PlayerCard } from "../components/PlayerCard";
import { colors, radii, withAlpha } from "../styles/tokens";

interface Props { onToast:(msg:string,bad?:boolean)=>void; }

export function TeamScreen({onToast}:Props) {
  const {state, dispatch} = useGame();
  const bench = state.roster.filter(p=>!state.lineup.some(l=>l.id===p.id));
  const pwr = calcPower(state.lineup, state.formation, state.upgrades);

  const toggleSquad = (player:any)=>{
    const inSquad = state.lineup.some(l=>l.id===player.id);
    if(!inSquad && state.lineup.length>=11){onToast("Elenco cheio — máx 11",true);return;}
    dispatch({type:TOGGLE_SQUAD, player});
  };

  const SLabel = ({children,color=colors.textMuted}:{children:React.ReactNode;color?:string})=>(
    <div style={{fontSize:9,color,fontWeight:700,letterSpacing:1.5,marginBottom:8}}>{children}</div>
  );

  return (
    <div style={{padding:"16px 14px 8px"}}>
      <div style={{fontSize:17,fontWeight:900,color:colors.textHeading,letterSpacing:-0.3,marginBottom:14}}>Time</div>
      <SLabel>FORMAÇÃO</SLabel>
      <div style={{display:"flex",gap:5,flexWrap:"wrap",marginBottom:14}}>
        {FORMATIONS_LIST.map(f=>(
          <button key={f} onClick={()=>dispatch({type:SET_FORMATION,formation:f as FormationKey})} style={{
            background:state.formation===f?withAlpha(colors.primary,"subtle"):"transparent",
            border:`1px solid ${state.formation===f?colors.primary:colors.border}`,
            borderRadius:radii.button,color:state.formation===f?colors.primaryLight:colors.textMuted,
            fontSize:11,fontWeight:700,cursor:"pointer",padding:"6px 12px",fontFamily:"inherit",letterSpacing:0.5}}>
            {f}
          </button>
        ))}
      </div>
      <div style={{background:colors.surface,border:`1px solid ${colors.border}`,borderRadius:radii.card,padding:"12px 14px",marginBottom:16,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <div>
          <div style={{fontSize:8,color:colors.textMuted,fontWeight:700,letterSpacing:1.2}}>PODER DO TIME</div>
          <div style={{fontSize:30,fontWeight:900,color:colors.success,letterSpacing:-1,lineHeight:1,marginTop:2}}>{pwr}</div>
        </div>
        <div style={{textAlign:"right"}}>
          <div style={{fontSize:8,color:colors.textMuted,fontWeight:700,letterSpacing:1.2}}>CAMPO / BANCO</div>
          <div style={{fontSize:20,fontWeight:900,letterSpacing:-0.5,marginTop:2}}>
            <span style={{color:colors.success}}>{state.lineup.length}</span>
            <span style={{color:colors.textSeparator,margin:"0 4px"}}>/</span>
            <span style={{color:colors.textSecondary}}>{bench.length}</span>
          </div>
        </div>
      </div>
      <SLabel color={withAlpha(colors.success,"medium")}>EM CAMPO — {state.lineup.length}/11</SLabel>
      <div style={{display:"flex",flexDirection:"column",gap:5,marginBottom:16}}>
        {state.lineup.map(p=>(
          <PlayerCard key={p.id} player={p} compact onAction={()=>toggleSquad(p)} actionLabel="Retirar" actionColor={colors.danger}/>
        ))}
        {!state.lineup.length&&<div style={{textAlign:"center",color:colors.textMuted,padding:"18px 0",fontSize:12}}>Nenhum jogador escalado</div>}
      </div>
      <SLabel>BANCO — {bench.length}</SLabel>
      <div style={{display:"flex",flexDirection:"column",gap:5}}>
        {bench.map(p=>(
          <PlayerCard key={p.id} player={p} compact onAction={()=>toggleSquad(p)} actionLabel="Escalar" actionColor={colors.success}/>
        ))}
      </div>
    </div>
  );
}
