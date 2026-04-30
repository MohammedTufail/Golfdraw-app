"use client";
/**
 * Admin Users Management
 * WHY: Admins need visibility into all user accounts —
 * to manage subscriptions, fix score issues, verify activity.
 * Uses service role via API routes for sensitive operations.
 */

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import Navbar from "@/components/layout/navbar";
import { ArrowLeft, Search, ChevronDown, Users } from "lucide-react";

type UserRow = {
  id: string;
  email: string;
  full_name: string | null;
  role: string;
  created_at: string;
  charities: { name: string } | null;
  subscriptions: {
    plan: string;
    status: string;
    renewal_date: string | null;
  }[];
};

export default function AdminUsersPage() {
  const router = useRouter();
  const supabase = createClient();
  const [users, setUsers] = useState<UserRow[]>([]);
  const [filtered, setFiltered] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    checkAndLoad();
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
        return sub?.status === statusFilter;
      });
    }
    setFiltered(result);
  }, [search, statusFilter, users]);

  const checkAndLoad = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      router.push("/login");
      return;
    }
    const { data: p } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();
    if (p?.role !== "admin") {
      router.push("/dashboard");
      return;
    }

    const { data } = await supabase
      .from("profiles")
      .select("*, charities(name), subscriptions(plan, status, renewal_date)")
      .order("created_at", { ascending: false });

    setUsers((data as any) || []);
    setLoading(false);
  };

  const subStatus = (user: UserRow) => {
    const sub = user.subscriptions?.[0];
    if (!sub) return "none";
    return sub.status;
  };

  return (
    <div style={{ background: "var(--bg)", minHeight: "100vh" }}>
      <Navbar />

      <div
        className="max-w-7xl mx-auto px-6"
        style={{ paddingTop: 100, paddingBottom: 60 }}
      >
        {/* Header */}
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
              {users.length} total users
            </p>
          </div>
        </div>

        {/* Filters */}
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
              }}
            />
            <input
              type="text"
              className="glass-input"
              placeholder="Search by name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ paddingLeft: 42 }}
            />
          </div>
          <select
            className="glass-input"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{ width: 180, cursor: "pointer" }}
          >
            <option value="all">All Statuses</option>
            <option value="active">Active</option>
            <option value="cancelled">Cancelled</option>
            <option value="lapsed">Lapsed</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>

        {/* Table */}
        <div className="glass-card" style={{ overflow: "hidden" }}>
          <div style={{ overflowX: "auto" }}>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                minWidth: 700,
              }}
              className="glass-table"
            >
              <thead>
                <tr>
                  <th style={{ textAlign: "left" }}>User</th>
                  <th style={{ textAlign: "left" }}>Subscription</th>
                  <th style={{ textAlign: "left" }}>Plan</th>
                  <th style={{ textAlign: "left" }}>Charity</th>
                  <th style={{ textAlign: "left" }}>Renewal</th>
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
                        padding: 40,
                        color: "rgba(255,255,255,0.3)",
                      }}
                    >
                      Loading...
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      style={{
                        textAlign: "center",
                        padding: 40,
                        color: "rgba(255,255,255,0.3)",
                      }}
                    >
                      No users found
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
                            {u.full_name || "—"}
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
                              }}
                            >
                              admin
                            </span>
                          )}
                        </td>
                        <td>
                          <span
                            className={`badge badge-${st === "active" ? "active" : st === "none" ? "inactive" : "pending"}`}
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
                          {sub
                            ? sub.plan.charAt(0).toUpperCase() +
                              sub.plan.slice(1)
                            : "—"}
                        </td>
                        <td
                          style={{
                            color: "rgba(255,255,255,0.6)",
                            fontSize: "0.85rem",
                          }}
                        >
                          {(u as any).charities?.name || (
                            <span style={{ color: "rgba(255,255,255,0.25)" }}>
                              None
                            </span>
                          )}
                        </td>
                        <td
                          style={{
                            color: "rgba(255,255,255,0.5)",
                            fontSize: "0.85rem",
                          }}
                        >
                          {sub?.renewal_date
                            ? new Date(sub.renewal_date).toLocaleDateString(
                                "en-GB",
                                {
                                  day: "numeric",
                                  month: "short",
                                  year: "numeric",
                                },
                              )
                            : "—"}
                        </td>
                        <td
                          style={{
                            color: "rgba(255,255,255,0.4)",
                            fontSize: "0.8rem",
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
                            View
                          </Link>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Stats footer */}
        <div
          style={{
            display: "flex",
            gap: 24,
            marginTop: 20,
            color: "rgba(255,255,255,0.3)",
            fontSize: "0.85rem",
            flexWrap: "wrap",
          }}
        >
          <span>
            Active:{" "}
            {
              users.filter((u) => u.subscriptions?.[0]?.status === "active")
                .length
            }
          </span>
          <span>
            Cancelled:{" "}
            {
              users.filter((u) => u.subscriptions?.[0]?.status === "cancelled")
                .length
            }
          </span>
          <span>
            No sub: {users.filter((u) => !u.subscriptions?.[0]).length}
          </span>
          <span>
            Showing {filtered.length} of {users.length}
          </span>
        </div>
      </div>
    </div>
  );
}
