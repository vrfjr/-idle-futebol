import React, { useEffect, useRef, useState } from "react";
import { m } from "framer-motion";
import { CircleDot, Circle } from "lucide-react";
import { colors, radii, shadows, withAlpha } from "../styles/tokens";

interface Props { home:number; away:number; min:number; }

export function MatchScoreboard({home, away, min}:Props) {
  const prevTotal = useRef(home+away);
  const [pulse, setPulse] = useState(0);

  useEffect(()=>{
    const total = home+away;
    if(total > prevTotal.current) setPulse(p=>p+1);
    prevTotal.current = total;
  }, [home, away]);

  return (
    <div style={{margin:"0 14px 12px", background:colors.surface, border:`1px solid ${colors.border}`,
      borderRadius:12, padding:"12px 20px", display:"flex", alignItems:"center", justifyContent:"space-between"}}>
      <div style={{textAlign:"center"}}>
        <div style={{width:38,height:38,borderRadius:radii.badge,background:withAlpha(colors.primary,"soft"),
          border:`1px solid ${withAlpha(colors.primary,"medium")}`,boxShadow:shadows.glow(colors.primary),
          display:"flex",alignItems:"center",justifyContent:"center",marginBottom:4}}>
          <CircleDot size={18} color={colors.primary}/>
        </div>
        <div style={{fontSize:9,color:colors.primary,fontWeight:700,letterSpacing:0.8}}>MEU TIME</div>
      </div>

      <div style={{textAlign:"center"}}>
        <div style={{fontSize:9,color:colors.textMuted,fontWeight:700,letterSpacing:1,marginBottom:4}}>
          {min<90 ? `${min}'` : "FIM"}
        </div>
        <m.div key={pulse} initial={{scale:1}} animate={{scale:[1,1.16,1]}} transition={{duration:0.45}}
          style={{fontSize:42,fontWeight:900,letterSpacing:8,lineHeight:1}}>
          <span style={{color:colors.textHeading}}>{home}</span>
          <span style={{color:colors.textSeparator,margin:"0 2px"}}>:</span>
          <span style={{color:colors.textHeading}}>{away}</span>
        </m.div>
        <div style={{fontSize:8,color:colors.success,fontWeight:700,letterSpacing:2,marginTop:4,
          display:"flex",alignItems:"center",justifyContent:"center",gap:4}}>
          <span style={{display:"inline-block",width:5,height:5,borderRadius:"50%",background:colors.success,
            animation:"pulse 1.5s infinite"}}/>
          AO VIVO
        </div>
      </div>

      <div style={{textAlign:"center"}}>
        <div style={{width:38,height:38,borderRadius:radii.badge,background:withAlpha(colors.rivalDark,"soft"),
          border:`1px solid ${withAlpha(colors.rivalDark,"medium")}`,boxShadow:shadows.glow(colors.rivalDark),
          display:"flex",alignItems:"center",justifyContent:"center",marginBottom:4}}>
          <Circle size={18} color={colors.rivalDark} fill={colors.rivalDark}/>
        </div>
        <div style={{fontSize:9,color:colors.rivalDark,fontWeight:700,letterSpacing:0.8}}>RIVAL</div>
      </div>
    </div>
  );
}
