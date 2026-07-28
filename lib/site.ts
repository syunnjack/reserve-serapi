export const SITE_NAME = "セラピ予約";
export const SITE_DESCRIPTION =
  "セラピストの出勤状況をリアルタイムで確認しながら予約できる、スマホ完結の予約管理PWAです。";

const FALLBACK_BASE_URL = "http://localhost:3000";

export function resolveBaseUrl(): string {
  const url = process.env.NEXT_PUBLIC_SITE_URL;
  if (!url) return FALLBACK_BASE_URL;
  try {
    new URL(url);
    return url;
  } catch {
    return FALLBACK_BASE_URL;
  }
}
