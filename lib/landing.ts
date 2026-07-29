export type LandingPersona = "customer" | "business" | "general";

interface LandingConfig {
  persona: LandingPersona;
  heroTitle: string;
  heroLead: string;
  primaryCtaLabel: string;
  primaryCtaHref: string;
}

const HOST_PERSONA_MAP: Record<string, LandingConfig> = {
  "ima-serapi.jp": {
    persona: "customer",
    heroTitle: "今すぐ空いてるセラピストを見つけて予約",
    heroLead: "出勤中のセラピストと空き時間をその場で確認。予約したらLINEに確定連絡が届きます。",
    primaryCtaLabel: "今すぐ予約する",
    primaryCtaHref: "/signup",
  },
  "shukkin-yoyaku.jp": {
    persona: "business",
    heroTitle: "出勤管理と予約をまとめて、お店の手間をなくす",
    heroLead: "セラピストの出勤登録、メニュー管理、予約受付をひとつのダッシュボードで。スマホだけで運用できます。",
    primaryCtaLabel: "お店を開設する",
    primaryCtaHref: "/signup",
  },
};

const DEFAULT_LANDING: LandingConfig = {
  persona: "general",
  heroTitle: "出勤状況を見ながら、その場で予約できる",
  heroLead: "お客さん・オーナー・セラピスト、それぞれに合わせた画面で使える予約管理システムです。",
  primaryCtaLabel: "無料で始める",
  primaryCtaHref: "/signup",
};

export function getLandingConfig(host: string | null): LandingConfig {
  const normalizedHost = (host ?? "").replace(/^www\./, "").split(":")[0];
  return HOST_PERSONA_MAP[normalizedHost] ?? DEFAULT_LANDING;
}
