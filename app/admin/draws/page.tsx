"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import Navbar from "@/components/layout/navbar";
import { ArrowLeft, Play, Eye, CheckCircle, Plus, Zap } from "lucide-react";

type Draw = {
  id: string;
  title: string;
  draw_month: string;
  draw_type: string;
  status: string;
  winning_numbers: number[] | null;
  jackpot_amount: number;
  pool_4match: number;
  pool_3match: number;
  total_subscribers: number;
  jackpot_rolled_over: boolean;
  published_at: string | null;
};

export default function AdminDrawsPage() {
  const router = useRouter();
  const supabase = createClient();
  const [draws, setDraws] = useState<Draw[]>([]);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newMonth, setNewMonth] = useState("");
  const [newType, setNewType] = useState<"random" | "weighted">("random");

  useEffect(() => {
    checkAdminAndLoad();
  }, []);

  const checkAdminAndLoad = async () => {
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
    loadDraws();
  };

  const loadDraws = async () => {
    const { data } = await supabase
      .from("draws")
      .select("*")
      .order("draw_month", { ascending: false });
    setDraws(data || []);
    setLoading(false);
  };

  const createDraw = async () => {
    if (!newTitle || !newMonth) return;
    const { error } = await supabase.from("draws").insert({
      title: newTitle,
      draw_month: newMonth + "-01",
      draw_type: newType,
      status: "pending",
    });
    if (!error) {
      setShowCreate(false);
      setNewTitle("");
      setNewMonth("");
      loadDraws();
    }
  };

  const runDrawAction = async (
    drawId: string,
    action: "simulate" | "publish",
  ) => {
    setRunning(drawId);
    try {
      const res = await fetch("/api/draws/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ drawId, action }),
      });
      const data = await res.json();
      if (data.success) loadDraws();
      else alert(data.error || "Something went wrong");
    } catch (e) {
      alert("Request failed");
    }
    setRunning(null);
  };

  return (
    <div style={{ background: "var(--bg)", minHeight: "100vh" }}>
      <Navbar />

      <div
        className="max-w-5xl mx-auto px-6"
        style={{ paddingTop: 100, paddingBottom: 60 }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            marginBottom: 40,
            flexWrap: "wrap",
            gap: 16,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
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
                Draw Management
              </h1>
              <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.9rem" }}>
                Configure, simulate and publish monthly draws
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowCreate(!showCreate)}
            className="btn-primary"
          >
            <Plus size={16} /> New Draw
          </button>
        </div>

        {/* Create Draw Form */}
        {showCreate && (
          <div className="glass-card" style={{ padding: 28, marginBottom: 28 }}>
            <h3
              style={{
                fontFamily: "var(--font-clash)",
                fontWeight: 600,
                marginBottom: 20,
              }}
            >
              Create New Draw
            </h3>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                gap: 16,
                marginBottom: 20,
              }}
            >
              <div>
                <label
                  style={{
                    display: "block",
                    color: "rgba(255,255,255,0.5)",
                    fontSize: "0.8rem",
                    marginBottom: 8,
                  }}
                >
                  Draw Title
                </label>
                <input
                  type="text"
                  className="glass-input"
                  placeholder="e.g. May 2026 Draw"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                />
              </div>
              <div>
                <label
                  style={{
                    display: "block",
                    color: "rgba(255,255,255,0.5)",
                    fontSize: "0.8rem",
                    marginBottom: 8,
                  }}
                >
                  Month (YYYY-MM)
                </label>
                <input
                  type="month"
                  className="glass-input"
                  value={newMonth}
                  onChange={(e) => setNewMonth(e.target.value)}
                />
              </div>
              <div>
                <label
                  style={{
                    display: "block",
                    color: "rgba(255,255,255,0.5)",
                    fontSize: "0.8rem",
                    marginBottom: 8,
                  }}
                >
                  Draw Type
                </label>
                <select
                  className="glass-input"
                  value={newType}
                  onChange={(e) =>
                    setNewType(e.target.value as "random" | "weighted")
                  }
                  style={{ cursor: "pointer" }}
                >
                  <option value="random">Random (Standard Lottery)</option>
                  <option value="weighted">Weighted (Score Frequency)</option>
                </select>
              </div>
            </div>
            <div style={{ display: "flex", gap: 12 }}>
              <button onClick={createDraw} className="btn-gold">
                Create Draw
              </button>
              <button
                onClick={() => setShowCreate(false)}
                className="btn-primary"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Draws Table */}
        <div className="glass-card" style={{ overflow: "hidden" }}>
          <table
            style={{ width: "100%", borderCollapse: "collapse" }}
            className="glass-table"
          >
            <thead>
              <tr>
                <th style={{ textAlign: "left" }}>Draw</th>
                <th style={{ textAlign: "left" }}>Month</th>
                <th style={{ textAlign: "left" }}>Type</th>
                <th style={{ textAlign: "left" }}>Status</th>
                <th style={{ textAlign: "left" }}>Winning Numbers</th>
                <th style={{ textAlign: "left" }}>Jackpot</th>
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
              ) : draws.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    style={{
                      textAlign: "center",
                      padding: 40,
                      color: "rgba(255,255,255,0.3)",
                    }}
                  >
                    No draws yet — create one above.
                  </td>
                </tr>
              ) : (
                draws.map((draw) => (
                  <tr key={draw.id}>
                    <td style={{ fontWeight: 500 }}>{draw.title}</td>
                    <td style={{ color: "rgba(255,255,255,0.5)" }}>
                      {new Date(draw.draw_month).toLocaleDateString("en-GB", {
                        month: "long",
                        year: "numeric",
                      })}
                    </td>
                    <td>
                      <span
                        style={{
                          color:
                            draw.draw_type === "weighted"
                              ? "var(--gold)"
                              : "rgba(255,255,255,0.5)",
                          fontSize: "0.85rem",
                        }}
                      >
                        {draw.draw_type === "weighted" ? (
                          <>
                            <Zap
                              size={12}
                              style={{ display: "inline", marginRight: 4 }}
                            />
                            Weighted
                          </>
                        ) : (
                          "Random"
                        )}
                      </span>
                    </td>
                    <td>
                      <span
                        className={`badge badge-${draw.status === "published" ? "active" : draw.status === "simulated" ? "pending" : "inactive"}`}
                      >
                        {draw.status}
                      </span>
                    </td>
                    <td>
                      {draw.winning_numbers ? (
                        <div style={{ display: "flex", gap: 6 }}>
                          {draw.winning_numbers.map((n) => (
                            <div
                              key={n}
                              style={{
                                width: 28,
                                height: 28,
                                borderRadius: 6,
                                fontSize: "0.8rem",
                                background: "rgba(201,168,76,0.12)",
                                color: "var(--gold)",
                                border: "1px solid rgba(201,168,76,0.25)",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontFamily: "var(--font-clash)",
                                fontWeight: 600,
                              }}
                            >
                              {n}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span style={{ color: "rgba(255,255,255,0.2)" }}>
                          —
                        </span>
                      )}
                    </td>
                    <td
                      style={{
                        color: "var(--gold)",
                        fontFamily: "var(--font-clash)",
                        fontWeight: 600,
                      }}
                    >
                      £{draw.jackpot_amount.toFixed(2)}
                      {draw.jackpot_rolled_over && (
                        <span
                          style={{
                            fontSize: "0.7rem",
                            color: "rgba(201,168,76,0.6)",
                            marginLeft: 4,
                          }}
                        >
                          +rollover
                        </span>
                      )}
                    </td>
                    <td style={{ textAlign: "right" }}>
                      <div
                        style={{
                          display: "flex",
                          gap: 8,
                          justifyContent: "flex-end",
                        }}
                      >
                        {draw.status === "pending" && (
                          <button
                            onClick={() => runDrawAction(draw.id, "simulate")}
                            disabled={running === draw.id}
                            className="btn-primary"
                            style={{
                              padding: "6px 12px",
                              fontSize: "0.8rem",
                              opacity: running === draw.id ? 0.5 : 1,
                            }}
                          >
                            <Eye size={12} /> Simulate
                          </button>
                        )}
                        {draw.status === "simulated" && (
                          <button
                            onClick={() => runDrawAction(draw.id, "publish")}
                            disabled={running === draw.id}
                            className="btn-gold"
                            style={{
                              padding: "6px 12px",
                              fontSize: "0.8rem",
                              opacity: running === draw.id ? 0.5 : 1,
                            }}
                          >
                            <CheckCircle size={12} /> Publish
                          </button>
                        )}
                        {draw.status === "published" && (
                          <span
                            style={{
                              color: "#4ade80",
                              fontSize: "0.8rem",
                              display: "flex",
                              alignItems: "center",
                              gap: 4,
                            }}
                          >
                            <CheckCircle size={12} /> Published
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Prize Pool Explanation */}
        <div className="glass-card" style={{ padding: 28, marginTop: 28 }}>
          <h3
            style={{
              fontFamily: "var(--font-clash)",
              fontWeight: 600,
              marginBottom: 16,
            }}
          >
            Prize Pool Split
          </h3>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: 16,
            }}
          >
            {[
              {
                tier: "5-Match",
                pct: "40%",
                color: "#f0d87a",
                note: "Jackpot · Rolls over if unclaimed",
              },
              {
                tier: "4-Match",
                pct: "35%",
                color: "#e2e8f0",
                note: "Split among all 4-match winners",
              },
              {
                tier: "3-Match",
                pct: "25%",
                color: "#94a3b8",
                note: "Split among all 3-match winners",
              },
            ].map((t) => (
              <div
                key={t.tier}
                style={{
                  padding: 16,
                  borderRadius: 12,
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.07)",
                }}
              >
                <div
                  style={{
                    fontFamily: "var(--font-clash)",
                    fontSize: "1.5rem",
                    fontWeight: 700,
                    color: t.color,
                  }}
                >
                  {t.pct}
                </div>
                <div style={{ fontWeight: 600, marginTop: 4 }}>{t.tier}</div>
                <div
                  style={{
                    color: "rgba(255,255,255,0.4)",
                    fontSize: "0.78rem",
                    marginTop: 4,
                  }}
                >
                  {t.note}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
