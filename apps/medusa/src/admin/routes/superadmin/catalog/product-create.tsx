import { useEffect, useMemo, useRef, useState, type DragEvent, type FormEvent } from "react";
import { Badge, Button, Container, Heading, Input, Switch, Text, Textarea } from "@medusajs/ui";
import { adminPath, adminRequest, PageHeader } from "../../../lib/superadmin";
import type { CatalogProduct } from "./types";

const destinations = [
  {
    handle: "originals",
    label: "Shop · Originals",
    shortLabel: "Originals",
    description: "Signature Bangla Blend recipes and the core range.",
    path: "/shop/originals",
    accent: "bg-amber-100 text-amber-900",
  },
  {
    handle: "reserve",
    label: "Shop · Reserve",
    shortLabel: "Reserve",
    description: "Limited, premium, or especially sourced products.",
    path: "/shop/reserve",
    accent: "bg-purple-100 text-purple-900",
  },
  {
    handle: "pantry",
    label: "Shop · Pantry",
    shortLabel: "Pantry",
    description: "Everyday cooking essentials and pantry staples.",
    path: "/shop/pantry",
    accent: "bg-orange-100 text-orange-900",
  },
  {
    handle: "tea-wellness",
    label: "Shop · Tea & Wellness",
    shortLabel: "Tea",
    description: "Tea, infusions, and wellness-led products.",
    path: "/shop/tea-wellness",
    accent: "bg-green-100 text-green-900",
  },
  {
    handle: "lifestyle-accessories",
    label: "Shop · Lifestyle",
    shortLabel: "Lifestyle",
    description: "Serveware, accessories, and non-food products.",
    path: "/shop/lifestyle-accessories",
    accent: "bg-blue-100 text-blue-900",
  },
  {
    handle: "gifts",
    label: "Corporate & Gifts",
    shortLabel: "Gifts",
    description: "Corporate gifting, prepared gift sets, and regional gifts.",
    path: "/gifts",
    accent: "bg-rose-100 text-rose-900",
  },
] as const;

type CollectionHandle = (typeof destinations)[number]["handle"];
type GiftType = "corporate" | "set" | "regional";

type VariantRow = {
  id: number;
  title: string;
  sku: string;
  price: string;
  stock: string;
};

type CreateResponse = { product: CatalogProduct | null };
type ManagedCatalog = {
  id: string;
  name: string;
  handle: string;
  section: CollectionHandle;
  experience: "listing" | "build_a_box";
  box_size: number | null;
  is_active: boolean;
};
type CatalogListResponse = { catalogs: ManagedCatalog[] };
type UploadedImage = { id: string; url: string };
type UploadResponse = { files: UploadedImage[] };
type ImageUploadStage = "idle" | "uploading" | "uploaded" | "failed" | "removing";

const acceptedImageTypes = ["image/jpeg", "image/png", "image/webp", "image/avif"];
const acceptedImageExtensions = ["jpg", "jpeg", "png", "webp", "avif"];
const maximumImageBytes = 8 * 1024 * 1024;

function slugify(value: string) {
  return value
    .normalize("NFKD")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 160);
}

function suggestedSku(handle: string, variant: string) {
  const productPart = slugify(handle).replaceAll("-", "_").toUpperCase().slice(0, 36);
  const variantPart = slugify(variant).replaceAll("-", "_").toUpperCase().slice(0, 20);
  return [productPart || "PRODUCT", variantPart || "SIZE"].join("-");
}

