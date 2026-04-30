"use client";
/**
 * Admin Winners Management
 * WHY: Admin must verify that claimed winners actually had the winning scores
 * on their official golf platform (via screenshot proof) before issuing prizes.
 * This page is the central payout control panel.
 */

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import Navbar from "@/components/layout/navbar";
import {
  ArrowLeft,
  CheckCircle,
  XCircle,
  DollarSign,
  ExternalLink,
  Filter,
} from "lucide-react";

type Winner = {
  id: string;
  draw_id: string;
  user_id: string;
  match_type: string;
  matched_numbers: number[];
  prize_amount: number;
  proof_url: string | null;
  verification_status: string;
  payout_status: string;
  created_at: string;
  profiles: { full_name: string; email: string } | null;
  draws: { title: string; draw_month: string } | null;
};

export default function AdminWinnersPage() {
  const router = useRouter();
  const supabase = createClient();
  const [winners, setWinners] = useState<Winner[]>([]);
  const [filtered, setFiltered] = useState<Winner[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<
    "all" | "pending" | "approved" | "rejected"
  >("pending");
  const [actioning, setActioning] = useState<string | null>(null);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    checkAndLoad();
  }, []);
  useEffect(() => {
    setFiltered(
      filter === "all"
        ? winners
        : winners.filter((w) => w.verification_status === filter),
    );
  }, [filter, winners]);

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
      .from("winners")
      .select("*, profiles(full_name, email), draws(title, draw_month)")
      .order("created_at", { ascending: false });

    setWinners((data as any) || []);
    setLoading(false);
  };

  const doAction = async (
    winnerId: string,
    action: "approve" | "reject" | "mark_paid",
  ) => {
    setActioning(winnerId);
    const res = await fetch("/api/admin/verify-winner", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ winnerId, action }),
    });
    const data = await res.json();
    if (data.success) {
      setMsg(`Action "${action}" applied.`);
      checkAndLoad();
    } else {
      setMsg(data.error || "Action failed");
    }
    setActioning(null);
  };

  const totalPending = winners.filter(
    (w) => w.verification_status === "pending",
  ).length;
  const totalApproved = winners.filter(
    (w) => w.verification_status === "approved",
  ).length;
  const totalPaid = winners.filter((w) => w.payout_status === "paid").length;
  const totalOutstanding = winners
    .filter(
      (w) =>
        w.verification_status === "approved" && w.payout_status === "pending",
    )
    .reduce((s, w) => s + w.prize_amount, 0);

  return (
    <div style={{ background: "var(--bg)", minHeight: "100vh" }}>
      <Navbar />

      <div
        className="max-w-6xl mx-auto px-6"
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
              Winners & Verification
            </h1>
            <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.9rem" }}>
              Review proof submissions and manage payouts
            </p>
          </div>
        </div>

        {/* Stats */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
            gap: 16,
            marginBottom: 32,
          }}
        >
          {[
            { label: "Pending Review", value: totalPending, color: "#facc15" },
            { label: "Approved", value: totalApproved, color: "#4ade80" },
            { label: "Paid Out", value: totalPaid, color: "var(--gold)" },
            {
              label: "Outstanding",
              value: `£${totalOutstanding.toFixed(2)}`,
              color: "#f87171",
            },
          ].map((s) => (
            <div
              key={s.label}
              className="stat-card"
              style={{ textAlign: "center" }}
            >
              <div
                style={{
                  fontFamily: "var(--font-clash)",
                  fontSize: "1.6rem",
                  fontWeight: 700,
                  color: s.color,
                }}
              >
                {s.value}
              </div>
              <div
                style={{
                  color: "rgba(255,255,255,0.4)",
                  fontSize: "0.78rem",
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                  marginTop: 4,
                }}
              >
                {s.label}
              </div>
            </div>
          ))}
        </div>

        {msg && (
          <div
            style={{
              background: "rgba(74,222,128,0.1)",
              border: "1px solid rgba(74,222,128,0.25)",
              borderRadius: 10,
              padding: "12px 16px",
              marginBottom: 24,
              color: "#4ade80",
              fontSize: "0.9rem",
            }}
          >
            {msg}
          </div>
        )}

        {/* Filter Tabs */}
        <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
          {(["all", "pending", "approved", "rejected"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              style={{
                padding: "8px 18px",
                borderRadius: 8,
                cursor: "pointer",
                fontSize: "0.85rem",
                border:
                  filter === f
                    ? "1px solid rgba(255,255,255,0.3)"
                    : "1px solid rgba(255,255,255,0.1)",
                background:
                  filter === f
                    ? "rgba(255,255,255,0.1)"
                    : "rgba(255,255,255,0.03)",
                color: filter === f ? "white" : "rgba(255,255,255,0.45)",
                transition: "all 0.2s",
              }}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>

        {/* Winners List */}
        {loading ? (
          <div
            style={{
              textAlign: "center",
              padding: 60,
              color: "rgba(255,255,255,0.3)",
            }}
          >
            Loading...
          </div>
        ) : filtered.length === 0 ? (
          <div
            className="glass-card"
            style={{
              padding: "48px 32px",
              textAlign: "center",
              color: "rgba(255,255,255,0.3)",
            }}
          >
            No {filter !== "all" ? filter : ""} winners to show.
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {filtered.map((w) => (
              <div key={w.id} className="glass-card" style={{ padding: 24 }}>
                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: 20,
                    justifyContent: "space-between",
                  }}
                >
                  {/* User + Draw Info */}
                  <div>
                    <div
                      style={{
                        display: "flex",
                        gap: 10,
                        alignItems: "center",
                        marginBottom: 6,
                      }}
                    >
                      <span
                        style={{
                          fontFamily: "var(--font-clash)",
                          fontWeight: 600,
                          fontSize: "1rem",
                        }}
                      >
                        {w.profiles?.full_name || "Unknown User"}
                      </span>
                      <span
                        className={`badge badge-${w.match_type === "5_match" ? "active" : w.match_type === "4_match" ? "pending" : "inactive"}`}
                        style={{
                          background:
                            w.match_type === "5_match"
                              ? "rgba(240,216,122,0.15)"
                              : undefined,
                          color:
                            w.match_type === "5_match" ? "#f0d87a" : undefined,
                        }}
                      >
                        {w.match_type.replace("_", "-")}
                      </span>
                    </div>
                    <div
                      style={{
                        color: "rgba(255,255,255,0.4)",
                        fontSize: "0.82rem",
                        marginBottom: 8,
                      }}
                    >
                      {w.profiles?.email} · {w.draws?.title}
                    </div>
                    {/* Matched numbers */}
                    {w.matched_numbers?.length > 0 && (
                      <div
                        style={{
                          display: "flex",
                          gap: 6,
                          alignItems: "center",
                        }}
                      >
                        <span
                          style={{
                            color: "rgba(255,255,255,0.3)",
                            fontSize: "0.75rem",
                            marginRight: 2,
                          }}
                        >
                          Matched:
                        </span>
                        {w.matched_numbers.map((n) => (
                          <div
                            key={n}
                            style={{
                              width: 28,
                              height: 28,
                              borderRadius: 6,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              background: "rgba(201,168,76,0.12)",
                              color: "var(--gold)",
                              border: "1px solid rgba(201,168,76,0.25)",
                              fontFamily: "var(--font-clash)",
                              fontWeight: 700,
                              fontSize: "0.8rem",
                            }}
                          >
                            {n}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Prize + Status + Proof */}
                  <div style={{ textAlign: "right" }}>
                    <div
                      style={{
                        fontFamily: "var(--font-clash)",
                        fontSize: "1.8rem",
                        fontWeight: 700,
                        color: "var(--gold)",
                        marginBottom: 8,
                      }}
                    >
                      £{w.prize_amount.toFixed(2)}
                    </div>
                    <div
                      style={{
                        display: "flex",
                        gap: 6,
                        justifyContent: "flex-end",
                        flexWrap: "wrap",
                        marginBottom: 12,
                      }}
                    >
                      <span
                        className={`badge badge-${w.verification_status === "approved" ? "active" : w.verification_status === "rejected" ? "rejected" : "pending"}`}
                      >
                        {w.verification_status}
                      </span>
                      <span
                        className={`badge badge-${w.payout_status === "paid" ? "paid" : "pending"}`}
                      >
                        {w.payout_status}
                      </span>
                    </div>

                    {/* Proof image link */}
                    {w.proof_url ? (
                      <a
                        href={w.proof_url}
                        target="_blank"
                        rel="noopener"
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 6,
                          color: "#60a5fa",
                          fontSize: "0.82rem",
                          textDecoration: "none",
                          marginBottom: 12,
                        }}
                      >
                        <ExternalLink size={12} /> View Proof Screenshot
                      </a>
                    ) : (
                      <div
                        style={{
                          color: "rgba(255,255,255,0.25)",
                          fontSize: "0.82rem",
                          marginBottom: 12,
                        }}
                      >
                        No proof uploaded yet
                      </div>
                    )}

                    {/* Actions */}
                    <div
                      style={{
                        display: "flex",
                        gap: 8,
                        justifyContent: "flex-end",
                        flexWrap: "wrap",
                      }}
                    >
                      {w.verification_status === "pending" && w.proof_url && (
                        <>
                          <button
                            onClick={() => doAction(w.id, "approve")}
                            disabled={actioning === w.id}
                            className="btn-primary"
                            style={{
                              padding: "7px 14px",
                              fontSize: "0.8rem",
                              color: "#4ade80",
                              borderColor: "rgba(74,222,128,0.25)",
                            }}
                          >
                            <CheckCircle size={13} /> Approve
                          </button>
                          <button
                            onClick={() => doAction(w.id, "reject")}
                            disabled={actioning === w.id}
                            style={{
                              padding: "7px 14px",
                              fontSize: "0.8rem",
                              background: "rgba(248,113,113,0.08)",
                              border: "1px solid rgba(248,113,113,0.2)",
                              borderRadius: 8,
                              color: "#f87171",
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center",
                              gap: 6,
                            }}
                          >
                            <XCircle size={13} /> Reject
                          </button>
                        </>
                      )}
                      {w.verification_status === "approved" &&
                        w.payout_status === "pending" && (
                          <button
                            onClick={() => doAction(w.id, "mark_paid")}
                            disabled={actioning === w.id}
                            className="btn-gold"
                            style={{ padding: "7px 14px", fontSize: "0.8rem" }}
                          >
                            <DollarSign size={13} /> Mark Paid
                          </button>
                        )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
