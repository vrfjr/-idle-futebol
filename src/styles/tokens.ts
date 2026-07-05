export const colors = {
  bg:            "#070d1a",
  surface:       "#090f1e",
  border:        "#151f35",
  textHeading:   "#e2e8f0",
  textMuted:     "#2d3f5c",
  textSecondary: "#475569",
  textSeparator: "#1e293b",
  success:       "#4ade80",
  primary:       "#1d4ed8",
  primaryLight:  "#60a5fa",
  danger:        "#f87171",
  rivalDark:     "#991b1b",
  warning:       "#fbbf24",
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

export const radii = {
  card:   10,
  button: 7,
  badge:  8,
  tag:    3,
  pill:   20,
};

export const spacing = {
  cardPadding:   "12px 14px",
  screenPadding: "16px 14px 8px",
};

export const shadows = {
  glow: (color:string, size="16px") => `0 0 ${size} ${withAlpha(color,"strong")}`,
};

export const type = {
  eyebrow:     { fontSize:9,  fontWeight:700, letterSpacing:1.2 },
  heading:     { fontSize:17, fontWeight:900, letterSpacing:-0.3 },
  cardTitle:   { fontSize:14, fontWeight:800, letterSpacing:0.2 },
  statHero:    { fontSize:30, fontWeight:900, letterSpacing:-1 },
  statLarge:   { fontSize:24, fontWeight:900, letterSpacing:-0.5 },
  statMedium:  { fontSize:20, fontWeight:900, letterSpacing:-0.5 },
  buttonLabel: { fontSize:12, fontWeight:800, letterSpacing:0.4 },
};
