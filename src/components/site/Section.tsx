import type { ReactNode } from "react";

export function SectionHead({ eyebrow, title, sub, action }: { eyebrow: string; title: string; sub?: string; action?: ReactNode }) {
  return (
    <div className="mb-10 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div className="max-w-2xl">
        <span className="eyebrow ornament">{eyebrow}</span>
        <h2 className="mt-3 text-4xl font-medium leading-[1.05] md:text-5xl">{title}</h2>
        {sub && <p className="mt-3 text-muted-foreground">{sub}</p>}
      </div>
      {action}
    </div>
  );
}

export function TextLink({ href = "/shop", children }: { href?: string; children: ReactNode }) {
  return <a href={href} className="text-sm font-bold text-maroon underline-offset-4 hover:underline">{children} →</a>;
}
