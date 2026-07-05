import { Texture } from "pixi.js";

// 8-wide pixel grids. "." = transparent, "J" = jersey (recolored per team at build time).
const OUTLINE = "#12181f";
const SKIN = "#e8b48c";
const SHORTS = "#12181f";
const SHOE = "#0d0d0d";

const BODY = [
  "..OOOO..",
  ".OSSSSO.",
  ".OSSSSO.",
  ".OJJJJO.",
  "OJJJJJJO",
  "OJJJJJJO",
  "OJJJJJJO",
  ".OJJJJO.",
];

const LEG_IDLE = [
  "..OBBO..",
  "..OBBO..",
  "..OKKO..",
  "........",
];

const PLAYER_FRAME = [...BODY, ...LEG_IDLE];

const BALL_FRAME = [
  "..OO..",
  ".OWWO.",
  "OWWWWO",
  "OWWWWO",
  ".OWWO.",
  "..OO..",
];

function basePalette(jerseyColor:string): Record<string,string> {
  return { O:OUTLINE, S:SKIN, J:jerseyColor, B:SHORTS, K:SHOE, W:"#f5f5f5" };
}

function rasterize(grid:string[], palette:Record<string,string>): HTMLCanvasElement {
  const h = grid.length;
  const w = Math.max(...grid.map(r=>r.length));
  const canvas = document.createElement("canvas");
  canvas.width = w; canvas.height = h;
  const ctx = canvas.getContext("2d")!;
  ctx.imageSmoothingEnabled = false;
  for(let y=0;y<h;y++){
    const row = grid[y];
    for(let x=0;x<w;x++){
      const ch = row[x] ?? ".";
      const color = palette[ch];
      if(color){ ctx.fillStyle = color; ctx.fillRect(x,y,1,1); }
    }
  }
  return canvas;
}

function textureFromCanvas(canvas:HTMLCanvasElement): Texture {
  return Texture.from({ resource:canvas, scaleMode:"nearest" }, true);
}

const playerTextureCache = new Map<string, Texture>();
let ballTexture: Texture | null = null;

export function getPlayerTexture(jerseyColor:string): Texture {
  const key = jerseyColor;
  let tex = playerTextureCache.get(key);
  if(!tex){
    tex = textureFromCanvas(rasterize(PLAYER_FRAME, basePalette(jerseyColor)));
    playerTextureCache.set(key, tex);
  }
  return tex;
}

export function getBallTexture(): Texture {
  if(!ballTexture){
    ballTexture = textureFromCanvas(rasterize(BALL_FRAME, basePalette("")));
  }
  return ballTexture;
}

export const SPRITE_SCALE = 2;
