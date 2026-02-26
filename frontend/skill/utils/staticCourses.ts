import { Course } from "../types";

export const STATIC_COURSES_STORAGE_KEY = "geotop_static_courses_v1";

export type StaticCourse = Course & {
  static_source?: "landing" | "instructor";
  instructor_name?: string;
  instructor_image_url?: string;
  level_label?: string;
  course_language?: string;
  duration_label?: string;
  rating_value?: number;
  enrolled_students?: number;
  price_live?: string | number;
  price_offline?: string | number;
  price_recorded?: string | number;
  last_updated?: string;
  requirements?: string[];
  outcomes?: string[];
};

const isBrowser = () => typeof window !== "undefined";

const sanitizeCourses = (raw: unknown): StaticCourse[] => {
  if (!Array.isArray(raw)) return [];

  return raw
    .filter(
      (course: any) =>
        course &&
        typeof course === "object" &&
        typeof course.id === "number" &&
        typeof course.title === "string"
    )
    .map((course: any) => ({
      ...course,
      is_enrolled: true,
      lessons: Array.isArray(course.lessons) ? course.lessons : [],
      resources: Array.isArray(course.resources) ? course.resources : [],
      static_source: course.static_source || "instructor",
    }));
};

export const getStaticCourses = (): StaticCourse[] => {
  if (!isBrowser()) return [];

  try {
    const raw = window.localStorage.getItem(STATIC_COURSES_STORAGE_KEY);
    if (!raw) return [];
    return sanitizeCourses(JSON.parse(raw));
  } catch (error) {
    console.error("Failed to parse static courses:", error);
    return [];
  }
};

export const saveStaticCourses = (courses: StaticCourse[]): void => {
  if (!isBrowser()) return;

  try {
    window.localStorage.setItem(
      STATIC_COURSES_STORAGE_KEY,
      JSON.stringify(sanitizeCourses(courses))
    );
  } catch (error) {
    console.error("Failed to save static courses:", error);
  }
};

export const upsertStaticCourse = (course: StaticCourse): StaticCourse[] => {
  const existing = getStaticCourses();
  const next = [
    course,
    ...existing.filter((storedCourse) => storedCourse.id !== course.id),
  ];
  saveStaticCourses(next);
  return next;
};

export const nextStaticCourseId = (): number =>
  Date.now() + Math.floor(Math.random() * 1000);

export const isStaticCourse = (
  course?: Partial<StaticCourse> | null
): course is StaticCourse => {
  if (!course) return false;
  return Boolean(
    (course as any).static_source ||
      (typeof course.id === "number" && course.id >= 900000)
  );
};
