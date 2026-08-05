import { useRef } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { PageHeader } from "@/components/AppShell";
import { SectionCard } from "@/components/SectionCard";
import { Button } from "@/components/ui/button";
import { clearAll } from "@/lib/repos";
import {
  buildBackup,
  downloadBackup,
  localOnlyProvider,
  plannedProviders,
  restoreBackup,
  type BackupDocument,
} from "@/lib/sync";

export const Route = createFileRoute("/ajustes")({
  head: () => ({
    meta: [
      { title: "Ajustes — Copias de seguridad y sincronización" },
      {
        name: "description",
        content:
          "Exporta e importa tus datos en JSON, revisa el proveedor de sincronización activo y gestiona el almacenamiento local.",
      },
      { property: "og:title", content: "Ajustes — Copias y sincronización" },
      {
        property: "og:description",
        content: "Tus datos viven en tu dispositivo; la sincronización es opcional.",
      },
    ],
  }),
  component: AjustesPage,
});

function AjustesPage() {
  const fileInput = useRef<HTMLInputElement>(null);

  const exportar = async () => {
    downloadBackup(await buildBackup());
    toast.success("Copia descargada");
  };

  const importar = async (file: File) => {
    try {
      const doc = JSON.parse(await file.text()) as BackupDocument;
      await restoreBackup(doc);
      toast.success("Datos restaurados");
    } catch {
      toast.error("El archivo no es una copia válida");
    }
  };

  return (
    <div className="space-y-4">
      <PageHeader title="Ajustes" subtitle="Tus datos, en tu dispositivo" />

      <SectionCard title="Sincronización">
        <p className="text-sm text-muted-foreground">
          Proveedor activo: <strong className="text-foreground">{localOnlyProvider.label}</strong>.
          Todo se guarda en este móvil y funciona sin conexión.
        </p>
        <ul className="mt-3 space-y-1 text-sm">
          {plannedProviders.map((p) => (
            <li key={p.id} className="flex items-center justify-between">
              <span>{p.label}</span>
              <span className="rounded-full bg-secondary px-2 py-0.5 text-xs">Próximamente</span>
            </li>
          ))}
        </ul>
      </SectionCard>

      <SectionCard title="Copia de seguridad">
        <div className="flex flex-wrap gap-2">
          <Button className="rounded-xl" onClick={() => void exportar()}>
            Exportar JSON
          </Button>
          <Button
            variant="secondary"
            className="rounded-xl"
            onClick={() => fileInput.current?.click()}
          >
            Importar JSON
          </Button>
          <input
            ref={fileInput}
            type="file"
            accept="application/json"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void importar(file);
            }}
          />
        </div>
      </SectionCard>

      <SectionCard title="Zona peligrosa">
        <Button
          variant="destructive"
          className="rounded-xl"
          onClick={async () => {
            await clearAll();
            toast.success("Datos borrados");
          }}
        >
          Borrar todos los datos
        </Button>
      </SectionCard>
    </div>
  );
}
