import React from "react";
import { Coins, Zap, Plus } from "lucide-react";
import { colors, radii, shadows, withAlpha } from "../styles/tokens";
import { fmt } from "../utils/helpers";
import { useDeltaFlash } from "../hooks/useDeltaFlash";
import { DeltaBadge } from "./DeltaBadge";

interface Props { coins:number; pps:number; onAddCoins:()=>void; }

// Passive income ticks coins up by `pps` every second — filtering the flash to
// diffs larger than one tick keeps the badge reserved for real bonuses
// (ad reward, round win) instead of firing every second forever.
export function ResourceBar({coins, pps, onAddCoins}:Props) {
  const coinFlash = useDeltaFlash(coins, pps+1);
  const ppsFlash = useDeltaFlash(pps, 1, d=>`+${Math.round(d)}/s`);

  return (
    <div style={{display:"flex", gap:8}}>
      <div style={{flex:2, background:`linear-gradient(180deg, ${colors.surfaceAlt}, ${colors.panel})`,
        border:`1px solid ${withAlpha(colors.warning,"medium")}`,
        borderRadius:radii.card, padding:"9px 10px 9px 12px", display:"flex", alignItems:"center", gap:9,
        boxShadow:shadows.panel}}>
        <div style={{width:30,height:30,borderRadius:radii.badge,background:withAlpha(colors.warning,"soft"),
          border:`1px solid ${withAlpha(colors.warning,"medium")}`,
          display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,boxShadow:shadows.glow(colors.warning,"10px")}}>
          <Coins size={16} color={colors.warning}/>
        </div>
        <div style={{flex:1,minWidth:0,position:"relative"}}>
          <div style={{fontSize:9,color:colors.textMuted,fontWeight:700,letterSpacing:1}}>MOEDAS</div>
          <div style={{fontSize:18,fontWeight:900,color:colors.warning,letterSpacing:-0.3,lineHeight:1.25}}>{fmt(coins)}</div>
          {coinFlash && <DeltaBadge keyId={coinFlash.id} value={coinFlash.text} color={colors.warning}/>}
        </div>
        <button onClick={onAddCoins} style={{width:27,height:27,flexShrink:0,borderRadius:radii.tag,
          background:`linear-gradient(180deg, ${colors.warning}, #b7f530)`,border:`1px solid ${withAlpha(colors.warning,"strong")}`,
          color:colors.warning,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",padding:0,
          boxShadow:`0 2px 0 ${withAlpha(colors.warning,"strong")}`}}>
          <Plus size={14} color="#102034"/>
        </button>
      </div>

      <div style={{flex:1, position:"relative", background:`linear-gradient(180deg, ${colors.surfaceAlt}, ${colors.panel})`,
        border:`1px solid ${withAlpha(colors.success,"medium")}`, borderTop:`2px solid ${colors.success}`,
        borderRadius:radii.card, padding:"9px 10px",
        display:"flex", flexDirection:"column", justifyContent:"center",boxShadow:shadows.panel}}>
        <div style={{display:"flex",alignItems:"center",gap:4,fontSize:9,color:colors.textMuted,fontWeight:700,letterSpacing:1}}>
          <Zap size={11} color={colors.success}/>/SEG
        </div>
        <div style={{fontSize:18,fontWeight:900,color:colors.success,letterSpacing:-0.3,position:"relative",display:"inline-block"}}>
          +{pps}
          {ppsFlash && <DeltaBadge keyId={ppsFlash.id} value={ppsFlash.text} color={colors.success}/>}
        </div>
      </div>
    </div>
  );
}
