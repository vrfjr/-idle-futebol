import React from "react";
import { useGame } from "../store/GameContext";
import { BUY_PACK } from "../store/actions";
import { makePlayer } from "../utils/gameLogic";
import { RarityKey } from "../types";
import { colors, radii, withAlpha } from "../styles/tokens";

interface Props { onToast:(msg:string,bad?:boolean)=>void; }

const PACKS = [
  {key:"basic",  title:"Pack Básico",   cost:10,accent:"#6b7280",
   desc:"3 jogadores de qualquer raridade",tags:[{label:"×3",c:"#6b7280"}],rarities:null,count:3},
  {key:"premium",title:"Pack Premium",  cost:25,accent:"#38bdf8",
   desc:"2 Raros + 1 Épico garantidos",tags:[{label:"Raro ×2",c:"#38bdf8"},{label:"Épico ×1",c:"#a78bfa"}],
   rarities:["rare","rare","epic"] as RarityKey[]},
  {key:"legendary",title:"Pack Lendário",cost:60,accent:"#fbbf24",
   desc:"1 Épico + 1 Lendário garantidos",tags:[{label:"Épico ×1",c:"#a78bfa"},{label:"Lendário ×1",c:"#fbbf24"}],
   rarities:["epic","legendary"] as RarityKey[]},
];

export function ShopScreen({onToast}:Props) {
  const {state,dispatch} = useGame();

  const doBuyPack=(pk:typeof PACKS[0])=>{
    if(state.diamonds<pk.cost){onToast("Diamantes insuficientes",true);return;}
    const players = pk.rarities ? pk.rarities.map(r=>makePlayer(r)) : Array.from({length:(pk as any).count},()=>makePlayer());
    dispatch({type:BUY_PACK,players,cost:pk.cost});
    onToast(`${players.length} jogadores adicionados`);
  };

  return (
    <div style={{padding:"16px 14px 8px"}}>
      <div style={{fontSize:17,fontWeight:900,color:colors.textHeading,letterSpacing:-0.3,marginBottom:4}}>Loja</div>
      <div style={{background:colors.surface,border:`1px solid ${withAlpha(colors.primary,"soft")}`,borderRadius:radii.card,padding:"12px 14px",marginBottom:16,display:"flex",alignItems:"center",gap:10}}>
        <span style={{fontSize:24}}>💎</span>
        <div>
          <div style={{fontSize:8,color:colors.textMuted,fontWeight:700,letterSpacing:1.2}}>SEU SALDO</div>
          <div style={{fontSize:24,fontWeight:900,color:colors.primaryLight,letterSpacing:-0.5,lineHeight:1}}>
            {state.diamonds} <span style={{fontSize:12,color:colors.textMuted,fontWeight:600}}>diamantes</span>
          </div>
        </div>
      </div>
      <div style={{fontSize:9,color:colors.textMuted,fontWeight:700,letterSpacing:1.5,marginBottom:8}}>PACKS DE JOGADORES</div>
      {PACKS.map(pk=>{
        const canAfford=state.diamonds>=pk.cost;
        return (
          <div key={pk.key} style={{background:colors.surface,border:`1px solid ${withAlpha(pk.accent,"soft")}`,borderLeft:`3px solid ${pk.accent}`,borderRadius:radii.card,padding:"13px 14px",marginBottom:8,display:"flex",alignItems:"center",gap:12}}>
            <div style={{flex:1}}>
              <div style={{fontSize:14,fontWeight:800,color:colors.textHeading,letterSpacing:0.2,marginBottom:4}}>{pk.title}</div>
              <div style={{fontSize:10,color:colors.textSecondary,marginBottom:6}}>{pk.desc}</div>
              <div style={{display:"flex",gap:4}}>
                {pk.tags.map(t=>(
                  <span key={t.label} style={{fontSize:9,color:t.c,background:withAlpha(t.c,"subtle"),padding:"2px 6px",borderRadius:radii.tag,fontWeight:700,letterSpacing:0.5}}>{t.label}</span>
                ))}
              </div>
            </div>
            <button onClick={()=>doBuyPack(pk)} style={{background:canAfford?withAlpha(pk.accent,"subtle"):"#0d1422",border:`1px solid ${canAfford?withAlpha(pk.accent,"medium"):"#1a2540"}`,borderRadius:radii.badge,padding:"9px 14px",color:canAfford?pk.accent:colors.textMuted,fontSize:13,fontWeight:900,cursor:"pointer",fontFamily:"inherit",flexShrink:0,letterSpacing:0.3,whiteSpace:"nowrap"}}>
              💎 {pk.cost}
            </button>
          </div>
        );
      })}
      <div style={{background:colors.surface,border:"1px solid #1a2540",borderRadius:radii.badge,padding:"10px 12px",marginTop:8,marginBottom:14}}>
        <div style={{fontSize:10,color:colors.warning,fontWeight:700,marginBottom:3}}>Sobre Lendários</div>
        <div style={{fontSize:10,color:colors.textMuted,lineHeight:1.6}}>Não vendidos diretamente. Obtenha via Packs, Eventos ou Progressão.</div>
      </div>
      <div style={{background:colors.surface,border:`1px solid ${withAlpha(colors.primary,"soft")}`,borderRadius:radii.card,padding:"13px 14px"}}>
        <div style={{fontSize:13,fontWeight:800,color:colors.primaryLight,marginBottom:3}}>Remover Anúncios</div>
        <div style={{fontSize:10,color:colors.textMuted,marginBottom:10,lineHeight:1.6}}>Compra única. Bônus disponíveis sem precisar assistir.</div>
        <button onClick={()=>onToast("Anúncios removidos! Obrigado")} style={{width:"100%",padding:10,borderRadius:radii.badge,cursor:"pointer",background:withAlpha(colors.primary,"soft"),border:`1px solid ${withAlpha(colors.primary,"strong")}`,color:colors.primaryLight,fontSize:13,fontWeight:800,fontFamily:"inherit",letterSpacing:0.3}}>
          Comprar — R$ 9,90
        </button>
      </div>
    </div>
  );
}
