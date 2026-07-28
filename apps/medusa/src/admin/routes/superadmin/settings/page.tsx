import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Badge,
  Button,
  Container,
  Heading,
  Input,
  Switch,
  Table,
  Text,
  Textarea,
} from "@medusajs/ui";
import {
  EmptyState,
  ErrorState,
  LoadingState,
  PageHeader,
  adminPath,
  adminRequest,
} from "../../../lib/superadmin";

type SettingValueType = "string" | "number" | "boolean" | "json";

interface AppSetting {
  id: string;
  key: string;
  group: string;
  label: string;
  description?: string | null;
  value: unknown;
  value_type: SettingValueType;
  is_public: boolean;
  is_secret: boolean;
  sort_order: number;
  updated_by?: string | null;
  metadata?: Record<string, unknown> | null;
  has_value?: boolean;
  created_at?: string;
  updated_at?: string;
}

interface SettingsPayload {
  settings: AppSetting[];
  count: number;
}

interface SettingFormState {
  key: string;
  group: string;
  label: string;
  description: string;
  valueType: SettingValueType;
  valueText: string;
  isPublic: boolean;
  isSecret: boolean;
  sortOrder: string;
  metadataText: string;
}

const emptyForm: SettingFormState = {
  key: "",
  group: "general",
  label: "",
  description: "",
  valueType: "string",
  valueText: "",
  isPublic: false,
  isSecret: false,
  sortOrder: "0",
  metadataText: "",
};

function serializeValue(setting: AppSetting) {
  if (setting.is_secret) return "";
  if (setting.value_type === "json") {
    return setting.value == null ? "" : JSON.stringify(setting.value, null, 2);
  }
  if (setting.value_type === "boolean") return setting.value === true ? "true" : "false";
  return setting.value == null ? "" : String(setting.value);
}

function formFromSetting(setting: AppSetting): SettingFormState {
  return {
    key: setting.key,
    group: setting.group,
    label: setting.label,
    description: setting.description ?? "",
    valueType: setting.value_type,
    valueText: serializeValue(setting),
    isPublic: setting.is_public,
    isSecret: setting.is_secret,
    sortOrder: String(setting.sort_order),
    metadataText: setting.metadata ? JSON.stringify(setting.metadata, null, 2) : "",
  };
}

function parseJson(label: string, raw: string) {
  try {
    return JSON.parse(raw) as unknown;
  } catch {
    throw new Error(`${label} must contain valid JSON.`);
  }
}

function parseSettingValue(type: SettingValueType, raw: string) {
  if (type === "string") return raw;
  if (type === "boolean") return raw === "true";
  if (type === "json") return parseJson("Value", raw);
  if (!raw.trim()) throw new Error("Enter a numeric value.");
  const value = Number(raw);
  if (!Number.isFinite(value)) throw new Error("Value must be a valid number.");
  return value;
}

function displayValue(setting: AppSetting) {
  if (setting.is_secret) return setting.has_value ? "Saved and masked" : "Not set";
  if (setting.value_type === "json") {
    const value = JSON.stringify(setting.value);
    return value.length > 90 ? `${value.slice(0, 87)}...` : value;
  }
  if (setting.value_type === "boolean") return setting.value === true ? "Enabled" : "Disabled";
  if (setting.value == null || setting.value === "") return "Empty";
  const value = String(setting.value);
  return value.length > 90 ? `${value.slice(0, 87)}...` : value;
}

