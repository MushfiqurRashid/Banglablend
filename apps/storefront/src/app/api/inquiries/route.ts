import { NextResponse } from "next/server";
import { contactSchema, inquirySchema, newsletterSchema } from "@bangla-blend/validation";
import { createSupabaseServiceRoleClient } from "@bangla-blend/supabase-client";
import { sendTransactionalEmail } from "@/lib/email/server";

const requestLog = new Map<string, number[]>();

function rateLimited(key: string) {
  const now = Date.now();
  const recent = (requestLog.get(key) ?? []).filter((time) => now - time < 60_000);
  recent.push(now);
  requestLog.set(key, recent);
  return recent.length > 8;
}

export async function POST(request: Request) {
  const key = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
  if (rateLimited(key)) return NextResponse.json({ error: "Too many requests." }, { status: 429 });
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body) return NextResponse.json({ error: "Invalid request." }, { status: 400 });

  const type = body.type === "newsletter" ? "newsletter" : body.type === "contact" ? "contact" : (body.type ?? "contact");
  const parsed =
    type === "newsletter" ? newsletterSchema.safeParse(body) : type === "contact" ? contactSchema.safeParse(body) : inquirySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Please check the form.", issues: parsed.error.issues }, { status: 400 });
  }

  const data = parsed.data as Record<string, unknown>;
  const row = {
    type,
    email: (data.email as string) ?? "",
    company: (data.company as string) ?? null,
    contact_person: (data.contactPerson as string) ?? (data.name as string) ?? null,
    telephone: (data.telephone as string) ?? null,
    quantity: (data.quantity as number) ?? null,
    budget: (data.budget as string) ?? null,
    occasion: (data.occasion as string) ?? null,
    delivery_date: (data.deliveryDate as string) || null,
    delivery_locations: (data.deliveryLocations as string) ?? null,
    packaging: (data.packaging as string) ?? null,
    message_card: (data.messageCard as string) ?? null,
    notes: (data.notes as string) ?? (data.message as string) ?? null,
  };

  const supabase = createSupabaseServiceRoleClient();
  const { data: inquiry, error } = await supabase.from("inquiries").insert(row).select("id").returns<{ id: string }[]>().single();
  if (error || !inquiry) return NextResponse.json({ error: "The inquiry service is unavailable." }, { status: 503 });

  const notificationAddress = process.env.NEXT_PUBLIC_CONTACT_EMAIL?.trim();
  if (notificationAddress) {
    await sendTransactionalEmail({
      to: notificationAddress,
      replyTo: row.email,
      subject: `New Bangla Blend ${String(type).replaceAll("_", " ")} inquiry`,
      idempotencyKey: `inquiry-received/${inquiry.id}`,
      text: [
        `Type: ${type}`,
        `Contact: ${row.contact_person ?? "Not supplied"}`,
        `Email: ${row.email}`,
        `Company: ${row.company ?? "Not supplied"}`,
        `Telephone: ${row.telephone ?? "Not supplied"}`,
        `Notes: ${row.notes ?? "Not supplied"}`,
        `Inquiry ID: ${inquiry.id}`,
      ].join("\n"),
    }).catch((emailError: unknown) => {
      console.error("Inquiry notification email failed", emailError instanceof Error ? emailError.message : emailError);
    });
  }
  return NextResponse.json({ accepted: true }, { status: 202 });
}
