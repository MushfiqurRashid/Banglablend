import type { StructureResolver } from "sanity/structure";

const singleton = (S: Parameters<StructureResolver>[0], title: string, schemaType: string, documentId: string) =>
  S.listItem().title(title).child(S.document().schemaType(schemaType).documentId(documentId));

const group = (S: Parameters<StructureResolver>[0], title: string, types: string[]) =>
  S.listItem().title(title).child(S.list().title(title).items(types.map((type) => S.documentTypeListItem(type))));

export const deskStructure: StructureResolver = (S) =>
  S.list()
    .title("Bangla Blend")
    .items([
      singleton(S, "Site settings", "siteSettings", "siteSettings"),
      singleton(S, "Homepage — English", "homepage", "homepage-en"),
      singleton(S, "Homepage — Bangla", "homepage", "homepage-bn"),
      S.divider(),
      group(S, "Commerce storytelling", ["productEditorial", "giftEditorial", "sourcingStory"]),
      group(S, "Places and provenance", ["division", "region", "ingredient", "farmer", "producer"]),
      group(S, "Recipes and journal", ["recipe", "journalArticle", "journalCategory", "author"]),
      group(S, "Help and policy", ["faqCategory", "faqItem", "standardPage", "legalPage"]),
      group(S, "Navigation and campaigns", ["navigation", "announcement", "promotionBanner"]),
      S.divider(),
      S.listItem()
        .title("Verification queue")
        .child(
          S.documentList()
            .title("Awaiting verification")
            .apiVersion("2026-01-01")
            .filter("defined(verification) && verification.status in ['draft', 'in_review']")
        )
    ]);
