'use client';

import { ShieldCheck, User } from 'lucide-react';
import type { CompanyMemberDto, MembershipRole, MembershipStatus } from '@oliveira/schemas';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge, StatusBadge } from '@/components/ui/badge';
import { useT } from '@/lib/i18n/provider';
import { cn } from '@/lib/utils';

/** The first letter of the name, as the avatar shows it. */
export function initialOf(name: string): string {
  return name.trim().charAt(0).toUpperCase() || '?';
}

interface MemberIdentityProps {
  member: Pick<CompanyMemberDto, 'name' | 'email'>;
  size?: 'default' | 'lg';
  className?: string;
}

/** Avatar, name and (mono) email — how a member reads in every list and in the drawer header. */
export function MemberIdentity({ member, size = 'default', className }: MemberIdentityProps) {
  return (
    <span className={cn('flex min-w-0 items-center gap-3', className)}>
      <Avatar
        size={size === 'lg' ? 'lg' : 'default'}
        className={size === 'lg' ? 'size-11' : 'size-9'}
      >
        <AvatarFallback>{initialOf(member.name)}</AvatarFallback>
      </Avatar>
      <span className="min-w-0">
        <span className="block truncate text-sm font-medium text-foreground">{member.name}</span>
        <span className="olv-data block truncate text-text-3">{member.email}</span>
      </span>
    </span>
  );
}

/** Admin (navy tint, shield) or Member (neutral, person): a category, so a tag, never a state. */
export function RoleTag({ role, className }: { role: MembershipRole; className?: string }) {
  const t = useT();

  return role === 'ADMIN' ? (
    <Badge variant="admin" className={className}>
      <ShieldCheck aria-hidden="true" />
      {t('company.members.role.admin')}
    </Badge>
  ) : (
    <Badge variant="default" className={className}>
      <User aria-hidden="true" />
      {t('company.members.role.member')}
    </Badge>
  );
}

/** Active or Inactive — the membership's own state. */
export function MembershipStatusBadge({
  status,
  className,
}: {
  status: MembershipStatus;
  className?: string;
}) {
  const t = useT();

  return (
    <StatusBadge tone={status === 'ACTIVE' ? 'success' : 'neutral'} className={className}>
      {t(status === 'ACTIVE' ? 'company.members.status.active' : 'company.members.status.inactive')}
    </StatusBadge>
  );
}
