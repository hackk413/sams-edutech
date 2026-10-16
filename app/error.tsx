"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Icon } from "@/components/icon";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="section">
      <div className="container">
        <div className="card empty-state">
          <div className="empty-icon"><Icon name="shield" size={22} /></div>
          <strong>Something went wrong.</strong>
          <span>The page could not load. Try again, or return to your dashboard.</span>
          <div style={{ display: "flex", gap: 9, flexWrap: "wrap", justifyContent: "center", marginTop: 8 }}>
            <button className="btn btn-primary" type="button" onClick={() => reset()}>Try again</button>
            <Link className="btn btn-secondary" href="/">Go home</Link>
          </div>
        </div>
      </div>
    </main>
  );
}
