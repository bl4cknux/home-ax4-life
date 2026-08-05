import Dexie, { type Table } from "dexie";

/**
 * Local-first storage. Everything lives in the device (IndexedDB via Dexie).
 * The UI never touches Dexie directly: it goes through src/lib/repos.ts,
 * so the storage engine can be replaced without touching business logic.
 */

export type EntityKind = "person" | "vehicle" | "project" | "trip" | "home" | "work" | "personal";

/** Generic link so any record can point at any entity without schema changes. */
export interface EntityRef {
  kind: EntityKind;
  id?: string;
}

export type Recurrence = "once" | "monthly" | "quarterly" | "biannual" | "annual";
export type MovementType = "expense" | "income";
export type ProjectStatus = "idea" | "todo" | "doing" | "done";

export interface Person {
  id: string;
  name: string;
  color: string;
  schoolName?: string;
  className?: string;
  tutor?: string;
  notes?: string;
  createdAt: string;
}

export interface ScheduleItem {
  id: string;
  personId: string;
  weekday: number; // 1 = lunes ... 7 = domingo
  time: string; // "08:30"
  title: string;
  kind: "class" | "activity" | "note";
}

export interface Vehicle {
  id: string;
  name: string;
  plate?: string;
  model?: string;
  createdAt: string;
}

export interface Movement {
  id: string;
  title: string;
  amount: number;
  type: MovementType;
  category: string;
  date: string; // ISO yyyy-MM-dd — primera ocurrencia
  recurrence: Recurrence;
  link?: EntityRef;
  createdAt: string;
}

export interface Reminder {
  id: string;
  title: string;
  date: string; // yyyy-MM-dd
  time?: string;
  scope: EntityKind;
  linkId?: string;
  repeat: Recurrence | "weekly";
  done: boolean;
  createdAt: string;
}

export interface Project {
  id: string;
  title: string;
  status: ProjectStatus;
  notes?: string;
  budget?: number;
  vendor?: string;
  targetDate?: string;
  order: number;
  createdAt: string;
}

export interface Trip {
  id: string;
  destination: string;
  startDate: string;
  endDate?: string;
  hotel?: string;
  budget?: number;
  notes?: string;
  createdAt: string;
}

/** Checklist genérica: sirve para viajes, proyectos, colegio... */
export interface Task {
  id: string;
  title: string;
  done: boolean;
  kind: "todo" | "idea";
  link?: EntityRef;
  createdAt: string;
}

export interface MetaRow {
  key: string;
  value: unknown;
}

export class HogarDB extends Dexie {
  people!: Table<Person, string>;
  schedule!: Table<ScheduleItem, string>;
  vehicles!: Table<Vehicle, string>;
  movements!: Table<Movement, string>;
  reminders!: Table<Reminder, string>;
  projects!: Table<Project, string>;
  trips!: Table<Trip, string>;
  tasks!: Table<Task, string>;
  meta!: Table<MetaRow, string>;

  constructor() {
    super("hogar-db");
    this.version(1).stores({
      people: "id, name",
      schedule: "id, personId, weekday",
      vehicles: "id, name",
      movements: "id, date, category, type",
      reminders: "id, date, scope, done",
      projects: "id, status, order",
      trips: "id, startDate",
      tasks: "id, done, kind",
      meta: "key",
    });
  }
}

let _db: HogarDB | null = null;

/** null durante el renderizado en servidor: IndexedDB solo existe en el navegador. */
export function getDb(): HogarDB | null {
  if (typeof window === "undefined") return null;
  if (!_db) _db = new HogarDB();
  return _db;
}

export const TABLE_NAMES = [
  "people",
  "schedule",
  "vehicles",
  "movements",
  "reminders",
  "projects",
  "trips",
  "tasks",
] as const;

export type TableName = (typeof TABLE_NAMES)[number];

export function uid(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
}
