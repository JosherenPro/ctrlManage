'use client';

import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, Shield, Terminal } from 'lucide-react';

import { api } from '@/lib/api';
import { AuditLog, PaginatedResponse } from '@/lib/types';
import { formatDate } from '@/lib/utils';

export default function AuditPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    setLoading(true);
    api
      .get<PaginatedResponse<AuditLog>>(`/audit?page=${page}&limit=25`)
      .then(data => {
        setLogs(data.items);
        setTotal(data.total);
      })
      .finally(() => setLoading(false));
  }, [page]);

  const totalPages = Math.ceil(total / 25);

  return (
    <div className="space-y-6">
      <div className="page-header animate-slide-up">
        <div>
          <div className="page-kicker mb-1">Sécurité</div>
          <h1 className="page-title">Journal d&apos;audit</h1>
          <p className="page-subtitle">Traçabilité des actions critiques.</p>
        </div>
        <span className="text-sm text-slate-600">
          {total} événement{total !== 1 ? 's' : ''}
        </span>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="card p-4 flex gap-4">
              <div className="skeleton h-8 w-8 rounded-lg shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="skeleton h-4 w-1/4 rounded" />
                <div className="skeleton h-3 w-2/3 rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : logs.length === 0 ? (
        <div className="empty-state animate-slide-up">
          <Shield className="mb-4 h-12 w-12 text-primary-500/30" />
          <p className="font-semibold text-slate-400">Aucun log</p>
          <p className="mt-1 text-sm text-slate-600">Les actions critiques apparaîtront ici</p>
        </div>
      ) : (
        <>
          <div className="card overflow-hidden animate-slide-up">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="table-header">
                    <th className="px-6 py-3.5">Date</th>
                    <th className="px-6 py-3.5">Acteur</th>
                    <th className="px-6 py-3.5">Action</th>
                    <th className="px-6 py-3.5">Type</th>
                    <th className="px-6 py-3.5">ID</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map(l => (
                    <tr key={l.id} className="table-row group">
                      <td className="px-6 py-3.5 text-slate-500 whitespace-nowrap text-xs font-mono">
                        {formatDate(l.createdAt)}
                      </td>
                      <td className="px-6 py-3.5">
                        {l.actor ? (
                          <div className="flex items-center gap-2">
                            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-surface-3 text-[0.6rem] font-bold text-slate-400">
                              {l.actor.fullName.charAt(0)}
                            </div>
                            <span className="font-medium text-white">{l.actor.fullName}</span>
                          </div>
                        ) : (
                          <span className="text-slate-600">Système</span>
                        )}
                      </td>
                      <td className="px-6 py-3.5">
                        <span className="inline-flex items-center gap-1.5 rounded-lg bg-primary-500/10 px-2.5 py-1 font-mono text-xs font-medium text-primary-400">
                          <Terminal className="h-3 w-3" />
                          {l.action}
                        </span>
                      </td>
                      <td className="px-6 py-3.5 text-slate-500 text-xs">{l.entityType}</td>
                      <td className="px-6 py-3.5 font-mono text-xs text-slate-600">
                        {l.entityId || '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                className="btn-secondary btn-sm"
                disabled={page <= 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="text-sm text-slate-500">
                Page <span className="font-semibold text-white">{page}</span> / {totalPages}
              </span>
              <button
                onClick={() => setPage(Math.min(totalPages, page + 1))}
                className="btn-secondary btn-sm"
                disabled={page >= totalPages}
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
