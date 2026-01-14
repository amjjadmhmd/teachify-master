import React, { useState, useEffect } from "react";
// Added ArrowRight to the lucide-react imports
import {
  User,
  Bell,
  Zap,
  Trophy,
  Timer,
  Play,
  ChevronRight,
  Clock,
  ShieldCheck,
  Medal,
  Award,
  BarChart,
  X,
  CheckCircle,
  XCircle,
  FileText,
  ArrowRight,
} from "lucide-react";
import { ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
// Added missing motion import from framer-motion
import { motion } from "framer-motion";
import { DashboardData, Lang, Theme, ViewMode } from "../../types";
import { api } from "../../api/client";
import { Button, Card } from "../../components/UI";
import { Reveal } from "../../components/Reveal";

interface DashboardProps {
  lang: Lang;
  theme: Theme;
  refreshTrigger: number;
  isMobile: boolean;
  setView?: (view: ViewMode) => void;
}

const StudentDashboard: React.FC<DashboardProps> = ({
  lang,
  theme,
  refreshTrigger,
  isMobile,
  setView,
}) => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [showProgressModal, setShowProgressModal] = useState(false);
  const [criticalTasks, setCriticalTasks] = useState<any[]>([]);
  const [tasksLoading, setTasksLoading] = useState(false);

  const isEn = lang === "en";

  // Handle clicking on a course to open CoursePlayer
  const handleCourseClick = () => {
    if (setView) {
      setView(ViewMode.COURSE_PLAYER);
    }
  };

  useEffect(() => {
    api.courses.getDashboard().then(setData).catch(console.error);
    loadCriticalTasks();
  }, [refreshTrigger]);

  const loadCriticalTasks = async () => {
    setTasksLoading(true);
    try {
      const res = await api.courses.listTasks();
      // Handle both paginated and non-paginated responses
      const tasks = Array.isArray(res) ? res : res.results || [];
      // Filter only critical and high priority tasks
      const filtered = tasks
        .filter(
          (task: any) =>
            task.priority === "critical" || task.priority === "high"
        )
        .sort((a: any, b: any) => {
          if (a.priority === "critical") return -1;
          if (b.priority === "critical") return 1;
          return 0;
        });
      setCriticalTasks(filtered.slice(0, 5)); // Show top 5
    } catch (error) {
      console.error("Failed to load critical tasks:", error);
    } finally {
      setTasksLoading(false);
    }
  };

  if (!data)
    return (
      <div className="pt-40 text-center text-slate-500 font-bold uppercase tracking-widest animate-pulse">
        Syncing neural data...
      </div>
    );

  const progressData = [
    { name: "Completed", value: data.progress_percent || 75 },
    { name: "Remaining", value: 100 - (data.progress_percent || 75) },
  ];
  const COLORS = ["#22d3ee", "rgba(255, 255, 255, 0.05)"];
  const resumeCourse = data.active_courses?.[0];

  return (
    <div className="pb-20 pt-32 px-6 lg:px-10 max-w-7xl mx-auto min-h-screen">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 mb-12">
        <Reveal>
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 bg-gradient-to-tr from-eden-accent to-blue-500 rounded-2xl p-[1px]">
              <div className="w-full h-full bg-eden-bg rounded-2xl flex items-center justify-center">
                <User size={32} className="text-eden-accent" />
              </div>
            </div>
            <div>
              <h1 className="text-3xl font-black text-white tracking-tighter">
                {isEn ? "Workspace" : "مساحة العمل"}
              </h1>
              <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">
                {isEn ? "Active Session" : "جلسة نشطة"}
              </p>
            </div>
          </div>
        </Reveal>

        <Reveal delay={0.1}>
          <Button
            variant="secondary"
            className="!h-11 !px-6 text-xs"
            onClick={() => setShowProgressModal(true)}
          >
            <BarChart size={18} />{" "}
            {isEn ? "Performance Analytics" : "تحليلات الأداء"}
          </Button>
        </Reveal>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-8">
          <Reveal width="100%">
            {resumeCourse ? (
              <Card
                onClick={handleCourseClick}
                className="relative overflow-hidden group !p-8 flex flex-col sm:flex-row items-center gap-8 border-eden-accent/20 hover:border-eden-accent/50 transition-all duration-500 cursor-pointer hover:shadow-lg hover:shadow-eden-accent/30"
              >
                <div className="absolute top-0 right-0 w-64 h-64 bg-eden-accent/5 blur-[100px] pointer-events-none"></div>

                <div className="relative z-10 w-full sm:w-56 h-36 shrink-0 rounded-2xl overflow-hidden border border-white/5">
                  <img
                    src={resumeCourse.thumbnail}
                    className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700"
                    alt=""
                  />
                  <div className="absolute inset-0 flex items-center justify-center bg-eden-accent/20 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Play size={40} className="text-eden-bg fill-current" />
                  </div>
                </div>
                <div className="relative z-10 flex-1 w-full">
                  <div className="flex justify-between mb-4">
                    <span className="text-eden-accent text-[10px] font-black px-4 py-1.5 bg-eden-accent/10 rounded-xl border border-eden-accent/20 uppercase tracking-widest flex gap-2 items-center">
                      <Zap size={14} />{" "}
                      {isEn ? "Current Objective" : "الهدف الحالي"}
                    </span>
                  </div>
                  <h2 className="text-2xl font-black text-white mb-4 tracking-tight leading-none">
                    {resumeCourse.title}
                  </h2>
                  <div className="w-full bg-white/5 rounded-full h-2 mb-2">
                    {/* Fixed: motion.div now has its import */}
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${resumeCourse.progress}%` }}
                      transition={{ duration: 1, ease: "easeOut" }}
                      className="bg-eden-accent h-full rounded-full shadow-[0_0_15px_#22d3ee]"
                    ></motion.div>
                  </div>
                  <div className="flex justify-between text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                    <span>
                      {resumeCourse.progress}% {isEn ? "Complete" : "مكتمل"}
                    </span>
                    <span>{isEn ? "Module 4" : "الوحدة 4"}</span>
                  </div>
                </div>
              </Card>
            ) : (
              <div className="p-8 text-slate-600 font-bold uppercase tracking-widest text-center border-2 border-dashed border-white/5 rounded-3xl">
                {isEn ? "No active courses." : "لا توجد دورات نشطة."}
              </div>
            )}
          </Reveal>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
            <Reveal width="100%">
              <Card className="flex items-center gap-6 h-full border-white/5 bg-gradient-to-br from-eden-card to-eden-bg">
                <div className="w-28 h-28 relative">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={progressData}
                        innerRadius={35}
                        outerRadius={45}
                        dataKey="value"
                        stroke="none"
                        startAngle={90}
                        endAngle={450}
                      >
                        {progressData.map((e, i) => (
                          <Cell key={i} fill={COLORS[i]} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex items-center justify-center font-black text-white text-lg">
                    {data.progress_percent}%
                  </div>
                </div>
                <div>
                  <h3 className="font-bold text-white uppercase tracking-widest text-xs mb-1">
                    {isEn ? "Total Mastery" : "الإتقان الكلي"}
                  </h3>
                  <p className="text-[10px] text-slate-500 font-bold leading-relaxed">
                    {isEn
                      ? "Advancing toward senior certification."
                      : "التقدم نحو الشهادة العليا."}
                  </p>
                </div>
              </Card>
            </Reveal>
            <Reveal width="100%">
              <div className="grid grid-rows-2 gap-4 h-full">
                <Card className="flex items-center gap-4 !p-5 border-white/5">
                  <Trophy size={20} className="text-amber-500" />
                  <div className="font-black text-white text-lg">
                    {data.average_quiz_score}%{" "}
                    <span className="text-[10px] uppercase tracking-widest text-slate-500 ml-2">
                      {isEn ? "Avg Grade" : "متوسط الدرجة"}
                    </span>
                  </div>
                </Card>
                <Card className="flex items-center gap-4 !p-5 border-white/5">
                  <Timer size={20} className="text-eden-accent" />
                  <div className="font-black text-white text-lg">
                    {data.total_hours_studied}h {data.total_minutes_studied}m{" "}
                    <span className="text-[10px] uppercase tracking-widest text-slate-500 ml-2">
                      {isEn ? "Air Time" : "وقت التعلم"}
                    </span>
                  </div>
                </Card>
              </div>
            </Reveal>
          </div>

          <Reveal width="100%">
            <div>
              <h3 className="text-sm font-black text-white mb-6 flex items-center gap-3 uppercase tracking-widest">
                <Award className="text-eden-accent" size={18} />{" "}
                {isEn ? "Achievements & Credentials" : "الإنجازات والشهادات"}
              </h3>
              {data.earned_certificates &&
              data.earned_certificates.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {data.earned_certificates.map((cert) => (
                    <Card
                      key={cert.id}
                      className="!p-5 border-white/5 flex gap-5 items-center group cursor-pointer hover:border-eden-accent/30 transition-all"
                    >
                      <div className="w-20 h-14 bg-white/5 rounded-xl overflow-hidden shrink-0 border border-white/5">
                        <img
                          src={cert.image_url}
                          alt="cert"
                          className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-black text-white text-sm truncate uppercase tracking-tight">
                          {cert.course_title}
                        </h4>
                        <p className="text-[10px] font-bold text-slate-500 mt-1 uppercase tracking-widest">
                          {cert.issued_at}
                        </p>
                      </div>
                      <div className="text-eden-accent opacity-0 group-hover:opacity-100 transition-opacity">
                        {/* Fixed: ArrowRight now has its import */}
                        <ArrowRight size={18} />
                      </div>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="p-12 text-center text-slate-600 text-[10px] font-black uppercase tracking-[0.3em] border-2 border-dashed border-white/5 rounded-3xl">
                  {isEn ? "No credentials issued" : "لم يتم إصدار شهادات"}
                </div>
              )}
            </div>
          </Reveal>
        </div>

        <div className="lg:col-span-4 space-y-8">
          <Reveal delay={0.2} width="100%">
            <Card className="!p-0 overflow-hidden border-white/5">
              <div className="p-6 border-b border-white/5 bg-white/5 font-black text-[10px] uppercase tracking-[0.2em] flex gap-3 text-white">
                <Clock size={16} className="text-eden-accent" />{" "}
                {isEn ? "Critical Tasks" : "المهام الحرجة"}
              </div>
              <div className="divide-y divide-white/5">
                {tasksLoading ? (
                  <div className="p-10 text-center text-[10px] font-bold uppercase tracking-widest text-slate-600 animate-pulse">
                    {isEn ? "Loading tasks..." : "جاري تحميل المهام..."}
                  </div>
                ) : criticalTasks.length > 0 ? (
                  criticalTasks.map((t) => (
                    <div
                      key={t.id}
                      className={`p-6 text-xs flex flex-col gap-2 group hover:bg-white/5 transition-colors cursor-pointer border-l-4 ${
                        t.priority === "critical"
                          ? "border-red-500"
                          : "border-orange-500"
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <span className="text-slate-300 font-bold group-hover:text-white flex-1">
                          {t.title}
                        </span>
                        <span
                          className={`text-[9px] font-black px-2 py-1 rounded whitespace-nowrap ml-2 ${
                            t.priority === "critical"
                              ? "bg-red-500/20 text-red-400"
                              : "bg-orange-500/20 text-orange-400"
                          }`}
                        >
                          {t.priority.toUpperCase()}
                        </span>
                      </div>
                      {t.course_title && (
                        <span className="text-[9px] text-slate-500">
                          {t.course_title}
                        </span>
                      )}
                      {t.due_date && (
                        <span className="text-eden-accent font-black text-[9px]">
                          {isEn ? "Due:" : "الاستحقاق:"}{" "}
                          {new Date(t.due_date).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="p-10 text-center text-[10px] font-bold uppercase tracking-widest text-slate-600">
                    {isEn ? "Zero critical tasks" : "لا توجد مهام حرجة"}
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
