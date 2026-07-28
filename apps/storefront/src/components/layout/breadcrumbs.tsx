import Link from "next/link";

export function Breadcrumbs({ items }: { items: Array<{ label: string; href?: string }> }) {
  return (
    <nav aria-label="Breadcrumb">
      <ol className="breadcrumb-list">
        <li><Link href="/">Home</Link></li>
        {items.map((item) => (
          <li key={`${item.label}-${item.href ?? "current"}`} aria-current={item.href ? undefined : "page"}>
            {item.href ? <Link href={item.href}>{item.label}</Link> : item.label}
          </li>
        ))}
      </ol>
    </nav>
  );
}
