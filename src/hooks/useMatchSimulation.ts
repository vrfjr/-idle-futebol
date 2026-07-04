import { useEffect, RefObject } from "react";
import { fieldLayout } from "../constants/formations";
import { colors } from "../styles/tokens";

interface SimAgent { x:number;y:number;bx:number;by:number;num:number;isHome:boolean;hasBall:boolean; }
interface Sim {
  home:SimAgent[]; away:SimAgent[];
  ball:{x:number;y:number;vx:number;vy:number};
  attacking:boolean; carrierIdx:number;
  homeGoals:number; awayGoals:number;
  flash:number; frame:number;
}

export function useMatchSimulation(
  canvasRef: RefObject<HTMLCanvasElement>,
  onGoal: (home:number, away:number)=>void
): void {
  useEffect(()=>{
    const canvas = canvasRef.current;
    if(!canvas) return;
    const ctx = canvas.getContext("2d")!;
    const W = canvas.width, H = canvas.height;

    const homePts = fieldLayout("4-3-3", true, W, H);
    const awayPts = fieldLayout("4-3-3", false, W, H);
    const agent = (pt:{x:number;y:number;num:number}, isHome:boolean): SimAgent => ({
      x:pt.x+(Math.random()-.5)*10, y:pt.y+(Math.random()-.5)*10,
      bx:pt.x, by:pt.y, num:pt.num, isHome, hasBall:false,
    });

    const sim: Sim = {
      home: homePts.map(p=>agent(p,true)),
      away: awayPts.map(p=>agent(p,false)),
      ball: {x:W/2, y:H/2, vx:2.5, vy:1.2},
      attacking:true, carrierIdx:-1,
      homeGoals:0, awayGoals:0, flash:0, frame:0,
    };

    let rafId: number;

    const tick = ()=>{
      sim.frame++;
      const {home, away, ball} = sim;
      const attk = sim.attacking?home:away;
      const defs = sim.attacking?away:home;
      const goalX = sim.attacking?W*0.93:W*0.07;

      if(sim.carrierIdx>=0 && sim.carrierIdx<attk.length){
        const c = attk[sim.carrierIdx];
        c.hasBall = true;
        const dx=goalX-c.x, dy=H/2-c.y, d=Math.hypot(dx,dy);
        if(d>5){c.x+=dx/d*1.15; c.y+=dy/d*0.65;}
        ball.x=c.x+(Math.random()-.5)*5; ball.y=c.y+(Math.random()-.5)*5;

        if(sim.frame%85===0 || d<W*0.19){
          if(d<W*0.21 && Math.random()<0.48){
            if(Math.random()<0.55){
              if(sim.attacking) sim.homeGoals++; else sim.awayGoals++;
              sim.flash=75;
              onGoal(sim.homeGoals, sim.awayGoals);
            }
            sim.attacking=!sim.attacking; sim.carrierIdx=-1;
            home.forEach(p=>p.hasBall=false); away.forEach(p=>p.hasBall=false);
            ball.vx=(Math.random()-.5)*6; ball.vy=(Math.random()-.5)*6;
          } else {
            const ti=1+Math.floor(Math.random()*(attk.length-1));
            const recv=attk[ti%attk.length];
            if(recv){ball.vx=(recv.x-ball.x)*0.09; ball.vy=(recv.y-ball.y)*0.09; c.hasBall=false; recv.hasBall=true; sim.carrierIdx=attk.indexOf(recv);}
          }
        }
        defs.forEach((df,i)=>{
          if(i===0)return;
          const dx2=c.x-df.x,dy2=c.y-df.y,dist=Math.hypot(dx2,dy2);
          if(dist>8&&dist<W*0.45){df.x+=dx2/dist*0.7;df.y+=dy2/dist*0.7;}
        });
      } else {
        ball.x+=ball.vx; ball.y+=ball.vy; ball.vx*=0.965; ball.vy*=0.965;
        if(ball.x<10||ball.x>W-10)ball.vx*=-0.8;
        if(ball.y<10||ball.y>H-10)ball.vy*=-0.8;
        ball.x=Math.max(10,Math.min(W-10,ball.x)); ball.y=Math.max(10,Math.min(H-10,ball.y));
        for(const p of [...home,...away]){
          if(Math.hypot(p.x-ball.x,p.y-ball.y)<15){
            const ih=home.includes(p); sim.attacking=ih;
            const team=ih?home:away; sim.carrierIdx=team.indexOf(p);
            home.forEach(q=>q.hasBall=false); away.forEach(q=>q.hasBall=false); p.hasBall=true; break;
          }
        }
      }

      [...home,...away].forEach(p=>{
        if(!p.hasBall){p.x+=(p.bx-p.x)*0.025+(Math.random()-.5)*0.4; p.y+=(p.by-p.y)*0.025+(Math.random()-.5)*0.4;}
        p.x=Math.max(6,Math.min(W-6,p.x)); p.y=Math.max(6,Math.min(H-6,p.y));
      });
      if(sim.flash>0)sim.flash--;

      // Draw
      ctx.clearRect(0,0,W,H);
      for(let i=0;i<10;i++){ctx.fillStyle=i%2===0?"#16532d":"#1a5e32"; ctx.fillRect(i*W/10,0,W/10,H);}
      ctx.strokeStyle="rgba(255,255,255,0.18)"; ctx.lineWidth=1.2;
      ctx.strokeRect(4,4,W-8,H-8);
      ctx.beginPath();ctx.moveTo(W/2,4);ctx.lineTo(W/2,H-4);ctx.stroke();
      ctx.beginPath();ctx.arc(W/2,H/2,H*0.17,0,Math.PI*2);ctx.stroke();
      ctx.fillStyle="rgba(255,255,255,0.35)";ctx.beginPath();ctx.arc(W/2,H/2,2,0,Math.PI*2);ctx.fill();
      const paW=W*0.15,paH=H*0.52;
      ctx.strokeRect(4,(H-paH)/2,paW,paH); ctx.strokeRect(W-paW-4,(H-paH)/2,paW,paH);
      const sbW=W*0.065,sbH=H*0.26;
      ctx.strokeRect(4,(H-sbH)/2,sbW,sbH); ctx.strokeRect(W-sbW-4,(H-sbH)/2,sbW,sbH);
      ctx.strokeStyle="rgba(255,255,255,0.55)"; ctx.lineWidth=2;
      const gH=H*0.2;
      ctx.strokeRect(-2,(H-gH)/2,8,gH); ctx.strokeRect(W-6,(H-gH)/2,8,gH);
      ctx.fillStyle="rgba(255,255,255,0.3)";
      ctx.beginPath();ctx.arc(W*0.13,H/2,1.8,0,Math.PI*2);ctx.fill();
      ctx.beginPath();ctx.arc(W*0.87,H/2,1.8,0,Math.PI*2);ctx.fill();

      const drawP=(p:SimAgent,fill:string,ring:string)=>{
        const r=p.hasBall?9:7.5;
        ctx.fillStyle=fill;ctx.beginPath();ctx.arc(p.x,p.y,r,0,Math.PI*2);ctx.fill();
        if(p.hasBall){ctx.strokeStyle=ring;ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(p.x,p.y,r+2,0,Math.PI*2);ctx.stroke();}
        ctx.fillStyle="rgba(255,255,255,0.9)";ctx.font="bold 6px monospace";
        ctx.textAlign="center";ctx.textBaseline="middle";ctx.fillText(String(p.num),p.x,p.y+0.5);
      };
      sim.home.forEach(p=>drawP(p,colors.primary,colors.primaryLight));
      sim.away.forEach(p=>drawP(p,colors.rivalDark,"#fca5a5"));
      ctx.fillStyle="#f5f5f5";ctx.beginPath();ctx.arc(ball.x,ball.y,5,0,Math.PI*2);ctx.fill();
      ctx.strokeStyle="#333";ctx.lineWidth=0.6;ctx.stroke();

      if(sim.flash>0){
        const a=sim.flash/75;
        ctx.fillStyle=`rgba(251,191,36,${a*0.18})`;ctx.fillRect(0,0,W,H);
        ctx.fillStyle=`rgba(255,255,255,${a*0.95})`;
        ctx.font=`bold ${18+(75-sim.flash)*0.15}px monospace`;
        ctx.textAlign="center";ctx.textBaseline="middle";ctx.fillText("GOOOOOL!",W/2,H/2);
      }

      rafId=requestAnimationFrame(tick);
    };

    rafId=requestAnimationFrame(tick);
    return ()=>cancelAnimationFrame(rafId);
  // canvasRef.current is stable; onGoal is intentionally NOT in deps so the
  // canvas never restarts — we capture it on each call to tick via closure
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
