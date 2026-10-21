"use client";

import { useMemo, useState } from "react";
import type { Course } from "@/lib/types";
import { CourseCard } from "@/components/course-card";
import { HorizontalCourseTrack } from "@/components/horizontal-course-track";
import { Icon } from "@/components/icon";

const levels = ["All levels", "Beginner", "Intermediate", "Advanced"];

export function CourseCatalog({ courses, enrolledIds }: { courses: Course[]; enrolledIds: string[] }) {
  const [query, setQuery] = useState("");
  const [level, setLevel] = useState("All levels");
  const [category, setCategory] = useState("All categories");
  const [viewMode, setViewMode] = useState<"horizontal" | "grid">("horizontal");
  const enrolled = useMemo(() => new Set(enrolledIds), [enrolledIds]);
  const categories = useMemo(
    () => ["All categories", ...Array.from(new Set(courses.map((course) => course.category)))],
    [courses]
  );

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return courses.filter((course) => {
      const haystack = `${course.title} ${course.description} ${course.category}`.toLowerCase();
      const matchesQuery = !normalized || haystack.includes(normalized);
      const matchesLevel = level === "All levels" || course.level === level;
      const matchesCategory = category === "All categories" || course.category === category;
      return matchesQuery && matchesLevel && matchesCategory;
    });
  }, [category, courses, level, query]);

  return (
    <>
      <div className="catalog-toolbar card" role="search" aria-label="Course catalog filters">
        <div className="search-field">
          <Icon name="search" size={18} />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search courses, skills or topics"
            aria-label="Search courses"
          />
        </div>
        <label className="select-field">
          <span className="sr-only">Level</span>
          <select value={level} onChange={(event) => setLevel(event.target.value)}>
            {levels.map((item) => <option key={item}>{item}</option>)}
          </select>
        </label>
        <label className="select-field">
          <span className="sr-only">Category</span>
          <select value={category} onChange={(event) => setCategory(event.target.value)}>
            {categories.map((item) => <option key={item}>{item}</option>)}
          </select>
        </label>
      </div>

      <div className="catalog-summary">
        <div>
          <strong>{filtered.length}</strong> course{filtered.length === 1 ? "" : "s"} available &middot; <span className="catalog-summary-muted">Self-paced &middot; Enroll free</span>
        </div>
        <div className="view-mode-toggle" aria-label="View layout switcher">
          <button
            type="button"
            className={`view-toggle-btn ${viewMode === "horizontal" ? "active" : ""}`}
            onClick={() => setViewMode("horizontal")}
            title="Horizontal scroll view (Recommended)"
          >
            <span>↔ Horizontal Track</span>
          </button>
          <button
            type="button"
            className={`view-toggle-btn ${viewMode === "grid" ? "active" : ""}`}
            onClick={() => setViewMode("grid")}
            title="Grid view"
          >
            <span>☷ Grid</span>
          </button>
        </div>
      </div>

      {filtered.length ? (
        viewMode === "horizontal" ? (
          <HorizontalCourseTrack
            courses={filtered}
            enrolledIds={enrolled}
            className="catalog-horizontal-section"
          />
        ) : (
          <div className="card-grid">
            {filtered.map((course) => (
              <CourseCard key={course.id} course={course} enrolled={enrolled.has(course.id)} />
            ))}
          </div>
        )
      ) : (
        <div className="card empty-state">
          <div className="empty-icon"><Icon name="search" size={22} /></div>
          <strong>No courses match those filters</strong>
          <span>Try another topic, level or category. Your filters stay local to this page.</span>
          <button
            className="btn btn-secondary"
            type="button"
            onClick={() => { setQuery(""); setLevel("All levels"); setCategory("All categories"); }}
          >
            Clear filters
          </button>
        </div>
      )}
    </>
  );
}
