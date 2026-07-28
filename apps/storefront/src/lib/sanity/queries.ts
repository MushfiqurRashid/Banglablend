export const HOME_QUERY = `*[_type == "homepage" && language == "en" && verification.status == "verified" && verification.verified == true][0]{
  eyebrow, headline, introduction, "heroImage": heroImage.asset->url, "heroImageAlt": heroImage.alt,
  primaryAction, secondaryAction
}`;

export const ANNOUNCEMENT_QUERY = `*[_type == "announcement" && language == "en" && active == true && market in ["all", $market] && (!defined(startsAt) || startsAt <= now()) && (!defined(endsAt) || endsAt >= now())] | order(_updatedAt desc)[0]{message, link}`;

export const FAQ_QUERY = `*[_type == "faqItem" && language == "en" && published == true] | order(category->order asc, order asc){question, answer, "category": category->title}`;

export const RECIPE_QUERY = `*[_type == "recipe" && slug.current == $slug && verification.status == "verified" && verification.verified == true && defined(summary) && defined(heroImage.asset) && count(ingredients) > 0 && count(steps) > 0][0]{
  title, "slug": slug.current, "excerpt": summary, body, "prepTime": prepMinutes, "cookTime": cookMinutes, servings, difficulty,
  ingredients[]{amount, unit, imperialAmount, imperialUnit, note, "name": ingredient->title, "banglaName": ingredient->banglaName},
  steps[]{instruction, timerMinutes}, "image": heroImage.asset->url, "imageAlt": heroImage.alt,
  "region": coalesce(region.region->title, region.division->title, "Bangladesh"),
  "hasRegion": defined(region.division), "hasProducts": count(relatedProducts) > 0, librarySections
}`;

export const RECIPE_LIST_QUERY = `*[_type == "recipe" && verification.status == "verified" && verification.verified == true && defined(summary) && defined(heroImage.asset) && count(ingredients) > 0 && count(steps) > 0] | order(_updatedAt desc){
  title, "slug": slug.current, "excerpt": summary, "prepTime": prepMinutes, "cookTime": cookMinutes, servings, difficulty,
  "image": heroImage.asset->url, "imageAlt": heroImage.alt,
  "region": coalesce(region.region->title, region.division->title, "Bangladesh"),
  "hasRegion": defined(region.division), "hasProducts": count(relatedProducts) > 0, librarySections
}`;

export const ARTICLE_QUERY = `*[_type == "journalArticle" && slug.current == $slug && category->slug.current == $category && verification.status == "verified" && verification.verified == true && defined(summary) && defined(heroImage.asset) && defined(publishedAt) && count(body) > 0][0]{
  title, "slug": slug.current, "excerpt": summary, publishedAt, _updatedAt, body,
  "image": heroImage.asset->url, "imageAlt": heroImage.alt, "readingTime": round(length(pt::text(body)) / 1000) + 1,
  author->{name}, category->{title, "slug": slug.current}
}`;

export const ARTICLE_LIST_QUERY = `*[_type == "journalArticle" && verification.status == "verified" && verification.verified == true && defined(summary) && defined(heroImage.asset) && defined(publishedAt) && count(body) > 0 && (!defined($category) || category->slug.current == $category)] | order(publishedAt desc){
  title, "slug": slug.current, "excerpt": summary, publishedAt,
  "image": heroImage.asset->url, "imageAlt": heroImage.alt, "readingTime": round(length(pt::text(body)) / 1000) + 1,
  author->{name}, category->{title, "slug": slug.current}
}`;

export const APPROVED_SITEMAP_QUERY = `{
  "recipes": *[_type == "recipe" && verification.status == "verified" && verification.verified == true && defined(summary) && defined(heroImage.asset) && count(ingredients) > 0 && count(steps) > 0].slug.current,
  "articles": *[_type == "journalArticle" && verification.status == "verified" && verification.verified == true && defined(summary) && defined(heroImage.asset) && defined(publishedAt) && count(body) > 0]{"slug": slug.current, "category": category->slug.current},
  "legal": *[_type == "legalPage" && verification.status == "verified" && verification.verified == true && legalApprovalRecorded == true].slug.current,
  "story": *[_type == "standardPage" && verification.status == "verified" && verification.verified == true && slug.current in ["about-bangla-blend", "our-philosophy", "our-impact", "our-standards", "meet-annapurna"]].slug.current
}`;

export const LEGAL_PAGE_QUERY = `*[_type == "legalPage" && slug.current == $slug && verification.status == "verified" && verification.verified == true && legalApprovalRecorded == true][0]{
  title, "slug": slug.current, "introduction": summary, body, effectiveDate, seo
}`;

export const STANDARD_PAGE_QUERY = `*[_type == "standardPage" && slug.current == $slug && verification.status == "verified" && verification.verified == true][0]{
  title, "slug": slug.current, "introduction": summary, body, seo
}`;
