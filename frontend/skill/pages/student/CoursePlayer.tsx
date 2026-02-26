import React, { useState, useEffect, useRef } from "react";
import {
  Course,
  Lang,
  Theme,
  Lesson,
  Assignment,
  Task,
  TaskSubmission,
} from "../../types";
import { api } from "../../api/client";
import { geminiService } from "../../services/geminiService";
import { Card, Button, Input } from "../../components/UI";
import { Reveal } from "../../components/Reveal";
import {
  resolveImageUrl,
  handleImageError,
  getApiBaseUrl,
} from "../../utils/imageUtils";
import { isStaticCourse } from "../../utils/staticCourses";
import {
  Play,
  FileText,
  CheckCircle,
  Video,
  Book,
  Menu,
  Sparkles,
  Send,
  BrainCircuit,
  Upload,
  ArrowLeft,
  ArrowRight,
  MessageSquare,
  ChevronDown,
  Clock,
  Download,
} from "lucide-react";

const CoursePlayer: React.FC<{
  lang: Lang;
  theme: Theme;
  isMobile: boolean;
  selectedCourse?: any;
  previewOnly?: boolean;
  onJoinPlatform?: () => void;
  onBack?: () => void;
  onProgressChange?: () => void;
}> = ({ lang, theme, isMobile, selectedCourse, previewOnly = false, onJoinPlatform, onBack, onProgressChange }) => {
  const [courses, setCourses] = useState<any[]>([]);
  const [activeCourse, setActiveCourse] = useState<any>(null);
  const [activeLesson, setActiveLesson] = useState<any>(null);
  const [tab, setTab] = useState<
    "lessons" | "resources" | "ai" | "assignments"
  >("lessons");
  const [sidebarOpen, setSidebarOpen] = useState(!isMobile);
  const [isMarkingComplete, setIsMarkingComplete] = useState(false);
  const [showCourseDropdown, setShowCourseDropdown] = useState(false);
  const [courseTasks, setCourseTasks] = useState<Task[]>([]);
  const [isStaticPreview, setIsStaticPreview] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [tasksLoading, setTasksLoading] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [submittingTask, setSubmittingTask] = useState(false);
  const [submissionFile, setSubmissionFile] = useState<File | null>(null);

  // AI Chat States
  const [aiQuestion, setAiQuestion] = useState("");
  const [aiChat, setAiChat] = useState<
    { role: "user" | "bot"; text: string }[]
  >([]);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const isEn = lang === "en";
  const handleBack = () => {
    if (onBack) {
      onBack();
      return;
    }
    window.history.back();
  };

  const getFullVideoUrl = (videoUrl: string) => {
    if (!videoUrl) return "";
    if (videoUrl.startsWith("http")) return videoUrl;
    const baseUrl = getApiBaseUrl();
    return `${baseUrl}${videoUrl}`;
  };

  const handleDownloadVideo = async () => {
    if (!activeLesson?.video_url) return;

    try {
      const fullUrl = getFullVideoUrl(activeLesson.video_url);
      const response = await fetch(fullUrl);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${activeLesson.title || "lesson"}.mp4`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Download failed:", error);
      alert(isEn ? "Failed to download video" : "ÙØ´Ù„ ØªØ­Ù…ÙŠÙ„ Ø§Ù„ÙÙŠØ¯ÙŠÙˆ");
    }
  };

  const normalizePreviewCourse = (course: any) => {
    const safeLessons =
      Array.isArray(course?.lessons) && course.lessons.length > 0
        ? course.lessons.map((lesson: any, index: number) => ({
            id: lesson.id || course.id * 100 + index + 1,
            title:
              lesson.title ||
              (isEn
                ? `Lesson ${index + 1}`
                : `Ø§Ù„Ø­Ù„Ù‚Ø© ${index + 1}`),
            description: lesson.description || "",
            video_url: lesson.video_url || "",
            order: lesson.order || index + 1,
            duration_minutes: Number(lesson.duration_minutes || 0),
            is_completed: Boolean(lesson.is_completed),
          }))
        : [
            {
              id: course.id * 100 + 1,
              title: isEn ? "Course Overview" : "Ù†Ø¸Ø±Ø© Ø¹Ø§Ù…Ø© Ø¹Ù„Ù‰ Ø§Ù„ÙƒÙˆØ±Ø³",
              description:
                course.description ||
                (isEn
                  ? "Static preview content for this course."
                  : "Ù…Ø­ØªÙˆÙ‰ Ù…Ø¹Ø§ÙŠÙ†Ø© Ø³ØªØ§ØªÙŠÙƒ Ù„Ù‡Ø°Ø§ Ø§Ù„ÙƒÙˆØ±Ø³."),
              video_url: "",
              order: 1,
              duration_minutes: 15,
              is_completed: false,
            },
          ];

    return {
      ...course,
      description:
        course.description ||
        (isEn
          ? "Professional geospatial training course."
          : "ÙƒÙˆØ±Ø³ Ø§Ø­ØªØ±Ø§ÙÙŠ ÙÙŠ Ø§Ù„Ù…Ø¬Ø§Ù„ Ø§Ù„Ø¬ÙŠÙˆÙ…ÙƒØ§Ù†ÙŠ."),
      progress: Number(course.progress || 0),
      lessons: safeLessons,
      resources: Array.isArray(course.resources) ? course.resources : [],
    };
  };

  const calculateProgressFromLessons = (course: any) => {
    const lessons = Array.isArray(course?.lessons) ? course.lessons : [];
    if (lessons.length === 0) return 0;
    const completedCount = lessons.filter((lesson: any) => lesson.is_completed).length;
    return Math.round((completedCount / lessons.length) * 100);
  };

  // Load enrolled courses with lessons or static preview course
  useEffect(() => {
    setIsInitialLoading(true);

    if (selectedCourse && isStaticCourse(selectedCourse)) {
      const previewCourse = normalizePreviewCourse(selectedCourse);
      setIsStaticPreview(true);
      setCourses([previewCourse]);
      setActiveCourse(previewCourse);
      setActiveLesson(previewCourse.lessons?.[0] || null);
      setCourseTasks([]);
      setIsInitialLoading(false);
      return;
    }

    setIsStaticPreview(false);
    api.courses
      .getDashboard()
      .then((dash) => {
        const activeCourses = Array.isArray(dash?.active_courses)
          ? dash.active_courses
          : [];

        if (activeCourses.length > 0) {
          setCourses(activeCourses);
          // If a specific course is selected from Marketplace, use it
          if (selectedCourse) {
            const courseInDashboard = activeCourses.find(
              (c: any) => c.id === selectedCourse.id
            );
            if (courseInDashboard) {
              setActiveCourse(courseInDashboard);
              setActiveLesson(courseInDashboard.lessons?.[0] || null);
              loadCourseTasks(courseInDashboard.id);
            } else {
              // Fallback if not found
              setActiveCourse(activeCourses[0]);
              setActiveLesson(activeCourses[0].lessons?.[0] || null);
              loadCourseTasks(activeCourses[0].id);
            }
          } else {
            // Set first course as active
            setActiveCourse(activeCourses[0]);
            setActiveLesson(activeCourses[0].lessons?.[0] || null);
            loadCourseTasks(activeCourses[0].id);
          }
        } else {
          setCourses([]);
          setActiveCourse(null);
          setActiveLesson(null);
          setCourseTasks([]);
        }
      })
      .catch((error) => {
        console.error("Failed to load classroom:", error);
        setCourses([]);
        setActiveCourse(null);
        setActiveLesson(null);
        setCourseTasks([]);
      })
      .finally(() => {
        setIsInitialLoading(false);
      });
  }, [selectedCourse, isEn]);

  // Load tasks for the active course
  const loadCourseTasks = async (courseId: number) => {
    setTasksLoading(true);
    try {
      const res = await api.courses.listTasks({ course: courseId });
      // Handle both paginated and non-paginated responses
      const tasks = Array.isArray(res) ? res : res.results || [];
      setCourseTasks(tasks);
    } catch (error) {
      console.error("Failed to load tasks:", error);
    } finally {
      setTasksLoading(false);
    }
  };

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [aiChat]);

  const handleAiAsk = async () => {
    if (!aiQuestion.trim() || isAiLoading) return;
    const q = aiQuestion;
    setAiQuestion("");
    setAiChat((prev) => [...prev, { role: "user", text: q }]);
    setIsAiLoading(true);

    const ans = await geminiService.askTutor(
      activeLesson?.title || activeCourse?.title || "",
      q
    );
    setAiChat((prev) => [...prev, { role: "bot", text: ans || "Error" }]);
    setIsAiLoading(false);
  };

  // Mark lesson as complete and update progress
  const handleMarkLessonComplete = async () => {
    if (!activeLesson || !activeCourse) return;

    setIsMarkingComplete(true);
    try {
      if (isStaticPreview) {
        const updatedLessons = activeCourse.lessons.map((lesson: any) =>
          lesson.id === activeLesson.id
            ? { ...lesson, is_completed: true }
            : lesson
        );
        const completedLessons = updatedLessons.filter(
          (lesson: any) => lesson.is_completed
        ).length;
        const updatedCourse = {
          ...activeCourse,
          lessons: updatedLessons,
          completed_lessons: completedLessons,
          total_lessons: updatedLessons.length,
          progress: calculateProgressFromLessons({ lessons: updatedLessons }),
        };
        setActiveCourse(updatedCourse);
        setActiveLesson(
          updatedCourse.lessons.find((lesson: any) => lesson.id === activeLesson.id) ||
            activeLesson
        );
        setCourses((prevCourses) =>
          prevCourses.map((course) =>
            course.id === updatedCourse.id ? updatedCourse : course
          )
        );
        onProgressChange?.();
        return;
      }

      // Update progress in backend
      await api.progress.update({
        lesson: activeLesson.id,
        is_completed: true,
        progress_percent: 100,
      });

      // Update local state - mark lesson as complete
      const updatedLessons = activeCourse.lessons.map((l: any) =>
        l.id === activeLesson.id ? { ...l, is_completed: true } : l
      );
      const completedLessons = updatedLessons.filter((l: any) => l.is_completed).length;
      const updatedCourse = {
        ...activeCourse,
        lessons: updatedLessons,
        completed_lessons: completedLessons,
        total_lessons: updatedLessons.length,
        progress: calculateProgressFromLessons({ lessons: updatedLessons }),
      };
      setActiveCourse(updatedCourse);

      // Update courses list
      setCourses(
        courses.map((c) => (c.id === activeCourse.id ? updatedCourse : c))
      );
      onProgressChange?.();

      // Show success message
      const successMsg = isEn
        ? "Lesson marked as complete! ðŸŽ‰"
        : "ØªÙ… ØªØ¹Ù„ÙŠÙ… Ø§Ù„Ø¯Ø±Ø³ ÙƒÙ…ÙƒØªÙ…Ù„! ðŸŽ‰";
      alert(successMsg);
    } catch (error) {
      console.error("Failed to mark lesson complete:", error);
      const errorMsg = isEn
        ? "Failed to mark lesson complete"
        : "ÙØ´Ù„ ØªØ¹Ù„ÙŠÙ… Ø§Ù„Ø¯Ø±Ø³ ÙƒÙ…ÙƒØªÙ…Ù„";
      alert(errorMsg);
    } finally {
      setIsMarkingComplete(false);
    }
  };

  // Handle course change
  const handleCourseChange = (course: any) => {
    setActiveCourse(course);
    setActiveLesson(course.lessons?.[0] || null);
    setShowCourseDropdown(false);
    if (isStaticCourse(course)) {
      setCourseTasks([]);
      return;
    }
    loadCourseTasks(course.id);
  };

  const handleSubmitTask = async () => {
    if (isStaticPreview) {
      alert(
        isEn
          ? "Task submission is disabled in static preview mode."
          : "ØªÙ‚Ø¯ÙŠÙ… Ø§Ù„Ù…Ù‡Ø§Ù… ØºÙŠØ± Ù…ØªØ§Ø­ ÙÙŠ ÙˆØ¶Ø¹ Ø§Ù„Ù…Ø¹Ø§ÙŠÙ†Ø© Ø§Ù„Ø³ØªØ§ØªÙŠÙƒ."
      );
      return;
    }

    if (!selectedTask || !submissionFile) {
      alert(isEn ? "Please select a task and file" : "ÙŠØ±Ø¬Ù‰ ØªØ­Ø¯ÙŠØ¯ Ù…Ù‡Ù…Ø© ÙˆÙ…Ù„Ù");
      return;
    }

    setSubmittingTask(true);
    try {
      const res = await api.courses.submitTask({
        task: selectedTask.id,
        submission_file: submissionFile,
      });
      alert(isEn ? "Task submitted successfully!" : "ØªÙ… ØªÙ‚Ø¯ÙŠÙ… Ø§Ù„Ù…Ù‡Ù…Ø© Ø¨Ù†Ø¬Ø§Ø­!");
      setSelectedTask(null);
      setSubmissionFile(null);
      // Reload tasks
      if (activeCourse) {
        loadCourseTasks(activeCourse.id);
      }
    } catch (error) {
      console.error("Failed to submit task:", error);
      alert(isEn ? "Failed to submit task" : "ÙØ´Ù„ ØªÙ‚Ø¯ÙŠÙ… Ø§Ù„Ù…Ù‡Ù…Ø©");
    } finally {
      setSubmittingTask(false);
    }
  };

  if (isInitialLoading) {
    return (
      <div className="pt-40 text-center">
        {isEn ? "Loading Classroom..." : "Ø¬Ø§Ø±ÙŠ ØªØ­Ù…ÙŠÙ„ Ø§Ù„Ù‚Ø§Ø¹Ø© Ø§Ù„ØªØ¹Ù„ÙŠÙ…ÙŠØ©..."}
      </div>
    );
  }

  if (!activeCourse) {
    return (
      <div className="pt-28 sm:pt-36 px-4 max-w-3xl mx-auto text-center">
        <Card className="!p-8 border border-slate-200 dark:border-white/10">
          <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-3">
            {isEn ? "No courses available yet" : "Ù„Ø§ ÙŠÙˆØ¬Ø¯ ÙƒÙˆØ±Ø³Ø§Øª Ù…ØªØ§Ø­Ø© Ø­Ø§Ù„ÙŠØ§"}
          </h2>
          <p className="text-slate-600 dark:text-slate-400 mb-6">
            {isEn
              ? "After the instructor approves your payment, purchased courses will appear here."
              : "Ø¨Ø¹Ø¯ Ù…Ø§ Ø§Ù„Ù…Ø¯Ø±Ø³ ÙŠØ¤ÙƒØ¯ Ø§Ù„Ø¯ÙØ¹ØŒ Ø§Ù„ÙƒÙˆØ±Ø³Ø§Øª Ø§Ù„Ù„ÙŠ Ø§Ø´ØªØ±ÙŠØªÙ‡Ø§ Ù‡ØªØ¸Ù‡Ø± Ù‡Ù†Ø§ ØªÙ„Ù‚Ø§Ø¦ÙŠØ§."}
          </p>
          <Button onClick={handleBack}>
            {isEn ? "Back" : "Ø±Ø¬ÙˆØ¹"}
          </Button>
        </Card>
      </div>
    );
  }

  const totalLessons = activeCourse?.lessons?.length || 0;
  const completedLessons =
    activeCourse?.lessons?.filter((l: any) => l.is_completed).length || 0;
  const totalDurationMinutes = activeCourse?.lessons?.reduce(
    (sum: number, l: any) => sum + (l.duration_minutes || 0),
    0
  );
  const totalHours = Math.floor(totalDurationMinutes / 60);
  const totalMinutes = totalDurationMinutes % 60;
  const courseRatingRaw = Number(
    (activeCourse as any)?.rating_value ??
      (activeCourse as any)?.rating ??
      activeCourse?.rating ??
      0
  );
  const courseRating =
    Number.isFinite(courseRatingRaw) && courseRatingRaw > 0
      ? Math.min(5, courseRatingRaw)
      : 0;
  const courseRatingLabel = courseRating > 0 ? `${courseRating.toFixed(1)} / 5` : "N/A";
  const courseInstructor =
    (activeCourse as any)?.instructor_name ||
    (isEn ? "Geo Top Company" : "Ø´Ø±ÙƒØ© Geo Top");
  const courseLevel =
    (activeCourse as any)?.level_label ||
    (isEn ? "Professional Track" : "Ù…Ø³Ø§Ø± Ø§Ø­ØªØ±Ø§ÙÙŠ");
  const courseLanguage =
    (activeCourse as any)?.course_language ||
    (isEn ? "Arabic / English" : "Ø§Ù„Ø¹Ø±Ø¨ÙŠØ© / Ø§Ù„Ø¥Ù†Ø¬Ù„ÙŠØ²ÙŠØ©");
  const enrolledStudents = Math.max(
    0,
    Number((activeCourse as any)?.enrolled_students ?? activeCourse?.students_count ?? 0)
  );
  const normalizeListItem = (value: unknown): string =>
    String(value ?? "")
      .replace(/^(?:\u00E2\u20AC\u00A2|•|&bull;|&#8226;)\s*/i, "")
      .replace(/^[-*]\s*/, "")
      .trim();
  const requirements = Array.isArray((activeCourse as any)?.requirements)
    ? (activeCourse as any).requirements
        .map(normalizeListItem)
        .filter((item: string) => item.length > 0)
    : isEn
    ? ["Basic computer usage", "Willingness to practice", "Internet access"]
    : ["Ø§Ø³Ø§Ø³ÙŠØ§Øª Ø§Ù„ÙƒÙ…Ø¨ÙŠÙˆØªØ±", "Ø§Ù„ØªØ·Ø¨ÙŠÙ‚ Ø§Ù„Ø¹Ù…Ù„ÙŠ", "Ø§ØªØµØ§Ù„ Ø¥Ù†ØªØ±Ù†Øª"];
  const outcomes = Array.isArray((activeCourse as any)?.outcomes)
    ? (activeCourse as any).outcomes
        .map(normalizeListItem)
        .filter((item: string) => item.length > 0)
    : isEn
    ? [
        "Understand full workflow for this specialization",
        "Implement practical exercises and projects",
        "Deliver professional geospatial outputs",
      ]
    : [
        "ÙÙ‡Ù… Ù…Ø³Ø§Ø± Ø§Ù„Ø¹Ù…Ù„ Ø§Ù„ÙƒØ§Ù…Ù„ Ù„Ù„ØªØ®ØµØµ",
        "ØªÙ†ÙÙŠØ° ØªØ·Ø¨ÙŠÙ‚Ø§Øª ÙˆÙ…Ø´Ø±ÙˆØ¹Ø§Øª Ø¹Ù…Ù„ÙŠØ©",
        "ØªØ³Ù„ÙŠÙ… Ù…Ø®Ø±Ø¬Ø§Øª Ø¬ÙŠÙˆÙ…ÙƒØ§Ù†ÙŠØ© Ø¨Ø§Ø­ØªØ±Ø§ÙÙŠØ©",
      ];

  const formatCoursePriceLabel = (value: unknown) => {
    const amount = Number(value || 0);
    if (amount > 0) {
      return `${amount.toFixed(2)} ${isEn ? "EGP" : "Ø¬.Ù…"}`;
    }
    return isEn ? "Not Set" : "غير محدد";
  };

  const livePriceLabel = formatCoursePriceLabel((activeCourse as any)?.price_live);
  const offlinePriceLabel = formatCoursePriceLabel((activeCourse as any)?.price_offline);
  const recordedPriceLabel = formatCoursePriceLabel(
    (activeCourse as any)?.price_recorded ?? (activeCourse as any)?.price
  );

  if (previewOnly) {
    return (
      <div
        className={`pt-24 sm:pt-28 pb-10 px-4 max-w-5xl mx-auto min-h-screen ${
          !isEn ? "rtl" : ""
        }`}
      >
        <button
          type="button"
          onClick={handleBack}
          className={`mb-4 inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white/90 px-3 py-2 text-xs font-bold uppercase tracking-widest text-slate-600 transition-all hover:border-eden-accent hover:text-eden-accent ${
            !isEn ? "flex-row-reverse" : ""
          }`}
        >
          <ArrowLeft size={14} className={!isEn ? "rotate-180" : ""} />
          <span>{isEn ? "Back" : "Ø±Ø¬ÙˆØ¹"}</span>
        </button>

        <Card className="!p-0 overflow-hidden mb-6 border border-slate-200 dark:border-white/10">
          <div className="grid md:grid-cols-3 gap-0">
            <div className="md:col-span-1 h-52 md:h-full bg-slate-100 dark:bg-slate-800">
              <img
                src={resolveImageUrl(activeCourse.thumbnail || activeCourse.thumbnail_url)}
                alt={activeCourse.title}
                className="w-full h-full object-cover"
                onError={(e) => handleImageError(e, undefined, activeCourse.title)}
              />
            </div>
            <div className="md:col-span-2 p-6">
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <span className="text-[10px] px-2 py-1 rounded-full bg-eden-accent/15 text-eden-accent font-bold uppercase tracking-wider">
                  {isEn ? "Course Info" : "Ù…Ø¹Ù„ÙˆÙ…Ø§Øª Ø§Ù„ÙƒÙˆØ±Ø³"}
                </span>
              </div>

              <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white mb-3">
                {activeCourse.title}
              </h1>
              <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed mb-5">
                {activeCourse.description}
              </p>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10">
                  <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-1">
                    {isEn ? "Lessons" : "Ø§Ù„Ø¯Ø±ÙˆØ³"}
                  </p>
                  <p className="text-lg font-black text-slate-900 dark:text-white">{totalLessons}</p>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10">
                  <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-1">
                    {isEn ? "Duration" : "Ø§Ù„Ù…Ø¯Ø©"}
                  </p>
                  <p className="text-lg font-black text-slate-900 dark:text-white">
                    {totalHours}h {totalMinutes}m
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10">
                  <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-1">
                    {isEn ? "Rating" : "Ø§Ù„ØªÙ‚ÙŠÙŠÙ…"}
                  </p>
                  <p className="text-lg font-black text-slate-900 dark:text-white">
                    {courseRatingLabel}
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10">
                  <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-1">
                    {isEn ? "Students" : "Ø§Ù„Ø·Ù„Ø§Ø¨"}
                  </p>
                  <p className="text-lg font-black text-slate-900 dark:text-white">{enrolledStudents}</p>
                </div>
              </div>

              <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div className="p-3 rounded-xl bg-amber-50 border border-amber-200">
                  <p className="text-[10px] uppercase tracking-widest text-amber-700 font-bold">
                    {isEn ? "Live Price" : "سعر اللايف"}
                  </p>
                  <p className="mt-1 text-sm font-black text-amber-900">{livePriceLabel}</p>
                </div>
                <div className="p-3 rounded-xl bg-blue-50 border border-blue-200">
                  <p className="text-[10px] uppercase tracking-widest text-blue-700 font-bold">
                    {isEn ? "Offline Price" : "سعر الأوفلاين"}
                  </p>
                  <p className="mt-1 text-sm font-black text-blue-900">{offlinePriceLabel}</p>
                </div>
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200">
                  <p className="text-[10px] uppercase tracking-widest text-emerald-700 font-bold">
                    {isEn ? "Recorded Price" : "سعر المسجلة"}
                  </p>
                  <p className="mt-1 text-sm font-black text-emerald-900">{recordedPriceLabel}</p>
                </div>
              </div>
            </div>
          </div>
        </Card>

        <Card className="!p-6 mb-6 border border-slate-200 dark:border-white/10">
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-black text-slate-900 dark:text-white mb-3">
                {isEn ? "What You Will Learn" : "Ù…Ø§Ø°Ø§ Ø³ØªØªØ¹Ù„Ù…"}
              </h3>
                <div className="space-y-2">
                  {outcomes.map((item: string, index: number) => (
                    <p
                      key={`${item}-${index}`}
                      className={`text-sm text-slate-700 dark:text-slate-300 flex items-start gap-2 ${
                        !isEn ? "flex-row-reverse" : ""
                      }`}
                    >
                      <span className="text-eden-accent leading-none mt-[2px]">•</span>
                      <span>{item}</span>
                    </p>
                  ))}
                </div>
              </div>
            <div>
              <h3 className="text-lg font-black text-slate-900 dark:text-white mb-3">
                {isEn ? "Requirements" : "Ø§Ù„Ù…ØªØ·Ù„Ø¨Ø§Øª"}
              </h3>
                <div className="space-y-2">
                  {requirements.map((item: string, index: number) => (
                    <p
                      key={`${item}-${index}`}
                      className={`text-sm text-slate-700 dark:text-slate-300 flex items-start gap-2 ${
                        !isEn ? "flex-row-reverse" : ""
                      }`}
                    >
                      <span className="text-eden-accent leading-none mt-[2px]">•</span>
                      <span>{item}</span>
                    </p>
                  ))}
                </div>
              </div>
          </div>
        </Card>

        <Card className="!p-6 border border-slate-200 dark:border-white/10">
          <div className={`flex flex-col gap-4 ${!isEn ? "text-right" : "text-left"}`}>
            <h3 className="text-xl font-black text-slate-900 dark:text-white">
              {isEn ? "Ready to buy this course?" : "Ø¬Ø§Ù‡Ø² ØªØ´ØªØ±ÙŠ Ø§Ù„ÙƒÙˆØ±Ø³ØŸ"}
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              {isEn
                ? "Register in the platform first, then complete your purchase from inside your account."
                : "Ø³Ø¬Ù‘Ù„ ÙÙŠ Ø§Ù„Ù…Ù†ØµØ© Ø£ÙˆÙ„Ù‹Ø§ØŒ ÙˆØ¨Ø¹Ø¯Ù‡Ø§ Ù‡ØªÙ‚Ø¯Ø± ØªØ´ØªØ±ÙŠ Ø§Ù„ÙƒÙˆØ±Ø³ Ù…Ù† Ø¯Ø§Ø®Ù„ Ø­Ø³Ø§Ø¨Ùƒ."}
            </p>
            <div className={`flex ${!isEn ? "justify-end" : "justify-start"}`}>
              <Button
                onClick={() => {
                  if (onJoinPlatform) onJoinPlatform();
                }}
                className="!h-12 !px-8"
              >
                {isEn ? "Register In Platform" : "Ø§Ù„ØªØ³Ø¬ÙŠÙ„ ÙÙŠ Ø§Ù„Ù…Ù†ØµØ©"}
                <ArrowRight size={18} className={`${!isEn ? "rotate-180 mr-2" : "ml-2"}`} />
              </Button>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div
      className={`pt-24 sm:pt-28 pb-10 px-4 max-w-7xl mx-auto min-h-screen flex flex-col lg:flex-row gap-6 ${
        !isEn ? "rtl" : ""
      }`}
    >
      <div className="flex-1 min-w-0">
        <button
          type="button"
          onClick={handleBack}
          className={`mb-4 inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white/90 px-3 py-2 text-xs font-bold uppercase tracking-widest text-slate-600 transition-all hover:border-eden-accent hover:text-eden-accent ${
            !isEn ? "flex-row-reverse" : ""
          }`}
        >
          <ArrowLeft size={14} className={!isEn ? "rotate-180" : ""} />
          <span>{isEn ? "Back" : "Ø±Ø¬ÙˆØ¹"}</span>
        </button>

        <Card className="!p-0 overflow-hidden mb-6 border border-slate-200 dark:border-white/10">
          <div className="grid md:grid-cols-3 gap-0">
            <div className="md:col-span-1 h-52 md:h-full bg-slate-100 dark:bg-slate-800">
              <img
                src={resolveImageUrl(activeCourse.thumbnail || activeCourse.thumbnail_url)}
                alt={activeCourse.title}
                className="w-full h-full object-cover"
                onError={(e) => handleImageError(e, undefined, activeCourse.title)}
              />
            </div>
            <div className="md:col-span-2 p-6">
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <span className="text-[10px] px-2 py-1 rounded-full bg-eden-accent/15 text-eden-accent font-bold uppercase tracking-wider">
                  {isEn ? "Course" : "ÙƒÙˆØ±Ø³"}
                </span>
                <span className="text-[10px] px-2 py-1 rounded-full bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300 font-bold uppercase tracking-wider">
                  {activeCourse.progress || 0}% {isEn ? "Progress" : "ØªÙ‚Ø¯Ù…"}
                </span>
              </div>

              <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white mb-3">
                {activeCourse.title}
              </h1>
              <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed mb-5">
                {activeCourse.description}
              </p>

              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10">
                  <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-1">
                    {isEn ? "Lessons" : "Ø§Ù„Ø¯Ø±ÙˆØ³"}
                  </p>
                  <p className="text-lg font-black text-slate-900 dark:text-white">{totalLessons}</p>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10">
                  <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-1">
                    {isEn ? "Completed" : "Ø§Ù„Ù…ÙƒØªÙ…Ù„"}
                  </p>
                  <p className="text-lg font-black text-slate-900 dark:text-white">{completedLessons}</p>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10">
                  <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-1">
                    {isEn ? "Duration" : "Ø§Ù„Ù…Ø¯Ø©"}
                  </p>
                  <p className="text-lg font-black text-slate-900 dark:text-white">
                    {totalHours}h {totalMinutes}m
                  </p>
                </div>
              </div>

              <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div className="p-3 rounded-xl bg-amber-50 border border-amber-200">
                  <p className="text-[10px] uppercase tracking-widest text-amber-700 font-bold">
                    {isEn ? "Live Price" : "سعر اللايف"}
                  </p>
                  <p className="mt-1 text-sm font-black text-amber-900">{livePriceLabel}</p>
                </div>
                <div className="p-3 rounded-xl bg-blue-50 border border-blue-200">
                  <p className="text-[10px] uppercase tracking-widest text-blue-700 font-bold">
                    {isEn ? "Offline Price" : "سعر الأوفلاين"}
                  </p>
                  <p className="mt-1 text-sm font-black text-blue-900">{offlinePriceLabel}</p>
                </div>
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200">
                  <p className="text-[10px] uppercase tracking-widest text-emerald-700 font-bold">
                    {isEn ? "Recorded Price" : "سعر المسجلة"}
                  </p>
                  <p className="mt-1 text-sm font-black text-emerald-900">{recordedPriceLabel}</p>
                </div>
              </div>
            </div>
          </div>
        </Card>

        <Card className="!p-6 mb-6 border border-slate-200 dark:border-white/10">
          <div className="grid lg:grid-cols-12 gap-6">
            <div className="lg:col-span-8">
              <h2 className="text-xl font-black text-slate-900 dark:text-white mb-3">
                {isEn ? "Course Overview" : "Ù†Ø¸Ø±Ø© Ø¹Ø§Ù…Ø© Ø¹Ù„Ù‰ Ø§Ù„ÙƒÙˆØ±Ø³"}
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed mb-4">
                {activeCourse.description}
              </p>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10">
                  <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-1">
                    {isEn ? "Rating" : "Ø§Ù„ØªÙ‚ÙŠÙŠÙ…"}
                  </p>
                  <p className="text-base font-black text-slate-900 dark:text-white">
                    {courseRatingLabel}
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10">
                  <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-1">
                    {isEn ? "Instructor" : "Ø§Ù„Ù…Ø­Ø§Ø¶Ø±"}
                  </p>
                  <p className="text-base font-black text-slate-900 dark:text-white truncate">
                    {courseInstructor}
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10">
                  <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-1">
                    {isEn ? "Level" : "Ø§Ù„Ù…Ø³ØªÙˆÙ‰"}
                  </p>
                  <p className="text-base font-black text-slate-900 dark:text-white truncate">
                    {courseLevel}
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10">
                  <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-1">
                    {isEn ? "Language" : "Ø§Ù„Ù„ØºØ©"}
                  </p>
                  <p className="text-base font-black text-slate-900 dark:text-white truncate">
                    {courseLanguage}
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10">
                  <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-1">
                    {isEn ? "Students" : "Ø§Ù„Ø·Ù„Ø§Ø¨"}
                  </p>
                  <p className="text-base font-black text-slate-900 dark:text-white">
                    {enrolledStudents}
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10">
                  <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-1">
                    {isEn ? "Mode" : "Ø§Ù„ÙˆØ¶Ø¹"}
                  </p>
                  <p className="text-base font-black text-slate-900 dark:text-white">
                    {isStaticPreview
                      ? isEn
                        ? "Static Preview"
                        : "Ù…Ø¹Ø§ÙŠÙ†Ø© Ø³ØªØ§ØªÙŠÙƒ"
                      : isEn
                      ? "Live Course"
                      : "ÙƒÙˆØ±Ø³ Ø­ÙŠ"}
                  </p>
                </div>
              </div>
            </div>

            <div className="lg:col-span-4 space-y-4">
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10">
                <h3 className="text-xs font-black tracking-widest uppercase text-slate-500 mb-2">
                  {isEn ? "What You Will Learn" : "Ù…Ø§ Ø§Ù„Ø°ÙŠ Ø³ØªØªØ¹Ù„Ù…Ù‡"}
                </h3>
                <div className="space-y-2">
                  {outcomes.slice(0, 3).map((item: string, index: number) => (
                    <p
                      key={`${item}-${index}`}
                      className={`text-sm text-slate-700 dark:text-slate-300 flex items-start gap-2 ${
                        !isEn ? "flex-row-reverse" : ""
                      }`}
                    >
                      <span className="text-eden-accent leading-none mt-[2px]">•</span>
                      <span>{item}</span>
                    </p>
                  ))}
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10">
                <h3 className="text-xs font-black tracking-widest uppercase text-slate-500 mb-2">
                  {isEn ? "Requirements" : "Ø§Ù„Ù…ØªØ·Ù„Ø¨Ø§Øª"}
                </h3>
                <div className="space-y-2">
                  {requirements.slice(0, 3).map((item: string, index: number) => (
                    <p
                      key={`${item}-${index}`}
                      className={`text-sm text-slate-700 dark:text-slate-300 flex items-start gap-2 ${
                        !isEn ? "flex-row-reverse" : ""
                      }`}
                    >
                      <span className="text-eden-accent leading-none mt-[2px]">•</span>
                      <span>{item}</span>
                    </p>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Course Selector */}
        <div className="mb-6 relative">
          <button
            onClick={() => setShowCourseDropdown(!showCourseDropdown)}
            className="w-full flex items-center justify-between bg-slate-900 dark:bg-white/5 border border-slate-700 dark:border-white/10 rounded-lg px-4 py-3 text-left text-slate-200 dark:text-white hover:bg-slate-800 transition-colors"
          >
            <span className="font-medium truncate">{activeCourse?.title}</span>
            <ChevronDown
              size={18}
              className={`transition-transform ${
                showCourseDropdown ? "rotate-180" : ""
              }`}
            />
          </button>

          {showCourseDropdown && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-slate-900 dark:bg-slate-800 border border-slate-700 dark:border-white/10 rounded-lg overflow-hidden shadow-lg z-50">
              {courses.map((course) => (
                <button
                  key={course.id}
                  onClick={() => handleCourseChange(course)}
                  className="w-full px-4 py-3 text-left hover:bg-slate-800 dark:hover:bg-white/10 transition-colors border-b border-slate-700 dark:border-white/5 last:border-b-0 flex items-center justify-between"
                >
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-slate-200 dark:text-white truncate">
                      {course.title}
                    </div>
                    <div className="text-xs text-slate-500 mt-1 flex items-center gap-2">
                      <span>
                        {course.completed_lessons}/{course.total_lessons}{" "}
                        {isEn ? "lessons" : "Ø¯Ø±ÙˆØ³"}
                      </span>
                      {course.total_duration_minutes && (
                        <>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <Clock size={12} />
                            {Math.floor(
                              course.total_duration_minutes / 60
                            )}h {course.total_duration_minutes % 60}m
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="ml-4 text-sm font-bold text-cyan-400">
                    {course.progress}%
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="w-full mb-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
              {isEn ? "Video Lesson" : "Ø¯Ø±Ø³ Ø§Ù„ÙÙŠØ¯ÙŠÙˆ"}
            </h3>
            {activeLesson?.video_url && (
              <button
                onClick={handleDownloadVideo}
                className="flex items-center gap-2 px-3 py-2 bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 rounded-lg transition-colors text-sm font-medium"
              >
                <Download size={16} />
                {isEn ? "Download" : "ØªØ­Ù…ÙŠÙ„"}
              </button>
            )}
          </div>
          <div className="w-full aspect-video bg-black rounded-2xl overflow-hidden shadow-2xl relative border border-slate-800">
            {activeLesson?.video_url ? (
              <video
                src={getFullVideoUrl(activeLesson.video_url)}
                className="w-full h-full object-contain"
                controls
                key={activeLesson.id}
              >
                Your browser does not support the video tag.
              </video>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-500">
                {isEn ? "Select a Lesson" : "Ø§Ø®ØªØ± Ø¯Ø±Ø³Ù‹Ø§"}
              </div>
            )}
          </div>
        </div>

        <Card className="!p-6">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                {activeLesson?.title || activeCourse.title}
              </h1>
              {activeLesson && activeLesson.duration_minutes && (
                <div className="flex items-center gap-3 mb-3 text-sm text-slate-500 dark:text-slate-400">
                  <Clock size={16} className="text-cyan-500" />
                  <span className="font-semibold">
                    {activeLesson.duration_minutes} {isEn ? "minutes" : "Ø¯Ù‚ÙŠÙ‚Ø©"}
                  </span>
                </div>
              )}
              <p className="text-slate-500 dark:text-slate-400 text-sm">
                {activeLesson?.description || activeCourse.description}
              </p>
            </div>
            {activeLesson && (
              <button
                onClick={handleMarkLessonComplete}
                disabled={isMarkingComplete || activeLesson.is_completed}
                className={`shrink-0 px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                  activeLesson.is_completed
                    ? "bg-emerald-500/20 text-emerald-400 cursor-default"
                    : "bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                }`}
              >
                {activeLesson.is_completed ? (
                  <span className="flex items-center gap-2">
                    <CheckCircle size={16} /> {isEn ? "Completed" : "Ù…ÙƒØªÙ…Ù„"}
                  </span>
                ) : (
                  <span>
                    {isMarkingComplete
                      ? isEn
                        ? "Saving..."
                        : "Ø¬Ø§Ø±ÙŠ Ø§Ù„Ø­ÙØ¸..."
                      : isEn
                      ? "Mark Complete"
                      : "ØªØ¹Ù„ÙŠÙ… ÙƒÙ…ÙƒØªÙ…Ù„"}
                  </span>
                )}
              </button>
            )}
          </div>
        </Card>
      </div>

      <div
        className={`lg:w-96 shrink-0 ${
          sidebarOpen ? "block" : "hidden"
        } lg:block`}
      >
        <Card className="h-[600px] !p-0 overflow-hidden flex flex-col sticky top-28 shadow-xl border-2 border-primary/10">
          <div className="border-b border-slate-200 dark:border-white/10 shrink-0 bg-slate-50 dark:bg-black/20 grid grid-cols-4 gap-0">
            <button
              onClick={() => setTab("lessons")}
              className={`py-4 text-[10px] font-bold flex flex-col items-center gap-1 ${
                tab === "lessons"
                  ? "text-primary border-b-2 border-primary"
                  : "text-slate-500"
              }`}
            >
              <Video size={16} /> {isEn ? "Lessons" : "Ø§Ù„Ø¯Ø±ÙˆØ³"}
            </button>
            <button
              onClick={() => setTab("resources")}
              className={`py-4 text-[10px] font-bold flex flex-col items-center gap-1 ${
                tab === "resources"
                  ? "text-primary border-b-2 border-primary"
                  : "text-slate-500"
              }`}
            >
              <FileText size={16} /> {isEn ? "Resources" : "Ø§Ù„Ù…ÙˆØ§Ø±Ø¯"}
            </button>
            <button
              onClick={() => setTab("ai")}
              className={`py-4 text-[10px] font-bold flex flex-col items-center gap-1 ${
                tab === "ai"
                  ? "text-primary border-b-2 border-primary"
                  : "text-slate-500"
              }`}
            >
              <BrainCircuit size={16} /> {isEn ? "AI Tutor" : "Ø§Ù„Ù…Ø¹Ù„Ù… Ø§Ù„Ø°ÙƒÙŠ"}
            </button>
            <button
              onClick={() => setTab("assignments")}
              className={`py-4 text-[10px] font-bold flex flex-col items-center gap-1 ${
                tab === "assignments"
                  ? "text-primary border-b-2 border-primary"
                  : "text-slate-500"
              }`}
            >
              <FileText size={16} /> {isEn ? "Tasks" : "Ø§Ù„Ù…Ù‡Ø§Ù…"}
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
            {tab === "lessons" &&
              activeCourse.lessons?.map((l: any, idx: number) => (
                <div
                  key={l.id}
                  onClick={() => setActiveLesson(l)}
                  className={`p-3 rounded-xl mb-2 cursor-pointer transition-all flex items-center gap-3 ${
                    activeLesson?.id === l.id
                      ? "bg-cyan-500/20 border border-cyan-500/30 text-cyan-300"
                      : "hover:bg-slate-700/50 dark:hover:bg-white/5 text-slate-300 dark:text-slate-400 border border-transparent"
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-sm truncate flex items-center gap-2">
                      <span>{idx + 1}.</span>
                      <span>{l.title}</span>
                    </div>
                    <div className="flex items-center gap-2 text-[10px] opacity-70 mt-1">
                      {l.duration_minutes && (
                        <span className="flex items-center gap-1">
                          <Clock size={10} />
                          {l.duration_minutes} {isEn ? "min" : "Ø¯Ù‚ÙŠÙ‚Ø©"}
                        </span>
                      )}
                      {l.description && (
                        <span className="truncate">
                          {l.description.substring(0, 30)}...
                        </span>
                      )}
                    </div>
                  </div>
                  {l.is_completed && (
                    <CheckCircle
                      size={18}
                      className="text-emerald-400 shrink-0"
                    />
                  )}
                </div>
              ))}

            {tab === "resources" && (
              <div className="space-y-3">
                {activeCourse?.resources &&
                activeCourse.resources.length > 0 ? (
                  activeCourse.resources.map((resource: any) => (
                    <a
                      key={resource.id}
                      href={resource.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block p-3 rounded-xl border border-amber-500/20 bg-amber-500/5 hover:bg-amber-500/10 hover:border-amber-500/40 transition-all group"
                    >
                      <div className="flex items-start gap-3">
                        <FileText
                          size={16}
                          className="text-amber-600 dark:text-amber-400 mt-0.5 shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="font-bold text-sm text-slate-900 dark:text-white truncate group-hover:text-amber-500 transition-colors">
                            {resource.title}
                          </div>
                          <div className="text-[10px] text-slate-600 dark:text-slate-400 mt-0.5">
                            {new Date(resource.created_at).toLocaleDateString()}
                          </div>
                        </div>
                        <Download
                          size={14}
                          className="text-amber-600 dark:text-amber-400 group-hover:scale-110 transition-transform shrink-0"
                        />
                      </div>
                    </a>
                  ))
                ) : (
                  <div className="py-8 text-center text-slate-500 text-sm">
                    {isEn
                      ? "No resources yet for this course"
                      : "Ù„Ø§ ØªÙˆØ¬Ø¯ Ù…ÙˆØ§Ø±Ø¯ Ù„Ù‡Ø°Ø§ Ø§Ù„ÙƒÙˆØ±Ø³ Ø¨Ø¹Ø¯"}
                  </div>
                )}
              </div>
            )}

            {tab === "ai" && (
              <div className="flex flex-col h-full">
                <div className="flex-1 space-y-4 mb-4">
                  <div className="bg-primary/10 p-3 rounded-2xl text-xs text-primary font-bold">
                    {isEn
                      ? "Hello! Ask me anything about this lesson."
                      : "Ø£Ù‡Ù„Ø§Ù‹! Ø§Ø³Ø£Ù„Ù†ÙŠ Ø¹Ù† Ø£ÙŠ Ø´ÙŠØ¡ ÙÙŠ Ù‡Ø°Ø§ Ø§Ù„Ø¯Ø±Ø³."}
                  </div>
                  {aiChat.map((m, i) => (
                    <div
                      key={i}
                      className={`p-3 rounded-2xl text-xs ${
                        m.role === "user"
                          ? "bg-slate-100 dark:bg-white/5 ml-8 text-right"
                          : "bg-primary/10 mr-8 text-primary font-medium"
                      }`}
                    >
                      {m.text}
                    </div>
                  ))}
                  {isAiLoading && (
                    <div className="text-[10px] text-primary animate-pulse">
                      {isEn ? "Thinking..." : "Ø¬Ø§Ø±ÙŠ Ø§Ù„ØªÙÙƒÙŠØ±..."}
                    </div>
                  )}
                  <div ref={chatEndRef} />
                </div>
                <div className="flex gap-2">
                  <input
                    value={aiQuestion}
                    onChange={(e) => setAiQuestion(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleAiAsk()}
                    className="flex-1 bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2 text-xs"
                    placeholder={isEn ? "Ask AI..." : "Ø§Ø³Ø£Ù„ Ø§Ù„Ø°ÙƒØ§Ø¡..."}
                  />
                  <button
                    onClick={handleAiAsk}
                    className="p-2 bg-primary text-white rounded-xl shadow-lg shadow-primary/20"
                  >
                    <Send size={16} />
                  </button>
                </div>
              </div>
            )}

            {tab === "assignments" && (
              <div className="space-y-4">
                {tasksLoading ? (
                  <div className="text-center py-6">
                    <p className="text-xs text-slate-500">
                      {isEn ? "Loading tasks..." : "Ø¬Ø§Ø±ÙŠ ØªØ­Ù…ÙŠÙ„ Ø§Ù„Ù…Ù‡Ø§Ù…..."}
                    </p>
                  </div>
                ) : courseTasks.length === 0 ? (
                  <div className="text-center py-6">
                    <p className="text-xs text-slate-500">
                      {isEn
                        ? "No tasks for this course"
                        : "Ù„Ø§ ØªÙˆØ¬Ø¯ Ù…Ù‡Ø§Ù… Ù„Ù‡Ø°Ø§ Ø§Ù„ÙƒÙˆØ±Ø³"}
                    </p>
                  </div>
                ) : (
                  courseTasks.map((task) => (
                    <div
                      key={task.id}
                      className={`p-4 rounded-xl border transition-all cursor-pointer ${
                        selectedTask?.id === task.id
                          ? "bg-primary/10 border-primary/30"
                          : "bg-slate-700/30 dark:bg-white/5 border-slate-600 dark:border-white/10 hover:border-primary/30"
                      }`}
                      onClick={() => setSelectedTask(task)}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-bold text-sm text-slate-100">
                          {task.title}
                        </h4>
                        <span
                          className={`text-[9px] font-bold px-2 py-1 rounded ${
                            task.priority === "critical"
                              ? "bg-red-500/20 text-red-400"
                              : task.priority === "high"
                              ? "bg-orange-500/20 text-orange-400"
                              : "bg-blue-500/20 text-blue-400"
                          }`}
                        >
                          {task.priority.toUpperCase()}
                        </span>
                      </div>
                      {task.description && (
                        <p className="text-[10px] text-slate-400 mb-2 line-clamp-2">
                          {task.description}
                        </p>
                      )}
                      {task.due_date && (
                        <p className="text-[9px] text-slate-500">
                          {isEn ? "Due:" : "ØªØ§Ø±ÙŠØ® Ø§Ù„Ø§Ø³ØªØ­Ù‚Ø§Ù‚:"}{" "}
                          {new Date(task.due_date).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  ))
                )}

                {selectedTask && (
                   <div className="mt-4 space-y-4">
                     {/* Task File Section */}
                     {selectedTask.file_url && (
                       <div className="p-4 bg-blue-500/10 rounded-xl border border-blue-500/20">
                         <div className="flex items-center justify-between mb-2">
                           <h4 className="font-bold text-sm text-slate-100">
                             {isEn ? "Task File:" : "Ù…Ù„Ù Ø§Ù„Ù…Ù‡Ù…Ø©:"}
                           </h4>
                           <a
                             href={selectedTask.file_url}
                             target="_blank"
                             rel="noopener noreferrer"
                             className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-bold rounded-lg transition-colors"
                           >
                             <Download size={12} />
                             {isEn ? "Download/View" : "ØªØ­Ù…ÙŠÙ„/Ø¹Ø±Ø¶"}
                           </a>
                         </div>
                         <p className="text-[10px] text-slate-400">
                           {isEn
                             ? "Click to download or view the task file"
                             : "Ø§Ù†Ù‚Ø± Ù„ØªØ­Ù…ÙŠÙ„ Ø£Ùˆ Ø¹Ø±Ø¶ Ù…Ù„Ù Ø§Ù„Ù…Ù‡Ù…Ø©"}
                         </p>
                       </div>
                     )}

                     {/* Submission Section */}
                     <div className="p-4 bg-slate-700/50 dark:bg-white/5 rounded-xl border border-slate-600 dark:border-white/10">
                       <h4 className="font-bold text-sm text-slate-100 mb-3">
                         {isEn ? "Submit Your Work:" : "Ù‚Ø¯Ù… Ø¹Ù…Ù„Ùƒ:"}
                       </h4>
                       <div className="border-2 border-dashed border-slate-400 dark:border-white/20 rounded-xl p-6 text-center group cursor-pointer hover:bg-white/5 mb-3">
                         <input
                           type="file"
                           onChange={(e) => {
                             if (e.target.files && e.target.files[0]) {
                               setSubmissionFile(e.target.files[0]);
                             }
                           }}
                           className="hidden"
                           id="task-file-upload"
                         />
                         <label
                           htmlFor="task-file-upload"
                           className="flex flex-col items-center gap-2 cursor-pointer"
                         >
                           <Upload
                             size={24}
                             className="text-slate-400 group-hover:text-primary transition-colors"
                           />
                           <span className="text-[10px] font-bold text-slate-500">
                             {submissionFile
                               ? submissionFile.name
                               : isEn
                               ? "Click to upload file"
                               : "Ø§Ù†Ù‚Ø± Ù„ØªØ­Ù…ÙŠÙ„ Ø§Ù„Ù…Ù„Ù"}
                           </span>
                         </label>
                       </div>
                       <Button
                         className="w-full !py-2 text-xs shadow-neon"
                         onClick={handleSubmitTask}
                         disabled={!submissionFile || submittingTask}
                       >
                         {submittingTask
                           ? isEn
                             ? "Submitting..."
                             : "Ø¬Ø§Ø±ÙŠ Ø§Ù„ØªÙ‚Ø¯ÙŠÙ…..."
                           : isEn
                           ? "Submit Task"
                           : "ØªÙ‚Ø¯ÙŠÙ… Ø§Ù„Ù…Ù‡Ù…Ø©"}
                       </Button>
                     </div>
                   </div>
                 )}
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default CoursePlayer;


