import React from "react";
import { colors, radii } from "../styles/tokens";
interface Props { label:string; value:string|number; color?:string; }
export function StatPill({label,value,color=colors.textHeading}:Props) {
  return (
    <div style={{flex:1,background:colors.surface,border:`1px solid ${colors.border}`,
      borderRadius:radii.card,padding:"9px 12px",textAlign:"center"}}>
      <div style={{fontSize:8,color:colors.textMuted,fontWeight:700,letterSpacing:1.2,marginBottom:3}}>{label}</div>
      <div style={{fontSize:14,fontWeight:900,color,letterSpacing:0.3}}>{value}</div>
    </div>
  );
}
