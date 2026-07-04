import React, { useRef, useCallback } from "react";
import { useGame } from "../store/GameContext";
import { useMatchSimulation } from "../hooks/useMatchSimulation";
import { useGameLoop } from "../hooks/useGameLoop";
import { calcPower, passivePerSec } from "../utils/balance";
import { fmt } from "../utils/helpers";
import { ADD_REWARD } from "../store/actions";
import { StatPill } from "../components/StatPill";

interface Props { onToast:(msg:string,bad?:boolean)=>void; }

export function MatchScreen({onToast}:Props) {
  const {state, dispatch} = useGame();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const {liveScore, setLiveScore} = useGameLoop();

  const handleGoal = useCallback((home:number,away:number)=>{
    setLiveScore(prev=>({...prev,home,away}));
  },[setLiveScore]);

  useMatchSimulation(canvasRef, handleGoal);

  const pwr = calcPower(state.lineup, state.formation, state.upgrades);
  const pps = passivePerSec(state.passiveRate, state.upgrades.fans);

  return (
    <div>
      <div style={{padding:"16px 16px 12px",background:"#070d1a"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:14}}>
          <div>
            <div style={{fontSize:9,color:"#2d3f5c",fontWeight:700,letterSpacing:1.5}}>TEMPORADA</div>
            <div style={{fontSize:22,fontWeight:900,color:"#fbbf24",letterSpacing:-0.5,lineHeight:1}}>Liga {state.league}</div>
          </div>
          <div style={{textAlign:"center"}}>
            <div style={{fontSize:9,color:"#2d3f5c",fontWeight:700,letterSpacing:1.5}}>PODER</div>
            <div style={{fontSize:28,fontWeight:900,color:"#4ade80",letterSpacing:-1,lineHeight:1}}>{pwr}</div>
          </div>
          <div style={{textAlign:"right"}}>
            <div style={{fontSize:9,color:"#2d3f5c",fontWeight:700,letterSpacing:1.5}}>V / E / D</div>
            <div style={{fontSize:16,fontWeight:800,letterSpacing:1,marginTop:1}}>
              <span style={{color:"#4ade80"}}>{state.wins}</span>
              <span style={{color:"#1e293b",margin:"0 3px"}}>/</span>
              <span style={{color:"#fbbf24"}}>{state.draws}</span>
              <span style={{color:"#1e293b",margin:"0 3px"}}>/</span>
              <span style={{color:"#f87171"}}>{state.losses}</span>
            </div>
          </div>
        </div>
        <div style={{display:"flex",gap:6}}>
          <div style={{flex:2,background:"#0a1120",border:"1px solid #151f35",borderRadius:8,padding:"7px 12px",display:"flex",alignItems:"center",gap:8}}>
            <span style={{fontSize:14}}>💰</span>
            <div>
              <div style={{fontSize:8,color:"#2d3f5c",fontWeight:700,letterSpacing:1}}>MOEDAS</div>
              <div style={{fontSize:15,fontWeight:900,color:"#fbbf24",letterSpacing:-0.3}}>{fmt(state.coins)}</div>
            </div>
          </div>
          <div style={{flex:1,background:"#0a1120",border:"1px solid #151f35",borderRadius:8,padding:"7px 12px",display:"flex",alignItems:"center",gap:8}}>
            <span style={{fontSize:14}}>⚡</span>
            <div>
              <div style={{fontSize:8,color:"#2d3f5c",fontWeight:700,letterSpacing:1}}>/SEG</div>
              <div style={{fontSize:15,fontWeight:900,color:"#34d399",letterSpacing:-0.3}}>{pps}</div>
            </div>
          </div>
        </div>
      </div>

      <div style={{margin:"0 14px 12px",background:"#090f1e",border:"1px solid #131e33",borderRadius:12,padding:"12px 20px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        <div style={{textAlign:"center"}}>
          <div style={{width:38,height:38,borderRadius:8,background:"#1d4ed820",border:"1px solid #1d4ed840",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,marginBottom:4}}>⚽</div>
          <div style={{fontSize:8,color:"#1d4ed8",fontWeight:700,letterSpacing:0.8}}>MEU TIME</div>
        </div>
        <div style={{textAlign:"center"}}>
          <div style={{fontSize:8,color:"#2d3f5c",fontWeight:700,letterSpacing:1,marginBottom:4}}>{liveScore.min<90?`${liveScore.min}'`:"FIM"}</div>
          <div style={{fontSize:40,fontWeight:900,letterSpacing:8,lineHeight:1}}>
            <span style={{color:"#e2e8f0"}}>{liveScore.home}</span>
            <span style={{color:"#1a2540",margin:"0 2px"}}>:</span>
            <span style={{color:"#e2e8f0"}}>{liveScore.away}</span>
          </div>
          <div style={{fontSize:7,color:"#22c55e",fontWeight:700,letterSpacing:2,marginTop:4,display:"flex",alignItems:"center",justifyContent:"center",gap:4}}>
            <span style={{display:"inline-block",width:5,height:5,borderRadius:"50%",background:"#22c55e",animation:"pulse 1.5s infinite"}}/>
            AO VIVO
          </div>
        </div>
        <div style={{textAlign:"center"}}>
          <div style={{width:38,height:38,borderRadius:8,background:"#99182020",border:"1px solid #99182040",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,marginBottom:4}}>🔴</div>
          <div style={{fontSize:8,color:"#991b1b",fontWeight:700,letterSpacing:0.8}}>RIVAL</div>
        </div>
      </div>

      <div style={{margin:"0 14px 10px",borderRadius:12,overflow:"hidden",border:"1px solid #131e33"}}>
        <canvas ref={canvasRef} width={356} height={218} style={{display:"block",width:"100%",height:"auto"}}/>
      </div>

      <div style={{display:"flex",gap:6,margin:"0 14px 10px"}}>
        <StatPill label="FORMAÇÃO" value={state.formation}/>
        <StatPill label="EM CAMPO" value={`${state.lineup.length}/11`}/>
        <StatPill label="ELENCO" value={state.roster.length}/>
      </div>

      <div style={{margin:"0 14px 14px"}}>
        <button onClick={()=>{dispatch({type:ADD_REWARD,coins:600,diamonds:3});onToast("+600 moedas e +3 diamantes");}}
          style={{width:"100%",padding:11,borderRadius:9,cursor:"pointer",background:"#0a1628",
            border:"1px solid #1d4ed830",color:"#60a5fa",fontSize:12,fontWeight:700,fontFamily:"inherit",
            letterSpacing:0.5,display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>
          <span style={{fontSize:14}}>📺</span>
          <span>Assistir anúncio → +600 💰 +3 💎</span>
        </button>
      </div>
    </div>
  );
}
