import fs from "node:fs";
import path from "node:path";
import { COURSES } from "@/lib/courses";
import type { Course, CoursePricingConfig } from "@/lib/types";

const DATA_DIR = path.join(process.cwd(), "data");
const PRICING_FILE = path.join(DATA_DIR, "course-pricing.json");

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

/**
 * Loads dynamic pricing configuration from disk or returns default configuration
 */
export function getDynamicCoursePricing(): Record<string, CoursePricingConfig> {
  try {
    ensureDataDir();
    if (fs.existsSync(PRICING_FILE)) {
      const data = fs.readFileSync(PRICING_FILE, "utf-8");
      return JSON.parse(data);
    }
  } catch (err) {
    console.error("Error reading course pricing file:", err);
  }

  // Generate initial pricing defaults from COURSES
  const defaults: Record<string, CoursePricingConfig> = {};
  for (const c of COURSES) {
    const orig = c.original_price ?? 799;
    const finalPrice = c.price ?? 499;
    const discount = c.discount_percent ?? Math.round(((orig - finalPrice) / orig) * 100);
    defaults[c.slug] = {
      slug: c.slug,
      price: finalPrice,
      original_price: orig,
      discount_percent: discount,
      active: true,
      updated_at: new Date().toISOString(),
    };
  }

  try {
    ensureDataDir();
    fs.writeFileSync(PRICING_FILE, JSON.stringify(defaults, null, 2), "utf-8");
  } catch {
    // Ignore write failure in read-only environments
  }

  return defaults;
}

/**
 * Retrieves pricing for a specific course slug
 */
export function getCoursePriceConfig(slug: string): CoursePricingConfig {
  const all = getDynamicCoursePricing();
  if (all[slug]) return all[slug];

  const course = COURSES.find((c) => c.slug === slug);
  const orig = course?.original_price ?? 799;
  const price = course?.price ?? 499;
  const discount = course?.discount_percent ?? Math.round(((orig - price) / orig) * 100);

  return {
    slug,
    price,
    original_price: orig,
    discount_percent: discount,
    active: true,
    updated_at: new Date().toISOString(),
  };
}

/**
 * Updates course pricing dynamically without needing code redeployment
 */
export function updateCoursePricing(
  slug: string,
  updates: {
    price?: number;
    original_price?: number;
    discount_percent?: number;
    active?: boolean;
  }
): CoursePricingConfig {
  const current = getDynamicCoursePricing();
  const existing = current[slug] || getCoursePriceConfig(slug);

  const origPrice = typeof updates.original_price === "number" ? updates.original_price : existing.original_price;
  let finalPrice = typeof updates.price === "number" ? updates.price : existing.price;
  let discount = typeof updates.discount_percent === "number" ? updates.discount_percent : existing.discount_percent;

  // Auto-calculate final price if discount percentage was modified
  if (typeof updates.discount_percent === "number" && typeof updates.price !== "number") {
    finalPrice = Math.max(0, Math.round(origPrice * (1 - updates.discount_percent / 100)));
  } else if (typeof updates.price === "number" && typeof updates.discount_percent !== "number") {
    discount = Math.max(0, Math.min(100, Math.round(((origPrice - finalPrice) / origPrice) * 100)));
  }

  const updatedConfig: CoursePricingConfig = {
    ...existing,
    slug,
    price: finalPrice,
    original_price: origPrice,
    discount_percent: discount,
    active: updates.active !== undefined ? updates.active : existing.active,
    updated_at: new Date().toISOString(),
  };

  current[slug] = updatedConfig;

  try {
    ensureDataDir();
    fs.writeFileSync(PRICING_FILE, JSON.stringify(current, null, 2), "utf-8");
  } catch (err) {
    console.error("Error saving pricing config:", err);
  }

  return updatedConfig;
}

export function getAllCourses(): Course[] {
  const dynamicPricing = getDynamicCoursePricing();
  return COURSES.map((course) => {
    const pricing = dynamicPricing[course.slug];
    if (pricing && pricing.active) {
      return {
        ...course,
        price: pricing.price,
        original_price: pricing.original_price,
        discount_percent: pricing.discount_percent,
      };
    }
    return course;
  });
}
