import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Check, Minus, Plus, Star, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/AppShell";
import { ConfirmDelete } from "@/components/ConfirmDelete";
import { SectionCard, EmptyHint } from "@/components/SectionCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { products, shopping } from "@/lib/repos";
import { useLive } from "@/lib/use-data";
import { cn } from "@/lib/utils";
import type { Product } from "@/lib/db";

export const Route = createFileRoute("/compra")({
  head: () => ({
    meta: [
      { title: "Lista de la compra — Hogar" },
      {
        name: "description",
        content:
          "Lista de la compra familiar: añade productos guardados con un toque, suma cantidades y usa tu plantilla de productos fijos.",
      },
      { property: "og:title", content: "Lista de la compra — Hogar" },
      {
        property: "og:description",
        content: "Productos frecuentes a un toque, cantidades automáticas y plantilla fija.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: CompraPage,
});

function CompraPage() {
  const catalog = useLive(() => products.all(), [], []);
  const lines = useLive(() => shopping.all(), [], []);
  const [query, setQuery] = useState("");
  const [manage, setManage] = useState(false);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? catalog.filter((p) => p.name.toLowerCase().includes(q)) : catalog;
  }, [catalog, query]);

  const qtyOf = (p: Product) => lines.find((l) => l.productId === p.id)?.qty ?? 0;
  const pending = lines.filter((l) => !l.done);
  const done = lines.filter((l) => l.done);
  const staples = catalog.filter((p) => p.staple);

  const createProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = query.trim();
    if (!name) return;
    if (catalog.some((p) => p.name.toLowerCase() === name.toLowerCase())) {
      toast.error("Ya existe ese producto");
      return;
    }
    await products.add({ name, category: "Otros", staple: false });
    await shopping.addOrIncrement({ name });
    setQuery("");
    toast.success(`${name} añadido`);
  };

  const addStaples = async () => {
    for (const p of staples) await shopping.addOrIncrement({ id: p.id, name: p.name });
    toast.success("Plantilla añadida");
  };

  return (
    <div className="space-y-4">
      <PageHeader
        title="Lista de la compra"
        subtitle="Toca un producto para añadirlo; vuelve a tocarlo para x2, x3…"
        action={
          <Button variant="ghost" size="sm" onClick={() => setManage((v) => !v)}>
            {manage ? "Listo" : "Editar"}
          </Button>
        }
      />

      <form onSubmit={createProduct} className="flex gap-2">
        <Input
          placeholder="Buscar o crear producto"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <Button type="submit" className="rounded-xl" disabled={!query.trim()}>
          <Plus className="h-4 w-4" />
        </Button>
      </form>

      <SectionCard
        title="Productos guardados"
        action={
          staples.length > 0 ? (
            <button type="button" onClick={() => void addStaples()} className="text-xs font-semibold text-primary">
              Añadir plantilla
            </button>
          ) : null
        }
      >
        {filtered.length === 0 ? (
          <EmptyHint>Escribe un nombre arriba y pulsa + para darlo de alta.</EmptyHint>
        ) : (
          <div className="flex flex-wrap gap-2">
            {filtered.map((p) => {
              const qty = qtyOf(p);
              return (
                <div key={p.id} className="flex items-center">
                  <button
                    type="button"
                    onClick={() => void shopping.addOrIncrement({ id: p.id, name: p.name })}
                    className={cn(
                      "flex items-center gap-1.5 rounded-full border px-3 py-2 text-sm transition-colors active:scale-95",
                      qty > 0
                        ? "border-primary bg-primary/10 font-semibold text-primary"
                        : "border-border bg-card text-foreground",
                    )}
                  >
                    {p.staple ? <Star className="h-3.5 w-3.5 fill-current opacity-70" /> : null}
                    {p.name}
                    {qty > 0 ? <span className="text-xs">x{qty}</span> : null}
                  </button>
                  {manage ? (
                    <div className="ml-1 flex items-center gap-1">
                      <button
                        type="button"
                        aria-label={`Fijar ${p.name} en la plantilla`}
                        onClick={() => void products.update(p.id, { staple: !p.staple })}
                        className={cn("p-1", p.staple ? "text-primary" : "text-muted-foreground")}
                      >
                        <Star className={cn("h-4 w-4", p.staple && "fill-current")} />
                      </button>
                      <ConfirmDelete
                        title={`¿Borrar ${p.name} del catálogo?`}
                        description="Se quitará también de la lista actual."
                        onConfirm={() => products.remove(p.id)}
                      />
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        )}
        {manage ? (
          <p className="mt-3 text-xs text-muted-foreground">
            La estrella marca los productos fijos de tu plantilla ({staples.length} marcados).
          </p>
        ) : null}
      </SectionCard>

      <SectionCard
        title={`Lista (${pending.length})`}
        action={
          lines.length > 0 ? (
            <ConfirmDelete
              title="¿Vaciar la lista de la compra?"
              description="Se quitarán todas las líneas. El catálogo de productos se mantiene."
              label="Vaciar"
              onConfirm={() => shopping.clearAllLines()}
              trigger={
                <button type="button" className="text-xs font-semibold text-muted-foreground">
                  Vaciar
                </button>
              }
            />
          ) : null
        }
      >
        {pending.length === 0 ? (
          <EmptyHint>Nada en la lista todavía.</EmptyHint>
        ) : (
          <ul className="divide-y divide-border">
            {pending.map((l) => (
              <li key={l.id} className="flex items-center gap-2 py-2.5">
                <button
                  type="button"
                  aria-label={`Marcar ${l.name}`}
                  onClick={() => void shopping.toggle(l.id)}
                  className="flex h-6 w-6 items-center justify-center rounded-full border border-border text-transparent"
                >
                  <Check className="h-3.5 w-3.5" />
                </button>
                <span className="flex-1 text-[15px]">{l.name}</span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    aria-label={`Quitar uno de ${l.name}`}
                    onClick={() => void shopping.setQty(l.id, l.qty - 1)}
                    className="flex h-7 w-7 items-center justify-center rounded-full border border-border"
                  >
                    <Minus className="h-3.5 w-3.5" />
                  </button>
                  <span className="w-8 text-center text-sm font-semibold">x{l.qty}</span>
                  <button
                    type="button"
                    aria-label={`Añadir uno de ${l.name}`}
                    onClick={() => void shopping.setQty(l.id, l.qty + 1)}
                    className="flex h-7 w-7 items-center justify-center rounded-full border border-border"
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </SectionCard>

      {done.length > 0 ? (
        <SectionCard
          title={`En el carro (${done.length})`}
          action={
            <button
              type="button"
              onClick={() => void shopping.clearDone()}
              className="text-xs font-semibold text-primary"
            >
              Limpiar
            </button>
          }
        >
          <ul className="divide-y divide-border">
            {done.map((l) => (
              <li key={l.id} className="flex items-center gap-2 py-2.5">
                <button
                  type="button"
                  aria-label={`Desmarcar ${l.name}`}
                  onClick={() => void shopping.toggle(l.id)}
                  className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground"
                >
                  <Check className="h-3.5 w-3.5" />
                </button>
                <span className="flex-1 text-[15px] text-muted-foreground line-through">
                  {l.name} x{l.qty}
                </span>
                <button
                  type="button"
                  aria-label={`Borrar ${l.name}`}
                  onClick={() => void shopping.remove(l.id)}
                  className="text-muted-foreground"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        </SectionCard>
      ) : null}
    </div>
  );
}
