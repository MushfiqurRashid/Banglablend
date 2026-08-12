export const DEFAULT_PAGE_SIZE = 25;

export function parsePage(value?: string) {
  const page = Number(value);
  return Number.isInteger(page) && page > 0 ? page : 1;
}

export function sanitizeSearchTerm(value?: string) {
  return (value ?? "").trim().replace(/[%_,()]/g, " ").replace(/\s+/g, " ").slice(0, 120);
}

export function pageRange(page: number, pageSize = DEFAULT_PAGE_SIZE) {
  return { from: (page - 1) * pageSize, to: page * pageSize - 1 };
}
