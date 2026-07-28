import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

export function ArticleCard({ article, href }: { article: { title: string; slug: string; category: string; excerpt: string; image: string; imageAlt?: string; readingTime: number; verified?: boolean }; href?: string }) {
  const articleHref = href ?? `/discover-bangladesh/${article.slug}`;
  return <article className="editorial-card"><Link href={articleHref} className="editorial-card-image"><Image src={article.image} alt={article.imageAlt ?? ""} fill sizes="(max-width: 700px) 100vw, 33vw" /><span className="editorial-card-arrow"><ArrowUpRight size={18} /></span></Link><div className="editorial-card-body"><div className="editorial-meta"><span>{article.category}</span><span>{article.readingTime} min read</span></div><h3><Link href={articleHref}>{article.title}</Link></h3><p>{article.excerpt}</p>{article.verified === false ? <span className="draft-label">Preview story · review required</span> : null}</div></article>;
}
