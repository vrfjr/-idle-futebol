import React from "react";
import { Gem, AlertTriangle } from "lucide-react";
import { useGame } from "../store/GameContext";
import { BUY_PACK } from "../store/actions";
import { makePlayer } from "../utils/gameLogic";
import { clearSave, suppressAutosave } from "../services/storage";
import { PACKS, PackDef } from "../constants/shop";
import { AccentCard } from "../components/AccentCard";
import { GameButton } from "../components/GameButton";
import { Label } from "../components/Label";
import { Screen } from "../components/Screen";
import { colors, radii, type, withAlpha } from "../styles/tokens";

interface Props { onToast:(msg:string,bad?:boolean)=>void; }

export function ShopScreen({onToast}:Props) {
  const {state,dispatch} = useGame();

  const doBuyPack=(pk:PackDef)=>{
    if(state.diamonds<pk.cost){onToast("Diamantes insuficientes",true);return;}
    const players = pk.rarities ? pk.rarities.map(r=>makePlayer(r)) : Array.from({length:pk.count ?? 0},()=>makePlayer());
    dispatch({type:BUY_PACK,players,cost:pk.cost});
    onToast(`${players.length} jogadores adicionados`);
  };

  const doResetGame = async ()=>{
    const confirmed = window.confirm("Isso vai apagar seu time, elenco, moedas e progresso na liga. Essa ação não pode ser desfeita. Reiniciar mesmo assim?");
    if(!confirmed) return;
    suppressAutosave();
    await clearSave();
    window.location.reload();
  };

  return (
    <Screen>
      <div style={{fontSize:17,fontWeight:900,color:colors.textHeading,letterSpacing:-0.3,marginBottom:4}}>Loja</div>
      <div style={{background:colors.surface,border:`1px solid ${withAlpha(colors.primary,"soft")}`,borderRadius:radii.card,padding:"12px 14px",marginBottom:16,display:"flex",alignItems:"center",gap:10}}>
        <Gem size={24} color={colors.primaryLight}/>
        <div>
          <div style={{...type.eyebrow,color:colors.textMuted}}>SEU SALDO</div>
          <div style={{fontSize:24,fontWeight:900,color:colors.primaryLight,letterSpacing:-0.5,lineHeight:1}}>
            {state.diamonds} <span style={{fontSize:12,color:colors.textMuted,fontWeight:600}}>diamantes</span>
          </div>
        </div>
      </div>
      <Label>PACKS DE JOGADORES</Label>
      {PACKS.map(pk=>{
        const canAfford=state.diamonds>=pk.cost;
        return (
          <AccentCard key={pk.key} accent={pk.accent}>
            <div style={{display:"flex",alignItems:"center",gap:12}}>
              <div style={{flex:1}}>
                <div style={{...type.cardTitle,color:colors.textHeading,marginBottom:4}}>{pk.title}</div>
                <div style={{fontSize:10,color:colors.textSecondary,marginBottom:6}}>{pk.desc}</div>
                <div style={{display:"flex",gap:4}}>
                  {pk.tags.map(t=>(
                    <span key={t.label} style={{fontSize:9,color:t.c,background:withAlpha(t.c,"subtle"),padding:"2px 6px",borderRadius:radii.tag,fontWeight:700,letterSpacing:0.5}}>{t.label}</span>
                  ))}
                </div>
              </div>
              <GameButton onClick={()=>doBuyPack(pk)} variant="reward" color={pk.accent} size="md" disabled={!canAfford}>
                <span style={{display:"inline-flex",alignItems:"center",gap:4}}><Gem size={13}/> {pk.cost}</span>
              </GameButton>
            </div>
          </AccentCard>
        );
      })}
      <div style={{background:colors.surface,border:"1px solid #1a2540",borderRadius:radii.badge,padding:"10px 12px",marginTop:8,marginBottom:14}}>
        <div style={{fontSize:10,color:colors.warning,fontWeight:700,marginBottom:3}}>Sobre Lendários</div>
        <div style={{fontSize:10,color:colors.textMuted,lineHeight:1.6}}>Não vendidos diretamente. Obtenha via Packs, Eventos ou Progressão.</div>
      </div>
      <div style={{background:colors.surface,border:`1px solid ${withAlpha(colors.primary,"soft")}`,borderRadius:radii.card,padding:"13px 14px"}}>
        <div style={{fontSize:13,fontWeight:800,color:colors.primaryLight,marginBottom:3}}>Remover Anúncios</div>
        <div style={{fontSize:10,color:colors.textMuted,marginBottom:10,lineHeight:1.6}}>Compra única. Bônus disponíveis sem precisar assistir.</div>
        <GameButton onClick={()=>onToast("Anúncios removidos! Obrigado")} variant="primary" fullWidth size="md">
          Comprar — R$ 9,90
        </GameButton>
      </div>
      <div style={{background:withAlpha(colors.danger,"subtle"),border:`1px solid ${withAlpha(colors.danger,"medium")}`,
        borderRadius:radii.card,padding:"13px 14px",marginTop:14}}>
        <div style={{display:"flex",alignItems:"center",gap:6,color:colors.danger,fontWeight:800,fontSize:13,marginBottom:3}}>
          <AlertTriangle size={14}/> Zona de risco
        </div>
        <div style={{fontSize:10,color:colors.textMuted,marginBottom:10,lineHeight:1.6}}>
          Apaga todo o progresso salvo (time, elenco, moedas, liga) e começa um jogo novo.
        </div>
        <GameButton onClick={doResetGame} variant="secondary" color={colors.danger} fullWidth size="md">
          Reiniciar jogo
        </GameButton>
      </div>
    </Screen>
  );
}
