import { fieldLayout } from "../constants/formations";
import { FormationKey, Player, PositionKey } from "../types";
import { assignPlayersToSlots, slotEfficiency } from "../utils/lineup";

export type AgentAction = "run" | "kick" | "tackle";

export interface TeamTactics {
  /** 0 = narrow, 1 = very wide */
  width: number;
  /** 0 = low block, 1 = high line */
  depth: number;
  /** 0 = patient, 1 = very fast decisions */
  tempo: number;
  /** 0 = passive, 1 = aggressive press */
  pressing: number;
  /** 0 = safe, 1 = ambitious passes / runs */
  risk: number;
  /** 0 = short combinations, 1 = vertical/direct */
  directness: number;
}

export interface SimAgent {
  x: number;
  y: number;
  bx: number;
  by: number;
  vx: number;
  vy: number;
  num: number;
  isHome: boolean;
  hasBall: boolean;
  action: AgentAction;
  actionTimer: number;
  decisionTimer: number;
  tackleCooldown: number;
  controlCooldown: number;
  stamina: number;
  pos: PositionKey;
  pac: number;
  sho: number;
  pas: number;
  def: number;
  phy: number;
  dri: number;
  ovr: number;
}

export interface PendingShot {
  isGoal: boolean;
  wasAttacking: boolean;
  xg?: number;
  wasSaved?: boolean;
  /** Charged down by an outfield defender before it could reach goal — the
   *  blocking defender is the last touch, so this resolves as a corner
   *  rather than a goal kick, even though the shooting team was attacking. */
  wasBlocked?: boolean;
}

export interface PendingPass {
  passer: SimAgent;
  target: SimAgent;
  framesLeft: number;
}

// Restarts are one nullable state instead of a pile of isThrowIn/isCorner/
// isGoalKick/isKickoff booleans — `restart===null` means normal open play.
export type RestartKind = "THROW_IN" | "CORNER" | "GOAL_KICK" | "KICKOFF";

export interface RestartState {
  kind: RestartKind;
  /** isHome of the team taking the restart. */
  team: boolean;
  x: number;
  y: number;
  taker: SimAgent | null;
  /** Frames left in the paused setup before the restart is actually taken. */
  timer: number;
}

export type MatchEventType =
  | "THROW_IN" | "CORNER" | "GOAL_KICK" | "KICKOFF" | "GOAL" | "TACKLE";

export interface MatchEvent {
  type: MatchEventType;
  frame: number;
  team: boolean;
  x?: number;
  y?: number;
}

export interface Sim {
  home: SimAgent[];
  away: SimAgent[];
  ball: { x: number; y: number; vx: number; vy: number };
  /** true = home has/last had possession; false = away */
  attacking: boolean;
  carrierIdx: number;
  homeGoals: number;
  awayGoals: number;
  flash: number;
  frame: number;
  passCooldownAgent: SimAgent | null;
  passCooldownTimer: number;
  pendingShot: PendingShot | null;
  shotTimer: number;
  pendingPass: PendingPass | null;
  lastTouchHome: boolean | null;
  lastTouchAgent: SimAgent | null;
  restart: RestartState | null;
  lastEvent: MatchEvent | null;
  homeTactics: TeamTactics;
  awayTactics: TeamTactics;
  rngState: number;
}

export interface CreateSimOptions {
  awayFormation?: FormationKey;
  homeTactics?: Partial<TeamTactics>;
  awayTactics?: Partial<TeamTactics>;
  seed?: number;
}

const DEFAULT_TACTICS: TeamTactics = {
  width: 0.58,
  depth: 0.52,
  tempo: 0.55,
  pressing: 0.50,
  risk: 0.48,
  directness: 0.50,
};

// Systemic per-position tendencies — attackTarget()/defensiveTarget() read
// from this table instead of branching on `p.pos===...` per role, so adding
// or retuning a position never means hunting through scattered if/else.
interface PositionProfile {
  /** Base extra forward push (W fraction) applied on top of the formation
   *  anchor while the team has the ball. */
  pushBase: number;
  /** Extra push range added on top of pushBase, scaled by a tactics field. */
  pushRange: number;
  /** Which tactics dial scales pushRange — defenders scale with how high the
   *  team's line plays, everyone further forward scales with directness. */
  pushTactic: "depth" | "directness";
  /** Can this role make a late forward run into space (attacker runs,
   *  fullback overlaps)? 0 = never bothers, higher = more eager/frequent. */
  runFactor: number;
  /** How much this role hugs the touchline vs drifts central without the
   *  ball — higher = stays wider. */
  defendWidth: number;
}

const POSITION_PROFILES: Record<Exclude<PositionKey,"GOL">, PositionProfile> = {
  ZAG: { pushBase:0.015, pushRange:0.035, pushTactic:"depth",       runFactor:0,    defendWidth:0.30 },
  LD:  { pushBase:0.030, pushRange:0.050, pushTactic:"directness",  runFactor:0.55, defendWidth:0.62 },
  LE:  { pushBase:0.030, pushRange:0.050, pushTactic:"directness",  runFactor:0.55, defendWidth:0.62 },
  VOL: { pushBase:0.018, pushRange:0.028, pushTactic:"depth",       runFactor:0,    defendWidth:0.34 },
  MC:  { pushBase:0.040, pushRange:0.050, pushTactic:"directness",  runFactor:0.25, defendWidth:0.42 },
  MEI: { pushBase:0.045, pushRange:0.060, pushTactic:"directness",  runFactor:0.60, defendWidth:0.46 },
  PD:  { pushBase:0.060, pushRange:0.070, pushTactic:"directness",  runFactor:0.85, defendWidth:0.68 },
  PE:  { pushBase:0.060, pushRange:0.070, pushTactic:"directness",  runFactor:0.85, defendWidth:0.68 },
  SA:  { pushBase:0.065, pushRange:0.055, pushTactic:"directness",  runFactor:0.70, defendWidth:0.44 },
  CA:  { pushBase:0.075, pushRange:0.065, pushTactic:"directness",  runFactor:0.75, defendWidth:0.38 },
};

// LD/PD and LE/PE pair up on the same flank — used so the fullback only
// overlaps when its winger isn't already sitting on that same touchline
// (and vice versa for the winger cutting inside), instead of both
// permanently hugging the line and colliding.
const WIDE_PARTNER: Partial<Record<PositionKey,PositionKey>> = {
  LD:"PD", PD:"LD", LE:"PE", PE:"LE",
};

const POS_DEFAULTS: Record<
  PositionKey,
  Pick<SimAgent, "pac" | "sho" | "pas" | "def" | "phy" | "dri" | "ovr">
> = {
  GOL: { pac: 34, sho: 8,  pas: 30, def: 56, phy: 52, dri: 20, ovr: 44 },
  ZAG: { pac: 42, sho: 14, pas: 34, def: 52, phy: 52, dri: 28, ovr: 42 },
  LD:  { pac: 48, sho: 16, pas: 40, def: 42, phy: 40, dri: 36, ovr: 41 },
  LE:  { pac: 48, sho: 16, pas: 40, def: 42, phy: 40, dri: 36, ovr: 41 },
  VOL: { pac: 42, sho: 18, pas: 44, def: 46, phy: 46, dri: 32, ovr: 42 },
  MC:  { pac: 44, sho: 24, pas: 48, def: 34, phy: 38, dri: 38, ovr: 42 },
  MEI: { pac: 46, sho: 36, pas: 48, def: 22, phy: 32, dri: 44, ovr: 43 },
  PD:  { pac: 54, sho: 38, pas: 36, def: 16, phy: 32, dri: 46, ovr: 43 },
  PE:  { pac: 54, sho: 38, pas: 36, def: 16, phy: 32, dri: 46, ovr: 43 },
  SA:  { pac: 50, sho: 44, pas: 38, def: 16, phy: 36, dri: 42, ovr: 43 },
  CA:  { pac: 52, sho: 52, pas: 30, def: 14, phy: 44, dri: 40, ovr: 44 },
};

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function sigmoid(v: number): number {
  return 1 / (1 + Math.exp(-v));
}

