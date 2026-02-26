// import React, { useState, useEffect } from 'react';
// import { ViewMode, Course, WishlistItem, Theme, Lang, PendingQuiz, User } from './types';
// import { api } from './api/client';
// import { AuthProvider, useAuth } from './context/AuthContext';
// import Layout from './components/Layout';
// import { useIsMobile } from './hooks/useIsMobile';

// // Import Pages
// import LandingPage from './pages/Landing';
// import LoginPage from './pages/auth/Login';
// import JoinPlatformPage from './pages/JoinPlatform';
// import StudentDashboard from './pages/student/Dashboard';
// import InstructorDashboard from './pages/instructor/Dashboard';
// import InstructorCourses from './pages/instructor/Courses';
// import InstructorExams from './pages/instructor/Exams';
// import InstructorStudents from './pages/instructor/Students';
// import Marketplace from './pages/student/Marketplace';
// import CartPage from './pages/student/Cart';
// import CoursePlayer from './pages/student/CoursePlayer';
// import ExamsList from './pages/student/ExamsList';
// import ExamRunner from './pages/student/ExamRunner';
// import MentorsList from './pages/MentorsList';
// import WorkspaceCanvas from './components/WorkspaceCanvas';

// const WhiteLabApp: React.FC = () => {
//   const { user, login, logout, loading } = useAuth();
//   const [view, setView] = useState<ViewMode>(ViewMode.LANDING);
//   const [theme, setTheme] = useState<Theme>('dark');
//   const [lang, setLang] = useState<Lang>('en');
//   const [isSidebarOpen, setIsSidebarOpen] = useState(false);
//   const [isSettingsOpen, setIsSettingsOpen] = useState(false);

//   const [cart, setCart] = useState<Course[]>([]);
//   const [wishlist, setWishlist] = useState<WishlistItem[]>([]);
//   const [dashboardRefreshTrigger, setDashboardRefreshTrigger] = useState(0);

//   const [activeExam, setActiveExam] = useState<PendingQuiz | null>(null);
//   const [targetStudentId, setTargetStudentId] = useState<number | null>(null);

//   const isMobile = useIsMobile();

//   // Initialization & Theme Sync
//   useEffect(() => {
//     const savedTheme = localStorage.getItem('theme') as Theme;
//     const finalTheme = savedTheme || 'dark';
//     setTheme(finalTheme);
//     document.documentElement.classList.toggle('dark', finalTheme === 'dark');
//   }, []);

//   // Auth-based View Redirection & Data Sync
//   useEffect(() => {
//     if (user && view === ViewMode.LANDING) {
//       setView(ViewMode.DASHBOARD);
//     }
//     if (user) {
//       api.wishlist.list().then(setWishlist).catch(() => console.log("Offline mode active"));
//     }
//   }, [user]);

//   // Global Actions
//   const toggleTheme = () => {
//     const newTheme = theme === 'light' ? 'dark' : 'light';
//     setTheme(newTheme);
//     localStorage.setItem('theme', newTheme);
//     document.documentElement.classList.toggle('dark', newTheme === 'dark');
//   };

//   const toggleLang = () => setLang(l => l === 'en' ? 'ar' : 'en');

//   const addToCart = (course: Course) => {
//     if (!cart.find(c => c.id === course.id)) setCart([...cart, course]);
//   };
//   const removeFromCart = (id: number) => setCart(cart.filter(c => c.id !== id));
//   const clearCart = () => setCart([]);

//   const toggleWishlist = async (course: Course) => {
//     const exists = wishlist.find(w => w.course === course.id);
//     if (exists) {
//       setWishlist(wishlist.filter(w => w.course !== course.id));
//       await api.wishlist.remove(course.id).catch(() => {});
//     } else {
//       const newItem: WishlistItem = {
//          id: Date.now(), course: course.id, course_title: course.title,
//          course_thumbnail: course.thumbnail, course_price: course.price, created_at: new Date().toISOString()
//       };
//       setWishlist([...wishlist, newItem]);
//       await api.wishlist.add(course.id).catch(() => {});
//     }
//     setDashboardRefreshTrigger(p => p + 1);
//   };

//   const startExam = (exam: PendingQuiz) => {
//      setActiveExam(exam);
//      setView(ViewMode.EXAM_RUNNER);
//   };

//   const handleNavigateToStudent = (studentId: number) => {
//      setTargetStudentId(studentId);
//      setView(ViewMode.STUDENTS_LIST);
//   };

//   const handleLogout = () => {
//     logout();
//     setView(ViewMode.LANDING);
//     setCart([]);
//     setIsSidebarOpen(false);
//     setIsSettingsOpen(false);
//   };

//   // View Router Logic
//   const renderView = () => {
//     if (!user) {
//       switch (view) {
//         case ViewMode.AUTH:
//           return <LoginPage onLogin={(u) => { login(u); setView(ViewMode.DASHBOARD); }} onBack={() => setView(ViewMode.LANDING)} lang={lang} toggleLang={toggleLang} theme={theme} toggleTheme={toggleTheme} />;
//         case ViewMode.JOIN_PLATFORM:
//           return <JoinPlatformPage onBack={() => setView(ViewMode.LANDING)} lang={lang} theme={theme} />;
//         case ViewMode.MARKETPLACE:
//           return <Marketplace addToCart={() => setView(ViewMode.AUTH)} toggleWishlist={() => setView(ViewMode.AUTH)} wishlistIds={[]} lang={lang} showJoinButton={true} onJoinClick={() => setView(ViewMode.JOIN_PLATFORM)} onBack={() => setView(ViewMode.LANDING)} />;
//         case ViewMode.MENTORS_LIST:
//           return <MentorsList onBack={() => setView(ViewMode.LANDING)} lang={lang} />;
//         case ViewMode.LANDING:
//         default:
//           return <LandingPage onLogoClick={() => setView(ViewMode.LANDING)} onLoginClick={() => setView(ViewMode.AUTH)} onJoinClick={() => setView(ViewMode.JOIN_PLATFORM)} onExploreClick={() => setView(ViewMode.MARKETPLACE)} onMentorsClick={() => setView(ViewMode.MENTORS_LIST)} lang={lang} toggleLang={toggleLang} theme={theme} toggleTheme={toggleTheme} />;
//       }
//     }

//     switch (view) {
//       case ViewMode.DASHBOARD:
//         return user.role === 'instructor'
//           ? <InstructorDashboard lang={lang} theme={theme} />
//           : <StudentDashboard lang={lang} theme={theme} refreshTrigger={dashboardRefreshTrigger} isMobile={isMobile} />;

//       case ViewMode.WORKSPACE:
//         return <WorkspaceCanvas lang={lang} setView={setView} />;

//       case ViewMode.MARKETPLACE:
//         return <Marketplace addToCart={addToCart} toggleWishlist={toggleWishlist} wishlistIds={wishlist.map(w => w.course)} lang={lang} />;

//       case ViewMode.CART:
//         return <CartPage cart={cart} removeFromCart={removeFromCart} clearCart={clearCart} lang={lang} refreshDashboard={() => setDashboardRefreshTrigger(p => p+1)} setView={setView} />;

//       case ViewMode.COURSE_PLAYER:
//         return <CoursePlayer lang={lang} theme={theme} isMobile={isMobile} />;

//       case ViewMode.EXAM_LIST:
//         return <ExamsList lang={lang} theme={theme} onStartExam={startExam} />;

//       case ViewMode.EXAM_RUNNER:
//         return activeExam ? <ExamRunner exam={activeExam} lang={lang} onExit={() => setView(ViewMode.EXAM_LIST)} /> : null;

//       case ViewMode.COURSE_EDITOR:
//         return <InstructorCourses lang={lang} theme={theme} />;

//       case ViewMode.INSTRUCTOR_EXAMS:
//         return <InstructorExams lang={lang} theme={theme} />;

//       case ViewMode.STUDENTS_LIST:
//         return <InstructorStudents lang={lang} theme={theme} targetStudentId={targetStudentId} />;

