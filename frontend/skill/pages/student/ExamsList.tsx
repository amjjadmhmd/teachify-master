import React, { useState, useEffect } from 'react';
import { Lang, Theme, PendingQuiz, ExamAttempt } from '../../types';
import { api } from '../../api/client';
import { Card, Button } from '../../components/UI';
import { Reveal } from '../../components/Reveal';
import { ClipboardList, Clock, HelpCircle, ArrowRight, CheckCircle, XCircle, FileText, Calendar, Lock } from 'lucide-react';

interface ExamsListProps {
  lang: Lang;
  theme: Theme;
  onStartExam?: (exam: PendingQuiz) => void;
}

const ExamsList: React.FC<ExamsListProps> = ({ lang, theme, onStartExam }) => {
  const [pendingExams, setPendingExams] = useState<PendingQuiz[]>([]);
  const [history, setHistory] = useState<ExamAttempt[]>([]);
  const [attemptedIds, setAttemptedIds] = useState<number[]>([]);
  const isEn = lang === 'en';

  useEffect(() => {
    const fetchData = async () => {
        try {
            const exams = await api.exams.list();
            // Backend now returns array of exams directly
            setPendingExams(Array.isArray(exams) ? exams : exams?.pending || []);
            
            // Fetch exam attempts for history
            const attempts = await api.attempts.list();
            console.log('Exam attempts fetched:', attempts);
            setHistory(attempts || []);

            // Get attempted exam IDs from API attempts (source of truth)
            // Do NOT rely on localStorage - use actual backend data
            const attemptedExamIds = attempts?.map((attempt: ExamAttempt) => attempt.exam) || [];
            setAttemptedIds(attemptedExamIds);
        } catch (e) {
            console.error('Error fetching exams or attempts:', e);
            setHistory([]);
            setAttemptedIds([]);
        }
    };
    fetchData();
  }, []);

  return (
    <div className="pt-32 sm:pt-40 pb-10 px-4 lg:px-8 max-w-7xl mx-auto min-h-screen">
       <Reveal>
         <div className="mb-8">
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">{isEn ? "My Exams" : "الامتحانات"}</h1>
            <p className="text-slate-500 dark:text-slate-400">{isEn ? "Manage your upcoming quizzes and view past results." : "إدارة اختباراتك القادمة وعرض النتائج السابقة."}</p>
         </div>
       </Reveal>

       {/* Section 1: Pending Exams */}
       <div className="mb-12">
          <Reveal width="100%">
             <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                <Clock className="text-primary" size={24} /> 
                {isEn ? "Available Exams" : "الامتحانات المتاحة"}
             </h2>
          </Reveal>
          
          {pendingExams.length > 0 ? (
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {pendingExams.map((exam, i) => {
                   const isAttempted = attemptedIds.includes(exam.id);

                   return (
                   <Reveal key={exam.id} delay={i * 0.1} width="100%">
                      <Card className={`h-full flex flex-col transition-all duration-300 group ${isAttempted ? 'opacity-70 grayscale' : 'hover:border-primary/50'}`}>
                         <div className="flex justify-between items-start mb-4">
                            <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold">
                               <ClipboardList size={20} />
                            </div>
                            <span className={`text-xs font-bold px-2 py-1 rounded-full border ${isAttempted ? 'bg-slate-100 text-slate-500 border-slate-200' : 'bg-red-100 text-red-600 border-red-200'}`}>
                               {isAttempted ? (isEn ? "Attempted" : "تم الاختبار") : (isEn ? "Pending" : "معلق")}
                            </span>
                         </div>
                         <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1 group-hover:text-primary transition-colors">{exam.title}</h3>
                         <p className="text-sm text-slate-500 mb-4">{exam.course_title}</p>
                         
                         <div className="space-y-2 mb-6 mt-auto">
                            {exam.due_date && (
                               <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
                                  <Calendar size={14} className="text-slate-400"/> 
                                  <span>{isEn ? "Due:" : "موعد التسليم:"} {new Date(exam.due_date).toLocaleDateString()}</span>
                               </div>
                            )}
                            {exam.duration_minutes && (
                               <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
                                  <Clock size={14} className="text-slate-400"/> 
                                  <span>{exam.duration_minutes || exam.time_limit} {isEn ? "Minutes" : "دقيقة"}</span>
                               </div>
                            )}
                            {exam.question_count && (
                               <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
                                  <HelpCircle size={14} className="text-slate-400"/> 
                                  <span>{exam.question_count} {isEn ? "Questions" : "سؤال"}</span>
                               </div>
                            )}
                         </div>

                         {isAttempted ? (
                            <Button disabled className="w-full justify-between opacity-50 cursor-not-allowed">
                                {isEn ? "Already Taken" : "تم اجتيازه"} <Lock size={18} />
                            </Button>
                         ) : (
                            <Button onClick={() => onStartExam && onStartExam(exam)} className="w-full justify-between group-hover:bg-primary group-hover:text-white">
                                {isEn ? "Start Exam" : "بدء الامتحان"} <ArrowRight size={18} />
                            </Button>
                         )}
                      </Card>
                   </Reveal>
                )})}
             </div>
          ) : (
             <Reveal width="100%">
                <div className="p-8 text-center border border-dashed border-slate-300 dark:border-white/10 rounded-xl bg-slate-50 dark:bg-white/5 text-slate-500">
                   {isEn ? "No exams available at the moment." : "لا توجد امتحانات متاحة حالياً."}
                </div>
             </Reveal>
          )}
       </div>

       {/* Section 2: Exam History */}
       <div>
          <Reveal width="100%">
             <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                <FileText className="text-secondary" size={24} /> 
                {isEn ? "Exam History" : "سجل الامتحانات"}
             </h2>
          </Reveal>

          <Reveal width="100%" delay={0.2}>
             <Card className="!p-0 overflow-hidden">
                {history.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-slate-50 dark:bg-black/20 text-slate-500 dark:text-slate-400 font-bold border-b border-slate-200 dark:border-white/10">
                            <tr>
                                <th className="p-4">{isEn ? "Exam Name" : "الامتحان"}</th>
                                <th className="p-4">{isEn ? "Course" : "الكورس"}</th>
                                <th className="p-4 text-center">{isEn ? "Date" : "التاريخ"}</th>
                                <th className="p-4 text-center">{isEn ? "Score" : "الدرجة"}</th>
                                <th className="p-4 text-center">{isEn ? "Status" : "الحالة"}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                            {history.map((exam) => (
                                <tr key={exam.id} className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                                    <td className="p-4 font-medium text-slate-900 dark:text-white">{exam.exam_title}</td>
                                    <td className="p-4 text-slate-500 dark:text-slate-400">{exam.course_title}</td>
                                    <td className="p-4 text-center text-slate-500 dark:text-slate-400">{exam.taken_at}</td>
                                    <td className="p-4 text-center font-bold text-slate-900 dark:text-white">
                                        {exam.score.toFixed(1)}%
                                    </td>
                                    <td className="p-4 flex justify-center">
                                        {exam.is_passed ? (
                                            <span className="flex items-center gap-1 text-[10px] font-bold bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 px-2 py-1 rounded-full border border-emerald-200 dark:border-emerald-800">
                                                <CheckCircle size={12} /> {isEn ? "Passed" : "ناجح"}
                                            </span>
                                        ) : (
                                            <span className="flex items-center gap-1 text-[10px] font-bold bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 px-2 py-1 rounded-full border border-red-200 dark:border-red-800">
                                                <XCircle size={12} /> {isEn ? "Failed" : "راسب"}
                                            </span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="p-10 text-center text-slate-500">
                     {isEn ? "No past exams found." : "لا يوجد سجل امتحانات سابق."}
                  </div>
                )}
             </Card>
          </Reveal>
       </div>
    </div>
  );
};

export default ExamsList;