function normalizeTactics(value?: Partial<TeamTactics>): TeamTactics {
  const merged = { ...DEFAULT_TACTICS, ...value };
  return {
    width: clamp(merged.width, 0, 1),
    depth: clamp(merged.depth, 0, 1),
    tempo: clamp(merged.tempo, 0, 1),
    pressing: clamp(merged.pressing, 0, 1),
    risk: clamp(merged.risk, 0, 1),
    directness: clamp(merged.directness, 0, 1),
  };
}

function nextRngState(state: number): number {
  return (Math.imul(state, 1664525) + 1013904223) >>> 0;
}

function rand(sim: Sim): number {
  sim.rngState = nextRngState(sim.rngState);
  return sim.rngState / 4294967296;
}

function centeredRand(sim: Sim): number {
  // Triangular-ish distribution: most errors stay near the intended target.
  return rand(sim) + rand(sim) - 1;
}

// A player fielded outside their real position visibly underperforms — uses
// the same POSITION_EFFICIENCY table the Team screen shows per player (via
// positionStatus), so what a player sees as "Fora de posicao" is exactly what
// costs them here, not a second, disagreeing approximation.
function fromPlayer(
  player: Player | undefined,
  pos: PositionKey,
  powerScale = 1,
): Pick<SimAgent, "pac" | "sho" | "pas" | "def" | "phy" | "dri" | "ovr"> {
  const base = player ?? POS_DEFAULTS[pos];
  const positionalScale = player ? slotEfficiency(player, pos) : 1;
  const scale = powerScale * positionalScale;

  return {
    pac: clamp(base.pac * scale, 12, 99),
    sho: clamp(base.sho * scale, 8, 99),
    pas: clamp(base.pas * scale, 10, 99),
    def: clamp(base.def * scale, 8, 99),
    phy: clamp(base.phy * scale, 10, 99),
    dri: clamp(base.dri * scale, 8, 99),
    ovr: clamp(base.ovr * scale, 10, 99),
  };
}

function attackDir(isHome: boolean): 1 | -1 {
  return isHome ? 1 : -1;
}

function goalXFor(isHome: boolean, W: number): number {
  return isHome ? W * 0.965 : W * 0.035;
}

function ownGoalXFor(isHome: boolean, W: number): number {
  return isHome ? W * 0.035 : W * 0.965;
}

function teamOf(sim: Sim, isHome: boolean): SimAgent[] {
  return isHome ? sim.home : sim.away;
}

function opponentsOf(sim: Sim, isHome: boolean): SimAgent[] {
  return isHome ? sim.away : sim.home;
}

function tacticsOf(sim: Sim, isHome: boolean): TeamTactics {
  return isHome ? sim.homeTactics : sim.awayTactics;
}

function currentCarrier(sim: Sim): SimAgent | null {
  const team = sim.attacking ? sim.home : sim.away;
  if (sim.carrierIdx < 0 || sim.carrierIdx >= team.length) return null;
  return team[sim.carrierIdx] ?? null;
}

function setCarrier(
  sim: Sim,
  player: SimAgent,
  home: SimAgent[] = sim.home,
  away: SimAgent[] = sim.away,
): void {
  sim.attacking = player.isHome;
  sim.carrierIdx = (player.isHome ? home : away).indexOf(player);

  home.forEach((q) => { q.hasBall = false; });
  away.forEach((q) => { q.hasBall = false; });

  player.hasBall = true;
  player.decisionTimer = Math.max(player.decisionTimer, 5);
  sim.lastTouchHome = player.isHome;
  sim.lastTouchAgent = player;
  sim.pendingPass = null;
  sim.ball.vx = 0;
  sim.ball.vy = 0;
  sim.ball.x = player.x;
  sim.ball.y = player.y;
}

function nearestPlayer(
  players: SimAgent[],
  x: number,
  y: number,
  skip: (p: SimAgent) => boolean = () => false,
): { p: SimAgent; dist: number } | null {
  let best: { p: SimAgent; dist: number } | null = null;

  players.forEach((p) => {
    if (skip(p)) return;
    const dist = Math.hypot(p.x - x, p.y - y);
    if (!best || dist < best.dist) best = { p, dist };
  });

  return best;
}

function nearestDistance(players: SimAgent[], x: number, y: number): number {
  return nearestPlayer(players, x, y)?.dist ?? Infinity;
}

function pressureAt(
  opponents: SimAgent[],
  x: number,
  y: number,
  W: number,
): number {
  const radius = W * 0.105;
  let pressure = 0;

  opponents.forEach((p) => {
    if (p.pos === "GOL") return;
    const d = Math.hypot(p.x - x, p.y - y);
    if (d < radius) pressure += 1 - d / radius;
  });

  return clamp(pressure / 1.75, 0, 1);
}

function pointSegmentDistance(
  px: number,
  py: number,
  ax: number,
  ay: number,
  bx: number,
  by: number,
): number {
  const abx = bx - ax;
  const aby = by - ay;
  const len2 = abx * abx + aby * aby;
  if (len2 <= 0.0001) return Math.hypot(px - ax, py - ay);

  const t = clamp(((px - ax) * abx + (py - ay) * aby) / len2, 0, 1);
  const qx = ax + abx * t;
  const qy = ay + aby * t;
  return Math.hypot(px - qx, py - qy);
}

function passLaneRisk(
  from: SimAgent,
  to: SimAgent,
  opponents: SimAgent[],
): number {
  const passDistance = Math.hypot(to.x - from.x, to.y - from.y);
  const corridor = 8 + passDistance * 0.035;
  let risk = 0;

  opponents.forEach((p) => {
    if (p.pos === "GOL") return;
    const d = pointSegmentDistance(p.x, p.y, from.x, from.y, to.x, to.y);
    if (d >= corridor) return;

    const distanceToPasser = Math.hypot(p.x - from.x, p.y - from.y);
    const distanceWeight = clamp(distanceToPasser / Math.max(1, passDistance), 0.25, 1);
    risk = Math.max(risk, (1 - d / corridor) * distanceWeight);
  });

  return clamp(risk, 0, 1);
}

// Whether a y-coordinate falls between the goalposts — used to tell a real
// goal-line crossing apart from the ball merely going out for a corner/goal
// kick. Goals are only ever decided by the deliberate executeShot()/
// resolvePendingShot() pipeline, never by ball physics crossing x<0/x>W on
// its own, so this exists for correctness/clarity at that boundary check
// rather than to award a goal itself.
function isInsideGoalMouth(y: number, H: number): boolean {
  const halfGoal = H * 0.085;
  return y > H / 2 - halfGoal && y < H / 2 + halfGoal;
}

function angleBetweenGoalPosts(
  shooter: SimAgent,
  W: number,
  H: number,
): number {
  const gx = goalXFor(shooter.isHome, W);
  const halfGoal = H * 0.085;
  const y1 = H / 2 - halfGoal;
  const y2 = H / 2 + halfGoal;
  const a1 = Math.atan2(y1 - shooter.y, gx - shooter.x);
  const a2 = Math.atan2(y2 - shooter.y, gx - shooter.x);
  let diff = Math.abs(a1 - a2);
  if (diff > Math.PI) diff = Math.PI * 2 - diff;
  return clamp(diff / (Math.PI / 2), 0, 1);
}

