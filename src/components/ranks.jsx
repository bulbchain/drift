import { Link } from "react-router-dom";
import { SiteNav } from "./SiteNav";


// export const Route = createFileRoute("/ranks")({
//   head: () => ({
//     meta: [
//       { title: "Ranks — Driftline Arena Leaderboard" },
//       {
//         name: "description",
//         content:
//           "Today's top Driftline runs: highest banked scores, most takedowns and biggest SOL escapes from the arena.",
//       },
//       { property: "og:title", content: "Ranks — Driftline Arena Leaderboard" },
//       {
//         property: "og:description",
//         content: "Highest banked scores and biggest SOL escapes in the Driftline arena.",
//       },
//       { property: "og:type", content: "website" },
//       { name: "twitter:card", content: "summary_large_image" },
//     ],
//   }),
//   component: Ranks,
// });

const rows = [
  { handle: "nyxwave", score: 18420, kills: 31, banked: 4.82 },
  { handle: "sablecut", score: 15990, kills: 24, banked: 3.94 },
  { handle: "quill.eth", score: 13205, kills: 19, banked: 3.1 },
  { handle: "rook_9", score: 11870, kills: 27, banked: 2.75 },
  { handle: "pyrelight", score: 10440, kills: 12, banked: 2.4 },
  { handle: "miradrift", score: 9310, kills: 15, banked: 1.98 },
  { handle: "onyxloop", score: 8125, kills: 9, banked: 1.55 },
  { handle: "kilo_zero", score: 7040, kills: 11, banked: 1.2 },
];

function Ranks() {
  return (
    <>
      <SiteNav />
      <main className="mx-auto max-w-4xl px-4 py-10 sm:px-5 sm:py-16">
        <h1 className="text-3xl font-bold glow-text sm:text-4xl">RANKS</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Last 24 hours. Only banked runs count — dying in the arena scores nothing.
        </p>

        <div className="mt-8 panel overflow-hidden sm:mt-10">
          <div className="grid grid-cols-[2rem_minmax(0,1fr)_3rem_4.5rem] gap-1 border-b border-border px-3 py-3 text-[0.6rem] uppercase text-muted-foreground sm:grid-cols-[3rem_1fr_5rem_6rem] sm:gap-2 sm:px-4 sm:label-xs">
            <span>#</span>
            <span>Handle</span>
            <span className="text-right">Kills</span>
            <span className="text-right">SOL</span>
          </div>
          {rows.map((r, i) => (
            <div
              key={r.handle}
              className="grid grid-cols-[2rem_minmax(0,1fr)_3rem_4.5rem] items-center gap-1 border-b border-border/50 px-3 py-3 text-xs last:border-0 hover:bg-accent/40 sm:grid-cols-[3rem_1fr_5rem_6rem] sm:gap-2 sm:px-4 sm:text-sm"
            >
              <span className={i < 3 ? "text-[color:var(--gold)]" : "text-muted-foreground"}>
                {String(i + 1).padStart(2, "0")}
              </span>
              <span className="truncate">
                <span className="text-foreground">{r.handle}</span>
                <span className="block text-[10px] text-muted-foreground tabular-nums sm:ml-3 sm:inline sm:text-xs">
                  {r.score.toLocaleString()} pts
                </span>
              </span>
              <span className="text-right tabular-nums text-muted-foreground">{r.kills}</span>
              <span className="text-right tabular-nums text-primary">{r.banked.toFixed(2)}</span>
            </div>
          ))}
        </div>
        <p className="mt-4 text-[11px] text-muted-foreground">
          Sample standings shown while the live board is being wired up.
        </p>
      </main>
    </>
  );
}

export default Ranks;
