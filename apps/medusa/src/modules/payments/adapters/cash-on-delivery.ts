import type { PaymentProviderAdapter, PaymentSessionRequest, PaymentSessionResult, PaymentValidationExpectation, PaymentValidationResult } from "./types";

export class CashOnDeliveryAdapter implements PaymentProviderAdapter {
  readonly id = "cod";

  async createSession(input: PaymentSessionRequest): Promise<PaymentSessionResult> {
    return { providerTransactionId: `cod_${input.orderReference}`, state: "authorized", publicData: { method: "cash_on_delivery", order_reference: input.orderReference } };
  }

  async validateTransaction(_validationId: string, expected: PaymentValidationExpectation): Promise<PaymentValidationResult> {
    return { valid: true, state: "authorized", providerTransactionId: `cod_${expected.orderReference}`, safeData: { method: "cash_on_delivery" } };
  }
}
