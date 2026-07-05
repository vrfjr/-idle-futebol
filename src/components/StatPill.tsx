import React, { ReactNode } from "react";
import { Plus } from "lucide-react";
import { colors, radii, shadows, withAlpha } from "../styles/tokens";
interface Props {
  label:string; value:string|number; color?:string; icon?:ReactNode;
  onAction?:()=>void; topAccent?:string;
}
export function StatPill({label,value,color=colors.textHeading,icon,onAction,topAccent}:Props) {
  const body = (
    <div style={{flex:1}}>
      <div style={{fontSize:8,color:colors.textMuted,fontWeight:700,letterSpacing:1.2,marginBottom:3}}>{label}</div>
      <div style={{fontSize:14,fontWeight:900,color,letterSpacing:0.3}}>{value}</div>
    </div>
  );
  return (
    <div style={{flex:1,background:colors.surface,border:`1px solid ${colors.border}`,
      borderTop:topAccent?`2px solid ${topAccent}`:undefined,
      boxShadow:topAccent?shadows.glow(topAccent,"8px"):undefined,
      borderRadius:radii.card,padding:"9px 12px",
      textAlign:icon?"left":"center",display:icon?"flex":"block",alignItems:"center",gap:icon?8:0}}>
      {icon}{body}
      {onAction&&(
        <button onClick={onAction} style={{width:22,height:22,flexShrink:0,borderRadius:radii.tag,
          background:withAlpha(colors.primaryLight,"subtle"),border:`1px solid ${withAlpha(colors.primaryLight,"medium")}`,
          color:colors.primaryLight,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",padding:0}}>
          <Plus size={13}/>
        </button>
      )}
    </div>
  );
}