export function calculateShotChance(
  shooter: SimAgent,
  keeper: SimAgent,
  opponents: SimAgent[],
  W: number,
  H: number,
): number {
  const gx = goalXFor(shooter.isHome, W);
  const distance = Math.hypot(gx - shooter.x, H / 2 - shooter.y);
  const distanceFactor = clamp(1 - distance / (W * 0.42), 0, 1);
  const angleFactor = angleBetweenGoalPosts(shooter, W, H);
  const pressure = pressureAt(opponents, shooter.x, shooter.y, W);

  const shooterQuality = (
    shooter.sho * 0.58 +
    shooter.dri * 0.17 +
    shooter.phy * 0.08 +
    shooter.ovr * 0.17
  ) / 100;

  const keeperQuality = (
    keeper.def * 0.64 +
    keeper.phy * 0.16 +
    keeper.pac * 0.05 +
    keeper.ovr * 0.15
  ) / 100;

  const logit =
    -3.2 +
    shooterQuality * 1.3 +
    distanceFactor * 2.5 +
    angleFactor * 1.15 -
    pressure * 1.6 +
    (shooterQuality - keeperQuality) * 1.4;

  return clamp(sigmoid(logit), 0.015, 0.72);
}

function moveAgentToward(
  p: SimAgent,
  tx: number,
  ty: number,
  maxSpeed: number,
  acceleration = 0.24,
): void {
  const dx = tx - p.x;
  const dy = ty - p.y;
  const d = Math.hypot(dx, dy);

  if (d < 0.01) {
    p.vx *= 0.75;
    p.vy *= 0.75;
    return;
  }

  const staminaFactor = 0.78 + p.stamina * 0.22;
  const speed = maxSpeed * staminaFactor;
  const desiredVx = (dx / d) * speed;
  const desiredVy = (dy / d) * speed;

  p.vx += (desiredVx - p.vx) * acceleration;
  p.vy += (desiredVy - p.vy) * acceleration;
  p.x += p.vx;
  p.y += p.vy;

  const effort = Math.hypot(p.vx, p.vy) / Math.max(0.01, speed);
  p.stamina = clamp(p.stamina - effort * 0.000018 + (1 - effort) * 0.000006, 0.55, 1);
}

function findTeammate(team: SimAgent[], pos: PositionKey, exclude: SimAgent): SimAgent | undefined {
  return team.find((t) => t !== exclude && t.pos === pos);
}

// How far a player has pushed beyond their own formation anchor, in their
// attacking direction — positive means further forward than their base spot.
function forwardAdvancement(p: SimAgent): number {
  return attackDir(p.isHome) * (p.x - p.bx);
}

function attackTarget(
  p: SimAgent,
  // Only x/y are read — during a restart there's no real ball carrier yet,
  // so callers can pass the restart spot itself as this reference point.
  carrier: { x: number; y: number },
  opponents: SimAgent[],
  team: SimAgent[],
  tactics: TeamTactics,
  W: number,
  H: number,
): { x: number; y: number } {
  const dir = attackDir(p.isHome);

  if (p.pos === "GOL") {
    return {
      x: clamp(lerp(p.bx, ownGoalXFor(p.isHome, W), 0.18), 6, W - 6),
      y: clamp(lerp(p.by, H / 2, 0.55), 6, H - 6),
    };
  }

  const profile = POSITION_PROFILES[p.pos];
  const widthScale = 0.68 + tactics.width * 0.62;
  const ballShiftX = (carrier.x - W / 2) * 0.10;
  const ballShiftY = (carrier.y - H / 2) * 0.14;

  let x = p.bx + ballShiftX;
  let y = H / 2 + (p.by - H / 2) * widthScale + ballShiftY;

  const pushTacticValue = profile.pushTactic === "depth" ? tactics.depth : tactics.directness;
  x += dir * W * (profile.pushBase + pushTacticValue * profile.pushRange);

  const aheadOfCarrier = dir * (p.x - carrier.x) > 0;
  const openDistance = nearestDistance(opponents, p.x, p.y);
  const openness = clamp(openDistance / (W * 0.12), 0, 1);

  // Late run into space beyond the push above — strength scales per role via
  // runFactor (0 for holding roles like VOL/ZAG, highest for wingers/CA).
  if (profile.runFactor > 0 && aheadOfCarrier && openness > 0.42) {
    x += dir * W * (0.025 + tactics.risk * 0.055) * openness * profile.runFactor;
  }

  const widePartnerPos = WIDE_PARTNER[p.pos];

  // Fullback overlap: only bombs on past its own winger when that flank is
  // actually open — i.e. the winger isn't already hugging that same line.
  if ((p.pos === "LD" || p.pos === "LE") && widePartnerPos) {
    const winger = findTeammate(team, widePartnerPos, p);
    const wingerHuggingLine = winger ? Math.abs(winger.y - p.by) < H * 0.14 : false;
    if (!wingerHuggingLine) {
      x += dir * W * 0.03 * (0.4 + tactics.risk * 0.6);
    }
  }

  // Winger cuts inside once its own fullback has taken over the flank.
  if ((p.pos === "PD" || p.pos === "PE") && widePartnerPos) {
    const fullback = findTeammate(team, widePartnerPos, p);
    if (fullback && forwardAdvancement(fullback) > W * 0.05) {
      y = lerp(y, H / 2, 0.28 * (0.5 + tactics.directness));
    }
  }

  // Advanced central mids float toward the ball's channel instead of holding
  // a fixed lane (old behavior was MEI-only; now shared with MC).
  if ((p.pos === "MEI" || p.pos === "MC") && Math.abs(p.y - carrier.y) < H * 0.16) {
    y += (p.by < H / 2 ? -1 : 1) * H * 0.03 * (0.5 + tactics.width);
  }

  return {
    x: clamp(x, 8, W - 8),
    y: clamp(y, 8, H - 8),
  };
}

function defensiveTarget(
  p: SimAgent,
  ballX: number,
  ballY: number,
  opponents: SimAgent[],
  team: SimAgent[],
  tactics: TeamTactics,
  isPresser: boolean,
  W: number,
  H: number,
): { x: number; y: number } {
  const dir = attackDir(p.isHome);

  if (p.pos === "GOL") {
    const ownGoalX = ownGoalXFor(p.isHome, W);
    const ballInfluence = clamp((ballX - ownGoalX) / W, -1, 1);
    return {
      x: clamp(p.bx + dir * ballInfluence * W * 0.018, 6, W - 6),
      y: clamp(lerp(H / 2, ballY, 0.16), H * 0.32, H * 0.68),
    };
  }

  if (isPresser) {
    const offset = p.pos === "ZAG" ? 3 : 1;
    return {
      x: clamp(ballX - dir * offset, 7, W - 7),
      y: clamp(ballY, 7, H - 7),
    };
  }

  const profile = POSITION_PROFILES[p.pos];
  const compactWidth = profile.defendWidth + tactics.width * 0.28;
  let x = p.bx + dir * (tactics.depth - 0.5) * W * 0.13;
  let y = H / 2 + (p.by - H / 2) * compactWidth;

  x += (ballX - W / 2) * 0.085;
  y += (ballY - H / 2) * 0.20;

  // VOL shades toward whichever flank its own fullback vacated by pushing
  // forward, instead of holding a fixed central spot regardless of the
  // structure around it — this is the one role explicitly meant to protect
  // the space a bombing-on fullback leaves behind.
  if (p.pos === "VOL") {
    const ld = findTeammate(team, "LD", p);
    const le = findTeammate(team, "LE", p);
    const ldGone = ld ? forwardAdvancement(ld) > W * 0.08 : false;
    const leGone = le ? forwardAdvancement(le) > W * 0.08 : false;
    if (ldGone && !leGone) y = lerp(y, H * 0.72, 0.35);
    else if (leGone && !ldGone) y = lerp(y, H * 0.28, 0.35);
  }

  let mark: SimAgent | null = null;
  let markDist = Infinity;
  for (const opp of opponents) {
    if (opp.pos === "GOL") continue;
    const d = Math.hypot(opp.x - x, opp.y - y);
    if (d < markDist) {
      mark = opp;
      markDist = d;
    }
  }

  if (mark && markDist < W * 0.19) {
    const markBlend = 0.12 + tactics.pressing * 0.16;
    x = lerp(x, mark.x - dir * 7, markBlend);
    y = lerp(y, mark.y, markBlend);
  }

  return {
    x: clamp(x, 7, W - 7),
    y: clamp(y, 7, H - 7),
  };
}

