"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { CourseCard } from "@/components/course-card";
import { Icon } from "@/components/icon";
import type { Course } from "@/lib/types";

interface HorizontalCourseTrackProps {
  courses: Course[];
  enrolledIds?: string[] | Set<string>;
  featuredId?: string;
  title?: string;
  subtitle?: string;
  eyebrow?: string;
  viewAllHref?: string;
  viewAllLabel?: string;
  className?: string;
}

export function HorizontalCourseTrack({
  courses,
  enrolledIds,
  featuredId,
  title,
  subtitle,
  eyebrow,
  viewAllHref,
  viewAllLabel = "View All Programs",
  className = "",
}: HorizontalCourseTrackProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const enrolledSet = enrolledIds instanceof Set ? enrolledIds : new Set(enrolledIds || []);

  const checkScrollState = useCallback(() => {
    const el = trackRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    setCanScrollLeft(scrollLeft > 8);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 8);
  }, []);

  useEffect(() => {
    checkScrollState();
    const el = trackRef.current;
    if (!el) return;
    el.addEventListener("scroll", checkScrollState, { passive: true });
    window.addEventListener("resize", checkScrollState);
    return () => {
      el.removeEventListener("scroll", checkScrollState);
      window.removeEventListener("resize", checkScrollState);
    };
  }, [checkScrollState, courses]);

  const scroll = (direction: "left" | "right") => {
    const el = trackRef.current;
    if (!el) return;
    const scrollAmount = Math.max(el.clientWidth * 0.75, 320);
    el.scrollBy({
      left: direction === "left" ? -scrollAmount : scrollAmount,
      behavior: "smooth",
    });
  };

  if (!courses || courses.length === 0) {
    return null;
  }

  return (
    <div className={`horizontal-course-section ${className}`}>
      {(title || eyebrow || viewAllHref) && (
        <div className="horizontal-course-header">
          <div className="horizontal-course-header-text">
            {eyebrow && <span className="sec-eyebrow">{eyebrow}</span>}
            {title && <h2 className="section-title">{title}</h2>}
            {subtitle && <p className="section-copy">{subtitle}</p>}
          </div>

          <div className="horizontal-course-nav-group">
            {viewAllHref && (
              <Link href={viewAllHref} className="btn btn-secondary btn-sm desktop-only">
                {viewAllLabel} <Icon name="arrow" size={14} />
              </Link>
            )}
            <div className="horizontal-scroll-controls" aria-label="Course carousel controls">
              <button
                type="button"
                className="horizontal-scroll-btn"
                onClick={() => scroll("left")}
                disabled={!canScrollLeft}
                aria-label="Scroll left through courses"
                title="Previous courses"
              >
                <Icon name="arrow" size={16} style={{ transform: "rotate(180deg)" }} />
              </button>
              <button
                type="button"
                className="horizontal-scroll-btn"
                onClick={() => scroll("right")}
                disabled={!canScrollRight}
                aria-label="Scroll right through courses"
                title="Next courses"
              >
                <Icon name="arrow" size={16} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── HORIZONTAL SCROLL TRACK ── */}
      <div className="horizontal-track-wrapper">
        <div
          ref={trackRef}
          className="horizontal-course-track"
          role="region"
          aria-label="Courses horizontal carousel"
          tabIndex={0}
        >
          {courses.map((course) => (
            <div key={course.id} className="horizontal-course-item">
              <CourseCard
                course={course}
                enrolled={enrolledSet.has(course.id) || enrolledSet.has(course.slug)}
                featured={course.id === featuredId}
              />
            </div>
          ))}
        </div>

        {/* Right fade gradient hint when more cards are available */}
        <div
          className={`horizontal-fade-right ${canScrollRight ? "visible" : ""}`}
          aria-hidden="true"
        />
        {/* Left fade gradient hint */}
        <div
          className={`horizontal-fade-left ${canScrollLeft ? "visible" : ""}`}
          aria-hidden="true"
        />
      </div>

      <div className="horizontal-track-hint">
        <span>
          Showing {courses.length} specialized career tracks &middot; Swipe horizontally or use navigation arrows
        </span>
        {viewAllHref && (
          <Link href={viewAllHref} className="btn-link mobile-only">
            {viewAllLabel} &rarr;
          </Link>
        )}
      </div>
    </div>
  );
}
