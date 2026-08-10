import { getDb, uid, TABLE_NAMES, type TableName } from "./db";
import type {
  Movement,
  Person,
  Product,
  Project,
  Reminder,
  ScheduleItem,
  ShoppingItem,
  Task,
  Trip,
  Vehicle,
} from "./db";

/**
 * Capa de repositorios: único punto de contacto con el almacenamiento.
 * Cambiar IndexedDB por otro motor solo afecta a este archivo.
 */

const db = () => {
  const instance = getDb();
  if (!instance) throw new Error("La base de datos local solo está disponible en el navegador");
  return instance;
};

const stamp = () => new Date().toISOString();

export const people = {
  all: () => db().people.orderBy("name").toArray(),
  add: (p: Omit<Person, "id" | "createdAt">) =>
    db().people.add({ ...p, id: uid(), createdAt: stamp() }),
  update: (id: string, changes: Partial<Person>) => db().people.update(id, changes),
  remove: async (id: string) => {
    await db().schedule.where("personId").equals(id).delete();
    await db().people.delete(id);
  },
};

export const schedule = {
  forPerson: (personId: string) => db().schedule.where("personId").equals(personId).toArray(),
  add: (s: Omit<ScheduleItem, "id">) => db().schedule.add({ ...s, id: uid() }),
  remove: (id: string) => db().schedule.delete(id),
};

export const vehicles = {
  all: () => db().vehicles.orderBy("name").toArray(),
  add: (v: Omit<Vehicle, "id" | "createdAt">) =>
    db().vehicles.add({ ...v, id: uid(), createdAt: stamp() }),
  update: (id: string, changes: Partial<Vehicle>) => db().vehicles.update(id, changes),
  remove: (id: string) => db().vehicles.delete(id),
};

export const movements = {
  all: () => db().movements.toArray(),
  add: (m: Omit<Movement, "id" | "createdAt">) =>
    db().movements.add({ ...m, id: uid(), createdAt: stamp() }),
  update: (id: string, changes: Partial<Movement>) => db().movements.update(id, changes),
  remove: (id: string) => db().movements.delete(id),
};

export const reminders = {
  all: () => db().reminders.toArray(),
  add: (r: Omit<Reminder, "id" | "createdAt">) =>
    db().reminders.add({ ...r, id: uid(), createdAt: stamp() }),
  toggle: async (id: string) => {
    const current = await db().reminders.get(id);
    if (current) await db().reminders.update(id, { done: !current.done });
  },
  update: (id: string, changes: Partial<Reminder>) => db().reminders.update(id, changes),
  remove: (id: string) => db().reminders.delete(id),
};

export const projects = {
  all: () => db().projects.toArray(),
  add: (p: Omit<Project, "id" | "createdAt" | "order">) =>
    db().projects.add({ ...p, id: uid(), order: Date.now(), createdAt: stamp() }),
  update: (id: string, changes: Partial<Project>) => db().projects.update(id, changes),
  remove: (id: string) => db().projects.delete(id),
};

export const trips = {
  all: () => db().trips.orderBy("startDate").toArray(),
  add: (t: Omit<Trip, "id" | "createdAt">) =>
    db().trips.add({ ...t, id: uid(), createdAt: stamp() }),
  update: (id: string, changes: Partial<Trip>) => db().trips.update(id, changes),
  remove: async (id: string) => {
    const linked = await db().tasks.toArray();
    await db().tasks.bulkDelete(
      linked.filter((t) => t.link?.kind === "trip" && t.link.id === id).map((t) => t.id),
    );
    await db().trips.delete(id);
  },
};

export const tasks = {
  all: () => db().tasks.toArray(),
  add: (t: Omit<Task, "id" | "createdAt">) =>
    db().tasks.add({ ...t, id: uid(), createdAt: stamp() }),
  toggle: async (id: string) => {
    const current = await db().tasks.get(id);
    if (current) await db().tasks.update(id, { done: !current.done });
  },
  remove: (id: string) => db().tasks.delete(id),
};

export async function clearAll() {
  const instance = db();
  await Promise.all(TABLE_NAMES.map((name) => instance.table(name as TableName).clear()));
  await instance.meta.clear();
}
