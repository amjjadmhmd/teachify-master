import React, { useEffect, useState } from "react";
import {
  ArrowRight,
  Award,
  BookOpen,
  CheckCircle2,
  Clock,
  Gauge,
  Play,
  Target,
  Timer,
  Trophy,
  User,
  Zap,
} from "lucide-react";
import { motion } from "framer-motion";
import { api } from "../../api/client";
import { Reveal } from "../../components/Reveal";
import { Button, Card } from "../../components/UI";
import { DashboardData, Lang, Theme, ViewMode } from "../../types";

interface DashboardProps {
  lang: Lang;
  theme: Theme;
  refreshTrigger: number;
  isMobile: boolean;
  setView?: (view: ViewMode) => void;
}

interface TaskItem {
  id: number;
  title: string;
  priority?: string;
  course_title?: string;
  due_date?: string;
}

const clampPercent = (value: number) => Math.max(0, Math.min(100, value));

const getFallbackDashboardData = (): DashboardData => ({
  progress_percent: 0,
  total_enrolled_courses: 0,
  wishlist_count: 0,
  latest_completed_lessons: [],
  active_courses: [],
  earned_certificates: [],
  past_results: [],
  my_assignments: [],
  average_quiz_score: 0,
  total_hours_studied: 0,
  total_minutes_studied: 0,
  upcoming_tasks: [],
});

