'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, CalendarPlus, ShieldAlert } from 'lucide-react';

import { useAuth } from '@/lib/auth-context';
import { api } from '@/lib/api';
import { Course, PaginatedResponse } from '@/lib/types';

export default function NewSessionPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [form, setForm] = useState({ courseId: '', startsAt: '', endsAt: '', room: '' });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const canCreate = user?.role?.name === 'ADMIN' || user?.role?.name === 'PROFESSOR';

  useEffect(() => {
    if (!canCreate) return;
    api.get<PaginatedResponse<Course>>('/courses').then(data => setCourses(data.items));
  }, [canCreate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await api.post('/sessions', form);
      router.push('/sessions');
    } catch (err: any) {
      if (err.message?.includes('403') || err.message?.toLowerCase().includes('forbidden')) {
        setError("Vous n'avez pas les droits pour créer une session.");
      } else {
        setError(err.message || 'Erreur lors de la création');
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (!canCreate) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="card p-8 text-center max-w-md mx-auto">
          <ShieldAlert className="mx-auto mb-4 h-12 w-12 text-red-400" />
          <h2 className="text-lg font-semibold text-white mb-2">Accès refusé</h2>
          <p className="text-sm text-slate-400">
            Seuls les professeurs et administrateurs peuvent créer des sessions.
          </p>
          <Link href="/sessions" className="btn-secondary mt-4 inline-block">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Retour aux sessions
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div className="animate-slide-up">
        <Link
          href="/sessions"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-primary-400 hover:text-primary-300 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Retour aux sessions
        </Link>
        <div className="mt-4 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 shadow-lg">
            <CalendarPlus className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="page-title">Nouvelle session</h1>
            <p className="page-subtitle">Planifiez une nouvelle session de présence.</p>
          </div>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-3 text-sm text-red-400 animate-scale-in">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="card p-6 space-y-4 animate-slide-up">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-400">Cours</label>
          <select
            className="select"
            value={form.courseId}
            onChange={e => setForm({ ...form, courseId: e.target.value })}
            required
          >
            <option value="">Sélectionner</option>
            {courses.map(c => (
              <option key={c.id} value={c.id}>
                {c.title} ({c.code})
              </option>
            ))}
          </select>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-400">Début</label>
            <input
              type="datetime-local"
              className="input"
              value={form.startsAt}
              onChange={e => setForm({ ...form, startsAt: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-400">Fin</label>
            <input
              type="datetime-local"
              className="input"
              value={form.endsAt}
              onChange={e => setForm({ ...form, endsAt: e.target.value })}
              required
            />
          </div>
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-400">Salle</label>
          <input
            className="input"
            value={form.room}
            onChange={e => setForm({ ...form, room: e.target.value })}
            placeholder="Bâtiment A - Salle 204"
          />
        </div>
        <div className="flex gap-3 pt-2">
          <button type="submit" className="btn-primary" disabled={submitting}>
            {submitting ? <span className="spinner h-4 w-4 border-2" /> : 'Créer la session'}
          </button>
          <button type="button" onClick={() => router.back()} className="btn-secondary">
            Annuler
          </button>
        </div>
      </form>
    </div>
  );
}
