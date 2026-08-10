export function formatNavigationBadge(count: number): string | null {
  if (count <= 0) return null;
  return count > 99 ? "99+" : String(count);
}
