import { z } from 'zod';
import { isValidEmail } from './email.js';
import { maxLengthMessage } from './messages.js';

/**
 * The people to talk to at a customer or supplier — "João, maintenance
 * manager" — beyond the record's own main email and phone. One of them may be
 * the primary contact. For the FSM, who to call before a visit.
 */
const text = (max: number) => z.string().trim().max(max, maxLengthMessage(max));

export const contactWriteSchema = z
  .object({
    id: z.string().optional(),
    name: z.string().trim().min(1, 'Contact name is required').max(120, maxLengthMessage(120)),
    role: text(80),
    email: text(160),
    phone: text(20),
    mobile: text(20),
    isPrimary: z.boolean(),
    notes: text(500),
  })
  .superRefine((data, ctx) => {
    if (data.email !== '' && !isValidEmail(data.email)) {
      ctx.addIssue({ code: 'custom', message: 'Invalid email', path: ['email'] });
    }
  });

export type ContactWriteInput = z.infer<typeof contactWriteSchema>;
export type ContactFormValues = z.input<typeof contactWriteSchema>;

export interface ContactDto {
  id: string;
  name: string;
  role: string | null;
  email: string | null;
  phone: string | null;
  mobile: string | null;
  isPrimary: boolean;
  notes: string | null;
}

export function emptyContactFormValues(isPrimary = false): ContactFormValues {
  return { name: '', role: '', email: '', phone: '', mobile: '', isPrimary, notes: '' };
}

export function contactToFormValues(contact: ContactDto): ContactFormValues {
  return {
    id: contact.id,
    name: contact.name,
    role: contact.role ?? '',
    email: contact.email ?? '',
    phone: contact.phone ?? '',
    mobile: contact.mobile ?? '',
    isPrimary: contact.isPrimary,
    notes: contact.notes ?? '',
  };
}
