'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import {
  Activity,
  ArrowRight,
  BookOpen,
  Calendar,
  CheckCircle2,
  ClipboardCheck,
  QrCode,
  TrendingUp,
  Users,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from 'recharts';

import { useAuth } from '@/lib/auth-context';
import { api } from '@/lib/api';
import { formatDate, getStatusLabel, statusColor } from '@/lib/utils';

interface AnalyticsOverview {
  totalStudents?: number;
  totalCourses: number;
  totalSessions: number;
  openSessions: number;
  attendanceByMonth: { month: string; present: number; absent: number; late: number }[];
  topCourses?: {
    courseId: string;
    code: string;
    title: string;
    attendanceRate: number;
    totalSessions: number;
  }[];
  rate?: number;
  presentCount?: number;
  lateCount?: number;
  absentCount?: number;
}

const CHART_COLORS = { present: '#10b981', absent: '#ef4444', late: '#f59e0b' };

export default function DashboardPage() {
  const { user } = useAuth();
  const [analytics, setAnalytics] = useState<AnalyticsOverview | null>(null);
  const [recentSessions, setRecentSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [analyticsData, sessionsData] = await Promise.all([
          api.get<AnalyticsOverview>('/analytics/overview'),
          api.get<{ items: any[] }>('/sessions').catch(() => ({ items: [] })),
        ]);
        setAnalytics(analyticsData);
        setRecentSessions(sessionsData.items?.slice(0, 5) || []);
      } catch {}
      setLoading(false);
    }
    load();
  }, [user]);

  const role = user?.role?.name;

  const quickActions =
    role === 'ADMIN'
      ? [
          {
            href: '/users',
            label: 'Gérer les utilisateurs',
            icon: Users,
            color: 'from-violet-500 to-purple-600',
          },
          {
            href: '/courses/new',
            label: 'Créer un cours',
            icon: BookOpen,
            color: 'from-cyan-500 to-blue-600',
          },
          {
            href: '/reports',
            label: 'Voir les rapports',
            icon: TrendingUp,
            color: 'from-emerald-500 to-teal-600',
          },
        ]
      : role === 'PROFESSOR'
        ? [
            {
              href: '/sessions/new',
              label: 'Ouvrir une session',
              icon: Calendar,
              color: 'from-violet-500 to-purple-600',
            },
            {
              href: '/courses',
              label: 'Voir mes cours',
              icon: BookOpen,
              color: 'from-cyan-500 to-blue-600',
            },
            {
              href: '/reports',
              label: 'Analyser les présences',
              icon: TrendingUp,
              color: 'from-emerald-500 to-teal-600',
            },
          ]
        : [
            {
              href: '/scan',
              label: 'Scanner un code',
              icon: QrCode,
              color: 'from-violet-500 to-purple-600',
            },
            {
              href: '/attendance',
              label: 'Mes présences',
              icon: ClipboardCheck,
              color: 'from-cyan-500 to-blue-600',
            },
            {
              href: '/sessions',
              label: 'Voir les sessions',
              icon: Calendar,
              color: 'from-emerald-500 to-teal-600',
            },
          ];

  const statCards =
    role === 'ADMIN'
      ? [
          {
            label: 'Cours actifs',
            value: analytics?.totalCourses ?? 0,
            icon: BookOpen,
            gradient: 'from-violet-500 to-purple-600',
          },
          {
            label: 'Sessions',
            value: analytics?.totalSessions ?? 0,
            icon: Calendar,
            gradient: 'from-amber-500 to-orange-600',
          },
          {
            label: 'Étudiants',
            value: analytics?.totalStudents ?? 0,
            icon: Users,
            gradient: 'from-emerald-500 to-teal-600',
          },
          {
            label: 'En direct',
            value: analytics?.openSessions ?? 0,
            icon: Activity,
            gradient: 'from-cyan-500 to-blue-600',
            live: true,
          },
        ]
      : role === 'PROFESSOR'
        ? [
            {
              label: 'Mes cours',
              value: analytics?.totalCourses ?? 0,
              icon: BookOpen,
              gradient: 'from-violet-500 to-purple-600',
            },
            {
              label: 'Sessions',
              value: analytics?.totalSessions ?? 0,
              icon: Calendar,
              gradient: 'from-amber-500 to-orange-600',
            },
            {
              label: 'En direct',
              value: analytics?.openSessions ?? 0,
              icon: Activity,
              gradient: 'from-cyan-500 to-blue-600',
              live: true,
            },
          ]
        : [
            {
              label: 'Sessions',
              value: analytics?.totalSessions ?? 0,
              icon: Calendar,
              gradient: 'from-violet-500 to-purple-600',
            },
            {
              label: 'Présences',
              value: analytics?.presentCount ?? 0,
              icon: CheckCircle2,
              gradient: 'from-emerald-500 to-teal-600',
            },
          ];

  return (
    <div className="space-y-6">
      <div className="animate-slide-up">
        <div className="page-kicker mb-2">Bonjour, {user?.fullName?.split(' ')[0]}</div>
        <h1 className="text-3xl font-extrabold tracking-tight text-white">Tableau de bord</h1>
        <p className="mt-2 text-slate-500">
          {role === 'ADMIN'
            ? 'Supervisez la plateforme et les utilisateurs en temps réel.'
            : role === 'PROFESSOR'
              ? 'Gérez vos cours, sessions et présences sans friction.'
              : 'Suivez votre assiduité et scannez votre QR code.'}
        </p>
      </div>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="card p-5 space-y-3">
              <div className="skeleton h-12 w-12 rounded-xl" />
              <div className="skeleton h-8 w-20 rounded" />
              <div className="skeleton h-4 w-32 rounded" />
            </div>
          ))}
        </div>
      ) : (
        <>
          <div
            className={`grid gap-4 ${statCards.length <= 3 ? 'sm:grid-cols-3' : 'sm:grid-cols-2 xl:grid-cols-4'}`}
          >
            {statCards.map((s, i) => (
              <div
                key={s.label}
                className="card-aurora glow-border group relative overflow-hidden p-5 animate-slide-up"
                style={{ animationDelay: `${i * 80}ms` }}
              >
                <div
                  className={`absolute -right-6 -top-6 h-24 w-24 rounded-full bg-gradient-to-br ${s.gradient} opacity-10 blur-2xl transition-opacity group-hover:opacity-20`}
                />
                <div className="relative flex items-start gap-4">
                  <div
                    className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${s.gradient} bg-opacity-20 shadow-lg`}
                  >
                    <s.icon className="h-6 w-6 text-white" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-3xl font-extrabold tracking-tight text-white">
                      {s.value}
                    </div>
                    <div className="mt-1 flex items-center gap-2 text-sm text-slate-400">
                      {s.live && <span className="dot-live" />}
                      <span>{s.label}</span>
                    </div>
                    <div className="progress-bar mt-3">
                      <div
                        className="progress-fill"
                        style={{
                          width: `${Math.max(8, Math.min(100, Number(s.value) * 10 || 15))}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {role === 'STUDENT' && analytics?.rate !== undefined && (
            <div className="card-aurora relative overflow-hidden p-6 lg:p-8 animate-slide-up">
              <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-gradient-to-br from-primary-500 to-cyan-500 opacity-10 blur-3xl" />
              <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="page-kicker mb-2">Assiduité</div>
                  <h2 className="text-2xl font-bold text-white">Votre rythme de présence</h2>
                  <p className="mt-2 text-sm text-slate-500">
                    Taux calculé sur l&apos;ensemble de vos sessions
                  </p>
                </div>
                <div className="flex items-center gap-4 rounded-2xl border border-white/[0.06] bg-surface-2/80 px-6 py-4 backdrop-blur">
                  <div>
                    <div className="text-[0.6rem] font-bold uppercase tracking-[0.2em] text-slate-600">
                      Taux actuel
                    </div>
                    <div className="mt-1 text-4xl font-extrabold gradient-text">
                      {analytics.rate}%
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Attendance by month chart */}
          {analytics?.attendanceByMonth && analytics.attendanceByMonth.length > 0 && (
            <div className="card p-6 animate-slide-up" style={{ animationDelay: '150ms' }}>
              <div className="page-kicker mb-1">Statistiques</div>
              <h2 className="text-lg font-bold text-white mb-4">Présences par mois</h2>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={analytics.attendanceByMonth}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                  <XAxis dataKey="month" stroke="#94a3b8" fontSize={12} />
                  <YAxis stroke="#94a3b8" fontSize={12} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1e293b',
                      border: '1px solid rgba(255,255,255,0.08)',
                      borderRadius: '0.75rem',
                      color: '#fff',
                    }}
                  />
                  <Legend
                    formatter={(value: string) => <span style={{ color: '#94a3b8' }}>{value}</span>}
                  />
                  <Bar
                    dataKey="present"
                    name="Présent"
                    fill={CHART_COLORS.present}
                    radius={[2, 2, 0, 0]}
                  />
                  <Bar
                    dataKey="late"
                    name="Retard"
                    fill={CHART_COLORS.late}
                    radius={[2, 2, 0, 0]}
                  />
                  <Bar
                    dataKey="absent"
                    name="Absent"
                    fill={CHART_COLORS.absent}
                    radius={[2, 2, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Top courses */}
          {analytics?.topCourses && analytics.topCourses.length > 0 && (
            <div className="card p-6 animate-slide-up" style={{ animationDelay: '250ms' }}>
              <div className="page-kicker mb-1">Performance</div>
              <h2 className="text-lg font-bold text-white mb-4">Cours les plus suivis</h2>
              <div className="space-y-3">
                {analytics.topCourses.map(course => (
                  <div key={course.courseId} className="flex items-center gap-4">
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-white">{course.title}</span>
                        <span className="text-sm font-bold gradient-text">
                          {course.attendanceRate}%
                        </span>
                      </div>
                      <div className="progress-bar mt-1.5">
                        <div
                          className="progress-fill"
                          style={{ width: `${course.attendanceRate}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="animate-slide-up" style={{ animationDelay: '200ms' }}>
            <div className="page-kicker mb-3">Actions rapides</div>
            <div className="grid gap-3 sm:grid-cols-3">
              {quickActions.map(action => (
                <Link
                  key={action.href}
                  href={action.href}
                  className="card-interactive glow-border group flex items-center gap-4 p-4"
                >
                  <div
                    className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${action.color} shadow-lg`}
                  >
                    <action.icon className="h-5 w-5 text-white" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-semibold text-white">{action.label}</div>
                    <div className="text-xs text-slate-600">Accéder</div>
                  </div>
                  <ArrowRight className="h-4 w-4 text-slate-600 transition-transform group-hover:translate-x-1 group-hover:text-primary-400" />
                </Link>
              ))}
            </div>
          </div>

          {recentSessions.length > 0 && (
            <div
              className="card overflow-hidden animate-slide-up"
              style={{ animationDelay: '300ms' }}
            >
              <div className="page-header border-b border-white/[0.04] px-6 py-4">
                <div>
                  <div className="page-kicker mb-1">Activité</div>
                  <h2 className="text-lg font-bold text-white">Sessions récentes</h2>
                </div>
                <Link href="/sessions" className="btn-secondary btn-sm">
                  Voir tout <ArrowRight className="ml-1 h-3.5 w-3.5" />
                </Link>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="table-header">
                      <th className="px-6 py-3">Cours</th>
                      <th className="px-6 py-3">Date</th>
                      <th className="px-6 py-3">Salle</th>
                      <th className="px-6 py-3">Statut</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentSessions.map(s => (
                      <tr key={s.id} className="table-row">
                        <td className="px-6 py-3 font-medium text-white">
                          {s.course?.title || '—'}
                        </td>
                        <td className="px-6 py-3 text-slate-500">{formatDate(s.startsAt)}</td>
                        <td className="px-6 py-3 text-slate-500">{s.room || '—'}</td>
                        <td className="px-6 py-3">
                          <span className={statusColor(s.status)}>{getStatusLabel(s.status)}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
