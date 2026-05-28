"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";

export default function BookFlightPage({ params }: { params: { id: string } }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [flight, setFlight] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [existingTicket, setExistingTicket] = useState<any>(null);
  const [selectedClass, setSelectedClass] = useState("ECONOMY");

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  useEffect(() => {
    if (status === "authenticated") {
      fetch("/api/flights")
        .then((r) => r.json())
        .then((data) => {
          const found = data.find((f: any) => f.id === params.id);
          setFlight(found || null);
          setLoading(false);
        });

      fetch(`/api/tickets?flightId=${params.id}`)
        .then((r) => r.json())
        .then((tickets) => {
          const user = session.user as any;
          const mine = tickets.find((t: any) => t.userId === user.id);
          setExistingTicket(mine || null);
        });
    }
  }, [status, params.id, session]);

  const user = session?.user as any;

  function getClassLabel(cls: string) {
    if (cls === "ECONOMY") return "🟦 Economy";
    if (cls === "BUSINESS") return "🟨 Business";
    return "🟥 First Class";
  }

  function getCost(cls: string) {
    const userClass = user?.ticketClass || "ECONOMY";
    if (cls === "ECONOMY") return 0;
    if (cls === "BUSINESS") return userClass === "ECONOMY" ? 60 : 0;
    if (cls === "FIRST_CLASS") return userClass === "FIRST_CLASS" ? 0 : userClass === "BUSINESS" ? 90 : 90;
    return 0;
  }

  function getSeatsLeft(cls: string) {
    if (!flight) return 0;
    const booked = flight.tickets.filter((t: any) => t.class === cls).length;
    const total =
      cls === "ECONOMY" ? flight.economySeats :
      cls === "BUSINESS" ? flight.businessSeats :
      flight.firstClassSeats;
    return total - booked;
  }

  async function handleBook() {
    setBooking(true);
    setError("");
    const res = await fetch("/api/tickets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ flightId: params.id, ticketClass: selectedClass }),
    });
    const data = await res.json();
    if (res.ok) {
      setSuccess(true);
      setExistingTicket(data);
    } else {
      setError(data.error || "Something went wrong.");
    }
    setBooking(false);
  }

  async function handleCancel() {
    setBooking(true);
    setError("");
    const res = await fetch("/api/tickets", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ flightId: params.id }),
    });
    if (res.ok) {
      setExistingTicket(null);
      setSuccess(false);
    } else {
      const data = await res.json();
      setError(data.error || "Something went wrong.");
    }
    setBooking(false);
  }

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

  const classes = ["ECONOMY", "BUSINESS", "FIRST_CLASS"];

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
            <h1 className="text-2xl font-bold text-[#003b6f]">🎫 Book a Ticket</h1>
            <p className="text-gray-400 text-sm mt-1">Select your class and confirm booking</p>
          </div>

          <div className="bg-[#e8f4fd] rounded-xl p-4 flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <p className="font-bold text-[#003b6f] text-lg">{flight.flightNumber}</p>
            </div>
            <div className="flex items-center gap-2 text-gray-600 font-semibold">
              <span>{flight.departure}</span>
              <span>→</span>
              <span>{flight.arrival}</span>
            </div>
            <p className="text-gray-400 text-xs">Host: {flight.host?.username}</p>
            {flight.departureTime && (
              <p className="text-gray-500 text-xs">
                🕐 {new Date(flight.departureTime).toLocaleString([], {
                  dateStyle: "medium",
                  timeStyle: "short",
                })}
              </p>
            )}
          </div>

          <div className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-3">
            <span className="text-sm text-gray-600">Your BA Miles</span>
            <span className="font-bold text-[#075AAA]">✈ {user?.baMiles || 0} miles</span>
          </div>

          {existingTicket ? (
            <div className="flex flex-col gap-4">
              <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
                <p className="text-green-700 font-bold text-lg">✅ Booked!</p>
                <p className="text-green-600 text-sm mt-1">
                  {getClassLabel(existingTicket.class)}
                </p>
              </div>
              {flight.status === "UPCOMING" && (
                <button
                  onClick={handleCancel}
                  disabled={booking}
                  className="w-full bg-red-500 hover:bg-red-600 text-white font-bold py-3 rounded-xl transition disabled:opacity-50"
                >
                  {booking ? "Cancelling..." : "Cancel Booking"}
                </button>
              )}
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              <p className="text-sm font-semibold text-gray-600">Select Class</p>
              <div className="flex flex-col gap-2">
                {classes.map((cls) => {
                  const cost = getCost(cls);
                  const seatsLeft = getSeatsLeft(cls);
                  const unavailable = seatsLeft <= 0;
                  return (
                    <button
                      key={cls}
                      onClick={() => !unavailable && setSelectedClass(cls)}
                      disabled={unavailable}
                      className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border-2 transition ${
                        selectedClass === cls
                          ? "border-[#075AAA] bg-[#e8f4fd]"
                          : unavailable
                          ? "border-gray-100 bg-gray-50 opacity-50 cursor-not-allowed"
                          : "border-gray-200 hover:border-[#075AAA]"
                      }`}
                    >
                      <div className="flex flex-col items-start">
                        <span className="font-semibold text-gray-800">{getClassLabel(cls)}</span>
                        <span className="text-xs text-gray-400">{seatsLeft} seats left</span>
                      </div>
                      <span className={`font-bold text-sm ${cost === 0 ? "text-green-600" : "text-[#075AAA]"}`}>
                        {cost === 0 ? "FREE" : `${cost} miles`}
                      </span>
                    </button>
                  );
                })}
              </div>

              {error && <p className="text-red-500 text-sm">{error}</p>}

              <button
                onClick={handleBook}
                disabled={booking || !["UPCOMING", "BOARDING"].includes(flight.status)}
                className="w-full bg-[#075AAA] hover:bg-[#003b6f] text-white font-bold py-3 rounded-xl transition disabled:opacity-50"
              >
                {booking ? "Booking..." : `Book ${getClassLabel(selectedClass)}`}
              </button>

              {!["UPCOMING", "BOARDING"].includes(flight.status) && (
                <p className="text-gray-400 text-sm text-center">Booking is closed for this flight.</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
