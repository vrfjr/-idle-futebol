import React from "react";
import { useGame } from "../store/GameContext";
import { UPGRADE } from "../store/actions";
import { UPGRADES_DEF } from "../constants/upgrades";
import { upgCost } from "../utils/balance";
import { fmt } from "../utils/helpers";
import { UpgradeKey } from "../types";

interface Props { onToast:(msg:string,bad?:boolean)=>void; }

export function UpgradesScreen({onToast}:Props) {
  const {state,dispatch} = useGame();

  const doUpgrade=(key:UpgradeKey)=>{
    const cost=upgCost(state.upgrades[key]);
    if(state.coins<cost){onToast("Moedas insuficientes",true);return;}
    dispatch({type:UPGRADE,key}); onToast("Melhoria aplicada");
  };

  return (
    <div style={{padding:"16px 14px 8px"}}>
      <div style={{fontSize:17,fontWeight:900,color:"#e2e8f0",letterSpacing:-0.3,marginBottom:4}}>Upgrades</div>
      <div style={{fontSize:11,color:"#2d3f5c",marginBottom:14}}>
        Saldo: <span style={{color:"#fbbf24",fontWeight:700}}>💰 {fmt(state.coins)}</span>
      </div>
      {UPGRADES_DEF.map(u=>{
        const lvl=state.upgrades[u.key];
        const cost=upgCost(lvl);
        const canAfford=state.coins>=cost;
        return (
          <div key={u.key} style={{background:"#090f1e",border:`1px solid ${u.color}15`,borderLeft:`3px solid ${u.color}60`,borderRadius:10,padding:"13px 14px",marginBottom:8}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
              <div>
                <div style={{fontSize:14,fontWeight:800,color:"#e2e8f0",letterSpacing:0.2}}>{u.label}</div>
                <div style={{fontSize:10,color:"#475569",marginTop:2}}>{u.desc}</div>
              </div>
              <div style={{width:36,height:36,borderRadius:8,background:`${u.color}12`,border:`1px solid ${u.color}30`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,fontWeight:900,color:u.color}}>{lvl}</div>
            </div>
            <div style={{background:"#131e33",borderRadius:3,height:3,marginBottom:10,overflow:"hidden"}}>
              <div style={{background:u.color,height:"100%",borderRadius:3,width:`${Math.min(100,(lvl/25)*100)}%`,transition:"width .4s",opacity:0.7}}/>
            </div>
            <button onClick={()=>doUpgrade(u.key)} style={{width:"100%",padding:9,borderRadius:7,cursor:"pointer",fontFamily:"inherit",background:canAfford?`${u.color}12`:"transparent",border:`1px solid ${canAfford?u.color+"40":"#131e33"}`,color:canAfford?u.color:"#2d3f5c",fontSize:12,fontWeight:800,letterSpacing:0.5}}>
              Melhorar — {fmt(cost)} 💰
            </button>
          </div>
        );
      })}
    </div>
  );
}
