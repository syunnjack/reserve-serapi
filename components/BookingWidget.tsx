"use client";

import { useEffect, useState } from "react";

interface Therapist {
  id: number;
  display_name: string | null;
  email: string;
  bio: string | null;
}

interface Service {
  id: number;
  name: string;
  duration_minutes: number;
  price: number;
}

interface Shift {
  therapist_id: number;
  shift_date: string;
  start_time: string;
  end_time: string;
}

export function BookingWidget({
  therapists,
  services,
  shifts,
  days,
  reserveAction,
}: {
  therapists: Therapist[];
  services: Service[];
  shifts: Shift[];
  days: string[];
  reserveAction: (formData: FormData) => void;
}) {
  const [therapistId, setTherapistId] = useState<number | null>(therapists[0]?.id ?? null);
  const [serviceId, setServiceId] = useState<number | null>(services[0]?.id ?? null);
  const [date, setDate] = useState(days[0] ?? "");
  const [slots, setSlots] = useState<string[]>([]);
  const [selectedTime, setSelectedTime] = useState("");
  const [loading, setLoading] = useState(false);

  const service = services.find((s) => s.id === serviceId);
  const availableDays = days.filter((day) => shifts.some((s) => s.therapist_id === therapistId && s.shift_date === day));

  useEffect(() => {
    if (!therapistId || !date || !service) return;
    setLoading(true);
    setSelectedTime("");
    fetch(`/api/slots?therapistId=${therapistId}&date=${date}&duration=${service.duration_minutes}`)
      .then((res) => res.json())
      .then((data) => setSlots(data.slots ?? []))
      .finally(() => setLoading(false));
  }, [therapistId, date, service]);

  return (
    <div className="rounded border border-slate-200 p-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="text-sm">
          セラピスト
          <select
            value={therapistId ?? ""}
            onChange={(e) => setTherapistId(Number(e.target.value))}
            className="mt-1 w-full rounded border border-slate-300 px-3 py-2"
          >
            {therapists.map((therapist) => (
              <option key={therapist.id} value={therapist.id}>
                {therapist.display_name || therapist.email}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm">
          メニュー
          <select
            value={serviceId ?? ""}
            onChange={(e) => setServiceId(Number(e.target.value))}
            className="mt-1 w-full rounded border border-slate-300 px-3 py-2"
          >
            {services.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}({s.duration_minutes}分 / {s.price.toLocaleString()}円)
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="mt-3">
        <p className="text-sm font-medium text-slate-700">出勤日を選択</p>
        <div className="mt-1 flex flex-wrap gap-2">
          {days.map((day) => {
            const isAvailable = availableDays.includes(day);
            return (
              <button
                key={day}
                type="button"
                disabled={!isAvailable}
                onClick={() => setDate(day)}
                className={`rounded px-3 py-1 text-sm ${
                  date === day ? "bg-blue-600 text-white" : isAvailable ? "border border-blue-300 text-blue-700" : "border border-slate-200 text-slate-300"
                }`}
              >
                {day.slice(5)}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-3">
        <p className="text-sm font-medium text-slate-700">時間を選択</p>
        {loading ? (
          <p className="mt-1 text-sm text-slate-400">読み込み中...</p>
        ) : (
          <div className="mt-1 flex flex-wrap gap-2">
            {slots.map((time) => (
              <button
                key={time}
                type="button"
                onClick={() => setSelectedTime(time)}
                className={`rounded px-3 py-1 text-sm ${selectedTime === time ? "bg-blue-600 text-white" : "border border-blue-300 text-blue-700"}`}
              >
                {time}
              </button>
            ))}
            {slots.length === 0 && <p className="text-sm text-slate-400">空き枠がありません。</p>}
          </div>
        )}
      </div>

      <form action={reserveAction} className="mt-4">
        <input type="hidden" name="therapistId" value={therapistId ?? ""} />
        <input type="hidden" name="serviceId" value={serviceId ?? ""} />
        <input type="hidden" name="date" value={date} />
        <input type="hidden" name="time" value={selectedTime} />
        <textarea name="note" placeholder="ご要望など(任意)" rows={2} className="w-full rounded border border-slate-300 px-3 py-2 text-sm" />
        <button
          type="submit"
          disabled={!selectedTime}
          className="mt-2 w-full rounded bg-blue-600 py-2 font-bold text-white disabled:opacity-40"
        >
          この内容で予約する
        </button>
      </form>
    </div>
  );
}
