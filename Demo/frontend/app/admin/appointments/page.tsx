"use client";

import { useEffect, useState } from "react";
import { api, AppointmentT } from "@/lib/api";

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState<AppointmentT[]>([]);

  useEffect(() => {
    api.get<AppointmentT[]>("/api/appointments").then(setAppointments).catch(() => {});
  }, []);

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-slate-900">Appointments</h1>
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Customer</th>
              <th className="px-4 py-3">Service</th>
              <th className="px-4 py-3">Scheduled</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {appointments.map((a) => (
              <tr key={a.id}>
                <td className="px-4 py-3 font-medium text-slate-800">{a.customer_name || "—"}</td>
                <td className="px-4 py-3 text-slate-500">{a.service || "—"}</td>
                <td className="px-4 py-3 text-slate-500">{new Date(a.scheduled_time).toLocaleString()}</td>
                <td className="px-4 py-3">
                  <span className="rounded-full bg-brand-100 px-2 py-0.5 text-xs font-semibold text-brand-700">{a.status}</span>
                </td>
              </tr>
            ))}
            {appointments.length === 0 && (
              <tr><td colSpan={4} className="px-4 py-6 text-center text-slate-400">No appointments yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
