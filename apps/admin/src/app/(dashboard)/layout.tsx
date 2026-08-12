import { redirect } from "next/navigation";
import { getStaffSession } from "@/lib/auth";
import { AdminShell } from "@/components/admin-shell";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getStaffSession();
  if (!session) redirect("/login");

  return (
    <AdminShell session={session} storefrontUrl={process.env.NEXT_PUBLIC_STOREFRONT_URL ?? "http://localhost:3000"}>
      {children}
    </AdminShell>
  );
}
