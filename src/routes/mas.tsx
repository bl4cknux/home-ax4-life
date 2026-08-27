import { createFileRoute, Link } from "@tanstack/react-router";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { Car, Hammer, Plane, Settings, ShoppingCart, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/AppShell";
import { SectionCard, EmptyHint } from "@/components/SectionCard";
import { reminders } from "@/lib/repos";
import { useLive } from "@/lib/use-data";

export const Route = createFileRoute("/mas")({
  head: () => ({
    meta: [
      { title: "Más — Recordatorios, hogar, vehículos y viajes" },
      {
        name: "description",
        content:
          "Base única de recordatorios de la familia y acceso a los módulos de hogar, vehículos, viajes y ajustes.",
      },
      { property: "og:title", content: "Más — Recordatorios y módulos" },
      {
        property: "og:description",
        content: "Todos los avisos de la familia clasificados por ámbito.",
      },
    ],
  }),
  component: MasPage,
});

const LINKS = [
  { to: "/compra", label: "Compra", icon: ShoppingCart },
  { to: "/hogar", label: "Hogar", icon: Hammer },
  { to: "/vehiculos", label: "Vehículos", icon: Car },
  { to: "/viajes", label: "Viajes", icon: Plane },
  { to: "/ajustes", label: "Ajustes", icon: Settings },
] as const;

const SCOPE_LABEL: Record<string, string> = {
  home: "Hogar",
  person: "Hijo/a",
  vehicle: "Vehículo",
  work: "Trabajo",
  personal: "Personal",
  project: "Proyecto",
  trip: "Viaje",
};

function MasPage() {
  const all = useLive(() => reminders.all(), [], []);
  const pending = all.filter((r) => !r.done).sort((a, b) => a.date.localeCompare(b.date));

  return (
    <div className="space-y-4">
      <PageHeader title="Más" subtitle="Módulos y recordatorios" />

      <div className="grid grid-cols-2 gap-3">
        {LINKS.map(({ to, label, icon: Icon }) => (
          <Link
            key={to}
            to={to}
            className="flex items-center gap-3 rounded-3xl border border-border bg-card p-5"
          >
            <Icon className="h-5 w-5 text-primary" />
            <span className="font-semibold">{label}</span>
          </Link>
        ))}
      </div>

      <SectionCard title="Todos los recordatorios">
        {pending.length === 0 ? (
          <EmptyHint>Nada pendiente.</EmptyHint>
        ) : (
          <ul className="divide-y divide-border">
            {pending.map((r) => (
              <li key={r.id} className="flex items-center gap-3 py-2.5">
                <div className="flex-1">
                  <p className="text-[15px]">{r.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {format(parseISO(r.date), "d MMM", { locale: es })} {r.time ?? ""} ·{" "}
                    {SCOPE_LABEL[r.scope] ?? r.scope}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => void reminders.toggle(r.id).then((next) => {
                    if (next)
                      toast.success(
                        `Hecho. Siguiente: ${format(parseISO(next), "d MMM", { locale: es })}`,
                      );
                  })}
                  className="text-xs font-semibold text-primary"
                >
                  Hecho
                </button>
                <button
                  type="button"
                  aria-label={`Borrar ${r.title}`}
                  onClick={() => void reminders.remove(r.id)}
                  className="text-muted-foreground"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </SectionCard>
    </div>
  );
}
