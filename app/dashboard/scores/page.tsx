"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import Navbar from "@/components/layout/navbar";
import { ArrowLeft, Plus, Trash2, Edit2, Save, X, Info } from "lucide-react";

type Score = {
  id: string;
  score_date: string;
  stableford_score: number;
};

export default function ScoresPage() {
  const router = useRouter();
  const supabase = createClient();
  const [scores, setScores] = useState<Score[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formDate, setFormDate] = useState("");
  const [formScore, setFormScore] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadScores = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      router.push("/login");
      return;
    }

    const { data } = await supabase
      .from("scores")
      .select("*")
      .eq("user_id", user.id)
      .order("score_date", { ascending: false });

    setScores(data || []);
    setLoading(false);
  };

  useEffect(() => {
    loadScores();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    setSuccess("");

    const score = parseInt(formScore);
    if (score < 1 || score > 45) {
      setError("Score must be between 1 and 45");
      setSubmitting(false);
      return;
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      router.push("/login");
      return;
    }

    if (editingId) {
      // Update existing
      const { error: err } = await supabase
        .from("scores")
        .update({
          score_date: formDate,
          stableford_score: score,
          updated_at: new Date().toISOString(),
        })
        .eq("id", editingId)
        .eq("user_id", user.id);

      if (err) {
        setError(
          err.message.includes("unique")
            ? "A score already exists for this date."
            : err.message,
        );
      } else {
        setSuccess("Score updated!");
        setEditingId(null);
        setShowForm(false);
        setFormDate("");
        setFormScore("");
        loadScores();
      }
    } else {
      // Insert new — DB trigger handles rolling 5
      const { error: err } = await supabase
        .from("scores")
        .insert({
          user_id: user.id,
          score_date: formDate,
          stableford_score: score,
        });

      if (err) {
        setError(
          err.message.includes("unique")
            ? "A score already exists for this date."
            : err.message,
        );
      } else {
        setSuccess("Score added!");
        setShowForm(false);
        setFormDate("");
        setFormScore("");
        loadScores();
      }
    }
    setSubmitting(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this score?")) return;
    const {
      data: { user },
    } = await supabase.auth.getUser();
    await supabase.from("scores").delete().eq("id", id).eq("user_id", user!.id);
    setSuccess("Score deleted.");
    loadScores();
  };

  const startEdit = (s: Score) => {
    setEditingId(s.id);
    setFormDate(s.score_date);
    setFormScore(String(s.stableford_score));
    setShowForm(true);
    setError("");
  };

  const cancelForm = () => {
    setShowForm(false);
    setEditingId(null);
    setFormDate("");
    setFormScore("");
    setError("");
  };

  return (
    <div style={{ background: "var(--bg)", minHeight: "100vh" }}>
      <Navbar />

      <div
        className="max-w-2xl mx-auto px-6"
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
            style={{
              display: "flex",
              alignItems: "center",
              color: "rgba(255,255,255,0.4)",
              textDecoration: "none",
              transition: "color 0.2s",
            }}
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
              My Scores
            </h1>
            <p
              style={{
                color: "rgba(255,255,255,0.4)",
                fontSize: "0.9rem",
                marginTop: 4,
              }}
            >
              Stableford format · 1–45 · Up to 5 scores
            </p>
          </div>
        </div>

        {/* Info Banner */}
        <div
          style={{
            display: "flex",
            gap: 12,
            padding: "16px",
            borderRadius: 12,
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.08)",
            marginBottom: 28,
          }}
        >
          <Info
            size={16}
            style={{ color: "var(--gold)", flexShrink: 0, marginTop: 2 }}
          />
          <p
            style={{
              color: "rgba(255,255,255,0.5)",
              fontSize: "0.85rem",
              lineHeight: 1.6,
            }}
          >
            Your 5 most recent scores are your draw numbers. Adding a 6th score
            automatically removes the oldest. One score per date — existing
            dates can only be edited or deleted.
          </p>
        </div>

        {/* Feedback messages */}
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
        {success && (
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
            {success}
          </div>
        )}

        {/* Add Form */}
        {showForm && (
          <div className="glass-card" style={{ padding: 28, marginBottom: 24 }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 20,
              }}
            >
              <h3
                style={{
                  fontFamily: "var(--font-clash)",
                  fontSize: "1.1rem",
                  fontWeight: 600,
                }}
              >
                {editingId ? "Edit Score" : "Add Score"}
              </h3>
              <button
                onClick={cancelForm}
                style={{
                  background: "none",
                  border: "none",
                  color: "rgba(255,255,255,0.4)",
                  cursor: "pointer",
                }}
              >
                <X size={18} />
              </button>
            </div>
            <form
              onSubmit={handleSubmit}
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
                  Date Played
                </label>
                <input
                  type="date"
                  className="glass-input"
                  value={formDate}
                  onChange={(e) => setFormDate(e.target.value)}
                  max={new Date().toISOString().split("T")[0]}
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
                  Stableford Score{" "}
                  <span style={{ color: "rgba(255,255,255,0.3)" }}>(1–45)</span>
                </label>
                <input
                  type="number"
                  className="glass-input"
                  placeholder="e.g. 36"
                  value={formScore}
                  onChange={(e) => setFormScore(e.target.value)}
                  min={1}
                  max={45}
                  required
                />
              </div>
              <div style={{ display: "flex", gap: 12 }}>
                <button
                  type="submit"
                  className="btn-gold"
                  style={{
                    flex: 1,
                    justifyContent: "center",
                    opacity: submitting ? 0.6 : 1,
                  }}
                  disabled={submitting}
                >
                  <Save size={16} />{" "}
                  {submitting
                    ? "Saving..."
                    : editingId
                      ? "Update Score"
                      : "Add Score"}
                </button>
                <button
                  type="button"
                  onClick={cancelForm}
                  className="btn-primary"
                  style={{ padding: "12px 20px" }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Score List */}
        <div className="glass-card" style={{ overflow: "hidden" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "20px 24px",
              borderBottom: "1px solid rgba(255,255,255,0.07)",
            }}
          >
            <div>
              <span
                style={{ fontFamily: "var(--font-clash)", fontWeight: 600 }}
              >
                {scores.length} / 5 scores
              </span>
              <div
                style={{
                  width: `${(scores.length / 5) * 100}%`,
                  height: 3,
                  background: "var(--gold)",
                  borderRadius: 2,
                  marginTop: 6,
                  transition: "width 0.3s",
                }}
              />
            </div>
            {!showForm && scores.length < 5 && (
              <button
                onClick={() => {
                  setShowForm(true);
                  setEditingId(null);
                }}
                className="btn-primary"
                style={{ padding: "8px 16px", fontSize: "0.85rem" }}
              >
                <Plus size={14} /> Add Score
              </button>
            )}
          </div>

          {loading ? (
            <div
              style={{
                padding: 40,
                textAlign: "center",
                color: "rgba(255,255,255,0.3)",
              }}
            >
              Loading...
            </div>
          ) : scores.length === 0 ? (
            <div
              style={{
                padding: "48px 24px",
                textAlign: "center",
                color: "rgba(255,255,255,0.3)",
              }}
            >
              <p style={{ marginBottom: 16 }}>
                No scores yet. Add your first score to enter the draw.
              </p>
              <button onClick={() => setShowForm(true)} className="btn-primary">
                <Plus size={14} /> Add First Score
              </button>
            </div>
          ) : (
            scores.map((s, i) => (
              <div
                key={s.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  padding: "16px 24px",
                  borderBottom:
                    i < scores.length - 1
                      ? "1px solid rgba(255,255,255,0.05)"
                      : "none",
                  transition: "background 0.2s",
                }}
              >
                <div
                  style={{
                    flex: 1,
                    display: "flex",
                    alignItems: "center",
                    gap: 16,
                  }}
                >
                  {/* Score Number */}
                  <div
                    style={{
                      width: 52,
                      height: 52,
                      borderRadius: 14,
                      background:
                        i === 0
                          ? "rgba(201,168,76,0.12)"
                          : "rgba(255,255,255,0.04)",
                      border:
                        i === 0
                          ? "1px solid rgba(201,168,76,0.3)"
                          : "1px solid rgba(255,255,255,0.08)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontFamily: "var(--font-clash)",
                      fontSize: "1.2rem",
                      fontWeight: 700,
                      color: i === 0 ? "var(--gold)" : "white",
                    }}
                  >
                    {s.stableford_score}
                  </div>
                  <div>
                    <div style={{ fontWeight: 500, fontSize: "0.95rem" }}>
                      {new Date(s.score_date).toLocaleDateString("en-GB", {
                        weekday: "short",
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    </div>
                    {i === 0 && (
                      <div
                        style={{
                          color: "var(--gold)",
                          fontSize: "0.75rem",
                          marginTop: 2,
                        }}
                      >
                        Most Recent
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div style={{ display: "flex", gap: 8 }}>
                  <button
                    onClick={() => startEdit(s)}
                    style={{
                      width: 34,
                      height: 34,
                      borderRadius: 8,
                      border: "1px solid rgba(255,255,255,0.1)",
                      background: "rgba(255,255,255,0.04)",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "rgba(255,255,255,0.5)",
                      transition: "all 0.2s",
                    }}
                    title="Edit"
                  >
                    <Edit2 size={13} />
                  </button>
                  <button
                    onClick={() => handleDelete(s.id)}
                    style={{
                      width: 34,
                      height: 34,
                      borderRadius: 8,
                      border: "1px solid rgba(248,113,113,0.2)",
                      background: "rgba(248,113,113,0.05)",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#f87171",
                      transition: "all 0.2s",
                    }}
                    title="Delete"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {scores.length === 5 && !showForm && (
          <p
            style={{
              color: "rgba(255,255,255,0.3)",
              fontSize: "0.8rem",
              textAlign: "center",
              marginTop: 16,
            }}
          >
            Maximum 5 scores reached. Adding a new score will remove the oldest.
            <button
              onClick={() => setShowForm(true)}
              style={{
                background: "none",
                border: "none",
                color: "rgba(201,168,76,0.7)",
                cursor: "pointer",
                marginLeft: 6,
                fontSize: "0.8rem",
              }}
            >
              Add anyway →
            </button>
          </p>
        )}
      </div>
    </div>
  );
}
