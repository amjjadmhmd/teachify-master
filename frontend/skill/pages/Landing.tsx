import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import {
  ArrowRight,
  ArrowLeft,
  MapPin,
  Mail,
  Sun,
  Moon,
  Youtube,
  Instagram,
  Facebook,
  Music2,
  Twitter,
  Linkedin,
  Globe,
  ChevronDown,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { Reveal } from "../components/Reveal";
import { Button, Card } from "../components/UI";
import { Course, Lang, Theme } from "../types";
import { ASSETS } from "../constants/assets";
import { getStaticCourses } from "../utils/staticCourses";
import { api } from "../api/client";
import type { LandingCourse as ApiLandingCourse } from "../api/types";

interface LandingProps {
  onLoginClick: () => void;
  onJoinClick: () => void;
  onExploreClick: () => void;
  onCourseOpen?: (course: Course) => void;
  onMentorsClick?: () => void;
  onLogoClick?: () => void;
  lang: Lang;
  toggleLang: () => void;
  theme: Theme;
  toggleTheme: () => void;
  initialSectionId?: LandingSectionId | null;
  onInitialSectionHandled?: () => void;
}

type LandingSectionId = "home" | "courses" | "services" | "about" | "contact";

type CourseCategory =
  | "all"
  | "company"
  | "gis"
  | "geoai"
  | "software"
  | "utilities"
  | "surveying"
  | "remote";

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

const Landing: React.FC<LandingProps> = ({
  onLoginClick,
  onJoinClick,
  onExploreClick,
  onCourseOpen,
  onLogoClick,
  lang,
  toggleLang,
  theme,
  toggleTheme,
  initialSectionId = null,
  onInitialSectionHandled,
}) => {
  const isEn = lang === "en";
  const HERO_VIDEO_MOBILE =
    "https://res.cloudinary.com/dezzwsvjv/video/upload/f_auto,vc_auto,q_auto:good,w_960/v1771698805/3125448-uhd_3840_2160_25fps_kpo5ms.mp4";
  const HERO_VIDEO_DESKTOP =
    "https://res.cloudinary.com/dezzwsvjv/video/upload/f_auto,vc_auto,q_auto:good,w_1920/v1771698805/3125448-uhd_3840_2160_25fps_kpo5ms.mp4";

  const content = isEn
    ? {
        navItems: [
          { id: "home", label: "Home" },
          { id: "courses", label: "Courses" },
          { id: "services", label: "Services" },
          { id: "about", label: "About Us" },
          { id: "contact", label: "Contact Us" },
        ],
        login: "Login",
        joinNow: "Join Now",
        heroTitle: "GeoTop Training Platform",
        heroDesc:
          "Advanced surveying, GIS, and applied geospatial programs for students and professionals.",
        viewCourses: "View Courses",
        joinPrograms: "Join Programs",
        coursesTitle: "GeoTop Courses",
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
          "GeoTop is specialized in advanced surveying and GIS, delivering technical solutions and training programs aligned with market needs.",
        contactTitle: "Contact Us",
        contactDesc: "For inquiries, partnerships, and training programs.",
      }
    : {
        navItems: [
          { id: "home", label: "الرئيسية" },
          { id: "courses", label: "الكورسات" },
          { id: "services", label: "الخدمات" },
          { id: "about", label: "من نحن" },
          { id: "contact", label: "تواصل معنا" },
        ],
        login: "دخول",
        joinNow: "انضم الآن",
        heroTitle: "منصة GeoTop التدريبية",
        heroDesc:
          "برامج متقدمة في المساحة ونظم المعلومات الجغرافية والتطبيقات الجيومكانية للطلاب والمحترفين.",
        viewCourses: "عرض الكورسات",
        joinPrograms: "انضم للبرامج",
        coursesTitle: "كورسات GeoTop",
        coursesDesc: "مسارات متخصصة في GIS والمساحة والاستشعار عن بعد والذكاء الجيومكاني.",
        courseTitles: [
          "دورات شركة Geo Top",
          "دورة GIS مكونة من 6 مستويات",
          "دورة GeoAI",
          "دورة Python-GIS",
          "دورة شبكات البنية التحتية (كهرباء ومياه)",
          "دورة ArcGIS Enterprise",
          "دورة Web GIS",
          "دورة Drone Surveying",
          "دورة مكتب فني مساحي",
          "دورة Laser Scanner",
          "دورة Remote Sensing",
          "دورة Multispectral",
        ],
        servicesTitle: "الخدمات",
        serviceCards: ["الخدمات المساحية المتقدمة", "تحليل بيانات GIS", "تدريب الشركات"],
        servicesDesc: "خدمات تشغيل وتنفيذ وتدريب بمعايير احترافية.",
        aboutTitle: "من نحن",
        aboutDesc:
          "GeoTop شركة متخصصة في المساحة المتقدمة ونظم المعلومات الجغرافية، وتقدم حلولًا تقنية وبرامج تدريبية تواكب احتياجات سوق العمل.",
        contactTitle: "تواصل معنا",
        contactDesc: "للاستفسارات والشراكات وبرامج التدريب.",
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
        sectionTitle: "عن المنصة",
        visionTitle: "رؤيتنا",
        visionText:
          "نطمح إلى بناء المنصة الرائدة والأولى في الوطن العربي لتمكين المتخصصين والباحثين في علوم الجغرافيا ونظم المعلومات الجغرافية (GIS). نحن نسعى لتقديم محتوى تعليمي فائق الجودة يجمع بين الخبرة الأكاديمية والتطبيق العملي، لنكون جسراً يبرز كفاءات الكوادر العربية في سوق العمل العالمي.",
        missionTitle: "رسالتنا",
        missionText:
          "تتمثل رسالتنا في توفير بيئة تعليمية احترافية تقدم دورات تدريبية متقدمة ومسارات تعليمية متكاملة. نحن نؤمن بأن العلم المتخصص هو استثمار للمستقبل، لذا نحرص على تقديم كورسات مدفوعة بمستوى عالمي، تضمن للمشتركين الحصول على المهارات التي يتطلبها سوق العمل الفعلي والارتقاء بمستواهم المهني والمادي.",
        goalsTitle: "أهداف المنصة",
        goals: [
          {
            title: "الاحترافية المهنية",
            desc: "تقديم برامج تدريبية متخصصة تهدف إلى إعداد جغرافيين ومحللين متمكنين تقنياً وفنياً.",
          },
          {
            title: "الاستثمار في المعرفة",
            desc: "توفير محتوى حصري ومدفوع يضمن للمتدرب جودة التعليم والمتابعة المستمرة مع نخبة من الخبراء.",
          },
          {
            title: "سد فجوة سوق العمل",
            desc: "التركيز على الأدوات والبرمجيات الحديثة التي تطلبها الشركات والمؤسسات الكبرى في مجالات الاستشعار عن بُعد ونظم المعلومات.",
          },
          {
            title: "تطوير المسار الوظيفي",
            desc: "دعم المشتركين بخبرات عملية تساعدهم في الحصول على فرص وظيفية أفضل بمرتبات تنافسية.",
          },
          {
            title: "الاستدامة والتطوير",
            desc: "نلتزم بتطوير منصتنا باستمرار لتقديم أحدث التقنيات التعليمية لضمان أفضل تجربة مستخدم لطلابنا.",
          },
        ],
        hexVision: "الرؤية",
        hexMission: "الرسالة",
        hexGoals: "الأهداف",
        hexVisionShort: "الريادة في التأهيل المهني الجغرافي.",
        hexMissionShort: "تعليم احترافي يستحق الاستثمار.",
        hexGoalsShort: "تمكين، احتراف، ارتقاء وظيفي.",
      };

  type LandingCourseCard = {
    id: number;
    title: string;
    image: string;
    category: CourseCategory;
    description: string;
    sourceCourse?: Course;
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
        normalizedTitle.includes("مستويات"))
    ) {
      return "https://res.cloudinary.com/dezzwsvjv/image/upload/v1771859012/GIS.jpg_qzqux8.jpg";
    }

    if (normalizedTitle.includes("drone") || normalizedTitle.includes("درون")) {
      return "https://res.cloudinary.com/dezzwsvjv/image/upload/v1771858995/drone.jpg_mj8vua.jpg";
    }

    if (normalizedTitle.includes("arcgis") || normalizedTitle.includes("ارك")) {
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
        "مسارات مهنية مخصصة لفرق الشركات والإدارات الفنية.",
        "برنامج GIS متكامل من الأساسيات حتى المراحل المتقدمة.",
        "تطبيقات GeoAI العملية في التحليل المكاني والأتمتة.",
        "برمجة Python لخدمات GIS ومعالجة البيانات وإنتاج الخرائط.",
        "تدريب عملي لشبكات المرافق للبنية التحتية كهرباء ومياه.",
        "إعداد وتشغيل ArcGIS Enterprise داخل المؤسسات.",
        "تصميم تطبيقات Web GIS وبوابات خرائط تفاعلية.",
        "تشغيل المسح بالطائرات بدون طيار من التخطيط حتى المخرجات.",
        "تأسيس أعمال المكتب الفني المساحي وإدارة التقارير.",
        "خطوات العمل على Laser Scanner ومعالجة السحابة النقطية.",
        "تحليل بيانات الاستشعار عن بعد وتطبيقاتها العملية.",
        "تحليل صور Multispectral للمشروعات الهندسية والزراعية.",
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
        title: "الخدمات التي نقدمها",
        subtitle: "ماذا نقدم",
        quote:
          "نقدم خدمات برمجية مخصصة، وحلول GIS، وخدمات النمذجة والتصور ثلاثي الأبعاد لقطاعات متنوعة.",
        openLabel: "عرض الخدمة",
        requestLabel: "اطلب الخدمة",
        exploreLabel: "استعرض الكورسات",
        showMoreLabel: "عرض المزيد",
        showLessLabel: "عرض أقل",
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
            "خدمات GIS متكاملة للتحليل المكاني ورسم الخرائط وعرض البيانات الجغرافية.",
          details:
            "تنفيذ أعمال نظم المعلومات الجغرافية بشكل احترافي لإدارة البيانات وإنتاج خرائط دقيقة.",
          image: ASSETS.COURSES.CLOUD,
        },
        {
          id: "website-design",
          title: "تصميم المواقع",
          description:
            "تصميم مواقع احترافية متجاوبة وجذابة بما يناسب هوية نشاطك.",
          details:
            "من تخطيط تجربة المستخدم إلى الواجهة النهائية، نقدم تصميمًا يحقق أهدافك.",
          image: "https://res.cloudinary.com/dezzwsvjv/image/upload/v1771859012/WEB_DESIGN_h2iiim.jpg",
        },
        {
          id: "web-development",
          title: "تطوير الويب",
          description:
            "بناء تطبيقات ويب قوية وقابلة للتوسع بأحدث التقنيات.",
          details:
            "تطوير متكامل مع بنية نظيفة وربط APIs وتجهيز كامل للإطلاق.",
          image: ASSETS.COURSES.REACT,
        },
        {
          id: "mobile-apps",
          title: "تطبيقات الموبايل",
          description:
            "تطوير تطبيقات موبايل عالية الأداء لأنظمة iOS وAndroid.",
          details:
            "تطبيقات سريعة وعملية تضمن تجربة مستخدم ممتازة على مختلف الأجهزة.",
          image: ASSETS.COURSES.MOBILE,
        },
        {
          id: "remote-sensing",
          title: "الاستشعار عن بعد",
          description:
            "خدمات الاستشعار عن بعد لتحليل ومراقبة سطح الأرض بدقة.",
          details:
            "تحليل بيانات الأقمار الصناعية والصور الجوية لدعم اتخاذ القرار.",
          image: "https://images.unsplash.com/photo-1521295121783-8a321d551ad2?w=1200&q=80",
        },
        {
          id: "drone-processing",
          title: "معالجة صور الدرون",
          description:
            "تحليل ومعالجة متقدمة لصور الطائرات بدون طيار لمختلف التطبيقات.",
          details:
            "إنتاج مخرجات دقيقة مثل Orthophoto وDSM من بيانات الطيران.",
          image: "https://images.unsplash.com/photo-1473968512647-3e447244af8f?w=1200&q=80",
        },
        {
          id: "surveying",
          title: "المساحة",
          description:
            "خدمات مساحة احترافية لقياسات الأراضي وحدود الملكيات بدقة.",
          details:
            "أعمال رفع مساحي وحدودي وتقارير فنية بمعايير مهنية.",
          image: "https://images.unsplash.com/photo-1487958449943-2429e8be8625?w=1200&q=80",
        },
        {
          id: "bim",
          title: "BIM",
          description:
            "خدمات نمذجة معلومات المباني لرفع كفاءة إدارة مشروعات الإنشاء.",
          details:
            "تنسيق نماذج BIM وإخراجات تنفيذية دقيقة لدعم مراحل المشروع المختلفة.",
          image: "https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=1200&q=80",
        },
        {
          id: "3d-modeling",
          title: "النمذجة ثلاثية الأبعاد",
          description:
            "إنشاء نماذج 3D واقعية ومفصلة لمختلف القطاعات.",
          details:
            "نماذج ثلاثية الأبعاد دقيقة للاستخدامات الهندسية والعرض البصري.",
          image: "https://images.unsplash.com/photo-1545239351-1141bd82e8a6?w=1200&q=80",
        },
        {
          id: "graphic-design",
          title: "التصميم الجرافيكي",
          description:
            "خدمات تصميم إبداعية تعزز الهوية البصرية للعلامة التجارية.",
          details:
            "تصميم مواد بصرية قوية للهوية والتواصل الرقمي والمطبوعات.",
          image: "https://images.unsplash.com/photo-1561070791-2526d30994b5?w=1200&q=80",
        },
        {
          id: "digital-marketing",
          title: "التسويق الرقمي",
          description:
            "استراتيجيات تسويق رقمي فعالة لزيادة الانتشار والتفاعل.",
          details:
            "حملات تسويق رقمية مبنية على الأداء لرفع النتائج الفعلية.",
          image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=1200&q=80",
        },
        {
          id: "training",
          title: "التدريب",
          description:
            "برامج تدريبية متخصصة لرفع مهارات فريقك في المجالات التقنية.",
          details:
            "مسارات تدريب عملية يقدمها خبراء المجال لتأهيل الأفراد والفرق.",
          image: "https://images.unsplash.com/photo-1517048676732-d65bc937f952?w=1200&q=80",
        },
      ];

  const inferLandingCategory = (title: string): CourseCategory => {
    const t = title.toLowerCase();
    if (t.includes("utility") || t.includes("يوتيليتي")) return "utilities";
    if (t.includes("drone") || t.includes("survey") || t.includes("مساح")) return "surveying";
    if (t.includes("remote") || t.includes("multispectral") || t.includes("الاستشعار")) return "remote";
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
        { key: "all", label: "الكل" },
        { key: "company", label: "الشركة" },
        { key: "gis", label: "GIS" },
        { key: "geoai", label: "GeoAI" },
        { key: "software", label: "البرمجة" },
        { key: "utilities", label: "اليوتيليتيز" },
        { key: "surveying", label: "المساحة" },
        { key: "remote", label: "الاستشعار عن بعد" },
      ];

  const [activeCategory, setActiveCategory] = useState<CourseCategory>("all");
  const [activeSection, setActiveSection] = useState("home");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [slideDirection, setSlideDirection] = useState<1 | -1>(1);
  const [hoveredNavSection, setHoveredNavSection] = useState<LandingSectionId | null>(null);
  const [navLogoX, setNavLogoX] = useState(0);
  const [navLogoRotate, setNavLogoRotate] = useState(0);
  const [navLogoReady, setNavLogoReady] = useState(false);
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(null);
  const [showAllServices, setShowAllServices] = useState(false);
  const [servicesMenuOpen, setServicesMenuOpen] = useState(false);
  const [apiLandingCourses, setApiLandingCourses] = useState<ApiLandingCourse[]>([]);
  const [instructorStaticCourses, setInstructorStaticCourses] = useState<Course[]>(
    []
  );
  const navRailRef = useRef<HTMLDivElement | null>(null);
  const navLogoPrevXRef = useRef<number | null>(null);
  const navLogoRotateRef = useRef(0);
  const navItemRefs = useRef<Record<LandingSectionId, HTMLButtonElement | null>>({
    home: null,
    courses: null,
    services: null,
    about: null,
    contact: null,
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

  const defaultCourses: LandingCourseCard[] = content.courseTitles.map(
    (title, index) => ({
      id: 900000 + index,
      title,
      image: resolveLandingCourseImage(
        title,
        courseImages[index] || ASSETS.COURSES.CLOUD
      ),
      category: courseCategories[index],
      description: courseDescriptions[index],
    })
  );

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
          : "كورس مخصص تمت إضافته بواسطة المدرّب."),
      sourceCourse: course,
    })
  );

  const mapLandingApiCourseToPreviewCourse = (
    course: ApiLandingCourse
  ): Course => {
    const fallbackDescription = isEn
      ? "Professional geospatial training course."
      : "كورس احترافي في المجال الجيومكاني.";
    const fallbackImage = course.image_url || ASSETS.COURSES.CLOUD;

    const mappedLessons =
      Array.isArray(course.episodes) && course.episodes.length > 0
        ? course.episodes.map((episode, index) => ({
            id: episode.id || course.id * 100 + index + 1,
            title:
              episode.title ||
              (isEn ? `Episode ${index + 1}` : `الحلقة ${index + 1}`),
            description: episode.description || "",
            video_url: episode.video_url || "",
            order: (episode.sort_order ?? index) + 1,
            duration_minutes: Number(episode.duration_minutes || 0),
            is_completed: false,
          }))
        : [
            {
              id: course.id * 100 + 1,
              title: isEn ? "Course Overview" : "نظرة عامة على الكورس",
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
          (isEn ? "GeoTop Academy" : "أكاديمية GeoTop"),
        level_label:
          course.level_label ||
          (isEn ? "Professional Track" : "مسار احترافي"),
        course_language:
          course.course_language ||
          (isEn ? "Arabic / English" : "العربية / الإنجليزية"),
        rating_value: Number(course.rating_value || 5),
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
          : "كورس احترافي في المجال الجيومكاني."),
      sourceCourse: mapLandingApiCourseToPreviewCourse(course),
    })
  );

  const primaryCourses = backendCourses.length > 0 ? backendCourses : defaultCourses;
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
      normalizedTitle.includes("كهرباء") ||
      normalizedTitle.includes("مياه")
    ) {
      return 0; // Utilities
    }

    if (normalizedTitle.includes("geoai") || normalizedTitle.includes("geo ai")) {
      return 1; // GeoAI
    }

    if (normalizedTitle.includes("drone") || normalizedTitle.includes("درون")) {
      return 2; // Drone Surveying
    }

    if (
      normalizedTitle.includes("laser") ||
      normalizedTitle.includes("scanner") ||
      normalizedTitle.includes("ليزر") ||
      normalizedTitle.includes("لاسر")
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
    const sectionIds = ["home", "courses", "services", "about", "contact"];

    const detectActiveSection = () => {
      const offset = 140;
      const scrollPosition = window.scrollY + offset;
      let currentSection = "home";

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
  }, []);

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

  const navSectionIds: LandingSectionId[] = [
    "home",
    "courses",
    "services",
    "about",
    "contact",
  ];
  const activeNavSection: LandingSectionId = navSectionIds.includes(
    activeSection as LandingSectionId
  )
    ? (activeSection as LandingSectionId)
    : "home";
  const navIndicatorSection = hoveredNavSection ?? activeNavSection;

  const setNavButtonRef = useCallback(
    (sectionId: LandingSectionId) =>
      (node: HTMLButtonElement | null) => {
        navItemRefs.current[sectionId] = node;
      },
    []
  );

  const syncRollingLogo = useCallback(() => {
    const rail = navRailRef.current;
    const targetButton = navItemRefs.current[navIndicatorSection];
    if (!rail || !targetButton) return;

    const railRect = rail.getBoundingClientRect();
    const buttonRect = targetButton.getBoundingClientRect();
    const logoSize = 28;
    const nextX =
      buttonRect.left - railRect.left + buttonRect.width / 2 - logoSize / 2;

    const previousX = navLogoPrevXRef.current;
    if (previousX !== null) {
      const deltaX = nextX - previousX;
      const nextRotation = navLogoRotateRef.current + deltaX * 1.25;
      navLogoRotateRef.current = nextRotation;
      setNavLogoRotate(nextRotation);
    }

    navLogoPrevXRef.current = nextX;
    setNavLogoX(nextX);
    setNavLogoReady(true);
  }, [navIndicatorSection]);

  useLayoutEffect(() => {
    const frame = window.requestAnimationFrame(syncRollingLogo);
    return () => window.cancelAnimationFrame(frame);
  }, [syncRollingLogo, isEn]);

  useEffect(() => {
    const handleResize = () => {
      window.requestAnimationFrame(syncRollingLogo);
    };
    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, [syncRollingLogo]);

  const selectedService = useMemo(
    () => serviceCards.find((service) => service.id === selectedServiceId) ?? null,
    [selectedServiceId, serviceCards]
  );
  const SERVICES_PREVIEW_COUNT = 3;
  const hasMoreServices = serviceCards.length > SERVICES_PREVIEW_COUNT;
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
    scrollToSection("home");
    if (onLogoClick) onLogoClick();
  };

  const geoTopLocationUrl =
    "https://www.google.com/maps/search/%D8%A8%D8%AC%D9%88%D8%A7%D8%B1+%D8%A7%D9%84%D9%81%D8%AE%D8%B1%D8%A7%D9%86%D9%8A+%D9%81%D9%88%D9%82+%D9%85%D9%83%D8%AA%D8%A8%D9%87+%D8%A7%D9%84%D9%83%D9%84%D9%85+%D8%A7%D9%84%D8%B7%D9%8A%D8%A8+%D8%B4%D8%A7%D8%B1%D8%B9+%D8%A7%D9%84%D8%B9%D8%AF%D9%88%D9%8A+%D8%8C+%D8%B3%D9%85%D9%86%D9%88%D8%AF+%D8%8C+%D8%A7%D9%84%D8%BA%D8%B1%D8%A8%D9%8A%D9%87%E2%80%AD/@30.95913,31.2430187,17z?hl=en&entry=ttu&g_ep=EgoyMDI2MDIxOC4wIKXMDSoASAFQAw%3D%3D";
  const geoTopWhatsappDisplay = "+20 104-095-0801";
  const geoTopWhatsappUrl = "https://wa.me/201040950801";

  const footerContent = isEn
    ? {
        badge: "GEOTOP ACADEMY",
        ctaTitle: "Ready for your next geospatial milestone?",
        ctaDesc: "Join our training tracks and build practical, job-ready skills.",
        ctaPrimary: "Join Programs",
        ctaSecondary: "Explore Courses",
        brandTitle: "GeoTop",
        brandDesc:
          "Advanced surveying and GIS learning paths for students, professionals, and teams.",
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
          { label: "TikTok", href: "https://www.tiktok.com/@geotopgroup", icon: "tiktok" as const },
          { label: "X", href: "https://x.com/geotopgroup", icon: "x" as const },
          { label: "LinkedIn", href: "https://linkedin.com/company/geo-top-egypt", icon: "linkedin" as const },
        ],
        copyright: `(c) ${new Date().getFullYear()} GeoTop Academy. All rights reserved.`,
      }
    : {
        badge: "أكاديمية GeoTop",
        ctaTitle: "جاهز للخطوة الجاية في المجال الجيومكاني؟",
        ctaDesc: "انضم لمساراتنا التدريبية وابني مهارات عملية مطلوبة في سوق العمل.",
        ctaPrimary: "انضم للبرامج",
        ctaSecondary: "استعرض الكورسات",
        brandTitle: "GeoTop",
        brandDesc:
          "مسارات متخصصة في المساحة ونظم المعلومات الجغرافية للطلاب والمحترفين والفرق.",
        brandAction: "اعرف أكتر",
        contactTitle: "تواصل معنا",
        contactDesc: "للاستفسارات والشراكات وبرامج التدريب.",
        email: "info@geo-top-group.com",
        whatsapp: geoTopWhatsappDisplay,
        whatsappUrl: geoTopWhatsappUrl,
        location: "بجوار الفخراني فوق مكتبه الكلم الطيب، شارع العدوي، سمنود، الغربية",
        locationUrl: geoTopLocationUrl,
        websiteLabel: "الموقع",
        websiteUrl: "",
        socialTitle: "تابعنا",
        socialLinks: [
          { label: "يوتيوب", href: "https://www.youtube.com/@geotopgroup", icon: "youtube" as const },
          { label: "انستاجرام", href: "https://www.instagram.com/geotopgroup/", icon: "instagram" as const },
          { label: "فيسبوك", href: "https://www.facebook.com/profile.php?id=61560270966670", icon: "facebook" as const },
          { label: "تيك توك", href: "https://www.tiktok.com/@geotopgroup", icon: "tiktok" as const },
          { label: "X", href: "https://x.com/geotopgroup", icon: "x" as const },
          { label: "لنكدان", href: "https://linkedin.com/company/geo-top-egypt", icon: "linkedin" as const },
        ],
        copyright: `(c) ${new Date().getFullYear()} أكاديمية GeoTop. جميع الحقوق محفوظة.`,
      };

  const socialIconMap = {
    youtube: Youtube,
    instagram: Instagram,
    facebook: Facebook,
    tiktok: Music2,
    x: Twitter,
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
        title: isEn ? "Introduction & Setup" : "مقدمة وتجهيز البيئة",
        description: isEn
          ? "Overview, tools, and workflow for this track."
          : "نظرة عامة على المسار والأدوات وطريقة العمل.",
        video_url: "",
        order: 1,
        duration_minutes: 20,
      },
      {
        id: lessonBaseId + 2,
        title: isEn ? "Core Practical Workflow" : "التطبيق العملي الأساسي",
        description: isEn
          ? "Hands-on implementation with real project examples."
          : "تطبيق عملي بأمثلة من مشروعات حقيقية.",
        video_url: "",
        order: 2,
        duration_minutes: 35,
      },
      {
        id: lessonBaseId + 3,
        title: isEn ? "Project Delivery & QA" : "تسليم المشروع ومراجعة الجودة",
        description: isEn
          ? "Final outputs, quality checks, and best practices."
          : "المخرجات النهائية ومعايير الجودة وأفضل الممارسات.",
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
      price: "0.00",
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
        instructor_name: isEn ? "GeoTop Academy" : "أكاديمية GeoTop",
        level_label:
          absoluteIndex % 3 === 0
            ? isEn
              ? "Beginner to Advanced"
              : "من المبتدئ إلى المتقدم"
            : isEn
            ? "Professional Track"
            : "مسار احترافي",
        course_language: isEn ? "Arabic / English" : "العربية / الإنجليزية",
        rating_value: 4.9,
        enrolled_students: 130 + absoluteIndex * 5,
        last_updated: new Date().toISOString(),
        requirements: isEn
          ? ["Computer basics", "Motivation to practice", "Internet access"]
          : ["أساسيات الكمبيوتر", "رغبة في التطبيق", "اتصال إنترنت"],
        outcomes: isEn
          ? [
              "Build practical geospatial workflows",
              "Apply tools on real projects",
              "Deliver technical outputs professionally",
            ]
          : [
              "بناء مسارات عمل جيومكانية",
              "تطبيق الأدوات على مشروعات حقيقية",
              "تسليم مخرجات تقنية باحترافية",
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

  return (
    <div className={`relative min-h-screen bg-white ${!isEn ? "rtl" : ""}`}>
      <nav className="fixed top-0 left-0 right-0 z-50 h-20 bg-white/90 backdrop-blur-xl border-b border-slate-200">
        <div className="max-w-7xl mx-auto h-full px-4 lg:px-6 flex items-center justify-between gap-4">
          <button
            className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity"
            onClick={handleLogoClick}
            onMouseEnter={() => setHoveredNavSection(null)}
          >
            <img src={ASSETS.LOGO} alt="Geo Top Logo" className="h-10 w-10 object-contain rounded-full" />
            <span className="font-black text-xl text-eden-accent">GeoTop</span>
          </button>

          <div
            ref={navRailRef}
            className="relative hidden lg:flex items-end gap-6 pb-8"
            onMouseLeave={() => setHoveredNavSection(null)}
          >
            {content.navItems.map((item) => {
              if (item.id === "services") {
                return (
                  <div
                    key={item.id}
                    ref={servicesMenuRef}
                    className="relative"
                    onMouseEnter={() => {
                      setHoveredNavSection("services");
                    }}
                    onMouseLeave={() => {
                      setHoveredNavSection(null);
                    }}
                  >
                    <button
                      ref={setNavButtonRef("services")}
                      type="button"
                      onClick={() => {
                        setHoveredNavSection("services");
                        setActiveSection("services");
                        setServicesMenuOpen((prev) => !prev);
                      }}
                      onMouseEnter={() => setHoveredNavSection("services")}
                      className={`relative inline-flex items-center gap-1.5 border-0 pb-1 text-sm font-bold transition-colors after:content-[''] after:absolute after:-bottom-1 after:left-0 after:h-0.5 after:rounded-full after:bg-eden-accent after:transition-all ${
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
                  ref={setNavButtonRef(item.id as LandingSectionId)}
                  onClick={() => {
                    setServicesMenuOpen(false);
                    setActiveSection(item.id);
                    scrollToSection(item.id);
                  }}
                  onMouseEnter={() =>
                    setHoveredNavSection(item.id as LandingSectionId)
                  }
                  onMouseLeave={() => setHoveredNavSection(null)}
                  className={`relative border-0 pb-1 text-sm font-bold transition-colors after:content-[''] after:absolute after:-bottom-1 after:left-0 after:h-0.5 after:rounded-full after:bg-eden-accent after:transition-all ${
                    activeSection === item.id
                      ? "text-eden-accent after:w-full"
                      : "text-slate-600 hover:text-eden-accent after:w-0 hover:after:w-full"
                  }`}
                >
                  {item.label}
                </button>
              );
            })}

            <motion.button
              type="button"
              aria-label={isEn ? "Navigation anchor logo" : "مؤشر التنقل"}
              onMouseEnter={() => setHoveredNavSection(null)}
              className="absolute bottom-[-0px] z-20 h-7 w-7 p-0"
              style={{ left: 0 }}
              animate={{
                x: navLogoX,
                rotate: navLogoRotate,
                opacity: navLogoReady ? 1 : 0,
                scale: navLogoReady ? 1 : 0.84,
              }}
              transition={{
                x: { type: "spring", stiffness: 140, damping: 30, mass: 1.05 },
                rotate: { type: "spring", stiffness: 95, damping: 24, mass: 0.98 },
                opacity: { duration: 0.16 },
                scale: { duration: 0.18 },
              }}
            >
              <img
                src={ASSETS.LOGO}
                alt=""
                aria-hidden="true"
                className="h-full w-full object-contain drop-shadow-[0_10px_16px_rgba(0,123,255,0.35)]"
              />
            </motion.button>
          </div>

          <div className="flex items-center gap-3">
            <button onClick={toggleLang} className="text-xs font-bold text-slate-600 hover:text-eden-accent transition-colors">
              {isEn ? "العربية" : "English"}
            </button>
            <button
              onClick={toggleTheme}
              className="p-2.5 bg-slate-100 rounded-xl text-slate-400 hover:text-eden-accent hover:border-eden-accent transition-all border border-slate-200"
              aria-label={isEn ? "Toggle theme" : "تبديل المظهر"}
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

      <section
        id="home"
        className="relative mt-20 h-[calc(100vh-5rem)] min-h-[42rem] overflow-hidden border-b border-slate-200 bg-black"
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

      <section id="courses" className="py-20 px-4 lg:px-6 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto">
          <Reveal width="100%">
            <div className="mb-10 text-center">
              <h2 className="text-3xl font-black text-eden-accent md:text-4xl">{content.coursesTitle}</h2>
              <p className="mx-auto mt-3 max-w-3xl text-slate-600">{content.coursesDesc}</p>
            </div>
          </Reveal>

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
                    <button
                      type="button"
                      onClick={() =>
                        handleCourseCardClick(course, currentIndex + index)
                      }
                      className="w-full h-full text-left"
                    >
                      <Card className="h-[22rem] flex flex-col overflow-hidden border border-slate-200 bg-white rounded-2xl p-0 shadow-sm transition-all duration-300 hover:border-eden-accent hover:shadow-[0_0_0_1px_rgba(34,211,238,0.45),0_0_24px_rgba(34,211,238,0.35),0_16px_32px_-18px_rgba(34,211,238,0.65)]">
                        <div className="w-full h-52 bg-slate-100 overflow-hidden rounded-2xl">
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
                        </div>
                        <div className="p-5 flex-1 flex flex-col">
                          <h3 className="w-full text-slate-900 font-bold leading-relaxed line-clamp-2 min-h-[3.5rem]">
                            {course.title}
                          </h3>
                          <p className="mt-2 text-xs text-slate-500 line-clamp-2">
                            {course.description}
                          </p>
                          <span className="mt-auto text-[11px] font-bold text-eden-accent">
                            {isEn ? "Open Course Details" : "عرض تفاصيل الكورس"}
                          </span>
                        </div>
                      </Card>
                    </button>
                  </Reveal>
                ))}
              </motion.div>
            </AnimatePresence>
          </div>

          {filteredCourses.length > pageSize && (
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
        </div>
      </section>

      <section
        id="services"
        className="bg-slate-100 px-4 py-16 lg:px-6 border-b border-slate-200"
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
                className={`mx-auto w-full max-w-6xl rounded-3xl border border-slate-300 bg-white p-5 shadow-[0_18px_42px_rgba(15,23,42,0.18)] md:p-7 ${
                  !isEn ? "text-right rtl" : ""
                }`}
              >
                <button
                  type="button"
                  onClick={closeServicePage}
                  className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 text-xs font-black uppercase tracking-[0.14em] text-slate-700 transition-all hover:border-eden-accent hover:text-eden-accent"
                >
                  {isEn ? <ArrowLeft size={14} /> : <ArrowRight size={14} />}
                  <span>{isEn ? "Back to Services" : "الرجوع للخدمات"}</span>
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
                        onClick={() => scrollToSection("contact")}
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
                    {isEn ? "Other Services" : "خدمات أخرى"}
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
                      className={`flex h-full min-h-[23rem] w-full flex-col rounded-2xl border border-slate-300 bg-slate-200 p-3 text-left shadow-[0_2px_12px_rgba(15,23,42,0.14)] transition-all duration-300 hover:border-eden-accent hover:shadow-[0_10px_28px_rgba(0,123,255,0.25)] ${
                        !isEn ? "text-right" : ""
                      }`}
                    >
                      <div className="h-44 w-full overflow-hidden rounded-2xl border border-slate-300 bg-slate-300">
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
                      <h3 className="mt-4 min-h-[4rem] text-2xl font-black text-slate-900 line-clamp-2">
                        {service.title}
                      </h3>
                      <p className="mt-2 min-h-[5.25rem] text-base leading-7 text-slate-700 line-clamp-3">
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

              {hasMoreServices && (
                <div className="mt-8 flex justify-center">
                  <button
                    type="button"
                    onClick={() => setShowAllServices((prev) => !prev)}
                    className="inline-flex h-11 items-center gap-2 rounded-xl border border-slate-300 bg-white px-6 text-sm font-black uppercase tracking-[0.12em] text-slate-700 transition-all hover:border-eden-accent hover:text-eden-accent"
                  >
                    <span>
                      {showAllServices
                        ? servicesContent.showLessLabel
                        : servicesContent.showMoreLabel}
                    </span>
                    {showAllServices
                      ? isEn
                        ? <ArrowLeft size={15} />
                        : <ArrowRight size={15} />
                      : isEn
                      ? <ArrowRight size={15} />
                      : <ArrowLeft size={15} />}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </section>

      <section id="about" className="border-b border-slate-200 bg-slate-100 px-4 py-20 lg:px-6">
        <div className="max-w-7xl mx-auto">
          <div className="mb-10 text-center">
            <h2 className="text-3xl md:text-4xl font-black text-eden-accent">
              {aboutSection.sectionTitle}
            </h2>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-stretch">
            <Card
              className="rounded-2xl border border-blue-700/60 !bg-gradient-to-br !from-[#0B2A70] !via-[#0A2462] !to-[#091D4D] p-6 text-center shadow-[0_18px_42px_rgba(2,6,23,0.34)]"
            >
              <span className="inline-flex rounded-full bg-cyan-400/15 px-3 py-1 text-xs font-bold text-cyan-200">
                {aboutSection.hexVision}
              </span>
              <h3 className="mt-4 text-2xl font-black text-white">
                {aboutSection.visionTitle}
              </h3>
              <p className="mt-3 leading-8 text-blue-50">{aboutSection.visionText}</p>
            </Card>

            <Card
              className="rounded-2xl border border-blue-700/60 !bg-gradient-to-br !from-[#0B2A70] !via-[#0A2462] !to-[#091D4D] p-6 text-center shadow-[0_18px_42px_rgba(2,6,23,0.34)]"
            >
              <span className="inline-flex rounded-full bg-amber-300/15 px-3 py-1 text-xs font-bold text-amber-100">
                {aboutSection.hexMission}
              </span>
              <h3 className="mt-4 text-2xl font-black text-white">
                {aboutSection.missionTitle}
              </h3>
              <p className="mt-3 leading-8 text-blue-50">{aboutSection.missionText}</p>
            </Card>

            <Card
              className="rounded-2xl border border-blue-700/60 !bg-gradient-to-br !from-[#0B2A70] !via-[#0A2462] !to-[#091D4D] p-6 text-center shadow-[0_18px_42px_rgba(2,6,23,0.34)]"
            >
              <h3 className="text-xl font-black text-white">
                {isEn ? "Core Summary" : "الملخص السريع"}
              </h3>
              <div className="mt-4 space-y-3">
                <p className="rounded-xl border border-cyan-300/25 bg-cyan-400/10 px-3 py-2 text-sm font-semibold text-cyan-100">
                  {`${aboutSection.hexVision}: ${aboutSection.hexVisionShort}`}
                </p>
                <p className="rounded-xl border border-amber-300/25 bg-amber-300/10 px-3 py-2 text-sm font-semibold text-amber-100">
                  {`${aboutSection.hexMission}: ${aboutSection.hexMissionShort}`}
                </p>
                <p className="rounded-xl border border-lime-300/25 bg-lime-300/10 px-3 py-2 text-sm font-semibold text-lime-100">
                  {`${aboutSection.hexGoals}: ${aboutSection.hexGoalsShort}`}
                </p>
              </div>
            </Card>
          </div>

          <Card
            className="mt-6 rounded-2xl border border-blue-700/60 !bg-gradient-to-br !from-[#0B2A70] !via-[#0A2462] !to-[#091D4D] p-6 text-center shadow-[0_18px_42px_rgba(2,6,23,0.34)]"
          >
            <h3 className="text-2xl font-black text-white">{aboutSection.goalsTitle}</h3>
            <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-4">
              {aboutSection.goals.map((goal, index) => {
                const isLastOddGoal =
                  aboutSection.goals.length % 2 !== 0 &&
                  index === aboutSection.goals.length - 1;

                return (
                  <div
                    key={goal.title}
                    className={`rounded-xl border border-blue-700/60 !bg-[#0A225A] p-4 text-center ${
                      isLastOddGoal ? "md:col-span-2 md:mx-auto md:w-[calc(50%-0.5rem)]" : ""
                    }`}
                  >
                    <h4 className="text-base font-black text-white">{goal.title}</h4>
                    <p className="mt-2 text-sm leading-7 text-blue-50">{goal.desc}</p>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
      </section>

      <footer
        id="contact"
        className="relative overflow-hidden border-t border-slate-800 bg-slate-950 px-4 py-7 lg:px-6"
      >
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -left-16 -top-24 h-48 w-48 rounded-full bg-eden-accent/12 blur-3xl" />
          <div className="absolute -bottom-20 right-0 h-56 w-56 rounded-full bg-cyan-500/10 blur-3xl" />
          <img
            src={ASSETS.LOGO}
            alt=""
            aria-hidden="true"
            className="absolute left-1/2 top-1/2 h-56 w-56 -translate-x-1/2 -translate-y-1/2 object-contain opacity-[0.14] mix-blend-screen md:h-80 md:w-80 md:opacity-[0.16]"
          />
        </div>

        <div className={`relative z-10 mx-auto max-w-6xl ${!isEn ? "rtl" : ""}`}>
          <div
            className={`rounded-2xl border border-slate-800 bg-slate-900/70 p-4 md:p-5 ${
              isEn ? "text-left" : "text-right"
            }`}
          >
            <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <h4 className="text-xs font-black uppercase tracking-[0.16em] text-slate-300">
                  {footerContent.contactTitle}
                </h4>
                <p className="mt-2 text-xs leading-relaxed text-slate-300 md:text-sm">
                  {footerContent.contactDesc}
                </p>

                <div className={`mt-3 flex flex-wrap gap-2 ${!isEn ? "justify-end" : ""}`}>
                  <a
                    href={`mailto:${footerContent.email}`}
                    className="inline-flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs text-slate-100 transition-all duration-300 hover:-translate-y-0.5 hover:border-eden-accent hover:text-eden-accent"
                  >
                    <Mail size={13} className="text-eden-accent" />
                    <span className="font-semibold">{footerContent.email}</span>
                  </a>
                  <a
                    href={footerContent.whatsappUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs text-slate-100 transition-all duration-300 hover:-translate-y-0.5 hover:border-eden-accent hover:text-eden-accent"
                  >
                    <WhatsAppIcon size={13} className="text-eden-accent" />
                    <span className="font-semibold underline">{footerContent.whatsapp}</span>
                  </a>
                  <a
                    href={footerContent.locationUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs text-slate-100 transition-all duration-300 hover:-translate-y-0.5 hover:border-eden-accent hover:text-eden-accent"
                  >
                    <MapPin size={13} className="text-eden-accent" />
                    <span className="font-semibold">{footerContent.location}</span>
                  </a>
                  {footerContent.websiteUrl && (
                    <a
                      href={footerContent.websiteUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs text-slate-100 transition-all duration-300 hover:-translate-y-0.5 hover:border-eden-accent hover:text-eden-accent"
                    >
                      <Globe size={13} className="text-eden-accent" />
                      <span className="font-semibold">{footerContent.websiteLabel}</span>
                    </a>
                  )}
                </div>
              </div>

              <div className={isEn ? "text-left" : "text-right"}>
                <h5 className="text-xs font-black tracking-[0.12em] text-slate-400">
                  {footerContent.socialTitle}
                </h5>
                <div className={`mt-3 flex flex-wrap gap-2 ${!isEn ? "justify-end" : ""}`}>
                  {footerContent.socialLinks.map((social) => {
                    const Icon = socialIconMap[social.icon];
                    return (
                      <a
                        key={social.label}
                        href={social.href}
                        target="_blank"
                        rel="noreferrer"
                        className={`inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs font-semibold text-slate-200 transition-all duration-300 hover:-translate-y-0.5 hover:border-eden-accent hover:text-eden-accent ${
                          !isEn ? "flex-row-reverse" : ""
                        }`}
                      >
                        <Icon size={13} className="text-eden-accent" />
                        <span>{social.label}</span>
                      </a>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          <div
            className={`mt-4 flex flex-col gap-2 border-t border-slate-800 pt-3 text-[11px] text-slate-400 md:flex-row md:items-center md:justify-center ${
              isEn ? "" : "md:flex-row-reverse"
            }`}
          >
            <p>{footerContent.copyright}</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
