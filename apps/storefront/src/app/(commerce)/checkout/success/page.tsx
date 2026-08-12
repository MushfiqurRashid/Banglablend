import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Check,
  CheckCircle2,
  Clock3,
  Mail,
  PackageCheck,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { formatMoney } from "@bangla-blend/commerce-client";
import { PageContainer } from "@/components/layout/page-container";
import { getSupabaseForRequest } from "@/lib/auth/server";
import { formatOrderReference } from "@/lib/order-reference";
import "./success.css";

export const metadata = { title: "Order received", robots: { index: false, follow: false } };

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

interface ConfirmationOrder {
  id: string;
  display_id: number;
  email: string;
  currency_code: string;
  total: number;
  payment_status: string;
  is_gift: boolean;
  created_at: string;
}

async function getConfirmationOrder(orderId?: string) {
  if (!orderId || !UUID_RE.test(orderId)) return null;
  // RLS ensures that an order UUID alone cannot reveal a customer's email or order value.
  const supabase = await getSupabaseForRequest();
  const { data } = await supabase
    .from("orders")
    .select("id, display_id, email, currency_code, total, payment_status, is_gift, created_at")
    .eq("id", orderId)
    .maybeSingle<ConfirmationOrder>();
  return data ?? null;
}

function placedDate(value?: string) {
  if (!value) return null;
  return new Intl.DateTimeFormat("en-BD", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Asia/Dhaka",
  }).format(new Date(value));
}

export default async function CheckoutSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ order?: string; verification?: string }>;
}) {
  const query = await searchParams;
  const pending = query.verification === "pending";
  const order = await getConfirmationOrder(query.order);
  const reference = order ? formatOrderReference(order.display_id, order.id) : undefined;
  const total = order ? formatMoney(order.total, order.currency_code.toUpperCase()) : undefined;

  const journey = pending
    ? [
        { label: "Order received", detail: "Your checkout details are secure.", state: "complete" },
        { label: "Payment verification", detail: "We are confirming the provider response.", state: "current" },
        { label: "Order confirmed", detail: "You will receive an update after verification.", state: "pending" },
        { label: "Prepared with care", detail: "Our team will then begin preparing your order.", state: "pending" },
      ]
    : [
        { label: "Order placed", detail: "Your order is safely in our system.", state: "complete" },
        { label: "Confirmation", detail: "Details are sent to your contact address.", state: "current" },
        { label: "Prepared with care", detail: "Our team checks and packs every item.", state: "pending" },
        { label: "On its way", detail: "Tracking is shared when your order leaves us.", state: "pending" },
      ];

  return (
    <div className="order-success-page">
      <section className="order-success-hero">
        <PageContainer className="order-success-shell">
          <div className="order-success-copy">
            <div className={pending ? "order-success-seal is-pending" : "order-success-seal"}>
              {pending ? <Clock3 size={31} /> : <Check size={31} strokeWidth={2.2} />}
            </div>
            <span className="eyebrow">{pending ? "Secure verification" : "Order confirmed"}</span>
            <h1>
              {pending ? (
                <>Your payment is being <em>verified.</em></>
              ) : (
                <>Thank you. Your order is <em>in good hands.</em></>
              )}
            </h1>
            <p className="order-success-intro">
              {pending
                ? "Your browser has returned from the payment provider. We will confirm the order only after the secure server response is verified."
                : "We have received your order and our team will take it from here—checking every detail and preparing it with the care it deserves."}
            </p>

            <div className="order-success-actions">
              <Link href="/account/orders" className="button button-primary">
                View your order <ArrowRight size={16} />
              </Link>
              <Link href="/shop" className="button button-secondary">
                Continue shopping
              </Link>
            </div>

            <div className="order-success-reassurance">
              <span><ShieldCheck size={16} /> Secure confirmation</span>
              <span><PackageCheck size={16} /> Packed with care</span>
            </div>
          </div>

          <aside className="order-success-visual" aria-label="Bangla Blend order confirmation">
            <Image
              src="/images/campaign/pantry-lineup.jpg"
              alt="Bangla Blend spices arranged in a warm Bangladeshi pantry setting"
              fill
              priority
              sizes="(max-width: 900px) 100vw, 46vw"
            />
            <div className="order-success-visual-shade" />
            <div className="order-success-visual-mark">
              <Sparkles size={18} />
              <span>Crafted in Bangladesh</span>
            </div>
            <div className="order-success-visual-caption">
              <small>{pending ? "Verification in progress" : "From our pantry to yours"}</small>
              <strong>{reference ? `#${reference}` : "A considered order"}</strong>
            </div>
          </aside>
        </PageContainer>
      </section>

      <section className="order-success-details">
        <PageContainer>
          <div className="order-success-card">
            <div className="order-success-summary">
              <div className="order-success-card-heading">
                <span>{pending ? <Clock3 size={21} /> : <CheckCircle2 size={21} />}</span>
                <div>
                  <small>{pending ? "Verification details" : "Order details"}</small>
                  <h2>{pending ? "We are checking your payment" : "Your order has been received"}</h2>
                </div>
              </div>

              <dl className="order-success-facts">
                <div>
                  <dt>Order reference</dt>
                  <dd>{reference ? `#${reference}` : "Processing"}</dd>
                </div>
                {total ? (
                  <div>
                    <dt>Order total</dt>
                    <dd>{total}</dd>
                  </div>
                ) : null}
                {placedDate(order?.created_at) ? (
                  <div>
                    <dt>Order date</dt>
                    <dd>{placedDate(order?.created_at)}</dd>
                  </div>
                ) : null}
                <div>
                  <dt>Payment</dt>
                  <dd>{pending ? "Verifying" : order?.payment_status === "authorized" ? "Confirmed" : "Received"}</dd>
                </div>
              </dl>

              <div className="order-success-email-note">
                <Mail size={20} />
                <p>
                  {order?.email
                    ? <>Confirmation and delivery updates will be sent to <strong>{order.email}</strong>.</>
                    : "Confirmation and delivery updates will be sent using the contact details provided at checkout."}
                </p>
              </div>
            </div>

            <div className="order-success-journey">
              <div className="order-success-card-heading">
                <span><PackageCheck size={21} /></span>
                <div>
                  <small>What happens next</small>
                  <h2>Your order journey</h2>
                </div>
              </div>
              <ol>
                {journey.map((step, index) => (
                  <li className={`is-${step.state}`} key={step.label}>
                    <span className="order-success-step-number">
                      {step.state === "complete" ? <Check size={15} /> : index + 1}
                    </span>
                    <div>
                      <strong>{step.label}</strong>
                      <p>{step.detail}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          </div>

          <div className="order-success-help">
            <span>Need a hand with your order?</span>
            <Link href="/contact" className="text-link">Contact our team <ArrowRight size={14} /></Link>
          </div>
        </PageContainer>
      </section>
    </div>
  );
}
