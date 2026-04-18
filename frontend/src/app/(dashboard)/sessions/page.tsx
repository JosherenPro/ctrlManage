'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Calendar, Plus, QrCode, Clock } from 'lucide-react';

import { useAuth } from '@/lib/auth-context';
import { api } from '@/lib/api';
import { Session, PaginatedResponse } from '@/lib/types';
import { formatDate, getStatusLabel, statusColor } from '@/lib/utils';

export default function SessionsPage() {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get<PaginatedResponse<Session>>('/sessions')
      .then(data => setSessions(data.items))
      .finally(() => setLoading(false));
  }, []);

  const canCreate = user?.role?.name === 'ADMIN' || user?.role?.name === 'PROFESSOR';

  return (
    <div className="space-y-6">
      <div className="page-header animate-slide-up">
        <div>
          <div className="page-kicker mb-1">Planning</div>
          <h1 className="page-title">Sessions</h1>
          <p className="page-subtitle">Toutes les sessions de présence organisées par cours.</p>
        </div>
        {canCreate && (
          <Link href="/sessions/new" className="btn-primary">
            <Plus className="mr-2 h-4 w-4" />
            Nouvelle session
          </Link>
        )}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="card p-4 flex gap-4">
              <div className="skeleton h-12 w-12 rounded-xl shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="skeleton h-4 w-1/3 rounded" />
                <div className="skeleton h-3 w-1/2 rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : sessions.length === 0 ? (
        <div className="empty-state animate-slide-up">
          <Calendar className="mb-4 h-12 w-12 text-primary-500/30" />
          <p className="font-semibold text-slate-400">Aucune session</p>
          <p className="mt-1 text-sm text-slate-600">
            Créez une session pour lancer un contrôle de présence
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {sessions.map((s, i) => (
            <Link
              key={s.id}
              href={`/sessions/${s.id}`}
              className="card-interactive glow-border group flex items-center gap-4 p-4 animate-slide-up"
              style={{ animationDelay: `${i * 50}ms` }}
            >
              <div
                className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl shadow-lg ${
                  s.status === 'OPEN'
                    ? 'bg-gradient-to-br from-emerald-500 to-teal-600'
                    : s.status === 'CLOSED'
                      ? 'bg-gradient-to-br from-slate-600 to-slate-700'
                      : s.status === 'CANCELLED'
                        ? 'bg-gradient-to-br from-red-500 to-rose-600'
                        : 'bg-gradient-to-br from-amber-500 to-orange-600'
                }`}
              >
                {s.status === 'OPEN' ? (
                  <QrCode className="h-5 w-5 text-white" />
                ) : (
                  <Clock className="h-5 w-5 text-white" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold text-white group-hover:text-primary-300 transition-colors truncate">
                    {s.course?.title || 'Session'}
                  </h3>
                  {s.status === 'OPEN' && <span className="dot-live" />}
                </div>
                <div className="mt-0.5 flex items-center gap-3 text-xs text-slate-500">
                  <span>{formatDate(s.startsAt)}</span>
                  {s.room && <span>· Salle {s.room}</span>}
                </div>
              </div>
              <span className={statusColor(s.status)}>{getStatusLabel(s.status)}</span>
              <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                {s.status === 'OPEN' && (
                  <span className="btn-primary btn-sm">
                    <QrCode className="mr-1 h-3.5 w-3.5" />
                    QR
                  </span>
                )}
                <span className="btn-secondary btn-sm">Détails</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
