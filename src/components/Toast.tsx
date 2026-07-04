import React from "react";
interface Props { msg:string; bad?:boolean; }
export function Toast({msg,bad=false}:Props) {
  return (
    <div style={{position:"fixed",top:14,left:"50%",transform:"translateX(-50%)",
      background:bad?"#0f0606":"#060f06",
      border:`1px solid ${bad?"#7f1d1d60":"#14532d60"}`,
      color:bad?"#f87171":"#4ade80",
      padding:"8px 20px",borderRadius:20,fontWeight:700,zIndex:9999,
      whiteSpace:"nowrap",fontSize:11,letterSpacing:0.5,maxWidth:340,textAlign:"center"}}>
      {msg}
    </div>
  );
}
