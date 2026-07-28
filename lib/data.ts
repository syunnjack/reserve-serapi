import { createServiceRoleClient } from "@/lib/supabase/server";
import type { Shop, Service, Therapist, Shift } from "@/lib/types";
import { sendLineMessage } from "@/lib/line";

export async function getShopByOwner(ownerId: string): Promise<Shop | null> {
  const supabase = createServiceRoleClient();
  const { data } = await supabase.from("rsp_shops").select("*").eq("owner_id", ownerId).maybeSingle();
  return data;
}

export async function getShopBySlug(slug: string): Promise<Shop | null> {
  const supabase = createServiceRoleClient();
  const { data } = await supabase.from("rsp_shops").select("*").eq("slug", slug).maybeSingle();
  return data;
}

export async function listShops(): Promise<Shop[]> {
  const supabase = createServiceRoleClient();
  const { data } = await supabase.from("rsp_shops").select("*").order("id");
  return data ?? [];
}

export async function getShopById(shopId: number): Promise<Shop | null> {
  const supabase = createServiceRoleClient();
  const { data } = await supabase.from("rsp_shops").select("*").eq("id", shopId).maybeSingle();
  return data;
}

export async function createShop(params: {
  ownerId: string;
  name: string;
  slug: string;
  description?: string;
  address?: string;
  phone?: string;
}): Promise<{ shop: Shop | null; error: string | null }> {
  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from("rsp_shops")
    .insert({
      owner_id: params.ownerId,
      name: params.name,
      slug: params.slug,
      description: params.description ?? null,
      address: params.address ?? null,
      phone: params.phone ?? null,
    })
    .select("*")
    .single();
  if (error) {
    return {
      shop: null,
      error: error.code === "23505" ? "このURL(スラッグ)は既に使われています。" : "作成に失敗しました。",
    };
  }
  return { shop: data, error: null };
}

export async function setLineChannelToken(shopId: number, token: string) {
  const supabase = createServiceRoleClient();
  await supabase.from("rsp_shops").update({ line_channel_access_token: token }).eq("id", shopId);
}

export async function getServices(shopId: number, activeOnly = false): Promise<Service[]> {
  const supabase = createServiceRoleClient();
  let query = supabase.from("rsp_services").select("*").eq("shop_id", shopId).order("id");
  if (activeOnly) query = query.eq("is_active", true);
  const { data } = await query;
  return data ?? [];
}

export async function createService(params: {
  shopId: number;
  name: string;
  durationMinutes: number;
  price: number;
  description?: string;
}) {
  const supabase = createServiceRoleClient();
  const { error } = await supabase.from("rsp_services").insert({
    shop_id: params.shopId,
    name: params.name,
    duration_minutes: params.durationMinutes,
    price: params.price,
    description: params.description ?? null,
  });
  return { error: error ? "メニューの追加に失敗しました。" : null };
}

export async function getTherapists(shopId: number): Promise<Therapist[]> {
  const supabase = createServiceRoleClient();
  const { data } = await supabase.from("rsp_therapists").select("*").eq("shop_id", shopId).order("id");
  return data ?? [];
}

export async function getTherapist(therapistId: number): Promise<Therapist | null> {
  const supabase = createServiceRoleClient();
  const { data } = await supabase.from("rsp_therapists").select("*").eq("id", therapistId).maybeSingle();
  return data;
}

export async function inviteTherapist(shopId: number, email: string, displayName?: string, bio?: string) {
  const supabase = createServiceRoleClient();
  const { data: profile } = await supabase.from("rsp_profiles").select("id").eq("email", email).maybeSingle();
  const { error } = await supabase.from("rsp_therapists").insert({
    shop_id: shopId,
    email,
    display_name: displayName ?? null,
    bio: bio ?? null,
    user_id: profile?.id ?? null,
  });
  return { error: error ? (error.code === "23505" ? "既に招待済みです。" : "招待に失敗しました。") : null };
}

export async function getTherapistMembershipsForUser(userId: string) {
  const supabase = createServiceRoleClient();
  const { data } = await supabase.from("rsp_therapists").select("*, shop:rsp_shops(*)").eq("user_id", userId);
  return data ?? [];
}

