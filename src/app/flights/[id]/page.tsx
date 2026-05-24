"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";

export default function ManageFlightPage({ params }: { params: { id: string } }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [flight, setFlight] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

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
    }
  }, [status, params.id]);

  async function updateStatus(newStatus: string) {
    setUpdating(true);
    await fetch(`/api/flights/${params.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    setFlight((prev: any) => ({ ...prev, status: newStatus }));
    setUpdating(false);
    if (newStatus === "LANDED" || newStatus === "CANCELLED") {
      router.push("/dashboard");
    }
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

  const statusColor: Record<string, string> = {
    BOARDING: "bg-yellow-100 text-yellow-800",
    IN_FLIGHT: "bg-blue-100 text-blue-800",
    LANDED: "bg-green-100 text-green-800",
    CANCELLED: "bg-red-100 text-red-800",
  };

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
            <h1 className="text-2xl font-bold text-[#003b6f]">Manage Flight</h1>
            <p className="text-gray-400 text-sm mt-1">Update the status of this flight</p>
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <p className="text-2xl font-bold text-[#075AAA]">{flight.flightNumber}</p>
              <span className={`text-xs px-3 py-1 rounded-full font-semibold ${statusColor[flight.status]}`}>
                {flight.status}
              </span>
            </div>
            <p className="text-gray-500">{flight.route}</p>
            <p className="text-gray-400 text-sm">Host: {flight.host?.username}</p>
          </div>

          <div className="border-t border-gray-100 pt-4 flex flex-col gap-3">
            <p className="text-sm font-semibold text-gray-600">Update Status</p>

            {flight.status === "BOARDING" && (
              <button
                onClick={() => updateStatus("IN_FLIGHT")}
                disabled={updating}
                className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 rounded-xl transition disabled:opacity-50"
              >
                🛫 Mark as In Flight
              </button>
            )}

            {flight.status === "IN_FLIGHT" && (
              <button
                onClick={() => updateStatus("LANDED")}
                disabled={updating}
                className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-3 rounded-xl transition disabled:opacity-50"
              >
                🛬 Mark as Landed
              </button>
            )}

            {flight.status !== "LANDED" && flight.status !== "CANCELLED" && (
              <button
                onClick={() => updateStatus("CANCELLED")}
                disabled={updating}
                className="w-full bg-red-500 hover:bg-red-600 text-white font-bold py-3 rounded-xl transition disabled:opacity-50"
              >
                ❌ Cancel Flight
              </button>
            )}

            {(flight.status === "LANDED" || flight.status === "CANCELLED") && (
              <p className="text-gray-400 text-center text-sm">This flight is closed.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
