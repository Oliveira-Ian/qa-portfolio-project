'use client';

import { AlertTriangle, Info } from 'lucide-react';
import { toast } from 'sonner';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { LoadingState } from '@/components/ui/loading-state';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { ComponentDemo, StyleguideSection } from './section-shell';

const BADGE_VARIANTS = ['default', 'secondary', 'outline', 'destructive', 'ghost'] as const;

export function FeedbackStatusSection() {
  return (
    <StyleguideSection id="feedback-status" title="Feedback & status">
      <ComponentDemo id="feedback-status-alert" title="Alert">
        <div className="flex flex-col gap-4">
          <Alert>
            <Info aria-hidden="true" />
            <AlertTitle>No sign-in access yet</AlertTitle>
            <AlertDescription>Set an email and a password to create one.</AlertDescription>
          </Alert>
          <Alert variant="destructive">
            <AlertTriangle aria-hidden="true" />
            <AlertTitle>This person has an access account</AlertTitle>
            <AlertDescription>Remove the account first, or inactivate instead.</AlertDescription>
          </Alert>
        </div>
      </ComponentDemo>

      <ComponentDemo
        id="feedback-status-alert-dialog"
        title="Alert dialog"
        description="Blocks until answered — for a destructive, irreversible action."
      >
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive">Delete person</Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete this person?</AlertDialogTitle>
              <AlertDialogDescription>
                The record and everything on it are removed for good. There is no undo.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction>Delete</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </ComponentDemo>

      <ComponentDemo id="feedback-status-badge" title="Badge">
        <div className="flex flex-wrap gap-2">
          {BADGE_VARIANTS.map((variant) => (
            <Badge key={variant} variant={variant}>
              {variant}
            </Badge>
          ))}
        </div>
      </ComponentDemo>

      <ComponentDemo id="feedback-status-progress" title="Progress">
        <div className="flex max-w-md flex-col gap-4">
          <Progress value={35} />
          <Progress value={75} />
        </div>
      </ComponentDemo>

      <ComponentDemo id="feedback-status-skeleton" title="Skeleton">
        <div className="flex max-w-md flex-col gap-2">
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
        </div>
      </ComponentDemo>

      <ComponentDemo id="feedback-status-empty-state" title="Empty state">
        <EmptyState
          title="The registry is empty"
          description="Add the first person to get started."
          action={<Button size="sm">Add person</Button>}
        />
      </ComponentDemo>

      <ComponentDemo id="feedback-status-loading-state" title="Loading state">
        <LoadingState rows={3} columns={3} />
      </ComponentDemo>

      <ComponentDemo id="feedback-status-toast" title="Toast">
        <div className="flex flex-wrap gap-3">
          <Button variant="outline" onClick={() => toast.success('Person saved')}>
            Success
          </Button>
          <Button variant="outline" onClick={() => toast.error('Please fix the errors above')}>
            Error
          </Button>
          <Button variant="outline" onClick={() => toast.warning('Not implemented')}>
            Warning
          </Button>
          <Button variant="outline" onClick={() => toast.info('5 columns hidden')}>
            Info
          </Button>
        </div>
      </ComponentDemo>
    </StyleguideSection>
  );
}
