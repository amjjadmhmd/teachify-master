import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowRight,
  ArrowLeft,
  MapPin,
  Mail,
  Send,
  Sun,
  Moon,
  Youtube,
  Instagram,
  Facebook,
  Music2,
  Linkedin,
  Globe,
  ChevronDown,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { Reveal } from "../components/Reveal";
import { Button, Card } from "../components/UI";
import { Course, Lang, Theme } from "../types";
import { ASSETS } from "../constants/assets";
import { getStaticCourses } from "../utils/staticCourses";
import { api } from "../api/client";
import type {
  LandingCourse as ApiLandingCourse,
  LandingBlog as ApiLandingBlog,
  LandingProject as ApiLandingProject,
} from "../api/types";

interface LandingProps {
  onLoginClick: () => void;
  onJoinClick: () => void;
  onExploreClick: () => void;
  onCourseOpen?: (course: Course) => void;
  onMentorsClick?: () => void;
  onLogoClick?: () => void;
  onOpenContactPage?: () => void;
  onOpenLandingSection?: (sectionId: Exclude<LandingSectionId, "contact">) => void;
  onOpenContentPage?: (pageId: LandingContentPageId) => void;
  onOpenBlogPost?: (slug: string) => void;
  onOpenProject?: (slug: string) => void;
  onBackToContentPage?: (pageId: LandingContentPageId) => void;
  lang: Lang;
  toggleLang: () => void;
  theme: Theme;
  toggleTheme: () => void;
  mode?: LandingPageMode;
  selectedBlogSlug?: string | null;
  selectedProjectSlug?: string | null;
  initialSectionId?: LandingSectionId | null;
  onInitialSectionHandled?: () => void;
}

type LandingSectionId =
  | "home"
  | "courses"
  | "services"
  | "projects"
  | "blog"
  | "about"
  | "contact";

type LandingContentPageId = "services" | "courses" | "projects" | "blog";
type LandingPageMode =
  | "landing"
  | "contact"
  | LandingContentPageId
  | "blog-detail"
  | "project-detail";

type CourseCategory =
  | "all"
  | "company"
  | "gis"
  | "geoai"
  | "software"
  | "utilities"
  | "surveying"
  | "remote";

type FooterModalType = "privacy" | "terms" | "learn" | "feedback" | null;

