"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";

export default function LogsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  useEffect(() => {
    if (status === "authenticated") {
      fetch("/api/logs")
        .then((r) => r.json())
        .then((data) => {
          setLogs(data);
          setLoading(false);
        });
    }
  }, [status]);

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#003b6f]">
        <div className="text-white text-xl">Loading...</div>
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
          ← Back
        </Link>
      </nav>

      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="bg-white rounded-2xl shadow p-6">
          <h1 className="text-2xl font-bold text-[#003b6f] mb-1">📋 Flight Logs</h1>
          <p className="text-gray-400 text-sm mb-6">
            {user?.role === "ADMIN" ? "All flight logs" : "Your flight history"}
          </p>

          {loading ? (
            <p className="text-gray-400">Loading logs...</p>
          ) : logs.length === 0 ? (
            <p className="text-gray-400">No flight logs yet.</p>
          ) : (
            <div className="flex flex-col gap-3">
              {logs.map((log) => (
                <div
                  key={log.id}
                  className="flex items-center justify-between border border-gray-100 rounded-xl p-4"
                >
                  <div>
                    <p className="font-bold text-[#003b6f]">
                      {log.flight?.flightNumber}
                    </p>
                    <p className="text-gray-500 text-sm">{log.flight?.route}</p>
                    {user?.role === "ADMIN" && (
                      <p className="text-gray-400 text-xs">
                        Passenger: {log.user?.username}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-400">
                      {new Date(log.loggedAt).toLocaleDateString("en-GB", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </p>
                    <p className="text-xs text-green-600 font-semibold mt-1">
                      ✅ Completed
                    </p>
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
