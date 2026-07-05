import { fieldLayout } from "../constants/formations";
import { FormationKey, Player, PositionKey } from "../types";
import { assignPlayersToSlots } from "../utils/lineup";

export type AgentAction = "run"|"kick"|"tackle";
export interface SimAgent {
  x:number;y:number;bx:number;by:number;num:number;isHome:boolean;hasBall:boolean;
  action:AgentAction; actionTimer:number;
  pos:PositionKey; pac:number; sho:number; pas:number; def:number; phy:number; dri:number; ovr:number;
}
export interface PendingShot { isGoal:boolean; wasAttacking:boolean; }
export interface Sim {
  home:SimAgent[]; away:SimAgent[];
  ball:{x:number;y:number;vx:number;vy:number};
  attacking:boolean; carrierIdx:number;
  homeGoals:number; awayGoals:number;
  flash:number; frame:number;
  passCooldownAgent:SimAgent|null; passCooldownTimer:number;
  pendingShot:PendingShot|null; shotTimer:number;
}

const POS_DEFAULTS: Record<PositionKey, Pick<SimAgent,"pac"|"sho"|"pas"|"def"|"phy"|"dri"|"ovr">> = {
  GOL: {pac:34, sho:8,  pas:30, def:56, phy:52, dri:20, ovr:44},
  ZAG: {pac:42, sho:14, pas:34, def:52, phy:52, dri:28, ovr:42},
  MEI: {pac:46, sho:36, pas:52, def:34, phy:42, dri:48, ovr:43},
  ATA: {pac:54, sho:52, pas:34, def:18, phy:42, dri:48, ovr:44},
};

function clamp(v:number, min:number, max:number): number {
  return Math.max(min, Math.min(max, v));
}

// A player fielded outside their real position visibly underperforms — harshest
// when a goalkeeper plays outfield or vice versa, milder between outfield roles.
function outOfPositionPenalty(playerPos:PositionKey, slotPos:PositionKey): number {
  if(playerPos===slotPos) return 1;
  if(playerPos==="GOL" || slotPos==="GOL") return 0.55;
  return 0.8;
}

function fromPlayer(player:Player|undefined, pos:PositionKey, powerScale=1): Pick<SimAgent,"pac"|"sho"|"pas"|"def"|"phy"|"dri"|"ovr"> {
  const base = player ?? POS_DEFAULTS[pos];
  const scale = powerScale * (player ? outOfPositionPenalty(player.pos, pos) : 1);
  return {
    pac: clamp(base.pac*scale, 12, 99),
    sho: clamp(base.sho*scale, 8, 99),
    pas: clamp(base.pas*scale, 10, 99),
    def: clamp(base.def*scale, 8, 99),
    phy: clamp(base.phy*scale, 10, 99),
    dri: clamp(base.dri*scale, 8, 99),
    ovr: clamp(base.ovr*scale, 10, 99),
  };
}

export function createSim(
  W:number,
  H:number,
  homeFormation:FormationKey = "4-3-3",
  homeLineup:Player[] = [],
  opponentPower = 45,
): Sim {
  const homePts = fieldLayout(homeFormation, true, W, H);
  const awayPts = fieldLayout("4-4-2", false, W, H);
  const assignedHome = assignPlayersToSlots(homeLineup.slice(0, 11), homePts);
  const awayScale = clamp(opponentPower/45, 0.75, 1.75);

  const agent = (
    pt:{x:number;y:number;num:number;role:PositionKey},
    isHome:boolean,
    player?:Player,
  ): SimAgent => ({
    x:pt.x+(Math.random()-.5)*10,
    y:pt.y+(Math.random()-.5)*10,
    bx:pt.x,
    by:pt.y,
    num:pt.num,
    isHome,
    hasBall:false,
    action:"run",
    actionTimer:0,
    pos:pt.role,
    ...fromPlayer(player, pt.role, isHome ? 1 : awayScale),
  });

  return {
    home: assignedHome.map(p=>agent(p, true, p.player)),
    away: awayPts.map(p=>agent(p, false)),
    ball: {x:W/2, y:H/2, vx:2.5, vy:1.2},
    attacking:true, carrierIdx:-1,
    homeGoals:0, awayGoals:0, flash:0, frame:0,
    passCooldownAgent:null, passCooldownTimer:0,
    pendingShot:null, shotTimer:0,
  };
}

function setCarrier(sim:Sim, player:SimAgent, home:SimAgent[], away:SimAgent[]): void {
  const ih = player.isHome;
  sim.attacking = ih;
  sim.carrierIdx = (ih?home:away).indexOf(player);
  home.forEach(q=>q.hasBall=false);
  away.forEach(q=>q.hasBall=false);
  player.hasBall = true;
}

function nearestPlayer(players:SimAgent[], x:number, y:number, skip:(p:SimAgent)=>boolean=()=>false): {p:SimAgent;dist:number}|null {
  let best: {p:SimAgent;dist:number}|null = null;
  players.forEach(p=>{
    if(skip(p)) return;
    const dist = Math.hypot(p.x-x, p.y-y);
    if(!best || dist<best.dist) best = {p,dist};
  });
  return best;
}

