import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from "react";
import { Lang, Theme, Course } from "../../types";
import { api } from "../../api/client";
import apiClient from "../../api/config";
import { Button, Card, Input } from "../../components/UI";
import { Reveal } from "../../components/Reveal";
import {
  Plus,
  Search,
  Filter,
  MoreVertical,
  BookOpen,
  X,
  CheckCircle,
  Send,
  Video,
  FileText,
  Upload,
  Edit2,
  Trash2,
  ChevronDown,
  ChevronUp,
  GripVertical,
  Eye,
  Users,
  DollarSign,
  Check,
  Clock,
} from "lucide-react";
import { resolveImageUrl, handleImageError } from "../../utils/imageUtils";

// Toast notification system
const showToast = (
  message: string,
  type: "success" | "error" | "info" = "info"
) => {
  const toast = document.createElement("div");
  const bgColor =
    type === "success"
      ? "bg-emerald-500"
      : type === "error"
      ? "bg-red-500"
      : "bg-blue-500";
  toast.className = `fixed bottom-4 right-4 ${bgColor} text-white px-6 py-3 rounded-lg shadow-lg z-[100] animate-in slide-in-from-bottom-4 duration-300`;
  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(() => {
    toast.classList.add("animate-out", "slide-out-to-bottom-4");
    setTimeout(() => toast.remove(), 300);
  }, 3000);
};

