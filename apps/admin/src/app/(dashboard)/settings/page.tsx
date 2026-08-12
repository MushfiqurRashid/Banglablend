import { getSupabaseForRequest, requireStaffPermission } from "@/lib/auth";
import { updateInvoiceBusinessDetailsAction, updateSettingAction } from "./actions";

function displayValue(value: unknown) {
  if (value && typeof value === "object" && "data" in (value as Record<string, unknown>)) {
    const data = (value as Record<string, unknown>).data;
    return typeof data === "object" ? JSON.stringify(data) : String(data);
  }
  return JSON.stringify(value);
}

function addressValue(address: unknown, key: string) {
  if (!address || typeof address !== "object" || Array.isArray(address)) return "";
  const value = (address as Record<string, unknown>)[key];
  return typeof value === "string" ? value : "";
}

export default async function SettingsPage() {
  await requireStaffPermission("settings", "manage");
  const supabase = await getSupabaseForRequest();
  const [{ data: settings }, { data: siteSettings }] = await Promise.all([
    supabase.from("app_settings").select("*").order("group").order("sort_order"),
    supabase
      .from("site_settings")
      .select("brand_name, support_email, support_phone, address")
      .eq("is_singleton", true)
      .maybeSingle(),
  ]);

  const groups = new Map<string, typeof settings>();
  for (const setting of settings ?? []) {
    const list = groups.get(setting.group) ?? [];
    list.push(setting);
    groups.set(setting.group, list);
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      <h1 style={{ fontSize: "1.5rem", fontWeight: 700 }}>Application Settings</h1>
      <form action={updateInvoiceBusinessDetailsAction} className="card" style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        <div>
          <h2 style={{ fontSize: "1rem", fontWeight: 700 }}>Invoice business details</h2>
          <p style={{ color: "var(--color-muted)", fontSize: "0.8rem", marginTop: "0.3rem" }}>
            These verified details appear in the Billed From section of fulfilled-order invoices.
          </p>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: "0.9rem" }}>
          <label style={{ display: "flex", flexDirection: "column", gap: "0.35rem", fontSize: "0.8rem", fontWeight: 600 }}>
            Business name
            <input className="input" name="brandName" required defaultValue={siteSettings?.brand_name ?? "Bangla Blend"} />
          </label>
          <label style={{ display: "flex", flexDirection: "column", gap: "0.35rem", fontSize: "0.8rem", fontWeight: 600 }}>
            Business email
            <input className="input" type="email" name="supportEmail" defaultValue={siteSettings?.support_email ?? ""} />
          </label>
          <label style={{ display: "flex", flexDirection: "column", gap: "0.35rem", fontSize: "0.8rem", fontWeight: 600 }}>
            Business phone
            <input className="input" name="supportPhone" defaultValue={siteSettings?.support_phone ?? ""} />
          </label>
          <label style={{ display: "flex", flexDirection: "column", gap: "0.35rem", fontSize: "0.8rem", fontWeight: 600 }}>
            Address line 1
            <input className="input" name="line1" defaultValue={addressValue(siteSettings?.address, "line1")} />
          </label>
          <label style={{ display: "flex", flexDirection: "column", gap: "0.35rem", fontSize: "0.8rem", fontWeight: 600 }}>
            Address line 2
            <input className="input" name="line2" defaultValue={addressValue(siteSettings?.address, "line2")} />
          </label>
          <label style={{ display: "flex", flexDirection: "column", gap: "0.35rem", fontSize: "0.8rem", fontWeight: 600 }}>
            City
            <input className="input" name="city" defaultValue={addressValue(siteSettings?.address, "city")} />
          </label>
          <label style={{ display: "flex", flexDirection: "column", gap: "0.35rem", fontSize: "0.8rem", fontWeight: 600 }}>
            District or state
            <input className="input" name="districtOrState" defaultValue={addressValue(siteSettings?.address, "districtOrState")} />
          </label>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 0.55fr", gap: "0.9rem" }}>
            <label style={{ display: "flex", flexDirection: "column", gap: "0.35rem", fontSize: "0.8rem", fontWeight: 600 }}>
              Postal code
              <input className="input" name="postalCode" defaultValue={addressValue(siteSettings?.address, "postalCode")} />
            </label>
            <label style={{ display: "flex", flexDirection: "column", gap: "0.35rem", fontSize: "0.8rem", fontWeight: 600 }}>
              Country
              <input className="input" name="countryCode" maxLength={2} placeholder="BD" defaultValue={addressValue(siteSettings?.address, "countryCode")} />
            </label>
          </div>
        </div>
        <div>
          <button className="btn btn-primary" type="submit">Save invoice details</button>
        </div>
      </form>
      {[...groups.entries()].map(([group, groupSettings]) => (
        <div key={group} className="card">
          <h2 style={{ fontSize: "1rem", fontWeight: 700, marginBottom: "1rem", textTransform: "capitalize" }}>{group}</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {groupSettings?.map((setting) => {
              const boundAction = updateSettingAction.bind(null, setting.id);
              return (
                <form key={setting.id} action={boundAction} style={{ display: "grid", gridTemplateColumns: "1fr 1fr auto auto", gap: "0.75rem", alignItems: "end", borderBottom: "1px solid var(--color-border)", paddingBottom: "0.75rem" }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: "0.875rem" }}>{setting.label}</div>
                    <div style={{ color: "var(--color-muted)", fontSize: "0.75rem" }}>{setting.key}</div>
                  </div>
                  <input type="hidden" name="valueType" value={setting.value_type} />
                  {setting.value_type === "boolean" ? (
                    <select className="select" name="value" defaultValue={String((setting.value as { data?: boolean })?.data)}>
                      <option value="true">true</option>
                      <option value="false">false</option>
                    </select>
                  ) : (
                    <input className="input" name="value" defaultValue={displayValue(setting.value)} />
                  )}
                  <label style={{ display: "flex", alignItems: "center", gap: "0.35rem", fontSize: "0.8rem" }}>
                    <input type="checkbox" name="isPublic" defaultChecked={setting.is_public} />
                    Public
                  </label>
                  <button className="btn btn-secondary" type="submit">
                    Save
                  </button>
                </form>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
