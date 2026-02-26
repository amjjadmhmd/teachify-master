/**
 * Image URL Utilities
 * Handles resolution of media URLs from Django backend
 */

// Get API base URL dynamically from Vite env/current origin.
// In dev we default to Vite proxy (same-origin) unless VITE_API_DIRECT=true.
export const getApiBaseUrl = (): string => {
  const rawApiUrl = (import.meta.env.VITE_API_URL || '').trim().replace(/\/+$/, '');
  const safeApiUrl = import.meta.env.DEV
    ? rawApiUrl.replace('://localhost', '://127.0.0.1')
    : rawApiUrl;
  const useDevProxy = import.meta.env.DEV && import.meta.env.VITE_API_DIRECT !== 'true';

  if (useDevProxy) {
    return typeof window !== 'undefined' ? window.location.origin : '';
  }

  if (safeApiUrl) {
    return safeApiUrl;
  }

  return typeof window !== 'undefined' ? window.location.origin : '';
};

const API_BASE_URL = getApiBaseUrl();

// Local SVG placeholder (no external dependency)
const PLACEHOLDER_IMAGE = 
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300'%3E%3Crect fill='%23e0e7ff' width='400' height='300'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='system-ui' font-size='18' fill='%236366f1'%3ENo Image%3C/text%3E%3C/svg%3E";

/**
 * Resolves image URL from various formats
 * @param thumbnail - The thumbnail URL from backend
 * @param placeholder - Optional custom placeholder URL
 * @returns Complete image URL
 */
export function resolveImageUrl(
  thumbnail: string | null | undefined,
  placeholder: string = PLACEHOLDER_IMAGE
): string {
  // Return placeholder if no thumbnail
  if (!thumbnail) {
    return placeholder;
  }

  // If already an absolute URL (http/https), use as-is
  if (thumbnail.startsWith("http")) {
    return thumbnail;
  }

  // If relative URL starting with /, construct full URL
  if (thumbnail.startsWith("/")) {
    return `${API_BASE_URL}${thumbnail}`;
  }

  // If relative URL without /, add slash and construct full URL
  return `${API_BASE_URL}/${thumbnail}`;
}

/**
 * Logs image loading errors for debugging
 * @param src - The image source that failed
 * @param courseTitle - Name of the course for context
 */
export function logImageError(src: string, courseTitle: string): void {
  console.error(
    `Failed to load image for course "${courseTitle}":`,
    src
  );
}

/**
 * Handles image load error and applies fallback
 * @param event - The error event from image element
 * @param fallbackUrl - URL to use as fallback
 * @param courseTitle - Course name for logging
 */
export function handleImageError(
  event: React.SyntheticEvent<HTMLImageElement>,
  fallbackUrl: string = PLACEHOLDER_IMAGE,
  courseTitle: string = "Unknown"
): void {
  const img = event.target as HTMLImageElement;
  logImageError(img.src, courseTitle);
  img.src = fallbackUrl;
}
