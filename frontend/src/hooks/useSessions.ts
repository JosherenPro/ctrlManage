import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import api from '@/lib/api';

// Types
export interface Session {
  id: string;
  courseId: string;
  teacherId: string;
  startsAt: string;
  endsAt: string;
  room?: string;
  status: 'DRAFT' | 'OPEN' | 'CLOSED' | 'CANCELLED';
  createdAt: string;
  updatedAt: string;
}

export interface CreateSessionDto {
  courseId: string;
  startsAt: string;
  endsAt: string;
  room?: string;
}

// Query keys
export const sessionKeys = {
  all: ['sessions'] as const,
  lists: () => [...sessionKeys.all, 'list'] as const,
  list: (filters: Record<string, string>) => [...sessionKeys.lists(), filters] as const,
  details: () => [...sessionKeys.all, 'detail'] as const,
  detail: (id: string) => [...sessionKeys.details(), id] as const,
};

// API functions
export const sessionApi = {
  getAll: async (courseId?: string): Promise<Session[]> => {
    const params = courseId ? `?courseId=${courseId}` : '';
    return api.get<Session[]>(`/sessions${params}`);
  },

  getById: async (id: string): Promise<Session> => {
    return api.get<Session>(`/sessions/${id}`);
  },

  create: async (session: CreateSessionDto): Promise<Session> => {
    return api.post<Session>('/sessions', session);
  },

  update: async (id: string, session: Partial<CreateSessionDto>): Promise<Session> => {
    return api.patch<Session>(`/sessions/${id}`, session);
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/sessions/${id}`);
  },

  open: async (id: string): Promise<Session> => {
    return api.post<Session>(`/sessions/${id}/open`);
  },

  close: async (id: string): Promise<Session> => {
    return api.post<Session>(`/sessions/${id}/close`);
  },
};

// Hooks
export const useSessions = (courseId?: string) => {
  return useQuery({
    queryKey: sessionKeys.list({ courseId: courseId || '' }),
    queryFn: () => sessionApi.getAll(courseId),
  });
};

export const useSession = (id: string) => {
  return useQuery({
    queryKey: sessionKeys.detail(id),
    queryFn: () => sessionApi.getById(id),
    enabled: !!id,
  });
};

export const useCreateSession = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: sessionApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: sessionKeys.lists() });
    },
  });
};

export const useOpenSession = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: sessionApi.open,
    onSuccess: data => {
      queryClient.invalidateQueries({ queryKey: sessionKeys.detail(data.id) });
      queryClient.invalidateQueries({ queryKey: sessionKeys.lists() });
    },
  });
};

export const useCloseSession = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: sessionApi.close,
    onSuccess: data => {
      queryClient.invalidateQueries({ queryKey: sessionKeys.detail(data.id) });
      queryClient.invalidateQueries({ queryKey: sessionKeys.lists() });
    },
  });
};