function separateAgents(players:SimAgent[], W:number, H:number): void {
  for(let i=0;i<players.length;i++){
    for(let j=i+1;j<players.length;j++){
      const a = players[i], b = players[j];
      const dx = b.x-a.x, dy = b.y-a.y;
      const dist = Math.hypot(dx, dy);
      if(dist>0 && dist<11){
        const push = (11-dist)*0.045;
        const nx = dx/dist, ny = dy/dist;
        a.x-=nx*push; a.y-=ny*push;
        b.x+=nx*push; b.y+=ny*push;
      }
    }
  }
  players.forEach(p=>{
    p.x=clamp(p.x,6,W-6);
    p.y=clamp(p.y,6,H-6);
  });
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
    const carrySpeed = 0.75 + c.pac/130 + c.dri/220;
    const verticalControl = 0.45 + c.dri/210;
    if(d>5){
      c.x+=dx/d*carrySpeed;
      c.y+=dy/d*verticalControl;
    }
    ball.x=c.x+(Math.random()-.5)*5;
    ball.y=c.y+(Math.random()-.5)*5;

    const shotRange = W*(0.16 + c.sho/520);
    const kickCadence = Math.max(48, 105 - Math.round(c.pas/2));
    if(sim.frame%kickCadence===0 || d<shotRange){
      c.action="kick";
      c.actionTimer=14;
      const shotIntent = d<shotRange && Math.random() < 0.32 + c.sho/180;
      if(shotIntent){
        const keeper = defs[0];
        const keeperRating = keeper.def*0.72 + keeper.phy*0.28;
        const shotQuality = c.sho*0.64 + c.dri*0.2 + c.phy*0.16;
        const chance = clamp(0.35 + (shotQuality-keeperRating)/145, 0.12, 0.74);
        const gy = H/2 + (Math.random()-0.5)*H*(0.22 - clamp(c.sho/700, 0, 0.12));
        ball.vx=(goalX-ball.x)*0.22;
        ball.vy=(gy-ball.y)*0.22;
        c.hasBall=false;
        sim.carrierIdx=-1;
        sim.pendingShot={isGoal:Math.random()<chance, wasAttacking:sim.attacking};
        sim.shotTimer=Math.round(clamp(d/15, 10, 24));
      } else {
        const receivers = attk.filter(p=>p!==c && p.pos!=="GOL");
        const recv = receivers[Math.floor(Math.random()*receivers.length)];
        if(recv){
          const passPower = 0.065 + c.pas/1100;
          ball.vx=(recv.x-ball.x)*passPower;
          ball.vy=(recv.y-ball.y)*passPower;
          c.hasBall=false;
          sim.carrierIdx=-1;
          sim.passCooldownAgent=c;
          sim.passCooldownTimer=8;
        }
      }
    }

    let stolen = false;
    defs.forEach((df,i)=>{
      if(i===0 || stolen)return;
      const dx2=c.x-df.x,dy2=c.y-df.y,dist=Math.hypot(dx2,dy2);
      if(dist<14){
        df.action="tackle";
        df.actionTimer=14;
        const tackleChance = clamp(0.035 + ((df.def+df.phy)-(c.dri+c.phy))*0.0014, 0.02, 0.16);
        if(Math.random()<tackleChance){
          stolen = true;
          c.hasBall=false;
          setCarrier(sim, df, home, away);
          ball.vx=(Math.random()-.5)*4;
          ball.vy=(Math.random()-.5)*4;
        }
      } else if(dist>8&&dist<W*0.45){
        const closeSpeed = 0.38 + df.pac/210 + df.def/260;
        df.x+=dx2/dist*closeSpeed;
        df.y+=dy2/dist*closeSpeed;
      }
    });
  } else {
    ball.x+=ball.vx; ball.y+=ball.vy; ball.vx*=0.965; ball.vy*=0.965;
    if(ball.x<10||ball.x>W-10)ball.vx*=-0.8;
    if(ball.y<10||ball.y>H-10)ball.vy*=-0.8;
    ball.x=clamp(ball.x,10,W-10); ball.y=clamp(ball.y,10,H-10);

    if(sim.pendingShot){
      if(--sim.shotTimer<=0){
        const {isGoal, wasAttacking} = sim.pendingShot;
        if(isGoal){
          if(wasAttacking) sim.homeGoals++; else sim.awayGoals++;
          sim.flash=75;
          onGoal(sim.homeGoals, sim.awayGoals);
        }
        sim.attacking=!wasAttacking;
        home.forEach(p=>p.hasBall=false); away.forEach(p=>p.hasBall=false);
        ball.vx=(Math.random()-.5)*6; ball.vy=(Math.random()-.5)*6;
        sim.pendingShot=null;
      }
    } else {
      const all = [...home,...away];
      const nearest = nearestPlayer(all, ball.x, ball.y, p=>p===sim.passCooldownAgent && sim.passCooldownTimer>0);
      if(nearest){
        const speed = Math.hypot(ball.vx, ball.vy);
        if(nearest.dist>15 && (speed<2.2 || nearest.dist<90)){
          const dx=ball.x-nearest.p.x, dy=ball.y-nearest.p.y;
          const d=Math.hypot(dx,dy);
          if(d>0){
            const chaseSpeed = 0.55 + nearest.p.pac/190;
            nearest.p.x+=dx/d*chaseSpeed;
            nearest.p.y+=dy/d*chaseSpeed;
          }
        }
        if(nearest.dist<16 || (speed<0.18 && nearest.dist<30)){
          setCarrier(sim, nearest.p, home, away);
        }
      }
    }
  }
  if(sim.passCooldownTimer>0 && --sim.passCooldownTimer===0) sim.passCooldownAgent=null;

  const allPlayers = [...home,...away];
  allPlayers.forEach(p=>{
    if(!p.hasBall){
      p.x+=(p.bx-p.x)*0.02+(Math.random()-.5)*0.25;
      p.y+=(p.by-p.y)*0.02+(Math.random()-.5)*0.25;
    }
    p.x=clamp(p.x,6,W-6);
    p.y=clamp(p.y,6,H-6);
    if(p.actionTimer>0 && --p.actionTimer===0) p.action="run";
  });
  separateAgents(allPlayers, W, H);
  if(sim.flash>0)sim.flash--;
}
