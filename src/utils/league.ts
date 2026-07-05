import { LeagueState, LeagueTeam, StandingRow, Fixture, MatchResult } from "../types";
import { simulateMatch } from "./gameLogic";

const CPU_NAMES = [
  "Atlético Norte", "Vasco da Serra", "Independente FC", "União Litoral",
  "Real Cerrado", "Ferroviário Sul", "Estrela Azul", "Palmeira Real",
  "Comercial Vale", "Nacional Praia", "Grêmio Central", "Atlântico FC",
  "Bandeirante EC", "Sporting Rio Doce", "Cruzeiro do Vale", "Rio Claro FC",
  "Serrano Atlético", "Colorado Norte", "Aliança Esportiva", "Pinheiros FC",
  "Cascavel EC", "Guarani do Sul", "Metropolitano FC", "Portuária AC",
];
const CPU_COLORS = [
  "#dc2626", "#059669", "#7c3aed", "#ea580c", "#0891b2", "#ca8a04",
  "#db2777", "#4338ca", "#16a34a", "#9333ea",
];
export const BEST_LEAGUE_TIER = 1;
export const STARTING_LEAGUE_TIER = 25;

function shuffle<T>(arr:T[]): T[] {
  const a = arr.slice();
  for(let i=a.length-1;i>0;i--){
    const j = Math.floor(Math.random()*(i+1));
    [a[i],a[j]] = [a[j],a[i]];
  }
  return a;
}

export function basePower(tier:number): number {
  const clamped = Math.max(BEST_LEAGUE_TIER, Math.min(STARTING_LEAGUE_TIER, Math.round(tier)));
  const prestige = STARTING_LEAGUE_TIER + 1 - clamped;
  return 34 + prestige*3.5;
}

export function makeCpuTeams(tier:number, count=17): LeagueTeam[] {
  const names = shuffle(CPU_NAMES).slice(0, count);
  return names.map((name,i) => ({
    id: `cpu${tier}_${i}_${Date.now().toString(36)}${i}`,
    name,
    color: CPU_COLORS[i % CPU_COLORS.length],
    power: Math.round(basePower(tier) * (0.9 + Math.random()*0.25)),
    isPlayer: false,
  }));
}

// Circle method: fix teamIds[0], rotate the rest across n-1 rounds for one full
// round-robin leg, then mirror home/away for the return leg. Only the anchor
// slot (index 0) needs a parity fix — it would otherwise always be "home" —
// the other pairings don't need fine balancing since the return leg already
// guarantees every team exactly n-1 home / n-1 away games across the season.
export function generateRoundRobin(teamIds:string[]): Fixture[][] {
  const n = teamIds.length;
  const arr = teamIds.slice();
  const leg1: Fixture[][] = [];
  for(let r=0;r<n-1;r++){
    const round: Fixture[] = [];
    for(let i=0;i<n/2;i++){
      const t1 = arr[i], t2 = arr[n-1-i];
      if(i===0) round.push(r%2===0 ? {home:t1,away:t2} : {home:t2,away:t1});
      else round.push({home:t1,away:t2});
    }
    leg1.push(round);
    arr.splice(1,0,arr.pop()!);
  }
  const leg2 = leg1.map(round=>round.map(f=>({home:f.away,away:f.home})));
  return [...leg1, ...leg2];
}

function emptyRow(teamId:string): StandingRow {
  return {teamId, played:0, won:0, drawn:0, lost:0, goalsFor:0, goalsAgainst:0, points:0};
}

export function startNewSeason(tier:number, playerTeam:{id:string;name:string;color:string}): LeagueState {
  const safeTier = Math.max(BEST_LEAGUE_TIER, Math.min(STARTING_LEAGUE_TIER, Math.round(tier)));
  const cpuTeams = makeCpuTeams(safeTier, 17);
  const teams: LeagueTeam[] = [
    {id:playerTeam.id, name:playerTeam.name, color:playerTeam.color, power:0, isPlayer:true},
    ...cpuTeams,
  ];
  return {
    tier: safeTier,
    round: 0,
    teams,
    table: teams.map(t=>emptyRow(t.id)),
    fixtures: generateRoundRobin(teams.map(t=>t.id)),
  };
}

