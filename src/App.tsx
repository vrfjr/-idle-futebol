import React, { useCallback, useEffect, useState } from "react";
import { LazyMotion, m, AnimatePresence } from "framer-motion";
import { CircleDot, Shirt, ShoppingCart, Gem, TrendingUp, LucideIcon, Trophy, Zap, Coins } from "lucide-react";
import { GameProvider, useGame } from "./store/GameContext";
import { usePassiveIncome } from "./hooks/usePassiveIncome";
import { calcPowerBreakdown, passivePerSec, upgCost } from "./utils/balance";
import { fmt } from "./utils/helpers";
import { CLEAR_OFFLINE_REWARD } from "./store/actions";
import { MatchScreen } from "./screens/MatchScreen";
import { TeamScreen } from "./screens/TeamScreen";
import { MarketScreen } from "./screens/MarketScreen";
import { ShopScreen } from "./screens/ShopScreen";
import { UpgradesScreen } from "./screens/UpgradesScreen";
import { Toast } from "./components/Toast";
import { BottomNavItem } from "./components/BottomNavItem";
import { DeltaBadge } from "./components/DeltaBadge";
import { PowerTooltip } from "./components/PowerTooltip";
import { LeagueTableScreen } from "./screens/LeagueTableScreen";
import { useDeltaFlash } from "./hooks/useDeltaFlash";
import { colors, shadows, withAlpha } from "./styles/tokens";
import "./index.css";

const loadFeatures = () => import("framer-motion").then(mod => mod.domAnimation);

type Tab = "match"|"team"|"market"|"shop"|"upgrades";

const NAV:{key:Tab;icon:LucideIcon;label:string}[] = [
  {key:"match",    icon:CircleDot,    label:"Partida"},
  {key:"team",     icon:Shirt,        label:"Time"},
  {key:"market",   icon:ShoppingCart, label:"Mercado"},
  {key:"shop",     icon:Gem,          label:"Loja"},
  {key:"upgrades", icon:TrendingUp,   label:"Upgrades"},
];

