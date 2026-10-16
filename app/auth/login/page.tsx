import Link from "next/link";
import { LoginForm } from "@/components/auth-form";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string; error?: string }> }) {
  const params = await searchParams;
  const callbackError =
    params.error === "auth_callback"
      ? "That verification or recovery link is no longer valid. Request a new link and try again."
      : undefined;
  return (
    <section className="auth-card">
      <div className="auth-head">
        <span className="eyebrow">Welcome back</span>
        <h1>Continue learning.</h1>
        <p>Sign in to open your dashboard, courses and private student profile.</p>
      </div>
      <LoginForm next={params.next} initialError={callbackError} />
      <div className="auth-footer">
        <span>New here?</span>
        <Link href="/auth/register">Create an account</Link>
      </div>
    </section>
  );
}
