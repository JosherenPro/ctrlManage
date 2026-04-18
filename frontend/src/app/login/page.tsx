'use client';

import { toast } from 'sonner';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowRight,
  BarChart3,
  Eye,
  EyeOff,
  Fingerprint,
  Globe2,
  QrCode,
  ShieldCheck,
  Zap,
} from 'lucide-react';

import { useAuth } from '@/lib/auth-context';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isRegister, setIsRegister] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [studentNumber, setStudentNumber] = useState('');
  const [program, setProgram] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { login, register } = useAuth();
  const router = useRouter();

  const features = [
    { icon: QrCode, label: 'Scan instantané', desc: 'QR code temps réel' },
    { icon: BarChart3, label: 'Dashboard vivant', desc: 'Métriques en continu' },
    { icon: ShieldCheck, label: 'RBAC natif', desc: 'Accès sécurisés' },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (isRegister) {
        await register(email, password, firstName, lastName, studentNumber, program);
      } else {
        await login(email, password);
      }
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || "Erreur d'authentification");
      toast.error(err.message || 'Erreur de connexion');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="aurora-bg relative flex min-h-screen">
      {/* Left – Brand */}
      <section className="hidden lg:flex lg:w-[55%] flex-col justify-between p-10 relative z-10">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-primary-500 to-cyan-500 text-lg font-black text-white shadow-glow-violet">
            IA
          </div>
          <span className="text-xl font-bold tracking-tight text-white">IA & Big Data</span>
        </div>

        <div className="max-w-lg space-y-8">
          <div>
            <div className="page-kicker mb-4">Intelligence Artificielle & Big Data</div>
            <h1 className="text-5xl font-extrabold leading-[1.1] tracking-tight text-white xl:text-6xl">
              Gestion des <span className="gradient-text">présences</span>
            </h1>
            <p className="mt-5 text-lg leading-relaxed text-slate-400">
              Plateforme dédiée aux étudiants et professeurs de la filière IA & Big Data. Scan QR, tableaux de bord, gestion des sessions.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            {features.map(f => (
              <div
                key={f.label}
                className="group rounded-2xl border border-white/[0.06] bg-surface-1/40 p-5 backdrop-blur transition-all duration-300 hover:border-primary-500/20 hover:shadow-glow-sm"
              >
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-primary-500/10 text-primary-400 transition-colors group-hover:bg-primary-500/20">
                  <f.icon className="h-5 w-5" />
                </div>
                <div className="text-sm font-semibold text-white">{f.label}</div>
                <div className="mt-1 text-xs text-slate-500">{f.desc}</div>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-6 rounded-2xl border border-white/[0.04] bg-surface-1/30 p-5 backdrop-blur">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-500/20 to-cyan-500/10">
              <Globe2 className="h-7 w-7 text-primary-400" />
            </div>
            <div>
              <div className="text-sm font-semibold text-white">Multi-plateforme</div>
              <div className="mt-1 text-sm text-slate-500">
                Optimisé pour écrans de salle, mobiles et postes admin.
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-600">
          <Zap className="h-3.5 w-3.5" />
          <span>IA & Big Data · v2</span>
        </div>
      </section>

      {/* Right – Auth Form */}
      <section className="relative z-10 flex w-full items-center justify-center px-6 py-10 lg:w-[45%] lg:px-12">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary-500 to-cyan-500 text-base font-black text-white shadow-glow-violet">
              C
            </div>
            <span className="text-lg font-bold tracking-tight text-white">ctrlManage</span>
          </div>

          <div className="card p-8">
            <div className="mb-6">
              <div className="page-kicker mb-2">Accès sécurisé</div>
              <h2 className="text-2xl font-bold text-white">
                {isRegister ? 'Créer un compte' : 'Bienvenue'}
              </h2>
              <p className="mt-2 text-sm text-slate-500">
                {isRegister
                  ? 'Rejoignez la plateforme en quelques étapes'
                  : 'Connectez-vous pour accéder à votre espace'}
              </p>
            </div>

            {/* Toggle */}
            <div className="mb-6 grid grid-cols-2 gap-1 rounded-xl bg-surface-2 p-1">
              <button
                onClick={() => {
                  setIsRegister(false);
                  setError('');
                }}
                className={`rounded-lg py-2 text-sm font-semibold transition-all duration-200 ${
                  !isRegister
                    ? 'bg-surface-3 text-white shadow-sm'
                    : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                Connexion
              </button>
              <button
                onClick={() => {
                  setIsRegister(true);
                  setError('');
                }}
                className={`rounded-lg py-2 text-sm font-semibold transition-all duration-200 ${
                  isRegister
                    ? 'bg-surface-3 text-white shadow-sm'
                    : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                Inscription
              </button>
            </div>

            {error && (
              <div className="mb-5 rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm text-red-400">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {isRegister && (
                <>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-slate-400">Nom</label>
                      <input
                        type="text"
                        value={firstName}
                        onChange={e => setFirstName(e.target.value)}
                        className="input"
                        placeholder="Kouassi"
                        required={isRegister}
                      />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-slate-400">
                        Prénom
                      </label>
                      <input
                        type="text"
                        value={lastName}
                        onChange={e => setLastName(e.target.value)}
                        className="input"
                        placeholder="Aminata"
                        required={isRegister}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-slate-400">
                      Numéro de carte
                    </label>
                    <input
                      type="text"
                      value={studentNumber}
                      onChange={e => setStudentNumber(e.target.value)}
                      className="input font-mono"
                      placeholder="STD-2026-001"
                      required={isRegister}
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-slate-400">
                      Filière
                    </label>
                    <input
                      type="text"
                      value={program}
                      onChange={e => setProgram(e.target.value)}
                      className="input"
                      placeholder="Informatique"
                      required={isRegister}
                    />
                  </div>
                </>
              )}

              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-400">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="input"
                  placeholder="vous@exemple.fr"
                  required
                />
              </div>

              <div className="relative">
                <label className="mb-1.5 block text-sm font-medium text-slate-400">
                  Mot de passe
                </label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="input pr-12"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-[38px] p-1 text-slate-600 hover:text-slate-400 transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-primary mt-2 w-full justify-between px-5 py-3"
              >
                <span className="flex items-center gap-2">
                  <Fingerprint className="h-4 w-4" />
                  {loading
                    ? 'Chargement…'
                    : isRegister
                      ? 'Créer mon compte'
                      : 'Accéder à mon espace'}
                </span>
                {loading ? (
                  <span className="spinner h-4 w-4 border-2" />
                ) : (
                  <ArrowRight className="h-4 w-4" />
                )}
              </button>
            </form>

            <div className="mt-6 flex items-center justify-between border-t border-white/[0.06] pt-5 text-sm text-slate-500">
              <span>{isRegister ? 'Déjà inscrit ?' : 'Pas encore de compte ?'}</span>
              <button
                onClick={() => {
                  setIsRegister(!isRegister);
                  setError('');
                }}
                className="font-semibold text-primary-400 transition hover:text-primary-300"
              >
                {isRegister ? 'Se connecter' : "S'inscrire"}
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
