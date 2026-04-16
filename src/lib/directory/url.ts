import {
  DEFAULT_SORT,
  SORT_KEYS,
  type DirectoryCursor,
  type DirectoryFilters,
  type SortKey,
} from './types';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function pickUuid(value: string | string[] | undefined): string | null {
  const v = Array.isArray(value) ? value[0] : value;
  return v && UUID_RE.test(v) ? v : null;
}

function pickString(value: string | string[] | undefined): string | null {
  const v = Array.isArray(value) ? value[0] : value;
  const trimmed = (v ?? '').trim();
  return trimmed.length > 0 ? trimmed : null;
}

function pickSort(value: string | string[] | undefined): SortKey {
  const v = Array.isArray(value) ? value[0] : value;
  return (SORT_KEYS as readonly string[]).includes(v ?? '') ? (v as SortKey) : DEFAULT_SORT;
}

export function parseFilters(
  searchParams: Record<string, string | string[] | undefined>,
): DirectoryFilters {
  return {
    search: pickString(searchParams.search),
    college: pickUuid(searchParams.college),
    department: pickUuid(searchParams.department),
    workplaceType: pickUuid(searchParams.workplace_type),
    academicTitle: pickUuid(searchParams.academic_title),
    sort: pickSort(searchParams.sort),
  };
}

export function encodeCursor(cursor: DirectoryCursor): string {
  return Buffer.from(JSON.stringify(cursor), 'utf8').toString('base64url');
}

export function decodeCursor(encoded: string | string[] | undefined): DirectoryCursor | null {
  const v = Array.isArray(encoded) ? encoded[0] : encoded;
  if (!v) return null;
  try {
    const json = Buffer.from(v, 'base64url').toString('utf8');
    const parsed = JSON.parse(json) as Partial<DirectoryCursor>;
    if (typeof parsed.v === 'string' && typeof parsed.id === 'string') {
      return { v: parsed.v, id: parsed.id };
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Build a query string for client-side router.replace from a filters object.
 * Removes empty values; resets cursor when called.
 */
export function buildSearchString(
  filters: Partial<DirectoryFilters & { cursor: string | null }>,
): string {
  const params = new URLSearchParams();
  if (filters.search) params.set('search', filters.search);
  if (filters.college) params.set('college', filters.college);
  if (filters.department) params.set('department', filters.department);
  if (filters.workplaceType) params.set('workplace_type', filters.workplaceType);
  if (filters.academicTitle) params.set('academic_title', filters.academicTitle);
  if (filters.sort && filters.sort !== DEFAULT_SORT) params.set('sort', filters.sort);
  if (filters.cursor) params.set('cursor', filters.cursor);
  const s = params.toString();
  return s ? `?${s}` : '';
}
