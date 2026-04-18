'use client';

import { useState, Suspense } from 'react';
import { AlertCircle, CheckCircle2, Clock, Loader2, QrCode, Send, XCircle } from 'lucide-react';

import { useAuth } from '@/lib/auth-context';
import { api } from '@/lib/api';
import { useSocket } from '@/hooks/useSocket';

function ScanPageContent() {
  const { user } = useAuth();
  const studentId = user?.studentProfile?.id || '';

  // Enable browser notifications when a session opens
  useSocket({ enableNotifications: true });

  const [token, setToken] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [lastRecord, setLastRecord] = useState<{
    course: string;
    session: string;
    time: string;
  } | null>(null);
  const [scanHistory, setScanHistory] = useState<
    Array<{ course: string; success: boolean; time: string; message: string }>
  >([]);

  const handleScan = async () => {
    if (!token.trim() || !studentId) return;
    setStatus('loading');
    setMessage('');
    setLastRecord(null);

    try {
      const record = await api.post<any>('/attendance/scan', {
        token: token.trim(),
        studentId,
      });

      const courseName = record?.session?.course?.title || 'Cours';
      const sessionRoom = record?.session?.room || '—';

      setStatus('success');
      setMessage('Présence enregistrée avec succès !');
      setLastRecord({
        course: courseName,
        session: sessionRoom,
        time: new Date().toLocaleTimeString('fr-FR'),
      });
      setScanHistory(prev => [
        {
          course: courseName,
          success: true,
          time: new Date().toLocaleTimeString('fr-FR'),
          message: 'Présent',
        },
        ...prev,
      ]);
      setToken('');
    } catch (err: any) {
      const msg = err?.message || 'Erreur lors du scan';
      setStatus('error');
      setMessage(msg);
      setScanHistory(prev => [
        { course: '—', success: false, time: new Date().toLocaleTimeString('fr-FR'), message: msg },
        ...prev,
      ]);
    }
  };

  if (!studentId) {
    return (
      <div className="mx-auto max-w-md">
        <div className="card p-8 flex flex-col items-center text-center animate-slide-up">
          <QrCode className="mb-4 h-12 w-12 text-primary-500/30" />
          <p className="text-slate-500">
            Votre profil étudiant n&apos;est pas encore configuré. Contactez un administrateur.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md space-y-6">
      <div className="animate-slide-up">
        <div className="page-kicker mb-1">Présence</div>
        <h1 className="page-title">Scanner un QR code</h1>
        <p className="page-subtitle">
          Entrez le code affiché par le professeur pour enregistrer votre présence
        </p>
      </div>

      {/* Token input */}
      <div className="card-aurora glow-border relative overflow-hidden p-6 animate-slide-up">
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="h-48 w-48 rounded-full bg-gradient-to-br from-primary-500 to-cyan-500 opacity-[0.07] blur-3xl" />
        </div>

        <div className="relative space-y-4">
          <div className="flex items-center gap-3 rounded-xl border border-white/[0.06] bg-surface-2/50 p-4">
            <QrCode className="h-8 w-8 text-primary-400 shrink-0" />
            <div>
              <p className="text-sm font-medium text-white">Code de session</p>
              <p className="text-xs text-slate-500">Le professeur affiche ce code en classe</p>
            </div>
          </div>

          <div className="flex gap-3">
            <input
              className="input flex-1 font-mono text-center text-lg tracking-widest uppercase"
              placeholder="ENTREZ LE CODE"
              value={token}
              onChange={e => {
                setToken(e.target.value);
                setStatus('idle');
                setMessage('');
              }}
              onKeyDown={e => e.key === 'Enter' && handleScan()}
              autoFocus
            />
            <button
              onClick={handleScan}
              disabled={!token.trim() || status === 'loading'}
              className="btn-primary shrink-0 flex items-center gap-2"
            >
              {status === 'loading' ? (
                <span className="spinner h-4 w-4 border-2" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              <span>Valider</span>
            </button>
          </div>

          {/* Status feedback */}
          {status === 'success' && (
            <div className="flex items-center gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-3 animate-scale-in">
              <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />
              <div className="min-w-0">
                <p className="text-sm font-semibold text-emerald-400">{message}</p>
                {lastRecord && (
                  <p className="text-xs text-slate-500">
                    {lastRecord.course} · Salle {lastRecord.session} · {lastRecord.time}
                  </p>
                )}
              </div>
            </div>
          )}

          {status === 'error' && (
            <div className="flex items-center gap-3 rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3 animate-scale-in">
              <XCircle className="h-5 w-5 text-red-400 shrink-0" />
              <span className="text-sm text-red-400">{message}</span>
            </div>
          )}

          <div className="rounded-xl border border-primary-500/20 bg-primary-500/5 px-4 py-3 text-xs text-primary-400 flex items-start gap-2">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <span>
              Le code est généré par le professeur lors de l&apos;ouverture de la session. Il est
              valable 5 minutes.
            </span>
          </div>
        </div>
      </div>

      {/* Scan history */}
      {scanHistory.length > 0 && (
        <div className="card overflow-hidden animate-slide-up">
          <div className="border-b border-white/[0.04] px-6 py-4">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-slate-500" />
              <span className="text-sm font-medium text-white">
                Historique ({scanHistory.length})
              </span>
            </div>
          </div>
          <div className="max-h-64 overflow-y-auto">
            {scanHistory.map((entry, i) => (
              <div
                key={`${entry.course}-${entry.time}-${i}`}
                className="flex items-center gap-3 border-b border-white/[0.04] px-6 py-3 last:border-0"
              >
                {entry.success ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                ) : (
                  <XCircle className="h-4 w-4 text-red-400 shrink-0" />
                )}
                <span className="flex-1 text-sm text-white truncate">{entry.course}</span>
                <span className="text-xs text-slate-600">{entry.message}</span>
                <span className="text-xs text-slate-600 font-mono">{entry.time}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function ScanPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
        </div>
      }
    >
      <ScanPageContent />
    </Suspense>
  );
}
