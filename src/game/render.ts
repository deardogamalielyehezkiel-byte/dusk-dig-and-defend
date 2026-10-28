import { B, BLOCK_COLORS, H, PH, PW, REACH, TILE, W, darkness, get, type State } from "./engine";

function shade(hex: string, f: number) {
  const n = parseInt(hex.slice(1), 16);
  const c = (v: number) => Math.max(0, Math.min(255, Math.round(v * f)));
  return `rgb(${c(n >> 16)},${c((n >> 8) & 255)},${c(n & 255)})`;
}

function drawBlock(ctx: CanvasRenderingContext2D, b: number, x: number, y: number) {
  const col = BLOCK_COLORS[b] ?? "#888888";
  if (b === B.Grass) {
    ctx.fillStyle = BLOCK_COLORS[B.Dirt]!; ctx.fillRect(x, y, TILE, TILE);
    ctx.fillStyle = col; ctx.fillRect(x, y, TILE, 9);
  } else {
    ctx.fillStyle = col; ctx.fillRect(x, y, TILE, TILE);
  }
  ctx.fillStyle = shade(col, 0.8);
  if (b === B.Wood) { ctx.fillRect(x + 8, y, 3, TILE); ctx.fillRect(x + 21, y, 3, TILE); }
  else if (b === B.Stone) { ctx.fillRect(x + 5, y + 6, 6, 4); ctx.fillRect(x + 18, y + 18, 8, 5); }
  else if (b === B.Leaves) { ctx.fillRect(x + 4, y + 4, 6, 6); ctx.fillRect(x + 20, y + 14, 6, 6); }
  else if (b === B.Dirt) { ctx.fillRect(x + 6, y + 10, 4, 4); ctx.fillRect(x + 20, y + 22, 4, 4); }
  ctx.strokeStyle = "rgba(0,0,0,0.18)"; ctx.strokeRect(x + 0.5, y + 0.5, TILE - 1, TILE - 1);
}

function drawPerson(ctx: CanvasRenderingContext2D, x: number, y: number, skin: string, shirt: string, pants: string, face: number) {
  ctx.fillStyle = pants; ctx.fillRect(x + 2, y + 36, 16, 18);
  ctx.fillStyle = shirt; ctx.fillRect(x, y + 16, PW, 22);
  ctx.fillStyle = skin; ctx.fillRect(x + 2, y, 16, 16);
  ctx.fillStyle = "#111"; ctx.fillRect(x + (face > 0 ? 12 : 4), y + 6, 3, 3);
}

export function render(ctx: CanvasRenderingContext2D, s: State, vw: number, vh: number, mouse: { x: number; y: number } | null) {
  const camX = Math.max(0, Math.min(W * TILE - vw, s.px + PW / 2 - vw / 2));
  const camY = Math.max(0, Math.min(H * TILE - vh, s.py + PH / 2 - vh / 2));
  const d = darkness(s.time);
  const sky = ctx.createLinearGradient(0, 0, 0, vh);
  sky.addColorStop(0, `rgb(${110 - d * 130},${180 - d * 220},${235 - d * 240})`);
  sky.addColorStop(1, `rgb(${190 - d * 230},${225 - d * 260},${250 - d * 270})`);
  ctx.fillStyle = sky; ctx.fillRect(0, 0, vw, vh);

  // sun/moon
  const p = (s.time % 120) / 120;
  const ang = p * Math.PI * 2;
  ctx.fillStyle = "#ffe066";
  ctx.fillRect(vw / 2 - Math.cos(ang) * vw * 0.4 - 20, vh * 0.6 - Math.sin(ang) * vh * 0.5, 40, 40);
  ctx.fillStyle = "#e8e8f0";
  ctx.fillRect(vw / 2 + Math.cos(ang) * vw * 0.4 - 16, vh * 0.6 + Math.sin(ang) * vh * 0.5, 32, 32);

  ctx.save();
  ctx.translate(-Math.round(camX), -Math.round(camY));
  const x0 = Math.floor(camX / TILE), x1 = Math.ceil((camX + vw) / TILE);
  const y0 = Math.floor(camY / TILE), y1 = Math.ceil((camY + vh) / TILE);
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
    const b = get(s, x, y);
    if (b && x >= 0 && x < W && y < H) drawBlock(ctx, b, x * TILE, y * TILE);
  }
  for (const z of s.zombies) {
    drawPerson(ctx, z.x, z.y, z.flash > 0 ? "#fff" : "#5a9a4a", "#2f7f8f", "#3b3b8f", Math.sign(s.px - z.x));
    ctx.fillStyle = "#000a"; ctx.fillRect(z.x - 4, z.y - 8, 28, 4);
    ctx.fillStyle = "#e33"; ctx.fillRect(z.x - 4, z.y - 8, 28 * (z.hp / 20), 4);
  }
  drawPerson(ctx, s.px, s.py, s.hurt > 0 ? "#f88" : "#e0b088", "#3a7bd5", "#2b3a67", s.facing);
  if (s.tools.sword) {
    ctx.fillStyle = "#c9a36a";
    const hx = s.facing > 0 ? s.px + PW : s.px - 4;
    ctx.fillRect(hx, s.py + 18, 4, 18);
  }
  // cursor highlight
  if (mouse) {
    const wx = mouse.x + camX, wy = mouse.y + camY;
    const cx = s.px + PW / 2, cy = s.py + PH / 2;
    if (Math.hypot(wx - cx, wy - cy) <= REACH) {
      ctx.strokeStyle = "rgba(255,255,255,0.9)"; ctx.lineWidth = 2;
      ctx.strokeRect(Math.floor(wx / TILE) * TILE + 1, Math.floor(wy / TILE) * TILE + 1, TILE - 2, TILE - 2);
      ctx.lineWidth = 1;
    }
  }
  ctx.restore();

  if (d > 0) {
    const sx = s.px + PW / 2 - camX, sy = s.py + PH / 2 - camY;
    const g = ctx.createRadialGradient(sx, sy, 40, sx, sy, 260);
    g.addColorStop(0, `rgba(5,8,25,${d * 0.4})`);
    g.addColorStop(1, `rgba(5,8,25,${d})`);
    ctx.fillStyle = g; ctx.fillRect(0, 0, vw, vh);
  }
  return { camX, camY };
}
