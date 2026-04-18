# Schéma de Données

## Entités principales

- `roles`
- `users`
- `students`
- `teachers`
- `classes`
- `courses`
- `sessions`
- `attendance_records`
- `qr_codes`
- `audit_logs`

## Relations

- Un `role` possède plusieurs `users`.
- Un `user` peut être lié à un profil `student` ou `teacher`.
- Une `class` regroupe plusieurs `students`.
- Un `teacher` anime plusieurs `courses`.
- Un `course` appartient à une `class`.
- Un `course` possède plusieurs `sessions`.
- Une `session` possède plusieurs `attendance_records` et plusieurs `qr_codes`.
- Un `student` possède plusieurs `attendance_records`.

## Règles métier de base

- L'email utilisateur est unique.
- Le matricule étudiant est unique.
- Le code enseignant est unique.
- Le code cours et le code classe sont uniques.
- Une présence est unique par couple `session_id` + `student_id`.
- Un jeton QR est unique.

## États utiles

- `UserStatus` : `ACTIVE`, `INVITED`, `SUSPENDED`
- `SessionStatus` : `DRAFT`, `OPEN`, `CLOSED`, `CANCELLED`
- `AttendanceStatus` : `PRESENT`, `LATE`, `ABSENT`, `JUSTIFIED`

## Fichier source

Le schéma de référence est défini dans [prisma/schema.prisma](/home/eren/Documents/ctrlmanage/prisma/schema.prisma).
