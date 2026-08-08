import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { Badge, Button, Container, Heading, Input, Switch, Text, Textarea } from "@medusajs/ui";
import {
  ErrorState,
  LoadingState,
  PageHeader,
  adminPath,
  adminRequest,
} from "../../../lib/superadmin";

const sections = [
  ["originals", "Shop · Originals"],
  ["reserve", "Shop · Reserve"],
  ["pantry", "Shop · Pantry"],
  ["tea-wellness", "Shop · Tea & Wellness"],
  ["lifestyle-accessories", "Shop · Lifestyle"],
  ["gifts", "Gifts"],
] as const;

type Section = (typeof sections)[number][0];
type Experience = "listing" | "build_a_box";

type StorefrontCatalog = {
  id: string;
  name: string;
  handle: string;
  description: string;
  section: Section;
  experience: Experience;
  box_size: number | null;
  is_active: boolean;
  product_count: number;
};

type CatalogListResponse = { catalogs: StorefrontCatalog[]; count: number };
type CatalogResponse = { catalog: StorefrontCatalog };

function slugify(value: string) {
  return value
    .normalize("NFKD")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 160);
}

function storefrontPath(catalog: StorefrontCatalog) {
  return catalog.section === "gifts"
    ? `/gifts/${catalog.handle}`
    : `/shop/${catalog.section}/${catalog.handle}`;
}

