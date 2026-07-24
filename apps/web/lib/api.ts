import type { Person } from './types';

export const apiBase = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';
const authApiBase = `${apiBase}/api/auth`;
const personsApiBase = `${apiBase}/api/persons`;

export async function postJson(path: string, payload: unknown) {
  return fetch(`${authApiBase}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export const personsApi = {
  list(search?: string) {
    const query = search ? `?search=${encodeURIComponent(search)}` : '';
    return fetch(`${personsApiBase}${query}`);
  },

  get(id: string) {
    return fetch(`${personsApiBase}/${id}`);
  },

  create(data: unknown) {
    return fetch(personsApiBase, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
  },

  update(id: string, data: unknown) {
    return fetch(`${personsApiBase}/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
  },

  remove(id: string) {
    return fetch(`${personsApiBase}/${id}`, { method: 'DELETE' });
  },
};

export type { Person };
