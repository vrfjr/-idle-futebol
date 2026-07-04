import React from "react";
import { Player } from "../types";
import { RARITY } from "../constants/rarity";

interface Props {
  player:Player; compact?:boolean;
  onAction?:()=>void; actionLabel?:string; actionColor?:string;
}

export function PlayerCard({player,compact=false,onAction,actionLabel,actionColor="#22c55e"}:Props) {
  const rc = RARITY[player.rarity];
  return (
    <div style={{background:"#0d1422",border:`1px solid ${rc.c}22`,borderLeft:`3px solid ${rc.c}`,
      borderRadius:10,padding:compact?"9px 12px":"13px 14px",display:"flex",alignItems:"center",gap:10}}>
      <div style={{width:compact?34:40,height:compact?34:40,borderRadius:8,background:`${rc.c}15`,
        display:"flex",alignItems:"center",justifyContent:"center",
        fontSize:compact?10:11,fontWeight:800,color:rc.c,flexShrink:0,letterSpacing:0.5}}>
        {player.pos}
      </div>
      <div style={{flex:1,minWidth:0}}>
        <div style={{fontSize:compact?12:13,fontWeight:700,color:"#e2e8f0",
          whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis",letterSpacing:0.3}}>
          {player.name}
        </div>
        <div style={{display:"flex",gap:6,marginTop:3,alignItems:"center"}}>
          <span style={{fontSize:9,color:rc.c,fontWeight:700,background:`${rc.c}12`,
            padding:"2px 6px",borderRadius:3,letterSpacing:0.8,textTransform:"uppercase"}}>
            {rc.label}
          </span>
          <span style={{fontSize:10,color:"#475569",fontWeight:600}}>OVR {player.ovr}</span>
        </div>
        {!compact&&(
          <div style={{display:"flex",gap:4,marginTop:5}}>
            {([["ATK",player.atk,"#f87171"],["DEF",player.def,"#60a5fa"],
               ["VEL",player.spd,"#34d399"],["DRI",player.dbl,"#fbbf24"]] as [string,number,string][])
              .map(([l,v,c])=>(
              <span key={l} style={{fontSize:9,color:c,background:`${c}10`,
                padding:"2px 5px",borderRadius:3,fontWeight:700,letterSpacing:0.3}}>
                {l} {v}
              </span>
            ))}
          </div>
        )}
      </div>
      {onAction&&actionLabel&&(
        <button onClick={onAction} style={{background:"transparent",border:`1px solid ${actionColor}40`,
          borderRadius:7,padding:compact?"5px 10px":"7px 12px",color:actionColor,
          fontSize:compact?10:11,fontWeight:700,cursor:"pointer",flexShrink:0,
          whiteSpace:"nowrap",fontFamily:"inherit",letterSpacing:0.3}}>
          {actionLabel}
        </button>
      )}
    </div>
  );
}
