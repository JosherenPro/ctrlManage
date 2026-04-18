'use client';

import { useEffect, useState } from 'react';
import { BookOpen, Calendar, Clock, MapPin, User } from 'lucide-react';
import Link from 'next/link';

import { useAuth } from '@/lib/auth-context';
import { api } from '@/lib/api';
import { Course, PaginatedResponse, Session } from '@/lib/types';
import { formatDate, statusColor, getStatusLabel } from '@/lib/utils';

export default function MyCoursesPage() {
  const { user } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [sessionsMap, setSessionsMap] = useState<Record<string, Session[]>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const role = user.role?.name;

    if (role === 'STUDENT' && user.studentProfile?.classId) {
      // Get courses for student's class
      api
        .get<PaginatedResponse<Course>>(`/courses?classId=${user.studentProfile.classId}`)
        .then(data => {
          setCourses(data.items);
          return data.items;
        })
        .then(coursesList => {
          // Load sessions for each course
          Promise.all(
            coursesList.map(c =>
              api
                .get<PaginatedResponse<Session>>(`/sessions?courseId=${c.id}`)
                .then(s => s.items)
                .catch(() => []),
            ),
          ).then(allSessions => {
            const map: Record<string, Session[]> = {};
            coursesList.forEach((c, i) => {
              map[c.id] = allSessions[i];
            });
            setSessionsMap(map);
          });
        })
        .catch(() => {})
        .finally(() => setLoading(false));
    } else if (role === 'PROFESSOR' && user.teacherProfile?.id) {
      // Get courses for teacher
      api
        .get<PaginatedResponse<Course>>('/courses')
        .then(data => {
          const teacherCourses = data.items.filter(c => c.teacherId === user.teacherProfile!.id);
          setCourses(teacherCourses);
          return teacherCourses;
        })
        .then(coursesList => {
          Promise.all(
            coursesList.map(c =>
              api
                .get<PaginatedResponse<Session>>(`/sessions?courseId=${c.id}`)
                .then(s => s.items)
                .catch(() => []),
            ),
          ).then(allSessions => {
            const map: Record<string, Session[]> = {};
            coursesList.forEach((c, i) => {
              map[c.id] = allSessions[i];
            });
            setSessionsMap(map);
          });
        })
        .catch(() => {})
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="spinner-lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="page-header animate-slide-up">
        <div>
          <div className="page-kicker mb-1">Cours</div>
          <h1 className="page-title">Mes cours</h1>
          <p className="page-subtitle">
            {user?.role?.name === 'STUDENT'
              ? 'Les cours de votre classe.'
              : 'Les cours que vous enseignez.'}
          </p>
        </div>
      </div>

      {courses.length === 0 ? (
        <div className="empty-state animate-slide-up">
          <BookOpen className="mb-4 h-12 w-12 text-primary-500/30" />
          <p className="font-semibold text-slate-400">Aucun cours trouvé</p>
          <p className="mt-1 text-sm text-slate-600">
            Contactez l&apos;administration pour être assigné à des cours.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {courses.map((course, index) => {
            const sessions = sessionsMap[course.id] || [];
            const openSessions = sessions.filter(s => s.status === 'OPEN');
            const closedSessions = sessions.filter(s => s.status === 'CLOSED');
            const nextSession = sessions
              .filter(s => new Date(s.startsAt) > new Date())
              .sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime())[0];

            return (
              <div
                key={course.id}
                className="card hover:border-primary-500/30 transition-all animate-slide-up"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="p-5 space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-base font-semibold text-white truncate">
                        {course.title}
                      </h3>
                      <p className="text-sm text-primary-400 font-mono">{course.code}</p>
                    </div>
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 shadow-lg shrink-0 ml-3">
                      <BookOpen className="h-5 w-5 text-white" />
                    </div>
                  </div>

                  {course.description && (
                    <p className="text-sm text-slate-500 line-clamp-2">{course.description}</p>
                  )}

                  {course.teacher?.user && (
                    <div className="flex items-center gap-2 text-sm text-slate-500">
                      <User className="h-3.5 w-3.5" />
                      <span>{course.teacher.user.fullName}</span>
                    </div>
                  )}

                  {/* Sessions summary */}
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="rounded-lg bg-surface-2 px-2 py-1.5">
                      <div className="text-lg font-bold text-white">{sessions.length}</div>
                      <div className="text-[0.6rem] text-slate-500 uppercase">Total</div>
                    </div>
                    <div className="rounded-lg bg-surface-2 px-2 py-1.5">
                      <div className="text-lg font-bold text-emerald-400">
                        {openSessions.length}
                      </div>
                      <div className="text-[0.6rem] text-slate-500 uppercase">Ouvertes</div>
                    </div>
                    <div className="rounded-lg bg-surface-2 px-2 py-1.5">
                      <div className="text-lg font-bold text-slate-400">
                        {closedSessions.length}
                      </div>
                      <div className="text-[0.6rem] text-slate-500 uppercase">Fermées</div>
                    </div>
                  </div>

                  {/* Next session */}
                  {nextSession && (
                    <div className="flex items-center gap-2 text-xs text-slate-500 border-t border-white/[0.04] pt-3">
                      <Calendar className="h-3.5 w-3.5 text-primary-400" />
                      <span>Prochaine : {formatDate(nextSession.startsAt)}</span>
                      {nextSession.room && (
                        <>
                          <MapPin className="h-3 w-3 ml-1" />
                          <span>Salle {nextSession.room}</span>
                        </>
                      )}
                      <span className={statusColor(nextSession.status)}>
                        {getStatusLabel(nextSession.status)}
                      </span>
                    </div>
                  )}

                  <Link
                    href={`/sessions?courseId=${course.id}`}
                    className="btn-secondary w-full text-center block"
                  >
                    <Clock className="mr-2 h-4 w-4" />
                    Voir les sessions
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
