"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type ItemNav = {
  rotulo: string;
  href?: string;
  icone: string;
};

const ITENS_NAV: ItemNav[] = [
  { rotulo: "Dashboard", href: "/", icone: "bi-grid-1x2-fill" },
  { rotulo: "Setores", href: "/setores", icone: "bi-building" },
  { rotulo: "Reservas", icone: "bi-calendar-check" },
  { rotulo: "Lista de espera", icone: "bi-hourglass-split" },
  { rotulo: "Ranking", icone: "bi-bar-chart-fill" },
  { rotulo: "Histórico", icone: "bi-clock-history" },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside
      className="d-flex flex-column flex-shrink-0 text-white"
      style={{ width: "260px", backgroundColor: "#0b1633" }}
    >
      <div className="d-flex align-items-center gap-2 px-4 py-4">
        <span
          className="d-flex align-items-center justify-content-center rounded"
          style={{ width: "36px", height: "36px", backgroundColor: "#2563eb" }}
        >
          <i className="bi bi-car-front-fill" />
        </span>
        <div className="lh-sm">
          <div className="fw-bold">PARK</div>
          <div className="fw-bold" style={{ color: "#4f8dfd" }}>
            CENTRAL
          </div>
        </div>
      </div>

      <nav className="flex-grow-1 px-2">
        <ul className="nav nav-pills flex-column gap-1">
          {ITENS_NAV.map((item) => {
            const ativo = item.href !== undefined && pathname === item.href;
            const classeBase =
              "nav-link d-flex align-items-center gap-2 rounded-2 px-3 py-2";

            if (!item.href) {
              return (
                <li key={item.rotulo} className="nav-item">
                  <span
                    className={`${classeBase} text-white-50`}
                    style={{ cursor: "not-allowed", opacity: 0.5 }}
                    aria-disabled="true"
                  >
                    <i className={`bi ${item.icone}`} />
                    {item.rotulo}
                  </span>
                </li>
              );
            }

            return (
              <li key={item.rotulo} className="nav-item">
                <Link
                  href={item.href}
                  className={`${classeBase} ${ativo ? "active bg-primary text-white" : "text-white-50"}`}
                >
                  <i className={`bi ${item.icone}`} />
                  {item.rotulo}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}
