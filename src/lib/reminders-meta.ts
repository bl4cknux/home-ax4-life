import { differenceInCalendarDays, parseISO } from "date-fns";
import type { EntityKind, Person, Reminder, ReminderTag, Vehicle } from "./db";

/** Etiquetas visibles de los recordatorios (Colegio, Médico, Vacunas…). */
export const REMINDER_TAGS: { value: ReminderTag; label: string }[] = [
  { value: "colegio", label: "Colegio" },
  { value: "medico", label: "Médico" },
  { value: "vacunas", label: "Vacunas" },
  { value: "hogar", label: "Hogar" },
  { value: "coche", label: "Coche" },
  { value: "trabajo", label: "Trabajo" },
  { value: "personal", label: "Personal" },
  { value: "otro", label: "Otro" },
];

export const TAG_LABELS: Record<ReminderTag, string> = REMINDER_TAGS.reduce(
  (acc, t) => ({ ...acc, [t.value]: t.label }),
  {} as Record<ReminderTag, string>,
);

/** Etiqueta por defecto si el recordatorio es antiguo y no la tiene guardada. */
const SCOPE_FALLBACK: Record<EntityKind, ReminderTag> = {
  person: "colegio",
  vehicle: "coche",
  home: "hogar",
  work: "trabajo",
  personal: "personal",
  project: "hogar",
  trip: "otro",
};

export function tagOf(reminder: Reminder): ReminderTag {
  return reminder.tag ?? SCOPE_FALLBACK[reminder.scope] ?? "otro";
}

export function tagLabel(reminder: Reminder): string {
  return TAG_LABELS[tagOf(reminder)];
}

/** Nombre de la persona/vehículo asociado, con parentesco: "Hija Ainara". */
export function subjectLabel(
  reminder: Reminder,
  people: Person[],
  vehicles: Vehicle[],
): string | null {
  if (reminder.scope === "person") {
    const kid = people.find((p) => p.id === reminder.linkId);
    if (!kid) return null;
    const role = kid.gender === "hija" ? "Hija" : kid.gender === "hijo" ? "Hijo" : null;
    return role ? `${role} ${kid.name}` : kid.name;
  }
  if (reminder.scope === "vehicle") {
    return vehicles.find((v) => v.id === reminder.linkId)?.name ?? null;
  }
  return null;
}

/** "Colegio · Hijo Aarón · Llevar uniforme" */
export function reminderLabel(reminder: Reminder, people: Person[], vehicles: Vehicle[]): string {
  const subject = subjectLabel(reminder, people, vehicles);
  return [tagLabel(reminder), subject, reminder.title].filter(Boolean).join(" · ");
}

export type Urgency = "overdue" | "soon" | "near" | "none";

/** Rojo a 5 días o menos (y vencidos), amarillo hasta 15 días. */
export function urgency(dateISO: string, from: Date = new Date()): Urgency {
  const days = differenceInCalendarDays(parseISO(dateISO), from);
  if (days < 0) return "overdue";
  if (days <= 5) return "soon";
  if (days <= 15) return "near";
  return "none";
}

export const URGENCY_TEXT: Record<Urgency, string> = {
  overdue: "text-destructive",
  soon: "text-destructive",
  near: "text-warning-foreground",
  none: "text-muted-foreground",
};

export const URGENCY_CHIP: Record<Urgency, string> = {
  overdue: "bg-danger-soft text-destructive",
  soon: "bg-danger-soft text-destructive",
  near: "bg-warning-soft text-warning-foreground",
  none: "bg-secondary text-muted-foreground",
};

export const URGENCY_DOT: Record<Urgency, string> = {
  overdue: "bg-destructive",
  soon: "bg-destructive",
  near: "bg-warning",
  none: "bg-primary",
};
