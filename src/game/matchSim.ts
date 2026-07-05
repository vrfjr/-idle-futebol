import { fieldLayout } from "../constants/formations";

export type AgentAction = "run"|"kick"|"tackle";
export interface SimAgent {
  x:number;y:number;bx:number;by:number;num:number;isHome:boolean;hasBall:boolean;
  action:AgentAction; actionTimer:number;
}
export interface Sim {
  home:SimAgent[]; away:SimAgent[];
  ball:{x:number;y:number;vx:number;vy:number};
  attacking:boolean; carrierIdx:number;
  homeGoals:number; awayGoals:number;
  flash:number; frame:number;
  // Briefly blocks whoever just kicked the ball from immediately re-collecting it
  // while it's still traveling, so passes actually leave the passer's feet.
  passCooldownAgent:SimAgent|null; passCooldownTimer:number;
}

export function createSim(W:number, H:number): Sim {
  const homePts = fieldLayout("4-3-3", true, W, H);
  const awayPts = fieldLayout("4-3-3", false, W, H);
  const agent = (pt:{x:number;y:number;num:number}, isHome:boolean): SimAgent => ({
    x:pt.x+(Math.random()-.5)*10, y:pt.y+(Math.random()-.5)*10,
    bx:pt.x, by:pt.y, num:pt.num, isHome, hasBall:false,
    action:"run", actionTimer:0,
  });

  return {
    home: homePts.map(p=>agent(p,true)),
    away: awayPts.map(p=>agent(p,false)),
    ball: {x:W/2, y:H/2, vx:2.5, vy:1.2},
    attacking:true, carrierIdx:-1,
    homeGoals:0, awayGoals:0, flash:0, frame:0,
    passCooldownAgent:null, passCooldownTimer:0,
  };
}

export function stepSimulation(sim:Sim, W:number, H:number, onGoal:(home:number,away:number)=>void): void {
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
      c.action="kick"; c.actionTimer=14;
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
        if(recv){
          // Send the ball flying toward the receiver instead of snapping to them —
          // it travels via the loose-ball physics below and gets picked up once
          // someone (usually recv, but interceptable by a defender) is in range.
          ball.vx=(recv.x-ball.x)*0.09; ball.vy=(recv.y-ball.y)*0.09;
          c.hasBall=false;
          sim.carrierIdx=-1;
          sim.passCooldownAgent=c; sim.passCooldownTimer=10;
        }
      }
    }
    let stolen = false;
    defs.forEach((df,i)=>{
      if(i===0 || stolen)return;
      const dx2=c.x-df.x,dy2=c.y-df.y,dist=Math.hypot(dx2,dy2);
      if(dist<14){
        df.action="tackle"; df.actionTimer=14;
        if(Math.random()<0.05){
          stolen = true;
          c.hasBall=false;
          sim.attacking=!sim.attacking; sim.carrierIdx=defs.indexOf(df);
          df.hasBall=true;
          ball.vx=(Math.random()-.5)*4; ball.vy=(Math.random()-.5)*4;
        }
      } else if(dist>8&&dist<W*0.45){df.x+=dx2/dist*0.7;df.y+=dy2/dist*0.7;}
    });
  } else {
    ball.x+=ball.vx; ball.y+=ball.vy; ball.vx*=0.965; ball.vy*=0.965;
    if(ball.x<10||ball.x>W-10)ball.vx*=-0.8;
    if(ball.y<10||ball.y>H-10)ball.vy*=-0.8;
    ball.x=Math.max(10,Math.min(W-10,ball.x)); ball.y=Math.max(10,Math.min(H-10,ball.y));
    for(const p of [...home,...away]){
      if(p===sim.passCooldownAgent && sim.passCooldownTimer>0) continue;
      if(Math.hypot(p.x-ball.x,p.y-ball.y)<15){
        const ih=home.includes(p); sim.attacking=ih;
        const team=ih?home:away; sim.carrierIdx=team.indexOf(p);
        home.forEach(q=>q.hasBall=false); away.forEach(q=>q.hasBall=false); p.hasBall=true; break;
      }
    }
  }
  if(sim.passCooldownTimer>0 && --sim.passCooldownTimer===0) sim.passCooldownAgent=null;

  [...home,...away].forEach(p=>{
    if(!p.hasBall){p.x+=(p.bx-p.x)*0.025+(Math.random()-.5)*0.4; p.y+=(p.by-p.y)*0.025+(Math.random()-.5)*0.4;}
    p.x=Math.max(6,Math.min(W-6,p.x)); p.y=Math.max(6,Math.min(H-6,p.y));
    if(p.actionTimer>0 && --p.actionTimer===0) p.action="run";
  });
  if(sim.flash>0)sim.flash--;
}
