export const colors = {
  bg:            "#070a18",
  bgDeep:        "#03050d",
  surface:       "#11182c",
  surfaceAlt:    "#17213a",
  panel:         "#0c1224",
  border:        "#26314f",
  borderBright:  "#53618b",
  textHeading:   "#f2f7ff",
  textMuted:     "#7f8bac",
  textSecondary: "#aeb9d7",
  textSeparator: "#34415f",
  success:       "#8bff4a",
  primary:       "#2458d8",
  primaryLight:  "#7cc7ff",
  danger:        "#ff5d7a",
  rivalDark:     "#a61e4d",
  warning:       "#fff06a",
  cyan:          "#62f0ff",
  violet:        "#b36bff",
  pitch:         "#1fb35e",
};

export const ALPHA = {
  subtle: "12",
  soft:   "18",
  border: "30",
  medium: "40",
  strong: "60",
};

export function withAlpha(hex: string, key: keyof typeof ALPHA): string {
  return `${hex}${ALPHA[key]}`;
}

function clamp255(v:number): number { return Math.max(0, Math.min(255, v)); }

// Shifts a hex color's channels by `amt` (positive = lighten, negative = darken).
// Used to derive gradient highlights / pressed-shadow tones from a single base color.
export function shade(hex:string, amt:number): string {
  const n = parseInt(hex.replace("#",""), 16);
  const r = clamp255(((n>>16)&0xff)+amt);
  const g = clamp255(((n>>8)&0xff)+amt);
  const b = clamp255((n&0xff)+amt);
  return `#${((1<<24)+(r<<16)+(g<<8)+b).toString(16).slice(1)}`;
}

// Picks readable button-label text (dark navy or off-white) for any filled background color.
export function readableTextOn(hex:string): string {
  const n = parseInt(hex.replace("#",""), 16);
  const r=(n>>16)&0xff, g=(n>>8)&0xff, b=n&0xff;
  const luminance = (0.299*r + 0.587*g + 0.114*b) / 255;
  return luminance > 0.6 ? "#1a1204" : "#f8fbff";
}

export const radii = {
  card:   10,
  button: 9,
  badge:  9,
  tag:    4,
  pill:   20,
};

export const spacing = {
  cardPadding:   "12px 14px",
  screenPadding: "14px 14px 10px",
};

export const shadows = {
  glow: (color:string, size="16px") => `0 0 ${size} ${withAlpha(color,"strong")}`,
  panel: "0 14px 28px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.07)",
  raisedPanel: "0 8px 0 rgba(0,0,0,0.24), 0 16px 28px rgba(0,0,0,0.32)",
};

// 3D "game button" depth: soft top highlight + solid drop step + colored ambient glow.
export const elevation = {
  raised:  (color:string) => `inset 0 1px 0 ${withAlpha("#ffffff","soft")}, 0 3px 0 ${shade(color,-40)}, 0 6px 14px ${withAlpha(color,"medium")}`,
  pressed: (color:string) => `inset 0 1px 0 ${withAlpha("#ffffff","subtle")}, 0 1px 0 ${shade(color,-40)}, 0 2px 6px ${withAlpha(color,"soft")}`,
};

export const type = {
  micro:       { fontSize:10, fontWeight:700, letterSpacing:0.8 },
  eyebrow:     { fontSize:10, fontWeight:700, letterSpacing:1.1 },
  heading:     { fontSize:18, fontWeight:900, letterSpacing:0 },
  cardTitle:   { fontSize:14, fontWeight:800, letterSpacing:0.2 },
  statHero:    { fontSize:32, fontWeight:900, letterSpacing:0 },
  statLarge:   { fontSize:26, fontWeight:900, letterSpacing:0 },
  statMedium:  { fontSize:20, fontWeight:900, letterSpacing:0 },
  buttonLabel: { fontSize:13, fontWeight:800, letterSpacing:0.4 },
};
