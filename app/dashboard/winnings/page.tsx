"use client";
/**
 * User Winnings Dashboard
 * WHY: Central place for winners to see their earnings, upload verification proofs,
 * and track payout status. Upload flow triggers admin review.
 */

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import Navbar from "@/components/layout/navbar";
import {
  ArrowLeft,
  Trophy,
  Upload,
  CheckCircle,
  Clock,
  XCircle,
  Info,
} from "lucide-react";

type Winner = {
  id: string;
  draw_id: string;
  match_type: string;
  matched_numbers: number[];
  prize_amount: number;
  proof_url: string | null;
  verification_status: string;
  payout_status: string;
  draws: {
    title: string;
    draw_month: string;
    winning_numbers: number[];
  } | null;
};

export default function WinningsPage() {
  const router = useRouter();
  const supabase = createClient();
  const [winners, setWinners] = useState<Winner[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState<string | null>(null);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeUploadId, setActiveUploadId] = useState<string | null>(null);

  useEffect(() => {
    loadWinnings();
  }, []);

  const loadWinnings = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      router.push("/login");
      return;
    }

    const { data } = await supabase
      .from("winners")
      .select("*, draws(title, draw_month, winning_numbers)")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    setWinners((data as any) || []);
    setLoading(false);
  };

  const handleUpload = async (winnerId: string, file: File) => {
    setUploading(winnerId);
    setMessage(null);

    const form = new FormData();
    form.append("file", file);
    form.append("winnerId", winnerId);

    const res = await fetch("/api/winners/upload-proof", {
      method: "POST",
      body: form,
    });
    const data = await res.json();

    if (data.success) {
      setMessage({
        type: "success",
        text: "Proof uploaded! Admin will review shortly.",
      });
      loadWinnings();
    } else {
      setMessage({ type: "error", text: data.error || "Upload failed" });
    }
    setUploading(null);
  };

  const statusIcon = (vs: string, ps: string) => {
    if (ps === "paid")
      return <CheckCircle size={16} style={{ color: "#4ade80" }} />;
    if (vs === "approved")
      return <Clock size={16} style={{ color: "var(--gold)" }} />;
    if (vs === "rejected")
      return <XCircle size={16} style={{ color: "#f87171" }} />;
    return <Clock size={16} style={{ color: "rgba(255,255,255,0.3)" }} />;
  };

  const totalWon = winners.reduce((s, w) => s + w.prize_amount, 0);
  const totalPaid = winners
    .filter((w) => w.payout_status === "paid")
    .reduce((s, w) => s + w.prize_amount, 0);

  return (
    <div style={{ background: "var(--bg)", minHeight: "100vh" }}>
      <Navbar />

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        style={{ display: "none" }}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file && activeUploadId) handleUpload(activeUploadId, file);
          e.target.value = "";
        }}
      />

      <div
        className="max-w-4xl mx-auto px-6"
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
              My Winnings
            </h1>
            <p
              style={{
                color: "rgba(255,255,255,0.4)",
                fontSize: "0.9rem",
                marginTop: 4,
              }}
            >
              Track your draw results and payout status
            </p>
          </div>
        </div>

        {/* Summary Stats */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
            gap: 16,
            marginBottom: 32,
          }}
        >
          {[
            {
              label: "Total Won",
              value: `£${totalWon.toFixed(2)}`,
              color: "var(--gold)",
            },
            {
              label: "Paid Out",
              value: `£${totalPaid.toFixed(2)}`,
              color: "#4ade80",
            },
            {
              label: "Pending",
              value: `£${(totalWon - totalPaid).toFixed(2)}`,
              color: "#facc15",
            },
            {
              label: "Draws Won",
              value: String(winners.length),
              color: "white",
            },
          ].map((s) => (
            <div
              key={s.label}
              className="stat-card"
              style={{ textAlign: "center" }}
            >
              <div
                style={{
                  fontFamily: "var(--font-clash)",
                  fontSize: "1.6rem",
                  fontWeight: 700,
                  color: s.color,
                }}
              >
                {s.value}
              </div>
              <div
                style={{
                  color: "rgba(255,255,255,0.4)",
                  fontSize: "0.78rem",
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                  marginTop: 4,
                }}
              >
                {s.label}
              </div>
            </div>
          ))}
        </div>

        {/* Message */}
        {message && (
          <div
            style={{
              background:
                message.type === "success"
                  ? "rgba(74,222,128,0.1)"
                  : "rgba(248,113,113,0.1)",
              border: `1px solid ${message.type === "success" ? "rgba(74,222,128,0.25)" : "rgba(248,113,113,0.25)"}`,
              borderRadius: 10,
              padding: "12px 16px",
              marginBottom: 20,
              color: message.type === "success" ? "#4ade80" : "#f87171",
              fontSize: "0.9rem",
            }}
          >
            {message.text}
          </div>
        )}

        {/* Winnings List */}
        {loading ? (
          <div
            style={{
              textAlign: "center",
              padding: 60,
              color: "rgba(255,255,255,0.3)",
            }}
          >
            Loading...
          </div>
        ) : winners.length === 0 ? (
          <div
            className="glass-card"
            style={{ padding: "60px 32px", textAlign: "center" }}
          >
            <Trophy
              size={40}
              style={{ color: "rgba(255,255,255,0.15)", margin: "0 auto 16px" }}
            />
            <h3
              style={{
                fontFamily: "var(--font-clash)",
                fontSize: "1.2rem",
                fontWeight: 600,
                marginBottom: 8,
              }}
            >
              No winnings yet
            </h3>
            <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.9rem" }}>
              Keep entering scores — your next draw entry could be a winner.
            </p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {winners.map((w) => {
              const draw = w.draws;
              const needsProof =
                ["5_match", "4_match", "3_match"].includes(w.match_type) &&
                !w.proof_url &&
                w.verification_status !== "approved" &&
                w.payout_status !== "paid";
              const isRejected = w.verification_status === "rejected";

              return (
                <div key={w.id} className="glass-card" style={{ padding: 24 }}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      gap: 16,
                      flexWrap: "wrap",
                    }}
                  >
                    {/* Left */}
                    <div>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 10,
                          marginBottom: 8,
                        }}
                      >
                        {statusIcon(w.verification_status, w.payout_status)}
                        <span
                          style={{
                            fontFamily: "var(--font-clash)",
                            fontSize: "1rem",
                            fontWeight: 600,
                          }}
                        >
                          {w.match_type.replace("_", "-")} Winner
                        </span>
                        <span
                          className={`badge badge-${w.payout_status === "paid" ? "paid" : w.verification_status === "approved" ? "pending" : w.verification_status === "rejected" ? "rejected" : "pending"}`}
                        >
                          {w.payout_status === "paid"
                            ? "Paid"
                            : w.verification_status === "approved"
                              ? "Verified"
                              : w.verification_status === "rejected"
                                ? "Rejected"
                                : "Pending Verification"}
                        </span>
                      </div>

                      {draw && (
                        <div
                          style={{
                            color: "rgba(255,255,255,0.4)",
                            fontSize: "0.85rem",
                            marginBottom: 12,
                          }}
                        >
                          {draw.title} ·{" "}
                          {new Date(draw.draw_month).toLocaleDateString(
                            "en-GB",
                            { month: "long", year: "numeric" },
                          )}
                        </div>
                      )}

                      {/* Matched numbers */}
                      {w.matched_numbers?.length > 0 && (
                        <div
                          style={{
                            display: "flex",
                            gap: 6,
                            alignItems: "center",
                            flexWrap: "wrap",
                          }}
                        >
                          <span
                            style={{
                              color: "rgba(255,255,255,0.3)",
                              fontSize: "0.78rem",
                              marginRight: 4,
                            }}
                          >
                            Your matches:
                          </span>
                          {w.matched_numbers.map((n) => (
                            <div
                              key={n}
                              style={{
                                width: 30,
                                height: 30,
                                borderRadius: 7,
                                background: "rgba(201,168,76,0.12)",
                                color: "var(--gold)",
                                border: "1px solid rgba(201,168,76,0.3)",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontFamily: "var(--font-clash)",
                                fontWeight: 700,
                                fontSize: "0.85rem",
                              }}
                            >
                              {n}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Right: amount + actions */}
                    <div style={{ textAlign: "right" }}>
                      <div
                        style={{
                          fontFamily: "var(--font-clash)",
                          fontSize: "2rem",
                          fontWeight: 700,
                          color: "var(--gold)",
                          marginBottom: 12,
                        }}
                      >
                        £{w.prize_amount.toFixed(2)}
                      </div>

                      {(needsProof || isRejected) && (
                        <button
                          onClick={() => {
                            setActiveUploadId(w.id);
                            fileInputRef.current?.click();
                          }}
                          disabled={uploading === w.id}
                          className="btn-primary"
                          style={{
                            padding: "8px 16px",
                            fontSize: "0.85rem",
                            opacity: uploading === w.id ? 0.5 : 1,
                          }}
                        >
                          <Upload size={14} />
                          {uploading === w.id
                            ? "Uploading..."
                            : isRejected
                              ? "Re-upload Proof"
                              : "Upload Proof"}
                        </button>
                      )}

                      {w.proof_url && w.verification_status === "pending" && (
                        <div
                          style={{
                            color: "#facc15",
                            fontSize: "0.8rem",
                            display: "flex",
                            alignItems: "center",
                            gap: 4,
                          }}
                        >
                          <Clock size={12} /> Proof submitted — awaiting admin
                          review
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Rejection reason info */}
                  {isRejected && (
                    <div
                      style={{
                        marginTop: 16,
                        padding: "12px 14px",
                        borderRadius: 10,
                        background: "rgba(248,113,113,0.08)",
                        border: "1px solid rgba(248,113,113,0.2)",
                        display: "flex",
                        gap: 10,
                        alignItems: "flex-start",
                      }}
                    >
                      <Info
                        size={14}
                        style={{
                          color: "#f87171",
                          flexShrink: 0,
                          marginTop: 1,
                        }}
                      />
                      <p
                        style={{
                          color: "#f87171",
                          fontSize: "0.85rem",
                          lineHeight: 1.5,
                        }}
                      >
                        Your proof was rejected. Please re-upload a clear
                        screenshot showing your Stableford scores from your
                        official golf platform, including dates.
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
