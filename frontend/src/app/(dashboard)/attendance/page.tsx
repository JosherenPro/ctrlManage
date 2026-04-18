'use client';

import { useEffect, useState } from 'react';
import { CheckCircle2, ClipboardCheck, Clock, XCircle, ShieldCheck, BarChart3 } from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';

import { useAuth } from '@/lib/auth-context';
import { api } from '@/lib/api';
import { AttendanceRecord, Session, PaginatedResponse } from '@/lib/types';
import { formatDate, getStatusLabel, statusColor } from '@/lib/utils';

const PIE_COLORS = ['#10b981', '#f59e0b', '#ef4444', '#3b82f6'];

export default function AttendancePage() {
  const { user } = useAuth();
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const role = user?.role?.name;
    if (role === 'STUDENT') {
      api
        .get<AttendanceRecord[]>('/attendance/me')
        .then(setRecords)
        .catch(() => {})
        .finally(() => setLoading(false));
    } else {
      api
        .get<PaginatedResponse<Session>>('/sessions')
        .then(data => {
          const recentSessions = data.items.slice(0, 10);
          return Promise.all(
            recentSessions.map(s =>
              api.get<AttendanceRecord[]>(`/attendance/session/${s.id}`).catch(() => []),
            ),
          );
        })
        .then(allRecords => setRecords(allRecords.flat()))
        .catch(() => {})
        .finally(() => setLoading(false));
    }
  }, [user]);

  const role = user?.role?.name;
  const isStudent = role === 'STUDENT';

  const presentCount = records.filter(r => r.status === 'PRESENT').length;
  const lateCount = records.filter(r => r.status === 'LATE').length;
  const absentCount = records.filter(r => r.status === 'ABSENT').length;
  const justifiedCount = records.filter(r => r.status === 'JUSTIFIED').length;
  const attendanceRate = records.length
    ? (((presentCount + lateCount) / records.length) * 100).toFixed(1)
    : '0';

  // Pie chart data
  const pieData = [
    { name: 'Présent', value: presentCount, color: PIE_COLORS[0] },
    { name: 'Retard', value: lateCount, color: PIE_COLORS[1] },
    { name: 'Absent', value: absentCount, color: PIE_COLORS[2] },
    { name: 'Justifié', value: justifiedCount, color: PIE_COLORS[3] },
  ].filter(d => d.value > 0);

  // Group by course for student view
  const courseStats = isStudent
    ? Object.entries(
        records.reduce(
          (acc, r) => {
            const courseName = r.session?.course?.title || 'Inconnu';
            if (!acc[courseName]) acc[courseName] = { total: 0, present: 0 };
            acc[courseName].total++;
            if (r.status === 'PRESENT' || r.status === 'LATE') acc[courseName].present++;
            return acc;
          },
          {} as Record<string, { total: number; present: number }>,
        ),
      ).map(([name, data]) => ({
        name,
        rate: data.total ? ((data.present / data.total) * 100).toFixed(0) : '0',
        total: data.total,
        present: data.present,
      }))
    : [];

  const statusIcon = (status: string) => {
    switch (status) {
      case 'PRESENT':
        return <CheckCircle2 className="h-4 w-4 text-emerald-400" />;
      case 'LATE':
        return <Clock className="h-4 w-4 text-amber-400" />;
      case 'ABSENT':
        return <XCircle className="h-4 w-4 text-red-400" />;
      default:
        return <ShieldCheck className="h-4 w-4 text-primary-400" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="page-header animate-slide-up">
        <div>
          <div className="page-kicker mb-1">Suivi</div>
          <h1 className="page-title">Présences</h1>
          <p className="page-subtitle">
            {isStudent
              ? 'Historique de vos enregistrements de présence.'
              : 'Enregistrements de présence pour les sessions récentes.'}
          </p>
        </div>
      </div>

      {/* Stats cards */}
      {records.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4 animate-slide-up">
          {isStudent && (
            <div className="card-aurora glow-border relative overflow-hidden p-5">
              <div className="absolute -right-4 -top-4 h-20 w-20 rounded-full bg-gradient-to-br from-primary-500 to-cyan-500 opacity-10 blur-2xl" />
              <div className="relative">
                <div className="text-[0.6rem] font-bold uppercase tracking-[0.2em] text-slate-600">
                  Taux
                </div>
                <div className="mt-1 text-3xl font-extrabold gradient-text">{attendanceRate}%</div>
                <div className="progress-bar mt-2">
                  <div
                    className="progress-fill"
                    style={{ width: `${Math.min(100, Number(attendanceRate))}%` }}
                  />
                </div>
              </div>
            </div>
          )}
          <div className="card p-4">
            <div className="flex items-center gap-2 text-xs text-emerald-400 mb-1">
              <CheckCircle2 className="h-3.5 w-3.5" /> Présents
            </div>
            <div className="text-2xl font-bold text-white">{presentCount}</div>
          </div>
          <div className="card p-4">
            <div className="flex items-center gap-2 text-xs text-amber-400 mb-1">
              <Clock className="h-3.5 w-3.5" /> Retards
            </div>
            <div className="text-2xl font-bold text-white">{lateCount}</div>
          </div>
          <div className="card p-4">
            <div className="flex items-center gap-2 text-xs text-red-400 mb-1">
              <XCircle className="h-3.5 w-3.5" /> Absences
            </div>
            <div className="text-2xl font-bold text-white">{absentCount}</div>
          </div>
        </div>
      )}

      {/* Student chart section */}
      {isStudent && records.length > 0 && (
        <div className="grid gap-6 lg:grid-cols-2 animate-slide-up">
          {/* Pie chart */}
          <div className="card p-6">
            <h3 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-primary-400" />
              Répartition des présences
            </h3>
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    dataKey="value"
                    stroke="none"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={index} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1e293b',
                      border: '1px solid rgba(255,255,255,0.08)',
                      borderRadius: '0.75rem',
                      color: '#fff',
                      fontSize: '0.875rem',
                    }}
                    itemStyle={{ color: '#fff' }}
                  />
                  <Legend
                    formatter={(value: string) => (
                      <span style={{ color: '#94a3b8', fontSize: '0.8rem' }}>{value}</span>
                    )}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="py-10 text-center text-sm text-slate-600">Aucune donnée</div>
            )}
          </div>

          {/* Course breakdown */}
          <div className="card p-6">
            <h3 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-primary-400" />
              Taux par cours
            </h3>
            {courseStats.length > 0 ? (
              <div className="space-y-3">
                {courseStats.map(stat => (
                  <div key={stat.name} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-white font-medium truncate">{stat.name}</span>
                      <span className="text-slate-400 text-xs">
                        {stat.present}/{stat.total} — {stat.rate}%
                      </span>
                    </div>
                    <div className="progress-bar">
                      <div
                        className="progress-fill"
                        style={{ width: `${Math.min(100, Number(stat.rate))}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-10 text-center text-sm text-slate-600">Aucune donnée</div>
            )}
          </div>
        </div>
      )}

      {/* Records table */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="card p-4 flex gap-4">
              <div className="skeleton h-10 w-10 rounded-xl shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="skeleton h-4 w-1/3 rounded" />
                <div className="skeleton h-3 w-1/2 rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : records.length === 0 ? (
        <div className="empty-state animate-slide-up">
          <ClipboardCheck className="mb-4 h-12 w-12 text-primary-500/30" />
          <p className="font-semibold text-slate-400">Aucune présence</p>
          <p className="mt-1 text-sm text-slate-600">
            {isStudent
              ? 'Vos présences apparaîtront ici après scan'
              : 'Aucun enregistrement de présence trouvé'}
          </p>
        </div>
      ) : (
        <div className="card overflow-hidden animate-slide-up">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="table-header">
                  <th className="px-6 py-3.5">Statut</th>
                  <th className="px-6 py-3.5">Cours</th>
                  <th className="px-6 py-3.5">Date session</th>
                  <th className="px-6 py-3.5">Heure scan</th>
                </tr>
              </thead>
              <tbody>
                {records.map(r => (
                  <tr key={r.id} className="table-row">
                    <td className="px-6 py-3.5">
                      <div className="flex items-center gap-2">
                        {statusIcon(r.status)}
                        <span className={statusColor(r.status)}>{getStatusLabel(r.status)}</span>
                      </div>
                    </td>
                    <td className="px-6 py-3.5 font-medium text-white">
                      {r.session?.course?.title || '—'}
                    </td>
                    <td className="px-6 py-3.5 text-slate-500">
                      {r.session?.startsAt ? formatDate(r.session.startsAt) : '—'}
                    </td>
                    <td className="px-6 py-3.5 text-slate-500 font-mono text-xs">
                      {r.scannedAt ? formatDate(r.scannedAt) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
