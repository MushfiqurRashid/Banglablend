import { useEffect, useState } from "react";
import { defineRouteConfig } from "@medusajs/admin-sdk";
import { Button, Container, Heading, Input, Table, Text } from "@medusajs/ui";
import {
  EmptyState,
  ErrorState,
  LoadingState,
  PageHeader,
  adminPath,
  adminRequest,
} from "../../../lib/superadmin";

interface InventoryItemRecord {
  id: string;
  title: string;
  sku?: string | null;
  stocked_quantity?: number;
  reserved_quantity?: number;
}

interface InventoryPayload {
  inventory_items: InventoryItemRecord[];
  count: number;
}

const InventoryStockPage = () => {
  const [query, setQuery] = useState("");
  const [items, setItems] = useState<InventoryItemRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>();

  async function search(nextQuery = query) {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        limit: "100",
        order: "title",
        fields: "id,title,sku,stocked_quantity,reserved_quantity",
      });
      if (nextQuery.trim()) params.set("q", nextQuery.trim());
      const payload = await adminRequest<InventoryPayload>(
        `/admin/inventory-items?${params.toString()}`,
      );
      setItems(payload.inventory_items ?? []);
      setError(undefined);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Inventory could not be loaded.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void search("");
  }, []);

  return (
    <div className="flex flex-col gap-y-4 pb-8">
      <PageHeader
        title="Edit Stock"
        subtitle="Choose inventory items by title or SKU, then open Medusa's native stock adjustment workflow."
        badge="Inventory operations"
      />
      <Container>
        <form
          className="flex flex-col gap-3 sm:flex-row sm:items-end"
          onSubmit={(event) => {
            event.preventDefault();
            void search();
          }}
        >
          <label className="flex flex-1 flex-col gap-1">
            <Text size="small" weight="plus">
              Product title or SKU
            </Text>
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search inventory"
            />
          </label>
          <Button type="submit" disabled={loading}>
            Search inventory
          </Button>
        </form>
      </Container>
      {error ? <ErrorState message={error} retry={() => void search()} /> : null}
      {loading ? <LoadingState label="Loading inventory..." /> : null}
      {!loading ? (
        <Container className="overflow-hidden p-0">
          <div className="border-ui-border-base border-b px-6 py-4">
            <Heading level="h2">Inventory items</Heading>
            <Text size="small" className="text-ui-fg-subtle mt-1">
              Showing up to 100 items. Stock is adjusted by item and stock location.
            </Text>
          </div>
          {items.length ? (
            <div className="overflow-x-auto">
              <Table>
                <Table.Header>
                  <Table.Row>
                    <Table.HeaderCell>Item</Table.HeaderCell>
                    <Table.HeaderCell>SKU</Table.HeaderCell>
                    <Table.HeaderCell>Stocked</Table.HeaderCell>
                    <Table.HeaderCell>Reserved</Table.HeaderCell>
                    <Table.HeaderCell className="text-right">Action</Table.HeaderCell>
                  </Table.Row>
                </Table.Header>
                <Table.Body>
                  {items.map((item) => (
                    <Table.Row key={item.id}>
                      <Table.Cell>
                        <Text weight="plus">{item.title}</Text>
                        <Text size="xsmall" className="text-ui-fg-muted max-w-52 truncate">
                          {item.id}
                        </Text>
                      </Table.Cell>
                      <Table.Cell>{item.sku || "No SKU"}</Table.Cell>
                      <Table.Cell>{item.stocked_quantity?.toLocaleString() ?? "—"}</Table.Cell>
                      <Table.Cell>{item.reserved_quantity?.toLocaleString() ?? "—"}</Table.Cell>
                      <Table.Cell>
                        <div className="flex justify-end gap-2">
                          <Button size="small" variant="secondary" asChild>
                            <a href={adminPath(`/inventory/${encodeURIComponent(item.id)}`)}>
                              View item
                            </a>
                          </Button>
                          <Button size="small" asChild>
                            <a
                              href={adminPath(
                                `/inventory/stock?inventory_item_ids=${encodeURIComponent(item.id)}`,
                              )}
                            >
                              Adjust stock
                            </a>
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
                title="No inventory items found"
                description="Check the title or SKU and try again."
              />
            </div>
          )}
        </Container>
      ) : null}
    </div>
  );
};

export const config = defineRouteConfig({
  label: "Edit Stock",
  nested: "/inventory",
  rank: 2,
});

export default InventoryStockPage;
