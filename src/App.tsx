import React, { useState } from "react";
import { GameProvider } from "./store/GameContext";
import { usePassiveIncome } from "./hooks/usePassiveIncome";
import { MatchScreen } from "./screens/MatchScreen";
import { TeamScreen } from "./screens/TeamScreen";
import { MarketScreen } from "./screens/MarketScreen";
import { ShopScreen } from "./screens/ShopScreen";
import { UpgradesScreen } from "./screens/UpgradesScreen";
import { Toast } from "./components/Toast";
import "./index.css";

type Tab = "match"|"team"|"market"|"shop"|"upgrades";

const NAV:{key:Tab;icon:string;label:string}[] = [
  {key:"match",    icon:"⚽", label:"Partida"},
  {key:"team",     icon:"👥", label:"Time"},
  {key:"market",   icon:"🛒", label:"Mercado"},
  {key:"shop",     icon:"💎", label:"Loja"},
  {key:"upgrades", icon:"⬆", label:"Upgrades"},
];

// Inner component that can use context hooks
function GameApp() {
  const [tab, setTab] = useState<Tab>("match");
  const [toast, setToast] = useState<{msg:string;bad:boolean}|null>(null);

  // FIX: usePassiveIncome now uses context internally — no manual wiring needed
  usePassiveIncome();

  const notify = (msg:string, bad=false)=>{
    setToast({msg,bad});
    setTimeout(()=>setToast(null), 2600);
  };

  return (
    <div style={{background:"#070d1a",minHeight:"100vh",maxWidth:430,margin:"0 auto",
      fontFamily:"'Rajdhani',sans-serif",color:"#e2e8f0",position:"relative",display:"flex",flexDirection:"column"}}>

      {toast && <Toast msg={toast.msg} bad={toast.bad}/>}

      <div style={{flex:1,overflowY:"auto",paddingBottom:66}}>
        {tab==="match"    && <MatchScreen    onToast={notify}/>}
        {tab==="team"     && <TeamScreen     onToast={notify}/>}
        {tab==="market"   && <MarketScreen   onToast={notify}/>}
        {tab==="shop"     && <ShopScreen     onToast={notify}/>}
        {tab==="upgrades" && <UpgradesScreen onToast={notify}/>}
      </div>

      <nav style={{position:"fixed",bottom:0,left:"50%",transform:"translateX(-50%)",width:"100%",maxWidth:430,background:"#040a16",borderTop:"1px solid #0e1830",display:"flex",zIndex:200,padding:"0 6px"}}>
        {NAV.map(n=>{
          const active=tab===n.key;
          return (
            <button key={n.key} onClick={()=>setTab(n.key)} style={{flex:1,padding:"10px 0 8px",border:"none",cursor:"pointer",background:"none",display:"flex",flexDirection:"column",alignItems:"center",gap:3,position:"relative"}}>
              {active&&<div style={{position:"absolute",top:0,left:"20%",right:"20%",height:2,background:"#1d4ed8",borderRadius:"0 0 2px 2px"}}/>}
              <span style={{fontSize:16,lineHeight:1,opacity:active?1:0.35}}>{n.icon}</span>
              <span style={{fontSize:8,fontWeight:700,letterSpacing:0.8,color:active?"#60a5fa":"#2d3f5c",fontFamily:"'Rajdhani',sans-serif",textTransform:"uppercase"}}>{n.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
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
