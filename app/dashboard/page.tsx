import { redirect } from "next/navigation";
import { createServerClientInstance } from "@/lib/supabase/server";
import { createClient } from "@supabase/supabase-js";
import Link from "next/link";
import Navbar from "@/components/layout/navbar";
import {
  Trophy,
  Calendar,
  Heart,
  Star,
  ArrowRight,
  TrendingUp,
} from "lucide-react";
import type { Database } from "@/lib/supabase/types";

// Admin client for cross-table reads that RLS might block
const supabaseAdmin = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

type Score = Database["public"]["Tables"]["scores"]["Row"];
type Winner = Database["public"]["Tables"]["winners"]["Row"];

export default async function DashboardPage() {
  const supabase = await createServerClientInstance();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [profileRes, subRes, scoresRes, winnersRes] = await Promise.all([
    supabaseAdmin
      .from("profiles")
      .select("*, charities(name, logo_url)")
      .eq("id", user.id)
      .single(),
    supabaseAdmin
      .from("subscriptions")
      .select("*")
      .eq("user_id", user.id)
      .eq("status", "active")
      .maybeSingle(),
    supabaseAdmin
      .from("scores")
      .select("*")
      .eq("user_id", user.id)
      .order("score_date", { ascending: false }),
    supabaseAdmin.from("winners").select("*").eq("user_id", user.id),
  ]);

  const profile = profileRes.data as
    | (Database["public"]["Tables"]["profiles"]["Row"] & {
        charities: { name: string; logo_url: string | null } | null;
      })
    | null;
  const subscription = subRes.data as
    | Database["public"]["Tables"]["subscriptions"]["Row"]
    | null;
  const scores = (scoresRes.data as Score[]) || [];
  const winners = (winnersRes.data as Winner[]) || [];
  const totalWon = winners.reduce((sum, w) => sum + (w.prize_amount || 0), 0);
  const charity = profile?.charities;

  return (
    <div style={{ background: "var(--bg)", minHeight: "100vh" }}>
      <Navbar />
      <div
        className="max-w-7xl mx-auto px-6"
        style={{ paddingTop: 100, paddingBottom: 60 }}
      >
        <div style={{ marginBottom: 40 }}>
          <p
            style={{
              color: "rgba(255,255,255,0.4)",
              fontSize: "0.85rem",
              marginBottom: 6,
            }}
          >
            {new Date().toLocaleDateString("en-GB", {
              weekday: "long",
              day: "numeric",
              month: "long",
            })}
          </p>
          <h1
            style={{
              fontFamily: "var(--font-clash)",
              fontSize: "clamp(1.8rem, 4vw, 2.6rem)",
              fontWeight: 700,
              letterSpacing: "-0.02em",
            }}
          >
            Welcome back, {profile?.full_name?.split(" ")[0] || "Player"} 👋
          </h1>
        </div>

        {!subscription && (
          <div
            style={{
              background: "rgba(248,113,113,0.08)",
              border: "1px solid rgba(248,113,113,0.2)",
              borderRadius: 14,
              padding: "20px 24px",
              marginBottom: 32,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 16,
              flexWrap: "wrap",
            }}
          >
            <div>
              <div style={{ fontWeight: 600, marginBottom: 4 }}>
                No active subscription
              </div>
              <div
                style={{ color: "rgba(255,255,255,0.5)", fontSize: "0.9rem" }}
              >
                Subscribe to enter the monthly draw and start competing.
              </div>
            </div>
            <Link href="/signup" className="btn-gold">
              Subscribe Now
            </Link>
          </div>
        )}

        {/* Stats Grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: 16,
            marginBottom: 32,
          }}
        >
          {[
            {
              label: "Plan",
              value: subscription
                ? subscription.plan.charAt(0).toUpperCase() +
                  subscription.plan.slice(1)
                : "Inactive",
              icon: (
                <Star
                  size={16}
                  style={{ color: subscription ? "#4ade80" : "#f87171" }}
                />
              ),
              sub: subscription?.renewal_date
                ? `Renews ${new Date(subscription.renewal_date).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}`
                : "",
            },
            {
              label: "Scores",
              value: `${scores.length} / 5`,
              icon: <TrendingUp size={16} style={{ color: "var(--gold)" }} />,
              sub:
                scores.length < 5
                  ? `${5 - scores.length} more to add`
                  : "Full roster",
            },
            {
              label: "Charity",
              value: charity?.name || "None selected",
              icon: <Heart size={16} style={{ color: "#f87171" }} />,
              sub: `${profile?.charity_contribution_pct || 10}% contribution`,
            },
            {
              label: "Total Won",
              value: `£${totalWon.toFixed(2)}`,
              icon: <Trophy size={16} style={{ color: "var(--gold)" }} />,
              sub: `${winners.length} draw${winners.length !== 1 ? "s" : ""} won`,
            },
          ].map((s) => (
            <div key={s.label} className="stat-card">
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  marginBottom: 16,
                }}
              >
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    background: "rgba(255,255,255,0.06)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {s.icon}
                </div>
                <span
                  style={{
                    color: "rgba(255,255,255,0.5)",
                    fontSize: "0.8rem",
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                  }}
                >
                  {s.label}
                </span>
              </div>
              <div
                style={{
                  fontFamily: "var(--font-clash)",
                  fontSize: "1.2rem",
                  fontWeight: 700,
                  marginBottom: 4,
                }}
              >
                {s.value}
              </div>
              {s.sub && (
                <div
                  style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.8rem" }}
                >
                  {s.sub}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Main Grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))",
            gap: 24,
          }}
        >
          {/* Scores */}
          <div className="glass-card" style={{ padding: 28 }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 24,
              }}
            >
              <h2
                style={{
                  fontFamily: "var(--font-clash)",
                  fontSize: "1.1rem",
                  fontWeight: 600,
                }}
              >
                My Scores
              </h2>
              <Link
                href="/dashboard/scores"
                className="btn-primary"
                style={{ padding: "7px 16px", fontSize: "0.85rem" }}
              >
                Manage <ArrowRight size={13} />
              </Link>
            </div>
            {scores.length === 0 ? (
              <div
                style={{
                  textAlign: "center",
                  padding: "32px 0",
                  color: "rgba(255,255,255,0.3)",
                }}
              >
                <p style={{ fontSize: "0.9rem", marginBottom: 8 }}>
                  No scores entered yet
                </p>
                <Link
                  href="/dashboard/scores"
                  style={{
                    color: "var(--gold)",
                    fontSize: "0.85rem",
                    textDecoration: "none",
                  }}
                >
                  Add your first score →
                </Link>
              </div>
            ) : (
              scores.map((s, i) => (
                <div
                  key={s.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "12px 16px",
                    borderRadius: 10,
                    background: "rgba(255,255,255,0.03)",
                    border: "1px solid rgba(255,255,255,0.06)",
                    marginBottom: 8,
                  }}
                >
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 12 }}
                  >
                    <div
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: "50%",
                        background:
                          i === 0 ? "var(--gold)" : "rgba(255,255,255,0.2)",
                      }}
                    />
                    <span
                      style={{
                        color: "rgba(255,255,255,0.5)",
                        fontSize: "0.85rem",
                      }}
                    >
                      {new Date(s.score_date).toLocaleDateString("en-GB", {
                        day: "numeric",
                        month: "short",
                      })}
                    </span>
                  </div>
                  <span
                    style={{
                      fontFamily: "var(--font-clash)",
                      fontWeight: 700,
                      fontSize: "1.1rem",
                    }}
                  >
                    {s.stableford_score}
                  </span>
                </div>
              ))
            )}
          </div>

          {/* Next Draw */}
          <div
            className="glass-card"
            style={{
              padding: 28,
              background:
                "linear-gradient(135deg, rgba(201,168,76,0.06) 0%, rgba(255,255,255,0.02) 100%)",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                marginBottom: 24,
              }}
            >
              <Calendar size={18} style={{ color: "var(--gold)" }} />
              <h2
                style={{
                  fontFamily: "var(--font-clash)",
                  fontSize: "1.1rem",
                  fontWeight: 600,
                }}
              >
                Next Draw
              </h2>
            </div>
            <div style={{ textAlign: "center", padding: "20px 0" }}>
              <div
                style={{
                  color: "rgba(255,255,255,0.4)",
                  fontSize: "0.85rem",
                  marginBottom: 8,
                }}
              >
                Drawing on
              </div>
              <div
                style={{
                  fontFamily: "var(--font-clash)",
                  fontSize: "1.8rem",
                  fontWeight: 700,
                  color: "var(--gold)",
                  marginBottom: 4,
                }}
              >
                {new Date(
                  new Date().getFullYear(),
                  new Date().getMonth() + 1,
                  1,
                ).toLocaleDateString("en-GB", {
                  day: "numeric",
                  month: "long",
                })}
              </div>
              <div
                style={{
                  color: "rgba(255,255,255,0.4)",
                  fontSize: "0.85rem",
                  marginBottom: 24,
                }}
              >
                {scores.length >= 3 ? (
                  <span style={{ color: "#4ade80" }}>
                    ✓ You are eligible to enter
                  </span>
                ) : (
                  <span style={{ color: "#facc15" }}>
                    Need {3 - scores.length} more score
                    {3 - scores.length !== 1 ? "s" : ""} to qualify
                  </span>
                )}
              </div>
              <div
                style={{
                  padding: "14px",
                  borderRadius: 12,
                  background: "rgba(201,168,76,0.08)",
                  border: "1px solid rgba(201,168,76,0.15)",
                }}
              >
                <div
                  style={{
                    color: "rgba(255,255,255,0.5)",
                    fontSize: "0.8rem",
                    marginBottom: 8,
                  }}
                >
                  Your draw numbers
                </div>
                <div
                  style={{
                    display: "flex",
                    gap: 8,
                    justifyContent: "center",
                    flexWrap: "wrap",
                  }}
                >
                  {scores.length > 0 ? (
                    scores.map((s) => (
                      <div
                        key={s.id}
                        className="score-badge"
                        style={{
                          background: "rgba(201,168,76,0.12)",
                          color: "var(--gold)",
                          border: "1px solid rgba(201,168,76,0.3)",
                        }}
                      >
                        {s.stableford_score}
                      </div>
                    ))
                  ) : (
                    <span
                      style={{
                        color: "rgba(255,255,255,0.3)",
                        fontSize: "0.85rem",
                      }}
                    >
                      No scores yet
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Winnings */}
          <div className="glass-card" style={{ padding: 28 }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 24,
              }}
            >
              <h2
                style={{
                  fontFamily: "var(--font-clash)",
                  fontSize: "1.1rem",
                  fontWeight: 600,
                }}
              >
                Winnings
              </h2>
              <Link
                href="/dashboard/winnings"
                className="btn-primary"
                style={{ padding: "7px 16px", fontSize: "0.85rem" }}
              >
                View All <ArrowRight size={13} />
              </Link>
            </div>
            {winners.length === 0 ? (
              <div
                style={{
                  textAlign: "center",
                  padding: "32px 0",
                  color: "rgba(255,255,255,0.3)",
                }}
              >
                <Trophy
                  size={32}
                  style={{ margin: "0 auto 12px", opacity: 0.3 }}
                />
                <p style={{ fontSize: "0.9rem" }}>
                  No winnings yet — keep playing!
                </p>
              </div>
            ) : (
              winners.slice(0, 4).map((w) => (
                <div
                  key={w.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "12px 16px",
                    borderRadius: 10,
                    background: "rgba(255,255,255,0.03)",
                    border: "1px solid rgba(255,255,255,0.06)",
                    marginBottom: 8,
                  }}
                >
                  <div>
                    <div style={{ fontSize: "0.85rem", fontWeight: 500 }}>
                      {w.match_type.replace("_", "-")}
                    </div>
                    <span
                      className={`badge badge-${w.payout_status}`}
                      style={{ marginTop: 4 }}
                    >
                      {w.payout_status}
                    </span>
                  </div>
                  <span
                    style={{
                      fontFamily: "var(--font-clash)",
                      fontWeight: 700,
                      color: "var(--gold)",
                    }}
                  >
                    £{w.prize_amount.toFixed(2)}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
