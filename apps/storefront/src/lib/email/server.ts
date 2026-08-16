export interface TransactionalEmail {
  to: string;
  subject: string;
  text: string;
  replyTo?: string;
  idempotencyKey?: string;
}

function cleanHeader(value: string, name: string) {
  const cleaned = value.trim();
  if (!cleaned || /[\r\n]/.test(cleaned)) throw new Error(`${name} is invalid.`);
  return cleaned;
}

export async function sendTransactionalEmail(message: TransactionalEmail) {
  const provider = process.env.EMAIL_PROVIDER?.trim().toLowerCase();
  if (!provider) return false;
  if (provider !== "resend") throw new Error(`Unsupported EMAIL_PROVIDER: ${provider}`);

  const apiKey = process.env.EMAIL_PROVIDER_API_KEY?.trim();
  const from = process.env.EMAIL_FROM_ADDRESS?.trim();
  if (!apiKey || !from) throw new Error("Transactional email is not fully configured.");

  const headers: Record<string, string> = {
    authorization: `Bearer ${apiKey}`,
    "content-type": "application/json",
  };
  if (message.idempotencyKey) headers["idempotency-key"] = cleanHeader(message.idempotencyKey, "Email idempotency key");

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers,
    body: JSON.stringify({
      from: cleanHeader(from, "Email sender"),
      to: [cleanHeader(message.to, "Email recipient")],
      subject: cleanHeader(message.subject, "Email subject"),
      text: message.text,
      ...(message.replyTo ? { reply_to: cleanHeader(message.replyTo, "Email reply address") } : {}),
    }),
  });

  if (!response.ok) throw new Error(`Transactional email provider returned HTTP ${response.status}.`);
  return true;
}
