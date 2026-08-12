import { notFound } from "next/navigation";
import { getStaffSession, getSupabaseForRequest, hasPermission } from "@/lib/auth";
import { updateInquiryAction } from "../actions";

export default async function InquiryDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getStaffSession();
  const canManage = hasPermission(session, "inquiries", "manage");
  const supabase = await getSupabaseForRequest();
  const { data: inquiry } = await supabase.from("inquiries").select("*").eq("id", id).maybeSingle();
  if (!inquiry) notFound();

  const boundAction = updateInquiryAction.bind(null, inquiry.id);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem", maxWidth: 640 }}>
      <div>
        <h1 style={{ fontSize: "1.5rem", fontWeight: 700, textTransform: "capitalize" }}>{inquiry.type} inquiry</h1>
        <p style={{ color: "var(--color-muted)", fontSize: "0.85rem" }}>{new Date(inquiry.created_at).toLocaleString()}</p>
      </div>

      <div className="card form-grid">
        <div>
          <span className="label">Contact</span>
          <p>
            {inquiry.contact_person ?? "—"} &middot; {inquiry.email} {inquiry.telephone ? `· ${inquiry.telephone}` : ""}
          </p>
        </div>
        {inquiry.company ? (
          <div>
            <span className="label">Company</span>
            <p>{inquiry.company}</p>
          </div>
        ) : null}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
          {inquiry.quantity ? (
            <div>
              <span className="label">Quantity</span>
              <p>{inquiry.quantity}</p>
            </div>
          ) : null}
          {inquiry.budget ? (
            <div>
              <span className="label">Budget</span>
              <p>{inquiry.budget}</p>
            </div>
          ) : null}
          {inquiry.occasion ? (
            <div>
              <span className="label">Occasion</span>
              <p>{inquiry.occasion}</p>
            </div>
          ) : null}
          {inquiry.delivery_date ? (
            <div>
              <span className="label">Delivery date</span>
              <p>{inquiry.delivery_date}</p>
            </div>
          ) : null}
        </div>
        {inquiry.delivery_locations ? (
          <div>
            <span className="label">Delivery locations</span>
            <p>{inquiry.delivery_locations}</p>
          </div>
        ) : null}
        {inquiry.notes ? (
          <div>
            <span className="label">Message</span>
            <p style={{ whiteSpace: "pre-wrap" }}>{inquiry.notes}</p>
          </div>
        ) : null}
      </div>

      {canManage ? <form action={boundAction} className="card form-grid">
        <h2 style={{ fontSize: "1rem", fontWeight: 700 }}>Triage</h2>
        <div className="field">
          <label className="label" htmlFor="status">
            Status
          </label>
          <select className="select" id="status" name="status" defaultValue={inquiry.status}>
            <option value="new">New</option>
            <option value="acknowledged">Acknowledged</option>
            <option value="in_progress">In progress</option>
            <option value="closed">Closed</option>
          </select>
        </div>
        <div className="field">
          <label className="label" htmlFor="internalNotes">
            Internal notes
          </label>
          <textarea className="textarea" id="internalNotes" name="internalNotes" rows={4} defaultValue={inquiry.internal_notes ?? ""} />
        </div>
        <button className="btn btn-primary" type="submit" style={{ alignSelf: "start" }}>
          Save
        </button>
      </form> : (
        <div className="card form-grid">
          <h2 style={{ fontSize: "1rem", fontWeight: 700 }}>Triage</h2>
          <div><span className="label">Status</span><span className="badge badge-neutral">{inquiry.status}</span></div>
          {inquiry.internal_notes ? <div><span className="label">Internal notes</span><p style={{ whiteSpace: "pre-wrap", margin: 0 }}>{inquiry.internal_notes}</p></div> : null}
        </div>
      )}
    </div>
  );
}
