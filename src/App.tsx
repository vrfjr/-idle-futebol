import React, { useState } from "react";
import { LazyMotion, m, AnimatePresence } from "framer-motion";
import { CircleDot, Shirt, ShoppingCart, Gem, TrendingUp, LucideIcon } from "lucide-react";
import { GameProvider, useGame } from "./store/GameContext";
import { usePassiveIncome } from "./hooks/usePassiveIncome";
import { upgCost } from "./utils/balance";
import { MatchScreen } from "./screens/MatchScreen";
import { TeamScreen } from "./screens/TeamScreen";
import { MarketScreen } from "./screens/MarketScreen";
import { ShopScreen } from "./screens/ShopScreen";
import { UpgradesScreen } from "./screens/UpgradesScreen";
import { Toast } from "./components/Toast";
import { BottomNavItem } from "./components/BottomNavItem";
import { colors } from "./styles/tokens";
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

// Inner component that can use context hooks
function GameApp() {
  const { state } = useGame();
  const [tab, setTab] = useState<Tab>("match");
  const [toast, setToast] = useState<{msg:string;bad:boolean}|null>(null);

  // FIX: usePassiveIncome now uses context internally — no manual wiring needed
  usePassiveIncome();

  const notify = (msg:string, bad=false)=>{
    setToast({msg,bad});
    setTimeout(()=>setToast(null), 2600);
  };

  // Real, state-derived nudge — only lit when at least one upgrade is actually affordable.
  const upgradeAvailable = Object.values(state.upgrades).some(lvl=>state.coins>=upgCost(lvl));

  return (
    <LazyMotion features={loadFeatures} strict>
      <div style={{background:colors.bg,minHeight:"100vh",maxWidth:430,margin:"0 auto",
        fontFamily:"'Rajdhani',sans-serif",color:colors.textHeading,position:"relative",display:"flex",flexDirection:"column"}}>

        <AnimatePresence>
          {toast && <Toast key="toast" msg={toast.msg} bad={toast.bad}/>}
        </AnimatePresence>

        <div style={{flex:1,overflowY:"auto",paddingBottom:"calc(64px + env(safe-area-inset-bottom))"}}>
          <AnimatePresence mode="wait">
            <m.div key={tab} initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-8}} transition={{duration:0.18}}>
              {tab==="match"    && <MatchScreen    onToast={notify} onNavigateShop={()=>setTab("shop")} onNavigateTeam={()=>setTab("team")}/>}
              {tab==="team"     && <TeamScreen     onToast={notify}/>}
              {tab==="market"   && <MarketScreen   onToast={notify}/>}
              {tab==="shop"     && <ShopScreen     onToast={notify}/>}
              {tab==="upgrades" && <UpgradesScreen onToast={notify}/>}
            </m.div>
          </AnimatePresence>
        </div>

        <nav style={{position:"fixed",bottom:0,left:"50%",transform:"translateX(-50%)",width:"100%",maxWidth:430,
          background:"#040a16",borderTop:"1px solid #0e1830",display:"flex",zIndex:200,padding:"2px 6px",
          paddingBottom:"calc(2px + env(safe-area-inset-bottom))"}}>
          {NAV.map(n=>(
            <BottomNavItem key={n.key} icon={n.icon} label={n.label} active={tab===n.key}
              onClick={()=>setTab(n.key)} badge={n.key==="upgrades" && upgradeAvailable}/>
          ))}
        </nav>
      </div>
    </LazyMotion>
  );
}

// Outer component wraps everything in the context provider
export default function App() {
  return (
    <GameProvider>
      <GameApp/>
    </GameProvider>
  );
}
