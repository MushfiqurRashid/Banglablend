export type PaymentState = "pending" | "pending_authorization" | "authorized" | "captured" | "failed" | "canceled";

export interface PaymentSessionRequest {
  amount: string;
  currency: string;
  orderReference: string;
  sessionId?: string;
  customer: { name: string; email: string; telephone: string; address: string; city: string; country: string };
}

export interface PaymentSessionResult {
  providerTransactionId: string;
  state: PaymentState;
  redirectUrl?: string;
  publicData: Record<string, unknown>;
}

export interface PaymentValidationExpectation {
  amount: string;
  currency: string;
  orderReference: string;
}

export interface PaymentValidationResult {
  valid: boolean;
  state: PaymentState;
  providerTransactionId: string;
  reason?: string;
  safeData: Record<string, unknown>;
}

export interface PaymentProviderAdapter {
  readonly id: string;
  createSession(input: PaymentSessionRequest): Promise<PaymentSessionResult>;
  validateTransaction(validationId: string, expected: PaymentValidationExpectation): Promise<PaymentValidationResult>;
}
