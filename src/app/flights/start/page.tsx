"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";

export default function StartFlightPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [flightNumber, setFlightNumber] = useState("");
  const [departure, setDeparture] = useState("");
  const [arrival, setArrival] = useState("");
  const [departureTime, setDepartureTime] = useState("");
  const [economySeats, setEconomySeats] = useState(50);
  const [businessSeats, setBusinessSeats] = useState(20);
  const [firstClassSeats, setFirstClassSeats] = useState(10);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
    if (status === "authenticated") {
      const user = session.user as any;
      if (!["HOST", "ADMIN"].includes(user.role)) router.push("/dashboard");
    }
  }, [status, session, router]);

  async function handleSubmit() {
    if (!flightNumber || !departure || !arrival || !departureTime) {
      setError("Please fill in all fields.");
      return;
    }
    setLoading(true);
    setError("");
    const res = await fetch("/api/flights", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        flightNumber,
        departure: departure.toUpperCase(),
        arrival: arrival.toUpperCase(),
        departureTime: new Date(departureTime).toISOString(),
        economySeats,
        businessSeats,
        firstClassSeats,
      }),
    });
    if (res.ok) {
      router.push("/dashboard");
    } else {
      const data = await res.json();
      setError(data.error || "Something went wrong.");
      setLoading(false);
    }
  }

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#003b6f]">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
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
        <Link href="/dashboard" className="text-sm bg-white text-[#003b6f] px-3 py-1 rounded-lg font-semibold hover:bg-gray-100 transition">
          ← Back
        </Link>
      </nav>

      <div className="max-w-lg mx-auto px-4 py-12">
        <div className="bg-white rounded-2xl shadow p-8 flex flex-col gap-6">
          <div>
            <h1 className="text-2xl font-bold text-[#003b6f]">✈️ Start a Flight</h1>
            <p className="text-gray-400 text-sm mt-1">Fill in the details to open booking</p>
          </div>

          <div className="flex flex-col gap-4">
            <div>
              <label className="text-sm font-semibold text-gray-600 mb-1 block">Flight Number</label>
              <input
                type="text"
                placeholder="e.g. BA112"
                value={flightNumber}
                onChange={(e) => setFlightNumber(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#075AAA]"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-semibold text-gray-600 mb-1 block">Departure</label>
                <input
                  type="text"
                  placeholder="e.g. EGLL"
                  value={departure}
                  onChange={(e) => setDeparture(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#075AAA] uppercase"
                />
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-600 mb-1 block">Arrival</label>
                <input
                  type="text"
                  placeholder="e.g. OMDB"
                  value={arrival}
                  onChange={(e) => setArrival(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#075AAA] uppercase"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-semibold text-gray-600 mb-1 block">Departure Time</label>
              <input
                type="datetime-local"
                value={departureTime}
                onChange={(e) => setDepartureTime(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#075AAA]"
              />
            </div>

            <div className="border-t border-gray-100 pt-4">
              <p className="text-sm font-semibold text-gray-600 mb-3">Seat Allocation</p>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-semibold text-gray-500 mb-1 block">🟦 Economy</label>
                  <input
                    type="number"
                    min={1}
                    max={200}
                    value={economySeats}
                    onChange={(e) => setEconomySeats(Number(e.target.value))}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#075AAA] text-center"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 mb-1 block">🟨 Business</label>
                  <input
                    type="number"
                    min={1}
                    max={100}
                    value={businessSeats}
                    onChange={(e) => setBusinessSeats(Number(e.target.value))}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#075AAA] text-center"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 mb-1 block">🟥 First</label>
                  <input
                    type="number"
                    min={1}
                    max={50}
                    value={firstClassSeats}
                    onChange={(e) => setFirstClassSeats(Number(e.target.value))}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#075AAA] text-center"
                  />
                </div>
              </div>
            </div>

            {error && <p className="text-red-500 text-sm">{error}</p>}

            <button
              onClick={handleSubmit}
              disabled={loading}
              className="w-full bg-[#075AAA] hover:bg-[#003b6f] text-white font-bold py-3 rounded-xl transition disabled:opacity-50"
            >
              {loading ? "Starting..." : "Start Flight"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
