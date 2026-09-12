
import { useCallback, useEffect, useRef, useState } from "react";

const WORLD = 2600;
const BASE_SPEED = 2.1;
const BOOST_SPEED = 3.8;
const SEG_GAP = 6;

const BOT_NAMES = [
  "vex",
  "kilo",
  "nyx",
  "rook",
  "sable",
  "quill",
  "drift",
  "onyx",
  "mira",
  "pyre",
];

function len(s) {
  return 12 + Math.floor(s.score / 6);
}

function radius(s) {
  return 5 + Math.min(8, s.score / 90);
}

function makeOrb() {
  return {
    x: Math.random() * WORLD,
    y: Math.random() * WORLD,
    value: 1 + Math.floor(Math.random() * 3),
    hue: 150 + Math.random() * 80,
  };
}

export function ArenaGame({ handle, stake, onExit }) {
  const canvasRef = useRef(null);

  const stateRef = useRef(null);

  const [hud, setHud] = useState({
    score: 0,
    kills: 0,
    alive: true,
    boost: false,
  });

  const exitedRef = useRef(false);

  const controllerRef = useRef(null);
  const controllerActiveRef = useRef(false);
  const knobRef = useRef(null);
  const lastTapTimeRef = useRef(0);
  const lastTapPosRef = useRef({ x: 0, y: 0 });
  const boostTimeoutRef = useRef(null);
  const boostCooldownRef = useRef(0);

  const BOOST_DOUBLE_TAP_MS = 350;
  const BOOST_MOVE_THRESHOLD = 12; // px
  const BOOST_DURATION = 900; // ms
  const BOOST_COOLDOWN = 1200; // ms

  const handleControllerPointer = useCallback((e, active) => {
    const st = stateRef.current;

    if (!st) return;

    const canvas = canvasRef.current;

    if (!canvas) return;

    const w = canvas.clientWidth;
    const h = canvas.clientHeight;

    const ctrl = controllerRef.current;

    if (!ctrl) return;

    const r = ctrl.getBoundingClientRect();

    if (active) {
      controllerActiveRef.current = true;

      if (e.pointerId && ctrl.setPointerCapture) {
        try {
          ctrl.setPointerCapture(e.pointerId);
        } catch (err) {}
      }
    } else {
      controllerActiveRef.current = false;

      if (e.pointerId && ctrl.releasePointerCapture) {
        try {
          ctrl.releasePointerCapture(e.pointerId);
        } catch (err) {}
      }
    }

    const cx = r.left + r.width / 2;
    const cy = r.top + r.height / 2;

    let nx = (e.clientX - cx) / (r.width / 2);
    let ny = (e.clientY - cy) / (r.height / 2);

    nx = Math.max(-1, Math.min(1, nx));
    ny = Math.max(-1, Math.min(1, ny));

    // Map controller direction to a virtual mouse position relative to canvas center
    st.mouse = {
      x: w / 2 + nx * (w / 2),
      y: h / 2 + ny * (h / 2),
    };

    // update knob position inside controller
    const knob = knobRef.current;
    if (knob && r.width && r.height) {
      const max = Math.max(0, r.width / 2 - 12); // leave padding for knob
      const kx = nx * max;
      const ky = ny * max;

      if (controllerActiveRef.current) {
        knob.style.transition = "none";
      } else {
        knob.style.transition = "transform 150ms ease";
      }

      knob.style.transform = `translate(${kx}px, ${ky}px)`;
    }

    // Double-tap detection when pointerdown (active true)
    if (active) {
      const now = Date.now();
      const last = lastTapTimeRef.current;
      const lp = lastTapPosRef.current;
      const dx = e.clientX - (lp.x || 0);
      const dy = e.clientY - (lp.y || 0);
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (
        now - last < BOOST_DOUBLE_TAP_MS &&
        dist < BOOST_MOVE_THRESHOLD &&
        now > boostCooldownRef.current
      ) {
        // trigger boost for a short duration
        if (boostTimeoutRef.current) {
          clearTimeout(boostTimeoutRef.current);
        }

        st.boost = true;
        boostCooldownRef.current = now + BOOST_COOLDOWN;

        boostTimeoutRef.current = setTimeout(() => {
          const s2 = stateRef.current;
          if (s2) s2.boost = false;
          boostTimeoutRef.current = null;
        }, BOOST_DURATION);
      }

      lastTapTimeRef.current = now;
      lastTapPosRef.current = { x: e.clientX, y: e.clientY };
    }
  }, []);

  const finish = useCallback(
    (escaped) => {
      const st = stateRef.current;

      if (!st || exitedRef.current) return;

      exitedRef.current = true;
      st.over = true;

      const me = st.snakes[0];

      onExit({
        score: escaped ? Math.round(me.score) : 0,
        kills: st.kills,
        escaped,
        stake,
      });
    },
    [onExit, stake]
  );

  useEffect(() => {
    const canvas = canvasRef.current;

    if (!canvas) return;

    const ctx = canvas.getContext("2d");

    if (!ctx) return;

    const makeSnake = (id, bot) => {
      const x = 200 + Math.random() * (WORLD - 400);
      const y = 200 + Math.random() * (WORLD - 400);
      const angle = Math.random() * Math.PI * 2;

      return {
        id,
        name: bot
          ? BOT_NAMES[id % BOT_NAMES.length] ?? "bot"
          : handle,
        hue: bot ? 200 + Math.random() * 140 : 172,

        body: Array.from({ length: 14 }, (_, i) => ({
          x: x - Math.cos(angle) * i * SEG_GAP,
          y: y - Math.sin(angle) * i * SEG_GAP,
        })),

        angle,
        target: angle,
        speed: BASE_SPEED,
        score: bot ? 40 + Math.random() * 260 : 0,
        alive: true,
        bot,
      };
    };

    const snakes = [makeSnake(0, false)];

    for (let i = 1; i <= 9; i++) {
      snakes.push(makeSnake(i, true));
    }

    const orbs = Array.from({ length: 700 }, makeOrb);

    const st = {
      snakes,
      orbs,
      mouse: { x: 0, y: 0 },
      boost: false,
      kills: 0,
      over: false,
    };

    stateRef.current = st;

    const resize = () => {
      const dpr = Math.min(2, window.devicePixelRatio || 1);

      canvas.width = canvas.clientWidth * dpr;
      canvas.height = canvas.clientHeight * dpr;

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    resize();

    window.addEventListener("resize", resize);

    const onMove = (e) => {
      const r = canvas.getBoundingClientRect();

      st.mouse = {
        x: e.clientX - r.left,
        y: e.clientY - r.top,
      };
    };

    const onDown = (e) => {
      onMove(e);

      canvas.setPointerCapture(e.pointerId);

      st.boost = true;
    };

    const onUp = (e) => {
      if (canvas.hasPointerCapture(e.pointerId)) {
        canvas.releasePointerCapture(e.pointerId);
      }

      st.boost = false;
    };

    const onKey = (e) => {
      if (e.code === "Space") {
        e.preventDefault();

        st.boost = e.type === "keydown";
      }

      if (
        e.type === "keydown" &&
        e.key.toLowerCase() === "e"
      ) {
        finish(true);
      }
    };

    canvas.addEventListener("pointermove", onMove);
    canvas.addEventListener("pointerdown", onDown);
    canvas.addEventListener("pointerup", onUp);
    canvas.addEventListener("pointercancel", onUp);

    window.addEventListener("keydown", onKey);
    window.addEventListener("keyup", onKey);

    let raf = 0;
    let hudTick = 0;

    const step = () => {
      raf = requestAnimationFrame(step);

      if (st.over) return;

      const me = st.snakes[0];

      const w = canvas.clientWidth;
      const h = canvas.clientHeight;

      // -----------------------------
      // Player movement
      // -----------------------------

      if (me.alive) {
        const dx = st.mouse.x - w / 2;
        const dy = st.mouse.y - h / 2;

        if (dx || dy) {
          me.target = Math.atan2(dy, dx);
        }

        me.speed =
          st.boost && me.score > 10
            ? BOOST_SPEED
            : BASE_SPEED;

        if (st.boost && me.score > 10) {
          me.score -= 0.06;
        }
      }

      // -----------------------------
      // Snake movement
      // -----------------------------

      for (const s of st.snakes) {
        if (!s.alive) continue;

        const prevHead = s.body[0];

        // Bot AI
        if (s.bot) {
          let best;
          let bd = Infinity;

          for (let i = 0; i < st.orbs.length; i += 7) {
            const o = st.orbs[i];

            const d =
              (o.x - prevHead.x) ** 2 +
              (o.y - prevHead.y) ** 2;

            if (d < bd) {
              bd = d;
              best = o;
            }
          }

          if (best) {
            s.target = Math.atan2(
              best.y - prevHead.y,
              best.x - prevHead.x
            );
          }

          const margin = 200;

          if (
            prevHead.x < margin ||
            prevHead.x > WORLD - margin ||
            prevHead.y < margin ||
            prevHead.y > WORLD - margin
          ) {
            s.target = Math.atan2(
              WORLD / 2 - prevHead.y,
              WORLD / 2 - prevHead.x
            );
          }

          s.speed = BASE_SPEED * 0.95;
        }

        let diff = s.target - s.angle;

        while (diff > Math.PI) {
          diff -= Math.PI * 2;
        }

        while (diff < -Math.PI) {
          diff += Math.PI * 2;
        }

        s.angle += Math.max(
          -0.09,
          Math.min(0.09, diff)
        );

        const nx =
          prevHead.x +
          Math.cos(s.angle) * s.speed * 2.2;

        const ny =
          prevHead.y +
          Math.sin(s.angle) * s.speed * 2.2;

        s.body.unshift({
          x: nx,
          y: ny,
        });

        while (s.body.length > len(s)) {
          s.body.pop();
        }

        // World boundary
        if (
          nx < 0 ||
          ny < 0 ||
          nx > WORLD ||
          ny > WORLD
        ) {
          s.alive = false;

          if (s.id === 0) {
            finish(false);
          }
        }

        // Collect orbs
        for (let i = 0; i < st.orbs.length; i++) {
          const o = st.orbs[i];

          if (
            (o.x - nx) ** 2 +
              (o.y - ny) ** 2 <
            (radius(s) + 8) ** 2
          ) {
            s.score += o.value;

            st.orbs[i] = makeOrb();
          }
        }
      }

      // -----------------------------
      // Snake collisions
      // -----------------------------

      for (const s of st.snakes) {
        if (!s.alive) continue;

        const head = s.body[0];

        for (const other of st.snakes) {
          if (other === s || !other.alive) {
            continue;
          }

          for (
            let i = 4;
            i < other.body.length;
            i += 2
          ) {
            const seg = other.body[i];

            if (
              (seg.x - head.x) ** 2 +
                (seg.y - head.y) ** 2 <
              (radius(s) + radius(other)) ** 2
            ) {
              s.alive = false;

              other.score +=
                25 + s.score * 0.4;

              if (other.id === 0) {
                st.kills += 1;
              }

              // Drop orbs from dead snake
              for (
                let k = 0;
                k < s.body.length;
                k += 2
              ) {
                const seg2 = s.body[k];

                st.orbs.push({
                  x: seg2.x,
                  y: seg2.y,
                  value: 3,
                  hue: 20,
                });
              }

              if (s.id === 0) {
                finish(false);
              }

              break;
            }
          }
        }
      }

      // -----------------------------
      // Respawn bots
      // -----------------------------

      for (const s of st.snakes) {
        if (!s.alive && s.bot) {
          Object.assign(
            s,
            makeSnake(s.id, true)
          );
        }
      }

      if (st.orbs.length > 900) {
        st.orbs.splice(
          0,
          st.orbs.length - 900
        );
      }

      // -----------------------------
      // Render
      // -----------------------------

      const meHead = me.body[0];

      const cam = {
        x: meHead.x - w / 2,
        y: meHead.y - h / 2,
      };

      // Background
      ctx.fillStyle = "#071016";

      ctx.fillRect(0, 0, w, h);

      // Grid
      ctx.strokeStyle =
        "rgba(90,220,205,0.07)";

      ctx.lineWidth = 1;

      const grid = 80;

      for (
        let x = (-cam.x % grid);
        x < w;
        x += grid
      ) {
        ctx.beginPath();

        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);

        ctx.stroke();
      }

      for (
        let y = (-cam.y % grid);
        y < h;
        y += grid
      ) {
        ctx.beginPath();

        ctx.moveTo(0, y);
        ctx.lineTo(w, y);

        ctx.stroke();
      }

      // World border
      ctx.strokeStyle =
        "rgba(255,90,80,0.5)";

      ctx.lineWidth = 3;

      ctx.strokeRect(
        -cam.x,
        -cam.y,
        WORLD,
        WORLD
      );

      // -----------------------------
      // Orbs
      // -----------------------------

      for (const o of st.orbs) {
        const sx = o.x - cam.x;
        const sy = o.y - cam.y;

        if (
          sx < -20 ||
          sy < -20 ||
          sx > w + 20 ||
          sy > h + 20
        ) {
          continue;
        }

        ctx.beginPath();

        ctx.fillStyle = `hsla(${o.hue}, 80%, 65%, 0.9)`;

        ctx.arc(
          sx,
          sy,
          2 + o.value,
          0,
          Math.PI * 2
        );

        ctx.fill();
      }

      // -----------------------------
      // Snakes
      // -----------------------------

      for (const s of st.snakes) {
        if (!s.alive) continue;

        const r = radius(s);

        ctx.lineCap = "round";
        ctx.lineJoin = "round";

        ctx.strokeStyle = `hsla(
          ${s.hue},
          75%,
          ${s.bot ? 55 : 62}%,
          0.95
        )`;

        ctx.shadowColor = `hsla(
          ${s.hue},
          85%,
          60%,
          0.9
        )`;

        ctx.shadowBlur = s.bot ? 8 : 18;

        ctx.lineWidth = r * 2;

        ctx.beginPath();

        s.body.forEach((p, i) => {
          const sx = p.x - cam.x;
          const sy = p.y - cam.y;

          if (i === 0) {
            ctx.moveTo(sx, sy);
          } else {
            ctx.lineTo(sx, sy);
          }
        });

        ctx.stroke();

        ctx.shadowBlur = 0;

        // Player/bot name
        const sHead = s.body[0];

        ctx.fillStyle =
          "rgba(230,255,252,0.75)";

        ctx.font =
          "10px 'JetBrains Mono', monospace";

        ctx.textAlign = "center";

        ctx.fillText(
          s.name.toUpperCase(),
          sHead.x - cam.x,
          sHead.y - cam.y - r - 8
        );
      }

      // -----------------------------
      // Mini map (circular)
      // -----------------------------

      const mm = 110;

      const cx = w - mm / 2 - 16;
      const cy = h - mm / 2 - 16;
      const r = mm / 2;

      // background circle
      ctx.beginPath();
      ctx.fillStyle = "rgba(6,18,24,0.75)";
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fill();

      // stroke
      ctx.beginPath();
      ctx.strokeStyle = "rgba(90,220,205,0.35)";
      ctx.lineWidth = 1;
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.stroke();

      // draw markers (clipped to circle)
      for (const s of st.snakes) {
        if (!s.alive) continue;

        const sHead = s.body[0];

        ctx.fillStyle = s.bot
          ? "rgba(150,180,200,0.7)"
          : "#5eead4";

        // normalize to center-based coordinates
        const nx = (sHead.x / WORLD - 0.5) * mm;
        const ny = (sHead.y / WORLD - 0.5) * mm;

        const px = cx + nx;
        const py = cy + ny;

        const dx = px - cx;
        const dy = py - cy;

        // only draw markers inside the circle (leave small margin)
        if (dx * dx + dy * dy > (r - 4) * (r - 4)) continue;

        ctx.beginPath();
        ctx.arc(px, py, s.bot ? 1 : 2, 0, Math.PI * 2);
        ctx.fill();
      }

      // -----------------------------
      // HUD update
      // -----------------------------

      if (++hudTick % 6 === 0) {
        setHud({
          score: Math.round(me.score),
          kills: st.kills,
          alive: me.alive,
          boost: st.boost,
        });
      }
    };

    raf = requestAnimationFrame(step);

    return () => {
      cancelAnimationFrame(raf);

      window.removeEventListener(
        "resize",
        resize
      );

      canvas.removeEventListener(
        "pointermove",
        onMove
      );

      canvas.removeEventListener(
        "pointerdown",
        onDown
      );

      canvas.removeEventListener(
        "pointerup",
        onUp
      );

      canvas.removeEventListener(
        "pointercancel",
        onUp
      );

      window.removeEventListener(
        "keydown",
        onKey
      );

      window.removeEventListener(
        "keyup",
        onKey
      );
    };
  }, [handle, finish]);

  const atRisk =
    stake > 0
      ? stake + Math.round(hud.score * 0.4)
      : Math.round(hud.score);

  return (
    <div className="relative h-[calc(100svh-3.5rem)] w-full overflow-hidden">
      <canvas
        ref={canvasRef}
        className="h-full w-full touch-none cursor-crosshair"
      />

      {/* Score panel */}
      <div className="pointer-events-none absolute left-2 top-2 w-[7.5rem] panel px-2 py-1.5 sm:left-5 sm:top-5 sm:w-auto sm:px-4 sm:py-3">
        <p className="hidden label-xs text-muted-foreground sm:block">
          Score
        </p>

        <div className="mt-1 flex items-baseline justify-between sm:mt-0 sm:block">
          <span className="label-xs text-muted-foreground sm:hidden">
            Score
          </span>

          <p className="text-lg font-bold text-primary glow-text tabular-nums sm:text-3xl">
            {hud.score}
          </p>
        </div>

        <div className="mt-1.5 grid grid-cols-[1fr_auto] gap-x-2 gap-y-0.5 border-t border-border/60 pt-1.5 sm:mt-3 sm:grid-cols-2 sm:gap-x-6 sm:gap-y-1 sm:border-0 sm:pt-0">
          <span className="label-xs text-muted-foreground">
            Takedowns
          </span>

          <span className="text-right text-xs text-foreground tabular-nums">
            {hud.kills}
          </span>

          <span className="label-xs text-muted-foreground">
            At risk
          </span>

          <span className="text-right text-xs text-[color:var(--danger)] tabular-nums">
            {atRisk}
          </span>
        </div>
      </div>

      {/* Match status */}
      <div className="pointer-events-none absolute right-3 top-3 panel px-3 py-2 text-right sm:left-1/2 sm:right-auto sm:top-5 sm:-translate-x-1/2 sm:px-4 sm:text-center">
        <p className="label-xs text-primary">
          Live match
        </p>

        <p className="mt-1 hidden text-[11px] text-muted-foreground sm:block">
          hold to boost · you can still be taken out
        </p>
      </div>

      {/* Exit button */}
      <button
        onClick={() => finish(true)}
        className="absolute bottom-[max(0.75rem,env(safe-area-inset-bottom))] left-4 w-28 border border-primary/60 bg-background/85 px-3 py-2 text-xs text-primary backdrop-blur transition-colors hover:bg-primary/20 sm:bottom-6 sm:left-6 sm:w-32 sm:px-4"
      >
        Leave · {hud.score}
      </button>

      {/* On-screen circular controller (right-bottom) */}
      <div
        ref={controllerRef}
        onPointerDown={(e) => handleControllerPointer(e, true)}
        onPointerMove={(e) => {
          if (controllerActiveRef.current) handleControllerPointer(e, true);
        }}
        onPointerUp={(e) => handleControllerPointer(e, false)}
        onPointerCancel={(e) => handleControllerPointer(e, false)}
        className="pointer-events-auto absolute right-4 bottom-4 w-28 h-28 rounded-full bg-[rgba(6,18,24,0.45)] border border-[rgba(90,220,205,0.35)] flex items-center justify-center touch-none"
        style={{
          backdropFilter: "blur(6px)",
        }}
      >
        <div
          ref={knobRef}
          className="w-8 h-8 rounded-full bg-primary/80"
          style={{ transform: "translate(0, 0)", touchAction: "none" }}
        />
      </div>
    </div>
  );
}
