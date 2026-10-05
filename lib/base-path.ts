// Prefix for assets when the site is served from a sub-path (e.g. GitHub Pages /web).
// Empty in local dev/production, so nothing changes there.
export const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? '';

export function withBase(src: string): string {
  return src.startsWith('/') && !src.startsWith('//') ? `${BASE_PATH}${src}` : src;
}
