export const SORT_KEYS = [
  'name_asc',
  'scopus_h_desc',
  'wos_h_desc',
  'pubs_desc',
  'citations_desc',
  'recent',
] as const;

export type SortKey = (typeof SORT_KEYS)[number];

export const DEFAULT_SORT: SortKey = 'name_asc';

export interface DirectoryFilters {
  search: string | null;
  college: string | null;
  department: string | null;
  workplaceType: string | null;
  academicTitle: string | null;
  sort: SortKey;
}

export interface DirectoryCursor {
  v: string;
  id: string;
}

export interface DirectoryRow {
  id: string;
  username: string;
  full_name_en: string;
  full_name_ar: string;
  profile_image: string | null;
  college_id: string | null;
  department_id: string | null;
  academic_title_id: string | null;
  workplace_type_id: string | null;
  scopus_h_index: number | null;
  scopus_publications_count: number | null;
  wos_h_index: number | null;
  wos_publications_count: number | null;
}

export interface DirectoryPage {
  data: DirectoryRow[];
  next_cursor: DirectoryCursor | null;
  page_size: number;
  sort: string;
}

export interface BilingualLookup {
  id: string;
  name_en: string;
  name_ar: string;
}

export interface DepartmentLookup extends BilingualLookup {
  college_id: string;
}

export interface DirectoryLookups {
  workplaceTypes: BilingualLookup[];
  colleges: BilingualLookup[];
  departments: DepartmentLookup[];
  academicTitles: BilingualLookup[];
}
