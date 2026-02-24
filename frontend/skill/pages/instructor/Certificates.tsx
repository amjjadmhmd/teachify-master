import React, { useRef, useState, useEffect } from "react";
import { Lang, Theme } from "../../types";
import { api } from "../../api/client";
import { Button, Card, Input } from "../../components/UI";
import { Reveal } from "../../components/Reveal";
import Certificate from "../../components/Certificate";
import {
  Download,
  Printer,
  Award,
  Image,
  FileText,
  ChevronDown,
  Plus,
  X,
  CheckCircle,
  Search,
  Filter,
  AlertCircle,
} from "lucide-react";

interface InstructorCertificateForm {
  recipientName: string;
  courseName: string;
  completionDate: string;
  instructorName: string;
}

interface CertificateDesign {
  colorScheme: 'blue' | 'green' | 'purple' | 'gold';
  fontSize: 'small' | 'medium' | 'large';
  borderStyle: 'double' | 'solid' | 'dashed';
  showLogo: boolean;
  showWatermark: boolean;
}

interface InstructorStudent {
  id: number;
  name: string;
  email: string;
  enrolled_courses: string[];
  progress_avg: number;
  last_active: string;
}

interface Props {
  lang: Lang;
  theme: Theme;
}

const InstructorCertificates: React.FC<Props> = ({ lang, theme }) => {
  const certificateRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [students, setStudents] = useState<InstructorStudent[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<InstructorStudent[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<InstructorStudent | null>(null);
  const [showCertificateGenerator, setShowCertificateGenerator] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [instructorName, setInstructorName] = useState("");
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [showDesignPanel, setShowDesignPanel] = useState(false);
  const [showDownloadMenu, setShowDownloadMenu] = useState(false);
  const [design, setDesign] = useState<CertificateDesign>({
    colorScheme: 'blue',
    fontSize: 'medium',
    borderStyle: 'double',
    showLogo: true,
    showWatermark: true,
  });

  const [formData, setFormData] = useState<InstructorCertificateForm>({
    recipientName: "",
    courseName: "",
    completionDate: new Date().toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }),
    instructorName: "",
  });

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3000);
  };

  const isEn = lang === "en";

  const certificateId = `TCH-${Date.now().toString(36).toUpperCase()}-${Math.random()
    .toString(36)
    .substring(2, 6)
    .toUpperCase()}`;

  // Fetch students on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await api.courses.getStudents();
        setStudents(data);
        setFilteredStudents(data);
      } catch (error) {
        console.error("Error fetching students:", error);
        showNotification('error', isEn ? "Failed to load students" : "فشل تحميل الطلاب");
      }
    };
    fetchData();
  }, [isEn]);

  // Get instructor name from localStorage or API
  useEffect(() => {
    const name = localStorage.getItem("instructor_name") || "Instructor";
    setInstructorName(name);
    setFormData(prev => ({ ...prev, instructorName: name }));
  }, []);

  // Filter students based on search term
  useEffect(() => {
    const term = searchTerm.toLowerCase();
    const filtered = students.filter(
      student =>
        student.name.toLowerCase().includes(term) ||
        student.email.toLowerCase().includes(term)
    );
    setFilteredStudents(filtered);
  }, [searchTerm, students]);

  const handleSelectStudent = (student: InstructorStudent) => {
    setSelectedStudent(student);
    setFormData(prev => ({
      ...prev,
      recipientName: student.name,
      courseName: student.enrolled_courses[0] || "",
    }));
    setShowCertificateGenerator(true);
  };

  const handleSaveAsImage = async () => {
    if (!certificateRef.current) return;

    setShowDownloadMenu(false);
    setIsExporting(true);
    try {
      // Dynamically import html2canvas
      const html2canvas = (await import("html2canvas")).default;
      const canvas = await html2canvas(certificateRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
      });

      const link = document.createElement("a");
      const fileSafeRecipient = (formData.recipientName || "student").replace(/\s+/g, "-");
      link.download = `Teachify-Certificate-${fileSafeRecipient}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();

      showNotification('success', isEn ? "Certificate saved as image!" : "تم حفظ الشهادة كصورة!");
      setShowSuccessModal(true);
      setTimeout(() => {
        setShowSuccessModal(false);
        closeGenerator();
      }, 2000);
    } catch (error) {
      console.error("Error saving image:", error);
      showNotification('error', isEn ? "Failed to save image. Please try the print option." : "فشل حفظ الصورة. حاول خيار الطباعة.");
    } finally {
      setIsExporting(false);
    }
  };

  const handleSaveAsPDF = async () => {
    if (!certificateRef.current) return;

    setShowDownloadMenu(false);
    setIsExporting(true);
    try {
      // Dynamically import required libraries
      const html2canvas = (await import("html2canvas")).default;
      const jsPDF = (await import("jspdf")).jsPDF;

      const canvas = await html2canvas(certificateRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
      });

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({
        orientation: "landscape",
        unit: "px",
        format: [canvas.width, canvas.height],
      });

      pdf.addImage(imgData, "PNG", 0, 0, canvas.width, canvas.height);
      const fileSafeRecipient = (formData.recipientName || "student").replace(/\s+/g, "-");
      pdf.save(`Teachify-Certificate-${fileSafeRecipient}.pdf`);

      showNotification('success', isEn ? "Certificate saved as PDF!" : "تم حفظ الشهادة كـ PDF!");
      setShowSuccessModal(true);
      setTimeout(() => {
        setShowSuccessModal(false);
        closeGenerator();
      }, 2000);
    } catch (error) {
      console.error("Error saving PDF:", error);
      showNotification('error', isEn ? "Failed to save PDF. Please try the print option." : "فشل حفظ PDF. حاول خيار الطباعة.");
    } finally {
      setIsExporting(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleInputChange = (field: keyof InstructorCertificateForm, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const closeGenerator = () => {
    setShowDownloadMenu(false);
    setShowCertificateGenerator(false);
    setSelectedStudent(null);
    setFormData({
      recipientName: "",
      courseName: "",
      completionDate: new Date().toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      }),
      instructorName: instructorName,
    });
  };

  return (
    <div className="pb-10 pt-32 sm:pt-40 px-4 lg:px-8 max-w-7xl mx-auto min-h-screen">
      <Reveal>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
              {isEn ? "Certificate Generator" : "مولد الشهادات"}
            </h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1">
              {isEn ? "Create and export certificates for your students" : "إنشاء وتصدير الشهادات لطلابك"}
            </p>
          </div>
          <div className="flex gap-2">
            <Button 
              onClick={() => setShowCertificateGenerator(true)}
              className="shadow-neon"
            >
              <Plus size={18} /> {isEn ? "Create Certificate" : "إنشاء شهادة"}
            </Button>
          </div>
        </div>
      </Reveal>

      {/* Students Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Students List */}
        <div className="lg:col-span-1">
          <Card className="!p-0 overflow-hidden flex flex-col h-full">
            <div className="p-4 border-b border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-black/20">
              <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-4">
                <Search size={16} /> {isEn ? "Select Student" : "اختر طالب"}
              </h3>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder={isEn ? "Search students..." : "ابحث عن الطلاب..."}
                  className="w-full bg-white dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-lg pl-10 pr-4 py-2 text-sm outline-none focus:border-primary text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar">
              {filteredStudents.length > 0 ? (
                filteredStudents.map((student, idx) => (
                  <Reveal key={student.id} delay={idx * 0.05} width="100%">
                    <button
                      onClick={() => handleSelectStudent(student)}
                      className={`w-full text-left p-4 border-b border-slate-100 dark:border-white/5 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors ${
                        selectedStudent?.id === student.id
                          ? "bg-primary/10 border-primary/50"
                          : ""
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-xs">
                          {student.name.charAt(0)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-sm text-slate-900 dark:text-white truncate">
                            {student.name}
                          </h4>
                          <p className="text-[10px] text-slate-500 truncate">{student.email}</p>
                          <div className="flex items-center gap-1 mt-1 text-[9px] text-slate-400">
                            <span>{student.enrolled_courses.length} courses</span>
                          </div>
                        </div>
                      </div>
                    </button>
                  </Reveal>
                ))
              ) : (
                <div className="p-8 text-center text-slate-400">
                  <p className="text-sm">{isEn ? "No students found" : "لم يتم العثور على طلاب"}</p>
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Certificate Generator/Preview */}
        <div className="lg:col-span-2">
          {showCertificateGenerator ? (
            <Reveal width="100%">
              <Card className="!p-6">
                <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
                  <h2 className="font-display text-xl font-semibold text-foreground">
                    {isEn ? "Certificate Preview" : "معاينة الشهادة"}
                  </h2>
                  <div className="flex gap-2 flex-wrap">
                    <Button
                      variant={showDesignPanel ? "default" : "outline"}
                      size="sm"
                      onClick={() => setShowDesignPanel(!showDesignPanel)}
                      className="gap-2"
                    >
                      <Filter className="w-4 h-4" />
                      {isEn ? "Design" : "التصميم"}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handlePrint}
                      className="gap-2"
                    >
                      <Printer className="w-4 h-4" />
                      {isEn ? "Print" : "طباعة"}
                    </Button>
                    <div className="relative">
                      <Button 
                        size="sm" 
                        className="gap-2" 
                        type="button"
                        onClick={() => setShowDownloadMenu((prev) => !prev)}
                        disabled={isExporting}
                      >
                        <Download className="w-4 h-4" />
                        {isExporting ? (isEn ? "Exporting..." : "جاري التصدير...") : (isEn ? "Download" : "تحميل")}
                        <ChevronDown className="w-3 h-3" />
                      </Button>
                      {showDownloadMenu && (
                      <div className="absolute right-0 top-full mt-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-lg shadow-lg z-50 min-w-[180px]">
                        <button
                          onClick={handleSaveAsImage}
                          disabled={isExporting}
                          className="w-full text-left px-4 py-3 hover:bg-slate-100 dark:hover:bg-white/5 flex items-center gap-2 text-sm font-medium text-slate-900 dark:text-white border-b border-slate-100 dark:border-white/5 first:rounded-t-lg"
                        >
                          <Image className="w-4 h-4" />
                          {isEn ? "Save as Image (PNG)" : "حفظ كصورة"}
                        </button>
                        <button
                          onClick={handleSaveAsPDF}
                          disabled={isExporting}
                          className="w-full text-left px-4 py-3 hover:bg-slate-100 dark:hover:bg-white/5 flex items-center gap-2 text-sm font-medium text-slate-900 dark:text-white last:rounded-b-lg"
                        >
                          <FileText className="w-4 h-4" />
                          {isEn ? "Save as PDF" : "حفظ كـ PDF"}
                        </button>
                      </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Certificate */}
                <div className="flex justify-center mb-6">
                  <Certificate
                    ref={certificateRef}
                    recipientName={
                      formData.recipientName ||
                      (isEn ? "Student Name" : "اسم الطالب")
                    }
                    courseName={
                      formData.courseName || (isEn ? "Course Name" : "اسم الكورس")
                    }
                    completionDate={formData.completionDate}
                    certificateId={certificateId}
                    instructorName={formData.instructorName}
                    design={design}
                  />
                </div>
              </Card>
            </Reveal>
          ) : (
            <Reveal width="100%">
              <Card className="!p-12 flex flex-col items-center justify-center min-h-[500px] text-center">
                <Award size={64} className="text-slate-300 dark:text-slate-700 mb-4" />
                <h3 className="text-lg font-bold text-slate-500 dark:text-slate-400 mb-2">
                  {isEn ? "No Certificate Selected" : "لم تختر شهادة"}
                </h3>
                <p className="text-sm text-slate-400 dark:text-slate-500 max-w-xs">
                  {isEn
                    ? "Select a student from the list or create a new certificate to get started"
                    : "اختر طالبًا من القائمة أو أنشئ شهادة جديدة للبدء"}
                </p>
              </Card>
            </Reveal>
          )}
        </div>
      </div>

      {/* Certificate Details Panel */}
      {showCertificateGenerator && (
        <Reveal width="100%" delay={0.2}>
          <Card className="!p-6 mt-8">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-display text-xl font-semibold text-foreground flex items-center gap-2">
                <Award className="w-5 h-5 text-amber-500" />
                {isEn ? "Certificate Details" : "تفاصيل الشهادة"}
              </h3>
              <button
                onClick={closeGenerator}
                className="text-slate-400 hover:text-red-500 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="block text-sm font-bold text-slate-900 dark:text-white">
                  {isEn ? "Student Name" : "اسم الطالب"}
                </label>
                <Input
                  value={formData.recipientName}
                  onChange={(e) => handleInputChange("recipientName", e.target.value)}
                  placeholder={isEn ? "Enter student name" : "أدخل اسم الطالب"}
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-bold text-slate-900 dark:text-white">
                  {isEn ? "Course Name" : "اسم الكورس"}
                </label>
                <Input
                  value={formData.courseName}
                  onChange={(e) => handleInputChange("courseName", e.target.value)}
                  placeholder={isEn ? "Enter course name" : "أدخل اسم الكورس"}
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-bold text-slate-900 dark:text-white">
                  {isEn ? "Completion Date" : "تاريخ الإكمال"}
                </label>
                <Input
                  type="date"
                  value={
                    new Date(formData.completionDate)
                      .toISOString()
                      .split("T")[0]
                  }
                  onChange={(e) => {
                    const date = new Date(e.target.value);
                    handleInputChange(
                      "completionDate",
                      date.toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })
                    );
                  }}
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-bold text-slate-900 dark:text-white">
                  {isEn ? "Instructor Name" : "اسم المدرب"}
                </label>
                <Input
                  value={formData.instructorName}
                  onChange={(e) => handleInputChange("instructorName", e.target.value)}
                  placeholder={isEn ? "Enter instructor name" : "أدخل اسم المدرب"}
                />
              </div>
            </div>

            <div className="mt-6 p-4 bg-slate-50 dark:bg-black/20 rounded-lg border border-slate-200 dark:border-white/10">
              <p className="text-xs text-slate-600 dark:text-slate-400">
                <span className="font-bold">{isEn ? "Certificate ID:" : "معرف الشهادة:"}</span>{" "}
                <span className="font-mono text-primary">{certificateId}</span>
              </p>
            </div>
          </Card>
        </Reveal>
      )}

      {/* Design Customization Panel */}
      {showDesignPanel && showCertificateGenerator && (
        <Reveal width="100%" delay={0.2}>
          <Card className="!p-6 mt-8">
            <h3 className="font-display text-xl font-semibold text-foreground flex items-center gap-2 mb-6">
              <Filter className="w-5 h-5 text-amber-500" />
              {isEn ? "Design Customization" : "تخصيص التصميم"}
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
              {/* Color Scheme */}
              <div className="space-y-2">
                <label className="block text-sm font-bold text-slate-900 dark:text-white">
                  {isEn ? "Color Scheme" : "نظام الألوان"}
                </label>
                <select
                  value={design.colorScheme}
                  onChange={(e) => setDesign({ ...design, colorScheme: e.target.value as any })}
                  className="w-full bg-white dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-lg px-4 py-2 text-slate-900 dark:text-white focus:border-primary outline-none"
                >
                  <option value="blue">{isEn ? "Blue" : "أزرق"}</option>
                  <option value="green">{isEn ? "Green" : "أخضر"}</option>
                  <option value="purple">{isEn ? "Purple" : "بنفسجي"}</option>
                  <option value="gold">{isEn ? "Gold" : "ذهبي"}</option>
                </select>
              </div>

              {/* Font Size */}
              <div className="space-y-2">
                <label className="block text-sm font-bold text-slate-900 dark:text-white">
                  {isEn ? "Font Size" : "حجم الخط"}
                </label>
                <select
                  value={design.fontSize}
                  onChange={(e) => setDesign({ ...design, fontSize: e.target.value as any })}
                  className="w-full bg-white dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-lg px-4 py-2 text-slate-900 dark:text-white focus:border-primary outline-none"
                >
                  <option value="small">{isEn ? "Small" : "صغير"}</option>
                  <option value="medium">{isEn ? "Medium" : "متوسط"}</option>
                  <option value="large">{isEn ? "Large" : "كبير"}</option>
                </select>
              </div>

              {/* Border Style */}
              <div className="space-y-2">
                <label className="block text-sm font-bold text-slate-900 dark:text-white">
                  {isEn ? "Border Style" : "نمط الحدود"}
                </label>
                <select
                  value={design.borderStyle}
                  onChange={(e) => setDesign({ ...design, borderStyle: e.target.value as any })}
                  className="w-full bg-white dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-lg px-4 py-2 text-slate-900 dark:text-white focus:border-primary outline-none"
                >
                  <option value="double">{isEn ? "Double" : "مضاعف"}</option>
                  <option value="solid">{isEn ? "Solid" : "صلب"}</option>
                  <option value="dashed">{isEn ? "Dashed" : "متقطع"}</option>
                </select>
              </div>

              {/* Show Logo */}
              <div className="space-y-2">
                <label className="block text-sm font-bold text-slate-900 dark:text-white">
                  {isEn ? "Show Logo" : "إظهار الشعار"}
                </label>
                <button
                  onClick={() => setDesign({ ...design, showLogo: !design.showLogo })}
                  className={`w-full px-4 py-2 rounded-lg font-bold transition-all ${
                    design.showLogo
                      ? 'bg-primary text-white'
                      : 'bg-slate-100 dark:bg-white/10 text-slate-900 dark:text-white'
                  }`}
                >
                  {design.showLogo ? (isEn ? "Enabled" : "مفعل") : (isEn ? "Disabled" : "معطل")}
                </button>
              </div>

              {/* Show Watermark */}
              <div className="space-y-2">
                <label className="block text-sm font-bold text-slate-900 dark:text-white">
                  {isEn ? "Show Watermark" : "إظهار العلامة المائية"}
                </label>
                <button
                  onClick={() => setDesign({ ...design, showWatermark: !design.showWatermark })}
                  className={`w-full px-4 py-2 rounded-lg font-bold transition-all ${
                    design.showWatermark
                      ? 'bg-primary text-white'
                      : 'bg-slate-100 dark:bg-white/10 text-slate-900 dark:text-white'
                  }`}
                >
                  {design.showWatermark ? (isEn ? "Enabled" : "مفعل") : (isEn ? "Disabled" : "معطل")}
                </button>
              </div>
            </div>

            <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-500/30">
              <p className="text-xs text-blue-700 dark:text-blue-400">
                {isEn ? "💡 Tip: Changes preview in real-time. Adjust until you're satisfied with the design." : "💡 نصيحة: التغييرات تظهر مباشرة. اضبط حتى تكون راضيًا عن التصميم."}
              </p>
            </div>
          </Card>
        </Reveal>
      )}

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-md"></div>
          <Reveal width="100%">
            <Card className="relative z-10 !p-8 max-w-sm text-center">
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-8 h-8 text-emerald-500" />
                </div>
              </div>
              <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-2">
                {isEn ? "Certificate Exported!" : "تم تصدير الشهادة!"}
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {isEn
                  ? "Your certificate has been successfully saved."
                  : "تم حفظ الشهادة بنجاح."}
              </p>
            </Card>
          </Reveal>
        </div>
      )}

      {/* Notification Toast */}
      {notification && (
        <div className="fixed bottom-4 right-4 z-50 animate-in slide-in-from-bottom-4">
          <div className={`flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg border ${
            notification.type === 'success' 
              ? 'bg-emerald-50 dark:bg-emerald-900/30 border-emerald-200 dark:border-emerald-500/30' 
              : 'bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-500/30'
          }`}>
            {notification.type === 'success' ? (
              <CheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
            )}
            <p className={`text-sm font-medium ${
              notification.type === 'success' 
                ? 'text-emerald-700 dark:text-emerald-400' 
                : 'text-red-700 dark:text-red-400'
            }`}>
              {notification.message}
            </p>
          </div>
        </div>
      )}

      {/* Print Styles */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .certificate-border,
          .certificate-border * {
            visibility: visible;
          }
          .certificate-border {
            position: absolute;
            left: 50%;
            top: 50%;
            transform: translate(-50%, -50%);
            width: 100%;
            max-width: none;
            box-shadow: none;
          }
          @page {
            size: landscape;
            margin: 0;
          }
        }
      `}</style>
    </div>
  );
};

export default InstructorCertificates;
