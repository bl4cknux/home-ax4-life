import { addDays, format } from "date-fns";
import { getDb, uid } from "./db";

const day = (offset: number) => format(addDays(new Date(), offset), "yyyy-MM-dd");
const stamp = () => new Date().toISOString();

/** Datos de ejemplo la primera vez, para que el panel no aparezca vacío. */
export async function seedIfEmpty(): Promise<void> {
  const db = getDb();
  if (!db) return;
  const flag = await db.meta.get("seeded");
  if (flag) return;

  const mario = uid();
  const lucia = uid();
  const coche = uid();

  await db.people.bulkAdd([
    {
      id: mario,
      name: "Mario",
      color: "sky",
      gender: "hijo",
      schoolName: "CEIP Miguel Hernández",
      className: "4º A",
      tutor: "Ana Ruiz",
      createdAt: stamp(),
    },
    {
      id: lucia,
      name: "Lucía",
      color: "rose",
      gender: "hija",
      schoolName: "CEIP Miguel Hernández",
      className: "1º B",
      tutor: "Pablo Gil",
      createdAt: stamp(),
    },
  ]);

  await db.schedule.bulkAdd([
    { id: uid(), personId: mario, weekday: 1, time: "08:30", title: "Colegio", kind: "class" },
    { id: uid(), personId: mario, weekday: 1, time: "17:00", title: "Inglés", kind: "activity" },
    { id: uid(), personId: mario, weekday: 2, time: "17:30", title: "Fútbol", kind: "activity" },
    { id: uid(), personId: mario, weekday: 5, time: "08:30", title: "Traer flauta", kind: "note" },
    { id: uid(), personId: lucia, weekday: 3, time: "17:00", title: "Natación", kind: "activity" },
  ]);

  await db.vehicles.add({
    id: coche,
    name: "Coche familiar",
    plate: "1234 ABC",
    model: "Seat León",
    createdAt: stamp(),
  });

  await db.movements.bulkAdd([
    {
      id: uid(),
      title: "Hipoteca",
      amount: 820,
      type: "expense",
      category: "Vivienda",
      date: day(2),
      recurrence: "monthly",
      createdAt: stamp(),
    },
    {
      id: uid(),
      title: "Colegio",
      amount: 190,
      type: "expense",
      category: "Colegio",
      date: day(3),
      recurrence: "monthly",
      link: { kind: "person", id: mario },
      createdAt: stamp(),
    },
    {
      id: uid(),
      title: "Gasolina",
      amount: 60,
      type: "expense",
      category: "Coche",
      date: day(1),
      recurrence: "monthly",
      link: { kind: "vehicle", id: coche },
      createdAt: stamp(),
    },
    {
      id: uid(),
      title: "Amazon",
      amount: 34,
      type: "expense",
      category: "Suscripciones",
      date: day(4),
      recurrence: "monthly",
      createdAt: stamp(),
    },
    {
      id: uid(),
      title: "Nómina",
      amount: 2400,
      type: "income",
      category: "Otros",
      date: day(-5),
      recurrence: "monthly",
      createdAt: stamp(),
    },
    {
      id: uid(),
      title: "Seguro coche",
      amount: 410,
      type: "expense",
      category: "Coche",
      date: day(40),
      recurrence: "annual",
      link: { kind: "vehicle", id: coche },
      createdAt: stamp(),
    },
  ]);

  await db.reminders.bulkAdd([
    {
      id: uid(),
      title: "Llevar uniforme",
      date: day(0),
      scope: "person",
      linkId: mario,
      tag: "colegio",
      repeat: "once",
      done: false,
      createdAt: stamp(),
    },
    {
      id: uid(),
      title: "Dentista",
      date: day(0),
      time: "18:30",
      scope: "personal",
      tag: "medico",
      repeat: "once",
      done: false,
      createdAt: stamp(),
    },
    {
      id: uid(),
      title: "Pagar comedor",
      date: day(0),
      scope: "person",
      linkId: lucia,
      tag: "colegio",
      repeat: "monthly",
      done: false,
      createdAt: stamp(),
    },
    {
      id: uid(),
      title: "ITV del coche",
      date: day(12),
      scope: "vehicle",
      linkId: coche,
      tag: "coche",
      repeat: "annual",
      done: false,
      createdAt: stamp(),
    },
    {
      id: uid(),
      title: "Excursión museo",
      date: day(5),
      scope: "person",
      linkId: mario,
      tag: "colegio",
      repeat: "once",
      done: false,
      createdAt: stamp(),
    },
    {
      id: uid(),
      title: "Cita pediatra",
      date: day(9),
      time: "12:00",
      scope: "person",
      linkId: lucia,
      tag: "medico",
      repeat: "once",
      done: false,
      createdAt: stamp(),
    },
    {
      id: uid(),
      title: "Vacuna de la gripe",
      date: day(21),
      scope: "person",
      linkId: mario,
      tag: "vacunas",
      repeat: "annual",
      done: false,
      createdAt: stamp(),
    },
  ]);

  await db.projects.bulkAdd([
    {
      id: uid(),
      title: "Cambiar grifo cocina",
      status: "todo",
      notes: "Modelo monomando",
      budget: 120,
      order: 1,
      createdAt: stamp(),
    },
    {
      id: uid(),
      title: "Pintar habitación",
      status: "doing",
      budget: 200,
      order: 2,
      createdAt: stamp(),
    },
    {
      id: uid(),
      title: "Cambiar ventanas",
      status: "todo",
      vendor: "Leroy Merlin",
      notes: "Pedir presupuesto",
      order: 3,
      createdAt: stamp(),
    },
    {
      id: uid(),
      title: "Instalar aire acondicionado",
      status: "idea",
      order: 4,
      createdAt: stamp(),
    },
  ]);

  const madrid = uid();
  await db.trips.bulkAdd([
    {
      id: madrid,
      destination: "Madrid",
      startDate: day(15),
      endDate: day(18),
      hotel: "Hotel Atocha",
      budget: 600,
      createdAt: stamp(),
    },
  ]);

  await db.tasks.bulkAdd([
    {
      id: uid(),
      title: "Comprar entradas museo",
      done: false,
      kind: "todo",
      link: { kind: "trip", id: madrid },
      createdAt: stamp(),
    },
    {
      id: uid(),
      title: "Cenar en el centro",
      done: false,
      kind: "idea",
      link: { kind: "trip", id: madrid },
      createdAt: stamp(),
    },
  ]);

  await db.meta.put({ key: "seeded", value: stamp() });
}

const STAPLES = [
  "Leche",
  "Pan",
  "Huevos",
  "Café",
  "Fruta",
  "Yogures",
  "Papel de cocina",
  "Detergente",
];

const EXTRAS = ["Pollo", "Arroz", "Pasta", "Tomate frito", "Queso", "Champú", "Agua", "Aceite"];

/** Catálogo inicial de la compra (independiente del seed general). */
export async function seedProductsIfEmpty(): Promise<void> {
  const db = getDb();
  if (!db) return;
  const flag = await db.meta.get("seeded-products");
  if (flag) return;
  const count = await db.products.count();
  if (count === 0) {
    await db.products.bulkAdd([
      ...STAPLES.map((name) => ({
        id: uid(),
        name,
        category: "Despensa",
        staple: true,
        createdAt: stamp(),
      })),
      ...EXTRAS.map((name) => ({
        id: uid(),
        name,
        category: "Despensa",
        staple: false,
        createdAt: stamp(),
      })),
    ]);
  }
  await db.meta.put({ key: "seeded-products", value: stamp() });
}
