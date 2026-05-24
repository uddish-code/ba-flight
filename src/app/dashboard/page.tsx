"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [flights, setFlights] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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
    }
  }, [status]);

  if (status === "loading" || !session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#003b6f]">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  const user = session.user as any;

  const statusColor: Record<string, string> = {
    BOARDING: "bg-yellow-100 text-yellow-800",
    IN_FLIGHT: "bg-blue-100 text-blue-800",
    LANDED: "bg-green-100 text-green-800",
    CANCELLED: "bg-red-100 text-red-800",
  };

  const statusLabel: Record<string, string> = {
    BOARDING: "Boarding",
    IN_FLIGHT: "In Flight",
    LANDED: "Landed",
    CANCELLED: "Cancelled",
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
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
            <img
              src={user.avatar}
              alt="avatar"
              className="w-8 h-8 rounded-full border-2 border-white"
            />
          )}
          <span className="text-sm hidden sm:block">{user.name}</span>
          <span className="text-xs bg-[#075AAA] px-2 py-1 rounded-full">
            {user.role}
          </span>
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="text-sm bg-white text-[#003b6f] px-3 py-1 rounded-lg font-semibold hover:bg-gray-100 transition"
          >
            Sign Out
          </button>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-4 py-8 flex flex-col gap-6">
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
          ) : flights.filter((f) => f.status !== "LANDED" && f.status !== "CANCELLED").length === 0 ? (
            <p className="text-gray-400">No active flights right now.</p>
          ) : (
            <div className="flex flex-col gap-3">
              {flights
                .filter((f) => f.status !== "LANDED" && f.status !== "CANCELLED")
                .map((flight) => (
                  <div key={flight.id} className="flex items-center justify-between border border-gray-100 rounded-xl p-4">
                    <div>
                      <p className="font-bold text-[#003b6f]">{flight.flightNumber}</p>
                      <p className="text-gray-500 text-sm">{flight.route}</p>
                      <p className="text-gray-400 text-xs">Host: {flight.host?.username}</p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <span className={`text-xs px-3 py-1 rounded-full font-semibold ${statusColor[flight.status]}`}>
                        {statusLabel[flight.status]}
                      </span>
                      {["HOST", "ADMIN"].includes(user.role) && (
                        <Link href={`/flights/${flight.id}`} className="text-xs text-[#075AAA] underline">
                          Manage
                        </Link>
                      )}
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
