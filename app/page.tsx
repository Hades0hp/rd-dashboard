import Link from "next/link";

export default function HomePage() {
  const links = [
    { href: "/dashboard", label: "Dashboard" },
    { href: "/projects", label: "Projects" },
    { href: "/tasks", label: "Tasks" },
    { href: "/blockers", label: "Blockers" },   // 👈 here
    { href: "/people", label: "People" },
    { href: "/timeframes", label: "Timeframes" },
  ];

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto max-w-6xl px-6 py-12">
        <h1 className="text-4xl font-bold tracking-tight">
          R&D Executive Alignment Dashboard
        </h1>

        <p className="mt-3 max-w-2xl text-slate-600">
          Internal tool for project alignment, task logging, blockers,
          learnings, and timeframe-based executive dashboards.
        </p>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md"
            >
              <div className="text-lg font-semibold">{link.label}</div>

              <div className="mt-1 text-sm text-slate-500">
                Open {link.label} module
              </div>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}