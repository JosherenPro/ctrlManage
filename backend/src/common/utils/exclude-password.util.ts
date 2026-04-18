type UserWithPassword = { passwordHash?: string | null; [key: string]: unknown };

export function excludePassword(user: UserWithPassword): Omit<UserWithPassword, 'passwordHash'> {
  const { passwordHash, ...result } = user;
  return result;
}

export function excludePasswordFromList(users: UserWithPassword[]): Omit<UserWithPassword, 'passwordHash'>[] {
  return users.map(excludePassword);
}