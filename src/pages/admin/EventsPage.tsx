import { useState } from "react";
import { Helmet } from "react-helmet-async";
import { Plus, Pencil, Check, X as XIcon } from "lucide-react";
import { format } from "date-fns";
import EventEditForm from "@/components/admin/events/EventEditForm";
import { Skeleton } from "@/components/common/Skeleton";
import { useAdminEvents } from "@/hooks/useAdminEvents";
import { useAdminEventTickets, useSetTicketCheckedIn } from "@/hooks/useAdminEventTickets";

const money = (n: number | null) =>
  n == null ? "—" : new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);

export default function EventsPage() {
  const { data: events, isLoading } = useAdminEvents();
  const { data: tickets, isLoading: ticketsLoading } = useAdminEventTickets();
  const setCheckedIn = useSetTicketCheckedIn();
  const [editingId, setEditingId] = useState<number | "new" | null>(null);

  return (
    <>
      <Helmet>
        <title>Events | Korea By Local Admin</title>
      </Helmet>

      <div className="mx-auto max-w-5xl px-4 py-6 lg:px-6 lg:py-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-primary">Events</h1>
            <p className="mt-1 text-sm text-text-secondary">Manage ticketed events and view attendees.</p>
          </div>
          {editingId === null && (
            <button
              onClick={() => setEditingId("new")}
              className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-white hover:bg-primary/90"
            >
              <Plus className="h-4 w-4" />
              Add Event
            </button>
          )}
        </div>

        {editingId === "new" && (
          <div className="mb-6">
            <EventEditForm onDone={() => setEditingId(null)} />
          </div>
        )}

        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 2 }).map((_, i) => (
              <Skeleton key={i} className="h-24 w-full rounded-xl" />
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {(events ?? []).map((event) =>
              editingId === event.id ? (
                <EventEditForm key={event.id} event={event} onDone={() => setEditingId(null)} />
              ) : (
                <div key={event.id} className="flex items-center gap-4 rounded-xl border border-gray-200 bg-white p-5">
                  {event.cover_image_url && (
                    <img src={event.cover_image_url} alt="" loading="lazy" className="h-16 w-16 shrink-0 rounded-lg object-cover" />
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h2 className="truncate font-semibold text-primary">{event.title}</h2>
                      <span
                        className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                          event.is_active ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-500"
                        }`}
                      >
                        {event.is_active ? "Active" : "Inactive"}
                      </span>
                    </div>
                    <p className="mt-0.5 text-sm text-text-secondary">
                      {event.event_date} · {money(event.price_usd)} · {event.sold_count} / {event.capacity} sold
                      {event.sold_count >= event.capacity && (
                        <span className="ml-1.5 font-semibold text-red-600">SOLD OUT</span>
                      )}
                    </p>
                  </div>
                  <button
                    onClick={() => setEditingId(event.id)}
                    className="flex shrink-0 items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    Edit
                  </button>
                </div>
              ),
            )}
            {events?.length === 0 && editingId === null && (
              <p className="rounded-xl border border-dashed border-gray-300 py-12 text-center text-gray-400">
                No events yet — add one to start selling tickets.
              </p>
            )}
          </div>
        )}

        {/* Attendees — match a confirmation code or email against this list at the door */}
        <h2 className="mb-4 mt-10 text-lg font-bold text-primary">Attendees</h2>
        {ticketsLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full rounded-lg" />
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-gray-200 bg-gray-50">
                <tr>
                  <th className="px-4 py-3 font-medium text-gray-500">Buyer</th>
                  <th className="px-4 py-3 font-medium text-gray-500">Code</th>
                  <th className="px-4 py-3 font-medium text-gray-500">Amount</th>
                  <th className="px-4 py-3 font-medium text-gray-500">Checked in</th>
                  <th className="px-4 py-3 font-medium text-gray-500">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {(tickets ?? []).map((t) => (
                  <tr key={t.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="font-medium text-primary">{t.buyer_email}</div>
                      {t.buyer_name && <div className="text-xs text-gray-400">{t.buyer_name}</div>}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs tracking-wide text-gray-600">{t.confirmation_code}</td>
                    <td className="px-4 py-3 text-gray-600">{t.amount != null ? `${money(t.amount)} ${t.currency}` : "—"}</td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => setCheckedIn.mutate({ id: t.id, checked_in: !t.checked_in })}
                        disabled={setCheckedIn.isPending}
                        className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${
                          t.checked_in ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-500"
                        }`}
                      >
                        {t.checked_in ? <Check className="h-3.5 w-3.5" /> : <XIcon className="h-3.5 w-3.5" />}
                        {t.checked_in ? "Checked in" : "Not yet"}
                      </button>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-gray-400">
                      {format(new Date(t.created_at), "yyyy-MM-dd HH:mm")}
                    </td>
                  </tr>
                ))}
                {tickets?.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-12 text-center text-gray-400">
                      No tickets sold yet
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
