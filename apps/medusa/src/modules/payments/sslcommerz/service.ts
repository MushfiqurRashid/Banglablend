import type {
  AuthorizePaymentInput, AuthorizePaymentOutput, CancelPaymentInput, CancelPaymentOutput,
  CapturePaymentInput, CapturePaymentOutput, DeletePaymentInput, DeletePaymentOutput,
  GetPaymentStatusInput, GetPaymentStatusOutput, InitiatePaymentInput, InitiatePaymentOutput,
  Logger, PaymentSessionStatus, ProviderWebhookPayload, RefundPaymentInput, RefundPaymentOutput,
  RetrievePaymentInput, RetrievePaymentOutput, UpdatePaymentInput, UpdatePaymentOutput, WebhookActionResult
} from "@medusajs/framework/types";
import { AbstractPaymentProvider, BigNumber, MedusaError, PaymentActions } from "@medusajs/framework/utils";
import { SslCommerzClient, type SslCommerzOptions } from "./client";

type InjectedDependencies = { logger: Logger };

class SslCommerzPaymentProviderService extends AbstractPaymentProvider<SslCommerzOptions> {
  static override identifier = "sslcommerz";
  protected readonly logger_: Logger;
  protected readonly options_: SslCommerzOptions;
  protected readonly client_: SslCommerzClient;

  constructor(container: InjectedDependencies, options: SslCommerzOptions) {
    super(container, options);
    this.logger_ = container.logger;
    this.options_ = options;
    this.client_ = new SslCommerzClient(options);
  }

  static override validateOptions(options: Record<string, unknown>) {
    for (const key of ["storeId", "storePassword", "successUrl", "failUrl", "cancelUrl", "ipnUrl"]) if (!options[key]) throw new MedusaError(MedusaError.Types.INVALID_DATA, `SSLCOMMERZ option ${key} is required.`);
  }

  async initiatePayment(input: InitiatePaymentInput): Promise<InitiatePaymentOutput> {
    const data = input.data ?? {};
    const context = input.context ?? {};
    const customer = (context.customer ?? {}) as Record<string, unknown>;
    const address = (customer.billing_address ?? data.billing_address ?? data.shipping_address ?? {}) as Record<string, unknown>;
    const orderReference = (data.order_reference as string | undefined) ?? `bb_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const session = await this.client_.createSession({ amount: new BigNumber(input.amount).numeric.toString(), currency: input.currency_code, orderReference, sessionId: data.session_id as string | undefined, customer: { name: `${customer.first_name ?? address.first_name ?? data.customer_first_name ?? "Bangla"} ${customer.last_name ?? address.last_name ?? data.customer_last_name ?? "Blend"}`.trim(), email: (customer.email as string | undefined) ?? (data.customer_email as string | undefined) ?? "customer@example.invalid", telephone: (customer.phone as string | undefined) ?? (address.phone as string | undefined) ?? (data.customer_phone as string | undefined) ?? "0000000000", address: (address.address_1 as string | undefined) ?? (data.customer_address as string | undefined) ?? "Pending checkout address", city: (address.city as string | undefined) ?? (data.customer_city as string | undefined) ?? "Dhaka", country: (address.country_code as string | undefined) ?? (data.customer_country as string | undefined) ?? "BD" } });
    return { id: session.providerTransactionId, data: { ...data, ...session.publicData, session_id: data.session_id } };
  }

  async authorizePayment(input: AuthorizePaymentInput): Promise<AuthorizePaymentOutput> {
    if (input.data?.status === "authorized" || input.data?.status === "captured") return { data: input.data, status: input.data.status as PaymentSessionStatus };
    return { data: input.data, status: "pending_authorization" as PaymentSessionStatus };
  }

  async capturePayment(input: CapturePaymentInput): Promise<CapturePaymentOutput> { return { data: { ...input.data, status: "captured" } }; }
  async cancelPayment(input: CancelPaymentInput): Promise<CancelPaymentOutput> { return { data: { ...input.data, status: "canceled" } }; }
  async deletePayment(input: DeletePaymentInput): Promise<DeletePaymentOutput> { return { data: input.data }; }
  async retrievePayment(input: RetrievePaymentInput): Promise<RetrievePaymentOutput> { return { data: input.data }; }
  async updatePayment(input: UpdatePaymentInput): Promise<UpdatePaymentOutput> { return { data: { ...input.data, amount: new BigNumber(input.amount).numeric.toString(), currency_code: input.currency_code } }; }

  async refundPayment(_input: RefundPaymentInput): Promise<RefundPaymentOutput> {
    throw new MedusaError(MedusaError.Types.NOT_ALLOWED, "SSLCOMMERZ refunds require the approved refund API or a documented manual refund workflow.");
  }

  async getPaymentStatus(input: GetPaymentStatusInput): Promise<GetPaymentStatusOutput> {
    const status = input.data?.status;
    if (status === "captured") return { status: "captured" as PaymentSessionStatus };
    if (status === "authorized") return { status: "authorized" as PaymentSessionStatus };
    if (status === "canceled") return { status: "canceled" as PaymentSessionStatus };
    return { status: "pending_authorization" as PaymentSessionStatus };
  }

  async getWebhookActionAndData(payload: ProviderWebhookPayload["payload"]): Promise<WebhookActionResult> {
    const data = payload.data as Record<string, unknown>;
    const validationId = data.val_id as string | undefined;
    const transactionId = data.tran_id as string | undefined;
    const sessionId = (data.value_a as string | undefined) ?? (data.session_id as string | undefined);
    const amount = String(data.amount ?? "0");
    const currency = String(data.currency ?? "BDT");
    if (!validationId || !transactionId || !sessionId) return { action: PaymentActions.NOT_SUPPORTED, data: { session_id: sessionId ?? "", amount: new BigNumber(0) } };
    try {
      const validation = await this.client_.validateTransaction(validationId, { amount, currency, orderReference: transactionId });
      if (!validation.valid) return { action: PaymentActions.FAILED, data: { session_id: sessionId, amount: new BigNumber(amount) } };
      return { action: PaymentActions.SUCCESSFUL, data: { session_id: sessionId, amount: new BigNumber(amount) } };
    } catch (error) {
      this.logger_.error(`SSLCOMMERZ webhook validation failed: ${error instanceof Error ? error.message : "unknown error"}`);
      return { action: PaymentActions.FAILED, data: { session_id: sessionId, amount: new BigNumber(amount) } };
    }
  }
}

export default SslCommerzPaymentProviderService;
