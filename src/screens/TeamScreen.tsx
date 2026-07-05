import React, { useState } from "react";
import { useGame } from "../store/GameContext";
import { TOGGLE_SQUAD, SET_FORMATION, SET_TEAM_IDENTITY } from "../store/actions";
import { calcPower } from "../utils/balance";
import { FORMATIONS_LIST } from "../constants/formations";
import { FormationKey } from "../types";
import { PlayerCard } from "../components/PlayerCard";
import { Label } from "../components/Label";
import { Screen } from "../components/Screen";
import { colors, radii, withAlpha } from "../styles/tokens";

const TEAM_COLORS = [
  "#1d4ed8", "#dc2626", "#059669", "#7c3aed",
  "#ea580c", "#0891b2", "#db2777", "#ca8a04",
];

interface Props { onToast:(msg:string,bad?:boolean)=>void; }

export function TeamScreen({onToast}:Props) {
  const {state, dispatch} = useGame();
  const bench = state.roster.filter(p=>!state.lineup.some(l=>l.id===p.id));
  const pwr = calcPower(state.lineup, state.formation, state.upgrades);
  const [nameInput, setNameInput] = useState(state.teamName);

  const toggleSquad = (player:any)=>{
    const inSquad = state.lineup.some(l=>l.id===player.id);
    if(!inSquad && state.lineup.length>=11){onToast("Elenco cheio — máx 11",true);return;}
    dispatch({type:TOGGLE_SQUAD, player});
  };

  const commitName = ()=>{
    const name = nameInput.trim() || state.teamName;
    setNameInput(name);
    dispatch({type:SET_TEAM_IDENTITY, name, color:state.teamColor});
  };
  const pickColor = (color:string)=>{
    dispatch({type:SET_TEAM_IDENTITY, name:state.teamName, color});
  };

  return (
    <Screen>
      <div style={{fontSize:17,fontWeight:900,color:colors.textHeading,letterSpacing:-0.3,marginBottom:14}}>Time</div>
      <Label>IDENTIDADE DO CLUBE</Label>
      <div style={{background:colors.surface,border:`1px solid ${colors.border}`,borderRadius:radii.card,padding:"12px 14px",marginBottom:16}}>
        <input value={nameInput} onChange={e=>setNameInput(e.target.value)} onBlur={commitName}
          maxLength={24} placeholder="Nome do time"
          style={{width:"100%",background:"transparent",border:"none",borderBottom:`1px solid ${colors.border}`,
            color:colors.textHeading,fontSize:15,fontWeight:700,fontFamily:"inherit",padding:"4px 0",marginBottom:10,outline:"none"}}/>
        <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
          {TEAM_COLORS.map(c=>(
            <button key={c} onClick={()=>pickColor(c)} aria-label={c} style={{
              width:26,height:26,borderRadius:"50%",background:c,cursor:"pointer",padding:0,
              border:state.teamColor===c?`2px solid ${colors.textHeading}`:"2px solid transparent",
              boxShadow:state.teamColor===c?`0 0 0 2px ${c}`:"none"}}/>
          ))}
        </div>
      </div>
      <Label>FORMAÇÃO</Label>
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
      <Label color={withAlpha(colors.success,"medium")}>EM CAMPO — {state.lineup.length}/11</Label>
      <div style={{display:"flex",flexDirection:"column",gap:5,marginBottom:16}}>
        {state.lineup.map(p=>(
          <PlayerCard key={p.id} player={p} compact onAction={()=>toggleSquad(p)} actionLabel="Retirar" actionColor={colors.danger}/>
        ))}
        {!state.lineup.length&&<div style={{textAlign:"center",color:colors.textMuted,padding:"18px 0",fontSize:12}}>Nenhum jogador escalado</div>}
      </div>
      <Label>BANCO — {bench.length}</Label>
      <div style={{display:"flex",flexDirection:"column",gap:5}}>
        {bench.map(p=>(
          <PlayerCard key={p.id} player={p} compact onAction={()=>toggleSquad(p)} actionLabel="Escalar" actionColor={colors.success}/>
        ))}
      </div>
    </Screen>
  );
}
