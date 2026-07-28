import { useEffect, useMemo, useState } from "react";
import { Badge, Button, Container, Heading, Input, Table, Text } from "@medusajs/ui";
import {
  EmptyState,
  ErrorState,
  LoadingState,
  PageHeader,
  adminPath,
  adminRequest,
} from "../../../lib/superadmin";

interface AdminAuditLog {
  id: string;
  actor_id: string;
  actor_email?: string | null;
  action: string;
  resource_type: string;
  resource_id?: string | null;
  resource_label?: string | null;
  summary: string;
  before?: unknown;
  after?: unknown;
  request_id?: string | null;
  metadata?: Record<string, unknown> | null;
  created_at?: string;
}

interface AuditPayload {
  audit_logs: AdminAuditLog[];
  count: number;
  offset: number;
  limit: number;
  immutable: true;
}

interface AuditFilters {
  resourceType: string;
  action: string;
  actorId: string;
}

const emptyFilters: AuditFilters = {
  resourceType: "",
  action: "",
  actorId: "",
};

const pageSize = 100;

function humanize(value: string) {
  return value
    .replaceAll(".", " · ")
    .replaceAll("_", " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

function actionTone(action: string): "grey" | "green" | "blue" | "orange" | "red" | "purple" {
  if (action.endsWith(".deleted")) return "red";
  if (action.endsWith(".created")) return "green";
  if (action.endsWith(".updated")) return "blue";
  if (/refund|cancel|reject|fail/i.test(action)) return "orange";
  return "purple";
}

function formatDate(value?: string) {
  if (!value) return "Time not recorded";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-BD", {
    dateStyle: "medium",
    timeStyle: "medium",
  }).format(date);
}

function formatSnapshot(value: unknown) {
  if (value === undefined || value === null) return "No snapshot recorded.";
  return JSON.stringify(value, null, 2);
}

function Snapshot({
  title,
  value,
  emptyLabel,
}: {
  title: string;
  value: unknown;
  emptyLabel: string;
}) {
  const hasValue = value !== undefined && value !== null;
  return (
    <div className="min-w-0">
      <div className="mb-2 flex items-center justify-between gap-2">
        <Text weight="plus">{title}</Text>
        <Badge color={hasValue ? "grey" : "orange"}>{hasValue ? "Recorded" : emptyLabel}</Badge>
      </div>
      <pre className="bg-ui-bg-subtle text-ui-fg-base max-h-96 overflow-auto rounded-lg p-4 text-xs break-words whitespace-pre-wrap">
        {formatSnapshot(value)}
      </pre>
    </div>
  );
}

function AuditDetail({ audit, onClose }: { audit: AdminAuditLog; onClose: () => void }) {
  return (
    <Container>
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge color={actionTone(audit.action)}>{humanize(audit.action)}</Badge>
            <Badge color="grey">{audit.resource_type}</Badge>
            <Badge color="purple">Read only</Badge>
          </div>
          <Heading level="h2" className="mt-3">
            {audit.resource_label || audit.summary}
          </Heading>
          <Text className="text-ui-fg-subtle mt-2 max-w-4xl">{audit.summary}</Text>
        </div>
        <Button variant="secondary" onClick={onClose}>
          Close details
        </Button>
      </div>

      <dl className="border-ui-border-base mt-6 grid grid-cols-1 gap-3 rounded-lg border p-4 sm:grid-cols-2 xl:grid-cols-4">
        <div>
          <Text size="xsmall" className="text-ui-fg-muted tracking-wide uppercase">
            Occurred
          </Text>
          <Text size="small" weight="plus" className="mt-1">
            {formatDate(audit.created_at)}
          </Text>
        </div>
        <div>
          <Text size="xsmall" className="text-ui-fg-muted tracking-wide uppercase">
            Actor
          </Text>
          <Text size="small" weight="plus" className="mt-1">
            {audit.actor_email || audit.actor_id}
          </Text>
          {audit.actor_email ? (
            <Text size="xsmall" className="text-ui-fg-muted">
              {audit.actor_id}
            </Text>
          ) : null}
        </div>
        <div>
          <Text size="xsmall" className="text-ui-fg-muted tracking-wide uppercase">
            Resource
          </Text>
          <Text size="small" weight="plus" className="mt-1">
            {audit.resource_type}
          </Text>
          <Text size="xsmall" className="text-ui-fg-muted">
            {audit.resource_id || "No resource ID"}
          </Text>
        </div>
        <div>
          <Text size="xsmall" className="text-ui-fg-muted tracking-wide uppercase">
            Request
          </Text>
          <Text size="small" weight="plus" className="mt-1 break-all">
            {audit.request_id || "Not recorded"}
          </Text>
        </div>
      </dl>

      <div className="mt-6 grid grid-cols-1 gap-4 xl:grid-cols-2">
        <Snapshot title="Before" value={audit.before} emptyLabel="Not applicable" />
        <Snapshot title="After" value={audit.after} emptyLabel="Not applicable" />
      </div>
      {audit.metadata ? (
        <div className="mt-4">
          <Snapshot title="Audit metadata" value={audit.metadata} emptyLabel="None" />
        </div>
      ) : null}
    </Container>
  );
}

