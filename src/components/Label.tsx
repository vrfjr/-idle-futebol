import React, { ReactNode } from "react";
import { colors, type } from "../styles/tokens";

interface Props { children:ReactNode; color?:string; }

export function Label({children,color=colors.textMuted}:Props) {
  return (
    <div style={{...type.eyebrow,color,marginBottom:8}}>{children}</div>
  );
}
