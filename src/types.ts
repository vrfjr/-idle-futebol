export type RarityKey = "common" | "rare" | "epic" | "legendary";
export type PositionKey =
  | "GOL" | "ZAG" | "LD" | "LE" | "VOL" | "MC" | "MEI" | "PD" | "PE" | "SA" | "CA";
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
  // Training levels applied (absent on pre-training saves = 0).
  training?: number;
}

export interface Upgrades {
  attack: number;
  defense: number;
  training: number;
  fans: number;
}

export type OfflineRewardReason = "ok" | "missing_timestamp" | "clock_reversed" | "too_short";

export interface OfflineReward {
  coins: number;
  seconds: number;
  capped: boolean;
  reason: OfflineRewardReason;
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
  // Unique per generated season; the season pass resets when it changes.
  // Optional: absent on saves from before the pass existed.
  seasonId?: string;
}

export interface SeasonPassState {
  seasonId: string;
  premium: boolean;
  claimedFree: number[];
  claimedPremium: number[];
}

// Lifetime counters powering missions and achievements.
export interface GameStats {
  wins: number;
  titles: number;
  seasonsPlayed: number;
  playersBought: number;
  packsOpened: number;
  trainingsDone: number;
  upgradesBought: number;
  bestTier: number;
}

export interface MissionEntry {
  id: string;
  goal: number;
  progress: number;
  claimed: boolean;
}

export interface MissionsState {
  dayKey: string;
  entries: MissionEntry[];
}

export interface LegacyState {
  points: number;
  resets: number;
  // Won the Serie 1 title this run — unlocks the legacy reset.
  eliteChampion: boolean;
}

export interface DailyRewardState {
  lastClaimDayKey: string|null;
  lastClaimAt: number;
  streak: number;
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
  freeNameChangeUsed: boolean;
  freeColorChangeUsed: boolean;
  adsRemoved: boolean;
  speed3Unlocked: boolean;
  league: LeagueState;
  market: Player[];
  passiveRate: number;
  lastSavedAt: number;
  pendingOfflineReward?: OfflineReward | null;
  // Absent on old saves — reducer falls back to a fresh daily state.
  daily?: DailyRewardState;
  stats?: GameStats;
  missions?: MissionsState;
  achievementsClaimed?: string[];
  legacy?: LegacyState;
  seasonPass?: SeasonPassState;
}

export interface LiveScore {
  home: number;
  away: number;
  min: number;
}
