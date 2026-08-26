"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/", label: "Dashboard", icon: "bi-speedometer2", match: "exact" },
  { href: "/setores", label: "Setores", icon: "bi-building", match: "prefix" },
  {
    href: "/reservas",
    label: "Reservas",
    icon: "bi-p-circle",
    match: "prefix",
  },
  {
    href: "/lista-espera",
    label: "Lista de espera",
    icon: "bi-people",
    match: "exact",
  },
  { href: "/ranking", label: "Ranking", icon: "bi-bar-chart", match: "exact" },
  {
    href: "/historico",
    label: "Histórico",
    icon: "bi-clock-history",
    match: "prefix",
  },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  function isActive(href: string, match?: string) {
    if (href === "#") return false;
    if (match === "prefix") return pathname.startsWith(href);
    return pathname === href;
  }

  return (
    <div className="park-shell d-flex">
      <aside className="park-sidebar d-flex flex-column flex-shrink-0 p-3">
        <div className="d-flex align-items-center gap-2 px-1 py-2 mb-4">
          <span
            className="bg-primary rounded-2 d-inline-flex align-items-center justify-content-center"
            style={{ width: 36, height: 36 }}
          >
            <i className="bi bi-p-circle-fill fs-5" />
          </span>
          <span className="park-brand">PARK CENTRAL</span>
        </div>

        <nav className="nav flex-column gap-1 flex-grow-1">
          {links.map((item) => {
            const active = isActive(item.href, item.match);
            const className = `park-nav-link${active ? " active" : ""}`;
            if (item.href === "#") {
              return (
                <a key={item.label} className={className} href="#">
                  <i className={`bi ${item.icon}`} /> {item.label}
                </a>
              );
            }
            return (
              <Link
                key={item.label}
                className={className}
                href={item.href}
                aria-current={active ? "page" : undefined}
              >
                <i className={`bi ${item.icon}`} /> {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>

      <main className="park-main flex-grow-1 p-4 p-lg-5">{children}</main>
    </div>
  );
}