function simScoreline(result:MatchResult): [number,number] {
  if(result==="draw"){ const g=Math.floor(Math.random()*3); return [g,g]; }
  const winner = 1+Math.floor(Math.random()*3);
  const loser = Math.max(0, winner-1-Math.floor(Math.random()*winner));
  return result==="win" ? [winner,loser] : [loser,winner];
}

function applyResult(table:StandingRow[], homeId:string, awayId:string, hg:number, ag:number): void {
  const home = table.find(r=>r.teamId===homeId)!;
  const away = table.find(r=>r.teamId===awayId)!;
  home.played++; away.played++;
  home.goalsFor+=hg; home.goalsAgainst+=ag;
  away.goalsFor+=ag; away.goalsAgainst+=hg;
  if(hg>ag){ home.won++; home.points+=3; away.lost++; }
  else if(hg<ag){ away.won++; away.points+=3; home.lost++; }
  else { home.drawn++; away.drawn++; home.points++; away.points++; }
}

// Tiebreak: points, then goal difference, then goals scored.
export function compareStandings(a:StandingRow, b:StandingRow): number {
  if(b.points!==a.points) return b.points-a.points;
  const gdA=a.goalsFor-a.goalsAgainst, gdB=b.goalsFor-b.goalsAgainst;
  if(gdB!==gdA) return gdB-gdA;
  return b.goalsFor-a.goalsFor;
}

export function sortedStandings(league:LeagueState): StandingRow[] {
  return [...league.table].sort(compareStandings);
}

export interface RoundResolution {
  league: LeagueState;
  playerResult: MatchResult;
  reward: number;
  diamondReward: number;
}

const RELEGATION_COUNT = 3;
// Guaranteed bonus for reaching the end of a season at all — promoted,
// relegated, or mid-table, doesn't matter. Separate from (and on top of) the
// normal per-round win/draw/loss reward, and unlike the per-win diamond
// chance, this diamond amount is small but always granted, not a roll.
const SEASON_BONUS_COINS = 900;
const SEASON_BONUS_DIAMONDS = 3;

export function resolveRound(league:LeagueState, playerId:string, playerPower:number): RoundResolution {
  const round = league.fixtures[league.round];
  if(!round){
    const playerTeam = league.teams.find(t=>t.id===playerId) ?? {id:playerId, name:"Meu Time", color:"#1d4ed8", power:0, isPlayer:true};
    return {
      league: startNewSeason(league.tier, playerTeam),
      playerResult: "draw",
      reward: 0,
      diamondReward: 0,
    };
  }
  const table = league.table.map(r=>({...r}));
  const powerOf = (teamId:string) => teamId===playerId ? playerPower : league.teams.find(t=>t.id===teamId)!.power;

  let playerResult: MatchResult = "draw";
  let reward = 0, diamondReward = 0;

  round.forEach(fx=>{
    const result = simulateMatch(powerOf(fx.home), powerOf(fx.away));
    const [hg,ag] = simScoreline(result);
    applyResult(table, fx.home, fx.away, hg, ag);
    if(fx.home===playerId || fx.away===playerId){
      const isHome = fx.home===playerId;
      const my = isHome?hg:ag, opp = isHome?ag:hg;
      playerResult = my>opp ? "win" : my<opp ? "loss" : "draw";
      const prestige = STARTING_LEAGUE_TIER + 1 - league.tier;
      reward = playerResult==="win" ? 700+prestige*130 : playerResult==="draw" ? 220+prestige*18 : 70+prestige*8;
      diamondReward = playerResult==="win" && Math.random()<0.18 ? 1 : 0;
    }
  });

  const nextRound = league.round+1;
  let newLeague: LeagueState = {...league, round:nextRound, table};

  if(nextRound>=league.fixtures.length){
    const standings = [...table].sort(compareStandings);
    const playerPos = standings.findIndex(r=>r.teamId===playerId);
    let nextTier = league.tier;
    if(playerPos===0) nextTier = Math.max(BEST_LEAGUE_TIER, league.tier-1);
    else if(playerPos>=standings.length-RELEGATION_COUNT) nextTier = Math.min(STARTING_LEAGUE_TIER, league.tier+1);
    const playerTeam = league.teams.find(t=>t.id===playerId)!;
    newLeague = startNewSeason(nextTier, playerTeam);
    reward += SEASON_BONUS_COINS;
    diamondReward += SEASON_BONUS_DIAMONDS;
  }

  return {league:newLeague, playerResult, reward, diamondReward};
}
