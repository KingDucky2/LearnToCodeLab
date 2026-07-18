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
          avatar_source: "provider" | "custom";
          bio: string | null;
          role: string;
          onboarding_complete: boolean;
          onboarding_completed: boolean;
          onboarding_required: boolean;
          preferred_language: string | null;
          experience_level: string | null;
          learning_goal: string | null;
          biggest_learning_struggle: string | null;
          account_status: "active" | "suspended";
          account_status_reason: string | null;
          account_status_changed_at: string | null;
          account_status_changed_by: string | null;
          auth_providers: string[];
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email?: string | null;
          display_name?: string | null;
          username?: string | null;
          avatar_url?: string | null;
          avatar_source?: "provider" | "custom";
          bio?: string | null;
          role?: string;
          onboarding_complete?: boolean;
          onboarding_completed?: boolean;
          onboarding_required?: boolean;
          preferred_language?: string | null;
          experience_level?: string | null;
          learning_goal?: string | null;
          biggest_learning_struggle?: string | null;
          account_status?: "active" | "suspended";
          account_status_reason?: string | null;
          account_status_changed_at?: string | null;
          account_status_changed_by?: string | null;
          auth_providers?: string[];
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
          daily_minutes: number;
          learning_format: string;
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
          daily_minutes?: number;
          learning_format?: string;
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
      courses: {
        Row: { id: string; slug: string; title: string; description: string; icon: string; difficulty: string; estimated_minutes: number; status: "available" | "coming_soon"; sort_order: number; published: boolean; created_at: string; updated_at: string };
        Insert: Partial<Database["public"]["Tables"]["courses"]["Row"]> & { slug: string; title: string; description: string };
        Update: Partial<Database["public"]["Tables"]["courses"]["Row"]>;
        Relationships: [];
      };
      course_modules: {
        Row: { id: string; course_id: string; slug: string; title: string; description: string; status: "available" | "coming_soon"; sort_order: number; published: boolean; created_at: string; updated_at: string };
        Insert: Partial<Database["public"]["Tables"]["course_modules"]["Row"]> & { course_id: string; slug: string; title: string; description: string };
        Update: Partial<Database["public"]["Tables"]["course_modules"]["Row"]>;
        Relationships: [];
      };
      lessons: {
        Row: { id: string; module_id: string; slug: string; title: string; objective: string; subtitle: string; description: string; difficulty: string; estimated_minutes: number; objectives: Json; content: Json; starter_files: Json; validation_rules: Json; xp_reward: number; sort_order: number; published: boolean; created_at: string; updated_at: string };
        Insert: Partial<Database["public"]["Tables"]["lessons"]["Row"]> & { module_id: string; slug: string; title: string; description: string };
        Update: Partial<Database["public"]["Tables"]["lessons"]["Row"]>;
        Relationships: [];
      };
      lesson_progress: {
        Row: { id: string; user_id: string; lesson_id: string; status: "not_started" | "in_progress" | "completed"; completed_sections: Json; completion_percent: number; started_at: string; completed_at: string | null; last_opened_at: string; updated_at: string };
        Insert: Partial<Database["public"]["Tables"]["lesson_progress"]["Row"]> & { user_id: string; lesson_id: string };
        Update: Partial<Database["public"]["Tables"]["lesson_progress"]["Row"]>;
        Relationships: [];
      };
      lesson_code: {
        Row: { id: string; user_id: string; lesson_id: string; file_name: string; content: string; created_at: string; updated_at: string };
        Insert: Partial<Database["public"]["Tables"]["lesson_code"]["Row"]> & { user_id: string; lesson_id: string; file_name: string; content: string };
        Update: Partial<Database["public"]["Tables"]["lesson_code"]["Row"]>;
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
          preset_key: string | null;
          scheduled_start_at: string | null;
          scheduled_end_at: string | null;
          schedule_event_id: string | null;
          automatic_progress: boolean;
          automatic_messages: boolean;
          automatic_updates: boolean;
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
      support_tickets: {
        Row: { id: string; ticket_number: number; user_id: string; subject: string; category: string; status: string; priority: string; needs_staff_attention: boolean; page_url: string | null; diagnostics: Json | null; diagnostics_consent: boolean; assigned_to: string | null; created_at: string; updated_at: string; resolved_at: string | null; archived_at: string | null; archived_by: string | null; closed_at: string | null; status_changed_at: string; status_changed_by: string | null };
        Insert: { id?: string; user_id: string; subject: string; category: string; status?: string; priority?: string; needs_staff_attention?: boolean; page_url?: string | null; diagnostics?: Json | null; diagnostics_consent?: boolean; assigned_to?: string | null; created_at?: string; updated_at?: string; resolved_at?: string | null; archived_at?: string | null; archived_by?: string | null; closed_at?: string | null; status_changed_at?: string; status_changed_by?: string | null };
        Update: Partial<Database["public"]["Tables"]["support_tickets"]["Insert"]>;
        Relationships: [];
      };
      support_messages: {
        Row: { id: string; ticket_id: string; author_id: string | null; body: string; author_kind: "learner" | "staff"; created_at: string };
        Insert: { id?: string; ticket_id: string; author_id: string; body: string; author_kind: "learner" | "staff"; created_at?: string };
        Update: never;
        Relationships: [];
      };
      support_staff_notes: {
        Row: { id: string; ticket_id: string; author_id: string | null; body: string; created_at: string };
        Insert: { id?: string; ticket_id: string; author_id: string; body: string; created_at?: string };
        Update: never;
        Relationships: [];
      };
      account_status_history: {
        Row: { id: string; user_id: string; actor_id: string | null; previous_status: string; new_status: string; reason: string; created_at: string };
        Insert: Omit<Database["public"]["Tables"]["account_status_history"]["Row"], "id" | "created_at"> & { id?: string; created_at?: string };
        Update: never;
        Relationships: [];
      };
      admin_audit_log: {
        Row: { id: string; actor_id: string | null; actor_role: string; action: string; target_type: string; target_id: string | null; summary: string; result: "success" | "denied" | "failed"; correlation_id: string; created_at: string };
        Insert: { id?: string; actor_id?: string | null; actor_role: string; action: string; target_type: string; target_id?: string | null; summary: string; result: "success" | "denied" | "failed"; correlation_id?: string; created_at?: string };
        Update: never;
        Relationships: [];
      };
      maintenance_history: {
        Row: { id: string; event_id: string; action: string; actor_id: string | null; actor_kind: "staff" | "automation"; preset_key: string | null; title: string; message: string; scheduled_start_at: string | null; scheduled_end_at: string | null; maintenance_enabled: boolean; created_at: string };
        Insert: Omit<Database["public"]["Tables"]["maintenance_history"]["Row"], "id" | "created_at"> & { id?: string; created_at?: string };
        Update: never;
        Relationships: [];
      };
      user_staff_notes: {
        Row: { id: string; user_id: string; author_id: string | null; body: string; created_at: string };
        Insert: { id?: string; user_id: string; author_id: string; body: string; created_at?: string };
        Update: never;
        Relationships: [];
      };
      support_ticket_status_history: {
        Row: { id: string; ticket_id: string; previous_status: string; new_status: string; changed_by: string | null; created_at: string };
        Insert: { id?: string; ticket_id: string; previous_status: string; new_status: string; changed_by?: string | null; created_at?: string };
        Update: never;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      get_public_maintenance_state: { Args: Record<PropertyKey, never>; Returns: Json };
      is_site_admin: { Args: Record<PropertyKey, never>; Returns: boolean };
      save_maintenance_configuration: { Args: { settings_payload: Json; tasks_payload: Json; updates_payload: Json }; Returns: undefined };
      admin_revoke_user_sessions: { Args: { target_user_id: string }; Returns: undefined };
      create_support_ticket: { Args: { ticket_subject: string; ticket_category: string; initial_message: string; related_page?: string | null; include_diagnostics?: boolean; diagnostic_payload?: Json | null }; Returns: string };
      close_own_support_ticket: { Args: { target_ticket_id: string }; Returns: undefined };
      set_user_account_status: { Args: { target_user_id: string; next_status: string; change_reason: string }; Returns: undefined };
      admin_set_support_ticket_status: { Args: { target_ticket_id: string; next_status: string }; Returns: undefined };
      admin_set_support_ticket_archived: { Args: { target_ticket_id: string; should_archive: boolean }; Returns: undefined };
      complete_profile_onboarding: { Args: { profile_display_name: string; profile_username: string; profile_experience: string; primary_goal: string; interests: Json; starting_language: string; minutes_per_day: number; preferred_format: string }; Returns: undefined };
      save_learner_profile: { Args: { profile_display_name: string; profile_username: string; profile_bio: string; profile_experience: string; primary_goal: string; interests: Json; starting_language: string; minutes_per_day: number; preferred_format: string; learning_struggle: string }; Returns: undefined };
      save_maintenance_configuration_v2: { Args: { settings_payload: Json; tasks_payload: Json; updates_payload: Json }; Returns: undefined };
      process_due_maintenance_automation: { Args: Record<PropertyKey, never>; Returns: Json };
      save_lesson_workspace: { Args: { course_slug: string; module_slug: string; lesson_slug: string; code_files: Json; mark_completed?: boolean }; Returns: undefined };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
