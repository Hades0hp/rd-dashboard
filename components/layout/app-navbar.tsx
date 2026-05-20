"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const navItems = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/tasks", label: "Tasks" },
  { href: "/blockers", label: "Blockers" },
  { href: "/projects", label: "Projects" },
  { href: "/people", label: "People" },
  { href: "/timeframes", label: "Timeframes" },
];

function isActive(pathname: string, href: string) {
  if (href === "/dashboard") return pathname === "/dashboard";
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function AppNavbar() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 8);
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-50 border-b transition-all duration-300 ${
        scrolled
          ? "border-slate-100 bg-white/60 shadow-sm backdrop-blur-md"
          : "border-transparent bg-white backdrop-blur-none"
      }`}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center transition hover:opacity-80">
            <Image
              src="/logo2.svg"
              alt="READ Logo"
              width={64}
              height={64}
              className="h-12 w-12"
              priority
            />
          </Link>

          <nav className="hidden items-center gap-2 md:flex">
            {navItems.map((item) => {
              const active = isActive(pathname, item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`rounded-xl px-3 py-2 text-sm font-medium transition ${
                    active
                      ? "bg-slate-900 text-white"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        <Link
          href="/"
          className="hidden rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 md:inline-flex"
        >
          Home
        </Link>
      </div>

      <div
        className={`border-t md:hidden transition-colors duration-300 ${
          scrolled ? "border-slate-200 bg-white" : "border-transparent bg-white"
        }`}
      >
        <div className="mx-auto flex max-w-7xl gap-2 overflow-x-auto px-4 py-3">
          {navItems.map((item) => {
            const active = isActive(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`whitespace-nowrap rounded-xl px-3 py-2 text-sm font-medium transition ${
                  active ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-700"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </div>
      </div>
    </header>
  );
}