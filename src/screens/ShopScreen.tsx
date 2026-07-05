import React from "react";
import { AlertTriangle, Gem, Zap } from "lucide-react";
import { useGame } from "../store/GameContext";
import { BUY_PACK, PURCHASE_STORE_OFFER } from "../store/actions";
import { makePlayer } from "../utils/gameLogic";
import { clearSave, suppressAutosave } from "../services/storage";
import { PACKS, PackDef } from "../constants/shop";
import { AccentCard } from "../components/AccentCard";
import { GameButton } from "../components/GameButton";
import { Label } from "../components/Label";
import { Screen } from "../components/Screen";
import { colors, radii, type, withAlpha } from "../styles/tokens";

interface Props { onToast:(msg:string,bad?:boolean)=>void; }

interface StoreOffer {
  key:string;
  title:string;
  desc:string;
  diamonds:number;
  price:string;
  accent:string;
  removeAds?:boolean;
}

const DIAMOND_PACKS: StoreOffer[] = [
  {key:"starter", title:"Punhado de diamantes", desc:"Para ajustes rapidos no clube.", diamonds:80, price:"R$ 4,90", accent:colors.cyan},
  {key:"club", title:"Bolsa do clube", desc:"Mais folego para packs e identidade.", diamonds:220, price:"R$ 12,90", accent:colors.primaryLight},
  {key:"vault", title:"Cofre premium", desc:"Melhor valor para evoluir mais rapido.", diamonds:620, price:"R$ 29,90", accent:colors.violet},
];

const STORE_COMBOS: StoreOffer[] = [
  {key:"adfree", title:"Remover Anuncios", desc:"Compra unica. Libera 3x e bonus sem anuncio.", diamonds:0, price:"R$ 9,90", accent:colors.success, removeAds:true},
  {key:"kickoff", title:"Combo Inicio Forte", desc:"Diamantes + remover anuncios + velocidade 3x.", diamonds:180, price:"R$ 16,90", accent:colors.warning, removeAds:true},
  {key:"manager", title:"Combo Manager Pro", desc:"Pacote grande com todos os beneficios premium.", diamonds:520, price:"R$ 39,90", accent:colors.violet, removeAds:true},
];

export function ShopScreen({onToast}:Props) {
  const {state,dispatch} = useGame();

  const doBuyPack=(pk:PackDef)=>{
    if(state.diamonds<pk.cost){onToast("Diamantes insuficientes",true);return;}
    const players = pk.rarities ? pk.rarities.map(r=>makePlayer(r)) : Array.from({length:pk.count ?? 0},()=>makePlayer());
    dispatch({type:BUY_PACK,players,cost:pk.cost});
    onToast(`${players.length} jogadores adicionados`);
  };

  const purchaseOffer = (offer:StoreOffer) => {
    dispatch({type:PURCHASE_STORE_OFFER, diamonds:offer.diamonds, removeAds:offer.removeAds});
    if(offer.removeAds && offer.diamonds>0) onToast(`${offer.title}: +${offer.diamonds} diamantes e 3x liberado`);
    else if(offer.removeAds) onToast("Anuncios removidos e 3x liberado");
    else onToast(`+${offer.diamonds} diamantes adicionados`);
  };

  const doResetGame = async ()=>{
    const confirmed = window.confirm("Isso vai apagar seu time, elenco, moedas e progresso na liga. Essa acao nao pode ser desfeita. Reiniciar mesmo assim?");
    if(!confirmed) return;
    suppressAutosave();
    await clearSave();
    window.location.reload();
  };

  const renderOffer = (offer:StoreOffer) => (
    <AccentCard key={offer.key} accent={offer.accent}>
      <div style={{display:"flex",alignItems:"center",gap:12}}>
        <div style={{width:38,height:38,borderRadius:radii.badge,
          background:`linear-gradient(160deg, ${withAlpha(offer.accent,"medium")}, ${withAlpha(colors.bgDeep,"strong")})`,
          display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
          {offer.removeAds ? <Zap size={20} color={offer.accent}/> : <Gem size={20} color={offer.accent}/>}
        </div>
        <div style={{flex:1,minWidth:0}}>
          <div style={{...type.cardTitle,color:colors.textHeading,marginBottom:3}}>{offer.title}</div>
          <div style={{fontSize:10,color:colors.textSecondary,lineHeight:1.4}}>{offer.desc}</div>
          {offer.diamonds>0&&<div style={{fontSize:15,color:offer.accent,fontWeight:900,marginTop:3}}>+{offer.diamonds} diamantes</div>}
        </div>
        <GameButton onClick={()=>purchaseOffer(offer)} variant={offer.removeAds?"upgrade":"reward"} color={offer.accent} size="sm"
          disabled={offer.key==="adfree" && state.adsRemoved}>
          {offer.key==="adfree" && state.adsRemoved ? "Ativo" : offer.price}
        </GameButton>
      </div>
    </AccentCard>
  );

  return (
    <Screen>
      <div style={{fontSize:17,fontWeight:900,color:colors.textHeading,letterSpacing:-0.3,marginBottom:4}}>Loja</div>
      <div style={{background:colors.surface,border:`1px solid ${withAlpha(colors.primary,"soft")}`,
        borderRadius:radii.card,padding:"12px 14px",marginBottom:16,display:"flex",alignItems:"center",gap:10}}>
        <Gem size={24} color={colors.primaryLight}/>
        <div>
          <div style={{...type.eyebrow,color:colors.textMuted}}>SEU SALDO</div>
          <div style={{fontSize:24,fontWeight:900,color:colors.primaryLight,letterSpacing:-0.5,lineHeight:1}}>
            {state.diamonds} <span style={{fontSize:12,color:colors.textMuted,fontWeight:600}}>diamantes</span>
          </div>
        </div>
      </div>

      <Label>PACKS DE DIAMANTES</Label>
      {DIAMOND_PACKS.map(renderOffer)}

      <Label>COMBOS</Label>
      {STORE_COMBOS.map(renderOffer)}

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
                    <span key={t.label} style={{fontSize:9,color:t.c,background:withAlpha(t.c,"subtle"),
                      padding:"2px 6px",borderRadius:radii.tag,fontWeight:700,letterSpacing:0.5}}>{t.label}</span>
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
        <div style={{fontSize:10,color:colors.warning,fontWeight:700,marginBottom:3}}>Sobre Lendarios</div>
        <div style={{fontSize:10,color:colors.textMuted,lineHeight:1.6}}>Nao vendidos diretamente. Obtenha via Packs, Eventos ou Progressao.</div>
      </div>

      <div style={{background:withAlpha(colors.danger,"subtle"),border:`1px solid ${withAlpha(colors.danger,"medium")}`,
        borderRadius:radii.card,padding:"13px 14px",marginTop:14}}>
        <div style={{display:"flex",alignItems:"center",gap:6,color:colors.danger,fontWeight:800,fontSize:13,marginBottom:3}}>
          <AlertTriangle size={14}/> Zona de risco
        </div>
        <div style={{fontSize:10,color:colors.textMuted,marginBottom:10,lineHeight:1.6}}>
          Apaga todo o progresso salvo (time, elenco, moedas, liga) e comeca um jogo novo.
        </div>
        <GameButton onClick={doResetGame} variant="secondary" color={colors.danger} fullWidth size="md">
          Reiniciar jogo
        </GameButton>
      </div>
    </Screen>
  );
}
