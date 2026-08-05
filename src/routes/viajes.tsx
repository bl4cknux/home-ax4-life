import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { differenceInCalendarDays, format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { Check, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/AppShell";
import { SectionCard, EmptyHint } from "@/components/SectionCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { tasks, trips } from "@/lib/repos";
import { useLive } from "@/lib/use-data";
import { euro, isoDay } from "@/lib/finance";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/viajes")({
  head: () => ({
    meta: [
      { title: "Viajes — Destinos, fechas y pendientes de la familia" },
      {
        name: "description",
        content:
          "Planifica cada viaje con destino, fechas, hotel, presupuesto, pendientes e ideas, y ve la cuenta atrás en el panel.",
      },
      { property: "og:title", content: "Viajes — Destinos y pendientes" },
      {
        property: "og:description",
        content: "Viajes familiares ligeros: fechas, hotel, presupuesto e ideas.",
      },
    ],
  }),
  component: ViajesPage,
});

function ViajesPage() {
  const list = useLive(() => trips.all(), [], []);
  const allTasks = useLive(() => tasks.all(), [], []);
  const [destination, setDestination] = useState("");
  const [startDate, setStartDate] = useState(isoDay(new Date()));

  return (
    <div className="space-y-4">
      <PageHeader title="Viajes" subtitle="Ligero y al grano" />

      <form
        className="grid grid-cols-[1fr_auto] gap-2"
        onSubmit={async (e) => {
          e.preventDefault();
          if (!destination.trim()) return;
          await trips.add({ destination: destination.trim(), startDate });
          setDestination("");
        }}
      >
        <Input
          placeholder="Destino"
          value={destination}
          onChange={(e) => setDestination(e.target.value)}
        />
        <Input
          className="w-36"
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
        />
        <Button type="submit" className="col-span-2 rounded-xl">
          Crear viaje
        </Button>
      </form>

      {list.length === 0 ? <EmptyHint>Sin viajes todavía.</EmptyHint> : null}

      {list.map((t) => {
        const linked = allTasks.filter((x) => x.link?.kind === "trip" && x.link.id === t.id);
        const days = differenceInCalendarDays(parseISO(t.startDate), new Date());
        return (
          <SectionCard
            key={t.id}
            title={`${t.destination} · ${days > 0 ? `en ${days} días` : "en curso"}`}
            action={
              <button
                type="button"
                aria-label={`Borrar ${t.destination}`}
                onClick={() => void trips.remove(t.id)}
                className="text-muted-foreground"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            }
          >
            <p className="text-sm text-muted-foreground">
              {format(parseISO(t.startDate), "d MMM", { locale: es })}
              {t.endDate ? ` – ${format(parseISO(t.endDate), "d MMM", { locale: es })}` : ""}
              {t.budget ? ` · ${euro(t.budget)}` : ""}
            </p>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <Input
                defaultValue={t.hotel ?? ""}
                placeholder="Hotel"
                onBlur={(e) => void trips.update(t.id, { hotel: e.target.value })}
              />
              <Input
                type="number"
                defaultValue={t.budget ?? ""}
                placeholder="Presupuesto €"
                onBlur={(e) => void trips.update(t.id, { budget: Number(e.target.value) || 0 })}
              />
            </div>

            <div className="mt-4 space-y-4">
              <TaskGroup title="Pendientes" list={linked.filter((x) => x.kind === "todo")} />
              <TaskGroup title="Ideas" list={linked.filter((x) => x.kind === "idea")} />
            </div>

            <TripTaskInline tripId={t.id} />
          </SectionCard>
        );
      })}
    </div>
  );
}

function TaskGroup({
  title,
  list,
}: {
  title: string;
  list: { id: string; title: string; done: boolean }[];
}) {
  return (
    <div>
      <p className="section-label">{title}</p>
      {list.length === 0 ? (
        <p className="py-1 text-sm text-muted-foreground">—</p>
      ) : (
        <ul className="mt-1 space-y-1">
          {list.map((x) => (
            <li key={x.id} className="flex items-center gap-2">
              <button
                type="button"
                aria-label={`Marcar ${x.title}`}
                onClick={() => void tasks.toggle(x.id)}
                className={cn(
                  "flex h-5 w-5 items-center justify-center rounded-full border",
                  x.done ? "border-primary bg-primary text-primary-foreground" : "border-border",
                )}
              >
                {x.done ? <Check className="h-3 w-3" /> : null}
              </button>
              <span className={cn("flex-1 text-[15px]", x.done && "text-muted-foreground line-through")}>
                {x.title}
              </span>
              <button
                type="button"
                aria-label={`Borrar ${x.title}`}
                onClick={() => void tasks.remove(x.id)}
                className="text-muted-foreground"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function TripTaskInline({ tripId }: { tripId: string }) {
  const [title, setTitle] = useState("");
  const [kind, setKind] = useState<"todo" | "idea">("todo");

  return (
    <form
      className="mt-4 flex gap-2 border-t border-border pt-4"
      onSubmit={async (e) => {
        e.preventDefault();
        if (!title.trim()) return;
        await tasks.add({
          title: title.trim(),
          done: false,
          kind,
          link: { kind: "trip", id: tripId },
        });
        setTitle("");
      }}
    >
      <Input
        placeholder="Añadir nota"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />
      <Button
        type="button"
        variant="secondary"
        className="rounded-xl"
        onClick={() => setKind((k) => (k === "todo" ? "idea" : "todo"))}
      >
        {kind === "todo" ? "Pendiente" : "Idea"}
      </Button>
      <Button type="submit" className="rounded-xl">
        +
      </Button>
    </form>
  );
}
