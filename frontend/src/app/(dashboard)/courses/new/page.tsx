'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Sparkles } from 'lucide-react';

import { api } from '@/lib/api';
import { Class, PaginatedResponse } from '@/lib/types';

export default function NewCoursePage() {
  const router = useRouter();
  const [classes, setClasses] = useState<Class[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [form, setForm] = useState({
    code: '',
    title: '',
    description: '',
    classId: '',
    teacherId: '',
  });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    Promise.all([
      api.get<PaginatedResponse<Class>>('/classes'),
      api.get<PaginatedResponse<any>>('/users?role=PROFESSOR'),
    ]).then(([cls, usersData]) => {
      setClasses(cls.items);
      setTeachers(
        usersData.items
          .filter(u => u.teacherProfile)
          .map(u => ({
            id: u.teacherProfile.id,
            name: u.fullName,
            employeeNumber: u.teacherProfile.employeeNumber,
          })),
      );
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await api.post('/courses', form);
      router.push('/courses');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div className="animate-slide-up">
        <Link
          href="/courses"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-primary-400 hover:text-primary-300 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Retour aux cours
        </Link>
        <div className="mt-4 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 shadow-lg">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="page-title">Nouveau cours</h1>
            <p className="page-subtitle">Créez une nouvelle unité pédagogique.</p>
          </div>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-3 text-sm text-red-400 animate-scale-in">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="card p-6 space-y-4 animate-slide-up">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-400">Code</label>
            <input
              className="input font-mono"
              value={form.code}
              onChange={e => setForm({ ...form, code: e.target.value })}
              placeholder="INFO-301"
              required
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-400">Titre</label>
            <input
              className="input"
              value={form.title}
              onChange={e => setForm({ ...form, title: e.target.value })}
              placeholder="Bases de données"
              required
            />
          </div>
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-400">Description</label>
          <textarea
            className="input"
            value={form.description}
            onChange={e => setForm({ ...form, description: e.target.value })}
            rows={3}
            placeholder="Description du cours…"
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-400">Classe</label>
            <select
              className="select"
              value={form.classId}
              onChange={e => setForm({ ...form, classId: e.target.value })}
              required
            >
              <option value="">Sélectionner</option>
              {classes.map(c => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.code})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-400">Professeur</label>
            <select
              className="select"
              value={form.teacherId}
              onChange={e => setForm({ ...form, teacherId: e.target.value })}
              required
            >
              <option value="">Sélectionner</option>
              {teachers.map(t => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="flex gap-3 pt-2">
          <button type="submit" className="btn-primary" disabled={submitting}>
            {submitting ? <span className="spinner h-4 w-4 border-2" /> : 'Créer le cours'}
          </button>
          <button type="button" onClick={() => router.back()} className="btn-secondary">
            Annuler
          </button>
        </div>
      </form>
    </div>
  );
}
