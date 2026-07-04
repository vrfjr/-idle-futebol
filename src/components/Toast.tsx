import React from "react";
import { colors, radii } from "../styles/tokens";
interface Props { msg:string; bad?:boolean; }
export function Toast({msg,bad=false}:Props) {
  return (
    <div style={{position:"fixed",top:14,left:"50%",transform:"translateX(-50%)",
      background:bad?"#0f0606":"#060f06",
      border:`1px solid ${bad?"#7f1d1d60":"#14532d60"}`,
      color:bad?colors.danger:colors.success,
      padding:"8px 20px",borderRadius:radii.pill,fontWeight:700,zIndex:9999,
      whiteSpace:"nowrap",fontSize:11,letterSpacing:0.5,maxWidth:340,textAlign:"center"}}>
      {msg}
    </div>
  );
}
