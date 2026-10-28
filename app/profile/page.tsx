import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ProfileForm } from "@/components/profile-form";
import { AvatarUploader } from "@/components/avatar-uploader";
import { UserAvatar } from "@/components/user-avatar";
import { displayDate } from "@/lib/utils";
import { clampProgress, profileCompletion } from "@/lib/lms";
import { Icon } from "@/components/icon";
import type { Enrollment, Profile } from "@/lib/types";

export default async function ProfilePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login?next=/profile");

  const [{ data: profile }, { data: enrollments }] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
    supabase.from("enrollments").select("*, course:courses(*)").eq("user_id", user.id).order("enrolled_at", { ascending: false }),
  ]);

  const typed = profile as Profile | null;
  const typedEnrollments = (enrollments ?? []) as unknown as Enrollment[];
  const name = typed?.full_name || (user.user_metadata?.full_name as string | undefined) || user.email || "Student";
  const avatarUrl = typed?.avatar_url || (user.user_metadata?.avatar_url as string | undefined) || null;
  const completion = profileCompletion(typed);
  const completed = typedEnrollments.filter((item) => clampProgress(item.progress_percent) === 100).length;

  return (
    <main>
      <header className="page-head page-head-geometric">
        <div className="container">
          <span className="eyebrow">Student profile</span>
          <h1>Build a profile that reflects how you learn.</h1>
          <p>Your identity, account details and enrolled courses stay together in your private student workspace.</p>
        </div>
      </header>
      <div className="container profile-layout">
        <aside className="card profile-nav">
          <div className="profile-tab">Profile</div>
          <div className="profile-note">
            Only your authenticated account can read or update this profile. Course enrollment data is protected by the same student ownership rules.
          </div>
          <div className="profile-note">
            <strong style={{ color: "var(--ink)" }}>{completion}% complete</strong><br />
            Complete your name, username and bio to finish your learning identity.
          </div>
        </aside>
        <section className="profile-main">
          <div className="card profile-header profile-header-geometric">
            <UserAvatar
              userId={user.id}
              displayName={name}
              initialAvatarUrl={avatarUrl}
              className="avatar profile-avatar-lg"
              imgClassName="avatar-img"
            />
            <div>
              <div className="profile-badge-row">
                <span className="status-badge-verified">
                  <Icon name="check" size={11} /> Verified Account
                </span>
              </div>
              <h1>{name}</h1>
              <p>{user.email}</p>
            </div>
          </div>

          <section className="card profile-section" id="avatar-section" aria-labelledby="photo-heading">
            <h2 id="photo-heading">Profile picture</h2>
            <p>Upload a custom profile photo. Images are automatically compressed to lightweight KB size for instant loading.</p>
            <AvatarUploader
              profileId={user.id}
              initialAvatarUrl={avatarUrl}
              displayName={name}
            />
          </section>

          <section className="card profile-section" aria-labelledby="details-heading">
            <h2 id="details-heading">Profile details</h2>
            <p>These details are used across your student dashboard.</p>
            <ProfileForm
              profileId={user.id}
              initialName={typed?.full_name ?? ""}
              initialUsername={typed?.username ?? ""}
              initialPhone={typed?.phone_number ?? (user.user_metadata?.phone_number as string | undefined) ?? ""}
              initialBio={typed?.bio ?? ""}
            />
          </section>

          <section className="card profile-section" aria-labelledby="learning-heading">
            <div className="section-bar">
              <div>
                <h2 id="learning-heading">My enrolled courses</h2>
                <p>Your current learning library, with progress and the next place to continue.</p>
              </div>
              <span className="status-pill">{completed} completed</span>
            </div>
            {typedEnrollments.length ? (
              <div className="learning-list">
                {typedEnrollments.map((enrollment) => {
                  const progress = clampProgress(enrollment.progress_percent);
                  return (
                    <article className="learning-card" key={enrollment.id}>
                      <span className={`learning-card-accent ${enrollment.course.accent}`} aria-hidden="true" />
                      <div>
                        <h3>{enrollment.course.title}</h3>
                        <p>
                          {progress}% complete &middot;&nbsp;
                          {progress === 100 ? "Completed" : `Enrolled ${displayDate(enrollment.enrolled_at)}`}
                        </p>
                        <div className="progress-track" style={{ marginTop: 8 }}>
                          <div className="progress-fill" style={{ width: `${progress}%` }} />
                        </div>
                      </div>
                      <Link className="btn btn-secondary" href={`/courses/${enrollment.course.slug}`}>
                        {progress === 100 ? "Review" : "Continue"}
                      </Link>
                    </article>
                  );
                })}
              </div>
            ) : (
              <div className="empty">
                <strong>No courses enrolled yet.</strong>
                <span>Browse the catalog to build your learning library.</span>
                <div style={{ marginTop: 12 }}>
                  <Link className="btn btn-orange" href="/courses">Explore courses <Icon name="arrow" size={15} /></Link>
                </div>
              </div>
            )}
          </section>

          <section className="card profile-section">
            <h2>Account security</h2>
            <p>Password changes and account recovery are handled by Supabase Auth. Use the recovery flow whenever you need a secure password reset.</p>
            <Link className="btn btn-secondary" href="/auth/forgot-password">Reset password</Link>
          </section>
        </section>
      </div>
    </main>
  );
}
