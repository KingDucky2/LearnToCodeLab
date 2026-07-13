export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string | null;
          display_name: string | null;
          username: string | null;
          avatar_url: string | null;
          bio: string | null;
          role: string;
          onboarding_complete: boolean;
          onboarding_completed: boolean;
          preferred_language: string | null;
          experience_level: string | null;
          learning_goal: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email?: string | null;
          display_name?: string | null;
          username?: string | null;
          avatar_url?: string | null;
          bio?: string | null;
          role?: string;
          onboarding_complete?: boolean;
          onboarding_completed?: boolean;
          preferred_language?: string | null;
          experience_level?: string | null;
          learning_goal?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Insert"]>;
        Relationships: [];
      };
      privacy_preferences: {
        Row: { user_id: string; model_improvement_opt_in: boolean; ai_personalization_enabled: boolean; cookie_preference: string; created_at: string; updated_at: string };
        Insert: { user_id: string; model_improvement_opt_in?: boolean; ai_personalization_enabled?: boolean; cookie_preference?: string; created_at?: string; updated_at?: string };
        Update: Partial<Database["public"]["Tables"]["privacy_preferences"]["Insert"]>;
        Relationships: [];
      };
      learning_preferences: {
        Row: {
          user_id: string;
          explanation_style: string;
          lesson_pace: string;
          practice_frequency: string;
          hint_behavior: string;
          theme: string;
          reduced_motion: boolean;
          lesson_difficulty: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          explanation_style?: string;
          lesson_pace?: string;
          practice_frequency?: string;
          hint_behavior?: string;
          theme?: string;
          reduced_motion?: boolean;
          lesson_difficulty?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["learning_preferences"]["Insert"]>;
        Relationships: [];
      };
      learning_paths: {
        Row: { id: string; slug: string; title: string; description: string; color: string; sort_order: number; created_at: string };
        Insert: { id?: string; slug: string; title: string; description: string; color: string; sort_order: number; created_at?: string };
        Update: Partial<Database["public"]["Tables"]["learning_paths"]["Insert"]>;
        Relationships: [];
      };
      skill_scores: {
        Row: { id: string; user_id: string; language_slug: string; topic: string; mastery: number; updated_at: string };
        Insert: { id?: string; user_id: string; language_slug: string; topic: string; mastery?: number; updated_at?: string };
        Update: Partial<Database["public"]["Tables"]["skill_scores"]["Insert"]>;
        Relationships: [];
      };
      site_settings: {
        Row: {
          id: string;
          maintenance_enabled: boolean;
          maintenance_title: string;
          maintenance_message: string;
          maintenance_status: string;
          maintenance_badge_text: string;
          estimated_return_at: string | null;
          show_countdown: boolean;
          show_progress: boolean;
          progress_percent: number;
          allow_admin_bypass: boolean;
          allow_authenticated_users: boolean;
          allow_login_during_maintenance: boolean;
          show_personalized_message: boolean;
          show_saved_progress_message: boolean;
          auto_refresh_enabled: boolean;
          auto_refresh_interval_seconds: number;
          support_message: string | null;
          contact_email: string | null;
          created_at: string;
          updated_at: string;
          updated_by: string | null;
        };
        Insert: Partial<Database["public"]["Tables"]["site_settings"]["Row"]> & { id?: string };
        Update: Partial<Database["public"]["Tables"]["site_settings"]["Row"]>;
        Relationships: [];
      };
      maintenance_tasks: {
        Row: {
          id: string;
          title: string;
          description: string | null;
          status: "waiting" | "in_progress" | "completed" | "delayed";
          progress_percent: number | null;
          display_order: number;
          visible: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["maintenance_tasks"]["Row"]> & { title: string };
        Update: Partial<Database["public"]["Tables"]["maintenance_tasks"]["Row"]>;
        Relationships: [];
      };
      maintenance_updates: {
        Row: {
          id: string;
          title: string;
          message: string;
          published_at: string;
          visible: boolean;
        };
        Insert: Partial<Database["public"]["Tables"]["maintenance_updates"]["Row"]> & { title: string; message: string };
        Update: Partial<Database["public"]["Tables"]["maintenance_updates"]["Row"]>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      get_public_maintenance_state: { Args: Record<PropertyKey, never>; Returns: Json };
      is_site_admin: { Args: Record<PropertyKey, never>; Returns: boolean };
      save_maintenance_configuration: { Args: { settings_payload: Json; tasks_payload: Json; updates_payload: Json }; Returns: undefined };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
