import { AuthForm } from "@/components/account/auth-form";

export const metadata = { title: "Reset Password", robots: { index: false, follow: false } };

export default async function ResetPasswordPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token } = await searchParams;
  return <div className="auth-wrap"><AuthForm mode="reset" resetToken={token} /></div>;
}
