'use client';

import Link from 'next/link';
import { useState } from 'react';
import { usePathname } from 'next/navigation';
import {
  BarChart3,
  BookOpen,
  Calendar,
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
  LayoutDashboard,
  LogOut,
  Menu,
  QrCode,
  Search,
  Shield,
  UserCircle,
  Users,
  X,
} from 'lucide-react';

import { useAuth } from '@/lib/auth-context';
import { RequireAuth } from '@/lib/require-auth';
import { cn, getRoleLabel } from '@/lib/utils';

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
  roles?: string[];
  mobile?: boolean;
}

const navItems: NavItem[] = [
  { href: '/dashboard', label: 'Accueil', icon: LayoutDashboard, mobile: true },
  { href: '/profile', label: 'Profil', icon: UserCircle, mobile: false },
  {
    href: '/my-courses',
    label: 'Mes cours',
    icon: BookOpen,
    roles: ['STUDENT', 'PROFESSOR'],
    mobile: true,
  },
  { href: '/courses', label: 'Cours', icon: BookOpen, roles: ['ADMIN'], mobile: true },
  { href: '/sessions', label: 'Sessions', icon: Calendar, mobile: true },
  { href: '/attendance', label: 'Présences', icon: ClipboardCheck, mobile: true },
  { href: '/scan', label: 'Scanner', icon: QrCode, roles: ['STUDENT'], mobile: true },
  { href: '/reports', label: 'Rapports', icon: BarChart3, roles: ['ADMIN', 'PROFESSOR'] },
  { href: '/users', label: 'Utilisateurs', icon: Users, roles: ['ADMIN'] },
  { href: '/audit', label: 'Audit', icon: Shield, roles: ['ADMIN'] },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  if (!user) {
    return (
      <RequireAuth>
        <></>
      </RequireAuth>
    );
  }

  const role = user?.role?.name || '';
  const filteredNav = navItems.filter(item => !item.roles || item.roles.includes(role));
  const mobileNavItems = filteredNav.filter(item => item.mobile !== false);
  const activeItem = filteredNav.find(
    item => pathname === item.href || pathname.startsWith(item.href + '/'),
  );

  return (
    <div className="aurora-bg flex h-screen overflow-hidden bg-surface-0">
      {/* Desktop Sidebar */}
      <aside
        className={cn(
          'hidden lg:flex flex-col border-r border-white/[0.04] bg-surface-1/80 backdrop-blur-2xl transition-all duration-300',
          collapsed ? 'w-[72px]' : 'w-[260px]',
        )}
      >
        {/* Logo */}
        <div className="flex h-16 items-center gap-3 border-b border-white/[0.04] px-4">
          <Link
            href="/dashboard"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary-500 to-cyan-500 text-sm font-black text-white shadow-glow-violet transition-transform hover:scale-105"
          >
            C
          </Link>
          {!collapsed && (
            <div className="min-w-0 animate-fade-in">
              <div className="text-sm font-bold tracking-tight text-white">ctrlManage</div>
              <div className="text-[0.6rem] uppercase tracking-[0.2em] text-slate-600">
                Gestion campus
              </div>
            </div>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="ml-auto flex h-7 w-7 items-center justify-center rounded-lg text-slate-600 transition-colors hover:bg-white/[0.04] hover:text-slate-400"
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
        </div>

        {/* Role badge */}
        {!collapsed && (
          <div className="mx-3 mt-4 rounded-xl border border-white/[0.06] bg-surface-2/50 p-3 animate-fade-in">
            <div className="text-[0.6rem] font-bold uppercase tracking-[0.2em] text-slate-600">
              Mode
            </div>
            <div className="mt-1 flex items-center gap-2">
              <span className="dot-live" />
              <span className="text-sm font-semibold text-white">{getRoleLabel(role)}</span>
            </div>
          </div>
        )}

        {/* Nav links */}
        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
          {filteredNav.map(item => {
            const Icon = item.icon;
            const active =
              pathname === item.href ||
              (pathname.startsWith(item.href + '/') && item.href !== '/dashboard');
            return (
              <Link
                key={item.href}
                href={item.href}
                title={collapsed ? item.label : undefined}
                className={cn(
                  active ? 'sidebar-link-active' : 'sidebar-link-inactive',
                  collapsed && 'justify-center px-0',
                )}
              >
                <Icon className="h-5 w-5 shrink-0" />
                {!collapsed && <span>{item.label}</span>}
                {active && !collapsed && (
                  <span className="ml-auto h-1.5 w-1.5 rounded-full bg-primary-400" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* User section */}
        <div className="border-t border-white/[0.04] p-3">
          {!collapsed && (
            <div className="mb-3 flex items-center gap-3 animate-fade-in">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary-500 to-cyan-500 text-xs font-bold text-white">
                {user?.fullName?.charAt(0)?.toUpperCase() || '?'}
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium text-white">{user?.fullName}</div>
                <div className="truncate text-xs text-slate-600">{getRoleLabel(role)}</div>
              </div>
            </div>
          )}
          <button
            onClick={logout}
            className={cn(
              'flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-slate-600 transition-colors hover:bg-red-500/10 hover:text-red-400',
              collapsed && 'justify-center px-0',
            )}
          >
            <LogOut className="h-4 w-4 shrink-0" />
            {!collapsed && <span>Déconnexion</span>}
          </button>
        </div>
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="relative flex h-full w-72 flex-col border-r border-white/[0.06] bg-surface-1/95 backdrop-blur-2xl">
            <div className="flex h-16 items-center gap-3 border-b border-white/[0.04] px-5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary-500 to-cyan-500 text-sm font-black text-white shadow-glow-violet">
                C
              </div>
              <div>
                <div className="text-sm font-bold tracking-tight text-white">ctrlManage</div>
                <div className="text-[0.6rem] uppercase tracking-[0.2em] text-slate-600">
                  Gestion campus
                </div>
              </div>
              <button
                onClick={() => setMobileOpen(false)}
                className="ml-auto p-1 rounded-lg text-slate-600 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
              {filteredNav.map(item => {
                const Icon = item.icon;
                const active =
                  pathname === item.href ||
                  (pathname.startsWith(item.href + '/') && item.href !== '/dashboard');
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className={active ? 'sidebar-link-active' : 'sidebar-link-inactive'}
                  >
                    <Icon className="h-5 w-5 shrink-0" />
                    <span>{item.label}</span>
                    {active && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-primary-400" />}
                  </Link>
                );
              })}
            </nav>
          </aside>
        </div>
      )}

      {/* Main area */}
      <div className="flex flex-1 flex-col overflow-hidden relative z-10">
        {/* Top bar */}
        <header className="flex h-16 items-center gap-3 border-b border-white/[0.04] bg-surface-0/80 backdrop-blur-xl px-4 lg:px-6 shrink-0">
          <button
            onClick={() => setMobileOpen(true)}
            className="p-2 rounded-xl text-slate-500 hover:bg-white/[0.04] hover:text-white lg:hidden"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="min-w-0 flex-1">
            <div className="text-[0.65rem] font-bold uppercase tracking-[0.18em] text-slate-600">
              Espace de travail
            </div>
            <h1 className="truncate text-base font-semibold text-white">
              {activeItem?.label || 'ctrlManage'}
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 rounded-xl border border-white/[0.06] bg-surface-2 px-3 py-1.5 text-xs text-slate-500">
              <Search className="h-3.5 w-3.5" />
              <span>Rechercher…</span>
              <kbd className="ml-2 rounded border border-white/[0.08] bg-surface-3 px-1.5 py-0.5 font-mono text-[0.6rem] text-slate-600">
                ⌘K
              </kbd>
            </div>
            <span className="hidden sm:inline-flex items-center gap-1.5 rounded-xl border border-primary-500/20 bg-primary-500/5 px-3 py-1 text-xs font-semibold text-primary-400">
              {getRoleLabel(role)}
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-primary-500 to-cyan-500 text-xs font-bold text-white">
              {user?.fullName?.charAt(0)?.toUpperCase() || '?'}
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-4 pb-24 lg:p-6 lg:pb-6" id="main-content">
          {children}
        </main>

        {/* Mobile bottom nav */}
        <nav
          className="fixed inset-x-0 bottom-0 z-40 border-t border-white/[0.06] bg-surface-0/95 backdrop-blur-xl lg:hidden"
          aria-label="Navigation mobile"
        >
          <div className="grid grid-cols-5 gap-1 px-2 py-1">
            {mobileNavItems.slice(0, 5).map(item => {
              const Icon = item.icon;
              const active =
                pathname === item.href ||
                (pathname.startsWith(item.href + '/') && item.href !== '/dashboard');
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? 'page' : undefined}
                  className={cn(
                    'flex flex-col items-center gap-0.5 rounded-xl px-1 py-2 text-[0.6rem] font-semibold transition-colors duration-200',
                    active ? 'text-primary-400' : 'text-slate-600 hover:text-slate-400',
                  )}
                >
                  <Icon className="h-5 w-5" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>
        </nav>
      </div>
    </div>
  );
}
