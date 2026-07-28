import { redirect } from "next/navigation";
import { ProfileForm } from "@/components/account/profile-form";
import { getCustomerSession } from "@/lib/auth/server";

export const metadata = { title: "Profile", robots: { index: false, follow: false } };

export default async function ProfilePage() {
  const customer = await getCustomerSession();
  if (!customer) redirect("/account/login");
  return <><span className="eyebrow">Account details</span><h1>Profile</h1><ProfileForm customer={{ email: customer.email, firstName: customer.first_name ?? "", lastName: customer.last_name ?? "", phone: customer.phone ?? "" }} /></>;
}
