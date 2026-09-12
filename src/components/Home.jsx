
import { useState } from "react";
import { SiteNav } from "./SiteNav";
import { ArenaGame } from "./ArenaGame";


// export const Route = createFileRoute("/")({
//   head: () => ({
//     meta: [
//       {
//         title: "Driftline — Neon Arena Snake with Solana Stakes",
//       },
//       {
//         name: "description",
//         content:
//           "Driftline is a live neon arena where players grow, hunt and escape. Play free, or stake on the Solana chain and bank what you survive with.",
//       },
//       {
//         property: "og:title",
//         content:
//           "Driftline — Neon Arena Snake with Solana Stakes",
//       },
//       {
//         property: "og:description",
//         content:
//           "Grow, hunt rivals, and leave the run before someone takes your score.",
//       },
//       {
//         property: "og:type",
//         content: "website",
//       },
//       {
//         name: "twitter:card",
//         content: "summary_large_image",
//       },
//     ],
//   }),

//   component: Home,
// });

export default function Home() {
  const [handle, setHandle] = useState("");
  const [mode, setMode] = useState("free");
  const [stake, setStake] = useState(0.25);
  const [wallet, setWallet] = useState(null);
  const [playing, setPlaying] = useState(false);
  const [result, setResult] = useState(null);

  const canStake = mode === "stake" && !wallet;

  if (playing) {
    return (
      <>
        <SiteNav />

        <ArenaGame
          handle={handle || "you"}
          stake={mode === "stake" ? stake * 1000 : 0}
          onExit={(r) => {
            setResult(r);
            setPlaying(false);
          }}
        />
      </>
    );
  }

  return (
    <>
      <SiteNav />

      <main className="scanlines relative flex min-h-[calc(100svh-3.5rem)] flex-col items-center justify-center px-4 py-10 sm:px-5 sm:py-16">
        <h1 className="max-w-full text-center text-5xl font-bold text-foreground glow-text sm:text-8xl">
          DRIFTLINE
        </h1>

        <p className="mt-3 text-center font-serif text-base italic text-muted-foreground sm:text-lg">
          feed on light · outgrow the dark
        </p>

        {/* Result */}
        {result && (
          <div className="mt-6 panel w-full max-w-md px-4 py-4 text-center sm:mt-8 sm:px-5">
            <p className="label-xs text-primary">
              {result.escaped ? "Run banked" : "Run lost"}
            </p>

            <p className="mt-2 text-3xl font-bold tabular-nums">
              {result.score}
            </p>

            <p className="mt-1 text-xs text-muted-foreground">
              {result.kills} takedowns ·{" "}
              {result.escaped
                ? result.stake > 0
                  ? "stake returned with winnings"
                  : "added to the glory board"
                : "stake burned in the dark"}
            </p>
          </div>
        )}

        <div className="mt-8 w-full max-w-md sm:mt-10">
          {/* Handle */}
          <label
            className="sr-only"
            htmlFor="handle"
          >
            Your handle
          </label>

          <input
            id="handle"
            value={handle}
            onChange={(e) =>
              setHandle(e.target.value.slice(0, 14))
            }
            placeholder="YOUR HANDLE"
            className="w-full border border-border bg-card/60 px-4 py-3.5 label-xs text-foreground outline-none placeholder:text-muted-foreground focus:border-primary focus:ring-1 focus:ring-ring sm:py-4"
          />

          {/* Controls */}
          <div className="mt-3 grid grid-cols-2 gap-2 sm:gap-3">
            <button
              onClick={() =>
                setWallet(
                  wallet ? null : "7Fz…9kQd"
                )
              }
              className="min-w-0 border border-border px-2 py-3 text-[0.6rem] uppercase text-muted-foreground transition-colors hover:border-primary hover:text-primary sm:px-4 sm:label-xs"
            >
              {wallet
                ? `Wallet ${wallet}`
                : "Connect wallet"}
            </button>

            <button
              onClick={() =>
                setMode(
                  mode === "free"
                    ? "stake"
                    : "free"
                )
              }
              className="min-w-0 border border-border px-2 py-3 text-[0.6rem] uppercase text-muted-foreground transition-colors hover:border-primary hover:text-primary sm:px-4 sm:label-xs"
            >
              {mode === "free"
                ? "Free arena"
                : "Staked run"}
            </button>
          </div>

          {/* Stake controls */}
          {mode === "stake" && (
            <div className="mt-3 panel px-4 py-3">
              <div className="flex items-center justify-between">
                <span className="label-xs text-muted-foreground">
                  Stake (SOL)
                </span>

                <span className="text-sm font-bold text-[color:var(--gold)] tabular-nums">
                  {stake.toFixed(2)}
                </span>
              </div>

              <input
                type="range"
                min={0.05}
                max={2}
                step={0.05}
                value={stake}
                onChange={(e) =>
                  setStake(
                    Number(e.target.value)
                  )
                }
                className="mt-3 w-full accent-[color:var(--primary)]"
              />

              <p className="mt-2 text-[11px] text-muted-foreground">
                Escape alive to keep your stake plus
                what you collected. Get hit and it drops
                into the arena for the rest of the lobby.
              </p>
            </div>
          )}

          {/* Play */}
          <button
            onClick={() => {
              setResult(null);
              setPlaying(true);
            }}
            disabled={canStake}
            className="mt-6 w-full bg-primary py-4 text-base font-bold uppercase text-primary-foreground shadow-[var(--glow-primary)] transition-transform hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-40 sm:mt-8 sm:py-5 sm:text-lg"
          >
            PLAY
          </button>

          {canStake && (
            <p className="mt-2 text-center text-[11px] text-[color:var(--danger)]">
              Connect a wallet to enter a staked run.
            </p>
          )}

          {/* Instructions */}
          <p className="mt-5 text-center text-[11px] leading-relaxed text-muted-foreground sm:mt-6 sm:text-xs">
            <span className="text-primary">
              Drag or move
            </span>{" "}
            to steer ·{" "}
            <span className="text-primary">
              Press and hold
            </span>{" "}
            to boost ·{" "}
            <span className="text-primary">
              Never touch
            </span>{" "}
            another line
          </p>
        </div>

        {/* Game modes */}
        <div className="mt-8 grid w-full max-w-2xl grid-cols-1 gap-3 sm:mt-12 sm:grid-cols-2">
          <div className="panel px-4 py-4 text-center">
            <p className="label-xs text-primary">
              Free arena
            </p>

            <p className="mt-1 text-[11px] text-muted-foreground">
              play now · no wallet · glory board
            </p>
          </div>

          <div className="panel border-[color:var(--gold)]/40 px-4 py-4 text-center">
            <p className="label-xs text-[color:var(--gold)]">
              Staked run
            </p>

            <p className="mt-1 text-[11px] text-muted-foreground">
              risk SOL · hunt players · escape with what you take
            </p>
          </div>
        </div>
      </main>
    </>
  );
}
