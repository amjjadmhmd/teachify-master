
import React from 'react';

export enum ViewMode {
  LANDING = 'LANDING',
  AUTH = 'AUTH',
  DASHBOARD = 'DASHBOARD',
  WORKSPACE = 'WORKSPACE', // Added Workspace view
  MARKETPLACE = 'MARKETPLACE',
  WISHLIST = 'WISHLIST',
  CART = 'CART',
  COURSE_PLAYER = 'COURSE_PLAYER',
  EXAM_LIST = 'EXAM_LIST', 
  EXAM_RUNNER = 'EXAM_RUNNER',
  COURSE_EDITOR = 'COURSE_EDITOR', 
  STUDENTS_LIST = 'STUDENTS_LIST', 
  INSTRUCTOR_EXAMS = 'INSTRUCTOR_EXAMS',
  INSTRUCTOR_WALLET = 'INSTRUCTOR_WALLET',
  ASSIGNMENTS = 'ASSIGNMENTS',
  JOIN_PLATFORM = 'JOIN_PLATFORM',
  MENTORS_LIST = 'MENTORS_LIST',
  CERTIFICATES = 'CERTIFICATES',
}

export type Theme = 'light' | 'dark';
export type Lang = 'en' | 'ar';

export interface User {
  id: number;
  username: string;
  email: string;
  role: 'student' | 'instructor' | 'admin';
  avatar?: string;
  token?: string; 
}

export interface Question {
  id: number;
  text: string;
  options: string[];
  correctAnswer: string;
  points: number;
}

export interface PendingQuiz {
  id: number;
  title: string;
  course_id?: string | number;
  course_title: string;
  instructor_id: number; 
  due_date: string;
  duration_minutes: number;
  question_count: number;
  total_points: number;
  questions?: Question[];
}

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

export interface Resource {
  id: number;
  title: string;
  type: 'pdf' | 'link' | 'file';
  url: string;
  size?: string;
}

export interface Course {
  id: number;
  title: string;
  description: string;
  instructor_id: number; 
  category: number;
  price: string;
  thumbnail?: string | File;
  thumbnail_url?: string;
  created_at: string;
  is_enrolled: boolean;
  lessons?: Lesson[];
  resources?: Resource[]; 
  progress?: number;
  status?: 'published' | 'draft';
  students_count?: number;
  rating?: number;
  revenue?: number;
}

export interface Lesson {
  id: number;
  title: string;
  description: string;
  video_url: string;
  order: number;
  is_completed?: boolean; 
  duration?: string;
}

export interface InstructorDashboardData {
  stats: {
    total_earnings: number;
    pending_payouts: number;
    total_students: number;
    total_courses: number;
    total_lessons: number;
    average_rating: number;
    best_selling_course: string;
  };
  revenue_trend: { date: string; amount: number; }[];
  latest_enrollments: { id: number; student_name: string; course_title: string; date: string; avatar?: string }[];
  my_courses: Course[];
  pending_assignments: Assignment[];
}

export interface DashboardData {
  progress_percent: number;
  total_enrolled_courses: number;
  wishlist_count: number;
  latest_completed_lessons: { id: number; title: string; course_title: string }[];
  active_courses: Course[];
  earned_certificates?: Certificate[];
  past_results?: ExamAttempt[];
  my_assignments: Assignment[];
  average_quiz_score?: number;
  total_hours_studied?: number;
  upcoming_tasks?: { id: number; title: string; due_date: string }[];
}

export interface Certificate {
  id: number;
  course_title: string;
  issued_at: string;
  certificate_url: string;
  image_url: string;
}

export interface ExamAttempt {
  id: number;
  exam_title: string;
  course_title: string;
  score: number;
  total_score: number;
  is_passed: boolean;
  taken_at: string;
}

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

export interface ExamResult {
  score: number;
  earned_points: number;
  total_points: number;
  is_passed: boolean;
  attempt_id: number;
}

export interface RevealProps {
  children: React.ReactNode;
  width?: 'fit-content' | '100%';
  delay?: number;
}

export interface Notification {
  id: number;
  title: string;
  message: string;
  date: string;
  type: 'message' | 'certificate_request' | 'new_exam' | 'new_course';
  is_read: boolean;
  student_id?: number;
  instructor_id?: number; 
}

export interface ExamSubmission {
  id: number;
  student_name: string;
  earned_points: number;
  total_points: number;
  percentage: number;
}

export interface WishlistItem {
  id: number;
  course: number;
  course_title: string;
  course_thumbnail: string;
  course_price: string;
  created_at: string;
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
