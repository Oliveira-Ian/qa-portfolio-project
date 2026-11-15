import 'server-only';

import { cache } from 'react';
import { revalidatePath } from 'next/cache';
import { notFound } from 'next/navigation';
import type { PaginatedResult } from '@oliveira/schemas';
import type { ZodType } from 'zod';
import type { ActionResult } from '@/lib/actions';
import { unwrap } from '@/lib/api/client';
import type { RecordApi } from '@/lib/api/fsm';
import type { ListQueryState } from '@/lib/list-query';
import { requireSession } from '@/lib/session';

/**
 * The reads and writes of one Oliveira FSM record, for its routine's
 * `_data-access` and `_actions` — the same for every record but for the API
 * client, the list's path and how form values become the request body. Like
 * `createGridPreferenceAccess`, this is not a `'use server'` module: a
 * routine's own `_actions/*.ts` (which carries the directive) wraps what it
 * returns in its own named Server Action.
 */
export function createRecordAccess<TDto, TWrite, TValues = TWrite>(options: {
  api: RecordApi<TDto, TWrite>;
  listPath: string;
  /** Validates the form values on the server, as the API will. */
  schema: ZodType<TValues>;
  toPayload?: (values: TValues) => TWrite;
}) {
  const { api, listPath, schema } = options;
  const toPayload = options.toPayload ?? ((values: TValues) => values as unknown as TWrite);

  const list = cache(
    async (
      query: ListQueryState,
      extra?: Record<string, string>,
    ): Promise<PaginatedResult<TDto>> => {
      const { token } = await requireSession();
      return unwrap(await api.list(token, query, extra));
    },
  );

  /** One record. A 404 — unknown, or another company's — is Next's not-found page. */
  const get = cache(async (id: string): Promise<TDto> => {
    const { token } = await requireSession();
    const result = await api.get(token, id);

    if (!result.success && result.status === 404) {
      notFound();
    }

    return unwrap(result);
  });

  async function save(values: TValues, id?: string): Promise<ActionResult & { id?: string }> {
    const { token } = await requireSession();
    const parsed = schema.safeParse(values);

    if (!parsed.success) {
      return { success: false, message: parsed.error.issues[0]?.message ?? 'Invalid data' };
    }

    const payload = toPayload(parsed.data);
    const result = id ? await api.update(token, id, payload) : await api.create(token, payload);

    if (!result.success) {
      return { success: false, message: result.error };
    }

    revalidatePath(listPath, 'layout');

    const savedId = (result.data as { id?: string }).id ?? id;

    return savedId ? { success: true, id: savedId } : { success: true };
  }

  async function deleteMany(ids: string[]): Promise<ActionResult> {
    const { token } = await requireSession();
    const result = await api.deleteMany(token, ids);

    if (!result.success) {
      return { success: false, message: result.error };
    }

    revalidatePath(listPath, 'layout');

    return { success: true, message: result.data.message };
  }

  return { list, get, save, deleteMany };
}
