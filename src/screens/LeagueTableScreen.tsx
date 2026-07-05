import React from "react";
import { X, Trophy, TrendingDown } from "lucide-react";
import { LeagueState } from "../types";
import { sortedStandings } from "../utils/league";
import { colors, radii, withAlpha } from "../styles/tokens";

const RELEGATION_COUNT = 3;

interface Props { league:LeagueState; playerTeamId:string; onClose:()=>void; }

export function LeagueTableScreen({league, playerTeamId, onClose}:Props) {
  const standings = sortedStandings(league);
  const teamName = (id:string) => league.teams.find(t=>t.id===id)?.name ?? "?";
  const totalRounds = league.fixtures.length;

  return (
    <div style={{position:"fixed",inset:0,background:"rgba(3,7,15,0.85)",zIndex:500,
      display:"flex",alignItems:"flex-end",justifyContent:"center"}}>
      <div style={{width:"100%",maxWidth:430,maxHeight:"85vh",background:colors.bg,
        borderRadius:"16px 16px 0 0",border:`1px solid ${colors.border}`,borderBottom:"none",
        display:"flex",flexDirection:"column",overflow:"hidden"}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"14px 16px",borderBottom:`1px solid ${colors.border}`}}>
          <div>
            <div style={{fontSize:17,fontWeight:900,color:colors.textHeading,letterSpacing:-0.3}}>Liga {league.tier}</div>
            <div style={{fontSize:10,color:colors.textMuted,fontWeight:700,marginTop:2}}>RODADA {Math.min(league.round+1,totalRounds)}/{totalRounds}</div>
          </div>
          <button onClick={onClose} style={{background:colors.surface,border:`1px solid ${colors.border}`,
            borderRadius:radii.badge,width:32,height:32,display:"flex",alignItems:"center",justifyContent:"center",
            color:colors.textMuted,cursor:"pointer"}}>
            <X size={16}/>
          </button>
        </div>

        <div style={{display:"flex",gap:12,padding:"10px 16px",fontSize:9,color:colors.textMuted,fontWeight:700}}>
          <div style={{display:"flex",alignItems:"center",gap:4}}><Trophy size={11} color={colors.success}/> ACESSO</div>
          <div style={{display:"flex",alignItems:"center",gap:4}}><TrendingDown size={11} color={colors.danger}/> REBAIXAMENTO</div>
        </div>

        <div style={{overflowY:"auto",padding:"0 12px 16px"}}>
          <div style={{display:"grid",gridTemplateColumns:"20px 1fr 24px 24px 24px 24px 30px 32px",
            gap:4,padding:"4px 8px",fontSize:8,color:colors.textMuted,fontWeight:700,letterSpacing:0.3}}>
            <span>#</span><span>TIME</span><span>PJ</span><span>V</span><span>E</span><span>D</span><span>SG</span><span>PTS</span>
          </div>
          {standings.map((row,i)=>{
            const isPlayer = row.teamId===playerTeamId;
            const promoZone = i===0;
            const relegationZone = i>=standings.length-RELEGATION_COUNT;
            const accent = promoZone?colors.success:relegationZone?colors.danger:undefined;
            return (
              <div key={row.teamId} style={{display:"grid",gridTemplateColumns:"20px 1fr 24px 24px 24px 24px 30px 32px",
                gap:4,padding:"7px 8px",alignItems:"center",fontSize:11,
                background:isPlayer?withAlpha(colors.primary,"subtle"):"transparent",
                borderLeft:accent?`2px solid ${accent}`:"2px solid transparent",
                borderRadius:radii.tag,fontWeight:isPlayer?800:500,
                color:isPlayer?colors.textHeading:colors.textSecondary}}>
                <span style={{color:accent??colors.textMuted,fontWeight:700}}>{i+1}</span>
                <span style={{whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{teamName(row.teamId)}</span>
                <span>{row.played}</span>
                <span>{row.won}</span>
                <span>{row.drawn}</span>
                <span>{row.lost}</span>
                <span>{row.goalsFor-row.goalsAgainst}</span>
                <span style={{fontWeight:800,color:isPlayer?colors.warning:colors.textHeading}}>{row.points}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
