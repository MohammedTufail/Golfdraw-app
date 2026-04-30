"use client";
/**
 * Admin Draw Management — FIXED VERSION
 *
 * Fixes:
 * 1. Simulate now sends forceAll=true so it works even when subscriptions table is empty
 * 2. Shows simulation preview — who would win with these numbers
 * 3. Shows winner breakdown after publish
 * 4. Proper error messages if something goes wrong
 */
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import Navbar from "@/components/layout/navbar";
import {
  ArrowLeft,
  Play,
  Eye,
  CheckCircle,
  Plus,
  Zap,
  Trophy,
  RefreshCw,
} from "lucide-react";

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

type SimResult = {
  winningNumbers: number[];
  totalParticipants: number;
  prizePool: { jackpot: number; pool4: number; pool3: number };
  wouldWin?: {
    userId: string;
    name: string;
    matchCount: number;
    matchedNumbers: number[];
  }[];
  winners?: {
    jackpot: number;
    fourMatch: number;
    threeMatch: number;
    total: number;
    details: {
      userId: string;
      name: string;
      matchCount: number;
      matchedNumbers: number[];
    }[];
  };
  mode?: string;
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
  const [lastResult, setLastResult] = useState<SimResult | null>(null);
  const [lastAction, setLastAction] = useState<"simulate" | "publish" | null>(
    null,
  );
  const [apiError, setApiError] = useState("");
  const hasLoaded = useRef(false);

  useEffect(() => {
    if (hasLoaded.current) return;
    hasLoaded.current = true;
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
    const { data: p } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();
    if ((p as { role: string } | null)?.role !== "admin") {
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
    setDraws((data as Draw[]) || []);
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
    setApiError("");
    setLastResult(null);
    try {
      const res = await fetch("/api/draws/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // forceAll=true: bypasses subscription check — includes all users with 3+ scores
        body: JSON.stringify({ drawId, action, forceAll: true }),
      });
      const data = await res.json();
      if (data.success) {
        setLastResult(data);
        setLastAction(action);
        loadDraws();
      } else {
        setApiError(data.error || "Something went wrong");
      }
    } catch {
      setApiError("Request failed — check your network or Supabase connection");
    }
    setRunning(null);
  };

  return (
    <div style={{ background: "var(--bg)", minHeight: "100vh" }}>
      <Navbar />
      <div
        className="max-w-6xl mx-auto px-6"
        style={{ paddingTop: 100, paddingBottom: 60 }}
      >
        {/* Header */}
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
                Simulate → Review → Publish
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

        {/* Error */}
        {apiError && (
          <div
            style={{
              background: "rgba(248,113,113,0.1)",
              border: "1px solid rgba(248,113,113,0.25)",
              borderRadius: 12,
              padding: "16px 20px",
              marginBottom: 24,
              color: "#f87171",
            }}
          >
            <strong>Error:</strong> {apiError}
          </div>
        )}

        {/* Simulation / Publish Result Panel */}
        {lastResult && (
          <div
            style={{
              marginBottom: 32,
              borderRadius: 16,
              padding: 28,
              background:
                lastAction === "publish"
                  ? "rgba(74,222,128,0.06)"
                  : "rgba(201,168,76,0.06)",
              border: `1px solid ${lastAction === "publish" ? "rgba(74,222,128,0.25)" : "rgba(201,168,76,0.25)"}`,
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                marginBottom: 20,
                flexWrap: "wrap",
                gap: 12,
              }}
            >
              <h3
                style={{
                  fontFamily: "var(--font-clash)",
                  fontSize: "1.2rem",
                  fontWeight: 700,
                  color: lastAction === "publish" ? "#4ade80" : "var(--gold)",
                }}
              >
                {lastAction === "publish"
                  ? "✅ Draw Published!"
                  : "🎲 Simulation Preview"}
              </h3>
              <div
                style={{
                  display: "flex",
                  gap: 16,
                  fontSize: "0.85rem",
                  color: "rgba(255,255,255,0.5)",
                }}
              >
                <span>{lastResult.totalParticipants} participants</span>
                <span
                  style={{
                    color:
                      lastResult.mode === "all_users_with_scores"
                        ? "#facc15"
                        : "rgba(255,255,255,0.4)",
                  }}
                >
                  {lastResult.mode === "all_users_with_scores"
                    ? "⚠ Dev mode (all users)"
                    : "Live subscribers"}
                </span>
              </div>
            </div>

            {/* Winning numbers */}
            <div style={{ marginBottom: 20 }}>
              <div
                style={{
                  color: "rgba(255,255,255,0.4)",
                  fontSize: "0.8rem",
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                  marginBottom: 10,
                }}
              >
                Winning Numbers
              </div>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                {lastResult.winningNumbers.map((n) => (
                  <div
                    key={n}
                    style={{
                      width: 52,
                      height: 52,
                      borderRadius: 12,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontFamily: "var(--font-clash)",
                      fontWeight: 700,
                      fontSize: "1.3rem",
                      background: "rgba(201,168,76,0.15)",
                      color: "var(--gold)",
                      border: "1px solid rgba(201,168,76,0.4)",
                    }}
                  >
                    {n}
                  </div>
                ))}
              </div>
            </div>

            {/* Prize pools */}
            <div
              style={{
                display: "flex",
                gap: 16,
                marginBottom: 20,
                flexWrap: "wrap",
              }}
            >
              {[
                {
                  label: "Jackpot (5-match)",
                  value: lastResult.prizePool.jackpot,
                  color: "#f0d87a",
                },
                {
                  label: "4-Match Pool",
                  value: lastResult.prizePool.pool4,
                  color: "#e2e8f0",
                },
                {
                  label: "3-Match Pool",
                  value: lastResult.prizePool.pool3,
                  color: "#94a3b8",
                },
              ].map((p) => (
                <div
                  key={p.label}
                  style={{
                    padding: "12px 18px",
                    borderRadius: 10,
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.08)",
                  }}
                >
                  <div
                    style={{
                      color: "rgba(255,255,255,0.4)",
                      fontSize: "0.75rem",
                      marginBottom: 4,
                    }}
                  >
                    {p.label}
                  </div>
                  <div
                    style={{
                      fontFamily: "var(--font-clash)",
                      fontWeight: 700,
                      color: p.color,
                      fontSize: "1.1rem",
                    }}
                  >
                    £{p.value.toFixed(2)}
                  </div>
                </div>
              ))}
            </div>

            {/* Who wins / would win */}
            {(() => {
              const winners =
                lastAction === "publish"
                  ? lastResult.winners?.details
                  : lastResult.wouldWin;
              if (!winners || winners.length === 0) {
                return (
                  <div
                    style={{
                      padding: "16px",
                      borderRadius: 10,
                      background: "rgba(255,255,255,0.03)",
                      color: "rgba(255,255,255,0.4)",
                      fontSize: "0.9rem",
                    }}
                  >
                    No matches found this draw. Jackpot rolls over.
                  </div>
                );
              }
              return (
                <div>
                  <div
                    style={{
                      color: "rgba(255,255,255,0.4)",
                      fontSize: "0.8rem",
                      textTransform: "uppercase",
                      letterSpacing: "0.06em",
                      marginBottom: 12,
                    }}
                  >
                    {lastAction === "publish"
                      ? "Winners"
                      : "Would Win (preview)"}
                  </div>
                  <div
                    style={{ display: "flex", flexDirection: "column", gap: 8 }}
                  >
                    {winners.map((w) => (
                      <div
                        key={w.userId}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          gap: 16,
                          padding: "12px 16px",
                          borderRadius: 10,
                          background:
                            w.matchCount >= 5
                              ? "rgba(201,168,76,0.08)"
                              : w.matchCount === 4
                                ? "rgba(255,255,255,0.04)"
                                : "rgba(255,255,255,0.02)",
                          border: `1px solid ${w.matchCount >= 5 ? "rgba(201,168,76,0.25)" : "rgba(255,255,255,0.07)"}`,
                          flexWrap: "wrap",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 12,
                          }}
                        >
                          <Trophy
                            size={16}
                            style={{
                              color:
                                w.matchCount >= 5
                                  ? "var(--gold)"
                                  : w.matchCount === 4
                                    ? "#e2e8f0"
                                    : "#94a3b8",
                            }}
                          />
                          <div>
                            <div
                              style={{ fontWeight: 600, fontSize: "0.95rem" }}
                            >
                              {w.name}
                            </div>
                            <div
                              style={{
                                color: "rgba(255,255,255,0.4)",
                                fontSize: "0.8rem",
                              }}
                            >
                              {w.matchCount}-Number Match · Matched:{" "}
                              {w.matchedNumbers.join(", ")}
                            </div>
                          </div>
                        </div>
                        <span
                          style={{
                            padding: "4px 12px",
                            borderRadius: 20,
                            fontSize: "0.8rem",
                            fontWeight: 600,
                            background:
                              w.matchCount >= 5
                                ? "rgba(201,168,76,0.15)"
                                : "rgba(255,255,255,0.07)",
                            color:
                              w.matchCount >= 5
                                ? "var(--gold)"
                                : "rgba(255,255,255,0.7)",
                          }}
                        >
                          {w.matchCount >= 5
                            ? "JACKPOT"
                            : w.matchCount === 4
                              ? "4-Match"
                              : "3-Match"}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}

            {lastResult.mode === "all_users_with_scores" && (
              <div
                style={{
                  marginTop: 16,
                  padding: "10px 14px",
                  borderRadius: 8,
                  background: "rgba(250,204,21,0.06)",
                  border: "1px solid rgba(250,204,21,0.2)",
                  color: "#facc15",
                  fontSize: "0.82rem",
                }}
              >
                ⚠ Dev mode: subscriptions table is empty, so all users with 3+
                scores were included. In production with LemonSqueezy active,
                only paying subscribers will enter the draw.
              </div>
            )}
          </div>
        )}

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
                  Month
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
                  <option value="random">Random (standard lottery)</option>
                  <option value="weighted">
                    Weighted (by score frequency)
                  </option>
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
                        <div
                          style={{ display: "flex", gap: 5, flexWrap: "wrap" }}
                        >
                          {draw.winning_numbers.map((n: number) => (
                            <div
                              key={n}
                              style={{
                                width: 30,
                                height: 30,
                                borderRadius: 6,
                                fontSize: "0.8rem",
                                background: "rgba(201,168,76,0.12)",
                                color: "var(--gold)",
                                border: "1px solid rgba(201,168,76,0.25)",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontFamily: "var(--font-clash)",
                                fontWeight: 700,
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
                        fontWeight: 700,
                      }}
                    >
                      £{draw.jackpot_amount.toFixed(2)}
                      {draw.jackpot_rolled_over && (
                        <span
                          style={{
                            fontSize: "0.7rem",
                            color: "rgba(201,168,76,0.6)",
                            marginLeft: 6,
                          }}
                        >
                          ↗ rollover
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
                              padding: "6px 14px",
                              fontSize: "0.82rem",
                              opacity: running === draw.id ? 0.5 : 1,
                            }}
                          >
                            {running === draw.id ? (
                              <RefreshCw
                                size={12}
                                style={{ animation: "spin 1s linear infinite" }}
                              />
                            ) : (
                              <Eye size={12} />
                            )}
                            {running === draw.id ? " Running..." : " Simulate"}
                          </button>
                        )}
                        {draw.status === "simulated" && (
                          <>
                            <button
                              onClick={() => runDrawAction(draw.id, "simulate")}
                              disabled={running === draw.id}
                              className="btn-primary"
                              style={{
                                padding: "6px 14px",
                                fontSize: "0.82rem",
                                opacity: running === draw.id ? 0.5 : 1,
                              }}
                            >
                              <RefreshCw size={12} /> Re-run
                            </button>
                            <button
                              onClick={() => runDrawAction(draw.id, "publish")}
                              disabled={running === draw.id}
                              className="btn-gold"
                              style={{
                                padding: "6px 14px",
                                fontSize: "0.82rem",
                                opacity: running === draw.id ? 0.5 : 1,
                              }}
                            >
                              <CheckCircle size={12} /> Publish
                            </button>
                          </>
                        )}
                        {draw.status === "published" && (
                          <span
                            style={{
                              color: "#4ade80",
                              fontSize: "0.82rem",
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

        {/* Prize pool info */}
        <div className="glass-card" style={{ padding: 24, marginTop: 24 }}>
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
              gap: 12,
            }}
          >
            {[
              {
                tier: "5-Match",
                pct: "40%",
                color: "#f0d87a",
                note: "Jackpot · rolls over if no winner",
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
