'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  Copy,
  FileDown,
  FileSpreadsheet,
  MapPin,
  Play,
  QrCode,
  Search,
  Square,
  UserPlus,
  Users,
  X,
  AlertCircle,
  XCircle,
  LogOut,
} from 'lucide-react';
import { toast } from 'sonner';

import { useAuth } from '@/lib/auth-context';
import { api } from '@/lib/api';
import { Session } from '@/lib/types';
import { formatDate, getStatusLabel, statusColor } from '@/lib/utils';
import { useSocket } from '@/hooks/useSocket';

const QRCode = dynamic(() => import('react-qr-code'), { ssr: false });

interface SearchResult {
  id: string;
  studentNumber: string;
  user: { id: string; fullName: string; email: string };
  class: { id: string; code: string; name: string } | null;
}

export default function SessionDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [showManual, setShowManual] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<SearchResult | null>(null);
  const [scanStatus, setScanStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [scanMessage, setScanMessage] = useState('');
  const [sessionQrToken, setSessionQrToken] = useState<string | null>(null);
  const [exporting, setExporting] = useState<'pdf' | 'excel' | null>(null);
  const [closingAndExporting, setClosingAndExporting] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const loadSession = useCallback(() => {
    if (id)
      api
        .get<Session>(`/sessions/${id}`)
        .then(setSession)
        .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    loadSession();
  }, [loadSession]);

  // Real-time updates via WebSocket
  const { joinSession, leaveSession } = useSocket({
    onNewAttendance: () => {
      loadSession();
      toast.info('Nouvelle présence enregistrée');
    },
    onSessionStatusChange: data => {
      if (data.status === 'CLOSED') {
        loadSession();
        toast.info('Session fermée');
      }
    },
  });

  useEffect(() => {
    if (id && typeof id === 'string') {
      joinSession(id);
      return () => leaveSession(id);
    }
  }, [id, joinSession, leaveSession]);

  // Auto-refresh every 10s when session is OPEN (fallback)
  useEffect(() => {
    if (session?.status !== 'OPEN') return;
    const interval = setInterval(loadSession, 10000);
    return () => clearInterval(interval);
  }, [session?.status, loadSession]);

  // Student search with debounce
  const handleStudentSearch = (query: string) => {
    setSearchQuery(query);
    setSelectedStudent(null);
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);

    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setSearchLoading(true);
    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const results = await api.get<SearchResult[]>(
          `/students/search?q=${encodeURIComponent(query.trim())}`,
        );
        setSearchResults(results);
      } catch {
        setSearchResults([]);
      } finally {
        setSearchLoading(false);
      }
    }, 300);
  };

  const selectStudent = (student: SearchResult) => {
    setSelectedStudent(student);
    setSearchQuery(`${student.user.fullName} (${student.studentNumber})`);
    setSearchResults([]);
  };

  const handleOpen = async () => {
    setActionLoading(true);
    try {
      await api.post(`/sessions/${id}/open`, {});
      toast.success('Session ouverte');
      loadSession();
    } catch (err: any) {
      toast.error(err.message || 'Erreur');
    } finally {
      setActionLoading(false);
    }
  };

  const handleClose = async () => {
    setActionLoading(true);
    try {
      await api.post(`/sessions/${id}/close`, {});
      toast.success('Session fermée');
      loadSession();
    } catch (err: any) {
      toast.error(err.message || 'Erreur');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCloseAndExport = async () => {
    setClosingAndExporting(true);
    try {
      await api.post(`/sessions/${id}/close`, {});
      loadSession();
      toast.success('Session fermée');
      // Auto-download Excel
      const token = localStorage.getItem('token');
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
      const res = await fetch(`${API_URL}/reports/export/excel/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Export échoué');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `presence-session.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      toast.success('Export Excel téléchargé');
    } catch (err: any) {
      toast.error(err.message || 'Erreur');
    } finally {
      setClosingAndExporting(false);
    }
  };

  const handleGenerateQr = async () => {
    setActionLoading(true);
    try {
      const result = await api.post<{ token: string; qrUrl: string }>(`/sessions/${id}/qrcode`);
      setSessionQrToken(result.token);
      toast.success('QR code généré — valide 5 minutes');
    } catch (err: any) {
      toast.error(err.message || 'Erreur');
    } finally {
      setActionLoading(false);
    }
  };

  const handleManualRegister = async () => {
    if (!selectedStudent) return;
    setScanStatus('loading');
    try {
      await api.post('/attendance/register', { sessionId: id, studentId: selectedStudent.id });
      setScanStatus('success');
      setScanMessage(`${selectedStudent.user.fullName} enregistré(e) !`);
      toast.success('Présence enregistrée');
      setSelectedStudent(null);
      setSearchQuery('');
      loadSession();
    } catch (err: any) {
      setScanStatus('error');
      setScanMessage(err.message || 'Erreur');
      toast.error(err.message || 'Erreur');
    }
  };

  const handleExport = async (format: 'pdf' | 'excel') => {
    if (!id) return;
    setExporting(format);
    try {
      const token = localStorage.getItem('token');
      const endpoint =
        format === 'pdf' ? `/reports/export/pdf/${id}` : `/reports/export/excel/${id}`;
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
      const res = await fetch(`${API_URL}${endpoint}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Export échoué');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `presence-session.${format === 'pdf' ? 'pdf' : 'xlsx'}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      toast.success(`Export ${format.toUpperCase()} téléchargé`);
    } catch (err: any) {
      toast.error(err.message || `Erreur export ${format.toUpperCase()}`);
    } finally {
      setExporting(null);
    }
  };

  const handleValidate = async (recordId: string, status: string) => {
    try {
      await api.patch(`/attendance/${recordId}/validate`, { status });
      toast.success('Présence validée');
      loadSession();
    } catch (err: any) {
      toast.error(err.message || 'Erreur');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="spinner-lg" />
      </div>
    );
  }
  if (!session) {
    return <div className="empty-state">Session introuvable</div>;
  }

  const isAdmin = user?.role?.name === 'ADMIN';
  const isProf = user?.role?.name === 'PROFESSOR';
  const canManage = isAdmin || isProf;
  const records = session.attendanceRecords || [];
  const presentCount = records.filter(r => r.status === 'PRESENT' || r.status === 'LATE').length;
  const attendanceRate = records.length ? ((presentCount / records.length) * 100).toFixed(1) : '0';

  const statusGradients: Record<string, string> = {
    DRAFT: 'from-amber-500 to-orange-600',
    OPEN: 'from-emerald-500 to-teal-600',
    CLOSED: 'from-slate-500 to-slate-600',
    CANCELLED: 'from-red-500 to-rose-600',
  };

  return (
    <div className="space-y-6">
      <div className="animate-slide-up">
        <Link
          href="/sessions"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-primary-400 hover:text-primary-300 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Retour aux sessions
        </Link>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between animate-slide-up">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${statusGradients[session.status] || 'from-slate-500 to-slate-600'} shadow-lg`}
            >
              {session.status === 'OPEN' ? (
                <QrCode className="h-5 w-5 text-white" />
              ) : (
                <Clock className="h-5 w-5 text-white" />
              )}
            </div>
            <h1 className="page-title">{session.course?.title || 'Session'}</h1>
            <span className={statusColor(session.status)}>{getStatusLabel(session.status)}</span>
            {session.status === 'OPEN' && (
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500" />
              </span>
            )}
          </div>
          <p className="text-sm text-slate-500">
            {formatDate(session.startsAt)} — {formatDate(session.endsAt)}
            {session.room && (
              <span className="inline-flex items-center gap-1 ml-2">
                <MapPin className="h-3 w-3" /> Salle {session.room}
              </span>
            )}
          </p>
        </div>

        {canManage && (
          <div className="flex flex-wrap gap-2 shrink-0">
            {session.status === 'DRAFT' && (
              <button onClick={handleOpen} disabled={actionLoading} className="btn-success">
                <Play className="mr-2 h-4 w-4" />
                Ouvrir
              </button>
            )}
            {session.status === 'OPEN' && (
              <>
                <button
                  onClick={handleGenerateQr}
                  disabled={actionLoading}
                  className="btn-secondary"
                >
                  <QrCode className="mr-2 h-4 w-4" />
                  Générer QR
                </button>
                <button
                  onClick={() => {
                    setShowManual(!showManual);
                    searchInputRef.current?.focus();
                  }}
                  className="btn-secondary"
                >
                  <UserPlus className="mr-2 h-4 w-4" />
                  Manuel
                </button>
                <button onClick={handleClose} disabled={actionLoading} className="btn-danger">
                  <Square className="mr-2 h-4 w-4" />
                  Fermer
                </button>
              </>
            )}
            {session.status === 'OPEN' && (
              <button
                onClick={handleCloseAndExport}
                disabled={closingAndExporting}
                className="btn-primary"
              >
                {closingAndExporting ? (
                  <span className="spinner h-4 w-4 border-2 mr-2" />
                ) : (
                  <LogOut className="mr-2 h-4 w-4" />
                )}
                Fermer & Exporter
              </button>
            )}
            {records.length > 0 && session.status !== 'OPEN' && (
              <>
                <button
                  onClick={() => handleExport('pdf')}
                  disabled={exporting !== null}
                  className="btn-secondary"
                >
                  {exporting === 'pdf' ? (
                    <span className="spinner h-4 w-4 border-2 mr-2" />
                  ) : (
                    <FileDown className="mr-2 h-4 w-4" />
                  )}
                  PDF
                </button>
                <button
                  onClick={() => handleExport('excel')}
                  disabled={exporting !== null}
                  className="btn-secondary"
                >
                  {exporting === 'excel' ? (
                    <span className="spinner h-4 w-4 border-2 mr-2" />
                  ) : (
                    <FileSpreadsheet className="mr-2 h-4 w-4" />
                  )}
                  Excel
                </button>
              </>
            )}
          </div>
        )}
      </div>

      {/* QR Code display */}
      {sessionQrToken && (
        <div className="card-aurora glow-border p-8 flex flex-col items-center animate-scale-in">
          <h3 className="text-base font-bold text-white mb-2">Code de présence</h3>
          <p className="text-xs text-slate-500 mb-6">
            Les étudiants entrent ce code sur leur page Scanner
          </p>

          <div className="rounded-2xl border-2 border-primary-500/30 bg-surface-2 px-8 py-5 mb-6 text-center">
            <div className="font-mono text-3xl font-black tracking-[0.3em] text-primary-400 uppercase select-all">
              {sessionQrToken}
            </div>
          </div>

          <div className="rounded-2xl border border-white/[0.08] bg-white p-5 mb-4">
            <QRCode value={sessionQrToken} size={200} />
          </div>
          <p className="text-xs text-slate-500 mb-4">
            Scannez ou recopiez le code · Valable 5 minutes
          </p>

          <button
            onClick={() => navigator.clipboard.writeText(sessionQrToken)}
            className="btn-primary btn-sm"
          >
            <Copy className="mr-1.5 h-3.5 w-3.5" />
            Copier le code
          </button>
        </div>
      )}

      {/* Stats */}
      <div
        className="grid gap-4 sm:grid-cols-4 animate-slide-up"
        style={{ animationDelay: '100ms' }}
      >
        <div className="stat-card">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 shadow-lg">
            <Users className="h-6 w-6 text-white" />
          </div>
          <div className="min-w-0">
            <div className="text-2xl font-extrabold text-white">{records.length}</div>
            <div className="text-sm text-slate-500">Enregistrés</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg">
            <CheckCircle2 className="h-6 w-6 text-white" />
          </div>
          <div className="min-w-0">
            <div className="text-2xl font-extrabold text-white">{presentCount}</div>
            <div className="text-sm text-slate-500">Présents</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 shadow-lg">
            <MapPin className="h-6 w-6 text-white" />
          </div>
          <div className="min-w-0">
            <div className="text-2xl font-extrabold text-white">{session.room || '—'}</div>
            <div className="text-sm text-slate-500">Salle</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 shadow-lg">
            <Clock className="h-6 w-6 text-white" />
          </div>
          <div className="min-w-0">
            <div className="text-2xl font-extrabold gradient-text">{attendanceRate}%</div>
            <div className="text-sm text-slate-500">Taux présence</div>
          </div>
        </div>
      </div>

      {/* Manual registration panel with student search */}
      {showManual && session.status === 'OPEN' && (
        <div className="card p-6 space-y-4 relative animate-scale-in">
          <button
            onClick={() => {
              setShowManual(false);
              setScanStatus('idle');
              setSearchQuery('');
              setSelectedStudent(null);
              setSearchResults([]);
            }}
            className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-600 hover:text-white hover:bg-white/[0.06] cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
          <h2 className="text-lg font-semibold text-white">Enregistrement manuel</h2>
          <p className="text-sm text-slate-500">Recherchez un étudiant par nom ou matricule</p>
          {scanStatus === 'success' && (
            <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 flex items-center gap-3">
              <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />
              <span className="text-sm text-emerald-400">{scanMessage}</span>
            </div>
          )}
          {scanStatus === 'error' && (
            <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-4 flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-red-400 shrink-0" />
              <span className="text-sm text-red-400">{scanMessage}</span>
            </div>
          )}

          {/* Search input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
            <input
              ref={searchInputRef}
              className="input pl-10 w-full"
              placeholder="Rechercher par nom ou matricule..."
              value={searchQuery}
              onChange={e => handleStudentSearch(e.target.value)}
              autoComplete="off"
            />
            {searchLoading && (
              <span className="absolute right-3 top-1/2 -translate-y-1/2 spinner h-4 w-4 border-2" />
            )}
          </div>

          {/* Search results dropdown */}
          {searchResults.length > 0 && !selectedStudent && (
            <div className="rounded-xl border border-white/[0.08] bg-surface-2 overflow-hidden max-h-48 overflow-y-auto">
              {searchResults.map(student => (
                <button
                  key={student.id}
                  onClick={() => selectStudent(student)}
                  className="w-full px-4 py-3 text-left hover:bg-white/[0.04] transition-colors flex items-center justify-between"
                >
                  <div>
                    <div className="text-sm font-medium text-white">{student.user.fullName}</div>
                    <div className="text-xs text-slate-500">{student.user.email}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono text-primary-400 bg-primary-500/10 px-2 py-0.5 rounded">
                      {student.studentNumber}
                    </span>
                    {student.class && (
                      <span className="text-xs text-slate-500">{student.class.code}</span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Selected student confirmation */}
          {selectedStudent && (
            <div className="rounded-xl border border-primary-500/20 bg-primary-500/5 p-4 flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-white">
                  {selectedStudent.user.fullName}
                </div>
                <div className="text-xs text-primary-400 font-mono">
                  {selectedStudent.studentNumber}
                </div>
              </div>
              <button
                onClick={() => {
                  setSelectedStudent(null);
                  setSearchQuery('');
                }}
                className="p-1 rounded text-slate-500 hover:text-white"
              >
                <XCircle className="h-4 w-4" />
              </button>
            </div>
          )}

          {/* Register button */}
          <button
            onClick={handleManualRegister}
            disabled={!selectedStudent || scanStatus === 'loading'}
            className="btn-primary w-full"
          >
            {scanStatus === 'loading' ? (
              <span className="spinner h-4 w-4 border-2 mr-2" />
            ) : (
              <UserPlus className="mr-2 h-4 w-4" />
            )}
            {selectedStudent
              ? `Enregistrer ${selectedStudent.user.fullName}`
              : 'Sélectionnez un étudiant'}
          </button>
        </div>
      )}

      {/* Attendance records with validate actions */}
      <div className="card overflow-hidden animate-slide-up" style={{ animationDelay: '200ms' }}>
        <div className="border-b border-white/[0.04] px-6 py-4 flex items-center justify-between">
          <h2 className="text-base font-semibold text-white">Liste de présence</h2>
          <div className="flex items-center gap-3">
            <span className="text-sm text-slate-600">
              {records.length} étudiant{records.length !== 1 ? 's' : ''}
            </span>
            {session.status === 'OPEN' && (
              <span className="flex items-center gap-1.5 text-xs text-emerald-400">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                </span>
                Temps réel
              </span>
            )}
            {records.length > 0 && canManage && session.status !== 'OPEN' && (
              <div className="flex gap-2">
                <button
                  onClick={() => handleExport('pdf')}
                  disabled={exporting !== null}
                  className="btn-sm btn-ghost text-primary-400 hover:bg-primary-500/10"
                  title="Exporter en PDF"
                >
                  <FileDown className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleExport('excel')}
                  disabled={exporting !== null}
                  className="btn-sm btn-ghost text-emerald-400 hover:bg-emerald-500/10"
                  title="Exporter en Excel"
                >
                  <FileSpreadsheet className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>
        </div>
        {records.length === 0 ? (
          <div className="py-16 text-center text-sm text-slate-600">
            <Users className="mx-auto mb-3 h-10 w-10 text-slate-700" />
            Aucune présence enregistrée
            <p className="mt-1 text-xs text-slate-700">
              {session.status === 'OPEN'
                ? 'Générez un QR code ou ajoutez manuellement les étudiants'
                : 'Ouvrez la session pour commencer'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="table-header">
                  <th className="px-6 py-3">Étudiant</th>
                  <th className="px-6 py-3">Matricule</th>
                  <th className="px-6 py-3">Statut</th>
                  <th className="px-6 py-3">Heure scan</th>
                  {canManage && <th className="px-6 py-3 text-right">Valider</th>}
                </tr>
              </thead>
              <tbody>
                {records.map(r => (
                  <tr key={r.id} className="table-row group">
                    <td className="px-6 py-3 font-medium text-white">
                      {r.student?.user?.fullName || '—'}
                    </td>
                    <td className="px-6 py-3 text-slate-500 font-mono text-xs">
                      {r.student?.studentNumber || '—'}
                    </td>
                    <td className="px-6 py-3">
                      <span className={statusColor(r.status)}>{getStatusLabel(r.status)}</span>
                    </td>
                    <td className="px-6 py-3 text-slate-500 font-mono text-xs">
                      {r.scannedAt ? formatDate(r.scannedAt) : '—'}
                    </td>
                    {canManage && (
                      <td className="px-6 py-3 text-right">
                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => handleValidate(r.id, 'PRESENT')}
                            className="btn-sm btn-ghost text-emerald-400 hover:bg-emerald-500/10"
                            title="Marquer présent"
                          >
                            <CheckCircle2 className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => handleValidate(r.id, 'LATE')}
                            className="btn-sm btn-ghost text-amber-400 hover:bg-amber-500/10"
                            title="Marquer en retard"
                          >
                            <Clock className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => handleValidate(r.id, 'ABSENT')}
                            className="btn-sm btn-ghost text-red-400 hover:bg-red-500/10"
                            title="Marquer absent"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => handleValidate(r.id, 'JUSTIFIED')}
                            className="btn-sm btn-ghost text-blue-400 hover:bg-blue-500/10"
                            title="Marquer justifié"
                          >
                            <AlertCircle className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    )}
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
