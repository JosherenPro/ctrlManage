'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, BookOpen, Calendar, Plus } from 'lucide-react';

import { api } from '@/lib/api';
import { Course } from '@/lib/types';
import { formatDate, getStatusLabel, statusColor } from '@/lib/utils';

export default function CourseDetailPage() {
  const { id } = useParams();
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id)
      api
        .get<Course>(`/courses/${id}`)
        .then(setCourse)
        .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="skeleton h-6 w-32 rounded" />
        <div className="skeleton h-10 w-1/2 rounded" />
        <div className="skeleton h-40 rounded-2xl" />
      </div>
    );
  }
  if (!course) {
    return (
      <div className="empty-state">
        <BookOpen className="mb-4 h-12 w-12 text-primary-500/30" />
        <p className="font-semibold text-slate-400">Cours non trouvé</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="animate-slide-up">
        <Link
          href="/courses"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-primary-400 hover:text-primary-300 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Retour aux cours
        </Link>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between animate-slide-up">
        <div>
          <div className="mb-2 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 shadow-lg">
              <BookOpen className="h-6 w-6 text-white" />
            </div>
            <span className="badge-info font-mono">{course.code}</span>
          </div>
          <h1 className="page-title mt-2">{course.title}</h1>
          {course.description && <p className="page-subtitle mt-2">{course.description}</p>}
          {course.teacher?.user?.fullName && (
            <div className="mt-3 flex items-center gap-2 text-sm text-slate-500">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-primary-500 to-cyan-500 text-[0.6rem] font-bold text-white">
                {course.teacher.user.fullName.charAt(0)}
              </div>
              {course.teacher.user.fullName}
            </div>
          )}
        </div>
        <Link href="/sessions/new" className="btn-primary shrink-0">
          <Plus className="mr-2 h-4 w-4" />
          Nouvelle session
        </Link>
      </div>

      <div className="card overflow-hidden animate-slide-up">
        <div className="border-b border-white/[0.04] px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-slate-500" />
            <h2 className="text-base font-semibold text-white">Sessions</h2>
          </div>
          <span className="text-sm text-slate-600">
            {course.sessions?.length || 0} session{course.sessions?.length !== 1 ? 's' : ''}
          </span>
        </div>
        {course.sessions?.length === 0 ? (
          <div className="py-16 text-center text-sm text-slate-600">
            Aucune session pour ce cours
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="table-header">
                  <th className="px-6 py-3">Date</th>
                  <th className="px-6 py-3">Salle</th>
                  <th className="px-6 py-3">Statut</th>
                </tr>
              </thead>
              <tbody>
                {course.sessions?.map(s => (
                  <tr key={s.id} className="table-row">
                    <td className="px-6 py-3 font-medium text-white">{formatDate(s.startsAt)}</td>
                    <td className="px-6 py-3 text-slate-500">{s.room || '—'}</td>
                    <td className="px-6 py-3">
                      <span className={statusColor(s.status)}>{getStatusLabel(s.status)}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
