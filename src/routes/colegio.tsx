import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Plus, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/AppShell";
import { SectionCard, EmptyHint } from "@/components/SectionCard";
import { ReminderForm } from "@/components/QuickAdd";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { people, reminders, schedule } from "@/lib/repos";
import { useLive } from "@/lib/use-data";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/colegio")({
  head: () => ({
    meta: [
      { title: "Colegio — Horarios y avisos de cada hijo" },
      {
        name: "description",
        content:
          "Espacio separado por hijo: horario semanal, extraescolares, tutor, material, excursiones y recordatorios del colegio.",
      },
      { property: "og:title", content: "Colegio — Horarios y avisos de cada hijo" },
      {
        property: "og:description",
        content: "La semana de cada niño de un vistazo, con avisos y extraescolares.",
      },
    ],
  }),
  component: ColegioPage,
});

const WEEKDAYS = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];

function ColegioPage() {
  const kids = useLive(() => people.all(), [], []);
  const [selected, setSelected] = useState<string | null>(null);
  const activeId = selected ?? kids[0]?.id ?? null;
  const active = kids.find((k) => k.id === activeId) ?? null;

  const items = useLive(
    () => (activeId ? schedule.forPerson(activeId) : Promise.resolve([])),
    [activeId],
    [],
  );
  const allReminders = useLive(() => reminders.all(), [], []);
  const kidReminders = allReminders.filter(
    (r) => r.scope === "person" && r.linkId === activeId && !r.done,
  );

  const [adding, setAdding] = useState(false);
  const [newKid, setNewKid] = useState("");

  useEffect(() => {
    if (selected && !kids.some((k) => k.id === selected)) setSelected(null);
  }, [kids, selected]);

  return (
    <div className="space-y-4">
      <PageHeader title="Colegio" subtitle="Un espacio por hijo" />

      <div className="flex flex-wrap gap-2">
        {kids.map((k) => (
          <button
            key={k.id}
            type="button"
            onClick={() => setSelected(k.id)}
            className={cn(
              "rounded-full border px-4 py-2 text-sm font-medium transition-colors",
              k.id === activeId
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-card text-foreground",
            )}
          >
            {k.name}
          </button>
        ))}
        <form
          className="flex gap-2"
          onSubmit={async (e) => {
            e.preventDefault();
            if (!newKid.trim()) return;
            await people.add({ name: newKid.trim(), color: "sky" });
            setNewKid("");
          }}
        >
          <Input
            className="h-10 w-32 rounded-full"
            placeholder="Nuevo hijo/a"
            value={newKid}
            onChange={(e) => setNewKid(e.target.value)}
          />
          <Button size="icon" variant="secondary" className="h-10 w-10 rounded-full" type="submit">
            <Plus className="h-4 w-4" />
          </Button>
        </form>
      </div>

      {!active ? (
        <EmptyHint>Añade a tu primer hijo o hija para empezar.</EmptyHint>
      ) : (
        <>
          <SectionCard title="Ficha">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <Field
                label="Colegio"
                value={active.schoolName ?? ""}
                onSave={(v) => void people.update(active.id, { schoolName: v })}
              />
              <Field
                label="Clase"
                value={active.className ?? ""}
                onSave={(v) => void people.update(active.id, { className: v })}
              />
              <Field
                label="Tutor/a"
                value={active.tutor ?? ""}
                onSave={(v) => void people.update(active.id, { tutor: v })}
              />
              <Field
                label="Notas"
                value={active.notes ?? ""}
                onSave={(v) => void people.update(active.id, { notes: v })}
              />
            </div>
          </SectionCard>

          <SectionCard title={`Semana de ${active.name}`}>
            <ul className="space-y-3">
              {WEEKDAYS.map((label, index) => {
                const day = items
                  .filter((i) => i.weekday === index + 1)
                  .sort((a, b) => a.time.localeCompare(b.time));
                if (day.length === 0) return null;
                return (
                  <li key={label}>
                    <p className="section-label">{label}</p>
                    <ul className="mt-1 space-y-1">
                      {day.map((i) => (
                        <li key={i.id} className="flex items-center gap-3 text-[15px]">
                          <span className="w-12 font-semibold text-primary tabular-nums">
                            {i.time}
                          </span>
                          <span className="flex-1">{i.title}</span>
                          <button
                            type="button"
                            aria-label={`Borrar ${i.title}`}
                            onClick={() => void schedule.remove(i.id)}
                            className="text-muted-foreground"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </li>
                      ))}
                    </ul>
                  </li>
                );
              })}
              {items.length === 0 ? <EmptyHint>Sin horario todavía.</EmptyHint> : null}
            </ul>
            <ScheduleForm personId={active.id} />
          </SectionCard>

          <SectionCard
            title="Recordatorios"
            action={
              <Button
                size="sm"
                variant="secondary"
                className="rounded-xl"
                onClick={() => setAdding((v) => !v)}
              >
                {adding ? "Cerrar" : "Añadir"}
              </Button>
            }
          >
            {adding ? (
              <div className="mb-4">
                <ReminderForm
                  onDone={() => setAdding(false)}
                  defaultScope="person"
                  defaultLinkId={active.id}
                />
              </div>
            ) : null}
            {kidReminders.length === 0 ? (
              <EmptyHint>Sin avisos pendientes.</EmptyHint>
            ) : (
              <ul className="divide-y divide-border">
                {kidReminders.map((r) => (
                  <li key={r.id} className="flex items-center gap-3 py-2.5">
                    <span className="flex-1 text-[15px]">{r.title}</span>
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(r.date), "d MMM", { locale: es })} {r.time ?? ""}
                    </span>
                    <button
                      type="button"
                      onClick={() => void reminders.toggle(r.id)}
                      className="text-xs font-semibold text-primary"
                    >
                      Hecho
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </SectionCard>
        </>
      )}
    </div>
  );
}

function ScheduleForm({ personId }: { personId: string }) {
  const [title, setTitle] = useState("");
  const [time, setTime] = useState("17:00");
  const [weekday, setWeekday] = useState("1");
  const [kind, setKind] = useState<"class" | "activity" | "note">("activity");

  return (
    <form
      className="mt-4 space-y-2 border-t border-border pt-4"
      onSubmit={async (e) => {
        e.preventDefault();
        if (!title.trim()) return;
        await schedule.add({
          personId,
          title: title.trim(),
          time,
          weekday: Number(weekday),
          kind,
        });
        setTitle("");
      }}
    >
      <Input
        placeholder="Inglés, fútbol, traer flauta…"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />
      <div className="grid grid-cols-3 gap-2">
        <Select value={weekday} onValueChange={setWeekday}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {WEEKDAYS.map((d, i) => (
              <SelectItem key={d} value={String(i + 1)}>
                {d}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input type="time" value={time} onChange={(e) => setTime(e.target.value)} />
        <Select value={kind} onValueChange={(v) => setKind(v as typeof kind)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="class">Clase</SelectItem>
            <SelectItem value="activity">Extraescolar</SelectItem>
            <SelectItem value="note">Aviso</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <Button type="submit" variant="secondary" className="w-full rounded-xl">
        Añadir al horario
      </Button>
    </form>
  );
}

function Field({
  label,
  value,
  onSave,
}: {
  label: string;
  value: string;
  onSave: (v: string) => void;
}) {
  return (
    <label className="block">
      <span className="text-xs text-muted-foreground">{label}</span>
      <Input
        className="mt-1"
        defaultValue={value}
        onBlur={(e) => onSave(e.target.value)}
        placeholder="—"
      />
    </label>
  );
}
