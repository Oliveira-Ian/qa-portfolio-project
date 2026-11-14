import 'server-only';

import { cache } from 'react';
import { revalidatePath } from 'next/cache';
import { notFound } from 'next/navigation';
import {
  profileWriteSchema,
  type PaginatedResult,
  type PermissionDto,
  type Product,
  type ProfileDto,
  type ProfileWriteInput,
} from '@oliveira/schemas';
import type { ActionResult } from '@/lib/actions';
import { ApiError, unwrap } from '@/lib/api/client';
import { requestPermissionList } from '@/lib/api/permissions';
import {
  requestProfile,
  requestProfileCreate,
  requestProfileDelete,
  requestProfileDuplicate,
  requestProfileList,
  requestProfileUpdate,
} from '@/lib/api/profiles';
import type { ListQueryState } from '@/lib/list-query';
import { requireSession } from '@/lib/session';

/**
 * One product's access profiles, read and written through that product's API
 * (`/api/profiles` for the ERP, `/api/fsm/profiles` for the FSM). The ERP's
 * and the FSM's screens are the same components; this is what differs. Like
 * `createRecordAccess`, not a `'use server'` module — each routine's own
 * `_actions` file wraps what it returns in named Server Actions.
 */
export function createProfileAccess(product: Product, listPath: string) {
  const list = cache(async (query: ListQueryState): Promise<PaginatedResult<ProfileDto>> => {
    const { token } = await requireSession();
    return unwrap(await requestProfileList(token, query, product));
  });

  /** A 404 — unknown, another company's or another product's — is Next's not-found page. */
  const get = cache(async (id: number): Promise<ProfileDto> => {
    const { token } = await requireSession();
    const result = await requestProfile(token, id, product);

    if (!result.success) {
      if (result.status === 404) {
        notFound();
      }

      throw new ApiError(result.error, result.status);
    }

    return result.data;
  });

  const permissions = cache(async (): Promise<PermissionDto[]> => {
    const { token } = await requireSession();
    return unwrap(await requestPermissionList(token, product));
  });

  async function save(
    values: ProfileWriteInput,
    id?: number,
  ): Promise<ActionResult & { id?: string }> {
    const { token } = await requireSession();
    const parsed = profileWriteSchema.safeParse(values);

    if (!parsed.success) {
      return { success: false, message: parsed.error.issues[0]?.message ?? 'Invalid data' };
    }

    const result =
      id === undefined
        ? await requestProfileCreate(token, parsed.data, product)
        : await requestProfileUpdate(token, id, parsed.data, product);

    if (!result.success) {
      // Only a repeated name belongs to the Name field: a 409 can also be the last-manager guard.
      return {
        success: false,
        message: result.error,
        ...(result.status === 409 && result.error === 'A profile with this name already exists'
          ? { field: 'name' }
          : {}),
      };
    }

    revalidatePath(listPath, 'layout');

    return { success: true, id: String(result.data.id) };
  }

  async function deleteMany(ids: number[]): Promise<ActionResult> {
    const { token } = await requireSession();

    for (const id of ids) {
      const result = await requestProfileDelete(token, id, product);

      if (!result.success) {
        revalidatePath(listPath, 'layout');
        return { success: false, message: result.error };
      }
    }

    revalidatePath(listPath, 'layout');

    return {
      success: true,
      message: ids.length === 1 ? 'Profile deleted' : `${ids.length} profiles deleted`,
    };
  }

  async function duplicate(id: number): Promise<ActionResult & { id?: number }> {
    const { token } = await requireSession();
    const result = await requestProfileDuplicate(token, id, product);

    if (!result.success) {
      return { success: false, message: result.error };
    }

    revalidatePath(listPath, 'layout');

    return { success: true, id: result.data.id };
  }

  return { list, get, permissions, save, deleteMany, duplicate };
}
