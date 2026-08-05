import { createFileRoute, Link } from "@tanstack/react-router";
import {
  differenceInCalendarDays,
  endOfMonth,
  endOfWeek,
  format,
  parseISO,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { es } from "date-fns/locale";
import { ChevronRight, Circle, CircleCheck } from "lucide-react";
import { SectionCard, EmptyHint } from "@/components/SectionCard";
import { useLive } from "@/lib/use-data";
import { movements, projects, reminders, trips } from "@/lib/repos";
import { expandAll, euro, isoDay, totals } from "@/lib/finance";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Hogar — Panel familiar del día y la semana" },
      {
        name: "description",
        content:
          "Panel diario de la familia: recordatorios de hoy, gastos de la semana y del mes, tareas del hogar y próximos viajes.",
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
  const weekStart = startOfWeek(now, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(now, { weekStartsOn: 1 });
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);
  const today = isoDay(now);

  const allMovements = useLive(() => movements.all(), [], []);
  const allReminders = useLive(() => reminders.all(), [], []);
  const allProjects = useLive(() => projects.all(), [], []);
  const allTrips = useLive(() => trips.all(), [], []);

  const weekOccurrences = expandAll(allMovements, weekStart, weekEnd).filter(
    (o) => o.movement.type === "expense",
  );
  const monthTotals = totals(expandAll(allMovements, monthStart, monthEnd));

  const todayReminders = allReminders.filter((r) => r.date === today && !r.done);
  const weekReminders = allReminders.filter(
    (r) => !r.done && r.date > today && r.date <= isoDay(weekEnd),
  );
  const openProjects = allProjects.filter((p) => p.status === "todo" || p.status === "doing");
  const upcomingTrips = allTrips.filter((t) => t.startDate >= today);

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
                  onClick={() => void reminders.toggle(r.id)}
                  className="flex w-full items-center gap-3 py-2.5 text-left"
                >
                  <Circle className="h-5 w-5 shrink-0 text-muted-foreground" />
                  <span className="flex-1 text-[15px]">{r.title}</span>
                  {r.time ? (
                    <span className="text-sm font-semibold text-primary">{r.time}</span>
                  ) : null}
                </button>
              </li>
            ))}
          </ul>
        )}
      </SectionCard>

      <div className="grid grid-cols-2 gap-4">
        <Link to="/mas" className="rounded-3xl border border-border bg-card p-5">
          <p className="section-label">Esta semana</p>
          <p className="mt-2 text-3xl font-bold">{weekReminders.length}</p>
          <p className="text-sm text-muted-foreground">recordatorios</p>
        </Link>
        <Link to="/hogar" className="rounded-3xl border border-border bg-card p-5">
          <p className="section-label">Hogar</p>
          <p className="mt-2 text-3xl font-bold">{openProjects.length}</p>
          <p className="text-sm text-muted-foreground">tareas abiertas</p>
        </Link>
      </div>

      <SectionCard
        title="Gastos esta semana"
        action={
          <Link to="/finanzas" className="text-primary">
            <ChevronRight className="h-5 w-5" />
          </Link>
        }
      >
        {weekOccurrences.length === 0 ? (
          <EmptyHint>Sin gastos previstos esta semana.</EmptyHint>
        ) : (
          <>
            <ul className="divide-y divide-border">
              {weekOccurrences.map((o, i) => (
                <li key={`${o.movement.id}-${i}`} className="flex items-center gap-3 py-2.5">
                  <span className="w-10 text-xs font-medium uppercase text-muted-foreground">
                    {format(o.date, "EEE", { locale: es })}
                  </span>
                  <span className="flex-1 text-[15px]">{o.movement.title}</span>
                  <span className="font-semibold tabular-nums">{euro(o.movement.amount)}</span>
                </li>
              ))}
            </ul>
            <div className="mt-3 flex items-center justify-between rounded-2xl bg-secondary px-4 py-3">
              <span className="text-sm font-semibold">Total</span>
              <span className="text-lg font-bold tabular-nums">
                {euro(weekOccurrences.reduce((sum, o) => sum + o.movement.amount, 0))}
              </span>
            </div>
          </>
        )}
      </SectionCard>

      <SectionCard title={`Gastos del mes · ${format(now, "MMMM", { locale: es })}`}>
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

      <SectionCard
        title="Próximos viajes"
        action={
          <Link to="/viajes" className="text-primary">
            <ChevronRight className="h-5 w-5" />
          </Link>
        }
      >
        {upcomingTrips.length === 0 ? (
          <EmptyHint>Sin viajes planificados.</EmptyHint>
        ) : (
          <ul className="space-y-2">
            {upcomingTrips.map((t) => (
              <li key={t.id} className="flex items-center justify-between">
                <span className="text-[15px] font-medium">{t.destination}</span>
                <span className="text-sm text-muted-foreground">
                  {countdown(t.startDate)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </SectionCard>

      <SectionCard
        title="Trabajos pendientes"
        action={
          <Link to="/hogar" className="text-primary">
            <ChevronRight className="h-5 w-5" />
          </Link>
        }
      >
        {openProjects.length === 0 ? (
          <EmptyHint>Nada en marcha ahora mismo.</EmptyHint>
        ) : (
          <ul className="space-y-2">
            {openProjects.slice(0, 5).map((p) => (
              <li key={p.id} className="flex items-center gap-2">
                <CircleCheck className="h-4 w-4 text-muted-foreground" />
                <span className="flex-1 text-[15px]">{p.title}</span>
                {p.status === "doing" ? (
                  <span className="rounded-full bg-accent/25 px-2 py-0.5 text-xs font-medium">
                    En proceso
                  </span>
                ) : null}
              </li>
            ))}
          </ul>
        )}
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

function countdown(date: string) {
  const days = differenceInCalendarDays(parseISO(date), new Date());
  if (days <= 0) return "¡Ya!";
  if (days === 1) return "mañana";
  return `${days} días`;
}
