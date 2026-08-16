import { redirect } from "next/navigation";
import { AuthForm } from "@/components/account/auth-form";
import { getCustomerSession } from "@/lib/auth/server";

export const metadata = { title: "Sign In", robots: { index: false, follow: false } };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ auth?: string; confirmation?: string }>;
}) {
  if (await getCustomerSession()) redirect("/account");
  const params = await searchParams;
  const initialError =
    params.auth === "failed" || params.confirmation === "failed"
      ? "We could not finish signing you in. Please try again."
      : undefined;
  return (
    <div className="auth-wrap">
      <AuthForm mode="login" initialError={initialError} />
    </div>
  );
}
