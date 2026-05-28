"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";

export default function AdminPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [editingMiles, setEditingMiles] = useState<string | null>(null);
  const [milesInput, setMilesInput] = useState<string>("");

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
    if (status === "authenticated") {
      const user = session.user as any;
      if (user.role !== "ADMIN") router.push("/dashboard");
    }
  }, [status, session, router]);

  useEffect(() => {
    if (status === "authenticated") {
      fetch("/api/admin/users")
        .then((r) => r.json())
        .then((data) => {
          setUsers(data);
          setLoading(false);
        });
    }
  }, [status]);

  async function updateRole(userId: string, role: string) {
    setUpdating(userId);
    await fetch("/api/admin/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, role }),
    });
    setUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, role } : u))
    );
    setUpdating(null);
  }

  async function updateMiles(userId: string) {
    const miles = parseInt(milesInput);
    if (isNaN(miles) || miles < 0) return;
    setUpdating(userId);
    await fetch("/api/admin/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, baMiles: miles }),
    });
    setUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, baMiles: miles } : u))
    );
    setEditingMiles(null);
    setMilesInput("");
    setUpdating(null);
  }

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#003b6f]">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  const roleColor: Record<string, string> = {
    MEMBER: "bg-gray-100 text-gray-700",
    HOST: "bg-blue-100 text-blue-700",
    ADMIN: "bg-purple-100 text-purple-700",
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

      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="bg-white rounded-2xl shadow p-6">
          <h1 className="text-2xl font-bold text-[#003b6f] mb-1">⚙️ Admin Panel</h1>
          <p className="text-gray-400 text-sm mb-6">Manage user roles and BA Miles</p>

          {loading ? (
            <p className="text-gray-400">Loading users...</p>
          ) : users.length === 0 ? (
            <p className="text-gray-400">No users found.</p>
          ) : (
            <div className="flex flex-col gap-3">
              {users.map((u) => (
                <div
                  key={u.id}
                  className="border border-gray-100 rounded-xl p-4 flex flex-col gap-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {u.avatar && (
                        <img src={u.avatar} alt="avatar" className="w-10 h-10 rounded-full" />
                      )}
                      <div>
                        <p className="font-semibold text-[#003b6f]">{u.username}</p>
                        <p className="text-gray-400 text-xs">
                          Joined {new Date(u.createdAt).toLocaleDateString("en-GB")}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs px-2 py-1 rounded-full font-semibold ${roleColor[u.role]}`}>
                        {u.role}
                      </span>
                      <select
                        value={u.role}
                        disabled={updating === u.id}
                        onChange={(e) => updateRole(u.id, e.target.value)}
                        className="text-sm border border-gray-200 rounded-lg px-2 py-1 text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#075AAA] disabled:opacity-50"
                      >
                        <option value="MEMBER">Member</option>
                        <option value="HOST">Host</option>
                        <option value="ADMIN">Admin</option>
                      </select>
                    </div>
                  </div>

                  {/* BA Miles Row */}
                  <div className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-500">✈ BA Miles</span>
                      <span className="font-bold text-[#075AAA]">{u.baMiles}</span>
                    </div>
                    {editingMiles === u.id ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min={0}
                          value={milesInput}
                          onChange={(e) => setMilesInput(e.target.value)}
                          className="w-24 border border-gray-200 rounded-lg px-2 py-1 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#075AAA]"
                          placeholder={String(u.baMiles)}
                          autoFocus
                        />
                        <button
                          onClick={() => updateMiles(u.id)}
                          disabled={updating === u.id}
                          className="bg-[#075AAA] text-white text-xs font-bold px-3 py-1 rounded-lg hover:bg-[#003b6f] transition disabled:opacity-50"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => { setEditingMiles(null); setMilesInput(""); }}
                          className="bg-gray-200 text-gray-600 text-xs font-bold px-3 py-1 rounded-lg hover:bg-gray-300 transition"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => { setEditingMiles(u.id); setMilesInput(String(u.baMiles)); }}
                        className="text-xs text-[#075AAA] font-semibold hover:underline"
                      >
                        Edit Miles
                      </button>
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
