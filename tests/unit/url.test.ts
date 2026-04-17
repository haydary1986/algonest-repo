import { describe, it, expect } from 'vitest';
import { parseFilters, encodeCursor, decodeCursor } from '@/lib/directory/url';

describe('parseFilters', () => {
  it('extracts search from searchParams', () => {
    const f = parseFilters({ search: 'ahmad' });
    expect(f.search).toBe('ahmad');
    expect(f.sort).toBe('name_asc');
  });

  it('rejects invalid UUID for college', () => {
    const f = parseFilters({ college: 'not-a-uuid' });
    expect(f.college).toBeNull();
  });

  it('accepts valid UUID', () => {
    const uuid = '550e8400-e29b-41d4-a716-446655440000';
    const f = parseFilters({ college: uuid });
    expect(f.college).toBe(uuid);
  });
});

describe('cursor encoding', () => {
  it('round-trips a cursor', () => {
    const cursor = { v: 'ahmad', id: '550e8400-e29b-41d4-a716-446655440000' };
    const encoded = encodeCursor(cursor);
    const decoded = decodeCursor(encoded);
    expect(decoded).toEqual(cursor);
  });

  it('returns null for invalid input', () => {
    expect(decodeCursor(undefined)).toBeNull();
    expect(decodeCursor('not-base64!!!')).toBeNull();
  });
});
