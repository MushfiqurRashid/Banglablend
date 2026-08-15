import { AuthForm } from "@/components/account/auth-form";

export const metadata = { title: "Reset Password", robots: { index: false, follow: false } };

export default function ResetPasswordPage() {
  return <div className="auth-wrap"><AuthForm mode="reset" /></div>;
}
