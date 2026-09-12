import { Link } from "react-router-dom";

const links = [
  { to: "/", label: "Play" },
  { to: "/ranks", label: "Ranks" },
  { to: "/how-it-works", label: "How it works" },
];

export function SiteNav() {
  return (
    <header className="sticky top-0 z-30 border-b border-border/70 bg-background/80 backdrop-blur">
      <nav className="mx-auto grid h-14 max-w-6xl grid-cols-[auto_minmax(0,1fr)] items-center gap-4 px-4 sm:gap-8 sm:px-5">
        <Link to="/" className="shrink-0 text-[0.65rem] font-bold uppercase text-primary glow-text sm:label-xs">
          Driftline
        </Link>
        <ul className="flex min-w-0 items-center justify-end gap-3 sm:justify-start sm:gap-6">
          {links.map((l) => (
            <li key={l.to} className="min-w-0">
              <Link
                to={l.to}
                activeOptions={{ exact: l.to === "/" }}
                className="block truncate text-[0.6rem] uppercase text-muted-foreground transition-colors hover:text-foreground data-[status=active]:border-b-2 data-[status=active]:border-primary data-[status=active]:pb-1 data-[status=active]:text-foreground sm:label-xs"
              >
                <span className="sm:hidden">{l.to === "/how-it-works" ? "How" : l.label}</span>
                <span className="hidden sm:inline">{l.label}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  );
}
