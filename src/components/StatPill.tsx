import React, { ReactNode } from "react";
import { colors, radii } from "../styles/tokens";
interface Props { label:string; value:string|number; color?:string; icon?:ReactNode; }
export function StatPill({label,value,color=colors.textHeading,icon}:Props) {
  const body = (
    <div>
      <div style={{fontSize:8,color:colors.textMuted,fontWeight:700,letterSpacing:1.2,marginBottom:3}}>{label}</div>
      <div style={{fontSize:14,fontWeight:900,color,letterSpacing:0.3}}>{value}</div>
    </div>
  );
  return (
    <div style={{flex:1,background:colors.surface,border:`1px solid ${colors.border}`,
      borderRadius:radii.card,padding:"9px 12px",
      textAlign:icon?"left":"center",display:icon?"flex":"block",alignItems:"center",gap:icon?8:0}}>
      {icon}{body}
    </div>
  );
}
