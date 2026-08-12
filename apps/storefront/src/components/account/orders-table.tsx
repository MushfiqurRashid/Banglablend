"use client";

import { useState } from "react";
import { formatMoney } from "@bangla-blend/commerce-client";
import { formatOrderReference } from "@/lib/order-reference";
import { OrderDetailsModal } from "./order-details-modal";

export interface OrderSummary {
  id: string;
  display_id: number;
  created_at: string;
  currency_code: string;
  total: number;
  fulfillment_status: string | null;
}

export function OrdersTable({ orders }: { orders: OrderSummary[] }) {
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);

  if (!orders.length) {
    return (
      <div className="empty-state" style={{ marginTop: "2rem" }}>
        <h3>No orders to show</h3>
        <p>Your completed orders and gift history will appear here.</p>
      </div>
    );
  }

  return (
    <>
      <div className="account-orders-table-wrap" style={{ marginTop: "2rem" }}>
        <table className="account-orders-table">
          <thead>
            <tr>
              <th>Order ID</th>
              <th>Date</th>
              <th>Status</th>
              <th>Total</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order.id}>
                <td>{formatOrderReference(order.display_id, order.id)}</td>
                <td>{new Intl.DateTimeFormat("en-BD", { dateStyle: "medium" }).format(new Date(order.created_at))}</td>
                <td>
                  <span className={`order-status-badge status-${order.fulfillment_status ?? "not_fulfilled"}`}>
                    {(order.fulfillment_status ?? "not fulfilled").replaceAll("_", " ")}
                  </span>
                </td>
                <td>{formatMoney(order.total, order.currency_code.toUpperCase())}</td>
                <td>
                  <button className="button" type="button" onClick={() => setSelectedOrderId(order.id)}>
                    View Details
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <OrderDetailsModal orderId={selectedOrderId} onClose={() => setSelectedOrderId(null)} />
    </>
  );
}
