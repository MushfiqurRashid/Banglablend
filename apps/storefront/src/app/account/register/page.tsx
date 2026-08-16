import { AuthForm } from "@/components/account/auth-form";

export const metadata = { title: "Register", robots: { index: false, follow: false } };

export default function RegisterPage() {
  return (
    <div className="auth-wrap">
      <AuthForm mode="register" />
    </div>
  );
}
