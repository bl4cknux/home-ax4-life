import { createFileRoute, Link } from "@tanstack/react-router";
import {
  addDays,
  endOfMonth,
  endOfWeek,
  format,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { es } from "date-fns/locale";
import { toast } from "sonner";
import { ChevronRight, Circle, Stethoscope } from "lucide-react";
import { SectionCard, EmptyHint } from "@/components/SectionCard";
import { MonthCalendar } from "@/components/MonthCalendar";
import { useLive } from "@/lib/use-data";
import { movements, people, reminders, vehicles } from "@/lib/repos";
import { expandAll, euro, isoDay, totals } from "@/lib/finance";
import {
  URGENCY_CHIP,
  URGENCY_TEXT,
  reminderLabel,
  tagOf,
  urgency,
} from "@/lib/reminders-meta";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Hogar — Panel familiar del día y la semana" },
      {
        name: "description",
        content:
          "Panel diario de la familia: recordatorios de hoy, citas médicas a 30 días, gastos previstos del mes y calendario de eventos.",
      },
      { property: "og:title", content: "Hogar — Panel familiar del día y la semana" },
      {
        property: "og:description",
        content: "Todo lo que la familia necesita hoy en una sola pantalla, sin conexión.",
      },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const now = new Date();
  const weekEnd = endOfWeek(now, { weekStartsOn: 1 });
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);
  const today = isoDay(now);
  const in30 = isoDay(addDays(now, 30));

  const allMovements = useLive(() => movements.all(), [], []);
  const allReminders = useLive(() => reminders.all(), [], []);
  const kids = useLive(() => people.all(), [], []);
  const cars = useLive(() => vehicles.all(), [], []);

  const monthExpenses = expandAll(allMovements, monthStart, monthEnd).filter(
    (o) => o.movement.type === "expense",
  );
  const monthTotals = totals(expandAll(allMovements, monthStart, monthEnd));

  const todayReminders = allReminders.filter((r) => r.date === today && !r.done);
  const weekReminders = allReminders.filter(
    (r) => !r.done && r.date > today && r.date <= isoDay(weekEnd),
  );
  const medical = allReminders
    .filter(
      (r) =>
        !r.done &&
        (tagOf(r) === "medico" || tagOf(r) === "vacunas") &&
        r.date >= today &&
        r.date <= in30,
    )
    .sort((a, b) => a.date.localeCompare(b.date));

  return (
    <div className="space-y-4">
      <header className="mb-2">
        <p className="text-sm capitalize text-muted-foreground">
          {format(now, "EEEE d 'de' MMMM", { locale: es })}
        </p>
        <h1 className="text-3xl font-bold">{greeting()}</h1>
      </header>

      <SectionCard title="Hoy">
        {todayReminders.length === 0 ? (
          <EmptyHint>Nada pendiente para hoy. Buen día.</EmptyHint>
        ) : (
          <ul className="divide-y divide-border">
            {todayReminders.map((r) => (
              <li key={r.id}>
                <button
                  type="button"
                  onClick={() => void reminders.toggle(r.id).then((next) => {
                    if (next)
                      toast.success(
                        `Hecho. Siguiente: ${format(parseISO(next), "d MMM", { locale: es })}`,
                      );
                  })}
                  className="flex w-full items-center gap-3 py-2.5 text-left"
                >
                  <Circle className={cn("h-5 w-5 shrink-0", URGENCY_TEXT[urgency(r.date)])} />
                  <span className={cn("flex-1 text-[15px]", URGENCY_TEXT[urgency(r.date)])}>
                    {reminderLabel(r, kids, cars)}
                  </span>
                  {r.time ? (
                    <span className="text-sm font-semibold text-primary">{r.time}</span>
                  ) : null}
                </button>
              </li>
            ))}
          </ul>
        )}
      </SectionCard>

      <Link to="/mas" className="block rounded-3xl border border-border bg-card p-5">
        <p className="section-label">Esta semana</p>
        <div className="mt-2 flex items-end justify-between">
          <div>
            <p className="text-3xl font-bold">{weekReminders.length}</p>
            <p className="text-sm text-muted-foreground">recordatorios pendientes</p>
          </div>
          <ChevronRight className="h-5 w-5 text-primary" />
        </div>
      </Link>

      <SectionCard title="Médicos 30 días">
        {medical.length === 0 ? (
          <EmptyHint>Sin citas médicas ni vacunas en los próximos 30 días.</EmptyHint>
        ) : (
          <ul className="divide-y divide-border">
            {medical.map((r) => (
              <li key={r.id} className="flex items-center gap-3 py-2.5">
                <Stethoscope className="h-4 w-4 shrink-0 text-muted-foreground" />
                <span className="flex-1 text-[15px]">{reminderLabel(r, kids, cars)}</span>
                <span
                  className={cn(
                    "rounded-full px-2 py-0.5 text-xs font-semibold",
                    URGENCY_CHIP[urgency(r.date)],
                  )}
                >
                  {format(new Date(r.date), "d MMM", { locale: es })}
                  {r.time ? ` · ${r.time}` : ""}
                </span>
              </li>
            ))}
          </ul>
        )}
      </SectionCard>

      <SectionCard
        title="Gastos previstos mes"
        action={
          <Link to="/finanzas" className="text-primary">
            <ChevronRight className="h-5 w-5" />
          </Link>
        }
      >
        {monthExpenses.length === 0 ? (
          <EmptyHint>Sin gastos previstos este mes.</EmptyHint>
        ) : (
          <>
            <ul className="divide-y divide-border">
              {monthExpenses.map((o, i) => (
                <li key={`${o.movement.id}-${i}`} className="flex items-center gap-3 py-2.5">
                  <span className="w-12 text-xs font-medium uppercase text-muted-foreground">
                    {format(o.date, "d MMM", { locale: es })}
                  </span>
                  <span className="flex-1 text-[15px]">{o.movement.title}</span>
                  <span className="font-semibold tabular-nums">{euro(o.movement.amount)}</span>
                </li>
              ))}
            </ul>
            <div className="mt-3 flex items-center justify-between rounded-2xl bg-secondary px-4 py-3">
              <span className="text-sm font-semibold">Total</span>
              <span className="text-lg font-bold tabular-nums">
                {euro(monthExpenses.reduce((sum, o) => sum + o.movement.amount, 0))}
              </span>
            </div>
          </>
        )}
      </SectionCard>

      <SectionCard title={`Balance del mes · ${format(now, "MMMM", { locale: es })}`}>
        <div className="grid grid-cols-3 gap-2 text-center">
          <Figure label="Ingresos" value={euro(monthTotals.income)} />
          <Figure label="Gastos" value={euro(monthTotals.expense)} />
          <Figure
            label="Balance"
            value={euro(monthTotals.balance)}
            highlight={monthTotals.balance >= 0 ? "good" : "bad"}
          />
        </div>
      </SectionCard>

      <SectionCard title="Calendario">
        <MonthCalendar reminders={allReminders} people={kids} vehicles={cars} />
      </SectionCard>
    </div>
  );
}

function Figure({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: "good" | "bad";
}) {
  return (
    <div className="rounded-2xl bg-secondary px-2 py-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p
        className={
          "mt-1 text-base font-bold tabular-nums " +
          (highlight === "bad" ? "text-destructive" : highlight === "good" ? "text-primary" : "")
        }
      >
        {value}
      </p>
    </div>
  );
}

function greeting() {
  const hour = new Date().getHours();
  if (hour < 6) return "Buenas noches";
  if (hour < 14) return "Buenos días";
  if (hour < 21) return "Buenas tardes";
  return "Buenas noches";
}
