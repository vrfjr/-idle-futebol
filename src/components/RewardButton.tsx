import React from "react";
import { m } from "framer-motion";
import { Tv, ChevronRight, Coins, Gem } from "lucide-react";
import { colors, radii, withAlpha, shade, elevation } from "../styles/tokens";

interface Props { coins:number; diamonds:number; onClick:()=>void; label?:string; }

const TEXT = "#2a1400";

export function RewardButton({coins, diamonds, onClick, label="ASSISTIR ANÚNCIO"}:Props) {
  const base = colors.warning;
  return (
    <m.button onClick={onClick} whileTap={{scale:0.97, y:1, boxShadow:elevation.pressed(base)}}
      style={{
        position:"relative", overflow:"hidden", width:"100%", textAlign:"left",
        padding:"13px 16px", borderRadius:radii.card, cursor:"pointer",
        border:`1px solid ${shade(base,-35)}`,
        background:`linear-gradient(180deg, ${shade(base,26)}, ${base} 55%, ${shade(base,-12)})`,
        boxShadow:elevation.raised(base), fontFamily:"inherit", WebkitTapHighlightColor:"transparent",
      }}>
      <span className="reward-shine"/>
      <span style={{display:"flex",alignItems:"center",justifyContent:"space-between",position:"relative",zIndex:1}}>
        <span style={{display:"flex",alignItems:"center",gap:10}}>
          <span style={{width:32,height:32,borderRadius:radii.badge,background:"rgba(0,0,0,0.16)",
            display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
            <Tv size={16} color={TEXT}/>
          </span>
          <span>
            <div style={{fontSize:12,fontWeight:900,color:TEXT,letterSpacing:0.5}}>{label}</div>
            <div style={{display:"flex",alignItems:"center",gap:5,marginTop:3,fontSize:14,fontWeight:900,color:TEXT}}>
              +{coins}<Coins size={13}/>
              <span style={{opacity:0.45,margin:"0 2px"}}>•</span>
              +{diamonds}<Gem size={13}/>
            </div>
          </span>
        </span>
        <span style={{width:26,height:26,borderRadius:"50%",background:withAlpha("#000000","subtle"),
          display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
          <ChevronRight size={16} color={TEXT}/>
        </span>
      </span>
    </m.button>
  );
}
