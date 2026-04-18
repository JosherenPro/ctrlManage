'use client';

import { QueryClientProvider as QPProvider } from '@tanstack/react-query';

import { queryClient } from '@/lib/query-client';

export function QueryClientProvider({ children }: { children: React.ReactNode }) {
  return <QPProvider client={queryClient}>{children}</QPProvider>;
}
