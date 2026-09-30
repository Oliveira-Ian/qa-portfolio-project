import { metrics } from '@opentelemetry/api';

const meter = metrics.getMeter('oliveira-api');

const personChanges = meter.createCounter('person.changes', {
  description: 'Person records created, updated or deleted',
  unit: '{person}',
});

/**
 * Counts records, not requests: a bulk delete of ten adds ten. The only label
 * is the operation — never the person's id or any of their data.
 */
export function recordPersonChange(operation: 'create' | 'update' | 'delete', count = 1): void {
  personChanges.add(count, { operation });
}
