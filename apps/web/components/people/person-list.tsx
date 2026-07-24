'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
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
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { personsApi, type ApiResponse, type Person } from '@/lib/api';

export function PersonList() {
  const router = useRouter();
  const [persons, setPersons] = useState<Person[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  async function loadPersons() {
    setLoading(true);
    try {
      const response = await personsApi.list();
      const result = (await response.json()) as ApiResponse<Person[]>;

      if (result.success && result.data) {
        setPersons(result.data);
      } else {
        toast.error('Failed to load persons');
      }
    } catch (error) {
      toast.error('Failed to load persons');
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadPersons();
  }, []);

  function toggleSelection(id: string) {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.clear();
        next.add(id);
      }
      return next;
    });
  }

  function toggleSelectAll(checked: boolean) {
    setSelectedIds(checked ? new Set(persons.map((person) => person.id)) : new Set());
  }

  function viewPerson(id: string) {
    router.push(`/people/${id}`);
  }

  function editSelected() {
    if (selectedIds.size === 1) {
      router.push(`/people/${Array.from(selectedIds)[0]}/edit`);
    }
  }

  async function handleDelete() {
    if (selectedIds.size !== 1) return;
    const id = Array.from(selectedIds)[0]!;

    try {
      const response = await personsApi.remove(id);
      const result = (await response.json()) as ApiResponse<{ message: string }>;

      if (result.success) {
        toast.success('Person deleted');
        setSelectedIds(new Set());
        loadPersons();
      } else {
        toast.error(result.error || 'Failed to delete');
      }
    } catch (error) {
      toast.error('Failed to delete');
      console.error(error);
    }
  }

  const hasSingleSelection = selectedIds.size === 1;
  const allSelected = persons.length > 0 && selectedIds.size === persons.length;

  return (
    <Card
      className="gap-0 rounded-lg p-[var(--spacing-xl)] shadow-card"
      data-testid="person-list-container"
    >
      <div className="mb-[var(--spacing-lg)] flex items-center justify-between gap-[var(--spacing-md)]">
        <h1 className="text-2xl font-semibold text-foreground" data-testid="person-list-title">
          People
        </h1>
        <div className="flex items-center gap-2">
          <Button
            asChild
            className="rounded-md bg-primary text-primary-foreground hover:bg-primary-hover"
            data-testid="person-button-add"
          >
            <Link href="/people/new">Add</Link>
          </Button>
          <Button
            className="rounded-md bg-toast-warning text-white hover:opacity-90"
            data-testid="person-button-edit"
            disabled={!hasSingleSelection}
            onClick={editSelected}
          >
            Edit
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                className="rounded-md bg-destructive text-white hover:opacity-90"
                data-testid="person-button-delete"
                disabled={!hasSingleSelection}
              >
                Delete
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you sure you want to delete this person?</AlertDialogTitle>
                <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      <div className="overflow-x-auto" data-testid="person-list-table-container">
        <Table data-testid="person-list-table">
          <TableHeader>
            <TableRow>
              <TableHead className="w-10">
                <Checkbox
                  aria-label="Select all"
                  data-testid="person-checkbox-select-all"
                  checked={allSelected}
                  onCheckedChange={(checked) => toggleSelectAll(checked === true)}
                />
              </TableHead>
              <TableHead>Code</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Document</TableHead>
              <TableHead>Active</TableHead>
              <TableHead>Created At</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody data-testid="person-list-tbody">
            {loading &&
              Array.from({ length: 3 }).map((_, index) => (
                <TableRow key={index}>
                  {Array.from({ length: 7 }).map((__, cellIndex) => (
                    <TableCell key={cellIndex}>
                      <Skeleton className="h-4 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            {!loading && persons.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="py-8 text-center text-muted-foreground">
                  No people found.
                </TableCell>
              </TableRow>
            )}
            {!loading &&
              persons.map((person) => (
                <TableRow
                  key={person.id}
                  data-state={selectedIds.has(person.id) ? 'selected' : undefined}
                  onDoubleClick={() => viewPerson(person.id)}
                >
                  <TableCell>
                    <Checkbox
                      aria-label={`Select ${person.name}`}
                      checked={selectedIds.has(person.id)}
                      onCheckedChange={() => toggleSelection(person.id)}
                    />
                  </TableCell>
                  <TableCell>{person.id.substring(0, 8)}...</TableCell>
                  <TableCell>{person.name}</TableCell>
                  <TableCell>{person.type}</TableCell>
                  <TableCell>{person.document}</TableCell>
                  <TableCell>
                    {person.active ? (
                      <span className="inline-flex items-center rounded-sm bg-toast-success/10 px-2 py-0.5 text-xs font-medium text-toast-success">
                        Yes
                      </span>
                    ) : (
                      <span className="inline-flex items-center rounded-sm bg-text-muted/10 px-2 py-0.5 text-xs font-medium text-text-muted">
                        No
                      </span>
                    )}
                  </TableCell>
                  <TableCell>{new Date(person.createdAt).toLocaleDateString()}</TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </div>

      <div
        className="mt-[var(--spacing-xl)] flex items-center justify-center gap-2"
        data-testid="person-list-pagination"
      >
        <Button variant="outline" size="sm" disabled data-testid="person-pagination-prev">
          &lt; Prev
        </Button>
        <span className="text-sm text-muted-foreground" data-testid="person-pagination-info">
          Page 1 of 1
        </span>
        <Button variant="outline" size="sm" disabled data-testid="person-pagination-next">
          Next &gt;
        </Button>
      </div>
    </Card>
  );
}
