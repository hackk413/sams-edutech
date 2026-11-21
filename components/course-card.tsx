import Link from "next/link";
import { Icon } from "@/components/icon";
import type { Course } from "@/lib/types";

export function CourseCard({ course, enrolled = false, featured = false }: { course: Course; enrolled?: boolean; featured?: boolean }) {
  const isCloud = course.slug === "fullstack-web-cloud-development";
  const is3Month = course.slug === "fullstack-web-development-accelerator";
  const finalPrice = course.price ?? (is3Month ? 19999 : isCloud ? 26000 : 23999);
  const originalPrice = course.original_price ?? (is3Month ? 24000 : isCloud ? 30000 : 28000);
  const discount = course.discount_percent ?? Math.round(((originalPrice - finalPrice) / originalPrice) * 100);

  return (
    <article className={`card course-card ${featured ? "featured-course" : ""}`}>
      <div className={`course-cover ${course.accent}`}>
        <div className="course-cover-headings">
          <span className="course-kicker">{course.category}</span>
          <strong className="course-cover-title">{course.title}</strong>
        </div>
        <div className="course-cover-pills">
          <span className="plan-pill">{course.duration_months ?? (is3Month ? 3 : 4)} Months Plan</span>
          <span className="level-pill">{course.level}</span>
        </div>
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
        <div className="course-pricing-row">
          <div className="course-price-wrap">
            <span className="course-price-current">₹{finalPrice.toLocaleString("en-IN")}</span>
            {originalPrice > finalPrice && (
              <span className="course-price-orig">₹{originalPrice.toLocaleString("en-IN")}</span>
            )}
          </div>
          {discount > 0 && (
            <span className="discount-pill">{discount}% OFF</span>
          )}
        </div>
        <div className="card-actions">
          <Link href={`/courses/${course.slug}`} className="btn btn-secondary" style={{ flex: 1 }}>View course <Icon name="arrow" size={15} /></Link>
        </div>
      </div>
    </article>
  );
}
