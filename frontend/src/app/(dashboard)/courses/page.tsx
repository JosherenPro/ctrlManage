'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { BookOpen, Plus, Sparkles } from 'lucide-react';

import { useAuth } from '@/lib/auth-context';
import { api } from '@/lib/api';
import { Course, PaginatedResponse } from '@/lib/types';

export default function CoursesPage() {
  const { user } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get<PaginatedResponse<Course>>('/courses')
      .then(data => setCourses(data.items))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const gradients = [
    'from-violet-500 to-purple-600',
    'from-cyan-500 to-blue-600',
    'from-emerald-500 to-teal-600',
    'from-amber-500 to-orange-600',
    'from-pink-500 to-rose-600',
  ];

  return (
    <div className="space-y-6">
      <div className="page-header animate-slide-up">
        <div>
          <div className="page-kicker mb-1">Catalogue</div>
          <h1 className="page-title">Cours</h1>
          <p className="page-subtitle">Explorez et structurez vos cours depuis une vue unifiée.</p>
        </div>
        {user?.role?.name === 'ADMIN' && (
          <Link href="/courses/new" className="btn-primary">
            <Plus className="mr-2 h-4 w-4" />
            Nouveau cours
          </Link>
        )}
      </div>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="card p-5 space-y-3">
              <div className="skeleton h-6 w-16 rounded-lg" />
              <div className="skeleton h-5 w-3/4 rounded" />
              <div className="skeleton h-4 w-1/2 rounded" />
            </div>
          ))}
        </div>
      ) : courses.length === 0 ? (
        <div className="empty-state animate-slide-up">
          <Sparkles className="mb-4 h-12 w-12 text-primary-500/30" />
          <p className="font-semibold text-slate-400">Aucun cours</p>
          <p className="mt-1 text-sm text-slate-600">
            Créez votre premier cours pour lancer votre espace académique
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {courses.map((c, i) => (
            <Link
              key={c.id}
              href={`/courses/${c.id}`}
              className="card-interactive glow-border group p-5 animate-slide-up"
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <div className="mb-4 flex items-center gap-3">
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${gradients[i % gradients.length]} shadow-lg`}
                >
                  <BookOpen className="h-5 w-5 text-white" />
                </div>
                <span className="badge-info font-mono">{c.code}</span>
              </div>
              <h3 className="text-base font-semibold text-white group-hover:text-primary-300 transition-colors">
                {c.title}
              </h3>
              {c.description && (
                <p className="mt-2 text-sm text-slate-500 line-clamp-2">{c.description}</p>
              )}
              {c.teacher?.user?.fullName && (
                <div className="mt-4 flex items-center gap-2 text-sm text-slate-500">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-primary-500 to-cyan-500 text-[0.6rem] font-bold text-white">
                    {c.teacher.user.fullName.charAt(0)}
                  </span>
                  {c.teacher.user.fullName}
                </div>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
