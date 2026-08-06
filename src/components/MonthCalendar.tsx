import { useMemo, useState } from "react";
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  parseISO,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { es } from "date-fns/locale";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Person, Reminder, Vehicle } from "@/lib/db";
import { URGENCY_CHIP, URGENCY_DOT, reminderLabel, urgency } from "@/lib/reminders-meta";

/** Calendario mensual con los eventos/recordatorios del mes. */
export function MonthCalendar({
  reminders,
  people,
  vehicles,
}: {
  reminders: Reminder[];
  people: Person[];
  vehicles: Vehicle[];
}) {
  const [monthOffset, setMonthOffset] = useState(0);
  const [selected, setSelected] = useState<Date | null>(null);

  const cursor = addMonths(new Date(), monthOffset);
  const days = useMemo(
    () =>
      eachDayOfInterval({
        start: startOfWeek(startOfMonth(cursor), { weekStartsOn: 1 }),
        end: endOfWeek(endOfMonth(cursor), { weekStartsOn: 1 }),
      }),
    [cursor.getFullYear(), cursor.getMonth()],
  );

  const byDay = useMemo(() => {
    const map = new Map<string, Reminder[]>();
    for (const r of reminders) {
      const list = map.get(r.date) ?? [];
      list.push(r);
      map.set(r.date, list);
    }
    return map;
  }, [reminders]);

  const activeDay = selected ?? new Date();
  const dayEvents = (byDay.get(format(activeDay, "yyyy-MM-dd")) ?? []).sort((a, b) =>
    (a.time ?? "").localeCompare(b.time ?? ""),
  );

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <button
          type="button"
          aria-label="Mes anterior"
          onClick={() => setMonthOffset((m) => m - 1)}
          className="rounded-full p-1.5 text-muted-foreground hover:bg-secondary"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <p className="text-sm font-semibold capitalize">
          {format(cursor, "MMMM yyyy", { locale: es })}
        </p>
        <button
          type="button"
          aria-label="Mes siguiente"
          onClick={() => setMonthOffset((m) => m + 1)}
          className="rounded-full p-1.5 text-muted-foreground hover:bg-secondary"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-semibold uppercase text-muted-foreground">
        {["L", "M", "X", "J", "V", "S", "D"].map((d, i) => (
          <span key={`${d}-${i}`}>{d}</span>
        ))}
      </div>

      <div className="mt-1 grid grid-cols-7 gap-1">
        {days.map((day) => {
          const key = format(day, "yyyy-MM-dd");
          const events = byDay.get(key) ?? [];
          const worst = events.reduce<ReturnType<typeof urgency>>((acc, r) => {
            const u = urgency(r.date);
            if (u === "overdue" || u === "soon") return "soon";
            if (u === "near" && acc !== "soon") return "near";
            return acc;
          }, "none");
          const isToday = isSameDay(day, new Date());
          return (
            <button
              key={key}
              type="button"
              onClick={() => setSelected(day)}
              className={cn(
                "flex h-11 flex-col items-center justify-center rounded-xl text-sm transition-colors",
                isSameMonth(day, cursor) ? "text-foreground" : "text-muted-foreground/50",
                isSameDay(day, activeDay) && "bg-secondary font-semibold",
                isToday && "ring-1 ring-primary",
              )}
            >
              <span className="tabular-nums">{format(day, "d")}</span>
              <span className="mt-0.5 flex h-1.5 items-center gap-0.5">
                {events.slice(0, 3).map((r) => (
                  <span
                    key={r.id}
                    className={cn("h-1.5 w-1.5 rounded-full", URGENCY_DOT[worst])}
                  />
                ))}
              </span>
            </button>
          );
        })}
      </div>

      <div className="mt-4 border-t border-border pt-3">
        <p className="section-label capitalize">
          {format(activeDay, "EEEE d 'de' MMMM", { locale: es })}
        </p>
        {dayEvents.length === 0 ? (
          <p className="py-2 text-sm text-muted-foreground">Sin eventos este día.</p>
        ) : (
          <ul className="mt-2 space-y-2">
            {dayEvents.map((r) => (
              <li key={r.id} className="flex items-center gap-2">
                <span
                  className={cn(
                    "rounded-full px-2 py-0.5 text-[11px] font-semibold",
                    URGENCY_CHIP[urgency(r.date)],
                  )}
                >
                  {r.time ?? format(parseISO(r.date), "d MMM", { locale: es })}
                </span>
                <span className={cn("flex-1 text-sm", r.done && "line-through opacity-50")}>
                  {reminderLabel(r, people, vehicles)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
