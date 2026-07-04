import React, { ReactNode } from "react";
import { colors, radii, withAlpha } from "../styles/tokens";

interface Props { accent:string; children:ReactNode; }

export function AccentCard({accent,children}:Props) {
  return (
    <div style={{background:colors.surface,border:`1px solid ${withAlpha(accent,"soft")}`,
      borderLeft:`3px solid ${accent}`,borderRadius:radii.card,padding:"13px 14px",marginBottom:8}}>
      {children}
    </div>
  );
}
