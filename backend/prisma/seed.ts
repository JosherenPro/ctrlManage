import { PrismaClient, UserStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const defaultPassword = 'Test1234!';
  const hash = await bcrypt.hash(defaultPassword, 10);

  const adminRole = await prisma.role.upsert({
    where: { name: 'ADMIN' },
    update: {},
    create: { name: 'ADMIN', description: 'Administrator' },
  });

  const professorRole = await prisma.role.upsert({
    where: { name: 'PROFESSOR' },
    update: {},
    create: { name: 'PROFESSOR', description: 'Professor' },
  });

  const studentRole = await prisma.role.upsert({
    where: { name: 'STUDENT' },
    update: {},
    create: { name: 'STUDENT', description: 'Student' },
  });

  const classA = await prisma.class.upsert({
    where: { code: 'L3-INFO-A' },
    update: { name: 'Licence 3 Informatique A', academicYear: '2025-2026' },
    create: {
      code: 'L3-INFO-A',
      name: 'Licence 3 Informatique A',
      academicYear: '2025-2026',
    },
  });

  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@ctrlmanage.local' },
    update: {
      fullName: 'Admin Test',
      passwordHash: hash,
      authProvider: 'local',
      status: UserStatus.ACTIVE,
      roleId: adminRole.id,
    },
    create: {
      email: 'admin@ctrlmanage.local',
      fullName: 'Admin Test',
      passwordHash: hash,
      authProvider: 'local',
      status: UserStatus.ACTIVE,
      roleId: adminRole.id,
    },
  });

  const professorUser = await prisma.user.upsert({
    where: { email: 'prof@ctrlmanage.local' },
    update: {
      fullName: 'Professeur Test',
      passwordHash: hash,
      authProvider: 'local',
      status: UserStatus.ACTIVE,
      roleId: professorRole.id,
    },
    create: {
      email: 'prof@ctrlmanage.local',
      fullName: 'Professeur Test',
      passwordHash: hash,
      authProvider: 'local',
      status: UserStatus.ACTIVE,
      roleId: professorRole.id,
    },
  });

  const studentUser = await prisma.user.upsert({
    where: { email: 'etudiant@ctrlmanage.local' },
    update: {
      fullName: 'Etudiant Test',
      passwordHash: hash,
      authProvider: 'local',
      status: UserStatus.ACTIVE,
      roleId: studentRole.id,
    },
    create: {
      email: 'etudiant@ctrlmanage.local',
      fullName: 'Etudiant Test',
      passwordHash: hash,
      authProvider: 'local',
      status: UserStatus.ACTIVE,
      roleId: studentRole.id,
    },
  });

  await prisma.teacher.upsert({
    where: { userId: professorUser.id },
    update: { employeeNumber: 'EMP-TEST-001', department: 'Informatique' },
    create: {
      userId: professorUser.id,
      employeeNumber: 'EMP-TEST-001',
      department: 'Informatique',
    },
  });

  await prisma.student.upsert({
    where: { userId: studentUser.id },
    update: {
      studentNumber: 'STD-TEST-001',
      program: 'Informatique',
      level: 'L3',
      classId: classA.id,
    },
    create: {
      userId: studentUser.id,
      studentNumber: 'STD-TEST-001',
      program: 'Informatique',
      level: 'L3',
      classId: classA.id,
    },
  });

  console.log('Seeding complete');
  console.table([
    { role: 'ADMIN', email: adminUser.email, password: defaultPassword },
    { role: 'PROFESSOR', email: professorUser.email, password: defaultPassword },
    { role: 'STUDENT', email: studentUser.email, password: defaultPassword },
  ]);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());