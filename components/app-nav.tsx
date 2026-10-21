import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { LogoutButton } from "@/components/logout-button";
import { Icon } from "@/components/icon";
import { ThemeToggle } from "@/components/theme-toggle";
import { UserAvatar } from "@/components/user-avatar";

import { BrandLogo } from "@/components/brand-logo";

export async function AppNav() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const name = (user?.user_metadata?.full_name as string | undefined) || user?.email || "Student";
  const avatarUrl = (user?.user_metadata?.avatar_url as string | undefined) || null;

  return (
    <header className="topbar">
      <div className="container nav">
        <BrandLogo href={user ? "/dashboard" : "/"} size="normal" />

        <nav className="nav-links desktop-nav" aria-label="Main navigation">
          {user && (
            <Link className="nav-link" href="/dashboard">
              <Icon name="grid" size={16} />Dashboard
            </Link>
          )}
          {user && (
            <Link className="nav-link" href="/dashboard?tab=assessments">
              <Icon name="target" size={16} />Weekly Assessments
            </Link>
          )}
          <Link className="nav-link" href="/courses">
            <Icon name="book" size={16} />Programs
          </Link>
          {user && (
            <Link className="nav-link" href="/profile">
              <Icon name="user" size={16} />Profile
            </Link>
          )}
          <Link className="nav-link nav-link-admin" href="/admin" title="Admin Command Center">
            <Icon name="shield" size={15} />Admin
          </Link>
        </nav>

        <div className="nav-actions">
          <ThemeToggle />
          {user ? (
            <>
              <Link className="profile-chip" href="/profile" aria-label="Open your profile">
                <UserAvatar
                  userId={user.id}
                  displayName={name}
                  initialAvatarUrl={avatarUrl}
                  className="mini-avatar"
                  imgClassName="mini-avatar-img"
                />
                <span className="desktop-only">{name.split(" ")[0]}</span>
              </Link>
              <LogoutButton />
            </>
          ) : (
            <>
              <Link className="btn btn-ghost desktop-only" href="/auth/login">Sign in</Link>
              <Link className="btn btn-orange nav-cta-btn" href="/auth/register">
                <span className="desktop-cta-text">Start Learning</span>
                <span className="mobile-cta-text">Enroll</span>
                <Icon name="arrow" size={14} />
              </Link>
            </>
          )}
          <details className="mobile-menu">
            <summary aria-label="Open navigation"><Icon name="menu" size={20} /></summary>
            <div className="mobile-menu-panel">
              {user && <Link href="/dashboard"><Icon name="grid" size={16} />Dashboard</Link>}
              {user && <Link href="/dashboard?tab=assessments"><Icon name="target" size={16} />Weekly Assessments</Link>}
              <Link href="/courses"><Icon name="book" size={16} />Programs</Link>
              {user && <Link href="/profile"><Icon name="user" size={16} />Profile</Link>}
              <Link href="/admin"><Icon name="shield" size={16} />Admin Command Center</Link>
              {!user && <Link href="/auth/login"><Icon name="lock" size={16} />Sign in</Link>}
            </div>
          </details>
        </div>
      </div>
    </header>
  );
}
