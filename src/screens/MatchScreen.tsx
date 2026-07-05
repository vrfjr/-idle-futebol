import React, { useRef, useCallback, useMemo, useState } from "react";
import { Waypoints, Shirt, Users, Crosshair, Radio, Shield } from "lucide-react";
import { useGame } from "../store/GameContext";
import { useMatchSimulation } from "../hooks/useMatchSimulation";
import { useGameLoop } from "../hooks/useGameLoop";
import { useDeltaFlash } from "../hooks/useDeltaFlash";
import { calcPowerBreakdown, passivePerSec } from "../utils/balance";
import { ADD_REWARD } from "../store/actions";
import { ResourceBar } from "../components/ResourceBar";
import { StatShortcut } from "../components/StatShortcut";
import { LeagueBadge } from "../components/LeagueBadge";
import { RewardButton } from "../components/RewardButton";
import { DeltaBadge } from "../components/DeltaBadge";
import { PowerTooltip } from "../components/PowerTooltip";
import { LeagueTableScreen } from "./LeagueTableScreen";
import { colors, radii, shadows, withAlpha } from "../styles/tokens";

interface Props { onToast:(msg:string,bad?:boolean)=>void; onNavigateShop:()=>void; onNavigateTeam:()=>void; }

function clamp(v:number, min:number, max:number): number {
  return Math.max(min, Math.min(max, v));
}

function shortName(name:string): string {
  return name.split(/\s+/).filter(Boolean).slice(0,2).map(p=>p[0]).join("").toUpperCase() || "FC";
}