function updateTeamShape(sim: Sim, isHome: boolean, W: number, H: number): void {
  const team = teamOf(sim, isHome);
  const opponents = opponentsOf(sim, isHome);
  const tactics = tacticsOf(sim, isHome);
  const carrier = currentCarrier(sim);
  const hasBall = carrier?.isHome === isHome;
  const ballX = carrier?.x ?? sim.ball.x;
  const ballY = carrier?.y ?? sim.ball.y;

  const pressable = team
    .filter((p) => p.pos !== "GOL" && p !== carrier)
    .sort((a, b) =>
      Math.hypot(a.x - ballX, a.y - ballY) - Math.hypot(b.x - ballX, b.y - ballY)
    );

  const pressCount = tactics.pressing > 0.76 ? 3 : tactics.pressing > 0.38 ? 2 : 1;
  const pressers = new Set(pressable.slice(0, pressCount));

  team.forEach((p) => {
    if (p === carrier) return;

    const target = hasBall && carrier
      ? attackTarget(p, carrier, opponents, team, tactics, W, H)
      : defensiveTarget(
          p,
          ballX,
          ballY,
          opponents,
          team,
          tactics,
          pressers.has(p),
          W,
          H,
        );

    const roleSpeed = p.pos === "GOL" ? 0.45 : 0.58 + p.pac / 185;
    const pressBoost = !hasBall && pressers.has(p) ? 0.16 + tactics.pressing * 0.20 : 0;
    moveAgentToward(p, target.x, target.y, roleSpeed + pressBoost, 0.20);
  });
}

interface PassChoice {
  target: SimAgent;
  rawScore: number;
  utility: number;
  laneRisk: number;
}

function bestPassChoice(
  sim: Sim,
  carrier: SimAgent,
  W: number,
  _H: number,
): PassChoice | null {
  const teammates = teamOf(sim, carrier.isHome);
  const opponents = opponentsOf(sim, carrier.isHome);
  const tactics = tacticsOf(sim, carrier.isHome);
  const dir = attackDir(carrier.isHome);
  const pressure = pressureAt(opponents, carrier.x, carrier.y, W);

  let best: PassChoice | null = null;

  teammates.forEach((target) => {
    if (target === carrier) return;
    if (target.pos === "GOL" && pressure < 0.58) return;

    const dx = target.x - carrier.x;
    const dy = target.y - carrier.y;
    const distance = Math.hypot(dx, dy);
    if (distance < 14 || distance > W * 0.62) return;

    const progressGain = dir * dx / W;
    const openness = clamp(
      nearestDistance(opponents, target.x, target.y) / (W * 0.13),
      0,
      1,
    );
    const laneRisk = passLaneRisk(carrier, target, opponents);
    const idealDistance = W * lerp(0.14, 0.28, tactics.directness);
    const distanceFit = 1 - clamp(Math.abs(distance - idealDistance) / (W * 0.26), 0, 1);
    // Reuses runFactor (how eager a role is to make a forward run) as the
    // pass-target bonus too — a role worth running into space is the same
    // role worth picking out with a pass, so this stays a single source of
    // truth instead of a second, separately-tuned bucket list.
    const roleBonus = target.pos === "GOL" ? 0 : POSITION_PROFILES[target.pos].runFactor * 0.12;
    const backwardPenalty = progressGain < -0.03 ? Math.abs(progressGain) * 1.5 : 0;
    const directnessWeight = lerp(1.25, 2.5, tactics.directness);

    const rawScore =
      progressGain * directnessWeight +
      openness * 0.78 +
      distanceFit * 0.28 +
      roleBonus +
      pressure * (progressGain < 0 ? 0.18 : 0.05) -
      laneRisk * lerp(1.35, 0.78, tactics.risk) -
      backwardPenalty;

    const utility = sigmoid((rawScore - 0.20) * 2.1);
    const choice = { target, rawScore, utility, laneRisk };

    if (!best || choice.rawScore > best.rawScore) best = choice;
  });

  return best;
}

function carrierLaneOpenness(
  carrier: SimAgent,
  opponents: SimAgent[],
  W: number,
): number {
  const dir = attackDir(carrier.isHome);
  const tx = carrier.x + dir * W * 0.10;
  const ty = carrier.y;
  let risk = 0;

  opponents.forEach((p) => {
    if (p.pos === "GOL") return;
    const d = pointSegmentDistance(p.x, p.y, carrier.x, carrier.y, tx, ty);
    risk = Math.max(risk, 1 - clamp(d / 28, 0, 1));
  });

  return 1 - clamp(risk, 0, 1);
}

function executePass(
  sim: Sim,
  carrier: SimAgent,
  choice: PassChoice,
  W: number,
): void {
  const target = choice.target;
  const opponents = opponentsOf(sim, carrier.isHome);
  const pressure = pressureAt(opponents, carrier.x, carrier.y, W);
  const dx = target.x - carrier.x;
  const dy = target.y - carrier.y;
  const distance = Math.hypot(dx, dy);
  const distanceNorm = distance / Math.max(1, W * 0.6);

  const accuracy = clamp(
    0.38 +
      carrier.pas * 0.0048 +
      carrier.ovr * 0.0010 +
      carrier.dri * 0.0006 -
      distanceNorm * 0.30 -
      pressure * 0.23 -
      choice.laneRisk * 0.08,
    0.26,
    0.96,
  );

  const leadFrames = 3 + carrier.pas / 30;
  const leadX = target.vx * leadFrames;
  const leadY = target.vy * leadFrames;
  const errorMagnitude = (1 - accuracy) * (10 + distance * 0.18);
  const intendedX = target.x + leadX + centeredRand(sim) * errorMagnitude;
  const intendedY = target.y + leadY + centeredRand(sim) * errorMagnitude;

  const pdx = intendedX - sim.ball.x;
  const pdy = intendedY - sim.ball.y;
  const pd = Math.max(1, Math.hypot(pdx, pdy));
  const passSpeed = clamp(4.1 + carrier.pas * 0.034 + distanceNorm * 1.5, 4.4, 8.2);

  sim.ball.vx = (pdx / pd) * passSpeed;
  sim.ball.vy = (pdy / pd) * passSpeed;
  sim.lastTouchHome = carrier.isHome;
  sim.lastTouchAgent = carrier;
  sim.pendingPass = {
    passer: carrier,
    target,
    framesLeft: Math.round(clamp(distance / passSpeed * 2.0, 12, 80)),
  };

  carrier.hasBall = false;
  carrier.action = "kick";
  carrier.actionTimer = 12;
  carrier.decisionTimer = 10;
  sim.carrierIdx = -1;
  sim.passCooldownAgent = carrier;
  sim.passCooldownTimer = 7;
}

// An outfield defender standing in the shot's lane can charge it down before
// it ever reaches the keeper — without this, every non-goal shot resolves as
// either a save or a clean miss, and a block (the defender's touch, not the
// shooter's) never happens, so a corner from a blocked shot can never occur.
function findShotBlocker(shooter: SimAgent, opponents: SimAgent[], W: number, H: number): SimAgent | null {
  const gx = goalXFor(shooter.isHome, W);
  let best: SimAgent | null = null;
  let bestRisk = 0;

  opponents.forEach((p) => {
    if (p.pos === "GOL") return;
    const d = pointSegmentDistance(p.x, p.y, shooter.x, shooter.y, gx, H / 2);
    const corridor = 24;
    if (d >= corridor) return;
    const risk = 1 - d / corridor;
    if (risk > bestRisk) { bestRisk = risk; best = p; }
  });

  return bestRisk > 0.12 ? best : null;
}

