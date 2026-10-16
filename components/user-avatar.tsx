"use client";

import { useEffect, useSyncExternalStore } from "react";
import { getInitials } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";

interface UserAvatarProps {
  userId?: string | null;
  displayName: string;
  initialAvatarUrl?: string | null;
  className?: string;
  imgClassName?: string;
  children?: React.ReactNode;
}

function subscribe(callback: () => void) {
  window.addEventListener("orbitlms_avatar_updated", callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener("orbitlms_avatar_updated", callback);
    window.removeEventListener("storage", callback);
  };
}

export function UserAvatar({
  userId,
  displayName,
  initialAvatarUrl,
  className = "avatar",
  imgClassName = "avatar-img",
  children,
}: UserAvatarProps) {
  const localAvatar = useSyncExternalStore(
    subscribe,
    () => (userId ? localStorage.getItem(`orbitlms_avatar_${userId}`) : null),
    () => null,
  );

  useEffect(() => {
    if (!userId) return;

    // If legacy initialAvatarUrl had a data URI, migrate to localStorage and purge from auth metadata
    if (initialAvatarUrl && initialAvatarUrl.startsWith("data:")) {
      try {
        localStorage.setItem(`orbitlms_avatar_${userId}`, initialAvatarUrl);
        window.dispatchEvent(new CustomEvent("orbitlms_avatar_updated", { detail: { avatarUrl: initialAvatarUrl } }));
      } catch {
        // ignore quota
      }

      // Purge from Supabase Auth metadata so JWT cookies shrink back to < 1KB
      const supabase = createClient();
      supabase.auth
        .updateUser({
          data: { avatar_url: null, has_custom_avatar: true },
        })
        .catch(() => {});
    }
  }, [userId, initialAvatarUrl]);

  const avatarSrc = localAvatar || (initialAvatarUrl && !initialAvatarUrl.startsWith("data:") ? initialAvatarUrl : null);

  return (
    <div className={className}>
      {avatarSrc ? (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img src={avatarSrc} alt={displayName} className={imgClassName} />
      ) : (
        <span className="avatar-initials">{getInitials(displayName)}</span>
      )}
      {children}
    </div>
  );
}
