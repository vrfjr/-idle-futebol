import React from "react";
import { useGame } from "../store/GameContext";
import { UPGRADE } from "../store/actions";
import { UPGRADES_DEF } from "../constants/upgrades";
import { upgCost } from "../utils/balance";
import { fmt } from "../utils/helpers";
import { UpgradeKey } from "../types";
import { AccentCard } from "../components/AccentCard";
import { ProgressBar } from "../components/ProgressBar";
import { Button } from "../components/Button";
import { Screen } from "../components/Screen";
import { colors, radii, withAlpha } from "../styles/tokens";

interface Props { onToast:(msg:string,bad?:boolean)=>void; }

export function UpgradesScreen({onToast}:Props) {
  const {state,dispatch} = useGame();

  const doUpgrade=(key:UpgradeKey)=>{
    const cost=upgCost(state.upgrades[key]);
    if(state.coins<cost){onToast("Moedas insuficientes",true);return;}
    dispatch({type:UPGRADE,key}); onToast("Melhoria aplicada");
  };

  return (
    <Screen>
      <div style={{fontSize:17,fontWeight:900,color:colors.textHeading,letterSpacing:-0.3,marginBottom:4}}>Upgrades</div>
      <div style={{fontSize:11,color:colors.textMuted,marginBottom:14}}>
        Saldo: <span style={{color:colors.warning,fontWeight:700}}>💰 {fmt(state.coins)}</span>
      </div>
      {UPGRADES_DEF.map(u=>{
        const lvl=state.upgrades[u.key];
        const cost=upgCost(lvl);
        const canAfford=state.coins>=cost;
        return (
          <AccentCard key={u.key} accent={u.color}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
              <div>
                <div style={{fontSize:14,fontWeight:800,color:colors.textHeading,letterSpacing:0.2}}>{u.label}</div>
                <div style={{fontSize:10,color:colors.textSecondary,marginTop:2}}>{u.desc}</div>
              </div>
              <div style={{width:36,height:36,borderRadius:radii.badge,background:withAlpha(u.color,"subtle"),border:`1px solid ${withAlpha(u.color,"border")}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,fontWeight:900,color:u.color}}>{lvl}</div>
            </div>
            <div style={{marginBottom:10}}>
              <ProgressBar value={(lvl/25)*100} color={u.color}/>
            </div>
            <Button onClick={()=>doUpgrade(u.key)} color={canAfford?u.color:colors.textMuted} active={canAfford} fullWidth size="md">
              Melhorar — {fmt(cost)} 💰
            </Button>
          </AccentCard>
        );
      })}
    </Screen>
  );
}
