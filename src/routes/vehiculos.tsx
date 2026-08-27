import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { differenceInCalendarDays, format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { Car, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/AppShell";
import { ConfirmDelete } from "@/components/ConfirmDelete";
import { SectionCard, EmptyHint } from "@/components/SectionCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { reminders, vehicles } from "@/lib/repos";
import { useLive } from "@/lib/use-data";
import { isoDay } from "@/lib/finance";

export const Route = createFileRoute("/vehiculos")({
  head: () => ({
    meta: [
      { title: "Vehículos — Seguro, ITV y revisiones con avisos" },
      {
        name: "description",
        content:
          "Control de seguro, ITV, revisión, neumáticos e impuesto de circulación de cada vehículo, con recordatorios automáticos.",
      },
      { property: "og:title", content: "Vehículos — Seguro, ITV y revisiones" },
      {
        property: "og:description",
        content: "Todos los vencimientos del coche en un solo sitio.",
      },
    ],
  }),
  component: VehiculosPage,
});

const DUE_TYPES = ["Seguro", "ITV", "Revisión", "Neumáticos", "Impuesto de circulación"];

function VehiculosPage() {
  const list = useLive(() => vehicles.all(), [], []);
  const allReminders = useLive(() => reminders.all(), [], []);
  const [name, setName] = useState("");

  return (
    <div className="space-y-4">
      <PageHeader title="Vehículos" subtitle="Vencimientos y avisos" />

      <form
        className="flex gap-2"
        onSubmit={async (e) => {
          e.preventDefault();
          if (!name.trim()) return;
          await vehicles.add({ name: name.trim() });
          setName("");
        }}
      >
        <Input
          placeholder="Nuevo vehículo…"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <Button type="submit" className="rounded-xl">
          Añadir
        </Button>
      </form>

      {list.length === 0 ? <EmptyHint>Añade tu primer vehículo.</EmptyHint> : null}

      {list.map((v) => {
        const dues = allReminders
          .filter((r) => r.scope === "vehicle" && r.linkId === v.id && !r.done)
          .sort((a, b) => a.date.localeCompare(b.date));
        return (
          <SectionCard
            key={v.id}
            title={v.name}
            action={
              <ConfirmDelete
                title={`¿Borrar ${v.name}?`}
                description="Se eliminará el vehículo. Esta acción no se puede deshacer."
                onConfirm={() => vehicles.remove(v.id)}
              />
            }
          >
            <div className="mb-3 flex items-center gap-2 text-sm text-muted-foreground">
              <Car className="h-4 w-4" />
              <Input
                className="h-8 w-28"
                defaultValue={v.plate ?? ""}
                placeholder="Matrícula"
                onBlur={(e) => void vehicles.update(v.id, { plate: e.target.value })}
              />
              <Input
                className="h-8 flex-1"
                defaultValue={v.model ?? ""}
                placeholder="Marca y modelo"
                onBlur={(e) => void vehicles.update(v.id, { model: e.target.value })}
              />
            </div>

            {dues.length === 0 ? (
              <EmptyHint>Sin vencimientos registrados.</EmptyHint>
            ) : (
              <ul className="divide-y divide-border">
                {dues.map((r) => {
                  const days = differenceInCalendarDays(parseISO(r.date), new Date());
                  return (
                    <li key={r.id} className="flex items-center gap-3 py-2.5">
                      <span className="flex-1 text-[15px]">{r.title}</span>
                      <span className="text-xs text-muted-foreground">
                        {format(parseISO(r.date), "d MMM yyyy", { locale: es })}
                      </span>
                      <span
                        className={
                          "rounded-full px-2 py-0.5 text-xs font-semibold " +
                          (days < 15 ? "bg-destructive/15 text-destructive" : "bg-secondary")
                        }
                      >
                        {days <= 0 ? "vencido" : `${days} d`}
                      </span>
                      <button
                        type="button"
                        aria-label={`Borrar ${r.title}`}
                        onClick={() => void reminders.remove(r.id)}
                        className="text-muted-foreground"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}

            <DueForm vehicleId={v.id} />
          </SectionCard>
        );
      })}
    </div>
  );
}

function DueForm({ vehicleId }: { vehicleId: string }) {
  const [type, setType] = useState(DUE_TYPES[0]!);
  const [date, setDate] = useState(isoDay(new Date()));

  return (
    <form
      className="mt-4 grid grid-cols-[1fr_auto] gap-2 border-t border-border pt-4"
      onSubmit={async (e) => {
        e.preventDefault();
        await reminders.add({
          title: type,
          date,
          scope: "vehicle",
          linkId: vehicleId,
          repeat: "annual",
          done: false,
        });
      }}
    >
      <Select value={type} onValueChange={setType}>
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {DUE_TYPES.map((t) => (
            <SelectItem key={t} value={t}>
              {t}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Input
        className="w-36"
        type="date"
        value={date}
        onChange={(e) => setDate(e.target.value)}
      />
      <Button type="submit" variant="secondary" className="col-span-2 rounded-xl">
        Añadir vencimiento
      </Button>
    </form>
  );
}
