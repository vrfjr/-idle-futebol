import { GameStats } from "../types";

// ---- Daily missions -----------------------------------------------------
// 3 are drawn per local day (deterministic on the day key, see
// utils/missions.ts). `stat` names the GameStats counter the mission watches.
export interface MissionDef {
  id: string;
  stat: keyof GameStats;
  goal: number;
  label: string;
  rewardCoins: number;   // scaled by prestige at claim time
  rewardDiamonds: number;
}

export const MISSION_POOL: MissionDef[] = [
  {id:"win3",    stat:"wins",          goal:3, label:"Venca 3 partidas",        rewardCoins:2500, rewardDiamonds:0},
  {id:"win6",    stat:"wins",          goal:6, label:"Venca 6 partidas",        rewardCoins:5000, rewardDiamonds:2},
  {id:"buy1",    stat:"playersBought", goal:1, label:"Contrate 1 jogador",      rewardCoins:2000, rewardDiamonds:0},
  {id:"train2",  stat:"trainingsDone", goal:2, label:"Treine jogadores 2 vezes",rewardCoins:0,    rewardDiamonds:4},
  {id:"upg2",    stat:"upgradesBought",goal:2, label:"Compre 2 melhorias",      rewardCoins:3000, rewardDiamonds:0},
  {id:"pack1",   stat:"packsOpened",   goal:1, label:"Abra 1 pacote",           rewardCoins:0,    rewardDiamonds:3},
  {id:"season1", stat:"seasonsPlayed", goal:1, label:"Conclua 1 temporada",     rewardCoins:6000, rewardDiamonds:2},
];

export const MISSIONS_PER_DAY = 3;

// ---- Achievements ---------------------------------------------------------
// Permanent, one-time, paid in diamonds (the premium currency: real value).
export interface AchievementDef {
  id: string;
  label: string;
  desc: string;
  rewardDiamonds: number;
  // Threshold against a GameStats counter...
  stat?: keyof GameStats;
  goal?: number;
  // ...or a special evaluator handled in utils/missions.ts.
  special?: "legendaries3" | "legendaries11" | "power150" | "power250" | "tier10" | "tier1";
}

export const ACHIEVEMENTS: AchievementDef[] = [
  {id:"w10",    label:"Embalado",          desc:"Venca 10 partidas",              rewardDiamonds:5,  stat:"wins", goal:10},
  {id:"w100",   label:"Vencedor nato",     desc:"Venca 100 partidas",             rewardDiamonds:15, stat:"wins", goal:100},
  {id:"w500",   label:"Maquina de vencer", desc:"Venca 500 partidas",             rewardDiamonds:40, stat:"wins", goal:500},
  {id:"t1",     label:"Campeao",           desc:"Conquiste 1 titulo de liga",     rewardDiamonds:10, stat:"titles", goal:1},
  {id:"t5",     label:"Dinastia",          desc:"Conquiste 5 titulos",            rewardDiamonds:25, stat:"titles", goal:5},
  {id:"t15",    label:"Lenda do futebol",  desc:"Conquiste 15 titulos",           rewardDiamonds:60, stat:"titles", goal:15},
  {id:"buy10",  label:"Olheiro",           desc:"Contrate 10 jogadores",          rewardDiamonds:8,  stat:"playersBought", goal:10},
  {id:"tr25",   label:"Centro de treino",  desc:"Treine 25 vezes",                rewardDiamonds:12, stat:"trainingsDone", goal:25},
  {id:"leg3",   label:"Trio de ouro",      desc:"Tenha 3 lendarios no elenco",    rewardDiamonds:12, special:"legendaries3"},
  {id:"leg11",  label:"Time galactico",    desc:"Tenha 11 lendarios no elenco",   rewardDiamonds:50, special:"legendaries11"},
  {id:"pow150", label:"Forca regional",    desc:"Alcance 150 de poder",           rewardDiamonds:10, special:"power150"},
  {id:"pow250", label:"Potencia mundial",  desc:"Alcance 250 de poder",           rewardDiamonds:30, special:"power250"},
  {id:"tier10", label:"Subindo na vida",   desc:"Alcance a Liga 10",              rewardDiamonds:15, special:"tier10"},
  {id:"tier1",  label:"Elite",             desc:"Alcance a Liga 1",               rewardDiamonds:50, special:"tier1"},
];
