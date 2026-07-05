import { PositionKey } from "../types";

export interface StatWeights { pac:number; sho:number; pas:number; def:number; phy:number; dri:number; }

// Weights per position for computing `ovr` — each row sums to 1.0.
// GOL has no dedicated goalkeeping attributes (the game resolves matches via a
// single power number, not per-attribute mechanics); DEF/PHY weighted high and
// SHO zeroed is enough differentiation for this game's level of simulation.
export const POSITION_WEIGHTS: Record<PositionKey, StatWeights> = {
  GOL: { pac:0.10, sho:0.00, pas:0.15, def:0.40, phy:0.30, dri:0.05 },
  ZAG: { pac:0.15, sho:0.00, pas:0.10, def:0.45, phy:0.25, dri:0.05 },
  MEI: { pac:0.10, sho:0.10, pas:0.30, def:0.15, phy:0.15, dri:0.20 },
  ATA: { pac:0.20, sho:0.35, pas:0.08, def:0.02, phy:0.15, dri:0.20 },
};