const AuditPage = () => {
  const [data, setData] = useState<AuditPayload>();
  const [filters, setFilters] = useState<AuditFilters>(emptyFilters);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>();
  const [selected, setSelected] = useState<AdminAuditLog>();

  async function load(nextOffset = 0, appliedFilters = filters) {
    setLoading(true);
    setError(undefined);
    const params = new URLSearchParams({
      limit: String(pageSize),
      offset: String(nextOffset),
    });
    if (appliedFilters.resourceType.trim()) {
      params.set("resource_type", appliedFilters.resourceType.trim());
    }
    if (appliedFilters.action.trim()) params.set("action", appliedFilters.action.trim());
    if (appliedFilters.actorId.trim()) params.set("actor_id", appliedFilters.actorId.trim());
    try {
      const payload = await adminRequest<AuditPayload>(
        `/admin/superadmin/audit-logs?${params.toString()}`,
      );
      setData(payload);
      setSelected((current) =>
        current ? payload.audit_logs.find((audit) => audit.id === current.id) : undefined,
      );
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Audit history could not be loaded.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load(0, emptyFilters);
  }, []);

  const filteredLogs = useMemo(() => {
    const normalized = search.trim().toLowerCase();
    if (!normalized) return data?.audit_logs ?? [];
    return (data?.audit_logs ?? []).filter((audit) =>
      [
        audit.action,
        audit.resource_type,
        audit.resource_id ?? "",
        audit.resource_label ?? "",
        audit.summary,
        audit.actor_id,
        audit.actor_email ?? "",
        audit.request_id ?? "",
      ].some((value) => value.toLowerCase().includes(normalized)),
    );
  }, [data, search]);

  const resourceTypes = useMemo(
    () => Array.from(new Set((data?.audit_logs ?? []).map((audit) => audit.resource_type))).sort(),
    [data],
  );
  const actions = useMemo(
    () => Array.from(new Set((data?.audit_logs ?? []).map((audit) => audit.action))).sort(),
    [data],
  );
  const distinctActors = useMemo(
    () => new Set((data?.audit_logs ?? []).map((audit) => audit.actor_id)).size,
    [data],
  );

  const canGoBack = (data?.offset ?? 0) > 0;
  const canGoForward = data ? data.offset + data.audit_logs.length < data.count : false;

  return (
    <div className="flex flex-col gap-y-4 pb-8">
      <PageHeader
        title="Administrator audit history"
        subtitle="Search and inspect append-only evidence for governed product, setting, inquiry, gift-order, and operational changes. Audit records cannot be edited or deleted here."
        badge="Immutable evidence"
        actions={
          <>
            <Button
              variant="secondary"
              onClick={() => window.location.assign(adminPath("/superadmin/data"))}
            >
              Data directory
            </Button>
            <Button variant="secondary" onClick={() => void load(data?.offset ?? 0)}>
              Refresh
            </Button>
          </>
        }
      />

      <Container>
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Badge color="purple">Append only</Badge>
              <Badge color="green">Server governed</Badge>
            </div>
            <Heading level="h2" className="mt-3">
              Evidence, not a correction surface
            </Heading>
            <Text className="text-ui-fg-subtle mt-1 max-w-4xl">
              Correct the source record through its supported workflow. The audit trail preserves
              what happened, who acted, and the available before-and-after snapshots. Secret setting
              values are redacted before an audit record is written.
            </Text>
          </div>
          <a
            className="text-ui-fg-interactive text-sm font-medium hover:underline"
            href={adminPath("/superadmin/settings")}
          >
            Open application settings
          </a>
        </div>
      </Container>

      {error ? <ErrorState message={error} retry={() => void load(data?.offset ?? 0)} /> : null}

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Container>
          <Text size="small" className="text-ui-fg-subtle">
            Matching records
          </Text>
          <Heading level="h2" className="mt-2 text-2xl">
            {(data?.count ?? 0).toLocaleString()}
          </Heading>
        </Container>
        <Container>
          <Text size="small" className="text-ui-fg-subtle">
            Current page
          </Text>
          <Heading level="h2" className="mt-2 text-2xl">
            {(data?.audit_logs.length ?? 0).toLocaleString()}
          </Heading>
        </Container>
        <Container>
          <Text size="small" className="text-ui-fg-subtle">
            Resource types on page
          </Text>
          <Heading level="h2" className="mt-2 text-2xl">
            {resourceTypes.length}
          </Heading>
        </Container>
        <Container>
          <Text size="small" className="text-ui-fg-subtle">
            Actors on page
          </Text>
          <Heading level="h2" className="mt-2 text-2xl">
            {distinctActors}
          </Heading>
        </Container>
      </div>

      <Container>
        <form
          className="grid grid-cols-1 gap-3 lg:grid-cols-2 xl:grid-cols-5 xl:items-end"
          onSubmit={(event) => {
            event.preventDefault();
            void load(0);
          }}
        >
          <label className="flex flex-col gap-1 lg:col-span-2">
            <Text size="small" weight="plus">
              Search loaded records
            </Text>
            <Input
              placeholder="Summary, email, action, resource, ID, or request"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
            <Text size="xsmall" className="text-ui-fg-muted">
              Text search applies to the current server page. Exact filters search the full audit
              history.
            </Text>
          </label>
          <label className="flex flex-col gap-1">
            <Text size="small" weight="plus">
              Resource type
            </Text>
            <Input
              list="audit-resource-types"
              placeholder="product"
              value={filters.resourceType}
              onChange={(event) =>
                setFilters((current) => ({ ...current, resourceType: event.target.value }))
              }
            />
            <datalist id="audit-resource-types">
              {resourceTypes.map((resourceType) => (
                <option key={resourceType} value={resourceType} />
              ))}
            </datalist>
          </label>
          <label className="flex flex-col gap-1">
            <Text size="small" weight="plus">
              Action
            </Text>
            <Input
              list="audit-actions"
              placeholder="settings.updated"
              value={filters.action}
              onChange={(event) =>
                setFilters((current) => ({ ...current, action: event.target.value }))
              }
            />
            <datalist id="audit-actions">
              {actions.map((action) => (
                <option key={action} value={action} />
              ))}
            </datalist>
          </label>
          <label className="flex flex-col gap-1">
            <Text size="small" weight="plus">
              Actor ID
            </Text>
            <Input
              placeholder="user_..."
              value={filters.actorId}
              onChange={(event) =>
                setFilters((current) => ({ ...current, actorId: event.target.value }))
              }
            />
          </label>
          <div className="flex gap-2 lg:col-span-2 xl:col-span-5 xl:justify-end">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setFilters(emptyFilters);
                setSearch("");
                setSelected(undefined);
                void load(0, emptyFilters);
              }}
            >
              Clear filters
            </Button>
            <Button type="submit">Apply exact filters</Button>
          </div>
        </form>
      </Container>

      {selected ? <AuditDetail audit={selected} onClose={() => setSelected(undefined)} /> : null}

      {loading ? <LoadingState label="Loading append-only audit evidence..." /> : null}

      {!loading && data ? (
        <Container className="overflow-hidden p-0">
          <div className="border-ui-border-base flex flex-col gap-3 border-b px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <Heading level="h2">Audit records</Heading>
              <Text size="small" className="text-ui-fg-subtle mt-1">
                Showing {filteredLogs.length.toLocaleString()} records from offset{" "}
                {data.offset.toLocaleString()}
              </Text>
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="small"
                variant="secondary"
                disabled={!canGoBack || loading}
                onClick={() => void load(Math.max(0, data.offset - data.limit))}
              >
                Previous
              </Button>
              <Badge color="grey">
                Page {Math.floor(data.offset / data.limit) + 1} of{" "}
                {Math.max(1, Math.ceil(data.count / data.limit))}
              </Badge>
              <Button
                size="small"
                variant="secondary"
                disabled={!canGoForward || loading}
                onClick={() => void load(data.offset + data.limit)}
              >
                Next
              </Button>
            </div>
          </div>
          {filteredLogs.length ? (
            <div className="overflow-x-auto">
              <Table>
                <Table.Header>
                  <Table.Row>
                    <Table.HeaderCell>Occurred</Table.HeaderCell>
                    <Table.HeaderCell>Action</Table.HeaderCell>
                    <Table.HeaderCell>Resource</Table.HeaderCell>
                    <Table.HeaderCell>Administrator</Table.HeaderCell>
                    <Table.HeaderCell>Summary</Table.HeaderCell>
                    <Table.HeaderCell className="text-right">Evidence</Table.HeaderCell>
                  </Table.Row>
                </Table.Header>
                <Table.Body>
                  {filteredLogs.map((audit) => (
                    <Table.Row key={audit.id}>
                      <Table.Cell>
                        <div className="min-w-40">
                          <Text size="small">{formatDate(audit.created_at)}</Text>
                          {audit.request_id ? (
                            <Text size="xsmall" className="text-ui-fg-muted mt-1 max-w-44 truncate">
                              {audit.request_id}
                            </Text>
                          ) : null}
                        </div>
                      </Table.Cell>
                      <Table.Cell>
                        <Badge color={actionTone(audit.action)}>{humanize(audit.action)}</Badge>
                      </Table.Cell>
                      <Table.Cell>
                        <div className="min-w-40">
                          <Text weight="plus">{audit.resource_label || audit.resource_type}</Text>
                          <Text size="xsmall" className="text-ui-fg-subtle">
                            {audit.resource_type}
                            {audit.resource_id ? ` · ${audit.resource_id}` : ""}
                          </Text>
                        </div>
                      </Table.Cell>
                      <Table.Cell>
                        <div className="min-w-44">
                          <Text size="small" weight="plus">
                            {audit.actor_email || "Administrator"}
                          </Text>
                          <Text size="xsmall" className="text-ui-fg-muted">
                            {audit.actor_id}
                          </Text>
                        </div>
                      </Table.Cell>
                      <Table.Cell>
                        <Text className="max-w-xl min-w-72">{audit.summary}</Text>
                      </Table.Cell>
                      <Table.Cell>
                        <div className="flex justify-end">
                          <Button
                            size="small"
                            variant="secondary"
                            onClick={() => {
                              setSelected(audit);
                              window.scrollTo({ top: 0, behavior: "smooth" });
                            }}
                          >
                            Inspect
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
                title="No audit records found"
                description="Clear the text search or exact filters. New governed changes appear here automatically."
              />
            </div>
          )}
        </Container>
      ) : null}
    </div>
  );
};

export default AuditPage;
