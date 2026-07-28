import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getTherapistMembershipsForUser, getTherapistShifts, getTherapistReservations } from "@/lib/data";
import { signOut } from "@/app/actions/auth";
import { setOwnShiftAction } from "@/app/actions/therapist";

function nextSevenDays(): string[] {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(Date.now() + i * 24 * 60 * 60 * 1000);
    return d.toISOString().slice(0, 10);
  });
}

export default async function TherapistDashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const memberships = await getTherapistMembershipsForUser(user.id);
  if (memberships.length === 0) redirect("/dashboard/customer");

  const days = nextSevenDays();

  const data = await Promise.all(
    memberships.map(async (membership: any) => ({
      membership,
      shifts: await getTherapistShifts(membership.id),
      reservations: await getTherapistReservations(membership.id),
    }))
  );

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-slate-500">セラピストダッシュボード</p>
          <h1 className="text-2xl font-bold text-slate-900">自分の出勤・予約</h1>
        </div>
        <form action={signOut}>
          <button type="submit" className="text-sm text-slate-500 underline">
            ログアウト
          </button>
        </form>
      </div>

      {data.map(({ membership, shifts, reservations }) => (
        <section key={membership.id} className="mt-8">
          <h2 className="text-lg font-bold text-slate-900">{membership.shop.name}</h2>

          <h3 className="mt-4 text-sm font-bold text-slate-700">出勤登録(向こう7日間)</h3>
          <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
            {days.map((day) => {
              const shift = shifts.find((s: any) => s.shift_date === day);
              return (
                <form
                  key={day}
                  action={setOwnShiftAction.bind(null, membership.id)}
                  className="flex items-center gap-2 rounded border border-slate-200 p-2 text-sm"
                >
                  <input type="hidden" name="shiftDate" value={day} />
                  <span className="w-16">{day.slice(5)}</span>
                  <input type="time" name="startTime" defaultValue={shift?.start_time?.slice(0, 5) ?? ""} className="w-24 rounded border border-slate-300 px-1 py-0.5" />
                  <input type="time" name="endTime" defaultValue={shift?.end_time?.slice(0, 5) ?? ""} className="w-24 rounded border border-slate-300 px-1 py-0.5" />
                  <button type="submit" className="text-blue-600">
                    保存
                  </button>
                </form>
              );
            })}
          </div>

          <h3 className="mt-6 text-sm font-bold text-slate-700">担当予約</h3>
          <ul className="mt-2 space-y-2">
            {reservations.map((reservation: any) => (
              <li key={reservation.id} className="rounded border border-slate-200 p-3 text-sm">
                <p className="font-bold text-slate-900">
                  {new Date(reservation.start_at).toLocaleString("ja-JP")} - {reservation.service?.name}
                </p>
                <p className="text-slate-500">
                  {reservation.customer?.full_name || "お客様"} / {reservation.status}
                </p>
              </li>
            ))}
            {reservations.length === 0 && <p className="text-sm text-slate-500">担当の予約はまだありません。</p>}
          </ul>
        </section>
      ))}
    </div>
  );
}
