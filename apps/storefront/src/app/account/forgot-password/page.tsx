import { AuthForm } from "@/components/account/auth-form";
export const metadata = { title: "Forgot Password", robots: { index: false, follow: false } };
export default function ForgotPasswordPage() { return <div className="auth-wrap"><AuthForm mode="forgot" /></div>; }
