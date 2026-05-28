"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";

function getCountdown(departureTime: string): string {
  const now = new Date();
  const dep = new Date(departureTime);
  const diff = dep.getTime() - now.getTime();
  if (diff <= 0) return "Departing now";
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  if (hours > 0) return `Departing in ${hours}h ${minutes}m`;
  return `Departing in ${minutes}m`;
}

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [flights, setFlights] = useState<any[]>([]);
  const [myTickets, setMyTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [, setTick] = useState(0);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  useEffect(() => {
    if (status === "authenticated") {
      fetch("/api/flights")
        .then((r) => r.json())
        .then((data) => {
          setFlights(data);
          setLoading(false);
        });
      fetch("/api/tickets")
        .then((r) => r.json())
        .then((data) => setMyTickets(data));
    }
  }, [status]);

  useEffect(() => {
    const interval = setInterval(() => setTick((t) => t + 1), 60000);
    return () => clearInterval(interval);
  }, []);

  if (status === "loading" || !session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#003b6f]">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  const user = session.user as any;

  const statusColor: Record<string, string> = {
    UPCOMING: "bg-purple-100 text-purple-800",
    BOARDING: "bg-yellow-100 text-yellow-800",
    CRUISING: "bg-blue-100 text-blue-800",
    DESCENDING: "bg-orange-100 text-orange-800",
    LANDING: "bg-red-100 text-red-800",
    PARKED: "bg-green-100 text-green-800",
    CANCELLED: "bg-gray-100 text-gray-800",
  };

  const statusIcon: Record<string, string> = {
    UPCOMING: "🕐",
    BOARDING: "🚶",
    CRUISING: "✈️",
    DESCENDING: "📉",
    LANDING: "🛬",
    PARKED: "🅿️",
    CANCELLED: "❌",
  };

  const activeFlights = flights.filter(
    (f) => f.status !== "PARKED" && f.status !== "CANCELLED"
  );

  function getTicketForFlight(flightId: string) {
    return myTickets.find((t: any) => t.flightId === flightId);
  }

  function getSeatsLeft(flight: any, cls: string) {
    const booked = flight.tickets.filter((t: any) => t.class === cls).length;
    const total =
      cls === "ECONOMY" ? flight.economySeats :
      cls === "BUSINESS" ? flight.businessSeats :
      flight.firstClassSeats;
    return total - booked;
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
        <div className="flex items-center gap-4">
          {user.avatar && (
            <img src={user.avatar} alt="avatar" className="w-8 h-8 rounded-full border-2 border-white" />
          )}
          <span className="text-sm hidden sm:block">{user.name}</span>
          <span className="text-xs bg-[#075AAA] px-2 py-1 rounded-full">{user.role}</span>
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="text-sm bg-white text-[#003b6f] px-3 py-1 rounded-lg font-semibold hover:bg-gray-100 transition"
          >
            Sign Out
          </button>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-4 py-8 flex flex-col gap-6">
        {/* BA Miles Banner */}
        <div className="bg-[#003b6f] rounded-2xl p-5 flex items-center justify-between text-white">
          <div>
            <p className="text-sm text-blue-200">Your BA Miles</p>
            <p className="text-3xl font-bold">✈ {user.baMiles || 0}</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-blue-200">Class</p>
            <p className="font-bold capitalize">
              {user.ticketClass === "FIRST_CLASS" ? "🟥 First Class" :
               user.ticketClass === "BUSINESS" ? "🟨 Business" : "🟦 Economy"}
            </p>
          </div>
        </div>

        {/* Quick Links */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Link href="/dashboard" className="bg-[#075AAA] text-white rounded-xl p-4 text-center font-semibold hover:bg-[#003b6f] transition">
            🏠 Dashboard
          </Link>
          {["HOST", "ADMIN"].includes(user.role) && (
            <Link href="/flights/start" className="bg-[#075AAA] text-white rounded-xl p-4 text-center font-semibold hover:bg-[#003b6f] transition">
              ✈️ Start Flight
            </Link>
          )}
          <Link href="/logs" className="bg-[#075AAA] text-white rounded-xl p-4 text-center font-semibold hover:bg-[#003b6f] transition">
            📋 Flight Logs
          </Link>
          {user.role === "ADMIN" && (
            <Link href="/admin" className="bg-[#075AAA] text-white rounded-xl p-4 text-center font-semibold hover:bg-[#003b6f] transition">
              ⚙️ Admin Panel
            </Link>
          )}
        </div>

        {/* Active Flights */}
        <div className="bg-white rounded-2xl shadow p-6">
          <h2 className="text-xl font-bold text-[#003b6f] mb-4">Active Flights</h2>
          {loading ? (
            <p className="text-gray-400">Loading flights...</p>
          ) : activeFlights.length === 0 ? (
            <p className="text-gray-400">No active flights right now.</p>
          ) : (
            <div className="flex flex-col gap-3">
              {activeFlights.map((flight) => {
                const myTicket = getTicketForFlight(flight.id);
                const canBook = ["UPCOMING", "BOARDING"].includes(flight.status);
                return (
                  <div key={flight.id} className="border border-gray-100 rounded-xl p-4 flex flex-col gap-3">
                    <div className="flex items-start justify-between">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-[#003b6f] text-lg">{flight.flightNumber}</p>
                          <span className={`text-xs px-2 py-1 rounded-full font-semibold ${statusColor[flight.status]}`}>
                            {statusIcon[flight.status]} {flight.status}
                          </span>
                          {myTicket && (
                            <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-semibold">
                              ✅ Booked
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-gray-600 font-semibold">
                          <span>{flight.departure}</span>
                          <span>→</span>
                          <span>{flight.arrival}</span>
                        </div>
                        <p className="text-gray-400 text-xs">Host: {flight.host?.username}</p>
                        {flight.status === "UPCOMING" && flight.departureTime && (
                          <p className="text-purple-600 text-xs font-semibold">
                            🕐 {getCountdown(flight.departureTime)}
                          </p>
                        )}
                      </div>
                      <div className="flex flex-col items-end gap-1 text-xs text-gray-400">
                        <span>🟦 {getSeatsLeft(flight, "ECONOMY")} eco</span>
                        <span>🟨 {getSeatsLeft(flight, "BUSINESS")} biz</span>
                        <span>🟥 {getSeatsLeft(flight, "FIRST_CLASS")} first</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {canBook && !myTicket && (
                        <Link
                          href={`/flights/${flight.id}/book`}
                          className="flex-1 bg-[#075AAA] text-white text-center text-sm font-semibold py-2 rounded-lg hover:bg-[#003b6f] transition"
                        >
                          🎫 Book Ticket
                        </Link>
                      )}
                      {canBook && myTicket && (
                        <Link
                          href={`/flights/${flight.id}/book`}
                          className="flex-1 bg-gray-100 text-gray-600 text-center text-sm font-semibold py-2 rounded-lg hover:bg-gray-200 transition"
                        >
                          View Booking
                        </Link>
                      )}
                      {["HOST", "ADMIN"].includes(user.role) && (
                        <Link
                          href={`/flights/${flight.id}`}
                          className="bg-gray-100 text-gray-600 text-sm font-semibold px-4 py-2 rounded-lg hover:bg-gray-200 transition"
                        >
                          Manage
                        </Link>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
