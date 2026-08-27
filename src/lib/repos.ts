import { nextOccurrence } from "./recurrence";
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
  /**
   * Marcar hecho. Si el recordatorio es periódico no se archiva: salta
   * automáticamente a su siguiente fecha. Devuelve esa fecha si la hay.
   */
  toggle: async (id: string): Promise<string | null> => {
    const current = await db().reminders.get(id);
    if (!current) return null;
    if (!current.done) {
      const next = nextOccurrence(current.date, current.repeat);
      if (next) {
        await db().reminders.update(id, { date: next, done: false });
        return next;
      }
    }
    await db().reminders.update(id, { done: !current.done });
    return null;
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

export const products = {
  all: () => db().products.orderBy("name").toArray(),
  add: (p: Omit<Product, "id" | "createdAt">) =>
    db().products.add({ ...p, id: uid(), createdAt: stamp() }),
  update: (id: string, changes: Partial<Product>) => db().products.update(id, changes),
  remove: async (id: string) => {
    const lines = await db().shopping.where("productId").equals(id).toArray();
    await db().shopping.bulkDelete(lines.map((l) => l.id));
    await db().products.delete(id);
  },
};

export const shopping = {
  all: () => db().shopping.toArray(),
  /** Un toque: si ya está en la lista suma 1, si no la crea. */
  addOrIncrement: async (product: { id?: string; name: string }, step = 1) => {
    const list = await db().shopping.toArray();
    const existing = list.find((l) =>
      product.id
        ? l.productId === product.id
        : l.name.toLowerCase() === product.name.trim().toLowerCase(),
    );
    if (existing) {
      const qty = Math.max(0, existing.qty + step);
      if (qty === 0) return db().shopping.delete(existing.id);
      return db().shopping.update(existing.id, { qty, done: false });
    }
    if (step <= 0) return;
    return db().shopping.add({
      id: uid(),
      name: product.name.trim(),
      qty: step,
      done: false,
      createdAt: stamp(),
      ...(product.id ? { productId: product.id } : {}),
    });
  },
  setQty: async (id: string, qty: number) => {
    if (qty <= 0) return db().shopping.delete(id);
    return db().shopping.update(id, { qty });
  },
  toggle: async (id: string) => {
    const current = await db().shopping.get(id);
    if (current) await db().shopping.update(id, { done: !current.done });
  },
  remove: (id: string) => db().shopping.delete(id),
  clearDone: async () => {
    const list = await db().shopping.toArray();
    await db().shopping.bulkDelete(list.filter((l) => l.done).map((l) => l.id));
  },
  clearAllLines: async () => {
    await db().shopping.clear();
  },
};
