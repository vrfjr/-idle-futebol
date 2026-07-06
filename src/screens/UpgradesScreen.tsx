import React, { useState } from "react";
import { AnimatePresence, m } from "framer-motion";
import { Coins, Crown } from "lucide-react";
import { useGame } from "../store/GameContext";
import { UPGRADE, PRESTIGE_RESET } from "../store/actions";
import { UPGRADES_DEF } from "../constants/upgrades";
import { legacyPointsOnReset } from "../store/gameReducer";
import { LEGACY_INCOME_PER_POINT, LEGACY_POWER_PER_POINT } from "../constants/economy";
import { upgCost } from "../utils/balance";
import { fmt } from "../utils/helpers";
import { UpgradeKey } from "../types";
import { AccentCard } from "../components/AccentCard";
import { ProgressBar } from "../components/ProgressBar";
import { GameButton } from "../components/GameButton";
import { Screen } from "../components/Screen";
import { colors, radii, withAlpha } from "../styles/tokens";

interface Props { onToast:(msg:string,bad?:boolean)=>void; }

export function UpgradesScreen({onToast}:Props) {
  const {state,dispatch} = useGame();
  const [confirmReset, setConfirmReset] = useState(false);
  const legacy = state.legacy;
  const legacyPoints = legacy?.points ?? 0;
  const legacyEarnable = legacyPointsOnReset(state);

  const doUpgrade=(key:UpgradeKey)=>{
    const cost=upgCost(state.upgrades[key]);
    if(state.coins<cost){onToast("Moedas insuficientes",true);return;}
    dispatch({type:UPGRADE,key}); onToast("Melhoria aplicada");
  };

  return (
    <Screen>
      <div style={{fontSize:17,fontWeight:900,color:colors.textHeading,letterSpacing:-0.3,marginBottom:4}}>Upgrades</div>
      <div style={{fontSize:11,color:colors.textMuted,marginBottom:14,display:"flex",alignItems:"center",gap:5}}>
        Saldo: <Coins size={12} color={colors.warning}/> <span style={{color:colors.warning,fontWeight:700}}>{fmt(state.coins)}</span>
      </div>

      {(legacyPoints>0 || legacy?.eliteChampion) && (
        <AccentCard accent={colors.warning}>
          <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:6}}>
            <Crown size={16} color={colors.warning}/>
            <div style={{fontSize:14,fontWeight:800,color:colors.textHeading}}>Legado</div>
          </div>
          <div style={{fontSize:11,color:colors.textSecondary,fontWeight:700,marginBottom:8}}>
            {legacyPoints>0 && (
              <div>
                {legacyPoints} pontos de Legado: +{Math.round(legacyPoints*LEGACY_INCOME_PER_POINT*100)}% renda,
                +{Math.round(legacyPoints*LEGACY_POWER_PER_POINT*100)}% poder (permanente).
              </div>
            )}
            {legacy?.eliteChampion && (
              <div style={{color:colors.warning,marginTop:4}}>
                Voce e campeao da Liga 1! Recomecar da Liga 25 agora rende +{legacyEarnable} pontos de Legado.
              </div>
            )}
          </div>
          {legacy?.eliteChampion && (
            confirmReset ? (
              <div style={{display:"flex",gap:6}}>
                <GameButton variant="upgrade" color={colors.warning} size="md" onClick={()=>{
                  dispatch({type:PRESTIGE_RESET, now:Date.now()});
                  setConfirmReset(false);
                  onToast(`Novo Legado! +${legacyEarnable} pontos permanentes`);
                }}>
                  Confirmar reinicio
                </GameButton>
                <GameButton variant="secondary" color={colors.textMuted} size="md" onClick={()=>setConfirmReset(false)}>
                  Cancelar
                </GameButton>
              </div>
            ) : (
              <GameButton variant="upgrade" color={colors.warning} fullWidth size="md" onClick={()=>setConfirmReset(true)}>
                <span style={{display:"inline-flex",alignItems:"center",gap:5}}>
                  <Crown size={13}/> Recomecar com +{legacyEarnable} pontos de Legado
                </span>
              </GameButton>
            )
          )}
        </AccentCard>
      )}

      {UPGRADES_DEF.map(u=>{
        const lvl=state.upgrades[u.key];
        const cost=upgCost(lvl);
        const canAfford=state.coins>=cost;
        const Icon = u.icon;
        return (
          <AccentCard key={u.key} accent={u.color}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
              <div style={{display:"flex",alignItems:"center",gap:8}}>
                <Icon size={16} color={u.color}/>
                <div>
                  <div style={{fontSize:14,fontWeight:800,color:colors.textHeading,letterSpacing:0.2}}>{u.label}</div>
                  <div style={{fontSize:10,color:colors.textSecondary,marginTop:2}}>{u.desc}</div>
                </div>
              </div>
              <div style={{width:36,height:36,borderRadius:radii.badge,background:withAlpha(u.color,"subtle"),border:`1px solid ${withAlpha(u.color,"border")}`,display:"flex",alignItems:"center",justifyContent:"center",overflow:"hidden"}}>
                <AnimatePresence mode="popLayout">
                  <m.span key={lvl} initial={{opacity:0,scale:0.4,y:8}} animate={{opacity:1,scale:1,y:0}} transition={{duration:0.25}}
                    style={{fontSize:16,fontWeight:900,color:u.color}}>
                    {lvl}
                  </m.span>
                </AnimatePresence>
              </div>
            </div>
            <div style={{marginBottom:10}}>
              <ProgressBar value={(lvl/25)*100} color={u.color}/>
            </div>
            <GameButton onClick={()=>doUpgrade(u.key)} variant="upgrade" color={u.color} fullWidth size="md" disabled={!canAfford}>
              <span style={{display:"inline-flex",alignItems:"center",gap:5}}>Melhorar — {fmt(cost)} <Coins size={12}/></span>
            </GameButton>
          </AccentCard>
        );
      })}
    </Screen>
  );
}
