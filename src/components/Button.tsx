import React, { CSSProperties, ReactNode } from "react";
import { colors, radii, withAlpha } from "../styles/tokens";
interface Props {
  onClick:()=>void; children:ReactNode; color?:string;
  active?:boolean; fullWidth?:boolean; disabled?:boolean; style?:CSSProperties;
}
export function Button({onClick,children,color=colors.primaryLight,active=false,fullWidth=false,disabled=false,style={}}:Props){
  return (
    <button onClick={onClick} disabled={disabled} style={{
      background:active?withAlpha(color,"subtle"):"transparent",
      border:`1px solid ${active||!disabled?withAlpha(color,"medium"):colors.border}`,
      borderRadius:radii.button,color:disabled?colors.textMuted:color,
      fontSize:12,fontWeight:700,cursor:disabled?"default":"pointer",
      padding:"7px 14px",fontFamily:"inherit",letterSpacing:0.4,
      width:fullWidth?"100%":undefined,...style}}>
      {children}
    </button>
  );
}
