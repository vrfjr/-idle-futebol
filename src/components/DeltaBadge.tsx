import React from "react";
import { m, AnimatePresence } from "framer-motion";
import { colors } from "../styles/tokens";

interface Props { value:string; keyId:number; color?:string; }

// Absolutely positioned floating "+N" — parent must be position:relative.
export function DeltaBadge({value, keyId, color=colors.success}:Props) {
  return (
    <AnimatePresence>
      <m.span key={keyId}
        initial={{opacity:0, y:2, scale:0.85}}
        animate={{opacity:1, y:-14, scale:1}}
        exit={{opacity:0}}
        transition={{duration:0.8, ease:"easeOut"}}
        style={{position:"absolute", right:0, top:-2, fontSize:11, fontWeight:900,
          color, pointerEvents:"none", whiteSpace:"nowrap"}}>
        {value}
      </m.span>
    </AnimatePresence>
  );
}
