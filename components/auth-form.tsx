"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Icon } from "@/components/icon";
import { safeNextPath } from "@/lib/utils";

const MIN_PASSWORD_LENGTH = 10;

function friendlyAuthError(message: string) {
  if (/invalid login credentials/i.test(message)) return "The email or password is incorrect.";
  if (/email not confirmed/i.test(message)) return "Verify your email before signing in.";
  if (/user already registered/i.test(message)) return "An account with that email already exists.";
  if (/password/i.test(message) && /at least|weak|short/i.test(message))
    return `Use a stronger password with at least ${MIN_PASSWORD_LENGTH} characters.`;
  return "We could not complete that account action. Please try again.";
}

export function LoginForm({ next, initialError }: { next?: string; initialError?: string }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(initialError ?? "");
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      if (error) { setError(friendlyAuthError(error.message)); return; }
      router.push(safeNextPath(next));
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="auth-form" onSubmit={submit} noValidate>
      {error && <div className="form-error" role="alert">{error}</div>}
      <div className="field">
        <label htmlFor="email">Email address</label>
        <input
          id="email"
          type="email"
          autoComplete="email"
          inputMode="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
        />
      </div>
      <div className="field">
        <label htmlFor="password">Password</label>
        <input
          id="password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
        />
      </div>
      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <Link href="/auth/forgot-password" style={{ color: "var(--blue)", fontWeight: 700, fontSize: "0.8rem" }}>Forgot password?</Link>
      </div>
      <button className="btn btn-primary" type="submit" disabled={loading} style={{ width: "100%" }}>
        {loading ? "Signing in..." : <><span>Sign in</span> <Icon name="arrow" size={16} /></>}
      </button>
    </form>
  );
}

export function RegisterForm() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError("");
    setSuccess("");
    if (fullName.trim().length < 2) return setError("Please enter your full name.");
    if (password.length < MIN_PASSWORD_LENGTH) return setError(`Use a password with at least ${MIN_PASSWORD_LENGTH} characters.`);
    if (password !== confirm) return setError("Passwords do not match.");
    setLoading(true);
    try {
      const supabase = createClient();
      const origin = window.location.origin;
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: { full_name: fullName.trim() },
          emailRedirectTo: `${origin}/auth/callback?next=/dashboard`,
        },
      });
      if (error) { setError(friendlyAuthError(error.message)); return; }
      if (data.session) { router.push("/dashboard"); router.refresh(); return; }
      setSuccess("Account created. Check your email to verify your account, then sign in.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="auth-form" onSubmit={submit} noValidate>
      {error && <div className="form-error" role="alert">{error}</div>}
      {success && <div className="form-success" role="status"><Icon name="check" size={15} />{success}</div>}
      <div className="field">
        <label htmlFor="full-name">Full name</label>
        <input
          id="full-name"
          autoComplete="name"
          value={fullName}
          onChange={(event) => setFullName(event.target.value)}
          maxLength={80}
          required
        />
      </div>
      <div className="field">
        <label htmlFor="register-email">Email address</label>
        <input
          id="register-email"
          type="email"
          autoComplete="email"
          inputMode="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
        />
      </div>
      <div className="field">
        <label htmlFor="register-password">Password</label>
        <input
          id="register-password"
          type="password"
          autoComplete="new-password"
          minLength={MIN_PASSWORD_LENGTH}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
          aria-describedby="password-help"
        />
        <span id="password-help" style={{ color: "var(--muted)", fontSize: "0.73rem" }}>
          Use at least {MIN_PASSWORD_LENGTH} characters.
        </span>
      </div>
      <div className="field">
        <label htmlFor="confirm-password">Confirm password</label>
        <input
          id="confirm-password"
          type="password"
          autoComplete="new-password"
          minLength={MIN_PASSWORD_LENGTH}
          value={confirm}
          onChange={(event) => setConfirm(event.target.value)}
          required
        />
      </div>
      <button className="btn btn-orange" type="submit" disabled={loading} style={{ width: "100%" }}>
        {loading ? "Creating account..." : <><span>Create account</span> <Icon name="arrow" size={16} /></>}
      </button>
    </form>
  );
}

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/auth/callback?next=/auth/reset-password`,
      });
      if (error) setError(friendlyAuthError(error.message));
      else setSuccess("If the account exists, a password reset link has been sent.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="auth-form" onSubmit={submit}>
      {error && <div className="form-error" role="alert">{error}</div>}
      {success && <div className="form-success" role="status"><Icon name="check" size={15} />{success}</div>}
      <div className="field">
        <label htmlFor="reset-email">Email address</label>
        <input
          id="reset-email"
          type="email"
          autoComplete="email"
          inputMode="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
        />
      </div>
      <button className="btn btn-primary" type="submit" disabled={loading} style={{ width: "100%" }}>
        {loading ? "Sending..." : "Send reset link"}
      </button>
    </form>
  );
}

export function ResetPasswordForm() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError("");
    if (password.length < MIN_PASSWORD_LENGTH)
      return setError(`Use a password with at least ${MIN_PASSWORD_LENGTH} characters.`);
    if (password !== confirm) return setError("Passwords do not match.");
    setLoading(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({ password });
      if (error) { setError(friendlyAuthError(error.message)); return; }
      router.push("/dashboard");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="auth-form" onSubmit={submit} noValidate>
      {error && <div className="form-error" role="alert">{error}</div>}
      <div className="field">
        <label htmlFor="new-password">New password</label>
        <input
          id="new-password"
          type="password"
          autoComplete="new-password"
          minLength={MIN_PASSWORD_LENGTH}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
        />
      </div>
      <div className="field">
        <label htmlFor="new-password-confirm">Confirm new password</label>
        <input
          id="new-password-confirm"
          type="password"
          autoComplete="new-password"
          minLength={MIN_PASSWORD_LENGTH}
          value={confirm}
          onChange={(event) => setConfirm(event.target.value)}
          required
        />
      </div>
      <button className="btn btn-primary" type="submit" disabled={loading} style={{ width: "100%" }}>
        {loading ? "Updating..." : "Update password"}
      </button>
    </form>
  );
}
