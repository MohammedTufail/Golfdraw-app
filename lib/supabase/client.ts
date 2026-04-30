import { createBrowserClient } from "@supabase/ssr";

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          avatar_url: string | null;
          charity_id: string | null;
          charity_contribution_pct: number;
          role: "subscriber" | "admin";
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["profiles"]["Row"]>;
        Update: Partial<Database["public"]["Tables"]["profiles"]["Row"]>;
      };
      subscriptions: {
        Row: {
          id: string;
          user_id: string;
          plan: "monthly" | "yearly";
          status: "active" | "inactive" | "cancelled" | "lapsed";
          stripe_customer_id: string | null;
          stripe_subscription_id: string | null;
          amount_pence: number;
          renewal_date: string | null;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["subscriptions"]["Row"]>;
        Update: Partial<Database["public"]["Tables"]["subscriptions"]["Row"]>;
      };
      scores: {
        Row: {
          id: string;
          user_id: string;
          score_date: string;
          stableford_score: number;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<
          Database["public"]["Tables"]["scores"]["Row"],
          "id" | "created_at" | "updated_at"
        >;
        Update: Partial<Database["public"]["Tables"]["scores"]["Row"]>;
      };
      charities: {
        Row: {
          id: string;
          name: string;
          slug: string;
          description: string | null;
          logo_url: string | null;
          banner_url: string | null;
          website_url: string | null;
          is_featured: boolean;
          is_active: boolean;
          total_received: number;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["charities"]["Row"]>;
        Update: Partial<Database["public"]["Tables"]["charities"]["Row"]>;
      };
      draws: {
        Row: {
          id: string;
          title: string;
          draw_month: string;
          draw_type: "random" | "weighted";
          status: "pending" | "simulated" | "published";
          winning_numbers: number[] | null;
          jackpot_amount: number;
          pool_4match: number;
          pool_3match: number;
          total_subscribers: number;
          jackpot_rolled_over: boolean;
          published_at: string | null;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["draws"]["Row"]>;
        Update: Partial<Database["public"]["Tables"]["draws"]["Row"]>;
      };
      winners: {
        Row: {
          id: string;
          draw_id: string;
          user_id: string;
          match_type: "5_match" | "4_match" | "3_match";
          matched_numbers: number[];
          prize_amount: number;
          proof_url: string | null;
          verification_status: "pending" | "approved" | "rejected";
          payout_status: "pending" | "paid";
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["winners"]["Row"]>;
        Update: Partial<Database["public"]["Tables"]["winners"]["Row"]>;
      };
      charity_contributions: {
        Row: {
          id: string;
          user_id: string;
          charity_id: string;
          subscription_id: string;
          amount: number;
          contribution_date: string;
          created_at: string;
        };
        Insert: Partial<
          Database["public"]["Tables"]["charity_contributions"]["Row"]
        >;
        Update: Partial<
          Database["public"]["Tables"]["charity_contributions"]["Row"]
        >;
      };
    };
  };
};

export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}