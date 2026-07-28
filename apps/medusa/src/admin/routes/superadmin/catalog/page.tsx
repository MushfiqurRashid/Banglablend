import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Badge, Button, Container, Heading, Input, Table, Text } from "@medusajs/ui";
import {
  EmptyState,
  ErrorState,
  LoadingState,
  PageHeader,
  adminPath,
  adminRequest,
} from "../../../lib/superadmin";
import { CatalogEditor } from "./catalog-editor";
import type { CatalogProduct, CatalogResponse } from "./types";

const PAGE_SIZE = 50;

function firstPrice(product: CatalogProduct) {
  const price = product.variants.flatMap((variant) => variant.prices ?? [])[0];
  if (
    !price ||
    typeof price.amount !== "number" ||
    !Number.isFinite(price.amount) ||
    !price.currency_code
  ) {
    return "No price";
  }

  const currency = price.currency_code.toUpperCase();
  try {
    return new Intl.NumberFormat("en-BD", {
      style: "currency",
      currency,
      maximumFractionDigits: currency === "BDT" ? 0 : 2,
    }).format(price.amount);
  } catch {
    return `${price.amount.toLocaleString("en-BD")} ${currency}`;
  }
}

function ProductImage({ product }: { product: CatalogProduct }) {
  const image = product.thumbnail || product.images[0]?.url;
  return (
    <div
      className="bg-ui-bg-subtle text-ui-fg-muted relative flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-md text-sm font-semibold"
      aria-hidden="true"
    >
      {product.title.slice(0, 1).toUpperCase() || "P"}
      {image ? (
        <img
          key={image}
          src={image}
          alt=""
          loading="lazy"
          decoding="async"
          className="absolute inset-0 size-full object-cover"
          onError={(event) => {
            event.currentTarget.hidden = true;
          }}
        />
      ) : null}
    </div>
  );
}

function productFromUrl() {
  if (typeof window === "undefined") return undefined;
  return new URLSearchParams(window.location.search).get("product") || undefined;
}

function updateProductUrl(productId?: string) {
  const url = new URL(window.location.href);
  if (productId) url.searchParams.set("product", productId);
  else url.searchParams.delete("product");
  window.history.replaceState(window.history.state, "", `${url.pathname}${url.search}${url.hash}`);
}