function executeShot(
  sim: Sim,
  shooter: SimAgent,
  W: number,
  H: number,
): void {
  const opponents = opponentsOf(sim, shooter.isHome);
  const keeper = opponents.find((p) => p.pos === "GOL") ?? opponents[0];
  if (!keeper) return;

  const xg = calculateShotChance(shooter, keeper, opponents, W, H);

  const blocker = findShotBlocker(shooter, opponents, W, H);
  const blockChance = blocker ? clamp(0.12 + blocker.def * 0.005, 0.08, 0.42) : 0;
  if (blocker && rand(sim) < blockChance) {
    sim.lastTouchHome = blocker.isHome;
    sim.lastTouchAgent = blocker;
    const deflectY = clamp(blocker.y + centeredRand(sim) * H * 0.10, H * 0.08, H * 0.92);
    const dx = goalXFor(shooter.isHome, W) - sim.ball.x;
    const dy = deflectY - sim.ball.y;
    const d = Math.max(1, Math.hypot(dx, dy));
    const speed = clamp(4 + blocker.phy * 0.02, 4, 7);

    sim.ball.vx = (dx / d) * speed;
    sim.ball.vy = (dy / d) * speed;
    sim.pendingShot = { isGoal: false, wasAttacking: shooter.isHome, xg, wasBlocked: true };
    sim.shotTimer = Math.round(clamp(d / speed * 0.9, 5, 16));
    sim.pendingPass = null;

    shooter.hasBall = false;
    shooter.action = "kick";
    shooter.actionTimer = 14;
    shooter.decisionTimer = 12;
    sim.carrierIdx = -1;
    return;
  }

  const isGoal = rand(sim) < xg;
  const keeperRating = (keeper.def * 0.66 + keeper.phy * 0.17 + keeper.ovr * 0.17) / 100;
  const wasSaved = !isGoal && rand(sim) < clamp(0.28 + keeperRating * 0.50, 0.30, 0.82);

  const gx = goalXFor(shooter.isHome, W);
  const halfGoal = H * 0.085;
  let gy: number;

  if (isGoal) {
    gy = H / 2 + centeredRand(sim) * halfGoal * 0.82;
  } else if (wasSaved) {
    gy = lerp(H / 2, keeper.y, 0.65) + centeredRand(sim) * halfGoal * 0.28;
  } else {
    const side = rand(sim) < 0.5 ? -1 : 1;
    gy = H / 2 + side * halfGoal * (1.05 + rand(sim) * 0.55);
  }

  const dx = gx - sim.ball.x;
  const dy = gy - sim.ball.y;
  const d = Math.max(1, Math.hypot(dx, dy));
  const shotSpeed = clamp(6.4 + shooter.sho * 0.045 + shooter.phy * 0.010, 6.8, 11.4);

  sim.ball.vx = (dx / d) * shotSpeed;
  sim.ball.vy = (dy / d) * shotSpeed;
  sim.lastTouchHome = shooter.isHome;
  sim.lastTouchAgent = shooter;
  sim.pendingShot = {
    isGoal,
    wasAttacking: shooter.isHome,
    xg,
    wasSaved,
  };
  sim.shotTimer = Math.round(clamp(d / shotSpeed * 1.35, 6, 28));
  sim.pendingPass = null;

  shooter.hasBall = false;
  shooter.action = "kick";
  shooter.actionTimer = 14;
  shooter.decisionTimer = 12;
  sim.carrierIdx = -1;
}

function decisionInterval(player: SimAgent, tactics: TeamTactics): number {
  return Math.round(clamp(
    34 - tactics.tempo * 14 - (player.pas + player.dri) / 34,
    10,
    32,
  ));
}

function decideCarrierAction(sim: Sim, carrier: SimAgent, W: number, H: number): void {
  const opponents = opponentsOf(sim, carrier.isHome);
  const tactics = tacticsOf(sim, carrier.isHome);
  const keeper = opponents.find((p) => p.pos === "GOL") ?? opponents[0];
  if (!keeper) return;

  const gx = goalXFor(carrier.isHome, W);
  const distanceToGoal = Math.hypot(gx - carrier.x, H / 2 - carrier.y);
  const maxShotDistance = W * (0.16 + carrier.sho / 720);
  const xg = calculateShotChance(carrier, keeper, opponents, W, H);
  const pass = bestPassChoice(sim, carrier, W, H);
  const pressure = pressureAt(opponents, carrier.x, carrier.y, W);
  const laneOpen = carrierLaneOpenness(carrier, opponents, W);

  // xg alone (typically 0.05-0.2 for a realistic look at goal) lives on a much
  // smaller scale than passUtility (sigmoid-transformed, typically 0.3-0.9) —
  // comparing them raw meant a shot almost never won even when clearly on,
  // since it was competing at 1/3 to 1/5 the scale. Putting xg through the
  // same kind of transform makes "in range with a decent chance" genuinely
  // competitive with "there's an OK pass on", instead of passing forever.
  const shootUtility = distanceToGoal <= maxShotDistance
    ? sigmoid((xg - 0.10) * 6) * (0.92 + carrier.sho / 210) + tactics.risk * 0.05
    : -1;

  const passUtility = pass
    ? pass.utility + pressure * 0.18 + tactics.tempo * 0.04
    : -1;

  const dribbleUtility = clamp(
    0.22 +
      carrier.dri / 180 +
      carrier.pac / 360 +
      laneOpen * 0.34 -
      pressure * 0.62 +
      tactics.directness * 0.08,
    0,
    1.2,
  );

  const shootNoise = centeredRand(sim) * 0.045;
  const passNoise = centeredRand(sim) * 0.055;
  const dribbleNoise = centeredRand(sim) * 0.045;

  if (
    shootUtility + shootNoise > passUtility + passNoise &&
    shootUtility + shootNoise > dribbleUtility + dribbleNoise &&
    xg > 0.035
  ) {
    executeShot(sim, carrier, W, H);
    return;
  }

  if (
    pass &&
    passUtility + passNoise > dribbleUtility + dribbleNoise - tactics.risk * 0.05
  ) {
    executePass(sim, carrier, pass, W);
    return;
  }

  carrier.decisionTimer = Math.max(6, Math.round(decisionInterval(carrier, tactics) * 0.65));
}

function moveCarrier(sim: Sim, carrier: SimAgent, W: number, H: number): void {
  const opponents = opponentsOf(sim, carrier.isHome);
  const dir = attackDir(carrier.isHome);
  const gx = goalXFor(carrier.isHome, W);
  const pressure = pressureAt(opponents, carrier.x, carrier.y, W);

  let steerY = (H / 2 - carrier.y) * 0.035;
  let slowDown = 0;

  opponents.forEach((opp) => {
    if (opp.pos === "GOL") return;
    const dx = opp.x - carrier.x;
    const dy = opp.y - carrier.y;
    const d = Math.hypot(dx, dy);
    if (d > W * 0.12 || d < 0.001) return;

    const ahead = dir * dx > -6;
    const weight = 1 - d / (W * 0.12);
    if (ahead) {
      const side = dy === 0 ? (opp.by < H / 2 ? 1 : -1) : -Math.sign(dy);
      steerY += side * H * 0.065 * weight;
      slowDown += weight * 0.18;
    }
  });

  const targetX = lerp(carrier.x + dir * W * 0.12, gx, 0.22);
  const targetY = clamp(carrier.y + steerY, H * 0.08, H * 0.92);
  const baseSpeed = 0.56 + carrier.pac / 155 + carrier.dri / 340;
  const pressurePenalty = pressure * 0.18 + slowDown;

  moveAgentToward(
    carrier,
    targetX,
    targetY,
    clamp(baseSpeed - pressurePenalty, 0.62, 1.75),
    0.28,
  );

  sim.ball.x = carrier.x + dir * 2.2 + centeredRand(sim) * 0.55;
  sim.ball.y = carrier.y + centeredRand(sim) * 0.65;
  sim.ball.vx = carrier.vx;
  sim.ball.vy = carrier.vy;
}

