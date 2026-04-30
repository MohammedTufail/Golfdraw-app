import Link from "next/link";
import Navbar from "@/components/layout/navbar";
import { Trophy, Heart, Zap, Shield, ArrowRight, Star } from "lucide-react";

export default function HomePage() {
  return (
    <div style={{ background: "var(--bg)", minHeight: "100vh" }}>
      <Navbar />

      {/* ── HERO ────────────────────────────────────────────── */}
      <section
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          position: "relative",
          overflow: "hidden",
          paddingTop: 80,
        }}
      >
        {/* Background Effects */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "radial-gradient(ellipse 70% 55% at 50% 0%, rgba(201,168,76,0.08) 0%, transparent 65%)",
            pointerEvents: "none",
          }}
        />
        <div
          style={{
            position: "absolute",
            top: "30%",
            left: "8%",
            width: 300,
            height: 300,
            background:
              "radial-gradient(circle, rgba(255,255,255,0.03) 0%, transparent 70%)",
            borderRadius: "50%",
            filter: "blur(40px)",
          }}
        />
        <div
          style={{
            position: "absolute",
            top: "20%",
            right: "5%",
            width: 250,
            height: 250,
            background:
              "radial-gradient(circle, rgba(201,168,76,0.06) 0%, transparent 70%)",
            borderRadius: "50%",
            filter: "blur(50px)",
          }}
        />

        {/* Floating particles */}
        {[...Array(8)].map((_, i) => (
          <div
            key={i}
            className="particle"
            style={{
              left: `${10 + i * 12}%`,
              bottom: `${20 + (i % 3) * 15}%`,
              animationDelay: `${i * 0.7}s`,
              animationDuration: `${4 + i * 0.5}s`,
            }}
          />
        ))}

        <div className="max-w-7xl mx-auto px-6 w-full">
          <div style={{ maxWidth: 780, margin: "0 auto", textAlign: "center" }}>
            {/* Pill badge */}
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "6px 16px",
                borderRadius: 20,
                background: "rgba(201,168,76,0.1)",
                border: "1px solid rgba(201,168,76,0.25)",
                marginBottom: 32,
              }}
            >
              <Star size={12} style={{ color: "var(--gold)" }} />
              <span
                style={{
                  color: "var(--gold)",
                  fontSize: "0.8rem",
                  letterSpacing: "0.05em",
                  fontWeight: 500,
                }}
              >
                Monthly Draw · Real Prize Pools · Real Impact
              </span>
            </div>

            {/* Headline */}
            <h1
              style={{
                fontFamily: "var(--font-clash)",
                fontSize: "clamp(3rem, 8vw, 5.5rem)",
                fontWeight: 700,
                lineHeight: 1.05,
                letterSpacing: "-0.02em",
                marginBottom: 24,
              }}
            >
              <span className="shine-text">Play Golf.</span>
              <br />
              <span style={{ color: "white" }}>Win Big.</span>
              <br />
              <span className="gold-text">Give Back.</span>
            </h1>

            <p
              style={{
                color: "rgba(255,255,255,0.55)",
                fontSize: "clamp(1rem, 2vw, 1.2rem)",
                lineHeight: 1.7,
                marginBottom: 48,
                maxWidth: 580,
                margin: "0 auto 48px",
              }}
            >
              Enter your Stableford scores. Join the monthly draw. A portion of
              every subscription funds the charity you believe in.
            </p>

            {/* CTAs */}
            <div
              style={{
                display: "flex",
                gap: 16,
                justifyContent: "center",
                flexWrap: "wrap",
                marginBottom: 80,
              }}
            >
              <Link
                href="/signup"
                className="btn-gold"
                style={{ fontSize: "1rem", padding: "14px 32px" }}
              >
                Subscribe & Play <ArrowRight size={18} />
              </Link>
              <Link
                href="/how-it-works"
                className="btn-primary"
                style={{ fontSize: "1rem", padding: "14px 32px" }}
              >
                How It Works
              </Link>
            </div>

            {/* Stats Row */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3, 1fr)",
                gap: 16,
                maxWidth: 560,
                margin: "0 auto",
              }}
            >
              {[
                { label: "Active Members", value: "2,400+" },
                { label: "Given to Charity", value: "£48K" },
                { label: "Monthly Pool", value: "£12K" },
              ].map((s) => (
                <div
                  key={s.label}
                  style={{
                    padding: "20px 16px",
                    borderRadius: 14,
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    textAlign: "center",
                  }}
                >
                  <div
                    style={{
                      fontFamily: "var(--font-clash)",
                      fontSize: "1.6rem",
                      fontWeight: 700,
                      color: "white",
                      marginBottom: 4,
                    }}
                  >
                    {s.value}
                  </div>
                  <div
                    style={{
                      color: "rgba(255,255,255,0.4)",
                      fontSize: "0.78rem",
                      letterSpacing: "0.04em",
                    }}
                  >
                    {s.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ────────────────────────────────────── */}
      <section style={{ padding: "100px 0", position: "relative" }}>
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 1,
            background:
              "linear-gradient(90deg, transparent, rgba(255,255,255,0.12), transparent)",
          }}
        />
        <div className="max-w-7xl mx-auto px-6">
          <div style={{ textAlign: "center", marginBottom: 64 }}>
            <p
              style={{
                color: "var(--gold)",
                fontSize: "0.8rem",
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                marginBottom: 12,
              }}
            >
              Simple by design
            </p>
            <h2
              style={{
                fontFamily: "var(--font-clash)",
                fontSize: "clamp(2rem, 4vw, 3rem)",
                fontWeight: 700,
                letterSpacing: "-0.02em",
              }}
            >
              Three steps to everything
            </h2>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
              gap: 24,
            }}
          >
            {[
              {
                step: "01",
                icon: <Shield size={24} />,
                title: "Subscribe",
                desc: "Choose monthly or yearly. Your subscription funds the prize pool and your chosen charity.",
              },
              {
                step: "02",
                icon: <Zap size={24} />,
                title: "Enter Scores",
                desc: "Log your last 5 Stableford scores (1–45). Your scores are your lottery numbers.",
              },
              {
                step: "03",
                icon: <Trophy size={24} />,
                title: "Win & Give",
                desc: "Match 3, 4, or 5 of the monthly draw numbers. Win cash prizes. Charity wins too.",
              },
            ].map((item) => (
              <div
                key={item.step}
                className="glass-card"
                style={{ padding: "36px 28px", position: "relative" }}
              >
                <div
                  style={{
                    position: "absolute",
                    top: 20,
                    right: 24,
                    fontFamily: "var(--font-clash)",
                    fontSize: "3rem",
                    fontWeight: 700,
                    color: "rgba(255,255,255,0.04)",
                    lineHeight: 1,
                  }}
                >
                  {item.step}
                </div>
                <div
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 12,
                    marginBottom: 20,
                    background: "rgba(201,168,76,0.1)",
                    border: "1px solid rgba(201,168,76,0.2)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "var(--gold)",
                  }}
                >
                  {item.icon}
                </div>
                <h3
                  style={{
                    fontFamily: "var(--font-clash)",
                    fontSize: "1.3rem",
                    fontWeight: 600,
                    marginBottom: 12,
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
            ))}
          </div>
        </div>
      </section>

      {/* ── PRIZE BREAKDOWN ─────────────────────────────────── */}
      <section style={{ padding: "80px 0" }}>
        <div className="max-w-7xl mx-auto px-6">
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
              gap: 32,
              alignItems: "center",
            }}
          >
            <div>
              <p
                style={{
                  color: "var(--gold)",
                  fontSize: "0.8rem",
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  marginBottom: 12,
                }}
              >
                Prize Pool
              </p>
              <h2
                style={{
                  fontFamily: "var(--font-clash)",
                  fontSize: "clamp(1.8rem, 3.5vw, 2.8rem)",
                  fontWeight: 700,
                  letterSpacing: "-0.02em",
                  marginBottom: 20,
                  lineHeight: 1.15,
                }}
              >
                Every subscription
                <br />
                builds the pot.
              </h2>
              <p
                style={{
                  color: "rgba(255,255,255,0.5)",
                  lineHeight: 1.7,
                  marginBottom: 32,
                }}
              >
                A fixed share of every subscription goes directly into the
                monthly prize pool — split across three tiers. No winner for the
                jackpot? It rolls over.
              </p>
              <Link href="/signup" className="btn-primary">
                Join the Draw <ArrowRight size={16} />
              </Link>
            </div>

            <div
              className="glass-card"
              style={{ padding: 32, overflow: "hidden", position: "relative" }}
            >
              <div
                style={{
                  position: "absolute",
                  top: -30,
                  right: -30,
                  width: 150,
                  height: 150,
                  background:
                    "radial-gradient(circle, rgba(201,168,76,0.1) 0%, transparent 70%)",
                  borderRadius: "50%",
                }}
              />
              {[
                {
                  label: "5-Number Match",
                  pct: "40%",
                  tag: "Jackpot",
                  tagColor: "#f0d87a",
                  rollover: true,
                },
                {
                  label: "4-Number Match",
                  pct: "35%",
                  tag: "4-Match",
                  tagColor: "#e2e8f0",
                  rollover: false,
                },
                {
                  label: "3-Number Match",
                  pct: "25%",
                  tag: "3-Match",
                  tagColor: "#94a3b8",
                  rollover: false,
                },
              ].map((tier, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "20px 0",
                    borderBottom:
                      i < 2 ? "1px solid rgba(255,255,255,0.07)" : "none",
                  }}
                >
                  <div>
                    <span
                      style={{
                        color: tier.tagColor,
                        fontFamily: "var(--font-clash)",
                        fontWeight: 600,
                      }}
                    >
                      {tier.label}
                    </span>
                    {tier.rollover && (
                      <span
                        style={{
                          marginLeft: 8,
                          fontSize: "0.7rem",
                          padding: "2px 8px",
                          background: "rgba(201,168,76,0.15)",
                          color: "var(--gold)",
                          borderRadius: 10,
                          border: "1px solid rgba(201,168,76,0.2)",
                        }}
                      >
                        Rolls Over
                      </span>
                    )}
                    <div
                      style={{
                        color: "rgba(255,255,255,0.4)",
                        fontSize: "0.8rem",
                        marginTop: 4,
                      }}
                    >
                      Split equally among all winners
                    </div>
                  </div>
                  <div
                    style={{
                      fontFamily: "var(--font-clash)",
                      fontSize: "2rem",
                      fontWeight: 700,
                      color: tier.tagColor,
                    }}
                  >
                    {tier.pct}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── CHARITY SECTION ─────────────────────────────────── */}
      <section style={{ padding: "80px 0" }}>
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            height: 1,
            background:
              "linear-gradient(90deg, transparent, rgba(255,255,255,0.08), transparent)",
          }}
        />
        <div className="max-w-7xl mx-auto px-6" style={{ textAlign: "center" }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              marginBottom: 20,
              padding: "8px 20px",
              borderRadius: 20,
              background: "rgba(239,68,68,0.08)",
              border: "1px solid rgba(239,68,68,0.2)",
            }}
          >
            <Heart size={14} style={{ color: "#f87171" }} />
            <span
              style={{
                color: "#f87171",
                fontSize: "0.8rem",
                letterSpacing: "0.05em",
              }}
            >
              Real Impact
            </span>
          </div>
          <h2
            style={{
              fontFamily: "var(--font-clash)",
              fontSize: "clamp(2rem, 4vw, 3rem)",
              fontWeight: 700,
              letterSpacing: "-0.02em",
              marginBottom: 16,
            }}
          >
            Your game fuels a cause.
          </h2>
          <p
            style={{
              color: "rgba(255,255,255,0.5)",
              fontSize: "1.05rem",
              lineHeight: 1.7,
              maxWidth: 540,
              margin: "0 auto 48px",
            }}
          >
            At least 10% of your subscription goes to a charity you choose. You
            can give more. Donations are tracked, transparent, and real.
          </p>
          <Link
            href="/charities"
            className="btn-primary"
            style={{ margin: "0 auto" }}
          >
            Browse Charities <ArrowRight size={16} />
          </Link>
        </div>
      </section>

      {/* ── SUBSCRIPTION CTA ────────────────────────────────── */}
      <section style={{ padding: "100px 0" }}>
        <div className="max-w-7xl mx-auto px-6">
          <div
            style={{
              borderRadius: 24,
              padding: "clamp(40px, 6vw, 80px)",
              background:
                "linear-gradient(135deg, rgba(201,168,76,0.08) 0%, rgba(255,255,255,0.03) 100%)",
              border: "1px solid rgba(201,168,76,0.15)",
              textAlign: "center",
              position: "relative",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                position: "absolute",
                top: -60,
                right: -60,
                width: 250,
                height: 250,
                background:
                  "radial-gradient(circle, rgba(201,168,76,0.12) 0%, transparent 70%)",
                borderRadius: "50%",
              }}
            />
            <h2
              style={{
                fontFamily: "var(--font-clash)",
                fontSize: "clamp(2rem, 4vw, 3.2rem)",
                fontWeight: 700,
                letterSpacing: "-0.02em",
                marginBottom: 16,
              }}
            >
              Ready to play for real?
            </h2>
            <p
              style={{
                color: "rgba(255,255,255,0.5)",
                marginBottom: 40,
                fontSize: "1.05rem",
              }}
            >
              Monthly from £9.99. Cancel anytime. Your scores are your ticket.
            </p>
            <div
              style={{
                display: "flex",
                gap: 16,
                justifyContent: "center",
                flexWrap: "wrap",
              }}
            >
              <Link
                href="/signup?plan=monthly"
                className="btn-primary"
                style={{ fontSize: "1rem", padding: "14px 28px" }}
              >
                Monthly — £9.99
              </Link>
              <Link
                href="/signup?plan=yearly"
                className="btn-gold"
                style={{ fontSize: "1rem", padding: "14px 28px" }}
              >
                Yearly — £89.99{" "}
                <span style={{ fontSize: "0.8rem", opacity: 0.8 }}>
                  Save 25%
                </span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer
        style={{
          borderTop: "1px solid rgba(255,255,255,0.07)",
          padding: "40px 0",
          textAlign: "center",
        }}
      >
        <div className="max-w-7xl mx-auto px-6">
          <p style={{ color: "rgba(255,255,255,0.3)", fontSize: "0.85rem" }}>
            © 2026 GolfDraw · Built with purpose ·{" "}
            <Link href="/charities" style={{ color: "rgba(255,255,255,0.4)" }}>
              Charities
            </Link>{" "}
            ·{" "}
            <Link
              href="/how-it-works"
              style={{ color: "rgba(255,255,255,0.4)" }}
            >
              How It Works
            </Link>
          </p>
        </div>
      </footer>
    </div>
  );
}