function SettingEditor({
  setting,
  onCancel,
  onSaved,
}: {
  setting?: AppSetting;
  onCancel: () => void;
  onSaved: (setting: AppSetting, created: boolean) => void;
}) {
  const [form, setForm] = useState<SettingFormState>(() =>
    setting ? formFromSetting(setting) : emptyForm,
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string>();
  const editing = Boolean(setting);

  useEffect(() => {
    setForm(setting ? formFromSetting(setting) : emptyForm);
    setError(undefined);
  }, [setting]);

  function set<K extends keyof SettingFormState>(key: K, value: SettingFormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function changeValueType(valueType: SettingValueType) {
    setForm((current) => ({
      ...current,
      valueType,
      valueText:
        valueType === current.valueType
          ? current.valueText
          : valueType === "boolean"
            ? "false"
            : valueType === "json"
              ? "{}"
              : "",
    }));
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError(undefined);
    try {
      if (form.isSecret && form.isPublic) {
        throw new Error("A secret setting cannot be public.");
      }
      if (form.isSecret && !form.valueText && !(editing && setting?.is_secret)) {
        throw new Error("Enter the secret value before saving.");
      }
      if (editing && setting?.is_secret && !form.isSecret && !form.valueText) {
        throw new Error("Enter a replacement value before removing secret protection.");
      }
      const sortOrder = Number(form.sortOrder);
      if (!Number.isInteger(sortOrder) || sortOrder < 0 || sortOrder > 10000) {
        throw new Error("Sort order must be a whole number from 0 to 10000.");
      }
      const metadata = form.metadataText.trim() ? parseJson("Metadata", form.metadataText) : null;
      if (metadata !== null && (typeof metadata !== "object" || Array.isArray(metadata))) {
        throw new Error("Metadata must be a JSON object.");
      }

      const payload: Record<string, unknown> = {
        group: form.group.trim(),
        label: form.label.trim(),
        description: form.description.trim() || null,
        value_type: form.valueType,
        is_public: form.isPublic,
        is_secret: form.isSecret,
        sort_order: sortOrder,
        metadata,
      };
      if (!editing) payload.key = form.key.trim();

      const replacingMaskedSecret =
        editing && setting?.is_secret && form.isSecret && !form.valueText;
      if (!replacingMaskedSecret) {
        payload.value = parseSettingValue(form.valueType, form.valueText);
      }

      const path = editing
        ? `/admin/superadmin/settings/${encodeURIComponent(setting!.id)}`
        : "/admin/superadmin/settings";
      const result = await adminRequest<{ setting: AppSetting }>(path, {
        method: "POST",
        body: JSON.stringify(payload),
      });
      onSaved(result.setting, !editing);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "The setting could not be saved.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Container>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Badge color={editing ? "blue" : "green"}>{editing ? "Editing" : "New setting"}</Badge>
          <Heading level="h2" className="mt-3">
            {editing ? setting?.label : "Create application setting"}
          </Heading>
          <Text className="text-ui-fg-subtle mt-1">
            Typed operational values are validated before they are stored. Runtime code must
            explicitly support a key before it changes application behavior.
          </Text>
        </div>
        <Button type="button" variant="secondary" onClick={onCancel}>
          Close editor
        </Button>
      </div>

      <form className="mt-6 flex flex-col gap-6" onSubmit={(event) => void submit(event)}>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <label className="flex flex-col gap-1">
            <Text size="small" weight="plus">
              Key
            </Text>
            <Input
              required
              minLength={3}
              maxLength={160}
              pattern="[a-z0-9]+([._-][a-z0-9]+)*"
              placeholder="catalog.review_required"
              value={form.key}
              disabled={editing}
              onChange={(event) => set("key", event.target.value)}
            />
            <Text size="xsmall" className="text-ui-fg-muted">
              Stable lowercase identifier. Keys cannot be renamed after creation.
            </Text>
          </label>
          <label className="flex flex-col gap-1">
            <Text size="small" weight="plus">
              Group
            </Text>
            <Input
              required
              minLength={2}
              maxLength={80}
              placeholder="catalog"
              value={form.group}
              onChange={(event) => set("group", event.target.value)}
            />
          </label>
          <label className="flex flex-col gap-1 md:col-span-2">
            <Text size="small" weight="plus">
              Operator label
            </Text>
            <Input
              required
              minLength={2}
              maxLength={160}
              placeholder="Catalog review required"
              value={form.label}
              onChange={(event) => set("label", event.target.value)}
            />
          </label>
          <label className="flex flex-col gap-1 md:col-span-2">
            <Text size="small" weight="plus">
              Description
            </Text>
            <Textarea
              rows={3}
              maxLength={1000}
              placeholder="Explain what this controls, who approves it, and its safe values."
              value={form.description}
              onChange={(event) => set("description", event.target.value)}
            />
          </label>
          <label className="flex flex-col gap-1">
            <Text size="small" weight="plus">
              Value type
            </Text>
            <select
              className="border-ui-border-base bg-ui-bg-field rounded-md border px-3 py-2 text-sm"
              value={form.valueType}
              onChange={(event) => changeValueType(event.target.value as SettingValueType)}
            >
              <option value="string">Text</option>
              <option value="number">Number</option>
              <option value="boolean">On / off</option>
              <option value="json">Structured JSON</option>
            </select>
          </label>
          <label className="flex flex-col gap-1">
            <Text size="small" weight="plus">
              Sort order
            </Text>
            <Input
              type="number"
              min="0"
              max="10000"
              step="1"
              value={form.sortOrder}
              onChange={(event) => set("sortOrder", event.target.value)}
            />
          </label>
          <div className="md:col-span-2">
            <Text size="small" weight="plus">
              {form.isSecret && editing ? "Replacement secret value" : "Value"}
            </Text>
            <div className="mt-1">
              {form.isSecret ? (
                <Input
                  type="password"
                  autoComplete="new-password"
                  placeholder={
                    editing && setting?.is_secret
                      ? "Leave blank to preserve the saved secret"
                      : "Enter the secret value"
                  }
                  value={form.valueText}
                  onChange={(event) => set("valueText", event.target.value)}
                />
              ) : form.valueType === "boolean" ? (
                <div className="border-ui-border-base flex min-h-10 items-center justify-between rounded-md border px-3">
                  <Text>{form.valueText === "true" ? "Enabled" : "Disabled"}</Text>
                  <Switch
                    checked={form.valueText === "true"}
                    onCheckedChange={(checked) => set("valueText", checked ? "true" : "false")}
                  />
                </div>
              ) : form.valueType === "json" ? (
                <Textarea
                  rows={7}
                  className="font-mono"
                  placeholder={'{\n  "enabled": true\n}'}
                  value={form.valueText}
                  onChange={(event) => set("valueText", event.target.value)}
                />
              ) : (
                <Input
                  type={form.valueType === "number" ? "number" : "text"}
                  value={form.valueText}
                  onChange={(event) => set("valueText", event.target.value)}
                />
              )}
            </div>
            {form.isSecret ? (
              <Text size="xsmall" className="text-ui-fg-muted mt-1">
                Secret values are never returned by the API.
                {editing && setting?.is_secret
                  ? " Saving an empty replacement preserves the existing value."
                  : " A value is required before this setting can be saved."}
              </Text>
            ) : null}
          </div>
          <label className="flex flex-col gap-1 md:col-span-2">
            <Text size="small" weight="plus">
              Metadata
            </Text>
            <Textarea
              rows={4}
              className="font-mono"
              placeholder={'{\n  "owner": "operations"\n}'}
              value={form.metadataText}
              onChange={(event) => set("metadataText", event.target.value)}
            />
            <Text size="xsmall" className="text-ui-fg-muted">
              Optional internal JSON object. Do not store credentials in metadata.
            </Text>
          </label>
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <div className="border-ui-border-base flex items-center justify-between rounded-lg border p-4">
            <div>
              <Text weight="plus">Public setting</Text>
              <Text size="small" className="text-ui-fg-subtle mt-1">
                Safe to expose through an explicitly designed public endpoint.
              </Text>
            </div>
            <Switch
              checked={form.isPublic}
              onCheckedChange={(checked) =>
                setForm((current) => ({
                  ...current,
                  isPublic: checked,
                  isSecret: checked ? false : current.isSecret,
                }))
              }
            />
          </div>
          <div className="border-ui-border-base flex items-center justify-between rounded-lg border p-4">
            <div>
              <Text weight="plus">Secret setting</Text>
              <Text size="small" className="text-ui-fg-subtle mt-1">
                Mask after save and exclude from every public response.
              </Text>
            </div>
            <Switch
              checked={form.isSecret}
              onCheckedChange={(checked) =>
                setForm((current) => ({
                  ...current,
                  isSecret: checked,
                  isPublic: checked ? false : current.isPublic,
                  valueText: checked && editing ? "" : current.valueText,
                }))
              }
            />
          </div>
        </div>

        {error ? (
          <div className="border-ui-border-error bg-ui-bg-base rounded-lg border p-3">
            <Text className="text-ui-fg-error" role="alert">
              {error}
            </Text>
          </div>
        ) : null}

        <div className="border-ui-border-base flex justify-end gap-2 border-t pt-4">
          <Button type="button" variant="secondary" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" isLoading={saving}>
            {editing ? "Save changes" : "Create setting"}
          </Button>
        </div>
      </form>
    </Container>
  );
}

const SettingsPage = () => {
  const [data, setData] = useState<SettingsPayload>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>();
  const [notice, setNotice] = useState<string>();
  const [query, setQuery] = useState("");
  const [group, setGroup] = useState("");
  const [editorOpen, setEditorOpen] = useState(false);
  const [selected, setSelected] = useState<AppSetting>();
  const [deleting, setDeleting] = useState<string>();

  const load = useCallback(async () => {
    setLoading(true);
    setError(undefined);
    try {
      setData(await adminRequest<SettingsPayload>("/admin/superadmin/settings"));
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Application settings could not be loaded.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const groups = useMemo(
    () => Array.from(new Set((data?.settings ?? []).map((setting) => setting.group))).sort(),
    [data],
  );

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return (data?.settings ?? []).filter((setting) => {
      if (group && setting.group !== group) return false;
      if (!normalized) return true;
      return [
        setting.key,
        setting.group,
        setting.label,
        setting.description ?? "",
        setting.updated_by ?? "",
      ].some((value) => value.toLowerCase().includes(normalized));
    });
  }, [data, group, query]);

  const metrics = useMemo(() => {
    const settings = data?.settings ?? [];
    return {
      groups: new Set(settings.map((setting) => setting.group)).size,
      public: settings.filter((setting) => setting.is_public).length,
      secret: settings.filter((setting) => setting.is_secret).length,
    };
  }, [data]);

  function openCreate() {
    setSelected(undefined);
    setEditorOpen(true);
    setNotice(undefined);
  }

  function openEdit(setting: AppSetting) {
    setSelected(setting);
    setEditorOpen(true);
    setNotice(undefined);
  }

  function saved(setting: AppSetting, created: boolean) {
    setData((current) => {
      if (!current) return { settings: [setting], count: 1 };
      const exists = current.settings.some((item) => item.id === setting.id);
      return {
        ...current,
        count: exists ? current.count : current.count + 1,
        settings: exists
          ? current.settings.map((item) => (item.id === setting.id ? setting : item))
          : [...current.settings, setting],
      };
    });
    setEditorOpen(false);
    setSelected(undefined);
    setNotice(created ? `Created ${setting.key}.` : `Saved ${setting.key}.`);
    void load();
  }

  async function remove(setting: AppSetting) {
    const confirmed = window.confirm(
      `Delete "${setting.label}" (${setting.key})?\n\nRuntime code may depend on this key. The deletion is audited and cannot be undone from this dashboard.`,
    );
    if (!confirmed) return;
    setDeleting(setting.id);
    setError(undefined);
    setNotice(undefined);
    try {
      await adminRequest(`/admin/superadmin/settings/${encodeURIComponent(setting.id)}`, {
        method: "DELETE",
      });
      setData((current) =>
        current
          ? {
              ...current,
              count: Math.max(0, current.count - 1),
              settings: current.settings.filter((item) => item.id !== setting.id),
            }
          : current,
      );
      if (selected?.id === setting.id) {
        setSelected(undefined);
        setEditorOpen(false);
      }
      setNotice(`Deleted ${setting.key}.`);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "The setting could not be deleted.");
    } finally {
      setDeleting(undefined);
    }
  }

  return (
    <div className="flex flex-col gap-y-4 pb-8">
      <PageHeader
        title="Application settings"
        subtitle="Maintain typed, grouped operational values with explicit public and secret boundaries. Every change is recorded in the immutable administrator audit trail."
        badge="Governed configuration"
        actions={
          <>
            <Button
              variant="secondary"
              onClick={() => window.location.assign(adminPath("/superadmin"))}
            >
              Control center
            </Button>
            <Button onClick={openCreate}>New setting</Button>
          </>
        }
      />

      <Container>
        <div className="flex items-start gap-3">
          <Badge color="orange">Important</Badge>
          <div>
            <Heading level="h2">Settings are not deployment secrets</Heading>
            <Text className="text-ui-fg-subtle mt-1">
              Database settings only affect features that explicitly read them. Database URLs,
              signing keys, payment credentials, email credentials, and storage credentials belong
              in the deployment secret manager and should not be copied here.
            </Text>
          </div>
        </div>
      </Container>

      {notice ? (
        <Container>
          <div className="flex items-center justify-between gap-3">
            <Text className="text-ui-fg-success" role="status">
              {notice}
            </Text>
            <Button size="small" variant="transparent" onClick={() => setNotice(undefined)}>
              Dismiss
            </Button>
          </div>
        </Container>
      ) : null}
      {error ? <ErrorState message={error} retry={() => void load()} /> : null}

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Container>
          <Text size="small" className="text-ui-fg-subtle">
            Total settings
          </Text>
          <Heading level="h2" className="mt-2 text-2xl">
            {(data?.count ?? 0).toLocaleString()}
          </Heading>
        </Container>
        <Container>
          <Text size="small" className="text-ui-fg-subtle">
            Groups
          </Text>
          <Heading level="h2" className="mt-2 text-2xl">
            {metrics.groups}
          </Heading>
        </Container>
        <Container>
          <Text size="small" className="text-ui-fg-subtle">
            Public values
          </Text>
          <Heading level="h2" className="mt-2 text-2xl">
            {metrics.public}
          </Heading>
        </Container>
        <Container>
          <Text size="small" className="text-ui-fg-subtle">
            Masked secrets
          </Text>
          <Heading level="h2" className="mt-2 text-2xl">
            {metrics.secret}
          </Heading>
        </Container>
      </div>

      {editorOpen ? (
        <SettingEditor
          key={selected?.id ?? "new"}
          setting={selected}
          onCancel={() => {
            setEditorOpen(false);
            setSelected(undefined);
          }}
          onSaved={saved}
        />
      ) : null}

      <Container>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-[minmax(0,1fr)_14rem_auto] md:items-end">
          <label className="flex flex-col gap-1">
            <Text size="small" weight="plus">
              Search settings
            </Text>
            <Input
              placeholder="Key, label, group, description, or updater"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </label>
          <label className="flex flex-col gap-1">
            <Text size="small" weight="plus">
              Group
            </Text>
            <select
              className="border-ui-border-base bg-ui-bg-field rounded-md border px-3 py-2 text-sm"
              value={group}
              onChange={(event) => setGroup(event.target.value)}
            >
              <option value="">All groups</option>
              {groups.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>
          <Button
            variant="secondary"
            onClick={() => {
              setQuery("");
              setGroup("");
            }}
          >
            Clear filters
          </Button>
        </div>
      </Container>

      {loading ? <LoadingState label="Loading governed application settings..." /> : null}

      {!loading && data ? (
        <Container className="overflow-hidden p-0">
          <div className="border-ui-border-base flex items-center justify-between border-b px-6 py-4">
            <div>
              <Heading level="h2">Settings registry</Heading>
              <Text size="small" className="text-ui-fg-subtle mt-1">
                {filtered.length.toLocaleString()} of {data.count.toLocaleString()} settings shown
              </Text>
            </div>
            <Button size="small" variant="secondary" onClick={() => void load()}>
              Refresh
            </Button>
          </div>
          {filtered.length ? (
            <div className="overflow-x-auto">
              <Table>
                <Table.Header>
                  <Table.Row>
                    <Table.HeaderCell>Setting</Table.HeaderCell>
                    <Table.HeaderCell>Group</Table.HeaderCell>
                    <Table.HeaderCell>Value</Table.HeaderCell>
                    <Table.HeaderCell>Visibility</Table.HeaderCell>
                    <Table.HeaderCell>Last updated</Table.HeaderCell>
                    <Table.HeaderCell className="text-right">Actions</Table.HeaderCell>
                  </Table.Row>
                </Table.Header>
                <Table.Body>
                  {filtered.map((setting) => (
                    <Table.Row key={setting.id}>
                      <Table.Cell>
                        <div className="min-w-64">
                          <Text weight="plus">{setting.label}</Text>
                          <Text size="small" className="text-ui-fg-subtle font-mono">
                            {setting.key}
                          </Text>
                          {setting.description ? (
                            <Text size="xsmall" className="text-ui-fg-muted mt-1 max-w-80">
                              {setting.description}
                            </Text>
                          ) : null}
                        </div>
                      </Table.Cell>
                      <Table.Cell>
                        <Badge color="grey">{setting.group}</Badge>
                      </Table.Cell>
                      <Table.Cell>
                        <div className="max-w-80">
                          <Text className={setting.is_secret ? "font-medium" : "font-mono"}>
                            {setting.is_secret ? "••••••••" : displayValue(setting)}
                          </Text>
                          <Text size="xsmall" className="text-ui-fg-muted mt-1">
                            {setting.value_type}
                            {setting.is_secret ? ` · ${displayValue(setting)}` : ""}
                          </Text>
                        </div>
                      </Table.Cell>
                      <Table.Cell>
                        <div className="flex flex-wrap gap-1">
                          {setting.is_secret ? <Badge color="purple">Secret</Badge> : null}
                          {setting.is_public ? <Badge color="green">Public</Badge> : null}
                          {!setting.is_secret && !setting.is_public ? (
                            <Badge color="grey">Internal</Badge>
                          ) : null}
                        </div>
                      </Table.Cell>
                      <Table.Cell>
                        <Text size="small">
                          {setting.updated_at
                            ? new Intl.DateTimeFormat("en-BD", {
                                dateStyle: "medium",
                                timeStyle: "short",
                              }).format(new Date(setting.updated_at))
                            : "Not recorded"}
                        </Text>
                        {setting.updated_by ? (
                          <Text size="xsmall" className="text-ui-fg-muted">
                            {setting.updated_by}
                          </Text>
                        ) : null}
                      </Table.Cell>
                      <Table.Cell>
                        <div className="flex min-w-40 justify-end gap-2">
                          <Button
                            size="small"
                            variant="secondary"
                            onClick={() => openEdit(setting)}
                          >
                            Edit
                          </Button>
                          <Button
                            size="small"
                            variant="danger"
                            isLoading={deleting === setting.id}
                            onClick={() => void remove(setting)}
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
                title="No settings found"
                description="Clear the filters or create a typed setting for a supported application feature."
              />
            </div>
          )}
        </Container>
      ) : null}
    </div>
  );
};

export default SettingsPage;
