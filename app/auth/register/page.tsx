import Link from "next/link";
import { RegisterForm } from "@/components/auth-form";

export default function RegisterPage() {
  return (
    <section className="auth-card">
      <div className="auth-head">
        <span className="eyebrow">Start learning</span>
        <h1>Create your student account</h1>
        <p>Your account gives you a private dashboard, enrollments, and profile.</p>
      </div>
      <RegisterForm />
      <div className="auth-footer">
        <span>Already registered?</span>
        <Link href="/auth/login">Sign in</Link>
      </div>
    </section>
  );
}
