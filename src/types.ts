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
  pac: number;
  sho: number;
  pas: number;
  def: number;
  phy: number;
  dri: number;
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

export interface LeagueTeam {
  id: string;
  name: string;
  color: string;
  power: number;
  isPlayer: boolean;
}

export interface StandingRow {
  teamId: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  points: number;
}

export interface Fixture {
  home: string;
  away: string;
}

export interface LeagueState {
  tier: number;
  round: number;
  teams: LeagueTeam[];
  table: StandingRow[];
  fixtures: Fixture[][];
}

export interface GameState {
  coins: number;
  diamonds: number;
  roster: Player[];
  lineup: Player[];
  formation: FormationKey;
  upgrades: Upgrades;
  teamName: string;
  teamColor: string;
  league: LeagueState;
  market: Player[];
  passiveRate: number;
}

export interface LiveScore {
  home: number;
  away: number;
  min: number;
}
