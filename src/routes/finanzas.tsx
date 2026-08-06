import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  addDays,
  endOfMonth,
  endOfWeek,
  format,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { es } from "date-fns/locale";
import { Trash2 } from "lucide-react";
import { PageHeader } from "@/components/AppShell";
import { SectionCard, EmptyHint } from "@/components/SectionCard";
import { MovementForm } from "@/components/QuickAdd";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { movements, people } from "@/lib/repos";
import { useLive } from "@/lib/use-data";
import { RECURRENCE_LABELS, byCategory, euro, euro2, expandAll, totals } from "@/lib/finance";

export const Route = createFileRoute("/finanzas")({
  head: () => ({
    meta: [
      { title: "Finanzas familiares — Gastos previstos por semana y mes" },
      {
        name: "description",
        content:
          "Planifica hipoteca, colegio, coche, impuestos y suscripciones con periodicidad automática y totales de semana, mes y 30 días.",
      },
      { property: "og:title", content: "Finanzas familiares — Gastos previstos" },
      {
        property: "og:description",
        content: "Planificación doméstica con periodicidades y balance mensual.",
      },
    ],
  }),
  component: FinanzasPage,
});

function FinanzasPage() {
  const now = new Date();
  const all = useLive(() => movements.all(), [], []);
  const [showForm, setShowForm] = useState(false);

  const week = expandAll(all, startOfWeek(now, { weekStartsOn: 1 }), endOfWeek(now, { weekStartsOn: 1 }));
  const month = expandAll(all, startOfMonth(now), endOfMonth(now));
  const next30 = expandAll(all, now, addDays(now, 30));
  const monthTotals = totals(month);
  const categories = byCategory(month);
  const maxCategory = categories[0]?.total ?? 1;

  return (
    <div className="space-y-4">
      <PageHeader
        title="Finanzas"
        subtitle="Planificación, no contabilidad"
        action={
          <Button variant="secondary" className="rounded-xl" onClick={() => setShowForm((v) => !v)}>
            {showForm ? "Cerrar" : "Añadir"}
          </Button>
        }
      />

      {showForm ? (
        <SectionCard title="Nuevo movimiento">
          <MovementForm onDone={() => setShowForm(false)} />
        </SectionCard>
      ) : null}

      <div className="grid grid-cols-3 gap-2">
        <Kpi label="Semana" value={euro(totals(week).expense)} />
        <Kpi label="Mes" value={euro(monthTotals.expense)} />
        <Kpi label="30 días" value={euro(totals(next30).expense)} />
      </div>

      <SectionCard title={`Balance de ${format(now, "MMMM", { locale: es })}`}>
        <div className="flex items-center justify-between text-sm">
          <span>Ingresos</span>
          <span className="font-semibold tabular-nums">{euro2(monthTotals.income)}</span>
        </div>
        <div className="mt-2 flex items-center justify-between text-sm">
          <span>Gastos</span>
          <span className="font-semibold tabular-nums">{euro2(monthTotals.expense)}</span>
        </div>
        <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
          <span className="font-semibold">Balance</span>
          <span
            className={
              "text-lg font-bold tabular-nums " +
              (monthTotals.balance >= 0 ? "text-primary" : "text-destructive")
            }
          >
            {euro2(monthTotals.balance)}
          </span>
        </div>
      </SectionCard>

      <Tabs defaultValue="proximos">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="proximos">Vencimientos</TabsTrigger>
          <TabsTrigger value="categorias">Categorías</TabsTrigger>
          <TabsTrigger value="todos">Todos</TabsTrigger>
        </TabsList>

        <TabsContent value="proximos" className="pt-4">
          <SectionCard title="Próximos 30 días">
            {next30.length === 0 ? (
              <EmptyHint>Nada previsto.</EmptyHint>
            ) : (
              <ul className="divide-y divide-border">
                {next30.map((o, i) => (
                  <li key={`${o.movement.id}-${i}`} className="flex items-center gap-3 py-2.5">
                    <span className="w-14 text-xs font-medium text-muted-foreground">
                      {format(o.date, "d MMM", { locale: es })}
                    </span>
                    <span className="flex-1 text-[15px]">{o.movement.title}</span>
                    <span
                      className={
                        "font-semibold tabular-nums " +
                        (o.movement.type === "income" ? "text-primary" : "")
                      }
                    >
                      {o.movement.type === "income" ? "+" : ""}
                      {euro(o.movement.amount)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </SectionCard>
        </TabsContent>

        <TabsContent value="categorias" className="pt-4">
          <SectionCard title="Gasto del mes por categoría">
            {categories.length === 0 ? (
              <EmptyHint>Sin datos todavía.</EmptyHint>
            ) : (
              <ul className="space-y-3">
                {categories.map((c) => (
                  <li key={c.category}>
                    <div className="mb-1 flex justify-between text-sm">
                      <span>{c.category}</span>
                      <span className="font-semibold tabular-nums">{euro(c.total)}</span>
                    </div>
                    <div className="h-2 rounded-full bg-secondary">
                      <div
                        className="h-2 rounded-full bg-primary"
                        style={{ width: `${Math.max(6, (c.total / maxCategory) * 100)}%` }}
                      />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </SectionCard>
        </TabsContent>

        <TabsContent value="todos" className="pt-4">
          <SectionCard title="Movimientos guardados">
            {all.length === 0 ? (
              <EmptyHint>Añade tu primer gasto con el botón +.</EmptyHint>
            ) : (
              <ul className="divide-y divide-border">
                {all.map((m) => (
                  <li key={m.id} className="flex items-center gap-3 py-2.5">
                    <div className="flex-1">
                      <p className="text-[15px]">{m.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {m.category} · {RECURRENCE_LABELS[m.recurrence]} ·{" "}
                        {format(new Date(m.date), "d MMM yyyy", { locale: es })}
                      </p>
                    </div>
                    <span className="font-semibold tabular-nums">{euro(m.amount)}</span>
                    <button
                      type="button"
                      aria-label={`Borrar ${m.title}`}
                      onClick={() => void movements.remove(m.id)}
                      className="text-muted-foreground"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </SectionCard>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function Kpi({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card px-3 py-4 text-center">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-lg font-bold tabular-nums">{value}</p>
    </div>
  );
}
