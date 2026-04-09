// Authentication Service
// Contains business logic for authentication

import { prisma } from '../config/prisma.js';

export const registerUser = async ({ fullName, email, password, birthDate }) => {
  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    return { success: false, error: 'Email already exists' };
  }

  const user = await prisma.user.create({
    data: {
      name: fullName,
      email,
      password,
      birthDate: birthDate ? new Date(birthDate) : null,
    },
  });

  return { success: true, data: user };
};

export const authenticateUser = async ({ email, password }) => {
  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user || user.password !== password) {
    return { success: false, error: 'Invalid email or password' };
  }

  return { success: true, data: user };
};
