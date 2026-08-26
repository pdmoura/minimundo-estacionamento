"use client";

import { useEffect, useState } from "react";

const dataHora = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "short",
  timeStyle: "short",
});

export function FormatDate({ value }: { value: string }) {
  const [label, setLabel] = useState("");

  useEffect(() => {
    setLabel(dataHora.format(new Date(value)));
  }, [value]);

  return <>{label || "—"}</>;
}
