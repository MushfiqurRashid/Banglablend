import Link from "next/link";
import { ChevronLeft, ChevronRight, Search, X } from "lucide-react";

export function ListControls({
  q,
  placeholder,
  filterName,
  filterValue,
  filterLabel,
  options = [],
  clearHref,
}: {
  q: string;
  placeholder: string;
  filterName?: string;
  filterValue?: string;
  filterLabel?: string;
  options?: Array<{ value: string; label: string }>;
  clearHref: string;
}) {
  return (
    <form className="list-toolbar" method="get">
      <label className="search-input">
        <Search aria-hidden="true" />
        <span className="sr-only">Search</span>
        <input name="q" defaultValue={q} placeholder={placeholder} />
      </label>
      {filterName && options.length ? (
        <label className="filter-select">
          <span className="sr-only">{filterLabel ?? "Filter"}</span>
          <select name={filterName} defaultValue={filterValue ?? ""}>
            <option value="">{filterLabel ?? "All"}</option>
            {options.map((option) => (
              <option value={option.value} key={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      ) : null}
      <button className="btn btn-secondary" type="submit">
        <Search aria-hidden="true" /> Search
      </button>
      {q || filterValue ? (
        <Link className="btn btn-secondary" href={clearHref}>
          <X aria-hidden="true" /> Clear
        </Link>
      ) : null}
    </form>
  );
}

export function Pagination({
  page,
  pageSize,
  total,
  href,
  query = {},
}: {
  page: number;
  pageSize: number;
  total: number;
  href: string;
  query?: Record<string, string | undefined>;
}) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const linkFor = (target: number) => {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(query)) if (value) params.set(key, value);
    if (target > 1) params.set("page", String(target));
    const search = params.toString();
    return search ? `${href}?${search}` : href;
  };

  return (
    <div className="pagination-bar">
      <span>
        {total ? `${(page - 1) * pageSize + 1}-${Math.min(page * pageSize, total)} of ${total}` : "0 results"}
      </span>
      {totalPages > 1 ? (
        <div>
          {page > 1 ? (
            <Link className="icon-button" href={linkFor(page - 1)} aria-label="Previous page" title="Previous page">
              <ChevronLeft aria-hidden="true" />
            </Link>
          ) : null}
          <span>Page {page} of {totalPages}</span>
          {page < totalPages ? (
            <Link className="icon-button" href={linkFor(page + 1)} aria-label="Next page" title="Next page">
              <ChevronRight aria-hidden="true" />
            </Link>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
