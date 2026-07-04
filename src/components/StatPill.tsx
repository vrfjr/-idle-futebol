import React from "react";
interface Props { label:string; value:string|number; color?:string; }
export function StatPill({label,value,color="#e2e8f0"}:Props) {
  return (
    <div style={{flex:1,background:"#0a1120",border:"1px solid #151f35",
      borderRadius:10,padding:"9px 12px",textAlign:"center"}}>
      <div style={{fontSize:8,color:"#2d3f5c",fontWeight:700,letterSpacing:1.2,marginBottom:3}}>{label}</div>
      <div style={{fontSize:14,fontWeight:900,color,letterSpacing:0.3}}>{value}</div>
    </div>
  );
}
