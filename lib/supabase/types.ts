/**
 * lib/supabase/types.ts
 *
 * WHY THIS FILE EXISTS:
 * When you pass <Database> to createBrowserClient/createServerClient,
 * Supabase uses the Insert types to validate .insert() and .update() calls.
 * If Insert is typed as Partial<Row>, TypeScript sometimes collapses it to
 * `never` — causing "no overload matches" and "Property does not exist on never".
 *
 * FIX: Define Insert types explicitly with only the fields you actually pass.
 * Optional DB-generated fields (id, created_at) are omitted entirely.
 */

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
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          avatar_url?: string | null;
          charity_id?: string | null;
          charity_contribution_pct?: number;
          role?: "subscriber" | "admin";
        };
        Update: {
          full_name?: string | null;
          avatar_url?: string | null;
          charity_id?: string | null;
          charity_contribution_pct?: number;
          role?: "subscriber" | "admin";
          updated_at?: string;
        };
      };

      subscriptions: {
        Row: {
          id: string;
          user_id: string;
          plan: "monthly" | "yearly";
          status: "active" | "inactive" | "cancelled" | "lapsed";
          lemonsqueezy_customer_id: string | null;
          lemonsqueezy_subscription_id: string | null;
          amount_pence: number;
          renewal_date: string | null;
          cancelled_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          plan: "monthly" | "yearly";
          status?: "active" | "inactive" | "cancelled" | "lapsed";
          lemonsqueezy_customer_id?: string | null;
          lemonsqueezy_subscription_id?: string | null;
          amount_pence: number;
          renewal_date?: string | null;
        };
        Update: {
          plan?: "monthly" | "yearly";
          status?: "active" | "inactive" | "cancelled" | "lapsed";
          lemonsqueezy_customer_id?: string | null;
          lemonsqueezy_subscription_id?: string | null;
          amount_pence?: number;
          renewal_date?: string | null;
          cancelled_at?: string | null;
          updated_at?: string;
        };
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
        Insert: {
          user_id: string;
          score_date: string;
          stableford_score: number;
        };
        Update: {
          score_date?: string;
          stableford_score?: number;
          updated_at?: string;
        };
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
          updated_at: string;
        };
        Insert: {
          name: string;
          slug: string;
          description?: string | null;
          logo_url?: string | null;
          banner_url?: string | null;
          website_url?: string | null;
          is_featured?: boolean;
          is_active?: boolean;
          total_received?: number;
        };
        Update: {
          name?: string;
          slug?: string;
          description?: string | null;
          logo_url?: string | null;
          banner_url?: string | null;
          website_url?: string | null;
          is_featured?: boolean;
          is_active?: boolean;
          total_received?: number;
          updated_at?: string;
        };
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
          updated_at: string;
        };
        Insert: {
          title: string;
          draw_month: string;
          draw_type: "random" | "weighted";
          status?: "pending" | "simulated" | "published";
          winning_numbers?: number[] | null;
          jackpot_amount?: number;
          pool_4match?: number;
          pool_3match?: number;
          total_subscribers?: number;
          jackpot_rolled_over?: boolean;
          published_at?: string | null;
        };
        Update: {
          title?: string;
          draw_month?: string;
          draw_type?: "random" | "weighted";
          status?: "pending" | "simulated" | "published";
          winning_numbers?: number[] | null;
          jackpot_amount?: number;
          pool_4match?: number;
          pool_3match?: number;
          total_subscribers?: number;
          jackpot_rolled_over?: boolean;
          published_at?: string | null;
          updated_at?: string;
        };
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
          verified_at: string | null;
          paid_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          draw_id: string;
          user_id: string;
          match_type: "5_match" | "4_match" | "3_match";
          matched_numbers: number[];
          prize_amount: number;
          proof_url?: string | null;
          verification_status?: "pending" | "approved" | "rejected";
          payout_status?: "pending" | "paid";
        };
        Update: {
          proof_url?: string | null;
          verification_status?: "pending" | "approved" | "rejected";
          payout_status?: "pending" | "paid";
          verified_at?: string | null;
          paid_at?: string | null;
          updated_at?: string;
        };
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
        Insert: {
          user_id: string;
          charity_id: string;
          subscription_id: string;
          amount: number;
          contribution_date: string;
        };
        Update: {
          amount?: number;
        };
      };

      charity_events: {
        Row: {
          id: string;
          charity_id: string;
          title: string;
          description: string | null;
          event_date: string;
          location: string | null;
          registration_url: string | null;
          created_at: string;
        };
        Insert: {
          charity_id: string;
          title: string;
          description?: string | null;
          event_date: string;
          location?: string | null;
          registration_url?: string | null;
        };
        Update: {
          title?: string;
          description?: string | null;
          event_date?: string;
          location?: string | null;
          registration_url?: string | null;
        };
      };

      independent_donations: {
        Row: {
          id: string;
          user_id: string;
          charity_id: string;
          amount: number;
          ls_order_id: string | null;
          status: "pending" | "completed" | "failed";
          donated_at: string;
        };
        Insert: {
          user_id: string;
          charity_id: string;
          amount: number;
          ls_order_id?: string | null;
          status?: "pending" | "completed" | "failed";
        };
        Update: {
          ls_order_id?: string | null;
          status?: "pending" | "completed" | "failed";
        };
      };

      notification_log: {
        Row: {
          id: string;
          user_id: string | null;
          type: string;
          sent_at: string;
          success: boolean;
          reference_id: string | null;
        };
        Insert: {
          user_id?: string | null;
          type: string;
          success?: boolean;
          reference_id?: string | null;
        };
        Update: {
          success?: boolean
        };
      };
    };

    Views: {
      draw_eligible_users: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          score_count: number;
        };
      };
      platform_stats: {
        Row: {
          total_users: number;
          active_subscribers: number;
          total_charity_raised: number;
          total_draws_run: number;
          total_winners: number;
          total_prizes_paid: number;
          prizes_outstanding: number;
        };
      };
    };
  };
};
