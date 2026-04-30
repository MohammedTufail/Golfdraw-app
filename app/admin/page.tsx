import { redirect } from "next/navigation";
import { createServerClientInstance } from "@/lib/supabase/server";
import Link from "next/link";
import Navbar from "@/components/layout/navbar";
import {
  Users,
  Trophy,
  Heart,
  BarChart3,
  Settings,
  ArrowRight,
  Shield,
} from "lucide-react";

export default async function AdminPage() {
  const supabase = await createServerClientInstance();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (profile?.role !== "admin") redirect("/dashboard");

  // Stats
  const [usersRes, subsRes, drawsRes, winnersRes, charitiesRes] =
    await Promise.all([
      supabase.from("profiles").select("id", { count: "exact", head: true }),
      supabase
        .from("subscriptions")
        .select("id", { count: "exact", head: true })
        .eq("status", "active"),
      supabase
        .from("draws")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(1),
      supabase
        .from("winners")
        .select("id, prize_amount, payout_status")
        .eq("payout_status", "pending"),
      supabase.from("charities").select("id", { count: "exact", head: true }),
    ]);

  const totalUsers = usersRes.count || 0;
  const activeSubs = subsRes.count || 0;
  const latestDraw = drawsRes.data?.[0];
  const pendingWinners = winnersRes.data || [];
  const pendingPayout = pendingWinners.reduce(
    (s, w) => s + (w.prize_amount || 0),
    0,
  );

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
            marginBottom: 40,
          }}
        >
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 10,
              background: "rgba(201,168,76,0.1)",
              border: "1px solid rgba(201,168,76,0.2)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Shield size={18} style={{ color: "var(--gold)" }} />
          </div>
          <div>
            <h1
              style={{
                fontFamily: "var(--font-clash)",
                fontSize: "2rem",
                fontWeight: 700,
              }}
            >
              Admin Panel
            </h1>
            <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.9rem" }}>
              GolfDraw management dashboard
            </p>
          </div>
        </div>

        {/* Stats */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
            gap: 16,
            marginBottom: 40,
          }}
        >
          {[
            {
              label: "Total Users",
              value: totalUsers,
              icon: <Users size={16} />,
              color: "rgba(255,255,255,0.6)",
            },
            {
              label: "Active Subs",
              value: activeSubs,
              icon: <BarChart3 size={16} />,
              color: "#4ade80",
            },
            {
              label: "Pending Payouts",
              value: `£${pendingPayout.toFixed(2)}`,
              icon: <Trophy size={16} />,
              color: "var(--gold)",
            },
            {
              label: "Charities",
              value: charitiesRes.count || 0,
              icon: <Heart size={16} />,
              color: "#f87171",
            },
          ].map((s) => (
            <div key={s.label} className="stat-card">
              <div style={{ color: s.color, marginBottom: 12 }}>{s.icon}</div>
              <div
                style={{
                  fontFamily: "var(--font-clash)",
                  fontSize: "1.8rem",
                  fontWeight: 700,
                  marginBottom: 4,
                }}
              >
                {s.value}
              </div>
              <div
                style={{
                  color: "rgba(255,255,255,0.4)",
                  fontSize: "0.8rem",
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                }}
              >
                {s.label}
              </div>
            </div>
          ))}
        </div>

        {/* Nav Cards */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: 20,
            marginBottom: 40,
          }}
        >
          {[
            {
              href: "/admin/users",
              icon: <Users size={22} />,
              label: "User Management",
              desc: "View profiles, edit scores, manage subscriptions",
              color: "rgba(255,255,255,0.07)",
            },
            {
              href: "/admin/draws",
              icon: <Trophy size={22} />,
              label: "Draw Management",
              desc: "Configure, simulate, and publish monthly draws",
              color: "rgba(201,168,76,0.07)",
              accent: "var(--gold)",
            },
            {
              href: "/admin/charities",
              icon: <Heart size={22} />,
              label: "Charity Management",
              desc: "Add, edit, and manage charity listings",
              color: "rgba(239,68,68,0.06)",
              accent: "#f87171",
            },
            {
              href: "/admin/winners",
              icon: <Shield size={22} />,
              label: "Winners & Verification",
              desc: "Review proofs, approve/reject, mark payouts",
              color: "rgba(74,222,128,0.05)",
              accent: "#4ade80",
            },
          ].map((card) => (
            <Link
              key={card.href}
              href={card.href}
              style={{ textDecoration: "none" }}
            >
              <div
                className="glass-card"
                style={{
                  padding: "28px",
                  height: "100%",
                  background: card.color,
                  transition: "all 0.25s",
                }}
              >
                <div
                  style={{
                    color: card.accent || "rgba(255,255,255,0.6)",
                    marginBottom: 16,
                    width: 44,
                    height: 44,
                    borderRadius: 12,
                    background: "rgba(255,255,255,0.05)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {card.icon}
                </div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                  }}
                >
                  <div>
                    <h3
                      style={{
                        fontFamily: "var(--font-clash)",
                        fontWeight: 600,
                        fontSize: "1.1rem",
                        marginBottom: 8,
                      }}
                    >
                      {card.label}
                    </h3>
                    <p
                      style={{
                        color: "rgba(255,255,255,0.45)",
                        fontSize: "0.875rem",
                        lineHeight: 1.6,
                      }}
                    >
                      {card.desc}
                    </p>
                  </div>
                  <ArrowRight
                    size={18}
                    style={{
                      color: "rgba(255,255,255,0.3)",
                      flexShrink: 0,
                      marginTop: 2,
                    }}
                  />
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Latest Draw Status */}
        {latestDraw && (
          <div className="glass-card" style={{ padding: 28 }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 20,
              }}
            >
              <h2
                style={{
                  fontFamily: "var(--font-clash)",
                  fontSize: "1.1rem",
                  fontWeight: 600,
                }}
              >
                Latest Draw
              </h2>
              <Link
                href="/admin/draws"
                className="btn-primary"
                style={{ padding: "7px 16px", fontSize: "0.85rem" }}
              >
                Manage <ArrowRight size={13} />
              </Link>
            </div>
            <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
              <div>
                <div
                  style={{
                    color: "rgba(255,255,255,0.4)",
                    fontSize: "0.8rem",
                    marginBottom: 4,
                  }}
                >
                  Title
                </div>
                <div style={{ fontWeight: 600 }}>{latestDraw.title}</div>
              </div>
              <div>
                <div
                  style={{
                    color: "rgba(255,255,255,0.4)",
                    fontSize: "0.8rem",
                    marginBottom: 4,
                  }}
                >
                  Status
                </div>
                <span
                  className={`badge badge-${latestDraw.status === "published" ? "active" : latestDraw.status === "simulated" ? "pending" : "inactive"}`}
                >
                  {latestDraw.status}
                </span>
              </div>
              {latestDraw.winning_numbers && (
                <div>
                  <div
                    style={{
                      color: "rgba(255,255,255,0.4)",
                      fontSize: "0.8rem",
                      marginBottom: 4,
                    }}
                  >
                    Winning Numbers
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    {latestDraw.winning_numbers.map((n: number) => (
                      <div
                        key={n}
                        className="score-badge"
                        style={{
                          background: "rgba(201,168,76,0.12)",
                          color: "var(--gold)",
                          border: "1px solid rgba(201,168,76,0.3)",
                        }}
                      >
                        {n}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
