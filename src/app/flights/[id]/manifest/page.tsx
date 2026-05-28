"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";

export default function ManifestPage({ params }: { params: { id: string } }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [flight, setFlight] = useState<any>(null);
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
    if (status === "authenticated") {
      const user = session.user as any;
      if (!["HOST", "ADMIN"].includes(user.role)) router.push("/dashboard");
    }
  }, [status, session, router]);

  useEffect(() => {
    if (status === "authenticated") {
      Promise.all([
        fetch("/api/flights").then((r) => r.json()),
        fetch(`/api/tickets?flightId=${params.id}`).then((r) => r.json()),
      ]).then(([flightsData, ticketsData]) => {
        const found = flightsData.find((f: any) => f.id === params.id);
        setFlight(found || null);
        setTickets(ticketsData);
        setLoading(false);
      });
    }
  }, [status, params.id]);

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#003b6f]">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  if (!flight) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-500">Flight not found.</div>
      </div>
    );
  }

  const economy = tickets.filter((t) => t.class === "ECONOMY");
  const business = tickets.filter((t) => t.class === "BUSINESS");
  const firstClass = tickets.filter((t) => t.class === "FIRST_CLASS");

  function getClassLabel(cls: string) {
    if (cls === "ECONOMY") return "🟦 Economy";
    if (cls === "BUSINESS") return "🟨 Business";
    return "🟥 First Class";
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-[#003b6f] text-white px-6 py-4 flex items-center justify-between shadow-lg">
        <div className="flex items-center gap-3">
          <div className="bg-[#075AAA] rounded-full p-2">
            <svg width="24" height="24" viewBox="0 0 48 48" fill="none">
              <path d="M8 24L24 8L40 24L24 40L8 24Z" fill="white" />
            </svg>
          </div>
          <span className="font-bold text-lg">BA Flight Portal</span>
        </div>
        <Link
          href={`/flights/${params.id}`}
          className="text-sm bg-white text-[#003b6f] px-3 py-1 rounded-lg font-semibold hover:bg-gray-100 transition"
        >
          ← Back
        </Link>
      </nav>

      <div className="max-w-2xl mx-auto px-4 py-8 flex flex-col gap-6">
        {/* Flight Info */}
        <div className="bg-[#003b6f] rounded-2xl p-5 text-white">
          <p className="text-blue-200 text-sm">Passenger Manifest</p>
          <p className="text-2xl font-bold mt-1">{flight.flightNumber}</p>
          <div className="flex items-center gap-2 mt-1 font-semibold">
            <span>{flight.departure}</span>
            <span>→</span>
            <span>{flight.arrival}</span>
          </div>
          {flight.departureTime && (
            <p className="text-blue-200 text-xs mt-1">
              🕐 {new Date(flight.departureTime).toLocaleString([], {
                dateStyle: "medium",
                timeStyle: "short",
              })}
            </p>
          )}
        </div>

        {/* Summary */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white rounded-xl shadow p-4 text-center">
            <p className="text-2xl font-bold text-[#075AAA]">{economy.length}</p>
            <p className="text-xs text-gray-500 mt-1">🟦 Economy</p>
            <p className="text-xs text-gray-400">of {flight.economySeats}</p>
          </div>
          <div className="bg-white rounded-xl shadow p-4 text-center">
            <p className="text-2xl font-bold text-[#075AAA]">{business.length}</p>
            <p className="text-xs text-gray-500 mt-1">🟨 Business</p>
            <p className="text-xs text-gray-400">of {flight.businessSeats}</p>
          </div>
          <div className="bg-white rounded-xl shadow p-4 text-center">
            <p className="text-2xl font-bold text-[#075AAA]">{firstClass.length}</p>
            <p className="text-xs text-gray-500 mt-1">🟥 First Class</p>
            <p className="text-xs text-gray-400">of {flight.firstClassSeats}</p>
          </div>
        </div>

        {/* Passenger List */}
        {tickets.length === 0 ? (
          <div className="bg-white rounded-2xl shadow p-6 text-center text-gray-400">
            No passengers booked yet.
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow p-6 flex flex-col gap-4">
            <h2 className="text-lg font-bold text-[#003b6f]">
              Passengers ({tickets.length})
            </h2>
            {[
              { label: "🟥 First Class", list: firstClass },
              { label: "🟨 Business", list: business },
              { label: "🟦 Economy", list: economy },
            ].map(({ label, list }) =>
              list.length > 0 ? (
                <div key={label}>
                  <p className="text-sm font-semibold text-gray-500 mb-2">{label}</p>
                  <div className="flex flex-col gap-2">
                    {list.map((ticket) => (
                      <div
                        key={ticket.id}
                        className="flex items-center gap-3 border border-gray-100 rounded-xl px-4 py-3"
                      >
                        {ticket.user?.avatar && (
                          <img
                            src={ticket.user.avatar}
                            alt="avatar"
                            className="w-8 h-8 rounded-full"
                          />
                        )}
                        <div>
                          <p className="font-semibold text-gray-800 text-sm">
                            {ticket.user?.username}
                          </p>
                          <p className="text-xs text-gray-400">
                            Booked {new Date(ticket.bookedAt).toLocaleString([], {
                              dateStyle: "short",
                              timeStyle: "short",
                            })}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null
            )}
          </div>
        )}
      </div>
    </div>
  );
}
