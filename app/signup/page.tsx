"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Trophy, Check } from "lucide-react";

function SignupContent() {
  const router = useRouter();
  const params = useSearchParams();
  const supabase = createClient();

  const [step, setStep] = useState(1);
  const [plan, setPlan] = useState<"monthly" | "yearly">(
    (params.get("plan") as "monthly" | "yearly") || "monthly",
  );
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const { data, error: authErr } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    });

    if (authErr) {
      setError(authErr.message);
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          plan,
          userId: data.user?.id,
          email,
        }),
      });

      const { url } = await res.json();

      if (url) {
        window.location.href = url;
      } else {
        router.push("/dashboard");
      }
    } catch {
      router.push("/dashboard");
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--bg)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: "-10%",
          right: "-10%",
          width: 500,
          height: 500,
          background:
            "radial-gradient(circle, rgba(201,168,76,0.05) 0%, transparent 65%)",
          borderRadius: "50%",
          pointerEvents: "none",
        }}
      />

      <div
        style={{
          width: "100%",
          maxWidth: 480,
          position: "relative",
          zIndex: 1,
        }}
      >
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 36 }}>
          <Link
            href="/"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 10,
              textDecoration: "none",
            }}
          >
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: 10,
                background: "linear-gradient(135deg, #c9a84c, #f0d87a)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Trophy size={18} color="#080808" />
            </div>
            <span
              style={{
                fontFamily: "var(--font-clash)",
                fontWeight: 700,
                fontSize: "1.2rem",
                color: "white",
              }}
            >
              Golf<span className="gold-text">Draw</span>
            </span>
          </Link>
        </div>

        {/* Plan Selection */}
        <div className="glass-card" style={{ padding: 36 }}>
          <h1
            style={{
              fontFamily: "var(--font-clash)",
              fontSize: "1.7rem",
              fontWeight: 700,
              marginBottom: 6,
            }}
          >
            Create your account
          </h1>
          <p
            style={{
              color: "rgba(255,255,255,0.4)",
              marginBottom: 28,
              fontSize: "0.9rem",
            }}
          >
            Join thousands playing with purpose
          </p>

          {/* Plan Picker */}
          <div style={{ marginBottom: 28 }}>
            <label
              style={{
                color: "rgba(255,255,255,0.5)",
                fontSize: "0.8rem",
                letterSpacing: "0.06em",
                textTransform: "uppercase",
                display: "block",
                marginBottom: 12,
              }}
            >
              Choose Plan
            </label>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 12,
              }}
            >
              {[
                {
                  key: "monthly" as const,
                  label: "Monthly",
                  price: "£9.99/mo",
                  save: null,
                },
                {
                  key: "yearly" as const,
                  label: "Yearly",
                  price: "£89.99/yr",
                  save: "Save 25%",
                },
              ].map((p) => (
                <button
                  key={p.key}
                  type="button"
                  onClick={() => setPlan(p.key)}
                  style={{
                    padding: "16px 12px",
                    borderRadius: 12,
                    border:
                      plan === p.key
                        ? "1px solid rgba(201,168,76,0.5)"
                        : "1px solid rgba(255,255,255,0.1)",
                    background:
                      plan === p.key
                        ? "rgba(201,168,76,0.08)"
                        : "rgba(255,255,255,0.03)",
                    cursor: "pointer",
                    textAlign: "left",
                    transition: "all 0.2s",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                    }}
                  >
                    <span
                      style={{
                        fontFamily: "var(--font-clash)",
                        color: "white",
                        fontWeight: 600,
                        fontSize: "0.95rem",
                      }}
                    >
                      {p.label}
                    </span>
                    {plan === p.key && (
                      <Check size={14} style={{ color: "var(--gold)" }} />
                    )}
                  </div>
                  <div
                    style={{
                      color:
                        plan === p.key
                          ? "var(--gold)"
                          : "rgba(255,255,255,0.5)",
                      fontSize: "0.85rem",
                      marginTop: 4,
                    }}
                  >
                    {p.price}
                  </div>
                  {p.save && (
                    <div
                      style={{
                        color: "#4ade80",
                        fontSize: "0.75rem",
                        marginTop: 2,
                      }}
                    >
                      {p.save}
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {error && (
            <div
              style={{
                background: "rgba(248,113,113,0.1)",
                border: "1px solid rgba(248,113,113,0.25)",
                borderRadius: 10,
                padding: "12px 16px",
                marginBottom: 20,
                color: "#f87171",
                fontSize: "0.9rem",
              }}
            >
              {error}
            </div>
          )}

          <form
            onSubmit={handleSignup}
            style={{ display: "flex", flexDirection: "column", gap: 16 }}
          >
            <div>
              <label
                style={{
                  display: "block",
                  color: "rgba(255,255,255,0.6)",
                  fontSize: "0.85rem",
                  marginBottom: 8,
                }}
              >
                Full Name
              </label>
              <input
                type="text"
                className="glass-input"
                placeholder="John Smith"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />
            </div>
            <div>
              <label
                style={{
                  display: "block",
                  color: "rgba(255,255,255,0.6)",
                  fontSize: "0.85rem",
                  marginBottom: 8,
                }}
              >
                Email Address
              </label>
              <input
                type="email"
                className="glass-input"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div>
              <label
                style={{
                  display: "block",
                  color: "rgba(255,255,255,0.6)",
                  fontSize: "0.85rem",
                  marginBottom: 8,
                }}
              >
                Password
              </label>
              <input
                type="password"
                className="glass-input"
                placeholder="Min 8 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
              />
            </div>

            <button
              type="submit"
              className="btn-gold"
              style={{
                width: "100%",
                justifyContent: "center",
                marginTop: 8,
                opacity: loading ? 0.6 : 1,
              }}
              disabled={loading}
            >
              {loading ? "Setting up..." : `Continue to Payment →`}
            </button>
          </form>

          <p
            style={{
              textAlign: "center",
              color: "rgba(255,255,255,0.3)",
              fontSize: "0.8rem",
              marginTop: 20,
            }}
          >
            Secure payment via Lemonsqueezy · Cancel anytime
          </p>

          <div
            style={{
              borderTop: "1px solid rgba(255,255,255,0.07)",
              marginTop: 24,
              paddingTop: 20,
              textAlign: "center",
              color: "rgba(255,255,255,0.4)",
              fontSize: "0.9rem",
            }}
          >
            Already a member?{" "}
            <Link
              href="/login"
              style={{
                color: "white",
                textDecoration: "none",
                fontWeight: 500,
              }}
            >
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
export default function SignupPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SignupContent />
    </Suspense>
  );
}