function attemptTackles(sim: Sim, carrier: SimAgent, _W: number): void {
  const defenders = opponentsOf(sim, carrier.isHome)
    .filter((p) => p.pos !== "GOL")
    .map((p) => ({ p, d: Math.hypot(p.x - carrier.x, p.y - carrier.y) }))
    .filter((v) => v.d < 14.5)
    .sort((a, b) => a.d - b.d)
    .slice(0, 2);

  for (const { p: defender, d } of defenders) {
    if (defender.tackleCooldown > 0) continue;

    defender.action = "tackle";
    defender.actionTimer = 13;
    defender.tackleCooldown = 24 + Math.round(rand(sim) * 12);

    const defenderQuality =
      defender.def * 0.62 + defender.phy * 0.22 + defender.pac * 0.08 + defender.ovr * 0.08;
    const carrierQuality =
      carrier.dri * 0.60 + carrier.phy * 0.18 + carrier.pac * 0.12 + carrier.ovr * 0.10;

    const proximityBonus = (1 - d / 14.5) * 0.12;
    const chance = clamp(
      0.20 + (defenderQuality - carrierQuality) * 0.006 + proximityBonus,
      0.07,
      0.58,
    );

    if (rand(sim) < chance) {
      carrier.hasBall = false;
      carrier.decisionTimer = 8;
      setCarrier(sim, defender);
      sim.ball.vx = centeredRand(sim) * 1.5;
      sim.ball.vy = centeredRand(sim) * 1.5;
      return;
    }

    // Failed tackle: defender loses a bit of momentum instead of retrying next frame.
    defender.vx *= 0.35;
    defender.vy *= 0.35;
  }
}

function updateBallPhysics(sim: Sim): void {
  sim.ball.x += sim.ball.vx;
  sim.ball.y += sim.ball.vy;
  sim.ball.vx *= 0.985;
  sim.ball.vy *= 0.985;
}

function restartPossession(
  sim: Sim,
  isHome: boolean,
  x: number,
  y: number,
): void {
  const team = teamOf(sim, isHome);
  const preferred = team.filter((p) => p.pos !== "GOL");
  const nearest = nearestPlayer(preferred.length ? preferred : team, x, y);
  if (!nearest) return;

  sim.pendingPass = null;
  sim.pendingShot = null;
  sim.shotTimer = 0;
  setCarrier(sim, nearest.p);
}

const RESTART_PAUSE: Record<RestartKind, number> = {
  THROW_IN: 22,
  CORNER: 42,
  GOAL_KICK: 36,
  KICKOFF: 20,
};

function logEvent(sim: Sim, type: MatchEventType, team: boolean, x?: number, y?: number): void {
  sim.lastEvent = { type, frame: sim.frame, team, x, y };
}

// Picks who takes each restart type — never a goalkeeper for throw-ins/
// corners, never an outfielder for a goal kick, and never just "whoever's
// closest" for a corner (that would routinely hand it to a center-back).
function pickRestartTaker(sim: Sim, kind: RestartKind, team: boolean, x: number, y: number, H: number): SimAgent | null {
  const squad = teamOf(sim, team);

  if (kind === "GOAL_KICK") {
    return squad.find((p) => p.pos === "GOL") ?? nearestPlayer(squad, x, y)?.p ?? null;
  }

  if (kind === "THROW_IN") {
    // LD sits on the high-y flank, LE on the low-y flank (see ROLE_LANE) —
    // take it from whichever fullback actually plays that side, falling back
    // to the nearest outfielder if they're too far from the throw-in spot.
    const preferredPos: PositionKey = y > H / 2 ? "LD" : "LE";
    const preferred = squad.find((p) => p.pos === preferredPos);
    if (preferred && Math.hypot(preferred.x - x, preferred.y - y) < 60) return preferred;
    return nearestPlayer(squad.filter((p) => p.pos !== "GOL"), x, y)?.p ?? null;
  }

  if (kind === "CORNER") {
    const candidates = squad.filter((p) => p.pos === "PD" || p.pos === "PE" || p.pos === "MEI" || p.pos === "MC");
    const best = candidates.reduce<SimAgent | null>((acc, p) => (!acc || p.pas > acc.pas ? p : acc), null);
    return best ?? nearestPlayer(squad.filter((p) => p.pos !== "GOL"), x, y)?.p ?? null;
  }

  // KICKOFF
  const outfield = squad.filter((p) => p.pos !== "GOL");
  return nearestPlayer(outfield.length ? outfield : squad, x, y)?.p ?? null;
}

function beginRestart(sim: Sim, kind: RestartKind, team: boolean, x: number, y: number, W: number, H: number): void {
  sim.pendingPass = null;
  sim.pendingShot = null;
  sim.shotTimer = 0;
  sim.carrierIdx = -1;
  sim.attacking = team;
  [...sim.home, ...sim.away].forEach((p) => { p.hasBall = false; });

  const taker = pickRestartTaker(sim, kind, team, x, y, H);
  if (taker) {
    taker.x = clamp(x, 6, W - 6);
    taker.y = clamp(y, 6, H - 6);
    taker.vx = 0;
    taker.vy = 0;
  }

  sim.restart = { kind, team, x, y, taker, timer: RESTART_PAUSE[kind] };
  logEvent(sim, kind, team, x, y);
}

function handleBallOut(sim: Sim, W: number, H: number): boolean {
  const outY = sim.ball.y < 0 || sim.ball.y > H;
  const outX = sim.ball.x < 0 || sim.ball.x > W;
  if (!outX && !outY) return false;

  if (outY) {
    const possessionHome = sim.lastTouchHome === null ? !sim.attacking : !sim.lastTouchHome;
    beginRestart(
      sim, "THROW_IN", possessionHome,
      clamp(sim.ball.x, 8, W - 8),
      clamp(sim.ball.y, 8, H - 8),
      W, H,
    );
    return true;
  }

  // A ball crossing the goal line inside the goal mouth is only ever a real
  // goal via the deliberate executeShot()/resolvePendingShot() flow — physics
  // alone reaching x<0/x>W here (open play, no pending shot) never scores,
  // so it always resolves as a corner or goal kick regardless of y.
  void isInsideGoalMouth;

  const defendingHome = sim.ball.x < 0;
  const lastTouchByDefender = sim.lastTouchHome === defendingHome;
  const isCorner = lastTouchByDefender;
  const restartingTeam = isCorner ? !defendingHome : defendingHome;

  if (isCorner) {
    const cornerY = sim.ball.y > H / 2 ? H * 0.94 : H * 0.06;
    beginRestart(sim, "CORNER", restartingTeam, defendingHome ? W * 0.03 : W * 0.97, cornerY, W, H);
  } else {
    beginRestart(sim, "GOAL_KICK", restartingTeam, defendingHome ? W * 0.10 : W * 0.90, H / 2, W, H);
  }
  return true;
}

// Off-ball shape during a paused restart — reuses the same attackTarget()/
// defensiveTarget() the rest of the sim already uses (with the restart spot
// standing in for "where the ball is"), since there's no real ball carrier
// to react to yet. Corners get an extra push: strikers crash the box, one
// holding player stays back for balance instead of everyone crashing forward.
function updateRestartShape(sim: Sim, W: number, H: number): void {
  const r = sim.restart;
  if (!r) return;

  const reference = { x: r.x, y: r.y };
  const cornerBoxX = r.x < W / 2 ? W * 0.12 : W * 0.88;

  [true, false].forEach((isHome) => {
    const team = teamOf(sim, isHome);
    const opponents = opponentsOf(sim, isHome);
    const tactics = tacticsOf(sim, isHome);
    const isRestarting = isHome === r.team;

    team.forEach((p) => {
      if (p === r.taker) return;

      let target = isRestarting
        ? attackTarget(p, reference, opponents, team, tactics, W, H)
        : defensiveTarget(p, r.x, r.y, opponents, team, tactics, false, W, H);

      if (r.kind === "CORNER" && isRestarting) {
        if (p.pos === "CA" || p.pos === "SA") {
          target = { x: lerp(target.x, cornerBoxX, 0.7), y: target.y };
        } else if (p.pos === "VOL" || p.pos === "MC") {
          // One holding player stays central near halfway for balance instead
          // of everyone crashing the box.
          target = { x: lerp(target.x, W / 2, 0.5), y: H / 2 };
        }
      }

      const roleSpeed = p.pos === "GOL" ? 0.45 : 0.58 + p.pac / 185;
      moveAgentToward(p, target.x, target.y, roleSpeed, 0.20);
    });
  });
}

