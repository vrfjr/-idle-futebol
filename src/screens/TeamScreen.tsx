import React, { useMemo, useState } from "react";
import { AnimatePresence, m } from "framer-motion";
import { Filter, Search, Shirt } from "lucide-react";
import { useGame } from "../store/GameContext";
import { TOGGLE_SQUAD, SET_FORMATION, SET_TEAM_IDENTITY } from "../store/actions";
import { calcPowerBreakdown } from "../utils/balance";
import { fieldLayout, FORMATIONS_LIST } from "../constants/formations";
import { FormationKey, Player, PositionKey, RarityKey } from "../types";
import { assignPlayersToSlots, AssignedFieldSlot } from "../utils/lineup";
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

const POS_FILTERS: (PositionKey|"TODOS")[] = ["TODOS","GOL","ZAG","MEI","ATA"];
const RARITY_FILTERS: (RarityKey|"TODAS")[] = ["TODAS","common","rare","epic","legendary"];
const RARITY_LABEL: Record<RarityKey|"TODAS", string> = {
  TODAS:"Todas", common:"Comum", rare:"Raro", epic:"Epico", legendary:"Lendario",
};
const FIELD_W = 320;
const FIELD_H = 194;

interface Props { onToast:(msg:string,bad?:boolean)=>void; }