const StorefrontCatalogsPage = () => {
  const [catalogs, setCatalogs] = useState<StorefrontCatalog[]>();
  const [name, setName] = useState("");
  const [handle, setHandle] = useState("");
  const [handleTouched, setHandleTouched] = useState(false);
  const [description, setDescription] = useState("");
  const [section, setSection] = useState<Section>("gifts");
  const [experience, setExperience] = useState<Experience>("listing");
  const [boxSize, setBoxSize] = useState("3");
  const [saving, setSaving] = useState(false);
  const [updatingId, setUpdatingId] = useState<string>();
  const [deletingId, setDeletingId] = useState<string>();
  const [error, setError] = useState<string>();
  const [notice, setNotice] = useState<string>();

  const load = useCallback(async () => {
    setError(undefined);
    try {
      const response = await adminRequest<CatalogListResponse>("/admin/superadmin/catalogs");
      setCatalogs(response.catalogs);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Catalogs could not be loaded.");
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const grouped = useMemo(
    () =>
      sections.map(([sectionHandle, label]) => ({
        section: sectionHandle,
        label,
        catalogs: (catalogs ?? []).filter((catalog) => catalog.section === sectionHandle),
      })),
    [catalogs],
  );

  async function createCatalog(event: FormEvent) {
    event.preventDefault();
    setError(undefined);
    setNotice(undefined);
    const normalizedHandle = slugify(handle || name);
    if (!name.trim() || !normalizedHandle) {
      setError("Enter a catalog name and valid URL handle.");
      return;
    }

    setSaving(true);
    try {
      const response = await adminRequest<CatalogResponse>("/admin/superadmin/catalogs", {
        method: "POST",
        body: JSON.stringify({
          name: name.trim(),
          handle: normalizedHandle,
          description: description.trim() || null,
          section,
          experience,
          box_size: experience === "build_a_box" ? Number(boxSize) : null,
        }),
      });
      setCatalogs((current) =>
        [...(current ?? []), response.catalog].sort(
          (left, right) =>
            left.section.localeCompare(right.section) || left.name.localeCompare(right.name),
        ),
      );
      setName("");
      setHandle("");
      setHandleTouched(false);
      setDescription("");
      setExperience("listing");
      setBoxSize("3");
      setNotice(`${response.catalog.name} is ready for product assignments.`);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "The catalog could not be created.");
    } finally {
      setSaving(false);
    }
  }

  async function setActive(catalog: StorefrontCatalog, isActive: boolean) {
    setUpdatingId(catalog.id);
    setError(undefined);
    setNotice(undefined);
    try {
      const response = await adminRequest<CatalogResponse>(
        `/admin/superadmin/catalogs/${encodeURIComponent(catalog.id)}`,
        {
          method: "POST",
          body: JSON.stringify({ is_active: isActive }),
        },
      );
      setCatalogs((current) =>
        current?.map((entry) => (entry.id === catalog.id ? response.catalog : entry)),
      );
      setNotice(`${catalog.name} is now ${isActive ? "visible" : "hidden"} in the storefront.`);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "The catalog could not be updated.");
    } finally {
      setUpdatingId(undefined);
    }
  }

  async function deleteCatalog(catalog: StorefrontCatalog) {
    const confirmed = window.confirm(
      `Delete "${catalog.name}"?\n\nThis removes the catalog from the storefront and detaches it from ${catalog.product_count} product${catalog.product_count === 1 ? "" : "s"}. Products, collections, prices, inventory, and orders are not deleted. This cannot be undone from the dashboard.`,
    );
    if (!confirmed) return;

    setDeletingId(catalog.id);
    setError(undefined);
    setNotice(undefined);
    try {
      await adminRequest(`/admin/superadmin/catalogs/${encodeURIComponent(catalog.id)}`, {
        method: "DELETE",
      });
      setCatalogs((current) => current?.filter((entry) => entry.id !== catalog.id));
      setNotice(`Deleted ${catalog.name}. Its products and commerce records were preserved.`);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "The catalog could not be deleted.");
    } finally {
      setDeletingId(undefined);
    }
  }

  return (
    <div className="flex flex-col gap-y-4 pb-8">
      <PageHeader
        title="Storefront catalogs"
        subtitle="Create reusable product groupings beneath a primary storefront section. Products keep their main collection and can belong to several catalogs for merchandising."
        badge="Catalog architecture"
        actions={
          <>
            <Button
              variant="secondary"
              onClick={() => window.location.assign(adminPath("/categories"))}
            >
              Organize category tree
            </Button>
            <Button
              variant="secondary"
              onClick={() => window.location.assign(adminPath("/superadmin/catalog"))}
            >
              Back to products
            </Button>
          </>
        }
      />

      {error ? <ErrorState message={error} retry={() => void load()} /> : null}
      {notice ? (
        <Container>
          <Text className="text-ui-fg-success" role="status">
            {notice}
          </Text>
        </Container>
      ) : null}

      <Container>
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
          <form className="grid grid-cols-1 gap-4 md:grid-cols-2" onSubmit={createCatalog}>
            <div className="md:col-span-2">
              <Heading level="h2">Add a catalog</Heading>
              <Text className="text-ui-fg-subtle mt-1">
                Example: choose Gifts, name it Build a Box, and use the interactive box builder.
              </Text>
            </div>
            <label className="flex flex-col gap-1.5">
              <Text size="small" weight="plus">
                Catalog name *
              </Text>
              <Input
                required
                maxLength={160}
                value={name}
                placeholder="Build a Box"
                onChange={(event) => {
                  setName(event.target.value);
                  if (!handleTouched) setHandle(slugify(event.target.value));
                }}
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <Text size="small" weight="plus">
                URL handle *
              </Text>
              <Input
                required
                maxLength={160}
                value={handle}
                placeholder="build-a-box"
                onChange={(event) => {
                  setHandleTouched(true);
                  setHandle(slugify(event.target.value));
                }}
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <Text size="small" weight="plus">
                Parent storefront section *
              </Text>
              <select
                className="border-ui-border-base bg-ui-bg-field rounded-md border px-3 py-2 text-sm"
                value={section}
                onChange={(event) => setSection(event.target.value as Section)}
              >
                {sections.map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1.5">
              <Text size="small" weight="plus">
                Customer experience *
              </Text>
              <select
                className="border-ui-border-base bg-ui-bg-field rounded-md border px-3 py-2 text-sm"
                value={experience}
                onChange={(event) => setExperience(event.target.value as Experience)}
              >
                <option value="listing">Standard product listing</option>
                <option value="build_a_box">Interactive Build a Box</option>
              </select>
            </label>
            {experience === "build_a_box" ? (
              <label className="flex flex-col gap-1.5">
                <Text size="small" weight="plus">
                  Products per box *
                </Text>
                <Input
                  required
                  type="number"
                  min="2"
                  max="12"
                  step="1"
                  value={boxSize}
                  onChange={(event) => setBoxSize(event.target.value)}
                />
              </label>
            ) : null}
            <label className="flex flex-col gap-1.5 md:col-span-2">
              <Text size="small" weight="plus">
                Customer-facing description
              </Text>
              <Textarea
                rows={3}
                maxLength={1000}
                value={description}
                onChange={(event) => setDescription(event.target.value)}
              />
            </label>
            <div className="md:col-span-2">
              <Button type="submit" isLoading={saving}>
                Create catalog
              </Button>
            </div>
          </form>

          <div className="bg-ui-bg-subtle rounded-lg p-5">
            <Heading level="h3">How catalog placement works</Heading>
            <div className="mt-3 flex flex-col gap-3">
              <Text size="small">
                <strong>Collection:</strong> the product’s one primary destination and reporting
                owner.
              </Text>
              <Text size="small">
                <strong>Catalog:</strong> an additional, reusable customer grouping. A product can
                be in several.
              </Text>
              <Text size="small">
                <strong>Build a Box:</strong> only assigned products are offered in the box builder.
              </Text>
            </div>
          </div>
        </div>
      </Container>

      {!catalogs ? <LoadingState label="Loading storefront catalogs…" /> : null}

      {catalogs ? (
        <div className="flex flex-col gap-4">
          {grouped.map((group) => (
            <Container key={group.section}>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <Heading level="h2">{group.label}</Heading>
                  <Text size="small" className="text-ui-fg-subtle mt-1">
                    {group.catalogs.length} managed catalog{group.catalogs.length === 1 ? "" : "s"}
                  </Text>
                </div>
                <Badge color="blue">Primary section</Badge>
              </div>
              {group.catalogs.length ? (
                <div className="mt-4 grid grid-cols-1 gap-3 lg:grid-cols-2">
                  {group.catalogs.map((catalog) => (
                    <div key={catalog.id} className="border-ui-border-base rounded-lg border p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <Heading level="h3">{catalog.name}</Heading>
                            <Badge color={catalog.experience === "build_a_box" ? "purple" : "grey"}>
                              {catalog.experience === "build_a_box" ? "Build a Box" : "Listing"}
                            </Badge>
                            <Badge color={catalog.is_active ? "green" : "orange"}>
                              {catalog.is_active ? "Visible" : "Hidden"}
                            </Badge>
                          </div>
                          <Text size="small" className="text-ui-fg-subtle mt-2">
                            {catalog.description || "No storefront description yet."}
                          </Text>
                          <Text size="xsmall" className="text-ui-fg-muted mt-2">
                            {catalog.product_count} product{catalog.product_count === 1 ? "" : "s"}{" "}
                            · {storefrontPath(catalog)}
                          </Text>
                        </div>
                        <Switch
                          checked={catalog.is_active}
                          disabled={Boolean(updatingId || deletingId)}
                          onCheckedChange={(checked) => void setActive(catalog, checked)}
                          aria-label={`${catalog.is_active ? "Hide" : "Show"} ${catalog.name}`}
                        />
                      </div>
                      <div className="mt-4 flex flex-wrap gap-2">
                        <Button
                          size="small"
                          variant="secondary"
                          onClick={() =>
                            window.location.assign(
                              `${adminPath("/superadmin/catalog/create")}?catalog=${encodeURIComponent(catalog.id)}`,
                            )
                          }
                        >
                          Add assigned product
                        </Button>
                        <a
                          className="text-ui-fg-interactive inline-flex items-center px-2 text-sm font-medium hover:underline"
                          href={storefrontPath(catalog)}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          Open storefront
                        </a>
                        <Button
                          size="small"
                          variant="danger"
                          disabled={Boolean(updatingId || deletingId)}
                          isLoading={deletingId === catalog.id}
                          onClick={() => void deleteCatalog(catalog)}
                        >
                          Delete catalog
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="border-ui-border-base mt-4 rounded-lg border border-dashed p-5">
                  <Text className="text-ui-fg-subtle">No sub-catalogs in this section yet.</Text>
                </div>
              )}
            </Container>
          ))}
        </div>
      ) : null}
    </div>
  );
};

export default StorefrontCatalogsPage;
