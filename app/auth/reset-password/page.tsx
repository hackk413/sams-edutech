import { ResetPasswordForm } from "@/components/auth-form";

export default function ResetPasswordPage() {
  return (
    <section className="auth-card">
      <div className="auth-head">
        <span className="eyebrow">New password</span>
        <h1>Choose a new password</h1>
        <p>Use a strong password you do not reuse on other sites.</p>
      </div>
      <ResetPasswordForm />
    </section>
  );
}
