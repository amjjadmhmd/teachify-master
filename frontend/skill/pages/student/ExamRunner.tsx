
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Lang, PendingQuiz, ExamResult, User, Question } from '../../types';
import { api } from '../../api/client';
import { Button, Card } from '../../components/UI';
import { Clock, ShieldAlert, Award, ArrowRight, Home, CheckCircle, Target } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface ExamRunnerProps {
  exam: PendingQuiz;
  lang: Lang;
  onExit: () => void;
}

const ExamRunner: React.FC<ExamRunnerProps> = ({ exam, lang, onExit }) => {
  const { user } = useAuth();
  const isEn = lang === 'en';
  const [timeLeft, setTimeLeft] = useState(exam.duration_minutes * 60);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<ExamResult | null>(null);
  const [certRequested, setCertRequested] = useState(false);
  
  // Transform questions once on mount
  const transformQuestions = (qs: Question[]) => {
    return (Array.isArray(qs) ? qs : []).map(q => ({
        ...q,
        id: q.id,
        text: q.text || q.question_text || "",
        options: [q.option_a || "", q.option_b || "", q.option_c || "", q.option_d || ""].filter(opt => opt.trim() !== ""),
        correctAnswer: q.correctAnswer || q.correct_option
    }));
  };

  const [dynamicQuestions, setDynamicQuestions] = useState<Question[]>(
    exam.questions ? transformQuestions(exam.questions) : []
  );
  const [loadingQuestions, setLoadingQuestions] = useState(!exam.questions || exam.questions.length === 0);

  useEffect(() => {
    if (loadingQuestions && exam.id) {
        api.exams.getQuestions(exam.id).then(qs => {
            const transformedQuestions = transformQuestions(qs);
            console.log("Transformed questions:", transformedQuestions);
            setDynamicQuestions(transformedQuestions);
            setLoadingQuestions(false);
        }).catch(err => {
            console.error("Error fetching questions:", err);
            // If fetching fails, try to use exam.questions
            if (exam.questions && exam.questions.length > 0) {
                setDynamicQuestions(transformQuestions(exam.questions));
            } else {
                setDynamicQuestions([]);
            }
            setLoadingQuestions(false);
        });
    } else if (!loadingQuestions && dynamicQuestions.length === 0 && exam.questions) {
        // If questions are available in exam object but not yet transformed
        setDynamicQuestions(transformQuestions(exam.questions));
    }
  }, [exam.id, loadingQuestions]);

  const submitExam = useCallback(async (forced = false) => {
    if (isSubmitting || result || !user) return;
    setIsSubmitting(true);

    try {
        // Convert answers from { [questionId]: option } to [{ question: id, selected_option: option }]
        const formattedAnswers = Object.entries(answers).map(([qId, selectedOption]) => ({
            question: parseInt(qId),
            selected_option: selectedOption
        }));

        const res = await api.exams.submit(exam.id, { answers: formattedAnswers });
        setResult(res);
        
        const attempted = JSON.parse(localStorage.getItem('attempted_exams') || '[]');
        localStorage.setItem('attempted_exams', JSON.stringify([...attempted, exam.id]));
        
    } catch (e) {
        console.error("Submission failed", e);
    } finally {
        setIsSubmitting(false);
    }
  }, [answers, exam, isSubmitting, result, user]);

  useEffect(() => {
    const handleVisibilityChange = () => {
        if (document.hidden && !result) {
            submitExam(true);
            alert(isEn ? "Exam submitted because you left the page." : "تم تسليم الامتحان لأنك غادرت الصفحة.");
        }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [submitExam, isEn, result]);

  useEffect(() => {
    if (result || loadingQuestions) return;
    const timer = setInterval(() => {
        setTimeLeft(prev => {
            if (prev <= 1) {
                clearInterval(timer);
                submitExam(true);
                return 0;
            }
            return prev - 1;
        });
    }, 1000);
    return () => clearInterval(timer);
  }, [submitExam, result, loadingQuestions]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const handleOptionSelect = (qId: number, option: string) => {
      setAnswers(prev => ({ ...prev, [qId]: option }));
  };

  // Certificate is now manually issued by instructor - no request button

  if (loadingQuestions) return <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white">Loading Security Protocol...</div>;

  if (result) {
      return (
          <div className="min-h-screen flex items-center justify-center p-4 bg-slate-900">
              <Card className="w-full max-w-lg text-center !p-10 animate-in zoom-in duration-500 shadow-neon">
                  <div className={`w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg ${result.is_passed ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'}`}>
                      {result.is_passed ? <Award size={56} /> : <ShieldAlert size={56} />}
                  </div>
                  
                  <h2 className="text-4xl font-bold text-white mb-2">
                      {result.is_passed ? (isEn ? "Congratulations!" : "تهانينا!") : (isEn ? "Keep Trying" : "حظ أوفر")}
                  </h2>
                  
                  <div className="bg-white/5 rounded-2xl p-6 my-8 border border-white/10">
                      <div className="text-xs text-slate-400 uppercase font-bold mb-2 tracking-widest">{isEn ? "Your Official Score" : "درجتك النهائية"}</div>
                      <div className="text-5xl font-mono font-bold text-primary mb-2">
                         {result.earned_points} / {result.total_points}
                      </div>
                      <div className="text-sm font-bold text-slate-300">
                          {isEn ? `You achieved ${result.score}% accuracy` : `لقد حققت دقة بنسبة ${result.score}%`}
                      </div>
                  </div>

                  <div className="space-y-4">
                      {result.is_passed && (
                          <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-xl text-blue-400 text-sm text-center">
                            {isEn 
                              ? "✓ Passed! Your instructor will issue a certificate." 
                              : "✓ نجحت! سيقوم المعلم بإصدار شهادة."}
                          </div>
                      )}
                      
                      <Button onClick={onExit} variant="outline" className="w-full border-white/20 text-white hover:bg-white/10">
                          <Home size={18} /> {isEn ? "Back to Exams" : "العودة لقائمة الامتحانات"}
                      </Button>
                  </div>
              </Card>
          </div>
      );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col no-select">
       
       <div className="bg-black/50 backdrop-blur-md p-4 flex justify-between items-center border-b border-white/10 sticky top-0 z-50">
           <div className="flex items-center gap-3">
               <ShieldAlert className="text-primary animate-pulse" size={24} />
               <div>
                  <h4 className="font-bold text-sm leading-none">{exam.title}</h4>
                  <span className="text-[10px] text-slate-500 uppercase font-bold">{isEn ? "Point-Based Grading" : "تصحيح معتمد على النقاط"}</span>
               </div>
           </div>
           <div className={`text-2xl font-mono font-bold ${timeLeft < 300 ? 'text-red-500 animate-pulse' : 'text-primary'}`}>
               {formatTime(timeLeft)}
           </div>
       </div>

       <div className="flex-1 max-w-4xl mx-auto w-full p-6 flex flex-col justify-center">
           <div className="mb-8 flex items-center justify-between">
               <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-500 uppercase">{isEn ? "Question" : "سؤال"} {currentQuestion + 1}/{dynamicQuestions.length}</span>
                  <div className="bg-primary/20 text-primary px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1">
                      <Target size={10}/> {dynamicQuestions[currentQuestion]?.points || 0} pts
                  </div>
               </div>
               <div className="w-48 h-1.5 bg-white/5 rounded-full overflow-hidden">
                   <div className="h-full bg-primary transition-all duration-300 shadow-[0_0_10px_#4BC594]" style={{ width: `${((currentQuestion + 1) / dynamicQuestions.length) * 100}%` }}></div>
               </div>
           </div>

           <Card className="!p-10 mb-8 !bg-white/5 border-white/10">
               <h3 className="text-2xl md:text-3xl font-bold leading-relaxed mb-10 text-white">
                   {dynamicQuestions[currentQuestion]?.text || "Loading question..."}
               </h3>
               
               <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                   {(dynamicQuestions[currentQuestion]?.options || []).map((opt, i) => (
                       <button
                         key={i}
                         onClick={() => handleOptionSelect(dynamicQuestions[currentQuestion].id, opt)}
                         className={`w-full p-6 rounded-2xl border-2 text-left transition-all flex items-center justify-between group ${
                             answers[dynamicQuestions[currentQuestion].id] === opt 
                             ? 'border-primary bg-primary/10 text-primary shadow-lg shadow-primary/20' 
                             : 'border-white/5 bg-white/5 hover:border-white/20 text-slate-400 hover:text-white'
                         }`}
                       >
                           <span className="flex-1 font-bold">{opt}</span>
                           <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 ml-4 ${answers[dynamicQuestions[currentQuestion].id] === opt ? 'border-primary bg-primary text-white' : 'border-white/20'}`}>
                               {answers[dynamicQuestions[currentQuestion].id] === opt && <CheckCircle size={14} />}
                           </div>
                       </button>
                   ))}
               </div>
           </Card>

           <div className="flex justify-between items-center">
               <Button variant="outline" className="border-white/10 text-white" disabled={currentQuestion === 0} onClick={() => setCurrentQuestion(p => p - 1)}>
                   {isEn ? "Previous" : "السابق"}
               </Button>
               
               {currentQuestion < dynamicQuestions.length - 1 ? (
                   <Button onClick={() => setCurrentQuestion(p => p + 1)}>
                       {isEn ? "Next" : "التالي"} <ArrowRight size={18} />
                   </Button>
               ) : (
                   <Button onClick={() => submitExam()} isLoading={isSubmitting} className="!bg-emerald-500 !px-10">
                       {isEn ? "Final Submission" : "تسليم الامتحان"}
                   </Button>
               )}
           </div>
       </div>
    </div>
  );
};

export default ExamRunner;
