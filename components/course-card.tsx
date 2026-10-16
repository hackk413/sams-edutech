import Link from "next/link";
import { Icon } from "@/components/icon";
import type { Course } from "@/lib/types";

export function CourseCard({ course, enrolled = false, featured = false }: { course: Course; enrolled?: boolean; featured?: boolean }) {
  return (
    <article className={`card course-card ${featured ? "featured-course" : ""}`}>
      <div className={`course-cover ${course.accent}`}>
        <div>
          <span className="course-kicker">{course.category}</span>
          <strong>{course.title}</strong>
        </div>
        <span className="level-pill">{course.level}</span>
      </div>
      <div className="course-card-body">
        <div className="course-card-topline">
          <span>{course.lessons_count} lessons</span>
          <span>{course.duration_hours}h</span>
          {enrolled && <span className="status-pill"><Icon name="check" size={13} /> Enrolled</span>}
        </div>
        <h3>{course.title}</h3>
        <p>{course.description}</p>
        <div className="course-highlights">
          {course.highlights.slice(0, 2).map((highlight) => <span key={highlight}>{highlight}</span>)}
        </div>
        <div className="card-actions">
          <Link href={`/courses/${course.slug}`} className="btn btn-secondary" style={{ flex: 1 }}>View course <Icon name="arrow" size={15} /></Link>
        </div>
      </div>
    </article>
  );
}
