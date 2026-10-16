import Link from "next/link";
import { ForgotPasswordForm } from "@/components/auth-form";
import { Icon } from "@/components/icon";

export default function ForgotPasswordPage() {
  return (
    <section className="auth-card">
      <div className="auth-head">
        <span className="eyebrow">Account recovery</span>
        <h1>Reset your password</h1>
        <p>Enter your email and we will send a secure recovery link.</p>
      </div>
      <ForgotPasswordForm />
      <div className="auth-footer">
        <Link href="/auth/login" style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
          <Icon name="arrow" size={14} style={{ transform: "rotate(180deg)" }} /> Back to sign in
        </Link>
      </div>
    </section>
  );
}
