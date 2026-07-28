import Image from "next/image";
import Link from "next/link";
import { Clock3, ArrowUpRight } from "lucide-react";

export function RecipeCard({ recipe }: { recipe: { title: string; slug: string; excerpt: string; image: string; imageAlt?: string; prepTime: number; cookTime: number; difficulty: string; verified: boolean } }) {
  return <article className="editorial-card"><Link href={`/recipes/${recipe.slug}`} className="editorial-card-image"><Image src={recipe.image} alt={recipe.imageAlt ?? `Prepared ${recipe.title}`} fill sizes="(max-width: 700px) 100vw, 33vw" /><span className="editorial-card-arrow"><ArrowUpRight size={18} /></span></Link><div className="editorial-card-body"><div className="editorial-meta"><span><Clock3 size={13} /> {recipe.prepTime + recipe.cookTime} min</span><span>{recipe.difficulty}</span></div><h3><Link href={`/recipes/${recipe.slug}`}>{recipe.title}</Link></h3><p>{recipe.excerpt}</p>{!recipe.verified ? <span className="draft-label">Sample recipe · review required</span> : null}</div></article>;
}