const CatalogWorkspace = () => {
  const [data, setData] = useState<CatalogResponse>();
  const [selected, setSelected] = useState<CatalogProduct>();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("");
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(true);
  const [openingProduct, setOpeningProduct] = useState(() => Boolean(productFromUrl()));
  const [error, setError] = useState<string>();
  const [productError, setProductError] = useState<string>();
  const [deleting, setDeleting] = useState<string>();
  const requestSequence = useRef(0);
  const appliedFilters = useRef({ search: "", status: "" });
  const lastRequest = useRef({ search: "", status: "", offset: 0 });

  const load = useCallback(async (search: string, statusFilter: string, nextOffset: number) => {
    const requestId = ++requestSequence.current;
    const normalizedOffset = Math.max(0, nextOffset);
    lastRequest.current = { search, status: statusFilter, offset: normalizedOffset };
    setLoading(true);
    setError(undefined);
    setData(undefined);
    const params = new URLSearchParams({
      limit: String(PAGE_SIZE),
      offset: String(normalizedOffset),
    });
    if (search.trim()) params.set("q", search.trim());
    if (statusFilter) params.set("status", statusFilter);
    try {
      let payload = await adminRequest<CatalogResponse>(`/admin/superadmin/catalog?${params}`);
      if (requestId !== requestSequence.current) return;
      if (!payload.products.length && payload.count > 0 && payload.offset > 0) {
        const lastOffset = Math.floor((payload.count - 1) / PAGE_SIZE) * PAGE_SIZE;
        if (lastOffset !== payload.offset) {
          params.set("offset", String(lastOffset));
          lastRequest.current.offset = lastOffset;
          payload = await adminRequest<CatalogResponse>(`/admin/superadmin/catalog?${params}`);
          if (requestId !== requestSequence.current) return;
        }
      }
      setData(payload);
      setOffset(payload.offset);
      appliedFilters.current = { search, status: statusFilter };
    } catch (caught) {
      if (requestId !== requestSequence.current) return;
      setError(caught instanceof Error ? caught.message : "The catalog could not be loaded.");
    } finally {
      if (requestId === requestSequence.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load("", "", 0);

    const requestedId = productFromUrl();
    if (!requestedId) return;

    void adminRequest<{ product: CatalogProduct | null }>(
      `/admin/superadmin/catalog/${encodeURIComponent(requestedId)}`,
    )
      .then((payload) => {
        if (!payload.product) throw new Error("The requested product no longer exists.");
        setSelected(payload.product);
      })
      .catch((caught) => {
        setProductError(
          caught instanceof Error ? caught.message : "The requested product could not be opened.",
        );
        updateProductUrl();
      })
      .finally(() => setOpeningProduct(false));
  }, [load]);

  const summary = useMemo(() => {
    const products = data?.products ?? [];
    return {
      ready: products.filter((product) => product.readiness.ready).length,
      draft: products.filter((product) => product.status === "draft").length,
      missingMedia: products.filter((product) => !product.readiness.checks.media).length,
      missingPrice: products.filter((product) => !product.readiness.checks.price).length,
    };
  }, [data]);

  const rangeStart = data?.count ? data.offset + 1 : 0;
  const rangeEnd = data ? Math.min(data.offset + data.products.length, data.count) : 0;
  const hasPreviousPage = Boolean(data && data.offset > 0);
  const hasNextPage = Boolean(data && data.offset + data.products.length < data.count);

  function updateSelected(product: CatalogProduct) {
    setSelected(product);
    setData((current) =>
      current
        ? {
            ...current,
            products: current.products.map((item) => (item.id === product.id ? product : item)),
          }
        : current,
    );
  }

  function openProduct(product: CatalogProduct) {
    setProductError(undefined);
    setSelected(product);
    updateProductUrl(product.id);
  }

  function closeEditor() {
    setSelected(undefined);
    setProductError(undefined);
    updateProductUrl();
    void load(appliedFilters.current.search, appliedFilters.current.status, offset);
  }

  async function remove(product: CatalogProduct) {
    const confirmed = window.confirm(
      `Delete "${product.title}"?\n\nThis removes the product from Medusa and the storefront. Orders and audit evidence remain intact. This action cannot be undone from the dashboard.`,
    );
    if (!confirmed) return;
    setDeleting(product.id);
    setError(undefined);
    try {
      await adminRequest(`/admin/superadmin/catalog/${encodeURIComponent(product.id)}`, {
        method: "DELETE",
      });
      const shouldLoadPreviousPage = data?.products.length === 1 && data.offset > 0;
      const previousOffset = Math.max(0, (data?.offset ?? 0) - PAGE_SIZE);
      setSelected((current) => (current?.id === product.id ? undefined : current));
      setData((current) =>
        current
          ? {
              ...current,
              count: Math.max(0, current.count - 1),
              products: current.products.filter((item) => item.id !== product.id),
            }
          : current,
      );
      if (shouldLoadPreviousPage) {
        await load(appliedFilters.current.search, appliedFilters.current.status, previousOffset);
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "The product could not be deleted.");
    } finally {
      setDeleting(undefined);
    }
  }

  if (selected) {
    return <CatalogEditor product={selected} onSaved={updateSelected} onClose={closeEditor} />;
  }

  if (openingProduct) {
    return (
      <div className="flex flex-col gap-y-4 pb-8">
        <PageHeader
          title="Catalog workspace"
          subtitle="Opening the requested product and its operational profiles."
          badge="Products & merchandising"
        />
        <LoadingState label="Opening product…" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-y-4 pb-8">
      <PageHeader
        title="Catalog workspace"
        subtitle="A guided catalog control layer over Medusa’s native product, variant, pricing, inventory, media, collection, and category tools."
        badge="Products & merchandising"
        actions={
          <>
            <Button
              variant="secondary"
              onClick={() => window.location.assign(adminPath("/superadmin"))}
            >
              Control center
            </Button>
            <Button onClick={() => window.location.assign(adminPath("/products/create"))}>
              Add product
            </Button>
          </>
        }
      />

      {productError ? <ErrorState message={productError} /> : null}
      {error ? (
        <ErrorState
          message={error}
          retry={() =>
            void load(
              lastRequest.current.search,
              lastRequest.current.status,
              lastRequest.current.offset,
            )
          }
        />
      ) : null}

      {data ? (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <Container>
            <Text size="small" className="text-ui-fg-subtle">
              Ready on this page
            </Text>
            <Heading level="h2" className="mt-2 text-2xl">
              {summary.ready}
            </Heading>
          </Container>
          <Container>
            <Text size="small" className="text-ui-fg-subtle">
              Drafts on this page
            </Text>
            <Heading level="h2" className="mt-2 text-2xl">
              {summary.draft}
            </Heading>
          </Container>
          <Container>
            <Text size="small" className="text-ui-fg-subtle">
              Missing media on this page
            </Text>
            <Heading level="h2" className="mt-2 text-2xl">
              {summary.missingMedia}
            </Heading>
          </Container>
          <Container>
            <Text size="small" className="text-ui-fg-subtle">
              Missing price on this page
            </Text>
            <Heading level="h2" className="mt-2 text-2xl">
              {summary.missingPrice}
            </Heading>
          </Container>
        </div>
      ) : null}

      <Container>
        <form
          className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between"
          onSubmit={(event) => {
            event.preventDefault();
            void load(query, status, 0);
          }}
        >
          <div className="flex flex-1 flex-col gap-3 sm:flex-row">
            <label className="flex flex-1 flex-col gap-1">
              <Text size="small" weight="plus">
                Search products
              </Text>
              <Input
                placeholder="Title, handle, description, or SKU"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
            </label>
            <label className="flex min-w-48 flex-col gap-1">
              <Text size="small" weight="plus">
                Status
              </Text>
              <select
                className="border-ui-border-base bg-ui-bg-field rounded-md border px-3 py-2 text-sm"
                value={status}
                onChange={(event) => {
                  setStatus(event.target.value);
                  void load(query, event.target.value, 0);
                }}
              >
                <option value="">All statuses</option>
                <option value="draft">Draft</option>
                <option value="proposed">Proposed</option>
                <option value="published">Published</option>
                <option value="rejected">Rejected</option>
              </select>
            </label>
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setQuery("");
                setStatus("");
                void load("", "", 0);
              }}
            >
              Clear
            </Button>
            <Button type="submit" variant="secondary">
              Search
            </Button>
          </div>
        </form>
      </Container>

      {loading ? <LoadingState label="Loading products and operational profiles…" /> : null}

      {!loading && data ? (
        <Container className="overflow-hidden p-0">
          <div className="border-ui-border-base flex flex-col gap-2 border-b px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <Heading level="h2">Products</Heading>
              <Text size="small" className="text-ui-fg-subtle mt-1">
                Showing {rangeStart.toLocaleString()}–{rangeEnd.toLocaleString()} of{" "}
                {data.count.toLocaleString()} matching catalog records
              </Text>
            </div>
            <div className="flex flex-wrap gap-2">
              <a
                className="text-ui-fg-interactive text-sm font-medium hover:underline"
                href={adminPath("/collections")}
              >
                Collections
              </a>
              <span className="text-ui-fg-muted">·</span>
              <a
                className="text-ui-fg-interactive text-sm font-medium hover:underline"
                href={adminPath("/categories")}
              >
                Categories
              </a>
              <span className="text-ui-fg-muted">·</span>
              <a
                className="text-ui-fg-interactive text-sm font-medium hover:underline"
                href={adminPath("/inventory")}
              >
                Inventory
              </a>
              <span className="text-ui-fg-muted">·</span>
              <a
                className="text-ui-fg-interactive text-sm font-medium hover:underline"
                href={adminPath("/price-lists")}
              >
                Price lists
              </a>
            </div>
          </div>
          {data.products.length ? (
            <div className="overflow-x-auto">
              <Table>
                <Table.Header>
                  <Table.Row>
                    <Table.HeaderCell>Product</Table.HeaderCell>
                    <Table.HeaderCell>Status</Table.HeaderCell>
                    <Table.HeaderCell>Variants</Table.HeaderCell>
                    <Table.HeaderCell>From price</Table.HeaderCell>
                    <Table.HeaderCell>Readiness</Table.HeaderCell>
                    <Table.HeaderCell className="text-right">Actions</Table.HeaderCell>
                  </Table.Row>
                </Table.Header>
                <Table.Body>
                  {data.products.map((product) => (
                    <Table.Row key={product.id}>
                      <Table.Cell>
                        <div className="flex min-w-64 items-center gap-3">
                          <ProductImage product={product} />
                          <div className="min-w-0">
                            <Text weight="plus" className="truncate">
                              {product.title}
                            </Text>
                            <Text size="small" className="text-ui-fg-subtle truncate">
                              /{product.handle}
                            </Text>
                            <Text size="xsmall" className="text-ui-fg-muted truncate">
                              {product.collection?.title ?? "No collection"}
                            </Text>
                          </div>
                        </div>
                      </Table.Cell>
                      <Table.Cell>
                        <Badge
                          color={
                            product.status === "published"
                              ? "green"
                              : product.status === "rejected"
                                ? "red"
                                : "grey"
                          }
                        >
                          {product.status}
                        </Badge>
                      </Table.Cell>
                      <Table.Cell>
                        <Text>{product.variants.length}</Text>
                        <Text size="xsmall" className="text-ui-fg-subtle">
                          {product.variants[0]?.sku || "SKU missing"}
                        </Text>
                      </Table.Cell>
                      <Table.Cell>{firstPrice(product)}</Table.Cell>
                      <Table.Cell>
                        <Badge color={product.readiness.ready ? "green" : "orange"}>
                          {product.readiness.ready
                            ? "Ready"
                            : `${product.readiness.missing.length} missing`}
                        </Badge>
                        {!product.readiness.ready ? (
                          <Text size="xsmall" className="text-ui-fg-subtle mt-1 max-w-56">
                            {product.readiness.missing.join(", ")}
                          </Text>
                        ) : null}
                      </Table.Cell>
                      <Table.Cell>
                        <div className="flex min-w-56 justify-end gap-2">
                          <Button
                            size="small"
                            variant="secondary"
                            onClick={() => openProduct(product)}
                          >
                            Operations
                          </Button>
                          <Button
                            size="small"
                            variant="secondary"
                            onClick={() =>
                              window.location.assign(adminPath(`/products/${product.id}`))
                            }
                          >
                            Core edit
                          </Button>
                          <Button
                            size="small"
                            variant="danger"
                            disabled={Boolean(deleting)}
                            isLoading={deleting === product.id}
                            onClick={() => void remove(product)}
                          >
                            Delete
                          </Button>
                        </div>
                      </Table.Cell>
                    </Table.Row>
                  ))}
                </Table.Body>
              </Table>
            </div>
          ) : (
            <div className="p-6">
              <EmptyState
                title="No products found"
                description="Change the filters or create the first product in the core product editor."
              />
            </div>
          )}
          {data.count ? (
            <div className="border-ui-border-base flex flex-col gap-3 border-t px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
              <Text size="small" className="text-ui-fg-subtle">
                Page {Math.floor(data.offset / data.limit) + 1} of{" "}
                {Math.max(1, Math.ceil(data.count / data.limit))}
              </Text>
              <div className="flex gap-2">
                <Button
                  type="button"
                  size="small"
                  variant="secondary"
                  disabled={!hasPreviousPage || loading}
                  onClick={() =>
                    void load(
                      appliedFilters.current.search,
                      appliedFilters.current.status,
                      Math.max(0, offset - PAGE_SIZE),
                    )
                  }
                >
                  Previous
                </Button>
                <Button
                  type="button"
                  size="small"
                  variant="secondary"
                  disabled={!hasNextPage || loading}
                  onClick={() =>
                    void load(
                      appliedFilters.current.search,
                      appliedFilters.current.status,
                      offset + PAGE_SIZE,
                    )
                  }
                >
                  Next
                </Button>
              </div>
            </div>
          ) : null}
        </Container>
      ) : null}

      <Container>
        <Heading level="h2">Safe product workflow</Heading>
        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-4">
          {[
            [
              "1. Create",
              "Add title, handle, collection, options, variants, and SKUs in the core editor.",
            ],
            [
              "2. Price & stock",
              "Add approved market prices and inventory levels at the correct stock location.",
            ],
            [
              "3. Enrich",
              "Upload images, enter description, alt text, ingredients, market rules, and origin evidence.",
            ],
            [
              "4. Publish",
              "Use Show in storefront; the backend validates every required readiness check.",
            ],
          ].map(([title, copy]) => (
            <div key={title} className="border-ui-border-base rounded-lg border p-4">
              <Text weight="plus">{title}</Text>
              <Text size="small" className="text-ui-fg-subtle mt-2">
                {copy}
              </Text>
            </div>
          ))}
        </div>
      </Container>
    </div>
  );
};

export default CatalogWorkspace;
