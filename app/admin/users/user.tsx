"use client";
/**
 * Admin User Detail Page — /admin/users/[userId]
 * WHY: Lets admin view and edit a specific user's profile, scores,
 * subscription status, and winners — all in one place.
 * Admin can also edit golf scores directly on behalf of the user.
 */

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import Navbar from "@/components/layout/navbar";
import { ArrowLeft, Edit2, Save, X, Trash2 } from "lucide-react";

export default function AdminUserDetailPage() {
  const router = useRouter();
  const params = useParams();
  const userId = params.userId as string;
  const supabase = createClient();

  const [profile, setProfile] = useState<any>(null);
  const [sub, setSub] = useState<any>(null);
  const [scores, setScores] = useState<any[]>([]);
  const [winners, setWinners] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editScore, setEditScore] = useState<{
    id: string;
    score: string;
  } | null>(null);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    checkAndLoad();
  }, []);

  const checkAndLoad = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      router.push("/login");
      return;
    }
    const { data: me } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();
    if (me?.role !== "admin") {
      router.push("/dashboard");
      return;
    }

    const [pRes, scRes, wRes] = await Promise.all([
      supabase
        .from("profiles")
        .select("*, charities(name), subscriptions(*)")
        .eq("id", userId)
        .single(),
      supabase
        .from("scores")
        .select("*")
        .eq("user_id", userId)
        .order("score_date", { ascending: false }),
      supabase
        .from("winners")
        .select("*, draws(title, draw_month)")
        .eq("user_id", userId),
    ]);

    setProfile(pRes.data);
    setSub((pRes.data as any)?.subscriptions?.[0] || null);
    setScores(scRes.data || []);
    setWinners((wRes.data as any) || []);
    setLoading(false);
  };

  const saveScore = async () => {
    if (!editScore) return;
    setSaving(true);
    const score = parseInt(editScore.score);
    if (score < 1 || score > 45) {
      setMsg("Score must be 1–45");
      setSaving(false);
      return;
    }
    await supabase
      .from("scores")
      .update({ stableford_score: score, updated_at: new Date().toISOString() })
      .eq("id", editScore.id);
    setEditScore(null);
    setMsg("Score updated.");
    checkAndLoad();
    setSaving(false);
  };

  const deleteScore = async (id: string) => {
    if (!confirm("Delete this score?")) return;
    await supabase.from("scores").delete().eq("id", id);
    setMsg("Score deleted.");
    checkAndLoad();
  };

  const toggleSubStatus = async (newStatus: string) => {
    if (!sub) return;
    await supabase
      .from("subscriptions")
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq("id", sub.id);
    setMsg(`Subscription set to ${newStatus}.`);
    checkAndLoad();
  };

  if (loading)
    return (
      <div
        style={{
          background: "var(--bg)",
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Navbar />
        <p style={{ color: "rgba(255,255,255,0.3)" }}>Loading...</p>
      </div>
    );

  return (
    <div style={{ background: "var(--bg)", minHeight: "100vh" }}>
      <Navbar />

      <div
        className="max-w-4xl mx-auto px-6"
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
            href="/admin/users"
            style={{ color: "rgba(255,255,255,0.4)", textDecoration: "none" }}
          >
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h1
              style={{
                fontFamily: "var(--font-clash)",
                fontSize: "1.8rem",
                fontWeight: 700,
              }}
            >
              {profile?.full_name || "User"}
            </h1>
            <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.9rem" }}>
              {profile?.email}
            </p>
          </div>
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

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
            gap: 24,
          }}
        >
          {/* Profile & Sub */}
          <div className="glass-card" style={{ padding: 24 }}>
            <h2
              style={{
                fontFamily: "var(--font-clash)",
                fontWeight: 600,
                marginBottom: 16,
                fontSize: "1.1rem",
              }}
            >
              Subscription
            </h2>
            {sub ? (
              <div
                style={{ display: "flex", flexDirection: "column", gap: 10 }}
              >
                {[
                  { label: "Plan", value: sub.plan },
                  {
                    label: "Status",
                    value: (
                      <span
                        className={`badge badge-${sub.status === "active" ? "active" : "inactive"}`}
                      >
                        {sub.status}
                      </span>
                    ),
                  },
                  {
                    label: "Amount",
                    value: `£${(sub.amount_pence / 100).toFixed(2)}`,
                  },
                  {
                    label: "Renewal",
                    value: sub.renewal_date
                      ? new Date(sub.renewal_date).toLocaleDateString("en-GB")
                      : "—",
                  },
                ].map((row) => (
                  <div
                    key={row.label}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      fontSize: "0.9rem",
                    }}
                  >
                    <span style={{ color: "rgba(255,255,255,0.4)" }}>
                      {row.label}
                    </span>
                    <span>{row.value}</span>
                  </div>
                ))}
                <div
                  style={{
                    borderTop: "1px solid rgba(255,255,255,0.07)",
                    paddingTop: 12,
                    display: "flex",
                    gap: 8,
                    flexWrap: "wrap",
                  }}
                >
                  {["active", "cancelled", "lapsed"].map((s) => (
                    <button
                      key={s}
                      onClick={() => toggleSubStatus(s)}
                      className="btn-primary"
                      style={{
                        padding: "6px 12px",
                        fontSize: "0.78rem",
                        opacity: sub.status === s ? 0.4 : 1,
                      }}
                      disabled={sub.status === s}
                    >
                      Set {s}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <p style={{ color: "rgba(255,255,255,0.3)", fontSize: "0.9rem" }}>
                No subscription found.
              </p>
            )}

            <div
              style={{
                borderTop: "1px solid rgba(255,255,255,0.07)",
                marginTop: 20,
                paddingTop: 16,
              }}
            >
              <h3
                style={{
                  fontFamily: "var(--font-clash)",
                  fontWeight: 600,
                  marginBottom: 10,
                  fontSize: "0.95rem",
                }}
              >
                Charity
              </h3>
              <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "0.9rem" }}>
                {(profile as any)?.charities?.name || "None selected"}
              </p>
              <p style={{ color: "rgba(255,255,255,0.3)", fontSize: "0.8rem" }}>
                Contribution: {profile?.charity_contribution_pct || 10}%
              </p>
            </div>
          </div>

          {/* Scores */}
          <div className="glass-card" style={{ padding: 24 }}>
            <h2
              style={{
                fontFamily: "var(--font-clash)",
                fontWeight: 600,
                marginBottom: 16,
                fontSize: "1.1rem",
              }}
            >
              Scores ({scores.length}/5)
            </h2>
            {scores.length === 0 ? (
              <p style={{ color: "rgba(255,255,255,0.3)", fontSize: "0.9rem" }}>
                No scores on record.
              </p>
            ) : (
              <div
                style={{ display: "flex", flexDirection: "column", gap: 10 }}
              >
                {scores.map((s) => (
                  <div
                    key={s.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      padding: "10px 14px",
                      borderRadius: 10,
                      background: "rgba(255,255,255,0.03)",
                      border: "1px solid rgba(255,255,255,0.06)",
                    }}
                  >
                    <span
                      style={{
                        color: "rgba(255,255,255,0.4)",
                        fontSize: "0.85rem",
                        flex: 1,
                      }}
                    >
                      {new Date(s.score_date).toLocaleDateString("en-GB", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                    {editScore?.id === s.id ? (
                      <div
                        style={{
                          display: "flex",
                          gap: 8,
                          alignItems: "center",
                        }}
                      >
                        <input
                          type="number"
                          min={1}
                          max={45}
                          value={editScore.score}
                          onChange={(e) =>
                            setEditScore({
                              ...editScore,
                              score: e.target.value,
                            })
                          }
                          style={{
                            width: 60,
                            background: "rgba(255,255,255,0.08)",
                            border: "1px solid rgba(255,255,255,0.2)",
                            borderRadius: 6,
                            padding: "4px 8px",
                            color: "white",
                            fontSize: "0.9rem",
                          }}
                        />
                        <button
                          onClick={saveScore}
                          disabled={saving}
                          style={{
                            background: "none",
                            border: "none",
                            color: "#4ade80",
                            cursor: "pointer",
                          }}
                        >
                          <Save size={14} />
                        </button>
                        <button
                          onClick={() => setEditScore(null)}
                          style={{
                            background: "none",
                            border: "none",
                            color: "rgba(255,255,255,0.4)",
                            cursor: "pointer",
                          }}
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ) : (
                      <div
                        style={{
                          display: "flex",
                          gap: 8,
                          alignItems: "center",
                        }}
                      >
                        <span
                          style={{
                            fontFamily: "var(--font-clash)",
                            fontWeight: 700,
                            fontSize: "1.1rem",
                          }}
                        >
                          {s.stableford_score}
                        </span>
                        <button
                          onClick={() =>
                            setEditScore({
                              id: s.id,
                              score: String(s.stableford_score),
                            })
                          }
                          style={{
                            background: "none",
                            border: "none",
                            color: "rgba(255,255,255,0.3)",
                            cursor: "pointer",
                          }}
                        >
                          <Edit2 size={13} />
                        </button>
                        <button
                          onClick={() => deleteScore(s.id)}
                          style={{
                            background: "none",
                            border: "none",
                            color: "#f87171",
                            cursor: "pointer",
                          }}
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Winners */}
        {winners.length > 0 && (
          <div className="glass-card" style={{ padding: 24, marginTop: 24 }}>
            <h2
              style={{
                fontFamily: "var(--font-clash)",
                fontWeight: 600,
                marginBottom: 16,
                fontSize: "1.1rem",
              }}
            >
              Win History
            </h2>
            <table
              style={{ width: "100%", borderCollapse: "collapse" }}
              className="glass-table"
            >
              <thead>
                <tr>
                  <th style={{ textAlign: "left" }}>Draw</th>
                  <th style={{ textAlign: "left" }}>Match</th>
                  <th style={{ textAlign: "left" }}>Prize</th>
                  <th style={{ textAlign: "left" }}>Verification</th>
                  <th style={{ textAlign: "left" }}>Payout</th>
                </tr>
              </thead>
              <tbody>
                {winners.map((w) => (
                  <tr key={w.id}>
                    <td style={{ fontSize: "0.85rem" }}>
                      {w.draws?.title || "—"}
                    </td>
                    <td style={{ fontSize: "0.85rem" }}>
                      {w.match_type.replace("_", "-")}
                    </td>
                    <td
                      style={{
                        color: "var(--gold)",
                        fontFamily: "var(--font-clash)",
                        fontWeight: 700,
                      }}
                    >
                      £{w.prize_amount.toFixed(2)}
                    </td>
                    <td>
                      <span
                        className={`badge badge-${w.verification_status === "approved" ? "active" : w.verification_status === "rejected" ? "rejected" : "pending"}`}
                      >
                        {w.verification_status}
                      </span>
                    </td>
                    <td>
                      <span
                        className={`badge badge-${w.payout_status === "paid" ? "paid" : "pending"}`}
                      >
                        {w.payout_status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
