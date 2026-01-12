
import React, { useState, useEffect } from 'react';
import { Lang, Theme, InstructorDashboardData } from '../../types';
import { api } from '../../api/client';
import { Card, Button } from '../../components/UI';
import { Reveal } from '../../components/Reveal';
import { DollarSign, Users, Star, Trophy, TrendingUp, Plus, BookOpen, Video, ArrowRight, UserPlus, Wallet, CreditCard, Clock, FileCheck } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

const InstructorDashboard: React.FC<{ lang: Lang, theme: Theme }> = ({ lang, theme }) => {
  const [data, setData] = useState<InstructorDashboardData | null>(null);
  const [wallet, setWallet] = useState<any>(null);
  const [tab, setTab] = useState<'stats' | 'wallet'>('stats');

  const isEn = lang === 'en';

//   useEffect(() => {
//     api.courses.getInstructorDashboard().then(setData).catch(console.error);
//     api.instructor.getWalletData().then(setWallet).catch(console.error);
//   }, []);

// Update InstructorDashboard.tsx
useEffect(() => {
  const fetchData = async () => {
    try {
      console.log('Fetching instructor dashboard...');
      const dashboardData = await api.courses.getInstructorDashboard();
      console.log('Dashboard data:', dashboardData);
      setData(dashboardData);
    } catch (error: any) {
      console.error('Dashboard error:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
    }

    try {
      console.log('Fetching wallet data...');
      const walletData = await api.instructor.getWalletData();
      console.log('Wallet data:', walletData);
      setWallet(walletData);
    } catch (error: any) {
      console.error('Wallet error:', error);
      console.error('Error response:', error.response?.data);
    }
  };

  fetchData();
}, []);
  if (!data || !data.stats) return <div className="pt-32 text-center text-slate-900 dark:text-white transition-all">Establishing Secure Connection...</div>;

  return (
    <div className="pb-10 pt-32 sm:pt-40 px-4 lg:px-8 max-w-7xl mx-auto min-h-screen">
      <Reveal>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
           <div>
             <h1 className="text-3xl font-bold text-slate-900 dark:text-white">{isEn ? "Instructor Portal" : "بوابة المدرب"}</h1>
             <div className="flex gap-4 mt-2">
                <button onClick={() => setTab('stats')} className={`text-xs font-bold uppercase tracking-widest ${tab === 'stats' ? 'text-primary' : 'text-slate-500'}`}>{isEn ? 'Overview' : 'نظرة عامة'}</button>
                <button onClick={() => setTab('wallet')} className={`text-xs font-bold uppercase tracking-widest ${tab === 'wallet' ? 'text-primary' : 'text-slate-500'}`}>{isEn ? 'Wallet' : 'المحفظة'}</button>
             </div>
           </div>
           <Button className="shadow-neon">
             <Plus size={18} /> {isEn ? "New Course" : "كورس جديد"}
           </Button>
        </div>
      </Reveal>

      {tab === 'stats' ? (
          <>
            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
                {[
                { label: isEn ? 'Earnings' : 'الأرباح', value: `$${data?.stats?.total_earnings || 0}`, icon: DollarSign, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
                { label: isEn ? 'Students' : 'الطلاب', value: data?.stats?.total_students || 0, icon: Users, color: 'text-blue-500', bg: 'bg-blue-500/10' },
                { label: isEn ? 'Courses' : 'الكورسات', value: data?.stats?.total_courses || 0, icon: BookOpen, color: 'text-primary', bg: 'bg-primary/10' },
                { label: isEn ? 'Lessons' : 'الدروس', value: data?.stats?.total_lessons || 0, icon: Video, color: 'text-indigo-500', bg: 'bg-indigo-500/10' },
                { label: isEn ? 'Rating' : 'التقييم', value: data?.stats?.average_rating || 0, icon: Star, color: 'text-amber-500', bg: 'bg-amber-500/10' },
                { label: isEn ? 'Pending' : 'معلق', value: `$${data?.stats?.pending_payouts || 0}`, icon: Wallet, color: 'text-purple-500', bg: 'bg-purple-500/10' },
                ].map((stat, i) => (
                <Reveal key={i} delay={i * 0.05} width="100%">
                    <Card className="h-full flex flex-col justify-center border-none shadow-sm hover:shadow-md transition-all">
                    <div className={`w-8 h-8 ${stat.bg} ${stat.color} rounded-lg flex items-center justify-center mb-2`}><stat.icon size={16} /></div>
                    <h3 className="font-bold text-slate-900 dark:text-white text-lg">{stat.value}</h3>
                    <p className="text-[9px] text-slate-500 uppercase font-bold mt-1">{stat.label}</p>
                    </Card>
                </Reveal>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">
                   <Card className="h-[400px] !p-6">
                      <div className="flex justify-between items-center mb-6">
                         <h3 className="font-bold text-slate-900 dark:text-white flex gap-2 items-center"><TrendingUp size={18} className="text-primary"/> {isEn ? "Performance" : "الأداء"}</h3>
                      </div>
                      <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={data.revenue_trend}>
                                <XAxis dataKey="date" hide />
                                <Tooltip contentStyle={{ borderRadius: '12px' }} />
                                <Area type="monotone" dataKey="amount" stroke="#4BC594" fill="#4BC59422" strokeWidth={3} />
                            </AreaChart>
                        </ResponsiveContainer>
                      </div>
                   </Card>

                   {/* Pending Assessments Section */}
                    <Card className="!p-6">
                        <h3 className="font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2"><Clock size={18} className="text-orange-500"/> {isEn ? "Pending Assessments" : "التقييمات المعلقة"}</h3>
                        <div className="space-y-4">
                            {data.pending_assignments && data.pending_assignments.length > 0 ? (
                                data.pending_assignments.map((task: any) => (
                                    <div key={task.id} className="p-4 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 hover:border-orange-500/50 transition-colors">
                                        <div className="flex justify-between items-start gap-3">
                                            <div className="flex-1 min-w-0">
                                                <h4 className="font-bold text-sm text-slate-900 dark:text-white truncate">{task.title}</h4>
                                                <p className="text-[10px] text-slate-500 mt-1">{task.student_name}</p>
                                                <p className="text-[9px] text-slate-400 mt-1">{task.course_title}</p>
                                                <p className="text-[10px] text-slate-500 mt-2">{isEn ? 'Score' : 'الدرجة'}: {task.score}%</p>
                                                <p className="text-[9px] text-slate-400 mt-1">{task.date}</p>
                                            </div>
                                            <Button className="!py-1.5 !px-3 text-[10px] whitespace-nowrap flex-shrink-0">{isEn ? 'Review' : 'مراجعة'}</Button>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="p-8 text-center text-slate-500 dark:text-slate-400">
                                    <p className="text-sm">{isEn ? 'No pending assessments' : 'لا توجد تقييمات معلقة'}</p>
                                </div>
                            )}
                        </div>
                    </Card>
                </div>

                <div className="lg:col-span-1">
                   <Card className="h-full !p-0 overflow-hidden flex flex-col">
                      <div className="p-6 border-b border-slate-100 dark:border-white/10 bg-slate-50 dark:bg-black/20 font-bold flex items-center gap-2"><UserPlus size={18} className="text-primary" /> {isEn ? "Latest Students" : "أحدث الطلاب"}</div>
                      <div className="flex-1 overflow-y-auto p-2">
                         {data.latest_enrollments.map((e, idx) => (
                            <div key={idx} className="p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-white/5 flex items-center gap-3">
                               <div className="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-xs">{e.student_name.charAt(0)}</div>
                               <div className="flex-1 min-w-0"><h4 className="font-bold text-xs truncate">{e.student_name}</h4><p className="text-[9px] text-slate-500 truncate">{e.course_title}</p></div>
                            </div>
                         ))}
                      </div>
                   </Card>
                </div>
            </div>
          </>
      ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in slide-in-from-bottom-4">
              <div className="lg:col-span-4">
                 <Card className="!p-8 bg-gradient-to-br from-primary to-emerald-900 text-white border-none shadow-xl shadow-primary/20">
                    <div className="flex justify-between items-start mb-10">
                       <Wallet size={32} className="opacity-80" />
                       <CreditCard size={24} className="opacity-50" />
                    </div>
                    <p className="text-xs uppercase font-bold tracking-widest opacity-70 mb-2">{isEn ? 'Current Balance' : 'الرصيد الحالي'}</p>
                    <h2 className="text-4xl font-bold mb-8">${wallet?.balance.toLocaleString()}</h2>
                    <Button variant="outline" className="w-full !bg-white/10 !border-white/20 text-white hover:!bg-white hover:!text-primary">
                       Request Payout
                    </Button>
                 </Card>
              </div>
              <div className="lg:col-span-8">
                 <Card className="h-full">
                    <h3 className="font-bold text-slate-900 dark:text-white mb-6">{isEn ? 'Transaction History' : 'سجل العمليات'}</h3>
                    <div className="space-y-4">
                       {wallet?.history.map((h: any) => (
                          <div key={h.id} className="flex justify-between items-center p-4 border-b border-slate-100 dark:border-white/5 last:border-0">
                             <div className="flex gap-4 items-center">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${h.amount > 0 ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>
                                   {h.amount > 0 ? <TrendingUp size={18}/> : <ArrowRight size={18} className="rotate-90"/>}
                                </div>
                                <div>
                                   <p className="font-bold text-sm text-slate-900 dark:text-white">{h.type} - {h.course || 'Withdrawal'}</p>
                                   <p className="text-[10px] text-slate-500">{h.date}</p>
                                </div>
                             </div>
                             <span className={`font-bold ${h.amount > 0 ? 'text-emerald-500' : 'text-red-500'}`}>{h.amount > 0 ? '+' : ''}{h.amount}</span>
                          </div>
                       ))}
                    </div>
                 </Card>
              </div>
          </div>
      )}
    </div>
  );
};

export default InstructorDashboard;