const WhatsAppIcon: React.FC<{ size?: number; className?: string }> = ({
  size = 14,
  className,
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 16 16"
    fill="currentColor"
    aria-hidden="true"
    className={className}
  >
    <path d="M13.601 2.326A7.854 7.854 0 0 0 8.009 0C3.662 0 .125 3.539.125 7.885c0 1.386.362 2.739 1.05 3.932L0 16l4.286-1.125a7.874 7.874 0 0 0 3.723.95h.003c4.346 0 7.884-3.539 7.884-7.885a7.84 7.84 0 0 0-2.295-5.614zM8.012 14.5a6.5 6.5 0 0 1-3.316-.908l-.238-.141-2.544.667.679-2.479-.155-.254a6.47 6.47 0 0 1-.992-3.461c0-3.578 2.91-6.488 6.49-6.488a6.45 6.45 0 0 1 4.607 1.911 6.46 6.46 0 0 1 1.902 4.6c-.002 3.58-2.913 6.49-6.494 6.49zm3.56-4.873c-.195-.098-1.158-.572-1.337-.637-.179-.066-.309-.098-.44.098-.13.195-.505.637-.619.767-.114.131-.228.147-.423.05-.195-.098-.824-.304-1.57-.969-.58-.517-.972-1.156-1.086-1.351-.114-.195-.012-.3.086-.397.087-.086.195-.228.293-.342.098-.114.13-.195.195-.326.065-.13.033-.244-.016-.342-.049-.098-.44-1.06-.603-1.451-.159-.383-.32-.331-.44-.337l-.374-.007c-.13 0-.342.049-.521.244-.179.195-.684.669-.684 1.63 0 .961.7 1.89.798 2.021.098.13 1.38 2.107 3.345 2.955.468.202.833.323 1.118.413.469.149.896.128 1.234.078.376-.056 1.158-.473 1.321-.93.163-.456.163-.848.114-.93-.049-.081-.179-.13-.374-.228z" />
  </svg>
);

const XBrandIcon: React.FC<{ size?: number; className?: string }> = ({
  size = 14,
  className,
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="currentColor"
    aria-hidden="true"
    className={className}
  >
    <path d="M18.244 2H21.5l-7.11 8.13L22.75 22h-6.54l-5.12-6.69L5.16 22H1.9l7.61-8.7L1.5 2h6.71l4.63 6.11L18.24 2Zm-1.15 18h1.8L7.23 3.89H5.31L17.09 20Z" />
  </svg>
);

const SnapchatIcon: React.FC<{ size?: number; className?: string }> = ({
  size = 14,
  className,
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="currentColor"
    aria-hidden="true"
    className={className}
  >
    <path d="M18.6 15.3c-.4-.2-1.3-.6-1.7-1.3-.2-.3-.3-.8-.2-1.4.1-.6.1-1.2.1-1.7 0-2.8-2.1-4.9-4.8-4.9s-4.8 2.1-4.8 4.9c0 .5 0 1.1.1 1.7.1.6 0 1.1-.2 1.4-.4.7-1.3 1.1-1.7 1.3-.3.1-.4.4-.3.7.1.3.4.4.7.3.4-.1.9-.1 1.4 0 .8.2 1.4.8 1.6 1.6.1.4.4.7.8.8.8.2 1.6.3 2.4.3.8 0 1.6-.1 2.4-.3.4-.1.7-.4.8-.8.2-.8.8-1.4 1.6-1.6.5-.1 1-.1 1.4 0 .3.1.6 0 .7-.3.1-.3 0-.6-.3-.7zM12 4.6c3.5 0 6 2.6 6 6.1 0 .6 0 1.2-.1 1.9-.1.3 0 .5.1.7.2.4.8.7 1.2.9-.4.1-.8.3-1.2.6-.4.2-.9.4-1.3.5-1.2.3-2 .9-2.4 1.9-.7.1-1.4.2-2.3.2-.8 0-1.6-.1-2.3-.2-.4-1-1.2-1.6-2.4-1.9-.4-.1-.9-.3-1.3-.5-.4-.3-.8-.5-1.2-.6.4-.2 1-.5 1.2-.9.1-.2.2-.4.1-.7-.1-.7-.1-1.3-.1-1.9 0-3.5 2.6-6.1 6-6.1z" />
  </svg>
);

const Landing: React.FC<LandingProps> = ({
  onLoginClick,
  onJoinClick,
  onExploreClick,
  onCourseOpen,
  onLogoClick,
  onOpenContactPage,
  onOpenLandingSection,
  onOpenContentPage,
  onOpenBlogPost,
  onOpenProject,
  onBackToContentPage,
  lang,
  toggleLang,
  theme,
  toggleTheme,
  mode = "landing",
  selectedBlogSlug = null,
  selectedProjectSlug = null,
  initialSectionId = null,
  onInitialSectionHandled,
}) => {
  const isEn = lang === "en";
  const isContactPage = mode === "contact";
  const isLandingPage = mode === "landing";
  const isBlogDetailPage = mode === "blog-detail";
  const isProjectDetailPage = mode === "project-detail";
  const standaloneContentPage =
    isLandingPage ||
    isContactPage ||
    isBlogDetailPage ||
    isProjectDetailPage
      ? null
      : mode;
  const isStandaloneContentPage = standaloneContentPage !== null;
  const isServicesPage = mode === "services";
  const isCoursesPage = mode === "courses";
  const isProjectsPage = mode === "projects";
  const isBlogPage = mode === "blog";
  const HERO_VIDEO_MOBILE =
    "https://res.cloudinary.com/dezzwsvjv/video/upload/f_auto,vc_auto,q_auto:good,w_960/v1771698805/3125448-uhd_3840_2160_25fps_kpo5ms.mp4";
  const HERO_VIDEO_DESKTOP =
    "https://res.cloudinary.com/dezzwsvjv/video/upload/f_auto,vc_auto,q_auto:good,w_1920/v1771698805/3125448-uhd_3840_2160_25fps_kpo5ms.mp4";
  const neonSectionDividerClass =
    "border-b border-cyan-300/80 shadow-[inset_0_-1px_0_rgba(103,232,249,0.95),0_10px_20px_-16px_rgba(34,211,238,0.9)]";

  const content = isEn
    ? {
        navItems: [
          { id: "home", label: "Home" },
          { id: "services", label: "Services" },
          { id: "courses", label: "Courses" },
          { id: "projects", label: "Projects" },
          { id: "blog", label: "Blog" },
          { id: "about", label: "About Us" },
          { id: "contact", label: "Contact Us" },
        ],
        login: "Login",
        joinNow: "Join Now",
        heroTitle: "Welcome to Geo Top",
        heroSubtitle: "Where the Future is Happening Now",
        heroDesc:
          "Geo Top is an information technology company and systems integrator, providing renowned clients in Egypt, Africa and The Middle East with top-notch solutions and services that help them achieve their business transformation and digitalization goals.",
        viewCourses: "View Courses",
        joinPrograms: "Join Programs",
        coursesTitle: "Geo Top Courses",
        coursesDesc: "Specialized tracks in GIS, surveying, remote sensing, and geospatial AI.",
        courseTitles: [
          "Geo Top Company Programs",
          "GIS Program (6 Levels)",
          "GeoAI Program",
          "Python-GIS Program",
          "Utilities Program (Electricity & Water Networks)",
          "ArcGIS Enterprise Program",
          "Web GIS Program",
          "Drone Surveying Program",
          "Survey Technical Office Program",
          "Laser Scanner Program",
          "Remote Sensing Program",
          "Multispectral Program",
        ],
        servicesTitle: "Services",
        serviceCards: ["Advanced Surveying", "GIS Analysis", "Corporate Training"],
        servicesDesc: "Professional execution, operation, and training services.",
        aboutTitle: "About Us",
        aboutDesc:
          "Geo Top is specialized in advanced surveying and GIS, delivering technical solutions and training programs aligned with market needs.",
        contactTitle: "Contact Us",
        contactDesc: "For inquiries, partnerships, and training programs.",
      }
    : {
        navItems: [
          { id: "home", label: "Ø§Ù„Ø±Ø¦ÙŠØ³ÙŠØ©" },
          { id: "services", label: "Ø§Ù„Ø®Ø¯Ù…Ø§Øª" },
          { id: "courses", label: "Ø§Ù„ÙƒÙˆØ±Ø³Ø§Øª" },
          { id: "projects", label: "\u0627\u0644\u0645\u0634\u0627\u0631\u064a\u0639" },
          { id: "blog", label: "\u0627\u0644\u0628\u0644\u0648\u062c" },
          { id: "about", label: "Ù…Ù† Ù†Ø­Ù†" },
          { id: "contact", label: "ØªÙˆØ§ØµÙ„ Ù…Ø¹Ù†Ø§" },
        ],
        login: "Ø¯Ø®ÙˆÙ„",
        joinNow: "Ø§Ù†Ø¶Ù… Ø§Ù„Ø¢Ù†",
        heroTitle: "Welcome to Geo Top",
        heroSubtitle: "Where the Future is Happening Now",
        heroDesc:
          "Geo Top is an information technology company and systems integrator, providing renowned clients in Egypt, Africa and The Middle East with top-notch solutions and services that help them achieve their business transformation and digitalization goals.",
        viewCourses: "Ø¹Ø±Ø¶ Ø§Ù„ÙƒÙˆØ±Ø³Ø§Øª",
        joinPrograms: "Ø§Ù†Ø¶Ù… Ù„Ù„Ø¨Ø±Ø§Ù…Ø¬",
        coursesTitle: "ÙƒÙˆØ±Ø³Ø§Øª Geo Top",
        coursesDesc: "Ù…Ø³Ø§Ø±Ø§Øª Ù…ØªØ®ØµØµØ© ÙÙŠ GIS ÙˆØ§Ù„Ù…Ø³Ø§Ø­Ø© ÙˆØ§Ù„Ø§Ø³ØªØ´Ø¹Ø§Ø± Ø¹Ù† Ø¨Ø¹Ø¯ ÙˆØ§Ù„Ø°ÙƒØ§Ø¡ Ø§Ù„Ø¬ÙŠÙˆÙ…ÙƒØ§Ù†ÙŠ.",
        courseTitles: [
          "Ø¯ÙˆØ±Ø§Øª Ø´Ø±ÙƒØ© Geo Top",
          "Ø¯ÙˆØ±Ø© GIS Ù…ÙƒÙˆÙ†Ø© Ù…Ù† 6 Ù…Ø³ØªÙˆÙŠØ§Øª",
          "Ø¯ÙˆØ±Ø© GeoAI",
          "Ø¯ÙˆØ±Ø© Python-GIS",
          "Ø¯ÙˆØ±Ø© Ø´Ø¨ÙƒØ§Øª Ø§Ù„Ø¨Ù†ÙŠØ© Ø§Ù„ØªØ­ØªÙŠØ© (ÙƒÙ‡Ø±Ø¨Ø§Ø¡ ÙˆÙ…ÙŠØ§Ù‡)",
          "Ø¯ÙˆØ±Ø© ArcGIS Enterprise",
          "Ø¯ÙˆØ±Ø© Web GIS",
          "Ø¯ÙˆØ±Ø© Drone Surveying",
          "Ø¯ÙˆØ±Ø© Ù…ÙƒØªØ¨ ÙÙ†ÙŠ Ù…Ø³Ø§Ø­ÙŠ",
          "Ø¯ÙˆØ±Ø© Laser Scanner",
          "Ø¯ÙˆØ±Ø© Remote Sensing",
          "Ø¯ÙˆØ±Ø© Multispectral",
        ],
        servicesTitle: "Ø§Ù„Ø®Ø¯Ù…Ø§Øª",
        serviceCards: ["Ø§Ù„Ø®Ø¯Ù…Ø§Øª Ø§Ù„Ù…Ø³Ø§Ø­ÙŠØ© Ø§Ù„Ù…ØªÙ‚Ø¯Ù…Ø©", "ØªØ­Ù„ÙŠÙ„ Ø¨ÙŠØ§Ù†Ø§Øª GIS", "ØªØ¯Ø±ÙŠØ¨ Ø§Ù„Ø´Ø±ÙƒØ§Øª"],
        servicesDesc: "Ø®Ø¯Ù…Ø§Øª ØªØ´ØºÙŠÙ„ ÙˆØªÙ†ÙÙŠØ° ÙˆØªØ¯Ø±ÙŠØ¨ Ø¨Ù…Ø¹Ø§ÙŠÙŠØ± Ø§Ø­ØªØ±Ø§ÙÙŠØ©.",
        aboutTitle: "Ù…Ù† Ù†Ø­Ù†",
        aboutDesc:
          "Geo Top Ø´Ø±ÙƒØ© Ù…ØªØ®ØµØµØ© ÙÙŠ Ø§Ù„Ù…Ø³Ø§Ø­Ø© Ø§Ù„Ù…ØªÙ‚Ø¯Ù…Ø© ÙˆÙ†Ø¸Ù… Ø§Ù„Ù…Ø¹Ù„ÙˆÙ…Ø§Øª Ø§Ù„Ø¬ØºØ±Ø§ÙÙŠØ©ØŒ ÙˆØªÙ‚Ø¯Ù… Ø­Ù„ÙˆÙ„Ù‹Ø§ ØªÙ‚Ù†ÙŠØ© ÙˆØ¨Ø±Ø§Ù…Ø¬ ØªØ¯Ø±ÙŠØ¨ÙŠØ© ØªÙˆØ§ÙƒØ¨ Ø§Ø­ØªÙŠØ§Ø¬Ø§Øª Ø³ÙˆÙ‚ Ø§Ù„Ø¹Ù…Ù„.",
        contactTitle: "ØªÙˆØ§ØµÙ„ Ù…Ø¹Ù†Ø§",
        contactDesc: "Ù„Ù„Ø§Ø³ØªÙØ³Ø§Ø±Ø§Øª ÙˆØ§Ù„Ø´Ø±Ø§ÙƒØ§Øª ÙˆØ¨Ø±Ø§Ù…Ø¬ Ø§Ù„ØªØ¯Ø±ÙŠØ¨.",
      };

  const aboutSection = isEn
    ? {
        sectionTitle: "About The Platform",
        visionTitle: "Our Vision",
        visionText:
          "We aspire to build the leading platform in the Arab world for empowering specialists and researchers in geography and GIS. We aim to deliver premium educational content that combines academic depth and practical application to highlight Arab talent in the global job market.",
        missionTitle: "Our Mission",
        missionText:
          "Our mission is to provide a professional learning environment with advanced training courses and integrated learning paths. We believe specialized knowledge is an investment in the future, so we deliver world-class paid courses that equip learners with real market-ready skills and stronger career outcomes.",
        goalsTitle: "Platform Goals",
        goals: [
          {
            title: "Professional Excellence",
            desc: "Deliver specialized programs to prepare technically strong geographers and analysts.",
          },
          {
            title: "Knowledge Investment",
            desc: "Provide premium paid content with high-quality instruction and continuous expert guidance.",
          },
          {
            title: "Closing Market Gaps",
            desc: "Focus on modern tools and software required by major institutions in GIS and remote sensing.",
          },
          {
            title: "Career Advancement",
            desc: "Support learners with practical expertise that helps unlock better job opportunities.",
          },
          {
            title: "Sustainable Development",
            desc: "Continuously evolve the platform with up-to-date educational technologies.",
          },
        ],
        hexVision: "Vision",
        hexMission: "Mission",
        hexGoals: "Goals",
        hexVisionShort: "Leadership in geospatial professional qualification.",
        hexMissionShort: "Professional education worth investing in.",
        hexGoalsShort: "Empowerment, professionalism, and career growth.",
      }
    : {
        sectionTitle: "Ø¹Ù† Ø§Ù„Ù…Ù†ØµØ©",
        visionTitle: "Ø±Ø¤ÙŠØªÙ†Ø§",
        visionText:
          "Ù†Ø·Ù…Ø­ Ø¥Ù„Ù‰ Ø¨Ù†Ø§Ø¡ Ø§Ù„Ù…Ù†ØµØ© Ø§Ù„Ø±Ø§Ø¦Ø¯Ø© ÙˆØ§Ù„Ø£ÙˆÙ„Ù‰ ÙÙŠ Ø§Ù„ÙˆØ·Ù† Ø§Ù„Ø¹Ø±Ø¨ÙŠ Ù„ØªÙ…ÙƒÙŠÙ† Ø§Ù„Ù…ØªØ®ØµØµÙŠÙ† ÙˆØ§Ù„Ø¨Ø§Ø­Ø«ÙŠÙ† ÙÙŠ Ø¹Ù„ÙˆÙ… Ø§Ù„Ø¬ØºØ±Ø§ÙÙŠØ§ ÙˆÙ†Ø¸Ù… Ø§Ù„Ù…Ø¹Ù„ÙˆÙ…Ø§Øª Ø§Ù„Ø¬ØºØ±Ø§ÙÙŠØ© (GIS). Ù†Ø­Ù† Ù†Ø³Ø¹Ù‰ Ù„ØªÙ‚Ø¯ÙŠÙ… Ù…Ø­ØªÙˆÙ‰ ØªØ¹Ù„ÙŠÙ…ÙŠ ÙØ§Ø¦Ù‚ Ø§Ù„Ø¬ÙˆØ¯Ø© ÙŠØ¬Ù…Ø¹ Ø¨ÙŠÙ† Ø§Ù„Ø®Ø¨Ø±Ø© Ø§Ù„Ø£ÙƒØ§Ø¯ÙŠÙ…ÙŠØ© ÙˆØ§Ù„ØªØ·Ø¨ÙŠÙ‚ Ø§Ù„Ø¹Ù…Ù„ÙŠØŒ Ù„Ù†ÙƒÙˆÙ† Ø¬Ø³Ø±Ø§Ù‹ ÙŠØ¨Ø±Ø² ÙƒÙØ§Ø¡Ø§Øª Ø§Ù„ÙƒÙˆØ§Ø¯Ø± Ø§Ù„Ø¹Ø±Ø¨ÙŠØ© ÙÙŠ Ø³ÙˆÙ‚ Ø§Ù„Ø¹Ù…Ù„ Ø§Ù„Ø¹Ø§Ù„Ù…ÙŠ.",
        missionTitle: "Ø±Ø³Ø§Ù„ØªÙ†Ø§",
        missionText:
          "ØªØªÙ…Ø«Ù„ Ø±Ø³Ø§Ù„ØªÙ†Ø§ ÙÙŠ ØªÙˆÙÙŠØ± Ø¨ÙŠØ¦Ø© ØªØ¹Ù„ÙŠÙ…ÙŠØ© Ø§Ø­ØªØ±Ø§ÙÙŠØ© ØªÙ‚Ø¯Ù… Ø¯ÙˆØ±Ø§Øª ØªØ¯Ø±ÙŠØ¨ÙŠØ© Ù…ØªÙ‚Ø¯Ù…Ø© ÙˆÙ…Ø³Ø§Ø±Ø§Øª ØªØ¹Ù„ÙŠÙ…ÙŠØ© Ù…ØªÙƒØ§Ù…Ù„Ø©. Ù†Ø­Ù† Ù†Ø¤Ù…Ù† Ø¨Ø£Ù† Ø§Ù„Ø¹Ù„Ù… Ø§Ù„Ù…ØªØ®ØµØµ Ù‡Ùˆ Ø§Ø³ØªØ«Ù…Ø§Ø± Ù„Ù„Ù…Ø³ØªÙ‚Ø¨Ù„ØŒ Ù„Ø°Ø§ Ù†Ø­Ø±Øµ Ø¹Ù„Ù‰ ØªÙ‚Ø¯ÙŠÙ… ÙƒÙˆØ±Ø³Ø§Øª Ù…Ø¯ÙÙˆØ¹Ø© Ø¨Ù…Ø³ØªÙˆÙ‰ Ø¹Ø§Ù„Ù…ÙŠØŒ ØªØ¶Ù…Ù† Ù„Ù„Ù…Ø´ØªØ±ÙƒÙŠÙ† Ø§Ù„Ø­ØµÙˆÙ„ Ø¹Ù„Ù‰ Ø§Ù„Ù…Ù‡Ø§Ø±Ø§Øª Ø§Ù„ØªÙŠ ÙŠØªØ·Ù„Ø¨Ù‡Ø§ Ø³ÙˆÙ‚ Ø§Ù„Ø¹Ù…Ù„ Ø§Ù„ÙØ¹Ù„ÙŠ ÙˆØ§Ù„Ø§Ø±ØªÙ‚Ø§Ø¡ Ø¨Ù…Ø³ØªÙˆØ§Ù‡Ù… Ø§Ù„Ù…Ù‡Ù†ÙŠ ÙˆØ§Ù„Ù…Ø§Ø¯ÙŠ.",
        goalsTitle: "Ø£Ù‡Ø¯Ø§Ù Ø§Ù„Ù…Ù†ØµØ©",
        goals: [
          {
            title: "Ø§Ù„Ø§Ø­ØªØ±Ø§ÙÙŠØ© Ø§Ù„Ù…Ù‡Ù†ÙŠØ©",
            desc: "ØªÙ‚Ø¯ÙŠÙ… Ø¨Ø±Ø§Ù…Ø¬ ØªØ¯Ø±ÙŠØ¨ÙŠØ© Ù…ØªØ®ØµØµØ© ØªÙ‡Ø¯Ù Ø¥Ù„Ù‰ Ø¥Ø¹Ø¯Ø§Ø¯ Ø¬ØºØ±Ø§ÙÙŠÙŠÙ† ÙˆÙ…Ø­Ù„Ù„ÙŠÙ† Ù…ØªÙ…ÙƒÙ†ÙŠÙ† ØªÙ‚Ù†ÙŠØ§Ù‹ ÙˆÙÙ†ÙŠØ§Ù‹.",
          },
          {
            title: "Ø§Ù„Ø§Ø³ØªØ«Ù…Ø§Ø± ÙÙŠ Ø§Ù„Ù…Ø¹Ø±ÙØ©",
            desc: "ØªÙˆÙÙŠØ± Ù…Ø­ØªÙˆÙ‰ Ø­ØµØ±ÙŠ ÙˆÙ…Ø¯ÙÙˆØ¹ ÙŠØ¶Ù…Ù† Ù„Ù„Ù…ØªØ¯Ø±Ø¨ Ø¬ÙˆØ¯Ø© Ø§Ù„ØªØ¹Ù„ÙŠÙ… ÙˆØ§Ù„Ù…ØªØ§Ø¨Ø¹Ø© Ø§Ù„Ù…Ø³ØªÙ…Ø±Ø© Ù…Ø¹ Ù†Ø®Ø¨Ø© Ù…Ù† Ø§Ù„Ø®Ø¨Ø±Ø§Ø¡.",
          },
          {
            title: "Ø³Ø¯ ÙØ¬ÙˆØ© Ø³ÙˆÙ‚ Ø§Ù„Ø¹Ù…Ù„",
            desc: "Ø§Ù„ØªØ±ÙƒÙŠØ² Ø¹Ù„Ù‰ Ø§Ù„Ø£Ø¯ÙˆØ§Øª ÙˆØ§Ù„Ø¨Ø±Ù…Ø¬ÙŠØ§Øª Ø§Ù„Ø­Ø¯ÙŠØ«Ø© Ø§Ù„ØªÙŠ ØªØ·Ù„Ø¨Ù‡Ø§ Ø§Ù„Ø´Ø±ÙƒØ§Øª ÙˆØ§Ù„Ù…Ø¤Ø³Ø³Ø§Øª Ø§Ù„ÙƒØ¨Ø±Ù‰ ÙÙŠ Ù…Ø¬Ø§Ù„Ø§Øª Ø§Ù„Ø§Ø³ØªØ´Ø¹Ø§Ø± Ø¹Ù† Ø¨ÙØ¹Ø¯ ÙˆÙ†Ø¸Ù… Ø§Ù„Ù…Ø¹Ù„ÙˆÙ…Ø§Øª.",
          },
          {
            title: "ØªØ·ÙˆÙŠØ± Ø§Ù„Ù…Ø³Ø§Ø± Ø§Ù„ÙˆØ¸ÙŠÙÙŠ",
            desc: "Ø¯Ø¹Ù… Ø§Ù„Ù…Ø´ØªØ±ÙƒÙŠÙ† Ø¨Ø®Ø¨Ø±Ø§Øª Ø¹Ù…Ù„ÙŠØ© ØªØ³Ø§Ø¹Ø¯Ù‡Ù… ÙÙŠ Ø§Ù„Ø­ØµÙˆÙ„ Ø¹Ù„Ù‰ ÙØ±Øµ ÙˆØ¸ÙŠÙÙŠØ© Ø£ÙØ¶Ù„ Ø¨Ù…Ø±ØªØ¨Ø§Øª ØªÙ†Ø§ÙØ³ÙŠØ©.",
          },
          {
            title: "Ø§Ù„Ø§Ø³ØªØ¯Ø§Ù…Ø© ÙˆØ§Ù„ØªØ·ÙˆÙŠØ±",
            desc: "Ù†Ù„ØªØ²Ù… Ø¨ØªØ·ÙˆÙŠØ± Ù…Ù†ØµØªÙ†Ø§ Ø¨Ø§Ø³ØªÙ…Ø±Ø§Ø± Ù„ØªÙ‚Ø¯ÙŠÙ… Ø£Ø­Ø¯Ø« Ø§Ù„ØªÙ‚Ù†ÙŠØ§Øª Ø§Ù„ØªØ¹Ù„ÙŠÙ…ÙŠØ© Ù„Ø¶Ù…Ø§Ù† Ø£ÙØ¶Ù„ ØªØ¬Ø±Ø¨Ø© Ù…Ø³ØªØ®Ø¯Ù… Ù„Ø·Ù„Ø§Ø¨Ù†Ø§.",
          },
        ],
        hexVision: "Ø§Ù„Ø±Ø¤ÙŠØ©",
        hexMission: "Ø§Ù„Ø±Ø³Ø§Ù„Ø©",
        hexGoals: "Ø§Ù„Ø£Ù‡Ø¯Ø§Ù",
        hexVisionShort: "Ø§Ù„Ø±ÙŠØ§Ø¯Ø© ÙÙŠ Ø§Ù„ØªØ£Ù‡ÙŠÙ„ Ø§Ù„Ù…Ù‡Ù†ÙŠ Ø§Ù„Ø¬ØºØ±Ø§ÙÙŠ.",
        hexMissionShort: "ØªØ¹Ù„ÙŠÙ… Ø§Ø­ØªØ±Ø§ÙÙŠ ÙŠØ³ØªØ­Ù‚ Ø§Ù„Ø§Ø³ØªØ«Ù…Ø§Ø±.",
        hexGoalsShort: "ØªÙ…ÙƒÙŠÙ†ØŒ Ø§Ø­ØªØ±Ø§ÙØŒ Ø§Ø±ØªÙ‚Ø§Ø¡ ÙˆØ¸ÙŠÙÙŠ.",
      };

  const aboutImpactStats = isEn
    ? [
        { value: "75+", label: "Works Done" },
        { value: "25+", label: "Employees" },
        { value: "5+", label: "Years Experience" },
        { value: "20+", label: "Happy Clients" },
        { value: "5000", label: "Trainees" },
      ]
    : [
        { value: "75+", label: "أعمال منجزة" },
        { value: "25+", label: "موظفين" },
        { value: "5+", label: "سنوات خبرة" },
        { value: "20+", label: "عملاء سعداء" },
        { value: "5000", label: "متدرب" },
      ];

  const founderMessage = isEn
    ? {
        heading: "Founder's Message",
        paragraphs: [
          "Since our inception, we have had one goal in mind: to create a global entity raising quality standards in the fields of geomatics and modern technologies.",
          "We believe that success is not given, but rather made with knowledge, mastery, and clear vision that builds solid confidence in everything we offer.",
          "At Geo Top, we believe that the real investment is in people, so we graduate engineers who are scientifically and practically qualified to lead change in the labor market.",
          "We pride ourselves on not only building projects, but also creating young leaders who embody the values of innovation, excellence, and responsibility towards a future worthy of a global Arab engineer.",
        ],
        founderName: "Moamen Almamly",
        founderTitle: "CEO & Founder",
        imageUrl:
          "https://res.cloudinary.com/dezzwsvjv/image/upload/v1772065654/WhatsApp_Image_2026-02-25_at_5.37.45_AM_qulhgn.jpg",
      }
    : {
        heading: "كلمة المؤسس",
        paragraphs: [
          "منذ انطلاقتنا الأولى، وضعنا نصب أعيننا هدفًا واحدًا: أن نصنع كيانًا عالميًا يرتقي بمعايير الجودة في مجالات الجيوماتكس والتقنيات الحديثة.",
          "آمنا أن النجاح لا يُمنح، بل يُصنع بالعلم والإتقان والرؤية الواضحة التي تبني ثقة راسخة في كل ما نقدمه.",
          "في Geo Top نؤمن بأن الاستثمار الحقيقي هو في الإنسان، لذلك نُخرج مهندسين مؤهلين علميًا وعمليًا ليقودوا التغيير في سوق العمل.",
          "نفخر بأننا لا نبني مشاريع فحسب، بل نصنع قيادات شابة تجسد قيم الابتكار والتميز والمسؤولية نحو مستقبل يليق بمهندس عربي عالمي.",
        ],
        founderName: "Moamen Almamly",
        founderTitle: "CEO & Founder",
        imageUrl:
          "https://res.cloudinary.com/dezzwsvjv/image/upload/v1772065654/WhatsApp_Image_2026-02-25_at_5.37.45_AM_qulhgn.jpg",
      };

  type LandingCourseCard = {
    id: number;
    title: string;
    image: string;
    category: CourseCategory;
    description: string;
    instructorName?: string;
    instructorImage?: string;
    durationLabel?: string;
    priceLive?: number;
    priceOffline?: number;
    priceRecorded?: number;
    ratingValue?: number;
    enrolledStudents?: number;
    sourceCourse?: Course;
  };

  type LandingProjectCard = {
    id: number;
    slug: string;
    title: string;
    category: string;
    summary: string;
    description: string;
    image: string;
    pdfUrl?: string;
    externalUrl?: string;
    clientName?: string;
  };

  type LandingBlogCard = {
    id: number;
    slug: string;
    title: string;
    summary: string;
    content: string;
    image: string;
    authorName?: string;
    readTimeMinutes?: number;
    resourceLinks: string[];
    resourceFileUrl?: string;
  };

  type ServiceCardData = {
    id: string;
    title: string;
    description: string;
    details: string;
    image: string;
  };

  const courseImages = [
    ASSETS.COURSES.CLOUD,
    "https://res.cloudinary.com/dezzwsvjv/image/upload/v1771859012/GIS.jpg_qzqux8.jpg",
    "https://res.cloudinary.com/dezzwsvjv/image/upload/v1771859004/geo-ai1.jpg_pfw4jv.jpg",
    ASSETS.COURSES.PYTHON,
    "https://res.cloudinary.com/dezzwsvjv/image/upload/v1771509841/utilities.jpg_ebo21y.jpg",
    "https://res.cloudinary.com/dezzwsvjv/image/upload/v1771859461/arcgis.jpg_jqw3mf.jpg",
    ASSETS.COURSES.UIUX,
    "https://res.cloudinary.com/dezzwsvjv/image/upload/v1771858995/drone.jpg_mj8vua.jpg",
    ASSETS.COURSES.CYBER,
    "https://res.cloudinary.com/dezzwsvjv/image/upload/v1771510140/lasserscanner.jpg_mm0eef.jpg",
    ASSETS.COURSES.AI,
    ASSETS.COURSES.PYTHON,
  ];

  const resolveLandingCourseImage = (title: string, fallback: string) => {
    const normalizedTitle = title.toLowerCase();

    if (normalizedTitle.includes("geoai") || normalizedTitle.includes("geo ai")) {
      return "https://res.cloudinary.com/dezzwsvjv/image/upload/v1771859004/geo-ai1.jpg_pfw4jv.jpg";
    }

    if (
      normalizedTitle.includes("gis") &&
      (normalizedTitle.includes("6") ||
        normalizedTitle.includes("six") ||
        normalizedTitle.includes("Ù…Ø³ØªÙˆÙŠØ§Øª"))
    ) {
      return "https://res.cloudinary.com/dezzwsvjv/image/upload/v1771859012/GIS.jpg_qzqux8.jpg";
    }

    if (normalizedTitle.includes("drone") || normalizedTitle.includes("Ø¯Ø±ÙˆÙ†")) {
      return "https://res.cloudinary.com/dezzwsvjv/image/upload/v1771858995/drone.jpg_mj8vua.jpg";
    }

    if (normalizedTitle.includes("arcgis") || normalizedTitle.includes("Ø§Ø±Ùƒ")) {
      return "https://res.cloudinary.com/dezzwsvjv/image/upload/v1771859461/arcgis.jpg_jqw3mf.jpg";
    }

    if (normalizedTitle.includes("web gis")) {
      return ASSETS.COURSES.UIUX;
    }

    if (
      normalizedTitle.includes("survey technical office") ||
      normalizedTitle.includes("technical office")
    ) {
      return ASSETS.COURSES.CYBER;
    }

    return fallback;
  };

  const courseCategories: CourseCategory[] = [
    "company",
    "gis",
    "geoai",
    "software",
    "utilities",
    "gis",
    "gis",
    "surveying",
    "surveying",
    "surveying",
    "remote",
    "remote",
  ];

  const courseDescriptions = isEn
    ? [
        "Corporate-focused tracks for teams and technical departments.",
        "A complete GIS path from basics to advanced workflows.",
        "Applied GeoAI use cases for geospatial analysis and automation.",
        "Python scripting for GIS data processing and map production.",
        "Infrastructure utilities workflows for electricity and water networks.",
        "ArcGIS Enterprise deployment and operations for organizations.",
        "Build web mapping applications and online GIS portals.",
        "Drone flight planning, data capture, and mapping outputs.",
        "Survey office operations, quantities, and technical reporting.",
        "Laser scanning workflows from capture to point-cloud deliverables.",
        "Remote sensing interpretation and satellite data workflows.",
        "Multispectral processing for precision analysis and monitoring.",
      ]
    : [
        "Ù…Ø³Ø§Ø±Ø§Øª Ù…Ù‡Ù†ÙŠØ© Ù…Ø®ØµØµØ© Ù„ÙØ±Ù‚ Ø§Ù„Ø´Ø±ÙƒØ§Øª ÙˆØ§Ù„Ø¥Ø¯Ø§Ø±Ø§Øª Ø§Ù„ÙÙ†ÙŠØ©.",
        "Ø¨Ø±Ù†Ø§Ù…Ø¬ GIS Ù…ØªÙƒØ§Ù…Ù„ Ù…Ù† Ø§Ù„Ø£Ø³Ø§Ø³ÙŠØ§Øª Ø­ØªÙ‰ Ø§Ù„Ù…Ø±Ø§Ø­Ù„ Ø§Ù„Ù…ØªÙ‚Ø¯Ù…Ø©.",
        "ØªØ·Ø¨ÙŠÙ‚Ø§Øª GeoAI Ø§Ù„Ø¹Ù…Ù„ÙŠØ© ÙÙŠ Ø§Ù„ØªØ­Ù„ÙŠÙ„ Ø§Ù„Ù…ÙƒØ§Ù†ÙŠ ÙˆØ§Ù„Ø£ØªÙ…ØªØ©.",
        "Ø¨Ø±Ù…Ø¬Ø© Python Ù„Ø®Ø¯Ù…Ø§Øª GIS ÙˆÙ…Ø¹Ø§Ù„Ø¬Ø© Ø§Ù„Ø¨ÙŠØ§Ù†Ø§Øª ÙˆØ¥Ù†ØªØ§Ø¬ Ø§Ù„Ø®Ø±Ø§Ø¦Ø·.",
        "ØªØ¯Ø±ÙŠØ¨ Ø¹Ù…Ù„ÙŠ Ù„Ø´Ø¨ÙƒØ§Øª Ø§Ù„Ù…Ø±Ø§ÙÙ‚ Ù„Ù„Ø¨Ù†ÙŠØ© Ø§Ù„ØªØ­ØªÙŠØ© ÙƒÙ‡Ø±Ø¨Ø§Ø¡ ÙˆÙ…ÙŠØ§Ù‡.",
        "Ø¥Ø¹Ø¯Ø§Ø¯ ÙˆØªØ´ØºÙŠÙ„ ArcGIS Enterprise Ø¯Ø§Ø®Ù„ Ø§Ù„Ù…Ø¤Ø³Ø³Ø§Øª.",
        "ØªØµÙ…ÙŠÙ… ØªØ·Ø¨ÙŠÙ‚Ø§Øª Web GIS ÙˆØ¨ÙˆØ§Ø¨Ø§Øª Ø®Ø±Ø§Ø¦Ø· ØªÙØ§Ø¹Ù„ÙŠØ©.",
        "ØªØ´ØºÙŠÙ„ Ø§Ù„Ù…Ø³Ø­ Ø¨Ø§Ù„Ø·Ø§Ø¦Ø±Ø§Øª Ø¨Ø¯ÙˆÙ† Ø·ÙŠØ§Ø± Ù…Ù† Ø§Ù„ØªØ®Ø·ÙŠØ· Ø­ØªÙ‰ Ø§Ù„Ù…Ø®Ø±Ø¬Ø§Øª.",
        "ØªØ£Ø³ÙŠØ³ Ø£Ø¹Ù…Ø§Ù„ Ø§Ù„Ù…ÙƒØªØ¨ Ø§Ù„ÙÙ†ÙŠ Ø§Ù„Ù…Ø³Ø§Ø­ÙŠ ÙˆØ¥Ø¯Ø§Ø±Ø© Ø§Ù„ØªÙ‚Ø§Ø±ÙŠØ±.",
        "Ø®Ø·ÙˆØ§Øª Ø§Ù„Ø¹Ù…Ù„ Ø¹Ù„Ù‰ Laser Scanner ÙˆÙ…Ø¹Ø§Ù„Ø¬Ø© Ø§Ù„Ø³Ø­Ø§Ø¨Ø© Ø§Ù„Ù†Ù‚Ø·ÙŠØ©.",
        "ØªØ­Ù„ÙŠÙ„ Ø¨ÙŠØ§Ù†Ø§Øª Ø§Ù„Ø§Ø³ØªØ´Ø¹Ø§Ø± Ø¹Ù† Ø¨Ø¹Ø¯ ÙˆØªØ·Ø¨ÙŠÙ‚Ø§ØªÙ‡Ø§ Ø§Ù„Ø¹Ù…Ù„ÙŠØ©.",
        "ØªØ­Ù„ÙŠÙ„ ØµÙˆØ± Multispectral Ù„Ù„Ù…Ø´Ø±ÙˆØ¹Ø§Øª Ø§Ù„Ù‡Ù†Ø¯Ø³ÙŠØ© ÙˆØ§Ù„Ø²Ø±Ø§Ø¹ÙŠØ©.",
      ];

  const servicesContent = isEn
    ? {
        title: "Services We Offer",
        subtitle: "What We Provide",
        quote:
          "We provide custom software services, GIS solutions, and 3D modeling and visualization for a variety of industries.",
        openLabel: "View Service",
        requestLabel: "Request Service",
        exploreLabel: "Explore Courses",
        showMoreLabel: "Show More",
        showLessLabel: "Show Less",
      }
    : {
        title: "Ø§Ù„Ø®Ø¯Ù…Ø§Øª Ø§Ù„ØªÙŠ Ù†Ù‚Ø¯Ù…Ù‡Ø§",
        subtitle: "Ù…Ø§Ø°Ø§ Ù†Ù‚Ø¯Ù…",
        quote:
          "Ù†Ù‚Ø¯Ù… Ø®Ø¯Ù…Ø§Øª Ø¨Ø±Ù…Ø¬ÙŠØ© Ù…Ø®ØµØµØ©ØŒ ÙˆØ­Ù„ÙˆÙ„ GISØŒ ÙˆØ®Ø¯Ù…Ø§Øª Ø§Ù„Ù†Ù…Ø°Ø¬Ø© ÙˆØ§Ù„ØªØµÙˆØ± Ø«Ù„Ø§Ø«ÙŠ Ø§Ù„Ø£Ø¨Ø¹Ø§Ø¯ Ù„Ù‚Ø·Ø§Ø¹Ø§Øª Ù…ØªÙ†ÙˆØ¹Ø©.",
        openLabel: "Ø¹Ø±Ø¶ Ø§Ù„Ø®Ø¯Ù…Ø©",
        requestLabel: "Ø§Ø·Ù„Ø¨ Ø§Ù„Ø®Ø¯Ù…Ø©",
        exploreLabel: "Ø§Ø³ØªØ¹Ø±Ø¶ Ø§Ù„ÙƒÙˆØ±Ø³Ø§Øª",
        showMoreLabel: "Ø¹Ø±Ø¶ Ø§Ù„Ù…Ø²ÙŠØ¯",
        showLessLabel: "Ø¹Ø±Ø¶ Ø£Ù‚Ù„",
      };

  const projectsContent = isEn
    ? {
        title: "Our Projects",
        subtitle:
          "Selected delivery highlights in GIS, surveying, and applied geospatial solutions.",
        items: [
          {
            title: "Municipal Utility Network Mapping",
            category: "GIS Implementation",
            summary:
              "Designed and digitized integrated utility maps for planning and maintenance operations.",
          },
          {
            title: "Infrastructure Corridor Survey",
            category: "Surveying",
            summary:
              "Executed high-precision topographic surveys for transport and infrastructure expansion routes.",
          },
          {
            title: "Satellite Monitoring Dashboard",
            category: "Remote Sensing",
            summary:
              "Built a web dashboard to track land-change indicators using periodic satellite imagery.",
          },
        ],
      }
    : {
        title: "Projects",
        subtitle: "Selected field projects and geospatial implementations.",
        items: [
          {
            title: "Municipal Utility Network Mapping",
            category: "GIS",
            summary:
              "Integrated utility mapping workflows for planning and operational support.",
          },
          {
            title: "Infrastructure Corridor Survey",
            category: "Surveying",
            summary:
              "High-precision field surveying package for expansion and engineering alignment.",
          },
          {
            title: "Satellite Monitoring Dashboard",
            category: "Remote Sensing",
            summary:
              "Operational dashboard for monitoring spatial change using satellite data.",
          },
        ],
      };

  const blogContent = isEn
    ? {
        title: "Blog",
        subtitle: "Insights, updates, and practical notes from our technical team.",
        posts: [
          {
            title: "How To Build A GIS Career Path In 2026",
            date: "Career Growth",
            summary:
              "A practical roadmap for students and junior professionals entering geospatial roles.",
          },
          {
            title: "Drone Surveying: Field Checklist Before Every Mission",
            date: "Field Tips",
            summary:
              "A compact pre-flight and quality checklist to improve mission reliability and outputs.",
          },
          {
            title: "When To Use Remote Sensing Instead Of Traditional Survey",
            date: "Technical Guide",
            summary:
              "Decision criteria to pick the right method based on accuracy, area size, and delivery time.",
          },
        ],
      }
    : {
        title: "Blog",
        subtitle: "Practical notes and updates from our training and project workflows.",
        posts: [
          {
            title: "How To Build A GIS Career Path In 2026",
            date: "Career Growth",
            summary:
              "A practical roadmap for students and junior professionals entering geospatial roles.",
          },
          {
            title: "Drone Surveying: Field Checklist Before Every Mission",
            date: "Field Tips",
            summary:
              "A compact pre-flight and quality checklist to improve mission reliability and outputs.",
          },
          {
            title: "When To Use Remote Sensing Instead Of Traditional Survey",
            date: "Technical Guide",
            summary:
              "Decision criteria to pick the right method based on accuracy, area size, and delivery time.",
          },
        ],
      };

  const serviceCards: ServiceCardData[] = isEn
    ? [
        {
          id: "gis",
          title: "GIS",
          description:
            "Comprehensive GIS services for spatial analysis, mapping, and data visualization.",
          details:
            "Professional GIS workflows for data management, analysis, and map production for real projects.",
          image: ASSETS.COURSES.CLOUD,
        },
        {
          id: "website-design",
          title: "Website design",
          description:
            "Crafting responsive and visually appealing websites tailored to your business needs.",
          details:
            "From UX structure to final UI delivery, we design websites that support your brand and conversion goals.",
          image: "https://res.cloudinary.com/dezzwsvjv/image/upload/v1771859012/WEB_DESIGN_h2iiim.jpg",
        },
        {
          id: "web-development",
          title: "Web Development",
          description:
            "Building robust and scalable web applications with the latest technologies.",
          details:
            "End-to-end web development with clean architecture, API integration, and deployment-ready code.",
          image: ASSETS.COURSES.REACT,
        },
        {
          id: "mobile-apps",
          title: "Mobile Applications",
          description:
            "Building intuitive and high-performance mobile apps for both iOS and Android platforms.",
          details:
            "Cross-platform and native-ready mobile experiences with production-grade performance.",
          image: ASSETS.COURSES.MOBILE,
        },
        {
          id: "remote-sensing",
          title: "RS",
          description:
            "Remote Sensing services for accurate and detailed earth observation and analysis.",
          details:
            "Satellite and aerial data interpretation for monitoring, planning, and decision support.",
          image: "https://images.unsplash.com/photo-1521295121783-8a321d551ad2?w=1200&q=80",
        },
        {
          id: "drone-processing",
          title: "Drone image processing",
          description:
            "Delivering detailed analysis and processing of drone imagery for various applications.",
          details:
            "Ortho, DSM, and high-precision deliverables generated from drone missions and image processing workflows.",
          image: "https://images.unsplash.com/photo-1473968512647-3e447244af8f?w=1200&q=80",
        },
        {
          id: "surveying",
          title: "Surveying",
          description:
            "Professional surveying services for accurate land measurements and property boundaries.",
          details:
            "Topographic, cadastral, and site surveying services with reliable field and office outputs.",
          image: "https://images.unsplash.com/photo-1487958449943-2429e8be8625?w=1200&q=80",
        },
        {
          id: "bim",
          title: "BIM",
          description:
            "Building Information Modeling services for efficient construction project management.",
          details:
            "BIM coordination and model delivery for planning, execution, and lifecycle management.",
          image: "https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=1200&q=80",
        },
        {
          id: "3d-modeling",
          title: "3d modeling",
          description:
            "Creating detailed and realistic 3D models for various industries and applications.",
          details:
            "Detailed 3D models for architecture, engineering, and digital visualization use cases.",
          image: "https://images.unsplash.com/photo-1545239351-1141bd82e8a6?w=1200&q=80",
        },
        {
          id: "graphic-design",
          title: "graphic design",
          description:
            "Providing creative graphic design services to strengthen your brand's visual communication.",
          details:
            "Creative visual identity and communication assets for digital and print channels.",
          image: "https://images.unsplash.com/photo-1561070791-2526d30994b5?w=1200&q=80",
        },
        {
          id: "digital-marketing",
          title: "Digital Marketing",
          description:
            "Effective digital marketing strategies to boost your online presence and engagement.",
          details:
            "Performance-focused campaigns and strategy to improve reach, traffic, and conversion.",
          image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=1200&q=80",
        },
        {
          id: "training",
          title: "Training",
          description:
            "Expert-led training programs to enhance your team's skills in various technical domains.",
          details:
            "Specialized hands-on training tracks delivered by industry professionals for teams and individuals.",
          image: "https://images.unsplash.com/photo-1517048676732-d65bc937f952?w=1200&q=80",
        },
      ]
    : [
        {
          id: "gis",
          title: "GIS",
          description:
            "Ø®Ø¯Ù…Ø§Øª GIS Ù…ØªÙƒØ§Ù…Ù„Ø© Ù„Ù„ØªØ­Ù„ÙŠÙ„ Ø§Ù„Ù…ÙƒØ§Ù†ÙŠ ÙˆØ±Ø³Ù… Ø§Ù„Ø®Ø±Ø§Ø¦Ø· ÙˆØ¹Ø±Ø¶ Ø§Ù„Ø¨ÙŠØ§Ù†Ø§Øª Ø§Ù„Ø¬ØºØ±Ø§ÙÙŠØ©.",
          details:
            "ØªÙ†ÙÙŠØ° Ø£Ø¹Ù…Ø§Ù„ Ù†Ø¸Ù… Ø§Ù„Ù…Ø¹Ù„ÙˆÙ…Ø§Øª Ø§Ù„Ø¬ØºØ±Ø§ÙÙŠØ© Ø¨Ø´ÙƒÙ„ Ø§Ø­ØªØ±Ø§ÙÙŠ Ù„Ø¥Ø¯Ø§Ø±Ø© Ø§Ù„Ø¨ÙŠØ§Ù†Ø§Øª ÙˆØ¥Ù†ØªØ§Ø¬ Ø®Ø±Ø§Ø¦Ø· Ø¯Ù‚ÙŠÙ‚Ø©.",
          image: ASSETS.COURSES.CLOUD,
        },
        {
          id: "website-design",
          title: "ØªØµÙ…ÙŠÙ… Ø§Ù„Ù…ÙˆØ§Ù‚Ø¹",
          description:
            "ØªØµÙ…ÙŠÙ… Ù…ÙˆØ§Ù‚Ø¹ Ø§Ø­ØªØ±Ø§ÙÙŠØ© Ù…ØªØ¬Ø§ÙˆØ¨Ø© ÙˆØ¬Ø°Ø§Ø¨Ø© Ø¨Ù…Ø§ ÙŠÙ†Ø§Ø³Ø¨ Ù‡ÙˆÙŠØ© Ù†Ø´Ø§Ø·Ùƒ.",
          details:
            "Ù…Ù† ØªØ®Ø·ÙŠØ· ØªØ¬Ø±Ø¨Ø© Ø§Ù„Ù…Ø³ØªØ®Ø¯Ù… Ø¥Ù„Ù‰ Ø§Ù„ÙˆØ§Ø¬Ù‡Ø© Ø§Ù„Ù†Ù‡Ø§Ø¦ÙŠØ©ØŒ Ù†Ù‚Ø¯Ù… ØªØµÙ…ÙŠÙ…Ù‹Ø§ ÙŠØ­Ù‚Ù‚ Ø£Ù‡Ø¯Ø§ÙÙƒ.",
          image: "https://res.cloudinary.com/dezzwsvjv/image/upload/v1771859012/WEB_DESIGN_h2iiim.jpg",
        },
        {
          id: "web-development",
          title: "ØªØ·ÙˆÙŠØ± Ø§Ù„ÙˆÙŠØ¨",
          description:
            "Ø¨Ù†Ø§Ø¡ ØªØ·Ø¨ÙŠÙ‚Ø§Øª ÙˆÙŠØ¨ Ù‚ÙˆÙŠØ© ÙˆÙ‚Ø§Ø¨Ù„Ø© Ù„Ù„ØªÙˆØ³Ø¹ Ø¨Ø£Ø­Ø¯Ø« Ø§Ù„ØªÙ‚Ù†ÙŠØ§Øª.",
          details:
            "ØªØ·ÙˆÙŠØ± Ù…ØªÙƒØ§Ù…Ù„ Ù…Ø¹ Ø¨Ù†ÙŠØ© Ù†Ø¸ÙŠÙØ© ÙˆØ±Ø¨Ø· APIs ÙˆØªØ¬Ù‡ÙŠØ² ÙƒØ§Ù…Ù„ Ù„Ù„Ø¥Ø·Ù„Ø§Ù‚.",
          image: ASSETS.COURSES.REACT,
        },
        {
          id: "mobile-apps",
          title: "ØªØ·Ø¨ÙŠÙ‚Ø§Øª Ø§Ù„Ù…ÙˆØ¨Ø§ÙŠÙ„",
          description:
            "ØªØ·ÙˆÙŠØ± ØªØ·Ø¨ÙŠÙ‚Ø§Øª Ù…ÙˆØ¨Ø§ÙŠÙ„ Ø¹Ø§Ù„ÙŠØ© Ø§Ù„Ø£Ø¯Ø§Ø¡ Ù„Ø£Ù†Ø¸Ù…Ø© iOS ÙˆAndroid.",
          details:
            "ØªØ·Ø¨ÙŠÙ‚Ø§Øª Ø³Ø±ÙŠØ¹Ø© ÙˆØ¹Ù…Ù„ÙŠØ© ØªØ¶Ù…Ù† ØªØ¬Ø±Ø¨Ø© Ù…Ø³ØªØ®Ø¯Ù… Ù…Ù…ØªØ§Ø²Ø© Ø¹Ù„Ù‰ Ù…Ø®ØªÙ„Ù Ø§Ù„Ø£Ø¬Ù‡Ø²Ø©.",
          image: ASSETS.COURSES.MOBILE,
        },
        {
          id: "remote-sensing",
          title: "Ø§Ù„Ø§Ø³ØªØ´Ø¹Ø§Ø± Ø¹Ù† Ø¨Ø¹Ø¯",
          description:
            "Ø®Ø¯Ù…Ø§Øª Ø§Ù„Ø§Ø³ØªØ´Ø¹Ø§Ø± Ø¹Ù† Ø¨Ø¹Ø¯ Ù„ØªØ­Ù„ÙŠÙ„ ÙˆÙ…Ø±Ø§Ù‚Ø¨Ø© Ø³Ø·Ø­ Ø§Ù„Ø£Ø±Ø¶ Ø¨Ø¯Ù‚Ø©.",
          details:
            "ØªØ­Ù„ÙŠÙ„ Ø¨ÙŠØ§Ù†Ø§Øª Ø§Ù„Ø£Ù‚Ù…Ø§Ø± Ø§Ù„ØµÙ†Ø§Ø¹ÙŠØ© ÙˆØ§Ù„ØµÙˆØ± Ø§Ù„Ø¬ÙˆÙŠØ© Ù„Ø¯Ø¹Ù… Ø§ØªØ®Ø§Ø° Ø§Ù„Ù‚Ø±Ø§Ø±.",
          image: "https://images.unsplash.com/photo-1521295121783-8a321d551ad2?w=1200&q=80",
        },
        {
          id: "drone-processing",
          title: "Ù…Ø¹Ø§Ù„Ø¬Ø© ØµÙˆØ± Ø§Ù„Ø¯Ø±ÙˆÙ†",
          description:
            "ØªØ­Ù„ÙŠÙ„ ÙˆÙ…Ø¹Ø§Ù„Ø¬Ø© Ù…ØªÙ‚Ø¯Ù…Ø© Ù„ØµÙˆØ± Ø§Ù„Ø·Ø§Ø¦Ø±Ø§Øª Ø¨Ø¯ÙˆÙ† Ø·ÙŠØ§Ø± Ù„Ù…Ø®ØªÙ„Ù Ø§Ù„ØªØ·Ø¨ÙŠÙ‚Ø§Øª.",
          details:
            "Ø¥Ù†ØªØ§Ø¬ Ù…Ø®Ø±Ø¬Ø§Øª Ø¯Ù‚ÙŠÙ‚Ø© Ù…Ø«Ù„ Orthophoto ÙˆDSM Ù…Ù† Ø¨ÙŠØ§Ù†Ø§Øª Ø§Ù„Ø·ÙŠØ±Ø§Ù†.",
          image: "https://images.unsplash.com/photo-1473968512647-3e447244af8f?w=1200&q=80",
        },
        {
          id: "surveying",
          title: "Ø§Ù„Ù…Ø³Ø§Ø­Ø©",
          description:
            "Ø®Ø¯Ù…Ø§Øª Ù…Ø³Ø§Ø­Ø© Ø§Ø­ØªØ±Ø§ÙÙŠØ© Ù„Ù‚ÙŠØ§Ø³Ø§Øª Ø§Ù„Ø£Ø±Ø§Ø¶ÙŠ ÙˆØ­Ø¯ÙˆØ¯ Ø§Ù„Ù…Ù„ÙƒÙŠØ§Øª Ø¨Ø¯Ù‚Ø©.",
          details:
            "Ø£Ø¹Ù…Ø§Ù„ Ø±ÙØ¹ Ù…Ø³Ø§Ø­ÙŠ ÙˆØ­Ø¯ÙˆØ¯ÙŠ ÙˆØªÙ‚Ø§Ø±ÙŠØ± ÙÙ†ÙŠØ© Ø¨Ù…Ø¹Ø§ÙŠÙŠØ± Ù…Ù‡Ù†ÙŠØ©.",
          image: "https://images.unsplash.com/photo-1487958449943-2429e8be8625?w=1200&q=80",
        },
        {
          id: "bim",
          title: "BIM",
          description:
            "Ø®Ø¯Ù…Ø§Øª Ù†Ù…Ø°Ø¬Ø© Ù…Ø¹Ù„ÙˆÙ…Ø§Øª Ø§Ù„Ù…Ø¨Ø§Ù†ÙŠ Ù„Ø±ÙØ¹ ÙƒÙØ§Ø¡Ø© Ø¥Ø¯Ø§Ø±Ø© Ù…Ø´Ø±ÙˆØ¹Ø§Øª Ø§Ù„Ø¥Ù†Ø´Ø§Ø¡.",
          details:
            "ØªÙ†Ø³ÙŠÙ‚ Ù†Ù…Ø§Ø°Ø¬ BIM ÙˆØ¥Ø®Ø±Ø§Ø¬Ø§Øª ØªÙ†ÙÙŠØ°ÙŠØ© Ø¯Ù‚ÙŠÙ‚Ø© Ù„Ø¯Ø¹Ù… Ù…Ø±Ø§Ø­Ù„ Ø§Ù„Ù…Ø´Ø±ÙˆØ¹ Ø§Ù„Ù…Ø®ØªÙ„ÙØ©.",
          image: "https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=1200&q=80",
        },
        {
          id: "3d-modeling",
          title: "Ø§Ù„Ù†Ù…Ø°Ø¬Ø© Ø«Ù„Ø§Ø«ÙŠØ© Ø§Ù„Ø£Ø¨Ø¹Ø§Ø¯",
          description:
            "Ø¥Ù†Ø´Ø§Ø¡ Ù†Ù…Ø§Ø°Ø¬ 3D ÙˆØ§Ù‚Ø¹ÙŠØ© ÙˆÙ…ÙØµÙ„Ø© Ù„Ù…Ø®ØªÙ„Ù Ø§Ù„Ù‚Ø·Ø§Ø¹Ø§Øª.",
          details:
            "Ù†Ù…Ø§Ø°Ø¬ Ø«Ù„Ø§Ø«ÙŠØ© Ø§Ù„Ø£Ø¨Ø¹Ø§Ø¯ Ø¯Ù‚ÙŠÙ‚Ø© Ù„Ù„Ø§Ø³ØªØ®Ø¯Ø§Ù…Ø§Øª Ø§Ù„Ù‡Ù†Ø¯Ø³ÙŠØ© ÙˆØ§Ù„Ø¹Ø±Ø¶ Ø§Ù„Ø¨ØµØ±ÙŠ.",
          image: "https://images.unsplash.com/photo-1545239351-1141bd82e8a6?w=1200&q=80",
        },
        {
          id: "graphic-design",
          title: "Ø§Ù„ØªØµÙ…ÙŠÙ… Ø§Ù„Ø¬Ø±Ø§ÙÙŠÙƒÙŠ",
          description:
            "Ø®Ø¯Ù…Ø§Øª ØªØµÙ…ÙŠÙ… Ø¥Ø¨Ø¯Ø§Ø¹ÙŠØ© ØªØ¹Ø²Ø² Ø§Ù„Ù‡ÙˆÙŠØ© Ø§Ù„Ø¨ØµØ±ÙŠØ© Ù„Ù„Ø¹Ù„Ø§Ù…Ø© Ø§Ù„ØªØ¬Ø§Ø±ÙŠØ©.",
          details:
            "ØªØµÙ…ÙŠÙ… Ù…ÙˆØ§Ø¯ Ø¨ØµØ±ÙŠØ© Ù‚ÙˆÙŠØ© Ù„Ù„Ù‡ÙˆÙŠØ© ÙˆØ§Ù„ØªÙˆØ§ØµÙ„ Ø§Ù„Ø±Ù‚Ù…ÙŠ ÙˆØ§Ù„Ù…Ø·Ø¨ÙˆØ¹Ø§Øª.",
          image: "https://images.unsplash.com/photo-1561070791-2526d30994b5?w=1200&q=80",
        },
        {
          id: "digital-marketing",
          title: "Ø§Ù„ØªØ³ÙˆÙŠÙ‚ Ø§Ù„Ø±Ù‚Ù…ÙŠ",
          description:
            "Ø§Ø³ØªØ±Ø§ØªÙŠØ¬ÙŠØ§Øª ØªØ³ÙˆÙŠÙ‚ Ø±Ù‚Ù…ÙŠ ÙØ¹Ø§Ù„Ø© Ù„Ø²ÙŠØ§Ø¯Ø© Ø§Ù„Ø§Ù†ØªØ´Ø§Ø± ÙˆØ§Ù„ØªÙØ§Ø¹Ù„.",
          details:
            "Ø­Ù…Ù„Ø§Øª ØªØ³ÙˆÙŠÙ‚ Ø±Ù‚Ù…ÙŠØ© Ù…Ø¨Ù†ÙŠØ© Ø¹Ù„Ù‰ Ø§Ù„Ø£Ø¯Ø§Ø¡ Ù„Ø±ÙØ¹ Ø§Ù„Ù†ØªØ§Ø¦Ø¬ Ø§Ù„ÙØ¹Ù„ÙŠØ©.",
          image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=1200&q=80",
        },
        {
          id: "training",
          title: "Ø§Ù„ØªØ¯Ø±ÙŠØ¨",
          description:
            "Ø¨Ø±Ø§Ù…Ø¬ ØªØ¯Ø±ÙŠØ¨ÙŠØ© Ù…ØªØ®ØµØµØ© Ù„Ø±ÙØ¹ Ù…Ù‡Ø§Ø±Ø§Øª ÙØ±ÙŠÙ‚Ùƒ ÙÙŠ Ø§Ù„Ù…Ø¬Ø§Ù„Ø§Øª Ø§Ù„ØªÙ‚Ù†ÙŠØ©.",
          details:
            "Ù…Ø³Ø§Ø±Ø§Øª ØªØ¯Ø±ÙŠØ¨ Ø¹Ù…Ù„ÙŠØ© ÙŠÙ‚Ø¯Ù…Ù‡Ø§ Ø®Ø¨Ø±Ø§Ø¡ Ø§Ù„Ù…Ø¬Ø§Ù„ Ù„ØªØ£Ù‡ÙŠÙ„ Ø§Ù„Ø£ÙØ±Ø§Ø¯ ÙˆØ§Ù„ÙØ±Ù‚.",
          image: "https://images.unsplash.com/photo-1517048676732-d65bc937f952?w=1200&q=80",
        },
      ];

  const inferLandingCategory = (title: string): CourseCategory => {
    const t = title.toLowerCase();
    if (t.includes("utility") || t.includes("ÙŠÙˆØªÙŠÙ„ÙŠØªÙŠ")) return "utilities";
    if (t.includes("drone") || t.includes("survey") || t.includes("Ù…Ø³Ø§Ø­")) return "surveying";
    if (t.includes("remote") || t.includes("multispectral") || t.includes("Ø§Ù„Ø§Ø³ØªØ´Ø¹Ø§Ø±")) return "remote";
    if (t.includes("python")) return "software";
    if (t.includes("geoai") || t.includes("ai")) return "geoai";
    if (t.includes("gis") || t.includes("arcgis") || t.includes("web")) return "gis";
    return "company";
  };

  const categoryFilters: { key: CourseCategory; label: string }[] = isEn
    ? [
        { key: "all", label: "All" },
        { key: "company", label: "Company" },
        { key: "gis", label: "GIS" },
        { key: "geoai", label: "GeoAI" },
        { key: "software", label: "Software" },
        { key: "utilities", label: "Utilities" },
        { key: "surveying", label: "Surveying" },
        { key: "remote", label: "Remote Sensing" },
      ]
    : [
        { key: "all", label: "Ø§Ù„ÙƒÙ„" },
        { key: "company", label: "Ø§Ù„Ø´Ø±ÙƒØ©" },
        { key: "gis", label: "GIS" },
        { key: "geoai", label: "GeoAI" },
        { key: "software", label: "Ø§Ù„Ø¨Ø±Ù…Ø¬Ø©" },
        { key: "utilities", label: "Ø§Ù„ÙŠÙˆØªÙŠÙ„ÙŠØªÙŠØ²" },
        { key: "surveying", label: "Ø§Ù„Ù…Ø³Ø§Ø­Ø©" },
        { key: "remote", label: "Ø§Ù„Ø§Ø³ØªØ´Ø¹Ø§Ø± Ø¹Ù† Ø¨Ø¹Ø¯" },
      ];

  const [activeCategory, setActiveCategory] = useState<CourseCategory>("all");
  const [activeSection, setActiveSection] = useState<LandingSectionId>(
    isContactPage
      ? "contact"
      : standaloneContentPage
      ? standaloneContentPage
      : "home"
  );
  const [currentIndex, setCurrentIndex] = useState(0);
  const [slideDirection, setSlideDirection] = useState<1 | -1>(1);
  const [hoveredNavSection, setHoveredNavSection] = useState<LandingSectionId | null>(null);
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(null);
  const [showAllServices, setShowAllServices] = useState(isServicesPage);
  const [servicesMenuOpen, setServicesMenuOpen] = useState(false);
  const [apiLandingCourses, setApiLandingCourses] = useState<ApiLandingCourse[]>([]);
  const [apiLandingBlogs, setApiLandingBlogs] = useState<ApiLandingBlog[]>([]);
  const [apiLandingProjects, setApiLandingProjects] = useState<ApiLandingProject[]>([]);
  const [instructorStaticCourses, setInstructorStaticCourses] = useState<Course[]>(
    []
  );
  const [activeFooterModal, setActiveFooterModal] = useState<FooterModalType>(null);
  const [contactFormData, setContactFormData] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "",
    message: "",
  });
  const [feedbackFormData, setFeedbackFormData] = useState({
    name: "",
    email: "",
    type: "complaint",
    message: "",
  });
  const servicesMenuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setInstructorStaticCourses(getStaticCourses());
  }, []);

  useEffect(() => {
    let isMounted = true;

    api.courses
      .listLanding()
      .then((courses) => {
        if (!isMounted) return;
        setApiLandingCourses(Array.isArray(courses) ? courses : []);
      })
      .catch((error) => {
        console.error("Failed to load landing courses:", error);
        if (!isMounted) return;
        setApiLandingCourses([]);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    api.courses
      .listLandingBlogs()
      .then((blogs) => {
        if (!isMounted) return;
        setApiLandingBlogs(Array.isArray(blogs) ? blogs : []);
      })
      .catch((error) => {
        console.error("Failed to load landing blogs:", error);
        if (!isMounted) return;
        setApiLandingBlogs([]);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    api.courses
      .listLandingProjects()
      .then((projects) => {
        if (!isMounted) return;
        setApiLandingProjects(Array.isArray(projects) ? projects : []);
      })
      .catch((error) => {
        console.error("Failed to load landing projects:", error);
        if (!isMounted) return;
        setApiLandingProjects([]);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const apiProjectCards: LandingProjectCard[] = apiLandingProjects.map((project) => ({
    id: project.id,
    slug: project.slug,
    title: project.title,
    category: project.project_type || (isEn ? "Project" : "مشروع"),
    summary:
      project.short_description ||
      (isEn ? "Project summary is not available yet." : "ملخص المشروع غير متاح حالياً."),
    description:
      project.description ||
      project.short_description ||
      (isEn ? "Project details are not available yet." : "تفاصيل المشروع غير متاحة حالياً."),
    image: project.image_url || ASSETS.COURSES.CLOUD,
    pdfUrl: project.project_pdf_url,
    externalUrl: project.external_url,
    clientName: project.client_name,
  }));

  const projectCards: LandingProjectCard[] = apiProjectCards;

  const apiBlogCards: LandingBlogCard[] = apiLandingBlogs.map((blog) => ({
    id: blog.id,
    slug: blog.slug,
    title: blog.title,
    summary:
      blog.short_description ||
      (isEn ? "Blog summary is not available yet." : "ملخص المقال غير متاح حالياً."),
    content:
      blog.content ||
      (isEn ? "Blog content is not available yet." : "محتوى المقال غير متاح حالياً."),
    image: blog.image_url || ASSETS.COURSES.CLOUD,
    authorName: blog.author_name,
    readTimeMinutes: blog.read_time_minutes,
    resourceLinks: Array.isArray(blog.resource_links) ? blog.resource_links : [],
    resourceFileUrl: blog.resource_file_url,
  }));

  const blogCards: LandingBlogCard[] = apiBlogCards;

  const selectedBlogPost = selectedBlogSlug
    ? blogCards.find((blog) => blog.slug === selectedBlogSlug)
    : null;
  const selectedProjectItem = selectedProjectSlug
    ? projectCards.find((project) => project.slug === selectedProjectSlug)
    : null;

  const customCourses: LandingCourseCard[] = instructorStaticCourses.map(
    (course) => ({
      id: course.id,
      title: course.title,
      image: resolveLandingCourseImage(
        course.title,
        course.thumbnail_url ||
          (typeof course.thumbnail === "string"
            ? course.thumbnail
            : ASSETS.COURSES.CLOUD)
      ),
      category: inferLandingCategory(course.title),
      description:
        course.description ||
        (isEn
          ? "Custom course added by instructor."
          : "ÙƒÙˆØ±Ø³ Ù…Ø®ØµØµ ØªÙ…Øª Ø¥Ø¶Ø§ÙØªÙ‡ Ø¨ÙˆØ§Ø³Ø·Ø© Ø§Ù„Ù…Ø¯Ø±Ù‘Ø¨."),
      instructorName: course.instructor_name,
      instructorImage: course.instructor_image_url,
      durationLabel: course.duration_label,
      priceLive: Number(course.price_live || 0),
      priceOffline: Number(course.price_offline || 0),
      priceRecorded: Number(course.price_recorded || course.price || 0),
      ratingValue: Number(course.rating_value || 0),
      enrolledStudents: Number(course.enrolled_students || 0),
      sourceCourse: course,
    })
  );

  const mapLandingApiCourseToPreviewCourse = (
    course: ApiLandingCourse
  ): Course => {
    const fallbackDescription = isEn
      ? "Professional geospatial training course."
      : "ÙƒÙˆØ±Ø³ Ø§Ø­ØªØ±Ø§ÙÙŠ ÙÙŠ Ø§Ù„Ù…Ø¬Ø§Ù„ Ø§Ù„Ø¬ÙŠÙˆÙ…ÙƒØ§Ù†ÙŠ.";
    const fallbackImage = course.image_url || ASSETS.COURSES.CLOUD;

    const mappedLessons =
      Array.isArray(course.episodes) && course.episodes.length > 0
        ? course.episodes.map((episode, index) => ({
            id: episode.id || course.id * 100 + index + 1,
            title:
              episode.title ||
              (isEn ? `Episode ${index + 1}` : `Ø§Ù„Ø­Ù„Ù‚Ø© ${index + 1}`),
            description: episode.description || "",
            video_url: episode.video_url || "",
            order: (episode.sort_order ?? index) + 1,
            duration_minutes: Number(episode.duration_minutes || 0),
            is_completed: false,
          }))
        : [
            {
              id: course.id * 100 + 1,
              title: isEn ? "Course Overview" : "Ù†Ø¸Ø±Ø© Ø¹Ø§Ù…Ø© Ø¹Ù„Ù‰ Ø§Ù„ÙƒÙˆØ±Ø³",
              description: course.description || fallbackDescription,
              video_url: "",
              order: 1,
              duration_minutes: 15,
              is_completed: false,
            },
          ];

    return {
      id: course.id,
      title: course.title,
      description: course.description || course.short_description || fallbackDescription,
      instructor_id: 0,
      category: 1,
      price: String(course.price ?? "0.00"),
      thumbnail: fallbackImage,
      thumbnail_url: fallbackImage,
      created_at: course.created_at || new Date().toISOString(),
      is_enrolled: true,
      lessons: mappedLessons as any,
      resources: [],
      progress: 0,
      status: "published",
      ...( {
        static_source: "landing",
        instructor_name:
          course.instructor_name ||
          (isEn ? "Geo Top Company" : "Ø´Ø±ÙƒØ© Geo Top"),
        instructor_image_url: course.instructor_image_url || "",
        level_label:
          course.level_label ||
          (isEn ? "Professional Track" : "Ù…Ø³Ø§Ø± Ø§Ø­ØªØ±Ø§ÙÙŠ"),
        course_language:
          course.course_language ||
          (isEn ? "Arabic / English" : "Ø§Ù„Ø¹Ø±Ø¨ÙŠØ© / Ø§Ù„Ø¥Ù†Ø¬Ù„ÙŠØ²ÙŠØ©"),
        duration_label: course.duration_label || "",
        price_live: Number(course.price_live || 0),
        price_offline: Number(course.price_offline || 0),
        price_recorded: Number(course.price_recorded || course.price || 0),
        rating_value: Number(course.rating_value || 0),
        enrolled_students: Number(course.enrolled_students || 0),
        requirements: Array.isArray(course.requirements)
          ? course.requirements
          : [],
        outcomes: Array.isArray(course.outcomes) ? course.outcomes : [],
        last_updated: course.updated_at || new Date().toISOString(),
      } as any),
    };
  };

  const backendCourses: LandingCourseCard[] = apiLandingCourses.map(
    (course) => ({
      id: course.id,
      title: course.title,
      image: resolveLandingCourseImage(
        course.title,
        course.image_url || ASSETS.COURSES.CLOUD
      ),
      category: inferLandingCategory(course.title),
      description:
        course.short_description ||
        course.description ||
        (isEn
          ? "Professional geospatial training course."
          : "ÙƒÙˆØ±Ø³ Ø§Ø­ØªØ±Ø§ÙÙŠ ÙÙŠ Ø§Ù„Ù…Ø¬Ø§Ù„ Ø§Ù„Ø¬ÙŠÙˆÙ…ÙƒØ§Ù†ÙŠ."),
      instructorName: course.instructor_name || "",
      instructorImage: course.instructor_image_url || "",
      durationLabel: course.duration_label || "",
      priceLive: Number(course.price_live || 0),
      priceOffline: Number(course.price_offline || 0),
      priceRecorded: Number(course.price_recorded || course.price || 0),
      ratingValue: Number(course.rating_value || 0),
      enrolledStudents: Number(course.enrolled_students || 0),
      sourceCourse: mapLandingApiCourseToPreviewCourse(course),
    })
  );

  const primaryCourses =
    backendCourses.length > 0 ? backendCourses : customCourses;
  const primaryCourseIds = new Set(primaryCourses.map((course) => course.id));
  const customUniqueCourses = customCourses.filter(
    (course) => !primaryCourseIds.has(course.id)
  );
  const allCourses: LandingCourseCard[] = [...primaryCourses, ...customUniqueCourses];
  const getFeaturedCoursePriority = (title: string): number => {
    const normalizedTitle = title.toLowerCase();

    if (
      normalizedTitle.includes("utilities") ||
      normalizedTitle.includes("utility") ||
      normalizedTitle.includes("electricity") ||
      normalizedTitle.includes("water") ||
      normalizedTitle.includes("ÙƒÙ‡Ø±Ø¨Ø§Ø¡") ||
      normalizedTitle.includes("Ù…ÙŠØ§Ù‡")
    ) {
      return 0; // Utilities
    }

    if (normalizedTitle.includes("geoai") || normalizedTitle.includes("geo ai")) {
      return 1; // GeoAI
    }

    if (normalizedTitle.includes("drone") || normalizedTitle.includes("Ø¯Ø±ÙˆÙ†")) {
      return 2; // Drone Surveying
    }

    if (
      normalizedTitle.includes("laser") ||
      normalizedTitle.includes("scanner") ||
      normalizedTitle.includes("Ù„ÙŠØ²Ø±") ||
      normalizedTitle.includes("Ù„Ø§Ø³Ø±")
    ) {
      return 3; // Laser Scanner
    }

    return 99;
  };

  const orderedCourses: LandingCourseCard[] = allCourses
    .map((course, index) => ({
      course,
      index,
      priority: getFeaturedCoursePriority(course.title),
    }))
    .sort((a, b) => a.priority - b.priority || a.index - b.index)
    .map(({ course }) => course);

  const filteredCourses =
    activeCategory === "all"
      ? orderedCourses
      : orderedCourses.filter((course) => course.category === activeCategory);

  const pageSize = 4;
  const totalSlides = Math.max(1, Math.ceil(filteredCourses.length / pageSize));
  const maxStartIndex = Math.max(0, (totalSlides - 1) * pageSize);
  const currentSlideIndex = Math.floor(currentIndex / pageSize);
  const visibleCourses = filteredCourses.slice(currentIndex, currentIndex + pageSize);

  useEffect(() => {
    setCurrentIndex(0);
    setSlideDirection(1);
  }, [activeCategory, isEn]);

  useEffect(() => {
    if (isContactPage) {
      setActiveSection("contact");
      setServicesMenuOpen(false);
      return;
    }

    if (isBlogDetailPage) {
      setActiveSection("blog");
      setServicesMenuOpen(false);
      return;
    }

    if (isProjectDetailPage) {
      setActiveSection("projects");
      setServicesMenuOpen(false);
      return;
    }

    if (standaloneContentPage) {
      setActiveSection(standaloneContentPage);
      setServicesMenuOpen(false);
      return;
    }
  }, [isContactPage, isBlogDetailPage, isProjectDetailPage, standaloneContentPage]);

  useEffect(() => {
    if (!isServicesPage) return;
    setShowAllServices(true);
  }, [isServicesPage]);

  useEffect(() => {
    const sectionIds: LandingSectionId[] = isContactPage
      ? ["contact"]
      : isBlogDetailPage
      ? ["blog"]
      : isProjectDetailPage
      ? ["projects"]
      : standaloneContentPage
      ? [standaloneContentPage]
      : ["home", "services", "courses", "projects", "blog", "about"];

    const detectActiveSection = () => {
      const offset = 140;
      const scrollPosition = window.scrollY + offset;
      let currentSection: LandingSectionId = isContactPage
        ? "contact"
        : isBlogDetailPage
        ? "blog"
        : isProjectDetailPage
        ? "projects"
        : standaloneContentPage || "home";

      for (const id of sectionIds) {
        const el = document.getElementById(id);
        if (el && scrollPosition >= el.offsetTop) {
          currentSection = id;
        }
      }

      setActiveSection(currentSection);
    };

    detectActiveSection();
    window.addEventListener("scroll", detectActiveSection, { passive: true });
    window.addEventListener("resize", detectActiveSection);

    return () => {
      window.removeEventListener("scroll", detectActiveSection);
      window.removeEventListener("resize", detectActiveSection);
    };
  }, [isContactPage, isBlogDetailPage, isProjectDetailPage, standaloneContentPage]);

  useEffect(() => {
    if (currentIndex > maxStartIndex) {
      setCurrentIndex(maxStartIndex);
    }
  }, [currentIndex, maxStartIndex]);

  useEffect(() => {
    if (!servicesMenuOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (servicesMenuRef.current && !servicesMenuRef.current.contains(target)) {
        setServicesMenuOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setServicesMenuOpen(false);
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [servicesMenuOpen]);

  useEffect(() => {
    if (!activeFooterModal) return;

    const onEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setActiveFooterModal(null);
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onEscape);
    };
  }, [activeFooterModal]);

  useEffect(() => {
    if (!initialSectionId) return;

    setActiveSection(initialSectionId);
    const timer = window.setTimeout(() => {
      const section = document.getElementById(initialSectionId);
      if (section) {
        section.scrollIntoView({ behavior: "smooth", block: "start" });
      }
      if (onInitialSectionHandled) onInitialSectionHandled();
    }, 80);

    return () => window.clearTimeout(timer);
  }, [initialSectionId, onInitialSectionHandled]);

  const handleSlidePrev = () => {
    if (currentIndex === 0) return;
    setSlideDirection(-1);
    setCurrentIndex((prev) => Math.max(0, prev - pageSize));
  };

  const handleSlideNext = () => {
    if (currentIndex >= maxStartIndex) return;
    setSlideDirection(1);
    setCurrentIndex((prev) => Math.min(maxStartIndex, prev + pageSize));
  };

  const handleSlideDotClick = (slideIndex: number) => {
    const nextIndex = Math.min(maxStartIndex, slideIndex * pageSize);
    if (nextIndex === currentIndex) return;
    setSlideDirection(nextIndex > currentIndex ? 1 : -1);
    setCurrentIndex(nextIndex);
  };

  const scrollToSection = (id: string) => {
    const section = document.getElementById(id);
    if (section) section.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const selectedService = useMemo(
    () => serviceCards.find((service) => service.id === selectedServiceId) ?? null,
    [selectedServiceId, serviceCards]
  );
  const SERVICES_PREVIEW_COUNT = 3;
  const visibleServices = showAllServices
    ? serviceCards
    : serviceCards.slice(0, SERVICES_PREVIEW_COUNT);

  const openServicePage = (service: ServiceCardData) => {
    setSelectedServiceId(service.id);
    setActiveSection("services");
    setServicesMenuOpen(false);
    window.requestAnimationFrame(() => {
      scrollToSection("services");
    });
  };

  const closeServicePage = () => {
    setSelectedServiceId(null);
    setActiveSection("services");
    window.requestAnimationFrame(() => {
      scrollToSection("services");
    });
  };

  const handleLogoClick = () => {
    setHoveredNavSection(null);
    if (!isContactPage) {
      scrollToSection("home");
    }
    if (onLogoClick) onLogoClick();
  };

  const geoTopLocationUrl =
    "https://www.google.com/maps/search/%D8%A8%D8%AC%D9%88%D8%A7%D8%B1+%D8%A7%D9%84%D9%81%D8%AE%D8%B1%D8%A7%D9%86%D9%8A+%D9%81%D9%88%D9%82+%D9%85%D9%83%D8%AA%D8%A8%D9%87+%D8%A7%D9%84%D9%83%D9%84%D9%85+%D8%A7%D9%84%D8%B7%D9%8A%D8%A8+%D8%B4%D8%A7%D8%B1%D8%B9+%D8%A7%D9%84%D8%B9%D8%AF%D9%88%D9%8A+%D8%8C+%D8%B3%D9%85%D9%86%D9%88%D8%AF+%D8%8C+%D8%A7%D9%84%D8%BA%D8%B1%D8%A8%D9%8A%D9%87%E2%80%AD/@30.95913,31.2430187,17z?hl=en&entry=ttu&g_ep=EgoyMDI2MDIxOC4wIKXMDSoASAFQAw%3D%3D";
  const geoTopWhatsappDisplay = "+20 11 05582880";
  const geoTopWhatsappUrl = "https://wa.me/201105582880";

  const footerContent = isEn
    ? {
        badge: "Geo Top Company",
        ctaTitle: "Ready for your next geospatial milestone?",
        ctaDesc: "Join our training tracks and build practical, job-ready skills.",
        ctaPrimary: "Join Programs",
        ctaSecondary: "Explore Courses",
        brandTitle: "Geo Top",
        brandDesc:
          "Geo Top is a premier provider of GIS solutions, offering advanced technology and expert services globally. With a focus on innovation and precision, Geo Top delivers tailored geospatial solutions to empower organizations and drive success.",
        brandAction: "Learn More",
        contactTitle: "Reach Us",
        contactDesc: "For inquiries, partnerships, and training requests.",
        email: "info@geo-top-group.com",
        whatsapp: geoTopWhatsappDisplay,
        whatsappUrl: geoTopWhatsappUrl,
        location: "Al Adawy St, Samannoud, Al Gharbia",
        locationUrl: geoTopLocationUrl,
        websiteLabel: "Website",
        websiteUrl: "",
        socialTitle: "Follow Us",
        socialLinks: [
          { label: "YouTube", href: "https://www.youtube.com/@geotopgroup", icon: "youtube" as const },
          { label: "Instagram", href: "https://www.instagram.com/geotopgroup/", icon: "instagram" as const },
          { label: "Facebook", href: "https://www.facebook.com/profile.php?id=61560270966670", icon: "facebook" as const },
          { label: "Snapchat", href: "https://www.snapchat.com/add/geo_top24", icon: "snapchat" as const },
          { label: "TikTok", href: "https://www.tiktok.com/@geotopgroup", icon: "tiktok" as const },
          { label: "X", href: "https://x.com/geotopgroup", icon: "x" as const },
          { label: "LinkedIn", href: "https://linkedin.com/company/geo-top-egypt", icon: "linkedin" as const },
        ],
        copyright: `(c) ${new Date().getFullYear()} Geo Top Company. All rights reserved.`,
      }
    : {
        badge: "Ø´Ø±ÙƒØ© Geo Top",
        ctaTitle: "Ø¬Ø§Ù‡Ø² Ù„Ù„Ø®Ø·ÙˆØ© Ø§Ù„Ø¬Ø§ÙŠØ© ÙÙŠ Ø§Ù„Ù…Ø¬Ø§Ù„ Ø§Ù„Ø¬ÙŠÙˆÙ…ÙƒØ§Ù†ÙŠØŸ",
        ctaDesc: "Ø§Ù†Ø¶Ù… Ù„Ù…Ø³Ø§Ø±Ø§ØªÙ†Ø§ Ø§Ù„ØªØ¯Ø±ÙŠØ¨ÙŠØ© ÙˆØ§Ø¨Ù†ÙŠ Ù…Ù‡Ø§Ø±Ø§Øª Ø¹Ù…Ù„ÙŠØ© Ù…Ø·Ù„ÙˆØ¨Ø© ÙÙŠ Ø³ÙˆÙ‚ Ø§Ù„Ø¹Ù…Ù„.",
        ctaPrimary: "Ø§Ù†Ø¶Ù… Ù„Ù„Ø¨Ø±Ø§Ù…Ø¬",
        ctaSecondary: "Ø§Ø³ØªØ¹Ø±Ø¶ Ø§Ù„ÙƒÙˆØ±Ø³Ø§Øª",
        brandTitle: "Geo Top",
        brandDesc:
          "\u062c\u064a\u0648 \u062a\u0648\u0628 \u0634\u0631\u0643\u0629 \u0631\u0627\u0626\u062f\u0629 \u0641\u064a \u062d\u0644\u0648\u0644 \u0646\u0638\u0645 \u0627\u0644\u0645\u0639\u0644\u0648\u0645\u0627\u062a \u0627\u0644\u062c\u063a\u0631\u0627\u0641\u064a\u0629\u060c \u062a\u0642\u062f\u0645 \u062a\u0642\u0646\u064a\u0627\u062a \u0645\u062a\u0642\u062f\u0645\u0629 \u0648\u062e\u062f\u0645\u0627\u062a \u0627\u062d\u062a\u0631\u0627\u0641\u064a\u0629 \u0639\u0644\u0649 \u0645\u0633\u062a\u0648\u0649 \u0639\u0627\u0644\u0645\u064a. \u0645\u0639 \u0627\u0644\u062a\u0631\u0643\u064a\u0632 \u0639\u0644\u0649 \u0627\u0644\u0627\u0628\u062a\u0643\u0627\u0631 \u0648\u0627\u0644\u062f\u0642\u0629\u060c \u0646\u0648\u0641\u0631 \u062d\u0644\u0648\u0644\u0627\u064b \u0645\u0643\u0627\u0646\u064a\u0629 \u0645\u062e\u0635\u0635\u0629 \u062a\u0645\u0643\u0651\u0646 \u0627\u0644\u0645\u0624\u0633\u0633\u0627\u062a \u0648\u062a\u062f\u0639\u0645 \u0646\u062c\u0627\u062d\u0647\u0627.",
        brandAction: "Ø§Ø¹Ø±Ù Ø£ÙƒØªØ±",
        contactTitle: "ØªÙˆØ§ØµÙ„ Ù…Ø¹Ù†Ø§",
        contactDesc: "Ù„Ù„Ø§Ø³ØªÙØ³Ø§Ø±Ø§Øª ÙˆØ§Ù„Ø´Ø±Ø§ÙƒØ§Øª ÙˆØ¨Ø±Ø§Ù…Ø¬ Ø§Ù„ØªØ¯Ø±ÙŠØ¨.",
        email: "info@geo-top-group.com",
        whatsapp: geoTopWhatsappDisplay,
        whatsappUrl: geoTopWhatsappUrl,
        location: "Ø¨Ø¬ÙˆØ§Ø± Ø§Ù„ÙØ®Ø±Ø§Ù†ÙŠ ÙÙˆÙ‚ Ù…ÙƒØªØ¨Ù‡ Ø§Ù„ÙƒÙ„Ù… Ø§Ù„Ø·ÙŠØ¨ØŒ Ø´Ø§Ø±Ø¹ Ø§Ù„Ø¹Ø¯ÙˆÙŠØŒ Ø³Ù…Ù†ÙˆØ¯ØŒ Ø§Ù„ØºØ±Ø¨ÙŠØ©",
        locationUrl: geoTopLocationUrl,
        websiteLabel: "Ø§Ù„Ù…ÙˆÙ‚Ø¹",
        websiteUrl: "",
        socialTitle: "ØªØ§Ø¨Ø¹Ù†Ø§",
        socialLinks: [
          { label: "ÙŠÙˆØªÙŠÙˆØ¨", href: "https://www.youtube.com/@geotopgroup", icon: "youtube" as const },
          { label: "Ø§Ù†Ø³ØªØ§Ø¬Ø±Ø§Ù…", href: "https://www.instagram.com/geotopgroup/", icon: "instagram" as const },
          { label: "ÙÙŠØ³Ø¨ÙˆÙƒ", href: "https://www.facebook.com/profile.php?id=61560270966670", icon: "facebook" as const },
          { label: "Ø³Ù†Ø§Ø¨ Ø´Ø§Øª", href: "https://www.snapchat.com/add/geo_top24", icon: "snapchat" as const },
          { label: "ØªÙŠÙƒ ØªÙˆÙƒ", href: "https://www.tiktok.com/@geotopgroup", icon: "tiktok" as const },
          { label: "X", href: "https://x.com/geotopgroup", icon: "x" as const },
          { label: "Ù„Ù†ÙƒØ¯Ø§Ù†", href: "https://linkedin.com/company/geo-top-egypt", icon: "linkedin" as const },
        ],
        copyright: `(c) ${new Date().getFullYear()} Ø´Ø±ÙƒØ© Geo Top. Ø¬Ù…ÙŠØ¹ Ø§Ù„Ø­Ù‚ÙˆÙ‚ Ù…Ø­ÙÙˆØ¸Ø©.`,
      };

  const contactSectionContent = isEn
    ? {
        title: "Contact Us",
        subtitle:
          "Send your inquiry directly and we will follow up with you through our official email.",
        cardTitle: "Contact Form",
        note: `Send to: ${footerContent.email}`,
        name: "Full Name",
        email: "Email Address",
        phone: "Phone Number",
        subject: "Subject",
        message: "Message",
        send: "Send Message",
      }
    : {
        title: "تواصل معنا",
        subtitle: "اكتب رسالتك مباشرة وسنقوم بالمتابعة معك عبر البريد الإلكتروني الرسمي.",
        cardTitle: "نموذج التواصل",
        note: `سيتم الإرسال إلى: ${footerContent.email}`,
        name: "الاسم بالكامل",
        email: "البريد الإلكتروني",
        phone: "رقم الهاتف",
        subject: "عنوان الرسالة",
        message: "نص الرسالة",
        send: "إرسال الرسالة",
      };

  const locationMapEmbedUrl = `https://maps.google.com/maps?q=${encodeURIComponent(
    footerContent.location
  )}&t=&z=15&ie=UTF8&iwloc=&output=embed`;

  const footerQuickLinks = isEn
    ? {
        title: "Quick Links",
        privacy: "Privacy Policy",
        terms: "Terms & Conditions",
        learn: "How to Learn on Geo Top",
        feedback: "Submit Complaint / Suggestion",
        close: "Close",
        feedbackType: "Message Type",
        complaint: "Complaint",
        suggestion: "Suggestion",
      }
    : {
        title: "روابط سريعة",
        privacy: "سياسة الخصوصية",
        terms: "الشروط والأحكام",
        learn: "كيف تتعلم على جيو توب",
        feedback: "تقديم شكوى ومقترح",
        close: "إغلاق",
        feedbackType: "نوع الرسالة",
        complaint: "شكوى",
        suggestion: "مقترح",
      };

  const viewMoreContent = isEn
    ? {
        services: "View More Services",
        courses: "View More Courses",
        projects: "View More Projects",
        blog: "View More Blog Posts",
      }
    : {
        services: "عرض المزيد من الخدمات",
        courses: "عرض المزيد من الدورات",
        projects: "عرض المزيد من المشاريع",
        blog: "عرض المزيد من مقالات البلوج",
      };

  const openMailClient = (subject: string, body: string) => {
    const mailToUrl = `mailto:${footerContent.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.location.href = mailToUrl;
  };

  const handleContactSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const name = contactFormData.name.trim();
    const email = contactFormData.email.trim();
    const phone = contactFormData.phone.trim();
    const subject = contactFormData.subject.trim();
    const message = contactFormData.message.trim();

    if (!name || !email || !message) return;

    const mailSubject =
      subject ||
      (isEn
        ? "New contact form message - Geo Top website"
        : "رسالة جديدة من نموذج التواصل - موقع جيو توب");
    const mailBody = [
      `${isEn ? "Name" : "الاسم"}: ${name}`,
      `${isEn ? "Email" : "البريد"}: ${email}`,
      `${isEn ? "Phone" : "الهاتف"}: ${phone || (isEn ? "Not provided" : "غير مذكور")}`,
      "",
      `${isEn ? "Message" : "الرسالة"}:`,
      message,
    ].join("\n");

    openMailClient(mailSubject, mailBody);
  };

  const handleFeedbackSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const name = feedbackFormData.name.trim();
    const email = feedbackFormData.email.trim();
    const message = feedbackFormData.message.trim();

    if (!name || !email || !message) return;

    const isComplaint = feedbackFormData.type === "complaint";
    const mailSubject = isEn
      ? `${isComplaint ? "Complaint" : "Suggestion"} - Geo Top website`
      : `${isComplaint ? "شكوى" : "مقترح"} - موقع جيو توب`;
    const mailBody = [
      `${isEn ? "Name" : "الاسم"}: ${name}`,
      `${isEn ? "Email" : "البريد"}: ${email}`,
      `${isEn ? "Type" : "النوع"}: ${
        isComplaint
          ? isEn
            ? "Complaint"
            : "شكوى"
          : isEn
          ? "Suggestion"
          : "مقترح"
      }`,
      "",
      `${isEn ? "Details" : "التفاصيل"}:`,
      message,
    ].join("\n");

    openMailClient(mailSubject, mailBody);
    setActiveFooterModal(null);
  };

  const socialIconMap = {
    youtube: Youtube,
    instagram: Instagram,
    facebook: Facebook,
    snapchat: SnapchatIcon,
    tiktok: Music2,
    x: XBrandIcon,
    linkedin: Linkedin,
  } as const;

  const buildPreviewCourse = (
    course: LandingCourseCard,
    absoluteIndex: number
  ): Course => {
    if (course.sourceCourse) {
      return {
        ...course.sourceCourse,
        is_enrolled: true,
      } as Course;
    }

    const lessonBaseId = course.id * 10;
    const lessons = [
      {
        id: lessonBaseId + 1,
        title: isEn ? "Introduction & Setup" : "Ù…Ù‚Ø¯Ù…Ø© ÙˆØªØ¬Ù‡ÙŠØ² Ø§Ù„Ø¨ÙŠØ¦Ø©",
        description: isEn
          ? "Overview, tools, and workflow for this track."
          : "Ù†Ø¸Ø±Ø© Ø¹Ø§Ù…Ø© Ø¹Ù„Ù‰ Ø§Ù„Ù…Ø³Ø§Ø± ÙˆØ§Ù„Ø£Ø¯ÙˆØ§Øª ÙˆØ·Ø±ÙŠÙ‚Ø© Ø§Ù„Ø¹Ù…Ù„.",
        video_url: "",
        order: 1,
        duration_minutes: 20,
      },
      {
        id: lessonBaseId + 2,
        title: isEn ? "Core Practical Workflow" : "Ø§Ù„ØªØ·Ø¨ÙŠÙ‚ Ø§Ù„Ø¹Ù…Ù„ÙŠ Ø§Ù„Ø£Ø³Ø§Ø³ÙŠ",
        description: isEn
          ? "Hands-on implementation with real project examples."
          : "ØªØ·Ø¨ÙŠÙ‚ Ø¹Ù…Ù„ÙŠ Ø¨Ø£Ù…Ø«Ù„Ø© Ù…Ù† Ù…Ø´Ø±ÙˆØ¹Ø§Øª Ø­Ù‚ÙŠÙ‚ÙŠØ©.",
        video_url: "",
        order: 2,
        duration_minutes: 35,
      },
      {
        id: lessonBaseId + 3,
        title: isEn ? "Project Delivery & QA" : "ØªØ³Ù„ÙŠÙ… Ø§Ù„Ù…Ø´Ø±ÙˆØ¹ ÙˆÙ…Ø±Ø§Ø¬Ø¹Ø© Ø§Ù„Ø¬ÙˆØ¯Ø©",
        description: isEn
          ? "Final outputs, quality checks, and best practices."
          : "Ø§Ù„Ù…Ø®Ø±Ø¬Ø§Øª Ø§Ù„Ù†Ù‡Ø§Ø¦ÙŠØ© ÙˆÙ…Ø¹Ø§ÙŠÙŠØ± Ø§Ù„Ø¬ÙˆØ¯Ø© ÙˆØ£ÙØ¶Ù„ Ø§Ù„Ù…Ù…Ø§Ø±Ø³Ø§Øª.",
        video_url: "",
        order: 3,
        duration_minutes: 28,
      },
    ];

    return {
      id: course.id,
      title: course.title,
      description: course.description,
      instructor_id: 0,
      category: 1,
      price: String(course.priceRecorded || 0),
      thumbnail: course.image,
      thumbnail_url: course.image,
      created_at: new Date().toISOString(),
      is_enrolled: true,
      lessons: lessons as any,
      resources: [],
      progress: 0,
      status: "published",
      ...( {
        static_source: "landing",
        instructor_name:
          course.instructorName || (isEn ? "Geo Top Company" : "Ø´Ø±ÙƒØ© Geo Top"),
        instructor_image_url: course.instructorImage || "",
        level_label:
          absoluteIndex % 3 === 0
            ? isEn
              ? "Beginner to Advanced"
              : "Ù…Ù† Ø§Ù„Ù…Ø¨ØªØ¯Ø¦ Ø¥Ù„Ù‰ Ø§Ù„Ù…ØªÙ‚Ø¯Ù…"
            : isEn
            ? "Professional Track"
            : "Ù…Ø³Ø§Ø± Ø§Ø­ØªØ±Ø§ÙÙŠ",
        course_language: isEn ? "Arabic / English" : "Ø§Ù„Ø¹Ø±Ø¨ÙŠØ© / Ø§Ù„Ø¥Ù†Ø¬Ù„ÙŠØ²ÙŠØ©",
        duration_label: course.durationLabel || "",
        price_live: Number(course.priceLive || 0),
        price_offline: Number(course.priceOffline || 0),
        price_recorded: Number(course.priceRecorded || 0),
        rating_value: Number(course.ratingValue || 0),
        enrolled_students: Number(course.enrolledStudents || 0),
        last_updated: new Date().toISOString(),
        requirements: isEn
          ? ["Computer basics", "Motivation to practice", "Internet access"]
          : ["Ø£Ø³Ø§Ø³ÙŠØ§Øª Ø§Ù„ÙƒÙ…Ø¨ÙŠÙˆØªØ±", "Ø±ØºØ¨Ø© ÙÙŠ Ø§Ù„ØªØ·Ø¨ÙŠÙ‚", "Ø§ØªØµØ§Ù„ Ø¥Ù†ØªØ±Ù†Øª"],
        outcomes: isEn
          ? [
              "Build practical geospatial workflows",
              "Apply tools on real projects",
              "Deliver technical outputs professionally",
            ]
          : [
              "Ø¨Ù†Ø§Ø¡ Ù…Ø³Ø§Ø±Ø§Øª Ø¹Ù…Ù„ Ø¬ÙŠÙˆÙ…ÙƒØ§Ù†ÙŠØ©",
              "ØªØ·Ø¨ÙŠÙ‚ Ø§Ù„Ø£Ø¯ÙˆØ§Øª Ø¹Ù„Ù‰ Ù…Ø´Ø±ÙˆØ¹Ø§Øª Ø­Ù‚ÙŠÙ‚ÙŠØ©",
              "ØªØ³Ù„ÙŠÙ… Ù…Ø®Ø±Ø¬Ø§Øª ØªÙ‚Ù†ÙŠØ© Ø¨Ø§Ø­ØªØ±Ø§ÙÙŠØ©",
            ],
      } as any),
    };
  };

  const handleCourseCardClick = (
    course: LandingCourseCard,
    absoluteIndex: number
  ) => {
    const previewCourse = buildPreviewCourse(course, absoluteIndex);
    if (onCourseOpen) {
      onCourseOpen(previewCourse);
      return;
    }
    onExploreClick();
  };

  const handleProjectCardClick = (project: LandingProjectCard) => {
    if (onOpenProject) {
      onOpenProject(project.slug);
      return;
    }
    if (onOpenContentPage) {
      onOpenContentPage("projects");
    }
  };

  const handleBlogCardClick = (blog: LandingBlogCard) => {
    if (onOpenBlogPost) {
      onOpenBlogPost(blog.slug);
      return;
    }
    if (onOpenContentPage) {
      onOpenContentPage("blog");
    }
  };

  const handleBackToProjectsPage = () => {
    if (onBackToContentPage) {
      onBackToContentPage("projects");
      return;
    }
    if (onOpenContentPage) {
      onOpenContentPage("projects");
    }
  };

  const handleBackToBlogPage = () => {
    if (onBackToContentPage) {
      onBackToContentPage("blog");
      return;
    }
    if (onOpenContentPage) {
      onOpenContentPage("blog");
    }
  };

  const formatLandingPrice = (value?: number) => {
    const amount = Number(value || 0);
    if (amount <= 0) return isEn ? "Free" : "مجاني";
    return `${amount.toFixed(2)} ${isEn ? "EGP" : "ج.م"}`;
  };

  const renderLandingCourseCard = (
    course: LandingCourseCard,
    absoluteIndex: number
  ) => (
    <button
      type="button"
      onClick={() => handleCourseCardClick(course, absoluteIndex)}
      className="w-full h-full text-left"
    >
      <Card className="h-[30rem] flex flex-col overflow-hidden rounded-2xl !border-slate-500 bg-slate-300 dark:bg-slate-900 p-0 shadow-sm transition-all duration-300 hover:border-eden-accent hover:shadow-[0_0_0_1px_rgba(34,211,238,0.45),0_0_24px_rgba(34,211,238,0.35),0_16px_32px_-18px_rgba(34,211,238,0.65)]">
        <div className="relative w-full h-44 bg-slate-100 overflow-hidden rounded-2xl">
          <img
            src={course.image}
            alt={course.title}
            onError={(event) => {
              const target = event.currentTarget;
              if (target.dataset.fallbackApplied === "true") return;
              target.dataset.fallbackApplied = "true";
              target.src = ASSETS.COURSES.CLOUD;
            }}
            className="block w-full h-full rounded-2xl object-cover"
            style={{ objectPosition: "center 28%" }}
          />
          <div className="absolute top-3 right-3 rounded-full bg-black/65 px-3 py-1 text-[10px] font-black text-white">
            {Number(course.ratingValue || 0) > 0
              ? `${Number(course.ratingValue || 0).toFixed(1)} ★`
              : "N/A"}
          </div>
          <div className="absolute top-3 left-3 rounded-full bg-black/65 px-3 py-1 text-[10px] font-black text-white">
            {(course.enrolledStudents || 0).toLocaleString()}{" "}
            {isEn ? "Students" : "طالب"}
          </div>
        </div>

        <div className="p-4 flex-1 flex flex-col">
          <div className="flex items-center gap-2">
            <img
              src={course.instructorImage || ASSETS.LOGO}
              alt={course.instructorName || "Instructor"}
              className="h-8 w-8 rounded-full object-cover border border-slate-300"
              onError={(event) => {
                const target = event.currentTarget;
                if (target.dataset.fallbackApplied === "true") return;
                target.dataset.fallbackApplied = "true";
                target.src = ASSETS.LOGO;
              }}
            />
            <p className="text-xs font-bold text-slate-700 truncate">
              {course.instructorName || (isEn ? "Instructor" : "المحاضر")}
            </p>
          </div>

          <h3 className="mt-3 w-full text-slate-900 font-black leading-relaxed line-clamp-2 min-h-[3.5rem]">
            {course.title}
          </h3>
          <p className="mt-2 text-xs text-slate-600 line-clamp-2 min-h-[2.6rem]">
            {course.description}
          </p>
          <p className="mt-2 text-[11px] font-bold text-slate-700">
            {course.durationLabel || (isEn ? "Duration not set" : "المدة غير محددة")}
          </p>

          <div className="mt-3 grid grid-cols-3 gap-2">
            <div className="rounded-lg bg-white/80 px-2 py-2 text-center">
              <p className="text-[9px] font-black text-slate-500 uppercase">{isEn ? "Live" : "لايف"}</p>
              <p className="mt-1 text-[10px] font-black text-slate-900">
                {formatLandingPrice(course.priceLive)}
              </p>
            </div>
            <div className="rounded-lg bg-white/80 px-2 py-2 text-center">
              <p className="text-[9px] font-black text-slate-500 uppercase">{isEn ? "Offline" : "أوفلاين"}</p>
              <p className="mt-1 text-[10px] font-black text-slate-900">
                {formatLandingPrice(course.priceOffline)}
              </p>
            </div>
            <div className="rounded-lg bg-white/80 px-2 py-2 text-center">
              <p className="text-[9px] font-black text-slate-500 uppercase">{isEn ? "Recorded" : "مسجلة"}</p>
              <p className="mt-1 text-[10px] font-black text-slate-900">
                {formatLandingPrice(course.priceRecorded)}
              </p>
            </div>
          </div>

          <span className="mt-auto pt-4 text-[11px] font-black text-eden-accent uppercase tracking-[0.08em]">
            {isEn ? "Open Course Details" : "عرض تفاصيل الكورس"}
          </span>
        </div>
      </Card>
    </button>
  );

  const visibleProjectCards = isLandingPage
    ? projectCards.slice(0, 3)
    : projectCards;
  const visibleBlogCards = isLandingPage ? blogCards.slice(0, 3) : blogCards;

  return (
    <div className={`landing-phosphor-mode relative min-h-screen bg-white ${!isEn ? "rtl" : ""}`}>
      <nav className="fixed -top-1 left-0 right-0 z-50 h-20 bg-white/90 backdrop-blur-xl border-b border-slate-200">
        <div className="max-w-7xl mx-auto h-full px-4 lg:px-6 flex items-center justify-between gap-4">
          <button
            className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity"
            onClick={handleLogoClick}
            onMouseEnter={() => setHoveredNavSection(null)}
          >
            <img src={ASSETS.LOGO} alt="Geo Top Logo" className="h-12 w-12 object-contain rounded-full" />
            <span className="font-black text-2xl text-eden-accent">Geo Top</span>
          </button>

          <div
            className="relative hidden h-full lg:flex items-center gap-6"
            onMouseLeave={() => setHoveredNavSection(null)}
          >
            {content.navItems.map((item) => {
              if (item.id === "services" && isLandingPage) {
                return (
                  <div
                    key={item.id}
                    ref={servicesMenuRef}
                    className="relative flex items-center"
                    onMouseEnter={() => {
                      setHoveredNavSection("services");
                    }}
                    onMouseLeave={() => {
                      setHoveredNavSection(null);
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => {
                        setHoveredNavSection("services");
                        setActiveSection("services");
                        setServicesMenuOpen((prev) => !prev);
                      }}
                      onMouseEnter={() => setHoveredNavSection("services")}
                      className={`relative inline-flex h-10 items-center gap-1.5 border-0 px-0 text-sm font-bold leading-none whitespace-nowrap transition-colors after:content-[''] after:absolute after:-bottom-1 after:left-0 after:h-0.5 after:rounded-full after:bg-eden-accent after:transition-all ${
                        activeSection === "services" || servicesMenuOpen
                          ? "text-eden-accent after:w-full"
                          : "text-slate-600 hover:text-eden-accent after:w-0 hover:after:w-full"
                      }`}
                    >
                      <span>{item.label}</span>
                      <ChevronDown
                        size={14}
                        className={`transition-transform duration-200 ${
                          servicesMenuOpen ? "rotate-180" : ""
                        }`}
                      />
                    </button>

                    <AnimatePresence>
                      {servicesMenuOpen && (
                        <motion.div
                          initial={{ opacity: 0, y: 8, scale: 0.98 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 8, scale: 0.98 }}
                          transition={{ duration: 0.16, ease: "easeOut" }}
                          className={`absolute top-full mt-3 z-50 w-72 rounded-2xl border border-slate-200 bg-white shadow-[0_22px_48px_rgba(15,23,42,0.2)] overflow-hidden ${
                            isEn ? "left-0" : "right-0"
                          }`}
                        >
                          <div className="max-h-[22rem] overflow-y-auto py-1">
                            {serviceCards.map((service) => (
                              <button
                                key={service.id}
                                type="button"
                                onClick={() => openServicePage(service)}
                                className={`w-full px-4 py-3 text-sm font-semibold text-slate-700 transition-colors hover:bg-eden-accent/10 hover:text-eden-accent ${
                                  !isEn ? "text-right" : "text-left"
                                }`}
                              >
                                {service.title}
                              </button>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              }

              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setServicesMenuOpen(false);
                    const isContentPageLink =
                      item.id === "services" ||
                      item.id === "courses" ||
                      item.id === "projects" ||
                      item.id === "blog";

                    if (item.id === "contact") {
                      setActiveSection("contact");
                      if (!isContactPage && onOpenContactPage) {
                        onOpenContactPage();
                        return;
                      }
                      if (isContactPage) return;
                    }

                    if (!isLandingPage) {
                      if (isContentPageLink && onOpenContentPage) {
                        onOpenContentPage(item.id as LandingContentPageId);
                        return;
                      }
                      if (onOpenLandingSection) {
                        onOpenLandingSection(item.id as Exclude<LandingSectionId, "contact">);
                      }
                      return;
                    }

                    setActiveSection(item.id as LandingSectionId);
                    scrollToSection(item.id);
                  }}
                  onMouseEnter={() =>
                    setHoveredNavSection(item.id as LandingSectionId)
                  }
                  onMouseLeave={() => setHoveredNavSection(null)}
                  className={`relative inline-flex h-10 items-center border-0 px-0 text-sm font-bold leading-none whitespace-nowrap transition-colors after:content-[''] after:absolute after:-bottom-1 after:left-0 after:h-0.5 after:rounded-full after:bg-eden-accent after:transition-all ${
                    activeSection === item.id
                      ? "text-eden-accent after:w-full"
                      : "text-slate-600 hover:text-eden-accent after:w-0 hover:after:w-full"
                  }`}
                >
                  {item.label}
                </button>
              );
            })}

          </div>

          <div className="flex items-center gap-3">
            <button onClick={toggleLang} className="text-xs font-bold text-slate-600 hover:text-eden-accent transition-colors">
              {isEn ? "\u0627\u0644\u0639\u0631\u0628\u064a\u0629" : "English"}
            </button>
            <button
              onClick={toggleTheme}
              className="p-2.5 bg-slate-100 rounded-xl text-slate-400 hover:text-eden-accent hover:border-eden-accent transition-all border border-slate-200"
              aria-label={isEn ? "Toggle theme" : "ØªØ¨Ø¯ÙŠÙ„ Ø§Ù„Ù…Ø¸Ù‡Ø±"}
            >
              {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
            </button>
            <button
              onClick={onLoginClick}
              className="hidden sm:block text-xs font-bold text-slate-600 hover:text-eden-accent transition-colors"
            >
              {content.login}
            </button>
            <Button onClick={onJoinClick} className="!h-10 !px-5">
              {content.joinNow}
            </Button>
          </div>
        </div>
      </nav>

      <main className="flex flex-col">
      {!isContactPage && (
      <>

      {isLandingPage && (
      <section
        id="home"
        className={`relative order-1 mt-20 h-[calc(100vh-5rem)] min-h-[42rem] overflow-hidden bg-black ${neonSectionDividerClass}`}
      >
        <video
          className="absolute inset-0 h-full w-full object-contain"
          autoPlay
          muted
          loop
          playsInline
          poster={ASSETS.HERO_BG}
          preload="auto"
          aria-hidden="true"
        >
          <source src={HERO_VIDEO_MOBILE} type="video/mp4" media="(max-width: 1024px)" />
          <source src={HERO_VIDEO_DESKTOP} type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-black/40" />
        <div className="absolute inset-x-0 bottom-0 h-56 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />

        <div className="relative z-10 mx-auto flex h-full max-w-7xl flex-col items-center justify-end px-4 pb-14 text-center lg:px-6 md:pb-16">
          <Reveal>
            <h1 className="text-4xl md:text-6xl font-black text-white leading-tight drop-shadow-[0_4px_16px_rgba(2,6,23,0.65)]">
              {content.heroTitle}
            </h1>
            <h2 className="mt-3 text-2xl md:text-5xl font-semibold text-white leading-tight drop-shadow-[0_4px_14px_rgba(2,6,23,0.55)]">
              {content.heroSubtitle}
            </h2>
            <p className="mt-5 max-w-3xl mx-auto text-slate-100 text-lg">
              {content.heroDesc}
            </p>
            <div className="mt-7 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button onClick={() => scrollToSection("courses")} className="!h-12 !px-8">
                {content.viewCourses}{" "}
                <ArrowRight size={18} className={`${!isEn ? "rotate-180 mr-2" : "ml-2"}`} />
              </Button>
              <Button
                onClick={onJoinClick}
                variant="secondary"
                className="!h-12 !px-8 !bg-white !border-white/95 !text-slate-900 hover:!bg-slate-100 hover:!text-slate-900 shadow-[0_10px_28px_-14px_rgba(255,255,255,0.95)]"
              >
                {content.joinPrograms}
              </Button>
            </div>
          </Reveal>
        </div>
      </section>
      )}

      {(isLandingPage || isCoursesPage) && (
      <section
        id="courses"
        className={`order-3 bg-white px-4 py-20 lg:px-6 ${neonSectionDividerClass} ${
          isCoursesPage ? "mt-20" : ""
        }`}
      >
        <div className="max-w-7xl mx-auto">
          <Reveal width="100%">
            <div className="mb-10 text-center">
              <h2 className="text-3xl font-black text-eden-accent md:text-4xl">{content.coursesTitle}</h2>
              <p className="mx-auto mt-3 max-w-3xl text-slate-600">{content.coursesDesc}</p>
            </div>
          </Reveal>

          {isCoursesPage ? (
            orderedCourses.length > 0 ? (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 items-stretch">
                {orderedCourses.map((course, index) => (
                  <Reveal key={`${course.title}-${index}`} delay={index * 0.02} width="100%">
                    {renderLandingCourseCard(course, index)}
                  </Reveal>
                ))}
              </div>
            ) : (
              <Card className="rounded-2xl border border-slate-200 p-8 text-center">
                <p className="text-sm font-bold text-slate-600">
                  {isEn
                    ? "No landing courses published yet. Instructors can add courses from dashboard."
                    : "لا توجد دورات منشورة على اللاندنج بعد. يمكن للمدرب إضافتها من الداشبورد."}
                </p>
              </Card>
            )
          ) : (
            <div className="relative overflow-hidden">
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={`${activeCategory}-${currentIndex}`}
                  initial={{ x: slideDirection > 0 ? 140 : -140, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: slideDirection > 0 ? -140 : 140, opacity: 0 }}
                  transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
                  className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch"
                >
                  {visibleCourses.map((course, index) => (
                    <Reveal key={`${course.title}-${currentIndex + index}`} delay={index * 0.03} width="100%">
                      {renderLandingCourseCard(course, currentIndex + index)}
                    </Reveal>
                  ))}
                </motion.div>
              </AnimatePresence>
            </div>
          )}

          {!isCoursesPage && filteredCourses.length > pageSize && (
            <div className="mt-8 flex flex-col items-center justify-center gap-4">
              <div className="flex items-center justify-center gap-2">
                {Array.from({ length: totalSlides }).map((_, slideIndex) => {
                  const isActive = slideIndex === currentSlideIndex;
                  return (
                    <button
                      key={`slide-dot-${slideIndex}`}
                      type="button"
                      onClick={() => handleSlideDotClick(slideIndex)}
                      aria-label={`Slide ${slideIndex + 1}`}
                      className={`h-2.5 rounded-full transition-all ${
                        isActive
                          ? "w-8 bg-eden-accent"
                          : "w-2.5 bg-slate-300 hover:bg-slate-400"
                      }`}
                    />
                  );
                })}
              </div>

              <div className="flex items-center justify-center gap-4">
                <Button
                  variant="secondary"
                  onClick={handleSlidePrev}
                  disabled={currentIndex === 0}
                  className="!h-11 !w-11 !p-0 bg-white border border-slate-200 text-slate-700 hover:border-eden-accent hover:text-eden-accent hover:bg-eden-accent/10 disabled:opacity-40"
                >
                  {isEn ? <ArrowLeft size={20} /> : <ArrowRight size={20} />}
                </Button>
                <Button
                  variant="secondary"
                  onClick={handleSlideNext}
                  disabled={currentIndex >= maxStartIndex}
                  className="!h-11 !w-11 !p-0 bg-white border border-slate-200 text-slate-700 hover:border-eden-accent hover:text-eden-accent hover:bg-eden-accent/10 disabled:opacity-40"
                >
                  {isEn ? <ArrowRight size={20} /> : <ArrowLeft size={20} />}
                </Button>
              </div>
            </div>
          )}

          {isLandingPage && onOpenContentPage && (
            <div className="mt-8 flex justify-center">
              <button
                type="button"
                onClick={() => onOpenContentPage("courses")}
                className="inline-flex h-11 items-center gap-2 rounded-xl border border-slate-300 bg-white px-6 text-sm font-black uppercase tracking-[0.12em] text-slate-700 transition-all hover:border-eden-accent hover:text-eden-accent"
              >
                <span>{viewMoreContent.courses}</span>
                {isEn ? <ArrowRight size={15} /> : <ArrowLeft size={15} />}
              </button>
            </div>
          )}
        </div>
      </section>
      )}

      {(isLandingPage || isServicesPage) && (
      <section
        id="services"
        className={`order-2 bg-white px-4 py-16 lg:px-6 ${neonSectionDividerClass} ${
          isServicesPage ? "mt-20" : ""
        }`}
      >
        <div className="max-w-7xl mx-auto">
          <div className="mb-10 text-center">
            <h2 className="text-3xl md:text-4xl font-black text-eden-accent">
              {servicesContent.title}
            </h2>
            <p className="mt-3 text-xl text-slate-700 font-semibold">
              {servicesContent.subtitle}
            </p>
            <p className="mt-4 max-w-4xl mx-auto text-sm md:text-base text-slate-600">
              "{servicesContent.quote}"
            </p>
          </div>

          {selectedService ? (
            <Reveal width="100%">
              <div
                className={`mx-auto w-full max-w-6xl rounded-3xl border border-slate-500 bg-slate-300 dark:bg-slate-900 p-5 shadow-[0_18px_42px_rgba(15,23,42,0.18)] md:p-7 ${
                  !isEn ? "text-right rtl" : ""
                }`}
              >
                <button
                  type="button"
                  onClick={closeServicePage}
                  className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 text-xs font-black uppercase tracking-[0.14em] text-slate-700 transition-all hover:border-eden-accent hover:text-eden-accent"
                >
                  {isEn ? <ArrowLeft size={14} /> : <ArrowRight size={14} />}
                  <span>{isEn ? "Back to Services" : "Ø§Ù„Ø±Ø¬ÙˆØ¹ Ù„Ù„Ø®Ø¯Ù…Ø§Øª"}</span>
                </button>

                <div className="mt-5 grid grid-cols-1 gap-6 lg:grid-cols-[1.2fr,1fr] lg:items-stretch">
                  <div className="h-[19rem] overflow-hidden rounded-2xl border border-slate-200 bg-slate-100 md:h-[24rem]">
                    <img
                      src={selectedService.image}
                      alt={selectedService.title}
                      onError={(event) => {
                        const target = event.currentTarget;
                        if (target.dataset.fallbackApplied === "true") return;
                        target.dataset.fallbackApplied = "true";
                        target.src = ASSETS.COURSES.CLOUD;
                      }}
                      className="h-full w-full rounded-2xl object-cover"
                    />
                  </div>

                  <div className={`flex flex-col ${!isEn ? "items-end" : "items-start"}`}>
                    <h3 className="text-3xl font-black text-slate-900 md:text-4xl">
                      {selectedService.title}
                    </h3>
                    <p className="mt-4 text-base leading-8 text-slate-700">
                      {selectedService.details}
                    </p>
                    <p className="mt-3 text-sm leading-7 text-slate-600">
                      {selectedService.description}
                    </p>

                    <div
                      className={`mt-6 flex w-full flex-col gap-3 sm:flex-row ${
                        !isEn ? "sm:flex-row-reverse" : ""
                      }`}
                    >
                      <Button
                        onClick={() => {
                          if (onOpenContactPage) {
                            onOpenContactPage();
                            return;
                          }
                          scrollToSection("contact");
                        }}
                        className="!h-11 !px-6"
                      >
                        {servicesContent.requestLabel}
                      </Button>
                      <button
                        type="button"
                        onClick={onExploreClick}
                        className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-5 text-sm font-bold text-slate-700 transition-colors hover:border-eden-accent hover:text-eden-accent"
                      >
                        {servicesContent.exploreLabel}
                        {isEn ? <ArrowRight size={16} /> : <ArrowLeft size={16} />}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="mt-7 border-t border-slate-200 pt-5">
                  <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">
                    {isEn ? "Other Services" : "Ø®Ø¯Ù…Ø§Øª Ø£Ø®Ø±Ù‰"}
                  </p>
                  <div className={`mt-3 flex flex-wrap gap-2 ${!isEn ? "justify-end" : ""}`}>
                    {serviceCards
                      .filter((service) => service.id !== selectedService.id)
                      .map((service) => (
                        <button
                          key={service.id}
                          type="button"
                          onClick={() => openServicePage(service)}
                          className="inline-flex items-center gap-1 rounded-full border border-slate-300 bg-white px-3 py-1.5 text-xs font-bold text-slate-600 transition-all hover:border-eden-accent hover:text-eden-accent"
                        >
                          <span>{service.title}</span>
                          {isEn ? <ArrowRight size={12} /> : <ArrowLeft size={12} />}
                        </button>
                      ))}
                  </div>
                </div>
              </div>
            </Reveal>
          ) : (
            <>
              <div className="grid grid-cols-1 items-stretch gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {visibleServices.map((service, index) => (
                  <Reveal key={service.id} delay={index * 0.02} width="100%">
                    <motion.button
                      type="button"
                      onClick={() => openServicePage(service)}
                      whileHover={{ y: -5 }}
                      whileTap={{ scale: 0.99 }}
                      className={`flex h-full min-h-[18.5rem] w-full flex-col rounded-2xl border border-slate-500 bg-slate-300 dark:bg-slate-900 p-3 text-left shadow-[0_2px_12px_rgba(15,23,42,0.14)] transition-all duration-300 hover:border-eden-accent hover:shadow-[0_10px_28px_rgba(0,123,255,0.25)] ${
                        !isEn ? "text-right" : ""
                      }`}
                    >
                      <div className="h-44 w-full overflow-hidden rounded-2xl border border-slate-300 bg-slate-300 dark:bg-slate-800">
                        <img
                          src={service.image}
                          alt={service.title}
                          onError={(event) => {
                            const target = event.currentTarget;
                            if (target.dataset.fallbackApplied === "true") return;
                            target.dataset.fallbackApplied = "true";
                            target.src = ASSETS.COURSES.CLOUD;
                          }}
                          className="h-full w-full rounded-2xl object-cover"
                        />
                      </div>
                      <h3 className="mt-4 min-h-[3rem] text-xl font-black text-slate-900 line-clamp-2">
                        {service.title}
                      </h3>
                      <p className="mt-2 min-h-[3.5rem] text-sm leading-6 text-slate-700 line-clamp-3">
                        {service.description}
                      </p>
                      <span className="mt-auto inline-flex items-center gap-2 pt-4 text-sm font-bold text-eden-accent">
                        {servicesContent.openLabel}
                        {isEn ? <ArrowRight size={16} /> : <ArrowLeft size={16} />}
                      </span>
                    </motion.button>
                  </Reveal>
                ))}
              </div>

              {isLandingPage && onOpenContentPage && (
                <div className="mt-8 flex justify-center">
                  <button
                    type="button"
                    onClick={() => onOpenContentPage("services")}
                    className="inline-flex h-11 items-center gap-2 rounded-xl border border-slate-300 bg-white px-6 text-sm font-black uppercase tracking-[0.12em] text-slate-700 transition-all hover:border-eden-accent hover:text-eden-accent"
                  >
                    <span>{viewMoreContent.services}</span>
                    {isEn ? <ArrowRight size={15} /> : <ArrowLeft size={15} />}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </section>
      )}

      {(isLandingPage || isProjectsPage || isProjectDetailPage) && (
      <section
        id="projects"
        className={`order-4 bg-white px-4 py-20 lg:px-6 ${neonSectionDividerClass} ${
          isProjectsPage || isProjectDetailPage ? "mt-20" : ""
        }`}
      >
        <div className="max-w-7xl mx-auto">
          <Reveal width="100%">
            <div className="mb-10 text-center">
              <h2 className="text-3xl md:text-4xl font-black text-eden-accent">
                {projectsContent.title}
              </h2>
              <p className="mx-auto mt-3 max-w-3xl text-slate-600">
                {projectsContent.subtitle}
              </p>
            </div>
          </Reveal>

          {isProjectDetailPage ? (
            selectedProjectItem ? (
              <Reveal width="100%">
                <Card className="mx-auto max-w-5xl rounded-2xl border border-slate-500 bg-slate-300 dark:bg-slate-900 p-5 shadow-[0_16px_36px_rgba(15,23,42,0.18)] md:p-7">
                  <button
                    type="button"
                    onClick={handleBackToProjectsPage}
                    className={`inline-flex h-10 items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 text-xs font-black uppercase tracking-[0.14em] text-slate-700 transition-all hover:border-eden-accent hover:text-eden-accent ${
                      !isEn ? "flex-row-reverse" : ""
                    }`}
                  >
                    {isEn ? <ArrowLeft size={14} /> : <ArrowRight size={14} />}
                    <span>{isEn ? "Back to Projects" : "الرجوع إلى المشاريع"}</span>
                  </button>

                  <div className="mt-5 grid grid-cols-1 gap-6 lg:grid-cols-[1.25fr,1fr]">
                    <div className="h-[18rem] overflow-hidden rounded-2xl border border-slate-300 bg-slate-100 md:h-[24rem]">
                      <img
                        src={selectedProjectItem.image}
                        alt={selectedProjectItem.title}
                        onError={(event) => {
                          const target = event.currentTarget;
                          if (target.dataset.fallbackApplied === "true") return;
                          target.dataset.fallbackApplied = "true";
                          target.src = ASSETS.COURSES.CLOUD;
                        }}
                        className="h-full w-full object-cover"
                      />
                    </div>

                    <div className={!isEn ? "text-right" : ""}>
                      <span className="inline-flex rounded-full border border-eden-accent/30 bg-eden-accent/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-eden-accent">
                        {selectedProjectItem.category}
                      </span>
                      <h3 className="mt-3 text-2xl font-black text-slate-900 md:text-3xl">
                        {selectedProjectItem.title}
                      </h3>
                      <p className="mt-4 text-sm leading-7 text-slate-700">
                        {selectedProjectItem.summary}
                      </p>
                      <p className="mt-3 text-sm leading-7 text-slate-700 whitespace-pre-line">
                        {selectedProjectItem.description}
                      </p>

                      {selectedProjectItem.clientName && (
                        <p className="mt-4 text-xs font-bold text-slate-600">
                          {isEn ? "Client:" : "العميل:"} {selectedProjectItem.clientName}
                        </p>
                      )}

                      <div
                        className={`mt-5 flex flex-wrap gap-3 ${
                          !isEn ? "justify-end" : ""
                        }`}
                      >
                        {selectedProjectItem.pdfUrl && (
                          <a
                            href={selectedProjectItem.pdfUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex h-10 items-center rounded-xl border border-slate-300 bg-white px-4 text-xs font-black uppercase tracking-[0.12em] text-slate-700 transition-all hover:border-eden-accent hover:text-eden-accent"
                          >
                            {isEn ? "Open Project PDF" : "فتح ملف المشروع PDF"}
                          </a>
                        )}
                        {selectedProjectItem.externalUrl && (
                          <a
                            href={selectedProjectItem.externalUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex h-10 items-center rounded-xl border border-eden-accent bg-eden-accent px-4 text-xs font-black uppercase tracking-[0.12em] text-white transition-all hover:bg-eden-accent/90"
                          >
                            {isEn ? "Open Live Link" : "فتح رابط المشروع"}
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              </Reveal>
            ) : (
              <Card className="mx-auto max-w-3xl rounded-2xl border border-slate-200 p-8 text-center">
                <p className="text-sm font-bold text-slate-600">
                  {isEn
                    ? "This project is not available or was unpublished."
                    : "هذا المشروع غير متاح حالياً أو تم إلغاء نشره."}
                </p>
                <button
                  type="button"
                  onClick={handleBackToProjectsPage}
                  className="mt-5 inline-flex h-10 items-center rounded-xl border border-slate-300 bg-white px-4 text-xs font-black uppercase tracking-[0.12em] text-slate-700 transition-all hover:border-eden-accent hover:text-eden-accent"
                >
                  {isEn ? "Back to Projects" : "الرجوع إلى المشاريع"}
                </button>
              </Card>
            )
          ) : (
            <>
              {visibleProjectCards.length > 0 ? (
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
                  {visibleProjectCards.map((project, index) => (
                    <Reveal key={`${project.slug}-${project.id}`} delay={index * 0.04} width="100%">
                      <button
                        type="button"
                        onClick={() => handleProjectCardClick(project)}
                        className="w-full h-full text-left"
                      >
                        <Card className="h-full overflow-hidden rounded-2xl !border-slate-500 bg-slate-300 dark:bg-slate-900 p-0 shadow-sm transition-all duration-300 hover:border-eden-accent hover:shadow-[0_0_0_1px_rgba(34,211,238,0.45),0_0_24px_rgba(34,211,238,0.28)]">
                          <div className="h-44 w-full overflow-hidden border-b border-slate-300 bg-slate-100">
                            <img
                              src={project.image}
                              alt={project.title}
                              onError={(event) => {
                                const target = event.currentTarget;
                                if (target.dataset.fallbackApplied === "true") return;
                                target.dataset.fallbackApplied = "true";
                                target.src = ASSETS.COURSES.CLOUD;
                              }}
                              className="h-full w-full object-cover"
                            />
                          </div>

                          <div className="flex h-[calc(100%-11rem)] flex-col p-5">
                            <span className="inline-flex w-fit rounded-full border border-eden-accent/30 bg-eden-accent/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-eden-accent">
                              {project.category}
                            </span>
                            <h3 className="mt-4 text-xl font-black text-slate-900 line-clamp-2">
                              {project.title}
                            </h3>
                            <p className="mt-3 text-sm leading-7 text-slate-700 line-clamp-3">
                              {project.summary}
                            </p>
                            {project.clientName && (
                              <p className="mt-2 text-xs font-semibold text-slate-600">
                                {isEn ? "Client:" : "العميل:"} {project.clientName}
                              </p>
                            )}
                            <span className="mt-auto pt-4 text-[11px] font-black uppercase tracking-[0.08em] text-eden-accent">
                              {isEn ? "Open Project Details" : "عرض تفاصيل المشروع"}
                            </span>
                          </div>
                        </Card>
                      </button>
                    </Reveal>
                  ))}
                </div>
              ) : (
                <Card className="rounded-2xl border border-slate-200 p-8 text-center">
                  <p className="text-sm font-bold text-slate-600">
                    {isEn
                      ? "No projects published yet."
                      : "لا توجد مشاريع منشورة حالياً."}
                  </p>
                </Card>
              )}

              {isLandingPage && onOpenContentPage && (
                <div className="mt-8 flex justify-center">
                  <button
                    type="button"
                    onClick={() => onOpenContentPage("projects")}
                    className="inline-flex h-11 items-center gap-2 rounded-xl border border-slate-300 bg-white px-6 text-sm font-black uppercase tracking-[0.12em] text-slate-700 transition-all hover:border-eden-accent hover:text-eden-accent"
                  >
                    <span>{viewMoreContent.projects}</span>
                    {isEn ? <ArrowRight size={15} /> : <ArrowLeft size={15} />}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </section>
      )}

      {(isLandingPage || isBlogPage || isBlogDetailPage) && (
      <section
        id="blog"
        className={`order-5 bg-white px-4 py-20 lg:px-6 ${neonSectionDividerClass} ${
          isBlogPage || isBlogDetailPage ? "mt-20" : ""
        }`}
      >
        <div className="max-w-7xl mx-auto">
          <Reveal width="100%">
            <div className="mb-10 text-center">
              <h2 className="text-3xl md:text-4xl font-black text-eden-accent">
                {blogContent.title}
              </h2>
              <p className="mx-auto mt-3 max-w-3xl text-slate-600">
                {blogContent.subtitle}
              </p>
            </div>
          </Reveal>

          {isBlogDetailPage ? (
            selectedBlogPost ? (
              <Reveal width="100%">
                <Card className="mx-auto max-w-5xl overflow-hidden rounded-2xl border border-slate-500 bg-slate-300 dark:bg-slate-900 p-0 shadow-[0_16px_36px_rgba(15,23,42,0.18)]">
                  <div className="h-64 w-full overflow-hidden border-b border-slate-300 bg-slate-100 md:h-80">
                    <img
                      src={selectedBlogPost.image}
                      alt={selectedBlogPost.title}
                      onError={(event) => {
                        const target = event.currentTarget;
                        if (target.dataset.fallbackApplied === "true") return;
                        target.dataset.fallbackApplied = "true";
                        target.src = ASSETS.COURSES.CLOUD;
                      }}
                      className="h-full w-full object-cover"
                    />
                  </div>

                  <div className={`p-6 md:p-8 ${!isEn ? "text-right" : ""}`}>
                    <button
                      type="button"
                      onClick={handleBackToBlogPage}
                      className={`inline-flex h-10 items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 text-xs font-black uppercase tracking-[0.14em] text-slate-700 transition-all hover:border-eden-accent hover:text-eden-accent ${
                        !isEn ? "flex-row-reverse" : ""
                      }`}
                    >
                      {isEn ? <ArrowLeft size={14} /> : <ArrowRight size={14} />}
                      <span>{isEn ? "Back to Blog" : "الرجوع إلى البلوج"}</span>
                    </button>

                    <h3 className="mt-5 text-3xl font-black leading-tight text-slate-900">
                      {selectedBlogPost.title}
                    </h3>

                    <div
                      className={`mt-4 flex flex-wrap items-center gap-2 ${
                        !isEn ? "justify-end" : ""
                      }`}
                    >
                      <span className="inline-flex rounded-full border border-eden-accent/30 bg-eden-accent/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-eden-accent">
                        {selectedBlogPost.authorName || (isEn ? "Geo Top Team" : "فريق جيو توب")}
                      </span>
                      <span className="inline-flex rounded-full border border-slate-300 bg-white px-3 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-slate-600">
                        {selectedBlogPost.readTimeMinutes || 5} {isEn ? "MIN READ" : "دقائق قراءة"}
                      </span>
                    </div>

                    <p className="mt-4 text-sm font-semibold leading-7 text-slate-700">
                      {selectedBlogPost.summary}
                    </p>

                    <div className="mt-5 space-y-3 text-sm leading-7 text-slate-700">
                      {selectedBlogPost.content
                        .split(/\n+/)
                        .map((paragraph) => paragraph.trim())
                        .filter(Boolean)
                        .map((paragraph, index) => (
                          <p key={`blog-p-${index}`}>{paragraph}</p>
                        ))}
                    </div>

                    {(selectedBlogPost.resourceLinks.length > 0 ||
                      selectedBlogPost.resourceFileUrl) && (
                      <div className="mt-7 rounded-2xl border border-slate-300 bg-white/70 p-4">
                        <p className="text-[11px] font-black uppercase tracking-[0.14em] text-slate-600">
                          {isEn ? "Resources" : "المصادر"}
                        </p>

                        {selectedBlogPost.resourceLinks.length > 0 && (
                          <div className="mt-3 flex flex-wrap gap-2">
                            {selectedBlogPost.resourceLinks.map((link, index) => (
                              <a
                                key={`${link}-${index}`}
                                href={link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex h-9 items-center rounded-lg border border-slate-300 bg-white px-3 text-xs font-semibold text-slate-700 transition-colors hover:border-eden-accent hover:text-eden-accent"
                              >
                                {isEn ? `Reference ${index + 1}` : `مرجع ${index + 1}`}
                              </a>
                            ))}
                          </div>
                        )}

                        {selectedBlogPost.resourceFileUrl && (
                          <a
                            href={selectedBlogPost.resourceFileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-3 inline-flex h-9 items-center rounded-lg border border-eden-accent bg-eden-accent px-3 text-xs font-semibold text-white transition-colors hover:bg-eden-accent/90"
                          >
                            {isEn ? "Download Attached Resource" : "تحميل الملف المرفق"}
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                </Card>
              </Reveal>
            ) : (
              <Card className="mx-auto max-w-3xl rounded-2xl border border-slate-200 p-8 text-center">
                <p className="text-sm font-bold text-slate-600">
                  {isEn
                    ? "This blog post is not available or was unpublished."
                    : "هذا المقال غير متاح حالياً أو تم إلغاء نشره."}
                </p>
                <button
                  type="button"
                  onClick={handleBackToBlogPage}
                  className="mt-5 inline-flex h-10 items-center rounded-xl border border-slate-300 bg-white px-4 text-xs font-black uppercase tracking-[0.12em] text-slate-700 transition-all hover:border-eden-accent hover:text-eden-accent"
                >
                  {isEn ? "Back to Blog" : "الرجوع إلى البلوج"}
                </button>
              </Card>
            )
          ) : (
            <>
              {visibleBlogCards.length > 0 ? (
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                  {visibleBlogCards.map((post, index) => (
                    <Reveal key={`${post.slug}-${post.id}`} delay={index * 0.05} width="100%">
                      <button
                        type="button"
                        onClick={() => handleBlogCardClick(post)}
                        className="w-full h-full text-left"
                      >
                        <article className="h-full overflow-hidden rounded-2xl border border-slate-500 bg-slate-300 dark:bg-slate-900 shadow-sm transition-all duration-300 hover:border-eden-accent hover:shadow-[0_0_0_1px_rgba(34,211,238,0.45),0_0_24px_rgba(34,211,238,0.28)]">
                          <div className="h-44 overflow-hidden border-b border-slate-300 bg-slate-100">
                            <img
                              src={post.image}
                              alt={post.title}
                              onError={(event) => {
                                const target = event.currentTarget;
                                if (target.dataset.fallbackApplied === "true") return;
                                target.dataset.fallbackApplied = "true";
                                target.src = ASSETS.COURSES.CLOUD;
                              }}
                              className="h-full w-full object-cover"
                            />
                          </div>

                          <div className="p-5">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="inline-flex rounded-full border border-eden-accent/30 bg-eden-accent/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-eden-accent">
                                {post.authorName || (isEn ? "Geo Top Team" : "فريق جيو توب")}
                              </span>
                              <span className="inline-flex rounded-full border border-slate-300 bg-white px-3 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-slate-600">
                                {post.readTimeMinutes || 5} {isEn ? "MIN READ" : "دقائق قراءة"}
                              </span>
                            </div>
                            <h3 className="mt-4 text-xl font-black leading-snug text-slate-900 line-clamp-2">
                              {post.title}
                            </h3>
                            <p className="mt-3 text-sm leading-7 text-slate-700 line-clamp-3">
                              {post.summary}
                            </p>
                            <span className="mt-4 inline-flex text-[11px] font-black uppercase tracking-[0.08em] text-eden-accent">
                              {isEn ? "Read Article" : "قراءة المقال"}
                            </span>
                          </div>
                        </article>
                      </button>
                    </Reveal>
                  ))}
                </div>
              ) : (
                <Card className="rounded-2xl border border-slate-200 p-8 text-center">
                  <p className="text-sm font-bold text-slate-600">
                    {isEn ? "No blog posts published yet." : "لا توجد مقالات منشورة حالياً."}
                  </p>
                </Card>
              )}

              {isLandingPage && onOpenContentPage && (
                <div className="mt-8 flex justify-center">
                  <button
                    type="button"
                    onClick={() => onOpenContentPage("blog")}
                    className="inline-flex h-11 items-center gap-2 rounded-xl border border-slate-300 bg-white px-6 text-sm font-black uppercase tracking-[0.12em] text-slate-700 transition-all hover:border-eden-accent hover:text-eden-accent"
                  >
                    <span>{viewMoreContent.blog}</span>
                    {isEn ? <ArrowRight size={15} /> : <ArrowLeft size={15} />}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </section>
      )}

      {isLandingPage && (
      <section
        id="about"
        className={`order-6 bg-white px-4 py-20 lg:px-6 ${neonSectionDividerClass}`}
      >
        <div className="max-w-7xl mx-auto">
          <div className="mb-10 text-center">
            <h2 className="text-3xl md:text-4xl font-black text-eden-accent">
              {aboutSection.sectionTitle}
            </h2>
          </div>

          <Card className="mb-6 rounded-2xl border border-slate-500 bg-slate-300 dark:bg-slate-900 p-6 md:p-8 shadow-[0_18px_42px_rgba(2,6,23,0.34)]">
            <div className={`grid grid-cols-1 items-center gap-6 lg:grid-cols-[1.45fr,0.9fr] ${!isEn ? "text-right" : "text-left"}`}>
              <div>
                <h3 className="text-4xl font-black text-slate-900 md:text-5xl">{founderMessage.heading}</h3>
                <div className="mt-5 space-y-4">
                  {founderMessage.paragraphs.map((paragraph, index) => (
                    <p key={`${paragraph.slice(0, 20)}-${index}`} className="text-base leading-8 text-slate-800">
                      {paragraph}
                    </p>
                  ))}
                </div>
                <p className="mt-6 text-3xl font-black text-slate-900">{founderMessage.founderName}</p>
                <p className="text-xl font-black text-eden-accent">{founderMessage.founderTitle}</p>
              </div>

              <div className="mx-auto w-full max-w-sm overflow-hidden rounded-[2rem] border border-slate-400 bg-slate-200">
                <img
                  src={founderMessage.imageUrl}
                  alt={founderMessage.founderName}
                  onError={(event) => {
                    const target = event.currentTarget;
                    if (target.dataset.fallbackApplied === "true") return;
                    target.dataset.fallbackApplied = "true";
                    target.src = ASSETS.LOGO;
                  }}
                  className="block h-full w-full object-cover"
                />
              </div>
            </div>
          </Card>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-stretch">
            <Card
              className="rounded-2xl border border-slate-500 bg-slate-300 dark:bg-slate-900 p-6 text-center shadow-[0_18px_42px_rgba(2,6,23,0.34)]"
            >
              <span className="inline-flex rounded-full bg-cyan-400/15 px-3 py-1 text-xs font-bold text-cyan-700">
                {aboutSection.hexVision}
              </span>
              <h3 className="mt-4 text-2xl font-black text-slate-900">
                {aboutSection.visionTitle}
              </h3>
              <p className="mt-3 leading-8 text-slate-700">{aboutSection.visionText}</p>
            </Card>

            <Card
              className="rounded-2xl border border-slate-500 bg-slate-300 dark:bg-slate-900 p-6 text-center shadow-[0_18px_42px_rgba(2,6,23,0.34)]"
            >
              <span className="inline-flex rounded-full bg-amber-300/15 px-3 py-1 text-xs font-bold text-amber-700">
                {aboutSection.hexMission}
              </span>
              <h3 className="mt-4 text-2xl font-black text-slate-900">
                {aboutSection.missionTitle}
              </h3>
              <p className="mt-3 leading-8 text-slate-700">{aboutSection.missionText}</p>
            </Card>

            <Card
              className="rounded-2xl border border-slate-500 bg-slate-300 dark:bg-slate-900 p-6 text-center shadow-[0_18px_42px_rgba(2,6,23,0.34)]"
            >
              <h3 className="text-xl font-black text-slate-900">
                {isEn ? "Core Summary" : "Ø§Ù„Ù…Ù„Ø®Øµ Ø§Ù„Ø³Ø±ÙŠØ¹"}
              </h3>
              <div className="mt-4 space-y-3">
                <p className="rounded-xl border border-cyan-300/25 bg-cyan-400/10 px-3 py-2 text-sm font-semibold text-cyan-700">
                  {`${aboutSection.hexVision}: ${aboutSection.hexVisionShort}`}
                </p>
                <p className="rounded-xl border border-amber-300/25 bg-amber-300/10 px-3 py-2 text-sm font-semibold text-amber-700">
                  {`${aboutSection.hexMission}: ${aboutSection.hexMissionShort}`}
                </p>
                <p className="rounded-xl border border-lime-300/25 bg-lime-300/10 px-3 py-2 text-sm font-semibold text-lime-700">
                  {`${aboutSection.hexGoals}: ${aboutSection.hexGoalsShort}`}
                </p>
              </div>
            </Card>
          </div>

          <Card
            className="mt-6 rounded-2xl border border-slate-500 bg-slate-300 dark:bg-slate-900 p-6 text-center shadow-[0_18px_42px_rgba(2,6,23,0.34)]"
          >
            <h3 className="text-2xl font-black text-slate-900">{aboutSection.goalsTitle}</h3>
            <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-4">
              {aboutSection.goals.map((goal, index) => {
                const isLastOddGoal =
                  aboutSection.goals.length % 2 !== 0 &&
                  index === aboutSection.goals.length - 1;

                return (
                  <div
                    key={goal.title}
                    className={`rounded-xl border border-slate-500 bg-slate-300 dark:bg-slate-900 p-4 text-center ${
                      isLastOddGoal ? "md:col-span-2 md:mx-auto md:w-[calc(50%-0.5rem)]" : ""
                    }`}
                  >
                    <h4 className="text-base font-black text-slate-900">{goal.title}</h4>
                    <p className="mt-2 text-sm leading-7 text-slate-700">{goal.desc}</p>
                  </div>
                );
              })}
            </div>
          </Card>

          <Card className="mt-6 rounded-2xl border border-slate-500 bg-slate-300 dark:bg-slate-900 p-4 md:p-6 text-center shadow-[0_18px_42px_rgba(2,6,23,0.34)]">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
              {aboutImpactStats.map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-xl border border-slate-500 bg-slate-300 dark:bg-slate-900 px-4 py-6"
                >
                  <p className="text-4xl font-black text-slate-900">{stat.value}</p>
                  <p className="mt-2 text-lg font-semibold text-slate-700">{stat.label}</p>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </section>
      )}
      </>
      )}

      {isContactPage && (
        <section
          id="contact"
          className={`order-7 mt-20 bg-white px-4 py-14 lg:px-6 ${neonSectionDividerClass}`}
        >
          <div className={`mx-auto max-w-6xl ${!isEn ? "rtl" : ""}`}>
            <Card className="mx-auto max-w-3xl rounded-2xl border border-slate-500 bg-slate-300 dark:bg-slate-900 p-6 md:p-8">
              <div className="mx-auto max-w-4xl text-center">
                <h2 className="text-4xl font-black text-slate-900 md:text-5xl">
                  {contactSectionContent.title}
                </h2>
                <p className="mt-4 text-sm text-slate-600 md:text-base">
                  {contactSectionContent.note}
                </p>
              </div>

              <form onSubmit={handleContactSubmit} className="mx-auto mt-8 max-w-2xl space-y-5">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <input
                    type="text"
                    value={contactFormData.name}
                    onChange={(event) =>
                      setContactFormData((prev) => ({ ...prev, name: event.target.value }))
                    }
                    placeholder={`${contactSectionContent.name} *`}
                    className="h-14 rounded-xl border border-slate-300 bg-white px-4 text-base text-slate-800 placeholder:text-slate-400 focus:border-eden-accent focus:outline-none"
                    required
                  />
                  <input
                    type="email"
                    value={contactFormData.email}
                    onChange={(event) =>
                      setContactFormData((prev) => ({ ...prev, email: event.target.value }))
                    }
                    placeholder={`${contactSectionContent.email} *`}
                    className="h-14 rounded-xl border border-slate-300 bg-white px-4 text-base text-slate-800 placeholder:text-slate-400 focus:border-eden-accent focus:outline-none"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <input
                    type="text"
                    value={contactFormData.phone}
                    onChange={(event) =>
                      setContactFormData((prev) => ({ ...prev, phone: event.target.value }))
                    }
                    placeholder={contactSectionContent.phone}
                    className="h-14 rounded-xl border border-slate-300 bg-white px-4 text-base text-slate-800 placeholder:text-slate-400 focus:border-eden-accent focus:outline-none"
                  />
                  <input
                    type="text"
                    value={contactFormData.subject}
                    onChange={(event) =>
                      setContactFormData((prev) => ({ ...prev, subject: event.target.value }))
                    }
                    placeholder={contactSectionContent.subject}
                    className="h-14 rounded-xl border border-slate-300 bg-white px-4 text-base text-slate-800 placeholder:text-slate-400 focus:border-eden-accent focus:outline-none"
                  />
                </div>

                <textarea
                  value={contactFormData.message}
                  onChange={(event) =>
                    setContactFormData((prev) => ({ ...prev, message: event.target.value }))
                  }
                  placeholder={`${contactSectionContent.message} *`}
                  rows={7}
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-4 text-base text-slate-800 placeholder:text-slate-400 focus:border-eden-accent focus:outline-none"
                  required
                />

                <button
                  type="submit"
                  className="inline-flex h-14 w-full items-center justify-center gap-2 rounded-xl border border-slate-300 bg-slate-200 text-lg font-semibold text-slate-900 transition-colors hover:border-eden-accent hover:text-eden-accent"
                >
                  <span>{contactSectionContent.send}</span>
                  <Send size={18} />
                </button>
              </form>
            </Card>

            <div className="mx-auto mt-8 max-w-4xl">
              <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-700">
                <MapPin size={16} className="text-eden-accent" />
                <span>{footerContent.location}</span>
              </div>
              <div className="overflow-hidden rounded-xl border border-slate-300 bg-slate-200">
                <iframe
                  title={isEn ? "Geo Top Location Map" : "خريطة موقع جيو توب"}
                  src={locationMapEmbedUrl}
                  className="h-[20rem] w-full border-0"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </div>
            </div>
          </div>
        </section>
      )}

      <footer
        id="footer"
        className="relative order-8 overflow-hidden border-t border-slate-800 bg-slate-950 px-4 py-5 lg:px-6"
      >
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -left-16 -top-24 h-48 w-48 rounded-full bg-eden-accent/12 blur-3xl" />
          <div className="absolute -bottom-20 right-0 h-56 w-56 rounded-full bg-cyan-500/10 blur-3xl" />
          <img
            src={ASSETS.LOGO}
            alt=""
            aria-hidden="true"
            className="absolute left-1/2 top-1/2 h-64 w-64 -translate-x-1/2 -translate-y-1/2 object-contain opacity-[0.14] mix-blend-screen md:h-[26rem] md:w-[26rem] md:opacity-[0.16]"
          />
        </div>

        <div className={`relative z-10 mx-auto max-w-6xl ${!isEn ? "rtl" : ""}`}>
          <div
            className={`rounded-2xl border border-slate-800 bg-slate-900/70 p-3 md:p-4 ${
              isEn ? "text-left" : "text-right"
            }`}
          >
            <div className="mx-auto max-w-4xl text-center">
              <button
                type="button"
                onClick={handleLogoClick}
                aria-label={isEn ? "Back to top" : "الرجوع للأعلى"}
                className="inline-flex items-center gap-2.5 rounded-xl border border-slate-700/80 bg-slate-900/80 px-4 py-2.5 transition-all duration-300 hover:-translate-y-0.5 hover:border-eden-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-eden-accent/70"
              >
                <img
                  src={ASSETS.LOGO}
                  alt="Geo Top Logo"
                  className="h-10 w-10 object-contain rounded-full md:h-12 md:w-12"
                />
                <span className="text-xl font-black text-eden-accent md:text-2xl">
                  {footerContent.brandTitle}
                </span>
              </button>
              <p className="mt-3 text-xs leading-relaxed text-slate-300 md:text-sm">
                {footerContent.brandDesc}
              </p>
            </div>

            <div className="mt-5 border-t border-slate-800/90 pt-4">
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-3 lg:items-start" dir="ltr">
                <div className="w-full space-y-2.5 text-center lg:justify-self-start" dir={isEn ? "ltr" : "rtl"}>
                  <h5 className="text-[11px] font-black tracking-[0.12em] text-slate-400">
                    {footerContent.socialTitle}
                  </h5>
                  <div className="space-y-1.5">
                    {footerContent.socialLinks.map((social) => {
                      const Icon = socialIconMap[social.icon];
                      return (
                        <a
                          key={social.label}
                          href={social.href}
                          target="_blank"
                          rel="noreferrer"
                          className={`flex w-full items-center justify-center gap-1.5 rounded-md border border-slate-700 bg-slate-900 px-2.5 py-1.5 text-[11px] font-semibold text-slate-200 transition-all duration-300 hover:-translate-y-0.5 hover:border-eden-accent hover:text-eden-accent ${
                            !isEn ? "flex-row-reverse" : ""
                          }`}
                        >
                          <Icon size={12} className="text-eden-accent" />
                          <span>{social.label}</span>
                        </a>
                      );
                    })}
                  </div>
                </div>

                <div className={`w-full space-y-2.5 lg:justify-self-center ${isEn ? "text-left" : "text-right"}`} dir={isEn ? "ltr" : "rtl"}>
                  <h5 className="text-[11px] font-black uppercase tracking-[0.14em] text-slate-300">
                    {footerQuickLinks.title}
                  </h5>
                  <div className="space-y-1.5">
                    <button
                      type="button"
                      onClick={() => setActiveFooterModal("privacy")}
                      className="w-full rounded-md border border-slate-700 bg-slate-900 px-2.5 py-1.5 text-[11px] font-semibold text-slate-200 transition-all hover:border-eden-accent hover:text-eden-accent"
                    >
                      {footerQuickLinks.privacy}
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveFooterModal("terms")}
                      className="w-full rounded-md border border-slate-700 bg-slate-900 px-2.5 py-1.5 text-[11px] font-semibold text-slate-200 transition-all hover:border-eden-accent hover:text-eden-accent"
                    >
                      {footerQuickLinks.terms}
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveFooterModal("learn")}
                      className="w-full rounded-md border border-slate-700 bg-slate-900 px-2.5 py-1.5 text-[11px] font-semibold text-slate-200 transition-all hover:border-eden-accent hover:text-eden-accent"
                    >
                      {footerQuickLinks.learn}
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveFooterModal("feedback")}
                      className="w-full rounded-md border border-slate-700 bg-slate-900 px-2.5 py-1.5 text-[11px] font-semibold text-slate-200 transition-all hover:border-eden-accent hover:text-eden-accent"
                    >
                      {footerQuickLinks.feedback}
                    </button>
                  </div>
                </div>

                <div className={`w-full space-y-2.5 lg:justify-self-end ${isEn ? "text-left" : "text-right"}`} dir={isEn ? "ltr" : "rtl"}>
                  <h4 className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-300">
                    {footerContent.contactTitle}
                  </h4>
                  <p className="text-[11px] leading-relaxed text-slate-300 md:text-xs">
                    {footerContent.contactDesc}
                  </p>

                  <div className="space-y-1.5">
                    <a
                      href={`mailto:${footerContent.email}`}
                      className={`flex w-full items-center gap-1.5 rounded-md border border-slate-700 bg-slate-900 px-2.5 py-1.5 text-[11px] text-slate-100 transition-all duration-300 hover:-translate-y-0.5 hover:border-eden-accent hover:text-eden-accent ${
                        !isEn ? "flex-row-reverse" : ""
                      }`}
                    >
                      <Mail size={12} className="text-eden-accent" />
                      <span className="font-semibold">{footerContent.email}</span>
                    </a>
                    <a
                      href={footerContent.whatsappUrl}
                      target="_blank"
                      rel="noreferrer"
                      className={`flex w-full items-center gap-1.5 rounded-md border border-slate-700 bg-slate-900 px-2.5 py-1.5 text-[11px] text-slate-100 transition-all duration-300 hover:-translate-y-0.5 hover:border-eden-accent hover:text-eden-accent ${
                        !isEn ? "flex-row-reverse" : ""
                      }`}
                    >
                      <WhatsAppIcon size={12} className="text-eden-accent" />
                      <span className="font-semibold underline">{footerContent.whatsapp}</span>
                    </a>
                    <a
                      href={footerContent.locationUrl}
                      target="_blank"
                      rel="noreferrer"
                      className={`flex w-full items-center gap-1.5 rounded-md border border-slate-700 bg-slate-900 px-2.5 py-1.5 text-[11px] text-slate-100 transition-all duration-300 hover:-translate-y-0.5 hover:border-eden-accent hover:text-eden-accent ${
                        !isEn ? "flex-row-reverse" : ""
                      }`}
                    >
                      <MapPin size={12} className="text-eden-accent" />
                      <span className="font-semibold">{footerContent.location}</span>
                    </a>
                    {footerContent.websiteUrl && (
                      <a
                        href={footerContent.websiteUrl}
                        target="_blank"
                        rel="noreferrer"
                        className={`flex w-full items-center gap-1.5 rounded-md border border-slate-700 bg-slate-900 px-2.5 py-1.5 text-[11px] text-slate-100 transition-all duration-300 hover:-translate-y-0.5 hover:border-eden-accent hover:text-eden-accent ${
                          !isEn ? "flex-row-reverse" : ""
                        }`}
                      >
                        <Globe size={12} className="text-eden-accent" />
                        <span className="font-semibold">{footerContent.websiteLabel}</span>
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div
            className={`mt-3 flex flex-col gap-1.5 border-t border-slate-800 pt-2.5 text-[10px] text-slate-400 md:flex-row md:items-center md:justify-center ${
              isEn ? "" : "md:flex-row-reverse"
            }`}
          >
            <p>{footerContent.copyright}</p>
          </div>
        </div>
      </footer>
      </main>

      <AnimatePresence>
        {activeFooterModal && (
          <motion.div
            className="fixed inset-0 z-[90] bg-slate-950/75 px-4 py-8 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setActiveFooterModal(null)}
          >
            <motion.div
              initial={{ opacity: 0, y: 24, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.98 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              onClick={(event) => event.stopPropagation()}
              className={`mx-auto mt-8 w-full max-w-2xl rounded-2xl border border-slate-300 bg-white p-5 shadow-[0_24px_60px_rgba(2,6,23,0.35)] md:p-6 ${
                !isEn ? "rtl text-right" : "text-left"
              }`}
            >
              <div className="mb-4 flex items-center justify-between gap-4 border-b border-slate-200 pb-3">
                <h3 className="text-xl font-black text-slate-900">
                  {activeFooterModal === "privacy"
                    ? footerQuickLinks.privacy
                    : activeFooterModal === "terms"
                    ? footerQuickLinks.terms
                    : activeFooterModal === "learn"
                    ? footerQuickLinks.learn
                    : footerQuickLinks.feedback}
                </h3>
                <button
                  type="button"
                  onClick={() => setActiveFooterModal(null)}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-300 text-slate-600 transition-colors hover:border-eden-accent hover:text-eden-accent"
                  aria-label={footerQuickLinks.close}
                >
                  <X size={16} />
                </button>
              </div>

              {activeFooterModal === "privacy" && (
                <div className="space-y-3 text-sm leading-7 text-slate-700">
                  <p>
                    {isEn
                      ? "We only collect the information you share through forms to respond to your requests and improve our services."
                      : "نقوم بجمع البيانات التي تشاركها معنا فقط للرد على طلباتك وتحسين خدماتنا."}
                  </p>
                  <p>
                    {isEn
                      ? "Your data is not sold or shared with third parties for advertising purposes."
                      : "لا نقوم ببيع بياناتك أو مشاركتها مع أطراف خارجية لأغراض إعلانية."}
                  </p>
                  <p>
                    {isEn
                      ? "Any submitted contact details are used for official communication by Geo Top only."
                      : "أي بيانات تواصل يتم إرسالها تُستخدم فقط للتواصل الرسمي من فريق Geo Top."}
                  </p>
                  <p>
                    {isEn
                      ? "You can request an update or deletion of your submitted information by contacting us on the official email."
                      : "يمكنك طلب تعديل أو حذف بياناتك المرسلة عبر التواصل معنا على البريد الرسمي."}
                  </p>
                </div>
              )}

              {activeFooterModal === "terms" && (
                <div className="space-y-3 text-sm leading-7 text-slate-700">
                  <p>
                    {isEn
                      ? "All course materials and website content are owned by Geo Top and protected by applicable rights."
                      : "جميع مواد الكورسات ومحتوى الموقع مملوكة لـ Geo Top ومحمية بحقوق الاستخدام."}
                  </p>
                  <p>
                    {isEn
                      ? "You agree to use the platform for legal educational purposes and avoid misuse of content."
                      : "باستخدام المنصة، أنت توافق على الاستخدام التعليمي المشروع وعدم إساءة استخدام المحتوى."}
                  </p>
                  <p>
                    {isEn
                      ? "Program details, schedules, and service availability may be updated when needed."
                      : "قد يتم تحديث تفاصيل البرامج والمواعيد والخدمات وفق متطلبات التشغيل."}
                  </p>
                  <p>
                    {isEn
                      ? "Submitting inquiries does not guarantee enrollment until official confirmation."
                      : "إرسال الطلبات أو الاستفسارات لا يعني القبول النهائي إلا بعد التأكيد الرسمي."}
                  </p>
                </div>
              )}

              {activeFooterModal === "learn" && (
                <div className="space-y-3 text-sm leading-7 text-slate-700">
                  <p>
                    {isEn
                      ? "To learn effectively on Geo Top, follow this flow:"
                      : "للتعلّم بشكل فعّال على جيو توب اتبع الخطوات التالية:"}
                  </p>
                  <ol className={`space-y-2 ${!isEn ? "pr-5" : "pl-5"} list-decimal`}>
                    <li>
                      {isEn
                        ? "Start with the track that matches your level (GIS basics, GeoAI, surveying, or utilities)."
                        : "ابدأ بالمسار المناسب لمستواك (GIS، GeoAI، المساحة، أو اليوتيليتيز)."}
                    </li>
                    <li>
                      {isEn
                        ? "Study each lesson in order, then apply it on a mini practical task immediately."
                        : "ذاكر الدروس بالترتيب ثم طبّق كل جزء مباشرة على مهمة عملية صغيرة."}
                    </li>
                    <li>
                      {isEn
                        ? "Use projects and blog articles as guided practice references."
                        : "استخدم قسم المشاريع والبلوج كمراجع تطبيقية أثناء التعلّم."}
                    </li>
                    <li>
                      {isEn
                        ? "Track progress weekly and contact the team if you need a customized training plan."
                        : "تابع تقدمك أسبوعيًا وتواصل مع الفريق لو احتجت خطة تدريب مخصصة."}
                    </li>
                  </ol>
                </div>
              )}

              {activeFooterModal === "feedback" && (
                <form onSubmit={handleFeedbackSubmit} className="space-y-4">
                  <p className="text-sm text-slate-500">
                    {isEn
                      ? `Your message will be sent to: ${footerContent.email}`
                      : `سيتم إرسال رسالتك إلى: ${footerContent.email}`}
                  </p>

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <input
                      type="text"
                      value={feedbackFormData.name}
                      onChange={(event) =>
                        setFeedbackFormData((prev) => ({ ...prev, name: event.target.value }))
                      }
                      placeholder={isEn ? "Full Name" : "الاسم بالكامل"}
                      className="h-11 rounded-xl border border-slate-300 px-3 text-sm text-slate-800 placeholder:text-slate-400 focus:border-eden-accent focus:outline-none"
                      required
                    />
                    <input
                      type="email"
                      value={feedbackFormData.email}
                      onChange={(event) =>
                        setFeedbackFormData((prev) => ({ ...prev, email: event.target.value }))
                      }
                      placeholder={isEn ? "Email Address" : "البريد الإلكتروني"}
                      className="h-11 rounded-xl border border-slate-300 px-3 text-sm text-slate-800 placeholder:text-slate-400 focus:border-eden-accent focus:outline-none"
                      required
                    />
                  </div>

                  <select
                    value={feedbackFormData.type}
                    onChange={(event) =>
                      setFeedbackFormData((prev) => ({
                        ...prev,
                        type: event.target.value as "complaint" | "suggestion",
                      }))
                    }
                    className="h-11 w-full rounded-xl border border-slate-300 px-3 text-sm text-slate-800 focus:border-eden-accent focus:outline-none"
                  >
                    <option value="complaint">
                      {footerQuickLinks.feedbackType}: {footerQuickLinks.complaint}
                    </option>
                    <option value="suggestion">
                      {footerQuickLinks.feedbackType}: {footerQuickLinks.suggestion}
                    </option>
                  </select>

                  <textarea
                    rows={6}
                    value={feedbackFormData.message}
                    onChange={(event) =>
                      setFeedbackFormData((prev) => ({ ...prev, message: event.target.value }))
                    }
                    placeholder={isEn ? "Write your message..." : "اكتب رسالتك..."}
                    className="w-full rounded-xl border border-slate-300 px-3 py-3 text-sm text-slate-800 placeholder:text-slate-400 focus:border-eden-accent focus:outline-none"
                    required
                  />

                  <Button type="submit" className="!h-11 !px-6">
                    {isEn ? "Send" : "إرسال"}
                    <Send size={16} className={`${!isEn ? "mr-1" : "ml-1"}`} />
                  </Button>
                </form>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Landing;

