export type User = {
  id: string;
  email: string;
  name: string;
  passwordHash: string;
  encryptionSalt: string;
  createdAt: string;
};

export type Session = {
  token: string;
  userId: string;
  createdAt: string;
  expiresAt: string;
};

export type VaultEntry = {
  id: string;
  userId: string;
  platform: string;
  username: string;
  ciphertext: string;
  iv: string;
  createdAt: string;
  updatedAt: string;
};

export type Database = {
  users: User[];
  sessions: Session[];
  entries: VaultEntry[];
};

export type PublicUser = Pick<User, "id" | "email" | "name">;
