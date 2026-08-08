import { useEffect, useMemo, useRef, useState } from "react";
import { Badge, Button, Container, Heading, Input, Switch, Text, Textarea } from "@medusajs/ui";
import { adminPath, adminRequest } from "../../../lib/superadmin";
import type { CatalogProduct } from "./types";

const marketOptions = [
  { code: "bd", label: "Bangladesh" },
  { code: "gb", label: "United Kingdom" },
  { code: "us", label: "United States" },
  { code: "ca", label: "Canada" },
  { code: "eu", label: "European Union" },
  { code: "au", label: "Australia / New Zealand" },
  { code: "me", label: "Middle East" },
] as const;

const storefrontSectionHandles = new Set([
  "originals",
  "reserve",
  "pantry",
  "tea-wellness",
  "lifestyle-accessories",
  "gifts",
]);

type ManagedCatalog = {
  id: string;
  name: string;
  handle: string;
  section: string;
  experience: "listing" | "build_a_box";
  box_size: number | null;
  is_active: boolean;
};

type CatalogListResponse = { catalogs: ManagedCatalog[] };

interface FormState {
  title: string;
  handle: string;
  subtitle: string;
  description: string;
  status: CatalogProduct["status"];
  region: string;
  ingredients: string;
  storage: string;
  shelfLife: string;
  usage: string;
  markets: string[];
  badges: string;
  bestSeller: boolean;
  storefrontVisible: boolean;
  thumbnailAlt: string;
  imageAlts: Record<string, string>;
  bangladeshAvailable: boolean;
  internationalAvailable: boolean;
  exportReady: boolean;
  domesticOnly: boolean;
  supportedCountries: string;
  restrictedCountries: string;
  shippingClassification: string;
  customsDescription: string;
  countryOfOrigin: string;
  storageRequirements: string;
  temperatureRequirements: string;
  shelfLifeDays: string;
  dispatchShelfLifeDays: string;
  marketVerified: boolean;
  division: string;
  district: string;
  locality: string;
  producerReference: string;
  batchNumber: string;
  harvestDate: string;
  evidenceReference: string;
  originVerification: "draft" | "in_review" | "verified" | "rejected";
  categoryIds: string[];
}

function metadataString(metadata: Record<string, unknown>, key: string) {
  return typeof metadata[key] === "string" ? (metadata[key] as string) : "";
}

function initialState(product: CatalogProduct): FormState {
  const metadata = product.metadata ?? {};
  const rawAlts = metadata.image_alt_texts;
  const imageAlts =
    rawAlts && typeof rawAlts === "object" && !Array.isArray(rawAlts)
      ? Object.fromEntries(
          Object.entries(rawAlts).filter(
            (entry): entry is [string, string] => typeof entry[1] === "string",
          ),
        )
      : {};
  const rawBadges = Array.isArray(metadata.product_badges)
    ? metadata.product_badges.filter((badge): badge is string => typeof badge === "string")
    : product.tags.map((tag) => tag.value).filter((tag): tag is string => Boolean(tag));
  const eligibleMarkets = Array.isArray(metadata.eligible_markets)
    ? metadata.eligible_markets.filter(
        (market): market is string =>
          typeof market === "string" && marketOptions.some((option) => option.code === market),
      )
    : ["bd"];
  const market = product.market_profile;
  const origin = product.origin_profile;

  return {
    title: product.title,
    handle: product.handle,
    subtitle: product.subtitle ?? "",
    description: product.description ?? "",
    status: product.status,
    region: metadataString(metadata, "region"),
    ingredients: metadataString(metadata, "ingredients"),
    storage: metadataString(metadata, "storage"),
    shelfLife: metadataString(metadata, "shelf_life"),
    usage: metadataString(metadata, "usage"),
    markets: eligibleMarkets,
    badges: rawBadges.join(", "),
    bestSeller: metadata.best_seller === true,
    storefrontVisible:
      metadata.verified === true &&
      metadata.is_placeholder !== true &&
      product.status === "published",
    thumbnailAlt: metadataString(metadata, "thumbnail_alt"),
    imageAlts,
    bangladeshAvailable: market?.bangladesh_available ?? true,
    internationalAvailable: market?.international_available ?? false,
    exportReady: market?.export_ready ?? false,
    domesticOnly: market?.domestic_only ?? false,
    supportedCountries: market?.supported_countries?.join(", ") ?? "",
    restrictedCountries: market?.restricted_countries?.join(", ") ?? "",
    shippingClassification: market?.shipping_classification ?? "",
    customsDescription: market?.customs_description ?? "",
    countryOfOrigin: market?.country_of_origin ?? "BD",
    storageRequirements: market?.storage_requirements ?? "",
    temperatureRequirements: market?.temperature_requirements ?? "",
    shelfLifeDays: market?.shelf_life_days?.toString() ?? "",
    dispatchShelfLifeDays: market?.minimum_shelf_life_at_dispatch_days?.toString() ?? "",
    marketVerified: market?.verified ?? false,
    division: origin?.division ?? "",
    district: origin?.district ?? "",
    locality: origin?.locality ?? "",
    producerReference: origin?.producer_reference ?? "",
    batchNumber: origin?.batch_number ?? "",
    harvestDate: origin?.harvest_date?.slice(0, 10) ?? "",
    evidenceReference: origin?.evidence_reference ?? "",
    originVerification: origin?.verification_status ?? "draft",
    categoryIds: product.categories
      .filter((category) => storefrontSectionHandles.has(category.parent_category?.handle ?? ""))
      .map((category) => category.id),
  };
}

