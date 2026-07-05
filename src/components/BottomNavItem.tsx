import React from "react";
import { m } from "framer-motion";
import { LucideIcon } from "lucide-react";
import { colors, radii, withAlpha } from "../styles/tokens";

interface Props { icon:LucideIcon; label:string; active:boolean; onClick:()=>void; badge?:boolean; }

export function BottomNavItem({icon:Icon, label, active, onClick, badge}:Props) {
  return (
    <m.button onClick={onClick} whileTap={{scale:0.92}} style={{
      flex:1, border:"none", cursor:"pointer", fontFamily:"inherit", background:"none",
      padding:"8px 2px 9px", display:"flex", flexDirection:"column", alignItems:"center", gap:3,
      WebkitTapHighlightColor:"transparent",
    }}>
      <div style={{position:"relative", width:40, height:26, borderRadius:radii.badge,
        display:"flex", alignItems:"center", justifyContent:"center",
        background: active ? `linear-gradient(180deg, ${withAlpha(colors.cyan,"soft")}, ${withAlpha(colors.primary,"subtle")})` : "transparent",
        border: active ? `1px solid ${withAlpha(colors.cyan,"medium")}` : "1px solid transparent",
        boxShadow: active ? `0 0 12px ${withAlpha(colors.cyan,"medium")}` : "none",
        transition:"background .15s, box-shadow .15s"}}>
        <Icon size={18} color={active?colors.cyan:colors.textMuted} strokeWidth={active?2.3:1.75}/>
        {badge && <span style={{position:"absolute", top:-1, right:3, width:7, height:7, borderRadius:"50%",
          background:colors.danger, border:`1.5px solid ${colors.bg}`}}/>}
      </div>
      <span style={{fontSize:9, fontWeight:active?800:700, letterSpacing:0.6,
        color:active?colors.cyan:colors.textMuted, textTransform:"uppercase"}}>{label}</span>
    </m.button>
  );
}
