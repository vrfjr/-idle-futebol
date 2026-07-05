import React from "react";
import { m, AnimatePresence } from "framer-motion";
import { colors } from "../styles/tokens";

interface Props { value:string; keyId:number; color?:string; }

// Absolutely positioned floating "+N" — parent must be position:relative.
export function DeltaBadge({value, keyId, color=colors.success}:Props) {
  return (
    <AnimatePresence>
      <m.span key={keyId}
        initial={{opacity:0, y:4, scale:0.85}}
        animate={{opacity:[0,1,1,0], y:[4,-10,-22,-34], scale:[0.85,1.05,1,0.95]}}
        exit={{opacity:0, y:-38}}
        transition={{duration:0.9, times:[0,0.2,0.68,1], ease:"easeOut"}}
        style={{position:"absolute", right:0, top:-2, fontSize:11, fontWeight:900,
          color, pointerEvents:"none", whiteSpace:"nowrap"}}>
        {value}
      </m.span>
    </AnimatePresence>
  );
}
