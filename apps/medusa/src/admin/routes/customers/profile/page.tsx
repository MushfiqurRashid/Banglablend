import { useEffect, useState } from "react";
import { defineRouteConfig } from "@medusajs/admin-sdk";
import { Badge, Button, Container, Heading, Input, Table, Text } from "@medusajs/ui";
import {
  EmptyState,
  ErrorState,
  LoadingState,
  PageHeader,
  adminPath,
  adminRequest,
} from "../../../lib/superadmin";

interface AdminCustomerRecord {
  id: string;
  email: string;
  first_name?: string | null;
  last_name?: string | null;
  phone?: string | null;
  has_account?: boolean;
  created_at?: string;
}

interface CustomersPayload {
  customers: AdminCustomerRecord[];
  count: number;
}

const customerFields = [
  "id",
  "email",
  "first_name",
  "last_name",
  "phone",
  "has_account",
  "created_at",
].join(",");

const CustomerProfileLookupPage = () => {
  const [query, setQuery] = useState("");
  const [customers, setCustomers] = useState<AdminCustomerRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>();

  async function search(nextQuery = query) {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        limit: "50",
        order: "-created_at",
        fields: customerFields,
      });
      if (nextQuery.trim()) params.set("q", nextQuery.trim());
      const payload = await adminRequest<CustomersPayload>(`/admin/customers?${params.toString()}`);
      setCustomers(payload.customers ?? []);
      setError(undefined);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Customers could not be searched.");
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
        title="Customer Profile"
        subtitle="Find a customer by name, email, phone, or ID and open the complete Medusa customer record."
        badge="Customer lookup"
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
              Name, email, phone, or customer ID
            </Text>
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search customers"
            />
          </label>
          <Button type="submit" disabled={loading}>
            Search customers
          </Button>
        </form>
      </Container>
      {error ? <ErrorState message={error} retry={() => void search()} /> : null}
      {loading ? <LoadingState label="Searching customer profiles..." /> : null}
      {!loading ? (
        <Container className="overflow-hidden p-0">
          <div className="border-ui-border-base border-b px-6 py-4">
            <Heading level="h2">{query.trim() ? "Matching customers" : "Recent customers"}</Heading>
            <Text size="small" className="text-ui-fg-subtle mt-1">
              {query.trim() ? `Results for “${query.trim()}”.` : "The 50 newest customer records."}
            </Text>
          </div>
          {customers.length ? (
            <div className="overflow-x-auto">
              <Table>
                <Table.Header>
                  <Table.Row>
                    <Table.HeaderCell>Customer</Table.HeaderCell>
                    <Table.HeaderCell>Email</Table.HeaderCell>
                    <Table.HeaderCell>Phone</Table.HeaderCell>
                    <Table.HeaderCell>Account</Table.HeaderCell>
                    <Table.HeaderCell className="text-right">Action</Table.HeaderCell>
                  </Table.Row>
                </Table.Header>
                <Table.Body>
                  {customers.map((customer) => {
                    const name = [customer.first_name, customer.last_name]
                      .filter(Boolean)
                      .join(" ");
                    return (
                      <Table.Row key={customer.id}>
                        <Table.Cell>
                          <Text weight="plus">{name || "Unnamed customer"}</Text>
                          <Text size="xsmall" className="text-ui-fg-muted max-w-52 truncate">
                            {customer.id}
                          </Text>
                        </Table.Cell>
                        <Table.Cell>{customer.email}</Table.Cell>
                        <Table.Cell>{customer.phone || "Not provided"}</Table.Cell>
                        <Table.Cell>
                          <Badge color={customer.has_account ? "green" : "grey"}>
                            {customer.has_account ? "Registered" : "Guest"}
                          </Badge>
                        </Table.Cell>
                        <Table.Cell>
                          <div className="flex justify-end">
                            <Button size="small" variant="secondary" asChild>
                              <a href={adminPath(`/customers/${encodeURIComponent(customer.id)}`)}>
                                Open profile
                              </a>
                            </Button>
                          </div>
                        </Table.Cell>
                      </Table.Row>
                    );
                  })}
                </Table.Body>
              </Table>
            </div>
          ) : (
            <div className="p-6">
              <EmptyState
                title="No customers found"
                description="Check the name, email, phone, or ID and try again."
              />
            </div>
          )}
        </Container>
      ) : null}
    </div>
  );
};

export const config = defineRouteConfig({
  label: "Customer Profile",
  nested: "/customers",
  rank: 3,
});

export default CustomerProfileLookupPage;
