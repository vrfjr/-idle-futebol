import React from "react";
import { useGame } from "../store/GameContext";
import { BUY_PLAYER, SELL_PLAYER, REFRESH_MARKET } from "../store/actions";
import { makePlayer } from "../utils/gameLogic";
import { fmt } from "../utils/helpers";
import { PlayerCard } from "../components/PlayerCard";
import { Label } from "../components/Label";
import { Screen } from "../components/Screen";
import { colors, radii, withAlpha } from "../styles/tokens";

interface Props { onToast:(msg:string,bad?:boolean)=>void; }

export function MarketScreen({onToast}:Props) {
  const {state, dispatch} = useGame();

  const doBuy = (player:any)=>{
    if(state.coins<player.price){onToast("Moedas insuficientes",true);return;}
    dispatch({type:BUY_PLAYER,player}); onToast(`${player.name} contratado`);
  };

  const doSell = (player:any)=>{
    if(state.lineup.some((l:any)=>l.id===player.id)){onToast("Remova do campo primeiro",true);return;}
    dispatch({type:SELL_PLAYER,player}); onToast(`Vendido por ${fmt(player.sellPrice)}`);
  };

  const doRefresh = ()=>{
    // Guard in UI; reducer also enforces it
    if(state.coins<300){onToast("300 moedas necessárias",true);return;}
    dispatch({type:REFRESH_MARKET,market:Array.from({length:6},()=>makePlayer())});
    onToast("Mercado atualizado");
  };

  return (
    <Screen>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
        <div style={{fontSize:17,fontWeight:900,color:colors.textHeading,letterSpacing:-0.3}}>Mercado</div>
        <button onClick={doRefresh} style={{background:"transparent",border:`1px solid ${colors.border}`,borderRadius:radii.button,color:colors.textSecondary,fontSize:11,fontWeight:700,cursor:"pointer",padding:"6px 12px",fontFamily:"inherit",letterSpacing:0.3}}>
          Atualizar — 300 💰
        </button>
      </div>
      <Label>DISPONÍVEIS</Label>
      <div style={{display:"flex",flexDirection:"column",gap:7,marginBottom:20}}>
        {state.market.map((p:any)=>(
          <PlayerCard key={p.id} player={p} onAction={()=>doBuy(p)}
            actionLabel={`${fmt(p.price)} 💰`} actionColor={state.coins>=p.price?colors.success:"#374151"}/>
        ))}
      </div>
      <Label color={withAlpha(colors.danger,"medium")}>VENDER DO ELENCO</Label>
      <div style={{display:"flex",flexDirection:"column",gap:5}}>
        {state.roster.map((p:any)=>(
          <PlayerCard key={p.id} player={p} compact onAction={()=>doSell(p)}
            actionLabel={`${fmt(p.sellPrice)} 💰`} actionColor={colors.danger}/>
        ))}
        {!state.roster.length&&<div style={{textAlign:"center",color:colors.textMuted,padding:"18px 0",fontSize:12}}>Elenco vazio</div>}
      </div>
    </Screen>
  );
}
