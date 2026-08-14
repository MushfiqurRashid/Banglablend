import { afterEach, describe, expect, it, vi } from "vitest";
import { sendTransactionalEmail } from "../../apps/storefront/src/lib/email/server";

const originalEnvironment = { ...process.env };

afterEach(() => {
  process.env = { ...originalEnvironment };
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("transactional email", () => {
  it("is a no-op when no provider is configured", async () => {
    delete process.env.EMAIL_PROVIDER;
    const request = vi.fn();
    vi.stubGlobal("fetch", request);

    await expect(sendTransactionalEmail({ to: "buyer@example.com", subject: "Order", text: "Received" })).resolves.toBe(false);
    expect(request).not.toHaveBeenCalled();
  });

  it("sends plain-text email through Resend without exposing the API key in the body", async () => {
    process.env.EMAIL_PROVIDER = "resend";
    process.env.EMAIL_PROVIDER_API_KEY = "re_secret";
    process.env.EMAIL_FROM_ADDRESS = "orders@banglablend.store";
    const request = vi.fn().mockResolvedValue(new Response(null, { status: 202 }));
    vi.stubGlobal("fetch", request);

    await expect(
      sendTransactionalEmail({
        to: "buyer@example.com",
        subject: "Order received",
        text: "Thank you",
        idempotencyKey: "order-received/123",
      }),
    ).resolves.toBe(true);

    const [url, init] = request.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://api.resend.com/emails");
    expect(init.headers).toMatchObject({ authorization: "Bearer re_secret", "idempotency-key": "order-received/123" });
    expect(init.body).not.toContain("re_secret");
  });

  it("rejects unsupported providers", async () => {
    process.env.EMAIL_PROVIDER = "smtp";
    await expect(sendTransactionalEmail({ to: "buyer@example.com", subject: "Order", text: "Received" })).rejects.toThrow(
      "Unsupported EMAIL_PROVIDER",
    );
  });
});
