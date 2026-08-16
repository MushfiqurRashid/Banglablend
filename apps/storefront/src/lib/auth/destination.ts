export const CUSTOMER_DASHBOARD_PATH = "/account";

export function customerAuthDestination(requestedNext: string | null) {
  return requestedNext === "/account/reset-password" ? requestedNext : CUSTOMER_DASHBOARD_PATH;
}