function resolveCornerCross(sim: Sim, taker: SimAgent, W: number, H: number): void {
  const attackers = teamOf(sim, taker.isHome).filter((p) => p !== taker && p.pos !== "GOL");
  const defenders = opponentsOf(sim, taker.isHome);
  const gx = goalXFor(taker.isHome, W);

  const bestAttacker = attackers.reduce<{ p: SimAgent; d: number } | null>((best, p) => {
    const d = Math.hypot(gx - p.x, H / 2 - p.y);
    return !best || d < best.d ? { p, d } : best;
  }, null);

  if (!bestAttacker) {
    setCarrier(sim, taker);
    return;
  }

  const attacker = bestAttacker.p;
  const nearestDefender = nearestPlayer(defenders.filter((d) => d.pos !== "GOL"), attacker.x, attacker.y)?.p;

  const aerialAttack = attacker.phy * 0.45 + attacker.sho * 0.25 + attacker.ovr * 0.20 + (attacker.pac + attacker.dri) / 2 * 0.10;
  const aerialDefense = nearestDefender
    ? nearestDefender.def * 0.50 + nearestDefender.phy * 0.35 + nearestDefender.ovr * 0.15
    : 30;
  const winChance = clamp(0.5 + (aerialAttack - aerialDefense) * 0.01, 0.15, 0.85);

  sim.ball.x = attacker.x;
  sim.ball.y = attacker.y;
  sim.lastTouchHome = attacker.isHome;
  sim.lastTouchAgent = attacker;

  if (rand(sim) < winChance) {
    executeShot(sim, attacker, W, H);
    return;
  }

  const keeper = defenders.find((d) => d.pos === "GOL");
  const winner = keeper && rand(sim) < 0.4 ? keeper : nearestDefender ?? defenders[0];
  if (winner) setCarrier(sim, winner);
  else restartPossession(sim, !taker.isHome, sim.ball.x, sim.ball.y);
}

function executeRestart(sim: Sim, W: number, H: number): void {
  const r = sim.restart;
  if (!r) return;
  sim.restart = null;

  const taker = r.taker;
  if (!taker) {
    restartPossession(sim, r.team, r.x, r.y);
    return;
  }

  if (r.kind === "CORNER") {
    resolveCornerCross(sim, taker, W, H);
    return;
  }

  if (r.kind === "KICKOFF") {
    setCarrier(sim, taker);
    return;
  }

  // THROW_IN / GOAL_KICK both just look for the best available pass — the
  // existing utility scorer already prefers short/safe options for a
  // low-risk/low-directness team and long/vertical ones for a direct team,
  // so no separate short-vs-long special case is needed here.
  const pass = bestPassChoice(sim, taker, W, H);
  if (pass) executePass(sim, taker, pass, W);
  else setCarrier(sim, taker);
}

function chaseLooseBall(sim: Sim, isHome: boolean, W: number, _H: number): void {
  const team = teamOf(sim, isHome);
  const candidates = team
    .filter((p) => {
      if (p.pos !== "GOL") return true;
      const ownGoalX = ownGoalXFor(isHome, W);
      return Math.abs(sim.ball.x - ownGoalX) < W * 0.20;
    })
    .map((p) => ({ p, d: Math.hypot(p.x - sim.ball.x, p.y - sim.ball.y) }))
    .sort((a, b) => a.d - b.d)
    .slice(0, 2);

  candidates.forEach(({ p }, i) => {
    const speed = 0.62 + p.pac / 165 - i * 0.08;
    moveAgentToward(p, sim.ball.x, sim.ball.y, speed, 0.27);
  });
}

function tryControlLooseBall(sim: Sim, W: number): void {
  const speed = Math.hypot(sim.ball.vx, sim.ball.vy);
  const all = [...sim.home, ...sim.away]
    .filter((p) => p.controlCooldown <= 0)
    .filter((p) => !(p === sim.passCooldownAgent && sim.passCooldownTimer > 0))
    .map((p) => ({ p, d: Math.hypot(p.x - sim.ball.x, p.y - sim.ball.y) }))
    .sort((a, b) => a.d - b.d)
    .slice(0, 4);

  for (const { p, d } of all) {
    const controlRadius = p.pos === "GOL" ? 18 : 14;
    if (d > controlRadius) continue;

    const controlQuality = p.pos === "GOL"
      ? p.def * 0.58 + p.phy * 0.18 + p.pas * 0.08 + p.ovr * 0.16
      : p.dri * 0.46 + p.pas * 0.22 + p.phy * 0.10 + p.ovr * 0.22;

    const intendedTargetBonus = sim.pendingPass?.target === p ? 0.14 : 0;
    const interceptionBonus = sim.pendingPass && sim.pendingPass.target.isHome !== p.isHome
      ? p.def * 0.0012
      : 0;

    const chance = clamp(
      0.20 +
        controlQuality / 150 -
        speed * 0.055 -
        (d / controlRadius) * 0.16 +
        intendedTargetBonus +
        interceptionBonus,
      0.08,
      0.95,
    );

    if (rand(sim) < chance) {
      setCarrier(sim, p);
      return;
    }

    p.controlCooldown = 5;
  }

  // Avoid a dead ball that nobody ever reaches due to tiny residual velocity.
  if (speed < 0.12) {
    const nearest = nearestPlayer([...sim.home, ...sim.away], sim.ball.x, sim.ball.y);
    if (nearest && nearest.dist < 22) setCarrier(sim, nearest.p);
  }

  // Keep a totally stopped ball numerically stable.
  if (speed < 0.02) {
    sim.ball.vx = 0;
    sim.ball.vy = 0;
  }

  // W is intentionally used here to keep future tuning tied to pitch scale.
  void W;
}

// Snaps everyone back to their formation anchor (the correct kickoff shape —
// this transition itself is instant, real football doesn't animate it either)
// then hands off to the same paused RestartState the other dead-ball
// restarts use, instead of immediately granting possession.
function resetKickoff(sim: Sim, kickoffHome: boolean, W: number, H: number): void {
  [...sim.home, ...sim.away].forEach((p) => {
    p.x = p.bx;
    p.y = p.by;
    p.vx = 0;
    p.vy = 0;
    p.hasBall = false;
    p.decisionTimer = 6;
    p.controlCooldown = 0;
  });

  sim.ball.x = W / 2;
  sim.ball.y = H / 2;
  sim.ball.vx = 0;
  sim.ball.vy = 0;

  beginRestart(sim, "KICKOFF", kickoffHome, W / 2, H / 2, W, H);
}