export async function linkTherapistInvitesForNewUser(userId: string, email: string) {
  const supabase = createServiceRoleClient();
  await supabase.from("rsp_therapists").update({ user_id: userId }).eq("email", email).is("user_id", null);
}

// 向こう7日分のシフトを取得する(公開ページの出勤状況カレンダー用)
export async function getUpcomingShifts(shopId: number): Promise<Shift[]> {
  const supabase = createServiceRoleClient();
  const today = new Date().toISOString().slice(0, 10);
  const weekLater = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const { data } = await supabase
    .from("rsp_shifts")
    .select("*")
    .eq("shop_id", shopId)
    .gte("shift_date", today)
    .lte("shift_date", weekLater)
    .order("shift_date");
  return data ?? [];
}

export async function getTherapistShifts(therapistId: number): Promise<Shift[]> {
  const supabase = createServiceRoleClient();
  const today = new Date().toISOString().slice(0, 10);
  const weekLater = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const { data } = await supabase
    .from("rsp_shifts")
    .select("*")
    .eq("therapist_id", therapistId)
    .gte("shift_date", today)
    .lte("shift_date", weekLater)
    .order("shift_date");
  return data ?? [];
}

export async function setShift(params: {
  shopId: number;
  therapistId: number;
  shiftDate: string;
  startTime: string;
  endTime: string;
}) {
  const supabase = createServiceRoleClient();
  const { error } = await supabase
    .from("rsp_shifts")
    .upsert(
      {
        shop_id: params.shopId,
        therapist_id: params.therapistId,
        shift_date: params.shiftDate,
        start_time: params.startTime,
        end_time: params.endTime,
      },
      { onConflict: "therapist_id,shift_date" }
    );
  return { error: error ? "出勤設定に失敗しました。" : null };
}

export async function removeShift(therapistId: number, shiftDate: string) {
  const supabase = createServiceRoleClient();
  await supabase.from("rsp_shifts").delete().eq("therapist_id", therapistId).eq("shift_date", shiftDate);
}

// 予約可能な時間枠を計算する: シフト時間内かつ既存予約と重複しない30分刻みの枠
export async function getAvailableSlots(therapistId: number, shiftDate: string, durationMinutes: number) {
  const supabase = createServiceRoleClient();
  const { data: shift } = await supabase
    .from("rsp_shifts")
    .select("*")
    .eq("therapist_id", therapistId)
    .eq("shift_date", shiftDate)
    .maybeSingle();
  if (!shift) return [];

  const { data: reservations } = await supabase
    .from("rsp_reservations")
    .select("start_at, end_at")
    .eq("therapist_id", therapistId)
    .neq("status", "cancelled")
    .gte("start_at", `${shiftDate}T00:00:00`)
    .lt("start_at", `${shiftDate}T23:59:59`);

  const busy = (reservations ?? []).map((r) => ({
    start: new Date(r.start_at).getTime(),
    end: new Date(r.end_at).getTime(),
  }));

  const [startH, startM] = shift.start_time.split(":").map(Number);
  const [endH, endM] = shift.end_time.split(":").map(Number);
  const shiftStart = startH * 60 + startM;
  const shiftEnd = endH * 60 + endM;

  const slots: string[] = [];
  for (let minutes = shiftStart; minutes + durationMinutes <= shiftEnd; minutes += 30) {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    const time = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
    const slotStart = new Date(`${shiftDate}T${time}:00`).getTime();
    const slotEnd = slotStart + durationMinutes * 60000;
    const overlaps = busy.some((b) => slotStart < b.end && slotEnd > b.start);
    if (!overlaps) slots.push(time);
  }
  return slots;
}

