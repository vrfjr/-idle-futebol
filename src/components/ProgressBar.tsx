import React from "react";
import { colors, radii } from "../styles/tokens";

interface Props { value:number; color:string; height?:number; }

export function ProgressBar({value,color,height=3}:Props) {
  return (
    <div style={{background:colors.border,borderRadius:radii.tag,height,overflow:"hidden"}}>
      <div style={{background:color,height:"100%",borderRadius:radii.tag,
        width:`${Math.min(100,Math.max(0,value))}%`,transition:"width .4s",opacity:0.7}}/>
    </div>
  );
}
