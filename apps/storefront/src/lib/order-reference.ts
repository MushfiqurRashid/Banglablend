export function formatOrderReference(
  displayId?: number | string | null,
  fallback = "order_pending",
) {
  const numericId = Number(displayId);
  if (!Number.isInteger(numericId) || numericId < 1) return fallback;
  return `order_${String(numericId).padStart(2, "0")}`;
}