//       case ViewMode.LANDING:
//       default:
//         return user.role === 'instructor'
//           ? <InstructorDashboard lang={lang} theme={theme} />
//           : <StudentDashboard lang={lang} theme={theme} refreshTrigger={dashboardRefreshTrigger} isMobile={isMobile} />;
//     }
//   };

//   if (loading) {
//     return (
//       <div className="min-h-screen bg-[#0B0B0B] flex items-center justify-center">
//         <div className="text-primary font-bold animate-pulse">Synchronizing Neural Link...</div>
//       </div>
//     );
//   }

//   return (
//     <Layout
//       view={view}
//       setView={setView}
//       user={user}
//       theme={theme}
//       toggleTheme={toggleTheme}
//       lang={lang}
//       toggleLang={toggleLang}
//       cartCount={cart.length}
//       isSidebarOpen={isSidebarOpen}
//       setIsSidebarOpen={setIsSidebarOpen}
//       isSettingsOpen={isSettingsOpen}
//       setIsSettingsOpen={setIsSettingsOpen}
//       onLogout={handleLogout}
//       onNavigateToStudent={handleNavigateToStudent}
//       onUpdateUser={login}
//     >
//       {renderView()}
//     </Layout>
//   );
// };

// const App: React.FC = () => {
//   return (
//     <AuthProvider>
//       <WhiteLabApp />
//     </AuthProvider>
//   );
// };

// export default App;

// File: frontend/skill/App.tsx
/**
 * Main App Component - Updated with Signup Page
 */
import React, { useState, useEffect, useCallback, useLayoutEffect, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Toaster } from "sonner";
import {
  ViewMode,
  Course,
  WishlistItem,
  Theme,
  Lang,
  PendingQuiz,
  User,
  StudentLearningCourse,
} from "./types";
import { api } from "./api/client";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { PaymentProvider } from "./context/PaymentContext";
import Layout from "./components/Layout";
import PaymentNotificationListener from "./components/PaymentNotificationListener";
import { useIsMobile } from "./hooks/useIsMobile";

// Import Pages
import LandingPage from "./pages/Landing";
import LoginPage from "./pages/auth/Login";
import SignupPage from "./pages/auth/Signup"; // NEW: Import Signup page
import VerifyEmailPage from "./pages/auth/VerifyEmail"; // NEW: Import Email Verification page
import ForgotPassword from "./pages/auth/ForgotPassword"; // NEW: Import Forgot Password page
import ResetPassword from "./pages/auth/ResetPassword"; // NEW: Import Reset Password page
import StudentDashboard from "./pages/student/Dashboard";
import InstructorDashboard from "./pages/instructor/Dashboard";
import InstructorCourses from "./pages/instructor/Courses";
import InstructorExams from "./pages/instructor/Exams";
import InstructorTasks from "./pages/instructor/Tasks";
import InstructorStudents from "./pages/instructor/Students";
import InstructorCertificates from "./pages/instructor/Certificates";
import TopStudentsPage from "./pages/instructor/TopStudents";
import Marketplace from "./pages/student/Marketplace";
import Wishlist from "./pages/student/Wishlist";
import CartPayment from "./pages/student/CartPayment"; // UPDATED: Changed from Cart to CartPayment
import PaymentSubmission from "./pages/student/PaymentSubmission"; // NEW
import PaymentHistory from "./pages/student/PaymentHistory"; // NEW
import PaymentRequests from "./pages/instructor/PaymentRequests"; // NEW
import CoursePlayer from "./pages/student/CoursePlayer";
import ExamsList from "./pages/student/ExamsList";
import ExamRunner from "./pages/student/ExamRunner";
import StudentCertificates from "./pages/student/Certificates";
import MentorsList from "./pages/MentorsList";
import WorkspaceCanvas from "./components/WorkspaceCanvas";

type LandingSectionId =
  | "home"
  | "courses"
  | "services"
  | "projects"
  | "blog"
  | "about"
  | "contact";

type LandingContentPageId = "services" | "courses" | "projects" | "blog";

const CP1252_REVERSE_MAP: Record<number, number> = {
  0x20ac: 0x80,
  0x201a: 0x82,
  0x0192: 0x83,
  0x201e: 0x84,
  0x2026: 0x85,
  0x2020: 0x86,
  0x2021: 0x87,
  0x02c6: 0x88,
  0x2030: 0x89,
  0x0160: 0x8a,
  0x2039: 0x8b,
  0x0152: 0x8c,
  0x017d: 0x8e,
  0x2018: 0x91,
  0x2019: 0x92,
  0x201c: 0x93,
  0x201d: 0x94,
  0x2022: 0x95,
  0x2013: 0x96,
  0x2014: 0x97,
  0x02dc: 0x98,
  0x2122: 0x99,
  0x0161: 0x9a,
  0x203a: 0x9b,
  0x0153: 0x9c,
  0x017e: 0x9e,
  0x0178: 0x9f,
};
const MOJIBAKE_MARKERS_REGEX =
  /[\u00D8\u00D9\u00C3\u00C2\u00D0\u00D1\uFFFD\u201A\u0192\u201E\u2026\u2020\u2021\u02C6\u2030\u0160\u2039\u0152\u017D\u2018\u2019\u201C\u201D\u2022\u2013\u2014\u02DC\u2122\u0161\u203A\u0153\u017E\u0178]/;
const MOJIBAKE_SYMBOLS_REGEX =
  /[\u00D8\u00D9\u00C3\u00C2\u00D0\u00D1\u201A\u0192\u201E\u2026\u2020\u2021\u02C6\u2030\u0160\u2039\u0152\u017D\u2018\u2019\u201C\u201D\u2022\u2013\u2014\u02DC\u2122\u0161\u203A\u0153\u017E\u0178]/g;
const ARABIC_CHARS_REGEX = /[\u0600-\u06FF]/g;
const REPLACEMENT_CHAR_REGEX = /\uFFFD/g;
const MOJIBAKE_ATTRIBUTE_NAMES = [
  "placeholder",
  "title",
  "aria-label",
  "alt",
  "value",
] as const;

const countRegexMatches = (value: string, regex: RegExp): number =>
  value.match(regex)?.length ?? 0;

const toCp1252Bytes = (value: string): Uint8Array | null => {
  const bytes: number[] = [];

  for (const char of Array.from(value)) {
    const codePoint = char.codePointAt(0);
    if (codePoint === undefined) return null;

    if (codePoint <= 0xff) {
      bytes.push(codePoint);
      continue;
    }

    const mappedByte = CP1252_REVERSE_MAP[codePoint];
    if (mappedByte === undefined) {
      return null;
    }
    bytes.push(mappedByte);
  }

  return Uint8Array.from(bytes);
};

const decodeArabicMojibake = (value: string): string => {
  if (!value || !MOJIBAKE_MARKERS_REGEX.test(value)) return value;

  try {
    const bytes = toCp1252Bytes(value);
    if (!bytes) return value;
    const decoded = new TextDecoder("utf-8").decode(bytes);
    if (!decoded || decoded === value) return value;

    const beforeMojibake = countRegexMatches(value, MOJIBAKE_SYMBOLS_REGEX);
    const afterMojibake = countRegexMatches(decoded, MOJIBAKE_SYMBOLS_REGEX);
    const beforeArabic = countRegexMatches(value, ARABIC_CHARS_REGEX);
    const afterArabic = countRegexMatches(decoded, ARABIC_CHARS_REGEX);
    const beforeReplacement = countRegexMatches(value, REPLACEMENT_CHAR_REGEX);
    const afterReplacement = countRegexMatches(decoded, REPLACEMENT_CHAR_REGEX);

    if (
      (afterArabic >= beforeArabic + 2 && afterMojibake <= beforeMojibake) ||
      (beforeMojibake >= 2 &&
        afterMojibake < beforeMojibake &&
        afterReplacement <= beforeReplacement)
    ) {
      return decoded;
    }

    return value;
  } catch {
    return value;
  }
};

