import { addMonths, addYears, isAfter, isBefore, parseISO, format } from "date-fns";
import type { Movement, Recurrence } from "./db";

export interface Occurrence {
  movement: Movement;
  date: Date;
}

const STEP_MONTHS: Record<Exclude<Recurrence, "once" | "annual">, number> = {
  monthly: 1,
  quarterly: 3,
  biannual: 6,
};

/** Expande un movimiento periódico en las fechas que caen dentro del rango. */
export function occurrencesInRange(movement: Movement, from: Date, to: Date): Occurrence[] {
  const start = parseISO(movement.date);
  const out: Occurrence[] = [];

  if (movement.recurrence === "once") {
    if (!isBefore(start, from) && !isAfter(start, to)) out.push({ movement, date: start });
    return out;
  }

  let cursor = start;
  let guard = 0;
  while (isBefore(cursor, from) && guard < 600) {
    cursor = next(cursor, movement.recurrence);
    guard += 1;
  }
  while (!isAfter(cursor, to) && guard < 600) {
    if (!isBefore(cursor, from)) out.push({ movement, date: cursor });
    cursor = next(cursor, movement.recurrence);
    guard += 1;
  }
  return out;
}

function next(date: Date, recurrence: Recurrence): Date {
  if (recurrence === "annual") return addYears(date, 1);
  if (recurrence === "once") return addYears(date, 100);
  return addMonths(date, STEP_MONTHS[recurrence]);
}

export function expandAll(movements: Movement[], from: Date, to: Date): Occurrence[] {
  return movements
    .flatMap((m) => occurrencesInRange(m, from, to))
    .sort((a, b) => a.date.getTime() - b.date.getTime());
}

export interface Totals {
  income: number;
  expense: number;
  balance: number;
}

export function totals(occurrences: Occurrence[]): Totals {
  let income = 0;
  let expense = 0;
  for (const o of occurrences) {
    if (o.movement.type === "income") income += o.movement.amount;
    else expense += o.movement.amount;
  }
  return { income, expense, balance: income - expense };
}

export function byCategory(occurrences: Occurrence[]): { category: string; total: number }[] {
  const map = new Map<string, number>();
  for (const o of occurrences) {
    if (o.movement.type !== "expense") continue;
    map.set(o.movement.category, (map.get(o.movement.category) ?? 0) + o.movement.amount);
  }
  return [...map.entries()]
    .map(([category, total]) => ({ category, total }))
    .sort((a, b) => b.total - a.total);
}

export const euro = (n: number) =>
  new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n);

export const euro2 = (n: number) =>
  new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(n);

export const isoDay = (d: Date) => format(d, "yyyy-MM-dd");

export const CATEGORIES = [
  "Vivienda",
  "Impuestos",
  "Coche",
  "Suscripciones",
  "Colegio",
  "Cumpleaños",
  "Alimentación",
  "Ocio",
  "Otros",
] as const;

export const RECURRENCE_LABELS: Record<Recurrence, string> = {
  once: "Único",
  monthly: "Mensual",
  quarterly: "Trimestral",
  biannual: "Semestral",
  annual: "Anual",
};
