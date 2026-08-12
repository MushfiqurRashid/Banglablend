import "server-only";

// SSLCOMMERZ adapter. Ported from the retired apps/medusa/src/modules/payments/sslcommerz/*
// (same API contract, same validation rules) now that payment logic lives directly in the
// storefront instead of behind a separate commerce backend.

export interface SslCommerzCustomer {
  name: string;
  email: string;
  telephone: string;
  address: string;
  city: string;
  country: string;
}

export interface SslCommerzSessionResult {
  transactionId: string;
  gatewayUrl: string;
  sessionKey: string;
}

export interface SslCommerzValidationResult {
  valid: boolean;
  transactionId?: string;
  reason?: string;
  safeData: Record<string, unknown>;
}

function normalizeMoney(value: string | number) {
  return Number.parseFloat(String(value)).toFixed(2);
}

function getConfig() {
  const storeId = process.env.SSLCOMMERZ_STORE_ID;
  const storePassword = process.env.SSLCOMMERZ_STORE_PASSWORD;
  const sandbox = process.env.SSLCOMMERZ_SANDBOX !== "false";
  if (!storeId || !storePassword) return null;
  return {
    storeId,
    storePassword,
    baseUrl: sandbox ? "https://sandbox.sslcommerz.com" : "https://securepay.sslcommerz.com",
  };
}

export async function createSslCommerzSession(input: {
  transactionId: string;
  amount: number;
  currency: string;
  customer: SslCommerzCustomer;
  successUrl: string;
  failUrl: string;
  cancelUrl: string;
  ipnUrl: string;
}): Promise<SslCommerzSessionResult> {
  const config = getConfig();
  if (!config) throw new Error("SSLCOMMERZ is not configured.");
  const body = new URLSearchParams({
    store_id: config.storeId,
    store_passwd: config.storePassword,
    total_amount: normalizeMoney(input.amount),
    currency: input.currency.toUpperCase(),
    tran_id: input.transactionId,
    success_url: input.successUrl,
    fail_url: input.failUrl,
    cancel_url: input.cancelUrl,
    ipn_url: input.ipnUrl,
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
  });
  const response = await fetch(`${config.baseUrl}/gwprocess/v4/api.php`, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body,
    signal: AbortSignal.timeout(15_000),
  });
  const payload = (await response.json()) as { status: string; sessionkey?: string; GatewayPageURL?: string; failedreason?: string };
  if (!response.ok || payload.status !== "SUCCESS" || !payload.GatewayPageURL || !payload.sessionkey) {
    throw new Error(payload.failedreason ?? "SSLCOMMERZ session creation failed.");
  }
  return { transactionId: input.transactionId, gatewayUrl: payload.GatewayPageURL, sessionKey: payload.sessionkey };
}

export async function validateSslCommerzTransaction(
  validationId: string,
  expected: { amount: number; currency: string; transactionId: string },
): Promise<SslCommerzValidationResult> {
  const config = getConfig();
  if (!config) throw new Error("SSLCOMMERZ is not configured.");
  const url = new URL(`${config.baseUrl}/validator/api/validationserverAPI.php`);
  url.search = new URLSearchParams({ val_id: validationId, store_id: config.storeId, store_passwd: config.storePassword, format: "json" }).toString();
  const response = await fetch(url, { signal: AbortSignal.timeout(15_000) });
  const payload = (await response.json()) as {
    status?: string;
    val_id?: string;
    tran_id?: string;
    amount?: string;
    currency?: string;
    card_type?: string;
    bank_tran_id?: string;
    risk_level?: string;
  };
  const statusValid = payload.status === "VALID" || payload.status === "VALIDATED";
  const amountValid = payload.amount ? normalizeMoney(payload.amount) === normalizeMoney(expected.amount) : false;
  const currencyValid = payload.currency?.toUpperCase() === expected.currency.toUpperCase();
  const referenceValid = payload.tran_id === expected.transactionId;
  const valid = response.ok && statusValid && amountValid && currencyValid && referenceValid;
  return {
    valid,
    transactionId: payload.tran_id,
    reason: valid ? undefined : "Provider validation, amount, currency, or order reference did not match.",
    safeData: {
      validation_id: payload.val_id,
      transaction_id: payload.tran_id,
      amount: payload.amount,
      currency: payload.currency,
      card_type: payload.card_type,
      bank_transaction_id: payload.bank_tran_id,
      risk_level: payload.risk_level,
      status: payload.status,
    },
  };
}
