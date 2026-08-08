import { useEffect, type ReactNode } from "react";
import { Badge, Button, Container, Heading, Text } from "@medusajs/ui";

export const adminPath = (path: string) => `/app${path.startsWith("/") ? path : `/${path}`}`;

export async function adminRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const headers = new Headers(init?.headers);
  if (typeof init?.body === "string" && !headers.has("content-type")) {
    headers.set("content-type", "application/json");
  }

  const response = await fetch(path, {
    ...init,
    credentials: "include",
    headers,
  });
  const payload = (await response.json().catch(() => null)) as (T & { message?: string }) | null;
  if (!response.ok) {
    throw new Error(payload?.message ?? `Request failed with status ${response.status}.`);
  }
  return payload as T;
}

export function safeExternalUrl(value?: string | null) {
  if (!value) return undefined;

  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:" ? url.toString() : undefined;
  } catch {
    return undefined;
  }
}

export function PageHeader({
  title,
  subtitle,
  badge,
  actions,
}: {
  title: string;
  subtitle: string;
  badge?: string;
  actions?: ReactNode;
}) {
  return (
    <Container>
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          {badge ? <Badge color="purple">{badge}</Badge> : null}
          <Heading level="h1" className={badge ? "mt-3" : undefined}>
            {title}
          </Heading>
          <Text className="text-ui-fg-subtle mt-2 max-w-3xl">{subtitle}</Text>
        </div>
        {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
      </div>
    </Container>
  );
}

export function MetricCard({
  label,
  value,
  detail,
  tone = "grey",
}: {
  label: string;
  value: number | string;
  detail?: string;
  tone?: "grey" | "green" | "blue" | "orange" | "red" | "purple";
}) {
  return (
    <Container className="min-h-32">
      <div className="flex items-start justify-between gap-3">
        <Text size="small" weight="plus" className="text-ui-fg-subtle">
          {label}
        </Text>
        <Badge color={tone} aria-hidden="true">
          {typeof value === "number" ? value.toLocaleString() : value}
        </Badge>
      </div>
      <Heading level="h2" className="mt-4 text-3xl">
        {typeof value === "number" ? value.toLocaleString() : value}
      </Heading>
      {detail ? (
        <Text size="small" className="text-ui-fg-subtle mt-1">
          {detail}
        </Text>
      ) : null}
    </Container>
  );
}

export function ResourceCard({
  title,
  description,
  href,
  badge,
  external = false,
}: {
  title: string;
  description: string;
  href: string;
  badge?: string;
  external?: boolean;
}) {
  const destination = external ? safeExternalUrl(href) : href;

  return (
    <Container className="flex min-h-44 flex-col justify-between">
      <div>
        <div className="flex items-start justify-between gap-3">
          <Heading level="h2">{title}</Heading>
          {badge ? <Badge color="grey">{badge}</Badge> : null}
        </div>
        <Text className="text-ui-fg-subtle mt-2">{description}</Text>
      </div>
      {destination ? (
        <a
          className="text-ui-fg-interactive mt-5 inline-flex w-fit items-center text-sm font-medium hover:underline"
          href={destination}
          {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
        >
          Open {title}{" "}
          <span aria-hidden="true" className="ml-1">
            →
          </span>
          {external ? <span className="sr-only"> (opens in a new tab)</span> : null}
        </a>
      ) : (
        <Text size="small" className="text-ui-fg-subtle mt-5">
          Integration URL not configured
        </Text>
      )}
    </Container>
  );
}

export function LoadingState({ label = "Loading…" }: { label?: string }) {
  return (
    <Container>
      <div className="flex items-center gap-3 py-5" role="status" aria-live="polite">
        <span
          className="border-ui-border-strong size-4 animate-spin rounded-full border-2 border-t-transparent"
          aria-hidden="true"
        />
        <Text>{label}</Text>
      </div>
    </Container>
  );
}

export function ErrorState({ message, retry }: { message: string; retry?: () => void }) {
  return (
    <Container>
      <div
        className="flex flex-col gap-3 py-3 sm:flex-row sm:items-center sm:justify-between"
        role="alert"
      >
        <div>
          <Heading level="h2">Something needs attention</Heading>
          <Text className="text-ui-fg-error mt-1">{message}</Text>
        </div>
        {retry ? (
          <Button variant="secondary" onClick={retry}>
            Try again
          </Button>
        ) : null}
      </div>
    </Container>
  );
}

export function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div className="border-ui-border-base rounded-lg border border-dashed px-5 py-8 text-center">
      <Heading level="h3">{title}</Heading>
      <Text size="small" className="text-ui-fg-subtle mt-1">
        {description}
      </Text>
    </div>
  );
}

export function AdminRouteRedirect({ destination, label }: { destination: string; label: string }) {
  useEffect(() => {
    window.location.replace(adminPath(destination));
  }, [destination]);

  return <LoadingState label={`Opening ${label}...`} />;
}
