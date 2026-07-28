import { redirect } from "next/navigation";
import { getCurrentUser, getCurrentProfile } from "@/lib/auth";
import { getCustomerReservations } from "@/lib/data";
import { signOut } from "@/app/actions/auth";
import { cancelReservationAction } from "@/app/actions/customer";

export default async function CustomerDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ line?: string }>;
}) {
  const { line } = await searchParams;
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const [profile, reservations] = await Promise.all([getCurrentProfile(), getCustomerReservations(user.id)]);

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-slate-500">マイページ</p>
          <h1 className="text-2xl font-bold text-slate-900">予約履歴</h1>
        </div>
        <form action={signOut}>
          <button type="submit" className="text-sm text-slate-500 underline">
            ログアウト
          </button>
        </form>
      </div>

      <section className="mt-6 rounded border border-slate-200 p-4">
        <p className="font-bold text-slate-900">LINE通知</p>
        {line === "linked" && <p className="mt-1 text-sm text-green-600">LINE連携が完了しました。</p>}
        {profile?.line_user_id ? (
          <p className="mt-1 text-sm text-slate-600">連携済みです。予約確定・前日リマインドがLINEに届きます。</p>
        ) : (
          <a href="/api/line/start" className="mt-2 inline-block rounded bg-green-600 px-4 py-2 text-sm font-bold text-white">
            LINEと連携する
          </a>
        )}
      </section>

      <ul className="mt-6 space-y-3">
        {reservations.map((reservation: any) => (
          <li key={reservation.id} className="rounded border border-slate-200 p-4">
            <p className="font-bold text-slate-900">{reservation.shop?.name}</p>
            <p className="mt-1 text-sm text-slate-600">
              {new Date(reservation.start_at).toLocaleString("ja-JP")} / {reservation.service?.name} / 担当:{" "}
              {reservation.therapist?.display_name}
            </p>
            <p className="text-sm text-slate-500">状態: {reservation.status}</p>
            {reservation.status === "confirmed" && (
              <form action={cancelReservationAction.bind(null, reservation.id)} className="mt-2">
                <button type="submit" className="text-sm text-red-600">
                  キャンセルする
                </button>
              </form>
            )}
          </li>
        ))}
        {reservations.length === 0 && <p className="text-sm text-slate-500">まだ予約がありません。</p>}
      </ul>
    </div>
  );
}
