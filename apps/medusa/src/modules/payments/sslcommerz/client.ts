import { randomUUID } from "node:crypto";
import { MedusaError } from "@medusajs/framework/utils";
import type { PaymentProviderAdapter, PaymentSessionRequest, PaymentSessionResult, PaymentValidationExpectation, PaymentValidationResult } from "../adapters/types";

export interface SslCommerzOptions {
  storeId: string;
  storePassword: string;
  sandbox: boolean;
  successUrl: string;
  failUrl: string;
  cancelUrl: string;
  ipnUrl: string;
}

interface SessionResponse {
  status: string;
  sessionkey?: string;
  GatewayPageURL?: string;
  failedreason?: string;
}

interface ValidationResponse {
  status?: string;
  val_id?: string;
  tran_id?: string;
  amount?: string;
  currency?: string;
  card_type?: string;
  bank_tran_id?: string;
  risk_level?: string;
}

function normalizeMoney(value: string) {
  return Number.parseFloat(value).toFixed(2);
}

export class SslCommerzClient implements PaymentProviderAdapter {
  readonly id = "sslcommerz";
  private readonly baseUrl: string;

  constructor(private readonly options: SslCommerzOptions) {
    this.baseUrl = options.sandbox ? "https://sandbox.sslcommerz.com" : "https://securepay.sslcommerz.com";
  }

  async createSession(input: PaymentSessionRequest): Promise<PaymentSessionResult> {
    const transactionId = input.orderReference || randomUUID().replaceAll("-", "").slice(0, 30);
    const body = new URLSearchParams({
      store_id: this.options.storeId,
      store_passwd: this.options.storePassword,
      total_amount: normalizeMoney(input.amount),
      currency: input.currency.toUpperCase(),
      tran_id: transactionId,
      success_url: this.options.successUrl,
      fail_url: this.options.failUrl,
      cancel_url: this.options.cancelUrl,
      ipn_url: this.options.ipnUrl,
      cus_name: input.customer.name,
      cus_email: input.customer.email,
      cus_phone: input.customer.telephone,
      cus_add1: input.customer.address,
      cus_city: input.customer.city,
      cus_country: input.customer.country,
      shipping_method: "YES",
      product_name: "Bangla Blend order",
      product_category: "Food and lifestyle",
      product_profile: "general",
      value_a: input.sessionId ?? transactionId
    });
    const response = await fetch(`${this.baseUrl}/gwprocess/v4/api.php`, { method: "POST", headers: { "content-type": "application/x-www-form-urlencoded" }, body, signal: AbortSignal.timeout(15_000) });
    const payload = (await response.json()) as SessionResponse;
    if (!response.ok || payload.status !== "SUCCESS" || !payload.GatewayPageURL || !payload.sessionkey) throw new MedusaError(MedusaError.Types.UNEXPECTED_STATE, payload.failedreason ?? "SSLCOMMERZ session creation failed.");
    return { providerTransactionId: transactionId, state: "pending_authorization", redirectUrl: payload.GatewayPageURL, publicData: { transaction_id: transactionId, session_key: payload.sessionkey, gateway_url: payload.GatewayPageURL, status: "pending_authorization", session_id: input.sessionId } };
  }

  async validateTransaction(validationId: string, expected: PaymentValidationExpectation): Promise<PaymentValidationResult> {
    const url = new URL(`${this.baseUrl}/validator/api/validationserverAPI.php`);
    url.search = new URLSearchParams({ val_id: validationId, store_id: this.options.storeId, store_passwd: this.options.storePassword, format: "json" }).toString();
    const response = await fetch(url, { signal: AbortSignal.timeout(15_000) });
    const payload = (await response.json()) as ValidationResponse;
    const statusValid = payload.status === "VALID" || payload.status === "VALIDATED";
    const amountValid = payload.amount ? normalizeMoney(payload.amount) === normalizeMoney(expected.amount) : false;
    const currencyValid = payload.currency?.toUpperCase() === expected.currency.toUpperCase();
    const referenceValid = payload.tran_id === expected.orderReference;
    const valid = response.ok && statusValid && amountValid && currencyValid && referenceValid;
    return { valid, state: valid ? "captured" : "failed", providerTransactionId: payload.tran_id ?? expected.orderReference, reason: valid ? undefined : "Provider validation, amount, currency, or order reference did not match.", safeData: { validation_id: payload.val_id, transaction_id: payload.tran_id, amount: payload.amount, currency: payload.currency, card_type: payload.card_type, bank_transaction_id: payload.bank_tran_id, risk_level: payload.risk_level, status: payload.status } };
  }
}