function resolvePendingShot(
  sim: Sim,
  W: number,
  H: number,
  onGoal: (home: number, away: number) => void,
): void {
  const shot = sim.pendingShot;
  if (!shot) return;

  if (shot.isGoal) {
    if (shot.wasAttacking) sim.homeGoals += 1;
    else sim.awayGoals += 1;

    sim.flash = 75;
    logEvent(sim, "GOAL", shot.wasAttacking, sim.ball.x, sim.ball.y);
    onGoal(sim.homeGoals, sim.awayGoals);
    const kickoffHome = !shot.wasAttacking;
    resetKickoff(sim, kickoffHome, W, H);
    return;
  }

  const defendingHome = !shot.wasAttacking;
  const attackingHome = shot.wasAttacking;
  sim.pendingShot = null;
  sim.shotTimer = 0;

  if (shot.wasBlocked) {
    // The defender's touch (not the shooter's) sent it behind — corner for
    // the attacking team, exactly like a real charged-down shot.
    const cornerY = sim.ball.y > H / 2 ? H * 0.94 : H * 0.06;
    beginRestart(sim, "CORNER", attackingHome, attackingHome ? W * 0.97 : W * 0.03, cornerY, W, H);
    return;
  }

  if (shot.wasSaved) {
    // Keeper holds/parries it — real possession, no dead-ball restart needed.
    const defenders = teamOf(sim, defendingHome);
    const keeper = defenders.find((p) => p.pos === "GOL") ?? defenders[0];
    if (keeper) setCarrier(sim, keeper);
    else restartPossession(sim, defendingHome, sim.ball.x, sim.ball.y);
    return;
  }

  // A clean miss actually went out for a real goal kick, instead of just
  // teleporting the ball into the keeper's hands regardless of how wide it went.
  beginRestart(sim, "GOAL_KICK", defendingHome, defendingHome ? W * 0.10 : W * 0.90, H / 2, W, H);
}

function separateAgents(players: SimAgent[], W: number, H: number): void {
  for (let i = 0; i < players.length; i++) {
    for (let j = i + 1; j < players.length; j++) {
      const a = players[i];
      const b = players[j];
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const dist = Math.hypot(dx, dy);

      if (dist > 0 && dist < 10.5) {
        const push = (10.5 - dist) * 0.055;
        const nx = dx / dist;
        const ny = dy / dist;
        a.x -= nx * push;
        a.y -= ny * push;
        b.x += nx * push;
        b.y += ny * push;
      }
    }
  }

  players.forEach((p) => {
    p.x = clamp(p.x, 6, W - 6);
    p.y = clamp(p.y, 6, H - 6);
  });
}

function tickAgentTimers(sim: Sim): void {
  [...sim.home, ...sim.away].forEach((p) => {
    if (p.actionTimer > 0 && --p.actionTimer === 0) p.action = "run";
    if (p.decisionTimer > 0) p.decisionTimer -= 1;
    if (p.tackleCooldown > 0) p.tackleCooldown -= 1;
    if (p.controlCooldown > 0) p.controlCooldown -= 1;
  });

  if (sim.passCooldownTimer > 0 && --sim.passCooldownTimer === 0) {
    sim.passCooldownAgent = null;
  }

  if (sim.pendingPass) {
    sim.pendingPass.framesLeft -= 1;
    if (sim.pendingPass.framesLeft <= 0) {
      // The pass has traveled its expected distance and should be arriving/
      // being cushioned near the receiver — without this, an uncontrolled
      // pass just kept sailing at full speed indefinitely (only the
      // probabilistic pickup in tryControlLooseBall() could ever stop it),
      // which meant a lot of passes nobody quite reached ended up rolling
      // all the way out of bounds instead of settling near the target.
      sim.ball.vx *= 0.22;
      sim.ball.vy *= 0.22;
      sim.pendingPass = null;
    }
  }
}

export function createSim(
  W: number,
  H: number,
  homeFormation: FormationKey = "4-3-3",
  homeLineup: Player[] = [],
  opponentPower = 45,
  options: CreateSimOptions = {},
): Sim {
  const awayFormation = options.awayFormation ?? "4-4-2";
  const homePts = fieldLayout(homeFormation, true, W, H);
  const awayPts = fieldLayout(awayFormation, false, W, H);
  const assignedHome = assignPlayersToSlots(homeLineup.slice(0, 11), homePts);
  const awayScale = clamp(opponentPower / 45, 0.72, 1.65);

  let rngState = (options.seed ?? (Date.now() ^ Math.floor(Math.random() * 0xffffffff))) >>> 0;
  const initRand = (): number => {
    rngState = nextRngState(rngState);
    return rngState / 4294967296;
  };

  const agent = (
    pt: { x: number; y: number; num: number; role: PositionKey },
    isHome: boolean,
    player?: Player,
  ): SimAgent => ({
    x: pt.x + (initRand() - 0.5) * 6,
    y: pt.y + (initRand() - 0.5) * 6,
    bx: pt.x,
    by: pt.y,
    vx: 0,
    vy: 0,
    num: pt.num,
    isHome,
    hasBall: false,
    action: "run",
    actionTimer: 0,
    decisionTimer: Math.floor(initRand() * 8),
    tackleCooldown: 0,
    controlCooldown: 0,
    stamina: 1,
    pos: pt.role,
    ...fromPlayer(player, pt.role, isHome ? 1 : awayScale),
  });

  const sim: Sim = {
    home: assignedHome.map((p) => agent(p, true, p.player)),
    away: awayPts.map((p) => agent(p, false)),
    ball: { x: W / 2, y: H / 2, vx: 0, vy: 0 },
    attacking: true,
    carrierIdx: -1,
    homeGoals: 0,
    awayGoals: 0,
    flash: 0,
    frame: 0,
    passCooldownAgent: null,
    passCooldownTimer: 0,
    pendingShot: null,
    shotTimer: 0,
    pendingPass: null,
    lastTouchHome: null,
    lastTouchAgent: null,
    restart: null,
    lastEvent: null,
    homeTactics: normalizeTactics(options.homeTactics),
    awayTactics: normalizeTactics(options.awayTactics),
    rngState,
  };

  resetKickoff(sim, true, W, H);
  return sim;
}

export function stepSimulation(
  sim: Sim,
  W: number,
  H: number,
  onGoal: (home: number, away: number) => void,
): void {
  sim.frame += 1;
  tickAgentTimers(sim);

  if (sim.restart) {
    // Paused for a throw-in/corner/goal-kick/kickoff: no tackles, no loose-ball
    // chasing, no shoot/pass/dribble decisions — just reposition toward the
    // restart shape and count down to the actual take.
    updateRestartShape(sim, W, H);
    sim.ball.x = sim.restart.x;
    sim.ball.y = sim.restart.y;
    sim.ball.vx = 0;
    sim.ball.vy = 0;
    sim.restart.timer -= 1;
    if (sim.restart.timer <= 0) executeRestart(sim, W, H);
  } else {
    // Formation and tactics continuously define the team's dynamic shape.
    updateTeamShape(sim, true, W, H);
    updateTeamShape(sim, false, W, H);

    if (sim.pendingShot) {
      updateBallPhysics(sim);
      sim.shotTimer -= 1;
      if (sim.shotTimer <= 0) resolvePendingShot(sim, W, H, onGoal);
    } else {
      const carrier = currentCarrier(sim);

      if (carrier) {
        carrier.hasBall = true;
        moveCarrier(sim, carrier, W, H);
        attemptTackles(sim, carrier, W);

        // The tackle may have changed possession.
        const afterTackleCarrier = currentCarrier(sim);
        if (afterTackleCarrier === carrier && carrier.decisionTimer <= 0) {
          decideCarrierAction(sim, carrier, W, H);
          if (currentCarrier(sim) === carrier) {
            carrier.decisionTimer = decisionInterval(carrier, tacticsOf(sim, carrier.isHome));
          }
        }
      } else {
        updateBallPhysics(sim);

        if (!handleBallOut(sim, W, H)) {
          chaseLooseBall(sim, true, W, H);
          chaseLooseBall(sim, false, W, H);
          tryControlLooseBall(sim, W);
        }
      }
    }
  }

  const allPlayers = [...sim.home, ...sim.away];
  allPlayers.forEach((p) => {
    p.x = clamp(p.x, 6, W - 6);
    p.y = clamp(p.y, 6, H - 6);
  });

  separateAgents(allPlayers, W, H);
  if (sim.flash > 0) sim.flash -= 1;
}
