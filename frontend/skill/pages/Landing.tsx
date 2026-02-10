import React, { useState, useEffect } from 'react';
import {
  ArrowRight, CheckCircle, Star, Award, BookOpen, ShieldCheck, LogIn, Sun, Moon,
  Users, Globe, Code, MessageCircle, GraduationCap, Check, Youtube, Instagram, Facebook, Twitter, Linkedin, Scan
} from 'lucide-react';
import { Reveal } from '../components/Reveal';
import { Button, Card } from '../components/UI';
import { Lang, Theme, PlatformStats } from '../types';
import { ASSETS } from '../constants/assets';
import { api } from '../api/client';

interface LandingProps {
  onLoginClick: () => void;
  onJoinClick: () => void;
  onExploreClick: () => void;
  onMentorsClick?: () => void;
  onLogoClick?: () => void;
  lang: Lang;
  toggleLang: () => void;
  theme: Theme;
  toggleTheme: () => void;
}

const Landing: React.FC<LandingProps> = ({
  onLoginClick, onJoinClick, onExploreClick, onMentorsClick, onLogoClick, lang, toggleLang, theme, toggleTheme
}) => {
  const isEn = lang === 'en';
  const [statsData, setStatsData] = useState<PlatformStats | null>(null);

  useEffect(() => {
    api.public.getStats().then(setStatsData);
  }, []);

  const handleLogoClick = (e: React.MouseEvent) => {
    e.preventDefault();
    // Professional "Home" behavior: Always scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
    // If we are in a sub-view of the landing page, trigger the callback
    if (onLogoClick) onLogoClick();
  };

  const features = [
    { title: isEn ? "Structured Learning" : "تعليم منظم", desc: isEn ? "Proven curricula designed for deep comprehension." : "مناهج مثبتة مصممة للاستيعاب العميق.", icon: BookOpen },
    { title: isEn ? "Industry Certification" : "شهادات معتمدة", desc: isEn ? "Earn certificates recognized by global employers." : "احصل على شهادات معترف بها من أصحاب العمل العالميين.", icon: Award },
    { title: isEn ? "Expert Tutoring" : "دروس مع خبراء", desc: isEn ? "Learn from professionals with real-world experience." : "تعلم من محترفين ذوي خبرة واقعية.", icon: GraduationCap },
  ];

  return (
    <div className={`relative min-h-screen ${!isEn ? 'rtl' : ''} bg-eden-bg`}>

      {/* NAVIGATION BAR */}
      <nav className="fixed top-0 left-0 w-full z-50 bg-eden-bg/80 backdrop-blur-2xl border-b border-white/5 px-6 py-5 flex justify-between items-center h-20">
        <div
          className="flex items-center gap-4 cursor-pointer hover:opacity-80 active:scale-95 transition-all group"
          onClick={handleLogoClick}
        >
          <img src={ASSETS.LOGO} alt="Geo Top Logo" className="h-12 w-12 object-contain rounded-full group-hover:rotate-6 transition-transform" style={{ mixBlendMode: 'multiply', filter: 'brightness(1.05)' }} />
          <span className="font-bold text-2xl text-slate-800 tracking-tighter">Geo Top</span>
        </div>

        <div className="flex items-center gap-6">
          <button onClick={toggleLang} className="text-[10px] font-bold text-slate-500 hover:text-white transition-colors uppercase tracking-[0.2em]">{isEn ? 'العربية' : 'English'}</button>
          <button onClick={onLoginClick} className="hidden sm:block text-[10px] font-bold text-slate-400 hover:text-white uppercase tracking-widest">{isEn ? 'Login' : 'دخول'}</button>
          <Button onClick={onJoinClick} className="!h-10 !px-6">{isEn ? 'Join Now' : 'انضم الآن'}</Button>
        </div>
      </nav>

      {/* HERO SECTION */}
      <section className="relative pt-48 pb-32 px-6 bg-white overflow-hidden min-h-[85vh] flex items-center">
        <div className="absolute inset-0 bg-slate-50 opacity-40 pointer-events-none"></div>

        <div className="max-w-7xl mx-auto flex flex-col items-center text-center relative z-10">


          <Reveal delay={0.1}>
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-black text-slate-900 mb-8 leading-[1] tracking-tighter max-w-5xl">
              {isEn ? "Precision in" : "الريادة في"} <br />
              <span className="text-eden-accent">{isEn ? "Every Coordinate" : "كل إحداثي"}</span>
            </h1>
          </Reveal>

          <Reveal delay={0.2}>
            <p className="text-xl md:text-2xl text-slate-600 max-w-3xl mx-auto mb-16 font-medium leading-relaxed">
              {isEn
                ? "Geo Top is a leading company in the field of Advanced Surveying and GIS, combining deep technical expertise with the latest technological solutions to provide high-quality services."
                : "Geo Top شركة رائدة في مجال المساحة المتقدمة و (GIS)، حيث تجمع بين الخبرة التقنية العميقة وأحدث الحلول التكنولوجية لتقديم خدمات عالية الجودة في هذا المجال."}
            </p>
          </Reveal>

          <Reveal delay={0.3}>
            <div className="flex flex-col sm:flex-row gap-6 justify-center">
              <Button onClick={onExploreClick} className="!h-14 !px-12 text-sm shadow-xl shadow-eden-accent/20">
                {isEn ? "Our Services" : "خدماتنا"} <ArrowRight size={20} className={!isEn ? "rotate-180 ml-2" : "ml-2"} />
              </Button>
              <Button onClick={onJoinClick} variant="secondary" className="!h-14 !px-12 text-sm bg-white border border-slate-200 text-slate-700 hover:bg-slate-50">
                {isEn ? "Join Programs" : "انضم للبرامج"}
              </Button>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ABOUT US SECTION (Full Text) */}
      <section className="py-24 px-6 bg-eden-accent relative overflow-hidden border-b border-white/10">
        <div className="absolute inset-0 bg-gradient-to-tr from-black/20 to-transparent pointer-events-none"></div>

        <div className="max-w-4xl mx-auto text-center relative z-10">
          <Reveal>
            <div className="mb-12">
              <h2 className="text-3xl font-black text-white mb-6 tracking-tighter leading-tight drop-shadow-sm">
                {isEn ? "About Geo Top" : "عن شركة Geo Top"}
              </h2>
              <p className="text-lg md:text-xl text-white/90 leading-loose font-medium drop-shadow-sm max-w-3xl mx-auto">
                {isEn
                  ? "Geo Top is a leading company in the field of Advanced Surveying and GIS, combining deep technical expertise with the latest technological solutions to provide high-quality services in this field."
                  : "Geo Top شركة رائدة في مجال المساحة المتقدمة و (GIS)، حيث تجمع بين الخبرة التقنية العميقة وأحدث الحلول التكنولوجية لتقديم خدمات عالية الجودة في هذا المجال."}
              </p>
            </div>
          </Reveal>

          <Reveal delay={0.2}>
            <div className={`bg-white p-8 rounded-3xl border-4 border-white/20 shadow-2xl ${isEn ? 'text-left' : 'text-right'} relative overflow-hidden`}>
              <div className="absolute inset-0 flex items-center justify-center opacity-25 pointer-events-none">
                <img src={ASSETS.LOGO} alt="" className="w-96 h-96 object-contain rounded-full" style={{ mixBlendMode: 'multiply', filter: 'brightness(1.05)' }} />
              </div>

              <div className="relative z-10">
                <h3 className="text-xl font-bold text-slate-900 mb-6 border-b border-slate-100 pb-4">
                  {isEn ? "The company offers a range of services including:" : "تقدم الشركة مجموعة من الخدمات تشمل:"}
                </h3>
                <ul className={`space-y-6 ${isEn ? 'pl-4' : 'pr-4'}`}>
                  <li className={`flex gap-4 items-start ${isEn ? 'flex-row' : 'flex-row-reverse'}`}>
                    <span className="flex-shrink-0 w-8 h-8 rounded-full bg-eden-accent/10 flex items-center justify-center text-eden-accent ring-4 ring-eden-accent/5">
                      <Scan size={18} />
                    </span>
                    <p className="text-slate-600 leading-relaxed text-lg font-medium">
                      {isEn
                        ? "Advanced Surveying Services using the latest equipment and technologies to ensure the highest degrees of accuracy and efficiency."
                        : "الخدمات المساحية المتقدمة باستخدام أحدث الأجهزة والتقنيات لضمان أعلى درجات الدقة والكفاءة."}
                    </p>
                  </li>
                  <li className={`flex gap-4 items-start ${isEn ? 'flex-row' : 'flex-row-reverse'}`}>
                    <span className="flex-shrink-0 w-8 h-8 rounded-full bg-eden-accent/10 flex items-center justify-center text-eden-accent ring-4 ring-eden-accent/5">
                      <Globe size={18} />
                    </span>
                    <p className="text-slate-600 leading-relaxed text-lg font-medium">
                      {isEn
                        ? "GIS Services including spatial analysis, map creation, spatial data management, and decision support."
                        : "خدمات (GIS) بما في ذلك التحليل المكاني، إنشاء الخرائط، إدارة البيانات المكانية، ودعم اتخاذ القرار."}
                    </p>
                  </li>
                  <li className={`flex gap-4 items-start ${isEn ? 'flex-row' : 'flex-row-reverse'}`}>
                    <span className="flex-shrink-0 w-8 h-8 rounded-full bg-eden-accent/10 flex items-center justify-center text-eden-accent ring-4 ring-eden-accent/5">
                      <GraduationCap size={18} />
                    </span>
                    <p className="text-slate-600 leading-relaxed text-lg font-medium">
                      {isEn
                        ? "Specialized training programs and courses in Surveying and GIS aimed at qualifying cadres and equipping them with the necessary scientific skills to keep pace with the labor market."
                        : "برامج تدريبية ودورات متخصصة في المساحة وGIS تهدف إلى تأهيل الكوادر واكسابهم المهارات العلميه اللازمه لمواكبه سوق العمل."}
                    </p>
                  </li>
                </ul>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* STATS SECTION */}
      <section className="bg-slate-50 border-y border-slate-200 py-24 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-16 lg:gap-24 relative z-10">
          {[
            { label: isEn ? 'Projects Completed' : 'مشاريع مكتملة', value: '500+' },
            { label: isEn ? 'GIS Experts' : 'خبراء GIS', value: '15+' },
            { label: isEn ? 'Trained Cadres' : 'كوادر مؤهلة', value: '1,200+' },
            { label: isEn ? 'Accuracy Rate' : 'دقة العمل', value: '99.9%' },
          ].map((stat, i) => (
            <div key={i} className="text-center">
              <h3 className="text-5xl font-black text-slate-900 mb-3 tracking-tighter">{stat.value}</h3>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.25em]">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* FEATURES SECTION */}
      <section className="py-24 px-6 bg-eden-accent relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-tr from-black/20 to-transparent pointer-events-none"></div>

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-6 tracking-tight drop-shadow-sm">{isEn ? "Our Services" : "خدماتنا"}</h2>
            <div className="w-12 h-1 bg-white/20 mx-auto rounded-full shadow-sm"></div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                title: isEn ? "Advanced Surveying" : "الخدمات المساحية المتقدمة",
                desc: isEn ? "Using state-of-the-art equipment and techniques to ensure the highest levels of accuracy and efficiency." : "استخدام أحدث الأجهزة والتقنيات لضمان أعلى درجات الدقة والكفاءة.",
                icon: Scan
              },
              {
                title: isEn ? "GIS Services" : "خدمات (GIS)",
                desc: isEn ? "Spatial analysis, mapping, spatial data management, and decision support." : "التحليل المكاني، إنشاء الخرائط، إدارة البيانات المكانية، ودعم اتخاذ القرار.",
                icon: Globe
              },
              {
                title: isEn ? "Training Programs" : "برامج تدريبية",
                desc: isEn ? "Specialized training programs and courses in Surveying and GIS aimed at qualifying cadres and equipping them with the necessary scientific skills to keep pace with the labor market." : "برامج تدريبية ودورات متخصصة في المساحة وGIS تهدف إلى تأهيل الكوادر واكسابهم المهارات العلمية اللازمة لمواكبة سوق العمل.",
                icon: GraduationCap
              },
            ].map((feat, i) => (
              <Card key={i} className="flex flex-col items-center text-center p-8 group hover:border-white/40 transition-all duration-500 hover:-translate-y-2 bg-white border-4 border-white/20 shadow-xl rounded-3xl overflow-hidden relative">
                <div className="absolute inset-0 flex items-center justify-center opacity-25 pointer-events-none">
                  <img src={ASSETS.LOGO} alt="" className="w-56 h-56 object-contain rounded-full" style={{ mixBlendMode: 'multiply', filter: 'brightness(1.05)' }} />
                </div>

                <div className="relative z-10 flex flex-col items-center">
                  <div className="w-16 h-16 bg-eden-accent/5 text-eden-accent rounded-2xl flex items-center justify-center mb-6 border border-eden-accent/10 group-hover:bg-eden-accent group-hover:text-white transition-all duration-500 shadow-sm">
                    <feat.icon size={28} />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-3 tracking-tight">{feat.title}</h3>
                  <p className="text-slate-500 leading-relaxed text-sm font-medium">{feat.desc}</p>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-slate-50 py-24 px-6 text-slate-900 border-t border-slate-200">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-16">
          <div className="col-span-1 md:col-span-2">
            <div
              className="flex items-center gap-4 mb-8 cursor-pointer hover:opacity-80 active:scale-95 transition-all group w-fit"
              onClick={handleLogoClick}
            >
              <img src={ASSETS.LOGO} alt="Geo Top Logo" className="h-12 w-12 object-contain rounded-full group-hover:rotate-6 transition-transform" style={{ mixBlendMode: 'multiply', filter: 'brightness(1.05)' }} />
              <span className="font-bold text-2xl tracking-tighter text-slate-900">Geo Top</span>
            </div>
            <p className="text-slate-500 max-w-sm text-sm leading-relaxed font-medium">
              {isEn
                ? "Geo Top is a leading company in the field of Advanced Surveying and GIS, combining deep technical expertise with the latest technological solutions to provide high-quality services."
                : "Geo Top شركة رائدة في مجال المساحة المتقدمة و (GIS)، حيث تجمع بين الخبرة التقنية العميقة وأحدث الحلول التكنولوجية لتقديم خدمات عالية الجودة في هذا المجال."}
            </p>
          </div>
         
          <div className="flex flex-col gap-6">
            <div>
              <h4 className="font-bold text-slate-900 mb-8 uppercase text-[10px] tracking-[0.3em]">{isEn ? "Connect" : "تواصل"}</h4>
              <ul className="space-y-4 text-slate-500 text-xs font-bold">
                <li className="hover:text-eden-accent cursor-pointer transition-colors uppercase tracking-widest">
                  <a href="mailto:info@geo-top-group.com">info@geo-top-group.com</a>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-slate-900 mb-6 uppercase text-[10px] tracking-[0.3em]">{isEn ? "Follow Us" : "تابعنا"}</h4>
              <div className="flex flex-wrap gap-3">
                <a href="https://www.youtube.com/@geotopgroup" target="_blank" rel="noreferrer" className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 hover:bg-red-500 hover:text-white transition-all">
                  <Youtube size={16} />
                </a>
                <a href="https://www.instagram.com/geotopgroup/" target="_blank" rel="noreferrer" className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 hover:bg-pink-500 hover:text-white transition-all">
                  <Instagram size={16} />
                </a>
                <a href="https://www.facebook.com/profile.php?id=61560270966670" target="_blank" rel="noreferrer" className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 hover:bg-blue-600 hover:text-white transition-all">
                  <Facebook size={16} />
                </a>
                <a href="https://www.tiktok.com/@geotopgroup" target="_blank" rel="noreferrer" className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 hover:bg-black hover:text-white transition-all">
                  <span className="font-bold text-[10px]">TK</span>
                </a>
                <a href="https://x.com/geotopgroup" target="_blank" rel="noreferrer" className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 hover:bg-black hover:text-white transition-all">
                  <Twitter size={16} />
                </a>
                <a href="https://www.linkedin.com/company/geo-top-egypt" target="_blank" rel="noreferrer" className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 hover:bg-blue-700 hover:text-white transition-all">
                  <Linkedin size={16} />
                </a>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;