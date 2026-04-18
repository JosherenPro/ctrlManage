'use client';
import { useState } from 'react';
import { CheckCircle2, Key, LogOut, Mail, User as UserIcon } from 'lucide-react';
import { toast } from 'sonner';

import { useAuth } from '@/lib/auth-context';
import { api } from '@/lib/api';
import { getRoleLabel } from '@/lib/utils';
export default function ProfilePage() {
  const { user, logout } = useAuth();
  const [changingPassword, setChangingPassword] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error('Les mots de passe ne correspondent pas');
      return;
    }
    if (newPassword.length < 6) {
      toast.error('Le mot de passe doit contenir au moins 6 caractères');
      return;
    }
    setSaving(true);
    try {
      await api.patch(`/users/${user?.id}`, { password: newPassword });
      toast.success('Mot de passe mis à jour');
      setChangingPassword(false);
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      toast.error(err.message || 'Erreur lors de la mise à jour');
    } finally {
      setSaving(false);
    }
  };
  const roleGradients: Record<string, string> = {
    ADMIN: 'from-violet-500 to-purple-600',
    PROFESSOR: 'from-cyan-500 to-blue-600',
    STUDENT: 'from-emerald-500 to-teal-600',
  };
  const gradient = roleGradients[user?.role?.name || ''] || 'from-slate-500 to-slate-600';
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="animate-slide-up">
        <div className="page-kicker mb-1">Compte</div>
        <h1 className="page-title">Profil</h1>
        <p className="page-subtitle">Gérez vos informations et la sécurité de votre compte.</p>
      </div>
      {/* Profile card */}
      <div className="card-aurora glow-border relative overflow-hidden p-6 animate-slide-up">
        <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-gradient-to-br from-primary-500 to-cyan-500 opacity-10 blur-3xl" />
        <div className="relative flex items-center gap-5">
          <div
            className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${gradient} text-2xl font-bold text-white shadow-glow-violet`}
          >
            {user?.fullName?.charAt(0)?.toUpperCase() || '?'}
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-xl font-bold text-white">{user?.fullName}</h2>
            <div className="mt-1 flex items-center gap-3 text-sm text-slate-500">
              <span className="flex items-center gap-1.5">
                <Mail className="h-3.5 w-3.5" />
                {user?.email}
              </span>
            </div>
            <div className="mt-2 flex items-center gap-2">
              <span className="inline-flex items-center rounded-lg bg-primary-500/10 px-2.5 py-1 text-xs font-semibold text-primary-400 ring-1 ring-primary-500/20">
                {getRoleLabel(user?.role?.name || '')}
              </span>
              {user?.status === 'ACTIVE' && (
                <span className="inline-flex items-center gap-1 text-xs text-emerald-400">
                  <CheckCircle2 className="h-3 w-3" /> Actif
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
      {/* Student info */}
      {user?.studentProfile && (
        <div className="card p-5 space-y-4 animate-slide-up">
          <div className="flex items-center gap-2">
            <UserIcon className="h-4 w-4 text-slate-500" />
            <h3 className="text-sm font-semibold text-white">Profil étudiant</h3>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl bg-surface-2 p-3">
              <div className="text-[0.65rem] font-bold uppercase tracking-[0.2em] text-slate-600">
                Matricule
              </div>
              <div className="mt-1 text-sm font-mono text-white">
                {user.studentProfile.studentNumber}
              </div>
            </div>
            <div className="rounded-xl bg-surface-2 p-3">
              <div className="text-[0.65rem] font-bold uppercase tracking-[0.2em] text-slate-600">
                Filière
              </div>
              <div className="mt-1 text-sm text-white">{user.studentProfile.program || '—'}</div>
            </div>
          </div>
        </div>
      )}
      {/* Teacher info */}
      {user?.teacherProfile && (
        <div className="card p-5 space-y-4 animate-slide-up">
          <div className="flex items-center gap-2">
            <UserIcon className="h-4 w-4 text-slate-500" />
            <h3 className="text-sm font-semibold text-white">Profil professeur</h3>
          </div>
          <div className="rounded-xl bg-surface-2 p-3">
            <div className="text-[0.65rem] font-bold uppercase tracking-[0.2em] text-slate-600">
              Numéro employé
            </div>
            <div className="mt-1 text-sm font-mono text-white">
              {user.teacherProfile.employeeNumber}
            </div>
          </div>
        </div>
      )}
      {/* Password change */}
      <div className="card p-5 space-y-4 animate-slide-up">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Key className="h-4 w-4 text-slate-500" />
            <h3 className="text-sm font-semibold text-white">Sécurité</h3>
          </div>
          {!changingPassword && (
            <button onClick={() => setChangingPassword(true)} className="btn-secondary btn-sm">
              Changer le mot de passe
            </button>
          )}
        </div>
        {changingPassword && (
          <form onSubmit={handleChangePassword} className="space-y-3">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-400">
                Nouveau mot de passe
              </label>
              <input
                type="password"
                className="input"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                placeholder="••••••••"
                required
                minLength={6}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-400">
                Confirmer le mot de passe
              </label>
              <input
                type="password"
                className="input"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                required
                minLength={6}
              />
            </div>
            <div className="flex gap-3 pt-1">
              <button type="submit" className="btn-primary" disabled={saving}>
                {saving ? <span className="spinner h-4 w-4 border-2" /> : 'Mettre à jour'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setChangingPassword(false);
                  setNewPassword('');
                  setConfirmPassword('');
                }}
                className="btn-secondary"
              >
                Annuler
              </button>
            </div>
          </form>
        )}
      </div>
      {/* Logout */}
      <div className="card p-5 animate-slide-up">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-white">Déconnexion</h3>
            <p className="text-xs text-slate-600 mt-1">
              Déconnectez-vous de votre session actuelle
            </p>
          </div>
          <button onClick={logout} className="btn-danger btn-sm">
            <LogOut className="mr-1.5 h-4 w-4" />
            Déconnexion
          </button>
        </div>
      </div>
    </div>
  );
}
