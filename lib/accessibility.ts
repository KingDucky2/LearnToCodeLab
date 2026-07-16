export type TabNavigationKey = "ArrowLeft" | "ArrowRight" | "Home" | "End";

export function getNextTabIndex(currentIndex: number, key: TabNavigationKey, count: number) {
  if (count <= 0) return -1;
  if (key === "Home") return 0;
  if (key === "End") return count - 1;
  if (key === "ArrowLeft") return (currentIndex - 1 + count) % count;
  return (currentIndex + 1) % count;
}
