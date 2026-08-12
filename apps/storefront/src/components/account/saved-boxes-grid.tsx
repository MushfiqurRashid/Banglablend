"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Trash2 } from "lucide-react";

export interface SavedBoxSummary {
  id: string;
  catalog: { name: string; handle: string; box_size: number | null } | null;
  items: { product: { title: string; thumbnail_url: string | null } | null }[];
}

export function SavedBoxesGrid({ boxes }: { boxes: SavedBoxSummary[] }) {
  const router = useRouter();
  const [deleting, setDeleting] = useState<string | null>(null);

  const remove = async (id: string) => {
    setDeleting(id);
    try {
      await fetch(`/api/account/saved-boxes/${id}`, { method: "DELETE" });
      router.refresh();
    } finally {
      setDeleting(null);
    }
  };

  if (!boxes.length) {
    return (
      <div className="empty-state">
        <h3>No saved boxes yet</h3>
        <p>
          Build a gift box on any &ldquo;Build a Box&rdquo; catalog and save it here to finish later.{" "}
          <Link href="/gifts" className="text-link">Browse gift catalogs</Link>
        </p>
      </div>
    );
  }

  return (
    <div className="saved-box-grid">
      {boxes.map((box) => (
        <div className="saved-box-card" key={box.id}>
          <div className="saved-box-collage" aria-hidden="true">
            {box.items.slice(0, 4).map((item, index) =>
              item.product?.thumbnail_url ? (
                <img key={index} src={item.product.thumbnail_url} alt="" />
              ) : (
                <span key={index}>ব</span>
              ),
            )}
          </div>
          <strong>{box.catalog?.name ?? "Gift box"}</strong>
          <span className="field-note">
            {box.items.length} of {box.catalog?.box_size ?? box.items.length} items
          </span>
          <div className="saved-box-actions">
            {box.catalog ? (
              <Link href={`/gifts/${box.catalog.handle}`} className="button">View Catalog</Link>
            ) : null}
            <button type="button" className="icon-button" onClick={() => void remove(box.id)} disabled={deleting === box.id} aria-label="Delete saved box">
              <Trash2 size={16} />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
