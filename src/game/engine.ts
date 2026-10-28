export const TILE = 32;
export const W = 200;
export const H = 60;

export enum B { Air, Grass, Dirt, Stone, Wood, Leaves }
export const BLOCK_NAMES: Record<number, string> = { 1: "Grass", 2: "Dirt", 3: "Stone", 4: "Wood", 5: "Leaves" };
export const BLOCK_COLORS: Record<number, string> = {
  1: "#5fae3c", 2: "#8a5a35", 3: "#7d7d85", 4: "#9b6b3c", 5: "#3f8f3a",
};

export type Zombie = { x: number; y: number; vx: number; vy: number; hp: number; hitCd: number; flash: number };
export type Tools = { sword: number; pickaxe: number };

export type State = {
  world: Uint8Array;
  px: number; py: number; vx: number; vy: number; onGround: boolean; facing: number;
  hp: number; inv: Record<number, number>; tools: Tools; selected: number;
  time: number; zombies: Zombie[]; dead: boolean; days: number; kills: number; hurt: number;
};

export const DAY_LEN = 120; // seconds per full cycle

export function idx(x: number, y: number) { return y * W + x; }
export function get(s: State, x: number, y: number) {
  if (x < 0 || x >= W || y >= H) return B.Stone;
  if (y < 0) return B.Air;
  return s.world[idx(x, y)] ?? B.Air;
}

export function makeWorld(): State {
  const world = new Uint8Array(W * H);
  let h = 25;
  const heights: number[] = [];
  for (let x = 0; x < W; x++) {
    h += Math.round((Math.random() - 0.5) * 2);
    h = Math.max(18, Math.min(34, h));
    heights.push(h);
    for (let y = h; y < H; y++) {
      world[idx(x, y)] = y === h ? B.Grass : y < h + 4 ? B.Dirt : B.Stone;
    }
  }
  for (let x = 3; x < W - 3; x++) {
    if (Math.random() < 0.08) {
      const g = heights[x]!;
      const th = 4 + Math.floor(Math.random() * 2);
      for (let i = 1; i <= th; i++) world[idx(x, g - i)] = B.Wood;
      for (let dx = -2; dx <= 2; dx++) for (let dy = -2; dy <= 0; dy++) {
        const tx = x + dx, ty = g - th + dy;
        if (Math.abs(dx) + Math.abs(dy) < 4 && world[idx(tx, ty)] === B.Air) world[idx(tx, ty)] = B.Leaves;
      }
      x += 4;
    }
  }
  const sx = Math.floor(W / 2);
  return {
    world, px: sx * TILE, py: (heights[sx]! - 3) * TILE, vx: 0, vy: 0, onGround: false, facing: 1,
    hp: 100, inv: {}, tools: { sword: 0, pickaxe: 0 }, selected: B.Dirt,
    time: 0, zombies: [], dead: false, days: 1, kills: 0, hurt: 0,
  };
}

export const PW = 20, PH = 54;
const GRAV = 1800, JUMP = 620, SPEED = 220;

function solid(s: State, x: number, y: number) {
  const b = get(s, x, y);
  return b !== B.Air && b !== B.Leaves;
}

function moveBody(s: State, o: { x: number; y: number; vx: number; vy: number }, w: number, h: number, dt: number) {
  let grounded = false;
  o.vy = Math.min(o.vy + GRAV * dt, 1200);
  // X
  o.x += o.vx * dt;
  const ty0 = Math.floor(o.y / TILE), ty1 = Math.floor((o.y + h - 1) / TILE);
  if (o.vx > 0) {
    const tx = Math.floor((o.x + w) / TILE);
    for (let ty = ty0; ty <= ty1; ty++) if (solid(s, tx, ty)) { o.x = tx * TILE - w - 0.01; o.vx = 0; break; }
  } else if (o.vx < 0) {
    const tx = Math.floor(o.x / TILE);
    for (let ty = ty0; ty <= ty1; ty++) if (solid(s, tx, ty)) { o.x = (tx + 1) * TILE + 0.01; o.vx = 0; break; }
  }
  // Y
  o.y += o.vy * dt;
  const tx0 = Math.floor(o.x / TILE), tx1 = Math.floor((o.x + w - 1) / TILE);
  if (o.vy > 0) {
    const ty = Math.floor((o.y + h) / TILE);
    for (let tx = tx0; tx <= tx1; tx++) if (solid(s, tx, ty)) { o.y = ty * TILE - h; o.vy = 0; grounded = true; break; }
  } else if (o.vy < 0) {
    const ty = Math.floor(o.y / TILE);
    for (let tx = tx0; tx <= tx1; tx++) if (solid(s, tx, ty)) { o.y = (ty + 1) * TILE; o.vy = 0; break; }
  }
  return grounded;
}

export function isNight(t: number) {
  const p = (t % DAY_LEN) / DAY_LEN;
  return p > 0.55 && p < 0.95;
}
export function darkness(t: number) {
  const p = (t % DAY_LEN) / DAY_LEN;
  if (p < 0.5) return 0;
  if (p < 0.6) return ((p - 0.5) / 0.1) * 0.7;
  if (p < 0.9) return 0.7;
  if (p < 1) return (1 - (p - 0.9) / 0.1) * 0.7;
  return 0;
}

