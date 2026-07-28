export interface EmailMessage { to: string; subject: string; html: string; text: string; idempotencyKey?: string; }
export interface EmailAdapter { send(message: EmailMessage): Promise<{ id: string }>; }

export class DisabledEmailAdapter implements EmailAdapter {
  async send(_message: EmailMessage): Promise<{ id: string }> { throw new Error("Transactional email is not configured."); }
}

export function createEmailAdapter(): EmailAdapter {
  const provider = process.env.EMAIL_PROVIDER;
  if (!provider) return new DisabledEmailAdapter();
  return new HttpEmailAdapter(provider, process.env.EMAIL_PROVIDER_API_KEY ?? "");
}

class HttpEmailAdapter implements EmailAdapter {
  constructor(private readonly provider: string, private readonly apiKey: string) {}
  async send(message: EmailMessage) {
    if (!this.apiKey) throw new Error("Email provider API key is missing.");
    const endpoint = this.provider === "resend" ? "https://api.resend.com/emails" : process.env.EMAIL_PROVIDER_ENDPOINT;
    if (!endpoint) throw new Error(`Email provider ${this.provider} needs an endpoint adapter.`);
    const { idempotencyKey, ...payload } = message;
    const response = await fetch(endpoint, { method: "POST", headers: { authorization: `Bearer ${this.apiKey}`, "content-type": "application/json", ...(idempotencyKey ? { "idempotency-key": idempotencyKey } : {}) }, body: JSON.stringify({ from: process.env.EMAIL_FROM_ADDRESS, ...payload }) });
    if (!response.ok) throw new Error("Email delivery failed.");
    const responsePayload = (await response.json()) as { id?: string };
    return { id: responsePayload.id ?? "accepted" };
  }
}
