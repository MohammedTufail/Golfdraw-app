import Navbar from "@/components/layout/navbar";
import { createServerClientInstance } from "@/lib/supabase/server";
import Link from "next/link";
import { Heart, ExternalLink, Star, ArrowRight } from "lucide-react";
import type { Database } from "@/lib/supabase/types";

export const revalidate = 60;

type Charity = Database["public"]["Tables"]["charities"]["Row"];

export default async function CharitiesPage() {
  const supabase = await createServerClientInstance();
  const { data } = await supabase
    .from("charities")
    .select("*")
    .eq("is_active", true)
    .order("is_featured", { ascending: false });

  const charities = (data as Charity[]) || [];
  const featured = charities.find((c) => c.is_featured);
  const rest = charities.filter((c) => !c.is_featured);

  return (
    <div style={{ background: "var(--bg)", minHeight: "100vh" }}>
      <Navbar />
      <div
        className="max-w-5xl mx-auto px-6"
        style={{ paddingTop: 100, paddingBottom: 80 }}
      >
        <div style={{ textAlign: "center", marginBottom: 64 }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              marginBottom: 16,
              padding: "6px 16px",
              borderRadius: 20,
              background: "rgba(239,68,68,0.08)",
              border: "1px solid rgba(239,68,68,0.2)",
            }}
          >
            <Heart size={12} style={{ color: "#f87171" }} />
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
          <h1
            style={{
              fontFamily: "var(--font-clash)",
              fontSize: "clamp(2rem, 5vw, 3.5rem)",
              fontWeight: 700,
              letterSpacing: "-0.02em",
              marginBottom: 16,
            }}
          >
            Charities We Support
          </h1>
          <p
            style={{
              color: "rgba(255,255,255,0.5)",
              fontSize: "1.05rem",
              lineHeight: 1.7,
              maxWidth: 520,
              margin: "0 auto",
            }}
          >
            Every subscriber chooses a charity. A minimum of 10% of every
            subscription is donated automatically.
          </p>
        </div>

        {featured && (
          <div style={{ marginBottom: 48 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                marginBottom: 16,
              }}
            >
              <Star size={14} style={{ color: "var(--gold)" }} />
              <span
                style={{
                  color: "var(--gold)",
                  fontSize: "0.8rem",
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                }}
              >
                Featured This Month
              </span>
            </div>
            <div
              style={{
                borderRadius: 20,
                padding: 36,
                background:
                  "linear-gradient(135deg, rgba(239,68,68,0.08) 0%, rgba(255,255,255,0.02) 100%)",
                border: "1px solid rgba(239,68,68,0.2)",
                position: "relative",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  gap: 24,
                  flexWrap: "wrap",
                }}
              >
                <div style={{ flex: 1 }}>
                  <h2
                    style={{
                      fontFamily: "var(--font-clash)",
                      fontSize: "1.8rem",
                      fontWeight: 700,
                      marginBottom: 12,
                    }}
                  >
                    {featured.name}
                  </h2>
                  <p
                    style={{
                      color: "rgba(255,255,255,0.55)",
                      lineHeight: 1.7,
                      marginBottom: 20,
                      maxWidth: 520,
                    }}
                  >
                    {featured.description}
                  </p>
                  <div>
                    <div
                      style={{
                        color: "rgba(255,255,255,0.35)",
                        fontSize: "0.75rem",
                        letterSpacing: "0.06em",
                        textTransform: "uppercase",
                        marginBottom: 4,
                      }}
                    >
                      Raised via GolfDraw
                    </div>
                    <div
                      style={{
                        fontFamily: "var(--font-clash)",
                        fontSize: "1.6rem",
                        fontWeight: 700,
                        color: "#f87171",
                      }}
                    >
                      £{featured.total_received.toLocaleString("en-GB")}
                    </div>
                  </div>
                </div>
                <div
                  style={{ display: "flex", flexDirection: "column", gap: 12 }}
                >
                  <Link href="/signup" className="btn-gold">
                    Support This Charity <ArrowRight size={16} />
                  </Link>
                  {featured.website_url && (
                    <a
                      href={featured.website_url}
                      target="_blank"
                      rel="noopener"
                      className="btn-primary"
                      style={{ justifyContent: "center" }}
                    >
                      <ExternalLink size={14} /> Visit Website
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        <h2
          style={{
            fontFamily: "var(--font-clash)",
            fontSize: "1.2rem",
            fontWeight: 600,
            marginBottom: 20,
            color: "rgba(255,255,255,0.6)",
          }}
        >
          All Supported Charities
        </h2>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
            gap: 16,
          }}
        >
          {rest.map((charity) => (
            <div
              key={charity.id}
              className="glass-card"
              style={{ padding: 24 }}
            >
              <h3
                style={{
                  fontFamily: "var(--font-clash)",
                  fontSize: "1.05rem",
                  fontWeight: 600,
                  marginBottom: 10,
                }}
              >
                {charity.name}
              </h3>
              {charity.description && (
                <p
                  style={{
                    color: "rgba(255,255,255,0.45)",
                    fontSize: "0.875rem",
                    lineHeight: 1.6,
                    marginBottom: 16,
                  }}
                >
                  {charity.description.length > 120
                    ? charity.description.slice(0, 120) + "…"
                    : charity.description}
                </p>
              )}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <div>
                  <div
                    style={{
                      color: "rgba(255,255,255,0.3)",
                      fontSize: "0.75rem",
                      marginBottom: 2,
                    }}
                  >
                    Total raised
                  </div>
                  <div
                    style={{
                      fontFamily: "var(--font-clash)",
                      fontWeight: 700,
                      color: "#f87171",
                    }}
                  >
                    £{charity.total_received.toLocaleString("en-GB")}
                  </div>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  {charity.website_url && (
                    <a
                      href={charity.website_url}
                      target="_blank"
                      rel="noopener"
                      style={{ color: "rgba(255,255,255,0.3)" }}
                    >
                      <ExternalLink size={15} />
                    </a>
                  )}
                  <Link
                    href="/signup"
                    style={{ color: "rgba(255,255,255,0.3)" }}
                  >
                    <Heart size={15} />
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div style={{ textAlign: "center", marginTop: 64 }}>
          <p style={{ color: "rgba(255,255,255,0.4)", marginBottom: 20 }}>
            Choose your charity when you subscribe. You can change it anytime.
          </p>
          <Link href="/signup" className="btn-gold">
            Subscribe & Choose a Charity <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    </div>
  );
}
