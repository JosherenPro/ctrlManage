'use client';

import { useEffect, useState } from 'react';
import { BarChart3 } from 'lucide-react';

import { api } from '@/lib/api';
import { PaginatedResponse } from '@/lib/types';

interface ReportItemOption {
  id: string;
  label: string;
}
interface SessionOption {
  id: string;
  startsAt: string;
  course?: { title?: string };
}
interface CourseOption {
  id: string;
  title: string;
  code: string;
}
interface ClassOption {
  id: string;
  name: string;
  code: string;
}
interface StudentOption {
  fullName: string;
  studentProfile?: { id?: string };
}

export default function ReportsPage() {
  const [reportType, setReportType] = useState<'session' | 'course' | 'class' | 'student'>(
    'course',
  );
  const [id, setId] = useState('');
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<ReportItemOption[]>([]);

  useEffect(() => {
    const fetches: Record<typeof reportType, () => Promise<ReportItemOption[]>> = {
      session: () =>
        api.get<PaginatedResponse<SessionOption>>('/sessions').then(data =>
          data.items.map(s => ({
            id: s.id,
            label: `${s.course?.title || s.id} — ${s.startsAt}`,
          })),
        ),
      course: () =>
        api
          .get<PaginatedResponse<CourseOption>>('/courses')
          .then(data => data.items.map(c => ({ id: c.id, label: `${c.title} (${c.code})` }))),
      class: () =>
        api
          .get<PaginatedResponse<ClassOption>>('/classes')
          .then(data => data.items.map(c => ({ id: c.id, label: `${c.name} (${c.code})` }))),
      student: () =>
        api
          .get<PaginatedResponse<StudentOption>>('/users?role=STUDENT')
          .then(data =>
            data.items
              .map(s => ({ id: s.studentProfile?.id || '', label: s.fullName }))
              .filter(s => s.id),
          ),
    };
    fetches[reportType]().then(setItems);
    setReport(null);
  }, [reportType]);

  const handleGenerate = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const data = await api.get(`/reports/${reportType}/${id}`);
      setReport(data);
    } catch {}
    setLoading(false);
  };

  const typeLabels = {
    course: 'Par cours',
    session: 'Par session',
    class: 'Par classe',
    student: 'Par étudiant',
  };

  return (
    <div className="space-y-6">
      <div className="page-header animate-slide-up">
        <div>
          <div className="page-kicker mb-1">Analyse</div>
          <h1 className="page-title">Rapports</h1>
          <p className="page-subtitle">Générez des rapports de présence par dimension.</p>
        </div>
      </div>

      <div className="card p-5 space-y-4 animate-slide-up">
        <div className="flex flex-wrap gap-2">
          {(Object.keys(typeLabels) as Array<keyof typeof typeLabels>).map(type => (
            <button
              key={type}
              onClick={() => setReportType(type)}
              className={`btn ${reportType === type ? 'btn-primary' : 'btn-secondary'}`}
            >
              {typeLabels[type]}
            </button>
          ))}
        </div>
        <div className="flex gap-3">
          <select className="select flex-1" value={id} onChange={e => setId(e.target.value)}>
            <option value="">Sélectionner un élément</option>
            {items.map(i => (
              <option key={i.id} value={i.id}>
                {i.label}
              </option>
            ))}
          </select>
          <button
            onClick={handleGenerate}
            className="btn-primary shrink-0"
            disabled={!id || loading}
          >
            {loading ? <span className="spinner h-4 w-4 border-2" /> : 'Générer'}
          </button>
        </div>
      </div>

      {report && (
        <div className="space-y-4 animate-scale-in">
          {/* Rate hero */}
          {(report.attendanceRate !== undefined || report.rate !== undefined) && (
            <div className="card-aurora relative overflow-hidden p-6">
              <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-gradient-to-br from-primary-500 to-cyan-500 opacity-10 blur-3xl" />
              <div className="relative flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-primary-500 to-cyan-500 shadow-glow-violet">
                  <BarChart3 className="h-6 w-6 text-white" />
                </div>
                <div>
                  <div className="text-[0.6rem] font-bold uppercase tracking-[0.2em] text-slate-600">
                    Taux de présence
                  </div>
                  <div className="text-4xl font-extrabold gradient-text">
                    {report.attendanceRate || report.rate}%
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Metrics grid */}
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {report.total !== undefined && (
              <div className="card p-4">
                <div className="text-xs text-slate-600 mb-1">Enregistrements</div>
                <div className="text-2xl font-bold text-white">{report.total}</div>
              </div>
            )}
            {report.present !== undefined && (
              <div className="card p-4">
                <div className="text-xs text-emerald-500 mb-1">Présents</div>
                <div className="text-2xl font-bold text-emerald-400">{report.present}</div>
              </div>
            )}
            {report.late !== undefined && (
              <div className="card p-4">
                <div className="text-xs text-amber-500 mb-1">Retards</div>
                <div className="text-2xl font-bold text-amber-400">{report.late}</div>
              </div>
            )}
            {report.absent !== undefined && (
              <div className="card p-4">
                <div className="text-xs text-red-500 mb-1">Absents</div>
                <div className="text-2xl font-bold text-red-400">{report.absent}</div>
              </div>
            )}
            {report.totalSessions !== undefined && (
              <div className="card p-4">
                <div className="text-xs text-cyan-500 mb-1">Sessions</div>
                <div className="text-2xl font-bold text-cyan-400">{report.totalSessions}</div>
              </div>
            )}
            {report.totalStudents !== undefined && (
              <div className="card p-4">
                <div className="text-xs text-violet-500 mb-1">Étudiants</div>
                <div className="text-2xl font-bold text-violet-400">{report.totalStudents}</div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
