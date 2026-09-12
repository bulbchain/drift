
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
      // Mini map
      // -----------------------------

      const mm = 110;

      ctx.fillStyle =
        "rgba(6,18,24,0.75)";

      ctx.fillRect(
        w - mm - 16,
        h - mm - 16,
        mm,
        mm
      );

      ctx.strokeStyle =
        "rgba(90,220,205,0.35)";

      ctx.lineWidth = 1;

      ctx.strokeRect(
        w - mm - 16,
        h - mm - 16,
        mm,
        mm
      );

      for (const s of st.snakes) {
        if (!s.alive) continue;

        const sHead = s.body[0];

        ctx.fillStyle = s.bot
          ? "rgba(150,180,200,0.7)"
          : "#5eead4";

        const px =
          w -
          mm -
          16 +
          (sHead.x / WORLD) * mm;

        const py =
          h -
          mm -
          16 +
          (sHead.y / WORLD) * mm;

        ctx.fillRect(
          px - 1,
          py - 1,
          s.bot ? 2 : 4,
          s.bot ? 2 : 4
        );
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
        <p className="label-xs text-muted-foreground sm:hidden">
          Control panel
        </p>

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
        className="absolute bottom-[max(1rem,env(safe-area-inset-bottom))] left-1/2 w-[calc(100%-2rem)] max-w-xs -translate-x-1/2 border border-primary/60 bg-background/85 px-4 py-3 label-xs text-primary backdrop-blur transition-colors hover:bg-primary/20 sm:bottom-6 sm:w-auto sm:max-w-none sm:bg-primary/10 sm:px-6"
      >
        Leave run (E) · bank {hud.score}
      </button>
    </div>
  );
}
