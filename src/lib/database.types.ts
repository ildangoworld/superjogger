export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          nickname: string;
          avatar_url: string | null;
          timezone: string;
          recommendation_detail: "LIGHT" | "DETAILED";
          onboarding_completed: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          nickname: string;
          avatar_url?: string | null;
          timezone?: string;
          recommendation_detail?: "LIGHT" | "DETAILED";
          onboarding_completed?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          nickname?: string;
          avatar_url?: string | null;
          timezone?: string;
          recommendation_detail?: "LIGHT" | "DETAILED";
          onboarding_completed?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      user_preferences: {
        Row: {
          user_id: string;
          experience_level:
            | "BEGINNER"
            | "RETURNING"
            | "REGULAR"
            | "ADVANCED"
            | null;
          primary_goal:
            | "HABIT"
            | "HEALTH"
            | "STRESS_RELIEF"
            | "ENJOYMENT"
            | null;
          available_weekdays: number[] | null;
          baseline_weekly_frequency: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          experience_level?:
            | "BEGINNER"
            | "RETURNING"
            | "REGULAR"
            | "ADVANCED"
            | null;
          primary_goal?:
            | "HABIT"
            | "HEALTH"
            | "STRESS_RELIEF"
            | "ENJOYMENT"
            | null;
          available_weekdays?: number[] | null;
          baseline_weekly_frequency?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          user_id?: string;
          experience_level?:
            | "BEGINNER"
            | "RETURNING"
            | "REGULAR"
            | "ADVANCED"
            | null;
          primary_goal?:
            | "HABIT"
            | "HEALTH"
            | "STRESS_RELIEF"
            | "ENJOYMENT"
            | null;
          available_weekdays?: number[] | null;
          baseline_weekly_frequency?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      weekly_goals: {
        Row: {
          id: string;
          user_id: string;
          week_start: string;
          target_count: number;
          recommended_count: number | null;
          recommendation_reason: string | null;
          confirmed_at: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          week_start: string;
          target_count: number;
          recommended_count?: number | null;
          recommendation_reason?: string | null;
          confirmed_at?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          week_start?: string;
          target_count?: number;
          recommended_count?: number | null;
          recommendation_reason?: string | null;
          confirmed_at?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      workouts: {
        Row: {
          id: string;
          user_id: string;
          category: "RUNNING" | "WALKING" | "MIXED";
          started_at: string;
          local_date: string;
          duration_seconds: number;
          distance_meters: number;
          perceived_exertion: number;
          condition_score: number;
          has_pain: boolean;
          pain_area: string | null;
          pain_details: string | null;
          average_heart_rate: number | null;
          cadence: number | null;
          step_count: number | null;
          memo: string | null;
          qualifies_by_rule: boolean;
          counts_for_daily_goal: boolean;
          active_analysis_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          category: "RUNNING" | "WALKING" | "MIXED";
          started_at: string;
          local_date: string;
          duration_seconds: number;
          distance_meters: number;
          perceived_exertion: number;
          condition_score: number;
          has_pain?: boolean;
          pain_area?: string | null;
          pain_details?: string | null;
          average_heart_rate?: number | null;
          cadence?: number | null;
          step_count?: number | null;
          memo?: string | null;
          qualifies_by_rule: boolean;
          counts_for_daily_goal: boolean;
          active_analysis_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          category?: "RUNNING" | "WALKING" | "MIXED";
          started_at?: string;
          local_date?: string;
          duration_seconds?: number;
          distance_meters?: number;
          perceived_exertion?: number;
          condition_score?: number;
          has_pain?: boolean;
          pain_area?: string | null;
          pain_details?: string | null;
          average_heart_rate?: number | null;
          cadence?: number | null;
          step_count?: number | null;
          memo?: string | null;
          qualifies_by_rule?: boolean;
          counts_for_daily_goal?: boolean;
          active_analysis_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      weekly_summaries: {
        Row: {
          id: string;
          user_id: string;
          week_start: string;
          goal_count: number;
          qualified_day_count: number;
          goal_achieved: boolean;
          workout_count: number;
          total_duration_seconds: number;
          total_distance_meters: number;
          category_counts: Json;
          average_exertion: number | null;
          average_condition: number | null;
          pain_record_count: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          week_start: string;
          goal_count: number;
          qualified_day_count: number;
          goal_achieved: boolean;
          workout_count: number;
          total_duration_seconds: number;
          total_distance_meters: number;
          category_counts?: Json;
          average_exertion?: number | null;
          average_condition?: number | null;
          pain_record_count: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          week_start?: string;
          goal_count?: number;
          qualified_day_count?: number;
          goal_achieved?: boolean;
          workout_count?: number;
          total_duration_seconds?: number;
          total_distance_meters?: number;
          category_counts?: Json;
          average_exertion?: number | null;
          average_condition?: number | null;
          pain_record_count?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      workout_analyses: {
        Row: {
          id: string;
          workout_id: string;
          user_id: string;
          status: "PENDING" | "COMPLETED" | "FAILED" | "STALE";
          trigger_type: "AUTO" | "REANALYZE";
          summary: string | null;
          intensity_interpretation: string | null;
          trend: string | null;
          next_workout_suggestion: string | null;
          safety_notice: string | null;
          trend_summary: string | null;
          risk_level: "NONE" | "CAUTION" | "HIGH" | null;
          model_name: string | null;
          prompt_version: string;
          completed_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          workout_id: string;
          user_id: string;
          status: "PENDING" | "COMPLETED" | "FAILED" | "STALE";
          trigger_type: "AUTO" | "REANALYZE";
          summary?: string | null;
          intensity_interpretation?: string | null;
          trend?: string | null;
          next_workout_suggestion?: string | null;
          safety_notice?: string | null;
          trend_summary?: string | null;
          risk_level?: "NONE" | "CAUTION" | "HIGH" | null;
          model_name?: string | null;
          prompt_version: string;
          completed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          workout_id?: string;
          user_id?: string;
          status?: "PENDING" | "COMPLETED" | "FAILED" | "STALE";
          trigger_type?: "AUTO" | "REANALYZE";
          summary?: string | null;
          intensity_interpretation?: string | null;
          trend?: string | null;
          next_workout_suggestion?: string | null;
          safety_notice?: string | null;
          trend_summary?: string | null;
          risk_level?: "NONE" | "CAUTION" | "HIGH" | null;
          model_name?: string | null;
          prompt_version?: string;
          completed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      ai_analysis_usage: {
        Row: {
          id: string;
          user_id: string;
          usage_local_date: string;
          workout_id: string;
          analysis_id: string | null;
          trigger_type: "AUTO" | "REANALYZE";
          status: "RESERVED" | "CONSUMED" | "RELEASED";
          request_key: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          usage_local_date: string;
          workout_id: string;
          analysis_id?: string | null;
          trigger_type: "AUTO" | "REANALYZE";
          status: "RESERVED" | "CONSUMED" | "RELEASED";
          request_key: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          usage_local_date?: string;
          workout_id?: string;
          analysis_id?: string | null;
          trigger_type?: "AUTO" | "REANALYZE";
          status?: "RESERVED" | "CONSUMED" | "RELEASED";
          request_key?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      user_trend_state: {
        Row: {
          user_id: string;
          latest_trend_summary: string | null;
          source_analysis_id: string | null;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          latest_trend_summary?: string | null;
          source_analysis_id?: string | null;
          updated_at?: string;
        };
        Update: {
          user_id?: string;
          latest_trend_summary?: string | null;
          source_analysis_id?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      crews: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          owner_id: string;
          invite_code: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          owner_id: string;
          invite_code: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
          owner_id?: string;
          invite_code?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      crew_members: {
        Row: {
          crew_id: string;
          user_id: string;
          role: "OWNER" | "MEMBER";
          joined_at: string;
        };
        Insert: {
          crew_id: string;
          user_id: string;
          role: "OWNER" | "MEMBER";
          joined_at?: string;
        };
        Update: {
          crew_id?: string;
          user_id?: string;
          role?: "OWNER" | "MEMBER";
          joined_at?: string;
        };
        Relationships: [];
      };
      admin_users: {
        Row: {
          user_id: string;
          role: "SUPER" | "STAFF";
          permissions: string[];
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          role: "SUPER" | "STAFF";
          permissions?: string[];
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          user_id?: string;
          role?: "SUPER" | "STAFF";
          permissions?: string[];
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      admin_audit_logs: {
        Row: {
          id: string;
          actor_id: string;
          action: string;
          target_type: string;
          target_id: string | null;
          detail: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          actor_id: string;
          action: string;
          target_type: string;
          target_id?: string | null;
          detail?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          actor_id?: string;
          action?: string;
          target_type?: string;
          target_id?: string | null;
          detail?: Json;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      reserve_ai_analysis_slot: {
        Args: {
          p_user_id: string;
          p_workout_id: string;
          p_usage_local_date: string;
          p_trigger_type: string;
          p_request_key: string;
          p_prompt_version: string;
        };
        Returns: Json;
      };
      finalize_ai_analysis_usage: {
        Args: {
          p_usage_id: string;
          p_status: string;
        };
        Returns: Json;
      };
      create_crew: {
        Args: {
          p_name: string;
          p_description?: string | null;
        };
        Returns: Json;
      };
      join_crew_by_invite_code: {
        Args: {
          p_invite_code: string;
        };
        Returns: Json;
      };
      get_crew_board: {
        Args: {
          p_crew_id: string;
          p_week_start: string;
        };
        Returns: Json;
      };
      generate_crew_invite_code: {
        Args: Record<string, never>;
        Returns: string;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
