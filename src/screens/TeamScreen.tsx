import React, { useMemo, useState } from "react";
import { AnimatePresence, m } from "framer-motion";
import { AlertTriangle, Filter, RotateCcw, Save, Search, Trash2, Wand2 } from "lucide-react";
import { useGame } from "../store/GameContext";
import { SET_FORMATION, SET_LINEUP, SET_TEAM_IDENTITY, TOGGLE_SQUAD } from "../store/actions";
import { IDENTITY_CHANGE_DIAMOND_COST } from "../store/gameReducer";
import { calcPowerBreakdown } from "../utils/balance";
import { fieldLayout, FORMATIONS_LIST } from "../constants/formations";
import { FormationKey, Player, PositionKey, RarityKey } from "../types";
import { ALL_POSITIONS, AssignedFieldSlot, assignPlayersToSlots, pickBalancedLineup, positionStatus, scorePlayerForRole, slotEfficiency, validateLineup } from "../utils/lineup";
import { PlayerCard } from "../components/PlayerCard";
import { GameButton } from "../components/GameButton";
import { Label } from "../components/Label";
import { PowerTooltip } from "../components/PowerTooltip";
import { Screen } from "../components/Screen";
import { colors, radii, shadows, withAlpha } from "../styles/tokens";

const TEAM_COLORS = [
  "#2458d8", "#dc2626", "#059669", "#7c3aed",
  "#ea580c", "#0891b2", "#db2777", "#ca8a04",
];

const POS_FILTERS: (PositionKey|"TODOS")[] = ["TODOS", ...ALL_POSITIONS];
const RARITY_FILTERS: (RarityKey|"TODAS")[] = ["TODAS","common","rare","epic","legendary"];
const RARITY_LABEL: Record<RarityKey|"TODAS", string> = {
  TODAS:"Todas", common:"Comum", rare:"Raro", epic:"Epico", legendary:"Lendario",
};
const FIELD_W = 320;
const FIELD_H = 244;
const PLAYER_MARKER_W = 44;
const PLAYER_MARKER_H = 38;

interface Props { onToast:(msg:string,bad?:boolean)=>void; }

function shortPlayerName(name:string): string {
  return name.split(" ")[0].slice(0, 8);
}

