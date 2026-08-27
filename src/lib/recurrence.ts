import { addDays, addMonths, addYears, isAfter, parseISO, format } from "date-fns";

import type { Recurrence } from "./db";

export type RepeatRule = Recurrence | "weekly";

const MONTH_STEP: Record<string, number> = {
  monthly: 1,
  quarterly: 3,
  biannual: 6,
};

/** Siguiente fecha de un recordatorio periódico, o null si es de una sola vez. */
export function nextOccurrence(dateISO: string, repeat: RepeatRule, from: Date = new Date()): string | null {
  if (repeat === "once") return null;
  let cursor = parseISO(dateISO);
  let guard = 0;
  do {
    if (repeat === "weekly") cursor = addDays(cursor, 7);
    else if (repeat === "annual") cursor = addYears(cursor, 1);
    else cursor = addMonths(cursor, MONTH_STEP[repeat] ?? 1);
    guard += 1;
  } while (!isAfter(cursor, from) && guard < 600);
  return format(cursor, "yyyy-MM-dd");
}

export const REPEAT_LABELS: Record<RepeatRule, string> = {
  once: "Una vez",
  weekly: "Semanal",
  monthly: "Mensual",
  quarterly: "Trimestral",
  biannual: "Semestral",
  annual: "Anual",
};
