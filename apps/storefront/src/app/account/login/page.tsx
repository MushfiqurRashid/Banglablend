import { redirect } from "next/navigation";
import { AuthForm } from "@/components/account/auth-form";
import { getCustomerSession } from "@/lib/auth/server";

export const metadata = { title: "Sign In", robots: { index: false, follow: false } };

export default async function LoginPage() { if (await getCustomerSession()) redirect("/account"); return <div className="auth-wrap"><AuthForm mode="login" /></div>; }