export type Input = { left: boolean; right: boolean; jump: boolean };

export function step(s: State, inp: Input, dt: number) {
  if (s.dead) return;
  const prevDay = Math.floor(s.time / DAY_LEN);
  s.time += dt;
  if (Math.floor(s.time / DAY_LEN) > prevDay) s.days++;
  s.vx = (inp.right ? SPEED : 0) - (inp.left ? SPEED : 0);
  if (s.vx) s.facing = Math.sign(s.vx);
  if (inp.jump && s.onGround) s.vy = -JUMP;
  const body = { x: s.px, y: s.py, vx: s.vx, vy: s.vy };
  s.onGround = moveBody(s, body, PW, PH, dt);
  s.px = body.x; s.py = body.y; s.vy = body.vy;
  if (s.py > H * TILE) s.hp = 0;
  s.hurt = Math.max(0, s.hurt - dt);

  // spawn
  const night = isNight(s.time);
  if (night && s.zombies.length < 6 && Math.random() < dt * 0.5) {
    const side = Math.random() < 0.5 ? -1 : 1;
    const zx = Math.floor(s.px / TILE) + side * (14 + Math.floor(Math.random() * 6));
    if (zx > 1 && zx < W - 2) {
      let zy = 0;
      while (zy < H && !solid(s, zx, zy)) zy++;
      s.zombies.push({ x: zx * TILE, y: (zy - 2) * TILE, vx: 0, vy: 0, hp: 20, hitCd: 0, flash: 0 });
    }
  }
  for (const z of s.zombies) {
    const dir = Math.sign(s.px - z.x);
    z.vx = dir * 90;
    const g = moveBody(s, z, PW, PH, dt);
    if (g && z.vx === 0) z.vy = -520;
    if (g && Math.random() < dt * 0.3) z.vy = -480;
    z.hitCd -= dt; z.flash = Math.max(0, z.flash - dt);
    if (Math.abs(z.x - s.px) < PW + 4 && Math.abs(z.y - s.py) < PH && z.hitCd <= 0) {
      s.hp -= 10; z.hitCd = 1; s.hurt = 0.3; s.vy = -250;
    }
    if (!night && Math.random() < dt * 0.4) z.hp = 0; // burn at day
  }
  s.zombies = s.zombies.filter((z) => z.hp > 0 && z.y < H * TILE);
  if (s.hp <= 0) { s.hp = 0; s.dead = true; }
}

export const REACH = 4.5 * TILE;

/** Returns message or null. Attacks zombie if near click, else mines. */
export function action(s: State, wx: number, wy: number): string | null {
  if (s.dead) return null;
  const cx = s.px + PW / 2, cy = s.py + PH / 2;
  // attack
  for (const z of s.zombies) {
    const zx = z.x + PW / 2, zy = z.y + PH / 2;
    if (Math.hypot(wx - zx, wy - zy) < 40 && Math.hypot(zx - cx, zy - cy) < REACH) {
      const dmg = s.tools.sword > 0 ? 10 : 5;
      z.hp -= dmg; z.flash = 0.15; z.vy = -250; z.x += Math.sign(zx - cx) * 20;
      if (z.hp <= 0) s.kills++;
      return null;
    }
  }
  if (Math.hypot(wx - cx, wy - cy) > REACH) return null;
  const tx = Math.floor(wx / TILE), ty = Math.floor(wy / TILE);
  const b = get(s, tx, ty);
  if (tx < 0 || tx >= W || ty < 0 || ty >= H || b === B.Air) return null;
  s.world[idx(tx, ty)] = B.Air;
  const drop: number = b === B.Grass ? B.Dirt : b;
  s.inv[drop] = (s.inv[drop] ?? 0) + (b === B.Stone && s.tools.pickaxe ? 2 : 1);
  return null;
}

export function place(s: State, wx: number, wy: number) {
  if (s.dead) return;
  const cx = s.px + PW / 2, cy = s.py + PH / 2;
  if (Math.hypot(wx - cx, wy - cy) > REACH) return;
  const tx = Math.floor(wx / TILE), ty = Math.floor(wy / TILE);
  if (tx < 0 || tx >= W || ty < 0 || ty >= H || get(s, tx, ty) !== B.Air) return;
  if (!((s.inv[s.selected] ?? 0) > 0)) return;
  // overlap check
  const bx = tx * TILE, by = ty * TILE;
  const ov = (x: number, y: number) => x < bx + TILE && x + PW > bx && y < by + TILE && y + PH > by;
  if (ov(s.px, s.py) || s.zombies.some((z) => ov(z.x, z.y))) return;
  s.world[idx(tx, ty)] = s.selected;
  s.inv[s.selected] = (s.inv[s.selected] ?? 1) - 1;
}

export function craft(s: State, item: "sword" | "pickaxe"): boolean {
  const [mat, n]: [number, number] = item === "sword" ? [B.Wood, 4] : [B.Stone, 5];
  if ((s.inv[mat] || 0) < n) return false;
  s.inv[mat] = (s.inv[mat] ?? 0) - n;
  s.tools[item]++;
  return true;
}
