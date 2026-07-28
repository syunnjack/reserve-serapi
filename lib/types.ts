export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  phone: string | null;
  line_user_id: string | null;
}

export interface Shop {
  id: number;
  owner_id: string;
  slug: string;
  name: string;
  description: string | null;
  address: string | null;
  phone: string | null;
  line_channel_access_token: string | null;
}

export interface Service {
  id: number;
  shop_id: number;
  name: string;
  duration_minutes: number;
  price: number;
  description: string | null;
  is_active: boolean;
}

export interface Therapist {
  id: number;
  shop_id: number;
  email: string;
  user_id: string | null;
  display_name: string | null;
  bio: string | null;
}

export interface Shift {
  id: number;
  shop_id: number;
  therapist_id: number;
  shift_date: string;
  start_time: string;
  end_time: string;
}

export type ReservationStatus = "confirmed" | "cancelled" | "completed" | "no_show";

export interface Reservation {
  id: number;
  shop_id: number;
  therapist_id: number;
  service_id: number;
  customer_id: string;
  start_at: string;
  end_at: string;
  status: ReservationStatus;
  note: string | null;
}
