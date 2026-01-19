import React, { useState, useEffect } from "react";
import { Lang, Theme, Task } from "../../types";
import { api } from "../../api/client";
import { Card, Button, Input } from "../../components/UI";
import { Reveal } from "../../components/Reveal";
import {
  Plus,
  FileText,
  Upload,
  Trash2,
  Calendar,
  AlertCircle,
  CheckCircle2,
  Clock,
  Download,
  Eye,
} from "lucide-react";

const InstructorTasks: React.FC<{ lang: Lang; theme: Theme }> = ({
  lang,
  theme,
}) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [coursesLoading, setCoursesLoading] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    priority: "medium" as "low" | "medium" | "high" | "critical",
    due_date: "",
    file: null as File | null,
  });
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showSubmissionsModal, setShowSubmissionsModal] = useState(false);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [submissionsLoading, setSubmissionsLoading] = useState(false);

  const isEn = lang === "en";

  // Load courses for dropdown
  useEffect(() => {
    const loadCourses = async () => {
      setCoursesLoading(true);
      try {
        console.log("Loading instructor courses...");
        const res = await api.courses.getInstructorDashboard();
        console.log("Dashboard response:", res);
        if (res && res.my_courses) {
          console.log("Setting courses:", res.my_courses);
          setCourses(res.my_courses);
        } else {
          console.warn(
            "No my_courses in response, trying listCourses fallback"
          );
          // Fallback to list all courses
          const allCourses = await api.courses.listCourses();
          if (allCourses && allCourses.results) {
            setCourses(allCourses.results);
          }
        }
      } catch (error: any) {
        console.error("Failed to load courses:", error);
        console.error("Error details:", error.response?.data || error.message);
        setCourses([]);
      } finally {
        setCoursesLoading(false);
      }
    };
    loadCourses();
  }, []);

  // Load tasks
  useEffect(() => {
    loadTasks();
  }, []);

  const loadTasks = async () => {
    setIsLoading(true);
    try {
      const res = await api.courses.listTasks();
      // Handle both paginated and non-paginated responses
      const tasksData = Array.isArray(res) ? res : res.results || [];
      setTasks(tasksData);
    } catch (error) {
      console.error("Failed to load tasks:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFormData({ ...formData, file: e.target.files[0] });
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourse || !formData.file) {
      alert(
        isEn
          ? "Please fill all required fields"
          : "يرجى ملء جميع الحقول المطلوبة"
      );
      return;
    }

    try {
      const res = await api.courses.createTask({
        course: selectedCourse,
        title: formData.title,
        description: formData.description,
        priority: formData.priority,
        due_date: formData.due_date,
        file: formData.file,
      });

      setTasks([res, ...(tasks || [])]);
      setShowCreateModal(false);
      setFormData({
        title: "",
        description: "",
        priority: "medium",
        due_date: "",
        file: null,
      });
      setSelectedCourse(null);
      alert(isEn ? "Task created successfully!" : "تم إنشاء المهمة بنجاح!");
    } catch (error) {
      console.error("Failed to create task:", error);
      alert(isEn ? "Failed to create task" : "فشل إنشاء المهمة");
    }
  };

  const handleViewSubmissions = async (task: Task) => {
    setSelectedTask(task);
    setShowSubmissionsModal(true);
    setSubmissionsLoading(true);
    try {
      const subs = await api.courses.getTaskSubmissions(task.id);
      setSubmissions(subs);
    } catch (error) {
      console.error("Failed to load submissions:", error);
    } finally {
      setSubmissionsLoading(false);
    }
  };

  const handleDeleteTask = async (taskId: number) => {
    if (
      !confirm(
        isEn
          ? "Are you sure you want to delete this task?"
          : "هل أنت متأكد من حذف هذه المهمة؟"
      )
    ) {
      return;
    }
    try {
      await api.courses.deleteTask(taskId);
      setTasks(tasks.filter((t) => t.id !== taskId));
      alert(isEn ? "Task deleted successfully" : "تم حذف المهمة بنجاح");
    } catch (error) {
      console.error("Failed to delete task:", error);
      alert(isEn ? "Failed to delete task" : "فشل حذف المهمة");
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "critical":
        return "text-red-500 bg-red-500/10";
      case "high":
        return "text-orange-500 bg-orange-500/10";
      case "medium":
        return "text-blue-500 bg-blue-500/10";
      case "low":
        return "text-green-500 bg-green-500/10";
      default:
        return "text-gray-500 bg-gray-500/10";
    }
  };

  return (
    <div className="pb-10 pt-32 sm:pt-40 px-4 lg:px-8 max-w-7xl mx-auto min-h-screen">
      <Reveal>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
              {isEn ? "Task Management" : "إدارة المهام"}
            </h1>
            <p className="text-slate-500 mt-2">
              {isEn
                ? "Create and manage tasks for your courses"
                : "إنشاء وإدارة المهام لدوراتك"}
            </p>
          </div>
          <Button
            className="shadow-neon"
            onClick={() => setShowCreateModal(true)}
          >
            <Plus size={18} /> {isEn ? "Create Task" : "إنشاء مهمة"}
          </Button>
        </div>
      </Reveal>

      {/* Create Task Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                {isEn ? "Create New Task" : "إنشاء مهمة جديدة"}
              </h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-500 hover:text-slate-900 dark:hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateTask} className="space-y-4">
              {/* Course Selection */}
              <div>
                <label className="block text-sm font-bold text-slate-900 dark:text-white mb-2">
                  {isEn ? "Course" : "الدورة"} *
                </label>
                <select
                  value={selectedCourse || ""}
                  onChange={(e) => setSelectedCourse(Number(e.target.value))}
                  disabled={coursesLoading || !courses || courses.length === 0}
                  className="w-full px-4 py-2 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg text-slate-900 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <option value="">
                    {coursesLoading
                      ? isEn
                        ? "Loading courses..."
                        : "جاري تحميل الدورات..."
                      : isEn
                      ? "Select a course"
                      : "اختر دورة"}
                  </option>
                  {courses &&
                    courses.length > 0 &&
                    courses.map((course) => (
                      <option key={course.id} value={course.id}>
                        {course.title}
                      </option>
                    ))}
                </select>
                {(!courses || courses.length === 0) && !coursesLoading && (
                  <p className="text-xs text-red-500 mt-1">
                    {isEn
                      ? "No courses found. Create a course first."
                      : "لم يتم العثور على دورات. أنشئ دورة أولاً."}
                  </p>
                )}
              </div>

              {/* Title */}
              <div>
                <label className="block text-sm font-bold text-slate-900 dark:text-white mb-2">
                  {isEn ? "Task Title" : "عنوان المهمة"} *
                </label>
                <Input
                  type="text"
                  placeholder={isEn ? "Enter task title" : "أدخل عنوان المهمة"}
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  className="w-full"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-bold text-slate-900 dark:text-white mb-2">
                  {isEn ? "Description" : "الوصف"}
                </label>
                <textarea
                  placeholder={
                    isEn ? "Enter task description" : "أدخل وصف المهمة"
                  }
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  className="w-full px-4 py-2 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg text-slate-900 dark:text-white resize-none h-24"
                />
              </div>

              {/* Priority and Due Date */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-900 dark:text-white mb-2">
                    {isEn ? "Priority" : "الأولوية"}
                  </label>
                  <select
                    value={formData.priority}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        priority: e.target.value as any,
                      })
                    }
                    className="w-full px-4 py-2 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg text-slate-900 dark:text-white"
                  >
                    <option value="low">{isEn ? "Low" : "منخفضة"}</option>
                    <option value="medium">{isEn ? "Medium" : "متوسطة"}</option>
                    <option value="high">{isEn ? "High" : "عالية"}</option>
                    <option value="critical">
                      {isEn ? "Critical" : "حرجة"}
                    </option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-900 dark:text-white mb-2">
                    {isEn ? "Due Date" : "تاريخ الاستحقاق"}
                  </label>
                  <Input
                    type="datetime-local"
                    value={formData.due_date}
                    onChange={(e) =>
                      setFormData({ ...formData, due_date: e.target.value })
                    }
                    className="w-full"
                  />
                </div>
              </div>

              {/* File Upload */}
              <div>
                <label className="block text-sm font-bold text-slate-900 dark:text-white mb-2">
                  {isEn ? "Task File (PDF, Word, etc.)" : "ملف المهمة"} *
                </label>
                <div className="border-2 border-dashed border-slate-300 dark:border-white/10 rounded-lg p-8 text-center">
                  <input
                    type="file"
                    onChange={handleFileChange}
                    className="hidden"
                    id="file-upload"
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx"
                  />
                  <label
                    htmlFor="file-upload"
                    className="cursor-pointer flex flex-col items-center gap-2"
                  >
                    <Upload
                      size={32}
                      className="text-slate-400 hover:text-primary transition"
                    />
                    <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
                      {formData.file
                        ? formData.file.name
                        : isEn
                        ? "Click to upload or drag and drop"
                        : "انقر للتحميل أو اسحب وأفلت"}
                    </span>
                  </label>
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex gap-2 justify-end pt-4">
                <Button
                  variant="outline"
                  onClick={() => setShowCreateModal(false)}
                >
                  {isEn ? "Cancel" : "إلغاء"}
                </Button>
                <Button type="submit" className="shadow-neon">
                  {isEn ? "Create Task" : "إنشاء المهمة"}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* Submissions Modal */}
      {showSubmissionsModal && selectedTask && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                  {selectedTask.title}
                </h2>
                <p className="text-sm text-slate-500 mt-1">
                  {isEn ? "Submissions" : "التقديمات"}
                </p>
              </div>
              <button
                onClick={() => setShowSubmissionsModal(false)}
                className="text-slate-500 hover:text-slate-900 dark:hover:text-white text-2xl"
              >
                ✕
              </button>
            </div>

            {submissionsLoading ? (
              <div className="text-center py-8">
                <p className="text-slate-500">
                  {isEn ? "Loading submissions..." : "جاري تحميل التقديمات..."}
                </p>
              </div>
            ) : submissions.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-slate-500">
                  {isEn ? "No submissions yet" : "لا توجد تقديمات بعد"}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {submissions.map((submission) => (
                  <div
                    key={submission.id}
                    className="p-4 bg-slate-50 dark:bg-white/5 rounded-lg border border-slate-100 dark:border-white/10 flex items-center justify-between"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm text-slate-900 dark:text-white">
                        {submission.student_name}
                      </p>
                      <p className="text-xs text-slate-500 mt-1">
                        {isEn ? "Submitted:" : "تم التقديم:"}{" "}
                        {new Date(submission.submitted_at).toLocaleDateString()}
                      </p>
                      {submission.score !== null && (
                        <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1 font-bold">
                          {isEn ? "Score" : "الدرجة"}: {submission.score}%
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0 ml-4">
                      <a
                        href={submission.submission_file_url}
                        download
                        className="p-2 text-blue-500 hover:bg-blue-500/10 rounded-lg transition"
                        title={isEn ? "Download" : "تحميل"}
                      >
                        <Download size={18} />
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      )}

      {/* Tasks List */}
      {isLoading ? (
        <div className="text-center py-12">
          <p className="text-slate-500">
            {isEn ? "Loading tasks..." : "جاري تحميل المهام..."}
          </p>
        </div>
      ) : !tasks || tasks.length === 0 ? (
        <Card className="py-12 text-center">
          <FileText size={48} className="mx-auto text-slate-400 mb-4" />
          <p className="text-slate-500 text-lg">
            {isEn ? "No tasks created yet" : "لم تقم بإنشاء أي مهام بعد"}
          </p>
        </Card>
      ) : (
        <div className="grid gap-4">
          {tasks.map((task) => (
            <Reveal key={task.id}>
              <Card className="!p-4 hover:shadow-lg transition-all">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                        {task.title}
                      </h3>
                      <span
                        className={`px-2 py-1 rounded text-xs font-bold uppercase ${getPriorityColor(
                          task.priority
                        )}`}
                      >
                        {task.priority}
                      </span>
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                      {task.course_title}
                    </p>
                    {task.description && (
                      <p className="text-sm text-slate-500 line-clamp-2 mb-3">
                        {task.description}
                      </p>
                    )}
                    <div className="flex flex-wrap gap-4 text-xs text-slate-500">
                      {task.due_date && (
                        <div className="flex items-center gap-1">
                          <Calendar size={14} />
                          {new Date(task.due_date).toLocaleDateString()}
                        </div>
                      )}
                      <div className="flex items-center gap-1">
                        <CheckCircle2 size={14} />
                        {task.submission_count} {isEn ? "submissions" : "تقديم"}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewSubmissions(task)}
                    >
                      <Eye size={16} /> {isEn ? "View" : "عرض"}
                    </Button>
                    <button
                      onClick={() => handleDeleteTask(task.id)}
                      className="px-3 py-2 text-red-500 hover:bg-red-500/10 rounded-lg transition text-sm font-medium"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </Card>
            </Reveal>
          ))}
        </div>
      )}
    </div>
  );
};

export default InstructorTasks;
