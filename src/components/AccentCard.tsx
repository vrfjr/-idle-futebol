import React, { ReactNode } from "react";
import { colors, radii, shadows, withAlpha } from "../styles/tokens";

interface Props { accent:string; children:ReactNode; }

export function AccentCard({accent,children}:Props) {
  return (
    <div style={{position:"relative",overflow:"hidden",
      background:`linear-gradient(180deg, ${colors.surfaceAlt}, ${colors.panel})`,
      border:`1px solid ${withAlpha(accent,"medium")}`,borderTop:`1px solid ${withAlpha("#ffffff","soft")}`,
      borderLeft:`3px solid ${accent}`,borderRadius:radii.card,padding:"13px 14px",marginBottom:9,
      boxShadow:shadows.panel}}>
      <span style={{position:"absolute",left:0,right:0,top:0,height:1,background:`linear-gradient(90deg, transparent, ${withAlpha(accent,"strong")}, transparent)`}}/>
      {children}
    </div>
  );
}
