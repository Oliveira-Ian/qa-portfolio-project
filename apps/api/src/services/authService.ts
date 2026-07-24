import { prisma } from '../config/prisma.js';

interface RegisterParams {
  fullName: string;
  email: string;
  password: string;
  birthDate: string;
}

interface AuthenticateParams {
  email: string;
  password: string;
}

export const registerUser = async ({ fullName, email, password, birthDate }: RegisterParams) => {
  const existingUser = await prisma.user.findUnique({ where: { email } });

  if (existingUser) {
    return { success: false as const, error: 'Email already exists' };
  }

  const user = await prisma.user.create({
    data: {
      name: fullName,
      email,
      password,
      birthDate: birthDate ? new Date(birthDate) : null,
    },
  });

  return { success: true as const, data: user };
};

export const authenticateUser = async ({ email, password }: AuthenticateParams) => {
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user || user.password !== password) {
    return { success: false as const, error: 'Invalid email or password' };
  }

  return { success: true as const, data: user };
};
