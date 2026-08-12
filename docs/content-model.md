# Content model

Supabase tables own homepage modules, navigation, announcements, banners, pages, legal policies, geography, ingredients, farmers, producers, product stories, gifts, recipes, journal content, authors, categories, and FAQs. Admin exposes these under **Storefront** using one permission-aware editing system.

Long-form fields appear as normal paragraph text in Admin and are stored as Portable Text JSON for storefront rendering. Structured image, SEO, action, gallery, map, and navigation fields remain JSON-backed data and should follow the examples shown in the editor. Complex recipe steps/ingredients and content relationship tables require their dedicated operational workflow before editors rely on them at scale.

## Publishing workflow

1. Create the record as `draft` and capture source, consent, provenance, and image-rights evidence.
2. Move it to `in_review` when editorial work is complete.
3. Review names, translations, alt text, dates, product references, factual claims, and legal/packaging language.
4. Set `verification_status=verified` and `verified=true` only after accountable approval.
5. Admin calls the signed storefront revalidation route; the search indexing job then projects verified records.
6. Archive superseded material while retaining the evidence for why it changed.

Public RLS policies expose only eligible verified content. A saved database record is not automatically approved for publication.

## Editorial rules

No placeholder farmer, certification, award, review, press mention, medical claim, impact number, or sustainability achievement may be presented as fact. Farmer and producer profiles require documented publication consent. Product claims and allergen text must match approved packaging and legal review.

Localized records use `language` (`en` or `bn`) and stable slugs/product IDs. Bangla copy uses Unicode; transliteration belongs in search keywords and never replaces Bangla editorial review. Every public image needs meaningful alternative text in the content language.

Supabase product, variant, price, inventory, order, and shipping tables remain authoritative for commerce. Editorial records add reviewed story and context but cannot override commercial eligibility or price.
