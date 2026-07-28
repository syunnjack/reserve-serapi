"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { cancelReservation, createReservation, getServices } from "@/lib/data";

export async function createReservationAction(shopId: number, shopSlug: string, formData: FormData) {
  const user = await getCurrentUser();
  if (!user) redirect(`/login?next=/shops/${shopSlug}`);

  const therapistId = Number(formData.get("therapistId"));
  const serviceId = Number(formData.get("serviceId"));
  const date = String(formData.get("date") ?? "");
  const time = String(formData.get("time") ?? "");
  const note = String(formData.get("note") ?? "").trim();

  if (!therapistId || !serviceId || !date || !time) {
    redirect(`/shops/${shopSlug}?error=invalid`);
  }

  const services = await getServices(shopId);
  const service = services.find((item) => item.id === serviceId);
  if (!service) {
    redirect(`/shops/${shopSlug}?error=invalid`);
  }

  const startAt = new Date(`${date}T${time}:00`);
  const endAt = new Date(startAt.getTime() + service.duration_minutes * 60000);

  const { error } = await createReservation({
    shopId,
    therapistId,
    serviceId,
    customerId: user.id,
    startAt,
    endAt,
    note,
  });

  if (error) redirect(`/shops/${shopSlug}?error=${encodeURIComponent(error)}`);
  redirect("/dashboard/customer");
}

export async function cancelReservationAction(reservationId: number) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  await cancelReservation(reservationId, user.id);
  revalidatePath("/dashboard/customer");
}