const StudentDashboard: React.FC<DashboardProps> = ({
  lang,
  theme,
  refreshTrigger,
  setView,
}) => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [criticalTasks, setCriticalTasks] = useState<TaskItem[]>([]);
  const [tasksLoading, setTasksLoading] = useState(false);
  const [dashboardLoading, setDashboardLoading] = useState(true);

  const isEn = lang === "en";
  const isDark = theme === "dark";

  const panelBg = isDark
    ? "bg-gradient-to-br from-[#03162d] via-[#031022] to-[#020915]"
    : "bg-white";
  const titleText = isDark ? "text-white" : "text-slate-900";
  const subtitleText = isDark ? "text-slate-300" : "text-slate-600";
  const cardBorder = isDark ? "border-white/10" : "border-slate-200";
  const mutedBg = isDark ? "bg-white/5" : "bg-slate-50";
  const dividerColor = isDark ? "divide-white/10" : "divide-slate-200";
  const trackBg = isDark ? "bg-white/10" : "bg-slate-200";
  const emptyBorder = isDark ? "border-white/10" : "border-slate-300";

  useEffect(() => {
    let isMounted = true;

    setDashboardLoading(true);
    api.courses
      .getDashboard()
      .then((dashboardData) => {
        if (!isMounted) return;
        setData(dashboardData);
      })
      .catch((error) => {
        console.error("Failed to load student dashboard:", error);
        if (!isMounted) return;
        setData(getFallbackDashboardData());
      })
      .finally(() => {
        if (!isMounted) return;
        setDashboardLoading(false);
      });

    loadCriticalTasks();

    return () => {
      isMounted = false;
    };
  }, [refreshTrigger]);

  const loadCriticalTasks = async () => {
    setTasksLoading(true);
    try {
      const res = await api.courses.listTasks();
      const tasks = Array.isArray(res) ? res : res?.results || [];
      const filtered: TaskItem[] = tasks
        .filter(
          (task: TaskItem) =>
            task?.priority === "critical" || task?.priority === "high"
        )
        .sort((a: TaskItem, b: TaskItem) => {
          if (a.priority === "critical") return -1;
          if (b.priority === "critical") return 1;
          return 0;
        })
        .slice(0, 5);
      setCriticalTasks(filtered);
    } catch (error) {
      console.error("Failed to load critical tasks:", error);
      setCriticalTasks([]);
    } finally {
      setTasksLoading(false);
    }
  };

  if (dashboardLoading && !data) {
    return (
      <div className="pt-40 text-center text-slate-500 font-bold uppercase tracking-widest animate-pulse">
        Syncing student analytics...
      </div>
    );
  }

  if (!data) {
    return null;
  }

  const progressPercent = clampPercent(Math.round(data.progress_percent || 0));
  const averageQuizScore = clampPercent(Math.round(data.average_quiz_score || 0));
  const totalHoursStudied = data.total_hours_studied || 0;
  const totalMinutesStudied = data.total_minutes_studied || 0;
  const totalEnrolled = data.total_enrolled_courses || data.active_courses?.length || 0;
  const certCount = data.earned_certificates?.length || 0;
  const completedLessonsCount = data.latest_completed_lessons?.length || 0;
  const resumeCourse = data.active_courses?.[0];
  const resumeProgress = clampPercent(Math.round(resumeCourse?.progress || 0));

  const progressRingStyle = {
    background: `conic-gradient(#007BFF ${
      progressPercent * 3.6
    }deg, ${
      isDark ? "rgba(148,163,184,0.15)" : "rgba(148,163,184,0.28)"
    } 0deg)`,
  };

  const analyticsCards = [
    {
      key: "enrolled",
      icon: BookOpen,
      value: totalEnrolled,
      label: isEn ? "Enrolled Courses" : "الدورات المسجلة",
      hint: isEn ? "Learning tracks in progress" : "مسارات تعلم نشطة",
      iconColor: "text-sky-500",
    },
    {
      key: "quiz",
      icon: Trophy,
      value: `${averageQuizScore}%`,
      label: isEn ? "Average Quiz Score" : "متوسط الاختبارات",
      hint: isEn ? "Your current performance" : "مستوى الاداء الحالي",
      iconColor: "text-amber-500",
    },
    {
      key: "time",
      icon: Timer,
      value: `${totalHoursStudied}h ${totalMinutesStudied}m`,
      label: isEn ? "Study Time" : "وقت التعلم",
      hint: isEn ? "Focused learning duration" : "مدة التعلم الفعلية",
      iconColor: "text-cyan-500",
    },
    {
      key: "certs",
      icon: Award,
      value: certCount,
      label: isEn ? "Certificates" : "الشهادات",
      hint: isEn ? "Earned credentials" : "الشهادات المكتسبة",
      iconColor: "text-emerald-500",
    },
  ];

  const milestoneText =
    progressPercent >= 90
      ? isEn
        ? "You are almost graduation-ready."
        : "انت قريب جدا من الجاهزية المهنية."
      : progressPercent >= 65
      ? isEn
        ? "Strong momentum. Keep going."
        : "تقدم ممتاز. كمل بنفس الوتيرة."
      : isEn
      ? "Build consistency to accelerate progress."
      : "الاستمرارية هي مفتاح تسريع التقدم.";

  const handleCourseClick = () => {
    if (setView && resumeCourse) {
      setView(ViewMode.COURSE_PLAYER);
    }
  };

  return (
    <div className="pb-20 pt-32 px-6 lg:px-10 max-w-7xl mx-auto min-h-screen">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 mb-10">
        <Reveal>
          <div className="flex items-center gap-5">
            <div
              className={`w-14 h-14 rounded-2xl border ${cardBorder} ${mutedBg} flex items-center justify-center`}
            >
              <User size={28} className="text-eden-accent" />
            </div>
            <div>
              <h1 className={`text-3xl font-black tracking-tight ${titleText}`}>
                {isEn ? "Student Analytics" : "احصائيات الطالب"}
              </h1>
              <p className={`text-xs font-bold uppercase tracking-widest ${subtitleText}`}>
                {isEn ? "Performance Command Center" : "لوحة متابعة الاداء"}
              </p>
            </div>
          </div>
        </Reveal>

        <Reveal delay={0.08}>
          <Button
            variant="secondary"
            className="!h-11 !px-6 text-xs"
            onClick={() => setView?.(ViewMode.MARKETPLACE)}
          >
            <BookOpen size={16} />
            {isEn ? "Open Catalog" : "تصفح الكتالوج"}
          </Button>
        </Reveal>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-8">
          <Reveal width="100%">
            <Card className={`relative overflow-hidden border ${cardBorder} ${panelBg}`}>
              <div className="absolute -top-20 -left-24 w-64 h-64 bg-eden-accent/15 blur-3xl pointer-events-none" />
              <div className="absolute -bottom-24 -right-20 w-72 h-72 bg-blue-500/10 blur-3xl pointer-events-none" />

              <div className="relative grid grid-cols-1 xl:grid-cols-[220px_1fr] gap-7">
                <div className="flex flex-col items-center justify-center gap-4">
                  <div
                    style={progressRingStyle}
                    className="w-40 h-40 rounded-full p-[11px] shadow-[0_20px_45px_-22px_rgba(0,123,255,0.65)]"
                  >
                    <div
                      className={`w-full h-full rounded-full flex flex-col items-center justify-center ${
                        isDark ? "bg-[#030b18]" : "bg-white"
                      }`}
                    >
                      <span className={`text-3xl font-black leading-none ${titleText}`}>
                        {progressPercent}%
                      </span>
                      <span className={`text-[10px] font-bold uppercase tracking-widest ${subtitleText}`}>
                        {isEn ? "Completion" : "الانجاز"}
                      </span>
                    </div>
                  </div>

                  <div className="text-center">
                    <p className={`text-sm font-black uppercase tracking-widest ${titleText}`}>
                      {isEn ? "Overall Progress" : "التقدم الكلي"}
                    </p>
                    <p className={`text-[11px] mt-1 font-semibold ${subtitleText}`}>{milestoneText}</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {analyticsCards.map((item) => (
                      <div
                        key={item.key}
                        className={`rounded-2xl border p-4 ${cardBorder} ${
                          isDark ? "bg-white/5" : "bg-slate-50"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-3">
                          <item.icon size={18} className={item.iconColor} />
                          <span className={`text-[10px] uppercase tracking-widest font-bold ${subtitleText}`}>
                            {item.label}
                          </span>
                        </div>
                        <div className={`text-2xl font-black tracking-tight ${titleText}`}>{item.value}</div>
                        <p className={`text-[11px] mt-1 ${subtitleText}`}>{item.hint}</p>
                      </div>
                    ))}
                  </div>

                  <div className={`rounded-2xl border p-5 ${cardBorder} ${mutedBg}`}>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Target size={16} className="text-eden-accent" />
                        <p className={`text-xs font-black uppercase tracking-widest ${titleText}`}>
                          {isEn ? "Next Milestone" : "الهدف القادم"}
                        </p>
                      </div>
                      <span className={`text-[11px] font-bold ${subtitleText}`}>
                        {isEn ? "Target 100%" : "المستهدف 100%"}
                      </span>
                    </div>
                    <div className={`h-2.5 rounded-full overflow-hidden ${trackBg}`}>
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${progressPercent}%` }}
                        transition={{ duration: 1, ease: "easeOut" }}
                        className="h-full rounded-full bg-gradient-to-r from-eden-accent to-blue-500"
                      />
                    </div>
                    <div className="mt-3 flex items-center justify-between text-[11px] font-semibold">
                      <span className={subtitleText}>{isEn ? "Current track" : "المسار الحالي"}</span>
                      <span className={titleText}>{progressPercent}%</span>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </Reveal>

          <Reveal width="100%">
            {resumeCourse ? (
              <Card
                onClick={handleCourseClick}
                className={`relative overflow-hidden group !p-6 sm:!p-7 border cursor-pointer transition-all duration-300 hover:border-eden-accent/40 hover:shadow-[0_12px_45px_-25px_rgba(0,123,255,0.45)] ${cardBorder} ${
                  isDark ? "bg-slate-900/70" : "bg-white"
                }`}
              >
                <div className="absolute top-0 right-0 w-56 h-56 bg-eden-accent/10 blur-[110px] pointer-events-none" />
                <div className="relative z-10 flex flex-col md:flex-row items-stretch gap-5">
                  <div className={`w-full md:w-56 h-36 shrink-0 rounded-2xl overflow-hidden border ${cardBorder}`}>
                    <img
                      src={resumeCourse.thumbnail}
                      className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700"
                      alt={resumeCourse.title}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="inline-flex items-center gap-2 text-eden-accent text-[10px] font-black px-3 py-1.5 bg-eden-accent/10 rounded-xl border border-eden-accent/20 uppercase tracking-widest">
                      <Zap size={13} />
                      {isEn ? "Resume Course" : "استكمال الدورة"}
                    </span>
                    <h2 className={`text-2xl font-black mt-3 mb-4 leading-tight ${titleText}`}>
                      {resumeCourse.title}
                    </h2>
                    <div className={`w-full rounded-full h-2.5 mb-2 ${trackBg}`}>
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${resumeProgress}%` }}
                        transition={{ duration: 1, ease: "easeOut" }}
                        className="bg-eden-accent h-full rounded-full shadow-[0_0_15px_#22d3ee]"
                      />
                    </div>
                    <div className={`flex items-center justify-between text-[11px] font-semibold ${subtitleText}`}>
                      <span>{resumeProgress}% {isEn ? "Complete" : "مكتمل"}</span>
                      <span className="inline-flex items-center gap-1 text-eden-accent font-bold">
                        {isEn ? "Open Player" : "فتح المشغل"}
                        <Play size={14} />
                      </span>
                    </div>
                  </div>
                </div>
              </Card>
            ) : (
              <div
                className={`p-9 text-center border-2 border-dashed rounded-3xl ${emptyBorder} ${subtitleText}`}
              >
                <p className="text-sm font-black uppercase tracking-widest">
                  {isEn ? "No active courses yet" : "لا توجد دورات نشطة حاليا"}
                </p>
              </div>
            )}
          </Reveal>

          <Reveal width="100%">
            <div>
              <h3 className={`text-sm font-black mb-5 flex items-center gap-3 uppercase tracking-widest ${titleText}`}>
                <Award className="text-eden-accent" size={18} />
                {isEn ? "Achievements & Credentials" : "الانجازات والشهادات"}
              </h3>

              {data.earned_certificates && data.earned_certificates.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  {data.earned_certificates.map((cert) => (
                    <Card
                      key={cert.id}
                      className={`!p-4 flex items-center gap-4 group border ${cardBorder} ${
                        isDark ? "bg-white/5" : "bg-white"
                      }`}
                    >
                      <div className={`w-20 h-14 rounded-xl overflow-hidden shrink-0 border ${cardBorder}`}>
                        <img
                          src={cert.image_url}
                          alt={cert.course_title}
                          className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className={`font-black text-sm truncate ${titleText}`}>{cert.course_title}</h4>
                        <p className={`text-[11px] mt-1 ${subtitleText}`}>{cert.issued_at}</p>
                      </div>
                      <ArrowRight size={16} className="text-eden-accent shrink-0 opacity-60 group-hover:opacity-100" />
                    </Card>
                  ))}
                </div>
              ) : (
                <div
                  className={`p-10 text-center text-[11px] font-bold uppercase tracking-widest border-2 border-dashed rounded-3xl ${emptyBorder} ${subtitleText}`}
                >
                  {isEn ? "No credentials issued" : "لا توجد شهادات صادرة بعد"}
                </div>
              )}
            </div>
          </Reveal>
        </div>

        <div className="lg:col-span-4 space-y-8">
          <Reveal delay={0.16} width="100%">
            <Card className={`border ${cardBorder} ${isDark ? "bg-slate-900/70" : "bg-white"}`}>
              <div className="flex items-center justify-between mb-4">
                <p className={`text-[11px] font-black uppercase tracking-[0.18em] ${titleText}`}>
                  {isEn ? "Student Pulse" : "مؤشر الطالب"}
                </p>
                <Gauge size={16} className="text-eden-accent" />
              </div>

              <div className="space-y-4">
                <div className={`rounded-xl p-3 border ${cardBorder} ${mutedBg}`}>
                  <p className={`text-[10px] uppercase tracking-widest font-bold ${subtitleText}`}>
                    {isEn ? "Latest Completed Lessons" : "اخر الدروس المكتملة"}
                  </p>
                  <p className={`text-xl font-black mt-1 ${titleText}`}>{completedLessonsCount}</p>
                </div>
                <div className={`rounded-xl p-3 border ${cardBorder} ${mutedBg}`}>
                  <p className={`text-[10px] uppercase tracking-widest font-bold ${subtitleText}`}>
                    {isEn ? "Critical Queue" : "قائمة المهام العاجلة"}
                  </p>
                  <p className={`text-xl font-black mt-1 ${titleText}`}>{criticalTasks.length}</p>
                </div>
              </div>
            </Card>
          </Reveal>

          <Reveal delay={0.22} width="100%">
            <Card className={`!p-0 overflow-hidden border ${cardBorder}`}>
              <div className={`p-5 border-b font-black text-[10px] uppercase tracking-[0.2em] flex gap-3 items-center ${titleText} ${mutedBg} ${cardBorder}`}>
                <Clock size={15} className="text-eden-accent" />
                {isEn ? "Critical Tasks" : "المهام الحرجة"}
              </div>
              <div className={`divide-y ${dividerColor}`}>
                {tasksLoading ? (
                  <div className={`p-8 text-center text-[11px] font-semibold ${subtitleText} animate-pulse`}>
                    {isEn ? "Loading tasks..." : "جاري تحميل المهام..."}
                  </div>
                ) : criticalTasks.length > 0 ? (
                  criticalTasks.map((task) => {
                    const isCritical = task.priority === "critical";
                    return (
                      <div
                        key={task.id}
                        className={`p-4 border-l-4 transition-colors ${isDark ? "hover:bg-white/5" : "hover:bg-slate-50"} ${
                          isCritical ? "border-red-500" : "border-orange-500"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <p className={`font-bold text-sm ${titleText}`}>{task.title}</p>
                          <span
                            className={`text-[9px] px-2 py-1 rounded font-black uppercase tracking-wide ${
                              isCritical
                                ? "bg-red-500/20 text-red-400"
                                : "bg-orange-500/20 text-orange-400"
                            }`}
                          >
                            {task.priority || "high"}
                          </span>
                        </div>
                        {task.course_title && (
                          <p className={`text-[11px] mt-1 ${subtitleText}`}>{task.course_title}</p>
                        )}
                        {task.due_date && (
                          <p className="text-[11px] mt-1 font-bold text-eden-accent">
                            {isEn ? "Due:" : "الموعد:"}{" "}
                            {new Date(task.due_date).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    );
                  })
                ) : (
                  <div className={`p-8 text-center text-[11px] font-semibold ${subtitleText}`}>
                    <div className="flex items-center justify-center gap-2">
                      <CheckCircle2 size={15} className="text-emerald-500" />
                      <span>{isEn ? "No critical tasks right now" : "لا توجد مهام حرجة حاليا"}</span>
                    </div>
                  </div>
                )}
              </div>
            </Card>
          </Reveal>
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;
