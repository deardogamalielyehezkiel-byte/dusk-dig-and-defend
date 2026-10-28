import { useEffect, useRef, useState } from "react";
import { B, BLOCK_COLORS, BLOCK_NAMES, DAY_LEN, action, craft, isNight, makeWorld, place, step, type State } from "@/game/engine";
import { render } from "@/game/render";

const SLOTS = [B.Dirt, B.Stone, B.Wood, B.Leaves];

export default function Game() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<State | null>(null);
  const input = useRef({ left: false, right: false, jump: false });
  const mouse = useRef<{ x: number; y: number } | null>(null);
  const cam = useRef({ camX: 0, camY: 0 });
  const [, setTick] = useState(0);
  const [toast, setToast] = useState("");
  const [placeMode, setPlaceMode] = useState(false);

  if (!stateRef.current) stateRef.current = makeWorld();
  const s = stateRef.current;

  const flash = (m: string) => { setToast(m); setTimeout(() => setToast(""), 1500); };

  useEffect(() => {
    const cv = canvasRef.current!;
    const ctx = cv.getContext("2d")!;
    let raf = 0, last = performance.now(), hud = 0;
    const resize = () => {
      const r = cv.getBoundingClientRect();
      cv.width = r.width; cv.height = r.height;
    };
    resize();
    window.addEventListener("resize", resize);
    const loop = (t: number) => {
      const dt = Math.min(0.033, (t - last) / 1000); last = t;
      step(stateRef.current!, input.current, dt);
      cam.current = render(ctx, stateRef.current!, cv.width, cv.height, mouse.current);
      hud += dt; if (hud > 0.1) { hud = 0; setTick((n) => n + 1); }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    const key = (down: boolean) => (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (k === "a" || k === "arrowleft") input.current.left = down;
      else if (k === "d" || k === "arrowright") input.current.right = down;
      else if (k === "w" || k === "arrowup" || k === " ") input.current.jump = down;
      else if (down && "1234".includes(k)) stateRef.current!.selected = SLOTS[+k - 1];
      else return;
      e.preventDefault();
    };
    const kd = key(true), ku = key(false);
    window.addEventListener("keydown", kd); window.addEventListener("keyup", ku);
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", resize); window.removeEventListener("keydown", kd); window.removeEventListener("keyup", ku); };
  }, []);

  const world = (e: { clientX: number; clientY: number }) => {
    const r = canvasRef.current!.getBoundingClientRect();
    return { x: e.clientX - r.left + cam.current.camX, y: e.clientY - r.top + cam.current.camY };
  };

  const onPointerDown = (e: React.PointerEvent) => {
    const w = world(e);
    if (e.button === 2 || (e.pointerType !== "mouse" && placeMode)) place(s, w.x, w.y);
    else if (e.button === 0) action(s, w.x, w.y);
  };

  const hold = (k: "left" | "right" | "jump") => ({
    onPointerDown: (e: React.PointerEvent) => { e.preventDefault(); input.current[k] = true; },
    onPointerUp: () => { input.current[k] = false; },
    onPointerLeave: () => { input.current[k] = false; },
    onPointerCancel: () => { input.current[k] = false; },
  });

  const doCraft = (item: "sword" | "pickaxe") => {
    flash(craft(s, item) ? `Crafted ${item === "sword" ? "Wooden Sword" : "Stone Pickaxe"}!` : `Need ${item === "sword" ? "4 Wood" : "5 Stone"}`);
  };

  const restart = () => { stateRef.current = makeWorld(); setTick((n) => n + 1); };
  const night = isNight(s.time);
  const cycle = ((s.time % DAY_LEN) / DAY_LEN) * 100;

  return (
    <div className="fixed inset-0 select-none overflow-hidden bg-background font-pixel text-foreground touch-none">
      <canvas
        ref={canvasRef}
        className="h-full w-full cursor-crosshair"
        onPointerDown={onPointerDown}
        onPointerMove={(e) => { const r = canvasRef.current!.getBoundingClientRect(); mouse.current = { x: e.clientX - r.left, y: e.clientY - r.top }; }}
        onPointerLeave={() => (mouse.current = null)}
        onContextMenu={(e) => e.preventDefault()}
      />

      {/* Top HUD */}
      <div className="pointer-events-none absolute left-3 right-3 top-3 flex flex-wrap items-start justify-between gap-2">
        <div className="hud-panel w-48 sm:w-60">
          <div className="mb-1 flex justify-between text-xs"><span>HEALTH</span><span>{Math.ceil(s.hp)}/100</span></div>
          <div className="h-3 w-full bg-muted"><div className="h-full bg-destructive transition-all" style={{ width: `${s.hp}%` }} /></div>
          <div className="mt-2 flex justify-between text-xs"><span>{night ? "☾ NIGHT" : "☀ DAY"} {s.days}</span><span>☠ {s.kills}</span></div>
          <div className="mt-1 h-1.5 w-full bg-muted"><div className="h-full bg-primary" style={{ width: `${cycle}%` }} /></div>
        </div>
        <div className="hud-panel pointer-events-auto flex flex-col gap-1.5 text-xs">
          <div className="flex gap-3"><span>⚔ Sword ×{s.tools.sword}</span><span>⛏ Pick ×{s.tools.pickaxe}</span></div>
          <div className="flex gap-1.5">
            <button className="pixel-btn" onClick={() => doCraft("sword")}>Craft Sword (4 Wood)</button>
            <button className="pixel-btn" onClick={() => doCraft("pickaxe")}>Craft Pick (5 Stone)</button>
          </div>
        </div>
      </div>

      {/* Hotbar */}
      <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5 max-sm:bottom-28">
        {SLOTS.map((b, i) => (
          <button key={b} onClick={() => (s.selected = b)} className={`hotbar-slot ${s.selected === b ? "hotbar-slot-active" : ""}`} title={BLOCK_NAMES[b]}>
            <span className="h-6 w-6 sm:h-7 sm:w-7" style={{ background: BLOCK_COLORS[b] }} />
            <span className="absolute bottom-0.5 right-1 text-[10px]">{s.inv[b] || 0}</span>
            <span className="absolute left-1 top-0.5 text-[9px] opacity-60">{i + 1}</span>
          </button>
        ))}
      </div>

      <p className="pointer-events-none absolute bottom-3 left-3 hidden text-[10px] opacity-80 lg:block">
        WASD/Arrows move · Left-click mine/attack · Right-click place · 1–4 select
      </p>

      {/* Mobile controls */}
      <div className="absolute bottom-4 left-4 flex gap-3 md:hidden">
        <button className="touch-btn" {...hold("left")}>◀</button>
        <button className="touch-btn" {...hold("right")}>▶</button>
      </div>
      <div className="absolute bottom-4 right-4 flex gap-3 md:hidden">
        <button className={`touch-btn ${placeMode ? "touch-btn-active" : ""}`} onClick={() => setPlaceMode((v) => !v)}>
          {placeMode ? "PLACE" : "MINE"}
        </button>
        <button className="touch-btn" {...hold("jump")}>▲</button>
      </div>

      {toast && <div className="hud-panel absolute left-1/2 top-24 -translate-x-1/2 text-sm">{toast}</div>}

      {s.dead && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-overlay">
          <h2 className="text-4xl text-destructive">YOU DIED</h2>
          <p className="text-sm">Survived {s.days} day(s) · {s.kills} zombies slain</p>
          <button className="pixel-btn px-6 py-3 text-base" onClick={restart}>Respawn</button>
        </div>
      )}
    </div>
  );
}
