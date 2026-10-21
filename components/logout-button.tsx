"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Icon } from "@/components/icon";

export function LogoutButton({ className = "btn btn-ghost" }: { className?: string }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function logout() {
    setLoading(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <button className={className} onClick={logout} disabled={loading} aria-label="Sign out">
      <Icon name="logout" size={16}/>{loading ? "Signing out" : "Sign out"}
    </button>
  );
}
