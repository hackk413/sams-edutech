"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { validateIndianPhoneNumber } from "@/lib/utils";

const usernamePattern = /^[a-zA-Z0-9_.-]{3,30}$/;

export function ProfileForm({
  profileId,
  initialName,
  initialUsername,
  initialPhone,
  initialBio,
}: {
  profileId: string;
  initialName: string;
  initialUsername: string;
  initialPhone?: string;
  initialBio: string;
}) {
  const router = useRouter();
  const [fullName, setFullName] = useState(initialName);
  const [username, setUsername] = useState(initialUsername);
  const [phoneNumber, setPhoneNumber] = useState(initialPhone || "");
  const [bio, setBio] = useState(initialBio);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError("");
    setSuccess("");
    const normalizedName = fullName.trim();
    const normalizedUsername = username.trim();
    const normalizedBio = bio.trim();
    if (normalizedName.length < 2) return setError("Please enter a valid full name.");
    if (normalizedUsername && !usernamePattern.test(normalizedUsername))
      return setError("Username must be 3 to 30 characters using letters, numbers, dot, dash or underscore.");

    let normalizedPhone: string | null = null;
    if (phoneNumber && phoneNumber.trim()) {
      const phoneCheck = validateIndianPhoneNumber(phoneNumber);
      if (!phoneCheck.isValid) {
        return setError(phoneCheck.error || "Please enter a valid 10-digit Indian mobile number (+91).");
      }
      normalizedPhone = phoneCheck.normalized;
    }

    if (normalizedBio.length > 400) return setError("Bio must be 400 characters or fewer.");

    setLoading(true);
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: normalizedName,
          username: normalizedUsername || null,
          phone_number: normalizedPhone,
          bio: normalizedBio || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", profileId);
      if (error) {
        setError(
          error.code === "23505"
            ? "That username is already in use."
            : "Could not save your profile. Please try again."
        );
        return;
      }
      setSuccess("Profile saved successfully.");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} noValidate>
      <div className="form-grid">
        <div className="field">
          <label htmlFor="profile-name">Full name</label>
          <input
            id="profile-name"
            value={fullName}
            onChange={(event) => setFullName(event.target.value)}
            maxLength={80}
            required
          />
        </div>
        <div className="field">
          <label htmlFor="profile-username">Username</label>
          <input
            id="profile-username"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            maxLength={30}
            placeholder="e.g. alex.dev"
            autoCapitalize="none"
          />
        </div>
        <div className="field">
          <label htmlFor="profile-phone">Mobile Number (Indian +91)</label>
          <input
            id="profile-phone"
            type="tel"
            autoComplete="tel"
            inputMode="tel"
            value={phoneNumber}
            onChange={(event) => setPhoneNumber(event.target.value)}
            placeholder="+91 98765 43210"
          />
          <span style={{ color: "var(--muted)", fontSize: "0.72rem" }}>
            Accepts 10-digit Indian mobile number (+91).
          </span>
        </div>
        <div className="field full">
          <label htmlFor="profile-bio">Bio</label>
          <textarea
            id="profile-bio"
            value={bio}
            onChange={(event) => setBio(event.target.value)}
            maxLength={400}
            placeholder="Tell us a little about your learning goals."
          />
          <span style={{ color: "var(--muted)", fontSize: "0.72rem", textAlign: "right" }}>
            {bio.length}/400
          </span>
        </div>
      </div>
      {error && <div className="form-error" role="alert" style={{ marginTop: 14 }}>{error}</div>}
      {success && <div className="form-success" role="status" style={{ marginTop: 14 }}>{success}</div>}
      <div className="form-actions">
        <button className="btn btn-primary" type="submit" disabled={loading}>
          {loading ? "Saving..." : "Save changes"}
        </button>
      </div>
    </form>
  );
}
