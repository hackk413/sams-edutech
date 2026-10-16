import Link from "next/link";

export default function NotFound() {
  return (
    <main className="auth-wrap">
      <section className="auth-card">
        <span className="eyebrow">404</span>
        <h1 style={{ fontSize: "1.8rem", letterSpacing: "-0.04em", fontWeight: 800 }}>Page not found.</h1>
        <p style={{ color: "var(--muted)", marginTop: 6 }}>The page you requested does not exist or has been moved.</p>
        <Link href="/" className="btn btn-primary" style={{ marginTop: 16 }}>Back to home</Link>
      </section>
    </main>
  );
}
