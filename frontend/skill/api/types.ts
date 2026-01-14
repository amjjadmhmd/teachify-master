
export interface User {
  id: number;
  username: string;
  email: string;
  role: 'student' | 'instructor' | 'admin';
  phone_number?: string;
  avatar?: string;
  is_verified: boolean;
  instructor_verified?: boolean;
  token?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  access: string;
  refresh: string;
  user: User;
}

export interface RegisterRequest {
  email: string;
  username?: string;
  password: string;
  role: 'student' | 'instructor';
  phone_number?: string;
  instructor_code?: string;
}

export interface TokenRefreshRequest {
  refresh: string;
}

export interface TokenRefreshResponse {
  access: string;
}

// ==========================================
// Course Types
// ==========================================

export interface Category {
  id: number;
  name: string;
  slug: string;
}

export interface Lesson {
  id: number;
  course: number;
  title: string;
  description: string;
  video_url: string;
  order: number;
  is_completed?: boolean;
  duration?: string;
}

export interface Course {
  id: number;
  instructor: number;
  title: string;
  description: string;
  category: number;
  category_details?: Category;
  price: string;
  thumbnail?: string | File;
  thumbnail_url?: string;
  created_at: string;
  lessons?: Lesson[];
  is_enrolled: boolean;
  progress?: number;
  status?: 'published' | 'draft';
  students_count?: number;
  rating?: number;
  revenue?: number;
}

export interface CreateCourseRequest {
  title: string;
  description: string;
  category: number;
  price: string;
  thumbnail?: string;
}

// ==========================================
// Enrollment & Progress Types
// ==========================================

export interface Enrollment {
  id: number;
  student: number;
  student_email: string;
  course: number;
  course_title: string;
  enrolled_at: string;
}

export interface LessonProgress {
  id: number;
  lesson: number;
  lesson_title: string;
  student: number;
  is_completed: boolean;
  completed_at?: string;
  progress_percent: number;
}

export interface CreateLessonProgressRequest {
  lesson: number;
  is_completed: boolean;
  progress_percent?: number;
}

// ==========================================
// Wishlist Types
// ==========================================

export interface WishlistItem {
  id: number;
  student: number;
  course: number;
  course_title: string;
  course_thumbnail: string;
  course_price: string;
  created_at: string;
}

export interface AddToWishlistRequest {
  course: number;
}

// ==========================================
// Dashboard Types
// ==========================================

export interface StudentDashboard {
  progress_percent: number;
  total_enrolled_courses: number;
  total_completed_lessons: number;
  wishlist_count: number;
  latest_completed_lessons: Array<{
    id: number;
    title: string;
    course_title: string;
  }>;
  active_courses: Course[];
  earned_certificates?: Certificate[];
  past_results?: ExamAttempt[];
  my_assignments: Assignment[];
  average_quiz_score?: number;
  total_hours_studied?: number;
  upcoming_tasks?: Array<{
    id: number;
    title: string;
    due_date: string;
  }>;
}

export interface InstructorDashboard {
  stats: {
    total_earnings: number;
    pending_payouts: number;
    total_students: number;
    total_courses: number;
    total_lessons: number;
    average_rating: number;
    best_selling_course: string;
  };
  revenue_trend: Array<{
    date: string;
    amount: number;
  }>;
  latest_enrollments: Array<{
    id: number;
    student_name: string;
    course_title: string;
    date: string;
    avatar?: string;
  }>;
  my_courses: Course[];
  pending_assignments: Assignment[];
}

// ==========================================
// Exam Types
// ==========================================

export interface Question {
  id: number;
  exam?: number;
  question_text?: string;
  text?: string;
  option_a?: string;
  option_b?: string;
  option_c?: string;
  option_d?: string;
  options?: string[];
  correct_option?: string;
  correctAnswer?: string;
  mark?: number;
  points?: number;
}