function money(value: string) {
  const amount = Number(value);
  return Number.isFinite(amount) && amount > 0
    ? new Intl.NumberFormat("en-BD", {
        style: "currency",
        currency: "BDT",
        maximumFractionDigits: 0,
      }).format(amount)
    : "Price pending";
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
        {label} {required ? <span className="text-ui-fg-error">*</span> : null}
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

export const ProductCreate = () => {
  const [title, setTitle] = useState("");
  const [handle, setHandle] = useState("");
  const [handleTouched, setHandleTouched] = useState(false);
  const [subtitle, setSubtitle] = useState("");
  const [description, setDescription] = useState("");
  const [imageFile, setImageFile] = useState<File>();
  const [imagePreview, setImagePreview] = useState<string>();
  const [uploadedImage, setUploadedImage] = useState<UploadedImage>();
  const [imageUploadStage, setImageUploadStage] = useState<ImageUploadStage>("idle");
  const [imageError, setImageError] = useState<string>();
  const [draggingImage, setDraggingImage] = useState(false);
  const [thumbnailAlt, setThumbnailAlt] = useState("");
  const [collection, setCollection] = useState<CollectionHandle>("originals");
  const [giftType, setGiftType] = useState<GiftType>("corporate");
  const [catalogs, setCatalogs] = useState<ManagedCatalog[]>();
  const [categoryIds, setCategoryIds] = useState<string[]>([]);
  const [catalogError, setCatalogError] = useState<string>();
  const [region, setRegion] = useState("");
  const [ingredients, setIngredients] = useState("");
  const [storage, setStorage] = useState("");
  const [shelfLife, setShelfLife] = useState("");
  const [usage, setUsage] = useState("");
  const [badges, setBadges] = useState("");
  const [bestSeller, setBestSeller] = useState(false);
  const [publish, setPublish] = useState(false);
  const [variants, setVariants] = useState<VariantRow[]>([
    { id: 1, title: "100 g", sku: "", price: "180", stock: "0" },
    { id: 2, title: "150 g", sku: "", price: "250", stock: "0" },
  ]);
  const [nextVariantId, setNextVariantId] = useState(3);
  const [saving, setSaving] = useState(false);
  const [saveStage, setSaveStage] = useState<"idle" | "uploading" | "creating">("idle");
  const [error, setError] = useState<string>();
  const imageInputRef = useRef<HTMLInputElement>(null);
  const imageUploadAttempt = useRef(0);

  const destination = destinations.find((entry) => entry.handle === collection)!;
  const effectiveHandle = handle || slugify(title);
  const previewVariants = useMemo(
    () => variants.filter((variant) => variant.title.trim() || variant.price.trim()),
    [variants],
  );

  useEffect(() => {
    if (!imageFile) {
      setImagePreview(undefined);
      return;
    }
    const preview = URL.createObjectURL(imageFile);
    setImagePreview(preview);
    return () => URL.revokeObjectURL(preview);
  }, [imageFile]);

  useEffect(() => {
    const controller = new AbortController();
    adminRequest<CatalogListResponse>("/admin/superadmin/catalogs", {
      signal: controller.signal,
    })
      .then((response) => {
        const activeCatalogs = response.catalogs.filter((catalog) => catalog.is_active);
        setCatalogs(activeCatalogs);
        const requestedCatalog = new URLSearchParams(window.location.search).get("catalog");
        if (requestedCatalog && activeCatalogs.some((catalog) => catalog.id === requestedCatalog)) {
          setCategoryIds((current) =>
            current.includes(requestedCatalog) ? current : [...current, requestedCatalog],
          );
        }
        setCatalogError(undefined);
      })
      .catch((caught: unknown) => {
        if (caught instanceof DOMException && caught.name === "AbortError") return;
        setCatalogs([]);
        setCatalogError(
          caught instanceof Error ? caught.message : "Storefront catalogs could not be loaded.",
        );
      });
    return () => controller.abort();
  }, []);

  const chooseDestination = (next: CollectionHandle) => {
    setCollection(next);
    if (next !== "gifts") setGiftType("corporate");
  };

  const updateVariant = (
    id: number,
    field: "title" | "sku" | "price" | "stock",
    value: string,
  ) => {
    setVariants((current) =>
      current.map((variant) => (variant.id === id ? { ...variant, [field]: value } : variant)),
    );
  };

  const addVariant = () => {
    setVariants((current) => [
      ...current,
      { id: nextVariantId, title: "", sku: "", price: "", stock: "0" },
    ]);
    setNextVariantId((current) => current + 1);
  };

  const chooseImage = async (file?: File) => {
    setDraggingImage(false);
    if (!file) return;
    const extension = file.name.split(".").pop()?.toLowerCase() ?? "";
    if (!acceptedImageTypes.includes(file.type) && !acceptedImageExtensions.includes(extension)) {
      setImageError("Choose a JPG, PNG, WebP, or AVIF image file.");
      return;
    }
    if (file.size > maximumImageBytes) {
      setImageError("This image is larger than 8 MB. Compress it or choose a smaller image.");
      return;
    }

    const attempt = ++imageUploadAttempt.current;
    const previousFile = imageFile;
    const previousUpload = uploadedImage;
    setError(undefined);
    setImageError(undefined);
    setImageFile(file);
    setImageUploadStage("uploading");
    if (!thumbnailAlt.trim() && title.trim()) setThumbnailAlt(title.trim());

    try {
      const formData = new FormData();
      formData.append("files", file, file.name);
      const upload = await adminRequest<UploadResponse>("/admin/uploads", {
        method: "POST",
        body: formData,
      });
      const uploaded = upload.files[0];
      if (!uploaded?.id || !uploaded.url) {
        throw new Error("Medusa did not return the uploaded image.");
      }

      if (attempt !== imageUploadAttempt.current) {
        await adminRequest(`/admin/uploads/${encodeURIComponent(uploaded.id)}`, {
          method: "DELETE",
        }).catch(() => undefined);
        return;
      }

      setUploadedImage(uploaded);
      setImageUploadStage("uploaded");
      if (previousUpload?.id && previousUpload.id !== uploaded.id) {
        await adminRequest(`/admin/uploads/${encodeURIComponent(previousUpload.id)}`, {
          method: "DELETE",
        }).catch(() => undefined);
      }
    } catch (caught) {
      if (attempt !== imageUploadAttempt.current) return;
      setImageFile(previousUpload ? previousFile : file);
      setUploadedImage(previousUpload);
      setImageUploadStage(previousUpload ? "uploaded" : "failed");
      setImageError(
        caught instanceof Error
          ? `Image upload failed: ${caught.message}`
          : "Image upload failed. Please try again.",
      );
    }
  };

  const dropImage = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    if (imageUploadStage === "uploading" || imageUploadStage === "removing") return;
    void chooseImage(event.dataTransfer.files[0]);
  };

  const removeImage = async () => {
    const imageToRemove = uploadedImage;
    ++imageUploadAttempt.current;
    setImageError(undefined);
    if (imageToRemove) {
      setImageUploadStage("removing");
      try {
        await adminRequest(`/admin/uploads/${encodeURIComponent(imageToRemove.id)}`, {
          method: "DELETE",
        });
      } catch (caught) {
        setImageUploadStage("uploaded");
        setImageError(
          caught instanceof Error
            ? `Could not remove the image: ${caught.message}`
            : "Could not remove the image. Please try again.",
        );
        return;
      }
    }
    setImageFile(undefined);
    setUploadedImage(undefined);
    setImageUploadStage("idle");
    if (imageInputRef.current) imageInputRef.current.value = "";
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError(undefined);
    const normalizedHandle = slugify(effectiveHandle);
    const normalizedVariants = variants.map((variant) => ({
      title: variant.title.trim(),
      sku: (variant.sku.trim() || suggestedSku(normalizedHandle, variant.title)).toUpperCase(),
      bdt_price: Number(variant.price),
      stock_quantity: Number(variant.stock),
    }));

    if (!title.trim() || !normalizedHandle) {
      setError("Add a product name and a valid storefront handle.");
      return;
    }
    if (
      normalizedVariants.some(
        (variant) =>
          !variant.title ||
          !variant.sku ||
          !Number.isFinite(variant.bdt_price) ||
          variant.bdt_price <= 0 ||
          !Number.isInteger(variant.stock_quantity) ||
          variant.stock_quantity < 0,
      )
    ) {
      setError(
        "Every variant needs a size or format, a SKU, a positive BDT price, and a whole-number stock quantity.",
      );
      return;
    }
    if (publish && normalizedVariants.some((variant) => variant.stock_quantity <= 0)) {
      setError("Published variants need stock at the primary warehouse before customers can buy them.");
      return;
    }
    if (imageFile && !uploadedImage) {
      setError("Wait for the product image to finish uploading, or retry the image upload.");
      return;
    }
    if (publish && (!description.trim() || !uploadedImage)) {
      setError("Add a full description and upload a product image before publishing.");
      return;
    }

    setSaving(true);
    setSaveStage("creating");
    try {
      const response = await adminRequest<CreateResponse>("/admin/superadmin/catalog", {
        method: "POST",
        body: JSON.stringify({
          title: title.trim(),
          handle: normalizedHandle,
          subtitle: subtitle.trim() || null,
          description: description.trim() || null,
          thumbnail: uploadedImage?.url ?? null,
          thumbnail_alt: thumbnailAlt.trim() || null,
          collection,
          gift_type: collection === "gifts" ? giftType : null,
          category_ids: categoryIds,
          region: region.trim() || null,
          ingredients: ingredients.trim() || null,
          storage: storage.trim() || null,
          shelf_life: shelfLife.trim() || null,
          usage: usage.trim() || null,
          eligible_markets: ["bd"],
          badges: badges
            .split(",")
            .map((badge) => badge.trim())
            .filter(Boolean),
          best_seller: bestSeller,
          storefront_visible: publish,
          variants: normalizedVariants,
        }),
      });
      if (!response.product) throw new Error("The product was created but could not be reopened.");
      window.location.assign(
        `${adminPath("/superadmin/catalog")}?product=${encodeURIComponent(response.product.id)}`,
      );
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "The product could not be created.");
      setSaving(false);
      setSaveStage("idle");
    }
  };

  return (
    <form className="flex flex-col gap-y-4 pb-8" onSubmit={submit}>
      <PageHeader
        title="Create a storefront product"
        subtitle="Choose where customers will discover the item, then create every weight or format with its own BDT price and SKU."
        badge="Guided product creator"
        actions={
          <Button
            type="button"
            variant="secondary"
            onClick={() => window.location.assign(adminPath("/superadmin/catalog"))}
          >
            Back to products
          </Button>
        }
      />

      {error ? (
        <Container>
          <div className="bg-ui-bg-base-error rounded-md p-4" role="alert">
            <Text className="text-ui-fg-error">{error}</Text>
          </div>
        </Container>
      ) : null}

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="flex flex-col gap-4">
          <Container>
            <div className="flex items-start justify-between gap-4">
              <div>
                <Heading level="h2">1. Storefront destination</Heading>
                <Text className="text-ui-fg-subtle mt-1">
                  One primary destination keeps navigation, collection pages, and reporting clear.
                </Text>
              </div>
              <Badge color="blue">Required</Badge>
            </div>
            <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
              {destinations.map((entry) => {
                const selected = collection === entry.handle;
                return (
                  <button
                    key={entry.handle}
                    type="button"
                    aria-pressed={selected}
                    className={`border-ui-border-base rounded-lg border p-4 text-left transition ${
                      selected
                        ? "border-ui-border-interactive shadow-borders-interactive-with-active"
                        : "hover:bg-ui-bg-subtle"
                    }`}
                    onClick={() => chooseDestination(entry.handle)}
                  >
                    <span
                      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${entry.accent}`}
                    >
                      {entry.shortLabel}
                    </span>
                    <Text weight="plus" className="mt-3">
                      {entry.label}
                    </Text>
                    <Text size="small" className="text-ui-fg-subtle mt-1">
                      {entry.description}
                    </Text>
                    <Text size="xsmall" className="text-ui-fg-interactive mt-3">
                      {entry.path}
                    </Text>
                  </button>
                );
              })}
            </div>

            {collection === "gifts" ? (
              <div className="border-ui-border-base mt-5 rounded-lg border p-4">
                <Text size="small" weight="plus">
                  Gift section
                </Text>
                <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3">
                  {[
                    ["corporate", "Corporate", "Shown in Corporate Gifting"],
                    ["set", "Gift set", "Prepared gift collections"],
                    ["regional", "Regional", "Gifts connected to place"],
                  ].map(([value, label, detail]) => (
                    <label
                      key={value}
                      className={`rounded-md border p-3 ${giftType === value ? "border-ui-border-interactive bg-ui-bg-highlight" : "border-ui-border-base"}`}
                    >
                      <span className="flex items-center gap-2 text-sm font-medium">
                        <input
                          type="radio"
                          name="gift-type"
                          checked={giftType === value}
                          onChange={() => setGiftType(value as GiftType)}
                        />
                        {label}
                      </span>
                      <Text size="xsmall" className="text-ui-fg-subtle mt-1 pl-5">
                        {detail}
                      </Text>
                    </label>
                  ))}
                </div>
              </div>
            ) : null}

            <div className="border-ui-border-base mt-5 rounded-lg border p-4">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <Text size="small" weight="plus">
                    Additional storefront catalogs
                  </Text>
                  <Text size="xsmall" className="text-ui-fg-subtle mt-1">
                    Optional. A product keeps its primary destination and can also appear in several
                    merchandising catalogs, including Gifts · Build a Box.
                  </Text>
                </div>
                <Button
                  type="button"
                  size="small"
                  variant="secondary"
                  onClick={() => window.location.assign(adminPath("/superadmin/catalogs"))}
                >
                  Manage catalogs
                </Button>
              </div>
              {catalogError ? (
                <Text size="small" className="text-ui-fg-error mt-3" role="alert">
                  {catalogError}
                </Text>
              ) : null}
              {!catalogs ? (
                <Text size="small" className="text-ui-fg-subtle mt-3">
                  Loading catalogs…
                </Text>
              ) : catalogs.length ? (
                <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-3">
                  {catalogs.map((catalog) => (
                    <label
                      key={catalog.id}
                      className={`rounded-md border p-3 ${categoryIds.includes(catalog.id) ? "border-ui-border-interactive bg-ui-bg-highlight" : "border-ui-border-base"}`}
                    >
                      <span className="flex items-center gap-2 text-sm font-medium">
                        <input
                          type="checkbox"
                          checked={categoryIds.includes(catalog.id)}
                          onChange={(event) =>
                            setCategoryIds((current) =>
                              event.target.checked
                                ? [...current, catalog.id]
                                : current.filter((id) => id !== catalog.id),
                            )
                          }
                        />
                        {catalog.name}
                      </span>
                      <Text size="xsmall" className="text-ui-fg-subtle mt-1 pl-5">
                        {destinations.find((entry) => entry.handle === catalog.section)?.shortLabel}
                        {catalog.experience === "build_a_box"
                          ? ` · Choose ${catalog.box_size ?? 3}`
                          : " · Product listing"}
                      </Text>
                    </label>
                  ))}
                </div>
              ) : (
                <Text size="small" className="text-ui-fg-subtle mt-3">
                  No managed catalogs yet. Create one before assigning this product.
                </Text>
              )}
            </div>
          </Container>

          <Container>
            <Heading level="h2">2. Product identity</Heading>
            <Text className="text-ui-fg-subtle mt-1">
              Customer-facing copy and the stable URL used across the storefront.
            </Text>
            <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
              <Field label="Product name" required>
                <Input
                  required
                  maxLength={160}
                  value={title}
                  placeholder="Mezbani Masala"
                  onChange={(event) => {
                    const value = event.target.value;
                    setTitle(value);
                    if (!handleTouched) setHandle(slugify(value));
                  }}
                />
              </Field>
              <Field
                label="Storefront handle"
                help={`Preview: /products/${effectiveHandle || "product-name"}`}
                required
              >
                <Input
                  required
                  maxLength={160}
                  value={handle}
                  placeholder="mezbani-masala"
                  onChange={(event) => {
                    setHandleTouched(true);
                    setHandle(slugify(event.target.value));
                  }}
                />
              </Field>
              <div className="md:col-span-2">
                <Field label="Short subtitle">
                  <Input
                    maxLength={255}
                    value={subtitle}
                    placeholder="A Chattogram classic, blended for home kitchens"
                    onChange={(event) => setSubtitle(event.target.value)}
                  />
                </Field>
              </div>
              <div className="md:col-span-2">
                <Field
                  label="Full description"
                  required={publish}
                  help="Required before publishing."
                >
                  <Textarea
                    rows={5}
                    maxLength={10000}
                    value={description}
                    onChange={(event) => setDescription(event.target.value)}
                  />
                </Field>
              </div>
              <Field label="Origin / region">
                <Input
                  value={region}
                  maxLength={160}
                  placeholder="Chattogram"
                  onChange={(event) => setRegion(event.target.value)}
                />
              </Field>
              <Field label="Badges" help="Comma separated, for example Bestseller, Ready to gift">
                <Input
                  value={badges}
                  maxLength={1000}
                  onChange={(event) => setBadges(event.target.value)}
                />
              </Field>
            </div>
          </Container>

          <Container>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <Heading level="h2">3. Sizes, SKUs, prices, and stock</Heading>
                <Text className="text-ui-fg-subtle mt-1">
                  Each row becomes a selectable storefront variant. Prices are in Bangladeshi taka,
                  and stock is initialized at the primary warehouse.
                </Text>
              </div>
              <Button type="button" variant="secondary" onClick={addVariant}>
                Add variant
              </Button>
            </div>
            <div className="mt-5 flex flex-col gap-3">
              {variants.map((variant, index) => (
                <div key={variant.id} className="border-ui-border-base rounded-lg border p-4">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <Text size="small" weight="plus">
                      Variant {index + 1}
                    </Text>
                    <Button
                      type="button"
                      variant="transparent"
                      disabled={variants.length === 1}
                      onClick={() =>
                        setVariants((current) => current.filter((row) => row.id !== variant.id))
                      }
                    >
                      Remove
                    </Button>
                  </div>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-[1fr_1fr_160px_160px]">
                    <Field
                      label="Size / format"
                      required
                      help="Examples: 100 g, 150 g, Gift box of 4"
                    >
                      <Input
                        required
                        maxLength={100}
                        value={variant.title}
                        onChange={(event) => updateVariant(variant.id, "title", event.target.value)}
                      />
                    </Field>
                    <Field
                      label="SKU"
                      required
                      help={`Suggested: ${suggestedSku(effectiveHandle, variant.title)}`}
                    >
                      <Input
                        maxLength={64}
                        value={variant.sku}
                        placeholder={suggestedSku(effectiveHandle, variant.title)}
                        onChange={(event) =>
                          updateVariant(variant.id, "sku", event.target.value.toUpperCase())
                        }
                      />
                    </Field>
                    <Field label="Price (BDT)" required>
                      <Input
                        required
                        type="number"
                        min="1"
                        step="1"
                        value={variant.price}
                        onChange={(event) => updateVariant(variant.id, "price", event.target.value)}
                      />
                    </Field>
                    <Field label="Initial stock" required help="Units at the primary warehouse">
                      <Input
                        required
                        type="number"
                        min="0"
                        step="1"
                        value={variant.stock}
                        onChange={(event) =>
                          updateVariant(variant.id, "stock", event.target.value)
                        }
                      />
                    </Field>
                  </div>
                </div>
              ))}
            </div>
            <div className="bg-ui-bg-subtle mt-4 rounded-lg p-4">
              <Text size="small" weight="plus">
                Storefront result
              </Text>
              <Text size="small" className="text-ui-fg-subtle mt-1">
                Customers select one option before adding to cart:{" "}
                {previewVariants
                  .map((variant) => `${variant.title || "Unnamed"} · ${money(variant.price)}`)
                  .join("  |  ") || "Add a variant"}
                .
              </Text>
            </div>
          </Container>

          <Container>
            <Heading level="h2">4. Image and product details</Heading>
            <Text className="text-ui-fg-subtle mt-1">
              Upload the customer-facing product image. Medusa stores it through the configured file
              provider and uses it as both the thumbnail and primary gallery image.
            </Text>
            <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="md:col-span-2">
                <div className="mb-1.5 flex items-center justify-between gap-3">
                  <Text size="small" weight="plus">
                    Product image {publish ? <span className="text-ui-fg-error">*</span> : null}
                  </Text>
                  <Text size="xsmall" className="text-ui-fg-subtle">
                    JPG, PNG, WebP, or AVIF · maximum 8 MB
                  </Text>
                </div>
                <div
                  className={`rounded-lg border border-dashed p-4 transition ${
                    draggingImage
                      ? "border-ui-border-interactive bg-ui-bg-highlight"
                      : "border-ui-border-strong bg-ui-bg-subtle"
                  }`}
                  onDragEnter={(event) => {
                    event.preventDefault();
                    if (imageUploadStage === "uploading" || imageUploadStage === "removing") return;
                    setDraggingImage(true);
                  }}
                  onDragOver={(event) => {
                    event.preventDefault();
                    if (imageUploadStage === "uploading" || imageUploadStage === "removing") return;
                    setDraggingImage(true);
                  }}
                  onDragLeave={(event) => {
                    if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
                      setDraggingImage(false);
                    }
                  }}
                  onDrop={dropImage}
                >
                  <input
                    ref={imageInputRef}
                    id="product-image-upload"
                    className="sr-only"
                    type="file"
                    accept={acceptedImageTypes.join(",")}
                    disabled={imageUploadStage === "uploading" || imageUploadStage === "removing"}
                    onChange={(event) => {
                      void chooseImage(event.currentTarget.files?.[0]);
                      event.currentTarget.value = "";
                    }}
                  />
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                    <div className="bg-ui-bg-base flex size-24 shrink-0 items-center justify-center overflow-hidden rounded-lg border">
                      {imagePreview ? (
                        <img
                          src={uploadedImage?.url ?? imagePreview}
                          alt="Selected product preview"
                          className="size-full object-cover"
                        />
                      ) : (
                        <Text size="xsmall" className="text-ui-fg-muted px-2 text-center">
                          Image preview
                        </Text>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <Text weight="plus">
                        {draggingImage
                          ? "Drop the image here"
                          : imageFile
                            ? imageFile.name
                            : "Upload product image"}
                      </Text>
                      <Text size="small" className="text-ui-fg-subtle mt-1">
                        {imageUploadStage === "uploading"
                          ? "Uploading securely to Medusa…"
                          : imageUploadStage === "removing"
                            ? "Removing the uploaded image…"
                            : imageUploadStage === "uploaded"
                              ? "Uploaded and ready to use on this product."
                              : "Drag and drop a file here or choose one from your computer."}
                      </Text>
                      {imageFile ? (
                        <Text size="xsmall" className="text-ui-fg-muted mt-1">
                          {(imageFile.size / 1024 / 1024).toFixed(2)} MB · {imageFile.type}
                        </Text>
                      ) : null}
                      {imageUploadStage === "uploaded" ? (
                        <div
                          className="bg-ui-bg-base-success mt-2 inline-flex items-center gap-2 rounded-md px-2.5 py-1"
                          aria-live="polite"
                        >
                          <span className="size-2 rounded-full bg-green-600" aria-hidden="true" />
                          <Text size="xsmall" className="text-ui-fg-success" weight="plus">
                            Upload complete
                          </Text>
                        </div>
                      ) : null}
                      {imageError ? (
                        <Text
                          size="small"
                          className="text-ui-fg-error mt-2"
                          role="alert"
                          aria-live="assertive"
                        >
                          {imageError}
                        </Text>
                      ) : null}
                      <div className="mt-3 flex flex-wrap gap-2">
                        <Button
                          type="button"
                          variant="secondary"
                          disabled={
                            imageUploadStage === "uploading" || imageUploadStage === "removing"
                          }
                          isLoading={imageUploadStage === "uploading"}
                          onClick={() => imageInputRef.current?.click()}
                        >
                          {imageUploadStage === "uploading"
                            ? "Uploading"
                            : imageFile
                              ? "Replace image"
                              : "Choose image"}
                        </Button>
                        {imageUploadStage === "failed" && imageFile ? (
                          <Button
                            type="button"
                            variant="secondary"
                            onClick={() => void chooseImage(imageFile)}
                          >
                            Retry upload
                          </Button>
                        ) : null}
                        {imageFile ? (
                          <Button
                            type="button"
                            variant="transparent"
                            isLoading={imageUploadStage === "removing"}
                            disabled={imageUploadStage === "uploading"}
                            onClick={() => void removeImage()}
                          >
                            {imageUploadStage === "removing" ? "Removing" : "Remove"}
                          </Button>
                        ) : null}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="md:col-span-2">
                <Field
                  label="Image alternative text"
                  help="Describe the visible product for customers using assistive technology."
                >
                  <Input
                    maxLength={300}
                    value={thumbnailAlt}
                    onChange={(event) => setThumbnailAlt(event.target.value)}
                  />
                </Field>
              </div>
              <div className="md:col-span-2">
                <Field label="Ingredients">
                  <Textarea
                    rows={3}
                    maxLength={5000}
                    value={ingredients}
                    onChange={(event) => setIngredients(event.target.value)}
                  />
                </Field>
              </div>
              <Field label="Storage guidance">
                <Textarea
                  rows={3}
                  maxLength={2000}
                  value={storage}
                  onChange={(event) => setStorage(event.target.value)}
                />
              </Field>
              <Field label="Shelf life">
                <Textarea
                  rows={3}
                  maxLength={1000}
                  value={shelfLife}
                  onChange={(event) => setShelfLife(event.target.value)}
                />
              </Field>
              <div className="md:col-span-2">
                <Field label="How to use">
                  <Textarea
                    rows={3}
                    maxLength={3000}
                    value={usage}
                    onChange={(event) => setUsage(event.target.value)}
                  />
                </Field>
              </div>
            </div>
          </Container>
        </div>

        <aside className="flex flex-col gap-4 xl:sticky xl:top-4 xl:self-start">
          <Container>
            <div className="flex items-center justify-between gap-3">
              <Heading level="h2">Live storefront preview</Heading>
              <Badge color={publish ? "green" : "grey"}>{publish ? "Published" : "Draft"}</Badge>
            </div>
            <Text size="xsmall" className="text-ui-fg-subtle mt-1">
              {destination.label} · {collection === "gifts" ? giftType : destination.path}
            </Text>
            <div className="bg-ui-bg-subtle relative mt-4 aspect-square overflow-hidden rounded-lg">
              <div
                className={`absolute inset-0 flex items-center justify-center text-6xl font-semibold ${destination.accent}`}
              >
                {(title || destination.shortLabel).slice(0, 1).toUpperCase()}
              </div>
              {imagePreview ? (
                <img
                  src={imagePreview}
                  alt={thumbnailAlt.trim() || "Selected product preview"}
                  className="absolute inset-0 size-full object-cover"
                />
              ) : null}
            </div>
            <Badge color="purple" className="mt-4">
              {collection === "gifts" ? `${giftType} gift` : destination.shortLabel}
            </Badge>
            <Heading level="h3" className="mt-3 text-xl">
              {title.trim() || "Your product name"}
            </Heading>
            <Text className="text-ui-fg-subtle mt-1">
              {subtitle.trim() || "A short product story appears here."}
            </Text>
            <div className="mt-4 flex flex-wrap gap-2">
              {previewVariants.length ? (
                previewVariants.map((variant) => (
                  <span
                    key={variant.id}
                    className="border-ui-border-base rounded-md border px-3 py-2 text-sm"
                  >
                    <strong>{variant.title || "Size"}</strong> · {money(variant.price)}
                  </span>
                ))
              ) : (
                <Text size="small" className="text-ui-fg-subtle">
                  No variants yet
                </Text>
              )}
            </div>
            <Text size="xsmall" className="text-ui-fg-subtle mt-4 break-all">
              {destination.path}/{effectiveHandle || "product-name"}
            </Text>
          </Container>

          <Container>
            <div className="flex items-start justify-between gap-4">
              <div>
                <Text size="small" weight="plus">
                  Publish to storefront
                </Text>
                <Text size="xsmall" className="text-ui-fg-subtle mt-1">
                  Drafts stay in Admin. Published products appear in the selected destination once
                  an image, description, price, and SKU are complete.
                </Text>
              </div>
              <Switch checked={publish} onCheckedChange={setPublish} />
            </div>
            <div className="border-ui-border-base mt-4 border-t pt-4">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={bestSeller}
                  onChange={(event) => setBestSeller(event.target.checked)}
                />
                Mark as best seller
              </label>
            </div>
            <Button
              type="submit"
              className="mt-5 w-full"
              isLoading={saving || imageUploadStage === "uploading"}
              disabled={imageUploadStage === "uploading" || imageUploadStage === "removing"}
            >
              {imageUploadStage === "uploading"
                ? "Uploading image"
                : saveStage === "creating"
                  ? "Creating product"
                  : publish
                    ? "Create and publish"
                    : "Create draft"}
            </Button>
            <Text size="xsmall" className="text-ui-fg-subtle mt-2 text-center">
              Inventory can be assigned per variant from Inventory after creation.
            </Text>
          </Container>
        </aside>
      </div>
    </form>
  );
};
