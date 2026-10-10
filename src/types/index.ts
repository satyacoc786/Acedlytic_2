export interface Student {
  student_id: string;
  department: string;
  student_name: string;
  year_of_study: string;
  mid_1_marks: number;
  mid_2_marks: number;
  student_address: string;
  semester: number;
  cgpa: number;
  internal_marks: number;
  backlogs: number;
  attendance_pct: number;
  lms_logins_30d: number;
  assignment_completion_pct: number;
  events_attended: number;
  certifications: number;
  hackathons: number;
  aptitude_score: number;
  coding_score: number;
  mock_interviews: number;
  technical_skill: number;
  communication_skill: number;
  satisfaction_rating: number;
  academic_score: number;
  attendance_score: number;
  lms_score: number;
  placement_score: number;
  engagement_score: number;
  feedback_score: number;
  success_score: number;
  success_rate?: number;
  risk_points: number;
  risk_level: 'High' | 'Moderate' | 'Low';
  predicted_support_probability: number;
  cluster_id: number;
  academic_placement_segment: string;
  avatar_url?: string;
}

export interface Staff {
  staff_id: string;
  staff_name: string;
  email: string;
  department: string;
  designation: string;
  assigned_subjects: string;
  address: string;
}

export interface CalendarEvent {
  id: string;
  sl_no: string;
  date: string;
  day_allocation: string;
  day_count: string;
  week_count: string;
  event_type: 'Holiday' | 'Exam' | 'WorkingDay' | 'Other';
}

export interface Intervention {
  id: string;
  student_id: string;
  student_name: string;
  department: string;
  reason: string;
  indicator: string;
  recommended_action: string;
  assigned_staff_name: string;
  priority: 'High' | 'Medium' | 'Low';
  status: 'New' | 'In Progress' | 'Completed' | 'Closed';
  created_at: string;
  due_date: string;
  notes: string[];
  outcome?: string;
}

export interface StaffFeedback {
  id: string;
  student_id: string;
  staff_id: string;
  staff_name: string;
  department: string;
  subject: string;
  rating: number;
  category: string;
  comments: string;
  improvement_suggestions?: string;
  privacy_mode: 'Identified' | 'Confidential';
  created_at: string;
}

export interface AuthUser {
  id: string;
  name: string;
  role: 'student' | 'staff' | 'admin';
  department?: string;
  designation?: string;
  email?: string;
  year?: string;
  semester?: number;
  assigned_subjects?: string;
  data?: Student;
}
