import { useCallback, useEffect, useState } from "react";
import { Button } from "@medusajs/ui";
import {
  ErrorState,
  LoadingState,
  PageHeader,
  ResourceCard,
  adminRequest,
  safeExternalUrl,
} from "./superadmin";

interface ContentEntry {
  title: string;
  description: string;
  schema_type: string | null;
  document_id?: string;
}

interface ContentWorkspacePayload {
  studio: {
    configured: boolean;
    url: string;
  };
  homepages: ContentEntry[];
  pages: ContentEntry[];
  library: ContentEntry[];
}

type ContentView = "homepage" | "pages" | "library";

const pageCopy: Record<ContentView, { title: string; subtitle: string; badge: string }> = {
  homepage: {
    title: "Homepage",
    subtitle:
      "Edit each localized homepage as a governed Sanity singleton while Medusa remains the source of truth for products, prices, and stock.",
    badge: "Sanity singleton",
  },
  pages: {
    title: "Pages",
    subtitle:
      "Manage evergreen website pages, policies, and help content in the Bangla Blend Content Studio.",
    badge: "Editorial pages",
  },
  library: {
    title: "Content Library",
    subtitle:
      "Open the complete editorial library for recipes, journal stories, provenance, campaigns, and media.",
    badge: "Sanity library",
  },
};

const contentViewKeys: Record<
  ContentView,
  keyof Pick<ContentWorkspacePayload, "homepages" | "pages" | "library">
> = {
  homepage: "homepages",
  pages: "pages",
  library: "library",
};

function buildStudioUrl(studioUrl: string, entry: ContentEntry) {
  const base = safeExternalUrl(studioUrl);
  if (!base) return "";

  const url = new URL(base);
  const rootPath = url.pathname.replace(/\/$/, "");
  if (entry.document_id && entry.schema_type) {
    url.pathname = `${rootPath}/intent/edit/id=${encodeURIComponent(
      entry.document_id,
    )};type=${encodeURIComponent(entry.schema_type)}`;
  } else if (entry.schema_type) {
    url.pathname = `${rootPath}/intent/create/type=${encodeURIComponent(entry.schema_type)}`;
  }
  return url.toString();
}

export function ContentWorkspace({ view }: { view: ContentView }) {
  const [data, setData] = useState<ContentWorkspacePayload>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setData(await adminRequest<ContentWorkspacePayload>("/admin/content/workspace"));
      setError(undefined);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Content workspace could not be loaded.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const copy = pageCopy[view];
  const entries = data?.[contentViewKeys[view]] ?? [];
  const studioUrl = safeExternalUrl(data?.studio.url);

  return (
    <div className="flex flex-col gap-y-4 pb-8">
      <PageHeader
        title={copy.title}
        subtitle={copy.subtitle}
        badge={copy.badge}
        actions={
          <Button
            disabled={!studioUrl}
            onClick={() => {
              if (studioUrl) window.open(studioUrl, "_blank", "noopener,noreferrer");
            }}
          >
            Open Content Studio
          </Button>
        }
      />
      {error ? <ErrorState message={error} retry={() => void load()} /> : null}
      {loading ? <LoadingState label="Loading content workspace..." /> : null}
      {!loading && data ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {entries.map((entry) => (
            <ResourceCard
              key={`${entry.title}-${entry.document_id ?? entry.schema_type ?? "all"}`}
              title={entry.title}
              description={entry.description}
              href={buildStudioUrl(data.studio.url, entry)}
              badge={
                entry.document_id ? "Edit" : entry.schema_type ? "Create / manage" : "Browse all"
              }
              external
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}
