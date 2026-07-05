import React from "react";
import { colors, radii } from "../styles/tokens";

interface Props { value:number; color:string; height?:number; }

export function ProgressBar({value,color,height=5}:Props) {
  const pct = Math.min(100,Math.max(0,value));
  return (
    <div style={{background:colors.border,borderRadius:radii.pill,height,overflow:"hidden"}}>
      <div style={{background:`linear-gradient(90deg, ${color}, ${color})`,height:"100%",borderRadius:radii.pill,
        width:`${pct}%`,transition:"width .5s ease-out",
        boxShadow:pct>0?`0 0 6px ${color}80`:undefined}}/>
    </div>
  );
}
