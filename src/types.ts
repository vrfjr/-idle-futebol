export type RarityKey = "common" | "rare" | "epic" | "legendary";
export type PositionKey = "GOL" | "ZAG" | "MEI" | "ATA";
export type FormationKey = "4-3-3" | "4-4-2" | "3-5-2" | "4-2-3-1" | "5-3-2";
export type UpgradeKey = "attack" | "defense" | "training" | "fans";
export type MatchResult = "win" | "draw" | "loss";

export interface Player {
  id: string;
  name: string;
  pos: PositionKey;
  rarity: RarityKey;
  atk: number;
  def: number;
  spd: number;
  dbl: number;
  ovr: number;
  price: number;
  sellPrice: number;
}

export interface Upgrades {
  attack: number;
  defense: number;
  training: number;
  fans: number;
}

export interface GameState {
  coins: number;
  diamonds: number;
  roster: Player[];
  lineup: Player[];
  formation: FormationKey;
  upgrades: Upgrades;
  wins: number;
  losses: number;
  draws: number;
  league: number;
  market: Player[];
  passiveRate: number;
}

export interface LiveScore {
  home: number;
  away: number;
  min: number;
}
