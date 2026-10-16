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
              <div>
                <strong>One-click enrollment</strong>
                <span>Pick a course and add it to your library.</span>
              </div>
            </div>
            <div className="story-point">
              <span className="story-point-icon"><Icon name="grid" size={15} /></span>
              <div>
                <strong>A dashboard built for momentum</strong>
                <span>See what you are learning before anything else.</span>
              </div>
            </div>
            <div className="story-point">
              <span className="story-point-icon"><Icon name="shield" size={15} /></span>
              <div>
                <strong>Private student records</strong>
                <span>Your profile and enrollments are owner-scoped.</span>
              </div>
            </div>
          </div>
        </section>
        {children}
      </div>
    </main>
  );
}
