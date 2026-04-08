import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Database = {
  public: {
    Tables: {
      students: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          email: string;
          phone: string;
          level: 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';
          balance: number;
          enrolled_groups: string[];
          created_at: string;
          avatar?: string;
        };
        Insert: Omit<Database['public']['Tables']['students']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['students']['Row']>;
      };
      teachers: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          email: string;
          phone: string;
          specialization: string;
          assigned_groups: string[];
          created_at: string;
          avatar?: string;
        };
        Insert: Omit<Database['public']['Tables']['teachers']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['teachers']['Row']>;
      };
      groups: {
        Row: {
          id: string;
          name: string;
          level: 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';
          teacher_id: string;
          student_ids: string[];
          max_students: number;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['groups']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['groups']['Row']>;
      };
      lessons: {
        Row: {
          id: string;
          title: string;
          type: 'GROUP' | 'INDIVIDUAL';
          status: 'SCHEDULED' | 'COMPLETED' | 'CANCELLED';
          group_id?: string;
          teacher_id: string;
          classroom: string;
          date: string;
          start_time: string;
          end_time: string;
          cost: number;
          attendees?: string[];
          max_students?: number;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['lessons']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['lessons']['Row']>;
      };
      payments: {
        Row: {
          id: string;
          student_id: string;
          amount: number;
          type: 'DEPOSIT' | 'LESSON_PAYMENT';
          description: string;
          date: string;
          lesson_id?: string;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['payments']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['payments']['Row']>;
      };
    };
    Functions: {
      get_student_statistics: {
        Args: { 
          group_id?: string;
          teacher_id?: string;
        };
        Returns: {
          total: number;
          by_level: Record<string, number>;
          average_balance: number;
          active_groups: number;
        };
      };
      get_group_statistics: {
        Args: { 
          group_id: string;
        };
        Returns: {
          total_lessons: number;
          completed_lessons: number;
          upcoming_lessons: number;
          average_attendance: number;
          total_revenue: number;
        };
      };
    };
  };
};
