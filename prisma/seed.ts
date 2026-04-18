import { PrismaClient, UserStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const defaultPassword = 'Test1234!';
  const hash = await bcrypt.hash(defaultPassword, 10);

  // Upsert default establishment
  const defaultEstablishment = await prisma.establishment.upsert({
    where: { id: 'default-establishment' },
    update: { name: 'Établissement par défaut', code: 'DEFAULT' },
    create: {
      id: 'default-establishment',
      name: 'Établissement par défaut',
      code: 'DEFAULT',
      country: 'France',
    },
  });

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
    update: { name: 'Licence 3 Informatique A', academicYear: '2025-2026', establishmentId: defaultEstablishment.id },
    create: {
      code: 'L3-INFO-A',
      name: 'Licence 3 Informatique A',
      academicYear: '2025-2026',
      establishmentId: defaultEstablishment.id,
    },
  });

  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@ctrlmanage.local' },
    update: {
      fullName: 'Admin Test',
      status: UserStatus.ACTIVE,
      passwordHash: hash,
      roleId: adminRole.id,
      establishmentId: defaultEstablishment.id,
    },
    create: {
      email: 'admin@ctrlmanage.local',
      fullName: 'Admin Test',
      status: UserStatus.ACTIVE,
      passwordHash: hash,
      roleId: adminRole.id,
      establishmentId: defaultEstablishment.id,
    },
  });

  const professorUser = await prisma.user.upsert({
    where: { email: 'prof@ctrlmanage.local' },
    update: {
      fullName: 'Professeur Test',
      status: UserStatus.ACTIVE,
      passwordHash: hash,
      roleId: professorRole.id,
      establishmentId: defaultEstablishment.id,
    },
    create: {
      email: 'prof@ctrlmanage.local',
      fullName: 'Professeur Test',
      status: UserStatus.ACTIVE,
      passwordHash: hash,
      roleId: professorRole.id,
      establishmentId: defaultEstablishment.id,
    },
  });

  const studentUser = await prisma.user.upsert({
    where: { email: 'etudiant@ctrlmanage.local' },
    update: {
      fullName: 'Etudiant Test',
      status: UserStatus.ACTIVE,
      passwordHash: hash,
      roleId: studentRole.id,
      establishmentId: defaultEstablishment.id,
    },
    create: {
      email: 'etudiant@ctrlmanage.local',
      fullName: 'Etudiant Test',
      status: UserStatus.ACTIVE,
      passwordHash: hash,
      roleId: studentRole.id,
      establishmentId: defaultEstablishment.id,
    },
  });

  await prisma.teacher.upsert({
    where: { userId: professorUser.id },
    update: { employeeNumber: 'EMP-TEST-001', department: 'Informatique', establishmentId: defaultEstablishment.id },
    create: {
      userId: professorUser.id,
      employeeNumber: 'EMP-TEST-001',
      department: 'Informatique',
      establishmentId: defaultEstablishment.id,
    },
  });

  await prisma.student.upsert({
    where: { userId: studentUser.id },
    update: {
      studentNumber: 'STD-TEST-001',
      program: 'Informatique',
      level: 'L3',
      classId: classA.id,
      establishmentId: defaultEstablishment.id,
    },
    create: {
      userId: studentUser.id,
      studentNumber: 'STD-TEST-001',
      program: 'Informatique',
      level: 'L3',
      classId: classA.id,
      establishmentId: defaultEstablishment.id,
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