function Field({
  label,
  help,
  required,
  children,
}: {
  label: string;
  help?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <Text size="small" weight="plus">
        {label}
        {required ? " *" : ""}
      </Text>
      {children}
      {help ? (
        <Text size="xsmall" className="text-ui-fg-subtle">
          {help}
        </Text>
      ) : null}
    </label>
  );
}

function Toggle({
  checked,
  onCheckedChange,
  label,
  help,
}: {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  label: string;
  help: string;
}) {
  return (
    <div className="border-ui-border-base flex items-start justify-between gap-5 rounded-lg border p-4">
      <div>
        <Text weight="plus">{label}</Text>
        <Text size="small" className="text-ui-fg-subtle mt-1">
          {help}
        </Text>
      </div>
      <Switch checked={checked} onCheckedChange={onCheckedChange} aria-label={label} />
    </div>
  );
}

function splitList(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function nullable(value: string) {
  const trimmed = value.trim();
  return trimmed || null;
}

function optionalDayCount(value: string, label: string) {
  if (!value) return null;
  const count = Number(value);
  if (!Number.isInteger(count) || count < 0 || count > 3650) {
    throw new Error(`${label} must be a whole number from 0 to 3,650.`);
  }
  return count;
}

export function CatalogEditor({
  product,
  onSaved,
  onClose,
}: {
  product: CatalogProduct;
  onSaved: (product: CatalogProduct) => void;
  onClose: () => void;
}) {
  const [form, setForm] = useState<FormState>(() => initialState(product));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string>();
  const [saved, setSaved] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [catalogs, setCatalogs] = useState<ManagedCatalog[]>();
  const [catalogError, setCatalogError] = useState<string>();
  const allowNavigation = useRef(false);

  useEffect(() => {
    const controller = new AbortController();
    adminRequest<CatalogListResponse>("/admin/superadmin/catalogs", {
      signal: controller.signal,
    })
      .then((response) => setCatalogs(response.catalogs))
      .catch((caught) => {
        if (caught instanceof DOMException && caught.name === "AbortError") return;
        setCatalogError(caught instanceof Error ? caught.message : "Catalogs could not be loaded.");
      });
    return () => controller.abort();
  }, []);

  useEffect(() => {
    if (!dirty) return;

    const preventAccidentalExit = (event: BeforeUnloadEvent) => {
      if (allowNavigation.current) return;
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", preventAccidentalExit);
    return () => window.removeEventListener("beforeunload", preventAccidentalExit);
  }, [dirty]);

  const allMedia = useMemo(() => {
    const media = [
      ...(product.thumbnail ? [{ url: product.thumbnail, thumbnail: true }] : []),
      ...product.images.map((image) => ({ url: image.url, thumbnail: false })),
    ];
    return media.filter(
      (item, index) => media.findIndex((candidate) => candidate.url === item.url) === index,
    );
  }, [product]);

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
    setDirty(true);
    setError(undefined);
    setSaved(false);
  }

  function setMany(values: Partial<FormState>) {
    setForm((current) => ({ ...current, ...values }));
    setDirty(true);
    setError(undefined);
    setSaved(false);
  }

  function toggleMarket(code: string) {
    set(
      "markets",
      form.markets.includes(code)
        ? form.markets.filter((market) => market !== code)
        : [...form.markets, code],
    );
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError(undefined);
    try {
      if (!form.title.trim()) {
        throw new Error("Enter a product title.");
      }
      if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(form.handle.trim())) {
        throw new Error("Use lowercase letters, numbers, and hyphens for the URL handle.");
      }
      if (form.storefrontVisible && !form.description.trim()) {
        throw new Error("Enter a full description before showing this product in the storefront.");
      }

      const markets = form.markets;
      if (!markets.length) {
        throw new Error("Select at least one eligible storefront market.");
      }

      const badges = splitList(form.badges);
      if (badges.length > 12 || badges.some((badge) => badge.length > 80)) {
        throw new Error("Use no more than 12 badges, with a maximum of 80 characters each.");
      }

      const supportedCountries = splitList(form.supportedCountries);
      const restrictedCountries = splitList(form.restrictedCountries);
      if (supportedCountries.length > 80 || restrictedCountries.length > 80) {
        throw new Error("Use no more than 80 supported or restricted country codes.");
      }
      const invalidCountry = [...supportedCountries, ...restrictedCountries].find(
        (country) => !/^[a-z]{2}$/i.test(country),
      );
      if (invalidCountry) {
        throw new Error(
          `"${invalidCountry}" is not an ISO country code made of two letters (for example, BD or GB).`,
        );
      }

      if (
        form.thumbnailAlt.trim().length > 300 ||
        Object.values(form.imageAlts).some((alt) => alt.trim().length > 300)
      ) {
        throw new Error("Alternative text must be 300 characters or fewer for each image.");
      }

      const galleryUrls = new Set(
        allMedia.filter((media) => !media.thumbnail).map((media) => media.url),
      );
      const imageAlts = Object.fromEntries(
        Object.entries(form.imageAlts)
          .map(([url, alt]) => [url, alt.trim()] as const)
          .filter(([url, alt]) => galleryUrls.has(url) && Boolean(alt)),
      );

      const payload = await adminRequest<{ product: CatalogProduct | null }>(
        `/admin/superadmin/catalog/${encodeURIComponent(product.id)}`,
        {
          method: "POST",
          body: JSON.stringify({
            title: form.title,
            handle: form.handle,
            subtitle: nullable(form.subtitle),
            description: nullable(form.description),
            status: form.status,
            region: nullable(form.region),
            ingredients: nullable(form.ingredients),
            storage: nullable(form.storage),
            shelf_life: nullable(form.shelfLife),
            usage: nullable(form.usage),
            eligible_markets: markets,
            badges,
            category_ids: form.categoryIds,
            best_seller: form.bestSeller,
            storefront_visible: form.storefrontVisible,
            thumbnail_alt: nullable(form.thumbnailAlt),
            image_alt_texts: imageAlts,
            market_profile: {
              bangladesh_available: form.bangladeshAvailable,
              international_available: form.internationalAvailable,
              supported_countries: supportedCountries.map((country) => country.toLowerCase()),
              restricted_countries: restrictedCountries.map((country) => country.toLowerCase()),
              export_ready: form.exportReady,
              domestic_only: form.domesticOnly,
              shipping_classification: nullable(form.shippingClassification),
              customs_description: nullable(form.customsDescription),
              country_of_origin: nullable(form.countryOfOrigin),
              storage_requirements: nullable(form.storageRequirements),
              temperature_requirements: nullable(form.temperatureRequirements),
              shelf_life_days: optionalDayCount(form.shelfLifeDays, "Shelf life"),
              minimum_shelf_life_at_dispatch_days: optionalDayCount(
                form.dispatchShelfLifeDays,
                "Minimum shelf life at dispatch",
              ),
              verified: form.marketVerified,
            },
            origin_profile: {
              division: nullable(form.division),
              district: nullable(form.district),
              locality: nullable(form.locality),
              producer_reference: nullable(form.producerReference),
              batch_number: nullable(form.batchNumber),
              harvest_date: form.harvestDate
                ? new Date(`${form.harvestDate}T00:00:00.000Z`).toISOString()
                : null,
              evidence_reference: nullable(form.evidenceReference),
              verification_status: form.originVerification,
            },
          }),
        },
      );
      if (!payload.product) {
        throw new Error("The product was saved but could not be reloaded. Refresh and try again.");
      }

      setForm(initialState(payload.product));
      setDirty(false);
      setSaved(true);
      onSaved(payload.product);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "The product could not be saved.");
    } finally {
      setSaving(false);
    }
  }

  function requestClose() {
    if (
      dirty &&
      !window.confirm("Discard your unsaved product changes and return to the catalog?")
    ) {
      return;
    }
    onClose();
  }

  function openCoreEditor() {
    if (
      dirty &&
      !window.confirm("Discard your unsaved product changes and open the core product editor?")
    ) {
      return;
    }
    allowNavigation.current = true;
    window.location.assign(adminPath(`/products/${product.id}`));
  }

  return (
    <form className="flex flex-col gap-y-4" onSubmit={submit}>
      <Container>
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge color={product.readiness.ready ? "green" : "orange"}>
                {product.readiness.ready
                  ? "Storefront ready"
                  : `${product.readiness.missing.length} checks remaining`}
              </Badge>
              <Badge color={form.status === "published" ? "green" : "grey"}>{form.status}</Badge>
            </div>
            <Heading level="h2" className="mt-3">
              Edit {product.title}
            </Heading>
            <Text className="text-ui-fg-subtle mt-1">
              Merchandising, market, origin, and publishing controls. Prices, variants, inventory,
              and media ordering stay in the core product editor.
            </Text>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button type="button" variant="secondary" onClick={openCoreEditor}>
              Core product editor
            </Button>
            <Button type="button" variant="secondary" onClick={requestClose}>
              Close
            </Button>
            <Button type="submit" isLoading={saving} disabled={!dirty}>
              Save changes
            </Button>
          </div>
        </div>
        {error ? (
          <Text role="alert" className="bg-ui-bg-subtle text-ui-fg-error mt-4 rounded-lg p-3">
            {error}
          </Text>
        ) : null}
        {saved ? (
          <Text
            role="status"
            aria-live="polite"
            className="bg-ui-bg-subtle text-ui-fg-success mt-4 rounded-lg p-3"
          >
            Changes saved and audit evidence recorded.
          </Text>
        ) : null}
      </Container>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Container className="xl:col-span-2">
          <Heading level="h2">Customer catalog</Heading>
          <Text className="text-ui-fg-subtle mt-1">
            These fields flow directly into product listings and the product detail page.
          </Text>
          <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
            <Field label="Product title" required>
              <Input
                required
                maxLength={160}
                value={form.title}
                onChange={(event) => set("title", event.target.value)}
              />
            </Field>
            <Field label="URL handle" required help="Lowercase letters, numbers, and hyphens only.">
              <Input
                required
                maxLength={160}
                pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
                value={form.handle}
                onChange={(event) => set("handle", event.target.value)}
              />
            </Field>
            <div className="md:col-span-2">
              <Field label="Short subtitle">
                <Input
                  maxLength={255}
                  value={form.subtitle}
                  onChange={(event) => set("subtitle", event.target.value)}
                />
              </Field>
            </div>
            <div className="md:col-span-2">
              <Field
                label="Full description"
                required={form.storefrontVisible}
                help={
                  form.storefrontVisible
                    ? "Required while the product is visible in the storefront."
                    : "Required before the product can be shown in the storefront."
                }
              >
                <Textarea
                  required={form.storefrontVisible}
                  maxLength={10000}
                  rows={6}
                  value={form.description}
                  onChange={(event) => set("description", event.target.value)}
                />
              </Field>
            </div>
            <Field label="Region / origin label">
              <Input
                maxLength={160}
                value={form.region}
                onChange={(event) => set("region", event.target.value)}
              />
            </Field>
            <Field
              label="Badges"
              help="Separate each badge with a comma. For example: Bestseller, Ready to gift"
            >
              <Input
                maxLength={1000}
                value={form.badges}
                onChange={(event) => set("badges", event.target.value)}
              />
            </Field>
            <div className="md:col-span-2">
              <Field label="Ingredients">
                <Textarea
                  maxLength={5000}
                  rows={4}
                  value={form.ingredients}
                  onChange={(event) => set("ingredients", event.target.value)}
                />
              </Field>
            </div>
            <Field label="Storage guidance">
              <Textarea
                maxLength={2000}
                rows={3}
                value={form.storage}
                onChange={(event) => set("storage", event.target.value)}
              />
            </Field>
            <Field label="Shelf life copy">
              <Textarea
                maxLength={1000}
                rows={3}
                value={form.shelfLife}
                onChange={(event) => set("shelfLife", event.target.value)}
              />
            </Field>
            <div className="md:col-span-2">
              <Field label="How to use">
                <Textarea
                  maxLength={3000}
                  rows={4}
                  value={form.usage}
                  onChange={(event) => set("usage", event.target.value)}
                />
              </Field>
            </div>
          </div>
        </Container>

        <Container>
          <Heading level="h2">Publishing controls</Heading>
          <Text className="text-ui-fg-subtle mt-1">
            The storefront fails closed until every required check passes.
          </Text>
          <div className="mt-5 flex flex-col gap-4">
            <Field label="Core product status">
              <select
                className="border-ui-border-base bg-ui-bg-field rounded-md border px-3 py-2 text-sm"
                value={form.status}
                onChange={(event) => {
                  const nextStatus = event.target.value as FormState["status"];
                  setMany({
                    status: nextStatus,
                    ...(nextStatus === "published" ? {} : { storefrontVisible: false }),
                  });
                }}
              >
                <option value="draft">Draft</option>
                <option value="proposed">Proposed</option>
                <option value="published">Published</option>
                <option value="rejected">Rejected</option>
              </select>
            </Field>
            <Toggle
              checked={form.storefrontVisible}
              onCheckedChange={(checked) =>
                setMany({
                  storefrontVisible: checked,
                  ...(checked ? { status: "published" as const } : {}),
                })
              }
              label="Show in storefront"
              help="Publishes and verifies the record only when media, description, SKU, price, and market checks pass."
            />
            <Toggle
              checked={form.bestSeller}
              onCheckedChange={(checked) => set("bestSeller", checked)}
              label="Best seller"
              help="Makes the product eligible for bestselling product merchandising."
            />
            <div>
              <Text size="small" weight="plus">
                Readiness checklist
              </Text>
              <div className="mt-2 flex flex-wrap gap-2">
                {Object.entries(product.readiness.checks).map(([check, ready]) => (
                  <Badge key={check} color={ready ? "green" : "orange"}>
                    {ready ? "✓" : "•"} {check.replaceAll("_", " ")}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </Container>
      </div>

      <Container>
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <Heading level="h2">Additional storefront catalogs</Heading>
            <Text className="text-ui-fg-subtle mt-1">
              Keep the product in its primary collection while also placing it in reusable catalogs
              such as Gifts · Build a Box.
            </Text>
          </div>
          <Button
            type="button"
            variant="secondary"
            onClick={() => window.location.assign(adminPath("/superadmin/catalogs"))}
          >
            Manage catalogs
          </Button>
        </div>
        {catalogError ? (
          <Text role="alert" className="text-ui-fg-error mt-4">
            {catalogError}
          </Text>
        ) : catalogs === undefined ? (
          <Text className="text-ui-fg-subtle mt-4">Loading catalogs…</Text>
        ) : catalogs.length ? (
          <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
            {catalogs.map((catalog) => {
              const checked = form.categoryIds.includes(catalog.id);
              const disabled = !catalog.is_active && !checked;
              return (
                <label
                  key={catalog.id}
                  className={`border-ui-border-base flex items-start gap-3 rounded-lg border p-4 ${
                    disabled ? "opacity-60" : "cursor-pointer"
                  }`}
                >
                  <input
                    type="checkbox"
                    className="mt-1 size-4"
                    checked={checked}
                    disabled={disabled}
                    onChange={(event) =>
                      set(
                        "categoryIds",
                        event.target.checked
                          ? [...form.categoryIds, catalog.id]
                          : form.categoryIds.filter((id) => id !== catalog.id),
                      )
                    }
                  />
                  <span>
                    <Text weight="plus">{catalog.name}</Text>
                    <Text size="xsmall" className="text-ui-fg-subtle mt-1">
                      {catalog.section.replaceAll("-", " ")}
                      {catalog.experience === "build_a_box"
                        ? ` · Build a box (${catalog.box_size ?? 3} products)`
                        : " · Product listing"}
                      {!catalog.is_active ? " · Inactive" : ""}
                    </Text>
                  </span>
                </label>
              );
            })}
          </div>
        ) : (
          <div className="border-ui-border-base mt-5 rounded-lg border border-dashed p-6 text-center">
            <Heading level="h3">No reusable catalogs yet</Heading>
            <Text className="text-ui-fg-subtle mt-1">
              Create one to group products across their primary sections.
            </Text>
          </div>
        )}
      </Container>

      <Container>
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <Heading level="h2">Media and alternative text</Heading>
            <Text className="text-ui-fg-subtle mt-1">
              Upload, remove, and reorder product media in the core editor; maintain accessible
              descriptions here.
            </Text>
          </div>
          <Button type="button" variant="secondary" onClick={openCoreEditor}>
            Manage images
          </Button>
        </div>
        {allMedia.length ? (
          <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-2">
            {allMedia.map((media) => (
              <div
                key={media.url}
                className="border-ui-border-base flex gap-4 rounded-lg border p-4"
              >
                <div className="bg-ui-bg-subtle relative size-24 shrink-0 overflow-hidden rounded-md">
                  <img
                    src={media.url}
                    alt=""
                    loading="lazy"
                    decoding="async"
                    className="size-full object-cover"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <Text size="small" weight="plus">
                      {media.thumbnail ? "Thumbnail" : "Gallery image"}
                    </Text>
                    {media.thumbnail ? <Badge color="blue">Primary</Badge> : null}
                  </div>
                  <Text size="xsmall" className="text-ui-fg-subtle mt-1 truncate">
                    {media.url}
                  </Text>
                  <div className="mt-3">
                    <Input
                      aria-label={`Alternative text for ${media.url}`}
                      placeholder={`Describe ${product.title}`}
                      maxLength={300}
                      value={
                        media.thumbnail ? form.thumbnailAlt : (form.imageAlts[media.url] ?? "")
                      }
                      onChange={(event) => {
                        if (media.thumbnail) set("thumbnailAlt", event.target.value);
                        else
                          set("imageAlts", { ...form.imageAlts, [media.url]: event.target.value });
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="border-ui-border-base mt-5 rounded-lg border border-dashed p-6 text-center">
            <Heading level="h3">No product media yet</Heading>
            <Text className="text-ui-fg-subtle mt-1">
              Add at least one clear product image before making the product visible.
            </Text>
          </div>
        )}
      </Container>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <Container>
          <Heading level="h2">Markets and fulfillment</Heading>
          <Text className="text-ui-fg-subtle mt-1">
            Eligibility is explicit. Prices, stock, shipping zones, and payment methods must also
            exist in their native screens.
          </Text>
          <div className="mt-5">
            <Text size="small" weight="plus">
              Eligible storefront markets *
            </Text>
            <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
              {marketOptions.map((market) => (
                <label
                  key={market.code}
                  className="border-ui-border-base flex items-center gap-2 rounded-md border p-3 text-sm"
                >
                  <input
                    type="checkbox"
                    checked={form.markets.includes(market.code)}
                    onChange={() => toggleMarket(market.code)}
                  />
                  {market.label}
                </label>
              ))}
            </div>
          </div>
          <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Toggle
              checked={form.bangladeshAvailable}
              onCheckedChange={(checked) => set("bangladeshAvailable", checked)}
              label="Bangladesh available"
              help="Eligible for approved domestic regions."
            />
            <Toggle
              checked={form.internationalAvailable}
              onCheckedChange={(checked) =>
                setMany({
                  internationalAvailable: checked,
                  ...(checked ? { domesticOnly: false } : {}),
                })
              }
              label="International available"
              help="Eligible only for explicitly approved countries."
            />
            <Toggle
              checked={form.exportReady}
              onCheckedChange={(checked) =>
                setMany({
                  exportReady: checked,
                  ...(checked ? { internationalAvailable: true, domesticOnly: false } : {}),
                })
              }
              label="Export ready"
              help="Packaging, documentation, and carrier rules reviewed."
            />
            <Toggle
              checked={form.domesticOnly}
              onCheckedChange={(checked) =>
                setMany({
                  domesticOnly: checked,
                  ...(checked ? { internationalAvailable: false, exportReady: false } : {}),
                })
              }
              label="Domestic only"
              help="Prevents export fulfillment."
            />
            <Toggle
              checked={form.marketVerified}
              onCheckedChange={(checked) => set("marketVerified", checked)}
              label="Market profile verified"
              help="Operations has reviewed this market profile."
            />
          </div>
          <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field
              label="Supported country codes"
              help="Separate ISO two letter codes with commas."
            >
              <Input
                maxLength={320}
                value={form.supportedCountries}
                onChange={(event) => set("supportedCountries", event.target.value)}
              />
            </Field>
            <Field label="Restricted country codes">
              <Input
                maxLength={320}
                value={form.restrictedCountries}
                onChange={(event) => set("restrictedCountries", event.target.value)}
              />
            </Field>
            <Field label="Shipping classification">
              <Input
                maxLength={160}
                value={form.shippingClassification}
                onChange={(event) => set("shippingClassification", event.target.value)}
              />
            </Field>
            <Field label="Country of origin">
              <Input
                maxLength={120}
                value={form.countryOfOrigin}
                onChange={(event) => set("countryOfOrigin", event.target.value)}
              />
            </Field>
            <div className="sm:col-span-2">
              <Field label="Customs description">
                <Textarea
                  maxLength={500}
                  rows={3}
                  value={form.customsDescription}
                  onChange={(event) => set("customsDescription", event.target.value)}
                />
              </Field>
            </div>
            <Field label="Storage requirements">
              <Textarea
                maxLength={1000}
                rows={3}
                value={form.storageRequirements}
                onChange={(event) => set("storageRequirements", event.target.value)}
              />
            </Field>
            <Field label="Temperature requirements">
              <Textarea
                maxLength={500}
                rows={3}
                value={form.temperatureRequirements}
                onChange={(event) => set("temperatureRequirements", event.target.value)}
              />
            </Field>
            <Field label="Shelf life (days)">
              <Input
                type="number"
                min="0"
                max="3650"
                step="1"
                value={form.shelfLifeDays}
                onChange={(event) => set("shelfLifeDays", event.target.value)}
              />
            </Field>
            <Field label="Minimum at dispatch (days)">
              <Input
                type="number"
                min="0"
                max="3650"
                step="1"
                value={form.dispatchShelfLifeDays}
                onChange={(event) => set("dispatchShelfLifeDays", event.target.value)}
              />
            </Field>
          </div>
        </Container>

        <Container>
          <Heading level="h2">Origin and verification</Heading>
          <Text className="text-ui-fg-subtle mt-1">
            Internal provenance details support review; only approved claims for customers should be
            published.
          </Text>
          <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Division">
              <Input
                maxLength={120}
                value={form.division}
                onChange={(event) => set("division", event.target.value)}
              />
            </Field>
            <Field label="District">
              <Input
                maxLength={120}
                value={form.district}
                onChange={(event) => set("district", event.target.value)}
              />
            </Field>
            <Field label="Locality">
              <Input
                maxLength={160}
                value={form.locality}
                onChange={(event) => set("locality", event.target.value)}
              />
            </Field>
            <Field label="Producer reference">
              <Input
                maxLength={200}
                value={form.producerReference}
                onChange={(event) => set("producerReference", event.target.value)}
              />
            </Field>
            <Field label="Batch number">
              <Input
                maxLength={120}
                value={form.batchNumber}
                onChange={(event) => set("batchNumber", event.target.value)}
              />
            </Field>
            <Field label="Harvest date">
              <Input
                type="date"
                value={form.harvestDate}
                onChange={(event) => set("harvestDate", event.target.value)}
              />
            </Field>
            <div className="sm:col-span-2">
              <Field
                label="Evidence reference"
                help="Internal document ID or controlled URL; do not place secrets here."
              >
                <Input
                  maxLength={500}
                  value={form.evidenceReference}
                  onChange={(event) => set("evidenceReference", event.target.value)}
                />
              </Field>
            </div>
            <div className="sm:col-span-2">
              <Field label="Origin verification status">
                <select
                  className="border-ui-border-base bg-ui-bg-field rounded-md border px-3 py-2 text-sm"
                  value={form.originVerification}
                  onChange={(event) =>
                    set("originVerification", event.target.value as FormState["originVerification"])
                  }
                >
                  <option value="draft">Draft</option>
                  <option value="in_review">In review</option>
                  <option value="verified">Verified</option>
                  <option value="rejected">Rejected</option>
                </select>
              </Field>
            </div>
          </div>
        </Container>
      </div>

      <Container>
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <Heading level="h2">Save and review</Heading>
            <Text className="text-ui-fg-subtle mt-1">
              Every successful save is recorded in the immutable admin audit trail.
            </Text>
          </div>
          <div className="flex items-center gap-2">
            <Button type="button" variant="secondary" onClick={requestClose}>
              Cancel
            </Button>
            <Button type="submit" isLoading={saving} disabled={!dirty}>
              Save product operations
            </Button>
          </div>
        </div>
      </Container>
    </form>
  );
}
