import React, { CSSProperties, ReactNode } from "react";
import { m } from "framer-motion";
import { colors, radii, type, withAlpha } from "../styles/tokens";
interface Props {
  onClick:()=>void; children:ReactNode; color?:string;
  active?:boolean; fullWidth?:boolean; disabled?:boolean; size?:"sm"|"md"; style?:CSSProperties;
}
const PADDING = { sm:"7px 14px", md:"9px 14px" };
export function Button({onClick,children,color=colors.primaryLight,active=false,fullWidth=false,disabled=false,size="sm",style={}}:Props){
  return (
    <m.button onClick={onClick} disabled={disabled} whileTap={disabled?undefined:{scale:0.96}} style={{
      background:active?withAlpha(color,"subtle"):"transparent",
      border:`1px solid ${active||!disabled?withAlpha(color,"medium"):colors.border}`,
      borderRadius:radii.button,color:disabled?colors.textMuted:color,
      ...type.buttonLabel,cursor:disabled?"default":"pointer",
      padding:PADDING[size],fontFamily:"inherit",
      width:fullWidth?"100%":undefined,...style}}>
      {children}
    </m.button>
  );
}
