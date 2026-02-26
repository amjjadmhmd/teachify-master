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
import type {
  SaveLandingCourseRequest,
  SaveLandingBlogRequest,
  SaveLandingProjectRequest,
} from "../../api/types";
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
import { nextStaticCourseId, upsertStaticCourse } from "../../utils/staticCourses";
import { ASSETS } from "../../constants/assets";

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

const getErrorMessage = (error: unknown, fallback: string): string => {
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return fallback;
};

type CourseAnalytics = {
  students: number;
  revenue: number;
  completionRate: number | null;
  rating: number | null;
};

const parseFiniteNumber = (value: unknown): number | null => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const clampNumber = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value));

const buildCourseAnalytics = (course: Partial<Course>): CourseAnalytics => {
  const studentsRaw =
    parseFiniteNumber((course as any)?.enrolled_students) ??
    parseFiniteNumber(course.students_count) ??
    0;
  const students = Math.max(0, Math.round(studentsRaw));

  const pricePerStudent =
    parseFiniteNumber((course as any)?.price_recorded) ??
    parseFiniteNumber(course.price) ??
    0;
  const revenueRaw = parseFiniteNumber(course.revenue);
  const revenueBase = revenueRaw ?? students * pricePerStudent;
  const revenue = Math.max(0, Math.round(revenueBase * 100) / 100);

  const completionRaw = parseFiniteNumber(course.progress);
  const completionRate =
    completionRaw === null ? null : Math.round(clampNumber(completionRaw, 0, 100));

  const ratingRaw =
    parseFiniteNumber((course as any)?.rating_value) ??
    parseFiniteNumber(course.rating);
  const rating =
    ratingRaw === null || ratingRaw <= 0
      ? null
      : Math.round(clampNumber(ratingRaw, 0, 5) * 10) / 10;

  return {
    students,
    revenue,
    completionRate,
    rating,
  };
};

