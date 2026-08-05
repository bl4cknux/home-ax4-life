import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function SectionCard({
  title,
  action,
  children,
  className,
}: {
  title: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "rounded-3xl border border-border bg-card p-5 shadow-[0_1px_0_0_rgba(0,0,0,0.03)]",
        className,
      )}
    >
      <header className="mb-3 flex items-center justify-between gap-3">
        <h2 className="section-label">{title}</h2>
        {action}
      </header>
      {children}
    </section>
  );
}

export function EmptyHint({ children }: { children: ReactNode }) {
  return <p className="py-2 text-sm text-muted-foreground">{children}</p>;
}
