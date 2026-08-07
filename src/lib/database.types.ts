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
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
