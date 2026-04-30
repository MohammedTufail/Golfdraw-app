"use client";
/**
 * Admin Charity Management
 * WHY: Admin controls the charity directory — adding new charities,
 * editing descriptions, toggling featured status, and deactivating.
 * Featured charity appears on the homepage spotlight section.
 */
import { useRef } from "react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import Navbar from "@/components/layout/navbar";
import {
  ArrowLeft,
  Plus,
  Edit2,
  Trash2,
  Star,
  Eye,
  EyeOff,
  Save,
  X,
} from "lucide-react";

type Charity = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  website_url: string | null;
  is_featured: boolean;
  is_active: boolean;
  total_received: number;
};

const emptyForm = {
  name: "",
  slug: "",
  description: "",
  website_url: "",
  is_featured: false,
};

export default function AdminCharitiesPage() {
  const router = useRouter();
  const supabase = createClient();
  const [charities, setCharities] = useState<Charity[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  const hasLoaded = useRef(false);

  useEffect(() => {
    if (hasLoaded.current) return;
    hasLoaded.current = true;

    checkAndLoad();
  }, []);

  const checkAndLoad = async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      const user = session?.user;

      if (!user) {
        router.push("/login");
        return;
      }

      const { data: p } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      const profile = p as { role: "admin" | "subscriber" } | null;

      if (profile?.role !== "admin") {
        router.push("/dashboard");
        return;
      }

      await loadCharities();
    } catch (err) {
      console.error("Admin charities error:", err);
      router.push("/login");
    }
  };

  const loadCharities = async () => {
    const { data } = await supabase
      .from("charities")
      .select("*")
      .order("is_featured", { ascending: false })
      .order("name");
    setCharities(data || []);
    setLoading(false);
  };

  const openEdit = (c: Charity) => {
    setEditId(c.id);
    setForm({
      name: c.name,
      slug: c.slug,
      description: c.description || "",
      website_url: c.website_url || "",
      is_featured: c.is_featured,
    });
    setShowForm(true);
  };

  const openCreate = () => {
    setEditId(null);
    setForm(emptyForm);
    setShowForm(true);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setMsg("");

      if (!form.name.trim()) {
        setMsg("Name is required");
        setSaving(false);
        return;
      }

      const slug =
        form.slug ||
        form.name
          .toLowerCase()
          .replace(/\s+/g, "-")
          .replace(/[^a-z0-9-]/g, "");

      // check duplicate slug
      const { data } = await supabase
        .from("charities")
        .select("id")
        .eq("slug", slug)
        .maybeSingle();

      const existing = data as { id: string } | null;

      if (existing && existing.id !== editId) {
        setMsg("Slug already exists.");
        setSaving(false);
        return;
      }

      if (editId) {
        const { error } = await supabase
          .from("charities")
          .update({
            name: form.name,
            slug,
            description: form.description || null,
            website_url: form.website_url || null,
            is_featured: form.is_featured,
            updated_at: new Date().toISOString(),
          })
          .eq("id", editId);

        if (error) throw error;

        setMsg("Charity updated.");
      } else {
        const { error } = await supabase.from("charities").insert({
          name: form.name,
          slug,
          description: form.description || null,
          website_url: form.website_url || null,
          is_featured: form.is_featured,
          is_active: true,
          total_received: 0,
        });

        if (error) throw error;

        setMsg("Charity created.");
      }

      setShowForm(false);
      setEditId(null);
      setForm(emptyForm);
      loadCharities();
    } catch (err: any) {
      console.error(err);
      setMsg(err.message || "Something went wrong");
    } finally {
      setSaving(false);
    }
  };
  const toggleFeatured = async (c: Charity) => {
    if (!c.is_featured) {
      // Unfeature all first
      await supabase
        .from("charities")
        .update({ is_featured: false });
      
      await supabase
        .from("charities")
        .update({ is_featured: !c.is_featured })
        .eq("id", c.id);
      loadCharities();
    };

    const toggleActive = async (c: Charity) => {
      await supabase
        .from("charities")
        .update({ is_active: !c.is_active })
        .eq("id", c.id);
      loadCharities();
    };

    const handleDelete = async (id: string) => {
      if (!confirm("Delete this charity? This cannot be undone.")) return;
      await supabase.from("charities").delete().eq("id", id);
      setMsg("Charity deleted.");
      loadCharities();
    };

    return (
      <div style={{ background: "var(--bg)", minHeight: "100vh" }}>
        <Navbar />

        <div
          className="max-w-5xl mx-auto px-6"
          style={{ paddingTop: 100, paddingBottom: 60 }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              marginBottom: 36,
              flexWrap: "wrap",
              gap: 16,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <Link
                href="/admin"
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
                  Charity Management
                </h1>
                <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.9rem" }}>
                  Control the charity directory
                </p>
              </div>
            </div>
            <button onClick={openCreate} className="btn-gold">
              <Plus size={16} /> Add Charity
            </button>
          </div>

          {msg && (
            <div
              style={{
                background: "rgba(74,222,128,0.1)",
                border: "1px solid rgba(74,222,128,0.25)",
                borderRadius: 10,
                padding: "12px 16px",
                marginBottom: 24,
                color: "#4ade80",
                fontSize: "0.9rem",
              }}
            >
              {msg}
            </div>
          )}

          {/* Form */}
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
                <h3 style={{ fontFamily: "var(--font-clash)", fontWeight: 600 }}>
                  {editId ? "Edit Charity" : "New Charity"}
                </h3>
                <button
                  onClick={() => setShowForm(false)}
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
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                  gap: 16,
                  marginBottom: 16,
                }}
              >
                {[
                  {
                    label: "Name",
                    key: "name",
                    placeholder: "e.g. Cancer Research UK",
                  },
                  {
                    label: "Slug",
                    key: "slug",
                    placeholder:
                      "e.g. cancer-research-uk (auto-generated if blank)",
                  },
                  {
                    label: "Website URL",
                    key: "website_url",
                    placeholder: "https://...",
                  },
                ].map((f) => (
                  <div key={f.key}>
                    <label
                      style={{
                        display: "block",
                        color: "rgba(255,255,255,0.5)",
                        fontSize: "0.8rem",
                        marginBottom: 8,
                      }}
                    >
                      {f.label}
                    </label>
                    <input
                      type="text"
                      className="glass-input"
                      placeholder={f.placeholder}
                      value={(form as any)[f.key]}
                      onChange={(e) =>
                        setForm({ ...form, [f.key]: e.target.value })
                      }
                    />
                  </div>
                ))}
              </div>
              <div style={{ marginBottom: 16 }}>
                <label
                  style={{
                    display: "block",
                    color: "rgba(255,255,255,0.5)",
                    fontSize: "0.8rem",
                    marginBottom: 8,
                  }}
                >
                  Description
                </label>
                <textarea
                  className="glass-input"
                  placeholder="Brief description shown on charity card..."
                  value={form.description}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                  rows={3}
                  style={{ resize: "vertical" }}
                />
              </div>
              <div
                style={{
                  display: "flex",
                  gap: 16,
                  alignItems: "center",
                  marginBottom: 20,
                }}
              >
                <label
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    cursor: "pointer",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={form.is_featured}
                    onChange={(e) =>
                      setForm({ ...form, is_featured: e.target.checked })
                    }
                  />
                  <span
                    style={{ color: "rgba(255,255,255,0.6)", fontSize: "0.9rem" }}
                  >
                    Featured charity (appears on homepage)
                  </span>
                </label>
              </div>
              <div style={{ display: "flex", gap: 12 }}>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="btn-gold"
                >
                  <Save size={15} /> {saving ? "Saving..." : "Save Charity"}
                </button>
                <button
                  onClick={() => setShowForm(false)}
                  className="btn-primary"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Charities Table */}
          <div className="glass-card" style={{ overflow: "hidden" }}>
            <table
              style={{ width: "100%", borderCollapse: "collapse" }}
              className="glass-table"
            >
              <thead>
                <tr>
                  <th style={{ textAlign: "left" }}>Charity</th>
                  <th style={{ textAlign: "left" }}>Total Raised</th>
                  <th style={{ textAlign: "left" }}>Featured</th>
                  <th style={{ textAlign: "left" }}>Status</th>
                  <th style={{ textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td
                      colSpan={5}
                      style={{
                        textAlign: "center",
                        padding: 40,
                        color: "rgba(255,255,255,0.3)",
                      }}
                    >
                      Loading...
                    </td>
                  </tr>
                ) : charities.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      style={{
                        textAlign: "center",
                        padding: 40,
                        color: "rgba(255,255,255,0.3)",
                      }}
                    >
                      No charities yet.
                    </td>
                  </tr>
                ) : (
                  charities.map((c) => (
                    <tr key={c.id}>
                      <td>
                        <div style={{ fontWeight: 500 }}>{c.name}</div>
                        <div
                          style={{
                            color: "rgba(255,255,255,0.35)",
                            fontSize: "0.78rem",
                          }}
                        >
                          {c.slug}
                        </div>
                      </td>
                      <td
                        style={{
                          color: "#f87171",
                          fontFamily: "var(--font-clash)",
                          fontWeight: 700,
                        }}
                      >
                        £{c.total_received.toLocaleString()}
                      </td>
                      <td>
                        <button
                          onClick={() => toggleFeatured(c)}
                          style={{
                            background: "none",
                            border: "none",
                            cursor: "pointer",
                            color: c.is_featured
                              ? "var(--gold)"
                              : "rgba(255,255,255,0.2)",
                          }}
                        >
                          <Star
                            size={16}
                            fill={c.is_featured ? "currentColor" : "none"}
                          />
                        </button>
                      </td>
                      <td>
                        <span
                          className={`badge badge-${c.is_active ? "active" : "inactive"}`}
                        >
                          {c.is_active ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td style={{ textAlign: "right" }}>
                        <div
                          style={{
                            display: "flex",
                            gap: 8,
                            justifyContent: "flex-end",
                          }}
                        >
                          <button
                            onClick={() => openEdit(c)}
                            className="btn-primary"
                            style={{ padding: "6px 12px", fontSize: "0.8rem" }}
                          >
                            <Edit2 size={12} />
                          </button>
                          <button
                            onClick={() => toggleActive(c)}
                            className="btn-primary"
                            style={{ padding: "6px 12px", fontSize: "0.8rem" }}
                          >
                            {c.is_active ? (
                              <EyeOff size={12} />
                            ) : (
                              <Eye size={12} />
                            )}
                          </button>
                          <button
                            onClick={() => handleDelete(c.id)}
                            style={{
                              padding: "6px 12px",
                              fontSize: "0.8rem",
                              background: "rgba(248,113,113,0.08)",
                              border: "1px solid rgba(248,113,113,0.2)",
                              borderRadius: 8,
                              color: "#f87171",
                              cursor: "pointer",
                            }}
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }
}