const formatCurrencyCompact = (value: number): string =>
  value.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });

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
  const [courseStats, setCourseStats] = useState<Record<number, CourseAnalytics>>(
    {}
  );
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

  const [showStaticBuilderModal, setShowStaticBuilderModal] = useState(false);
  const [showBlogBuilderModal, setShowBlogBuilderModal] = useState(false);
  const [showProjectBuilderModal, setShowProjectBuilderModal] = useState(false);
  const [staticCourseForm, setStaticCourseForm] = useState({
    title: "",
    description: "",
    livePrice: "0.00",
    offlinePrice: "0.00",
    recordedPrice: "0.00",
    thumbnailUrl: "",
    instructorName: "",
    instructorImageUrl: "",
    level: "",
    language: "",
    durationLabel: "",
    requirements: "",
    outcomes: "",
  });
  const [staticEpisodes, setStaticEpisodes] = useState([
    { title: "", description: "", duration_minutes: 20 },
  ]);
  const [blogForm, setBlogForm] = useState({
    title: "",
    shortDescription: "",
    content: "",
    imageUrl: "",
    authorName: "",
    readTimeMinutes: "5",
    resourceLinks: "",
  });
  const [blogResourceFile, setBlogResourceFile] = useState<File | null>(null);
  const [projectForm, setProjectForm] = useState({
    title: "",
    shortDescription: "",
    description: "",
    imageUrl: "",
    projectType: "",
    clientName: "",
    externalUrl: "",
  });
  const [projectPdfFile, setProjectPdfFile] = useState<File | null>(null);

  const fetchCourses = async () => {
    try {
      const data = await api.courses.getInstructorDashboard();
      setCourses(data?.my_courses || []);

      const stats: Record<number, CourseAnalytics> = {};
      data?.my_courses?.forEach((course: Course) => {
        stats[course.id] = buildCourseAnalytics(course);
      });
      setCourseStats(stats);
    } catch (error) {
      console.error("Failed to fetch courses:", error);
      showToast(
        isEn ? "Failed to load courses" : "ÙØ´Ù„ ØªØ­Ù…ÙŠÙ„ Ø§Ù„ÙƒÙˆØ±Ø³Ø§Øª",
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
        isEn ? "Failed to load categories" : "ÙØ´Ù„ ØªØ­Ù…ÙŠÙ„ Ø§Ù„ÙØ¦Ø§Øª",
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
          isEn ? "Failed to load lessons" : "ÙØ´Ù„ ØªØ­Ù…ÙŠÙ„ Ø§Ù„Ø¯Ø±ÙˆØ³",
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
        showToast(isEn ? "Draft saved" : "ØªÙ… Ø­ÙØ¸ Ø§Ù„Ù…Ø³ÙˆØ¯Ø©", "info");
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
      showToast(isEn ? "No courses selected" : "Ù„Ù… ÙŠØªÙ… ØªØ­Ø¯ÙŠØ¯ ÙƒÙˆØ±Ø³Ø§Øª", "info");
      return;
    }

    if (
      !window.confirm(
        isEn
          ? `Delete ${selectedCourses.size} courses?`
          : `Ø­Ø°Ù ${selectedCourses.size} ÙƒÙˆØ±Ø³Ø§ØªØŸ`
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
          : `ØªÙ… Ø­Ø°Ù ${selectedCourses.size} ÙƒÙˆØ±Ø³Ø§Øª`,
        "success"
      );
      setSelectedCourses(new Set());
      fetchCourses();
    } catch (error) {
      console.error("Failed to delete courses:", error);
      showToast(
        isEn ? "Failed to delete courses" : "ÙØ´Ù„ Ø­Ø°Ù Ø§Ù„ÙƒÙˆØ±Ø³Ø§Øª",
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
        isEn ? "Please enter a category name" : "Ø§Ù„Ø±Ø¬Ø§Ø¡ Ø¥Ø¯Ø®Ø§Ù„ Ø§Ø³Ù… Ø§Ù„ÙØ¦Ø©",
        "error"
      );
      return;
    }
    setIsSubmitting(true);
    try {
      await api.categories.create(newCategory);
      showToast(isEn ? "Category created" : "ØªÙ… Ø¥Ù†Ø´Ø§Ø¡ Ø§Ù„ÙØ¦Ø©", "success");
      fetchCategories();
      setTimeout(() => {
        setShowCategoryModal(false);
        setNewCategory({ name: "" });
      }, 1000);
    } catch (e: any) {
      showToast(
        isEn ? "Failed to create category" : "ÙØ´Ù„ Ø¥Ù†Ø´Ø§Ø¡ Ø§Ù„ÙØ¦Ø©",
        "error"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateCourse = async (e: React.FormEvent) => {
    e.preventDefault();

    const title = newCourse.title.trim();
    const description = newCourse.description.trim();

    if (!title) {
      showToast(
        isEn ? "Please enter course title" : "Ø§Ù„Ø±Ø¬Ø§Ø¡ Ø¥Ø¯Ø®Ø§Ù„ Ø¹Ù†ÙˆØ§Ù† Ø§Ù„ÙƒÙˆØ±Ø³",
        "error"
      );
      return;
    }
    if (!description) {
      showToast(
        isEn ? "Please enter course description" : "Ø§Ù„Ø±Ø¬Ø§Ø¡ Ø¥Ø¯Ø®Ø§Ù„ ÙˆØµÙ Ø§Ù„ÙƒÙˆØ±Ø³",
        "error"
      );
      return;
    }
    if (categories.length > 0 && !newCourse.category) {
      showToast(
        isEn ? "Please select a category" : "Ø§Ù„Ø±Ø¬Ø§Ø¡ Ø§Ø®ØªÙŠØ§Ø± ÙØ¦Ø©",
        "error"
      );
      return;
    }
    if (!newCourse.thumbnail) {
      showToast(
        isEn ? "Please upload a thumbnail" : "Ø§Ù„Ø±Ø¬Ø§Ø¡ Ø±ÙØ¹ ØµÙˆØ±Ø© Ø§Ù„ÙƒÙˆØ±Ø³",
        "error"
      );
      return;
    }

    setIsSubmitting(true);
    try {
      const createPayload: any = {
        title,
        description,
        price: parseFloat(newCourse.price) || 0,
        thumbnail: newCourse.thumbnail,
      };

      if (newCourse.category) {
        createPayload.category = newCourse.category;
      }

      await api.instructor.createCourse(createPayload);
      showToast(
        isEn ? "Course created successfully" : "ØªÙ… Ø¥Ù†Ø´Ø§Ø¡ Ø§Ù„ÙƒÙˆØ±Ø³ Ø¨Ù†Ø¬Ø§Ø­",
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
      showToast(
        getErrorMessage(
          e,
          isEn ? "Failed to create course" : "ÙØ´Ù„ Ø¥Ù†Ø´Ø§Ø¡ Ø§Ù„ÙƒÙˆØ±Ø³"
        ),
        "error"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const addStaticEpisode = () => {
    setStaticEpisodes((prev) => [
      ...prev,
      { title: "", description: "", duration_minutes: 20 },
    ]);
  };

  const updateStaticEpisode = (
    index: number,
    field: "title" | "description" | "duration_minutes",
    value: string
  ) => {
    setStaticEpisodes((prev) =>
      prev.map((episode, episodeIndex) =>
        episodeIndex === index
          ? {
              ...episode,
              [field]:
                field === "duration_minutes"
                  ? Math.max(1, Number(value || 0))
                  : value,
            }
          : episode
      )
    );
  };

  const removeStaticEpisode = (index: number) => {
    setStaticEpisodes((prev) =>
      prev.length <= 1 ? prev : prev.filter((_, episodeIndex) => episodeIndex !== index)
    );
  };

  const resetStaticBuilder = () => {
    setStaticCourseForm({
      title: "",
      description: "",
      livePrice: "0.00",
      offlinePrice: "0.00",
      recordedPrice: "0.00",
      thumbnailUrl: "",
      instructorName: "",
      instructorImageUrl: "",
      level: "",
      language: "",
      durationLabel: "",
      requirements: "",
      outcomes: "",
    });
    setStaticEpisodes([{ title: "", description: "", duration_minutes: 20 }]);
  };

  const resetBlogBuilder = () => {
    setBlogForm({
      title: "",
      shortDescription: "",
      content: "",
      imageUrl: "",
      authorName: "",
      readTimeMinutes: "5",
      resourceLinks: "",
    });
    setBlogResourceFile(null);
  };

  const resetProjectBuilder = () => {
    setProjectForm({
      title: "",
      shortDescription: "",
      description: "",
      imageUrl: "",
      projectType: "",
      clientName: "",
      externalUrl: "",
    });
    setProjectPdfFile(null);
  };

  const handleCreateStaticCourse = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!staticCourseForm.title.trim()) {
      showToast(
        isEn ? "Please add static course title" : "ÙŠØ±Ø¬Ù‰ Ø¥Ø¯Ø®Ø§Ù„ Ø¹Ù†ÙˆØ§Ù† Ø§Ù„ÙƒÙˆØ±Ø³",
        "error"
      );
      return;
    }

    const hasInvalidEpisode = staticEpisodes.some(
      (episode) => !episode.title.trim()
    );
    if (hasInvalidEpisode) {
      showToast(
        isEn ? "Each episode needs a title" : "ÙƒÙ„ Ø­Ù„Ù‚Ø© Ù„Ø§Ø²Ù… ÙŠÙƒÙˆÙ† Ù„Ù‡Ø§ Ø¹Ù†ÙˆØ§Ù†",
        "error"
      );
      return;
    }

    const requirements = staticCourseForm.requirements
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);
    const outcomes = staticCourseForm.outcomes
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);
    const title = staticCourseForm.title.trim();
    const description =
      staticCourseForm.description.trim() ||
      (isEn
        ? "Static course created from instructor builder."
        : "ÙƒÙˆØ±Ø³ Ø³ØªØ§ØªÙŠÙƒ ØªÙ… Ø¥Ù†Ø´Ø§Ø¤Ù‡ Ù…Ù† ÙˆØ§Ø¬Ù‡Ø© Ø§Ù„Ù…Ø¯Ø±Ø¨.");
    const thumbnail = staticCourseForm.thumbnailUrl.trim() || ASSETS.COURSES.CLOUD;
    const livePrice = Math.max(0, Number(staticCourseForm.livePrice || 0));
    const offlinePrice = Math.max(0, Number(staticCourseForm.offlinePrice || 0));
    const recordedPrice = Math.max(0, Number(staticCourseForm.recordedPrice || 0));
    const fallbackPrice = recordedPrice || livePrice || offlinePrice || 0;
    const totalDurationMinutes = staticEpisodes.reduce(
      (sum, episode) => sum + Math.max(1, Number(episode.duration_minutes || 0)),
      0
    );
    const computedDurationLabel =
      staticCourseForm.durationLabel.trim() ||
      (isEn
        ? `${totalDurationMinutes} minutes`
        : `${totalDurationMinutes} دقيقة`);

    const landingPayload: SaveLandingCourseRequest = {
      title,
      short_description: description.slice(0, 280),
      description,
      image_url: thumbnail,
      price: fallbackPrice.toFixed(2),
      price_live: livePrice.toFixed(2),
      price_offline: offlinePrice.toFixed(2),
      price_recorded: recordedPrice.toFixed(2),
      is_free: livePrice <= 0 && offlinePrice <= 0 && recordedPrice <= 0,
      instructor_name:
        staticCourseForm.instructorName.trim() ||
        (isEn ? "Geo Top Instructor" : "Ù…Ø¯Ø±Ø¨ Geo Top"),
      instructor_image_url: staticCourseForm.instructorImageUrl.trim(),
      level_label:
        staticCourseForm.level.trim() ||
        (isEn ? "Professional Track" : "Ù…Ø³Ø§Ø± Ø§Ø­ØªØ±Ø§ÙÙŠ"),
      course_language:
        staticCourseForm.language.trim() ||
        (isEn ? "Arabic / English" : "Ø§Ù„Ø¹Ø±Ø¨ÙŠØ© / Ø§Ù„Ø¥Ù†Ø¬Ù„ÙŠØ²ÙŠØ©"),
      duration_label: computedDurationLabel,
      rating_value: 0,
      enrolled_students: 0,
      requirements,
      outcomes,
      sort_order: 0,
      is_published: true,
      episodes: staticEpisodes.map((episode, index) => ({
        title: episode.title.trim(),
        description: episode.description.trim(),
        duration_minutes: Math.max(1, Number(episode.duration_minutes || 0)),
        video_url: "",
        sort_order: index,
      })),
    };

    setIsSubmitting(true);
    try {
      await api.courses.createLanding(landingPayload);
      showToast(
        isEn
          ? "Course saved to landing page successfully."
          : "ØªÙ… Ø­ÙØ¸ Ø§Ù„ÙƒÙˆØ±Ø³ ÙÙŠ Ø§Ù„Ù„Ø§Ù†Ø¯ÙŠÙ†Ø¬ Ø¨Ù†Ø¬Ø§Ø­.",
        "success"
      );
      setShowStaticBuilderModal(false);
      resetStaticBuilder();
      return;
    } catch (error) {
      console.error("Failed to save landing course to backend, using local fallback:", error);
      const createdAt = new Date().toISOString();
      const courseId = nextStaticCourseId();
      const categoryId = newCourse.category || categories[0]?.id || 1;

      const staticCourse = {
        id: courseId,
        title,
        description,
        instructor_id: 0,
        category: categoryId,
        price: fallbackPrice.toFixed(2),
        thumbnail,
        thumbnail_url: thumbnail,
        created_at: createdAt,
        is_enrolled: true,
        lessons: staticEpisodes.map((episode, index) => ({
          id: courseId * 100 + index + 1,
          title: episode.title.trim(),
          description: episode.description.trim(),
          video_url: "",
          order: index + 1,
          duration_minutes: Math.max(1, Number(episode.duration_minutes || 0)),
          is_completed: false,
        })),
        resources: [],
        progress: 0,
        status: "published",
        static_source: "instructor",
        instructor_name:
          staticCourseForm.instructorName.trim() ||
          (isEn ? "Geo Top Instructor" : "Ù…Ø¯Ø±Ø¨ Geo Top"),
        instructor_image_url: staticCourseForm.instructorImageUrl.trim(),
        level_label:
          staticCourseForm.level.trim() ||
          (isEn ? "Professional Track" : "Ù…Ø³Ø§Ø± Ø§Ø­ØªØ±Ø§ÙÙŠ"),
        course_language:
          staticCourseForm.language.trim() ||
          (isEn ? "Arabic / English" : "Ø§Ù„Ø¹Ø±Ø¨ÙŠØ© / Ø§Ù„Ø¥Ù†Ø¬Ù„ÙŠØ²ÙŠØ©"),
        duration_label: computedDurationLabel,
        price_live: livePrice.toFixed(2),
        price_offline: offlinePrice.toFixed(2),
        price_recorded: recordedPrice.toFixed(2),
        rating_value: 0,
        enrolled_students: 0,
        requirements,
        outcomes,
        last_updated: createdAt,
      } as any;

      upsertStaticCourse(staticCourse);
      showToast(
        isEn
          ? "Saved locally as static preview (backend unavailable or unauthorized)."
          : "ØªÙ… Ø§Ù„Ø­ÙØ¸ Ù…Ø­Ù„ÙŠÙ‹Ø§ ÙƒÙ…Ø¹Ø§ÙŠÙ†Ø© Ø³ØªØ§ØªÙŠÙƒ (Ø§Ù„Ø³ÙŠØ±ÙØ± ØºÙŠØ± Ù…ØªØ§Ø­ Ø£Ùˆ Ù„Ø§ ØªÙˆØ¬Ø¯ ØµÙ„Ø§Ø­ÙŠØ©).",
        "info"
      );
      setShowStaticBuilderModal(false);
      resetStaticBuilder();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateLandingBlog = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!blogForm.title.trim()) {
      showToast(isEn ? "Please add blog title" : "يرجى إدخال عنوان البلوج", "error");
      return;
    }
    if (!blogForm.content.trim()) {
      showToast(isEn ? "Please add blog content" : "يرجى إدخال محتوى البلوج", "error");
      return;
    }

    const resourceLinks = blogForm.resourceLinks
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);

    const payload: SaveLandingBlogRequest = {
      title: blogForm.title.trim(),
      short_description: blogForm.shortDescription.trim(),
      content: blogForm.content.trim(),
      image_url: blogForm.imageUrl.trim(),
      author_name:
        blogForm.authorName.trim() ||
        (isEn ? "Geo Top Instructor" : "مدرب Geo Top"),
      read_time_minutes: Math.max(1, Number(blogForm.readTimeMinutes || 1)),
      resource_links: resourceLinks,
      resource_file: blogResourceFile,
      is_published: true,
      sort_order: 0,
    };

    setIsSubmitting(true);
    try {
      await api.courses.createLandingBlog(payload);
      showToast(
        isEn ? "Blog published to landing page." : "تم نشر البلوج في اللاندنج.",
        "success"
      );
      setShowBlogBuilderModal(false);
      resetBlogBuilder();
    } catch (error) {
      console.error("Failed to create landing blog:", error);
      showToast(
        getErrorMessage(
          error,
          isEn ? "Failed to publish blog." : "فشل نشر البلوج."
        ),
        "error"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateLandingProject = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!projectForm.title.trim()) {
      showToast(isEn ? "Please add project title" : "يرجى إدخال عنوان المشروع", "error");
      return;
    }
    if (!projectPdfFile) {
      showToast(
        isEn ? "Please upload the project PDF" : "يرجى رفع ملف المشروع PDF",
        "error"
      );
      return;
    }

    const payload: SaveLandingProjectRequest = {
      title: projectForm.title.trim(),
      short_description: projectForm.shortDescription.trim(),
      description: projectForm.description.trim(),
      image_url: projectForm.imageUrl.trim(),
      project_type: projectForm.projectType.trim(),
      client_name: projectForm.clientName.trim(),
      external_url: projectForm.externalUrl.trim(),
      project_pdf: projectPdfFile,
      is_published: true,
      sort_order: 0,
    };

    setIsSubmitting(true);
    try {
      await api.courses.createLandingProject(payload);
      showToast(
        isEn ? "Project published to landing page." : "تم نشر المشروع في اللاندنج.",
        "success"
      );
      setShowProjectBuilderModal(false);
      resetProjectBuilder();
    } catch (error) {
      console.error("Failed to create landing project:", error);
      showToast(
        getErrorMessage(
          error,
          isEn ? "Failed to publish project." : "فشل نشر المشروع."
        ),
        "error"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteCourse = async (courseId: number) => {
    if (
      !window.confirm(
        isEn
          ? "Are you sure you want to delete this course?"
          : "Ù‡Ù„ Ø£Ù†Øª Ù…ØªØ£ÙƒØ¯ Ù…Ù† Ø­Ø°Ù Ù‡Ø°Ø§ Ø§Ù„ÙƒÙˆØ±Ø³ØŸ"
      )
    ) {
      return;
    }

    try {
      await api.courses.delete(courseId);
      showToast(isEn ? "Course deleted" : "ØªÙ… Ø­Ø°Ù Ø§Ù„ÙƒÙˆØ±Ø³", "success");
      fetchCourses();
    } catch (error) {
      console.error("Failed to delete course:", error);
      showToast(isEn ? "Failed to delete course" : "ÙØ´Ù„ Ø­Ø°Ù Ø§Ù„ÙƒÙˆØ±Ø³", "error");
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

    const title = newCourse.title.trim();
    const description = newCourse.description.trim();

    if (!title) {
      showToast(
        isEn ? "Please enter course title" : "Ø§Ù„Ø±Ø¬Ø§Ø¡ Ø¥Ø¯Ø®Ø§Ù„ Ø¹Ù†ÙˆØ§Ù† Ø§Ù„ÙƒÙˆØ±Ø³",
        "error"
      );
      return;
    }
    if (!description) {
      showToast(
        isEn ? "Please enter course description" : "Ø§Ù„Ø±Ø¬Ø§Ø¡ Ø¥Ø¯Ø®Ø§Ù„ ÙˆØµÙ Ø§Ù„ÙƒÙˆØ±Ø³",
        "error"
      );
      return;
    }

    setIsSubmitting(true);
    try {
      const updateData: any = {
        title,
        description,
        price: parseFloat(newCourse.price) || 0,
        category: newCourse.category,
      };

      if (newCourse.thumbnail instanceof File) {
        updateData.thumbnail = newCourse.thumbnail;
      }

      await api.courses.update(selectedCourse.id, updateData);
      showToast(isEn ? "Course updated" : "ØªÙ… ØªØ­Ø¯ÙŠØ« Ø§Ù„ÙƒÙˆØ±Ø³", "success");
      fetchCourses();
      setTimeout(() => {
        setShowEditModal(false);
        setSelectedCourse(null);
        setDraftCourseId(null);
      }, 1000);
    } catch (error) {
      console.error("Failed to update course:", error);
      showToast(
        getErrorMessage(
          error,
          isEn ? "Failed to update course" : "ÙØ´Ù„ ØªØ­Ø¯ÙŠØ« Ø§Ù„ÙƒÙˆØ±Ø³"
        ),
        "error"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddContent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourse || !newContent.file || !newContent.title) return;
    
    // Duration required only for videos
    if (newContent.type === "video" && !newContent.duration_minutes) {
      showToast(isEn ? "Please enter lesson duration" : "Ø§Ù„Ø±Ø¬Ø§Ø¡ Ø¥Ø¯Ø®Ø§Ù„ Ù…Ø¯Ø© Ø§Ù„Ø¯Ø±Ø³", "error");
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
        isEn ? "Lesson added successfully" : "ØªÙ… Ø¥Ø¶Ø§ÙØ© Ø§Ù„Ø¯Ø±Ø³ Ø¨Ù†Ø¬Ø§Ø­",
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
      showToast(isEn ? "Failed to upload content" : "ÙØ´Ù„ Ø±ÙØ¹ Ø§Ù„Ù…Ø­ØªÙˆÙ‰", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteLesson = async (lessonId: number) => {
    if (
      !window.confirm(
        isEn
          ? "Are you sure you want to delete this lesson?"
          : "Ù‡Ù„ Ø£Ù†Øª Ù…ØªØ£ÙƒØ¯ Ù…Ù† Ø­Ø°Ù Ù‡Ø°Ø§ Ø§Ù„Ø¯Ø±Ø³ØŸ"
      )
    ) {
      return;
    }

    try {
      await api.lessons.delete(lessonId);
      showToast(isEn ? "Lesson deleted" : "ØªÙ… Ø­Ø°Ù Ø§Ù„Ø¯Ø±Ø³", "success");

      if (expandedCourse) {
        fetchLessons(expandedCourse);
      }
      fetchCourses();
    } catch (error) {
      console.error("Failed to delete lesson:", error);
      showToast(isEn ? "Failed to delete lesson" : "ÙØ´Ù„ Ø­Ø°Ù Ø§Ù„Ø¯Ø±Ø³", "error");
    }
  };

  const handleDeleteResource = async (resourceId: number) => {
    if (
      !window.confirm(
        isEn
          ? "Are you sure you want to delete this resource?"
          : "Ù‡Ù„ Ø£Ù†Øª Ù…ØªØ£ÙƒØ¯ Ù…Ù† Ø­Ø°Ù Ù‡Ø°Ø§ Ø§Ù„Ù…ÙˆØ±Ø¯ØŸ"
      )
    ) {
      return;
    }

    try {
      // Note: You may need to add a delete endpoint for resources if it doesn't exist
      // For now, we'll use a generic delete approach
      await apiClient.delete(`/api/courses/resources/${resourceId}/`);
      showToast(isEn ? "Resource deleted" : "ØªÙ… Ø­Ø°Ù Ø§Ù„Ù…ÙˆØ±Ø¯", "success");

      if (selectedCourse) {
        fetchLessons(selectedCourse.id);
      }
      fetchCourses();
    } catch (error) {
      console.error("Failed to delete resource:", error);
      showToast(isEn ? "Failed to delete resource" : "ÙØ´Ù„ Ø­Ø°Ù Ø§Ù„Ù…ÙˆØ±Ø¯", "error");
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

      showToast(isEn ? "Lesson updated" : "ØªÙ… ØªØ­Ø¯ÙŠØ« Ø§Ù„Ø¯Ø±Ø³", "success");
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
      showToast(isEn ? "Failed to update lesson" : "ÙØ´Ù„ ØªØ­Ø¯ÙŠØ« Ø§Ù„Ø¯Ø±Ø³", "error");
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
      showToast(isEn ? "Lesson reordered" : "ØªÙ… Ø¥Ø¹Ø§Ø¯Ø© ØªØ±ØªÙŠØ¨ Ø§Ù„Ø¯Ø±Ø³", "success");
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
                  : "Ù…Ù†Ø´ÙˆØ±"
                : isEn
                ? "Draft"
                : "Ù…Ø³ÙˆØ¯Ø©"}
            </div>

            {/* Draft indicator */}
            {draftCourseId === course.id && (
              <div className="absolute bottom-2 right-2 bg-amber-500 text-white text-[10px] font-bold px-2 py-1 rounded-md flex items-center gap-1">
                <Clock size={12} /> {isEn ? "Draft" : "Ù…Ø³ÙˆØ¯Ø©"}
              </div>
            )}

            {/* Edit & Delete buttons */}
            <div className="absolute top-2 left-14 flex gap-2">
              <button
                onClick={() => handleEditCourse(course)}
                className="bg-blue-500/80 hover:bg-blue-600 text-white p-2 rounded-lg transition-colors"
                title={isEn ? "Edit" : "ØªØ­Ø±ÙŠØ±"}
              >
                <Edit2 size={16} />
              </button>
              <button
                onClick={() => handleDeleteCourse(course.id)}
                className="bg-red-500/80 hover:bg-red-600 text-white p-2 rounded-lg transition-colors"
                title={isEn ? "Delete" : "Ø­Ø°Ù"}
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
                    {isEn ? "Students" : "Ø·Ù„Ø§Ø¨"}
                  </p>
                </div>
                <div className="text-center">
                  <div className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                    ${formatCurrencyCompact(stats.revenue)}
                  </div>
                  <p className="text-[10px] text-slate-500">
                    {isEn ? "Revenue" : "Ø§Ù„Ø¥ÙŠØ±Ø§Ø¯Ø§Øª"}
                  </p>
                </div>
                <div className="text-center">
                  <div className="text-sm font-bold text-sky-600 dark:text-sky-400">
                    {stats.completionRate !== null ? `${stats.completionRate}%` : "N/A"}
                  </div>
                  <p className="text-[10px] text-slate-500">
                    {isEn ? "Complete" : "Ù…ÙƒØªÙ…Ù„"}
                  </p>
                </div>
              </div>
            )}

            <div className="flex items-center justify-between mb-4 text-sm">
              <span className="font-semibold text-slate-900 dark:text-white">
                ${course.price}
              </span>
              <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                {course.lessons?.length || 0} {isEn ? "lessons" : "Ø¯Ø±ÙˆØ³"}
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
                  {isEn ? "Manage Content" : "Ø¥Ø¯Ø§Ø±Ø© Ø§Ù„Ù…Ø­ØªÙˆÙ‰"}
                </span>
                <span className="flex gap-1">
                  <span
                    className="bg-primary/20 px-2 py-0.5 rounded text-[10px] font-bold"
                    title={isEn ? "Lessons" : "Ø§Ù„Ø¯Ø±ÙˆØ³"}
                  >
                    {course.lessons?.length || 0}L
                  </span>
                  <span
                    className="bg-amber-500/20 px-2 py-0.5 rounded text-[10px] font-bold text-amber-600 dark:text-amber-400"
                    title={isEn ? "Resources" : "Ø§Ù„Ù…ÙˆØ§Ø±Ø¯"}
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
                  <Video size={14} /> {isEn ? "Add Video" : "Ø¥Ø¶Ø§ÙØ© ÙÙŠØ¯ÙŠÙˆ"}
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
                  <Eye size={14} /> {isEn ? "Preview" : "Ù…Ø¹Ø§ÙŠÙ†Ø©"}
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
              {isEn ? "My Courses" : "ÙƒÙˆØ±Ø³Ø§ØªÙŠ"} (
              {filteredAndSortedCourses.length})
            </h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1">
              {isEn
                ? "Manage and organize your content"
                : "Ø¥Ø¯Ø§Ø±Ø© ÙˆØªÙ†Ø¸ÙŠÙ… Ø§Ù„Ù…Ø­ØªÙˆÙ‰ Ø§Ù„Ø®Ø§Øµ Ø¨Ùƒ"}
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
                {isEn ? "Delete" : "Ø­Ø°Ù"} ({selectedCourses.size})
              </Button>
            )}
            <Button
              variant="secondary"
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            >
              <Filter size={18} /> {isEn ? "Filters" : "Ø§Ù„Ù…Ø±Ø´Ø­Ø§Øª"}
            </Button>
            <Button
              variant="secondary"
              onClick={() => setShowCategoryModal(true)}
            >
              <Filter size={18} /> {isEn ? "Categories" : "Ø§Ù„ÙØ¦Ø§Øª"}
            </Button>
            <Button
              variant="secondary"
              onClick={() => setShowStaticBuilderModal(true)}
              className="!bg-emerald-600 !text-white hover:!bg-emerald-700"
            >
              <Video size={18} /> {isEn ? "Landing Course" : "إضافة كورس للاندنج"}
            </Button>
            <Button
              variant="secondary"
              onClick={() => setShowBlogBuilderModal(true)}
              className="!bg-cyan-600 !text-white hover:!bg-cyan-700"
            >
              <FileText size={18} /> {isEn ? "Landing Blog" : "إضافة بلوج"}
            </Button>
            <Button
              variant="secondary"
              onClick={() => setShowProjectBuilderModal(true)}
              className="!bg-amber-600 !text-white hover:!bg-amber-700"
            >
              <Upload size={18} /> {isEn ? "Landing Project" : "إضافة مشروع"}
            </Button>
            <Button onClick={() => setShowAddModal(true)}>
              <Plus size={18} /> {isEn ? "New Course" : "ÙƒÙˆØ±Ø³ Ø¬Ø¯ÙŠØ¯"}
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
                  {isEn ? "Search" : "Ø¨Ø­Ø«"}
                </label>
                <Input
                  placeholder={isEn ? "Course title..." : "Ø¹Ù†ÙˆØ§Ù† Ø§Ù„ÙƒÙˆØ±Ø³..."}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              {/* Category Filter */}
              <div>
                <label className="block text-sm font-bold text-slate-900 dark:text-white mb-2">
                  {isEn ? "Category" : "Ø§Ù„ÙØ¦Ø©"}
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
                    {isEn ? "All Categories" : "Ø¬Ù…ÙŠØ¹ Ø§Ù„ÙØ¦Ø§Øª"}
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
                  {isEn ? "Status" : "Ø§Ù„Ø­Ø§Ù„Ø©"}
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
                  <option value="all">{isEn ? "All" : "Ø§Ù„ÙƒÙ„"}</option>
                  <option value="published">
                    {isEn ? "Published" : "Ù…Ù†Ø´ÙˆØ±"}
                  </option>
                  <option value="draft">{isEn ? "Draft" : "Ù…Ø³ÙˆØ¯Ø©"}</option>
                </select>
              </div>

              {/* Price Range */}
              <div>
                <label className="block text-sm font-bold text-slate-900 dark:text-white mb-2">
                  {isEn ? "Price Range" : "Ù†Ø·Ø§Ù‚ Ø§Ù„Ø³Ø¹Ø±"}
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
                  {isEn ? "Sort By" : "ØªØ±ØªÙŠØ¨ Ø­Ø³Ø¨"}
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
                    <option value="title">{isEn ? "Title" : "Ø§Ù„Ø¹Ù†ÙˆØ§Ù†"}</option>
                    <option value="price">{isEn ? "Price" : "Ø§Ù„Ø³Ø¹Ø±"}</option>
                    <option value="students">
                      {isEn ? "Students" : "Ø§Ù„Ø·Ù„Ø§Ø¨"}
                    </option>
                    <option value="date">{isEn ? "Date" : "Ø§Ù„ØªØ§Ø±ÙŠØ®"}</option>
                  </select>
                  <button
                    onClick={() =>
                      setSortOrder(sortOrder === "asc" ? "desc" : "asc")
                    }
                    className="px-3 py-2 bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition-all"
                  >
                    {sortOrder === "asc" ? "â†‘" : "â†“"}
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
            {isEn ? "No courses found" : "Ù„Ù… ÙŠØªÙ… Ø§Ù„Ø¹Ø«ÙˆØ± Ø¹Ù„Ù‰ ÙƒÙˆØ±Ø³Ø§Øª"}
          </h3>
          <p className="text-slate-500 mb-6">
            {isEn
              ? "Create your first course or adjust your filters"
              : "Ø£Ù†Ø´Ø¦ Ø£ÙˆÙ„ ÙƒÙˆØ±Ø³ Ù„Ùƒ Ø£Ùˆ Ø¹Ø¯Ù‘Ù„ Ø§Ù„Ù…Ø±Ø´Ø­Ø§Øª"}
          </p>
          <Button onClick={() => setShowAddModal(true)}>
            <Plus size={18} /> {isEn ? "Create Course" : "Ø¥Ù†Ø´Ø§Ø¡ ÙƒÙˆØ±Ø³"}
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
                {isEn ? "Create New Course" : "Ø¥Ù†Ø´Ø§Ø¡ ÙƒÙˆØ±Ø³ Ø¬Ø¯ÙŠØ¯"}
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
                    {isEn ? "Draft auto-saved" : "ØªÙ… Ø­ÙØ¸ Ø§Ù„Ù…Ø³ÙˆØ¯Ø© ØªÙ„Ù‚Ø§Ø¦ÙŠØ§Ù‹"}
                  </p>
                </div>
              )}

              <Input
                label={isEn ? "Course Title" : "Ø¹Ù†ÙˆØ§Ù† Ø§Ù„ÙƒÙˆØ±Ø³"}
                value={newCourse.title}
                onChange={(e) =>
                  setNewCourse({ ...newCourse, title: e.target.value })
                }
                required
              />

              <div>
                <label className="block text-sm font-bold text-slate-900 dark:text-white mb-2">
                  {isEn ? "Description" : "Ø§Ù„ÙˆØµÙ"}
                </label>
                <textarea
                  value={newCourse.description}
                  onChange={(e) =>
                    setNewCourse({ ...newCourse, description: e.target.value })
                  }
                  required
                  className="w-full px-4 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-white/10 rounded-lg text-slate-900 dark:text-white focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-900 dark:text-white mb-2">
                    {isEn ? "Price" : "Ø§Ù„Ø³Ø¹Ø±"}
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
                    {isEn ? "Category" : "Ø§Ù„ÙØ¦Ø©"}
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
                    <option value="">
                      {categories.length
                        ? isEn
                          ? "Select"
                          : "Ø§Ø®ØªØ±"
                        : isEn
                        ? "No categories yet (optional)"
                        : "Ù„Ø§ ØªÙˆØ¬Ø¯ ÙØ¦Ø§Øª Ø­Ø§Ù„ÙŠØ§ (Ø§Ø®ØªÙŠØ§Ø±ÙŠ)"}
                    </option>
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
                      (isEn ? "Upload thumbnail" : "Ø±ÙØ¹ Ø§Ù„ØµÙˆØ±Ø©")}
                  </p>
                  <p className="text-xs text-slate-500">
                    {isEn ? "Click or drag image" : "Ø§Ø¶ØºØ· Ø£Ùˆ Ø§Ø³Ø­Ø¨ ØµÙˆØ±Ø©"}
                  </p>
                </label>
              </div>

              <Button type="submit" className="w-full" isLoading={isSubmitting}>
                <Plus size={18} /> {isEn ? "Create Course" : "Ø¥Ù†Ø´Ø§Ø¡ Ø§Ù„ÙƒÙˆØ±Ø³"}
              </Button>
            </form>
          </Card>
        </div>
      )}

      {/* Static Course Builder Modal */}
      {showStaticBuilderModal && (
        <div className="fixed inset-0 z-[75] flex items-center justify-center px-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => {
              setShowStaticBuilderModal(false);
              resetStaticBuilder();
            }}
          ></div>
          <Card className="w-full max-w-3xl relative z-10 !p-0 shadow-2xl animate-in zoom-in duration-200 max-h-[92vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-200 dark:border-white/10 flex justify-between items-center sticky top-0 bg-gradient-to-r from-emerald-500/10 to-emerald-500/5 z-10">
              <div>
                <h3 className="font-bold text-lg text-slate-900 dark:text-white">
                  {isEn ? "Landing Course Builder" : "منشئ كورس اللاندنج"}
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  {isEn
                    ? "Publish a real landing course with fixed 3-tier pricing."
                    : "نشر كورس حقيقي في اللاندنج مع تسعير ثابت بثلاث فئات."}
                </p>
              </div>
              <button
                onClick={() => {
                  setShowStaticBuilderModal(false);
                  resetStaticBuilder();
                }}
                className="text-slate-400 hover:text-red-500 transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleCreateStaticCourse} className="p-6 space-y-5">
              <div className="grid md:grid-cols-2 gap-4">
                <Input
                  label={isEn ? "Course Title" : "Ø¹Ù†ÙˆØ§Ù† Ø§Ù„ÙƒÙˆØ±Ø³"}
                  value={staticCourseForm.title}
                  onChange={(e) =>
                    setStaticCourseForm((prev) => ({
                      ...prev,
                      title: e.target.value,
                    }))
                  }
                  required
                />
                <Input
                  label={isEn ? "Duration Label" : "مدة الدورة"}
                  value={staticCourseForm.durationLabel}
                  onChange={(e) =>
                    setStaticCourseForm((prev) => ({
                      ...prev,
                      durationLabel: e.target.value,
                    }))
                  }
                  placeholder={isEn ? "e.g. 6 weeks / 24 hours" : "مثال: 6 أسابيع / 24 ساعة"}
                />
              </div>

              <div className="grid md:grid-cols-3 gap-4">
                <Input
                  label={isEn ? "Live Price" : "سعر الدورة اللايف"}
                  type="number"
                  min="0"
                  step="0.01"
                  value={staticCourseForm.livePrice}
                  onChange={(e) =>
                    setStaticCourseForm((prev) => ({
                      ...prev,
                      livePrice: e.target.value,
                    }))
                  }
                />
                <Input
                  label={isEn ? "Offline Price" : "سعر الدورة الأوفلاين"}
                  type="number"
                  min="0"
                  step="0.01"
                  value={staticCourseForm.offlinePrice}
                  onChange={(e) =>
                    setStaticCourseForm((prev) => ({
                      ...prev,
                      offlinePrice: e.target.value,
                    }))
                  }
                />
                <Input
                  label={isEn ? "Recorded Price" : "سعر الدورة المسجلة"}
                  type="number"
                  min="0"
                  step="0.01"
                  value={staticCourseForm.recordedPrice}
                  onChange={(e) =>
                    setStaticCourseForm((prev) => ({
                      ...prev,
                      recordedPrice: e.target.value,
                    }))
                  }
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-900 dark:text-white mb-2">
                  {isEn ? "Course Description" : "ÙˆØµÙ Ø§Ù„ÙƒÙˆØ±Ø³"}
                </label>
                <textarea
                  value={staticCourseForm.description}
                  onChange={(e) =>
                    setStaticCourseForm((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  rows={3}
                  className="w-full px-4 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-white/10 rounded-lg text-slate-900 dark:text-white focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none"
                />
              </div>

              <div className="grid md:grid-cols-3 gap-4">
                <Input
                  label={isEn ? "Instructor Name" : "Ø§Ø³Ù… Ø§Ù„Ù…Ø¯Ø±Ø¨"}
                  value={staticCourseForm.instructorName}
                  onChange={(e) =>
                    setStaticCourseForm((prev) => ({
                      ...prev,
                      instructorName: e.target.value,
                    }))
                  }
                />
                <Input
                  label={isEn ? "Instructor Image URL" : "رابط صورة المحاضر"}
                  value={staticCourseForm.instructorImageUrl}
                  onChange={(e) =>
                    setStaticCourseForm((prev) => ({
                      ...prev,
                      instructorImageUrl: e.target.value,
                    }))
                  }
                  placeholder={isEn ? "https://..." : "https://..."}
                />
                <Input
                  label={isEn ? "Level Label" : "Ù…Ø³ØªÙˆÙ‰ Ø§Ù„ÙƒÙˆØ±Ø³"}
                  value={staticCourseForm.level}
                  onChange={(e) =>
                    setStaticCourseForm((prev) => ({
                      ...prev,
                      level: e.target.value,
                    }))
                  }
                />
              </div>

              <Input
                label={isEn ? "Course Language" : "Ù„ØºØ© Ø§Ù„ÙƒÙˆØ±Ø³"}
                value={staticCourseForm.language}
                onChange={(e) =>
                  setStaticCourseForm((prev) => ({
                    ...prev,
                    language: e.target.value,
                  }))
                }
              />

              <Input
                label={isEn ? "Thumbnail URL" : "Ø±Ø§Ø¨Ø· ØµÙˆØ±Ø© Ø§Ù„ÙƒÙˆØ±Ø³"}
                value={staticCourseForm.thumbnailUrl}
                onChange={(e) =>
                  setStaticCourseForm((prev) => ({
                    ...prev,
                    thumbnailUrl: e.target.value,
                  }))
                }
                placeholder={isEn ? "https://..." : "https://..."}
              />

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-900 dark:text-white mb-2">
                    {isEn ? "Requirements (1 per line)" : "Ø§Ù„Ù…ØªØ·Ù„Ø¨Ø§Øª (ÙƒÙ„ Ø³Ø·Ø± Ù†Ù‚Ø·Ø©)"}
                  </label>
                  <textarea
                    value={staticCourseForm.requirements}
                    onChange={(e) =>
                      setStaticCourseForm((prev) => ({
                        ...prev,
                        requirements: e.target.value,
                      }))
                    }
                    rows={4}
                    className="w-full px-4 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-white/10 rounded-lg text-slate-900 dark:text-white focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-900 dark:text-white mb-2">
                    {isEn ? "Outcomes (1 per line)" : "Ù…Ø®Ø±Ø¬Ø§Øª Ø§Ù„ØªØ¹Ù„Ù… (ÙƒÙ„ Ø³Ø·Ø± Ù†Ù‚Ø·Ø©)"}
                  </label>
                  <textarea
                    value={staticCourseForm.outcomes}
                    onChange={(e) =>
                      setStaticCourseForm((prev) => ({
                        ...prev,
                        outcomes: e.target.value,
                      }))
                    }
                    rows={4}
                    className="w-full px-4 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-white/10 rounded-lg text-slate-900 dark:text-white focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none"
                  />
                </div>
              </div>

              <div className="border border-slate-200 dark:border-white/10 rounded-xl p-4">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-bold text-slate-900 dark:text-white">
                    {isEn ? "Episodes" : "Ø§Ù„Ø­Ù„Ù‚Ø§Øª"} ({staticEpisodes.length})
                  </h4>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={addStaticEpisode}
                    className="!h-9 !px-3 text-xs"
                  >
                    <Plus size={14} /> {isEn ? "Add Episode" : "Ø¥Ø¶Ø§ÙØ© Ø­Ù„Ù‚Ø©"}
                  </Button>
                </div>

                <div className="space-y-3">
                  {staticEpisodes.map((episode, index) => (
                    <div
                      key={`static-episode-${index}`}
                      className="p-3 rounded-lg bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                          {isEn ? `Episode ${index + 1}` : `Ø§Ù„Ø­Ù„Ù‚Ø© ${index + 1}`}
                        </p>
                        <button
                          type="button"
                          onClick={() => removeStaticEpisode(index)}
                          className="p-1.5 rounded-md text-red-500 hover:bg-red-500/10"
                          disabled={staticEpisodes.length === 1}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>

                      <div className="grid md:grid-cols-3 gap-3">
                        <Input
                          label={isEn ? "Episode Title" : "Ø¹Ù†ÙˆØ§Ù† Ø§Ù„Ø­Ù„Ù‚Ø©"}
                          value={episode.title}
                          onChange={(e) =>
                            updateStaticEpisode(index, "title", e.target.value)
                          }
                          required
                        />
                        <Input
                          label={isEn ? "Duration (min)" : "Ø§Ù„Ù…Ø¯Ø© (Ø¯Ù‚ÙŠÙ‚Ø©)"}
                          type="number"
                          min="1"
                          value={episode.duration_minutes.toString()}
                          onChange={(e) =>
                            updateStaticEpisode(
                              index,
                              "duration_minutes",
                              e.target.value
                            )
                          }
                          required
                        />
                        <div className="md:col-span-1"></div>
                      </div>

                      <div className="mt-3">
                        <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
                          {isEn ? "Episode Description" : "ÙˆØµÙ Ø§Ù„Ø­Ù„Ù‚Ø©"}
                        </label>
                        <textarea
                          value={episode.description}
                          onChange={(e) =>
                            updateStaticEpisode(
                              index,
                              "description",
                              e.target.value
                            )
                          }
                          rows={2}
                          className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-white/10 rounded-lg text-slate-900 dark:text-white focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <Button type="submit" className="w-full" isLoading={isSubmitting}>
                <Check size={18} />{" "}
                {isEn ? "Publish Landing Course" : "نشر الكورس في اللاندنج"}
              </Button>
            </form>
          </Card>
        </div>
      )}

      {/* Landing Blog Builder Modal */}
      {showBlogBuilderModal && (
        <div className="fixed inset-0 z-[76] flex items-center justify-center px-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => {
              setShowBlogBuilderModal(false);
              resetBlogBuilder();
            }}
          ></div>
          <Card className="w-full max-w-3xl relative z-10 !p-0 shadow-2xl animate-in zoom-in duration-200 max-h-[92vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-200 dark:border-white/10 flex justify-between items-center sticky top-0 bg-gradient-to-r from-cyan-500/10 to-cyan-500/5 z-10">
              <div>
                <h3 className="font-bold text-lg text-slate-900 dark:text-white">
                  {isEn ? "Landing Blog Builder" : "منشئ بلوج اللاندنج"}
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  {isEn
                    ? "Publish blog posts with image, article, and resources."
                    : "انشر مقالات بلوج مع صورة ومحتوى وموارد."}
                </p>
              </div>
              <button
                onClick={() => {
                  setShowBlogBuilderModal(false);
                  resetBlogBuilder();
                }}
                className="text-slate-400 hover:text-red-500 transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleCreateLandingBlog} className="p-6 space-y-4">
              <Input
                label={isEn ? "Blog Title" : "عنوان البلوج"}
                value={blogForm.title}
                onChange={(e) => setBlogForm((prev) => ({ ...prev, title: e.target.value }))}
                required
              />
              <div className="grid md:grid-cols-2 gap-4">
                <Input
                  label={isEn ? "Author Name" : "اسم الكاتب"}
                  value={blogForm.authorName}
                  onChange={(e) =>
                    setBlogForm((prev) => ({ ...prev, authorName: e.target.value }))
                  }
                />
                <Input
                  label={isEn ? "Read Time (minutes)" : "مدة القراءة (دقيقة)"}
                  type="number"
                  min="1"
                  value={blogForm.readTimeMinutes}
                  onChange={(e) =>
                    setBlogForm((prev) => ({ ...prev, readTimeMinutes: e.target.value }))
                  }
                />
              </div>
              <Input
                label={isEn ? "Blog Image URL" : "رابط صورة البلوج"}
                value={blogForm.imageUrl}
                onChange={(e) => setBlogForm((prev) => ({ ...prev, imageUrl: e.target.value }))}
                placeholder="https://..."
              />
              <div>
                <label className="block text-sm font-bold text-slate-900 dark:text-white mb-2">
                  {isEn ? "Short Description" : "وصف مختصر"}
                </label>
                <textarea
                  rows={2}
                  value={blogForm.shortDescription}
                  onChange={(e) =>
                    setBlogForm((prev) => ({ ...prev, shortDescription: e.target.value }))
                  }
                  className="w-full px-4 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-white/10 rounded-lg text-slate-900 dark:text-white focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-900 dark:text-white mb-2">
                  {isEn ? "Article Content" : "محتوى المقال"}
                </label>
                <textarea
                  rows={7}
                  value={blogForm.content}
                  onChange={(e) => setBlogForm((prev) => ({ ...prev, content: e.target.value }))}
                  className="w-full px-4 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-white/10 rounded-lg text-slate-900 dark:text-white focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-900 dark:text-white mb-2">
                  {isEn ? "Resource Links (1 per line)" : "روابط الموارد (كل سطر رابط)"}
                </label>
                <textarea
                  rows={4}
                  value={blogForm.resourceLinks}
                  onChange={(e) =>
                    setBlogForm((prev) => ({ ...prev, resourceLinks: e.target.value }))
                  }
                  className="w-full px-4 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-white/10 rounded-lg text-slate-900 dark:text-white focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none"
                />
              </div>
              <div className="border-2 border-dashed border-slate-300 dark:border-white/10 rounded-xl p-4">
                <label className="block text-sm font-bold text-slate-900 dark:text-white mb-2">
                  {isEn ? "Optional Resource File" : "ملف موارد اختياري"}
                </label>
                <input
                  type="file"
                  accept=".pdf,.doc,.docx,.ppt,.pptx,.zip"
                  onChange={(e) => setBlogResourceFile(e.target.files?.[0] || null)}
                  className="block w-full text-sm text-slate-600 dark:text-slate-300 file:mr-3 file:rounded-lg file:border-0 file:bg-cyan-600 file:px-3 file:py-2 file:text-sm file:font-bold file:text-white hover:file:bg-cyan-700"
                />
                {blogResourceFile && (
                  <p className="mt-2 text-xs text-slate-500">{blogResourceFile.name}</p>
                )}
              </div>

              <Button type="submit" className="w-full" isLoading={isSubmitting}>
                <Check size={18} /> {isEn ? "Publish Blog" : "نشر البلوج"}
              </Button>
            </form>
          </Card>
        </div>
      )}

      {/* Landing Project Builder Modal */}
      {showProjectBuilderModal && (
        <div className="fixed inset-0 z-[76] flex items-center justify-center px-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => {
              setShowProjectBuilderModal(false);
              resetProjectBuilder();
            }}
          ></div>
          <Card className="w-full max-w-3xl relative z-10 !p-0 shadow-2xl animate-in zoom-in duration-200 max-h-[92vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-200 dark:border-white/10 flex justify-between items-center sticky top-0 bg-gradient-to-r from-amber-500/10 to-amber-500/5 z-10">
              <div>
                <h3 className="font-bold text-lg text-slate-900 dark:text-white">
                  {isEn ? "Landing Project Builder" : "منشئ مشاريع اللاندنج"}
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  {isEn
                    ? "Publish projects with image, details, and attached PDF."
                    : "انشر مشروع بصورة وتفاصيل وملف PDF مرفق."}
                </p>
              </div>
              <button
                onClick={() => {
                  setShowProjectBuilderModal(false);
                  resetProjectBuilder();
                }}
                className="text-slate-400 hover:text-red-500 transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleCreateLandingProject} className="p-6 space-y-4">
              <Input
                label={isEn ? "Project Title" : "عنوان المشروع"}
                value={projectForm.title}
                onChange={(e) => setProjectForm((prev) => ({ ...prev, title: e.target.value }))}
                required
              />
              <div className="grid md:grid-cols-2 gap-4">
                <Input
                  label={isEn ? "Project Type" : "نوع المشروع"}
                  value={projectForm.projectType}
                  onChange={(e) =>
                    setProjectForm((prev) => ({ ...prev, projectType: e.target.value }))
                  }
                />
                <Input
                  label={isEn ? "Client Name" : "اسم العميل"}
                  value={projectForm.clientName}
                  onChange={(e) =>
                    setProjectForm((prev) => ({ ...prev, clientName: e.target.value }))
                  }
                />
              </div>
              <Input
                label={isEn ? "Project Image URL" : "رابط صورة المشروع"}
                value={projectForm.imageUrl}
                onChange={(e) => setProjectForm((prev) => ({ ...prev, imageUrl: e.target.value }))}
                placeholder="https://..."
              />
              <Input
                label={isEn ? "External Link (optional)" : "رابط خارجي (اختياري)"}
                value={projectForm.externalUrl}
                onChange={(e) =>
                  setProjectForm((prev) => ({ ...prev, externalUrl: e.target.value }))
                }
                placeholder="https://..."
              />
              <div>
                <label className="block text-sm font-bold text-slate-900 dark:text-white mb-2">
                  {isEn ? "Short Description" : "وصف مختصر"}
                </label>
                <textarea
                  rows={2}
                  value={projectForm.shortDescription}
                  onChange={(e) =>
                    setProjectForm((prev) => ({ ...prev, shortDescription: e.target.value }))
                  }
                  className="w-full px-4 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-white/10 rounded-lg text-slate-900 dark:text-white focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-900 dark:text-white mb-2">
                  {isEn ? "Project Details" : "تفاصيل المشروع"}
                </label>
                <textarea
                  rows={6}
                  value={projectForm.description}
                  onChange={(e) =>
                    setProjectForm((prev) => ({ ...prev, description: e.target.value }))
                  }
                  className="w-full px-4 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-white/10 rounded-lg text-slate-900 dark:text-white focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none"
                />
              </div>
              <div className="border-2 border-dashed border-slate-300 dark:border-white/10 rounded-xl p-4">
                <label className="block text-sm font-bold text-slate-900 dark:text-white mb-2">
                  {isEn ? "Project PDF (Required)" : "ملف PDF للمشروع (إلزامي)"}
                </label>
                <input
                  type="file"
                  accept="application/pdf,.pdf"
                  onChange={(e) => setProjectPdfFile(e.target.files?.[0] || null)}
                  className="block w-full text-sm text-slate-600 dark:text-slate-300 file:mr-3 file:rounded-lg file:border-0 file:bg-amber-600 file:px-3 file:py-2 file:text-sm file:font-bold file:text-white hover:file:bg-amber-700"
                  required
                />
                {projectPdfFile && (
                  <p className="mt-2 text-xs text-slate-500">{projectPdfFile.name}</p>
                )}
              </div>

              <Button type="submit" className="w-full" isLoading={isSubmitting}>
                <Check size={18} /> {isEn ? "Publish Project" : "نشر المشروع"}
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
                {isEn ? "Edit Course" : "ØªØ­Ø±ÙŠØ± Ø§Ù„ÙƒÙˆØ±Ø³"}
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
                    {isEn ? "Draft auto-saved" : "ØªÙ… Ø­ÙØ¸ Ø§Ù„Ù…Ø³ÙˆØ¯Ø© ØªÙ„Ù‚Ø§Ø¦ÙŠØ§Ù‹"}
                  </p>
                </div>
              )}

              <Input
                label={isEn ? "Course Title" : "Ø¹Ù†ÙˆØ§Ù† Ø§Ù„ÙƒÙˆØ±Ø³"}
                value={newCourse.title}
                onChange={(e) =>
                  setNewCourse({ ...newCourse, title: e.target.value })
                }
              />

              <div>
                <label className="block text-sm font-bold text-slate-900 dark:text-white mb-2">
                  {isEn ? "Description" : "Ø§Ù„ÙˆØµÙ"}
                </label>
                <textarea
                  value={newCourse.description}
                  onChange={(e) =>
                    setNewCourse({ ...newCourse, description: e.target.value })
                  }
                  required
                  className="w-full px-4 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-white/10 rounded-lg text-slate-900 dark:text-white focus:border-primary focus:ring-2 focus:ring-primary/20"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-900 dark:text-white mb-2">
                    {isEn ? "Price" : "Ø§Ù„Ø³Ø¹Ø±"}
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
                    {isEn ? "Category" : "Ø§Ù„ÙØ¦Ø©"}
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
                    <option value="">{isEn ? "No category" : "Ø¨Ø¯ÙˆÙ† ÙØ¦Ø©"}</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <Button type="submit" className="w-full" isLoading={isSubmitting}>
                <Check size={18} /> {isEn ? "Save Changes" : "Ø­ÙØ¸ Ø§Ù„ØªØºÙŠÙŠØ±Ø§Øª"}
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
                    : "Ø¥Ø¶Ø§ÙØ© Ø¯Ø±Ø³ ÙÙŠØ¯ÙŠÙˆ"
                  : isEn
                  ? "Add PDF Resource"
                  : "Ø¥Ø¶Ø§ÙØ© Ù…Ù„Ù PDF"}
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
                  label={isEn ? "Title" : "Ø§Ù„Ø¹Ù†ÙˆØ§Ù†"}
                  value={newContent.title}
                  onChange={(e) =>
                    setNewContent({ ...newContent, title: e.target.value })
                  }
                  required
                />

                {newContent.type === "video" && (
                  <>
                    <Input
                      label={isEn ? "Description" : "Ø§Ù„ÙˆØµÙ"}
                      value={newContent.description}
                      onChange={(e) =>
                        setNewContent({
                          ...newContent,
                          description: e.target.value,
                        })
                      }
                    />
                    <Input
                      label={isEn ? "Duration (minutes)" : "Ø§Ù„Ù…Ø¯Ø© (Ø¯Ù‚Ø§Ø¦Ù‚)"}
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
                      placeholder={isEn ? "Enter lesson duration in minutes" : "Ø£Ø¯Ø®Ù„ Ù…Ø¯Ø© Ø§Ù„Ø¯Ø±Ø³ Ø¨Ø§Ù„Ø¯Ù‚Ø§Ø¦Ù‚"}
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
                          {isEn ? "Upload file" : "Ø±ÙØ¹ Ø§Ù„Ù…Ù„Ù"}
                        </p>
                        <p className="text-xs text-slate-500">
                          {isEn
                            ? "Click or drag file here"
                            : "Ø§Ø¶ØºØ· Ø£Ùˆ Ø§Ø³Ø­Ø¨ Ø§Ù„Ù…Ù„Ù"}
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
                  <Upload size={18} /> {isEn ? "Add Content" : "Ø¥Ø¶Ø§ÙØ© Ø§Ù„Ù…Ø­ØªÙˆÙ‰"}
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
                  {isEn ? "Manage Lessons" : "Ø¥Ø¯Ø§Ø±Ø© Ø§Ù„Ø¯Ø±ÙˆØ³"}
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
                    label={isEn ? "Lesson Title" : "Ø¹Ù†ÙˆØ§Ù† Ø§Ù„Ø¯Ø±Ø³"}
                    value={newContent.title}
                    onChange={(e) =>
                      setNewContent({ ...newContent, title: e.target.value })
                    }
                    required
                  />
                  <div>
                    <label className="block text-sm font-bold text-slate-900 dark:text-white mb-2">
                      {isEn ? "Description" : "Ø§Ù„ÙˆØµÙ"}
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
                      {isEn ? "Save Changes" : "Ø­ÙØ¸ Ø§Ù„ØªØºÙŠÙŠØ±Ø§Øª"}
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      className="flex-1"
                      onClick={() => setEditingLesson(null)}
                    >
                      {isEn ? "Cancel" : "Ø¥Ù„ØºØ§Ø¡"}
                    </Button>
                  </div>
                </form>
              ) : (
                <div className="space-y-6">
                  {/* LESSONS SECTION */}
                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                      <Video size={16} /> {isEn ? "Lessons" : "Ø§Ù„Ø¯Ø±ÙˆØ³"}
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
                                    title={isEn ? "Edit" : "ØªØ­Ø±ÙŠØ±"}
                                  >
                                    <Edit2 size={16} />
                                  </button>
                                  <button
                                    onClick={() =>
                                      handleDeleteLesson(lesson.id)
                                    }
                                    className="p-2 bg-red-500/20 text-red-500 rounded-lg hover:bg-red-500 hover:text-white transition-all"
                                    title={isEn ? "Delete" : "Ø­Ø°Ù"}
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
                              : `Ø§Ù„Ø¥Ø¬Ù…Ø§Ù„ÙŠ: ${lessons.length} Ø¯Ø±Ø³`}
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
                          {isEn ? "No Lessons Yet" : "Ù„Ø§ ØªÙˆØ¬Ø¯ Ø¯Ø±ÙˆØ³ Ø¨Ø¹Ø¯"}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* RESOURCES SECTION */}
                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                      <FileText size={16} /> {isEn ? "Resources" : "Ø§Ù„Ù…ÙˆØ§Ø±Ø¯"}
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
                                      {isEn ? "Added" : "ØªÙ… Ø§Ù„Ø¥Ø¶Ø§ÙØ©"}:{" "}
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
                                    title={isEn ? "Download" : "ØªØ­Ù…ÙŠÙ„"}
                                  >
                                    <Upload size={16} />
                                  </a>
                                  <button
                                    onClick={() =>
                                      handleDeleteResource(resource.id)
                                    }
                                    className="p-2 bg-red-500/20 text-red-500 rounded-lg hover:bg-red-500 hover:text-white transition-all"
                                    title={isEn ? "Delete" : "Ø­Ø°Ù"}
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
                              : `Ø§Ù„Ø¥Ø¬Ù…Ø§Ù„ÙŠ: ${resources.length} Ù…ÙˆØ±Ø¯`}
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
                          {isEn ? "No Resources Yet" : "Ù„Ø§ ØªÙˆØ¬Ø¯ Ù…ÙˆØ§Ø±Ø¯ Ø¨Ø¹Ø¯"}
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
                  {isEn ? "Add Lesson" : "Ø¥Ø¶Ø§ÙØ© Ø¯Ø±Ø³"}
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
                  {isEn ? "Add Resource" : "Ø¥Ø¶Ø§ÙØ© Ù…ÙˆØ±Ø¯"}
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
                {isEn ? "Manage Categories" : "Ø¥Ø¯Ø§Ø±Ø© Ø§Ù„ÙØ¦Ø§Øª"}
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
                  label={isEn ? "Category Name" : "Ø§Ø³Ù… Ø§Ù„ÙØ¦Ø©"}
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
                  {isEn ? "Create Category" : "Ø¥Ù†Ø´Ø§Ø¡ Ø§Ù„ÙØ¦Ø©"}
                </Button>
              </form>

              <div>
                <h4 className="font-bold text-sm text-slate-900 dark:text-white mb-4">
                  {isEn ? "Existing Categories" : "Ø§Ù„ÙØ¦Ø§Øª Ø§Ù„Ø­Ø§Ù„ÙŠØ©"} (
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
                    {isEn ? "No categories yet" : "Ù„Ø§ ØªÙˆØ¬Ø¯ ÙØ¦Ø§Øª Ø­ØªÙ‰ Ø§Ù„Ø¢Ù†"}
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
                    {isEn ? "Price" : "Ø§Ù„Ø³Ø¹Ø±"}
                  </p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {previewCourse.lessons?.length || 0}
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    {isEn ? "Lessons" : "Ø¯Ø±ÙˆØ³"}
                  </p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">
                    {courseStats[previewCourse.id]?.students || 0}
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    {isEn ? "Students" : "Ø·Ù„Ø§Ø¨"}
                  </p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-amber-600">
                    {courseStats[previewCourse.id]?.rating !== null &&
                    courseStats[previewCourse.id]?.rating !== undefined
                      ? `${courseStats[previewCourse.id]?.rating?.toFixed(1)} / 5`
                      : "N/A"}
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    {isEn ? "Rating" : "Ø§Ù„ØªÙ‚ÙŠÙŠÙ…"}
                  </p>
                </div>
              </div>

              <div className="mb-8">
                <h3 className="font-bold text-slate-900 dark:text-white mb-3">
                  {isEn ? "Description" : "Ø§Ù„ÙˆØµÙ"}
                </h3>
                <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                  {previewCourse.description}
                </p>
              </div>

              <div>
                <h3 className="font-bold text-slate-900 dark:text-white mb-3">
                  {isEn ? "Course Content" : "Ù…Ø­ØªÙˆÙ‰ Ø§Ù„ÙƒÙˆØ±Ø³"}
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
                      {isEn ? "No lessons added yet" : "Ù„Ù… ÙŠØªÙ… Ø¥Ø¶Ø§ÙØ© Ø¯Ø±ÙˆØ³ Ø¨Ø¹Ø¯"}
                    </p>
                  )}
                </div>
              </div>

              <Button
                onClick={() => setShowCoursePreview(false)}
                className="w-full mt-8"
              >
                {isEn ? "Close Preview" : "Ø¥ØºÙ„Ø§Ù‚ Ø§Ù„Ù…Ø¹Ø§ÙŠÙ†Ø©"}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default InstructorCourses;

