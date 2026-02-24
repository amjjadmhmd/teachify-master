import React, { useEffect, useState } from "react";
import { api } from "../../api/client";
import { Button, Card } from "../../components/UI";
import { Reveal } from "../../components/Reveal";
import { InstructorDashboardData, Lang, Theme, ViewMode } from "../../types";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import {
  BarChart3,
  BookOpen,
  Clock3,
  DollarSign,
  FileCheck2,
  GraduationCap,
  Star,
  Users,
  Wallet2,
} from "lucide-react";

type WalletShape = {
  balance?: number;
};

const clampPercent = (value: number) => Math.max(0, Math.min(100, value));

interface DashboardProps {
  lang: Lang;
  theme: Theme;
  setView?: (view: ViewMode) => void;
}

const InstructorDashboard: React.FC<DashboardProps> = ({
  lang,
  theme,
  setView,
}) => {
  const [data, setData] = useState<InstructorDashboardData | null>(null);
  const [wallet, setWallet] = useState<WalletShape | null>(null);
  const [loading, setLoading] = useState(true);

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
  const chartGridColor = isDark ? "rgba(148,163,184,0.16)" : "rgba(148,163,184,0.24)";

  useEffect(() => {
    let mounted = true;

    const loadDashboard = async () => {
      setLoading(true);

      const [dashboardRes, walletRes] = await Promise.allSettled([
        api.courses.getInstructorDashboard(),
        api.instructor.getWalletData(),
      ]);

      if (!mounted) return;

      if (dashboardRes.status === "fulfilled") {
        setData(dashboardRes.value);
      } else {
        console.error("Failed to load instructor dashboard:", dashboardRes.reason);
      }

      if (walletRes.status === "fulfilled") {
        setWallet(walletRes.value as WalletShape);
      } else {
        setWallet(null);
      }

      setLoading(false);
    };

    loadDashboard();
    return () => {
      mounted = false;
    };
  }, []);

  if (loading && !data) {
    return (
      <div className="pt-40 text-center text-slate-500 font-bold uppercase tracking-widest animate-pulse">
        Syncing instructor analytics...
      </div>
    );
  }

  if (!data?.stats) {
    return (
      <div className="pt-40 text-center text-slate-500 font-bold uppercase tracking-widest">
        {isEn ? "Unable to load dashboard data." : "تعذر تحميل بيانات لوحة المدرب."}
      </div>
    );
  }

  const stats = data.stats;
  const revenueTrend = Array.isArray(data.revenue_trend) ? data.revenue_trend : [];
  const latestEnrollments = Array.isArray(data.latest_enrollments)
    ? data.latest_enrollments.slice(0, 8)
    : [];
  const pendingAssignments = Array.isArray(data.pending_assignments)
    ? data.pending_assignments.slice(0, 6)
    : [];
  const myCourses = Array.isArray(data.my_courses) ? data.my_courses.slice(0, 4) : [];

  const ratingValue = Number(stats.average_rating || 0);
  const ratingPercent = clampPercent(Math.round((ratingValue / 5) * 100));
  const deliveryScore = clampPercent(
    Math.round((ratingPercent * 0.55) + (Math.min(stats.total_students || 0, 200) * 0.2) + (Math.min(stats.total_courses || 0, 10) * 2.5))
  );

  const totalEarnings = Number(stats.total_earnings || 0);
  const pendingPayouts = Number(stats.pending_payouts || 0);
  const walletBalance = Number(wallet?.balance || 0);
  const bestSellingCourse =
    stats.best_selling_course || myCourses[0]?.title || (isEn ? "No data yet" : "لا توجد بيانات بعد");

  const formatCurrency = (value: number) => `$${Math.round(value).toLocaleString()}`;
  const formatDate = (value?: string) => {
    if (!value) return isEn ? "No date" : "بدون تاريخ";
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return value;
    return parsed.toLocaleDateString(isEn ? "en-US" : "ar-EG");
  };

  const progressRingStyle = {
    background: `conic-gradient(#007BFF ${
      deliveryScore * 3.6
    }deg, ${
      isDark ? "rgba(148,163,184,0.15)" : "rgba(148,163,184,0.28)"
    } 0deg)`,
  };

  const kpiCards = [
    {
      key: "earnings",
      icon: DollarSign,
      value: formatCurrency(totalEarnings),
      label: isEn ? "Total Earnings" : "إجمالي الأرباح",
      hint: isEn ? "Net instructor revenue" : "صافي إيرادات المدرب",
      iconColor: "text-emerald-500",
    },
    {
      key: "students",
      icon: Users,
      value: stats.total_students || 0,
      label: isEn ? "Total Students" : "إجمالي الطلاب",
      hint: isEn ? "Active learners enrolled" : "الطلاب المسجلون النشطون",
      iconColor: "text-sky-500",
    },
    {
      key: "courses",
      icon: BookOpen,
      value: stats.total_courses || 0,
      label: isEn ? "Published Courses" : "الدورات المنشورة",
      hint: isEn ? "Courses currently live" : "الدورات المتاحة حاليا",
      iconColor: "text-blue-500",
    },
    {
      key: "payouts",
      icon: Wallet2,
      value: formatCurrency(pendingPayouts),
      label: isEn ? "Pending Payouts" : "المدفوعات المعلقة",
      hint: isEn ? "Awaiting transfer" : "في انتظار التحويل",
      iconColor: "text-amber-500",
    },
  ];

  const scoreMessage =
    deliveryScore >= 85
      ? isEn
        ? "Excellent instructional momentum."
        : "زخم تدريسي ممتاز."
      : deliveryScore >= 65
      ? isEn
        ? "Good trajectory. Optimize follow-ups."
        : "أداء جيد. حسّن المتابعة."
      : isEn
      ? "Focus on content quality and student retention."
      : "ركّز على جودة المحتوى واستبقاء الطلاب.";

  return (
    <div className="pb-20 pt-32 px-6 lg:px-10 max-w-7xl mx-auto min-h-screen">
      <div className="mb-10">
        <Reveal>
          <div className="flex items-center gap-4">
            <div
              className={`w-14 h-14 rounded-2xl border ${cardBorder} ${mutedBg} flex items-center justify-center`}
            >
              <GraduationCap size={26} className="text-eden-accent" />
            </div>
            <div>
              <h1 className={`text-3xl font-black tracking-tight ${titleText}`}>
                {isEn ? "Instructor Analytics" : "إحصائيات المدرب"}
              </h1>
              <p className={`text-xs font-bold uppercase tracking-widest ${subtitleText}`}>
                {isEn ? "Teaching Performance Command" : "لوحة متابعة الأداء التدريسي"}
              </p>
            </div>
          </div>
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
                        {deliveryScore}%
                      </span>
                      <span className={`text-[10px] font-bold uppercase tracking-widest ${subtitleText}`}>
                        {isEn ? "Instructor Score" : "مؤشر المدرب"}
                      </span>
                    </div>
                  </div>

                  <div className="text-center">
                    <p className={`text-sm font-black uppercase tracking-widest ${titleText}`}>
                      {isEn ? "Teaching Health" : "الصحة التدريسية"}
                    </p>
                    <p className={`text-[11px] mt-1 font-semibold ${subtitleText}`}>{scoreMessage}</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {kpiCards.map((item) => (
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
                        <Star size={16} className="text-amber-500" />
                        <p className={`text-xs font-black uppercase tracking-widest ${titleText}`}>
                          {isEn ? "Quality Milestone" : "مؤشر الجودة"}
                        </p>
                      </div>
                      <span className={`text-[11px] font-bold ${subtitleText}`}>
                        {isEn ? "Rating Target: 5.0" : "الهدف: تقييم 5.0"}
                      </span>
                    </div>
                    <div className={`h-2.5 rounded-full overflow-hidden ${trackBg}`}>
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-amber-400 to-eden-accent"
                        style={{ width: `${ratingPercent}%` }}
                      />
                    </div>
                    <div className="mt-3 flex items-center justify-between text-[11px] font-semibold">
                      <span className={subtitleText}>{isEn ? "Current rating" : "التقييم الحالي"}</span>
                      <span className={titleText}>{ratingValue.toFixed(1)} / 5</span>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </Reveal>

          <Reveal width="100%">
            <Card className={`border ${cardBorder} ${isDark ? "bg-slate-900/70" : "bg-white"}`}>
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2">
                  <BarChart3 size={18} className="text-eden-accent" />
                  <h3 className={`text-sm font-black uppercase tracking-widest ${titleText}`}>
                    {isEn ? "Revenue Trend" : "اتجاه الإيرادات"}
                  </h3>
                </div>
                <span className={`text-[11px] font-bold ${subtitleText}`}>
                  {isEn ? "Best Seller:" : "الأفضل مبيعًا:"} {bestSellingCourse}
                </span>
              </div>

              <div className="h-72">
                {revenueTrend.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={revenueTrend}>
                      <CartesianGrid stroke={chartGridColor} strokeDasharray="3 3" />
                      <XAxis dataKey="date" tick={{ fill: isDark ? "#cbd5e1" : "#475569", fontSize: 11 }} />
                      <YAxis tick={{ fill: isDark ? "#cbd5e1" : "#475569", fontSize: 11 }} />
                      <Tooltip
                        contentStyle={{
                          background: isDark ? "#0b162e" : "#ffffff",
                          border: "1px solid rgba(148,163,184,0.35)",
                          borderRadius: 12,
                        }}
                        formatter={(value: number) => [formatCurrency(value), isEn ? "Revenue" : "الإيراد"]}
                      />
                      <Area
                        type="monotone"
                        dataKey="amount"
                        stroke="#007BFF"
                        fill="rgba(0,123,255,0.22)"
                        strokeWidth={3}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className={`h-full flex items-center justify-center text-sm font-semibold ${subtitleText}`}>
                    {isEn ? "No revenue data yet." : "لا توجد بيانات إيرادات بعد."}
                  </div>
                )}
              </div>
            </Card>
          </Reveal>

          <Reveal width="100%">
            <div>
              <h3 className={`text-sm font-black mb-5 flex items-center gap-3 uppercase tracking-widest ${titleText}`}>
                <BookOpen className="text-eden-accent" size={18} />
                {isEn ? "Course Snapshot" : "ملخص الدورات"}
              </h3>

              {myCourses.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  {myCourses.map((course) => (
                    <Card
                      key={course.id}
                      className={`border ${cardBorder} ${isDark ? "bg-white/5" : "bg-white"}`}
                    >
                      <h4 className={`font-black text-base truncate ${titleText}`}>{course.title}</h4>
                      <p className={`text-[11px] mt-1 line-clamp-2 ${subtitleText}`}>
                        {course.description || (isEn ? "No description." : "لا يوجد وصف.")}
                      </p>
                      <div className="mt-4 grid grid-cols-2 gap-3">
                        <div className={`rounded-xl p-3 border ${cardBorder} ${mutedBg}`}>
                          <p className={`text-[10px] uppercase tracking-widest font-bold ${subtitleText}`}>
                            {isEn ? "Students" : "الطلاب"}
                          </p>
                          <p className={`text-lg font-black mt-1 ${titleText}`}>{course.students_count || 0}</p>
                        </div>
                        <div className={`rounded-xl p-3 border ${cardBorder} ${mutedBg}`}>
                          <p className={`text-[10px] uppercase tracking-widest font-bold ${subtitleText}`}>
                            {isEn ? "Rating" : "التقييم"}
                          </p>
                          <p className={`text-lg font-black mt-1 ${titleText}`}>
                            {(course.rating || 0).toFixed(1)}
                          </p>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              ) : (
                <div
                  className={`p-10 text-center text-[11px] font-bold uppercase tracking-widest border-2 border-dashed rounded-3xl ${cardBorder} ${subtitleText}`}
                >
                  {isEn ? "No courses available yet." : "لا توجد دورات متاحة بعد."}
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
                  {isEn ? "Instructor Pulse" : "نبض المدرب"}
                </p>
                <GraduationCap size={16} className="text-eden-accent" />
              </div>

              <div className="space-y-4">
                <div className={`rounded-xl p-3 border ${cardBorder} ${mutedBg}`}>
                  <p className={`text-[10px] uppercase tracking-widest font-bold ${subtitleText}`}>
                    {isEn ? "Total Lessons" : "إجمالي الدروس"}
                  </p>
                  <p className={`text-xl font-black mt-1 ${titleText}`}>{stats.total_lessons || 0}</p>
                </div>
                <div className={`rounded-xl p-3 border ${cardBorder} ${mutedBg}`}>
                  <p className={`text-[10px] uppercase tracking-widest font-bold ${subtitleText}`}>
                    {isEn ? "Pending Reviews" : "المراجعات المعلقة"}
                  </p>
                  <p className={`text-xl font-black mt-1 ${titleText}`}>{pendingAssignments.length}</p>
                </div>
                <div className={`rounded-xl p-3 border ${cardBorder} ${mutedBg}`}>
                  <p className={`text-[10px] uppercase tracking-widest font-bold ${subtitleText}`}>
                    {isEn ? "Available Balance" : "الرصيد المتاح"}
                  </p>
                  <p className={`text-xl font-black mt-1 ${titleText}`}>{formatCurrency(walletBalance)}</p>
                </div>
              </div>
            </Card>
          </Reveal>

          <Reveal delay={0.22} width="100%">
            <Card className={`!p-0 overflow-hidden border ${cardBorder}`}>
              <div className={`p-5 border-b font-black text-[10px] uppercase tracking-[0.2em] flex gap-3 items-center ${titleText} ${mutedBg} ${cardBorder}`}>
                <FileCheck2 size={15} className="text-amber-500" />
                {isEn ? "Pending Assessments" : "التقييمات المعلقة"}
              </div>
              <div className={`divide-y ${dividerColor}`}>
                {pendingAssignments.length > 0 ? (
                  pendingAssignments.map((task) => {
                    const taskStatus = task.status || "pending";
                    return (
                      <div key={task.id} className={`p-4 ${isDark ? "hover:bg-white/5" : "hover:bg-slate-50"}`}>
                        <div className="flex items-start justify-between gap-3">
                          <p className={`font-bold text-sm ${titleText}`}>{task.title}</p>
                          <span
                            className={`text-[9px] px-2 py-1 rounded font-black uppercase tracking-wide ${
                              taskStatus === "graded"
                                ? "bg-emerald-500/20 text-emerald-400"
                                : taskStatus === "submitted"
                                ? "bg-blue-500/20 text-blue-400"
                                : "bg-orange-500/20 text-orange-400"
                            }`}
                          >
                            {taskStatus}
                          </span>
                        </div>
                        {task.student_name && (
                          <p className={`text-[11px] mt-1 ${subtitleText}`}>
                            {isEn ? "Student:" : "الطالب:"} {task.student_name}
                          </p>
                        )}
                        {task.course_title && (
                          <p className={`text-[11px] mt-1 ${subtitleText}`}>
                            {isEn ? "Course:" : "الدورة:"} {task.course_title}
                          </p>
                        )}
                        <p className="text-[11px] mt-1 font-bold text-eden-accent">
                          {isEn ? "Deadline:" : "الموعد:"} {formatDate(task.deadline)}
                        </p>
                      </div>
                    );
                  })
                ) : (
                  <div className={`p-8 text-center text-[11px] font-semibold ${subtitleText}`}>
                    {isEn ? "No pending assessments." : "لا توجد تقييمات معلقة."}
                  </div>
                )}
              </div>
            </Card>
          </Reveal>

          <Reveal delay={0.28} width="100%">
            <Card className={`!p-0 overflow-hidden border ${cardBorder}`}>
              <div className={`p-5 border-b font-black text-[10px] uppercase tracking-[0.2em] flex gap-3 items-center ${titleText} ${mutedBg} ${cardBorder}`}>
                <Users size={15} className="text-sky-500" />
                {isEn ? "Latest Enrollments" : "أحدث التسجيلات"}
              </div>
              <div className={`divide-y ${dividerColor}`}>
                {latestEnrollments.length > 0 ? (
                  latestEnrollments.map((enrollment) => (
                    <div key={enrollment.id} className={`p-4 ${isDark ? "hover:bg-white/5" : "hover:bg-slate-50"}`}>
                      <p className={`font-bold text-sm ${titleText}`}>{enrollment.student_name}</p>
                      <p className={`text-[11px] mt-1 ${subtitleText}`}>{enrollment.course_title}</p>
                      <p className="text-[11px] mt-1 font-semibold text-eden-accent">
                        {formatDate(enrollment.date)}
                      </p>
                    </div>
                  ))
                ) : (
                  <div className={`p-8 text-center text-[11px] font-semibold ${subtitleText}`}>
                    {isEn ? "No recent enrollments." : "لا توجد تسجيلات حديثة."}
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

export default InstructorDashboard;
