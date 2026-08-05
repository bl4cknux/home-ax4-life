import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Trash2 } from "lucide-react";
import { PageHeader } from "@/components/AppShell";
import { EmptyHint } from "@/components/SectionCard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { projects } from "@/lib/repos";
import { useLive } from "@/lib/use-data";
import { euro } from "@/lib/finance";
import type { ProjectStatus } from "@/lib/db";

export const Route = createFileRoute("/hogar")({
  head: () => ({
    meta: [
      { title: "Hogar — Tablero de trabajos y proyectos de casa" },
      {
        name: "description",
        content:
          "Tablero sencillo con ideas, pendientes, en proceso y finalizado para los proyectos y arreglos de casa.",
      },
      { property: "og:title", content: "Hogar — Tablero de trabajos de casa" },
      {
        property: "og:description",
        content: "De la idea al arreglo terminado, con presupuesto y notas.",
      },
    ],
  }),
  component: HogarPage,
});

const COLUMNS: { value: ProjectStatus; label: string }[] = [
  { value: "idea", label: "Ideas" },
  { value: "todo", label: "Pendiente" },
  { value: "doing", label: "En proceso" },
  { value: "done", label: "Hecho" },
];

function HogarPage() {
  const all = useLive(() => projects.all(), [], []);
  const [title, setTitle] = useState("");
  const [tab, setTab] = useState<ProjectStatus>("todo");

  return (
    <div className="space-y-4">
      <PageHeader title="Hogar" subtitle="Proyectos y arreglos de casa" />

      <form
        className="flex gap-2"
        onSubmit={async (e) => {
          e.preventDefault();
          if (!title.trim()) return;
          await projects.add({ title: title.trim(), status: tab });
          setTitle("");
        }}
      >
        <Input
          placeholder="Nuevo trabajo…"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <Button type="submit" className="rounded-xl">
          Añadir
        </Button>
      </form>

      <Tabs value={tab} onValueChange={(v) => setTab(v as ProjectStatus)}>
        <TabsList className="grid w-full grid-cols-4">
          {COLUMNS.map((c) => (
            <TabsTrigger key={c.value} value={c.value}>
              {c.label}
            </TabsTrigger>
          ))}
        </TabsList>
        {COLUMNS.map((c) => {
          const list = all.filter((p) => p.status === c.value);
          return (
            <TabsContent key={c.value} value={c.value} className="space-y-3 pt-4">
              {list.length === 0 ? <EmptyHint>Nada aquí todavía.</EmptyHint> : null}
              {list.map((p) => (
                <article key={p.id} className="rounded-3xl border border-border bg-card p-4">
                  <div className="flex items-start gap-3">
                    <h3 className="flex-1 text-[15px] font-semibold">{p.title}</h3>
                    <button
                      type="button"
                      aria-label={`Borrar ${p.title}`}
                      onClick={() => void projects.remove(p.id)}
                      className="text-muted-foreground"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  {p.notes ? <p className="mt-1 text-sm text-muted-foreground">{p.notes}</p> : null}
                  <div className="mt-2 flex flex-wrap gap-2 text-xs text-muted-foreground">
                    {p.vendor ? (
                      <span className="rounded-full bg-secondary px-2 py-1">{p.vendor}</span>
                    ) : null}
                    {p.budget ? (
                      <span className="rounded-full bg-secondary px-2 py-1">{euro(p.budget)}</span>
                    ) : null}
                  </div>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {COLUMNS.filter((col) => col.value !== p.status).map((col) => (
                      <button
                        key={col.value}
                        type="button"
                        onClick={() => void projects.update(p.id, { status: col.value })}
                        className="rounded-full border border-border px-3 py-1 text-xs font-medium"
                      >
                        → {col.label}
                      </button>
                    ))}
                  </div>
                </article>
              ))}
            </TabsContent>
          );
        })}
      </Tabs>
    </div>
  );
}
