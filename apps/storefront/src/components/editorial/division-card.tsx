import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

export function DivisionCard({ title, slug, note, index }: { title: string; slug: string; note: string; index: number }) {
  return <Link className="division-card" href={`/explore-bangladesh/${slug}`}><div className="division-card-number">{String(index + 1).padStart(2, "0")}</div><div><span className="division-bangla">বাংলাদেশ</span><h3>{title}</h3><p>{note}</p></div><ArrowUpRight className="division-card-arrow" size={20} /></Link>;
}
