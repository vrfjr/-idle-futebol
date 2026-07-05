import React, { ReactNode, useState } from "react";
import { PowerBreakdown } from "../utils/balance";
import { ALL_POSITIONS } from "../utils/lineup";
import { colors, radii, shadows, withAlpha } from "../styles/tokens";

interface Props {
  breakdown:PowerBreakdown;
  children:ReactNode;
  align?: "center"|"left"|"right";
}

function pct(v:number): string {
  return `${Math.round(v*100)}%`;
}

export function PowerTooltip({breakdown, children, align="center"}:Props) {
  const [open, setOpen] = useState(false);
  const left = align==="left" ? 0 : align==="right" ? undefined : "50%";
  const right = align==="right" ? 0 : undefined;
  const transform = align==="center" ? "translateX(-50%)" : undefined;

  return (
    <div
      tabIndex={0}
      onMouseEnter={()=>setOpen(true)}
      onMouseLeave={()=>setOpen(false)}
      onFocus={()=>setOpen(true)}
      onBlur={()=>setOpen(false)}
      onClick={()=>setOpen(o=>!o)}
      style={{position:"relative",outline:"none",cursor:"help"}}
    >
      {children}
      {open&&(
        <div style={{
          position:"absolute",top:"calc(100% + 8px)",left,right,transform,zIndex:50,width:220,
          background:colors.surface,border:`1px solid ${withAlpha(colors.success,"medium")}`,
          borderRadius:radii.card,padding:"10px 12px",boxShadow:shadows.glow(colors.success,"14px"),
          textAlign:"left",pointerEvents:"none",
        }}>
          <div style={{fontSize:10,color:colors.success,fontWeight:900,letterSpacing:0.8,marginBottom:7}}>COMO O PODER FOI CALCULADO</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr auto",gap:"4px 10px",fontSize:10,color:colors.textSecondary}}>
            <span>Média OVR</span><strong style={{color:colors.textHeading}}>{breakdown.averageOvr.toFixed(1)}</strong>
            <span>Escalados</span><strong style={{color:colors.textHeading}}>{Math.round(breakdown.lineupRatio*11)}/11</strong>
            <span>Encaixe posicional</span><strong style={{color:colors.textHeading}}>{pct(breakdown.positionFit)}</strong>
            <span>Formação</span><strong style={{color:colors.textHeading}}>{breakdown.formationMultiplier.toFixed(2)}x</strong>
            <span>Upgrades úteis</span><strong style={{color:colors.textHeading}}>{breakdown.upgradesTotal}</strong>
          </div>
          <div style={{height:1,background:colors.border,margin:"8px 0"}}/>
          <div style={{display:"flex",gap:4,flexWrap:"wrap"}}>
            {ALL_POSITIONS.filter(pos=>breakdown.targets[pos]>0).map(pos=>(
              <span key={pos} style={{fontSize:9,color:colors.textMuted,background:withAlpha(colors.primaryLight,"subtle"),
                borderRadius:radii.tag,padding:"2px 5px",fontWeight:800}}>
                {pos} {breakdown.counts[pos]}/{breakdown.targets[pos]}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
