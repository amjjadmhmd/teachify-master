// File: frontend/skill/api/services/index.ts
/**
 * Centralized API services export
 */
import authService from './authService';
import coursesService from './coursesService';
import apiClient, { handleApiError } from '../config';
import {
  Exam,
  Question,
  ExamAttempt,
  Certificate,
  ExamSubmitRequest,
  ExamSubmitResponse,
  Notification,
  CreateNotificationRequest,
  PlatformStats,
  PublicInstructor,
  PaginatedResponse,
  ExamSubmission
} from '../types';

// ==========================================
// Exams Service
// ==========================================
class ExamsService {
  /**
    * Get all exams
    * GET /api/exams/
    */
  async listExams(): Promise<Exam[]> {
    try {
      const response = await apiClient.get<PaginatedResponse<Exam> | Exam[]>('/api/exams/');
      // Handle both paginated response and direct array response
      if (Array.isArray(response.data)) {
        return response.data;
      }
      return (response.data as PaginatedResponse<Exam>).results || [];
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Get exam details with questions
   * GET /api/exams/{id}/
   */
  async getExam(id: number): Promise<Exam> {
    try {
      const response = await apiClient.get<Exam>(`/api/exams/${id}/`);
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Get questions for an exam
   * GET /api/questions/?exam={id}
   */
  async getQuestions(examId: number): Promise<Question[]> {
    try {
      const response = await apiClient.get<PaginatedResponse<Question>>(
        '/api/questions/',
        { params: { exam: examId } }
      );
      return response.data.results;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Submit exam answers
   * POST /api/exams/{id}/submit/
   */
  async submitExam(examId: number, data: ExamSubmitRequest): Promise<ExamSubmitResponse> {
    try {
      const response = await apiClient.post<ExamSubmitResponse>(
        `/api/exams/${examId}/submit/`,
        data
      );
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
    * Get exam attempts
    * GET /api/attempts/
    */
  async listAttempts(): Promise<ExamAttempt[]> {
    try {
      const response = await apiClient.get<PaginatedResponse<ExamAttempt> | ExamAttempt[]>(
        '/api/attempts/'
      );
      // Handle both paginated and non-paginated responses
      if (Array.isArray(response.data)) {
        return response.data;
      }
      return (response.data as PaginatedResponse<ExamAttempt>).results || [];
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Get certificates
   * GET /api/certificates/
   */
  async listCertificates(): Promise<Certificate[]> {
    try {
      const response = await apiClient.get<any>('/api/certificates/');
      console.log('Raw API response:', response);
      
      // Handle both paginated and non-paginated responses
      if (Array.isArray(response.data)) {
        console.log('Response is array:', response.data);
        return response.data;
      }
      
      // Handle paginated response
      if (response.data?.results) {
        console.log('Response has results:', response.data.results);
        return response.data.results;
      }
      
      // Fallback
      console.log('No data found, returning empty array');
      return [];
    } catch (error) {
      console.error('Error in listCertificates:', error);
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Get certificates (alias for listCertificates)
   */
  async getCertificates(): Promise<Certificate[]> {
    return this.listCertificates();
  }

  /**
   * Create exam (Instructor only)
   * POST /api/exams/
   */
  async createExam(data: Partial<Exam>): Promise<Exam> {
    try {
      const response = await apiClient.post<Exam>('/api/exams/', data);
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Create question (Instructor only)
   * POST /api/questions/
   */
  async createQuestion(data: Partial<Question>): Promise<Question> {
    try {
      const response = await apiClient.post<Question>('/api/questions/', data);
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Get exam submissions (Instructor only)
   * GET /api/exams/{id}/submissions/
   */
  async getExamSubmissions(examId: number): Promise<ExamSubmission[]> {
    try {
      const response = await apiClient.get<ExamSubmission[]>(
        `/api/exams/${examId}/submissions/`
      );
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Delete exam (Instructor only)
   * DELETE /api/exams/{id}/
   */
  async deleteExam(examId: number): Promise<void> {
    try {
      await apiClient.delete(`/api/exams/${examId}/`);
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }
}

// ==========================================
// Notifications Service
// ==========================================
class NotificationsService {
  /**
   * Get user's notifications
   * GET /api/notifications/
   */
  async listNotifications(userId?: number): Promise<Notification[]> {
    try {
      // Note: userId is ignored - backend filters based on authenticated user
      const response = await apiClient.get<Notification[] | PaginatedResponse<Notification>>(
        '/api/notifications/'
      );
      // Handle both paginated and non-paginated responses
      if (Array.isArray(response.data)) {
        return response.data;
      }
      return (response.data as PaginatedResponse<Notification>).results || [];
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Create notification (Instructor only)
   * POST /api/notifications/
   */
  async createNotification(data: CreateNotificationRequest): Promise<Notification> {
    try {
      const response = await apiClient.post<Notification>(
        '/api/notifications/',
        data
      );
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Send message to student (Instructor only)
   * POST /api/notifications/
   */
  async sendMessage(studentId: number, message: string): Promise<Notification> {
    try {
      const response = await apiClient.post<Notification>(
        '/api/notifications/',
        {
          user: studentId,
          title: 'Message from Instructor',
          message: message,
          type: 'info'
        }
      );
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
    * Request certificate
    * POST /api/certificate-requests/
    */
  async requestCertificate(
    courseTitle: string,
    user: { id: number; username: string },
    instructorId: number
  ): Promise<any> {
    try {
      const response = await apiClient.post(
        '/api/certificate-requests/',
        {
          student: user.id,
          instructor: instructorId,
          course_title: courseTitle
        }
      );
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Mark notification as read
   * PATCH /api/notifications/{id}/
   */
  async markAsRead(id: number): Promise<Notification> {
    try {
      const response = await apiClient.patch<Notification>(
        `/api/notifications/${id}/`,
        { is_read: true }
      );
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Mark all notifications as read
   * POST /api/notifications/mark_all_as_read/
   */
  async markAllAsRead(): Promise<void> {
    try {
      await apiClient.post('/api/notifications/mark_all_as_read/');
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }
}

// ==========================================
// Public API Service
// ==========================================
class PublicService {
  /**
   * Get platform statistics
   * GET /public/stats/
   */
  async getStats(): Promise<PlatformStats> {
    try {
      const response = await apiClient.get<PlatformStats>('/public/stats/');
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Get public instructors list
   * GET /public/instructors/
   */
  async getInstructors(): Promise<PublicInstructor[]> {
    try {
      const response = await apiClient.get<PublicInstructor[]>(
        '/public/instructors/'
      );
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }
}

// ==========================================
// Instructor Service
// ==========================================
class InstructorService {
  /**
   * Send certificate to student
   * POST /api/certificates/
   */
  async sendCertificate(
    studentId: number,
    courseTitle: string,
    imageFile: File
  ): Promise<any> {
    try {
      const formData = new FormData();
      formData.append('student', studentId.toString());
      formData.append('course_title', courseTitle);
      formData.append('image', imageFile);
      
      const response = await apiClient.post(
        '/api/certificates/',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        }
      );
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }
}

// ==========================================
// Export all services
// ==========================================
const examsService = new ExamsService();
const notificationsService = new NotificationsService();
const publicService = new PublicService();
const instructorService = new InstructorService();

export {
  authService,
  coursesService,
  examsService,
  notificationsService,
  publicService,
  instructorService
};

// Default export for convenience
export default {
  auth: authService,
  courses: coursesService,
  exams: examsService,
  notifications: notificationsService,
  public: publicService,
  instructor: instructorService
};