export type AppSettingValueType = "string" | "number" | "boolean" | "json";

function serializeJsonValue(value: unknown): unknown {
  if (value === undefined) return null;

  const json = JSON.stringify(value);
  if (json === undefined) {
    throw new TypeError("The setting value is not JSON serializable.");
  }

  return JSON.parse(json) as unknown;
}

export function wrapSettingValue(value: unknown): Record<string, unknown> {
  return { data: serializeJsonValue(value) };
}

export function unwrapSettingValue(value: Record<string, unknown> | null | undefined) {
  return value?.data ?? null;
}

export function settingValueError(value: unknown, valueType: AppSettingValueType) {
  if (valueType === "string" && typeof value !== "string") {
    return "A string setting must contain a string value.";
  }
  if (valueType === "number" && (typeof value !== "number" || !Number.isFinite(value))) {
    return "A number setting must contain a finite numeric value.";
  }
  if (valueType === "boolean" && typeof value !== "boolean") {
    return "A boolean setting must contain true or false.";
  }

  try {
    serializeJsonValue(value);
  } catch {
    return "The setting value must be valid JSON.";
  }

  return null;
}

export function redactSettingForAudit<T extends { is_secret: boolean }>(
  setting: T,
  force = false
) {
  return force || setting.is_secret
    ? { ...setting, value: "[REDACTED]" }
    : setting;
}

export function presentSetting<T extends {
  value: Record<string, unknown>;
  is_secret: boolean;
}>(setting: T) {
  const value = unwrapSettingValue(setting.value);
  if (!setting.is_secret) return { ...setting, value };
  return {
    ...setting,
    value: null,
    has_value: value !== null && value !== undefined && value !== ""
  };
}
