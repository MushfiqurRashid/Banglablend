import Image from "next/image";
import Link from "@/components/navigation/smart-link";
import { ChevronDown, ArrowUpRight } from "lucide-react";

interface MegaMenuProps {
  label: string;
  href: string;
  links: Array<{ label: string; href: string; image: string }>;
}
export function MegaMenu({ label, href, links }: MegaMenuProps) {
  return (
    <div className="nav-item">
      <Link className="nav-trigger" href={href} aria-haspopup="true">
        {label}
        <ChevronDown size={13} aria-hidden="true" />
      </Link>
      <div className="mega-menu">
        <div className="mega-inner">
          <ul className="mega-links">
            {links.map((item) => (
              <li key={item.href}>
                <Link href={item.href}>
                  <span className="mega-link-media" aria-hidden="true">
                    <Image
                      src={item.image}
                      alt=""
                      width={52}
                      height={52}
                      fetchPriority="low"
                    />
                  </span>
                  <span className="mega-link-label">{item.label}</span>
                  <ArrowUpRight size={15} aria-hidden="true" />
                </Link>
              </li>
            ))}
          </ul>
          <Link className="mega-view-all" href={href}>
            View all {label}
            <ArrowUpRight size={14} aria-hidden="true" />
          </Link>
        </div>
      </div>
    </div>
  );
}
