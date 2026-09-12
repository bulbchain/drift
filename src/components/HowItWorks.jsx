import { Link } from "react-router-dom";
import { SiteNav } from "./SiteNav";

// export const Route = createFileRoute("/how-it-works")({
//   head: () => ({
//     meta: [
//       { title: "How It Works — Driftline Staked Arena Runs" },
//       {
//         name: "description",
//         content:
//           "How a Driftline run works: enter the live arena, grow on light, take down rivals, and leave before someone banks your score.",
//       },
//       { property: "og:title", content: "How It Works — Driftline Staked Arena Runs" },
//       {
//         property: "og:description",
//         content: "Enter, grow, hunt, and escape. Everything you keep is what you walk out with.",
//       },
//       { property: "og:type", content: "website" },
//       { name: "twitter:card", content: "summary_large_image" },
//     ],
//   }),
//   component: HowItWorks,
// });

const steps = [
  { n: "01", title: "Enter the arena", body: "Pick a handle and drop into a live lobby with everyone else currently playing. Free arena needs no wallet." },
  { n: "02", title: "Grow on light", body: "Collect drifting light to lengthen your line and raise your score. Boosting is faster but burns score." },
  { n: "03", title: "Hunt rivals", body: "Cut in front of another line and they break apart — everything they were carrying spills out for you to take." },
  { n: "04", title: "Leave before you lose it", body: "Nothing is yours until you leave the run. Touch a wall or a rival and the whole score goes back into the arena." },
];

export default function HowItWorks() {
  return (
    <>
      <SiteNav />
      <main className="mx-auto max-w-3xl px-4 py-10 sm:px-5 sm:py-16">
        <h1 className="text-3xl font-bold glow-text sm:text-4xl">HOW IT WORKS</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          One arena, everyone at once, and one decision that matters: when to walk away.
        </p>

        <ol className="mt-8 space-y-4 sm:mt-12 sm:space-y-6">
          {steps.map((s) => (
            <li key={s.n} className="panel grid grid-cols-[2.25rem_minmax(0,1fr)] gap-3 px-4 py-4 sm:grid-cols-[2.5rem_minmax(0,1fr)] sm:gap-5 sm:px-5 sm:py-5">
              <span className="text-xl font-bold text-primary/60 tabular-nums sm:text-2xl">{s.n}</span>
              <div className="min-w-0">
                <h2 className="text-base font-bold text-foreground">{s.title}</h2>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{s.body}</p>
              </div>
            </li>
          ))}
        </ol>

        <section className="mt-8 panel border-[color:var(--gold)]/40 px-4 py-5 sm:mt-12 sm:px-5">
          <h2 className="label-xs text-[color:var(--gold)]">Staked runs</h2>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            Staked lobbies settle in SOL. You lock a stake before entering, and escaping alive
            returns it along with your winnings. Getting taken out forfeits it to the arena. Only
            stake what you are comfortable losing.
          </p>
          <Link
            to="/"
            className="mt-5 inline-block border border-primary/60 bg-primary/10 px-5 py-3 label-xs text-primary transition-colors hover:bg-primary/20"
          >
            Start a run
          </Link>
        </section>
      </main>
    </>
  );
}
