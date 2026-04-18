'use client';

import { useEffect, useState } from 'react';
import {
  Search,
  ShieldAlert,
  ShieldCheck,
  UserPlus,
  Users as UsersIcon,
  X,
  Upload,
  FileText,
  Download,
} from 'lucide-react';

import { api } from '@/lib/api';
import { User, PaginatedResponse } from '@/lib/types';
import { getStatusLabel, statusColor, getRoleLabel } from '@/lib/utils';

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ email: '', fullName: '', roleId: '', password: 'changeme1' });
  const [roles, setRoles] = useState<any[]>([]);
  const [error, setError] = useState('');
  const [creating, setCreating] = useState(false);
  const [search, setSearch] = useState('');
  const [showImport, setShowImport] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<any>(null);

  const load = () => {
    api
      .get<PaginatedResponse<User>>('/users')
      .then(data => setUsers(data.items))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    const fetchRoles = async () => {
      try {
        const allUsers = await api.get<PaginatedResponse<any>>('/users');
        const roleSet = new Map<string, string>();
        allUsers.items.forEach(u => {
          if (u.role) roleSet.set(u.role.id, u.role.name);
        });
        setRoles(
          Array.from(roleSet.entries()).map(([id, name]) => ({ id, name: getRoleLabel(name) })),
        );
      } catch {}
    };
    fetchRoles();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setCreating(true);
    try {
      await api.post('/users', form);
      setShowCreate(false);
      setForm({ email: '', fullName: '', roleId: '', password: 'changeme1' });
      load();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setCreating(false);
    }
  };

  const handleSuspend = async (id: string) => {
    await api.patch(`/users/${id}`, { status: 'SUSPENDED' });
    load();
  };
  const handleActivate = async (id: string) => {
    await api.patch(`/users/${id}`, { status: 'ACTIVE' });
    load();
  };

  const handleImport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!importFile) return;
    setImporting(true);
    setError('');
    try {
      const studentRole = roles.find(r => r.name === 'Étudiant' || r.name === 'STUDENT');
      const formData = new FormData();
      formData.append('file', importFile);
      formData.append('roleId', studentRole?.id || '');
      const result = await api.upload('/users/import', formData);
      setImportResult(result);
      setImportFile(null);
      load();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setImporting(false);
    }
  };

  const downloadTemplate = () => {
    const csv =
      'email,fullName,studentNumber,program\njean.dupont@example.com,Jean Dupont,STU20240001,Informatique';
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'template_etudiants.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const filtered = users.filter(
    u =>
      u.fullName.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()),
  );

  const roleGradients: Record<string, string> = {
    ADMIN: 'from-violet-500 to-purple-600',
    PROFESSOR: 'from-cyan-500 to-blue-600',
    STUDENT: 'from-emerald-500 to-teal-600',
  };

  return (
    <div className="space-y-6">
      <div className="page-header animate-slide-up">
        <div>
          <div className="page-kicker mb-1">Administration</div>
          <h1 className="page-title">Utilisateurs</h1>
          <p className="page-subtitle">Gérez les comptes, rôles et statuts.</p>
        </div>
        <button onClick={() => setShowCreate(!showCreate)} className="btn-primary">
          <UserPlus className="mr-2 h-4 w-4" />
          Nouvel utilisateur
        </button>
        <button
          onClick={() => {
            setShowImport(!showImport);
            setShowCreate(false);
          }}
          className="btn-secondary"
        >
          <Upload className="mr-2 h-4 w-4" />
          Importer
        </button>
      </div>

      {showCreate && (
        <div className="card p-6 space-y-4 relative animate-scale-in">
          <button
            onClick={() => setShowCreate(false)}
            className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-600 hover:text-white hover:bg-white/[0.06] cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
          <h3 className="text-base font-semibold text-white">Créer un utilisateur</h3>
          {error && (
            <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-3 text-sm text-red-400">
              {error}
            </div>
          )}
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-400">Email</label>
                <input
                  type="email"
                  className="input"
                  value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-400">
                  Nom complet
                </label>
                <input
                  className="input"
                  value={form.fullName}
                  onChange={e => setForm({ ...form, fullName: e.target.value })}
                  required
                />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-400">Rôle</label>
                <select
                  className="select"
                  value={form.roleId}
                  onChange={e => setForm({ ...form, roleId: e.target.value })}
                  required
                >
                  <option value="">Sélectionner</option>
                  {roles.map(r => (
                    <option key={r.id} value={r.id}>
                      {r.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-400">
                  Mot de passe temporaire
                </label>
                <input
                  className="input font-mono"
                  value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                  required
                />
              </div>
            </div>
            <div className="flex gap-3 pt-1">
              <button type="submit" className="btn-primary" disabled={creating}>
                {creating ? <span className="spinner h-4 w-4 border-2" /> : 'Créer'}
              </button>
              <button type="button" onClick={() => setShowCreate(false)} className="btn-secondary">
                Annuler
              </button>
            </div>
          </form>
        </div>
      )}

      {showImport && (
        <div className="card p-6 space-y-4 relative animate-scale-in">
          <button
            onClick={() => {
              setShowImport(false);
              setImportResult(null);
            }}
            className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-600 hover:text-white hover:bg-white/[0.06] cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
          <h3 className="text-base font-semibold text-white">Importer des étudiants</h3>
          <p className="text-sm text-slate-400">
            Format CSV attendu :{' '}
            <code className="text-xs bg-white/5 px-1.5 py-0.5 rounded">
              email,fullName,studentNumber,program
            </code>
          </p>
          <button onClick={downloadTemplate} className="btn-secondary text-sm">
            <Download className="mr-2 h-3.5 w-3.5" />
            Télécharger le modèle CSV
          </button>
          <form onSubmit={handleImport} className="space-y-4">
            <div
              className="border-2 border-dashed border-white/10 rounded-xl p-8 text-center hover:border-primary-500/50 transition-colors cursor-pointer"
              onClick={() => document.getElementById('csv-upload')?.click()}
            >
              <Upload className="mx-auto h-8 w-8 text-slate-600 mb-2" />
              {importFile ? (
                <div className="flex items-center justify-center gap-2 text-white">
                  <FileText className="h-4 w-4" />
                  {importFile.name}
                </div>
              ) : (
                <p className="text-slate-400 text-sm">
                  Glisser un fichier CSV ici ou cliquer pour sélectionner
                </p>
              )}
              <input
                id="csv-upload"
                type="file"
                accept=".csv"
                className="hidden"
                onChange={e => {
                  setImportFile(e.target.files?.[0] || null);
                  setImportResult(null);
                }}
              />
            </div>
            <div className="flex gap-3">
              <button type="submit" className="btn-primary" disabled={!importFile || importing}>
                {importing ? <span className="spinner h-4 w-4 border-2" /> : 'Importer'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowImport(false);
                  setImportResult(null);
                }}
                className="btn-secondary"
              >
                Annuler
              </button>
            </div>
          </form>
          {importResult && (
            <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 space-y-2">
              <p className="text-sm font-semibold text-emerald-400">
                Importation terminée : {importResult.created} créé(s) sur {importResult.total}
              </p>
              {importResult.failed > 0 && (
                <div className="text-sm text-red-400">
                  <p>{importResult.failed} erreur(s)</p>
                  <ul className="mt-1 space-y-0.5 text-xs">
                    {importResult.errors.map((e: any, i: number) => (
                      <li key={i}>
                        Ligne {e.row} ({e.email}) : {e.error}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {!showCreate && !showImport && (
        <div className="relative animate-slide-up">
          <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-600" />
          <input
            className="input pl-11"
            placeholder="Rechercher un utilisateur…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      )}

      {loading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="card p-4 flex gap-4">
              <div className="skeleton h-10 w-10 rounded-full shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="skeleton h-4 w-1/4 rounded" />
                <div className="skeleton h-3 w-1/2 rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty-state animate-slide-up">
          <UsersIcon className="mb-4 h-12 w-12 text-primary-500/30" />
          <p className="font-semibold text-slate-400">Aucun utilisateur</p>
        </div>
      ) : (
        <div className="card overflow-hidden animate-slide-up">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="table-header">
                  <th className="px-6 py-3.5">Utilisateur</th>
                  <th className="px-6 py-3.5">Email</th>
                  <th className="px-6 py-3.5">Rôle</th>
                  <th className="px-6 py-3.5">Statut</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(u => (
                  <tr key={u.id} className="table-row group">
                    <td className="px-6 py-3.5">
                      <div className="flex items-center gap-3">
                        <div
                          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${roleGradients[u.role?.name || ''] || 'from-slate-500 to-slate-600'} text-xs font-bold text-white`}
                        >
                          {u.fullName.charAt(0).toUpperCase()}
                        </div>
                        <span className="font-medium text-white">{u.fullName}</span>
                      </div>
                    </td>
                    <td className="px-6 py-3.5 text-slate-500">{u.email}</td>
                    <td className="px-6 py-3.5">
                      <span className="badge-neutral">{getRoleLabel(u.role?.name || '')}</span>
                    </td>
                    <td className="px-6 py-3.5">
                      <span className={statusColor(u.status)}>{getStatusLabel(u.status)}</span>
                    </td>
                    <td className="px-6 py-3.5 text-right">
                      {u.status === 'ACTIVE' && (
                        <button
                          onClick={() => handleSuspend(u.id)}
                          className="btn-sm btn-ghost text-red-400 hover:bg-red-500/10 cursor-pointer"
                        >
                          <ShieldAlert className="mr-1 h-3.5 w-3.5" />
                          Suspendre
                        </button>
                      )}
                      {u.status === 'SUSPENDED' && (
                        <button
                          onClick={() => handleActivate(u.id)}
                          className="btn-sm btn-ghost text-emerald-400 hover:bg-emerald-500/10 cursor-pointer"
                        >
                          <ShieldCheck className="mr-1 h-3.5 w-3.5" />
                          Activer
                        </button>
                      )}
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