function TacticalPitch({
  slots, color, selectedId, selectedSlotNum, recommendedSlotNums, onSlotClick,
}:{
  slots:AssignedFieldSlot[];
  color:string;
  selectedId:string|null;
  selectedSlotNum:number|null;
  recommendedSlotNums:Set<number>;
  onSlotClick:(slot:AssignedFieldSlot)=>void;
}) {
  return (
    <div style={{borderRadius:radii.card,overflow:"hidden",
      background:`linear-gradient(180deg, ${colors.surfaceAlt}, ${colors.panel})`,
      border:`1px solid ${withAlpha(colors.cyan,"soft")}`,boxShadow:shadows.panel,marginBottom:14}}>
      <div style={{height:34,display:"flex",alignItems:"center",justifyContent:"space-between",padding:"0 11px",
        borderBottom:`1px solid ${withAlpha(colors.cyan,"soft")}`}}>
        <div style={{fontSize:11,color:colors.cyan,fontWeight:900,letterSpacing:0.7}}>CAMPO TATICO</div>
        <div style={{fontSize:10,color:colors.textMuted,fontWeight:900,letterSpacing:1}}>TOQUE PARA TROCAR</div>
      </div>
      <div style={{position:"relative",height:FIELD_H,margin:9,borderRadius:8,overflow:"hidden",
        background:"repeating-linear-gradient(90deg,#155f35 0,#155f35 32px,#19723e 32px,#19723e 64px)",
        border:"1px solid rgba(255,255,255,0.18)"}}>
        <div style={{position:"absolute",left:7,right:7,top:7,bottom:7,border:"1px solid rgba(255,255,255,0.24)",borderRadius:5}}/>
        <div style={{position:"absolute",left:"50%",top:7,bottom:7,width:1,background:"rgba(255,255,255,0.24)"}}/>
        <div style={{position:"absolute",left:"50%",top:"50%",width:50,height:50,border:"1px solid rgba(255,255,255,0.22)",borderRadius:"50%",transform:"translate(-50%,-50%)"}}/>
        <div style={{position:"absolute",left:7,top:"29%",width:44,height:"42%",border:"1px solid rgba(255,255,255,0.24)",borderLeft:"none"}}/>
        {slots.map(slot=>{
          const p = slot.player;
          const selected = !!p && p.id===selectedId;
          const selectedSlot = selectedSlotNum===slot.num;
          const recommended = recommendedSlotNums.has(slot.num);
          const status = positionStatus(p, slot.role);
          const statusColor = status.colorKey==="success" ? colors.success : status.colorKey==="warning" ? colors.warning : colors.danger;
          const outerRing = selected||selectedSlot ? colors.warning : recommended ? colors.warning : "#05070d";
          const shadow = selected||selectedSlot
            ? `0 0 0 2px #ffffff, 0 0 0 5px ${outerRing}, 0 0 20px ${withAlpha(colors.warning,"strong")}`
            : recommended
              ? `0 0 0 2px #ffffff, 0 0 0 5px ${outerRing}, 0 0 16px ${withAlpha(colors.warning,"strong")}`
              : p
                ? `0 0 0 2px #ffffff, 0 0 0 4px ${outerRing}, 0 0 10px ${withAlpha(color,"strong")}`
                : `0 0 0 2px #ffffff, 0 0 0 4px ${outerRing}`;
          return (
            <button key={slot.num} onClick={()=>onSlotClick(slot)} title={p?`${p.name} | ${status.label}`:`Vaga ${slot.role}`}
              style={{position:"absolute",left:`${(slot.x/FIELD_W)*100}%`,top:`${(slot.y/FIELD_H)*100}%`,
                transform:"translate(-50%,-50%)",width:PLAYER_MARKER_W,height:PLAYER_MARKER_H,borderRadius:8,padding:0,cursor:"pointer",
                background:p?`linear-gradient(180deg, ${withAlpha(color,"strong")}, ${color})`:withAlpha(colors.textMuted,"soft"),
                border:"2px solid #05070d",
                color:colors.textHeading,boxShadow:shadow,
                fontFamily:"inherit",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:1}}>
              <span style={{fontSize:8,fontWeight:900,lineHeight:1}}>{p ? shortPlayerName(p.name) : "VAGA"}</span>
              <span style={{fontSize:10,fontWeight:900,lineHeight:1}}>{p ? `${p.pos} ${p.ovr}` : slot.role}</span>
              {p && status.efficiency<1 && <span style={{fontSize:7,fontWeight:900,color:statusColor,lineHeight:1}}>{Math.round(status.efficiency*100)}%</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function TeamScreen({onToast}:Props) {
  const {state, dispatch} = useGame();
  const [savedLineup, setSavedLineup] = useState<Player[]>(state.lineup);
  const [selectedId, setSelectedId] = useState<string|null>(null);
  const [selectedSlotNum, setSelectedSlotNum] = useState<number|null>(null);
  const [nameInput, setNameInput] = useState(state.teamName);
  const [search, setSearch] = useState("");
  const [posFilter, setPosFilter] = useState<PositionKey|"TODOS">("TODOS");
  const [rarityFilter, setRarityFilter] = useState<RarityKey|"TODAS">("TODAS");

  const bench = state.roster.filter(p=>!state.lineup.some(l=>l.id===p.id));
  const selectedPlayer = selectedId ? state.roster.find(p=>p.id===selectedId) ?? null : null;
  const powerBreakdown = calcPowerBreakdown(state.lineup, state.formation, state.upgrades);
  const pwr = powerBreakdown.total;
  const lineupIssues = validateLineup(state.lineup, state.formation);

  const matchesFilters = (player:Player) => {
    const q = search.trim().toLowerCase();
    const byText = !q || player.name.toLowerCase().includes(q) || player.pos.toLowerCase().includes(q);
    const byPos = posFilter==="TODOS" || player.pos===posFilter;
    const byRarity = rarityFilter==="TODAS" || player.rarity===rarityFilter;
    return byText && byPos && byRarity;
  };

  const filteredBench = bench.filter(matchesFilters);
  const tacticalSlots = useMemo(
    ()=>assignPlayersToSlots(state.lineup, fieldLayout(state.formation, true, FIELD_W, FIELD_H)),
    [state.lineup, state.formation],
  );
  const orderedLineup = useMemo(
    ()=>tacticalSlots.map(slot=>slot.player).filter((player): player is Player=>!!player),
    [tacticalSlots],
  );
  const filteredLineup = orderedLineup.filter(matchesFilters);
  const selectedIsStarter = !!selectedPlayer && state.lineup.some(p=>p.id===selectedPlayer.id);
  const selectedSlot = selectedPlayer ? tacticalSlots.find(slot=>slot.player?.id===selectedPlayer.id) : undefined;
  const fieldSwapCandidates = useMemo(()=>(
    selectedPlayer && !selectedIsStarter
      ? tacticalSlots
        .filter(slot=>slot.player)
        .map(slot=>({
          slot,
          player: slot.player!,
          score: scorePlayerForRole(selectedPlayer, slot.role),
          efficiency: slotEfficiency(selectedPlayer, slot.role),
          status: positionStatus(selectedPlayer, slot.role),
        }))
        .sort((a,b)=>b.score-a.score || b.efficiency-a.efficiency || b.player.ovr-a.player.ovr)
      : []
  ), [selectedPlayer, selectedIsStarter, tacticalSlots]);
  const benchSwapCandidates = useMemo(()=>(
    selectedPlayer && selectedIsStarter && selectedSlot
      ? bench
        .map(player=>({
          player,
          score: scorePlayerForRole(player, selectedSlot.role),
          efficiency: slotEfficiency(player, selectedSlot.role),
          status: positionStatus(player, selectedSlot.role),
        }))
        .sort((a,b)=>b.score-a.score || b.efficiency-a.efficiency || b.player.ovr-a.player.ovr)
      : []
  ), [bench, selectedIsStarter, selectedPlayer, selectedSlot]);
  const recommendedSlotNums = useMemo(()=>(
    new Set(fieldSwapCandidates
      .filter((candidate,index)=>candidate.efficiency>=0.75 || index<3)
      .slice(0,4)
      .map(candidate=>candidate.slot.num))
  ), [fieldSwapCandidates]);

  const setLineup = (lineup:Player[]) => dispatch({type:SET_LINEUP, lineup});

  const replaceLineupPlayer = (outPlayer:Player, inPlayer:Player)=>{
    setLineup(state.lineup.map(p=>p.id===outPlayer.id ? inPlayer : p));
    setSelectedId(null);
    setSelectedSlotNum(null);
    onToast(`${inPlayer.name} entrou no lugar de ${outPlayer.name}`);
  };

  const handleSlotClick = (slot:AssignedFieldSlot)=>{
    setSelectedSlotNum(slot.num);
    if(!selectedPlayer){
      if(slot.player) setSelectedId(slot.player.id);
      return;
    }

    const next = state.lineup.slice();
    const selectedIdx = next.findIndex(p=>p.id===selectedPlayer.id);
    const targetIdx = slot.player ? next.findIndex(p=>p.id===slot.player!.id) : -1;
    const replacedName = slot.player?.name;

    if(targetIdx>=0){
      if(selectedIdx>=0){
        next[selectedIdx] = next[targetIdx];
        next[targetIdx] = selectedPlayer;
      } else {
        next[targetIdx] = selectedPlayer;
      }
    } else if(selectedIdx<0){
      if(next.length>=11){
        onToast("Escolha uma posicao ocupada para trocar", true);
        return;
      }
      next.push(selectedPlayer);
    }

    setLineup(next);
    setSelectedId(null);
    if(replacedName) onToast(`${selectedPlayer.name} trocou com ${replacedName}`);
  };

  const toggleSquad = (player:Player)=>{
    dispatch({type:TOGGLE_SQUAD, player});
    if(selectedId===player.id) setSelectedId(null);
  };

  const commitName = ()=>{
    const name = nameInput.trim() || state.teamName;
    if(name===state.teamName){
      setNameInput(state.teamName);
      return;
    }
    const diamondCost = state.freeNameChangeUsed ? IDENTITY_CHANGE_DIAMOND_COST : 0;
    if(state.diamonds<diamondCost){
      setNameInput(state.teamName);
      onToast(`Alterar nome custa ${IDENTITY_CHANGE_DIAMOND_COST} diamantes`, true);
      return;
    }
    setNameInput(name);
    dispatch({type:SET_TEAM_IDENTITY, name, color:state.teamColor, diamondCost, markNameChange:true});
    onToast(diamondCost>0 ? `Nome alterado por ${diamondCost} diamantes` : "Nome alterado");
  };
  const pickColor = (color:string)=>{
    if(color===state.teamColor) return;
    const diamondCost = state.freeColorChangeUsed ? IDENTITY_CHANGE_DIAMOND_COST : 0;
    if(state.diamonds<diamondCost){
      onToast(`Alterar cor custa ${IDENTITY_CHANGE_DIAMOND_COST} diamantes`, true);
      return;
    }
    dispatch({type:SET_TEAM_IDENTITY, name:state.teamName, color, diamondCost, markColorChange:true});
    onToast(diamondCost>0 ? `Cor alterada por ${diamondCost} diamantes` : "Cor alterada");
  };

  return (
    <Screen>
      <div style={{fontSize:18,fontWeight:900,color:colors.textHeading,letterSpacing:0,marginBottom:12}}>Time e taticas</div>

      <Label>IDENTIDADE DO CLUBE</Label>
      <div style={{background:`linear-gradient(180deg, ${colors.surfaceAlt}, ${colors.panel})`,border:`1px solid ${colors.border}`,
        borderRadius:radii.card,padding:"12px 14px",marginBottom:16,boxShadow:shadows.panel}}>
        <div style={{fontSize:10,color:colors.textMuted,fontWeight:800,marginBottom:8}}>
          Primeira troca de nome e cor gratis. Depois: {IDENTITY_CHANGE_DIAMOND_COST} diamantes cada.
        </div>
        <input value={nameInput} onChange={e=>setNameInput(e.target.value)} onBlur={commitName}
          maxLength={24} placeholder="Nome do time"
          style={{width:"100%",background:"#050a14",border:`1px solid ${colors.border}`,borderRadius:radii.button,
            color:colors.textHeading,fontSize:15,fontWeight:800,fontFamily:"inherit",padding:"9px 10px",marginBottom:10,outline:"none"}}/>
        <div style={{display:"flex",gap:7,flexWrap:"wrap"}}>
          {TEAM_COLORS.map(c=>(
            <button key={c} onClick={()=>pickColor(c)} aria-label={c} style={{
              width:28,height:28,borderRadius:radii.badge,background:c,cursor:"pointer",padding:0,
              border:"2px solid #05070d",
              boxShadow:state.teamColor===c
                ? `0 0 0 2px #ffffff, 0 0 0 5px ${c}, 0 0 14px ${withAlpha(c,"strong")}`
                : "0 0 0 2px #ffffff"}}/>
          ))}
        </div>
      </div>

      <Label>FORMACAO</Label>
      <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:10}}>
        {FORMATIONS_LIST.map(f=>(
          <GameButton key={f} variant="secondary" size="sm"
            color={state.formation===f?colors.cyan:colors.textMuted}
            onClick={()=>dispatch({type:SET_FORMATION,formation:f as FormationKey})}>
            {f}
          </GameButton>
        ))}
      </div>

      <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:12}}>
        <GameButton variant="upgrade" color={colors.success} size="sm" onClick={()=>{
          setLineup(pickBalancedLineup(state.roster, state.formation));
          setSelectedId(null);
          setSelectedSlotNum(null);
          onToast("Melhor escalacao aplicada");
        }}>
          <Wand2 size={13}/> Melhor escalacao
        </GameButton>
        <GameButton variant="secondary" color={colors.warning} size="sm" onClick={()=>{
          setLineup(savedLineup);
          setSelectedId(null);
          setSelectedSlotNum(null);
          onToast("Escalacao restaurada");
        }}>
          <RotateCcw size={13}/> Restaurar
        </GameButton>
        <GameButton variant="secondary" color={colors.danger} size="sm" onClick={()=>{
          setLineup([]);
          setSelectedId(null);
          setSelectedSlotNum(null);
        }}>
          <Trash2 size={13}/> Limpar
        </GameButton>
        <GameButton variant="secondary" color={colors.cyan} size="sm" onClick={()=>{
          setSavedLineup(state.lineup);
          onToast("Formacao salva");
        }}>
          <Save size={13}/> Salvar
        </GameButton>
      </div>

      <TacticalPitch slots={tacticalSlots} color={state.teamColor} selectedId={selectedId} selectedSlotNum={selectedSlotNum}
        recommendedSlotNums={recommendedSlotNums} onSlotClick={handleSlotClick}/>

      {selectedPlayer&&(
        <div style={{background:withAlpha(colors.warning,"subtle"),border:`1px solid ${withAlpha(colors.warning,"medium")}`,
          borderRadius:radii.card,padding:"9px 11px",marginBottom:12,display:"flex",alignItems:"center",justifyContent:"space-between",gap:8}}>
          <div>
            <div style={{fontSize:9,color:colors.textMuted,fontWeight:900,letterSpacing:1}}>SELECIONADO</div>
            <div style={{fontSize:13,color:colors.warning,fontWeight:900}}>{selectedPlayer.name} - {selectedPlayer.pos} OVR {selectedPlayer.ovr}</div>
          </div>
          <GameButton variant="secondary" color={colors.textMuted} size="sm" onClick={()=>{ setSelectedId(null); setSelectedSlotNum(null); }}>Cancelar</GameButton>
        </div>
      )}

      {selectedPlayer&&!selectedIsStarter&&(
        <div style={{background:`linear-gradient(180deg, ${colors.surfaceAlt}, ${colors.panel})`,border:`1px solid ${withAlpha(colors.warning,"border")}`,
          borderRadius:radii.card,padding:"10px 11px",marginBottom:12,boxShadow:shadows.panel}}>
          <div style={{fontSize:10,color:colors.warning,fontWeight:900,letterSpacing:1.1,marginBottom:7}}>TROCAS RECOMENDADAS</div>
          <div style={{display:"flex",flexDirection:"column",gap:6}}>
            {fieldSwapCandidates.slice(0,4).map(candidate=>{
              const statusColor = candidate.status.colorKey==="success" ? colors.success : candidate.status.colorKey==="warning" ? colors.warning : colors.danger;
              return (
                <button key={candidate.slot.num} onClick={()=>handleSlotClick(candidate.slot)}
                  style={{width:"100%",display:"grid",gridTemplateColumns:"1fr auto",gap:8,alignItems:"center",
                    textAlign:"left",background:"#050a14",border:`1px solid ${withAlpha(statusColor,"medium")}`,
                    borderRadius:radii.button,padding:"8px 9px",fontFamily:"inherit",cursor:"pointer",color:colors.textHeading}}>
                  <span style={{minWidth:0}}>
                    <span style={{display:"block",fontSize:12,fontWeight:900,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>
                      {candidate.player.name}
                    </span>
                    <span style={{display:"block",fontSize:10,color:colors.textMuted,fontWeight:800,marginTop:2}}>
                      Sai {candidate.player.pos} {candidate.player.ovr} - vaga {candidate.slot.role}
                    </span>
                  </span>
                  <span style={{fontSize:11,color:statusColor,fontWeight:900}}>
                    {Math.round(candidate.efficiency*100)}%
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {selectedPlayer&&selectedIsStarter&&selectedSlot&&(
        <div style={{background:`linear-gradient(180deg, ${colors.surfaceAlt}, ${colors.panel})`,border:`1px solid ${withAlpha(colors.cyan,"border")}`,
          borderRadius:radii.card,padding:"10px 11px",marginBottom:12,boxShadow:shadows.panel}}>
          <div style={{fontSize:10,color:colors.cyan,fontWeight:900,letterSpacing:1.1,marginBottom:7}}>RESERVAS PARA {selectedSlot.role}</div>
          <div style={{display:"flex",flexDirection:"column",gap:6}}>
            {benchSwapCandidates.slice(0,4).map(candidate=>{
              const statusColor = candidate.status.colorKey==="success" ? colors.success : candidate.status.colorKey==="warning" ? colors.warning : colors.danger;
              return (
                <button key={candidate.player.id} onClick={()=>replaceLineupPlayer(selectedPlayer, candidate.player)}
                  style={{width:"100%",display:"grid",gridTemplateColumns:"1fr auto",gap:8,alignItems:"center",
                    textAlign:"left",background:"#050a14",border:`1px solid ${withAlpha(statusColor,"medium")}`,
                    borderRadius:radii.button,padding:"8px 9px",fontFamily:"inherit",cursor:"pointer",color:colors.textHeading}}>
                  <span style={{minWidth:0}}>
                    <span style={{display:"block",fontSize:12,fontWeight:900,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>
                      {candidate.player.name}
                    </span>
                    <span style={{display:"block",fontSize:10,color:colors.textMuted,fontWeight:800,marginTop:2}}>
                      Entra {candidate.player.pos} {candidate.player.ovr} - vaga {selectedSlot.role}
                    </span>
                  </span>
                  <span style={{fontSize:11,color:statusColor,fontWeight:900}}>
                    {Math.round(candidate.efficiency*100)}%
                  </span>
                </button>
              );
            })}
            {!benchSwapCandidates.length&&(
              <div style={{fontSize:11,color:colors.textMuted,fontWeight:800,padding:"4px 0"}}>Nenhum reserva disponivel para troca.</div>
            )}
          </div>
        </div>
      )}

      {lineupIssues.length>0&&(
        <div style={{background:withAlpha(colors.danger,"subtle"),border:`1px solid ${withAlpha(colors.danger,"medium")}`,
          borderRadius:radii.card,padding:"9px 11px",marginBottom:12}}>
          <div style={{display:"flex",alignItems:"center",gap:6,fontSize:10,color:colors.danger,fontWeight:900,letterSpacing:1}}>
            <AlertTriangle size={13}/> AJUSTES NECESSARIOS
          </div>
          {lineupIssues.slice(0,3).map(issue=>(
            <div key={issue} style={{fontSize:10,color:colors.textSecondary,marginTop:4}}>{issue}</div>
          ))}
        </div>
      )}

      <div style={{background:`linear-gradient(180deg, ${colors.surfaceAlt}, ${colors.panel})`,border:`1px solid ${colors.border}`,
        borderRadius:radii.card,padding:"12px 14px",marginBottom:16,display:"flex",justifyContent:"space-between",alignItems:"center",
        boxShadow:shadows.panel}}>
        <div>
          <div style={{fontSize:9,color:colors.textMuted,fontWeight:900,letterSpacing:1.2}}>PODER DO TIME</div>
          <PowerTooltip breakdown={powerBreakdown} align="left">
            <AnimatePresence mode="popLayout">
              <m.div key={pwr} initial={{opacity:0,y:-4,scale:0.92}} animate={{opacity:1,y:0,scale:1}} transition={{duration:0.25}}
                style={{fontSize:30,fontWeight:900,color:colors.success,letterSpacing:0,lineHeight:1,marginTop:2}}>
                {pwr}
              </m.div>
            </AnimatePresence>
          </PowerTooltip>
        </div>
        <div style={{textAlign:"right"}}>
          <div style={{fontSize:8,color:colors.textMuted,fontWeight:900,letterSpacing:1.2}}>CAMPO / BANCO</div>
          <div style={{fontSize:20,fontWeight:900,letterSpacing:0,marginTop:2}}>
            <span style={{color:colors.success}}>{state.lineup.length}</span>
            <span style={{color:colors.textSeparator,margin:"0 4px"}}>/</span>
            <span style={{color:colors.textSecondary}}>{bench.length}</span>
          </div>
        </div>
      </div>

      <Label>BUSCA PARA ESCALAR</Label>
      <div style={{background:`linear-gradient(180deg, ${colors.surfaceAlt}, ${colors.panel})`,border:`1px solid ${colors.border}`,
        borderRadius:radii.card,padding:"10px 12px",marginBottom:16,boxShadow:shadows.panel}}>
        <div style={{display:"flex",alignItems:"center",gap:7,background:"#050a14",border:`1px solid ${colors.border}`,
          borderRadius:radii.button,padding:"0 9px",marginBottom:9}}>
          <Search size={14} color={colors.cyan}/>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Buscar nome ou posicao"
            style={{width:"100%",background:"transparent",border:"none",
              color:colors.textHeading,fontSize:13,fontWeight:700,fontFamily:"inherit",padding:"9px 0",outline:"none"}}/>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:5,flexWrap:"wrap",marginBottom:7}}>
          <Filter size={13} color={colors.textMuted}/>
          {POS_FILTERS.map(pos=>(
            <GameButton key={pos} variant="secondary" size="sm" color={posFilter===pos?colors.cyan:colors.textMuted}
              onClick={()=>setPosFilter(pos)}>
              {pos}
            </GameButton>
          ))}
        </div>
        <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
          {RARITY_FILTERS.map(r=>(
            <GameButton key={r} variant="secondary" size="sm" color={rarityFilter===r?colors.warning:colors.textMuted}
              onClick={()=>setRarityFilter(r)}>
              {RARITY_LABEL[r]}
            </GameButton>
          ))}
        </div>
      </div>

      <Label color={withAlpha(colors.success,"medium")}>TITULARES - {state.lineup.length}/11</Label>
      <div style={{display:"flex",flexDirection:"column",gap:5,marginBottom:16}}>
        {filteredLineup.map(p=>(
          <PlayerCard key={p.id} player={p} compact showStats onAction={()=>toggleSquad(p)} actionLabel="Retirar" actionColor={colors.danger}/>
        ))}
        {!filteredLineup.length&&<div style={{textAlign:"center",color:colors.textMuted,padding:"18px 0",fontSize:12}}>
          {state.lineup.length ? "Nenhum titular nesse filtro" : "Nenhum jogador escalado"}
        </div>}
      </div>

      <Label>BANCO E RESERVAS - {bench.length}</Label>
      <div style={{display:"flex",flexDirection:"column",gap:5}}>
        {filteredBench.map(p=>(
          <PlayerCard key={p.id} player={p} compact showStats onAction={()=>{
            setSelectedId(p.id);
            onToast("Toque em uma posicao do campo para trocar");
          }} actionLabel={selectedId===p.id?"Selecionado":"Selecionar"} actionColor={selectedId===p.id?colors.warning:colors.success}/>
        ))}
        {!filteredBench.length&&<div style={{textAlign:"center",color:colors.textMuted,padding:"18px 0",fontSize:12}}>
          {bench.length ? "Nenhum reserva nesse filtro" : "Banco vazio"}
        </div>}
      </div>
    </Screen>
  );
}
