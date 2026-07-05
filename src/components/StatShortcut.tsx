import React, { ReactNode } from "react";
import { m } from "framer-motion";
import { ChevronRight } from "lucide-react";
import { colors, radii, withAlpha } from "../styles/tokens";

interface Props { icon:ReactNode; label:string; value:string|number; onClick?:()=>void; }

// Info stat that's also a real navigation shortcut (when onClick is provided) —
// chevron + press feedback make the "this is tappable" affordance explicit,
// distinguishing it from pure read-only cards.
export function StatShortcut({icon, label, value, onClick}:Props) {
  return (
    <m.button onClick={onClick} whileTap={onClick?{scale:0.95}:undefined}
      style={{flex:1, display:"flex", flexDirection:"column", gap:7, background:colors.surface,
        border:`1px solid ${colors.border}`, borderRadius:radii.card, padding:"10px 10px 9px",
        cursor:onClick?"pointer":"default", textAlign:"left", fontFamily:"inherit",
        WebkitTapHighlightColor:"transparent"}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        <div style={{width:26,height:26,borderRadius:radii.badge,background:withAlpha(colors.primaryLight,"subtle"),
          display:"flex",alignItems:"center",justifyContent:"center"}}>{icon}</div>
        {onClick && <ChevronRight size={13} color={colors.textMuted}/>}
      </div>
      <div>
        <div style={{fontSize:9,color:colors.textMuted,fontWeight:700,letterSpacing:1}}>{label}</div>
        <div style={{fontSize:15,fontWeight:900,color:colors.textHeading,letterSpacing:-0.2,marginTop:2}}>{value}</div>
      </div>
    </m.button>
  );
}
