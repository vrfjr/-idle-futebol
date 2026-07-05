import { PositionKey } from "../types";

export interface StatWeights { pac:number; sho:number; pas:number; def:number; phy:number; dri:number; }

// Weights per position for computing `ovr` — each row sums to 1.0.
// GOL has no dedicated goalkeeping attributes (the game resolves matches via a
// single power number, not per-attribute mechanics); DEF/PHY weighted high and
// SHO zeroed is enough differentiation for this game's level of simulation.
export const POSITION_WEIGHTS: Record<PositionKey, StatWeights> = {
  GOL: { pac:0.10, sho:0.00, pas:0.15, def:0.40, phy:0.30, dri:0.05 },
  ZAG: { pac:0.15, sho:0.00, pas:0.10, def:0.45, phy:0.25, dri:0.05 },
  LD:  { pac:0.20, sho:0.03, pas:0.17, def:0.28, phy:0.17, dri:0.15 },
  LE:  { pac:0.20, sho:0.03, pas:0.17, def:0.28, phy:0.17, dri:0.15 },
  VOL: { pac:0.12, sho:0.04, pas:0.22, def:0.32, phy:0.20, dri:0.10 },
  MC:  { pac:0.13, sho:0.08, pas:0.30, def:0.18, phy:0.15, dri:0.16 },
  MEI: { pac:0.14, sho:0.20, pas:0.28, def:0.06, phy:0.10, dri:0.22 },
  PD:  { pac:0.28, sho:0.20, pas:0.15, def:0.04, phy:0.09, dri:0.24 },
  PE:  { pac:0.28, sho:0.20, pas:0.15, def:0.04, phy:0.09, dri:0.24 },
  SA:  { pac:0.18, sho:0.26, pas:0.18, def:0.04, phy:0.12, dri:0.22 },
  CA:  { pac:0.18, sho:0.36, pas:0.06, def:0.02, phy:0.22, dri:0.16 },
};
