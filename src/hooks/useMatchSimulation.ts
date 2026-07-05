import { useEffect, RefObject } from "react";
import { Application, Graphics, Sprite, Text, TextStyle } from "pixi.js";
import { createSim, stepSimulation, Sim } from "../game/matchSim";
import { getPlayerTexture, getBallTexture, SPRITE_SCALE, RUN_FRAME_COUNT } from "../game/pixelSprites";
import { colors } from "../styles/tokens";

const W = 356, H = 218;
const LINE = "rgba(255,255,255,0.18)";
const GOAL_LINE = "rgba(255,255,255,0.55)";

function drawPitch(): Graphics {
  const g = new Graphics();
  for(let i=0;i<10;i++) g.rect(i*W/10,0,W/10,H).fill(i%2===0?"#16532d":"#1a5e32");
  g.rect(4,4,W-8,H-8).stroke({width:1.2,color:LINE});
  g.moveTo(W/2,4).lineTo(W/2,H-4).stroke({width:1.2,color:LINE});
  g.circle(W/2,H/2,H*0.17).stroke({width:1.2,color:LINE});
  g.circle(W/2,H/2,2).fill("rgba(255,255,255,0.35)");
  const paW=W*0.15,paH=H*0.52;
  g.rect(4,(H-paH)/2,paW,paH).stroke({width:1.2,color:LINE});
  g.rect(W-paW-4,(H-paH)/2,paW,paH).stroke({width:1.2,color:LINE});
  const sbW=W*0.065,sbH=H*0.26;
  g.rect(4,(H-sbH)/2,sbW,sbH).stroke({width:1.2,color:LINE});
  g.rect(W-sbW-4,(H-sbH)/2,sbW,sbH).stroke({width:1.2,color:LINE});
  const gH=H*0.2;
  g.rect(-2,(H-gH)/2,8,gH).stroke({width:2,color:GOAL_LINE});
  g.rect(W-6,(H-gH)/2,8,gH).stroke({width:2,color:GOAL_LINE});
  g.circle(W*0.13,H/2,1.8).fill("rgba(255,255,255,0.3)");
  g.circle(W*0.87,H/2,1.8).fill("rgba(255,255,255,0.3)");
  return g;
}

export function useMatchSimulation(
  containerRef: RefObject<HTMLDivElement>,
  onGoal: (home:number, away:number)=>void
): void {
  useEffect(()=>{
    const container = containerRef.current;
    if(!container) return;

    let cancelled = false;
    let initialized = false;
    let rafId = 0;
    const app = new Application();

    app.init({ width:W, height:H, antialias:false, roundPixels:true, backgroundAlpha:0 }).then(()=>{
      if(cancelled){
        app.destroy({removeView:true}, {children:true, texture:false, textureSource:false});
        return;
      }
      initialized = true;

      const canvasEl = app.canvas as HTMLCanvasElement;
      canvasEl.style.display = "block";
      canvasEl.style.width = "100%";
      canvasEl.style.height = "auto";
      canvasEl.style.imageRendering = "pixelated";
      container.appendChild(canvasEl);

      app.stage.addChild(drawPitch());

      const sim: Sim = createSim(W, H);

      const makePlayerSprite = (jersey:string) => {
        const s = new Sprite(getPlayerTexture(jersey));
        s.anchor.set(0.5);
        s.scale.set(SPRITE_SCALE);
        return s;
      };
      const homeSprites = sim.home.map(()=>makePlayerSprite(colors.primary));
      const awaySprites = sim.away.map(()=>makePlayerSprite(colors.rivalDark));
      homeSprites.forEach(s=>app.stage.addChild(s));
      awaySprites.forEach(s=>app.stage.addChild(s));

      const allAgents = [...sim.home, ...sim.away];
      const allSprites = [...homeSprites, ...awaySprites];
      const allJersey = allAgents.map((_,i)=> i<sim.home.length ? colors.primary : colors.rivalDark);
      const prevX = allAgents.map(p=>p.x);
      const prevY = allAgents.map(p=>p.y);

      const rings = allAgents.map((_,i)=>{
        const isHome = i < sim.home.length;
        const g = new Graphics().circle(0,0,10).stroke({width:1.5,color:isHome?colors.primaryLight:"#fca5a5"});
        g.visible = false;
        app.stage.addChild(g);
        return g;
      });

      const ballSprite = new Sprite(getBallTexture());
      ballSprite.anchor.set(0.5);
      ballSprite.scale.set(SPRITE_SCALE);
      app.stage.addChild(ballSprite);

      const flashRect = new Graphics().rect(0,0,W,H).fill(colors.warning);
      flashRect.alpha = 0; flashRect.visible = false;
      app.stage.addChild(flashRect);

      const flashText = new Text({
        text:"GOOOOOL!",
        style: new TextStyle({ fontFamily:"monospace", fontWeight:"bold", fontSize:18, fill:"#ffffff" }),
      });
      flashText.anchor.set(0.5);
      flashText.position.set(W/2, H/2);
      flashText.visible = false;
      app.stage.addChild(flashText);

      const syncSprites = () => {
        sim.home.forEach((p,i)=>homeSprites[i].position.set(p.x,p.y));
        sim.away.forEach((p,i)=>awaySprites[i].position.set(p.x,p.y));
        allAgents.forEach((p,i)=>{
          rings[i].position.set(p.x,p.y);
          rings[i].visible = p.hasBall;

          const moved = Math.hypot(p.x-prevX[i], p.y-prevY[i]) > 0.15;
          const frame = moved ? 1 + (Math.floor(sim.frame/8)%(RUN_FRAME_COUNT-1)) : 0;
          allSprites[i].texture = getPlayerTexture(allJersey[i], frame);
          prevX[i] = p.x; prevY[i] = p.y;
        });
        ballSprite.position.set(sim.ball.x, sim.ball.y);

        flashRect.visible = sim.flash > 0;
        flashRect.alpha = (sim.flash/75)*0.18;
        flashText.visible = sim.flash > 0;
        flashText.alpha = (sim.flash/75)*0.95;
        flashText.style.fontSize = 18 + (75-sim.flash)*0.15;
      };

      const tick = () => {
        stepSimulation(sim, W, H, onGoal);
        syncSprites();
        rafId = requestAnimationFrame(tick);
      };
      rafId = requestAnimationFrame(tick);
    });

    return ()=>{
      cancelled = true;
      cancelAnimationFrame(rafId);
      if(initialized){
        app.destroy({removeView:true}, {children:true, texture:false, textureSource:false});
      }
    };
  // containerRef.current and onGoal are captured once at effect-setup time;
  // this loop is intentionally not restarted on every re-render.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
