export interface RequestUser {
  id: string;
  email: string;
  fullName: string;
  status: string;
  authProvider?: string | null;
  roleId: string;
  role?: { id: string; name: string; description?: string };
  studentProfile?: { id: string; studentNumber: string; program?: string; classId: string } | null;
  teacherProfile?: { id: string; employeeNumber: string; department?: string } | null;
}