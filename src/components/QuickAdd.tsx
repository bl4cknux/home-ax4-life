import { useState } from "react";
import { format } from "date-fns";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CATEGORIES, RECURRENCE_LABELS } from "@/lib/finance";
import { movements, projects, reminders, tasks, trips } from "@/lib/repos";
import { useLive } from "@/lib/use-data";
import type { EntityKind, Recurrence } from "@/lib/db";

const today = () => format(new Date(), "yyyy-MM-dd");

export function QuickAdd({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const close = () => onOpenChange(false);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md rounded-3xl">
        <DialogHeader>
          <DialogTitle className="font-display">Añadir rápido</DialogTitle>
        </DialogHeader>
        <Tabs defaultValue="gasto">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="gasto">Gasto</TabsTrigger>
            <TabsTrigger value="recordatorio">Aviso</TabsTrigger>
            <TabsTrigger value="tarea">Hogar</TabsTrigger>
            <TabsTrigger value="viaje">Viaje</TabsTrigger>
          </TabsList>
          <TabsContent value="gasto" className="pt-4">
            <MovementForm onDone={close} />
          </TabsContent>
          <TabsContent value="recordatorio" className="pt-4">
            <ReminderForm onDone={close} />
          </TabsContent>
          <TabsContent value="tarea" className="pt-4">
            <ProjectForm onDone={close} />
          </TabsContent>
          <TabsContent value="viaje" className="pt-4">
            <TripTaskForm onDone={close} />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

export function MovementForm({ onDone }: { onDone: () => void }) {
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState<string>("Vivienda");
  const [date, setDate] = useState(today());
  const [recurrence, setRecurrence] = useState<Recurrence>("monthly");
  const [type, setType] = useState<"expense" | "income">("expense");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const value = Number(amount.replace(",", "."));
    if (!title.trim() || !Number.isFinite(value) || value <= 0) {
      toast.error("Pon un concepto y un importe");
      return;
    }
    await movements.add({ title: title.trim(), amount: value, type, category, date, recurrence });
    toast.success("Guardado");
    onDone();
  };

  return (
    <form onSubmit={submit} className="space-y-3">
      <div className="flex gap-2">
        <Input
          autoFocus
          placeholder="Concepto"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <Input
          className="w-28"
          inputMode="decimal"
          placeholder="0 €"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {CATEGORIES.map((c) => (
              <SelectItem key={c} value={c}>
                {c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={recurrence} onValueChange={(v) => setRecurrence(v as Recurrence)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(RECURRENCE_LABELS).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        <Select value={type} onValueChange={(v) => setType(v as "expense" | "income")}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="expense">Gasto</SelectItem>
            <SelectItem value="income">Ingreso</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <Button type="submit" className="w-full rounded-xl">
        Guardar
      </Button>
    </form>
  );
}

const SCOPES: { value: EntityKind; label: string }[] = [
  { value: "home", label: "Hogar" },
  { value: "person", label: "Hijo/a" },
  { value: "vehicle", label: "Vehículo" },
  { value: "work", label: "Trabajo" },
  { value: "personal", label: "Personal" },
];

export function ReminderForm({
  onDone,
  defaultScope,
  defaultLinkId,
}: {
  onDone: () => void;
  defaultScope?: EntityKind;
  defaultLinkId?: string;
}) {
  const [title, setTitle] = useState("");
  const [date, setDate] = useState(today());
  const [time, setTime] = useState("");
  const [scope, setScope] = useState<EntityKind>(defaultScope ?? "home");
  const [linkId, setLinkId] = useState<string | undefined>(defaultLinkId);
  const kids = useLive(() => import("@/lib/repos").then((m) => m.people.all()), [], []);
  const cars = useLive(() => import("@/lib/repos").then((m) => m.vehicles.all()), [], []);
  const options = scope === "person" ? kids : scope === "vehicle" ? cars : [];

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error("Escribe el recordatorio");
      return;
    }
    await reminders.add({
      title: title.trim(),
      date,
      scope,
      repeat: "once",
      done: false,
      ...(time ? { time } : {}),
      ...(linkId ? { linkId } : {}),
    });
    toast.success("Recordatorio creado");
    onDone();
  };

  return (
    <form onSubmit={submit} className="space-y-3">
      <Input
        autoFocus
        placeholder="¿Qué hay que recordar?"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />
      <div className="grid grid-cols-2 gap-2">
        <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        <Input type="time" value={time} onChange={(e) => setTime(e.target.value)} />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Select
          value={scope}
          onValueChange={(v) => {
            setScope(v as EntityKind);
            setLinkId(undefined);
          }}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SCOPES.map((s) => (
              <SelectItem key={s.value} value={s.value}>
                {s.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {options.length > 0 ? (
          <Select value={linkId ?? (undefined as unknown as string)} onValueChange={setLinkId}>
            <SelectTrigger>
              <SelectValue placeholder="Elegir" />
            </SelectTrigger>
            <SelectContent>
              {options.map((o) => (
                <SelectItem key={o.id} value={o.id}>
                  {o.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : null}
      </div>
      <Button type="submit" className="w-full rounded-xl">
        Guardar
      </Button>
    </form>
  );
}

export function ProjectForm({ onDone }: { onDone: () => void }) {
  const [title, setTitle] = useState("");
  const [status, setStatus] = useState<"idea" | "todo" | "doing" | "done">("todo");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error("Escribe el trabajo");
      return;
    }
    await projects.add({ title: title.trim(), status });
    toast.success("Añadido al tablero");
    onDone();
  };

  return (
    <form onSubmit={submit} className="space-y-3">
      <Input
        autoFocus
        placeholder="Cambiar grifo cocina"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />
      <Select value={status} onValueChange={(v) => setStatus(v as typeof status)}>
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="idea">Idea</SelectItem>
          <SelectItem value="todo">Pendiente</SelectItem>
          <SelectItem value="doing">En proceso</SelectItem>
          <SelectItem value="done">Finalizado</SelectItem>
        </SelectContent>
      </Select>
      <Button type="submit" className="w-full rounded-xl">
        Guardar
      </Button>
    </form>
  );
}

export function TripTaskForm({ onDone }: { onDone: () => void }) {
  const list = useLive(() => trips.all(), [], []);
  const [title, setTitle] = useState("");
  const [tripId, setTripId] = useState<string | undefined>(undefined);
  const [kind, setKind] = useState<"todo" | "idea">("todo");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !tripId) {
      toast.error("Elige un viaje y escribe la nota");
      return;
    }
    await tasks.add({ title: title.trim(), done: false, kind, link: { kind: "trip", id: tripId } });
    toast.success("Añadido al viaje");
    onDone();
  };

  if (list.length === 0) {
    return <p className="py-4 text-sm text-muted-foreground">Crea primero un viaje en el módulo Viajes.</p>;
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <Input
        autoFocus
        placeholder="Comprar entradas"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />
      <div className="grid grid-cols-2 gap-2">
        <Select value={tripId ?? (undefined as unknown as string)} onValueChange={setTripId}>
          <SelectTrigger>
            <SelectValue placeholder="Viaje" />
          </SelectTrigger>
          <SelectContent>
            {list.map((t) => (
              <SelectItem key={t.id} value={t.id}>
                {t.destination}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={kind} onValueChange={(v) => setKind(v as "todo" | "idea")}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todo">Pendiente</SelectItem>
            <SelectItem value="idea">Idea</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <Label className="sr-only">Viaje</Label>
      <Button type="submit" className="w-full rounded-xl">
        Guardar
      </Button>
    </form>
  );
}
