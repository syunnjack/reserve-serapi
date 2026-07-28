"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth";
import { getTherapist, setShift } from "@/lib/data";

// 施術者本人が自分のシフトを登録する
export async function setOwnShiftAction(therapistId: number, formData: FormData) {
  const user = await getCurrentUser();
  if (!user) return;

  const therapist = await getTherapist(therapistId);
  if (!therapist || therapist.user_id !== user.id) return;

  const shiftDate = String(formData.get("shiftDate") ?? "");
  const startTime = String(formData.get("startTime") ?? "");
  const endTime = String(formData.get("endTime") ?? "");
  if (!shiftDate || !startTime || !endTime) return;

  await setShift({ shopId: therapist.shop_id, therapistId, shiftDate, startTime, endTime });
  revalidatePath("/dashboard/therapist");
}
