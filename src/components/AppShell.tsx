import { useEffect, useState, type ReactNode } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { Home, Wallet, GraduationCap, LayoutGrid, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { QuickAdd } from "./QuickAdd";
import { seedIfEmpty, seedProductsIfEmpty } from "@/lib/seed";

const NAV = [
  { to: "/", label: "Inicio", icon: Home },
  { to: "/colegio", label: "Colegio", icon: GraduationCap },
  { to: "/finanzas", label: "Finanzas", icon: Wallet },
  { to: "/mas", label: "Más", icon: LayoutGrid },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const [quickAdd, setQuickAdd] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    void seedIfEmpty();
    void seedProductsIfEmpty();
  }, []);

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-lg flex-col bg-background">
      <main className="flex-1 px-4 pb-32 pt-6">{children}</main>

      <nav className="fixed inset-x-0 bottom-0 z-40 mx-auto w-full max-w-lg border-t border-border bg-card/95 px-2 pb-[env(safe-area-inset-bottom)] backdrop-blur">
        <div className="relative grid grid-cols-5 items-end">
          {NAV.slice(0, 2).map((item) => (
            <NavButton key={item.to} {...item} active={isActive(pathname, item.to)} />
          ))}
          <div className="flex justify-center">
            <button
              type="button"
              onClick={() => setQuickAdd(true)}
              aria-label="Añadir rápido"
              className="-mt-6 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-transform active:scale-95"
            >
              <Plus className="h-7 w-7" />
            </button>
          </div>
          {NAV.slice(2).map((item) => (
            <NavButton key={item.to} {...item} active={isActive(pathname, item.to)} />
          ))}
        </div>
      </nav>

      <QuickAdd open={quickAdd} onOpenChange={setQuickAdd} />
    </div>
  );
}

function isActive(pathname: string, to: string) {
  if (to === "/") return pathname === "/";
  if (to === "/mas") {
    return ["/mas", "/hogar", "/vehiculos", "/viajes", "/ajustes"].some((p) =>
      pathname.startsWith(p),
    );
  }
  return pathname.startsWith(to);
}

function NavButton({
  to,
  label,
  icon: Icon,
  active,
}: {
  to: string;
  label: string;
  icon: typeof Home;
  active: boolean;
}) {
  return (
    <Link
      to={to}
      className={cn(
        "flex flex-col items-center gap-1 py-3 text-[11px] font-medium transition-colors",
        active ? "text-primary" : "text-muted-foreground",
      )}
    >
      <Icon className={cn("h-5 w-5", active && "stroke-[2.4]")} />
      {label}
    </Link>
  );
}

export function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <header className="mb-5 flex items-start justify-between gap-3">
      <div>
        <h1 className="text-2xl font-bold text-foreground">{title}</h1>
        {subtitle ? <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p> : null}
      </div>
      {action}
    </header>
  );
}
