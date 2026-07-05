import React from "react";
import { Trophy, ChevronRight } from "lucide-react";
import { colors, radii, withAlpha } from "../styles/tokens";

interface Props { tier:number; round:number; totalRounds:number; onClick?:()=>void; }

// Progress is real league state (current round / total fixtures in the season),
// not a decorative fake bar.
export function LeagueBadge({tier, round, totalRounds, onClick}:Props) {
  const pct = totalRounds>0 ? Math.min(100, (round/totalRounds)*100) : 0;
  return (
    <div onClick={onClick} style={{display:"flex", flexDirection:"column", gap:6,
      background:"none", border:"none", padding:0, textAlign:"left", cursor:onClick?"pointer":"default",
      fontFamily:"inherit", WebkitTapHighlightColor:"transparent"}}>
      <div style={{display:"flex", alignItems:"center", gap:7}}>
        <div style={{width:27,height:27,borderRadius:radii.badge,background:withAlpha(colors.warning,"soft"),
          border:`1px solid ${withAlpha(colors.warning,"medium")}`,display:"flex",alignItems:"center",
          justifyContent:"center",flexShrink:0}}>
          <Trophy size={13} color={colors.warning}/>
        </div>
        <div>
          <div style={{fontSize:9,color:colors.textMuted,fontWeight:700,letterSpacing:1.3}}>TEMPORADA</div>
          <div style={{display:"flex",alignItems:"center",gap:2}}>
            <span style={{fontSize:19,fontWeight:900,color:colors.warning,letterSpacing:-0.4,lineHeight:1}}>Liga {tier}</span>
            {onClick && <ChevronRight size={14} color={withAlpha(colors.warning,"strong")}/>}
          </div>
        </div>
      </div>
      <div style={{width:76}}>
        <div style={{height:4,borderRadius:2,background:colors.border,overflow:"hidden"}}>
          <div style={{height:"100%",width:`${pct}%`,background:colors.warning,borderRadius:2,transition:"width .5s"}}/>
        </div>
        <div style={{fontSize:8,color:colors.textMuted,fontWeight:700,marginTop:3,letterSpacing:0.5}}>{round}/{totalRounds}</div>
      </div>
    </div>
  );
}
