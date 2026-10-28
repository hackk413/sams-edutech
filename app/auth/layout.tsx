import type { ReactNode } from "react";
import { Icon } from "@/components/icon";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <main className="auth-wrap">
      <div className="auth-shell">
        <section className="auth-story">
          <span className="eyebrow"><Icon name="spark" size={13} /> Sams Edutech student space</span>
          <h2>Make every learning session count.</h2>
          <p>
            One account keeps your courses, progress and learning identity together, without
            adding an admin-heavy experience to the student journey.
          </p>
          <div className="story-points">
            <div className="story-point">
              <span className="story-point-icon"><Icon name="book" size={15} /></span>
              <div className="story-point-body">
                <strong className="story-point-heading">One-click enrollment</strong>
                <p className="story-point-desc">Pick a course and add it to your library.</p>
              </div>
            </div>
            <div className="story-point">
              <span className="story-point-icon"><Icon name="grid" size={15} /></span>
              <div className="story-point-body">
                <strong className="story-point-heading">A dashboard built for momentum</strong>
                <p className="story-point-desc">See what you are learning before anything else.</p>
              </div>
            </div>
            <div className="story-point">
              <span className="story-point-icon"><Icon name="shield" size={15} /></span>
              <div className="story-point-body">
                <strong className="story-point-heading">Private student records</strong>
                <p className="story-point-desc">Your profile and enrollments are owner-scoped.</p>
              </div>
            </div>
          </div>
        </section>
        {children}
      </div>
    </main>
  );
}
