"use client";

import { useState, useRef, useEffect, type ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Icon } from "@/components/icon";
import { getInitials } from "@/lib/utils";

interface AvatarUploaderProps {
  profileId: string;
  initialAvatarUrl?: string | null;
  displayName: string;
}

/**
 * Compresses an image file using client-side HTML Canvas down to <= 50KB JPEG/WebP.
 */
async function compressImageFile(file: File, maxDimension = 280, quality = 0.82): Promise<{ dataUrl: string; originalKb: number; compressedKb: number }> {
  const originalKb = Math.round(file.size / 1024);

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Failed to read image file."));
    reader.onload = (readerEvent) => {
      const img = new Image();
      img.onerror = () => reject(new Error("Invalid image format."));
      img.onload = () => {
        // Calculate square crop / fit
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          return reject(new Error("Failed to initialize canvas context."));
        }

        const size = Math.min(img.width, img.height);
        const startX = (img.width - size) / 2;
        const startY = (img.height - size) / 2;

        const outputSize = Math.min(size, maxDimension);
        canvas.width = outputSize;
        canvas.height = outputSize;

        // Smooth image downsampling
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";

        // Draw cropped center square
        ctx.drawImage(img, startX, startY, size, size, 0, 0, outputSize, outputSize);

        // Export as WebP if supported, fallback to JPEG
        let dataUrl = canvas.toDataURL("image/webp", quality);
        if (!dataUrl.startsWith("data:image/webp")) {
          dataUrl = canvas.toDataURL("image/jpeg", quality);
        }

        // Calculate approximate base64 payload size in KB
        const head = dataUrl.indexOf(",") + 1;
        const rawBytes = Math.round(((dataUrl.length - head) * 3) / 4);
        const compressedKb = Math.round(rawBytes / 1024);

        resolve({ dataUrl, originalKb, compressedKb });
      };
      img.src = readerEvent.target?.result as string;
    };
    reader.readAsDataURL(file);
  });
}

export function AvatarUploader({ profileId, initialAvatarUrl, displayName }: AvatarUploaderProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [avatarUrl, setAvatarUrl] = useState<string | null>(() => {
    if (initialAvatarUrl) return initialAvatarUrl;
    if (typeof window !== "undefined") {
      return localStorage.getItem(`orbitlms_avatar_${profileId}`);
    }
    return null;
  });
  const [compressStats, setCompressStats] = useState<{ originalKb: number; compressedKb: number } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");

  useEffect(() => {
    function handleUpdate(e: Event) {
      const customEvent = e as CustomEvent<{ avatarUrl: string | null }>;
      setAvatarUrl(customEvent.detail.avatarUrl);
    }
    window.addEventListener("orbitlms_avatar_updated", handleUpdate);
    return () => window.removeEventListener("orbitlms_avatar_updated", handleUpdate);
  }, []);

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setError("");
    setSuccess("");

    // Validate type
    if (!file.type.startsWith("image/")) {
      setError("Please choose a valid image file (PNG, JPG, WEBP).");
      return;
    }

    // Check size limit: max 5 MB original
    if (file.size > 5 * 1024 * 1024) {
      setError("Image file is too large. Please select an image under 5 MB.");
      return;
    }

    setLoading(true);
    try {
      // Auto compress to small KB image
      const { dataUrl, originalKb, compressedKb } = await compressImageFile(file, 280, 0.82);
      setCompressStats({ originalKb, compressedKb });

      // Store in localStorage for client display without inflating HTTP Cookie headers
      if (typeof window !== "undefined") {
        try {
          localStorage.setItem(`orbitlms_avatar_${profileId}`, dataUrl);
          window.dispatchEvent(new CustomEvent("orbitlms_avatar_updated", { detail: { avatarUrl: dataUrl } }));
        } catch (e) {
          console.warn("Could not save to localStorage:", e);
        }
      }

      // Explicitly keep Supabase auth user_metadata lean to prevent JWT cookie overflow (HTTP 431)
      const supabase = createClient();
      const { error: authError } = await supabase.auth.updateUser({
        data: { avatar_url: null, has_custom_avatar: true, avatar_updated_at: Date.now() },
      });

      if (authError) {
        console.warn("Could not sync auth metadata:", authError.message);
      }

      setAvatarUrl(dataUrl);
      setSuccess(`Profile picture updated (${compressedKb} KB optimized)!`);
      router.refresh();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to process image. Please try again.";
      setError(message);
    } finally {
      setLoading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }

  async function handleRemoveAvatar() {
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      const supabase = createClient();
      await supabase.auth.updateUser({
        data: { avatar_url: null },
      });

      try {
        await supabase.from("profiles").update({ avatar_url: null } as Record<string, unknown>).eq("id", profileId);
      } catch {
        // Ignore
      }

      if (typeof window !== "undefined") {
        localStorage.removeItem(`orbitlms_avatar_${profileId}`);
        window.dispatchEvent(new CustomEvent("orbitlms_avatar_updated", { detail: { avatarUrl: null } }));
      }

      setAvatarUrl(null);
      setCompressStats(null);
      setSuccess("Profile picture removed. Reverted to initials.");
      router.refresh();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Could not remove photo.";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="avatar-uploader-box">
      <div className="avatar-uploader-preview-wrap">
        <div className="avatar avatar-upload-preview">
          {avatarUrl ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img src={avatarUrl} alt={displayName} className="avatar-img" />
          ) : (
            <span className="avatar-initials">{getInitials(displayName)}</span>
          )}
        </div>
        <div className="avatar-uploader-meta">
          <div className="avatar-uploader-title">Profile Picture</div>
          <div className="avatar-uploader-sub">
            PNG, JPG, or WEBP. Automatically optimized to lightweight size for instant loading.
          </div>
          {compressStats && (
            <div className="avatar-compress-badge">
              <Icon name="check" size={13} />
              <span>Original: {compressStats.originalKb} KB &rarr; Optimized: <strong>{compressStats.compressedKb} KB</strong></span>
            </div>
          )}
        </div>
      </div>

      <div className="avatar-uploader-actions">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif"
          onChange={handleFileChange}
          style={{ display: "none" }}
          id="avatar-file-input"
          aria-label="Upload profile image"
        />

        <button
          type="button"
          className="btn btn-secondary btn-sm"
          onClick={() => fileInputRef.current?.click()}
          disabled={loading}
        >
          <Icon name="camera" size={14} />
          {loading ? "Processing..." : avatarUrl ? "Change photo" : "Upload photo"}
        </button>

        {avatarUrl && (
          <button
            type="button"
            className="btn btn-ghost btn-sm text-danger"
            onClick={handleRemoveAvatar}
            disabled={loading}
          >
            <Icon name="trash" size={14} />
            Remove
          </button>
        )}
      </div>

      {error && <div className="alert alert-error" style={{ marginTop: 12 }}>{error}</div>}
      {success && <div className="alert alert-success" style={{ marginTop: 12 }}>{success}</div>}
    </div>
  );
}
