import Link from "next/link";

export type Crumb = { label: string; href?: string };

export default function Breadcrumb({ items }: { items: Crumb[] }) {
  return (
    <nav aria-label="Breadcrumb">
      <ol className="flex flex-wrap items-baseline text-breadcrumb uppercase text-foreground max-md:text-base">
        {items.map((item, i) => {
          const last = i === items.length - 1;
          return (
            <li key={item.label} className="inline-flex items-baseline">
              {last || !item.href ? (
                <span aria-current={last ? "page" : undefined}>{item.label}</span>
              ) : (
                <Link
                  href={item.href}
                  className="underline underline-offset-4 hover:no-underline focus-visible:shadow-focus focus-visible:outline-none"
                >
                  {item.label}
                </Link>
              )}
              {last ? null : (
                <span aria-hidden="true" className="px-[0.4em]">
                  &gt;
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
