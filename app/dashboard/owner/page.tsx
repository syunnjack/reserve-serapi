import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getShopByOwner, getServices, getTherapists, getUpcomingShifts, getShopReservations } from "@/lib/data";
import {
  createShopAction,
  createServiceAction,
  inviteTherapistAction,
  setLineTokenAction,
  setShiftAction,
  removeShiftAction,
} from "@/app/actions/owner";
import { signOut } from "@/app/actions/auth";

function nextSevenDays(): string[] {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(Date.now() + i * 24 * 60 * 60 * 1000);
    return d.toISOString().slice(0, 10);
  });
}

export default async function OwnerDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const shop = await getShopByOwner(user.id);

  if (!shop) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16">
        <h1 className="text-2xl font-bold text-slate-900">お店を開設する</h1>
        {error && <p className="mt-3 rounded bg-red-50 p-3 text-sm text-red-700">{error}</p>}
        <form action={createShopAction} className="mt-6 space-y-4">
          <label className="block text-sm">
            店舗名
            <input name="name" required className="mt-1 w-full rounded border border-slate-300 px-3 py-2" />
          </label>
          <label className="block text-sm">
            紹介文
            <textarea name="description" rows={3} className="mt-1 w-full rounded border border-slate-300 px-3 py-2" />
          </label>
          <label className="block text-sm">
            住所
            <input name="address" className="mt-1 w-full rounded border border-slate-300 px-3 py-2" />
          </label>
          <label className="block text-sm">
            電話番号
            <input name="phone" className="mt-1 w-full rounded border border-slate-300 px-3 py-2" />
          </label>
          <button type="submit" className="w-full rounded bg-blue-600 py-2 font-bold text-white">
            開設する
          </button>
        </form>
      </div>
    );
  }

  const [services, therapists, shifts, reservations] = await Promise.all([
    getServices(shop.id),
    getTherapists(shop.id),
    getUpcomingShifts(shop.id),
    getShopReservations(shop.id),
  ]);

  const days = nextSevenDays();
  const boundCreateService = createServiceAction.bind(null, shop.id);
  const boundInviteTherapist = inviteTherapistAction.bind(null, shop.id);
  const boundSetLineToken = setLineTokenAction.bind(null, shop.id);

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-slate-500">オーナーダッシュボード</p>
          <h1 className="text-2xl font-bold text-slate-900">{shop.name}</h1>
          <a href={`/shops/${shop.slug}`} className="text-sm text-blue-600">
            店舗ページを見る: /shops/{shop.slug}
          </a>
        </div>
        <form action={signOut}>
          <button type="submit" className="text-sm text-slate-500 underline">
            ログアウト
          </button>
        </form>
      </div>

      <section className="mt-10">
        <h2 className="text-lg font-bold text-slate-900">向こう7日間の出勤表</h2>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[600px] border-collapse text-sm">
            <thead>
              <tr>
                <th className="border-b p-2 text-left">セラピスト</th>
                {days.map((day) => (
                  <th key={day} className="border-b p-2 text-center">
                    {day.slice(5)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {therapists.map((therapist) => (
                <tr key={therapist.id}>
                  <td className="border-b p-2 font-bold text-slate-900">{therapist.display_name || therapist.email}</td>
                  {days.map((day) => {
                    const shift = shifts.find((s) => s.therapist_id === therapist.id && s.shift_date === day);
                    return (
                      <td key={day} className="border-b p-2 text-center">
                        <form action={setShiftAction.bind(null, shop.id, therapist.id)} className="flex flex-col gap-1">
                          <input type="hidden" name="shiftDate" value={day} />
                          <input
                            type="time"
                            name="startTime"
                            defaultValue={shift?.start_time?.slice(0, 5) ?? ""}
                            className="w-20 rounded border border-slate-300 px-1 py-0.5 text-xs"
                          />
                          <input
                            type="time"
                            name="endTime"
                            defaultValue={shift?.end_time?.slice(0, 5) ?? ""}
                            className="w-20 rounded border border-slate-300 px-1 py-0.5 text-xs"
                          />
                          <button type="submit" className="text-xs text-blue-600">
                            保存
                          </button>
                        </form>
                        {shift && (
                          <form action={removeShiftAction.bind(null, therapist.id, day)}>
                            <button type="submit" className="mt-1 text-xs text-red-500">
                              削除
                            </button>
                          </form>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-10">
        <h2 className="text-lg font-bold text-slate-900">メニュー管理</h2>
        <ul className="mt-3 space-y-2">
          {services.map((service) => (
            <li key={service.id} className="rounded border border-slate-200 p-3">
              <p className="font-bold text-slate-900">{service.name}</p>
              <p className="text-sm text-slate-500">
                {service.duration_minutes}分 / {service.price.toLocaleString()}円
              </p>
            </li>
          ))}
        </ul>
        <form action={boundCreateService} className="mt-4 grid gap-2 rounded border border-slate-200 p-4 sm:grid-cols-2">
          <input name="name" placeholder="メニュー名" required className="rounded border border-slate-300 px-3 py-2 sm:col-span-2" />
          <input name="durationMinutes" type="number" placeholder="所要時間(分)" defaultValue={60} required className="rounded border border-slate-300 px-3 py-2" />
          <input name="price" type="number" placeholder="料金(円)" defaultValue={0} required className="rounded border border-slate-300 px-3 py-2" />
          <button type="submit" className="rounded bg-blue-600 py-2 font-bold text-white sm:col-span-2">
            メニューを追加
          </button>
        </form>
      </section>

      <section className="mt-10">
        <h2 className="text-lg font-bold text-slate-900">セラピスト管理</h2>
        <ul className="mt-3 space-y-2">
          {therapists.map((therapist) => (
            <li key={therapist.id} className="rounded border border-slate-200 p-3">
              <p className="font-bold text-slate-900">{therapist.display_name || therapist.email}</p>
              <p className="text-sm text-slate-500">
                {therapist.email} / {therapist.user_id ? "登録済み" : "招待中(未ログイン)"}
              </p>
            </li>
          ))}
        </ul>
        <form action={boundInviteTherapist} className="mt-4 grid gap-2 rounded border border-slate-200 p-4 sm:grid-cols-2">
          <input name="email" type="email" placeholder="セラピストのメールアドレス" required className="rounded border border-slate-300 px-3 py-2" />
          <input name="displayName" placeholder="表示名" className="rounded border border-slate-300 px-3 py-2" />
          <textarea name="bio" placeholder="紹介文" className="rounded border border-slate-300 px-3 py-2 sm:col-span-2" />
          <button type="submit" className="rounded bg-blue-600 py-2 font-bold text-white sm:col-span-2">
            招待する
          </button>
        </form>
      </section>

      <section className="mt-10">
        <h2 className="text-lg font-bold text-slate-900">LINE通知設定</h2>
        <p className="mt-1 text-sm text-slate-500">
          LINE Developersで発行したMessaging APIの「チャネルアクセストークン」を設定してください。
        </p>
        <form action={boundSetLineToken} className="mt-3 flex gap-2">
          <input
            name="lineToken"
            defaultValue={shop.line_channel_access_token ?? ""}
            placeholder="チャネルアクセストークン"
            className="flex-1 rounded border border-slate-300 px-3 py-2 text-sm"
          />
          <button type="submit" className="rounded bg-blue-600 px-4 py-2 text-sm font-bold text-white">
            保存
          </button>
        </form>
      </section>

      <section className="mt-10">
        <h2 className="text-lg font-bold text-slate-900">予約一覧</h2>
        <ul className="mt-3 space-y-2">
          {reservations.map((reservation: any) => (
            <li key={reservation.id} className="rounded border border-slate-200 p-3">
              <p className="font-bold text-slate-900">
                {new Date(reservation.start_at).toLocaleString("ja-JP")} - {reservation.service?.name}
              </p>
              <p className="text-sm text-slate-500">
                お客様: {reservation.customer?.full_name || reservation.customer?.email} / 担当:{" "}
                {reservation.therapist?.display_name} / 状態: {reservation.status}
              </p>
            </li>
          ))}
          {reservations.length === 0 && <p className="text-sm text-slate-500">まだ予約がありません。</p>}
        </ul>
      </section>
    </div>
  );
}
