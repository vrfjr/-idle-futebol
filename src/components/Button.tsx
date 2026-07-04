import React, { CSSProperties, ReactNode } from "react";
interface Props {
  onClick:()=>void; children:ReactNode; color?:string;
  active?:boolean; fullWidth?:boolean; disabled?:boolean; style?:CSSProperties;
}
export function Button({onClick,children,color="#60a5fa",active=false,fullWidth=false,disabled=false,style={}}:Props){
  return (
    <button onClick={onClick} disabled={disabled} style={{
      background:active?`${color}15`:"transparent",
      border:`1px solid ${active||!disabled?color+"40":"#131e33"}`,
      borderRadius:7,color:disabled?"#2d3f5c":color,
      fontSize:12,fontWeight:700,cursor:disabled?"default":"pointer",
      padding:"7px 14px",fontFamily:"inherit",letterSpacing:0.4,
      width:fullWidth?"100%":undefined,...style}}>
      {children}
    </button>
  );
}
