import { useTranslation } from "react-i18next";

export function formatUsedAt(
  usedAt: number,
  t: ReturnType<typeof useTranslation>["t"]
): string {
  const seconds = Math.floor((Date.now() - usedAt) / 1000);
  if (seconds < 60) return t("common.usedJustNow");

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) {
    return t("common.usedMinutesAgo", { count: minutes });
  }

  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return t("common.usedHoursAgo", { count: hours });
  }

  const days = Math.floor(hours / 24);
  if (days < 7) {
    return t("common.usedDaysAgo", { count: days });
  }

  const weeks = Math.floor(days / 7);
  if (weeks < 5) {
    return t("common.usedWeeksAgo", { count: weeks });
  }

  const months = Math.max(1, Math.floor(days / 30));
  return t("common.usedMonthsAgo", { count: months });
}
