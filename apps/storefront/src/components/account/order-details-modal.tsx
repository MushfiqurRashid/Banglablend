"use client";

import { useEffect, useRef, useState } from "react";
import { X, Download } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { formatMoney } from "@bangla-blend/commerce-client";
import { useModalDialog } from "@/components/accessibility/use-modal-dialog";
import { formatOrderReference } from "@/lib/order-reference";
import { buildOrderTrackingSteps } from "@/lib/order-tracking";
import { OrderTrackingTimeline } from "./order-tracking-timeline";

interface OrderLineItem {
  id: string;
  title: string;
  variant_title: string | null;
  thumbnail_url: string | null;
  quantity: number;
  unit_price: number;
  fulfilled_quantity: number;
}

interface OrderAddress {
  address_type: string;
  first_name: string;
  last_name: string;
  address_1: string;
  address_2: string | null;
  city: string;
  province: string | null;
  postal_code: string | null;
  country_code: string;
  phone: string;
}

interface OrderDetail {
  id: string;
  display_id: number;
  email: string;
  currency_code: string;
  subtotal: number;
  shipping_total: number;
  tax_total: number;
  total: number;
  status: string;
  payment_status: string;
  fulfillment_status: string;
  is_gift: boolean;
  created_at: string;
  canceled_at: string | null;
  order_line_items: OrderLineItem[];
  order_addresses: OrderAddress[];
  fulfillments: { shipped_at: string | null; delivered_at: string | null; canceled_at: string | null }[];
  payment_collections: { payment_sessions: { provider: string }[] }[];
}

const providerLabels: Record<string, string> = {
  cod: "Cash on Delivery",
  sslcommerz: "SSLCommerz",
  bkash: "bKash",
  nagad: "Nagad",
  wallet: "Wallet",
};

export function OrderDetailsModal({ orderId, onClose }: { orderId: string | null; onClose: () => void }) {
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const reducedMotion = useReducedMotion();
  const isOpen = Boolean(orderId);
  useModalDialog(isOpen, onClose, dialogRef, closeRef);

  useEffect(() => {
    if (!orderId) {
      setOrder(null);
      setError(null);
      return;
    }
    let cancelled = false;
    fetch(`/api/account/orders/${orderId}`)
      .then((response) => (response.ok ? response.json() : Promise.reject(new Error("not found"))))
      .then((data) => { if (!cancelled) setOrder(data); })
      .catch(() => { if (!cancelled) setError("This order could not be loaded."); });
    return () => { cancelled = true; };
  }, [orderId]);

  const shipping = order?.order_addresses.find((address) => address.address_type === "shipping");
  const provider = order?.payment_collections?.[0]?.payment_sessions?.[0]?.provider;
  const paymentLabel = provider ? (providerLabels[provider] ?? provider) : "—";
  const steps = order
    ? buildOrderTrackingSteps({
        created_at: order.created_at,
        payment_status: order.payment_status,
        is_cod: provider === "cod",
        canceled_at: order.canceled_at,
        status: order.status,
        items: order.order_line_items.map((item) => ({ quantity: item.quantity, fulfilled_quantity: item.fulfilled_quantity })),
        fulfillments: order.fulfillments,
      })
    : [];

  return (
    <AnimatePresence>
      {isOpen ? (
        <motion.div
          className="order-modal-overlay"
          role="presentation"
          initial={reducedMotion ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}
        >
          <motion.div
            ref={dialogRef}
            className="order-details-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="order-modal-title"
            tabIndex={-1}
            initial={reducedMotion ? false : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="order-modal-header">
              <div>
                <h2 id="order-modal-title">Order Details</h2>
                {order ? <p className="field-note">Order ID: #{formatOrderReference(order.display_id, order.id)}</p> : null}
              </div>
              <button ref={closeRef} className="icon-button" type="button" onClick={onClose} aria-label="Close order details">
                <X />
              </button>
            </div>

            {error ? <p className="form-error" role="alert">{error}</p> : null}
            {!order && !error ? <p className="field-note">Loading order…</p> : null}

            {order ? (
              <div className="order-modal-body">
                {order.fulfillment_status ? (
                  <span className={`order-status-badge status-${order.fulfillment_status}`}>{order.fulfillment_status.replaceAll("_", " ")}</span>
                ) : null}

                <div className="order-modal-grid">
                  <section>
                    <h3>Customer Information</h3>
                    <p>{shipping ? `${shipping.first_name} ${shipping.last_name}` : "—"}</p>
                    <p>{shipping?.phone ?? "—"}</p>
                    <p>{order.email}</p>
                  </section>
                  <section>
                    <h3>Delivery Address</h3>
                    {shipping ? (
                      <p>
                        {shipping.address_1}
                        {shipping.address_2 ? `, ${shipping.address_2}` : ""}
                        <br />
                        {shipping.city}
                        {shipping.province ? `, ${shipping.province}` : ""}
                        <br />
                        {shipping.postal_code ? `${shipping.postal_code} ` : ""}
                        {shipping.country_code.toUpperCase()}
                      </p>
                    ) : (
                      <p>—</p>
                    )}
                  </section>
                  <section>
                    <h3>Order Summary</h3>
                    <div className="order-summary-row"><span>Subtotal</span><span>{formatMoney(order.subtotal, order.currency_code.toUpperCase())}</span></div>
                    <div className="order-summary-row"><span>Delivery Charge</span><span>{formatMoney(order.shipping_total, order.currency_code.toUpperCase())}</span></div>
                    {order.tax_total > 0 ? (
                      <div className="order-summary-row"><span>Tax</span><span>{formatMoney(order.tax_total, order.currency_code.toUpperCase())}</span></div>
                    ) : null}
                    <div className="order-summary-row order-summary-total"><span>Total</span><span>{formatMoney(order.total, order.currency_code.toUpperCase())}</span></div>
                    <div className="order-summary-row"><span>Payment Method</span><span>{paymentLabel}</span></div>
                  </section>
                </div>

                <div className="order-modal-grid order-modal-grid-2">
                  <section>
                    <h3>Items Ordered</h3>
                    <table className="order-items-table">
                      <thead>
                        <tr>
                          <th>Product</th>
                          <th>Qty</th>
                          <th>Price</th>
                        </tr>
                      </thead>
                      <tbody>
                        {order.order_line_items.map((item) => (
                          <tr key={item.id}>
                            <td>
                              <strong>{item.title}</strong>
                              {item.variant_title ? <span className="field-note"> {item.variant_title}</span> : null}
                            </td>
                            <td>{item.quantity}</td>
                            <td>{formatMoney(item.unit_price, order.currency_code.toUpperCase())}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </section>
                  <section>
                    <h3>Order Status</h3>
                    <OrderTrackingTimeline steps={steps} />
                  </section>
                </div>

                <div className="order-modal-footer">
                  <button className="button" type="button" onClick={onClose}>
                    Close
                  </button>
                  <button className="button button-primary" type="button" onClick={() => window.print()}>
                    <Download size={16} /> Download Invoice
                  </button>
                </div>
              </div>
            ) : null}
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