function TacticalPitch({title,slots,color}:{title:string;slots:AssignedFieldSlot[];color:string}) {
  return (
    <div style={{minWidth:264,flex:"0 0 264px",borderRadius:radii.card,overflow:"hidden",
      background:`linear-gradient(180deg, ${colors.surfaceAlt}, ${colors.panel})`,
      border:`1px solid ${withAlpha(colors.cyan,"soft")}`,boxShadow:shadows.panel}}>
      <div style={{height:30,display:"flex",alignItems:"center",justifyContent:"space-between",padding:"0 10px",
        borderBottom:`1px solid ${withAlpha(colors.cyan,"soft")}`}}>
        <div style={{fontSize:11,color:colors.cyan,fontWeight:900,letterSpacing:0.7}}>{title}</div>
        <Shirt size={13} color={colors.warning}/>
      </div>
      <div style={{position:"relative",height:164,margin:9,borderRadius:8,overflow:"hidden",
        background:"repeating-linear-gradient(90deg,#155f35 0,#155f35 28px,#19723e 28px,#19723e 56px)",
        border:"1px solid rgba(255,255,255,0.18)"}}>
        <div style={{position:"absolute",left:7,right:7,top:7,bottom:7,border:"1px solid rgba(255,255,255,0.24)",borderRadius:5}}/>
        <div style={{position:"absolute",left:"50%",top:7,bottom:7,width:1,background:"rgba(255,255,255,0.24)"}}/>
        <div style={{position:"absolute",left:"50%",top:"50%",width:46,height:46,border:"1px solid rgba(255,255,255,0.22)",borderRadius:"50%",transform:"translate(-50%,-50%)"}}/>
        <div style={{position:"absolute",left:7,top:"29%",width:40,height:"42%",border:"1px solid rgba(255,255,255,0.24)",borderLeft:"none"}}/>
        {slots.map(slot=>{
          const p = slot.player;
          return (
            <div key={slot.num} title={p?`${p.name} | ${p.pos} | OVR ${p.ovr}`:`Vaga ${slot.role}`}
              style={{position:"absolute",left:`${(slot.x/FIELD_W)*100}%`,top:`${(slot.y/FIELD_H)*100}%`,
                transform:"translate(-50%,-50%)",width:30,height:28,
                clipPath:"polygon(18% 8%, 34% 0, 50% 10%, 66% 0, 82% 8%, 74% 38%, 68% 38%, 68% 100%, 32% 100%, 32% 38%, 26% 38%)",
                background:p?`linear-gradient(180deg, ${withAlpha(color,"strong")}, ${color})`:withAlpha(colors.textMuted,"soft"),
                border:`1px solid ${p?withAlpha("#ffffff","soft"):colors.border}`,
                display:"flex",alignItems:"center",justifyContent:"center",paddingTop:5,
                color:colors.textHeading,fontSize:8,fontWeight:900,boxShadow:p?`0 0 10px ${withAlpha(color,"strong")}`:"none"}}>
              {p ? p.pos : slot.role}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function TeamScreen({onToast}:Props) {
  const {state, dispatch} = useGame();
  const bench = state.roster.filter(p=>!state.lineup.some(l=>l.id===p.id));
  const powerBreakdown = calcPowerBreakdown(state.lineup, state.formation, state.upgrades);
  const pwr = powerBreakdown.total;
  const [nameInput, setNameInput] = useState(state.teamName);
  const [search, setSearch] = useState("");
  const [posFilter, setPosFilter] = useState<PositionKey|"TODOS">("TODOS");
  const [rarityFilter, setRarityFilter] = useState<RarityKey|"TODAS">("TODAS");

  const matchesFilters = (player:Player) => {
    const q = search.trim().toLowerCase();
    const byText = !q || player.name.toLowerCase().includes(q) || player.pos.toLowerCase().includes(q);
    const byPos = posFilter==="TODOS" || player.pos===posFilter;
    const byRarity = rarityFilter==="TODAS" || player.rarity===rarityFilter;
    return byText && byPos && byRarity;
  };

  const filteredLineup = state.lineup.filter(matchesFilters);
  const filteredBench = bench.filter(matchesFilters);
  const possessionSlots = useMemo(
    ()=>assignPlayersToSlots(state.lineup, fieldLayout(state.formation, true, FIELD_W, FIELD_H)),
    [state.lineup, state.formation],
  );
  const defendingSlots = useMemo(()=>possessionSlots.map(slot=>({
    ...slot,
    x: slot.role==="GOL" ? slot.x : Math.max(FIELD_W*0.16, slot.x*0.78),
  })), [possessionSlots]);

  const toggleSquad = (player:Player)=>{
    const inSquad = state.lineup.some(l=>l.id===player.id);
    if(!inSquad && state.lineup.length>=11){onToast("Elenco cheio - max 11",true);return;}
    dispatch({type:TOGGLE_SQUAD, player});
  };

  const commitName = ()=>{
    const name = nameInput.trim() || state.teamName;
    setNameInput(name);
    dispatch({type:SET_TEAM_IDENTITY, name, color:state.teamColor});
  };
  const pickColor = (color:string)=>{
    dispatch({type:SET_TEAM_IDENTITY, name:state.teamName, color});
  };

  return (
    <Screen>
      <div style={{fontSize:18,fontWeight:900,color:colors.textHeading,letterSpacing:0,marginBottom:12}}>Time e taticas</div>

      <Label>IDENTIDADE DO CLUBE</Label>
      <div style={{background:`linear-gradient(180deg, ${colors.surfaceAlt}, ${colors.panel})`,border:`1px solid ${colors.border}`,
        borderRadius:radii.card,padding:"12px 14px",marginBottom:16,boxShadow:shadows.panel}}>
        <input value={nameInput} onChange={e=>setNameInput(e.target.value)} onBlur={commitName}
          maxLength={24} placeholder="Nome do time"
          style={{width:"100%",background:"#050a14",border:`1px solid ${colors.border}`,borderRadius:radii.button,
            color:colors.textHeading,fontSize:15,fontWeight:800,fontFamily:"inherit",padding:"9px 10px",marginBottom:10,outline:"none"}}/>
        <div style={{display:"flex",gap:7,flexWrap:"wrap"}}>
          {TEAM_COLORS.map(c=>(
            <button key={c} onClick={()=>pickColor(c)} aria-label={c} style={{
              width:28,height:28,borderRadius:radii.badge,background:c,cursor:"pointer",padding:0,
              border:state.teamColor===c?`2px solid ${colors.textHeading}`:"2px solid transparent",
              boxShadow:state.teamColor===c?`0 0 0 2px ${c}, 0 0 14px ${withAlpha(c,"strong")}`:"none"}}/>
          ))}
        </div>
      </div>

      <Label>FORMACAO</Label>
      <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:14}}>
        {FORMATIONS_LIST.map(f=>(
          <GameButton key={f} variant="secondary" size="sm"
            color={state.formation===f?colors.cyan:colors.textMuted}
            onClick={()=>dispatch({type:SET_FORMATION,formation:f as FormationKey})}>
            {f}
          </GameButton>
        ))}
      </div>

      <div style={{display:"flex",gap:10,overflowX:"auto",paddingBottom:8,marginBottom:12}}>
        <TacticalPitch title="COM POSSE" slots={possessionSlots} color={state.teamColor}/>
        <TacticalPitch title="SEM POSSE" slots={defendingSlots} color={state.teamColor}/>
      </div>

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

      <Label color={withAlpha(colors.success,"medium")}>EM CAMPO - {state.lineup.length}/11</Label>
      <div style={{display:"flex",flexDirection:"column",gap:5,marginBottom:16}}>
        {filteredLineup.map(p=>(
          <PlayerCard key={p.id} player={p} compact showStats onAction={()=>toggleSquad(p)} actionLabel="Retirar" actionColor={colors.danger}/>
        ))}
        {!filteredLineup.length&&<div style={{textAlign:"center",color:colors.textMuted,padding:"18px 0",fontSize:12}}>
          {state.lineup.length ? "Nenhum escalado nesse filtro" : "Nenhum jogador escalado"}
        </div>}
      </div>

      <Label>BANCO - {bench.length}</Label>
      <div style={{display:"flex",flexDirection:"column",gap:5}}>
        {filteredBench.map(p=>(
          <PlayerCard key={p.id} player={p} compact showStats onAction={()=>toggleSquad(p)} actionLabel="Escalar" actionColor={colors.success}/>
        ))}
        {!filteredBench.length&&<div style={{textAlign:"center",color:colors.textMuted,padding:"18px 0",fontSize:12}}>
          {bench.length ? "Nenhum banco nesse filtro" : "Banco vazio"}
        </div>}
      </div>
    </Screen>
  );
}
