"use client";
/**
 * FIXED: Was calling supabase anon client directly — RLS blocked all rows.
 * Now calls /api/admin/users which runs with SERVICE ROLE key server-side.
 */
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import Navbar from "@/components/layout/navbar";
import { ArrowLeft, Search } from "lucide-react";

type UserRow = {
  id: string;
  email: string;
  full_name: string | null;
  role: string;
  score_count: number;
  charity_contribution_pct: number;
  created_at: string;
  charities: { id: string; name: string } | null;
  subscriptions: {
    id: string;
    plan: string;
    status: string;
    amount_pence: number;
    renewal_date: string | null;
  }[];
};

export default function AdminUsersPage() {
  const router = useRouter();
  const supabase = createClient();
  const [users, setUsers] = useState<UserRow[]>([]);
  const [filtered, setFiltered] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const hasLoaded = useRef(false);

  useEffect(() => {
    if (hasLoaded.current) return;
    hasLoaded.current = true;
    load();
  }, []);

  useEffect(() => {
    let result = users;
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (u) =>
          u.email.toLowerCase().includes(q) ||
          (u.full_name?.toLowerCase() || "").includes(q),
      );
    }
    if (statusFilter !== "all") {
      result = result.filter((u) => {
        const sub = u.subscriptions?.[0];
        if (statusFilter === "none") return !sub;
        return sub?.status === statusFilter;
      });
    }
    setFiltered(result);
  }, [search, statusFilter, users]);

  const load = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      router.push("/login");
      return;
    }

    // Call server API — uses SERVICE ROLE key, bypasses RLS
    const res = await fetch("/api/admin/users");
    if (res.status === 401 || res.status === 403) {
      router.push("/dashboard");
      return;
    }
    if (!res.ok) {
      setError("Failed to load users — check console");
      setLoading(false);
      return;
    }

    const data = await res.json();
    setUsers(data.users || []);
    setLoading(false);
  };

  const subStatus = (u: UserRow) => u.subscriptions?.[0]?.status || "none";
  const activeCount = users.filter(
    (u) => u.subscriptions?.[0]?.status === "active",
  ).length;
  const noSubCount = users.filter((u) => !u.subscriptions?.length).length;
  const drawEligible = users.filter((u) => u.score_count >= 3).length;

  return (
    <div style={{ background: "var(--bg)", minHeight: "100vh" }}>
      <Navbar />
      <div
        className="max-w-7xl mx-auto px-6"
        style={{ paddingTop: 100, paddingBottom: 60 }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 14,
            marginBottom: 36,
          }}
        >
          <Link
            href="/admin"
            style={{ color: "rgba(255,255,255,0.4)", textDecoration: "none" }}
          >
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h1
              style={{
                fontFamily: "var(--font-clash)",
                fontSize: "2rem",
                fontWeight: 700,
              }}
            >
              User Management
            </h1>
            <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.9rem" }}>
              {loading
                ? "Loading..."
                : `${users.length} total · ${activeCount} active sub · ${drawEligible} draw-eligible (3+ scores)`}
            </p>
          </div>
        </div>

        {error && (
          <div
            style={{
              background: "rgba(248,113,113,0.1)",
              border: "1px solid rgba(248,113,113,0.25)",
              borderRadius: 10,
              padding: "14px 18px",
              marginBottom: 24,
              color: "#f87171",
            }}
          >
            {error}
          </div>
        )}

        <div
          style={{
            display: "flex",
            gap: 12,
            marginBottom: 24,
            flexWrap: "wrap",
          }}
        >
          <div style={{ position: "relative", flex: 1, minWidth: 220 }}>
            <Search
              size={15}
              style={{
                position: "absolute",
                left: 14,
                top: "50%",
                transform: "translateY(-50%)",
                color: "rgba(255,255,255,0.3)",
                pointerEvents: "none",
              }}
            />
            <input
              type="text"
              className="glass-input"
              placeholder="Search name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ paddingLeft: 42 }}
            />
          </div>
          <select
            className="glass-input"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{ width: 210, cursor: "pointer" }}
          >
            <option value="all">All users ({users.length})</option>
            <option value="active">Active subscription ({activeCount})</option>
            <option value="cancelled">Cancelled</option>
            <option value="lapsed">Lapsed</option>
            <option value="none">No subscription ({noSubCount})</option>
          </select>
        </div>

        <div className="glass-card" style={{ overflow: "hidden" }}>
          <div style={{ overflowX: "auto" }}>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                minWidth: 720,
              }}
              className="glass-table"
            >
              <thead>
                <tr>
                  <th style={{ textAlign: "left" }}>User</th>
                  <th style={{ textAlign: "left" }}>Subscription</th>
                  <th style={{ textAlign: "left" }}>Plan</th>
                  <th style={{ textAlign: "center" }}>Scores</th>
                  <th style={{ textAlign: "left" }}>Charity</th>
                  <th style={{ textAlign: "left" }}>Joined</th>
                  <th style={{ textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td
                      colSpan={7}
                      style={{
                        textAlign: "center",
                        padding: 48,
                        color: "rgba(255,255,255,0.3)",
                      }}
                    >
                      Loading users...
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      style={{
                        textAlign: "center",
                        padding: 48,
                        color: "rgba(255,255,255,0.3)",
                      }}
                    >
                      {search
                        ? `No users matching "${search}"`
                        : "No users found"}
                    </td>
                  </tr>
                ) : (
                  filtered.map((u) => {
                    const st = subStatus(u);
                    const sub = u.subscriptions?.[0];
                    return (
                      <tr key={u.id}>
                        <td>
                          <div style={{ fontWeight: 500 }}>
                            {u.full_name || (
                              <span
                                style={{
                                  color: "rgba(255,255,255,0.3)",
                                  fontStyle: "italic",
                                }}
                              >
                                No name
                              </span>
                            )}
                          </div>
                          <div
                            style={{
                              color: "rgba(255,255,255,0.4)",
                              fontSize: "0.8rem",
                            }}
                          >
                            {u.email}
                          </div>
                          {u.role === "admin" && (
                            <span
                              className="badge"
                              style={{
                                background: "rgba(201,168,76,0.12)",
                                color: "var(--gold)",
                                border: "1px solid rgba(201,168,76,0.2)",
                                marginTop: 4,
                                display: "inline-block",
                              }}
                            >
                              admin
                            </span>
                          )}
                        </td>
                        <td>
                          <span
                            className={`badge ${st === "active" ? "badge-active" : st === "none" ? "badge-inactive" : "badge-pending"}`}
                          >
                            {st}
                          </span>
                        </td>
                        <td
                          style={{
                            color: "rgba(255,255,255,0.6)",
                            fontSize: "0.9rem",
                          }}
                        >
                          {sub ? (
                            sub.plan.charAt(0).toUpperCase() + sub.plan.slice(1)
                          ) : (
                            <span style={{ color: "rgba(255,255,255,0.2)" }}>
                              —
                            </span>
                          )}
                        </td>
                        <td style={{ textAlign: "center" }}>
                          <span
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              justifyContent: "center",
                              width: 36,
                              height: 36,
                              borderRadius: 8,
                              fontFamily: "var(--font-clash)",
                              fontWeight: 700,
                              fontSize: "0.9rem",
                              background:
                                u.score_count >= 3
                                  ? "rgba(74,222,128,0.1)"
                                  : u.score_count > 0
                                    ? "rgba(250,204,21,0.1)"
                                    : "rgba(255,255,255,0.04)",
                              color:
                                u.score_count >= 3
                                  ? "#4ade80"
                                  : u.score_count > 0
                                    ? "#facc15"
                                    : "rgba(255,255,255,0.25)",
                              border: `1px solid ${u.score_count >= 3 ? "rgba(74,222,128,0.2)" : u.score_count > 0 ? "rgba(250,204,21,0.2)" : "rgba(255,255,255,0.06)"}`,
                            }}
                            title={
                              u.score_count >= 3
                                ? "Draw eligible"
                                : "Needs 3+ scores"
                            }
                          >
                            {u.score_count}
                          </span>
                        </td>
                        <td
                          style={{
                            color: "rgba(255,255,255,0.55)",
                            fontSize: "0.85rem",
                          }}
                        >
                          {u.charities?.name || (
                            <span style={{ color: "rgba(255,255,255,0.2)" }}>
                              None
                            </span>
                          )}
                        </td>
                        <td
                          style={{
                            color: "rgba(255,255,255,0.4)",
                            fontSize: "0.82rem",
                          }}
                        >
                          {new Date(u.created_at).toLocaleDateString("en-GB", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </td>
                        <td style={{ textAlign: "right" }}>
                          <Link
                            href={`/admin/users/${u.id}`}
                            className="btn-primary"
                            style={{ padding: "6px 14px", fontSize: "0.8rem" }}
                          >
                            View →
                          </Link>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
          {!loading && (
            <div
              style={{
                padding: "12px 20px",
                borderTop: "1px solid rgba(255,255,255,0.06)",
                display: "flex",
                gap: 24,
                color: "rgba(255,255,255,0.3)",
                fontSize: "0.8rem",
                flexWrap: "wrap",
              }}
            >
              <span>
                Showing {filtered.length} / {users.length}
              </span>
              <span style={{ color: "#4ade80" }}>🟢 Active: {activeCount}</span>
              <span style={{ color: "#f87171" }}>🔴 No sub: {noSubCount}</span>
              <span style={{ color: "#facc15" }}>
                ⭐ Draw eligible: {drawEligible}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
