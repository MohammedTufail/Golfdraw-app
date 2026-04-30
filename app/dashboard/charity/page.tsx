"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import Navbar from "@/components/layout/navbar";
import { ArrowLeft, Heart, Check, ExternalLink } from "lucide-react";

type Charity = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  website_url: string | null;
  is_featured: boolean;
  total_received: number;
};

export default function CharitySelectPage() {
  const router = useRouter();
  const supabase = createClient();
  const [charities, setCharities] = useState<Charity[]>([]);
  const [currentCharityId, setCurrentCharityId] = useState<string | null>(null);
  const [contributionPct, setContributionPct] = useState(10);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const init = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }

      const [{ data: charityList }, { data: profile }] = await Promise.all([
        supabase
          .from("charities")
          .select("*")
          .eq("is_active", true)
          .order("is_featured", { ascending: false }),
        supabase
          .from("profiles")
          .select("charity_id, charity_contribution_pct")
          .eq("id", user.id)
          .single(),
      ]);

      setCharities(charityList || []);
      setCurrentCharityId(profile?.charity_id || null);
      setSelectedId(profile?.charity_id || null);
      setContributionPct(profile?.charity_contribution_pct || 10);
    };
    init();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    await supabase
      .from("profiles")
      .update({
        charity_id: selectedId,
        charity_contribution_pct: contributionPct,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id);

    setSaved(true);
    setSaving(false);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div style={{ background: "var(--bg)", minHeight: "100vh" }}>
      <Navbar />

      <div
        className="max-w-3xl mx-auto px-6"
        style={{ paddingTop: 100, paddingBottom: 60 }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
            marginBottom: 40,
          }}
        >
          <Link
            href="/dashboard"
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
              Choose Your Charity
            </h1>
            <p
              style={{
                color: "rgba(255,255,255,0.4)",
                fontSize: "0.9rem",
                marginTop: 4,
              }}
            >
              Minimum 10% of your subscription goes to your chosen cause
            </p>
          </div>
        </div>

        {/* Contribution Slider */}
        <div className="glass-card" style={{ padding: 28, marginBottom: 28 }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 20,
            }}
          >
            <div>
              <h3
                style={{
                  fontFamily: "var(--font-clash)",
                  fontWeight: 600,
                  marginBottom: 4,
                }}
              >
                Your Contribution
              </h3>
              <p
                style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.85rem" }}
              >
                Minimum 10%, increase to give more
              </p>
            </div>
            <div
              style={{
                fontFamily: "var(--font-clash)",
                fontSize: "2.5rem",
                fontWeight: 700,
                color: "#f87171",
              }}
            >
              {contributionPct}%
            </div>
          </div>
          <input
            type="range"
            min={10}
            max={100}
            step={5}
            value={contributionPct}
            onChange={(e) => setContributionPct(parseInt(e.target.value))}
            style={{ width: "100%", accentColor: "#f87171" }}
          />
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              color: "rgba(255,255,255,0.3)",
              fontSize: "0.75rem",
              marginTop: 8,
            }}
          >
            <span>10% (min)</span>
            <span>100%</span>
          </div>
        </div>

        {saved && (
          <div
            style={{
              background: "rgba(74,222,128,0.1)",
              border: "1px solid rgba(74,222,128,0.25)",
              borderRadius: 10,
              padding: "12px 16px",
              marginBottom: 20,
              color: "#4ade80",
              fontSize: "0.9rem",
            }}
          >
            ✓ Charity preference saved!
          </div>
        )}

        {/* Charity List */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 12,
            marginBottom: 28,
          }}
        >
          {charities.map((c) => (
            <div
              key={c.id}
              onClick={() => setSelectedId(c.id)}
              style={{
                padding: "20px 24px",
                borderRadius: 14,
                cursor: "pointer",
                border:
                  selectedId === c.id
                    ? "1px solid rgba(239,68,68,0.4)"
                    : "1px solid rgba(255,255,255,0.08)",
                background:
                  selectedId === c.id
                    ? "rgba(239,68,68,0.06)"
                    : "rgba(255,255,255,0.03)",
                transition: "all 0.2s",
                display: "flex",
                alignItems: "center",
                gap: 16,
              }}
            >
              {/* Radio */}
              <div
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: "50%",
                  flexShrink: 0,
                  border:
                    selectedId === c.id
                      ? "2px solid #f87171"
                      : "2px solid rgba(255,255,255,0.2)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: selectedId === c.id ? "#f87171" : "transparent",
                  transition: "all 0.2s",
                }}
              >
                {selectedId === c.id && <Check size={12} color="white" />}
              </div>

              <div style={{ flex: 1 }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    marginBottom: 4,
                  }}
                >
                  <span
                    style={{
                      fontFamily: "var(--font-clash)",
                      fontWeight: 600,
                      fontSize: "1rem",
                    }}
                  >
                    {c.name}
                  </span>
                  {c.is_featured && (
                    <span
                      style={{
                        fontSize: "0.7rem",
                        padding: "2px 8px",
                        borderRadius: 10,
                        background: "rgba(201,168,76,0.15)",
                        color: "var(--gold)",
                        border: "1px solid rgba(201,168,76,0.2)",
                      }}
                    >
                      Featured
                    </span>
                  )}
                </div>
                {c.description && (
                  <p
                    style={{
                      color: "rgba(255,255,255,0.45)",
                      fontSize: "0.85rem",
                      lineHeight: 1.5,
                    }}
                  >
                    {c.description}
                  </p>
                )}
                <div
                  style={{
                    marginTop: 6,
                    color: "rgba(255,255,255,0.3)",
                    fontSize: "0.78rem",
                  }}
                >
                  £{c.total_received.toLocaleString()} raised through GolfDraw
                </div>
              </div>

              {c.website_url && (
                <a
                  href={c.website_url}
                  target="_blank"
                  rel="noopener"
                  onClick={(e) => e.stopPropagation()}
                  style={{
                    color: "rgba(255,255,255,0.3)",
                    transition: "color 0.2s",
                  }}
                >
                  <ExternalLink size={15} />
                </a>
              )}
            </div>
          ))}
        </div>

        {/* Save */}
        <button
          onClick={handleSave}
          disabled={saving || !selectedId}
          className="btn-gold"
          style={{
            width: "100%",
            justifyContent: "center",
            opacity: saving || !selectedId ? 0.6 : 1,
          }}
        >
          <Heart size={16} />
          {saving ? "Saving..." : "Save Charity Selection"}
        </button>
      </div>
    </div>
  );
}
