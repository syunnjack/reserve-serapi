import Link from "next/link";
import { headers } from "next/headers";
import { listShops } from "@/lib/data";
import { getLandingConfig } from "@/lib/landing";
import { SITE_NAME } from "@/lib/site";

export const dynamic = "force-dynamic";

export default async function Home() {
  const headerList = await headers();
  const landing = getLandingConfig(headerList.get("host"));
  const shops = await listShops();

  return (
    <div className="mx-auto max-w-3xl px-4 py-16">
      <p className="text-sm font-bold text-blue-600">{SITE_NAME}</p>
      <h1 className="mt-2 text-3xl font-bold text-slate-900">{landing.heroTitle}</h1>
      <p className="mt-3 text-lg text-slate-600">{landing.heroLead}</p>

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <div className={`rounded-lg border p-4 ${landing.persona === "customer" ? "border-blue-400 bg-blue-50" : "border-slate-200"}`}>
          <p className="font-bold text-slate-900">お客さん</p>
          <p className="mt-1 text-sm text-slate-600">出勤中のセラピストと空き時間を見ながら、その場で予約。LINEで予約確定・前日リマインドが届きます。</p>
        </div>
        <div className={`rounded-lg border p-4 ${landing.persona === "business" ? "border-blue-400 bg-blue-50" : "border-slate-200"}`}>
          <p className="font-bold text-slate-900">オーナー</p>
          <p className="mt-1 text-sm text-slate-600">セラピストの出勤表・メニュー・予約状況をまとめて管理できます。</p>
        </div>
        <div className={`rounded-lg border p-4 ${landing.persona === "business" ? "border-blue-400 bg-blue-50" : "border-slate-200"}`}>
          <p className="font-bold text-slate-900">セラピスト</p>
          <p className="mt-1 text-sm text-slate-600">スマホから自分の出勤予定を登録し、担当予約を確認できます。</p>
        </div>
      </div>

      <div className="mt-8 flex gap-4">
        <Link href={landing.primaryCtaHref} className="rounded bg-blue-600 px-6 py-3 font-bold text-white">
          {landing.primaryCtaLabel}
        </Link>
        <Link href="/login" className="rounded border border-slate-300 px-6 py-3 font-bold text-slate-700">
          ログイン
        </Link>
      </div>

      <section className="mt-10">
        <h2 className="text-lg font-bold text-slate-900">掲載店舗</h2>
        <ul className="mt-3 grid gap-3 sm:grid-cols-2">
          {shops.map((shop) => (
            <li key={shop.id} className="rounded-lg border border-slate-200 p-4">
              <Link href={`/shops/${shop.slug}`} className="font-bold text-slate-900">
                {shop.name}
              </Link>
              {shop.description && <p className="mt-1 text-sm text-slate-600">{shop.description}</p>}
            </li>
          ))}
          {shops.length === 0 && <p className="text-sm text-slate-500">まだ掲載店舗がありません。</p>}
        </ul>
      </section>
    </div>
  );
}
