import React, { useState, useEffect } from 'react';
import { Lang, Theme, InstructorStudent } from '../../types';
import { api } from '../../api/client';
import { Card, Button, Input } from '../../components/UI';
import { Reveal } from '../../components/Reveal';
import { Search, Mail, Book, Clock, TrendingUp, Hash, UserX, MessageSquare, Send, X, CheckCircle, Award, Upload, Image as ImageIcon, ExternalLink, Calendar } from 'lucide-react';

interface Props { 
    lang: Lang; 
    theme: Theme;
    targetStudentId?: number | null; 
}

const InstructorStudents: React.FC<Props> = ({ lang, theme, targetStudentId }) => {
  const [students, setStudents] = useState<InstructorStudent[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal States
  const [selectedStudent, setSelectedStudent] = useState<InstructorStudent | null>(null);
  const [showProfileModal, setShowProfileModal] = useState(false); // New Profile Modal
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [showCertModal, setShowCertModal] = useState(false);

  // Form States
  const [messageText, setMessageText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [certFile, setCertFile] = useState<File | null>(null);
  const [certCourseTitle, setCertCourseTitle] = useState('');
  const [isSendingCert, setIsSendingCert] = useState(false);
  const [studentEnrolledCourses, setStudentEnrolledCourses] = useState<string[]>([]);

  const isEn = lang === 'en';

  useEffect(() => {
    api.courses.getStudents().then((data) => {
        setStudents(data);
        
        // Auto-open profile if targetStudentId matches
        if (targetStudentId) {
            const target = data.find(s => s.id === targetStudentId);
            if (target) {
                setSelectedStudent(target);
                setShowProfileModal(true);
            }
        }
    });
  }, [targetStudentId]);

  // Filter Logic
  const filteredStudents = students.filter(student => {
    const term = searchTerm.toLowerCase();
    return (
      student.name.toLowerCase().includes(term) ||
      student.id.toString().includes(term) ||
      student.email.toLowerCase().includes(term)
    );
  });

  // --- Handlers ---

  const handleOpenProfile = (student: InstructorStudent) => {
      setSelectedStudent(student);
      setShowProfileModal(true);
      setShowMessageModal(false);
      setShowCertModal(false);
  };

  const handleOpenMessage = (student: InstructorStudent) => {
    setSelectedStudent(student);
    setMessageText('');
    setShowSuccess(false);
    setShowMessageModal(true);
    setShowProfileModal(false);
  };

  const handleOpenCertModal = (student: InstructorStudent) => {
       setSelectedStudent(student);
       setCertCourseTitle('');
       setCertFile(null);
       setShowCertModal(true);
       setShowSuccess(false);
       setShowProfileModal(false); // Close profile if opening from there
       // Set student's enrolled courses
       setStudentEnrolledCourses(student.enrolled_courses || []);
   };

  const closeAllModals = () => {
      setShowProfileModal(false);
      setShowMessageModal(false);
      setShowCertModal(false);
      setSelectedStudent(null);
  };

  const handleSendMessage = async () => {
    if (!messageText.trim() || !selectedStudent) return;
    setIsSending(true);
    try {
      await api.notifications.send(selectedStudent.id, messageText);
      setIsSending(false);
      setShowSuccess(true);
      setTimeout(closeAllModals, 1500);
    } catch (e) {
      console.error(e);
      setIsSending(false);
    }
  };

  const handleSendCertificate = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!selectedStudent || !certFile || !certCourseTitle) return;
      setIsSendingCert(true);
      try {
          await api.instructor?.sendCertificate(selectedStudent.id, certCourseTitle, certFile);
          setIsSendingCert(false);
          setShowSuccess(true);
          setTimeout(closeAllModals, 1500);
      } catch (e) {
          console.error(e);
          setIsSendingCert(false);
      }
  };

  return (
    <div className="pt-32 sm:pt-40 pb-10 px-4 lg:px-8 max-w-7xl mx-auto min-h-screen relative">
      <Reveal>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
           <div>
             <h1 className="text-3xl font-bold text-slate-900 dark:text-white">{isEn ? "My Students" : "طلابي"}</h1>
             <p className="text-slate-500 dark:text-slate-400 mt-1">{isEn ? "Track student progress and performance" : "تتبع تقدم الطلاب وأدائهم"}</p>
           </div>
           
           <div className="relative w-full sm:w-auto">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  type="text" 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder={isEn ? "Search by Name or ID..." : "بحث بالاسم أو المعرف..."}
                  className="w-full sm:w-72 bg-white dark:bg-black/60 border border-slate-200 dark:border-white/10 rounded-xl py-2 pl-10 pr-4 outline-none focus:border-primary text-slate-900 dark:text-white transition-all shadow-sm focus:shadow-md"
                />
            </div>
        </div>
      </Reveal>

      <div className="grid grid-cols-1 gap-4">
          {filteredStudents.length > 0 ? (
            filteredStudents.map((student, i) => (
             <Reveal key={student.id} delay={i * 0.1} width="100%">
                <Card 
                    className="!p-4 flex flex-col md:flex-row items-start md:items-center gap-6 hover:border-primary/50 transition-colors group cursor-pointer"
                    onClick={() => handleOpenProfile(student)}
                >
                   {/* Avatar */}
                   <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-emerald-600 flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-primary/20 shrink-0 relative">
                      {student.name.charAt(0)}
                      <div className="absolute -bottom-1 -right-1 bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-[9px] font-bold px-1.5 py-0.5 rounded-full border border-white dark:border-slate-900 shadow-sm">
                        #{student.id}
                      </div>
                   </div>
                   
                   {/* Info */}
                   <div className="flex-1 min-w-0 grid grid-cols-1 md:grid-cols-4 gap-4 w-full">
                       <div className="col-span-1">
                          <div className="flex items-center gap-2">
                             <h3 className="font-bold text-slate-900 dark:text-white truncate group-hover:text-primary transition-colors">{student.name}</h3>
                          </div>
                          <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400 mt-1">
                             <Mail size={12} /> {student.email}
                          </div>
                       </div>
                       
                       <div className="col-span-1">
                          <div className="text-xs text-slate-500 uppercase font-bold mb-1 flex items-center gap-1"><Book size={12}/> {isEn ? "Courses" : "الكورسات"}</div>
                          <div className="flex flex-wrap gap-1">
                              {student.enrolled_courses.slice(0, 2).map((c, idx) => (
                                <span key={idx} className="bg-slate-100 dark:bg-white/10 px-2 py-0.5 rounded text-[10px] text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-white/5">{c}</span>
                              ))}
                              {student.enrolled_courses.length > 2 && <span className="text-[10px] text-slate-400">+{student.enrolled_courses.length - 2}</span>}
                          </div>
                       </div>

                       <div className="col-span-1">
                          <div className="text-xs text-slate-500 uppercase font-bold mb-1 flex items-center gap-1"><TrendingUp size={12}/> {isEn ? "Progress" : "التقدم"}</div>
                          <div className="flex items-center gap-2">
                             <div className="flex-1 h-2 bg-slate-100 dark:bg-white/10 rounded-full overflow-hidden">
                                <div className="h-full bg-primary rounded-full" style={{ width: `${student.progress_avg}%` }}></div>
                             </div>
                             <span className="text-xs font-bold text-slate-700 dark:text-white">{student.progress_avg}%</span>
                          </div>
                       </div>

                       <div className="col-span-1 flex flex-col items-end justify-center gap-2">
                           <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                              <Clock size={12} /> {student.last_active}
                           </div>
                           
                           {/* Actions */}
                           <div className="flex gap-2">
                               <button 
                                 onClick={(e) => { e.stopPropagation(); handleOpenCertModal(student); }}
                                 className="flex items-center gap-1 bg-amber-100 dark:bg-amber-900/30 hover:bg-amber-500 hover:text-white text-amber-600 dark:text-amber-400 px-3 py-1.5 rounded-lg text-xs font-bold transition-all"
                                 title={isEn ? "Send Certificate" : "إرسال شهادة"}
                               >
                                 <Award size={14} />
                               </button>

                               <button 
                                 onClick={(e) => { e.stopPropagation(); handleOpenMessage(student); }}
                                 className="flex items-center gap-1 bg-slate-100 dark:bg-white/10 hover:bg-primary hover:text-white text-slate-600 dark:text-slate-300 px-3 py-1.5 rounded-lg text-xs font-bold transition-all"
                               >
                                 <MessageSquare size={14} />
                               </button>
                           </div>
                       </div>
                   </div>
                </Card>
             </Reveal>
            ))
          ) : (
            <Reveal width="100%">
               <div className="flex flex-col items-center justify-center py-20 text-slate-400 opacity-60">
                   <UserX size={48} className="mb-2"/>
                   <p>{isEn ? "No students found matching your search." : "لا يوجد طلاب مطابقين لبحثك."}</p>
               </div>
            </Reveal>
          )}
      </div>

      {/* ------------------- STUDENT PROFILE MODAL ------------------- */}
      {showProfileModal && selectedStudent && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center px-4">
              <div className="absolute inset-0 bg-black/70 backdrop-blur-md transition-opacity" onClick={closeAllModals}></div>
              
              <div className="relative z-10 w-full max-w-2xl bg-white dark:bg-black rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in duration-200 border border-slate-200 dark:border-white/10 flex flex-col max-h-[90vh]">
                  
                  {/* Header */}
                  <div className="relative h-24 bg-gradient-to-r from-primary to-emerald-800">
                     <button onClick={closeAllModals} className="absolute top-4 right-4 text-white/80 hover:text-white bg-black/20 rounded-full p-1"><X size={20}/></button>
                     <div className="absolute -bottom-10 left-6 flex items-end">
                         <div className="w-20 h-20 rounded-full bg-white dark:bg-black p-1 shadow-lg">
                             <div className="w-full h-full rounded-full bg-gradient-to-tr from-primary to-emerald-400 flex items-center justify-center text-white font-bold text-3xl">
                                 {selectedStudent.name.charAt(0)}
                             </div>
                         </div>
                     </div>
                  </div>

                  <div className="pt-12 px-6 pb-6 overflow-y-auto custom-scrollbar">
                       <div className="flex justify-between items-start mb-6">
                           <div>
                               <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{selectedStudent.name}</h2>
                               <div className="flex items-center gap-3 text-sm text-slate-500 dark:text-slate-400 mt-1">
                                   <span className="flex items-center gap-1"><Hash size={12}/> ID: {selectedStudent.id}</span>
                                   <span className="flex items-center gap-1"><Calendar size={12}/> Joined {selectedStudent.join_date}</span>
                               </div>
                           </div>
                           <div className="flex gap-2">
                               <Button onClick={() => handleOpenCertModal(selectedStudent)} className="!py-2 !px-4 text-xs">
                                   <Award size={16} /> {isEn ? "Issue Certificate" : "إصدار شهادة"}
                               </Button>
                               <Button variant="outline" onClick={() => handleOpenMessage(selectedStudent)} className="!py-2 !px-4 text-xs">
                                   <MessageSquare size={16} />
                               </Button>
                           </div>
                       </div>

                       {/* Stats Grid */}
                       <div className="grid grid-cols-3 gap-4 mb-8">
                           <div className="bg-slate-50 dark:bg-black/20 p-4 rounded-xl border border-slate-100 dark:border-white/5 text-center">
                               <div className="text-2xl font-bold text-slate-900 dark:text-white">{selectedStudent.enrolled_courses.length}</div>
                               <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">{isEn ? "Courses" : "الكورسات"}</div>
                           </div>
                           <div className="bg-slate-50 dark:bg-black/20 p-4 rounded-xl border border-slate-100 dark:border-white/5 text-center">
                               <div className="text-2xl font-bold text-emerald-500">{selectedStudent.progress_avg}%</div>
                               <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">{isEn ? "Avg Progress" : "متوسط التقدم"}</div>
                           </div>
                           <div className="bg-slate-50 dark:bg-black/20 p-4 rounded-xl border border-slate-100 dark:border-white/5 text-center">
                               <div className="text-2xl font-bold text-slate-900 dark:text-white">${selectedStudent.total_spent}</div>
                               <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">{isEn ? "LTV" : "القيمة"}</div>
                           </div>
                       </div>

                       {/* Detailed Course Progress */}
                       <h3 className="font-bold text-slate-900 dark:text-white mb-4 border-b border-slate-200 dark:border-white/10 pb-2">
                           {isEn ? "Course Details" : "تفاصيل الكورسات"}
                       </h3>
                       <div className="space-y-3">
                           {selectedStudent.enrolled_courses.map((courseName, idx) => (
                               <div key={idx} className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-white/5 border border-transparent hover:border-slate-200 dark:hover:border-white/5 transition-colors">
                                   <div className="flex items-center gap-3">
                                       <div className="w-10 h-10 rounded-lg bg-slate-200 dark:bg-white/10 flex items-center justify-center">
                                           <Book size={18} className="text-slate-500 dark:text-slate-400"/>
                                       </div>
                                       <div>
                                           <h4 className="font-bold text-sm text-slate-900 dark:text-white">{courseName}</h4>
                                           <p className="text-xs text-slate-500">Enrolled recently</p>
                                       </div>
                                   </div>
                                   {/* Mock Progress Bars based on the avg just for visual */}
                                   <div className="w-24 text-right">
                                       <div className="text-xs font-bold text-primary mb-1">
                                          {selectedStudent.progress_avg > 80 ? "Completed" : `${selectedStudent.progress_avg}%`}
                                       </div>
                                       <div className="h-1.5 w-full bg-slate-200 dark:bg-white/10 rounded-full overflow-hidden">
                                           <div className="h-full bg-primary" style={{ width: `${selectedStudent.progress_avg}%` }}></div>
                                       </div>
                                   </div>
                               </div>
                           ))}
                       </div>
                  </div>
              </div>
          </div>
      )}

      {/* Message Modal */}
      {showMessageModal && selectedStudent && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center px-4">
           <div className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" onClick={closeAllModals}></div>
           <Card className="w-full max-w-lg relative z-10 !p-0 shadow-2xl animate-in zoom-in duration-200">
              <div className="p-4 border-b border-slate-200 dark:border-white/10 flex justify-between items-center bg-slate-50 dark:bg-white/5">
                 <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white font-bold">
                       {selectedStudent.name.charAt(0)}
                    </div>
                    <div>
                       <h3 className="font-bold text-slate-900 dark:text-white text-sm">{isEn ? "Message to" : "رسالة إلى"} {selectedStudent.name}</h3>
                    </div>
                 </div>
                 <button onClick={closeAllModals} className="text-slate-400 hover:text-red-500 transition-colors"><X size={20} /></button>
              </div>
              <div className="p-6">
                 {showSuccess ? (
                   <div className="flex flex-col items-center justify-center py-8 text-emerald-500 animate-in fade-in slide-in-from-bottom-4">
                      <CheckCircle size={48} className="mb-4" />
                      <h4 className="font-bold text-lg">{isEn ? "Message Sent!" : "تم الإرسال!"}</h4>
                   </div>
                 ) : (
                   <>
                     <textarea 
                       value={messageText}
                       onChange={(e) => setMessageText(e.target.value)}
                       placeholder={isEn ? "Write your message here..." : "اكتب رسالتك هنا..."}
                       className="w-full h-32 bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-xl p-4 resize-none focus:outline-none focus:border-primary text-slate-900 dark:text-white placeholder:text-slate-400"
                       autoFocus
                     />
                     <div className="flex justify-end mt-4">
                        <Button onClick={handleSendMessage} disabled={!messageText.trim()} isLoading={isSending}>
                           <Send size={16} /> {isEn ? "Send" : "إرسال"}
                        </Button>
                     </div>
                   </>
                 )}
              </div>
           </Card>
        </div>
      )}

      {/* Certificate Upload Modal */}
      {showCertModal && selectedStudent && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center px-4">
              <div className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" onClick={closeAllModals}></div>
              
              <Card className="w-full max-w-lg relative z-10 !p-0 shadow-2xl animate-in zoom-in duration-200">
                  <div className="p-4 border-b border-slate-200 dark:border-white/10 flex justify-between items-center bg-slate-50 dark:bg-white/5">
                      <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-amber-500 flex items-center justify-center text-white font-bold">
                              <Award size={18} />
                          </div>
                          <div>
                              <h3 className="font-bold text-slate-900 dark:text-white text-sm">{isEn ? "Send Certificate" : "إرسال شهادة"}</h3>
                              <span className="text-[10px] text-slate-500">{isEn ? "To:" : "إلى:"} {selectedStudent.name}</span>
                          </div>
                      </div>
                      <button onClick={closeAllModals} className="text-slate-400 hover:text-red-500 transition-colors"><X size={20} /></button>
                  </div>

                  <div className="p-6">
                      {showSuccess ? (
                          <div className="flex flex-col items-center justify-center py-8 text-emerald-500 animate-in fade-in slide-in-from-bottom-4">
                              <CheckCircle size={48} className="mb-4" />
                              <h4 className="font-bold text-lg">{isEn ? "Certificate Sent!" : "تم إرسال الشهادة!"}</h4>
                          </div>
                      ) : (
                          <form onSubmit={handleSendCertificate} className="space-y-4">
                              <div>
                                  <label className="block text-sm font-bold text-slate-900 dark:text-white mb-2">
                                      {isEn ? "Select Course" : "اختر الكورس"} <span className="text-red-500">*</span>
                                  </label>
                                  {studentEnrolledCourses.length === 0 ? (
                                      <div className="p-3 bg-yellow-50 dark:bg-yellow-500/10 border border-yellow-200 dark:border-yellow-500/30 rounded-lg text-yellow-700 dark:text-yellow-500 text-sm">
                                          {isEn ? "This student is not enrolled in any courses" : "هذا الطالب غير مسجل في أي كورسات"}
                                      </div>
                                  ) : (
                                      <select
                                          value={certCourseTitle}
                                          onChange={(e) => setCertCourseTitle(e.target.value)}
                                          className="w-full bg-white dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-lg px-4 py-3 text-slate-900 dark:text-white focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                                          required
                                      >
                                          <option value="">{isEn ? "Select a course..." : "اختر كورس..."}</option>
                                          {studentEnrolledCourses.map((course, idx) => (
                                              <option key={idx} value={course}>
                                                  {course}
                                              </option>
                                          ))}
                                      </select>
                                  )}
                              </div>
                              
                              <div>
                                  <label className="text-slate-800 dark:text-slate-300 text-sm font-bold mb-2 block">
                                      {isEn ? "Upload Certificate Image" : "رفع صورة الشهادة"}
                                  </label>
                                  {/* The input below opens the file picker on the instructor's device */}
                                  <div className="relative border-2 border-dashed border-slate-300 dark:border-white/10 rounded-xl p-6 flex flex-col items-center justify-center bg-slate-50 dark:bg-black/20 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors cursor-pointer group">
                                      <input 
                                          type="file" 
                                          accept="image/*"
                                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
                                          onChange={(e) => setCertFile(e.target.files ? e.target.files[0] : null)}
                                          required
                                      />
                                      {certFile ? (
                                          <div className="text-center relative z-10">
                                              <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mx-auto mb-2 text-emerald-600 dark:text-emerald-400">
                                                <ImageIcon size={24} />
                                              </div>
                                              <span className="text-sm font-bold text-slate-700 dark:text-white block">{certFile.name}</span>
                                              <span className="text-[10px] text-emerald-500 font-bold">{isEn ? "Click to change" : "اضغط للتغيير"}</span>
                                          </div>
                                      ) : (
                                          <div className="text-center text-slate-500 relative z-10">
                                              <Upload size={32} className="mx-auto mb-2 opacity-50 group-hover:scale-110 transition-transform"/>
                                              <span className="text-xs font-bold block">{isEn ? "Click here to upload image" : "اضغط هنا لرفع الصورة"}</span>
                                              <span className="text-[10px] opacity-70">(JPG, PNG)</span>
                                          </div>
                                      )}
                                  </div>
                              </div>

                              <div className="flex justify-end mt-6">
                                  <Button type="submit" disabled={!certCourseTitle || !certFile} isLoading={isSendingCert} className="w-full">
                                      <Send size={16} /> {isEn ? "Send Certificate" : "إرسال"}
                                  </Button>
                              </div>
                          </form>
                      )}
                  </div>
              </Card>
          </div>
      )}

    </div>
  );
};

export default InstructorStudents;
