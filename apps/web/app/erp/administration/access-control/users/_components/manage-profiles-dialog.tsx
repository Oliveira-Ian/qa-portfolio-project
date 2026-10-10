'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import type { AccountDto, ProfileDto } from '@oliveira/schemas';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { translateApiMessage } from '@/lib/i18n/api-messages';
import { useT } from '@/lib/i18n/provider';
import { linkProfileAction, unlinkProfileAction } from '../_actions/link-profile';

interface ManageProfilesDialogProps {
  account: AccountDto;
  profiles: ProfileDto[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Checkboxes update optimistically the instant they're clicked — waiting for
 * `revalidatePath` to round-trip back down as new props would mean every
 * click feels laggy. The list behind the dialog only needs to catch up once,
 * on close, which is why the refresh happens there instead of per-toggle.
 *
 * The caller only ever mounts this with a given `account` while `open` is
 * true and unmounts it on close (see `AccountList`), so a fresh instance —
 * and fresh `linkedIds` — is exactly what happens each time it reopens;
 * there's no later prop change to sync against.
 */
export function ManageProfilesDialog({
  account,
  profiles,
  open,
  onOpenChange,
}: ManageProfilesDialogProps) {
  const t = useT();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [linkedIds, setLinkedIds] = useState(
    () => new Set(account.profiles.map((profile) => profile.id)),
  );

  function toggle(profileId: number, linked: boolean) {
    setLinkedIds((current) => {
      const next = new Set(current);
      if (linked) {
        next.delete(profileId);
      } else {
        next.add(profileId);
      }
      return next;
    });

    startTransition(async () => {
      const result = linked
        ? await unlinkProfileAction(account.id, profileId)
        : await linkProfileAction(account.id, profileId);

      if (!result.success) {
        toast.error(
          result.message ? translateApiMessage(result.message, t) : t('erp.users.linkFailed'),
        );
        setLinkedIds((current) => {
          const reverted = new Set(current);
          if (linked) {
            reverted.add(profileId);
          } else {
            reverted.delete(profileId);
          }
          return reverted;
        });
      }
    });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) {
          router.refresh();
        }
        onOpenChange(next);
      }}
    >
      <DialogContent data-testid="account-profiles-dialog">
        <DialogHeader>
          <DialogTitle className="text-lg leading-6">
            {t('erp.users.dialog.title', { name: account.personName })}
          </DialogTitle>
          <DialogDescription>{t('erp.users.dialog.description')}</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-1">
          {profiles.map((profile) => {
            const linked = linkedIds.has(profile.id);

            return (
              <label
                key={profile.id}
                data-testid="account-profiles-row"
                className="flex cursor-pointer items-center gap-2.5 rounded-md px-2 py-2 text-sm text-foreground hover:bg-surface-hover"
              >
                <Checkbox
                  checked={linked}
                  disabled={isPending}
                  data-testid="account-profiles-checkbox"
                  onCheckedChange={() => toggle(profile.id, linked)}
                />
                <span className="flex-1">{profile.name}</span>
                {profile.isDefault ? (
                  <span className="olv-overline text-text-3">{t('erp.users.dialog.default')}</span>
                ) : null}
              </label>
            );
          })}
        </div>

        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">{t('erp.users.dialog.close')}</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