const repairTextNodeMojibake = (node: Text) => {
  const currentValue = node.nodeValue ?? "";
  const fixedValue = decodeArabicMojibake(currentValue);
  if (fixedValue !== currentValue) {
    node.nodeValue = fixedValue;
  }
};

const repairElementMojibakeAttributes = (element: Element) => {
  for (const attributeName of MOJIBAKE_ATTRIBUTE_NAMES) {
    const currentValue = element.getAttribute(attributeName);
    if (!currentValue) continue;
    const fixedValue = decodeArabicMojibake(currentValue);
    if (fixedValue !== currentValue) {
      element.setAttribute(attributeName, fixedValue);
    }
  }
};

const repairMojibakeInSubtree = (node: Node) => {
  if (node.nodeType === Node.TEXT_NODE) {
    repairTextNodeMojibake(node as Text);
    return;
  }

  if (node.nodeType !== Node.ELEMENT_NODE) return;

  const element = node as Element;
  repairElementMojibakeAttributes(element);
  for (const childNode of Array.from(element.childNodes)) {
    repairMojibakeInSubtree(childNode);
  }
};

const IntroSplash: React.FC<{ loading: boolean }> = ({ loading }) => {
  const letters = ["G", "E", "O", " ", "T", "O", "P"];

  return (
    <div className="fixed inset-0 z-[9999] overflow-hidden bg-[#030712]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_30%,rgba(0,123,255,0.24),transparent_56%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_70%,rgba(14,165,233,0.12),transparent_62%)]" />

      <motion.div
        className="absolute left-1/2 top-1/2 h-[54vmin] w-[54vmin] -translate-x-1/2 -translate-y-1/2 rounded-full border border-blue-400/35"
        animate={{ rotate: 360 }}
        transition={{ duration: 16, repeat: Infinity, ease: "linear" }}
      />
      <motion.div
        className="absolute left-1/2 top-1/2 h-[42vmin] w-[42vmin] -translate-x-1/2 -translate-y-1/2 rounded-full border border-blue-300/20"
        animate={{ rotate: -360 }}
        transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
      />

      <div className="absolute inset-0 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.84, y: 22 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="relative text-center"
        >
          <div className="inline-flex items-center gap-1 sm:gap-2 text-[13vw] sm:text-[8vw] md:text-[6vw] font-black leading-none tracking-[0.08em] text-white">
            {letters.map((letter, index) => (
              <motion.span
                key={`${letter}-${index}`}
                initial={{ opacity: 0, y: 40, rotateX: -80 }}
                animate={{ opacity: 1, y: 0, rotateX: 0 }}
                transition={{
                  delay: 0.08 * index,
                  duration: 0.55,
                  ease: [0.2, 0.9, 0.2, 1],
                }}
                className="inline-block drop-shadow-[0_0_18px_rgba(0,123,255,0.6)]"
              >
                {letter === " " ? "\u00A0" : letter}
              </motion.span>
            ))}
          </div>

          <motion.div
            initial={{ scaleX: 0, opacity: 0 }}
            animate={{ scaleX: 1, opacity: 1 }}
            transition={{ delay: 0.55, duration: 0.6, ease: "easeOut" }}
            className="mx-auto mt-5 h-[2px] w-[56%] origin-center bg-gradient-to-r from-transparent via-blue-400 to-transparent"
          />

          {loading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1, duration: 0.4 }}
              className="mx-auto mt-5 h-1 w-44 overflow-hidden rounded-full bg-white/15"
            >
              <motion.div
                className="h-full w-20 rounded-full bg-blue-500 shadow-[0_0_16px_rgba(59,130,246,0.85)]"
                animate={{ x: [-26, 176] }}
                transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
              />
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

const WhiteLabApp: React.FC = () => {
  const { user, login, logout, loading } = useAuth();
  const [showIntro, setShowIntro] = useState(true);
  const [view, setView] = useState<ViewMode>(ViewMode.LANDING);
  const [theme, setTheme] = useState<Theme>("dark");
  const [lang, setLang] = useState<Lang>(() => {
    const savedLang = localStorage.getItem("lang");
    return savedLang === "ar" || savedLang === "en" ? savedLang : "en";
  });
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return window.innerWidth >= 1024;
  });
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isSignupModalOpen, setIsSignupModalOpen] = useState(false);

  const [cart, setCart] = useState<Course[]>([]);
  const [wishlist, setWishlist] = useState<WishlistItem[]>([]);
  const [dashboardRefreshTrigger, setDashboardRefreshTrigger] = useState(0);
  const [studentCourses, setStudentCourses] = useState<StudentLearningCourse[]>([]);

  const [activeExam, setActiveExam] = useState<PendingQuiz | null>(null);
  const [targetStudentId, setTargetStudentId] = useState<number | null>(null);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [pendingVerificationEmail, setPendingVerificationEmail] = useState<string | null>(null);
  const [pendingResetPasswordEmail, setPendingResetPasswordEmail] = useState<string | null>(null);
  const [viewHistory, setViewHistory] = useState<ViewMode[]>([]);
  const [landingSectionTarget, setLandingSectionTarget] =
    useState<LandingSectionId | null>(null);
  const [selectedBlogSlug, setSelectedBlogSlug] = useState<string | null>(null);
  const [selectedProjectSlug, setSelectedProjectSlug] = useState<string | null>(null);
  const [allowAuthenticatedLanding, setAllowAuthenticatedLanding] = useState(false);
  const lastApprovalNotificationRef = useRef<string | null>(null);

  const isMobile = useIsMobile();

  useEffect(() => {
    const timer = window.setTimeout(() => setShowIntro(false), 2200);
    return () => window.clearTimeout(timer);
  }, []);

  // Global runtime fix for broken Arabic mojibake strings (ØÙ...) across the app.
  useEffect(() => {
    const root = document.getElementById("root");
    if (!root) return;

    repairMojibakeInSubtree(root);

    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.type === "characterData") {
          if (mutation.target.nodeType === Node.TEXT_NODE) {
            repairTextNodeMojibake(mutation.target as Text);
          }
          continue;
        }

        if (mutation.type === "attributes") {
          if (mutation.target.nodeType === Node.ELEMENT_NODE) {
            repairElementMojibakeAttributes(mutation.target as Element);
          }
          continue;
        }

        mutation.addedNodes.forEach((addedNode) => {
          repairMojibakeInSubtree(addedNode);
        });
      }
    });

    observer.observe(root, {
      subtree: true,
      childList: true,
      characterData: true,
      attributes: true,
      attributeFilter: [...MOJIBAKE_ATTRIBUTE_NAMES],
    });

    return () => {
      observer.disconnect();
    };
  }, [lang]);

  // Initialization & Theme Sync
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") as Theme;
    const finalTheme = savedTheme || "dark";
    setTheme(finalTheme);
    document.documentElement.classList.toggle("dark", finalTheme === "dark");

    localStorage.setItem("lang", lang);
  }, []);

  // Keep authenticated users on dashboard by default, unless landing was opened intentionally.
  useLayoutEffect(() => {
    if (user && view === ViewMode.LANDING && !allowAuthenticatedLanding) {
      setView(ViewMode.DASHBOARD);
    }
  }, [user, view, allowAuthenticatedLanding]);

  // Auth data sync
  useEffect(() => {
    if (!user) return;

    // Fetch wishlist
    api.wishlist
      .list()
      .then(setWishlist)
      .catch(() => console.log("Offline mode active"));

    // Fetch cart items to sync with backend
    api.payment
      .getCart()
      .then((cartItems: any[]) => {
        const courses = cartItems.map((item: any) => ({
          id: item.course,
          title: item.course_title,
          price: item.course_price,
          thumbnail: item.course_thumbnail,
        }));
        setCart(courses);
      })
      .catch(() => console.log("Failed to fetch cart"));

    // Fetch notifications
    api.notifications
      .list()
      .then(setNotifications)
      .catch(() => console.log("Failed to fetch notifications"));

    // Poll for new notifications every 10 seconds
    const notificationInterval = setInterval(() => {
      api.notifications
        .list()
        .then(setNotifications)
        .catch(() => {});
    }, 10000);

    return () => clearInterval(notificationInterval);
  }, [user]);

  const loadStudentCourses = useCallback(async () => {
    if (!user || user.role !== "student") {
      setStudentCourses([]);
      return;
    }

    try {
      const dashboard = await api.courses.getDashboard();
      const activeCourses = Array.isArray(dashboard?.active_courses)
        ? dashboard.active_courses
        : [];

      const coursesForSidebar: StudentLearningCourse[] = activeCourses.map(
        (course: any) => ({
          id: Number(course.id),
          title: String(course.title || (lang === "en" ? "Untitled Course" : "كورس بدون عنوان")),
          progress: Number(course.progress || 0),
          completed_lessons: Number(course.completed_lessons || 0),
          total_lessons: Number(course.total_lessons || 0),
        })
      );

      setStudentCourses(coursesForSidebar);
    } catch (error) {
      console.error("Failed to load student courses for sidebar:", error);
    }
  }, [lang, user]);

  useEffect(() => {
    loadStudentCourses();
  }, [loadStudentCourses, dashboardRefreshTrigger]);

  useEffect(() => {
    if (!user || user.role !== "student" || !Array.isArray(notifications)) {
      return;
    }

    const approvalNotifications = notifications.filter((n: any) => {
      const title = String(n?.title || "").toLowerCase();
      const message = String(n?.message || "").toLowerCase();
      return (
        title.includes("payment approved") ||
        (title.includes("approved") && title.includes("payment")) ||
        (message.includes("payment") && message.includes("approved"))
      );
    });

    if (approvalNotifications.length === 0) return;

    const approvalToken = approvalNotifications
      .map(
        (notification: any) =>
          `${notification.id || "no-id"}-${notification.created_at || notification.date || notification.message || ""}`
      )
      .sort()
      .join("|");

    if (lastApprovalNotificationRef.current === approvalToken) return;

    lastApprovalNotificationRef.current = approvalToken;
    loadStudentCourses();
  }, [loadStudentCourses, notifications, user]);

  useEffect(() => {
    window.history.replaceState({ teachifyView: view }, "", window.location.href);
  }, []);

  const navigateTo = useCallback((nextView: ViewMode) => {
    setView((currentView) => {
      if (currentView === nextView) {
        return currentView;
      }

      setViewHistory((history) => [...history.slice(-49), currentView]);
      window.history.pushState({ teachifyView: nextView }, "", window.location.href);
      return nextView;
    });
  }, []);

  const openLoginModal = useCallback(() => {
    setIsSignupModalOpen(false);
    setIsLoginModalOpen(true);
  }, []);

  const closeLoginModal = useCallback(() => {
    setIsLoginModalOpen(false);
  }, []);

  const openSignupModal = useCallback(() => {
    setIsLoginModalOpen(false);
    setIsSignupModalOpen(true);
  }, []);

  const closeSignupModal = useCallback(() => {
    setIsSignupModalOpen(false);
  }, []);

  useEffect(() => {
    if (!isLoginModalOpen && !isSignupModalOpen) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [isLoginModalOpen, isSignupModalOpen]);

  useEffect(() => {
    if (!isLoginModalOpen && !isSignupModalOpen) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsLoginModalOpen(false);
        setIsSignupModalOpen(false);
      }
    };

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [isLoginModalOpen, isSignupModalOpen]);

  useEffect(() => {
    if (user && (isLoginModalOpen || isSignupModalOpen)) {
      setIsLoginModalOpen(false);
      setIsSignupModalOpen(false);
    }
  }, [user, isLoginModalOpen, isSignupModalOpen]);

  useEffect(() => {
    if (user) return;

    if (view === ViewMode.AUTH) {
      setView(ViewMode.LANDING);
      openLoginModal();
      return;
    }

    if (view === ViewMode.JOIN_PLATFORM) {
      setView(ViewMode.LANDING);
      openSignupModal();
    }
  }, [user, view, openLoginModal, openSignupModal]);

  useEffect(() => {
    const isLandingSurfaceView =
      view === ViewMode.LANDING ||
      view === ViewMode.CONTACT ||
      view === ViewMode.LANDING_SERVICES ||
      view === ViewMode.LANDING_COURSES ||
      view === ViewMode.LANDING_PROJECTS ||
      view === ViewMode.LANDING_BLOG ||
      view === ViewMode.LANDING_PROJECT_DETAIL ||
      view === ViewMode.LANDING_BLOG_DETAIL;

    if (!isLandingSurfaceView && allowAuthenticatedLanding) {
      setAllowAuthenticatedLanding(false);
      setLandingSectionTarget(null);
    }
  }, [view, allowAuthenticatedLanding]);

  const handleLandingSectionNavigation = useCallback(
    (sectionId: LandingSectionId) => {
      setSelectedBlogSlug(null);
      setSelectedProjectSlug(null);

      if (sectionId === "contact") {
        setLandingSectionTarget(null);
        navigateTo(ViewMode.CONTACT);
        return;
      }

      setAllowAuthenticatedLanding(true);
      setLandingSectionTarget(sectionId);
      navigateTo(ViewMode.LANDING);
    },
    [navigateTo],
  );

  const handleLandingContentNavigation = useCallback(
    (pageId: LandingContentPageId) => {
      setLandingSectionTarget(null);
      setSelectedBlogSlug(null);
      setSelectedProjectSlug(null);

      if (pageId === "services") {
        navigateTo(ViewMode.LANDING_SERVICES);
        return;
      }
      if (pageId === "courses") {
        navigateTo(ViewMode.LANDING_COURSES);
        return;
      }
      if (pageId === "projects") {
        navigateTo(ViewMode.LANDING_PROJECTS);
        return;
      }

      navigateTo(ViewMode.LANDING_BLOG);
    },
    [navigateTo],
  );

  const handleOpenLandingBlogPost = useCallback(
    (slug: string) => {
      setLandingSectionTarget(null);
      setSelectedProjectSlug(null);
      setSelectedBlogSlug(slug);
      navigateTo(ViewMode.LANDING_BLOG_DETAIL);
    },
    [navigateTo],
  );

  const handleOpenLandingProject = useCallback(
    (slug: string) => {
      setLandingSectionTarget(null);
      setSelectedBlogSlug(null);
      setSelectedProjectSlug(slug);
      navigateTo(ViewMode.LANDING_PROJECT_DETAIL);
    },
    [navigateTo],
  );

  const handleBackToLandingContentPage = useCallback(
    (pageId: LandingContentPageId) => {
      if (pageId === "projects") {
        setSelectedProjectSlug(null);
        navigateTo(ViewMode.LANDING_PROJECTS);
        return;
      }

      if (pageId === "blog") {
        setSelectedBlogSlug(null);
        navigateTo(ViewMode.LANDING_BLOG);
        return;
      }

      setSelectedBlogSlug(null);
      setSelectedProjectSlug(null);
      handleLandingContentNavigation(pageId);
    },
    [handleLandingContentNavigation, navigateTo],
  );

  const handleLandingSectionHandled = useCallback(() => {
    setLandingSectionTarget(null);
  }, []);

  const goBack = useCallback(
    (fallback?: ViewMode) => {
      if (viewHistory.length > 0) {
        window.history.back();
        return;
      }

      setView(fallback ?? (user ? ViewMode.DASHBOARD : ViewMode.LANDING));
    },
    [user, viewHistory.length],
  );

  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      setViewHistory((history) => {
        if (history.length > 0) {
          const previousView = history[history.length - 1];
          setView(previousView);
          return history.slice(0, -1);
        }

        const popView = event.state?.teachifyView as ViewMode | undefined;
        if (popView && Object.values(ViewMode).includes(popView)) {
          setView(popView);
        } else {
          setView(user ? ViewMode.DASHBOARD : ViewMode.LANDING);
        }

        return history;
      });
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [user]);

  const canGoBack = viewHistory.length > 0;

  useEffect(() => {
    if (view === ViewMode.EXAM_RUNNER && !activeExam) {
      setView(user ? ViewMode.DASHBOARD : ViewMode.LANDING);
    }
  }, [view, activeExam, user]);

  // Global Actions
  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
    document.documentElement.classList.toggle("dark", newTheme === "dark");
  };

  const toggleLang = () => {
    setLang((prevLang) => {
      const nextLang: Lang = prevLang === "en" ? "ar" : "en";
      localStorage.setItem("lang", nextLang);
      return nextLang;
    });
  };

  const addToCart = async (course: Course) => {
    if (!cart.find((c) => c.id === course.id)) {
      setCart([...cart, course]);
      // Save to backend
      try {
        await api.payment.addToCart(course.id);
      } catch (err) {
        console.error('Failed to save cart item:', err);
        // Remove from local state if backend failed
        setCart(cart.filter(c => c.id !== course.id));
      }
    }
  };
  const removeFromCart = async (id: number) => {
    const cartItem = cart.find(c => c.id === id);
    if (!cartItem) return;
    
    setCart(cart.filter((c) => c.id !== id));
    // Delete from backend
    try {
      // Fetch the CartItem ID by getting the full cart and finding the matching item
      const cartItems = await api.payment.getCart();
      const cartItemToDelete = cartItems.find((item: any) => item.course === id);
      if (cartItemToDelete) {
        await api.payment.removeFromCart(cartItemToDelete.id);
      }
    } catch (err) {
      console.error('Failed to remove cart item:', err);
      // Restore cart if deletion fails
      setCart([...cart, cartItem]);
    }
  };
  const clearCart = async () => {
    setCart([]);
    // Clear from backend
    try {
      await api.payment.clearCart();
    } catch (err) {
      console.error('Failed to clear cart:', err);
    }
  };

  const toggleWishlist = async (course: Course) => {
    const currentWishlist = wishlist || [];
    const exists = currentWishlist.find((w) => w.course === course.id);
    if (exists) {
      setWishlist(currentWishlist.filter((w) => w.course !== course.id));
      await api.wishlist.remove(course.id).catch(() => {});
    } else {
      const newItem: WishlistItem = {
        id: Date.now(),
        course: course.id,
        course_title: course.title,
        course_thumbnail: course.thumbnail,
        course_price: course.price,
        created_at: new Date().toISOString(),
      };
      setWishlist([...currentWishlist, newItem]);
      await api.wishlist.add(course.id).catch(() => {});
    }
    setDashboardRefreshTrigger((p) => p + 1);
  };

  const startExam = (exam: PendingQuiz) => {
    setActiveExam(exam);
    navigateTo(ViewMode.EXAM_RUNNER);
  };

  const handleNavigateToStudent = (studentId: number) => {
    setTargetStudentId(studentId);
    navigateTo(ViewMode.STUDENTS_LIST);
  };

  const handleOpenStudentCourse = useCallback(
    (courseId: number) => {
      const courseMeta = studentCourses.find((course) => course.id === courseId);
      const selected: Course = {
        id: courseId,
        title: courseMeta?.title || "",
        description: "",
        instructor_id: 0,
        category: 0,
        price: "0.00",
        created_at: "",
        is_enrolled: true,
        progress: courseMeta?.progress || 0,
      };
      setSelectedCourse(selected);
      navigateTo(ViewMode.COURSE_PLAYER);
    },
    [navigateTo, studentCourses]
  );

  const handleCourseProgressChange = useCallback(() => {
    setDashboardRefreshTrigger((prev) => prev + 1);
  }, []);

  const handleCoursePlayerBack = useCallback(() => {
    const previousView = viewHistory[viewHistory.length - 1];
    const openedFromStudentCourses =
      user?.role === "student" &&
      Boolean(selectedCourse) &&
      (previousView === ViewMode.DASHBOARD ||
        previousView === ViewMode.COURSE_PLAYER);

    // If a student opened a specific course from "My Courses", go back to course shelf view.
    if (openedFromStudentCourses) {
      setSelectedCourse(null);
      return;
    }

    goBack(user?.role === "student" ? ViewMode.COURSE_PLAYER : ViewMode.DASHBOARD);
  }, [goBack, selectedCourse, user, viewHistory]);

  const handleLogout = () => {
    logout();
    lastApprovalNotificationRef.current = null;
    setView(ViewMode.LANDING);
    setViewHistory([]);
    setCart([]);
    setStudentCourses([]);
    setLandingSectionTarget(null);
    setSelectedBlogSlug(null);
    setSelectedProjectSlug(null);
    setAllowAuthenticatedLanding(false);
    setIsSidebarOpen(false);
    setIsSettingsOpen(false);
  };

  // View Router Logic
  const renderView = () => {
    if (!user) {
      switch (view) {
        // NEW: Email Verification page
        case ViewMode.VERIFY_EMAIL:
          return (
            <VerifyEmailPage
              email={pendingVerificationEmail || undefined}
              onBack={() => {
                setPendingVerificationEmail(null);
                openSignupModal();
                goBack(ViewMode.LANDING);
              }}
              onSuccess={() => {
                // After verification, redirect to login
                setPendingVerificationEmail(null);
                navigateTo(ViewMode.LANDING);
                openLoginModal();
              }}
            />
          );

        // NEW: Forgot Password page
        case ViewMode.FORGOT_PASSWORD:
          return (
            <ForgotPassword
              onBack={() => {
                goBack(ViewMode.LANDING);
                openLoginModal();
              }}
              onNext={(email: string) => {
                setPendingResetPasswordEmail(email);
                navigateTo(ViewMode.RESET_PASSWORD);
              }}
            />
          );

        // NEW: Reset Password page
        case ViewMode.RESET_PASSWORD:
          return (
            <ResetPassword
              email={pendingResetPasswordEmail || ""}
              onBack={() => {
                setPendingResetPasswordEmail(null);
                goBack(ViewMode.FORGOT_PASSWORD);
              }}
              onSuccess={() => {
                // After successful password reset, redirect to login
                setPendingResetPasswordEmail(null);
                navigateTo(ViewMode.LANDING);
                openLoginModal();
              }}
            />
          );

        case ViewMode.MARKETPLACE:
          return (
            <Marketplace
              addToCart={openLoginModal}
              toggleWishlist={openLoginModal}
              wishlistIds={[]}
              lang={lang}
              showJoinButton={true}
              onJoinClick={openSignupModal}
              onBack={() => goBack(ViewMode.LANDING)}
              setView={navigateTo}
              onEnrolledCourseClick={(course) => {
                setSelectedCourse(course);
                navigateTo(ViewMode.COURSE_PLAYER);
              }}
            />
          );

        case ViewMode.COURSE_PLAYER:
          return (
            <CoursePlayer
              lang={lang}
              theme={theme}
              isMobile={isMobile}
              selectedCourse={selectedCourse}
              previewOnly={true}
              onJoinPlatform={openSignupModal}
              onBack={() => goBack(ViewMode.LANDING)}
            />
          );

        case ViewMode.MENTORS_LIST:
          return (
            <MentorsList onBack={() => goBack(ViewMode.LANDING)} lang={lang} />
          );

        case ViewMode.CONTACT:
          return (
            <LandingPage
              mode="contact"
              onLogoClick={() => navigateTo(ViewMode.LANDING)}
              onLoginClick={openLoginModal}
              onJoinClick={openSignupModal}
              onExploreClick={() => navigateTo(ViewMode.MARKETPLACE)}
              onMentorsClick={() => navigateTo(ViewMode.MENTORS_LIST)}
              onOpenContactPage={() => {
                setLandingSectionTarget(null);
                navigateTo(ViewMode.CONTACT);
              }}
              onOpenLandingSection={(sectionId) => handleLandingSectionNavigation(sectionId)}
              onOpenContentPage={(pageId) => handleLandingContentNavigation(pageId)}
              lang={lang}
              toggleLang={toggleLang}
              theme={theme}
              toggleTheme={toggleTheme}
            />
          );

        case ViewMode.LANDING_SERVICES:
          return (
            <LandingPage
              mode="services"
              onLogoClick={() => navigateTo(ViewMode.LANDING)}
              onLoginClick={openLoginModal}
              onJoinClick={openSignupModal}
              onExploreClick={() => navigateTo(ViewMode.MARKETPLACE)}
              onMentorsClick={() => navigateTo(ViewMode.MENTORS_LIST)}
              onOpenContactPage={() => {
                setLandingSectionTarget(null);
                navigateTo(ViewMode.CONTACT);
              }}
              onOpenLandingSection={(sectionId) => handleLandingSectionNavigation(sectionId)}
              onOpenContentPage={(pageId) => handleLandingContentNavigation(pageId)}
              lang={lang}
              toggleLang={toggleLang}
              theme={theme}
              toggleTheme={toggleTheme}
            />
          );

        case ViewMode.LANDING_COURSES:
          return (
            <LandingPage
              mode="courses"
              onLogoClick={() => navigateTo(ViewMode.LANDING)}
              onLoginClick={openLoginModal}
              onJoinClick={openSignupModal}
              onExploreClick={() => navigateTo(ViewMode.MARKETPLACE)}
              onMentorsClick={() => navigateTo(ViewMode.MENTORS_LIST)}
              onOpenContactPage={() => {
                setLandingSectionTarget(null);
                navigateTo(ViewMode.CONTACT);
              }}
              onOpenLandingSection={(sectionId) => handleLandingSectionNavigation(sectionId)}
              onOpenContentPage={(pageId) => handleLandingContentNavigation(pageId)}
              onCourseOpen={(course) => {
                setSelectedCourse(course);
                navigateTo(ViewMode.COURSE_PLAYER);
              }}
              lang={lang}
              toggleLang={toggleLang}
              theme={theme}
              toggleTheme={toggleTheme}
            />
          );

        case ViewMode.LANDING_PROJECTS:
          return (
            <LandingPage
              mode="projects"
              onLogoClick={() => navigateTo(ViewMode.LANDING)}
              onLoginClick={openLoginModal}
              onJoinClick={openSignupModal}
              onExploreClick={() => navigateTo(ViewMode.MARKETPLACE)}
              onMentorsClick={() => navigateTo(ViewMode.MENTORS_LIST)}
              onOpenContactPage={() => {
                setLandingSectionTarget(null);
                navigateTo(ViewMode.CONTACT);
              }}
              onOpenLandingSection={(sectionId) => handleLandingSectionNavigation(sectionId)}
              onOpenContentPage={(pageId) => handleLandingContentNavigation(pageId)}
              onOpenProject={handleOpenLandingProject}
              lang={lang}
              toggleLang={toggleLang}
              theme={theme}
              toggleTheme={toggleTheme}
            />
          );

        case ViewMode.LANDING_PROJECT_DETAIL:
          return (
            <LandingPage
              mode="project-detail"
              selectedProjectSlug={selectedProjectSlug}
              onLogoClick={() => navigateTo(ViewMode.LANDING)}
              onLoginClick={openLoginModal}
              onJoinClick={openSignupModal}
              onExploreClick={() => navigateTo(ViewMode.MARKETPLACE)}
              onMentorsClick={() => navigateTo(ViewMode.MENTORS_LIST)}
              onOpenContactPage={() => {
                setLandingSectionTarget(null);
                navigateTo(ViewMode.CONTACT);
              }}
              onOpenLandingSection={(sectionId) => handleLandingSectionNavigation(sectionId)}
              onOpenContentPage={(pageId) => handleLandingContentNavigation(pageId)}
              onOpenProject={handleOpenLandingProject}
              onBackToContentPage={handleBackToLandingContentPage}
              lang={lang}
              toggleLang={toggleLang}
              theme={theme}
              toggleTheme={toggleTheme}
            />
          );

        case ViewMode.LANDING_BLOG:
          return (
            <LandingPage
              mode="blog"
              onLogoClick={() => navigateTo(ViewMode.LANDING)}
              onLoginClick={openLoginModal}
              onJoinClick={openSignupModal}
              onExploreClick={() => navigateTo(ViewMode.MARKETPLACE)}
              onMentorsClick={() => navigateTo(ViewMode.MENTORS_LIST)}
              onOpenContactPage={() => {
                setLandingSectionTarget(null);
                navigateTo(ViewMode.CONTACT);
              }}
              onOpenLandingSection={(sectionId) => handleLandingSectionNavigation(sectionId)}
              onOpenContentPage={(pageId) => handleLandingContentNavigation(pageId)}
              onOpenBlogPost={handleOpenLandingBlogPost}
              lang={lang}
              toggleLang={toggleLang}
              theme={theme}
              toggleTheme={toggleTheme}
            />
          );

        case ViewMode.LANDING_BLOG_DETAIL:
          return (
            <LandingPage
              mode="blog-detail"
              selectedBlogSlug={selectedBlogSlug}
              onLogoClick={() => navigateTo(ViewMode.LANDING)}
              onLoginClick={openLoginModal}
              onJoinClick={openSignupModal}
              onExploreClick={() => navigateTo(ViewMode.MARKETPLACE)}
              onMentorsClick={() => navigateTo(ViewMode.MENTORS_LIST)}
              onOpenContactPage={() => {
                setLandingSectionTarget(null);
                navigateTo(ViewMode.CONTACT);
              }}
              onOpenLandingSection={(sectionId) => handleLandingSectionNavigation(sectionId)}
              onOpenContentPage={(pageId) => handleLandingContentNavigation(pageId)}
              onOpenBlogPost={handleOpenLandingBlogPost}
              onBackToContentPage={handleBackToLandingContentPage}
              lang={lang}
              toggleLang={toggleLang}
              theme={theme}
              toggleTheme={toggleTheme}
            />
          );

        case ViewMode.LANDING:
        default:
          return (
            <LandingPage
              onLogoClick={() => navigateTo(ViewMode.LANDING)}
              onLoginClick={openLoginModal}
              onJoinClick={openSignupModal}
              onExploreClick={() => navigateTo(ViewMode.MARKETPLACE)}
              onMentorsClick={() => navigateTo(ViewMode.MENTORS_LIST)}
              onOpenContactPage={() => {
                setLandingSectionTarget(null);
                navigateTo(ViewMode.CONTACT);
              }}
              onOpenContentPage={(pageId) => handleLandingContentNavigation(pageId)}
              onOpenBlogPost={handleOpenLandingBlogPost}
              onOpenProject={handleOpenLandingProject}
              onCourseOpen={(course) => {
                setSelectedCourse(course);
                navigateTo(ViewMode.COURSE_PLAYER);
              }}
              lang={lang}
              toggleLang={toggleLang}
              theme={theme}
              toggleTheme={toggleTheme}
              initialSectionId={landingSectionTarget}
              onInitialSectionHandled={handleLandingSectionHandled}
            />
          );
      }
    }

    switch (view) {
      case ViewMode.DASHBOARD:
        return user.role === "instructor" ? (
          <InstructorDashboard lang={lang} theme={theme} />
        ) : (
          <StudentDashboard
            lang={lang}
            theme={theme}
            refreshTrigger={dashboardRefreshTrigger}
            isMobile={isMobile}
            setView={navigateTo}
          />
        );

      case ViewMode.WORKSPACE:
        return <WorkspaceCanvas lang={lang} setView={navigateTo} />;

      case ViewMode.MARKETPLACE:
        return (
          <Marketplace
            addToCart={addToCart}
            toggleWishlist={toggleWishlist}
            wishlistIds={wishlist?.map((w) => w.course) || []}
            lang={lang}
            setView={navigateTo}
            onEnrolledCourseClick={(course) => {
              setSelectedCourse(course);
              navigateTo(ViewMode.COURSE_PLAYER);
            }}
          />
        );

      case ViewMode.WISHLIST:
        return (
          <Wishlist
            items={wishlist || []}
            onRemove={(courseId) =>
              setWishlist((prev) =>
                (prev || []).filter((w) => w.course !== courseId)
              )
            }
            onAddToCart={(courseId, title, price, thumbnail) => {
              const course: Course = {
                id: courseId,
                title,
                price,
                thumbnail,
                description: "",
                instructor_id: 0,
                created_at: "",
                is_enrolled: false,
                section_count: 0,
              };
              addToCart(course);
              navigateTo(ViewMode.CART);
            }}
            lang={lang}
            onBack={() => goBack(ViewMode.DASHBOARD)}
            setView={navigateTo}
          />
        );

      case ViewMode.CART:
        return (
          <CartPayment
            cart={cart}
            removeFromCart={removeFromCart}
            clearCart={clearCart}
            lang={lang}
            refreshDashboard={() => setDashboardRefreshTrigger((p) => p + 1)}
            setView={navigateTo}
            onBack={() => goBack(ViewMode.MARKETPLACE)}
          />
        );

      case ViewMode.PAYMENT_SUBMISSION:
        return (
          <PaymentSubmission
            cartItems={cart.map(c => ({
              id: c.id,
              course: c.id,
              course_title: c.title,
              course_price: c.price,
              course_thumbnail: c.thumbnail,
              added_at: new Date().toISOString()
            }))}
            totalAmount={cart.reduce((sum, c) => sum + parseFloat(c.price || '0'), 0)}
            lang={lang}
            setView={navigateTo}
            refreshCart={() => setDashboardRefreshTrigger((p) => p + 1)}
            onBack={() => goBack(ViewMode.CART)}
          />
        );

      case ViewMode.PAYMENT_HISTORY:
        return <PaymentHistory lang={lang} />;

      case ViewMode.INSTRUCTOR_PAYMENTS:
        return <PaymentRequests lang={lang} />;

      case ViewMode.COURSE_PLAYER:
        return (
          <CoursePlayer
            lang={lang}
            theme={theme}
            isMobile={isMobile}
            selectedCourse={selectedCourse}
            onBack={handleCoursePlayerBack}
            onProgressChange={handleCourseProgressChange}
          />
        );

      case ViewMode.EXAM_LIST:
        return <ExamsList lang={lang} theme={theme} onStartExam={startExam} />;

      case ViewMode.EXAM_RUNNER:
        return activeExam ? (
          <ExamRunner
            exam={activeExam}
            lang={lang}
            onExit={() => navigateTo(ViewMode.EXAM_LIST)}
          />
        ) : user.role === "instructor" ? (
          <InstructorDashboard lang={lang} theme={theme} />
        ) : (
          <StudentDashboard
            lang={lang}
            theme={theme}
            refreshTrigger={dashboardRefreshTrigger}
            isMobile={isMobile}
            setView={navigateTo}
          />
        );

      case ViewMode.CERTIFICATES:
        return <StudentCertificates lang={lang} theme={theme} />;

      case ViewMode.COURSE_EDITOR:
        return <InstructorCourses lang={lang} theme={theme} />;

      case ViewMode.INSTRUCTOR_EXAMS:
        return <InstructorExams lang={lang} theme={theme} />;

      case ViewMode.INSTRUCTOR_TASKS:
        return <InstructorTasks lang={lang} theme={theme} />;

      case ViewMode.STUDENTS_LIST:
         return (
           <InstructorStudents
             lang={lang}
             theme={theme}
             targetStudentId={targetStudentId}
           />
         );

      case ViewMode.INSTRUCTOR_CERTIFICATES:
         return <InstructorCertificates lang={lang} theme={theme} />;

       case ViewMode.TOP_STUDENTS:
         return <TopStudentsPage lang={lang} theme={theme} />;

      case ViewMode.CONTACT:
        return (
          <LandingPage
            mode="contact"
            onLogoClick={() => handleLandingSectionNavigation("home")}
            onLoginClick={() => navigateTo(ViewMode.DASHBOARD)}
            onJoinClick={() => navigateTo(ViewMode.DASHBOARD)}
            onExploreClick={() => navigateTo(ViewMode.MARKETPLACE)}
            onMentorsClick={() => navigateTo(ViewMode.MENTORS_LIST)}
            onOpenContactPage={() => {
              setLandingSectionTarget(null);
              navigateTo(ViewMode.CONTACT);
            }}
            onOpenLandingSection={(sectionId) => handleLandingSectionNavigation(sectionId)}
            onOpenContentPage={(pageId) => handleLandingContentNavigation(pageId)}
            lang={lang}
            toggleLang={toggleLang}
            theme={theme}
            toggleTheme={toggleTheme}
          />
        );

      case ViewMode.LANDING_SERVICES:
        return (
          <LandingPage
            mode="services"
            onLogoClick={() => handleLandingSectionNavigation("home")}
            onLoginClick={() => navigateTo(ViewMode.DASHBOARD)}
            onJoinClick={() => navigateTo(ViewMode.DASHBOARD)}
            onExploreClick={() => navigateTo(ViewMode.MARKETPLACE)}
            onMentorsClick={() => navigateTo(ViewMode.MENTORS_LIST)}
            onOpenContactPage={() => {
              setLandingSectionTarget(null);
              navigateTo(ViewMode.CONTACT);
            }}
            onOpenLandingSection={(sectionId) => handleLandingSectionNavigation(sectionId)}
            onOpenContentPage={(pageId) => handleLandingContentNavigation(pageId)}
            lang={lang}
            toggleLang={toggleLang}
            theme={theme}
            toggleTheme={toggleTheme}
          />
        );

      case ViewMode.LANDING_COURSES:
        return (
          <LandingPage
            mode="courses"
            onLogoClick={() => handleLandingSectionNavigation("home")}
            onLoginClick={() => navigateTo(ViewMode.DASHBOARD)}
            onJoinClick={() => navigateTo(ViewMode.DASHBOARD)}
            onExploreClick={() => navigateTo(ViewMode.MARKETPLACE)}
            onMentorsClick={() => navigateTo(ViewMode.MENTORS_LIST)}
            onOpenContactPage={() => {
              setLandingSectionTarget(null);
              navigateTo(ViewMode.CONTACT);
            }}
            onOpenLandingSection={(sectionId) => handleLandingSectionNavigation(sectionId)}
            onOpenContentPage={(pageId) => handleLandingContentNavigation(pageId)}
            onCourseOpen={(course) => {
              setSelectedCourse(course);
              navigateTo(ViewMode.COURSE_PLAYER);
            }}
            lang={lang}
            toggleLang={toggleLang}
            theme={theme}
            toggleTheme={toggleTheme}
          />
        );

      case ViewMode.LANDING_PROJECTS:
        return (
          <LandingPage
            mode="projects"
            onLogoClick={() => handleLandingSectionNavigation("home")}
            onLoginClick={() => navigateTo(ViewMode.DASHBOARD)}
            onJoinClick={() => navigateTo(ViewMode.DASHBOARD)}
            onExploreClick={() => navigateTo(ViewMode.MARKETPLACE)}
            onMentorsClick={() => navigateTo(ViewMode.MENTORS_LIST)}
            onOpenContactPage={() => {
              setLandingSectionTarget(null);
              navigateTo(ViewMode.CONTACT);
            }}
            onOpenLandingSection={(sectionId) => handleLandingSectionNavigation(sectionId)}
            onOpenContentPage={(pageId) => handleLandingContentNavigation(pageId)}
            onOpenProject={handleOpenLandingProject}
            lang={lang}
            toggleLang={toggleLang}
            theme={theme}
            toggleTheme={toggleTheme}
          />
        );

      case ViewMode.LANDING_PROJECT_DETAIL:
        return (
          <LandingPage
            mode="project-detail"
            selectedProjectSlug={selectedProjectSlug}
            onLogoClick={() => handleLandingSectionNavigation("home")}
            onLoginClick={() => navigateTo(ViewMode.DASHBOARD)}
            onJoinClick={() => navigateTo(ViewMode.DASHBOARD)}
            onExploreClick={() => navigateTo(ViewMode.MARKETPLACE)}
            onMentorsClick={() => navigateTo(ViewMode.MENTORS_LIST)}
            onOpenContactPage={() => {
              setLandingSectionTarget(null);
              navigateTo(ViewMode.CONTACT);
            }}
            onOpenLandingSection={(sectionId) => handleLandingSectionNavigation(sectionId)}
            onOpenContentPage={(pageId) => handleLandingContentNavigation(pageId)}
            onOpenProject={handleOpenLandingProject}
            onBackToContentPage={handleBackToLandingContentPage}
            lang={lang}
            toggleLang={toggleLang}
            theme={theme}
            toggleTheme={toggleTheme}
          />
        );

      case ViewMode.LANDING_BLOG:
        return (
          <LandingPage
            mode="blog"
            onLogoClick={() => handleLandingSectionNavigation("home")}
            onLoginClick={() => navigateTo(ViewMode.DASHBOARD)}
            onJoinClick={() => navigateTo(ViewMode.DASHBOARD)}
            onExploreClick={() => navigateTo(ViewMode.MARKETPLACE)}
            onMentorsClick={() => navigateTo(ViewMode.MENTORS_LIST)}
            onOpenContactPage={() => {
              setLandingSectionTarget(null);
              navigateTo(ViewMode.CONTACT);
            }}
            onOpenLandingSection={(sectionId) => handleLandingSectionNavigation(sectionId)}
            onOpenContentPage={(pageId) => handleLandingContentNavigation(pageId)}
            onOpenBlogPost={handleOpenLandingBlogPost}
            lang={lang}
            toggleLang={toggleLang}
            theme={theme}
            toggleTheme={toggleTheme}
          />
        );

      case ViewMode.LANDING_BLOG_DETAIL:
        return (
          <LandingPage
            mode="blog-detail"
            selectedBlogSlug={selectedBlogSlug}
            onLogoClick={() => handleLandingSectionNavigation("home")}
            onLoginClick={() => navigateTo(ViewMode.DASHBOARD)}
            onJoinClick={() => navigateTo(ViewMode.DASHBOARD)}
            onExploreClick={() => navigateTo(ViewMode.MARKETPLACE)}
            onMentorsClick={() => navigateTo(ViewMode.MENTORS_LIST)}
            onOpenContactPage={() => {
              setLandingSectionTarget(null);
              navigateTo(ViewMode.CONTACT);
            }}
            onOpenLandingSection={(sectionId) => handleLandingSectionNavigation(sectionId)}
            onOpenContentPage={(pageId) => handleLandingContentNavigation(pageId)}
            onOpenBlogPost={handleOpenLandingBlogPost}
            onBackToContentPage={handleBackToLandingContentPage}
            lang={lang}
            toggleLang={toggleLang}
            theme={theme}
            toggleTheme={toggleTheme}
          />
        );

      case ViewMode.LANDING:
        return (
          <LandingPage
            onLogoClick={() => handleLandingSectionNavigation("home")}
            onLoginClick={() => navigateTo(ViewMode.DASHBOARD)}
            onJoinClick={() => navigateTo(ViewMode.DASHBOARD)}
            onExploreClick={() => navigateTo(ViewMode.MARKETPLACE)}
            onMentorsClick={() => navigateTo(ViewMode.MENTORS_LIST)}
            onOpenContactPage={() => {
              setLandingSectionTarget(null);
              navigateTo(ViewMode.CONTACT);
            }}
            onOpenContentPage={(pageId) => handleLandingContentNavigation(pageId)}
            onOpenBlogPost={handleOpenLandingBlogPost}
            onOpenProject={handleOpenLandingProject}
            onCourseOpen={(course) => {
              setSelectedCourse(course);
              navigateTo(ViewMode.COURSE_PLAYER);
            }}
            lang={lang}
            toggleLang={toggleLang}
            theme={theme}
            toggleTheme={toggleTheme}
            initialSectionId={landingSectionTarget}
            onInitialSectionHandled={handleLandingSectionHandled}
          />
        );

      default:
        return user.role === "instructor" ? (
          <InstructorDashboard lang={lang} theme={theme} />
        ) : (
          <StudentDashboard
            lang={lang}
            theme={theme}
            refreshTrigger={dashboardRefreshTrigger}
            isMobile={isMobile}
            setView={navigateTo}
          />
        );
    }
  };
  if (showIntro || loading) {
    return <IntroSplash loading={loading} />;
  }

  return (
    <>
      <PaymentNotificationListener notifications={notifications} />
      <Layout
        view={view}
        setView={navigateTo}
        onGoBack={() => goBack()}
        canGoBack={canGoBack}
        user={user}
        theme={theme}
        toggleTheme={toggleTheme}
        lang={lang}
        toggleLang={toggleLang}
        cartCount={cart.length}
        isSidebarOpen={isSidebarOpen}
        setIsSidebarOpen={setIsSidebarOpen}
        isSettingsOpen={isSettingsOpen}
        setIsSettingsOpen={setIsSettingsOpen}
        onLogout={handleLogout}
        onNavigateToStudent={handleNavigateToStudent}
        onUpdateUser={login}
        onNavigateLandingSection={handleLandingSectionNavigation}
        studentCourses={studentCourses}
        onOpenStudentCourse={handleOpenStudentCourse}
      >
        {renderView()}
      </Layout>
      <AnimatePresence>
        {!user && isLoginModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/70 px-4 py-2 sm:py-4 backdrop-blur-sm"
            onClick={closeLoginModal}
          >
            <motion.div
              initial={{ opacity: 0, y: 14, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 14, scale: 0.98 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="relative w-full max-w-2xl rounded-3xl border border-slate-200/70 bg-eden-bg shadow-2xl"
              onClick={(event) => event.stopPropagation()}
            >
              <button
                type="button"
                aria-label="Close login modal"
                onClick={closeLoginModal}
                className="absolute right-3 top-3 z-20 inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-slate-700 shadow-sm transition-colors hover:bg-white hover:text-slate-900"
              >
                X
              </button>
              <LoginPage
                onLogin={(u) => {
                  closeLoginModal();
                  login(u);
                  setViewHistory([]);
                  setView(ViewMode.DASHBOARD);
                }}
                onBack={closeLoginModal}
                onSignUp={() => {
                  closeLoginModal();
                  openSignupModal();
                }}
                onForgotPassword={() => {
                  closeLoginModal();
                  navigateTo(ViewMode.FORGOT_PASSWORD);
                }}
                lang={lang}
                toggleLang={toggleLang}
                theme={theme}
                toggleTheme={toggleTheme}
                isModal={true}
              />
            </motion.div>
          </motion.div>
        )}
        {!user && isSignupModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/70 px-4 py-2 sm:py-4 backdrop-blur-sm"
            onClick={closeSignupModal}
          >
            <motion.div
              initial={{ opacity: 0, y: 14, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 14, scale: 0.98 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="relative w-full max-w-5xl rounded-3xl border border-slate-200/70 bg-eden-bg shadow-2xl"
              onClick={(event) => event.stopPropagation()}
            >
              <button
                type="button"
                aria-label="Close signup modal"
                onClick={closeSignupModal}
                className="absolute right-3 top-3 z-20 inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-slate-700 shadow-sm transition-colors hover:bg-white hover:text-slate-900"
              >
                X
              </button>
              <SignupPage
                onBack={closeSignupModal}
                onSignIn={() => {
                  closeSignupModal();
                  openLoginModal();
                }}
                onSuccess={({ email, verificationRequired }) => {
                  closeSignupModal();
                  if (verificationRequired) {
                    setPendingVerificationEmail(email);
                    navigateTo(ViewMode.VERIFY_EMAIL);
                    return;
                  }
                  openLoginModal();
                }}
                lang={lang}
                toggleLang={toggleLang}
                theme={theme}
                toggleTheme={toggleTheme}
                isModal={true}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <PaymentProvider>
        <WhiteLabApp />
        {/* âœ¨ Toast notification container - required for sonner to display toasts */}
        <Toaster position="top-right" richColors />
      </PaymentProvider>
    </AuthProvider>
  );
};

export default App;