function GameApp() {
  const { state, dispatch } = useGame();
  const [tab, setTab] = useState<Tab>("match");
  const [toast, setToast] = useState<{msg:string;bad:boolean}|null>(null);
  const [showLeague, setShowLeague] = useState(false);

  usePassiveIncome();

  const notify = useCallback((msg:string, bad=false)=>{
    setToast({msg,bad});
    setTimeout(()=>setToast(null), 2600);
  }, []);

  useEffect(()=>{
    if(!state.pendingOfflineReward?.coins) return;
    notify(`+${fmt(state.pendingOfflineReward.coins)} moedas enquanto voce esteve fora`);
    dispatch({type:CLEAR_OFFLINE_REWARD});
  }, [state.pendingOfflineReward, notify, dispatch]);

  const upgradeAvailable = Object.values(state.upgrades).some(lvl=>state.coins>=upgCost(lvl));
  const powerBreakdown = calcPowerBreakdown(state.lineup, state.formation, state.upgrades);
  const power = powerBreakdown.total;
  const pps = passivePerSec(state.passiveRate, state.upgrades.fans, state.league.tier);
  const coinFlash = useDeltaFlash(state.coins, pps+1);
  const playerTeamId = state.league.teams.find(t=>t.isPlayer)?.id ?? "player";

  return (
    <LazyMotion features={loadFeatures} strict>
      <div style={{minHeight:"100vh",maxWidth:430,margin:"0 auto",
        fontFamily:"'Rajdhani',sans-serif",color:colors.textHeading,position:"relative",display:"flex",flexDirection:"column",
        overflow:"hidden",background:`linear-gradient(180deg, ${colors.bg} 0%, ${colors.bgDeep} 100%)`}}>
        <div style={{position:"absolute",inset:0,pointerEvents:"none",
          background:"linear-gradient(120deg, rgba(124,199,255,0.12), transparent 28%, rgba(139,255,74,0.08) 70%, transparent)",
          opacity:0.9}}/>
        <div style={{position:"absolute",left:-80,right:-80,top:64,height:88,pointerEvents:"none",
          background:"repeating-linear-gradient(100deg, transparent 0, transparent 14px, rgba(255,255,255,0.04) 15px, transparent 17px)",
          transform:"skewY(-6deg)",opacity:0.7}}/>

        <AnimatePresence>
          {toast && <Toast key="toast" msg={toast.msg} bad={toast.bad}/>}
        </AnimatePresence>

        <header style={{position:"relative",zIndex:2,padding:"12px 14px 10px",
          background:`linear-gradient(180deg, ${withAlpha(colors.surfaceAlt,"medium")}, ${withAlpha(colors.panel,"soft")})`,
          borderBottom:`1px solid ${withAlpha(colors.cyan,"soft")}`,boxShadow:shadows.panel}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:10}}>
            <div style={{minWidth:0}}>
              <div style={{fontSize:9,color:colors.cyan,fontWeight:900,letterSpacing:1.3,textTransform:"uppercase"}}>Idle Football Manager</div>
              <div style={{fontSize:18,color:colors.textHeading,fontWeight:900,letterSpacing:0,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>
                {state.teamName}
              </div>
            </div>
            <div style={{display:"flex",alignItems:"center",gap:5,flexShrink:0}}>
              <div style={{position:"relative",border:`1px solid ${withAlpha(colors.warning,"medium")}`,background:withAlpha(colors.warning,"subtle"),
                borderRadius:9,padding:"5px 7px",minWidth:66,textAlign:"center"}}>
                <div style={{fontSize:8,color:colors.textMuted,fontWeight:800,letterSpacing:0.7}}>SALDO</div>
                <div style={{fontSize:12,color:colors.warning,fontWeight:900,display:"flex",alignItems:"center",justifyContent:"center",gap:3,lineHeight:1.05}}>
                  <Coins size={11}/> {fmt(state.coins)}
                </div>
                <div style={{fontSize:11,color:colors.cyan,fontWeight:900,display:"flex",alignItems:"center",justifyContent:"center",gap:3,lineHeight:1.05,marginTop:2}}>
                  <Gem size={10}/> {state.diamonds}
                </div>
                {coinFlash && <DeltaBadge keyId={coinFlash.id} value={coinFlash.text} color={colors.warning}/>}
              </div>
              <button onClick={()=>setShowLeague(true)} style={{border:`1px solid ${withAlpha(colors.warning,"medium")}`,background:withAlpha(colors.warning,"subtle"),
                borderRadius:9,padding:"5px 7px",minWidth:48,textAlign:"center",fontFamily:"inherit",cursor:"pointer"}}>
                <div style={{fontSize:8,color:colors.textMuted,fontWeight:800,letterSpacing:0.7}}>LIGA</div>
                <div style={{fontSize:13,color:colors.warning,fontWeight:900,display:"flex",alignItems:"center",justifyContent:"center",gap:3}}>
                  <Trophy size={11}/> {state.league.tier}
                </div>
              </button>
              <PowerTooltip breakdown={powerBreakdown} align="right">
                <div style={{border:`1px solid ${withAlpha(colors.success,"medium")}`,background:withAlpha(colors.success,"subtle"),
                  borderRadius:9,padding:"5px 7px",minWidth:58,textAlign:"center"}}>
                  <div style={{fontSize:8,color:colors.textMuted,fontWeight:800,letterSpacing:0.7}}>PODER</div>
                  <div style={{fontSize:13,color:colors.success,fontWeight:900,display:"flex",alignItems:"center",justifyContent:"center",gap:3}}>
                    <Zap size={11}/> {power}
                  </div>
                </div>
              </PowerTooltip>
            </div>
          </div>
        </header>

        <div style={{position:"relative",zIndex:1,flex:1,overflowY:"auto",paddingBottom:"calc(64px + env(safe-area-inset-bottom))"}}>
          <AnimatePresence mode="wait">
            <m.div key={tab} initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-8}} transition={{duration:0.18}}>
              {tab==="match"    && <MatchScreen    onToast={notify} onNavigateTeam={()=>setTab("team")} onNavigateShop={()=>setTab("shop")}/>}
              {tab==="team"     && <TeamScreen     onToast={notify}/>}
              {tab==="market"   && <MarketScreen   onToast={notify}/>}
              {tab==="shop"     && <ShopScreen     onToast={notify}/>}
              {tab==="upgrades" && <UpgradesScreen onToast={notify}/>}
            </m.div>
          </AnimatePresence>
        </div>

        <nav style={{position:"fixed",bottom:0,left:"50%",transform:"translateX(-50%)",width:"100%",maxWidth:430,
          background:`linear-gradient(180deg, ${colors.surfaceAlt}, ${colors.bgDeep})`,
          borderTop:`1px solid ${withAlpha(colors.cyan,"soft")}`,display:"flex",zIndex:200,padding:"2px 6px",
          paddingBottom:"calc(2px + env(safe-area-inset-bottom))",boxShadow:"0 -14px 30px rgba(0,0,0,0.45)"}}>
          {NAV.map(n=>(
            <BottomNavItem key={n.key} icon={n.icon} label={n.label} active={tab===n.key}
              onClick={()=>setTab(n.key)} badge={n.key==="upgrades" && upgradeAvailable}/>
          ))}
        </nav>

        {showLeague && (
          <LeagueTableScreen league={state.league} playerTeamId={playerTeamId} onClose={()=>setShowLeague(false)}/>
        )}
      </div>
    </LazyMotion>
  );
}

export default function App() {
  return (
    <GameProvider>
      <GameApp/>
    </GameProvider>
  );
}
