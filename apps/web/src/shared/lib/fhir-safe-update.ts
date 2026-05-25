'use client';

/**
 * safeUpdateResource — Optimistic concurrency wrapper for FHIR updates.
 *
 * Pattern:
 *   1. Read the latest version of the resource (this captures meta.versionId).
 *   2. Apply the caller's updater function to produce the new state.
 *   3. Call medplum.updateResource — because meta.versionId is set, the Medplum
 *      SDK sends `If-Match: W/"<versionId>"`. The FHIR server rejects with 409
 *      if another user already saved a newer version.
 *   4. On 409 / 412, re-read the fresh resource and retry the update once.
 *   5. If the second attempt also fails, rethrow so the caller can show a message.
 *
 * Usage:
 *   const enc = await safeUpdateResource(medplum, 'Encounter', id, (cur) => ({
 *     status: 'finished',
 *     period: { ...cur.period, end: new Date().toISOString() },
 *   }));
 */

import type { MedplumClient } from '@medplum/core';
import type { Resource } from '@medplum/fhirtypes';

type ResourceType = string;

export class FhirConflictError extends Error {
  constructor(public readonly resourceType: string, public readonly id: string) {
    super(
      `Conflict: ${resourceType}/${id} was modified by another user. Please refresh and try again.`,
    );
    this.name = 'FhirConflictError';
  }
}

function isConflict(err: unknown): boolean {
  if (!err || typeof err !== 'object') return false;
  const e = err as Record<string, unknown>;
  const status = (e['status'] ?? (e['response'] as any)?.status) as number | undefined;
  return status === 409 || status === 412;
}

export async function safeUpdateResource<T extends Resource>(
  medplum: MedplumClient,
  resourceType: ResourceType,
  id: string,
  updater: (current: T) => Partial<T>,
): Promise<T> {
  // Read current version — preserves meta.versionId for If-Match
  const current = (await medplum.readResource(resourceType as any, id)) as T;
  const updated = { ...current, ...updater(current) } as T;

  try {
    return (await medplum.updateResource(updated)) as T;
  } catch (err) {
    if (!isConflict(err)) throw err;

    // Retry once with a freshly-read copy
    const fresh = (await medplum.readResource(resourceType as any, id)) as T;
    const retried = { ...fresh, ...updater(fresh) } as T;

    try {
      return (await medplum.updateResource(retried)) as T;
    } catch (retryErr) {
      if (isConflict(retryErr)) throw new FhirConflictError(resourceType, id);
      throw retryErr;
    }
  }
}
