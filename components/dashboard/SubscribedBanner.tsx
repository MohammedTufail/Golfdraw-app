"use client";
/**
 * Subscription Success Page — /dashboard?subscribed=1
 * WHY: After LemonSqueezy redirects back post-payment, the user lands here.
 * We show a congratulatory message and guide them through onboarding:
 * 1. Choose a charity, 2. Enter first score. Keeps drop-off low.
 */

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { CheckCircle, ArrowRight, Heart, TrendingUp } from "lucide-react";

export default function SubscribedBanner() {
  const params = useSearchParams();
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (params.get("subscribed") === "1") {
      setShow(true);
      // Remove query param from URL without reload
      window.history.replaceState({}, "", "/dashboard");
      // Auto-hide after 10s
      setTimeout(() => setShow(false), 10000);
    }
  }, []);

  if (!show) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: 80,
        left: "50%",
        transform: "translateX(-50%)",
        width: "90%",
        maxWidth: 540,
        zIndex: 999,
        borderRadius: 18,
        padding: 28,
        background:
          "linear-gradient(135deg, rgba(201,168,76,0.15) 0%, rgba(74,222,128,0.08) 100%)",
        border: "1px solid rgba(74,222,128,0.3)",
        backdropFilter: "blur(20px)",
        boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
      }}
    >
      <div style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
        <CheckCircle
          size={28}
          style={{ color: "#4ade80", flexShrink: 0, marginTop: 2 }}
        />
        <div style={{ flex: 1 }}>
          <h3
            style={{
              fontFamily: "var(--font-clash)",
              fontSize: "1.2rem",
              fontWeight: 700,
              marginBottom: 6,
              color: "#4ade80",
            }}
          >
            You're in! 🎉
          </h3>
          <p
            style={{
              color: "rgba(255,255,255,0.6)",
              fontSize: "0.9rem",
              lineHeight: 1.6,
              marginBottom: 16,
            }}
          >
            Subscription confirmed. Complete your setup to enter the next draw.
          </p>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <Link
              href="/dashboard/charity"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "8px 16px",
                borderRadius: 8,
                background: "rgba(239,68,68,0.12)",
                border: "1px solid rgba(239,68,68,0.25)",
                color: "#f87171",
                fontSize: "0.85rem",
                textDecoration: "none",
              }}
            >
              <Heart size={13} /> Choose Charity
            </Link>
            <Link
              href="/dashboard/scores"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "8px 16px",
                borderRadius: 8,
                background: "rgba(201,168,76,0.12)",
                border: "1px solid rgba(201,168,76,0.25)",
                color: "var(--gold)",
                fontSize: "0.85rem",
                textDecoration: "none",
              }}
            >
              <TrendingUp size={13} /> Add Scores <ArrowRight size={13} />
            </Link>
          </div>
        </div>
        <button
          onClick={() => setShow(false)}
          style={{
            background: "none",
            border: "none",
            color: "rgba(255,255,255,0.3)",
            cursor: "pointer",
            fontSize: "1.2rem",
            lineHeight: 1,
            flexShrink: 0,
          }}
        >
          ×
        </button>
      </div>
    </div>
  );
}
