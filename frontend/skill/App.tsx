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
import React, { useState, useEffect } from "react";
import {
  ViewMode,
  Course,
  WishlistItem,
  Theme,
  Lang,
  PendingQuiz,
  User,
} from "./types";
import { api } from "./api/client";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Layout from "./components/Layout";
import { useIsMobile } from "./hooks/useIsMobile";

// Import Pages
import LandingPage from "./pages/Landing";
import LoginPage from "./pages/auth/Login";
import SignupPage from "./pages/auth/Signup"; // NEW: Import Signup page
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
import CartPage from "./pages/student/Cart";
import CoursePlayer from "./pages/student/CoursePlayer";
import ExamsList from "./pages/student/ExamsList";
import ExamRunner from "./pages/student/ExamRunner";
import StudentCertificates from "./pages/student/Certificates";
import MentorsList from "./pages/MentorsList";
import WorkspaceCanvas from "./components/WorkspaceCanvas";

const WhiteLabApp: React.FC = () => {
  const { user, login, logout, loading } = useAuth();
  const [view, setView] = useState<ViewMode>(ViewMode.LANDING);
  const [theme, setTheme] = useState<Theme>("dark");
  const [lang, setLang] = useState<Lang>("en");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const [cart, setCart] = useState<Course[]>([]);
  const [wishlist, setWishlist] = useState<WishlistItem[]>([]);
  const [dashboardRefreshTrigger, setDashboardRefreshTrigger] = useState(0);

  const [activeExam, setActiveExam] = useState<PendingQuiz | null>(null);
  const [targetStudentId, setTargetStudentId] = useState<number | null>(null);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);

  const isMobile = useIsMobile();

  // Initialization & Theme Sync
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") as Theme;
    const finalTheme = savedTheme || "dark";
    setTheme(finalTheme);
    document.documentElement.classList.toggle("dark", finalTheme === "dark");
  }, []);

  // Auth-based View Redirection & Data Sync
  useEffect(() => {
    if (user && view === ViewMode.LANDING) {
      setView(ViewMode.DASHBOARD);
    }
    if (user) {
      api.wishlist
        .list()
        .then(setWishlist)
        .catch(() => console.log("Offline mode active"));
    }
  }, [user]);

  // Global Actions
  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
    document.documentElement.classList.toggle("dark", newTheme === "dark");
  };

  const toggleLang = () => setLang((l) => (l === "en" ? "ar" : "en"));

  const addToCart = (course: Course) => {
    if (!cart.find((c) => c.id === course.id)) setCart([...cart, course]);
  };
  const removeFromCart = (id: number) =>
    setCart(cart.filter((c) => c.id !== id));
  const clearCart = () => setCart([]);

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
    setView(ViewMode.EXAM_RUNNER);
  };

  const handleNavigateToStudent = (studentId: number) => {
    setTargetStudentId(studentId);
    setView(ViewMode.STUDENTS_LIST);
  };

  const handleLogout = () => {
    logout();
    setView(ViewMode.LANDING);
    setCart([]);
    setIsSidebarOpen(false);
    setIsSettingsOpen(false);
  };

  // View Router Logic
  const renderView = () => {
    if (!user) {
      switch (view) {
        case ViewMode.AUTH:
          return (
            <LoginPage
              onLogin={(u) => {
                login(u);
                setView(ViewMode.DASHBOARD);
              }}
              onBack={() => setView(ViewMode.LANDING)}
              lang={lang}
              toggleLang={toggleLang}
              theme={theme}
              toggleTheme={toggleTheme}
            />
          );

        // NEW: Use Signup page instead of JoinPlatform
        case ViewMode.JOIN_PLATFORM:
          return (
            <SignupPage
              onBack={() => setView(ViewMode.LANDING)}
              onSuccess={() => setView(ViewMode.AUTH)} // Redirect to login after successful signup
              lang={lang}
              toggleLang={toggleLang}
              theme={theme}
              toggleTheme={toggleTheme}
            />
          );

        case ViewMode.MARKETPLACE:
          return (
            <Marketplace
              addToCart={() => setView(ViewMode.AUTH)}
              toggleWishlist={() => setView(ViewMode.AUTH)}
              wishlistIds={[]}
              lang={lang}
              showJoinButton={true}
              onJoinClick={() => setView(ViewMode.JOIN_PLATFORM)}
              onBack={() => setView(ViewMode.LANDING)}
              setView={setView}
              onEnrolledCourseClick={(course) => {
                setSelectedCourse(course);
                setView(ViewMode.COURSE_PLAYER);
              }}
            />
          );

        case ViewMode.MENTORS_LIST:
          return (
            <MentorsList onBack={() => setView(ViewMode.LANDING)} lang={lang} />
          );

        case ViewMode.LANDING:
        default:
          return (
            <LandingPage
              onLogoClick={() => setView(ViewMode.LANDING)}
              onLoginClick={() => setView(ViewMode.AUTH)}
              onJoinClick={() => setView(ViewMode.JOIN_PLATFORM)}
              onExploreClick={() => setView(ViewMode.MARKETPLACE)}
              onMentorsClick={() => setView(ViewMode.MENTORS_LIST)}
              lang={lang}
              toggleLang={toggleLang}
              theme={theme}
              toggleTheme={toggleTheme}
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
            setView={setView}
          />
        );

      case ViewMode.WORKSPACE:
        return <WorkspaceCanvas lang={lang} setView={setView} />;

      case ViewMode.MARKETPLACE:
        return (
          <Marketplace
            addToCart={addToCart}
            toggleWishlist={toggleWishlist}
            wishlistIds={wishlist?.map((w) => w.course) || []}
            lang={lang}
            setView={setView}
            onEnrolledCourseClick={(course) => {
              setSelectedCourse(course);
              setView(ViewMode.COURSE_PLAYER);
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
              setView(ViewMode.CART);
            }}
            lang={lang}
            onBack={() => setView(ViewMode.DASHBOARD)}
            setView={setView}
          />
        );

      case ViewMode.CART:
        return (
          <CartPage
            cart={cart}
            removeFromCart={removeFromCart}
            clearCart={clearCart}
            lang={lang}
            refreshDashboard={() => setDashboardRefreshTrigger((p) => p + 1)}
            setView={setView}
          />
        );

      case ViewMode.COURSE_PLAYER:
        return <CoursePlayer lang={lang} theme={theme} isMobile={isMobile} selectedCourse={selectedCourse} />;

      case ViewMode.EXAM_LIST:
        return <ExamsList lang={lang} theme={theme} onStartExam={startExam} />;

      case ViewMode.EXAM_RUNNER:
        return activeExam ? (
          <ExamRunner
            exam={activeExam}
            lang={lang}
            onExit={() => setView(ViewMode.EXAM_LIST)}
          />
        ) : null;

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

      case ViewMode.LANDING:
      default:
        return user.role === "instructor" ? (
          <InstructorDashboard lang={lang} theme={theme} />
        ) : (
          <StudentDashboard
            lang={lang}
            theme={theme}
            refreshTrigger={dashboardRefreshTrigger}
            isMobile={isMobile}
          />
        );
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0B0B0B] flex items-center justify-center">
        <div className="text-primary font-bold animate-pulse">
          Synchronizing Neural Link...
        </div>
      </div>
    );
  }

  return (
    <Layout
      view={view}
      setView={setView}
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
    >
      {renderView()}
    </Layout>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <WhiteLabApp />
    </AuthProvider>
  );
};

export default App;