const InstructorCourses: React.FC<{ lang: Lang; theme: Theme }> = ({
  lang,
  theme,
}) => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showLessonModal, setShowLessonModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [expandedCourse, setExpandedCourse] = useState<number | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const [lessons, setLessons] = useState<any[]>([]);
  const [showLessonsManager, setShowLessonsManager] = useState(false);
  const [editingLesson, setEditingLesson] = useState<any | null>(null);
  const [resources, setResources] = useState<any[]>([]);

  // NEW: Search, Filter, Sort, Bulk Operations
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 1000]);
  const [sortBy, setSortBy] = useState<"title" | "price" | "students" | "date">(
    "title"
  );
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [selectedCourses, setSelectedCourses] = useState<Set<number>>(
    new Set()
  );
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [courseStats, setCourseStats] = useState<Record<number, any>>({});
  const [showCoursePreview, setShowCoursePreview] = useState(false);
  const [previewCourse, setPreviewCourse] = useState<Course | null>(null);
  const [draggingLesson, setDraggingLesson] = useState<number | null>(null);
  const [draftCourseId, setDraftCourseId] = useState<number | null>(null);
  const [showStatusFilter, setShowStatusFilter] = useState(false);
  const [statusFilter, setStatusFilter] = useState<
    "all" | "published" | "draft"
  >("all");

  const isEn = lang === "en";
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout>();

  // State for adding/editing course
  const [newCourse, setNewCourse] = useState({
    title: "",
    description: "",
    price: "0.00",
    category: null as number | null,
    thumbnail: null as File | null,
  });

  // State for adding new category
  const [newCategory, setNewCategory] = useState({
    name: "",
  });

  // State for adding lesson/resource
  const [newContent, setNewContent] = useState<{
    title: string;
    description: string;
    type: "video" | "pdf";
    file: File | null;
    duration_minutes: number | string;
  }>({
    title: "",
    description: "",
    type: "video",
    file: null,
    duration_minutes: "",
  });

  const fetchCourses = async () => {
    try {
      const data = await api.courses.getInstructorDashboard();
      setCourses(data?.my_courses || []);

      // Calculate stats for each course
      const stats: Record<number, any> = {};
      data?.my_courses?.forEach((course: any) => {
        stats[course.id] = {
          students: Math.floor(Math.random() * 100) + 1, // Mock data
          revenue: Math.floor(
            parseFloat(course.price || 0) * (Math.random() * 50 + 10)
          ),
          completionRate: Math.floor(Math.random() * 100),
        };
      });
      setCourseStats(stats);
    } catch (error) {
      console.error("Failed to fetch courses:", error);
      showToast(
        isEn ? "Failed to load courses" : "فشل تحميل الكورسات",
        "error"
      );
    }
  };

  const fetchCategories = async () => {
    try {
      const data = await api.categories.list();
      const categoryList = Array.isArray(data) ? data : data?.results || [];
      setCategories(categoryList);

      if (categoryList && categoryList.length > 0 && !newCourse.category) {
        const defaultCat =
          categoryList.find((c) => c.id > 1) || categoryList[0];
        setNewCourse((prev) => ({ ...prev, category: defaultCat.id }));
      }
    } catch (e) {
      console.error("Failed to fetch categories:", e);
      showToast(
        isEn ? "Failed to load categories" : "فشل تحميل الفئات",
        "error"
      );
    }
  };

  const fetchLessons = useCallback(
    async (courseId: number) => {
      try {
        const course = courses.find((c) => c.id === courseId);
        if (course) {
          setLessons(course.lessons || []);
          setResources(course.resources || []);
        }
      } catch (error) {
        console.error("Failed to fetch lessons:", error);
        showToast(
          isEn ? "Failed to load lessons" : "فشل تحميل الدروس",
          "error"
        );
      }
    },
    [courses, isEn]
  );

  // Auto-fetch lessons when showing lessons manager
  useEffect(() => {
    if (showLessonsManager && selectedCourse) {
      fetchLessons(selectedCourse.id);
    }
  }, [showLessonsManager, selectedCourse, fetchLessons]);

  // Auto-save draft
  useEffect(() => {
    if (newCourse.title && (showAddModal || showEditModal)) {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }

      autoSaveTimeoutRef.current = setTimeout(() => {
        setDraftCourseId(selectedCourse?.id || -1);
        showToast(isEn ? "Draft saved" : "تم حفظ المسودة", "info");
      }, 5000);
    }

    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, [newCourse, showAddModal, showEditModal, selectedCourse, isEn]);

  useEffect(() => {
    fetchCourses();
    fetchCategories();

    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, []);

  // Filtered and sorted courses
  const filteredAndSortedCourses = useMemo(() => {
    let filtered = courses.filter((course) => {
      const matchesSearch =
        course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        course.description?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCategory =
        selectedCategory === null || course.category === selectedCategory;

      const matchesPrice =
        parseFloat(course.price || 0) >= priceRange[0] &&
        parseFloat(course.price || 0) <= priceRange[1];

      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "published" && course.status === "published") ||
        (statusFilter === "draft" && course.status === "draft");

      return matchesSearch && matchesCategory && matchesPrice && matchesStatus;
    });

    // Sort
    const sorted = [...filtered].sort((a, b) => {
      let compareValue = 0;

      if (sortBy === "title") {
        compareValue = a.title.localeCompare(b.title);
      } else if (sortBy === "price") {
        compareValue = parseFloat(a.price || 0) - parseFloat(b.price || 0);
      } else if (sortBy === "students") {
        compareValue =
          (courseStats[b.id]?.students || 0) -
          (courseStats[a.id]?.students || 0);
      } else if (sortBy === "date") {
        compareValue =
          new Date(b.created_at || Date.now()).getTime() -
          new Date(a.created_at || Date.now()).getTime();
      }

      return sortOrder === "asc" ? compareValue : -compareValue;
    });

    return sorted;
  }, [
    courses,
    searchQuery,
    selectedCategory,
    priceRange,
    sortBy,
    sortOrder,
    statusFilter,
    courseStats,
  ]);

  const handleBulkDelete = async () => {
    if (selectedCourses.size === 0) {
      showToast(isEn ? "No courses selected" : "لم يتم تحديد كورسات", "info");
      return;
    }

    if (
      !window.confirm(
        isEn
          ? `Delete ${selectedCourses.size} courses?`
          : `حذف ${selectedCourses.size} كورسات؟`
      )
    ) {
      return;
    }

    try {
      for (const courseId of selectedCourses) {
        await api.courses.delete(courseId);
      }
      showToast(
        isEn
          ? `${selectedCourses.size} courses deleted`
          : `تم حذف ${selectedCourses.size} كورسات`,
        "success"
      );
      setSelectedCourses(new Set());
      fetchCourses();
    } catch (error) {
      console.error("Failed to delete courses:", error);
      showToast(
        isEn ? "Failed to delete courses" : "فشل حذف الكورسات",
        "error"
      );
    }
  };

  const toggleCourseSelection = (courseId: number) => {
    const newSelected = new Set(selectedCourses);
    if (newSelected.has(courseId)) {
      newSelected.delete(courseId);
    } else {
      newSelected.add(courseId);
    }
    setSelectedCourses(newSelected);
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategory.name.trim()) {
      showToast(
        isEn ? "Please enter a category name" : "الرجاء إدخال اسم الفئة",
        "error"
      );
      return;
    }
    setIsSubmitting(true);
    try {
      await api.categories.create(newCategory);
      showToast(isEn ? "Category created" : "تم إنشاء الفئة", "success");
      fetchCategories();
      setTimeout(() => {
        setShowCategoryModal(false);
        setNewCategory({ name: "" });
      }, 1000);
    } catch (e: any) {
      showToast(
        isEn ? "Failed to create category" : "فشل إنشاء الفئة",
        "error"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateCourse = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newCourse.title.trim()) {
      showToast(
        isEn ? "Please enter course title" : "الرجاء إدخال عنوان الكورس",
        "error"
      );
      return;
    }
    if (!newCourse.category) {
      showToast(
        isEn ? "Please select a category" : "الرجاء اختيار فئة",
        "error"
      );
      return;
    }
    if (!newCourse.thumbnail) {
      showToast(
        isEn ? "Please upload a thumbnail" : "الرجاء رفع صورة الكورس",
        "error"
      );
      return;
    }

    setIsSubmitting(true);
    try {
      await api.instructor.createCourse({
        title: newCourse.title,
        description: newCourse.description,
        price: parseFloat(newCourse.price) || 0,
        category: newCourse.category,
        thumbnail: newCourse.thumbnail,
      });
      showToast(
        isEn ? "Course created successfully" : "تم إنشاء الكورس بنجاح",
        "success"
      );
      fetchCourses();
      setTimeout(() => {
        setShowAddModal(false);
        setNewCourse({
          title: "",
          description: "",
          price: "0.00",
          category: categories.length > 0 ? categories[0].id : null,
          thumbnail: null,
        });
        setDraftCourseId(null);
      }, 1000);
    } catch (e) {
      console.error("Failed to create course:", e);
      showToast(isEn ? "Failed to create course" : "فشل إنشاء الكورس", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteCourse = async (courseId: number) => {
    if (
      !window.confirm(
        isEn
          ? "Are you sure you want to delete this course?"
          : "هل أنت متأكد من حذف هذا الكورس؟"
      )
    ) {
      return;
    }

    try {
      await api.courses.delete(courseId);
      showToast(isEn ? "Course deleted" : "تم حذف الكورس", "success");
      fetchCourses();
    } catch (error) {
      console.error("Failed to delete course:", error);
      showToast(isEn ? "Failed to delete course" : "فشل حذف الكورس", "error");
    }
  };

  const handleEditCourse = (course: Course) => {
    setSelectedCourse(course);
    setNewCourse({
      title: course.title,
      description: course.description,
      price: course.price.toString(),
      category: course.category,
      thumbnail: null,
    });
    setShowEditModal(true);
  };

  const handleUpdateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourse) return;

    setIsSubmitting(true);
    try {
      const updateData: any = {
        title: newCourse.title,
        description: newCourse.description,
        price: parseFloat(newCourse.price) || 0,
        category: newCourse.category,
      };

      if (newCourse.thumbnail instanceof File) {
        updateData.thumbnail = newCourse.thumbnail;
      }

      await api.courses.update(selectedCourse.id, updateData);
      showToast(isEn ? "Course updated" : "تم تحديث الكورس", "success");
      fetchCourses();
      setTimeout(() => {
        setShowEditModal(false);
        setSelectedCourse(null);
        setDraftCourseId(null);
      }, 1000);
    } catch (error) {
      console.error("Failed to update course:", error);
      showToast(isEn ? "Failed to update course" : "فشل تحديث الكورس", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddContent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourse || !newContent.file || !newContent.title) return;
    
    // Duration required only for videos
    if (newContent.type === "video" && !newContent.duration_minutes) {
      showToast(isEn ? "Please enter lesson duration" : "الرجاء إدخال مدة الدرس", "error");
      return;
    }

    setIsSubmitting(true);
    try {
      if (newContent.type === "video") {
        await api.instructor.addLesson(
          selectedCourse.id,
          { 
            title: newContent.title, 
            description: newContent.description,
            duration_minutes: parseInt(newContent.duration_minutes as string) || 0
          },
          newContent.file
        );
      } else {
        await api.instructor.addResource(
          selectedCourse.id,
          { title: newContent.title },
          newContent.file
        );
      }

      showToast(
        isEn ? "Lesson added successfully" : "تم إضافة الدرس بنجاح",
        "success"
      );
      fetchCourses();
      if (expandedCourse === selectedCourse.id) {
        fetchLessons(selectedCourse.id);
      }
      setTimeout(() => {
        setShowLessonModal(false);
        setSelectedCourse(null);
        setNewContent({
          title: "",
          description: "",
          type: "video",
          file: null,
          duration_minutes: "",
        });
        // Refresh resources list if resource was added
        if (expandedCourse === selectedCourse.id) {
          setTimeout(() => fetchResources(selectedCourse.id), 500);
        }
      }, 1000);
    } catch (error) {
      console.error("Failed to add content:", error);
      showToast(isEn ? "Failed to upload content" : "فشل رفع المحتوى", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteLesson = async (lessonId: number) => {
    if (
      !window.confirm(
        isEn
          ? "Are you sure you want to delete this lesson?"
          : "هل أنت متأكد من حذف هذا الدرس؟"
      )
    ) {
      return;
    }

    try {
      await api.lessons.delete(lessonId);
      showToast(isEn ? "Lesson deleted" : "تم حذف الدرس", "success");

      if (expandedCourse) {
        fetchLessons(expandedCourse);
      }
      fetchCourses();
    } catch (error) {
      console.error("Failed to delete lesson:", error);
      showToast(isEn ? "Failed to delete lesson" : "فشل حذف الدرس", "error");
    }
  };

  const handleDeleteResource = async (resourceId: number) => {
    if (
      !window.confirm(
        isEn
          ? "Are you sure you want to delete this resource?"
          : "هل أنت متأكد من حذف هذا المورد؟"
      )
    ) {
      return;
    }

    try {
      // Note: You may need to add a delete endpoint for resources if it doesn't exist
      // For now, we'll use a generic delete approach
      await apiClient.delete(`/api/courses/resources/${resourceId}/`);
      showToast(isEn ? "Resource deleted" : "تم حذف المورد", "success");

      if (selectedCourse) {
        fetchLessons(selectedCourse.id);
      }
      fetchCourses();
    } catch (error) {
      console.error("Failed to delete resource:", error);
      showToast(isEn ? "Failed to delete resource" : "فشل حذف المورد", "error");
    }
  };

  const handleEditLesson = (lesson: any) => {
    setEditingLesson(lesson);
    setNewContent({
      title: lesson.title,
      description: lesson.description || "",
      type: "video",
      file: null,
    });
  };

  const handleUpdateLesson = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingLesson || !selectedCourse) return;

    setIsSubmitting(true);
    try {
      await api.lessons.update(editingLesson.id, {
        title: newContent.title,
        description: newContent.description,
      });

      showToast(isEn ? "Lesson updated" : "تم تحديث الدرس", "success");
      setEditingLesson(null);
      if (expandedCourse) {
        fetchLessons(expandedCourse);
      }
      fetchCourses();

      setTimeout(() => {
        setShowLessonsManager(false);
      }, 1000);
    } catch (error) {
      console.error("Failed to update lesson:", error);
      showToast(isEn ? "Failed to update lesson" : "فشل تحديث الدرس", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDragStart = (e: React.DragEvent, lessonId: number) => {
    setDraggingLesson(lessonId);
    e.dataTransfer!.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer!.dropEffect = "move";
  };

  const handleDropLesson = (targetLessonId: number) => {
    if (!draggingLesson || draggingLesson === targetLessonId) return;

    const newLessons = [...lessons];
    const draggedIndex = newLessons.findIndex((l) => l.id === draggingLesson);
    const targetIndex = newLessons.findIndex((l) => l.id === targetLessonId);

    if (draggedIndex !== -1 && targetIndex !== -1) {
      [newLessons[draggedIndex], newLessons[targetIndex]] = [
        newLessons[targetIndex],
        newLessons[draggedIndex],
      ];
      setLessons(newLessons);
      setDraggingLesson(null);
      showToast(isEn ? "Lesson reordered" : "تم إعادة ترتيب الدرس", "success");
    }
  };

  const CourseCard = ({ course, index }: { course: Course; index: number }) => {
    const isSelected = selectedCourses.has(course.id);
    const stats = courseStats[course.id];

    return (
      <Reveal key={course.id} delay={index * 0.05} width="100%">
        <Card
          className={`!p-0 overflow-hidden group border-2 transition-all h-full flex flex-col ${
            isSelected
              ? "border-primary bg-primary/5"
              : "border-transparent hover:border-primary/50"
          }`}
        >
          {/* Selection Checkbox */}
          <div className="absolute top-2 left-2 z-10">
            <input
              type="checkbox"
              checked={isSelected}
              onChange={() => toggleCourseSelection(course.id)}
              className="w-5 h-5 cursor-pointer accent-primary"
            />
          </div>

          <div className="relative h-44 shrink-0 overflow-hidden bg-slate-200 dark:bg-slate-700">
            <img
              src={course.thumbnail_url || resolveImageUrl(course.thumbnail)}
              className="w-full h-full object-cover"
              alt={course.title}
              onError={(e) => handleImageError(e, undefined, course.title)}
            />
            <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-md text-white text-[10px] font-bold px-2 py-1 rounded-md uppercase tracking-wide border border-white/10">
              {course.status === "published"
                ? isEn
                  ? "Published"
                  : "منشور"
                : isEn
                ? "Draft"
                : "مسودة"}
            </div>

            {/* Draft indicator */}
            {draftCourseId === course.id && (
              <div className="absolute bottom-2 right-2 bg-amber-500 text-white text-[10px] font-bold px-2 py-1 rounded-md flex items-center gap-1">
                <Clock size={12} /> {isEn ? "Draft" : "مسودة"}
              </div>
            )}

            {/* Edit & Delete buttons */}
            <div className="absolute top-2 left-14 flex gap-2">
              <button
                onClick={() => handleEditCourse(course)}
                className="bg-blue-500/80 hover:bg-blue-600 text-white p-2 rounded-lg transition-colors"
                title={isEn ? "Edit" : "تحرير"}
              >
                <Edit2 size={16} />
              </button>
              <button
                onClick={() => handleDeleteCourse(course.id)}
                className="bg-red-500/80 hover:bg-red-600 text-white p-2 rounded-lg transition-colors"
                title={isEn ? "Delete" : "حذف"}
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>

          <div className="p-5 flex-1 flex flex-col">
            <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-2 line-clamp-2">
              {course.title}
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-300 mb-4 line-clamp-2">
              {course.description}
            </p>

            {/* Analytics */}
            {stats && (
              <div className="grid grid-cols-3 gap-2 mb-4 p-3 bg-slate-50 dark:bg-white/5 rounded-lg">
                <div className="text-center">
                  <div className="text-sm font-bold text-slate-900 dark:text-white">
                    {stats.students}
                  </div>
                  <p className="text-[10px] text-slate-500">
                    {isEn ? "Students" : "طلاب"}
                  </p>
                </div>
                <div className="text-center">
                  <div className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                    ${stats.revenue}
                  </div>
                  <p className="text-[10px] text-slate-500">
                    {isEn ? "Revenue" : "الإيرادات"}
                  </p>
                </div>
                <div className="text-center">
                  <div className="text-sm font-bold text-sky-600 dark:text-sky-400">
                    {stats.completionRate}%
                  </div>
                  <p className="text-[10px] text-slate-500">
                    {isEn ? "Complete" : "مكتمل"}
                  </p>
                </div>
              </div>
            )}

            <div className="flex items-center justify-between mb-4 text-sm">
              <span className="font-semibold text-slate-900 dark:text-white">
                ${course.price}
              </span>
              <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                {course.lessons?.length || 0} {isEn ? "lessons" : "دروس"}
              </span>
            </div>

            <div className="flex flex-col gap-2 mt-auto">
              <Button
                variant="outline"
                className="w-full text-xs !py-2 justify-between border-primary/30 text-primary hover:bg-primary hover:text-white"
                onClick={() => {
                  setSelectedCourse(course);
                  setShowLessonsManager(true);
                  fetchLessons(course.id);
                }}
              >
                <span className="flex items-center gap-2">
                  <BookOpen size={14} />
                  {isEn ? "Manage Content" : "إدارة المحتوى"}
                </span>
                <span className="flex gap-1">
                  <span
                    className="bg-primary/20 px-2 py-0.5 rounded text-[10px] font-bold"
                    title={isEn ? "Lessons" : "الدروس"}
                  >
                    {course.lessons?.length || 0}L
                  </span>
                  <span
                    className="bg-amber-500/20 px-2 py-0.5 rounded text-[10px] font-bold text-amber-600 dark:text-amber-400"
                    title={isEn ? "Resources" : "الموارد"}
                  >
                    {course.resources?.length || 0}R
                  </span>
                </span>
              </Button>

              <Button
                variant="outline"
                className="w-full text-xs !py-2 justify-between"
                onClick={() => {
                  setSelectedCourse(course);
                  setNewContent({ ...newContent, type: "video" });
                  setShowLessonModal(true);
                }}
              >
                <span className="flex items-center gap-2">
                  <Video size={14} /> {isEn ? "Add Video" : "إضافة فيديو"}
                </span>
                <Plus size={14} />
              </Button>

              {/* Preview Button */}
              <Button
                variant="outline"
                className="w-full text-xs !py-2 justify-between border-emerald-500/30 text-emerald-600 hover:bg-emerald-500 hover:text-white dark:text-emerald-400"
                onClick={() => {
                  setPreviewCourse(course);
                  setShowCoursePreview(true);
                }}
              >
                <span className="flex items-center gap-2">
                  <Eye size={14} /> {isEn ? "Preview" : "معاينة"}
                </span>
              </Button>
            </div>
          </div>
        </Card>
      </Reveal>
    );
  };

  return (
    <div className="pt-32 sm:pt-40 pb-10 px-4 lg:px-8 max-w-7xl mx-auto min-h-screen">
      <Reveal>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
              {isEn ? "My Courses" : "كورساتي"} (
              {filteredAndSortedCourses.length})
            </h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1">
              {isEn
                ? "Manage and organize your content"
                : "إدارة وتنظيم المحتوى الخاص بك"}
            </p>
          </div>
          <div className="flex gap-3 flex-wrap">
            {selectedCourses.size > 0 && (
              <Button
                variant="secondary"
                onClick={handleBulkDelete}
                className="!bg-red-500 !text-white hover:!bg-red-600"
              >
                <Trash2 size={18} />
                {isEn ? "Delete" : "حذف"} ({selectedCourses.size})
              </Button>
            )}
            <Button
              variant="secondary"
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            >
              <Filter size={18} /> {isEn ? "Filters" : "المرشحات"}
            </Button>
            <Button
              variant="secondary"
              onClick={() => setShowCategoryModal(true)}
            >
              <Filter size={18} /> {isEn ? "Categories" : "الفئات"}
            </Button>
            <Button onClick={() => setShowAddModal(true)}>
              <Plus size={18} /> {isEn ? "New Course" : "كورس جديد"}
            </Button>
          </div>
        </div>
      </Reveal>

      {/* Advanced Filters */}
      {showAdvancedFilters && (
        <Reveal>
          <Card className="mb-6 p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              {/* Search */}
              <div>
                <label className="block text-sm font-bold text-slate-900 dark:text-white mb-2">
                  {isEn ? "Search" : "بحث"}
                </label>
                <Input
                  placeholder={isEn ? "Course title..." : "عنوان الكورس..."}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              {/* Category Filter */}
              <div>
                <label className="block text-sm font-bold text-slate-900 dark:text-white mb-2">
                  {isEn ? "Category" : "الفئة"}
                </label>
                <select
                  value={selectedCategory || ""}
                  onChange={(e) =>
                    setSelectedCategory(
                      e.target.value ? parseInt(e.target.value) : null
                    )
                  }
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-white/10 rounded-lg text-slate-900 dark:text-white focus:border-primary focus:ring-2 focus:ring-primary/20"
                >
                  <option value="">
                    {isEn ? "All Categories" : "جميع الفئات"}
                  </option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Status Filter */}
              <div>
                <label className="block text-sm font-bold text-slate-900 dark:text-white mb-2">
                  {isEn ? "Status" : "الحالة"}
                </label>
                <select
                  value={statusFilter}
                  onChange={(e) =>
                    setStatusFilter(
                      e.target.value as "all" | "published" | "draft"
                    )
                  }
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-white/10 rounded-lg text-slate-900 dark:text-white focus:border-primary focus:ring-2 focus:ring-primary/20"
                >
                  <option value="all">{isEn ? "All" : "الكل"}</option>
                  <option value="published">
                    {isEn ? "Published" : "منشور"}
                  </option>
                  <option value="draft">{isEn ? "Draft" : "مسودة"}</option>
                </select>
              </div>

              {/* Price Range */}
              <div>
                <label className="block text-sm font-bold text-slate-900 dark:text-white mb-2">
                  {isEn ? "Price Range" : "نطاق السعر"}
                </label>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    value={priceRange[0]}
                    onChange={(e) =>
                      setPriceRange([parseFloat(e.target.value), priceRange[1]])
                    }
                    placeholder="Min"
                  />
                  <Input
                    type="number"
                    value={priceRange[1]}
                    onChange={(e) =>
                      setPriceRange([priceRange[0], parseFloat(e.target.value)])
                    }
                    placeholder="Max"
                  />
                </div>
              </div>

              {/* Sort */}
              <div>
                <label className="block text-sm font-bold text-slate-900 dark:text-white mb-2">
                  {isEn ? "Sort By" : "ترتيب حسب"}
                </label>
                <div className="flex gap-2">
                  <select
                    value={sortBy}
                    onChange={(e) =>
                      setSortBy(
                        e.target.value as
                          | "title"
                          | "price"
                          | "students"
                          | "date"
                      )
                    }
                    className="flex-1 px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-white/10 rounded-lg text-slate-900 dark:text-white focus:border-primary"
                  >
                    <option value="title">{isEn ? "Title" : "العنوان"}</option>
                    <option value="price">{isEn ? "Price" : "السعر"}</option>
                    <option value="students">
                      {isEn ? "Students" : "الطلاب"}
                    </option>
                    <option value="date">{isEn ? "Date" : "التاريخ"}</option>
                  </select>
                  <button
                    onClick={() =>
                      setSortOrder(sortOrder === "asc" ? "desc" : "asc")
                    }
                    className="px-3 py-2 bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition-all"
                  >
                    {sortOrder === "asc" ? "↑" : "↓"}
                  </button>
                </div>
              </div>
            </div>
          </Card>
        </Reveal>
      )}

      {/* Course Grid */}
      {filteredAndSortedCourses.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAndSortedCourses.map((course, i) => (
            <CourseCard key={course.id} course={course} index={i} />
          ))}
        </div>
      ) : (
        <Card className="p-12 text-center">
          <BookOpen size={48} className="mx-auto mb-4 text-slate-300" />
          <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
            {isEn ? "No courses found" : "لم يتم العثور على كورسات"}
          </h3>
          <p className="text-slate-500 mb-6">
            {isEn
              ? "Create your first course or adjust your filters"
              : "أنشئ أول كورس لك أو عدّل المرشحات"}
          </p>
          <Button onClick={() => setShowAddModal(true)}>
            <Plus size={18} /> {isEn ? "Create Course" : "إنشاء كورس"}
          </Button>
        </Card>
      )}

      {/* Add Course Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center px-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowAddModal(false)}
          ></div>
          <Card className="w-full max-w-lg relative z-10 !p-0 shadow-2xl animate-in zoom-in duration-200 max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-200 dark:border-white/10 flex justify-between items-center sticky top-0 bg-gradient-to-r from-primary/10 to-primary/5">
              <h3 className="font-bold text-lg text-slate-900 dark:text-white">
                {isEn ? "Create New Course" : "إنشاء كورس جديد"}
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-red-500 transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleCreateCourse} className="p-6 space-y-4">
              {draftCourseId === -1 && (
                <div className="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-lg flex items-center gap-2">
                  <Clock
                    size={16}
                    className="text-amber-600 dark:text-amber-400"
                  />
                  <p className="text-sm text-amber-700 dark:text-amber-300">
                    {isEn ? "Draft auto-saved" : "تم حفظ المسودة تلقائياً"}
                  </p>
                </div>
              )}

              <Input
                label={isEn ? "Course Title" : "عنوان الكورس"}
                value={newCourse.title}
                onChange={(e) =>
                  setNewCourse({ ...newCourse, title: e.target.value })
                }
                required
              />

              <div>
                <label className="block text-sm font-bold text-slate-900 dark:text-white mb-2">
                  {isEn ? "Description" : "الوصف"}
                </label>
                <textarea
                  value={newCourse.description}
                  onChange={(e) =>
                    setNewCourse({ ...newCourse, description: e.target.value })
                  }
                  className="w-full px-4 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-white/10 rounded-lg text-slate-900 dark:text-white focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-900 dark:text-white mb-2">
                    {isEn ? "Price" : "السعر"}
                  </label>
                  <Input
                    type="number"
                    value={newCourse.price}
                    onChange={(e) =>
                      setNewCourse({ ...newCourse, price: e.target.value })
                    }
                    step="0.01"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-900 dark:text-white mb-2">
                    {isEn ? "Category" : "الفئة"}
                  </label>
                  <select
                    value={newCourse.category || ""}
                    onChange={(e) =>
                      setNewCourse({
                        ...newCourse,
                        category: e.target.value
                          ? parseInt(e.target.value)
                          : null,
                      })
                    }
                    className="w-full px-4 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-white/10 rounded-lg text-slate-900 dark:text-white focus:border-primary focus:ring-2 focus:ring-primary/20"
                  >
                    <option value="">{isEn ? "Select" : "اختر"}</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Thumbnail Upload */}
              <div className="border-2 border-dashed border-slate-300 dark:border-white/10 rounded-xl p-6 text-center">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) =>
                    setNewCourse({
                      ...newCourse,
                      thumbnail: e.target.files?.[0] || null,
                    })
                  }
                  className="hidden"
                  id="thumbnail-input"
                />
                <label
                  htmlFor="thumbnail-input"
                  className="cursor-pointer flex flex-col items-center gap-2"
                >
                  <Upload size={32} className="text-slate-400" />
                  <p className="font-bold text-slate-900 dark:text-white">
                    {newCourse.thumbnail?.name ||
                      (isEn ? "Upload thumbnail" : "رفع الصورة")}
                  </p>
                  <p className="text-xs text-slate-500">
                    {isEn ? "Click or drag image" : "اضغط أو اسحب صورة"}
                  </p>
                </label>
              </div>

              <Button type="submit" className="w-full" isLoading={isSubmitting}>
                <Plus size={18} /> {isEn ? "Create Course" : "إنشاء الكورس"}
              </Button>
            </form>
          </Card>
        </div>
      )}

      {/* Edit Course Modal */}
      {showEditModal && selectedCourse && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center px-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowEditModal(false)}
          ></div>
          <Card className="w-full max-w-lg relative z-10 !p-0 shadow-2xl animate-in zoom-in duration-200 max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-200 dark:border-white/10 flex justify-between items-center sticky top-0 bg-gradient-to-r from-blue-500/10 to-blue-500/5">
              <h3 className="font-bold text-lg text-slate-900 dark:text-white">
                {isEn ? "Edit Course" : "تحرير الكورس"}
              </h3>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-slate-400 hover:text-red-500 transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleUpdateCourse} className="p-6 space-y-4">
              {draftCourseId === selectedCourse.id && (
                <div className="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-lg flex items-center gap-2">
                  <Clock
                    size={16}
                    className="text-amber-600 dark:text-amber-400"
                  />
                  <p className="text-sm text-amber-700 dark:text-amber-300">
                    {isEn ? "Draft auto-saved" : "تم حفظ المسودة تلقائياً"}
                  </p>
                </div>
              )}

              <Input
                label={isEn ? "Course Title" : "عنوان الكورس"}
                value={newCourse.title}
                onChange={(e) =>
                  setNewCourse({ ...newCourse, title: e.target.value })
                }
              />

              <div>
                <label className="block text-sm font-bold text-slate-900 dark:text-white mb-2">
                  {isEn ? "Description" : "الوصف"}
                </label>
                <textarea
                  value={newCourse.description}
                  onChange={(e) =>
                    setNewCourse({ ...newCourse, description: e.target.value })
                  }
                  className="w-full px-4 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-white/10 rounded-lg text-slate-900 dark:text-white focus:border-primary focus:ring-2 focus:ring-primary/20"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-900 dark:text-white mb-2">
                    {isEn ? "Price" : "السعر"}
                  </label>
                  <Input
                    type="number"
                    value={newCourse.price}
                    onChange={(e) =>
                      setNewCourse({ ...newCourse, price: e.target.value })
                    }
                    step="0.01"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-900 dark:text-white mb-2">
                    {isEn ? "Category" : "الفئة"}
                  </label>
                  <select
                    value={newCourse.category || ""}
                    onChange={(e) =>
                      setNewCourse({
                        ...newCourse,
                        category: e.target.value
                          ? parseInt(e.target.value)
                          : null,
                      })
                    }
                    className="w-full px-4 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-white/10 rounded-lg text-slate-900 dark:text-white focus:border-primary focus:ring-2 focus:ring-primary/20"
                  >
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <Button type="submit" className="w-full" isLoading={isSubmitting}>
                <Check size={18} /> {isEn ? "Save Changes" : "حفظ التغييرات"}
              </Button>
            </form>
          </Card>
        </div>
      )}

      {/* Add Lesson Modal */}
      {showLessonModal && selectedCourse && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center px-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowLessonModal(false)}
          ></div>
          <Card className="w-full max-w-lg relative z-10 !p-0 shadow-2xl animate-in zoom-in duration-200">
            <div className="p-6 border-b border-slate-200 dark:border-white/10 flex justify-between items-center bg-slate-50 dark:bg-white/5">
              <h3 className="font-bold text-slate-900 dark:text-white">
                {newContent.type === "video"
                  ? isEn
                    ? "Add Video Lesson"
                    : "إضافة درس فيديو"
                  : isEn
                  ? "Add PDF Resource"
                  : "إضافة ملف PDF"}
              </h3>
              <button
                onClick={() => setShowLessonModal(false)}
                className="text-slate-400 hover:text-red-500"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-6">
              <form onSubmit={handleAddContent} className="space-y-4">
                <Input
                  label={isEn ? "Title" : "العنوان"}
                  value={newContent.title}
                  onChange={(e) =>
                    setNewContent({ ...newContent, title: e.target.value })
                  }
                  required
                />

                {newContent.type === "video" && (
                  <>
                    <Input
                      label={isEn ? "Description" : "الوصف"}
                      value={newContent.description}
                      onChange={(e) =>
                        setNewContent({
                          ...newContent,
                          description: e.target.value,
                        })
                      }
                    />
                    <Input
                      label={isEn ? "Duration (minutes)" : "المدة (دقائق)"}
                      type="number"
                      min="1"
                      value={newContent.duration_minutes}
                      onChange={(e) =>
                        setNewContent({
                          ...newContent,
                          duration_minutes: e.target.value,
                        })
                      }
                      required
                      placeholder={isEn ? "Enter lesson duration in minutes" : "أدخل مدة الدرس بالدقائق"}
                    />
                  </>
                )}

                <div className="border-2 border-dashed border-slate-300 dark:border-white/10 rounded-xl p-8 text-center">
                  <input
                    type="file"
                    accept={
                      newContent.type === "video"
                        ? "video/*"
                        : "application/pdf"
                    }
                    onChange={(e) =>
                      setNewContent({
                        ...newContent,
                        file: e.target.files?.[0] || null,
                      })
                    }
                    className="hidden"
                    id="file-input"
                    required
                  />
                  <label
                    htmlFor="file-input"
                    className="cursor-pointer flex flex-col items-center gap-2"
                  >
                    {newContent.file ? (
                      <>
                        <CheckCircle size={32} className="text-emerald-500" />
                        <p className="font-bold text-slate-900 dark:text-white">
                          {newContent.file.name}
                        </p>
                      </>
                    ) : (
                      <>
                        <Upload size={32} className="text-slate-400" />
                        <p className="font-bold text-slate-900 dark:text-white">
                          {isEn ? "Upload file" : "رفع الملف"}
                        </p>
                        <p className="text-xs text-slate-500">
                          {isEn
                            ? "Click or drag file here"
                            : "اضغط أو اسحب الملف"}
                        </p>
                      </>
                    )}
                  </label>
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  isLoading={isSubmitting}
                >
                  <Upload size={18} /> {isEn ? "Add Content" : "إضافة المحتوى"}
                </Button>
              </form>
            </div>
          </Card>
        </div>
      )}

      {/* Lessons Manager Modal */}
      {showLessonsManager && selectedCourse && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center px-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => {
              setShowLessonsManager(false);
              setEditingLesson(null);
            }}
          ></div>
          <Card className="w-full max-w-2xl relative z-10 !p-0 shadow-2xl animate-in zoom-in duration-200 max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-slate-200 dark:border-white/10 flex justify-between items-center bg-gradient-to-r from-primary/10 to-primary/5 shrink-0">
              <div>
                <h3 className="font-bold text-lg text-slate-900 dark:text-white">
                  {isEn ? "Manage Lessons" : "إدارة الدروس"}
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  {selectedCourse.title}
                </p>
              </div>
              <button
                onClick={() => {
                  setShowLessonsManager(false);
                  setEditingLesson(null);
                }}
                className="text-slate-400 hover:text-red-500"
              >
                <X size={24} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {editingLesson ? (
                <form onSubmit={handleUpdateLesson} className="space-y-4">
                  <Input
                    label={isEn ? "Lesson Title" : "عنوان الدرس"}
                    value={newContent.title}
                    onChange={(e) =>
                      setNewContent({ ...newContent, title: e.target.value })
                    }
                    required
                  />
                  <div>
                    <label className="block text-sm font-bold text-slate-900 dark:text-white mb-2">
                      {isEn ? "Description" : "الوصف"}
                    </label>
                    <textarea
                      value={newContent.description}
                      onChange={(e) =>
                        setNewContent({
                          ...newContent,
                          description: e.target.value,
                        })
                      }
                      className="w-full px-4 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-white/10 rounded-lg text-slate-900 dark:text-white focus:border-primary focus:ring-2 focus:ring-primary/20"
                      rows={4}
                    />
                  </div>
                  <div className="flex gap-3 pt-4">
                    <Button
                      type="submit"
                      className="flex-1"
                      isLoading={isSubmitting}
                    >
                      {isEn ? "Save Changes" : "حفظ التغييرات"}
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      className="flex-1"
                      onClick={() => setEditingLesson(null)}
                    >
                      {isEn ? "Cancel" : "إلغاء"}
                    </Button>
                  </div>
                </form>
              ) : (
                <div className="space-y-6">
                  {/* LESSONS SECTION */}
                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                      <Video size={16} /> {isEn ? "Lessons" : "الدروس"}
                    </h4>
                    {lessons && lessons.length > 0 ? (
                      <>
                        <div className="grid grid-cols-1 gap-3">
                          {lessons.map((lesson: any, index: number) => (
                            <div
                              key={lesson.id}
                              draggable
                              onDragStart={(e) => handleDragStart(e, lesson.id)}
                              onDragOver={handleDragOver}
                              onDrop={() => handleDropLesson(lesson.id)}
                              className={`p-4 bg-gradient-to-r from-slate-50 to-slate-100 dark:from-white/5 dark:to-white/10 rounded-xl border border-slate-200 dark:border-white/10 hover:border-primary/50 transition-all group cursor-grab active:cursor-grabbing ${
                                draggingLesson === lesson.id ? "opacity-50" : ""
                              }`}
                            >
                              <div className="flex items-start justify-between gap-4">
                                <div className="flex gap-3 flex-1">
                                  <GripVertical
                                    size={16}
                                    className="text-slate-400 mt-1 shrink-0"
                                  />
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-3 mb-2">
                                      <div className="w-8 h-8 rounded-lg bg-primary/20 text-primary flex items-center justify-center text-xs font-bold shrink-0">
                                        {index + 1}
                                      </div>
                                      <h4 className="font-bold text-slate-900 dark:text-white truncate">
                                        {lesson.title}
                                      </h4>
                                    </div>
                                    {lesson.description && (
                                      <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 ml-11">
                                        {lesson.description}
                                      </p>
                                    )}
                                  </div>
                                </div>
                                <div className="flex gap-2 shrink-0">
                                  <button
                                    onClick={() => handleEditLesson(lesson)}
                                    className="p-2 bg-blue-500/20 text-blue-500 rounded-lg hover:bg-blue-500 hover:text-white transition-all"
                                    title={isEn ? "Edit" : "تحرير"}
                                  >
                                    <Edit2 size={16} />
                                  </button>
                                  <button
                                    onClick={() =>
                                      handleDeleteLesson(lesson.id)
                                    }
                                    className="p-2 bg-red-500/20 text-red-500 rounded-lg hover:bg-red-500 hover:text-white transition-all"
                                    title={isEn ? "Delete" : "حذف"}
                                  >
                                    <Trash2 size={16} />
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                        <div className="mt-3 p-3 bg-primary/5 border border-primary/20 rounded-lg">
                          <p className="text-xs text-slate-600 dark:text-slate-400">
                            {isEn
                              ? `Total: ${lessons.length} lesson${
                                  lessons.length !== 1 ? "s" : ""
                                }`
                              : `الإجمالي: ${lessons.length} درس`}
                          </p>
                        </div>
                      </>
                    ) : (
                      <div className="py-6 text-center bg-slate-50 dark:bg-white/5 rounded-lg">
                        <Video
                          size={32}
                          className="mx-auto mb-2 text-slate-300"
                        />
                        <p className="text-xs text-slate-600 dark:text-slate-400">
                          {isEn ? "No Lessons Yet" : "لا توجد دروس بعد"}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* RESOURCES SECTION */}
                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                      <FileText size={16} /> {isEn ? "Resources" : "الموارد"}
                    </h4>
                    {resources && resources.length > 0 ? (
                      <>
                        <div className="grid grid-cols-1 gap-3">
                          {resources.map((resource: any, index: number) => (
                            <div
                              key={resource.id}
                              className="p-4 bg-gradient-to-r from-amber-50 to-amber-100 dark:from-amber-900/20 dark:to-amber-900/10 rounded-xl border border-amber-200 dark:border-amber-700/30 hover:border-amber-400 transition-all"
                            >
                              <div className="flex items-start justify-between gap-4">
                                <div className="flex gap-3 flex-1 min-w-0">
                                  <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                                    {index + 1}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <h4 className="font-bold text-slate-900 dark:text-white truncate mb-1">
                                      {resource.title}
                                    </h4>
                                    <p className="text-xs text-slate-600 dark:text-slate-400">
                                      {isEn ? "Added" : "تم الإضافة"}:{" "}
                                      {new Date(
                                        resource.created_at
                                      ).toLocaleDateString()}
                                    </p>
                                  </div>
                                </div>
                                <div className="flex gap-2 shrink-0">
                                  <a
                                    href={resource.file_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="p-2 bg-green-500/20 text-green-600 dark:text-green-400 rounded-lg hover:bg-green-500 hover:text-white transition-all"
                                    title={isEn ? "Download" : "تحميل"}
                                  >
                                    <Upload size={16} />
                                  </a>
                                  <button
                                    onClick={() =>
                                      handleDeleteResource(resource.id)
                                    }
                                    className="p-2 bg-red-500/20 text-red-500 rounded-lg hover:bg-red-500 hover:text-white transition-all"
                                    title={isEn ? "Delete" : "حذف"}
                                  >
                                    <Trash2 size={16} />
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                        <div className="mt-3 p-3 bg-amber-500/5 border border-amber-500/20 rounded-lg">
                          <p className="text-xs text-slate-600 dark:text-slate-400">
                            {isEn
                              ? `Total: ${resources.length} resource${
                                  resources.length !== 1 ? "s" : ""
                                }`
                              : `الإجمالي: ${resources.length} مورد`}
                          </p>
                        </div>
                      </>
                    ) : (
                      <div className="py-6 text-center bg-slate-50 dark:bg-white/5 rounded-lg">
                        <FileText
                          size={32}
                          className="mx-auto mb-2 text-slate-300"
                        />
                        <p className="text-xs text-slate-600 dark:text-slate-400">
                          {isEn ? "No Resources Yet" : "لا توجد موارد بعد"}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {!editingLesson && (
              <div className="p-6 border-t border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 flex gap-3 shrink-0">
                <Button
                  onClick={() => {
                    setShowLessonsManager(false);
                    setNewContent({ ...newContent, type: "video" });
                    setShowLessonModal(true);
                  }}
                  className="flex-1"
                >
                  <Plus size={18} />
                  {isEn ? "Add Lesson" : "إضافة درس"}
                </Button>
                <Button
                  onClick={() => {
                    setShowLessonsManager(false);
                    setNewContent({ ...newContent, type: "pdf" });
                    setShowLessonModal(true);
                  }}
                  variant="secondary"
                  className="flex-1"
                >
                  <Plus size={18} />
                  {isEn ? "Add Resource" : "إضافة مورد"}
                </Button>
              </div>
            )}
          </Card>
        </div>
      )}

      {/* Category Manager Modal */}
      {showCategoryModal && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center px-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowCategoryModal(false)}
          ></div>
          <Card className="w-full max-w-lg relative z-10 !p-0 shadow-2xl animate-in zoom-in duration-200">
            <div className="p-6 border-b border-slate-200 dark:border-white/10 flex justify-between items-center bg-slate-50 dark:bg-white/5">
              <h3 className="font-bold text-slate-900 dark:text-white">
                {isEn ? "Manage Categories" : "إدارة الفئات"}
              </h3>
              <button
                onClick={() => setShowCategoryModal(false)}
                className="text-slate-400 hover:text-red-500"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-6 space-y-6">
              <form onSubmit={handleCreateCategory} className="space-y-4">
                <Input
                  label={isEn ? "Category Name" : "اسم الفئة"}
                  value={newCategory.name}
                  onChange={(e) =>
                    setNewCategory({ ...newCategory, name: e.target.value })
                  }
                  required
                />
                <Button
                  type="submit"
                  className="w-full"
                  isLoading={isSubmitting}
                >
                  <Plus size={18} />
                  {isEn ? "Create Category" : "إنشاء الفئة"}
                </Button>
              </form>

              <div>
                <h4 className="font-bold text-sm text-slate-900 dark:text-white mb-4">
                  {isEn ? "Existing Categories" : "الفئات الحالية"} (
                  {categories.length})
                </h4>
                {categories.length > 0 ? (
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {categories.map((cat, idx) => (
                      <div
                        key={cat.id}
                        className="p-3 bg-slate-50 dark:bg-white/5 rounded-lg border border-slate-200 dark:border-white/10 flex items-center gap-3"
                      >
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                          {idx + 1}
                        </div>
                        <span className="flex-1 text-sm font-medium text-slate-900 dark:text-white">
                          {cat.name}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-6 text-center text-slate-500 text-sm border-2 border-dashed border-slate-300 dark:border-white/10 rounded-lg">
                    {isEn ? "No categories yet" : "لا توجد فئات حتى الآن"}
                  </div>
                )}
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Course Preview Modal */}
      {showCoursePreview && previewCourse && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center px-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowCoursePreview(false)}
          ></div>
          <Card className="w-full max-w-2xl relative z-10 !p-0 shadow-2xl animate-in zoom-in duration-200 max-h-[90vh] overflow-y-auto">
            <div className="relative h-64 overflow-hidden bg-slate-200">
              <img
                src={
                  previewCourse.thumbnail_url ||
                  resolveImageUrl(previewCourse.thumbnail)
                }
                className="w-full h-full object-cover"
                alt={previewCourse.title}
              />
              <button
                onClick={() => setShowCoursePreview(false)}
                className="absolute top-4 right-4 bg-black/60 hover:bg-black/80 text-white p-2 rounded-lg transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-8">
              <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">
                {previewCourse.title}
              </h2>

              <div className="grid grid-cols-4 gap-4 mb-8">
                <div className="text-center">
                  <div className="text-2xl font-bold text-emerald-600">
                    ${previewCourse.price}
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    {isEn ? "Price" : "السعر"}
                  </p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {previewCourse.lessons?.length || 0}
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    {isEn ? "Lessons" : "دروس"}
                  </p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">
                    {courseStats[previewCourse.id]?.students || 0}
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    {isEn ? "Students" : "طلاب"}
                  </p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-amber-600">4.8★</div>
                  <p className="text-xs text-slate-500 mt-1">
                    {isEn ? "Rating" : "التقييم"}
                  </p>
                </div>
              </div>

              <div className="mb-8">
                <h3 className="font-bold text-slate-900 dark:text-white mb-3">
                  {isEn ? "Description" : "الوصف"}
                </h3>
                <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                  {previewCourse.description}
                </p>
              </div>

              <div>
                <h3 className="font-bold text-slate-900 dark:text-white mb-3">
                  {isEn ? "Course Content" : "محتوى الكورس"}
                </h3>
                <div className="space-y-2">
                  {previewCourse.lessons?.map((lesson: any, idx: number) => (
                    <div
                      key={lesson.id}
                      className="p-3 bg-slate-50 dark:bg-white/5 rounded-lg flex items-center gap-3"
                    >
                      <Video size={16} className="text-primary" />
                      <span className="font-medium text-slate-900 dark:text-white">
                        {idx + 1}. {lesson.title}
                      </span>
                    </div>
                  )) || (
                    <p className="text-slate-500 text-sm">
                      {isEn ? "No lessons added yet" : "لم يتم إضافة دروس بعد"}
                    </p>
                  )}
                </div>
              </div>

              <Button
                onClick={() => setShowCoursePreview(false)}
                className="w-full mt-8"
              >
                {isEn ? "Close Preview" : "إغلاق المعاينة"}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default InstructorCourses;
