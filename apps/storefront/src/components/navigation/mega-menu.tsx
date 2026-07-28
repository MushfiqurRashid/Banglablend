import Link from "next/link";
import { ChevronDown, ArrowUpRight } from "lucide-react";

interface MegaMenuProps {
  label: string;
  href: string;
  title: string;
  description: string;
  links: Array<{ label: string; href: string }>;
  featureTitle: string;
  featureHref: string;
}

export function MegaMenu({ label, href, title, description, links, featureTitle, featureHref }: MegaMenuProps) {
  return (
    <div className="nav-item">
      <Link className="nav-trigger" href={href} aria-haspopup="true">
        {label}<ChevronDown size={13} aria-hidden="true" />
      </Link>
      <div className="mega-menu">
        <div className="shell mega-inner">
          <div>
            <p className="mega-title">{title}</p>
            <p className="lead">{description}</p>
            <Link className="text-link" href={href}>View all <ArrowUpRight size={14} /></Link>
          </div>
          <ul className="mega-links">
            {links.map((item) => <li key={item.href}><Link href={item.href}>{item.label}</Link></li>)}
          </ul>
          <Link className="mega-feature" href={featureHref}>
            <span className="eyebrow" style={{ color: "inherit" }}>Featured</span>
            <h3>{featureTitle}</h3>
            <p>Follow flavor into a product, a recipe and the place that inspired it.</p>
          </Link>
        </div>
      </div>
    </div>
  );
}
