import 'server-only';

import type { LoginInput, MeResponse, RegisterInput, SessionAccount } from '@oliveira/schemas';
import { apiRequest, type ApiResult } from './client';

export interface LoginResponse {
  message: string;
  token: string;
  user: SessionAccount;
}

export interface MessageResponse {
  message: string;
}

export function requestLogin(input: LoginInput): Promise<ApiResult<LoginResponse>> {
  return apiRequest<LoginResponse>('/api/auth/login', { method: 'POST', body: input });
}

export function requestRegister(input: RegisterInput): Promise<ApiResult<MessageResponse>> {
  return apiRequest<MessageResponse>('/api/auth/register', { method: 'POST', body: input });
}

export function requestMe(token: string): Promise<ApiResult<MeResponse>> {
  return apiRequest<MeResponse>('/api/auth/me', { token });
}
