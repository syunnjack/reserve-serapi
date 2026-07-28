import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getShopByOwner, getTherapistMembershipsForUser } from "@/lib/data";

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const shop = await getShopByOwner(user.id);
  if (shop) redirect("/dashboard/owner");

  const memberships = await getTherapistMembershipsForUser(user.id);
  if (memberships.length > 0) redirect("/dashboard/therapist");

  redirect("/dashboard/customer");
}