function TeamCrest({name,color,side,power}:{name:string;color:string;side:"home"|"away";power:number}) {
  return (
    <div style={{display:"flex",flexDirection:"column",alignItems:side==="home"?"flex-start":"flex-end",gap:6,minWidth:0,flex:1}}>
      <div style={{fontSize:9,color:colors.textMuted,fontWeight:900,letterSpacing:1.2,textTransform:"uppercase"}}>
        {side==="home" ? "Home team" : "Away team"}
      </div>
      <div style={{display:"flex",alignItems:"center",gap:8,flexDirection:side==="home"?"row":"row-reverse",minWidth:0}}>
        <div style={{width:56,height:60,clipPath:"polygon(50% 0, 92% 18%, 82% 80%, 50% 100%, 18% 80%, 8% 18%)",
          background:`linear-gradient(160deg, ${withAlpha(color,"strong")}, ${color})`,
          border:`2px solid ${withAlpha("#ffffff","soft")}`,display:"flex",alignItems:"center",justifyContent:"center",
          color:colors.textHeading,fontSize:16,fontWeight:900,boxShadow:`0 0 18px ${withAlpha(color,"medium")}`}}>
          {shortName(name)}
        </div>
        <div style={{minWidth:0,textAlign:side==="home"?"left":"right"}}>
          <div style={{fontSize:14,color:colors.textHeading,fontWeight:900,letterSpacing:0,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis",maxWidth:118}}>
            {name}
          </div>
          <div style={{fontSize:23,color:colors.warning,fontWeight:900,lineHeight:1,marginTop:3}}>{power}</div>
        </div>
      </div>
    </div>
  );
}

function FactRow({label,home,away}:{label:string;home:string|number;away:string|number}) {
  return (
    <div style={{display:"grid",gridTemplateColumns:"54px 1fr 54px",alignItems:"center",
      minHeight:46,padding:"0 14px",background:"rgba(226,242,255,0.82)",
      borderBottom:"1px solid rgba(8,25,45,0.12)"}}>
      <div style={{fontSize:27,color:"#0d4c9c",fontWeight:900,textAlign:"left"}}>{home}</div>
      <div style={{fontSize:14,color:"#132238",fontWeight:900,textAlign:"center",letterSpacing:0.5}}>{label}</div>
      <div style={{fontSize:27,color:"#0d4c9c",fontWeight:900,textAlign:"right"}}>{away}</div>
    </div>
  );
}

export function MatchScreen({onToast, onNavigateShop, onNavigateTeam}:Props) {
  const {state, dispatch} = useGame();
  const containerRef = useRef<HTMLDivElement>(null);
  const {liveScore, setLiveScore} = useGameLoop();
  const [showTable, setShowTable] = useState(false);

  const handleGoal = useCallback((home:number,away:number)=>{
    setLiveScore(prev=>({...prev,home,away}));
  },[setLiveScore]);

  const visualLineup = useMemo(()=>state.lineup.slice(0, 11), [state.lineup]);
  const playerTeamId = state.league.teams.find(t=>t.isPlayer)?.id;
  const roundFixtures = state.league.fixtures[state.league.round] ?? [];
  const playerFixture = roundFixtures.find(f=>f.home===playerTeamId || f.away===playerTeamId);
  const opponentId = playerFixture ? (playerFixture.home===playerTeamId ? playerFixture.away : playerFixture.home) : undefined;
  const opponent = state.league.teams.find(t=>t.id===opponentId);
  const opponentPower = opponent?.power ?? 45;
  const opponentName = opponent?.name ?? "Rival FC";
  const simKey = useMemo(()=>[
    state.formation,
    state.teamColor,
    opponentPower,
    visualLineup.map(p=>`${p.id}:${p.pos}:${p.ovr}:${p.pac}:${p.sho}:${p.pas}:${p.def}:${p.phy}:${p.dri}`).join("|"),
  ].join("::"), [state.formation, state.teamColor, opponentPower, visualLineup]);

  useMatchSimulation(containerRef, handleGoal, state.teamColor, state.formation, visualLineup, opponentPower, simKey);

  const powerBreakdown = calcPowerBreakdown(state.lineup, state.formation, state.upgrades);
  const pwr = powerBreakdown.total;
  const pwrFlash = useDeltaFlash(pwr, 1, d=>`+${Math.round(d)} PODER`);
  const pps = passivePerSec(state.passiveRate, state.upgrades.fans);
  const playerRow = state.league.table.find(r=>r.teamId===playerTeamId);
  const possession = Math.round(clamp(50 + (pwr-opponentPower)/5 + (liveScore.home-liveScore.away)*3, 38, 66));
  const homeShots = Math.max(liveScore.home, Math.floor(liveScore.min/18)+liveScore.home*2+Math.max(1, Math.floor(pwr/60)));
  const awayShots = Math.max(liveScore.away, Math.floor(liveScore.min/22)+liveScore.away*2+Math.max(1, Math.floor(opponentPower/65)));
  const homeTarget = Math.min(homeShots, Math.max(liveScore.home, Math.ceil(homeShots*0.55)));
  const awayTarget = Math.min(awayShots, Math.max(liveScore.away, Math.ceil(awayShots*0.48)));
  const homeFouls = Math.max(0, Math.floor(liveScore.min/17) + (opponentPower>pwr ? 2 : 0));
  const awayFouls = Math.max(0, Math.floor(liveScore.min/15) + (pwr>opponentPower ? 2 : 0));

  return (
    <div>
      <div style={{padding:"14px 14px 12px",background:"transparent"}}>
        <div style={{position:"relative",overflow:"hidden",borderRadius:14,
          background:"linear-gradient(180deg, rgba(24,67,126,0.98), rgba(5,22,47,0.98) 58%, rgba(4,43,36,0.92))",
          border:`1px solid ${withAlpha(colors.cyan,"soft")}`,boxShadow:shadows.raisedPanel}}>
          <div style={{position:"absolute",left:-20,right:-20,top:58,height:86,
            background:"repeating-linear-gradient(105deg, transparent 0, transparent 12px, rgba(255,255,255,0.05) 13px, transparent 15px)",
            opacity:0.75}}/>
          <div style={{position:"relative",padding:"12px 12px 16px"}}>
            <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",gap:8,marginBottom:4}}>
              <TeamCrest name={state.teamName} color={state.teamColor} side="home" power={pwr}/>
              <TeamCrest name={opponentName} color={colors.rivalDark} side="away" power={opponentPower}/>
            </div>

            <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:10,margin:"4px 0 2px"}}>
              <div style={{width:34,height:1,background:`linear-gradient(90deg, transparent, ${withAlpha(colors.cyan,"strong")})`}}/>
              <div style={{fontSize:11,color:colors.cyan,fontWeight:900,letterSpacing:1.6,display:"flex",alignItems:"center",gap:5}}>
                <Radio size={12}/> {liveScore.min<90?`${liveScore.min}'`:"FIM"}
              </div>
              <div style={{width:34,height:1,background:`linear-gradient(90deg, ${withAlpha(colors.cyan,"strong")}, transparent)`}}/>
            </div>

            <div style={{position:"relative",textAlign:"center"}}>
              <div style={{fontSize:74,lineHeight:0.92,color:"#eaffff",fontWeight:900,textShadow:"0 6px 18px rgba(0,0,0,0.35)"}}>
                {liveScore.home}-{liveScore.away}
              </div>
              <div style={{fontSize:10,color:colors.success,fontWeight:900,letterSpacing:2,marginTop:6,display:"flex",alignItems:"center",justifyContent:"center",gap:5}}>
                <span style={{width:6,height:6,borderRadius:"50%",background:colors.success,animation:"pulse 1.3s infinite"}}/>
                AO VIVO
              </div>
            </div>
          </div>
        </div>

        <div style={{marginTop:12}}>
          <ResourceBar coins={state.coins} pps={pps} onAddCoins={onNavigateShop}/>
        </div>
      </div>

      <div style={{margin:"0 14px 12px",borderRadius:12,overflow:"hidden",border:`1px solid ${withAlpha(colors.cyan,"soft")}`,boxShadow:shadows.panel}}>
        <div style={{background:"#071c3b",color:colors.warning,fontSize:17,fontWeight:900,textAlign:"center",padding:"9px 0",letterSpacing:0.8}}>
          MATCH FACTS
        </div>
        <FactRow label="SHOTS" home={homeShots} away={awayShots}/>
        <FactRow label="ON TARGET" home={homeTarget} away={awayTarget}/>
        <FactRow label="POSSESSION" home={`${possession}%`} away={`${100-possession}%`}/>
        <FactRow label="FOULS" home={homeFouls} away={awayFouls}/>
      </div>

      <div style={{margin:"0 14px 10px",borderRadius:14,overflow:"hidden",
        background:`linear-gradient(180deg, ${withAlpha(colors.pitch,"soft")}, #04310f)`,
        border:`1px solid ${withAlpha(colors.pitch,"medium")}`,
        boxShadow:"inset 0 0 0 1px rgba(255,255,255,0.04), inset 0 6px 14px rgba(0,0,0,0.45), 0 4px 10px rgba(0,0,0,0.35)"}}>
        <div style={{height:30,display:"flex",alignItems:"center",justifyContent:"space-between",padding:"0 11px",
          background:"linear-gradient(180deg, rgba(9,15,30,0.92), rgba(9,15,30,0.55))"}}>
          <div style={{fontSize:10,color:colors.cyan,fontWeight:900,letterSpacing:1.1,display:"flex",alignItems:"center",gap:5}}>
            <Crosshair size={12}/> CAMERA TATICA
          </div>
          <PowerTooltip breakdown={powerBreakdown} align="right">
            <div style={{fontSize:10,color:colors.success,fontWeight:900,letterSpacing:1,position:"relative"}}>
              PODER {pwr}
              {pwrFlash && <DeltaBadge keyId={pwrFlash.id} value={pwrFlash.text} color={colors.success}/>}
            </div>
          </PowerTooltip>
        </div>
        <div ref={containerRef} style={{width:"100%"}}/>
      </div>

      <div style={{display:"flex",gap:6,margin:"0 14px 10px"}}>
        <StatShortcut label="FORMACAO" value={state.formation} onClick={onNavigateTeam}
          icon={<Waypoints size={14} color={colors.textMuted}/>}/>
        <StatShortcut label="EM CAMPO" value={`${state.lineup.length}/11`} onClick={onNavigateTeam}
          icon={<Shirt size={14} color={colors.textMuted}/>}/>
        <StatShortcut label="ELENCO" value={state.roster.length} onClick={onNavigateTeam}
          icon={<Users size={14} color={colors.textMuted}/>}/>
      </div>

      <div style={{display:"flex",gap:6,margin:"0 14px 10px"}}>
        <div style={{flex:1}}>
          <LeagueBadge tier={state.league.tier} round={state.league.round}
            totalRounds={state.league.fixtures.length} onClick={()=>setShowTable(true)}/>
        </div>
        <div style={{flex:1,background:`linear-gradient(180deg, ${colors.surfaceAlt}, ${colors.panel})`,border:`1px solid ${colors.border}`,
          borderRadius:radii.card,padding:"10px 12px",display:"flex",alignItems:"center",gap:8}}>
          <Shield size={16} color={colors.warning}/>
          <div>
            <div style={{fontSize:9,color:colors.textMuted,fontWeight:900,letterSpacing:1}}>V / E / D</div>
            <div style={{fontSize:14,fontWeight:900}}>
              <span style={{color:colors.success}}>{playerRow?.won ?? 0}</span>
              <span style={{color:colors.textSeparator,margin:"0 3px"}}>/</span>
              <span style={{color:colors.warning}}>{playerRow?.drawn ?? 0}</span>
              <span style={{color:colors.textSeparator,margin:"0 3px"}}>/</span>
              <span style={{color:colors.danger}}>{playerRow?.lost ?? 0}</span>
            </div>
          </div>
        </div>
      </div>

      <div style={{margin:"0 14px 14px"}}>
        <RewardButton coins={600} diamonds={3}
          onClick={()=>{dispatch({type:ADD_REWARD,coins:600,diamonds:3});onToast("+600 moedas e +3 diamantes");}}/>
      </div>

      {showTable && playerTeamId && (
        <LeagueTableScreen league={state.league} playerTeamId={playerTeamId} onClose={()=>setShowTable(false)}/>
      )}
    </div>
  );
}
