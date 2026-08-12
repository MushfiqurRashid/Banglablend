import { getSupabaseForRequest, requireStaffPermission } from "@/lib/auth";
import { InviteStaffForm } from "./invite-staff-form";
import { updateStaffRoleAction } from "./actions";

export default async function StaffPage() {
  await requireStaffPermission("staff", "manage");
  const supabase = await getSupabaseForRequest();
  const [{ data: staff }, { data: roles }] = await Promise.all([
    supabase.from("staff_members").select("id, email, full_name, is_active, role:staff_roles ( id, name )").order("created_at"),
    supabase.from("staff_roles").select("id, name").order("name"),
  ]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      <h1 style={{ fontSize: "1.5rem", fontWeight: 700 }}>Users &amp; Access</h1>

      <div className="card" style={{ padding: 0 }}>
        {staff?.length ? (
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Active</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {staff.map((member) => {
                const role = Array.isArray(member.role) ? member.role[0] : member.role;
                const boundAction = updateStaffRoleAction.bind(null, member.id);
                return (
                  <tr key={member.id}>
                    <td>{member.full_name ?? "—"}</td>
                    <td>{member.email}</td>
                    <td>
                      <form action={boundAction} style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                        <select className="select" name="roleId" defaultValue={role?.id}>
                          {roles?.map((r) => (
                            <option key={r.id} value={r.id}>
                              {r.name}
                            </option>
                          ))}
                        </select>
                        <label style={{ display: "flex", alignItems: "center", gap: "0.25rem", fontSize: "0.8rem" }}>
                          <input type="checkbox" name="isActive" defaultChecked={member.is_active} /> Active
                        </label>
                        <button className="btn btn-secondary" type="submit" style={{ padding: "0.25rem 0.6rem", fontSize: "0.75rem" }}>
                          Save
                        </button>
                      </form>
                    </td>
                    <td>
                      <span className={`badge ${member.is_active ? "badge-success" : "badge-neutral"}`}>{member.is_active ? "Active" : "Disabled"}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : (
          <p className="empty-state">No staff members yet.</p>
        )}
      </div>

      <InviteStaffForm roles={roles ?? []} />
    </div>
  );
}
