export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: { id: string; email: string | null; username: string | null; avatar_url: string | null; role: string; onboarding_complete: boolean; created_at: string };
        Insert: { id: string; email?: string | null; username?: string | null; avatar_url?: string | null; role?: string; onboarding_complete?: boolean; created_at?: string };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Insert"]>;
      };
      privacy_preferences: {
        Row: { user_id: string; model_improvement_opt_in: boolean; ai_personalization_enabled: boolean; cookie_preference: string; created_at: string; updated_at: string };
        Insert: { user_id: string; model_improvement_opt_in?: boolean; ai_personalization_enabled?: boolean; cookie_preference?: string; created_at?: string; updated_at?: string };
        Update: Partial<Database["public"]["Tables"]["privacy_preferences"]["Insert"]>;
      };
      learning_paths: {
        Row: { id: string; slug: string; title: string; description: string; color: string; sort_order: number; created_at: string };
        Insert: { id?: string; slug: string; title: string; description: string; color: string; sort_order: number; created_at?: string };
        Update: Partial<Database["public"]["Tables"]["learning_paths"]["Insert"]>;
      };
      skill_scores: {
        Row: { id: string; user_id: string; language_slug: string; topic: string; mastery: number; updated_at: string };
        Insert: { id?: string; user_id: string; language_slug: string; topic: string; mastery?: number; updated_at?: string };
        Update: Partial<Database["public"]["Tables"]["skill_scores"]["Insert"]>;
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
