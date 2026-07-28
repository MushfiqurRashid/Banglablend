# Content model

Sanity schemas live individually under `apps/studio/src/schemaTypes`. Object schemas cover accessible images, rich text, SEO, calls to action, geographic and product references, recipe components, flavor profiles, addresses, and verification. Documents cover site settings, localized home/navigation, geography, ingredients, people/producers, recipes, journal content, sourcing, commerce enrichment, gifts, FAQs, pages, legal content, and campaigns.

## Publishing workflow

1. Create a document in `draft` state and record sources, consent, and provenance in internal verification notes.
2. Move it to `in_review`; the Studio verification queue surfaces work that is not yet approved.
3. A responsible editor checks names, translations, image rights/alt text, dates, product IDs, packaging/legal language, and cultural or historical claims.
4. Set status to `verified`, record verification time, and enable the verified flag. Publishing alone is not enough for search inclusion.
5. A signed webhook revalidates the storefront. A protected index job projects verified records into Meilisearch.
6. Archive superseded information; never silently rewrite historical claims or consent evidence.

No placeholder farmer, certification, award, review, press mention, medical claim, impact number, or sustainability achievement may be presented as fact. Farmer/producer profiles require documented publication consent. Product claims and allergen text must match approved packaging and legal review.

## Translation readiness

Localized documents carry an explicit `language` field (`en` or `bn`) rather than mixing both languages into one rich-text field. Stable Medusa product IDs and slugs link translations to the same commerce record. Navigation and singleton home documents are separated per language in the Studio structure. Before adding more locales, introduce an explicit translation-group reference and enforce parity checks in CI.

Bangla fields use Unicode, while transliteration belongs in search synonyms/keywords. Transliteration is a discovery aid and must not replace Bangla editorial review. Every image requires alternative text in the content language.

## Ownership rules

Sanity may describe a product, its verified origin, use, and story. It must not become the authoritative store for price, inventory, SKU, order, or shipping eligibility. Those belong to Medusa. Meilisearch is a projection of both systems and can always be deleted and rebuilt.
