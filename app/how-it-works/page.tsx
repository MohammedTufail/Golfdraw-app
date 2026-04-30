import Link from "next/link";
import Navbar from "@/components/layout/navbar";
import {
  ArrowRight,
  Trophy,
  Heart,
  Zap,
  Shield,
  Users,
  Calendar,
  CheckCircle,
} from "lucide-react";

/**
 * How It Works page
 * WHY: Visitors need to understand the platform before subscribing.
 * Covers: subscription → scores → draw → prizes → charity flow.
 */
export default function HowItWorksPage() {
  return (
    <div style={{ background: "var(--bg)", minHeight: "100vh" }}>
      <Navbar />

      <div
        className="max-w-4xl mx-auto px-6"
        style={{ paddingTop: 100, paddingBottom: 80 }}
      >
        {/* Hero */}
        <div style={{ textAlign: "center", marginBottom: 80 }}>
          <p
            style={{
              color: "var(--gold)",
              fontSize: "0.8rem",
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              marginBottom: 14,
            }}
          >
            The full picture
          </p>
          <h1
            style={{
              fontFamily: "var(--font-clash)",
              fontSize: "clamp(2.2rem, 5vw, 3.5rem)",
              fontWeight: 700,
              letterSpacing: "-0.02em",
              marginBottom: 20,
            }}
          >
            How GolfDraw Works
          </h1>
          <p
            style={{
              color: "rgba(255,255,255,0.5)",
              fontSize: "1.1rem",
              lineHeight: 1.7,
              maxWidth: 560,
              margin: "0 auto",
            }}
          >
            Play your regular golf. Enter your scores. A monthly draw determines
            who wins — and every subscription gives back to charity.
          </p>
        </div>

        {/* Step by Step */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 3,
            marginBottom: 80,
          }}
        >
          {[
            {
              icon: <Shield size={22} />,
              step: "01",
              title: "Subscribe to the platform",
              desc: "Choose a monthly (£9.99) or yearly (£89.99) plan. Your subscription funds the monthly prize pool and your chosen charity. Non-subscribers have restricted access — you must be subscribed to enter the draw.",
              color: "rgba(255,255,255,0.6)",
              bg: "rgba(255,255,255,0.04)",
            },
            {
              icon: <Zap size={22} />,
              step: "02",
              title: "Select your charity",
              desc: "Pick a charity from our directory at signup. A minimum of 10% of your subscription goes to your chosen charity automatically every month. You can increase this percentage at any time — or donate independently.",
              color: "#f87171",
              bg: "rgba(239,68,68,0.05)",
            },
            {
              icon: <Users size={22} />,
              step: "03",
              title: "Enter your Stableford scores",
              desc: "Log your last 5 golf scores in Stableford format (1–45 range). Each score must have a date. Only one score per date is allowed — you can edit or delete existing entries. Your 5 most recent scores are always kept; the oldest is replaced when you add a 6th.",
              color: "var(--gold)",
              bg: "rgba(201,168,76,0.05)",
            },
            {
              icon: <Calendar size={22} />,
              step: "04",
              title: "Monthly draw",
              desc: "Every month, 5 winning numbers are drawn from the pool of all active subscriber scores. The draw can be random (standard lottery) or weighted (based on score frequency). Admin runs the draw — results are published on the platform and all participants are notified.",
              color: "#60a5fa",
              bg: "rgba(96,165,250,0.05)",
            },
            {
              icon: <Trophy size={22} />,
              step: "05",
              title: "Win prizes",
              desc: "If your scores match 3, 4, or 5 of the winning numbers, you win a share of the prize pool. Prizes are split equally among all winners in the same tier. The 5-match jackpot rolls over to the next month if unclaimed.",
              color: "var(--gold)",
              bg: "rgba(201,168,76,0.05)",
            },
            {
              icon: <CheckCircle size={22} />,
              step: "06",
              title: "Verify & get paid",
              desc: "Winners must upload a screenshot of their scores from their official golf platform as proof. Our admin team reviews submissions. Approved winners are paid out. Rejected submissions can be re-uploaded.",
              color: "#4ade80",
              bg: "rgba(74,222,128,0.05)",
            },
          ].map((item, i, arr) => (
            <div key={i} style={{ display: "flex", gap: 0 }}>
              {/* Connector line */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  marginRight: 24,
                }}
              >
                <div
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 12,
                    flexShrink: 0,
                    background: item.bg,
                    border: `1px solid ${item.color}30`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: item.color,
                  }}
                >
                  {item.icon}
                </div>
                {i < arr.length - 1 && (
                  <div
                    style={{
                      width: 1,
                      flex: 1,
                      minHeight: 24,
                      background: "rgba(255,255,255,0.06)",
                      margin: "4px 0",
                    }}
                  />
                )}
              </div>

              {/* Content */}
              <div style={{ paddingBottom: i < arr.length - 1 ? 32 : 0 }}>
                <div
                  style={{
                    color: "rgba(255,255,255,0.25)",
                    fontSize: "0.75rem",
                    letterSpacing: "0.08em",
                    marginBottom: 6,
                    fontFamily: "var(--font-clash)",
                  }}
                >
                  STEP {item.step}
                </div>
                <h3
                  style={{
                    fontFamily: "var(--font-clash)",
                    fontSize: "1.15rem",
                    fontWeight: 600,
                    marginBottom: 10,
                  }}
                >
                  {item.title}
                </h3>
                <p
                  style={{
                    color: "rgba(255,255,255,0.5)",
                    lineHeight: 1.7,
                    fontSize: "0.95rem",
                  }}
                >
                  {item.desc}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Prize Breakdown */}
        <div className="glass-card" style={{ padding: 36, marginBottom: 60 }}>
          <h2
            style={{
              fontFamily: "var(--font-clash)",
              fontSize: "1.4rem",
              fontWeight: 700,
              marginBottom: 24,
            }}
          >
            Prize Pool Breakdown
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
            {[
              {
                tier: "5-Number Match",
                pct: "40%",
                note: "Jackpot — rolls over if no winner",
                color: "#f0d87a",
                rollover: true,
              },
              {
                tier: "4-Number Match",
                pct: "35%",
                note: "Split equally among all 4-match winners",
                color: "#e2e8f0",
                rollover: false,
              },
              {
                tier: "3-Number Match",
                pct: "25%",
                note: "Split equally among all 3-match winners",
                color: "#94a3b8",
                rollover: false,
              },
            ].map((t, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 16,
                  padding: "20px 0",
                  borderBottom:
                    i < 2 ? "1px solid rgba(255,255,255,0.07)" : "none",
                }}
              >
                <div>
                  <div
                    style={{
                      fontFamily: "var(--font-clash)",
                      fontWeight: 600,
                      color: t.color,
                      marginBottom: 4,
                    }}
                  >
                    {t.tier}
                    {t.rollover && (
                      <span
                        style={{
                          fontSize: "0.72rem",
                          marginLeft: 8,
                          padding: "2px 8px",
                          borderRadius: 10,
                          background: "rgba(201,168,76,0.12)",
                          color: "var(--gold)",
                          border: "1px solid rgba(201,168,76,0.2)",
                        }}
                      >
                        Jackpot Rollover
                      </span>
                    )}
                  </div>
                  <div
                    style={{
                      color: "rgba(255,255,255,0.4)",
                      fontSize: "0.85rem",
                    }}
                  >
                    {t.note}
                  </div>
                </div>
                <div
                  style={{
                    fontFamily: "var(--font-clash)",
                    fontSize: "2rem",
                    fontWeight: 700,
                    color: t.color,
                    flexShrink: 0,
                  }}
                >
                  {t.pct}
                </div>
              </div>
            ))}
          </div>
          <div
            style={{
              marginTop: 20,
              padding: "14px 16px",
              borderRadius: 10,
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.06)",
              color: "rgba(255,255,255,0.45)",
              fontSize: "0.85rem",
              lineHeight: 1.6,
            }}
          >
            💡 The pool grows with subscriber count. The more players, the
            bigger the prizes. Remaining subscription revenue covers platform
            operations and charity contributions.
          </div>
        </div>

        {/* FAQ */}
        <div style={{ marginBottom: 60 }}>
          <h2
            style={{
              fontFamily: "var(--font-clash)",
              fontSize: "1.4rem",
              fontWeight: 700,
              marginBottom: 28,
            }}
          >
            Common Questions
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {[
              {
                q: "Do I need to play at a specific golf course?",
                a: "No — you can play at any course. Just enter your Stableford score for that round in your dashboard.",
              },
              {
                q: "What happens if I enter the same score date twice?",
                a: "Only one score per date is allowed. Duplicate dates will be rejected. You can edit or delete an existing date's entry.",
              },
              {
                q: "What if I win the jackpot but no one matches 5 numbers this month?",
                a: "The jackpot rolls over to the next month, growing the pot for the following draw.",
              },
              {
                q: "How is my charity contribution calculated?",
                a: "At least 10% of your subscription fee goes directly to your chosen charity. You can set a higher percentage in your profile settings.",
              },
              {
                q: "Can I change my charity?",
                a: 'Yes — from your dashboard, navigate to "My Charity" and select a new one. The change applies from your next payment cycle.',
              },
              {
                q: "How do I get paid if I win?",
                a: "You'll be notified on the platform. Upload a screenshot of your scores from your golf platform as proof. Once the admin verifies it, you'll be paid out.",
              },
            ].map((faq, i) => (
              <div
                key={i}
                className="glass-card"
                style={{ padding: "20px 24px" }}
              >
                <div
                  style={{
                    fontWeight: 600,
                    marginBottom: 8,
                    fontSize: "0.95rem",
                  }}
                >
                  {faq.q}
                </div>
                <div
                  style={{
                    color: "rgba(255,255,255,0.5)",
                    fontSize: "0.9rem",
                    lineHeight: 1.6,
                  }}
                >
                  {faq.a}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div
          style={{
            textAlign: "center",
            padding: "48px 32px",
            borderRadius: 20,
            background:
              "linear-gradient(135deg, rgba(201,168,76,0.08) 0%, rgba(255,255,255,0.02) 100%)",
            border: "1px solid rgba(201,168,76,0.15)",
          }}
        >
          <h2
            style={{
              fontFamily: "var(--font-clash)",
              fontSize: "2rem",
              fontWeight: 700,
              marginBottom: 12,
            }}
          >
            Ready to play?
          </h2>
          <p style={{ color: "rgba(255,255,255,0.5)", marginBottom: 32 }}>
            Subscribe in under 2 minutes. Your first draw entry is automatic.
          </p>
          <Link
            href="/signup"
            className="btn-gold"
            style={{ fontSize: "1rem", padding: "14px 36px" }}
          >
            Get Started <ArrowRight size={18} />
          </Link>
        </div>
      </div>
    </div>
  );
}
