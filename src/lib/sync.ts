import { getDb, TABLE_NAMES, type TableName } from "./db";

/**
 * Capa de sincronización desacoplada del almacenamiento local.
 *
 * La app exporta/importa un único documento JSON. Cualquier proveedor
 * (Google Drive, iCloud, Dropbox, OneDrive, servidor propio) solo tiene que
 * implementar esta interfaz: la lógica de negocio no cambia.
 */

export interface BackupDocument {
  version: 1;
  updatedAt: string;
  device: string;
  data: Record<string, unknown[]>;
}

export interface SyncProvider {
  id: string;
  label: string;
  available: boolean;
  /** Sube el documento al destino remoto. */
  push(doc: BackupDocument): Promise<void>;
  /** Descarga el último documento remoto, o null si no hay ninguno. */
  pull(): Promise<BackupDocument | null>;
}

export async function buildBackup(): Promise<BackupDocument> {
  const db = getDb();
  if (!db) throw new Error("Sin base de datos local");
  const data: Record<string, unknown[]> = {};
  for (const name of TABLE_NAMES) {
    data[name] = await db.table(name as TableName).toArray();
  }
  return {
    version: 1,
    updatedAt: new Date().toISOString(),
    device: typeof navigator !== "undefined" ? navigator.userAgent.slice(0, 60) : "desconocido",
    data,
  };
}

export async function restoreBackup(doc: BackupDocument): Promise<void> {
  const db = getDb();
  if (!db) throw new Error("Sin base de datos local");
  if (doc.version !== 1) throw new Error("Versión de copia no compatible");
  for (const name of TABLE_NAMES) {
    const rows = doc.data[name];
    if (!Array.isArray(rows)) continue;
    await db.table(name as TableName).clear();
    await db.table(name as TableName).bulkPut(rows as never[]);
  }
}

/** Resolución por marca de tiempo: gana el documento más reciente. */
export function newest(a: BackupDocument | null, b: BackupDocument | null): BackupDocument | null {
  if (!a) return b;
  if (!b) return a;
  return new Date(a.updatedAt) >= new Date(b.updatedAt) ? a : b;
}

/** Proveedor activo por defecto: los datos no salen del dispositivo. */
export const localOnlyProvider: SyncProvider = {
  id: "local",
  label: "Solo este dispositivo",
  available: true,
  async push() {
    /* no-op: los datos ya están guardados localmente */
  },
  async pull() {
    return null;
  },
};

/** Puntos de enchufe listos para el futuro; se activan implementando push/pull. */
export const plannedProviders: SyncProvider[] = [
  { id: "google-drive", label: "Google Drive", available: false, push: notReady, pull: notReady },
  { id: "icloud", label: "iCloud Drive", available: false, push: notReady, pull: notReady },
  { id: "dropbox", label: "Dropbox", available: false, push: notReady, pull: notReady },
  { id: "onedrive", label: "OneDrive", available: false, push: notReady, pull: notReady },
  { id: "self-hosted", label: "Servidor propio", available: false, push: notReady, pull: notReady },
];

async function notReady(): Promise<never> {
  throw new Error("Proveedor de sincronización aún no configurado");
}

export function downloadBackup(doc: BackupDocument) {
  const blob = new Blob([JSON.stringify(doc, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `hogar-copia-${doc.updatedAt.slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}
