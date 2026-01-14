import React, { useState, useEffect } from "react";
import { Lang, Theme } from "../../types";
import { api } from "../../api/client";
import { Card, Button } from "../../components/UI";
import { Reveal } from "../../components/Reveal";
import {
  TrendingUp,
  Trophy,
  Medal,
  Zap,
  Target,
  ArrowUp,
} from "lucide-react";

interface TopStudent {
  rank: number;
  id: number;
  name: string;
  completed_lessons: number;
  avatar: string | null;
}

interface Props {
  lang: Lang;
  theme: Theme;
}

const TopStudentsPage: React.FC<Props> = ({ lang, theme }) => {
  const [topStudents, setTopStudents] = useState<TopStudent[]>([]);
  const [loading, setLoading] = useState(true);

  const isEn = lang === "en";

  useEffect(() => {
    api.courses
      .getTopStudents()
      .then((data) => {
        setTopStudents(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load top students:", err);
        setLoading(false);
      });
  }, []);

  return (
    <div className="pt-32 sm:pt-40 pb-10 px-4 lg:px-8 max-w-7xl mx-auto min-h-screen relative">
      {/* Header */}
      <Reveal>
        <div className="mb-12">
          <div className="flex items-center gap-4 mb-4">
            <Trophy className="text-amber-500" size={40} />
            <div>
              <h1 className="text-4xl font-bold text-slate-900 dark:text-white">
                {isEn ? "Top Students" : "أفضل الطلاب"}
              </h1>
              <p className="text-slate-500 dark:text-slate-400 mt-2">
                {isEn
                  ? "Ranked by completed lessons"
                  : "مرتبة حسب الدروس المكتملة"}
              </p>
            </div>
          </div>
        </div>
      </Reveal>

      {loading ? (
        <Reveal width="100%">
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin">
              <Zap className="text-primary" size={40} />
            </div>
          </div>
        </Reveal>
      ) : topStudents.length === 0 ? (
        <Reveal width="100%">
          <Card className="text-center py-20">
            <Target size={48} className="mx-auto text-slate-300 mb-4" />
            <p className="text-slate-500 dark:text-slate-400">
              {isEn ? "No students yet" : "لا يوجد طلاب حتى الآن"}
            </p>
          </Card>
        </Reveal>
      ) : (
        <>
          {/* Top 3 Podium */}
          <Reveal className="mb-12" width="100%">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
              {topStudents.slice(0, 3).map((student, index) => (
                <Reveal
                  key={student.id}
                  delay={index * 0.1}
                  width="100%"
                  className={index === 0 ? "md:col-span-3 md:max-w-sm md:mx-auto" : ""}
                >
                  <div
                    className={`relative rounded-2xl p-8 overflow-hidden text-center transform transition-all hover:scale-105 ${
                      index === 0
                        ? "bg-gradient-to-br from-amber-400 via-amber-300 to-amber-500 shadow-2xl shadow-amber-500/40 ring-4 ring-amber-200 dark:ring-amber-900/50"
                        : index === 1
                        ? "bg-gradient-to-br from-slate-400 via-slate-300 to-slate-500 shadow-xl shadow-slate-400/40 ring-2 ring-slate-200 dark:ring-slate-900/50"
                        : "bg-gradient-to-br from-orange-400 via-orange-300 to-orange-500 shadow-xl shadow-orange-500/40 ring-2 ring-orange-200 dark:ring-orange-900/50"
                    }`}
                  >
                    {/* Medal Icon */}
                    <div className="absolute top-4 right-4">
                      {index === 0 ? (
                        <Trophy className="text-white" size={32} />
                      ) : index === 1 ? (
                        <Medal className="text-white" size={32} />
                      ) : (
                        <Medal className="text-white" size={32} />
                      )}
                    </div>

                    {/* Rank Badge */}
                    <div className="mb-6 inline-block">
                      <div
                        className={`w-16 h-16 rounded-full flex items-center justify-center text-3xl font-bold text-white ${
                          index === 0
                            ? "bg-amber-600"
                            : index === 1
                            ? "bg-slate-600"
                            : "bg-orange-600"
                        } shadow-lg`}
                      >
                        {student.rank}
                      </div>
                    </div>

                    {/* Avatar */}
                    {student.avatar ? (
                      <img
                        src={student.avatar}
                        alt={student.name}
                        className="w-24 h-24 rounded-full mx-auto mb-4 object-cover border-4 border-white/70 shadow-lg"
                      />
                    ) : (
                      <div className="w-24 h-24 rounded-full mx-auto mb-4 flex items-center justify-center text-4xl font-bold text-white bg-white/20 border-4 border-white/70 shadow-lg">
                        {student.name.charAt(0)}
                      </div>
                    )}

                    {/* Name */}
                    <h3 className="text-2xl font-bold text-white mb-2 truncate">
                      {student.name}
                    </h3>

                    {/* Stats */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-center gap-2">
                        <TrendingUp className="text-white/90" size={20} />
                        <p className="text-xl font-bold text-white/90">
                          {student.completed_lessons}{" "}
                          {isEn ? "lessons" : "دروس"}
                        </p>
                      </div>

                      {/* Progress Bar */}
                      <div className="h-2 bg-white/30 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-white/90 rounded-full transition-all"
                          style={{
                            width: `${(student.completed_lessons / 100) * 100}%`,
                          }}
                        />
                      </div>
                    </div>

                    {/* Motivation Text */}
                    <p className="mt-4 text-sm text-white/80 font-semibold">
                      {index === 0
                        ? isEn
                          ? "🏆 Outstanding Performance!"
                          : "🏆 أداء متميز!"
                        : index === 1
                        ? isEn
                          ? "🥈 Great Work!"
                          : "🥈 عمل رائع!"
                        : isEn
                        ? "🥉 Keep it Up!"
                        : "🥉 استمر!"}
                    </p>
                  </div>
                </Reveal>
              ))}
            </div>
          </Reveal>

          {/* Remaining Students */}
          {topStudents.length > 3 && (
            <Reveal width="100%">
              <Card className="!p-6 border-primary/20">
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-3">
                  <ArrowUp className="text-primary" size={28} />
                  {isEn ? "Other Top Performers" : "المتفوقون الآخرون"}
                </h2>

                <div className="space-y-3">
                  {topStudents.slice(3).map((student, index) => (
                    <Reveal key={student.id} delay={index * 0.05}>
                      <div className="flex items-center gap-4 p-4 rounded-xl hover:bg-slate-50 dark:hover:bg-white/5 border border-slate-200 dark:border-white/10 transition-colors">
                        {/* Rank */}
                        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary dark:text-primary text-lg">
                          #{student.rank}
                        </div>

                        {/* Avatar */}
                        {student.avatar ? (
                          <img
                            src={student.avatar}
                            alt={student.name}
                            className="w-12 h-12 rounded-full object-cover border-2 border-primary/30"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-lg font-bold text-primary">
                            {student.name.charAt(0)}
                          </div>
                        )}

                        {/* Info */}
                        <div className="flex-1">
                          <h4 className="font-bold text-slate-900 dark:text-white">
                            {student.name}
                          </h4>
                          <p className="text-sm text-slate-500 dark:text-slate-400">
                            {student.completed_lessons}{" "}
                            {isEn ? "lessons completed" : "دروس مكتملة"}
                          </p>
                        </div>

                        {/* Progress */}
                        <div className="w-32">
                          <div className="h-2 bg-slate-200 dark:bg-white/10 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-primary rounded-full transition-all"
                              style={{
                                width: `${(student.completed_lessons / 100) * 100}%`,
                              }}
                            />
                          </div>
                          <p className="text-xs font-bold text-primary mt-1">
                            {student.completed_lessons}%
                          </p>
                        </div>
                      </div>
                    </Reveal>
                  ))}
                </div>
              </Card>
            </Reveal>
          )}
        </>
      )}
    </div>
  );
};

export default TopStudentsPage;
