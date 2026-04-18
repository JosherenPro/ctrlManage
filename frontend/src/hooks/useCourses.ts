import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import api from '@/lib/api';

// Types
export interface Course {
  id: string;
  code: string;
  title: string;
  description?: string;
  classId: string;
  teacherId: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCourseDto {
  code: string;
  title: string;
  description?: string;
  classId: string;
  teacherId: string;
}

// Query keys
export const courseKeys = {
  all: ['courses'] as const,
  lists: () => [...courseKeys.all, 'list'] as const,
  list: (filters: Record<string, string>) => [...courseKeys.lists(), filters] as const,
  details: () => [...courseKeys.all, 'detail'] as const,
  detail: (id: string) => [...courseKeys.details(), id] as const,
};

// API functions
export const courseApi = {
  getAll: async (): Promise<Course[]> => {
    return api.get<Course[]>('/courses');
  },

  getById: async (id: string): Promise<Course> => {
    return api.get<Course>(`/courses/${id}`);
  },

  create: async (course: CreateCourseDto): Promise<Course> => {
    return api.post<Course>('/courses', course);
  },

  update: async (id: string, course: Partial<CreateCourseDto>): Promise<Course> => {
    return api.patch<Course>(`/courses/${id}`, course);
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/courses/${id}`);
  },
};

// Hooks
export const useCourses = () => {
  return useQuery({
    queryKey: courseKeys.lists(),
    queryFn: courseApi.getAll,
  });
};

export const useCourse = (id: string) => {
  return useQuery({
    queryKey: courseKeys.detail(id),
    queryFn: () => courseApi.getById(id),
    enabled: !!id,
  });
};

export const useCreateCourse = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: courseApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: courseKeys.lists() });
    },
  });
};

export const useUpdateCourse = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, course }: { id: string; course: Partial<CreateCourseDto> }) =>
      courseApi.update(id, course),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: courseKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: courseKeys.lists() });
    },
  });
};

export const useDeleteCourse = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: courseApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: courseKeys.lists() });
    },
  });
};
