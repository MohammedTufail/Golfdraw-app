"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Menu, X, Trophy, LogOut } from "lucide-react";

export default function Navbar() {
  const pathname = usePathname();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
      if (data.user) {
        supabase
          .from("profiles")
          .select("*")
          .eq("id", data.user.id)
          .single()
          .then(({ data: p }) => setProfile(p));
      }
    });
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null);
    });
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => {
      subscription.unsubscribe();
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  const isAdmin = profile?.role === "admin";

  return (
    <nav
      className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
      style={{
        background: scrolled ? "rgba(8,8,8,0.92)" : "transparent",
        backdropFilter: scrolled ? "blur(20px)" : "none",
        borderBottom: scrolled
          ? "1px solid rgba(255,255,255,0.08)"
          : "1px solid transparent",
      }}
    >
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: "linear-gradient(135deg, #c9a84c, #f0d87a)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Trophy size={16} color="#080808" />
          </div>
          <span
            style={{
              fontFamily: "var(--font-clash)",
              fontWeight: 700,
              fontSize: "1.1rem",
              letterSpacing: "-0.01em",
            }}
          >
            Golf<span className="gold-text">Draw</span>
          </span>
        </Link>

        {/* Desktop Links */}
        <div className="hidden md:flex items-center gap-8">
          <Link href="/charities" className="nav-link">
            Charities
          </Link>
          <Link href="/how-it-works" className="nav-link">
            How It Works
          </Link>
          {user && (
            <Link href="/dashboard" className="nav-link">
              Dashboard
            </Link>
          )}
          {isAdmin && (
            <Link
              href="/admin"
              className="nav-link"
              style={{ color: "var(--gold)" }}
            >
              Admin
            </Link>
          )}
        </div>

        {/* CTA */}
        <div className="hidden md:flex items-center gap-3">
          {user ? (
            <div className="flex items-center gap-3">
              <span
                style={{ color: "rgba(255,255,255,0.5)", fontSize: "0.85rem" }}
              >
                {profile?.full_name || user.email?.split("@")[0]}
              </span>
              <button
                onClick={handleSignOut}
                className="btn-primary"
                style={{ padding: "8px 16px", fontSize: "0.85rem" }}
              >
                <LogOut size={14} /> Sign Out
              </button>
            </div>
          ) : (
            <>
              <Link href="/login" className="nav-link">
                Sign In
              </Link>
              <Link
                href="/signup"
                className="btn-gold"
                style={{ padding: "8px 20px", fontSize: "0.9rem" }}
              >
                Get Started
              </Link>
            </>
          )}
        </div>

        {/* Mobile Menu Button */}
        <button
          className="md:hidden"
          onClick={() => setOpen(!open)}
          style={{ color: "white" }}
        >
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Mobile Menu */}
      {open && (
        <div className="md:hidden glass-card mx-4 my-2 p-4 flex flex-col gap-4">
          <Link
            href="/charities"
            className="nav-link"
            onClick={() => setOpen(false)}
          >
            Charities
          </Link>
          <Link
            href="/how-it-works"
            className="nav-link"
            onClick={() => setOpen(false)}
          >
            How It Works
          </Link>
          {user && (
            <Link
              href="/dashboard"
              className="nav-link"
              onClick={() => setOpen(false)}
            >
              Dashboard
            </Link>
          )}
          {isAdmin && (
            <Link
              href="/admin"
              className="nav-link"
              onClick={() => setOpen(false)}
              style={{ color: "var(--gold)" }}
            >
              Admin
            </Link>
          )}
          <div
            style={{
              borderTop: "1px solid rgba(255,255,255,0.08)",
              paddingTop: 12,
            }}
          >
            {user ? (
              <button
                onClick={handleSignOut}
                className="btn-primary w-full justify-center"
              >
                Sign Out
              </button>
            ) : (
              <div className="flex flex-col gap-2">
                <Link
                  href="/login"
                  className="btn-primary text-center justify-center"
                  onClick={() => setOpen(false)}
                >
                  Sign In
                </Link>
                <Link
                  href="/signup"
                  className="btn-gold text-center justify-center"
                  onClick={() => setOpen(false)}
                >
                  Get Started
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
