import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getServices, getShopBySlug, getTherapists, getUpcomingShifts } from "@/lib/data";
import { createReservationAction } from "@/app/actions/customer";
import { BookingWidget } from "@/components/BookingWidget";

export const revalidate = 60;

function nextSevenDays(): string[] {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(Date.now() + i * 24 * 60 * 60 * 1000);
    return d.toISOString().slice(0, 10);
  });
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const shop = await getShopBySlug(slug);
  if (!shop) return {};
  return {
    title: shop.name,
    description: shop.description ?? undefined,
    alternates: { canonical: `/shops/${shop.slug}` },
  };
}

export default async function ShopPublicPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { slug } = await params;
  const { error } = await searchParams;
  const shop = await getShopBySlug(slug);
  if (!shop) notFound();

  const [therapists, services, shifts] = await Promise.all([
    getTherapists(shop.id),
    getServices(shop.id, true),
    getUpcomingShifts(shop.id),
  ]);
  const days = nextSevenDays();
  const boundReserve = createReservationAction.bind(null, shop.id, shop.slug);

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="text-2xl font-bold text-slate-900">{shop.name}</h1>
      {shop.description && <p className="mt-2 text-slate-600">{shop.description}</p>}
      <div className="mt-2 text-sm text-slate-500">
        {shop.address && <p>{shop.address}</p>}
        {shop.phone && <p>{shop.phone}</p>}
      </div>

      {error && <p className="mt-4 rounded bg-red-50 p-3 text-sm text-red-700">予約できませんでした。内容をご確認ください。</p>}

      <section className="mt-8">
        <h2 className="text-lg font-bold text-slate-900">向こう7日間の出勤状況</h2>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[500px] border-collapse text-sm">
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
                  <td className="border-b p-2 font-bold text-slate-900">{therapist.display_name || "セラピスト"}</td>
                  {days.map((day) => {
                    const onDuty = shifts.some((s) => s.therapist_id === therapist.id && s.shift_date === day);
                    return (
                      <td key={day} className="border-b p-2 text-center">
                        {onDuty ? <span className="text-green-600">◯</span> : <span className="text-slate-300">-</span>}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-8">
        <h2 className="text-lg font-bold text-slate-900">ご予約</h2>
        {therapists.length > 0 && services.length > 0 ? (
          <div className="mt-3">
            <BookingWidget therapists={therapists} services={services} shifts={shifts} days={days} reserveAction={boundReserve} />
          </div>
        ) : (
          <p className="mt-2 text-sm text-slate-500">現在予約を受け付けていません。</p>
        )}
      </section>
    </div>
  );
}