export async function createReservation(params: {
  shopId: number;
  therapistId: number;
  serviceId: number;
  customerId: string;
  startAt: Date;
  endAt: Date;
  note?: string;
}) {
  const supabase = createServiceRoleClient();

  const { data: overlapping } = await supabase
    .from("rsp_reservations")
    .select("id")
    .eq("therapist_id", params.therapistId)
    .neq("status", "cancelled")
    .lt("start_at", params.endAt.toISOString())
    .gt("end_at", params.startAt.toISOString());
  if (overlapping && overlapping.length > 0) {
    return { error: "その時間は既に予約が入っています。", reservation: null };
  }

  const { data, error } = await supabase
    .from("rsp_reservations")
    .insert({
      shop_id: params.shopId,
      therapist_id: params.therapistId,
      service_id: params.serviceId,
      customer_id: params.customerId,
      start_at: params.startAt.toISOString(),
      end_at: params.endAt.toISOString(),
      note: params.note ?? null,
    })
    .select("*, service:rsp_services(name), therapist:rsp_therapists(display_name), shop:rsp_shops(name, line_channel_access_token), customer:rsp_profiles(line_user_id)")
    .single();
  if (error) return { error: "予約に失敗しました。", reservation: null };

  if (data.shop?.line_channel_access_token && data.customer?.line_user_id) {
    await sendLineMessage(
      data.shop.line_channel_access_token,
      data.customer.line_user_id,
      `【予約確定】${data.shop.name}\n${new Date(data.start_at).toLocaleString("ja-JP")}\n担当: ${data.therapist?.display_name ?? "担当者"}\nメニュー: ${data.service?.name ?? ""}`
    );
  }

  return { error: null, reservation: data };
}

export async function cancelReservation(reservationId: number, customerId: string) {
  const supabase = createServiceRoleClient();
  await supabase
    .from("rsp_reservations")
    .update({ status: "cancelled" })
    .eq("id", reservationId)
    .eq("customer_id", customerId);
}

export async function getCustomerReservations(customerId: string) {
  const supabase = createServiceRoleClient();
  const { data } = await supabase
    .from("rsp_reservations")
    .select("*, shop:rsp_shops(name, slug), service:rsp_services(name), therapist:rsp_therapists(display_name)")
    .eq("customer_id", customerId)
    .order("start_at", { ascending: false });
  return data ?? [];
}

export async function getTherapistReservations(therapistId: number) {
  const supabase = createServiceRoleClient();
  const { data } = await supabase
    .from("rsp_reservations")
    .select("*, service:rsp_services(name), customer:rsp_profiles(full_name, phone)")
    .eq("therapist_id", therapistId)
    .order("start_at", { ascending: true });
  return data ?? [];
}

export async function getShopReservations(shopId: number) {
  const supabase = createServiceRoleClient();
  const { data } = await supabase
    .from("rsp_reservations")
    .select("*, service:rsp_services(name), therapist:rsp_therapists(display_name), customer:rsp_profiles(full_name, email, phone)")
    .eq("shop_id", shopId)
    .order("start_at", { ascending: true });
  return data ?? [];
}

// リマインド未送信で、24時間以内に開始する予約を対象に前日リマインドを送る
export async function sendPendingReminders() {
  const supabase = createServiceRoleClient();
  const now = new Date();
  const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);

  const { data: reservations } = await supabase
    .from("rsp_reservations")
    .select("*, service:rsp_services(name), therapist:rsp_therapists(display_name), shop:rsp_shops(name, line_channel_access_token), customer:rsp_profiles(line_user_id)")
    .eq("status", "confirmed")
    .is("reminder_sent_at", null)
    .gte("start_at", now.toISOString())
    .lte("start_at", in24h.toISOString());

  for (const reservation of reservations ?? []) {
    if (reservation.shop?.line_channel_access_token && reservation.customer?.line_user_id) {
      await sendLineMessage(
        reservation.shop.line_channel_access_token,
        reservation.customer.line_user_id,
        `【ご予約リマインド】${reservation.shop.name}\n${new Date(reservation.start_at).toLocaleString("ja-JP")}\n担当: ${reservation.therapist?.display_name ?? "担当者"}\nお待ちしております。`
      );
    }
    await supabase.from("rsp_reservations").update({ reminder_sent_at: new Date().toISOString() }).eq("id", reservation.id);
  }

  return { sent: reservations?.length ?? 0 };
}