export interface Exam {
  id: number;
  course: number;
  title: string;
  description: string;
  time_limit?: number;
  duration_minutes?: number;
  total_marks?: number;
  total_points?: number;
  publish_date?: string;
  due_date?: string;
  course_title?: string;
  instructor_id?: number;
  question_count?: number;
  questions?: Question[];
}

export interface ExamSubmitRequest {
  answers: Array<{
    question: number;
    selected_option: string;
  }>;
}

export interface ExamSubmitResponse {
  attempt_id: number;
  score: number;
  earned_points: number;
  total_points: number;
  is_passed: boolean;
}

export interface ExamAttempt {
  id: number;
  exam: number;
  exam_title: string;
  course_title: string;
  student: number;
  score: number;
  total_score: number;
  started_at: string;
  finished_at?: string;
  is_passed: boolean;
  taken_at?: string;
  answers?: StudentAnswer[];
}

export interface StudentAnswer {
  id: number;
  attempt: number;
  question: number;
  selected_option: string;
  is_correct: boolean;
}

// ==========================================
// Certificate Types
// ==========================================

export interface Certificate {
  id: number;
  attempt?: number;
  student: number;
  exam?: number;
  exam_title?: string;
  course_title?: string;
  certificate_code: string;
  verification_code: string;
  issued_at: string;
  created_at?: string;
  certificate_url?: string;
  image?: string;
  image_url?: string;
}

// ==========================================
// Notification Types
// ==========================================

export interface Notification {
  id: number;
  user: number;
  user_name: string;
  title: string;
  message: string;
  type: 'success' | 'info' | 'warning' | 'error' | 'message' | 'certificate_request' | 'new_exam' | 'new_course';
  is_read: boolean;
  created_at: string;
  date?: string;
  student_id?: number;
  instructor_id?: number;
}

export interface CreateNotificationRequest {
  user: number;
  title: string;
  message: string;
  type: 'success' | 'info' | 'warning' | 'error';
}

// ==========================================
// Assignment Types
// ==========================================

export interface Assignment {
  id: number;
  title: string;
  description: string;
  course_title: string;
  deadline: string;
  status: 'pending' | 'submitted' | 'graded';
  file_url?: string;
  grade?: string;
  feedback?: string;
  student_name?: string;
  date?: string;
}

// ==========================================
// Public API Types
// ==========================================

export interface PlatformStats {
  active_students: string;
  expert_instructors: string;
  total_courses: string;
  hired_graduates: string;
}

export interface PublicInstructor {
  id: number;
  name: string;
  role: string;
  company: string;
  image: string;
  bio?: string;
  student_count?: string;
  rating?: number;
}

// ==========================================
// Instructor Feature Types
// ==========================================

export interface InstructorWallet {
  balance: number;
  pending_payout: number;
  total_revenue: number;
  total_students: number;
  history: Array<{
    id: number;
    type: string;
    course: string;
    amount: number;
    date: string;
  }>;
}

export interface InstructorStudent {
  id: number;
  name: string;
  email: string;
  enrolled_courses: string[];
  progress_avg: number;
  last_active: string;
  join_date: string;
  total_spent: number;
}

export interface ExamSubmission {
  id: number;
  student_name: string;
  earned_points: number;
  total_points: number;
  percentage: number;
}

// ==========================================
// Task Types (NEW)
// ==========================================

export interface Task {
  id: number;
  instructor: number;
  instructor_name: string;
  course: number;
  course_title: string;
  title: string;
  description: string;
  file: string | File;
  file_url?: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  due_date?: string;
  created_at: string;
  updated_at: string;
  submission_count: number;
}

export interface TaskSubmission {
  id: number;
  task: number;
  task_title: string;
  student: number;
  student_name: string;
  student_username: string;
  submission_file: string | File;
  submission_file_url?: string;
  submitted_at: string;
  score?: number;
  feedback?: string;
  status: 'submitted' | 'graded' | 'pending_review';
  graded_at?: string;
}

// ==========================================
// API Response Wrappers
// ==========================================

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface ApiError {
  detail?: string;
  message?: string;
  [key: string]: any;
}