"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  useEffect(() => {
    if (status === "authenticated") {
      fetch("/api/tickets")
        .then((res) => res.json())
        .then((data) => {
          setTickets(data || []);
          setLoading(false);
        });
    }
  }, [status]);

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#003b6f]">
        <div className="text-white text-xl">Loading profile…</div>
      </div>
    );
  }

  const user = session?.user as any;

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
          ← Back to Dashboard
        </Link>
      </nav>

      <div className="max-w-4xl mx-auto px-4 py-10 flex flex-col gap-6">
        <div className="bg-white rounded-3xl shadow-lg p-8">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm text-gray-500">Your profile</p>
              <h1 className="text-3xl font-bold text-[#003b6f]">{user?.name || "Passenger"}</h1>
              <p className="text-sm text-gray-500 mt-1">{user?.email}</p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              {user?.avatar && (
                <img src={user.avatar} alt="Avatar" className="w-20 h-20 rounded-full border-4 border-[#075AAA]" />
              )}
              <div className="rounded-2xl bg-[#eef6ff] px-5 py-4">
                <p className="text-xs uppercase tracking-[0.2em] text-[#075AAA]">BA Miles</p>
                <p className="text-3xl font-bold text-[#003b6f]">✈ {user?.baMiles || 0}</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 mt-6">
            <div className="rounded-2xl bg-[#f8fafc] p-5">
              <p className="text-sm text-gray-500">Role</p>
              <p className="mt-2 font-semibold text-gray-800">{user?.role}</p>
            </div>
            <div className="rounded-2xl bg-[#f8fafc] p-5">
              <p className="text-sm text-gray-500">Bookings</p>
              <p className="mt-2 font-semibold text-gray-800">{tickets.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-3xl shadow-lg p-8">
          <div className="flex items-center justify-between gap-4 mb-6">
            <div>
              <h2 className="text-2xl font-bold text-[#003b6f]">Your bookings</h2>
              <p className="text-sm text-gray-500">Recent flights you’ve booked.</p>
            </div>
            <span className="text-sm text-gray-500">{tickets.length} booking{tickets.length !== 1 ? "s" : ""}</span>
          </div>

          {tickets.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-gray-200 p-10 text-center text-gray-500">
              You don’t have any bookings yet. Browse flights from the dashboard to book.
            </div>
          ) : (
            <div className="grid gap-4">
              {tickets.map((ticket) => (
                <div key={ticket.id} className="rounded-3xl border border-gray-100 p-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-gray-500">{ticket.flight?.flightNumber}</p>
                    <p className="text-xl font-semibold text-[#003b6f]">{ticket.flight?.departure} → {ticket.flight?.arrival}</p>
                    <p className="text-sm text-gray-500 mt-1">{ticket.flight?.route || `${ticket.flight?.departure} → ${ticket.flight?.arrival}`}</p>
                    <p className="text-sm text-gray-500">Status: {ticket.flight?.status}</p>
                  </div>
                  <div className="flex flex-col gap-2 text-right">
                    <span className="text-sm text-gray-500">Class</span>
                    <span className="font-semibold text-[#075AAA]">{ticket.class}</span>
                    <span className="text-xs text-gray-400">Booked {new Date(ticket.bookedAt).toLocaleDateString("en-GB")}</span>
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
