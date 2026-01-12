import React, { useState, useEffect, useRef } from "react";
import { Course, Lang, Theme, Lesson, Assignment } from "../../types";
import { api } from "../../api/client";
import { geminiService } from "../../services/geminiService";
import { Card, Button, Input } from "../../components/UI";
import { Reveal } from "../../components/Reveal";
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
}> = ({ lang, theme, isMobile, selectedCourse }) => {
  const [courses, setCourses] = useState<any[]>([]);
  const [activeCourse, setActiveCourse] = useState<any>(null);
  const [activeLesson, setActiveLesson] = useState<any>(null);
  const [tab, setTab] = useState<
    "lessons" | "resources" | "ai" | "assignments"
  >("lessons");
  const [sidebarOpen, setSidebarOpen] = useState(!isMobile);
  const [isMarkingComplete, setIsMarkingComplete] = useState(false);
  const [showCourseDropdown, setShowCourseDropdown] = useState(false);

  // AI Chat States
  const [aiQuestion, setAiQuestion] = useState("");
  const [aiChat, setAiChat] = useState<
    { role: "user" | "bot"; text: string }[]
  >([]);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const isEn = lang === "en";

  const getFullVideoUrl = (videoUrl: string) => {
    if (!videoUrl) return "";
    if (videoUrl.startsWith("http")) return videoUrl;
    const baseUrl = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";
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
      alert(isEn ? "Failed to download video" : "فشل تحميل الفيديو");
    }
  };

  // Load enrolled courses with lessons
  useEffect(() => {
    api.courses
      .getDashboard()
      .then((dash) => {
        if (dash.active_courses && dash.active_courses.length > 0) {
          setCourses(dash.active_courses);
          // If a specific course is selected from Marketplace, use it
          if (selectedCourse) {
            const courseInDashboard = dash.active_courses.find(
              (c: any) => c.id === selectedCourse.id
            );
            if (courseInDashboard) {
              setActiveCourse(courseInDashboard);
              setActiveLesson(courseInDashboard.lessons?.[0] || null);
            } else {
              // Fallback if not found
              setActiveCourse(dash.active_courses[0]);
              setActiveLesson(dash.active_courses[0].lessons?.[0] || null);
            }
          } else {
            // Set first course as active
            setActiveCourse(dash.active_courses[0]);
            setActiveLesson(dash.active_courses[0].lessons?.[0] || null);
          }
        }
      })
      .catch(console.error);
  }, [selectedCourse]);

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
      // Update progress in backend
      await api.progress.update({
        lesson: activeLesson.id,
        is_completed: true,
        progress_percent: 100,
      });

      // Update local state - mark lesson as complete
      const updatedCourse = {
        ...activeCourse,
        lessons: activeCourse.lessons.map((l: any) =>
          l.id === activeLesson.id ? { ...l, is_completed: true } : l
        ),
      };
      setActiveCourse(updatedCourse);

      // Update courses list
      setCourses(
        courses.map((c) => (c.id === activeCourse.id ? updatedCourse : c))
      );

      // Show success message
      const successMsg = isEn
        ? "Lesson marked as complete! 🎉"
        : "تم تعليم الدرس كمكتمل! 🎉";
      alert(successMsg);
    } catch (error) {
      console.error("Failed to mark lesson complete:", error);
      const errorMsg = isEn
        ? "Failed to mark lesson complete"
        : "فشل تعليم الدرس كمكتمل";
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
  };

  if (!activeCourse)
    return <div className="pt-40 text-center">Loading Classroom...</div>;

  return (
    <div className="pt-24 sm:pt-28 pb-10 px-4 max-w-7xl mx-auto min-h-screen flex flex-col lg:flex-row gap-6">
      <div className="flex-1 min-w-0">
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
                    <div className="text-xs text-slate-500 mt-1">
                      {course.completed_lessons}/{course.total_lessons} lessons
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
              {isEn ? "Video Lesson" : "درس الفيديو"}
            </h3>
            {activeLesson?.video_url && (
              <button
                onClick={handleDownloadVideo}
                className="flex items-center gap-2 px-3 py-2 bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 rounded-lg transition-colors text-sm font-medium"
              >
                <Download size={16} />
                {isEn ? "Download" : "تحميل"}
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
                {isEn ? "Select a Lesson" : "اختر درسًا"}
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
                    <CheckCircle size={16} /> {isEn ? "Completed" : "مكتمل"}
                  </span>
                ) : (
                  <span>
                    {isMarkingComplete
                      ? isEn
                        ? "Saving..."
                        : "جاري الحفظ..."
                      : isEn
                      ? "Mark Complete"
                      : "تعليم كمكتمل"}
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
              <Video size={16} /> {isEn ? "Lessons" : "الدروس"}
            </button>
            <button
              onClick={() => setTab("resources")}
              className={`py-4 text-[10px] font-bold flex flex-col items-center gap-1 ${
                tab === "resources"
                  ? "text-primary border-b-2 border-primary"
                  : "text-slate-500"
              }`}
            >
              <FileText size={16} /> {isEn ? "Resources" : "الموارد"}
            </button>
            <button
              onClick={() => setTab("ai")}
              className={`py-4 text-[10px] font-bold flex flex-col items-center gap-1 ${
                tab === "ai"
                  ? "text-primary border-b-2 border-primary"
                  : "text-slate-500"
              }`}
            >
              <BrainCircuit size={16} /> {isEn ? "AI Tutor" : "المعلم الذكي"}
            </button>
            <button
              onClick={() => setTab("assignments")}
              className={`py-4 text-[10px] font-bold flex flex-col items-center gap-1 ${
                tab === "assignments"
                  ? "text-primary border-b-2 border-primary"
                  : "text-slate-500"
              }`}
            >
              <FileText size={16} /> {isEn ? "Tasks" : "المهام"}
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
                    <span className="text-[10px] opacity-70">
                      {l.description
                        ? l.description.substring(0, 40) + "..."
                        : ""}
                    </span>
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
                      : "لا توجد موارد لهذا الكورس بعد"}
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
                      : "أهلاً! اسألني عن أي شيء في هذا الدرس."}
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
                      {isEn ? "Thinking..." : "جاري التفكير..."}
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
                    placeholder={isEn ? "Ask AI..." : "اسأل الذكاء..."}
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
                <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                  <h4 className="font-bold text-sm text-emerald-500 mb-2">
                    Final Project Task
                  </h4>
                  <p className="text-xs text-slate-500 mb-4">
                    Build a fully responsive dashboard using Next.js and
                    Tailwind CSS.
                  </p>
                  <div className="border-2 border-dashed border-slate-300 dark:border-white/10 rounded-xl p-6 text-center group cursor-pointer hover:bg-white/5">
                    <Upload
                      size={24}
                      className="mx-auto mb-2 text-slate-400 group-hover:text-primary transition-colors"
                    />
                    <span className="text-[10px] font-bold text-slate-500">
                      {isEn ? "Upload Project (ZIP/PDF)" : "ارفع المشروع"}
                    </span>
                  </div>
                  <Button className="w-full mt-4 !py-2 text-xs shadow-neon">
                    Submit Task
                  </Button>
                </div>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default CoursePlayer;
