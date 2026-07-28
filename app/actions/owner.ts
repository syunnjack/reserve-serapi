"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { createShop, createService, inviteTherapist, setLineChannelToken, setShift, removeShift } from "@/lib/data";

function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 40);
}

export async function createShopAction(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const address = String(formData.get("address") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();

  const baseSlug = slugify(name) || `shop-${Date.now()}`;
  const slug = `${baseSlug}-${Math.random().toString(36).slice(2, 6)}`;

  const { error } = await createShop({ ownerId: user.id, name, slug, description, address, phone });
  if (error) redirect(`/dashboard/owner?error=${encodeURIComponent(error)}`);
  revalidatePath("/dashboard/owner");
  redirect("/dashboard/owner");
}

export async function createServiceAction(shopId: number, formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const durationMinutes = Number(formData.get("durationMinutes") ?? 60);
  const price = Number(formData.get("price") ?? 0);
  const description = String(formData.get("description") ?? "").trim();

  await createService({ shopId, name, durationMinutes, price, description });
  revalidatePath("/dashboard/owner");
}

export async function inviteTherapistAction(shopId: number, formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const displayName = String(formData.get("displayName") ?? "").trim();
  const bio = String(formData.get("bio") ?? "").trim();
  await inviteTherapist(shopId, email, displayName, bio);
  revalidatePath("/dashboard/owner");
}

export async function setLineTokenAction(shopId: number, formData: FormData) {
  const token = String(formData.get("lineToken") ?? "").trim();
  await setLineChannelToken(shopId, token);
  revalidatePath("/dashboard/owner");
}

export async function setShiftAction(shopId: number, therapistId: number, formData: FormData) {
  const shiftDate = String(formData.get("shiftDate") ?? "");
  const startTime = String(formData.get("startTime") ?? "");
  const endTime = String(formData.get("endTime") ?? "");
  if (!shiftDate || !startTime || !endTime) return;
  await setShift({ shopId, therapistId, shiftDate, startTime, endTime });
  revalidatePath("/dashboard/owner");
}

export async function removeShiftAction(therapistId: number, shiftDate: string) {
  await removeShift(therapistId, shiftDate);
  revalidatePath("/dashboard/owner");
}
