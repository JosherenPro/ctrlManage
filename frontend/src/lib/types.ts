export interface User {
  id: string;
  email: string;
  fullName: string;
  status: 'ACTIVE' | 'INVITED' | 'SUSPENDED';
  roleId: string;
  role?: { id: string; name: string; description?: string };
  establishmentId: string;
  studentProfile?: StudentProfile;
  teacherProfile?: TeacherProfile;
  createdAt: string;
  updatedAt: string;
}

export interface StudentProfile {
  id: string;
  userId: string;
  studentNumber: string;
  program?: string;
  level?: string;
  classId: string;
  establishmentId: string;
  class?: Class;
}

export interface TeacherProfile {
  id: string;
  userId: string;
  employeeNumber: string;
  department?: string;
  establishmentId: string;
}

export interface Class {
  id: string;
  code: string;
  name: string;
  academicYear: string;
  establishmentId: string;
  students?: StudentProfile[];
  courses?: Course[];
  createdAt: string;
  updatedAt: string;
}

export interface Course {
  id: string;
  code: string;
  title: string;
  description?: string;
  classId: string;
  teacherId: string;
  establishmentId: string;
  class?: Class;
  teacher?: TeacherProfile & { user?: User };
  sessions?: Session[];
  createdAt: string;
  updatedAt: string;
}

export interface Session {
  id: string;
  courseId: string;
  teacherId: string;
  startsAt: string;
  endsAt: string;
  room?: string;
  status: 'DRAFT' | 'OPEN' | 'CLOSED' | 'CANCELLED';
  establishmentId: string;
  course?: Course;
  teacher?: TeacherProfile & { user?: User };
  attendanceRecords?: AttendanceRecord[];
  qrCodes?: QrCode[];
  createdAt: string;
  updatedAt: string;
}

export interface AttendanceRecord {
  id: string;
  sessionId: string;
  studentId: string;
  status: 'PRESENT' | 'LATE' | 'ABSENT' | 'JUSTIFIED';
  scannedAt?: string;
  validatedAt?: string;
  validatedById?: string;
  notes?: string;
  student?: StudentProfile & { user?: User };
  session?: Session;
  createdAt: string;
  updatedAt: string;
}

export interface QrCode {
  id: string;
  sessionId: string;
  token: string;
  expiresAt: string;
  usedAt?: string;
  revokedAt?: string;
  issuedById?: string;
  qrUrl?: string;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  actorId?: string;
  action: string;
  entityType: string;
  entityId?: string;
  metadata?: any;
  actor?: { id: string; email: string; fullName: string };
  createdAt: string;
}

export interface AuthResponse {
  accessToken: string;
  user: User;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
}
