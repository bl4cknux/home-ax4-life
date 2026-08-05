import { useLiveQuery } from "dexie-react-hooks";
import { getDb } from "./db";

/** Consulta reactiva contra la base local. Devuelve `fallback` en servidor. */
export function useLive<T>(query: () => Promise<T>, deps: unknown[], fallback: T): T {
  const value = useLiveQuery(() => {
    if (!getDb()) return undefined;
    return query();
  }, deps);
  return (value as T | undefined) ?? fallback;
}
