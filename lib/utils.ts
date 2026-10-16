export function getInitials(nameOrEmail: string | null | undefined): string {
  const value = (nameOrEmail ?? "Student").trim();
  const parts = value.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "ST";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/**
 * Hardened Open-Redirect & Path Injection Defense
 * - Prevents protocol-relative redirects (//evil.com)
 * - Prevents backslash bypasses (/\evil.com or \evil.com)
 * - Prevents control characters and scheme injection (javascript:, data:)
 * - Validates path strictly against origin
 */
export function safeNextPath(value: string | null | undefined): string {
  if (!value || typeof value !== "string") return "/dashboard";
  const trimmed = value.trim();

  // Block obvious exploit patterns
  if (
    !trimmed.startsWith("/") ||
    trimmed.startsWith("//") ||
    trimmed.startsWith("/\\") ||
    trimmed.includes("\\") ||
    /[\x00-\x1F\x7F]/.test(trimmed)
  ) {
    return "/dashboard";
  }

  try {
    const parsed = new URL(trimmed, "http://localhost");
    if (parsed.origin !== "http://localhost") return "/dashboard";
    // Disallow dangerous protocols
    if (parsed.protocol !== "http:") return "/dashboard";
    return parsed.pathname + parsed.search + parsed.hash;
  } catch {
    return "/dashboard";
  }
}

export function displayDate(value: string | null | undefined): string {
  if (!value) return "—";
  try {
    return new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric" }).format(new Date(value));
  } catch {
    return "—";
  }
}

export function displayDateTime(value: string | null | undefined): string {
  if (!value) return "—";
  try {
    return new Intl.DateTimeFormat("en", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    }).format(new Date(value));
  } catch {
    return "—";
  }
}

export function formatTimeRemaining(isoDate: string): { label: string; overdue: boolean } {
  try {
    const target = new Date(isoDate).getTime();
    const now = Date.now();
    const diffMs = target - now;
    if (diffMs < 0) {
      const pastDays = Math.floor(Math.abs(diffMs) / (1000 * 60 * 60 * 24));
      return {
        label: pastDays === 0 ? "Due today (passed)" : `${pastDays}d overdue`,
        overdue: true,
      };
    }
    const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    if (days > 0) return { label: `${days}d ${hours}h remaining`, overdue: false };
    if (hours > 0) return { label: `${hours}h remaining`, overdue: false };
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    return { label: `${minutes}m remaining`, overdue: false };
  } catch {
    return { label: "No deadline", overdue: false };
  }
}
