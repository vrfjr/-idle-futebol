import React, { ReactNode } from "react";
import { Player } from "../types";
import { RARITY } from "../constants/rarity";
import { colors, radii, withAlpha } from "../styles/tokens";
import { GameButton } from "./GameButton";

interface Props {
  player:Player; compact?:boolean;
  onAction?:()=>void; actionLabel?:ReactNode; actionColor?:string;
}

export function PlayerCard({player,compact=false,onAction,actionLabel,actionColor=colors.success}:Props) {
  const rc = RARITY[player.rarity];
  return (
    <div style={{background:colors.surface,border:`1px solid ${withAlpha(rc.c,"border")}`,borderLeft:`3px solid ${rc.c}`,
      borderRadius:radii.card,padding:compact?"9px 12px":"13px 14px",display:"flex",alignItems:"center",gap:10}}>
      <div style={{width:compact?34:40,height:compact?34:40,borderRadius:radii.badge,background:withAlpha(rc.c,"subtle"),
        display:"flex",alignItems:"center",justifyContent:"center",
        fontSize:compact?10:11,fontWeight:800,color:rc.c,flexShrink:0,letterSpacing:0.5}}>
        {player.pos}
      </div>
      <div style={{flex:1,minWidth:0}}>
        <div style={{fontSize:compact?12:13,fontWeight:700,color:colors.textHeading,
          whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis",letterSpacing:0.3}}>
          {player.name}
        </div>
        <div style={{display:"flex",gap:6,marginTop:3,alignItems:"center"}}>
          <span style={{fontSize:9,color:rc.c,fontWeight:700,background:withAlpha(rc.c,"subtle"),
            padding:"2px 6px",borderRadius:radii.tag,letterSpacing:0.8,textTransform:"uppercase"}}>
            {rc.label}
          </span>
          <span style={{fontSize:10,color:colors.textSecondary,fontWeight:600}}>OVR {player.ovr}</span>
        </div>
        {!compact&&(
          <div style={{display:"flex",gap:4,marginTop:5,flexWrap:"wrap",maxWidth:180}}>
            {([["PAC",player.pac,colors.success],["SHO",player.sho,colors.danger],
               ["PAS",player.pas,colors.primaryLight],["DEF",player.def,colors.rivalDark],
               ["PHY",player.phy,colors.primary],["DRI",player.dri,colors.warning]] as [string,number,string][])
              .map(([l,v,c])=>(
              <span key={l} style={{fontSize:9,color:c,background:withAlpha(c,"subtle"),
                padding:"2px 5px",borderRadius:radii.tag,fontWeight:700,letterSpacing:0.3}}>
                {l} {v}
              </span>
            ))}
          </div>
        )}
      </div>
      {onAction&&actionLabel&&(
        <GameButton onClick={onAction} variant="secondary" color={actionColor} size="sm"
          style={{flexShrink:0, whiteSpace:"nowrap", fontSize:compact?10:11, padding:compact?"5px 10px":"7px 12px"}}>
          {actionLabel}
        </GameButton>
      )}
    </div>
  );
}
